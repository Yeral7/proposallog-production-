import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const supabase = getDb();
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
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('name', username)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username is already taken' }, 
        { status: 409 }
      );
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name: username,
        password_hash: hashedPassword,
        email: email || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('User creation error:', error);
      return NextResponse.json(
        { error: 'Registration failed' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: newUser.id
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' }, 
      { status: 500 }
    );
  }
}
