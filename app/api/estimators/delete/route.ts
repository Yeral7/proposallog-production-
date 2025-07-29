import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Estimator ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Check if estimator is being used by any projects
    const usedEstimator = await db.get(
      'SELECT COUNT(*) as count FROM projects WHERE estimator_id = ?',
      [id]
    );
    
    if (usedEstimator.count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete estimator that is associated with projects' },
        { status: 400 }
      );
    }

    await db.run('DELETE FROM estimators WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting estimator:', error);
    return NextResponse.json(
      { error: 'Failed to delete estimator' },
      { status: 500 }
    );
  }
}
