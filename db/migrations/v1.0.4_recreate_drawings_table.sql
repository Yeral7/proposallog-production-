-- Migration to drop and recreate the 'project_drawings' table with the correct schema.

BEGIN TRANSACTION;

-- Drop the old, incorrect table if it exists.
DROP TABLE IF EXISTS project_drawings;

-- Create the 'project_drawings' table with the correct columns.
CREATE TABLE "project_drawings" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "project_id" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  "updated_at" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE
);

COMMIT;
