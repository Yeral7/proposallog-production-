// Simple script to seed a test admin user
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('Starting admin user seeding process...');

// Connect to the correct database
const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected to database.db successfully');
});

// Create test admin user
const username = 'admin';
const password = 'admin123';

db.serialize(() => {
  // Check if user already exists
  db.get('SELECT id FROM auth_users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Error checking for existing user:', err.message);
      db.close();
      return;
    }
    
    if (user) {
      console.log(`User '${username}' already exists. Updating password...`);
      // Update existing user's password
      db.run(
        'UPDATE auth_users SET password_hash = ? WHERE username = ?',
        [password, username],
        function(err) {
          if (err) {
            console.error('Error updating user password:', err.message);
          } else {
            console.log(`Updated password for user '${username}'`);
          }
          
          ensureAdminRole(user.id);
        }
      );
    } else {
      // Create new user
      db.run(
        `INSERT INTO auth_users (username, password_hash, email, full_name, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [username, password, 'admin@example.com', 'Administrator'],
        function(err) {
          if (err) {
            console.error('Error creating admin user:', err.message);
            db.close();
            return;
          }
          
          const userId = this.lastID;
          console.log(`Created new admin user with ID ${userId}`);
          
          ensureAdminRole(userId);
        }
      );
    }
  });
});

// Make sure user has admin role
function ensureAdminRole(userId) {
  // Get admin role ID
  db.get('SELECT id FROM roles WHERE name = ?', ['admin'], (err, role) => {
    if (err || !role) {
      console.error('Error finding admin role:', err ? err.message : 'Admin role not found');
      db.close();
      return;
    }
    
    // Check if user already has role
    db.get(
      'SELECT id FROM user_roles WHERE user_id = ? AND role_id = ?',
      [userId, role.id],
      (err, userRole) => {
        if (err) {
          console.error('Error checking user role:', err.message);
          db.close();
          return;
        }
        
        if (!userRole) {
          // Add role to user
          db.run(
            'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
            [userId, role.id],
            (err) => {
              if (err) {
                console.error('Error adding admin role to user:', err.message);
              } else {
                console.log('Added admin role to user');
              }
              
              printUserInfo();
            }
          );
        } else {
          console.log('User already has admin role');
          printUserInfo();
        }
      }
    );
  });
}

// Print user info for verification
function printUserInfo() {
  db.get(
    `SELECT u.id, u.username, u.password_hash, GROUP_CONCAT(r.name) as roles 
     FROM auth_users u
     LEFT JOIN user_roles ur ON u.id = ur.user_id
     LEFT JOIN roles r ON ur.role_id = r.id
     WHERE u.username = ?
     GROUP BY u.id`,
    [username],
    (err, user) => {
      if (err || !user) {
        console.error('Error retrieving user info:', err ? err.message : 'User not found');
      } else {
        console.log('\n====== TEST USER CREATED SUCCESSFULLY ======');
        console.log('Username:', user.username);
        console.log('Password:', password);
        console.log('Stored password hash:', user.password_hash);
        console.log('Roles:', user.roles || 'none');
        console.log('===========================================');
      }
      
      db.close((err) => {
        if (err) {
          console.error('Error closing database connection:', err.message);
        }
        console.log('Database connection closed.');
      });
    }
  );
}
