const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL + "?sslmode=require",
});

const applyMigration = async () => {
  const client = await pool.connect();
  try {
    const migration = fs.readFileSync(path.join(__dirname, 'migrations', '014_add_note_type_to_project_notes.sql'), 'utf8');
    await client.query(migration);
    console.log('Migration for note_type applied successfully!');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    client.release();
  }
};

applyMigration().then(() => pool.end());
