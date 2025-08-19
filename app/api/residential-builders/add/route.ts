import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
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

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Builder name is required' }, { status: 400 });
    }

    const supabase = getDb();

    // Check for duplicates
    const { data: existingBuilder, error: existingError } = await supabase
      .from('residential_builders')
      .select('id')
      .eq('name', name)
      .single();

    if (existingBuilder) {
      return NextResponse.json({ error: 'Builder with this name already exists' }, { status: 409 });
    }

    const { data: newBuilder, error } = await supabase
      .from('residential_builders')
      .insert({ name })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to create residential builder' }, { status: 500 });
    }

    return NextResponse.json(newBuilder, { status: 201 });
  } catch (error) {
    console.error('Error creating residential builder:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create residential builder' }, { status: 500 });
  }
}
