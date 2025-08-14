import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

export async function POST() {
  try {
    const supabase = getDb();

    // Create audit_log table
    const { error } = await supabase.rpc('create_audit_table', {});
    
    if (error) {
      // If RPC doesn't exist, create table directly
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS audit_log (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          page VARCHAR(100) NOT NULL,
          action TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_audit_log_username ON audit_log(username);
        CREATE INDEX IF NOT EXISTS idx_audit_log_page ON audit_log(page);
      `;
      
      // Note: This is a simplified approach. In production, you'd use proper migrations
      console.log('Creating audit table with query:', createTableQuery);
      
      return NextResponse.json({ 
        message: 'Audit table setup initiated. Please run database migrations manually.',
        query: createTableQuery
      });
    }

    return NextResponse.json({ message: 'Audit table created successfully' });

  } catch (error) {
    console.error('Error setting up audit table:', error);
    return NextResponse.json(
      { error: 'Failed to setup audit table' },
      { status: 500 }
    );
  }
}
