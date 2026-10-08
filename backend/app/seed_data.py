"""
Database Seeder and Synthetic Knowledge Base Loader for BNP Paribas Self-Healing Controller.
Seeds:
1. All 6 Business Domains (Retail Banking, Corporate Banking, Insurance, Investment Banking, Data-Center, Laptop Assets)
2. 30+ Realistic Banking Knowledge Base Articles with Tags, Troubleshooting Steps & Script Mappings
3. Standard Users with RBAC (Admin, Analyst, Viewer)
4. Costing Metadata & Exclusion List
5. Realistic initial Tickets across all confidence levels (100%, 95-99%, 81-94%, <80%)
"""
import uuid
import datetime
from sqlalchemy.orm import Session
from backend.app.database import SessionLocal, engine, Base
from backend.app.models import (
    Department, Article, ArticleTag, ArticleVersion,
    Ticket, TicketAudit, User, CostingMetadata, ExclusionList
)
from backend.app.services.audit import audit_service
from backend.app.services.matcher import matcher
from backend.app.api.auth import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Department).count() > 0:
            print("[INFO] Database already contains records. Skipping initial seeding.")
            return

        print("[INFO] Seeding BNP Paribas Self-Healing Controller database...")

        # 1. Departments
        departments_data = [
            ("retail-banking", "Retail Banking", "Retail customer accounts, branch operations, ATMs, online & mobile banking"),
            ("corporate-banking", "Corporate Banking", "Corporate trade finance, treasury management, SWIFT payment rails, clearing"),
            ("insurance", "Insurance", "Life, health & property insurance underwriting, claims processing, risk models"),
            ("investment-banking", "Investment Banking", "Equities, derivatives trading, FIX protocols, market data feeds, risk analytics"),
            ("data-center", "Data-Center", "Cloud infrastructure, Kubernetes, PostgreSQL/Oracle clusters, storage & networking"),
            ("laptop-assets", "Laptop Assets", "End-user corporate devices, Cisco AnyConnect VPN, Active Directory, SSO & security")
        ]

        for dept_id, name, desc in departments_data:
            dept = Department(id=dept_id, name=name, description=desc)
            db.add(dept)
        db.flush()

        # 2. Costing Metadata
        costing_data = [
            ("retail-banking", 80.0, 0.20, 1000.0),
            ("corporate-banking", 95.0, 0.30, 1500.0),
            ("insurance", 75.0, 0.20, 900.0),
            ("investment-banking", 120.0, 0.50, 2500.0),
            ("data-center", 110.0, 0.40, 2000.0),
            ("laptop-assets", 65.0, 0.15, 800.0),
        ]
        for dept_id, hourly, script_cost, license_cost in costing_data:
            c = CostingMetadata(
                department_id=dept_id,
                hourly_support_cost=hourly,
                script_execution_cost=script_cost,
                licensing_cost=license_cost
            )
            db.add(c)

        # 3. Users (RBAC)
        users_data = [
            ("admin", "Claire Dubois", "claire.dubois@bnpparibas.com", "Admin"),
            ("analyst", "Alexandre Mercier", "alexandre.mercier@bnpparibas.com", "Analyst"),
            ("viewer", "Sophie Laurent", "sophie.laurent@bnpparibas.com", "Viewer")
        ]
        for username, full_name, email, role in users_data:
            u = User(
                id=f"USR-{uuid.uuid4().hex[:6].upper()}",
                username=username,
                full_name=full_name,
                email=email,
                role=role,
                hashed_password=get_password_hash("password")
            )
            db.add(u)

        # 4. Knowledge Base Articles
        articles_data = [
            # Retail Banking
            {
                "id": "KB-RET-001",
                "dept": "retail-banking",
                "title": "Mobile Banking SSO Login Gateway Timeout",
                "category": "Authentication",
                "script": "/opt/selfheal/sync_ad_sso_tokens.py",
                "tags": ["sso", "login", "timeout", "oauth", "mobile-app", "jwt"],
                "body": """# Mobile Banking SSO Login Gateway Timeout
## Problem Summary
Retail mobile banking end-users experience HTTP 504 Gateway Timeout or token expiration errors when authenticating via the centralized SSO OAuth2 cluster.

## Diagnostic Steps
1. Verify token synchronization latency between the primary auth broker and active session store.
2. Check if Kerberos ticket granting tokens (TGT) have fallen out of sync following regional node failover.
3. Review auth gateway connection limits and ensure redis worker pool is healthy.

## Automated Remediation
Execute the automated sync script `sync_ad_sso_tokens.py` to flush stale OAuth cache descriptors and force token re-synchronization.

## Manual Fallback
If the error persists after token sync, rotate the intermediate TLS signing certificate on the ingress gateway."""
            },
            {
                "id": "KB-RET-002",
                "dept": "retail-banking",
                "title": "ATM Host Switch TCP Connection Reset",
                "category": "ATM Operations",
                "script": "/opt/selfheal/restart_payment_gateway.py",
                "tags": ["atm", "switch", "iso8583", "connection-reset", "tcp"],
                "body": """# ATM Host Switch TCP Connection Reset
## Problem Summary
ATM terminals report transient connectivity drops during peak transaction volume due to hung ISO 8583 switch socket listeners.

## Diagnostic Steps
1. Inspect TCP keepalive packets on port 9044 connecting the terminal concentrator to the transaction host.
2. Confirm if network firewall state table exceeded its session threshold.

## Automated Remediation
Trigger `restart_payment_gateway.py` to gracefully recycle the terminal socket listener daemon."""
            },
            {
                "id": "KB-RET-003",
                "dept": "retail-banking",
                "title": "SEPA Instant Payment Settlement Deadlock",
                "category": "Payments",
                "script": None,
                "tags": ["sepa", "instant-payments", "settlement", "clearing", "deadlock"],
                "body": """# SEPA Instant Payment Settlement Deadlock
## Problem Summary
Outbound instant credit transfers are delayed due to lock contention in the clearing queue.

## Diagnostic Steps
1. Check the interbank settlement queue depth in the transaction ledger.
2. Verify target account IBAN validation microservice response latency.

## Manual Resolution
Production support must manually review ledger locks and release the blocked transaction sequence."""
            },

            # Corporate Banking
            {
                "id": "KB-CORP-001",
                "dept": "corporate-banking",
                "title": "SWIFT MT103 and pacs.008 Message Queue Ingestion Stoppage",
                "category": "SWIFT Rails",
                "script": "/opt/selfheal/restart_payment_gateway.py",
                "tags": ["swift", "mt103", "pacs.008", "iso20022", "mq", "payment-stalled"],
                "body": """# SWIFT MT103 and pacs.008 Message Queue Ingestion Stoppage
## Problem Summary
High-value corporate wire payments are stalled in the inbound MQ queue without ACK confirmation from the validation engine.

## Diagnostic Steps
1. Check the dead-letter queue (DLQ) for malformed ISO 20022 XML schemas.
2. Inspect worker threads on the SWIFT gateway connector for deadlock conditions.
3. Validate HSM crypto module connectivity.

## Automated Remediation
Execute `restart_payment_gateway.py` to reset the active consumer threads and re-establish queue bindings."""
            },
            {
                "id": "KB-CORP-002",
                "dept": "corporate-banking",
                "title": "Corporate Treasury Intraday Liquidity Limit Cache Desync",
                "category": "Treasury",
                "script": "/opt/selfheal/flush_dns_cache.py",
                "tags": ["treasury", "liquidity", "limit", "cache", "balance"],
                "body": """# Corporate Treasury Intraday Liquidity Limit Cache Desync
## Problem Summary
Corporate treasurers see stale credit facility limit warnings despite sufficient deposited collateral in accounts.

## Diagnostic Steps
1. Compare the in-memory cache snapshot with the core ledger database balance.
2. Ensure cache invalidation events from the transaction pipeline were not dropped.

## Automated Remediation
Run `flush_dns_cache.py` to invalidate cache nodes and force real-time balance aggregation."""
            },

            # Investment Banking
            {
                "id": "KB-INV-001",
                "dept": "investment-banking",
                "title": "FIX Protocol 4.4 Trading Gateway Feed Heartbeat Loss",
                "category": "Electronic Trading",
                "script": "/opt/selfheal/restart_payment_gateway.py",
                "tags": ["fix", "trading", "equities", "heartbeat", "gateway", "market-data"],
                "body": """# FIX Protocol 4.4 Trading Gateway Feed Heartbeat Loss
## Problem Summary
Algorithmic order execution engines report '35=0 Heartbeat missing' from the Euronext / LSE market gateways.

## Diagnostic Steps
1. Verify the client sequence numbers (MsgSeqNum) match the counterparty exchange session log.
2. Inspect the low-latency kernel network interface (Solarflare onload) for packet drops.

## Automated Remediation
Trigger `restart_payment_gateway.py` to reset sequence buffers and re-send FIX Logon message (35=A)."""
            },
            {
                "id": "KB-INV-002",
                "dept": "investment-banking",
                "title": "Real-time VaR Risk Model Calculation Engine Thread Lock",
                "category": "Risk Engine",
                "script": None,
                "tags": ["var", "risk", "monte-carlo", "lock", "analytics"],
                "body": """# Real-time VaR Risk Model Calculation Engine Thread Lock
## Problem Summary
Intraday Value-at-Risk (VaR) matrices are failing to refresh due to a lock in the GPU cluster calculation scheduler.

## Diagnostic Steps
1. Check CUDA core allocation across compute nodes.
2. Verify volatility surface interpolation input streams."""
            },

            # Data-Center
            {
                "id": "KB-DC-001",
                "dept": "data-center",
                "title": "PostgreSQL Database Connection Pool Exhaustion and Deadlock",
                "category": "Databases",
                "script": "/opt/selfheal/reconnect_database_pool.py",
                "tags": ["postgres", "database", "deadlock", "connection-pool", "max-connections", "timeout"],
                "body": """# PostgreSQL Database Connection Pool Exhaustion and Deadlock
## Problem Summary
Core banking relational database reports 'FATAL: remaining connection slots are reserved for non-replication superuser connections' and high lock contention.

## Diagnostic Steps
1. Query `pg_stat_activity` to identify idle-in-transaction connections and long-running locks.
2. Check PgBouncer or proxy connection limits and client thread exhaustion.
3. Review query wait events for exclusive table lock locks.

## Automated Remediation
Execute `reconnect_database_pool.py` to terminate hung idle-in-transaction backends, flush stale pools, and reset max allocation."""
            },
            {
                "id": "KB-DC-002",
                "dept": "data-center",
                "title": "Kubernetes Node Disk Space Saturation and CrashLoopBackOff",
                "category": "Infrastructure",
                "script": "/opt/selfheal/clear_temp_disk_space.py",
                "tags": ["kubernetes", "disk", "storage", "crashloop", "docker", "logs", "full"],
                "body": """# Kubernetes Node Disk Space Saturation and CrashLoopBackOff
## Problem Summary
Worker node disk utilization reaches 98% due to unrotated application container log files and ephemeral pod dump artifacts.

## Diagnostic Steps
1. Run `df -h` on `/var/lib/docker/overlay2` and `/var/log/pods`.
2. Inspect log retention policies on noisy microservice pods.

## Automated Remediation
Run `clear_temp_disk_space.py` to safely purge expired temp logs and reclaim disk space."""
            },
            {
                "id": "KB-DC-003",
                "dept": "data-center",
                "title": "Manual Emergency Production Database Shutdown Procedure",
                "category": "Critical Operations",
                "script": "/opt/selfheal/shutdown_db.py",
                "tags": ["manual", "shutdown", "database", "critical", "danger"],
                "body": """# Manual Emergency Production Database Shutdown Procedure
## Problem Summary
Extreme emergency procedure for cold graceful shutdown of primary database cluster during physical disaster recovery.

## IMPORTANT SECURITY NOTICE
This action must NEVER be automated or triggered via self-heal scripts. Requires dual CTO approval."""
            },

            # Laptop Assets
            {
                "id": "KB-LAP-001",
                "dept": "laptop-assets",
                "title": "Cisco AnyConnect Corporate VPN Tunnel Drop and DNS Failure",
                "category": "Networking",
                "script": "/opt/selfheal/reset_vpn_client_session.py",
                "tags": ["vpn", "cisco", "anyconnect", "dns", "tunnel", "disconnected", "remote"],
                "body": """# Cisco AnyConnect Corporate VPN Tunnel Drop and DNS Failure
## Problem Summary
Remote employees on corporate laptops lose internal network access due to broken VPN socket routing tables and unresolvable internal DNS hostnames.

## Diagnostic Steps
1. Check client VPN adapter status and IP route table entries for `10.0.0.0/8` subnet.
2. Verify local DNS cache is not holding poisoned or expired DNS records.

## Automated Remediation
Trigger `reset_vpn_client_session.py` to flush DNS, restart the virtual network adapter, and rebuild route tables."""
            },
            {
                "id": "KB-LAP-002",
                "dept": "laptop-assets",
                "title": "Active Directory Domain Account Lockout and Kerberos TGT Expiry",
                "category": "Identity",
                "script": "/opt/selfheal/unlock_ad_user_account.py",
                "tags": ["active-directory", "ad", "account-locked", "password", "kerberos", "unlock", "domain"],
                "body": """# Active Directory Domain Account Lockout and Kerberos TGT Expiry
## Problem Summary
Employee workstation is locked out of corporate domain after consecutive failed credential sync attempts from background mail client.

## Diagnostic Steps
1. Check Active Directory badPwdCount and lockoutTime attributes on primary domain controller.
2. Confirm user has verified identity via corporate MFA authenticator app.

## Automated Remediation
Execute `unlock_ad_user_account.py` to reset lockout counters and issue a fresh Kerberos ticket granting token."""
            },
            {
                "id": "KB-LAP-003",
                "dept": "laptop-assets",
                "title": "Corporate Laptop BitLocker Recovery Key Retrieval",
                "category": "Hardware",
                "script": None,
                "tags": ["bitlocker", "encryption", "recovery-key", "tpm", "boot"],
                "body": """# Corporate Laptop BitLocker Recovery Key Retrieval
## Problem Summary
Workstation prompts for 48-digit BitLocker recovery key upon boot after BIOS update.

## Diagnostic Steps
1. Verify user employee ID and security passphrase.
2. Retrieve key from Microsoft Intune / Azure AD endpoint manager."""
            },

            # Insurance
            {
                "id": "KB-INS-001",
                "dept": "insurance",
                "title": "Insurance Policy Claims Document OCR Ingestion Timeout",
                "category": "Claims Processing",
                "script": "/opt/selfheal/restart_payment_gateway.py",
                "tags": ["insurance", "claims", "ocr", "timeout", "pdf", "tesseract"],
                "body": """# Insurance Policy Claims Document OCR Ingestion Timeout
## Problem Summary
Policyholder claim PDF scans fail to extract structured tabular data due to worker thread timeouts in the OCR pipeline.

## Diagnostic Steps
1. Check OCR processing queue depth and memory consumption.
2. Inspect worker health endpoints.

## Automated Remediation
Run `restart_payment_gateway.py` to reset the OCR ingestion worker pool."""
            }
        ]

        for art_data in articles_data:
            art = Article(
                id=art_data["id"],
                department_id=art_data["dept"],
                title=art_data["title"],
                category=art_data["category"],
                body_text=art_data["body"],
                script_path=art_data["script"],
                version=1
            )
            db.add(art)
            db.flush()

            for tag_str in art_data["tags"]:
                db.add(ArticleTag(article_id=art.id, tag=tag_str))

            # Version 1 history
            v = ArticleVersion(
                article_id=art.id,
                version_num=1,
                title=art.title,
                body_text=art.body_text,
                script_path=art.script_path,
                changed_by="claire.dubois@bnpparibas.com",
                change_summary="Standard Operating Procedure initial release"
            )
            db.add(v)

        # 5. Exclusion List
        exclusion = ExclusionList(
            article_id="KB-DC-003",
            reason="Emergency database shutdown requires manual dual-CTO cryptographic signature and must never be auto-executed."
        )
        db.add(exclusion)
        db.flush()

        # 6. Sample Tickets covering all confidence bands
        sample_tickets = [
            # 100% Score -> Instant Self-Heal enabled
            {
                "id": "TICK-1001",
                "dept": "laptop-assets",
                "desc": "Cisco AnyConnect Corporate VPN Tunnel Drop and DNS Failure on remote laptop when connecting to Paris office gateway. Cannot resolve internal intranet hostnames.",
                "user": "EMP-8291",
                "geo": "Paris - HQ",
                "priority": "High"
            },
            {
                "id": "TICK-1002",
                "dept": "data-center",
                "desc": "PostgreSQL Database Connection Pool Exhaustion and Deadlock error FATAL: remaining connection slots are reserved for non-replication superuser connections.",
                "user": "EMP-4102",
                "geo": "Frankfurt Tech Hub",
                "priority": "Critical"
            },
            # 95-99% Score -> 5% Override Modal
            {
                "id": "TICK-1003",
                "dept": "retail-banking",
                "desc": "Mobile banking customers in Lyon region are receiving HTTP 504 Gateway Timeout during SSO login authentication via mobile app.",
                "user": "EMP-3921",
                "geo": "Paris - HQ",
                "priority": "High"
            },
            # 81-94% Score -> Ask More Dynamic Question Loop
            {
                "id": "TICK-1004",
                "dept": "corporate-banking",
                "desc": "Inbound corporate payment wire message queue appears stalled. Transactions are pending validation without ACK received.",
                "user": "EMP-9912",
                "geo": "London City Office",
                "priority": "High"
            },
            # <80% Score -> Auto-Escalated to Production-Support queue
            {
                "id": "TICK-1005",
                "dept": "investment-banking",
                "desc": "Unusual latency spikes observed during midday equities volume surge on custom proprietary derivative pricing matrix spreadsheet.",
                "user": "EMP-1049",
                "geo": "New York - Wall St",
                "priority": "Medium"
            },
            {
                "id": "TICK-1006",
                "dept": "insurance",
                "desc": "Policyholder uploaded scanned accident claim PDF document but OCR ingestion timed out during text extraction.",
                "user": "EMP-7714",
                "geo": "Singapore - Marina",
                "priority": "Medium"
            },
            {
                "id": "TICK-1007",
                "dept": "laptop-assets",
                "desc": "Active Directory domain account locked out after multiple failed password attempts on workstation.",
                "user": "EMP-5501",
                "geo": "Paris - HQ",
                "priority": "Medium"
            }
        ]

        for t_info in sample_tickets:
            # Query articles for matcher
            articles = db.query(Article).filter(Article.department_id == t_info["dept"]).all()
            candidate_dicts = [{
                "id": a.id, "title": a.title, "body_text": a.body_text,
                "tags": [t.tag for t in a.tags], "script_path": a.script_path
            } for a in articles]

            best_art, confidence, raw_cosine, highlights = matcher.compute_similarity(
                t_info["desc"], candidate_dicts
            )

            status = "NEW"
            if confidence < 80.0:
                status = "ESCALATED"

            raw_hash = audit_service.compute_sha256(t_info["desc"])
            ticket = Ticket(
                id=t_info["id"],
                department_id=t_info["dept"],
                description=t_info["desc"],
                status=status,
                match_score=confidence,
                matched_article_id=best_art["id"] if best_art else None,
                requestor_id=t_info["user"],
                requestor_geography=t_info["geo"],
                priority=t_info["priority"],
                raw_sha256=raw_hash
            )
            db.add(ticket)
            db.flush()

            # Record initial audit entry
            audit_service.log_event(
                db=db,
                ticket_id=ticket.id,
                user_id=t_info["user"],
                action="CREATED",
                ticket_hash=raw_hash,
                details={
                    "initial_score": confidence,
                    "matched_article": best_art["title"] if best_art else "None",
                    "status": status
                }
            )

        db.commit()
        print("[SUCCESS] BNP Paribas Self-Healing Controller seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Database seeding failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
