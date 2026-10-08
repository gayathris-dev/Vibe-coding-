"""
FastAPI API integration test suite.
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import engine, Base
from backend.app.seed_data import seed_database
from backend.app.services.self_heal import self_heal_executor

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    self_heal_executor._ensure_scripts_exist()
    seed_database()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert "Self-Healing Controller" in data["service"]

def test_departments_list(client):
    response = client.get("/api/articles/departments")
    assert response.status_code == 200
    depts = response.json()
    assert len(depts) >= 6
    dept_ids = [d["id"] for d in depts]
    assert "retail-banking" in dept_ids
    assert "laptop-assets" in dept_ids

def test_ticket_lifecycle_and_decision_flow(client):
    # 1. Ingest ticket with exact title match -> high confidence
    payload = {
        "department_id": "laptop-assets",
        "description": "Cisco AnyConnect Corporate VPN Tunnel Drop and DNS Failure on remote laptop",
        "requestor_id": "EMP-9901",
        "requestor_geography": "Paris - HQ",
        "priority": "High"
    }
    create_resp = client.post("/api/tickets", json=payload)
    assert create_resp.status_code == 200
    ticket_data = create_resp.json()
    ticket_id = ticket_data["id"]
    
    assert ticket_data["match_score"] >= 95.0
    assert ticket_data["raw_sha256"] is not None
    assert len(ticket_data["raw_sha256"]) == 64

    # 2. Verify non-hallucination hash verification endpoint
    verify_resp = client.get(f"/api/audit/verify-hash/{ticket_id}")
    assert verify_resp.status_code == 200
    assert verify_resp.json()["is_provenance_verified"] is True

    # 3. Test 5% override action
    override_resp = client.post(f"/api/tickets/{ticket_id}/override", json={
        "override_note": "Verified VPN gateway certificates manually; approved resolution."
    })
    assert override_resp.status_code == 200
    assert override_resp.json()["status"] == "OVERRIDDEN"

def test_analytics_metrics_and_confusion_matrix(client):
    response = client.get("/api/analytics/metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["total_tickets"] > 0
    assert "confusion_matrix" in data
    assert data["confusion_matrix"]["accuracy"] > 0.0
    assert "score_distribution" in data
