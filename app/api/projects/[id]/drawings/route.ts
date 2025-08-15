import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';

// GET project drawings
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }
    const supabase = getDb();
    const { data: drawings, error } = await supabase
      .from('project_drawings')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch project drawings' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(drawings || [], { status: 200 });
  } catch (error) {
    console.error('Error fetching project drawings:', error);
    return NextResponse.json({ error: 'Failed to fetch project drawings' }, { status: 500 });
  }
}

// POST new drawing
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }
    const data = await request.json();
    if (!data.title || !data.url) {
      return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
    }
    const supabase = getDb();
    const { data: newDrawing, error } = await supabase
      .from('project_drawings')
      .insert({
        project_id: projectId,
        title: data.title,
        url: data.url
      })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating drawing:', error);
      console.error('Drawing data:', { project_id: projectId, title: data.title, url: data.url });
      return NextResponse.json(
        { error: 'Failed to create project drawing' },
        { status: 500 }
      );
    }
    
    // Ensure created_at has a fallback value
    const drawingWithTimestamp = {
      ...newDrawing,
      created_at: newDrawing.created_at || new Date().toISOString()
    };
    
    return NextResponse.json(drawingWithTimestamp, { status: 201 });
  } catch (error) {
    console.error('Error creating project drawing:', error);
    return NextResponse.json({ error: 'Failed to create project drawing' }, { status: 500 });
  }
}

// PUT/UPDATE drawing
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }
    const data = await request.json();
    if (!data.id || !data.title || !data.url) {
      return NextResponse.json({ error: 'Drawing ID, title, and URL are required' }, { status: 400 });
    }
    const supabase = getDb();
    
    const { data: updatedDrawing, error } = await supabase
      .from('project_drawings')
      .update({
        title: data.title,
        url: data.url,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating drawing:', error);
      return NextResponse.json(
        { error: 'Failed to update drawing' },
        { status: 500 }
      );
    }
    if (!updatedDrawing) {
      return NextResponse.json({ error: 'Drawing not found for this project' }, { status: 404 });
    }
    return NextResponse.json(updatedDrawing, { status: 200 });
  } catch (error) {
    console.error('Error updating project drawing:', error);
    return NextResponse.json({ error: 'Failed to update project drawing' }, { status: 500 });
  }
}

// DELETE drawing
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    const { id: drawingId } = await request.json();
    if (isNaN(projectId) || !drawingId) {
      return NextResponse.json({ error: 'Invalid project ID or drawing ID' }, { status: 400 });
    }
    const supabase = getDb();
    
    const { error, count } = await supabase
      .from('project_drawings')
      .delete()
      .eq('id', drawingId)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error deleting drawing:', error);
      return NextResponse.json(
        { error: 'Failed to delete drawing' },
        { status: 500 }
      );
    }

    // Note: Supabase doesn't return affected row count directly
    // We could check if drawing exists first, but for simplicity we'll assume success
    return NextResponse.json({ success: true, message: 'Drawing deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting project drawing:', error);
    return NextResponse.json({ error: 'Failed to delete project drawing' }, { status: 500 });
  }
}
