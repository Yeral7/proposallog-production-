-- Supabase Schema Creation Script
-- Copy and paste this entire script into your Supabase SQL Editor and click "Run"

-- Table: builders
CREATE TABLE IF NOT EXISTS builders (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

-- Table: estimators  
CREATE TABLE IF NOT EXISTS estimators (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

-- Table: statuses
CREATE TABLE IF NOT EXISTS statuses (
  id BIGSERIAL PRIMARY KEY,
  label TEXT NOT NULL
);

-- Table: locations
CREATE TABLE IF NOT EXISTS locations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

-- Table: supervisors
CREATE TABLE IF NOT EXISTS supervisors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL
);

-- Table: projects (based on your actual CSV structure)
CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  project_name TEXT NOT NULL,
  builder_id BIGINT REFERENCES builders(id),
  estimator_id BIGINT REFERENCES estimators(id),
  supervisor_id BIGINT REFERENCES supervisors(id),
  status_id BIGINT REFERENCES statuses(id),
  location_id BIGINT REFERENCES locations(id),
  due_date DATE,
  contract_value DECIMAL,
  reference_project_id BIGINT,
  priority TEXT,
  submission_date DATE,
  follow_up_date DATE
);

-- Table: project_contacts
CREATE TABLE IF NOT EXISTS project_contacts (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Table: project_drawings
CREATE TABLE IF NOT EXISTS project_drawings (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Table: project_notes (based on your actual CSV structure)
CREATE TABLE IF NOT EXISTS project_notes (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author TEXT,
  timestamp TIMESTAMP WITH TIME ZONE
);

-- Table: schema_migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial migration record
INSERT INTO schema_migrations (version) VALUES ('001_initial_schema') ON CONFLICT DO NOTHING;
