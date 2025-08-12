import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export async function GET() {
  try {
    const supabase = getDb();
    const { data: builders, error } = await supabase.from('builders').select('id, name').order('name');
    if (error) throw error;
    return NextResponse.json(builders);
  } catch (error) {
    console.error('Error fetching builders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch builders' },
      { status: 500 }
    );
  }
}
