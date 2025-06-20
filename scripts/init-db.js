const { getDb } = require('../lib/db.js');
const { promises: fs } = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    const db = await getDb();
    const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');
    await db.exec(schema);
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1); // Exit with an error code
  }
}

initializeDatabase();
