// Script to apply the division removal migration
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Get the migration SQL
const migrationPath = path.join(__dirname, 'db/migrations/v1.0.0_remove_divisions.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Connect to the database
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the database.');
});

// Execute the migration as a single transaction
db.serialize(() => {
  db.run('BEGIN TRANSACTION;');
  
  // Create migrations table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Drop project_divisions junction table
  db.run(`DROP TABLE IF EXISTS project_divisions;`, (err) => {
    if (err) console.error('Error dropping project_divisions table:', err.message);
    else console.log('✓ Removed project_divisions table');
  });

  // Create users backup and move data
  db.run(`
    CREATE TABLE users_temp (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
  `);
  
  db.run(`INSERT INTO users_temp (id, name, email, password_hash)
    SELECT id, name, email, password_hash FROM users;
  `, (err) => {
    if (err) console.error('Error copying users data:', err.message);
    else console.log('✓ Copied users data to temporary table');
  });
  
  db.run(`DROP TABLE IF EXISTS users;`, (err) => {
    if (err) console.error('Error dropping users table:', err.message);
    else console.log('✓ Dropped original users table');
  });
  
  db.run(`ALTER TABLE users_temp RENAME TO users;`, (err) => {
    if (err) console.error('Error renaming users table:', err.message);
    else console.log('✓ Renamed temporary users table');
  });
  
  // Drop divisions table
  db.run(`DROP TABLE IF EXISTS divisions;`, (err) => {
    if (err) console.error('Error dropping divisions table:', err.message);
    else console.log('✓ Removed divisions table');
  });
  
  // Record migration
  db.run(`INSERT OR REPLACE INTO schema_migrations (version) VALUES ('v1.0.0_remove_divisions');`, (err) => {
    if (err) console.error('Error recording migration:', err.message);
    else console.log('✓ Recorded migration in schema_migrations table');
  });
  
  db.run('COMMIT;', (err) => {
    if (err) {
      console.error('Error committing transaction:', err.message);
      process.exit(1);
    }
    console.log('✓ Transaction committed successfully');
    console.log('\nMigration v1.0.0_remove_divisions completed successfully!');
    
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database connection:', err.message);
      }
      console.log('Database connection closed.');
    });
  });
});
