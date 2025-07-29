const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs').promises;
const path = require('path');

const dbPath = path.resolve(__dirname, 'database_backup.db');
const schemaUpdatePath = path.resolve(__dirname, 'schema_update_add_project_dates.sql');

async function runMigration() {
  let db;
  try {
    console.log(`Connecting to database at: ${dbPath}`);
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('✓ Connected to the database.');

    console.log(`Reading schema update from: ${schemaUpdatePath}`);
    const schemaUpdate = await fs.readFile(schemaUpdatePath, 'utf8');
    
    // Remove comments and split into statements
    const statements = schemaUpdate
      .replace(/--.*$/gm, '') // Remove comments
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    if (statements.length === 0) {
      console.log('No SQL statements to execute.');
      return;
    }

    console.log('Applying schema updates...');
    for (const [index, statement] of statements.entries()) {
      await db.run(statement);
      console.log(`✓ Statement ${index + 1} executed successfully: ${statement}`);
    }

    console.log('\nVerifying table structure...');
    const rows = await db.all("PRAGMA table_info(projects)");
    console.log('Updated projects table structure:');
    rows.forEach(row => {
      console.log(`- ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\nSchema update completed successfully!');

  } catch (err) {
    console.error('\n--- MIGRATION FAILED ---');
    console.error(err.message);
  } finally {
    if (db) {
      await db.close();
      console.log('\nDatabase connection closed.');
    }
  }
}

runMigration();
