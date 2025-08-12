import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Status ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = getDb();
    
    const { error } = await supabase
      .from('statuses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting status:', error);
      return NextResponse.json(
        { error: 'Failed to delete status' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting status:', error);
    return NextResponse.json(
      { error: 'Failed to delete status' },
      { status: 500 }
    );
  }
}
