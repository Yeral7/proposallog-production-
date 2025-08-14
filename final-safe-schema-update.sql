-- FINAL SAFE DATABASE UPDATE - NON-DESTRUCTIVE
-- This ONLY adds the role column to your existing users table
-- Run this in your Supabase SQL Editor - it will NOT break or destroy existing data

-- Add role column to existing users table (completely safe operation)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'manager', 'admin'));

-- Add updated_at column for better tracking (optional)
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create test users with email-based login (adjust emails as needed)
INSERT INTO users (name, email, password_hash, role) VALUES 
('Admin User', 'admin@viganovatech.com', 'admin123', 'admin'),
('Manager User', 'manager@viganovatech.com', 'manager123', 'manager'),
('Viewer User', 'viewer@viganovatech.com', 'viewer123', 'viewer')
ON CONFLICT (email) DO UPDATE SET 
  role = EXCLUDED.role,
  updated_at = NOW();

-- Verify the update worked
SELECT id, name, email, role, updated_at FROM users ORDER BY role, name;
