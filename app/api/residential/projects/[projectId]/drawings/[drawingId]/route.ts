import { NextResponse, NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedSession } from '@/lib/auth';

// GET /api/residential/projects/[projectId]/drawings/[drawingId] - Get a specific drawing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string, drawingId: string }> }
) {
  try {
    const session = getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, drawingId } = await params;
    const supabase = getDb();
    
    const { data: drawing, error } = await supabase
      .from('residential_project_drawings')
      .select('*')
      .eq('id', drawingId)
      .eq('project_id', projectId)
      .single();

    if (error || !drawing) {
      return NextResponse.json({ message: 'Drawing not found' }, { status: 404 });
    }

    return NextResponse.json(drawing);
  } catch (error) {
    console.error('Error fetching drawing:', error);
    return NextResponse.json({ message: 'Failed to fetch drawing' }, { status: 500 });
  }
}

// PUT /api/residential/projects/[projectId]/drawings/[drawingId] - Update a specific drawing
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string, drawingId: string }> }
) {
  try {
    const session = getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, drawingId } = await params;
    const data = await request.json();
    
    if (!data.drawing_name) {
      return NextResponse.json({ message: 'Drawing name is required' }, { status: 400 });
    }

    const supabase = getDb();
    
    const { data: updatedDrawing, error } = await supabase
      .from('residential_project_drawings')
      .update({
        drawing_name: data.drawing_name,
        drawing_number: data.drawing_number || null,
        drawing_type: data.drawing_type || null,
        drawing_date: data.drawing_date || null,
        drawing_url: data.drawing_url || null,
        notes: data.notes || null,
        updated_by: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', drawingId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating drawing:', error);
      if (error.code === 'PGRST204') {
        return NextResponse.json({ message: 'Drawing not found' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Failed to update drawing' }, { status: 500 });
    }
    
    return NextResponse.json(updatedDrawing);
  } catch (error) {
    console.error('Error updating drawing:', error);
    return NextResponse.json({ message: 'Failed to update drawing' }, { status: 500 });
  }
}

// DELETE /api/residential/projects/[projectId]/drawings/[drawingId] - Delete a specific drawing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string, drawingId: string }> }
) {
  try {
    const session = getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, drawingId } = await params;
    const supabase = getDb();
    
    const { error } = await supabase
      .from('residential_project_drawings')
      .delete()
      .eq('id', drawingId)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error deleting drawing:', error);
      return NextResponse.json({ message: 'Failed to delete drawing' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Drawing deleted successfully' });
  } catch (error) {
    console.error('Error deleting drawing:', error);
    return NextResponse.json({ message: 'Failed to delete drawing' }, { status: 500 });
  }
}
