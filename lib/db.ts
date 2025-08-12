import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

let db: Database | null = null;
let connectionError: Error | null = null;

export async function getDb() {
  if (db) {
    return db;
  }

  if (connectionError) {
    console.error('Using previously failed connection:', connectionError);
    throw connectionError;
  }

  try {
    const dbPath = path.join(process.cwd(), 'database_backup.db');

    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database file not found at ${dbPath}`);
    }

    console.log(`Connecting to database at ${dbPath}`);

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await db.get('SELECT 1');
    console.log('Database connection established successfully');

    return db;
  } catch (err: any) {
    console.error('Database connection error:', err);
    connectionError = err;
    throw err;
  }
}

export function resetDbConnection() {
  db = null;
  connectionError = null;
  console.log('Database connection reset');
}
