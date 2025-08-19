-- Step 1: Add the new builder_id column to the residential_projects table
ALTER TABLE residential_projects ADD COLUMN builder_id INTEGER;

-- Step 2: Populate the new builder_id column by matching names
UPDATE residential_projects
SET builder_id = (SELECT id FROM residential_builders WHERE residential_builders.name = residential_projects.builder);

-- Step 3: Add the foreign key constraint
ALTER TABLE residential_projects
ADD CONSTRAINT fk_builder
FOREIGN KEY (builder_id)
REFERENCES residential_builders(id);

-- Note: The old 'builder' column will be removed in a future migration after updating the application logic.
