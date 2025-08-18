-- Create residential_projects table for residential project management
-- This table mirrors the proposal log functionality but for residential projects
-- Only shares the 'statuses' table with the main projects table

CREATE TABLE residential_projects (
  id SERIAL PRIMARY KEY,
  residential_project_name VARCHAR(255) NOT NULL,
  builder_id INTEGER REFERENCES builders(id),
  builder VARCHAR(255), -- Denormalized for display
  subcontractor VARCHAR(255),
  notes TEXT,
  start_date DATE,
  est_completion_date DATE,
  contract_value DECIMAL(12,2),
  status_id INTEGER REFERENCES statuses(id),
  status VARCHAR(100), -- Denormalized for display
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_residential_projects_builder_id ON residential_projects(builder_id);
CREATE INDEX IF NOT EXISTS idx_residential_projects_status_id ON residential_projects(status_id);
CREATE INDEX IF NOT EXISTS idx_residential_projects_start_date ON residential_projects(start_date);
CREATE INDEX IF NOT EXISTS idx_residential_projects_created_at ON residential_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_residential_projects_name ON residential_projects(residential_project_name);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_residential_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_residential_projects_updated_at
  BEFORE UPDATE ON residential_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_residential_projects_updated_at();

-- Insert sample data for testing (optional)
INSERT INTO residential_projects (
  residential_project_name, 
  builder, 
  subcontractor, 
  notes, 
  start_date, 
  est_completion_date, 
  contract_value, 
  status
) VALUES 
('Sample Residential Home A', 'ABC Builders', 'XYZ Roofing', 'Initial residential project', '2024-01-15', '2024-06-15', 250000.00, 'In Progress'),
('Sample Residential Home B', 'DEF Construction', 'ABC Electrical', 'Second residential project', '2024-02-01', '2024-08-01', 180000.00, 'Planning');

SELECT 'residential_projects table created successfully' as status;

-- Verify table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'residential_projects' 
ORDER BY ordinal_position;
