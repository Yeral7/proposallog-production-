// Script to test database connection and verify user exists
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../db/database.sqlite');
console.log(`Testing database connection to: ${dbPath}`);

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
  console.log('✓ Connected to database successfully');
});

// Check if auth_users table exists
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='auth_users'", (err, row) => {
  if (err) {
    console.error('Error checking for auth_users table:', err);
    db.close();
    return;
  }
  
  if (!row) {
    console.error('❌ Auth tables not found. Please run migrations first.');
    db.close();
    return;
  }
  
  console.log('✓ Auth users table exists');
  
  // Check if admin user exists
  db.get('SELECT id, username, password_hash FROM auth_users WHERE username = ?', ['admin'], (err, user) => {
    if (err) {
      console.error('Error querying for admin user:', err);
      db.close();
      return;
    }
    
    if (!user) {
      console.error('❌ Admin user not found. Please run seed script.');
      db.close();
      return;
    }
    
    console.log('✓ Admin user found:');
    console.log('  - Username:', user.username);
    console.log('  - Password hash:', user.password_hash);
    
    // Test login with admin123
    const testPassword = 'admin123';
    console.log(`Testing password match: '${testPassword}' vs '${user.password_hash}'`);
    console.log('  - Direct comparison result:', user.password_hash === testPassword);
    
    db.close(() => {
      console.log('Database connection closed.');
    });
  });
});
