-- Add reference_project_id column to the projects table if it doesn't exist
ALTER TABLE projects ADD COLUMN reference_project_id INTEGER NULL;

-- Add a foreign key constraint to reference the projects table itself
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- Create temporary table with the new structure
CREATE TABLE projects_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_name TEXT NOT NULL,
  builder_id INTEGER NOT NULL,
  estimator_id INTEGER NOT NULL,
  supervisor_id INTEGER,
  status_id INTEGER NOT NULL,
  location_id INTEGER,
  due_date TEXT NOT NULL,
  contract_value REAL,
  reference_project_id INTEGER,
  FOREIGN KEY (builder_id) REFERENCES builders(id),
  FOREIGN KEY (estimator_id) REFERENCES estimators(id),
  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id),
  FOREIGN KEY (status_id) REFERENCES statuses(id),
  FOREIGN KEY (location_id) REFERENCES locations(id),
  FOREIGN KEY (reference_project_id) REFERENCES projects(id)
);

-- Copy data from the old table to the new table
INSERT INTO projects_new (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value)
SELECT id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value 
FROM projects;

-- Drop the old table and rename the new one
DROP TABLE projects;
ALTER TABLE projects_new RENAME TO projects;

COMMIT;
PRAGMA foreign_keys=ON;

-- Create an index on reference_project_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_reference_project_id ON projects(reference_project_id);
