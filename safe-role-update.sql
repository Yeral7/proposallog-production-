-- SAFE Role Column Addition - NON-DESTRUCTIVE
-- This only adds the role column to your existing users table
-- Run this in Supabase SQL Editor - it will NOT break existing data

-- Add role column to existing users table (safe operation)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'manager', 'admin'));

-- Update existing users with default roles (optional - you can do this manually)
-- UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@domain.com';
-- UPDATE users SET role = 'manager' WHERE email = 'your-manager-email@domain.com';

-- Verify the update worked
SELECT id, name, email, role FROM users;
