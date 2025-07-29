import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { username, password, email, fullName } = body;

    // Input validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' }, 
        { status: 400 }
      );
    }

    // Validate username length (> 4 characters)
    if (username.length <= 4) {
      return NextResponse.json(
        { error: 'Username must be longer than 4 characters' }, 
        { status: 400 }
      );
    }

    // Validate password (at least 5 letters and 1 number)
    const hasAtLeast5Letters = (password.match(/[a-zA-Z]/g) || []).length >= 5;
    const hasAtLeast1Number = /\d/.test(password);

    if (!hasAtLeast5Letters || !hasAtLeast1Number) {
      return NextResponse.json(
        { error: 'Password must have at least 5 letters and 1 number' }, 
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await db.get(
      'SELECT id FROM auth_users WHERE username = ?',
      [username]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username is already taken' }, 
        { status: 409 }
      );
    }

    // In a real app, we would hash the password before storing
    // const hashedPassword = await bcrypt.hash(password, 10);
    
    // For demonstration, we'll store the password as-is (NOT SECURE!)
    // In production, always use password hashing
    const hashedPassword = password;

    // Insert the new user
    const result = await db.run(
      `INSERT INTO auth_users (
        username, password_hash, email, full_name, created_at
      ) VALUES (?, ?, ?, ?, datetime('now'))`,
      [username, hashedPassword, email || null, fullName || null]
    );

    // Add default 'user' role
    if (result.lastID) {
      await db.run(
        'INSERT INTO user_roles (user_id, role_id) VALUES (?, (SELECT id FROM roles WHERE name = "user"))',
        [result.lastID]
      );
    }

    return NextResponse.json({
      success: true,
      userId: result.lastID
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' }, 
      { status: 500 }
    );
  }
}
