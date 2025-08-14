import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const supabase = getDb();
    const body = await request.json();
    const { userId, role } = body;

    // Validate role
    const validRoles = ['viewer', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be viewer, manager, or admin' },
        { status: 400 }
      );
    }

    // Update user role
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select('id, name, email, role')
      .single();

    if (error) {
      console.error('Role assignment error:', error);
      return NextResponse.json(
        { error: 'Failed to assign role' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data
    });

  } catch (error) {
    console.error('Role assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to assign role' },
      { status: 500 }
    );
  }
}

// GET endpoint to list all users and their roles (admin only)
export async function GET() {
  try {
    const supabase = getDb();

    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .order('name');

    if (error) {
      console.error('Users fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
