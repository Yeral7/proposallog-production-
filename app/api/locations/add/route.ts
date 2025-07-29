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

    const db = await getDb();
    
    // Check if location with this name already exists
    const existingLocation = await db.get(
      'SELECT id FROM locations WHERE name = ?',
      [data.name]
    );
    
    if (existingLocation) {
      return NextResponse.json(
        { error: 'A location with this name already exists' },
        { status: 400 }
      );
    }

    const result = await db.run(
      'INSERT INTO locations (name) VALUES (?)',
      [data.name]
    );
    
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
