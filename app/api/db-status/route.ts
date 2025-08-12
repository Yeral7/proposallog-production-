import { NextResponse } from 'next/server';
import { getDb, resetDbConnection } from '../../../lib/db';
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
      
      const supabase = getDb();
      // Try a simple query to ensure connection works
      // Test Supabase connection with a simple query
      const { data: result, error } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true });
      
      if (error) throw error;
      connectionSuccess = true; // If no error, connection is successful
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
