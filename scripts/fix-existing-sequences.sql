-- Fix sequences for existing tables only
-- This script resets sequences to prevent duplicate key violations

-- Fix projects sequence
SELECT setval('projects_id_seq', COALESCE((SELECT MAX(id) FROM projects), 0) + 1, false);

-- Fix builders sequence  
SELECT setval('builders_id_seq', COALESCE((SELECT MAX(id) FROM builders), 0) + 1, false);

-- Fix project_drawings sequence
SELECT setval('project_drawings_id_seq', COALESCE((SELECT MAX(id) FROM project_drawings), 0) + 1, false);

-- Fix project_notes sequence
SELECT setval('project_notes_id_seq', COALESCE((SELECT MAX(id) FROM project_notes), 0) + 1, false);

-- Fix project_contacts sequence
SELECT setval('project_contacts_id_seq', COALESCE((SELECT MAX(id) FROM project_contacts), 0) + 1, false);

-- Fix estimators sequence
SELECT setval('estimators_id_seq', COALESCE((SELECT MAX(id) FROM estimators), 0) + 1, false);

-- Fix supervisors sequence
SELECT setval('supervisors_id_seq', COALESCE((SELECT MAX(id) FROM supervisors), 0) + 1, false);

-- Fix locations sequence
SELECT setval('locations_id_seq', COALESCE((SELECT MAX(id) FROM locations), 0) + 1, false);

-- Fix statuses sequence
SELECT setval('statuses_id_seq', COALESCE((SELECT MAX(id) FROM statuses), 0) + 1, false);

-- Fix users sequence
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 0) + 1, false);

-- Fix audit_log sequence (correct table name)
SELECT setval('audit_log_id_seq', COALESCE((SELECT MAX(id) FROM audit_log), 0) + 1, false);

SELECT 'Existing sequences fixed successfully' as status;

-- Verify sequences (using last_value instead of currval to avoid session issues)
SELECT 'projects' as table_name, last_value as sequence_value, (SELECT MAX(id) FROM projects) as max_table_id
FROM projects_id_seq
UNION ALL
SELECT 'builders', last_value, (SELECT MAX(id) FROM builders)
FROM builders_id_seq
UNION ALL  
SELECT 'project_drawings', last_value, (SELECT MAX(id) FROM project_drawings)
FROM project_drawings_id_seq
UNION ALL
SELECT 'project_notes', last_value, (SELECT MAX(id) FROM project_notes)
FROM project_notes_id_seq
UNION ALL
SELECT 'project_contacts', last_value, (SELECT MAX(id) FROM project_contacts)
FROM project_contacts_id_seq
UNION ALL
SELECT 'estimators', last_value, (SELECT MAX(id) FROM estimators)
FROM estimators_id_seq
UNION ALL
SELECT 'supervisors', last_value, (SELECT MAX(id) FROM supervisors)
FROM supervisors_id_seq
UNION ALL
SELECT 'locations', last_value, (SELECT MAX(id) FROM locations)
FROM locations_id_seq
UNION ALL
SELECT 'statuses', last_value, (SELECT MAX(id) FROM statuses)
FROM statuses_id_seq
UNION ALL
SELECT 'users', last_value, (SELECT MAX(id) FROM users)
FROM users_id_seq
UNION ALL
SELECT 'audit_log', last_value, (SELECT MAX(id) FROM audit_log)
FROM audit_log_id_seq;
