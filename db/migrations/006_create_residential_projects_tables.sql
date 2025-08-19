-- Create residential projects table
CREATE TABLE IF NOT EXISTS residential_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_name TEXT NOT NULL,
  builder TEXT,
  subcontractor TEXT,
  start_date TEXT,
  est_completion_date TEXT,
  contract_value REAL,
  status TEXT DEFAULT 'Pending',
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER,
  updated_at DATETIME,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create residential project contacts table
CREATE TABLE IF NOT EXISTS residential_project_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  role TEXT,
  phone TEXT,
  email TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER,
  updated_at DATETIME,
  FOREIGN KEY (project_id) REFERENCES residential_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create residential project drawings table
CREATE TABLE IF NOT EXISTS residential_project_drawings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  drawing_name TEXT NOT NULL,
  drawing_number TEXT,
  drawing_type TEXT,
  drawing_date TEXT,
  drawing_url TEXT,
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER,
  updated_at DATETIME,
  FOREIGN KEY (project_id) REFERENCES residential_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create residential project notes table
CREATE TABLE IF NOT EXISTS residential_project_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  note_text TEXT NOT NULL,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER,
  updated_at DATETIME,
  FOREIGN KEY (project_id) REFERENCES residential_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_residential_projects_status ON residential_projects(status);
CREATE INDEX IF NOT EXISTS idx_residential_project_contacts_project ON residential_project_contacts(project_id);
CREATE INDEX IF NOT EXISTS idx_residential_project_drawings_project ON residential_project_drawings(project_id);
CREATE INDEX IF NOT EXISTS idx_residential_project_notes_project ON residential_project_notes(project_id);
