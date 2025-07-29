const { getDb } = require('./lib/db.js');

async function runSchemaUpdate() {
  try {
    const db = await getDb();
    
    // Check if supervisors table exists
    const tableExists = await db.get(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='supervisors'
    `);
    
    if (!tableExists) {
      console.log('Creating supervisors table...');
      
      // Create supervisors table
      await db.run(`
        CREATE TABLE IF NOT EXISTS supervisors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
        )
      `);
      
      // Add supervisor_id column to projects table if it doesn't exist
      try {
        await db.run(`
          SELECT supervisor_id FROM projects LIMIT 1
        `);
        console.log('supervisor_id column already exists in projects table');
      } catch (e) {
        console.log('Adding supervisor_id column to projects table...');
        await db.run(`
          ALTER TABLE projects
          ADD COLUMN supervisor_id INTEGER
          REFERENCES supervisors(id)
        `);
      }
      
      // Insert sample supervisors
      console.log('Inserting sample supervisors...');
      await db.run(`INSERT INTO supervisors (name) VALUES ('John Smith')`);
      await db.run(`INSERT INTO supervisors (name) VALUES ('Maria Garcia')`);
      await db.run(`INSERT INTO supervisors (name) VALUES ('Robert Chen')`);
      await db.run(`INSERT INTO supervisors (name) VALUES ('Sarah Johnson')`);
      await db.run(`INSERT INTO supervisors (name) VALUES ('David Patel')`);
      
      console.log('Schema update completed successfully');
    } else {
      console.log('Supervisors table already exists');
    }
    
  } catch (error) {
    console.error('Error updating schema:', error);
  }
}

runSchemaUpdate();
