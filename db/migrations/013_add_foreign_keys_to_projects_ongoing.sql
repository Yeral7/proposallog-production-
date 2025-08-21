-- Add foreign key columns to projects_ongoing table
ALTER TABLE projects_ongoing 
ADD COLUMN IF NOT EXISTS project_type_id INTEGER,
ADD COLUMN IF NOT EXISTS project_style_id INTEGER,
ADD COLUMN IF NOT EXISTS progress_status_id INTEGER;

-- Update the foreign key columns with data from existing text fields
UPDATE projects_ongoing 
SET project_type_id = pt.id 
FROM project_types pt 
WHERE projects_ongoing.project_type = pt.name;

UPDATE projects_ongoing 
SET project_style_id = ps.id 
FROM project_styles ps 
WHERE projects_ongoing.project_style = ps.name;

UPDATE projects_ongoing 
SET progress_status_id = prs.id 
FROM progress_statuses prs 
WHERE projects_ongoing.progress_status = prs.name;

-- Add foreign key constraints
ALTER TABLE projects_ongoing 
ADD CONSTRAINT fk_project_type 
FOREIGN KEY (project_type_id) REFERENCES project_types(id);

ALTER TABLE projects_ongoing 
ADD CONSTRAINT fk_project_style 
FOREIGN KEY (project_style_id) REFERENCES project_styles(id);

ALTER TABLE projects_ongoing 
ADD CONSTRAINT fk_progress_status 
FOREIGN KEY (progress_status_id) REFERENCES progress_statuses(id);

-- Keep the old text columns for now (can be dropped later after testing)
-- ALTER TABLE projects_ongoing DROP COLUMN project_type;
-- ALTER TABLE projects_ongoing DROP COLUMN project_style;
-- ALTER TABLE projects_ongoing DROP COLUMN progress_status;
