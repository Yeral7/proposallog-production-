ALTER TABLE projects
ADD COLUMN lost_reason_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
