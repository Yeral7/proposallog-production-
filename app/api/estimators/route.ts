import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export async function GET() {
  try {
    const supabase = getDb();
    const { data: estimators, error } = await supabase.from('estimators').select('id, name').order('name');
    if (error) throw error;
    
    // Make sure we always return an array
    return NextResponse.json(Array.isArray(estimators) ? estimators : []);
  } catch (error) {
    console.error('Error fetching estimators:', error);
    // Return an empty array on error instead of error object
    return NextResponse.json([]);
  }
}
