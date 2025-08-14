import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Supervisor ID is required' },
        { status: 400 }
      );
    }

    const supabase = getDb();
    
    // Check if supervisor is being used by any projects
    const { count, error: countError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('supervisor_id', id);
    
    if (countError) {
      console.error('Error checking supervisor usage:', countError);
      return NextResponse.json(
        { error: 'Failed to check supervisor usage' },
        { status: 500 }
      );
    }
    
    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete supervisor that is associated with projects' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('supervisors')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting supervisor:', error);
      return NextResponse.json(
        { error: 'Failed to delete supervisor' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting supervisor:', error);
    return NextResponse.json(
      { error: 'Failed to delete supervisor' },
      { status: 500 }
    );
  }
}
