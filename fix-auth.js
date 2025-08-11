// Quick fix script to ensure auth tables exist and admin user is created
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('Starting auth fix process...');

// Connect directly to the database.db file in the root
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected to database.db successfully');
});

// Execute everything in a single transaction for consistency
db.serialize(() => {
  db.run('BEGIN TRANSACTION;');

  // 1. Create the auth tables if they don't exist
  console.log('Creating auth tables if needed...');
  
  // Create auth_users table
  db.run(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      email TEXT,
      full_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT,
      is_active INTEGER DEFAULT 1
    );
  `);

  // Create roles table
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );
  `);

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
  `);

  // 2. Insert default roles
  db.run(`
    INSERT OR IGNORE INTO roles (name, description) VALUES 
    ('admin', 'Administrator with full access'),
    ('manager', 'Manager with access to most features'),
    ('user', 'Standard user with limited access');
  `);

  // 3. Delete existing admin user to avoid conflicts
  db.run('DELETE FROM auth_users WHERE username = ?', ['admin'], function(err) {
    if (err) {
      console.error('Error deleting existing admin user:', err.message);
    } else if (this.changes > 0) {
      console.log('Removed existing admin user');
    }
  });

  // 4. Create fresh admin user
  const username = 'admin';
  const password = 'admin123';
  
  db.run(
    `INSERT INTO auth_users (username, password_hash, email, full_name, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [username, password, 'admin@example.com', 'Administrator'],
    function(err) {
      if (err) {
        console.error('Error creating admin user:', err.message);
      } else {
        const userId = this.lastID;
        console.log(`Created admin user with ID ${userId}`);
        
        // 5. Add admin role to the user
        db.run(
          'INSERT INTO user_roles (user_id, role_id) SELECT ?, id FROM roles WHERE name = ?',
          [userId, 'admin']
        );
      }
    }
  );

  // 6. Verify the setup
  db.get('SELECT id, username, password_hash FROM auth_users WHERE username = ?', ['admin'], (err, row) => {
    if (err) {
      console.error('Error verifying admin user:', err.message);
    } else if (row) {
      console.log('\n✓ Admin user verified:');
      console.log('  - Username:', row.username);
      console.log('  - Password hash:', row.password_hash);
      console.log('  - Login with: admin / admin123');
    } else {
      console.error('Admin user not found after creation attempt!');
    }
  });

  // Commit the transaction
  db.run('COMMIT;', (err) => {
    if (err) {
      console.error('Error committing transaction:', err.message);
    } else {
      console.log('Changes committed successfully');
    }
    
    db.close((err) => {
      if (err) {
        console.error('Error closing database connection:', err.message);
      }
      console.log('Database connection closed');
    });
  });
});
