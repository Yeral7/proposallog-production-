-- Only add the role column - DO NOT insert duplicate users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'manager', 'admin'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing users with roles (change these emails to match your actual users)
-- UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@domain.com';
-- UPDATE users SET role = 'manager' WHERE email = 'your-manager-email@domain.com';

-- Check what users you have now
SELECT id, name, email, role FROM users ORDER BY id;
