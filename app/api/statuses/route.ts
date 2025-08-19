import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export async function GET() {
  try {
    const supabase = getDb();
    const { data: statuses, error } = await supabase.from('statuses').select('id, label').order('label');
    if (error) throw error;
    
    // Make sure we always return an array
    return NextResponse.json(Array.isArray(statuses) ? statuses : []);
  } catch (error) {
    console.error('Error fetching statuses:', error);
    // Return an empty array on error instead of error object
    return NextResponse.json([]);
  }
}
