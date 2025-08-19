-- Add the user_id column to project_notes
ALTER TABLE project_notes
ADD COLUMN user_id INTEGER;

-- Update existing notes to a default user or handle as needed
-- For example, setting them to a specific admin user ID, here assumed to be 1
-- UPDATE project_notes SET user_id = 1 WHERE user_id IS NULL;

-- Add the foreign key constraint to link to the users table
ALTER TABLE project_notes
ADD CONSTRAINT fk_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE SET NULL; -- Or ON DELETE CASCADE, depending on desired behavior

-- Drop the old author column
ALTER TABLE project_notes
DROP COLUMN author;
