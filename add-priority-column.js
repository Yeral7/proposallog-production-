const { getDb } = require('./lib/db.js');

async function addPriorityColumn() {
  let db;
  try {
    db = await getDb();
    console.log('Connected to the database.');

    // Check if the 'priority' column already exists
    const tableInfo = await db.all(`PRAGMA table_info(projects)`);
    const columnExists = tableInfo.some(column => column.name === 'priority');

    if (columnExists) {
      console.log("'priority' column already exists in the 'projects' table.");
      return;
    }

    console.log("Adding 'priority' column to the 'projects' table...");
    await db.run(`ALTER TABLE projects ADD COLUMN priority TEXT`);
    console.log("'priority' column added successfully.");

  } catch (error) {
    console.error('Error during migration:', error.message);
  } finally {
    if (db) {
      await db.close();
      console.log('Database connection closed.');
    }
  }
}

addPriorityColumn();
