import { NextResponse } from 'next/server';
const { getDb } = require('../../../../lib/db.js');

export async function POST(request) {
  try {
    const { name } = await request.json();
    
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Status name is required' },
        { status: 400 }
      );
    }
    
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO statuses (label) VALUES (?)',
      [name.trim()]
    );
    
    return NextResponse.json({ 
      id: result.lastID, 
      success: true 
    });
  } catch (error) {
    console.error('Error adding status:', error);
    return NextResponse.json(
      { error: 'Failed to add status' },
      { status: 500 }
    );
  }
}
