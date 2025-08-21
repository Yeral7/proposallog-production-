import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import jwt from 'jsonwebtoken';

// Helper: verify JWT from Authorization header
function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new jwt.JsonWebTokenError('Unauthorized');
  }
  const token = authHeader.substring(7);
  jwt.verify(token, process.env.JWT_SECRET!);
}

export async function GET(request: NextRequest) {
  try {
    verifyAuth(request);

    const supabase = getDb();
    const { data, error } = await supabase
      .from('residential_statuses')
      .select('id, name, display_order')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error fetching residential statuses:', error);
      return NextResponse.json({ error: 'Failed to fetch residential statuses' }, { status: 500 });
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching residential statuses:', error);
    return NextResponse.json({ error: 'Failed to fetch residential statuses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    verifyAuth(request);

    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Status name is required' }, { status: 400 });
    }

    const supabase = getDb();

    // Insert new status
    const { data, error } = await supabase
      .from('residential_statuses')
      .insert([{ name: name.trim() }])
      .select('id, name, display_order')
      .single();

    if (error) {
      // Unique violation => conflict
      if ((error as any).code === '23505') {
        return NextResponse.json({ error: 'A status with this name already exists' }, { status: 409 });
      }
      console.error('Supabase error creating residential status:', error);
      return NextResponse.json({ error: 'Failed to create residential status' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating residential status:', error);
    return NextResponse.json({ error: 'Failed to create residential status' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    verifyAuth(request);

    const { id, name } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Status id is required' }, { status: 400 });
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Status name is required' }, { status: 400 });
    }

    const supabase = getDb();

    const { data, error } = await supabase
      .from('residential_statuses')
      .update({ name: name.trim() })
      .eq('id', id)
      .select('id, name, display_order')
      .single();

    if (error) {
      if ((error as any).code === '23505') {
        return NextResponse.json({ error: 'A status with this name already exists' }, { status: 409 });
      }
      console.error('Supabase error updating residential status:', error);
      return NextResponse.json({ error: 'Failed to update residential status' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating residential status:', error);
    return NextResponse.json({ error: 'Failed to update residential status' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    verifyAuth(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Status id is required' }, { status: 400 });
    }

    const supabase = getDb();

    const { error } = await supabase
      .from('residential_statuses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error deleting residential status:', error);
      return NextResponse.json({ error: 'Failed to delete residential status' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting residential status:', error);
    return NextResponse.json({ error: 'Failed to delete residential status' }, { status: 500 });
  }
}
