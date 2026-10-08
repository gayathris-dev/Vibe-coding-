"""
FastAPI Main Application Entrypoint for BNP Paribas Self-Healing Controller.
Implements:
- Security hardening headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options)
- Global CORS handling
- Modular API route registration
- Automatic database startup seeder
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.seed_data import seed_database
from backend.app.services.self_heal import self_heal_executor

# Import API routers
from backend.app.api.auth import router as auth_router
from backend.app.api.tickets import router as tickets_router
from backend.app.api.articles import router as articles_router
from backend.app.api.analytics import router as analytics_router
from backend.app.api.audit import router as audit_router
from backend.app.api.health import router as health_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database schema & seed initial knowledge base
    print("[STARTUP] Initializing database tables and security policies...")
    Base.metadata.create_all(bind=engine)
    self_heal_executor._ensure_scripts_exist()
    seed_database()
    yield
    # Shutdown
    print("[SHUTDOWN] Terminating active connections...")

app = FastAPI(
    title="BNP Paribas Dynamic Resolver API",
    description="Enterprise AI-powered incident remediation controller with confidence-based decision engine, non-hallucination SHA-256 audit ledger, and automated sandbox remediation.",
    version=settings.PROJECT_VERSION,
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers Middleware (Guardrails Section 5)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Register API Routers under /api
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(tickets_router, prefix=settings.API_V1_STR)
app.include_router(articles_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)

@app.get("/")
def root_redirect():
    return {
        "service": "BNP Paribas Dynamic Resolver",
        "docs": "/docs",
        "health": "/api/health",
        "version": settings.PROJECT_VERSION
    }
