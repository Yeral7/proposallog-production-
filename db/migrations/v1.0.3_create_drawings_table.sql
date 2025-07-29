-- Migration to create the 'project_drawings' table.
-- This table will store drawing information associated with projects.

-- Begin a transaction to ensure the migration is atomic.
BEGIN TRANSACTION;

-- Create the 'project_drawings' table.
CREATE TABLE IF NOT EXISTS "project_drawings" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "project_id" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  "updated_at" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE
);

-- Commit the transaction to apply all changes.
COMMIT;
