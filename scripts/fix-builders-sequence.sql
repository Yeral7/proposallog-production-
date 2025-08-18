-- Fix builders sequence issue
-- This script resets the sequence to the correct value after the highest existing ID

-- Reset the sequence for builders table
-- This fixes the "duplicate key value violates unique constraint" error
SELECT setval('builders_id_seq', COALESCE((SELECT MAX(id) FROM builders), 0) + 1, false);

-- Verify the sequence is now correct
SELECT currval('builders_id_seq') as current_sequence_value;

-- Show current max ID in the table for comparison
SELECT MAX(id) as max_id_in_table FROM builders;

SELECT 'builders sequence fixed successfully' as status;
