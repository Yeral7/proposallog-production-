-- Add supervisors table (following same pattern as builders/estimators)
CREATE TABLE IF NOT EXISTS supervisors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100)
);

-- Add supervisor_id column to projects table
ALTER TABLE projects
ADD COLUMN supervisor_id INT,
ADD CONSTRAINT fk_supervisor 
FOREIGN KEY (supervisor_id) REFERENCES supervisors(id);

-- Insert sample supervisors
INSERT INTO supervisors (name) VALUES ('John Smith');
INSERT INTO supervisors (name) VALUES ('Maria Garcia');
INSERT INTO supervisors (name) VALUES ('Robert Chen');
INSERT INTO supervisors (name) VALUES ('Sarah Johnson');
INSERT INTO supervisors (name) VALUES ('David Patel');

-- Sample query to update existing projects with supervisors (optional)
-- UPDATE projects SET supervisor_id = 1 WHERE id IN (1, 2, 3);
-- UPDATE projects SET supervisor_id = 2 WHERE id IN (4, 5);
-- UPDATE projects SET supervisor_id = 3 WHERE id IN (6, 7, 8);
