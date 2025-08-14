-- Create audit_log table for tracking all user actions
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  page VARCHAR(100) NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_username ON audit_log(username);
CREATE INDEX IF NOT EXISTS idx_audit_log_page ON audit_log(page);

-- Insert some sample data for testing (optional)
-- INSERT INTO audit_log (username, email, page, action) VALUES 
-- ('admin', 'admin@example.com', 'Data Management', 'Added new builder: "ABC Construction"'),
-- ('manager', 'manager@example.com', 'Proposal Log', 'Deleted project: "Office Building"'),
-- ('admin', 'admin@example.com', 'Data Management', 'Deleted estimator: "John Smith"');

-- Verify table creation
SELECT 'audit_log table created successfully' as status;
