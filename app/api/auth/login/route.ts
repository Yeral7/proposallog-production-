import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Production build successfully fixed: Tailwind v3 + Next.js 15 route handlers updated

export async function POST(request: Request) {
  try {
    const supabase = getDb();
    const body = await request.json();
    const { email, password } = body;

    // Input validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' }, 
        { status: 400 }
      );
    }

    // Check if email exists - use case-insensitive comparison
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password_hash, role')
      .ilike('email', email.trim())
      .single();
    
    if (error || !user) {
      // Use generic error message to prevent username enumeration
      return NextResponse.json(
        { error: 'Invalid username or password' }, 
        { status: 401 }
      );
    }

    // For demonstration purposes - in a real app, use bcrypt to compare passwords
    // const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    // Securely compare the provided password with the stored hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid username or password' }, 
        { status: 401 }
      );
    }

    // Update last login timestamp (if you have this field)
    await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', user.id);

    // Check if JWT secret is available
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in the environment variables.');
      return NextResponse.json(
        { error: 'Authentication configuration error.' },
        { status: 500 }
      );
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role || 'viewer' },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' } // Token expires in 1 day
    );

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'viewer',
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' }, 
      { status: 500 }
    );
  }
}
