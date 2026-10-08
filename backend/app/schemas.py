"""
Pydantic Schemas for Self-Healing Controller API.
Provides strong typing, validation, and JSON schemas for request/responses.
"""
from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

# User & Auth
class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    username: str
    full_name: str
    email: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Department
class DepartmentBase(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    model_config = ConfigDict(from_attributes=True)
    created_at: datetime
    article_count: Optional[int] = 0
    ticket_count: Optional[int] = 0


# Article
class ArticleTagSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    tag: str

class ArticleBase(BaseModel):
    department_id: str
    title: str
    body_text: str
    category: Optional[str] = "General"
    script_path: Optional[str] = None
    tags: Optional[List[str]] = []

class ArticleCreate(ArticleBase):
    pass

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    body_text: Optional[str] = None
    category: Optional[str] = None
    script_path: Optional[str] = None
    tags: Optional[List[str]] = None
    change_summary: Optional[str] = "Manual update"

class ArticleVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    version_num: int
    title: str
    body_text: str
    script_path: Optional[str] = None
    changed_by: str
    change_summary: Optional[str] = None
    created_at: datetime

class ArticleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    department_id: str
    department_name: Optional[str] = None
    title: str
    body_text: str
    version: int
    script_path: Optional[str] = None
    category: str
    created_at: datetime
    updated_at: datetime
    tags: List[str] = []
    is_excluded: Optional[bool] = False


# Ticket
class TicketCreate(BaseModel):
    department_id: str
    description: str
    requestor_id: Optional[str] = "EMP-1001"
    requestor_geography: Optional[str] = "Paris - HQ"
    priority: Optional[str] = "Medium"

class TicketMatchResult(BaseModel):
    matched_article_id: Optional[str] = None
    matched_article_title: Optional[str] = None
    matched_article_summary: Optional[str] = None
    match_score: float = 0.0 # 0-100
    confidence_band: str # 100%, 95-99%, 81-94%, <80%
    highlighted_sentences: List[Dict[str, Any]] = []
    clarification_questions: List[str] = []
    raw_cosine: float = 0.0

class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    department_id: str
    department_name: Optional[str] = None
    description: str
    status: str # NEW, MATCHED, OVERRIDDEN, SELF_HEALED, ESCALATED, RESOLVED
    created_at: datetime
    match_score: float
    matched_article_id: Optional[str] = None
    matched_article: Optional[ArticleResponse] = None
    requestor_id: str
    requestor_geography: str
    priority: str
    attachment_filename: Optional[str] = None
    attachment_hash: Optional[str] = None
    raw_sha256: str
    override_note: Optional[str] = None
    resolution_time_minutes: float = 0.0
    resolved_at: Optional[datetime] = None
    highlighted_sentences: Optional[List[Dict[str, Any]]] = []
    clarification_questions: Optional[List[str]] = []


# Actions
class OverrideTicketRequest(BaseModel):
    override_note: str = Field(..., min_length=3, description="Analyst explanation for 5% override")

class AskMoreAnswerRequest(BaseModel):
    answers: List[str]

class SelfHealExecutionResult(BaseModel):
    ticket_id: str
    article_id: str
    script_name: str
    is_whitelisted: bool
    status: str # SUCCESS, FAILED, EXCLUDED
    execution_time_seconds: float
    output_logs: str
    audit_hash: str


# Audit
class AuditEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    audit_id: int
    ticket_id: str
    user_id: str
    action: str
    timestamp: datetime
    ticket_hash: str
    details: Optional[Dict[str, Any]] = None


# Analytics
class ConfusionMatrixData(BaseModel):
    labels: List[str]
    matrix: List[List[int]]
    precision: float
    recall: float
    f1_score: float
    accuracy: float

class AnalyticsDashboardResponse(BaseModel):
    total_tickets: int
    self_healed_count: int
    overridden_count: int
    escalated_count: int
    new_active_count: int
    average_match_score: float
    average_resolution_time_self_heal_mins: float
    average_resolution_time_manual_mins: float
    total_cost_avoidance_eur: float
    saved_engineer_hours: float
    score_distribution: List[Dict[str, Any]]
    department_breakdown: List[Dict[str, Any]]
    geography_heatmap: List[Dict[str, Any]]
    confusion_matrix: ConfusionMatrixData
