-- Migration to allow NULL values in the 'title' column of the 'project_contacts' table.
-- This is necessary to make the contact's title an optional field.

-- Disable foreign key checks to avoid constraint errors during the migration.
PRAGMA foreign_keys=off;

-- Begin a transaction to ensure the migration is atomic.
BEGIN TRANSACTION;

-- Create a new temporary table with the desired schema, allowing NULL for the 'title' column.
CREATE TABLE IF NOT EXISTS "project_contacts_new" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "project_id" INTEGER NOT NULL,
  "title" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  "updated_at" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE
);

-- Copy the data from the old 'project_contacts' table to the new temporary table.
-- Any existing NULL titles will be preserved.
INSERT INTO project_contacts_new (id, project_id, title, name, email, phone, created_at, updated_at)
SELECT id, project_id, title, name, email, phone, created_at, updated_at
FROM project_contacts;

-- Drop the old 'project_contacts' table as it is no longer needed.
DROP TABLE project_contacts;

-- Rename the new temporary table to the original table name.
ALTER TABLE project_contacts_new RENAME TO project_contacts;

-- Commit the transaction to apply all changes.
COMMIT;

-- Re-enable foreign key checks.
PRAGMA foreign_keys=on;
