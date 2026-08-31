-- AquaSync base schema: Phase 2 (just roles + users to start)
-- Run this once against your local aquasync database.

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL   -- citizen, field_worker, operator, admin
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id INTEGER REFERENCES roles(id) DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Seed the four roles from the design doc
INSERT INTO roles (name) VALUES
    ('citizen'),
    ('field_worker'),
    ('operator'),
    ('admin')
ON CONFLICT (name) DO NOTHING;
