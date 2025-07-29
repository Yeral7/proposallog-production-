import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
const { getDb } = require('../../../lib/db.js');

// This endpoint will execute the SQL schema for project details tables
export async function GET() {
  try {
    // Read the SQL file
    const sqlFile = await fs.readFile(
      path.join(process.cwd(), 'schema_update_project_details.sql'),
      'utf8'
    );
    
    // Split the SQL statements
    const statements = sqlFile
      .split(';')
      .filter(stmt => stmt.trim() !== '');
    
    // Get the database connection
    const db = await getDb();
    
    // Execute each SQL statement
    for (const stmt of statements) {
      await db.exec(stmt + ';');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Project details tables created successfully' 
    });
  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json({ 
      error: 'Failed to set up database', 
      details: error.message 
    }, { status: 500 });
  }
}
