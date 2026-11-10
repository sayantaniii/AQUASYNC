-- AquaSync Schema: Production & Resilience Layer
-- Run this against your local PostgreSQL database if using Postgres.

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

-- Seed core roles
INSERT INTO roles (name) VALUES
    ('citizen'),
    ('field_worker'),
    ('operator'),
    ('admin')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    reference_code VARCHAR(12) UNIQUE NOT NULL,
    issue_type VARCHAR(100) NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',      -- low | medium | high | urgent | critical
    contact_phone VARCHAR(20),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    image_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'open',           -- open | assigned | in_progress | resolved
    assigned_to INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incidents_reference_code ON incidents(reference_code);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON incidents(assigned_to);

CREATE TABLE IF NOT EXISTS sensors (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,                           -- pressure | flow | turbidity
    unit VARCHAR(20) NOT NULL,
    min_normal DOUBLE PRECISION NOT NULL,
    max_normal DOUBLE PRECISION NOT NULL,
    current_value DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status VARCHAR(20) NOT NULL DEFAULT 'normal',         -- normal | warning | critical
    last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);
