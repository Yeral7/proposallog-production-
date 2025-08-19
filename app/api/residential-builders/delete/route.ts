import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import jwt from 'jsonwebtoken';

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Builder ID is required' },
        { status: 400 }
      );
    }

    const supabase = getDb();
    
    // Check if builder is being used by any residential projects
    const { count, error: countError } = await supabase
      .from('residential_projects')
      .select('*', { count: 'exact', head: true })
      .eq('builder_id', id);
    
    if (countError) {
      console.error('Error checking residential builder usage:', countError);
      return NextResponse.json(
        { error: 'Failed to check builder usage' },
        { status: 500 }
      );
    }
    
    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete builder that is associated with residential projects' },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from('residential_builders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting residential builder:', error);
      return NextResponse.json(
        { error: 'Failed to delete residential builder' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting residential builder:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to delete residential builder' },
      { status: 500 }
    );
  }
}
