import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Builder ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Check if builder is being used by any projects
    const usedBuilder = await db.get(
      'SELECT COUNT(*) as count FROM projects WHERE builder_id = ?',
      [id]
    );
    
    if (usedBuilder.count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete builder that is associated with projects' },
        { status: 400 }
      );
    }

    await db.run('DELETE FROM builders WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting builder:', error);
    return NextResponse.json(
      { error: 'Failed to delete builder' },
      { status: 500 }
    );
  }
}
