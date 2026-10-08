CREATE TABLE tickets (
    id UUID PRIMARY KEY,
    department_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'NEW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    match_score NUMERIC(5,2),
    matched_article_id INTEGER,

    CONSTRAINT fk_ticket_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id),

    CONSTRAINT fk_ticket_article
        FOREIGN KEY (matched_article_id)
        REFERENCES articles(id),

    CONSTRAINT check_match_score
        CHECK (
            match_score IS NULL
            OR (match_score >= 0 AND match_score <= 100)
        )
);