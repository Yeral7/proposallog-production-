-- Add reference_project_id column to the projects table if it doesn't exist
PRAGMA foreign_keys=off;
BEGIN TRANSACTION;

-- Create a temporary table with the new column structure
CREATE TABLE IF NOT EXISTS projects_new (
    id INTEGER PRIMARY KEY,
    project_name TEXT NOT NULL,
    builder_id INTEGER NOT NULL,
    estimator_id INTEGER,
    supervisor_id INTEGER,
    status_id INTEGER NOT NULL,
    location_id INTEGER,
    due_date TEXT NOT NULL,
    contract_value REAL,
    reference_project_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Insert data from the old table into the new one
INSERT OR IGNORE INTO projects_new
SELECT 
    id,
    project_name,
    builder_id,
    estimator_id,
    supervisor_id,
    status_id,
    location_id,
    due_date,
    contract_value,
    NULL as reference_project_id,
    created_at,
    updated_at
FROM projects;

-- Drop the old table and rename the new one
DROP TABLE IF EXISTS projects_old;
ALTER TABLE projects RENAME TO projects_old;
ALTER TABLE projects_new RENAME TO projects;

-- Create necessary indexes
CREATE INDEX IF NOT EXISTS idx_projects_reference_project_id ON projects(reference_project_id);

COMMIT;
PRAGMA foreign_keys=on;
