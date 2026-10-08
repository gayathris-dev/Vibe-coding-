CREATE TABLE ticket_audit (
    audit_id SERIAL PRIMARY KEY,
    ticket_id UUID NOT NULL,
    user_id VARCHAR(100),
    action VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ticket_hash VARCHAR(64),

    CONSTRAINT fk_audit_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES tickets(id)
        ON DELETE CASCADE
);