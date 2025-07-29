-- Add a priority column to the projects table, allowing NULL values which will represent 'Not Set'.
ALTER TABLE projects
ADD COLUMN priority TEXT CHECK(priority IN ('Overdue', 'High', 'Medium', 'Low'));
