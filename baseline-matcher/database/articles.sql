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