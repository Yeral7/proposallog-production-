import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
// import bcrypt from 'bcrypt'; // Uncomment and install this package when ready for production

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { username, password } = body;

    // Input validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' }, 
        { status: 400 }
      );
    }

    // Check if username exists - use case-insensitive comparison
    const user = await db.get(
      'SELECT id, username, password_hash FROM auth_users WHERE LOWER(username) = LOWER(?)',
      [username.trim()]
    );
    
    if (!user) {
      // Use generic error message to prevent username enumeration
      return NextResponse.json(
        { error: 'Invalid username or password' }, 
        { status: 401 }
      );
    }

    // For demonstration purposes - in a real app, use bcrypt to compare passwords
    // const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    // TEMPORARY: Direct comparison (for demonstration - replace with above in production)
    // In real code, ALWAYS use bcrypt or similar for password hashing and comparison
    // Use trim() to remove any whitespace that might cause comparison issues
    const passwordMatch = user.password_hash.trim() === password.trim();

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid username or password' }, 
        { status: 401 }
      );
    }

    // Update last login timestamp
    await db.run(
      'UPDATE auth_users SET last_login = datetime("now") WHERE id = ?',
      [user.id]
    );

    // In a real implementation, generate JWT or session token here
    // For now, just return success with user info (minus password)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' }, 
      { status: 500 }
    );
  }
}
