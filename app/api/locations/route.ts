import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const supabase = getDb();
    const { data: locations, error } = await supabase.from('locations').select('id, name').order('name');
    if (error) throw error;
    
    // Make sure we always return an array
    return NextResponse.json(Array.isArray(locations) ? locations : []);
  } catch (error) {
    console.error('Error fetching locations:', error);
    // Return an empty array on error instead of error object
    return NextResponse.json([]);
  }
}

// PUT update location
export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET!);

    const { id, name } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Location name is required' }, { status: 400 });
    }

    const supabase = getDb();

    const { data: existingLocation } = await supabase
      .from('locations')
      .select('id')
      .eq('name', name.trim())
      .neq('id', id)
      .single();

    if (existingLocation) {
      return NextResponse.json({ error: 'Location with this name already exists' }, { status: 409 });
    }

    const { data: updatedLocation, error } = await supabase
      .from('locations')
      .update({ name: name.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
    }

    return NextResponse.json(updatedLocation, { status: 200 });
  } catch (error) {
    console.error('Error updating location:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}
