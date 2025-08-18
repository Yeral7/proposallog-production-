-- Fix all sequence issues at once
-- This script resets all sequences to prevent duplicate key violations

-- Fix projects sequence
SELECT setval('projects_id_seq', COALESCE((SELECT MAX(id) FROM projects), 0) + 1, false);

-- Fix builders sequence  
SELECT setval('builders_id_seq', COALESCE((SELECT MAX(id) FROM builders), 0) + 1, false);

-- Fix project_drawings sequence
SELECT setval('project_drawings_id_seq', COALESCE((SELECT MAX(id) FROM project_drawings), 0) + 1, false);

-- Fix estimators sequence (preventive)
SELECT setval('estimators_id_seq', COALESCE((SELECT MAX(id) FROM estimators), 0) + 1, false);

-- Fix supervisors sequence (preventive)
SELECT setval('supervisors_id_seq', COALESCE((SELECT MAX(id) FROM supervisors), 0) + 1, false);

-- Fix locations sequence (preventive)
SELECT setval('locations_id_seq', COALESCE((SELECT MAX(id) FROM locations), 0) + 1, false);

-- Fix statuses sequence (preventive)
SELECT setval('statuses_id_seq', COALESCE((SELECT MAX(id) FROM statuses), 0) + 1, false);

-- Fix users sequence (preventive)
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 0) + 1, false);

-- Fix audit_logs sequence (preventive)
SELECT setval('audit_logs_id_seq', COALESCE((SELECT MAX(id) FROM audit_logs), 0) + 1, false);

-- Fix residential_projects sequence (when table is created)
-- SELECT setval('residential_projects_id_seq', COALESCE((SELECT MAX(id) FROM residential_projects), 0) + 1, false);

SELECT 'All sequences fixed successfully' as status;

-- Verify all sequences
SELECT 'projects' as table_name, currval('projects_id_seq') as sequence_value, (SELECT MAX(id) FROM projects) as max_table_id
UNION ALL
SELECT 'builders', currval('builders_id_seq'), (SELECT MAX(id) FROM builders)
UNION ALL  
SELECT 'project_drawings', currval('project_drawings_id_seq'), (SELECT MAX(id) FROM project_drawings)
UNION ALL
SELECT 'estimators', currval('estimators_id_seq'), (SELECT MAX(id) FROM estimators)
UNION ALL
SELECT 'supervisors', currval('supervisors_id_seq'), (SELECT MAX(id) FROM supervisors)
UNION ALL
SELECT 'locations', currval('locations_id_seq'), (SELECT MAX(id) FROM locations)
UNION ALL
SELECT 'statuses', currval('statuses_id_seq'), (SELECT MAX(id) FROM statuses)
UNION ALL
SELECT 'users', currval('users_id_seq'), (SELECT MAX(id) FROM users)
UNION ALL
SELECT 'audit_logs', currval('audit_logs_id_seq'), (SELECT MAX(id) FROM audit_logs);
