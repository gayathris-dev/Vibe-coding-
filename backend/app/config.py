"""
Configuration module for Self-Healing Controller.
Supports environment-based configuration, secure defaults, and dynamic DB dialect detection.
"""
import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseModel):
    PROJECT_NAME: str = "Dynamic Resolver"
    PROJECT_VERSION: str = "2.4.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "bnp-paribas-self-healing-controller-super-secure-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # Database URL: uses PostgreSQL if configured, falls back to SQLite for local ease
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'selfhealing.db'}")
    
    # Whitelisted self-heal scripts directory
    SELFHEAL_SCRIPT_DIR: Path = Path(os.getenv("SELFHEAL_DIR", str(BASE_DIR / "scripts" / "selfheal")))
    
    # Non-hallucination hash salt
    HASH_SALT: str = os.getenv("HASH_SALT", "BNP_PROVENANCE_V2")
    
    # Data and uploads directory
    DATA_DIR: Path = BASE_DIR / "data"
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    REPORTS_DIR: Path = BASE_DIR / "reports"

settings = Settings()

# Ensure required directories exist
settings.SELFHEAL_SCRIPT_DIR.mkdir(parents=True, exist_ok=True)
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
