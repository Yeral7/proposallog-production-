import pkg from 'pg';
const { Client } = pkg;
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '.env.local') });

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false } // required for Supabase SSL
});

async function main() {
  try {
    console.log('Attempting to connect to Supabase...');
    await client.connect();
    const res = await client.query('SELECT NOW()');
    console.log('✅ Connection successful!');
    console.log('Server time is:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Connection failed:', err);
  } finally {
    await client.end();
  }
}

main();
