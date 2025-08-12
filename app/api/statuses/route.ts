import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const statuses = await db.all('SELECT id, label FROM statuses ORDER BY label');
    return NextResponse.json(statuses);
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statuses' },
      { status: 500 }
    );
  }
}
