"""
Knowledge Base Management, Versioning & Ingestion Endpoints.
Supports:
- Article CRUD with automatic version archiving (ArticleVersion)
- Version history inspection and 1-click rollback
- Automated folder-based Markdown/Text KB ingestion (Spec Task VII.2)
- Matcher sandbox test endpoint
"""
import uuid
import os
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Article, ArticleTag, ArticleVersion, Department, ExclusionList
from backend.app.schemas import (
    ArticleCreate, ArticleUpdate, ArticleResponse, ArticleVersionResponse,
    DepartmentResponse, DepartmentCreate
)
from backend.app.services.matcher import matcher

router = APIRouter(prefix="/articles", tags=["Knowledge Base"])


def format_article(a: Article, db: Session) -> dict:
    excluded = db.query(ExclusionList).filter(ExclusionList.article_id == a.id).first() is not None
    dept_name = a.department.name if a.department else a.department_id
    return {
        "id": a.id,
        "department_id": a.department_id,
        "department_name": dept_name,
        "title": a.title,
        "body_text": a.body_text,
        "version": a.version,
        "script_path": a.script_path,
        "category": a.category,
        "created_at": a.created_at,
        "updated_at": a.updated_at,
        "tags": [t.tag for t in a.tags],
        "is_excluded": excluded
    }


@router.get("/departments", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    """Lists all active business domains with ticket and article counts."""
    depts = db.query(Department).all()
    results = []
    for d in depts:
        results.append({
            "id": d.id,
            "name": d.name,
            "description": d.description,
            "created_at": d.created_at,
            "article_count": len(d.articles),
            "ticket_count": len(d.tickets)
        })
    return results


@router.post("/departments", response_model=DepartmentResponse)
def create_department(dept_in: DepartmentCreate, db: Session = Depends(get_db)):
    """Create new business domain category."""
    existing = db.query(Department).filter(Department.id == dept_in.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department already exists")
    dept = Department(
        id=dept_in.id,
        name=dept_in.name,
        description=dept_in.description
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return {
        "id": dept.id, "name": dept.name, "description": dept.description,
        "created_at": dept.created_at, "article_count": 0, "ticket_count": 0
    }


@router.get("", response_model=List[ArticleResponse])
def list_articles(
    department_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Browse and filter knowledge base articles."""
    query = db.query(Article)
    if department_id:
        query = query.filter(Article.department_id == department_id)
    if category:
        query = query.filter(Article.category == category)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (Article.title.ilike(pattern)) |
            (Article.body_text.ilike(pattern))
        )
    articles = query.order_by(Article.title.asc()).all()
    return [format_article(a, db) for a in articles]


@router.get("/{article_id}", response_model=ArticleResponse)
def get_article(article_id: str, db: Session = Depends(get_db)):
    """Get single article by ID."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return format_article(article, db)


@router.post("", response_model=ArticleResponse)
def create_article(article_in: ArticleCreate, db: Session = Depends(get_db)):
    """Create new article and archive version 1."""
    art_id = f"KB-{uuid.uuid4().hex[:8].upper()}"
    article = Article(
        id=art_id,
        department_id=article_in.department_id,
        title=article_in.title,
        body_text=article_in.body_text,
        category=article_in.category or "General",
        script_path=article_in.script_path,
        version=1
    )
    db.add(article)
    db.flush()

    # Add tags
    for tag_str in (article_in.tags or []):
        db.add(ArticleTag(article_id=article.id, tag=tag_str.strip()))

    # Archive initial version
    version_rec = ArticleVersion(
        article_id=article.id,
        version_num=1,
        title=article.title,
        body_text=article.body_text,
        script_path=article.script_path,
        changed_by="analyst@bnpparibas.com",
        change_summary="Initial publication"
    )
    db.add(version_rec)
    db.commit()
    db.refresh(article)
    return format_article(article, db)


@router.put("/{article_id}", response_model=ArticleResponse)
def update_article(article_id: str, update_in: ArticleUpdate, db: Session = Depends(get_db)):
    """Update article and automatically record version history."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    if update_in.title is not None:
        article.title = update_in.title
    if update_in.body_text is not None:
        article.body_text = update_in.body_text
    if update_in.category is not None:
        article.category = update_in.category
    if update_in.script_path is not None:
        article.script_path = update_in.script_path

    article.version += 1
    article.updated_at = datetime.utcnow()

    # Update tags if provided
    if update_in.tags is not None:
        db.query(ArticleTag).filter(ArticleTag.article_id == article.id).delete()
        for tag_str in update_in.tags:
            db.add(ArticleTag(article_id=article.id, tag=tag_str.strip()))

    # Add version snapshot
    version_rec = ArticleVersion(
        article_id=article.id,
        version_num=article.version,
        title=article.title,
        body_text=article.body_text,
        script_path=article.script_path,
        changed_by="analyst@bnpparibas.com",
        change_summary=update_in.change_summary or "Updated knowledge content"
    )
    db.add(version_rec)
    db.commit()
    db.refresh(article)
    return format_article(article, db)


@router.get("/{article_id}/versions", response_model=List[ArticleVersionResponse])
def get_article_versions(article_id: str, db: Session = Depends(get_db)):
    """Fetch complete revision history for an article (Spec VII.4)."""
    versions = db.query(ArticleVersion).filter(ArticleVersion.article_id == article_id).order_by(ArticleVersion.version_num.desc()).all()
    return versions


@router.post("/{article_id}/rollback/{version_num}", response_model=ArticleResponse)
def rollback_article_version(article_id: str, version_num: int, db: Session = Depends(get_db)):
    """Reverts article content to a historical snapshot (Spec VII.4)."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    target_ver = db.query(ArticleVersion).filter(
        ArticleVersion.article_id == article_id,
        ArticleVersion.version_num == version_num
    ).first()
    if not target_ver:
        raise HTTPException(status_code=404, detail="Target version not found")

    article.title = target_ver.title
    article.body_text = target_ver.body_text
    article.script_path = target_ver.script_path
    article.version += 1
    article.updated_at = datetime.utcnow()

    # Create new snapshot documenting rollback
    rollback_snapshot = ArticleVersion(
        article_id=article.id,
        version_num=article.version,
        title=article.title,
        body_text=article.body_text,
        script_path=article.script_path,
        changed_by="analyst@bnpparibas.com",
        change_summary=f"Rolled back to revision v{version_num}"
    )
    db.add(rollback_snapshot)
    db.commit()
    db.refresh(article)
    return format_article(article, db)


@router.post("/upload", response_model=ArticleResponse)
async def upload_dataset_document(
    file: UploadFile = File(...),
    department_id: str = Query("data-center"),
    category: str = Query("Imported Dataset"),
    db: Session = Depends(get_db)
):
    """
    Parses and ingests uploaded knowledge-base documents (Markdown, text, etc.)
    into the articles database catalog (Spec Task VII.2).
    """
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    title = file.filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()
    if lines and lines[0].startswith("#"):
        title = lines[0].lstrip("#").strip()

    art_id = f"KB-{uuid.uuid4().hex[:8].upper()}"
    article = Article(
        id=art_id,
        department_id=department_id,
        title=title,
        body_text=text if len(text) > 10 else f"# {title}\n\nAutomated ingestion of {file.filename}.",
        category=category,
        version=1
    )
    db.add(article)
    db.flush()
    db.add(ArticleTag(article_id=article.id, tag="uploaded-dataset"))
    db.add(ArticleTag(article_id=article.id, tag=department_id))

    v = ArticleVersion(
        article_id=article.id,
        version_num=1,
        title=article.title,
        body_text=article.body_text,
        changed_by="admin@bnpparibas.com",
        change_summary=f"Uploaded document {file.filename}"
    )
    db.add(v)
    db.commit()
    db.refresh(article)
    return format_article(article, db)
