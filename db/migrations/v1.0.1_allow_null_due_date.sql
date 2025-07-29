-- This migration updates the projects table to allow NULL values for the due_date column.

-- Create a new table with the desired schema
CREATE TABLE projects_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT NOT NULL,
    builder_id INTEGER,
    estimator_id INTEGER,
    supervisor_id INTEGER,
    status_id INTEGER,
    location_id INTEGER,
    due_date TEXT, -- Allow NULL
    contract_value REAL,
    reference_project_id INTEGER,
    FOREIGN KEY (builder_id) REFERENCES builders(id),
    FOREIGN KEY (estimator_id) REFERENCES estimators(id),
    FOREIGN KEY (supervisor_id) REFERENCES supervisors(id),
    FOREIGN KEY (status_id) REFERENCES statuses(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- Copy data from the old table to the new table
INSERT INTO projects_new (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id)
SELECT id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id FROM projects;

-- Drop the old table
DROP TABLE projects;

-- Rename the new table to the original name
ALTER TABLE projects_new RENAME TO projects;
