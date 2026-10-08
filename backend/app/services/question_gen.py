"""
Dynamic Question Generation Service for Clarification Loop (81% - 94% confidence).
Analyzes the ticket description and matched knowledge base article to generate
2 to 3 targeted clarification questions with options to eliminate diagnostic ambiguity.
"""
import re
from typing import List, Dict, Any

class QuestionGenerator:
    def __init__(self):
        # Domain symptom keywords to dynamic questions
        self.question_templates = [
            {
                "trigger_words": ["login", "sso", "authentication", "saml", "okta", "password", "mfa", "token"],
                "questions": [
                    {
                        "question": "Is the authentication failure happening across all browser windows or in an Incognito/Private session?",
                        "options": ["Happens in all browsers and Incognito", "Only happens in regular browser session", "Affects both desktop app and web portal"]
                    },
                    {
                        "question": "Did the user recently rotate or change their Active Directory/BNP Paribas domain credentials?",
                        "options": ["Yes, password was updated in the last 24 hours", "No, credentials have not changed", "Account is temporarily locked out"]
                    },
                    {
                        "question": "What exact HTTP or SAML error code is displayed on screen?",
                        "options": ["HTTP 401 Unauthorized / Access Denied", "SAML 403 Forbidden / Token Expired", "Blank page / Infinite redirection loop"]
                    }
                ]
            },
            {
                "trigger_words": ["vpn", "cisco", "anyconnect", "gateway", "tunnel", "dns", "firewall", "network"],
                "questions": [
                    {
                        "question": "Which specific VPN gateway cluster is the client machine attempting to connect to?",
                        "options": ["Europe Primary (Paris Gateway)", "Americas Primary (New York Gateway)", "APAC Gateway (Singapore)"]
                    },
                    {
                        "question": "Is the issue persisting when connected via hardwired corporate LAN versus home Wi-Fi?",
                        "options": ["Only occurs over home Wi-Fi / Remote", "Occurs on both corporate office LAN and Remote", "Hardwired Ethernet connection works"]
                    },
                    {
                        "question": "Are internal intraday trading or settlement hosts pingable via FQDN?",
                        "options": ["Cannot resolve internal DNS hostnames", "DNS resolves but TCP port handshake times out", "Packet loss is > 40%"]
                    }
                ]
            },
            {
                "trigger_words": ["swift", "settlement", "payment", "iso20022", "clearing", "wire", "gateway", "queue"],
                "questions": [
                    {
                        "question": "Is the payment message stalled in the validation queue (ACK/NACK) or the STP dispatch queue?",
                        "options": ["Pending MT103/pacs.008 schema validation (ACK pending)", "Stuck in message queue / dead-letter queue", "Dispatched but counterparty response not received"]
                    },
                    {
                        "question": "Is the currency corridor impacted specific to EUR/USD or all multi-currency rails?",
                        "options": ["EUR Target2 / Fedwire corridors only", "All cross-border currency pairs", "Specific to regional clearing house"]
                    },
                    {
                        "question": "Has the intraday liquidity limit or credit check gate triggered a hold?",
                        "options": ["Yes, intraday limit threshold reached", "No, liquidity check passed with approval", "Credit validation service timed out"]
                    }
                ]
            },
            {
                "trigger_words": ["database", "postgres", "oracle", "query", "deadlock", "lock", "connection", "pool", "timeout"],
                "questions": [
                    {
                        "question": "Are connection pool exhaustion errors (Max Connections Reached) visible in the service logs?",
                        "options": ["Yes, active connection pool is saturated (100%)", "No, connections are idle but queries time out", "Database process memory is spiking"]
                    },
                    {
                        "question": "Is the latency isolated to a single read-replica or affecting the primary master cluster?",
                        "options": ["Primary master node is experiencing lock waits", "Read-replica replication lag > 120s", "All cluster nodes are unresponsive"]
                    }
                ]
            },
            {
                "trigger_words": ["disk", "storage", "cpu", "memory", "vmware", "pod", "kubernetes", "crashloop"],
                "questions": [
                    {
                        "question": "What is the current pod or filesystem utilization metric?",
                        "options": ["Disk volume utilization > 95%", "OOMKilled container crash loop", "High CPU throttling > 90%"]
                    },
                    {
                        "question": "Can non-essential cached logs or temporary dumps be safely flushed to regain headroom?",
                        "options": ["Yes, safe to truncate rotated log volumes", "No, audit retention requires archiving first", "Automatic purge script is recommended"]
                    }
                ]
            }
        ]

    def generate_questions(self, ticket_text: str, article_title: str, article_body: str) -> List[str]:
        """
        Generates 2 to 3 clarification questions tailored to the context.
        """
        combined_text = (ticket_text + " " + article_title + " " + article_body).lower()
        matched_questions = []

        for group in self.question_templates:
            if any(w in combined_text for w in group["trigger_words"]):
                for q_obj in group["questions"]:
                    if q_obj["question"] not in matched_questions:
                        matched_questions.append(q_obj["question"])
                        if len(matched_questions) >= 3:
                            break
            if len(matched_questions) >= 3:
                break

        if len(matched_questions) < 2:
            # Contextual fallback questions
            matched_questions.append(f"Can you confirm if this issue with '{article_title}' affects all active users or a specific workstation/account?")
            matched_questions.append("Has an automated service restart or cache clear been attempted within the last 30 minutes?")
            matched_questions.append("Please provide the specific transaction ID, hostname, or error screenshot timestamp.")

        return matched_questions[:3]

question_generator = QuestionGenerator()
