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

    // Get the ID from the query parameter
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Subcontractor ID is required' }, { status: 400 });
    }

    const supabase = getDb();

    // Check if the subcontractor is in use
    const { data: usageData, error: usageError } = await supabase
      .from('residential_projects')
      .select('id')
      .eq('subcontractor_id', id)
      .limit(1);

    if (usageData && usageData.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete this subcontractor because it is associated with one or more projects' 
      }, { status: 409 });
    }

    const { error } = await supabase
      .from('residential_subcontractors')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to delete subcontractor' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting subcontractor:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to delete subcontractor' }, { status: 500 });
  }
}
