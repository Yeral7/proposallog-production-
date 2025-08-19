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
      return NextResponse.json({ error: 'Subcontractor name is required' }, { status: 400 });
    }

    const supabase = getDb();

    // Check for duplicates
    const { data: existingSubcontractor, error: existingError } = await supabase
      .from('residential_subcontractors')
      .select('id')
      .eq('name', name)
      .single();

    if (existingSubcontractor) {
      return NextResponse.json({ error: 'Subcontractor with this name already exists' }, { status: 409 });
    }

    const { data: newSubcontractor, error } = await supabase
      .from('residential_subcontractors')
      .insert({ name })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to create subcontractor' }, { status: 500 });
    }

    return NextResponse.json(newSubcontractor, { status: 201 });
  } catch (error) {
    console.error('Error creating subcontractor:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create subcontractor' }, { status: 500 });
  }
}
