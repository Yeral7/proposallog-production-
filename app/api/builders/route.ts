import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const builders = await db.all('SELECT id, name FROM builders ORDER BY name');
    return NextResponse.json(builders);
  } catch (error) {
    console.error('Error fetching builders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch builders' },
      { status: 500 }
    );
  }
}
