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

    const supabase = getDb();
    
    // Check if builder is being used by any projects
    const { count, error: countError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('builder_id', id);
    
    if (countError) {
      console.error('Error checking builder usage:', countError);
      return NextResponse.json(
        { error: 'Failed to check builder usage' },
        { status: 500 }
      );
    }
    
    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete builder that is associated with projects' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('builders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting builder:', error);
      return NextResponse.json(
        { error: 'Failed to delete builder' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting builder:', error);
    return NextResponse.json(
      { error: 'Failed to delete builder' },
      { status: 500 }
    );
  }
}
