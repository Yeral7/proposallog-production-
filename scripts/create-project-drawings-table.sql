-- Create project_drawings table for storing project drawings/blueprints
-- This script ensures the project_drawings table exists with correct structure

-- Drop and recreate project_drawings table if it has issues
DROP TABLE IF EXISTS project_drawings CASCADE;

-- Create project_drawings table with correct schema
CREATE TABLE project_drawings (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_drawings_project_id ON project_drawings(project_id);
CREATE INDEX IF NOT EXISTS idx_project_drawings_created_at ON project_drawings(created_at DESC);

-- Insert sample data for testing (optional)
-- INSERT INTO project_drawings (project_id, title, url) VALUES 
-- (1, 'Floor Plan', 'https://example.com/floor-plan.pdf'),
-- (1, 'Site Plan', 'https://example.com/site-plan.pdf'),
-- (2, 'Elevation Drawing', 'https://example.com/elevation.pdf');

SELECT 'project_drawings table created successfully' as status;

-- Verify table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'project_drawings' 
ORDER BY ordinal_position;
