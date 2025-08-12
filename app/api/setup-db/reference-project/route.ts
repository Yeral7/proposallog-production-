import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb } from '../../../../lib/db';

export async function GET() {
  try {
    const db = await getDb();
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'app', 'api', 'setup-db', 'simple-update.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL commands
    // Split the SQL into individual statements
    const statements = sql.split(';').filter(statement => statement.trim() !== '');
    
    for (const statement of statements) {
      await db.exec(statement + ';');
    }
    
    // Verify the column exists
    const tableInfo = await db.all("PRAGMA table_info(projects)");
    const hasReferenceProjectId = tableInfo.some(col => col.name === 'reference_project_id');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database updated successfully',
      hasReferenceProjectId
    });
    
  } catch (error) {
    console.error('Error updating database schema:', error);
    return NextResponse.json(
      { error: 'Failed to update database schema', details: error.message },
      { status: 500 }
    );
  }
}
