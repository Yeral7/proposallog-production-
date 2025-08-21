-- Create separate tables for project metadata
CREATE TABLE IF NOT EXISTS project_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_styles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS progress_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default values
INSERT INTO project_types (name) VALUES 
    ('Commercial'),
    ('Residential'),
    ('Industrial'),
    ('Infrastructure'),
    ('Renovation'),
    ('New Construction')
ON CONFLICT (name) DO NOTHING;

INSERT INTO project_styles (name) VALUES 
    ('Traditional'),
    ('Modern'),
    ('Contemporary'),
    ('Industrial'),
    ('Mixed-Use'),
    ('Custom')
ON CONFLICT (name) DO NOTHING;

INSERT INTO progress_statuses (name, display_order) VALUES 
    ('N/A', 1),
    ('Planning', 2),
    ('In Progress', 3),
    ('On Hold', 4),
    ('Delayed', 5),
    ('Nearly Complete', 6)
ON CONFLICT (name) DO NOTHING;

-- Migrate existing data from projects_ongoing
-- First, insert any existing project_type values that aren't already in the table
INSERT INTO project_types (name)
SELECT DISTINCT project_type 
FROM projects_ongoing 
WHERE project_type IS NOT NULL 
  AND project_type != '' 
  AND project_type NOT IN (SELECT name FROM project_types);

-- Insert any existing project_style values
INSERT INTO project_styles (name)
SELECT DISTINCT project_style 
FROM projects_ongoing 
WHERE project_style IS NOT NULL 
  AND project_style != '' 
  AND project_style NOT IN (SELECT name FROM project_styles);

-- Insert any existing progress_status values
INSERT INTO progress_statuses (name)
SELECT DISTINCT progress_status 
FROM projects_ongoing 
WHERE progress_status IS NOT NULL 
  AND progress_status != '' 
  AND progress_status NOT IN (SELECT name FROM progress_statuses);
