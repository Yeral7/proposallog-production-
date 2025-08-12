import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

export async function POST(request) {
  try {
    const { name } = await request.json();
    
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Status name is required' },
        { status: 400 }
      );
    }
    
    const supabase = getDb();
    const { data: result, error } = await supabase
      .from('statuses')
      .insert({ label: name.trim() })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create status' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      id: result.id, 
      success: true 
    });
  } catch (error) {
    console.error('Error adding status:', error);
    return NextResponse.json(
      { error: 'Failed to add status' },
      { status: 500 }
    );
  }
}
