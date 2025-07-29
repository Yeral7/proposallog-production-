// Script to reset the admin user with known credentials
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../db/database.sqlite');
console.log(`Connecting to database at: ${dbPath}`);

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected to database successfully');
});

// First, check if tables exist
db.serialize(() => {
  // Check if auth_users table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='auth_users'", (err, table) => {
    if (err || !table) {
      console.error('Error: auth_users table does not exist. Creating it now...');
      
      // Create auth_users table if it doesn't exist
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
        )
      `, (err) => {
        if (err) {
          console.error('Failed to create auth_users table:', err);
          db.close();
          return;
        }
        console.log('Created auth_users table');
        
        createRolesTables();
      });
    } else {
      console.log('auth_users table exists');
      resetAdminUser();
    }
  });
});

// Create roles tables if needed
function createRolesTables() {
  db.serialize(() => {
    // Create roles table
    db.run(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT
      )
    `, (err) => {
      if (err) {
        console.error('Failed to create roles table:', err);
        db.close();
        return;
      }
      console.log('Created roles table');
      
      // Create user_roles table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_roles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          role_id INTEGER NOT NULL,
          FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
          FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
          UNIQUE (user_id, role_id)
        )
      `, (err) => {
        if (err) {
          console.error('Failed to create user_roles table:', err);
          db.close();
          return;
        }
        console.log('Created user_roles table');
        
        // Insert default roles
        db.run(`
          INSERT OR IGNORE INTO roles (name, description) VALUES 
          ('admin', 'Administrator with full access'),
          ('manager', 'Manager with access to most features'),
          ('user', 'Standard user with limited access')
        `, (err) => {
          if (err) {
            console.error('Failed to insert default roles:', err);
            db.close();
            return;
          }
          console.log('Inserted default roles');
          
          resetAdminUser();
        });
      });
    });
  });
}

// Reset admin user
function resetAdminUser() {
  // Delete existing admin user if it exists
  db.run('DELETE FROM auth_users WHERE username = ?', ['admin'], (err) => {
    if (err) {
      console.error('Failed to delete existing admin user:', err);
      db.close();
      return;
    }
    
    // Create new admin user
    const username = 'admin';
    const password = 'admin123';
    
    db.run(
      `INSERT INTO auth_users (username, password_hash, email, full_name, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [username, password, 'admin@example.com', 'Admin User'],
      function(err) {
        if (err) {
          console.error('Failed to create admin user:', err);
          db.close();
          return;
        }
        
        const userId = this.lastID;
        console.log(`Created admin user with ID ${userId}`);
        
        // Add admin role
        db.get('SELECT id FROM roles WHERE name = ?', ['admin'], (err, role) => {
          if (err || !role) {
            console.error('Failed to find admin role:', err);
            db.close();
            return;
          }
          
          db.run(
            'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
            [userId, role.id],
            (err) => {
              if (err) {
                console.error('Failed to add admin role to user:', err);
              } else {
                console.log('Added admin role to user');
                console.log('\nAdmin user reset successfully:');
                console.log('- Username: admin');
                console.log('- Password: admin123');
              }
              
              // Verify login credentials
              db.get('SELECT id, username, password_hash FROM auth_users WHERE username = ?', 
                [username], (err, user) => {
                if (err || !user) {
                  console.error('Failed to verify admin user:', err);
                } else {
                  console.log('\nVerified admin user:');
                  console.log('- Username:', user.username);
                  console.log('- Password hash:', user.password_hash);
                  console.log('- Password match:', user.password_hash === password);
                }
                db.close();
              });
            }
          );
        });
      }
    );
  });
}
