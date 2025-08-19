import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export async function GET() {
  try {
    const supabase = getDb();
    const { data: locations, error } = await supabase.from('locations').select('id, name').order('name');
    if (error) throw error;
    
    // Make sure we always return an array
    return NextResponse.json(Array.isArray(locations) ? locations : []);
  } catch (error) {
    console.error('Error fetching locations:', error);
    // Return an empty array on error instead of error object
    return NextResponse.json([]);
  }
}
