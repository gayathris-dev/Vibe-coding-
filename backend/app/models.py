"""
SQLAlchemy ORM Models for Self-Healing Controller.
Implements the full database schema specified in the BNP Paribas specification.
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Text, DateTime, ForeignKey, Index, Boolean
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(64), primary_key=True, index=True) # e.g., 'retail-banking'
    name = Column(String(128), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    articles = relationship("Article", back_populates="department", cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="department")
    costing = relationship("CostingMetadata", back_populates="department", uselist=False)


class Article(Base):
    __tablename__ = "articles"

    id = Column(String(64), primary_key=True, default=generate_uuid, index=True)
    department_id = Column(String(64), ForeignKey("departments.id"), nullable=False, index=True)
    title = Column(String(256), nullable=False, index=True)
    body_text = Column(Text, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    script_path = Column(String(256), nullable=True) # e.g., /opt/selfheal/restart_gateway.py
    category = Column(String(64), default="General", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    department = relationship("Department", back_populates="articles")
    tags = relationship("ArticleTag", back_populates="article", cascade="all, delete-orphan")
    versions = relationship("ArticleVersion", back_populates="article", cascade="all, delete-orphan")
    embedding = relationship("ArticleEmbedding", back_populates="article", uselist=False, cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="matched_article")

    __table_args__ = (
        Index("ix_articles_dept_title", "department_id", "title"),
    )


class ArticleTag(Base):
    __tablename__ = "article_tags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(String(64), ForeignKey("articles.id"), nullable=False, index=True)
    tag = Column(String(64), nullable=False, index=True)

    article = relationship("Article", back_populates="tags")


class ArticleVersion(Base):
    __tablename__ = "article_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(String(64), ForeignKey("articles.id"), nullable=False, index=True)
    version_num = Column(Integer, nullable=False)
    title = Column(String(256), nullable=False)
    body_text = Column(Text, nullable=False)
    script_path = Column(String(256), nullable=True)
    changed_by = Column(String(64), default="system")
    change_summary = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    article = relationship("Article", back_populates="versions")


class ArticleEmbedding(Base):
    __tablename__ = "article_embeddings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(String(64), ForeignKey("articles.id"), unique=True, nullable=False, index=True)
    vector_json = Column(Text, nullable=False) # JSON encoded float list vector
    updated_at = Column(DateTime, default=datetime.utcnow)

    article = relationship("Article", back_populates="embedding")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String(64), primary_key=True, default=generate_uuid, index=True)
    department_id = Column(String(64), ForeignKey("departments.id"), nullable=False, index=True)
    description = Column(Text, nullable=False)
    status = Column(String(32), default="NEW", nullable=False, index=True) # NEW, MATCHED, OVERRIDDEN, SELF_HEALED, ESCALATED, RESOLVED
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    match_score = Column(Float, default=0.0, nullable=False, index=True) # 0 to 100
    matched_article_id = Column(String(64), ForeignKey("articles.id"), nullable=True, index=True)
    requestor_id = Column(String(64), default="EMP-1001", nullable=False)
    requestor_geography = Column(String(64), default="Paris - HQ", nullable=False)
    priority = Column(String(16), default="Medium", nullable=False)
    attachment_filename = Column(String(256), nullable=True)
    attachment_hash = Column(String(64), nullable=True)
    raw_sha256 = Column(String(64), nullable=False, index=True)
    override_note = Column(Text, nullable=True)
    resolution_time_minutes = Column(Float, default=0.0)
    resolved_at = Column(DateTime, nullable=True)

    department = relationship("Department", back_populates="tickets")
    matched_article = relationship("Article", back_populates="tickets")
    audit_events = relationship("TicketAudit", back_populates="ticket", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_tickets_dept_score", "department_id", "match_score"),
        Index("ix_tickets_status_created", "status", "created_at"),
    )


class TicketAudit(Base):
    __tablename__ = "ticket_audit"

    audit_id = Column(Integer, primary_key=True, autoincrement=True)
    ticket_id = Column(String(64), ForeignKey("tickets.id"), nullable=False, index=True)
    user_id = Column(String(64), nullable=False, index=True)
    action = Column(String(64), nullable=False, index=True) # CREATED, MATCHED, OVERRIDE_5%, SELF_HEAL_RUN, ESCALATED, ASK_MORE, RECHECKED
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    ticket_hash = Column(String(64), nullable=False)
    details_json = Column(Text, nullable=True)

    ticket = relationship("Ticket", back_populates="audit_events")


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    username = Column(String(64), unique=True, nullable=False, index=True)
    full_name = Column(String(128), nullable=False)
    email = Column(String(128), unique=True, nullable=False)
    role = Column(String(32), default="Analyst", nullable=False) # Admin, Analyst, Viewer
    hashed_password = Column(String(256), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class CostingMetadata(Base):
    __tablename__ = "costing_metadata"

    id = Column(Integer, primary_key=True, autoincrement=True)
    department_id = Column(String(64), ForeignKey("departments.id"), unique=True, nullable=False)
    hourly_support_cost = Column(Float, default=85.0, nullable=False) # in USD/EUR
    script_execution_cost = Column(Float, default=0.25, nullable=False)
    licensing_cost = Column(Float, default=1200.0, nullable=False)

    department = relationship("Department", back_populates="costing")


class ExclusionList(Base):
    __tablename__ = "exclusion_list"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(String(64), ForeignKey("articles.id"), unique=True, nullable=False)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
