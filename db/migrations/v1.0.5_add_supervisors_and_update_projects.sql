-- This migration adds the supervisors table and updates the projects table.

-- 1. Create the supervisors table
CREATE TABLE supervisors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
);

-- 2. Seed the supervisors table
INSERT INTO supervisors (id, name) VALUES (1, 'Abel');
INSERT INTO supervisors (id, name) VALUES (2, 'Alvaro');
INSERT INTO supervisors (id, name) VALUES (3, 'Cristian');
INSERT INTO supervisors (id, name) VALUES (4, 'Evin');
INSERT INTO supervisors (id, name) VALUES (5, 'Fredy');
INSERT INTO supervisors (id, name) VALUES (6, 'Gerardo');
INSERT INTO supervisors (id, name) VALUES (7, 'Gerson');
INSERT INTO supervisors (id, name) VALUES (8, 'Glenda');
INSERT INTO supervisors (id, name) VALUES (9, 'Javier');
INSERT INTO supervisors (id, name) VALUES (10, 'Jose');
INSERT INTO supervisors (id, name) VALUES (11, 'Juan');
INSERT INTO supervisors (id, name) VALUES (12, 'Santos');

-- 3. Add supervisor_id to projects table
-- Note: SQLite does not support adding foreign key constraints via ALTER TABLE in older versions.
-- This will be handled by the application logic, but the column is added here.
ALTER TABLE projects ADD COLUMN supervisor_id INTEGER REFERENCES supervisors(id);

-- 4. Add reference_project_id to projects table
ALTER TABLE projects ADD COLUMN reference_project_id INTEGER REFERENCES projects(id);
