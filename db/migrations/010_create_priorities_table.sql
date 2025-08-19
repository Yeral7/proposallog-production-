-- Create priorities table
CREATE TABLE IF NOT EXISTS public.priorities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    color VARCHAR(7), -- For hex color codes like #FF0000
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the exact same priority values used in AddProjectModal
INSERT INTO public.priorities (name, display_order, color) VALUES
    ('Not Set', 0, '#6B7280'),  -- Gray
    ('Low', 1, '#10B981'),      -- Green
    ('Medium', 2, '#F59E0B'),   -- Yellow/Orange  
    ('High', 3, '#EF4444'),     -- Red
    ('Overdue', 4, '#DC2626')   -- Dark Red
ON CONFLICT (name) DO NOTHING;

-- Add foreign key to projects table (main projects, not residential)
-- First, add the priority_id column if it doesn't exist
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS priority_id INTEGER REFERENCES public.priorities(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_priority_id 
ON public.projects(priority_id);

-- Update existing projects to link their text priorities to the new priority IDs
-- Handle NULL/empty priorities as 'Not Set'
UPDATE public.projects 
SET priority_id = p.id 
FROM public.priorities p 
WHERE (
    (public.projects.priority IS NULL OR public.projects.priority = '') AND p.name = 'Not Set'
) OR (
    LOWER(public.projects.priority) = LOWER(p.name)
)
AND public.projects.priority_id IS NULL;
