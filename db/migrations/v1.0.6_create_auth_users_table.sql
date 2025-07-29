-- This migration adds a dedicated auth_users table for authentication
-- with username and password validation constraints:
-- - Username must be longer than 4 characters
-- - Password must have minimum 5 letters and minimum 1 number

-- Create auth_users table
CREATE TABLE auth_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT,
    full_name TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT,
    is_active INTEGER DEFAULT 1,
    CONSTRAINT username_length_check CHECK (length(username) > 4),
    -- SQLite doesn't support complex regex validation via CHECK constraints
    -- Password validation will be enforced in application code
    -- But we add basic length check here
    CONSTRAINT password_min_length CHECK (length(password_hash) >= 60)
);

-- Create a roles table for user permissions
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- Create user_roles for many-to-many relationship
CREATE TABLE user_roles (
    user_id INTEGER,
    role_id INTEGER,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
    ('admin', 'Administrator with full access'),
    ('manager', 'Manager with access to most features'),
    ('user', 'Standard user with limited access');

-- Note: Password validation requirements (minimum 5 letters and minimum 1 number)
-- will be enforced in the application code when registering users or changing passwords.
-- This is because SQLite CHECK constraints have limited regex support.
