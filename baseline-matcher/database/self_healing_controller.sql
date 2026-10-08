CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    body_text TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_article_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
);

CREATE TABLE article_tags (
    article_id INTEGER NOT NULL,
    tag VARCHAR(100) NOT NULL,

    PRIMARY KEY (article_id, tag),

    CONSTRAINT fk_tag_article
        FOREIGN KEY (article_id)
        REFERENCES articles(id)
        ON DELETE CASCADE
);

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

INSERT INTO departments (name)
VALUES
    ('Retail Banking'),
    ('Corporate Banking'),
    ('Insurance'),
    ('Investment Banking'),
    ('Data-Center'),
    ('Laptop Assets');


SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;	
	

	