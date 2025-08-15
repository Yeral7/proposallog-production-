-- Fix project_drawings sequence issue
-- This script resets the sequence to the correct value after the highest existing ID

-- Reset the sequence for project_drawings table
-- This fixes the "duplicate key value violates unique constraint" error
SELECT setval('project_drawings_id_seq', COALESCE((SELECT MAX(id) FROM project_drawings), 0) + 1, false);

-- Verify the sequence is now correct
SELECT currval('project_drawings_id_seq') as current_sequence_value;

-- Show current max ID in the table for comparison
SELECT MAX(id) as max_id_in_table FROM project_drawings;

-- Test insert to verify it works (optional - remove if you don't want test data)
-- INSERT INTO project_drawings (project_id, title, url) VALUES (1, 'Test Drawing', 'https://example.com/test.pdf');

SELECT 'project_drawings sequence fixed successfully' as status;
