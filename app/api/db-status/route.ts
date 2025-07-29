import { NextResponse } from 'next/server';
const { getDb, resetDbConnection } = require('../../../lib/db.js');
const path = require('path');
const fs = require('fs');

export async function GET() {
  try {
    // Check db file existence 
    const dbPath = path.join(process.cwd(), 'database.db');
    const fileExists = fs.existsSync(dbPath);
    
    // Try connection
    let connectionSuccess = false;
    let error = null;
    
    try {
      // Reset connection if it was previously failed
      resetDbConnection();
      
      const db = await getDb();
      // Try a simple query to ensure connection works
      const result = await db.get('SELECT 1 as test');
      connectionSuccess = result && result.test === 1;
    } catch (err) {
      error = err.message || String(err);
    }

    return NextResponse.json({
      status: connectionSuccess ? 'connected' : 'error',
      fileExists,
      dbPath,
      error: error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking database status:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error.message || String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
