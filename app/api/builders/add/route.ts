import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received data for new builder:', data);

    if (!data.name) {
      return NextResponse.json(
        { error: 'Builder name is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if builder with this name already exists
    const existingBuilder = await db.get(
      'SELECT id FROM builders WHERE name = ?',
      [data.name]
    );

    if (existingBuilder) {
      return NextResponse.json(
        { error: 'A builder with this name already exists' },
        { status: 400 }
      );
    }

    const result = await db.run(
      'INSERT INTO builders (name) VALUES (?)',
      [data.name]
    );
    console.log('Database insert result:', result);

    return NextResponse.json({ 
      success: true,
      id: result.lastID 
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding builder:', error);
    return NextResponse.json(
      { error: 'Failed to add builder' },
      { status: 500 }
    );
  }
}
