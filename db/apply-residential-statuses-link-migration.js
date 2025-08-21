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
    const migration = fs.readFileSync(path.join(__dirname, 'migrations', '015_link_residential_projects_to_statuses.sql'), 'utf8');
    await client.query(migration);
    console.log('Migration to link residential projects to statuses applied successfully!');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    client.release();
  }
};

applyMigration().then(() => pool.end());
