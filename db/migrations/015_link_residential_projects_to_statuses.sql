BEGIN;

-- 1. Add the new status_id column to residential_projects
ALTER TABLE public.residential_projects
ADD COLUMN status_id INTEGER;

-- 2. Populate the new status_id column from the existing status text column
-- This assumes that all values in residential_projects.status exist in residential_statuses.name
UPDATE public.residential_projects
SET status_id = (
  SELECT id FROM public.residential_statuses
  WHERE name = public.residential_projects.status
);

-- For any statuses that didn't match, default them to 'Pending'
UPDATE public.residential_projects
SET status_id = (SELECT id FROM public.residential_statuses WHERE name = 'Pending')
WHERE status_id IS NULL;

-- 3. Add a foreign key constraint to link to the residential_statuses table
ALTER TABLE public.residential_projects
ADD CONSTRAINT fk_residential_status
FOREIGN KEY (status_id) REFERENCES public.residential_statuses(id);

-- 4. Make the new status_id column NOT NULL
ALTER TABLE public.residential_projects
ALTER COLUMN status_id SET NOT NULL;

-- 5. Drop the old text-based status column
ALTER TABLE public.residential_projects
DROP COLUMN status;

-- 6. Add an index for performance
CREATE INDEX IF NOT EXISTS idx_residential_projects_status_id 
  ON public.residential_projects(status_id);

COMMIT;
