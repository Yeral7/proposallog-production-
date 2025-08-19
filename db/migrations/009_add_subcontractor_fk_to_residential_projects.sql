-- 1. Add the subcontractor_id column to the residential_projects table
ALTER TABLE public.residential_projects
ADD COLUMN subcontractor_id INTEGER;

-- 2. Add a foreign key constraint to the new column
ALTER TABLE public.residential_projects
ADD CONSTRAINT fk_subcontractor
FOREIGN KEY (subcontractor_id)
REFERENCES public.residential_subcontractors(id)
ON DELETE SET NULL;

-- 3. (Optional) Update existing records by matching names
-- This query attempts to populate the new subcontractor_id by matching the
-- existing subcontractor text field with a name in the residential_builders table.
UPDATE public.residential_projects rp
SET subcontractor_id = rs.id
FROM public.residential_subcontractors rs
WHERE rp.subcontractor = rs.name;
