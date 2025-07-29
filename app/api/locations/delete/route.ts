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

    const db = await getDb();
    
    // Check if location is being used by any projects
    const usedLocation = await db.get(
      'SELECT COUNT(*) as count FROM projects WHERE location_id = ?',
      [id]
    );
    
    if (usedLocation.count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete location that is associated with projects' },
        { status: 400 }
      );
    }

    await db.run('DELETE FROM locations WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    );
  }
}
