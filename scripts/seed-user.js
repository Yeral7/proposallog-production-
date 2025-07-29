// Simple script to seed a test user for authentication testing
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../db/database.sqlite');
console.log(`Connecting to database at ${dbPath}`);

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected to database successfully');
});

// Check if auth_users table exists
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='auth_users'", (err, row) => {
  if (err) {
    console.error('Error checking for auth_users table:', err);
    db.close();
    return;
  }
  
  if (!row) {
    console.error('Auth tables not found. Please run migrations first.');
    db.close();
    return;
  }

  // Check if roles table exists and has data
  db.get("SELECT id FROM roles WHERE name='admin' LIMIT 1", (err, role) => {
    if (err || !role) {
      console.log('Creating roles first...');
      db.run(`INSERT INTO roles (name, description) VALUES 
        ('admin', 'Administrator with full access'),
        ('manager', 'Manager with access to most features'),
        ('user', 'Standard user with limited access')`, seedUser);
    } else {
      seedUser();
    }
  });
});

function seedUser() {
  // Check if test user already exists
  db.get('SELECT id FROM auth_users WHERE username = ?', ['admin'], (err, user) => {
    if (err) {
      console.error('Error checking for existing user:', err);
      db.close();
      return;
    }
    
    if (user) {
      console.log('Test user already exists:');
      console.log('Username: admin');
      console.log('Password: admin123');
      db.close();
      return;
    }
    
    // Create test user
    db.run(
      `INSERT INTO auth_users (
        username, password_hash, email, full_name, created_at
      ) VALUES (?, ?, ?, ?, datetime('now'))`,
      ['admin', 'admin123', 'admin@example.com', 'Admin User'],
      function(err) {
        if (err) {
          console.error('Error creating test user:', err);
          db.close();
          return;
        }
        
        const userId = this.lastID;
        
        // Add admin role
        db.run(
          'INSERT INTO user_roles (user_id, role_id) SELECT ?, id FROM roles WHERE name = "admin"',
          [userId],
          (err) => {
            if (err) {
              console.error('Error adding admin role to user:', err);
            } else {
              console.log('Test user created successfully:');
              console.log('Username: admin');
              console.log('Password: admin123');
            }
            db.close();
          }
        );
      }
    );
  });
}
