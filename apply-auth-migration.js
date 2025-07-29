// Script to apply the auth users migration
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Get the migration SQL
const migrationPath = path.join(__dirname, 'db/migrations/v1.0.6_create_auth_users_table.sql');
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
  
  // Apply the migration SQL statements manually to have more control
  
  // Create auth_users table
  db.run(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE CHECK(length(username) > 4),
      password_hash TEXT NOT NULL,
      email TEXT,
      full_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT,
      is_active INTEGER DEFAULT 1
    );
  `, (err) => {
    if (err) console.error('Error creating auth_users table:', err.message);
    else console.log('✓ Created auth_users table');
  });

  // Create roles table
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );
  `, (err) => {
    if (err) console.error('Error creating roles table:', err.message);
    else console.log('✓ Created roles table');
  });

  // Create user_roles table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      UNIQUE (user_id, role_id)
    );
  `, (err) => {
    if (err) console.error('Error creating user_roles table:', err.message);
    else console.log('✓ Created user_roles table');
  });

  // Insert default roles
  db.run(`
    INSERT OR IGNORE INTO roles (name, description) VALUES 
    ('admin', 'Administrator with full access'),
    ('manager', 'Manager with access to most features'),
    ('user', 'Standard user with limited access');
  `, (err) => {
    if (err) console.error('Error inserting default roles:', err.message);
    else console.log('✓ Inserted default roles');
  });
  
  // Record migration
  db.run(`INSERT OR REPLACE INTO schema_migrations (version) VALUES ('v1.0.6_create_auth_users_table');`, (err) => {
    if (err) console.error('Error recording migration:', err.message);
    else console.log('✓ Recorded migration in schema_migrations table');
  });
  
  db.run('COMMIT;', (err) => {
    if (err) {
      console.error('Error committing transaction:', err.message);
      process.exit(1);
    }
    console.log('✓ Transaction committed successfully');
    console.log('\nMigration v1.0.6_create_auth_users_table completed successfully!');
    
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database connection:', err.message);
      }
      console.log('Database connection closed.');
    });
  });
});
