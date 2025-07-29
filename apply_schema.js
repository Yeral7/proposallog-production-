const fs = require('fs');
const { getDb } = require('./lib/db.js');

async function applySchema() {
  try {
    console.log('Reading schema file...');
    const schema = fs.readFileSync('./schema_update_project_details.sql', 'utf8');
    
    console.log('Connecting to database...');
    const db = await getDb();
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (const stmt of statements) {
      try {
        await db.exec(stmt);
        console.log(`Successfully executed: ${stmt.substring(0, 40)}...`);
      } catch (error) {
        console.error(`Error executing statement: ${stmt}`);
        console.error(error);
        // Continue with other statements even if one fails
      }
    }
    
    console.log('Schema update complete!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to apply schema:', error);
    process.exit(1);
  }
}

// Run the function
applySchema();
