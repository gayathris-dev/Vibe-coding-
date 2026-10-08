"""
Script to populate 6,000 realistic BNP Paribas enterprise support tickets across all 6 departments.
"""
import random
import uuid
import datetime
import hashlib
from backend.app.database import SessionLocal, engine, Base
from backend.app.models import Ticket, Department, Article, TicketAudit

def generate_6000_tickets():
    db = SessionLocal()
    try:
        print("[INFO] Checking existing tickets...")
        current_count = db.query(Ticket).count()
        if current_count >= 6000:
            print(f"[INFO] Database already has {current_count} tickets.")
            return

        needed = 6000 - current_count
        print(f"[INFO] Generating {needed} synthetic enterprise tickets to reach 6,000 total...")

        departments = [
            ("retail-banking", "Retail Banking"),
            ("corporate-banking", "Corporate Banking"),
            ("insurance", "Insurance"),
            ("investment-banking", "Investment Banking"),
            ("data-center", "Data-Center"),
            ("laptop-assets", "Laptop Assets")
        ]

        geographies = [
            "Paris - HQ", "London City Office", "New York - Wall St",
            "Singapore - Marina", "Frankfurt Tech Hub", "Mumbai Tech Center",
            "Hong Kong Central", "Tokyo Chiyoda", "Madrid Hub"
        ]

        # Symptom templates per department
        dept_templates = {
            "retail-banking": [
                ("Mobile Banking SSO Login Gateway Timeout: users receiving HTTP 504 during morning rush.", 96.0, "KB-RET-001"),
                ("ATM Host Switch TCP Connection Reset on terminal cluster #{id}.", 100.0, "KB-RET-002"),
                ("SEPA Instant Payment Settlement deadlock on outbound transfer sequence.", 74.0, "KB-RET-003"),
                ("Card fraud alert processing queue latency backlog exceeding 15 minutes.", 88.0, "KB-RET-001"),
                ("Retail portal biometric face authentication handshake failing on iOS v17.", 83.0, "KB-RET-001"),
                ("Unusual transaction volume spike from regional branch ATM network.", 62.0, None),
            ],
            "corporate-banking": [
                ("SWIFT MT103 and pacs.008 Message Queue Ingestion Stoppage in validation gateway.", 100.0, "KB-CORP-001"),
                ("Corporate Treasury Intraday Liquidity Limit Cache Desync for multi-currency accounts.", 95.5, "KB-CORP-002"),
                ("High-value wire settlement STP bridge timeout on Fedwire connector.", 89.0, "KB-CORP-001"),
                ("Treasury netting calculation process stopped unexpectedly during end-of-day batch.", 78.0, "KB-CORP-002"),
                ("Corporate customer trade finance letter of credit PDF parser exception.", 68.0, None),
            ],
            "insurance": [
                ("Insurance Policy Claims Document OCR Ingestion Timeout on high-res scanned PDFs.", 100.0, "KB-INS-001"),
                ("Underwriting actuarial risk assessment engine lock on motor portfolio valuation.", 86.0, "KB-INS-001"),
                ("Policyholder portal premium direct debit mandate submission failure.", 77.0, "KB-INS-001"),
                ("Health insurance automated claim adjudication rules engine mismatch.", 64.0, None),
            ],
            "investment-banking": [
                ("FIX Protocol 4.4 Trading Gateway Feed Heartbeat Loss from Euronext exchange session.", 100.0, "KB-INV-001"),
                ("Real-time VaR Risk Model Calculation Engine Thread Lock on Monte Carlo matrix.", 79.0, "KB-INV-002"),
                ("Order routing gateway latency exceeds SLA threshold by 45ms.", 91.0, "KB-INV-001"),
                ("Algorithmic execution dark pool feed disconnection during opening cross.", 97.0, "KB-INV-001"),
                ("Proprietary trading desk multi-asset spreadsheet add-in crashed.", 58.0, None),
            ],
            "data-center": [
                ("PostgreSQL Database Connection Pool Exhaustion and Deadlock error FATAL: remaining slots reserved.", 100.0, "KB-DC-001"),
                ("Kubernetes Node Disk Space Saturation and CrashLoopBackOff in worker node pool.", 100.0, "KB-DC-002"),
                ("Ingress reverse-proxy SSL certificate renewal failure on edge cluster.", 95.0, "KB-DC-002"),
                ("SAN storage latency spike detected on tier-1 transactional volumes.", 84.0, "KB-DC-001"),
                ("Data-center core switch BGP peer flap on backup optical link.", 71.0, None),
            ],
            "laptop-assets": [
                ("Cisco AnyConnect Corporate VPN Tunnel Drop and DNS Failure on remote laptop.", 100.0, "KB-LAP-001"),
                ("Active Directory Domain Account Lockout and Kerberos TGT Expiry for workstation.", 100.0, "KB-LAP-002"),
                ("Corporate Laptop BitLocker Recovery Key Retrieval prompt after BIOS update.", 78.0, "KB-LAP-003"),
                ("Zscaler cloud proxy client authentication token expired.", 92.0, "KB-LAP-001"),
                ("User workstation display docking station driver crash.", 55.0, None),
            ]
        }

        statuses_by_score = {
            100.0: ["NEW", "SELF_HEALED", "SELF_HEALED", "NEW"],
            95.0: ["NEW", "OVERRIDDEN", "OVERRIDDEN", "NEW"],
            85.0: ["NEW", "QUESTIONS_ANSWERED", "NEW"],
            65.0: ["ESCALATED", "ESCALATED", "ESCALATED"]
        }

        tickets_to_add = []
        now = datetime.datetime.utcnow()

        for i in range(needed):
            dept_slug, dept_name = random.choice(departments)
            templates = dept_templates[dept_slug]
            tmpl, base_score, art_id = random.choice(templates)
            
            # Slight random variation on score
            if base_score == 100.0:
                score = 100.0
            elif base_score >= 95.0:
                score = round(random.uniform(95.0, 99.4), 1)
            elif base_score >= 81.0:
                score = round(random.uniform(81.0, 94.5), 1)
            else:
                score = round(random.uniform(42.0, 79.5), 1)

            # Determine realistic status
            if score == 100.0:
                status = random.choice(["NEW", "SELF_HEALED", "SELF_HEALED", "NEW"])
            elif score >= 95.0:
                status = random.choice(["NEW", "OVERRIDDEN", "OVERRIDDEN", "NEW"])
            elif score >= 81.0:
                status = random.choice(["NEW", "NEW", "QUESTIONS_ANSWERED"])
            else:
                status = "ESCALATED"

            ticket_num = current_count + i + 1
            ticket_id = f"TICK-{ticket_num:05d}"
            
            desc = tmpl.replace("#{id}", str(random.randint(100, 999)))
            raw_hash = hashlib.sha256(desc.encode("utf-8")).hexdigest()
            created_time = now - datetime.timedelta(minutes=random.randint(5, 43200))

            t = Ticket(
                id=ticket_id,
                department_id=dept_slug,
                description=desc,
                status=status,
                match_score=score,
                matched_article_id=art_id,
                requestor_id=f"EMP-{random.randint(1000, 9999)}",
                requestor_geography=random.choice(geographies),
                priority=random.choice(["Low", "Medium", "High", "Critical"]),
                raw_sha256=raw_hash,
                created_at=created_time,
                resolution_time_minutes=0.35 if status == "SELF_HEALED" else (2.5 if status == "OVERRIDDEN" else 0.0)
            )
            tickets_to_add.append(t)

            if len(tickets_to_add) >= 1000:
                db.bulk_save_objects(tickets_to_add)
                db.commit()
                print(f"[INFO] Committed batch... Total inserted: {i+1}")
                tickets_to_add = []

        if tickets_to_add:
            db.bulk_save_objects(tickets_to_add)
            db.commit()

        total = db.query(Ticket).count()
        print(f"[SUCCESS] Total tickets in database: {total}")

    finally:
        db.close()

if __name__ == "__main__":
    generate_6000_tickets()
