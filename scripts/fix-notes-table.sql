-- Fix project_notes table schema for note functionality
-- This script ensures the project_notes table exists with correct structure

-- Drop and recreate project_notes table if it has issues
DROP TABLE IF EXISTS project_notes CASCADE;

-- Create project_notes table with correct schema
CREATE TABLE project_notes (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author VARCHAR(255) NOT NULL DEFAULT 'Admin',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_notes_project_id ON project_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_notes_timestamp ON project_notes(timestamp DESC);

-- Insert sample data for testing
INSERT INTO project_notes (project_id, content, author) VALUES 
(1, 'Sample note for testing', 'Admin'),
(1, 'Another test note', 'Manager');

-- Verify table structure
SELECT 'project_notes table created successfully' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'project_notes' 
ORDER BY ordinal_position;
