import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export async function GET() {
  try {
    const supabase = getDb();
    const { data: builders, error } = await supabase.from('builders').select('id, name').order('name');
    if (error) throw error;
    
    // Make sure we always return an array
    return NextResponse.json(Array.isArray(builders) ? builders : []);
  } catch (error) {
    console.error('Error fetching builders:', error);
    // Return an empty array on error instead of error object
    return NextResponse.json([]);
  }
}
