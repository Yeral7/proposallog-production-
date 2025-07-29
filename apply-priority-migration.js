const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = './database.db';
const migrationFilePath = path.join(__dirname, 'db/migrations/add_priority_to_projects.sql');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error('Error connecting to database:', err.message);
  }
  console.log('Connected to the database.');
});

db.serialize(() => {
  // Check if the 'priority' column already exists to prevent errors on re-runs
  db.all("PRAGMA table_info(projects)", (err, columns) => {
    if (err) {
      console.error('Error getting table info:', err.message);
      db.close();
      return;
    }

    const columnExists = columns.some(col => col.name === 'priority');

    if (columnExists) {
      console.log("The 'priority' column already exists. No changes made.");
      db.close();
    } else {
      // Apply the migration
      console.log("Applying 'add_priority_to_projects.sql' migration...");
      const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');
      db.exec(migrationSQL, (err) => {
        if (err) {
          console.error('Error applying migration:', err.message);
        } else {
          console.log("Migration applied successfully. The 'priority' column has been added.");
        }
        db.close();
      });
    }
  });
});
