-- Schema update to remove all division-related tables and fields
-- This script removes the division functionality from the database

-- First, drop the project_divisions junction table (contains foreign keys to both tables)
DROP TABLE IF EXISTS project_divisions;

-- Next, drop the divisions table
DROP TABLE IF EXISTS divisions;

-- Remove division_id foreign key from users table
-- First create a temporary table without the division_id column
CREATE TABLE users_temp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);

-- Copy data from users to temporary table
INSERT INTO users_temp (id, name, email, password_hash)
SELECT id, name, email, password_hash FROM users;

-- Drop the original table
DROP TABLE IF EXISTS users;

-- Rename temporary table back to users
ALTER TABLE users_temp RENAME TO users;

-- Add indexes or additional constraints if needed
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Output confirmation message
SELECT 'Division tables and fields successfully removed' AS message;
