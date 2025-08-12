import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const estimators = await db.all('SELECT id, name FROM estimators ORDER BY name');
    return NextResponse.json(estimators);
  } catch (error) {
    console.error('Error fetching estimators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimators' },
      { status: 500 }
    );
  }
}
