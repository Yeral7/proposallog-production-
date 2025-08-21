-- Migration: Create residential_statuses table for residential projects
-- This migration is safe for PostgreSQL/Supabase

BEGIN;

-- 1) Table
CREATE TABLE IF NOT EXISTS public.residential_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Trigger to auto-update updated_at (only create if it doesn't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_residential_statuses_updated_at'
  ) THEN
    CREATE TRIGGER update_residential_statuses_updated_at
    BEFORE UPDATE ON public.residential_statuses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- 3) Seed defaults
INSERT INTO public.residential_statuses (name, display_order) VALUES
  ('Pending', 1),
  ('In Progress', 2),
  ('Completed', 3)
ON CONFLICT (name) DO NOTHING;

-- 4) Helpful index
CREATE INDEX IF NOT EXISTS idx_residential_statuses_display_order 
  ON public.residential_statuses(display_order);

COMMIT;
