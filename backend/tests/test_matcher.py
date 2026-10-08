"""
Unit and Integration Tests for AI Matcher and Decision Flow.
"""
import pytest
from backend.app.services.matcher import SemanticMatcher
from backend.app.services.audit import AuditService

def test_audit_sha256_hash_deterministic():
    text = "Cisco AnyConnect Corporate VPN Tunnel Drop"
    h1 = AuditService.compute_sha256(text)
    h2 = AuditService.compute_sha256(text)
    assert h1 == h2
    assert len(h1) == 64

def test_pii_masking():
    raw = "User John Doe with email john.doe@bnpparibas.com opened ticket for card 4532-1234-5678-9012."
    masked = AuditService.mask_pii(raw)
    assert "john.doe@" not in masked
    assert "4532-1234-5678-9012" not in masked
    assert "****-****-****-9012" in masked

def test_semantic_matcher_exact_match():
    matcher = SemanticMatcher()
    articles = [
        {
            "id": "KB-1",
            "title": "PostgreSQL Database Connection Pool Exhaustion",
            "tags": ["postgres", "database", "connection-pool", "deadlock"],
            "body_text": "High connection pool saturation causing FATAL max connection errors in banking ledger cluster."
        },
        {
            "id": "KB-2",
            "title": "Cisco AnyConnect VPN Drop",
            "tags": ["vpn", "cisco", "network"],
            "body_text": "Remote employee loses connection to Paris office."
        }
    ]

    ticket = "PostgreSQL Database Connection Pool Exhaustion and Deadlock in banking ledger cluster"
    best_art, confidence, raw_cosine, highlights = matcher.compute_similarity(ticket, articles)

    assert best_art is not None
    assert best_art["id"] == "KB-1"
    assert confidence >= 95.0
    assert len(highlights) > 0

def test_sentence_highlight_extraction():
    matcher = SemanticMatcher()
    article_body = "First introductory overview sentence for service architecture. Second sentence details specific diagnostic procedures and error codes. Third sentence explains how to restart the daemon gracefully. Fourth sentence describes auditing."
    highlights = matcher.extract_highlight_sentences("diagnostic procedures and error codes", article_body)
    
    assert len(highlights) > 0
    assert "diagnostic procedures" in highlights[0]["sentence"]
