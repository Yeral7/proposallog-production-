-- Add role column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer';

-- Create test users with different roles for testing
-- (Replace with your actual user IDs or create new test users)

-- Example: Update existing users with roles
-- UPDATE users SET role = 'admin' WHERE email = 'admin@company.com';
-- UPDATE users SET role = 'manager' WHERE email = 'manager@company.com';  
-- UPDATE users SET role = 'viewer' WHERE email = 'viewer@company.com';

-- Or insert new test users (adjust as needed)
INSERT INTO users (name, email, password_hash, role) VALUES 
('Admin User', 'admin@test.com', 'admin123', 'admin'),
('Manager User', 'manager@test.com', 'manager123', 'manager'),
('Viewer User', 'viewer@test.com', 'viewer123', 'viewer')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- Verify the setup
SELECT id, name, email, role FROM users ORDER BY role, name;
