import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export async function GET() {
  try {
    const supabase = getDb();
    
    // Fetch priorities from the priorities table, same as other reference data
    const { data: priorities, error } = await supabase
      .from('priorities')
      .select('id, name')
      .order('display_order');
    
    if (error) {
      console.error('Error fetching priorities:', error);
      return NextResponse.json([]);
    }

    return NextResponse.json(Array.isArray(priorities) ? priorities : []);
  } catch (error) {
    console.error('Server error when fetching priorities:', error);
    return NextResponse.json([]);
  }
}
