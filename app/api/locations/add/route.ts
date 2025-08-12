import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json(
        { error: 'Location name is required' },
        { status: 400 }
      );
    }

    const supabase = getDb();
    
    // Check if location with this name already exists
    const { data: existingLocation } = await supabase
      .from('locations')
      .select('id')
      .eq('name', data.name)
      .single();
    
    if (existingLocation) {
      return NextResponse.json(
        { error: 'A location with this name already exists' },
        { status: 400 }
      );
    }

    const { data: result, error } = await supabase
      .from('locations')
      .insert({ name: data.name })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create location' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      id: result.lastID 
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding location:', error);
    return NextResponse.json(
      { error: 'Failed to add location' },
      { status: 500 }
    );
  }
}
