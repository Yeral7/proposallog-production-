const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let db = null;

async function getDb() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'database.db');
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
  }
  return db;
}

module.exports = { getDb };
