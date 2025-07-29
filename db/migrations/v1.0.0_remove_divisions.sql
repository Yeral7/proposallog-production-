-- Schema migration v1.0.0: Remove division functionality
-- This script carefully removes only division-related tables and fields while preserving all other data

-- Start transaction to ensure all changes are applied atomically
BEGIN TRANSACTION;

-- Track migration in a migrations table (create if not exists)
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Step 1: Remove project_divisions junction table
-- This only affects the division associations, not the projects themselves
DROP TABLE IF EXISTS project_divisions;

-- Step 2: Create a safe copy of users table without the division_id column
CREATE TABLE users_temp (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);

-- Copy all user data except division_id to preserve all user information
INSERT INTO users_temp (id, name, email, password_hash)
SELECT id, name, email, password_hash FROM users;

-- Drop the original users table
DROP TABLE IF EXISTS users;

-- Rename temporary table back to users
ALTER TABLE users_temp RENAME TO users;

-- Step 3: Remove the divisions table itself
DROP TABLE IF EXISTS divisions;

-- Record this migration
INSERT OR REPLACE INTO schema_migrations (version) VALUES ('v1.0.0_remove_divisions');

-- Commit the transaction
COMMIT;

-- Output confirmation message
SELECT 'Migration v1.0.0: Division tables and fields successfully removed while preserving all other data' AS message;
