import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      );
    }

    const supabase = getDb();
    
    // Check if location is being used by any projects
    const { count, error: countError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('location_id', id);

    if (countError) {
      console.error('Error checking location usage:', countError);
      return NextResponse.json(
        { error: 'Failed to check location usage' },
        { status: 500 }
      );
    }
    
    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete location that is associated with projects' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting location:', error);
      return NextResponse.json(
        { error: 'Failed to delete location' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    );
  }
}
