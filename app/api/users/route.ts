import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedSession } from '@/lib/auth';
import bcrypt from 'bcrypt';

export async function GET(request: NextRequest) {
  try {
    const supabase = getDb();
    const url = new URL(request.url);
    const includePositions = url.searchParams.get('includePositions') === 'true';

    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .order('name');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Database query error', details: error.message },
        { status: 500 }
      );
    }

    if (!includePositions) {
      return NextResponse.json(users);
    }

    // Augment with positions when requested
    const userList = Array.isArray(users) ? users : [];
    const userIds = userList.map((u: any) => u.id);
    if (userIds.length === 0) return NextResponse.json(userList);

    const { data: userPos, error: posErr } = await supabase
      .from('user_positions')
      .select('user_id, position_id, is_primary, positions:positions(id, name, description)')
      .in('user_id', userIds);

    if (posErr) {
      console.error('Error fetching user positions:', posErr);
      // Return users without positions if join fails
      return NextResponse.json(userList);
    }

    const grouped: Record<number, any[]> = {};
    (userPos || []).forEach((row: any) => {
      const arr = grouped[row.user_id] || (grouped[row.user_id] = []);
      const pos = row.positions || { id: row.position_id };
      arr.push({ id: pos.id, name: pos.name, description: pos.description, is_primary: row.is_primary === true });
    });

    const enriched = userList.map((u: any) => ({ ...u, positions: grouped[u.id] || [] }));
    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getVerifiedSession(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getDb();
    const body = await request.json();
    const {
      name,
      email,
      password,
      role = 'viewer',
      positionIds,
    }: {
      name: string;
      email?: string;
      password: string;
      role?: 'viewer' | 'manager' | 'admin';
      positionIds?: number[];
    } = body;

    // Basic validation
    if (!name || !password) {
      return NextResponse.json(
        { error: 'Name and password are required' },
        { status: 400 }
      );
    }
    if (!['viewer', 'manager', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Optional uniqueness checks (best-effort)
    if (email) {
      const { data: existingByEmail } = await supabase
        .from('users')
        .select('id')
        .ilike('email', email.trim())
        .maybeSingle();
      if (existingByEmail) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        );
      }
    }
    const { data: existingByName } = await supabase
      .from('users')
      .select('id')
      .eq('name', name.trim())
      .maybeSingle();
    if (existingByName) {
      return NextResponse.json(
        { error: 'Username already in use' },
        { status: 409 }
      );
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const { data: newUser, error: insertErr } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: email ? email.trim() : null,
        password_hash,
        role,
        // updated_at is defaulted by DB; avoid setting non-existent created_at
      })
      .select('id, name, email, role')
      .single();

    if (insertErr || !newUser) {
      console.error('Error creating user:', insertErr);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Assign positions if provided
    if (Array.isArray(positionIds) && positionIds.length > 0) {
      const rows = positionIds.map((pid, idx) => ({
        user_id: newUser.id,
        position_id: pid,
        is_primary: idx === 0,
      }));
      const { error: posErr } = await supabase
        .from('user_positions')
        .insert(rows);
      if (posErr) {
        console.error('Error assigning positions:', posErr);
        // Don't fail entire request; return with a warning
        return NextResponse.json({ user: newUser, warning: 'User created, but position assignment failed' });
      }
    }

    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
