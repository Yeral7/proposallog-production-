import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// This is a development-only endpoint to seed a test user
export async function GET() {
  try {
    const db = await getDb();
    
    // Check if the auth_users table exists
    const tableExists = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='auth_users'"
    );
    
    if (!tableExists) {
      return NextResponse.json(
        { error: 'Auth tables not found. Run migrations first.' }, 
        { status: 500 }
      );
    }
    
    // Check if test user already exists
    const existingUser = await db.get(
      'SELECT id FROM auth_users WHERE username = ?', 
      ['admin']
    );
    
    if (existingUser) {
      return NextResponse.json({
        message: 'Test user already exists',
        username: 'admin',
        password: 'admin123'
      });
    }
    
    // Create test user
    const result = await db.run(
      `INSERT INTO auth_users (
        username, password_hash, email, full_name, created_at
      ) VALUES (?, ?, ?, ?, datetime('now'))`,
      ['admin', 'admin123', 'admin@example.com', 'Admin User']
    );
    
    // Add admin role
    if (result.lastID) {
      await db.run(
        'INSERT INTO user_roles (user_id, role_id) VALUES (?, (SELECT id FROM roles WHERE name = "admin"))',
        [result.lastID]
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      username: 'admin',
      password: 'admin123'
    });
    
  } catch (error) {
    console.error('Error seeding test user:', error);
    return NextResponse.json(
      { error: 'Failed to seed test user' }, 
      { status: 500 }
    );
  }
}
