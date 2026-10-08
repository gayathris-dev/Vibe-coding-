CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
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
	

	