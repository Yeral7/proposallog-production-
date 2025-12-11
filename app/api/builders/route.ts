import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const supabase = getDb();
    const { data: builders, error } = await supabase.from('builders').select('id, name').order('name');
    if (error) throw error;
    
    // Make sure we always return an array
    return NextResponse.json(Array.isArray(builders) ? builders : []);
  } catch (error) {
    console.error('Error fetching builders:', error);
    // Return an empty array on error instead of error object
    return NextResponse.json([]);
  }
}

// PUT update builder
export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Builder ID is required' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Builder name is required' }, { status: 400 });
    }

    const supabase = getDb();

    // Check for duplicates (excluding the current builder)
    const { data: existingBuilder } = await supabase
      .from('builders')
      .select('id')
      .eq('name', name.trim())
      .neq('id', id)
      .single();

    if (existingBuilder) {
      return NextResponse.json({ error: 'Builder with this name already exists' }, { status: 409 });
    }

    const { data: updatedBuilder, error } = await supabase
      .from('builders')
      .update({ name: name.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to update builder' }, { status: 500 });
    }

    return NextResponse.json(updatedBuilder, { status: 200 });
  } catch (error) {
    console.error('Error updating builder:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update builder' }, { status: 500 });
  }
}
