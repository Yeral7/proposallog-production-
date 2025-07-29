const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

let db = null;
let connectionError = null;

async function getDb() {
  // If we have a connection already, return it
  if (db) {
    return db;
  }

  // If we've previously encountered an error, don't keep trying
  if (connectionError) {
    console.error('Using previously failed connection:', connectionError);
    throw connectionError;
  }

  try {
    const dbPath = path.join(process.cwd(), 'database_backup.db');
    
    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database file not found at ${dbPath}`);
    }
    
    console.log(`Connecting to database at ${dbPath}`);
    
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Test connection with a simple query
    await db.get('SELECT 1');
    console.log('Database connection established successfully');
    
    return db;
  } catch (err) {
    console.error('Database connection error:', err);
    connectionError = err;
    throw err;
  }
}

// Allow resetting the connection for retry purposes
function resetDbConnection() {
  db = null;
  connectionError = null;
  console.log('Database connection reset');
}

module.exports = { getDb, resetDbConnection };
