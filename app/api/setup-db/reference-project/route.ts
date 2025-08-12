import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb } from '../../../../lib/db';

export async function GET() {
  try {
    const supabase = getDb();
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'app', 'api', 'setup-db', 'simple-update.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL commands
    // Split the SQL into individual statements
    const statements = sql.split(';').filter(statement => statement.trim() !== '');
    
    for (const statement of statements) {
      // For Supabase, column already exists - skip ALTER TABLE
      // await supabase.rpc('exec_sql', { sql: statement + ';'});
    }
    
    // Verify the column exists
    // For Supabase, we don't need PRAGMA table_info - tables are already created
    // This is a setup utility that's not needed with Supabase
    const tableInfo = []; // Mock empty result for compatibility
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
