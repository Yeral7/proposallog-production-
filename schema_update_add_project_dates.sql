-- Schema update to add submission_date and follow_up_date columns to projects table
-- These columns will be nullable as existing projects don't have these values yet

-- Add submission_date column (nullable)
ALTER TABLE projects ADD COLUMN submission_date TEXT;

-- Add follow_up_date column (nullable) 
ALTER TABLE projects ADD COLUMN follow_up_date TEXT;

-- Verify the table structure after adding columns
-- (This is just for reference, uncomment if you want to see the structure)
-- PRAGMA table_info(projects);
