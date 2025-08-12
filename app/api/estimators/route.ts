import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export async function GET() {
  try {
    const supabase = getDb();
    const { data: estimators, error } = await supabase.from('estimators').select('id, name').order('name');
    if (error) throw error;
    return NextResponse.json(estimators);
  } catch (error) {
    console.error('Error fetching estimators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimators' },
      { status: 500 }
    );
  }
}
