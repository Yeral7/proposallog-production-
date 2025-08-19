import { NextResponse, NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedSession } from '@/lib/auth';

// GET /api/residential/projects/[projectId]/drawings - Get all drawings for a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const supabase = getDb();
    
    const { data: drawings, error } = await supabase
      .from('residential_project_drawings')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching drawings:', error);
      return NextResponse.json({ message: 'Failed to fetch drawings' }, { status: 500 });
    }

    return NextResponse.json(drawings);
  } catch (error) {
    console.error('Error fetching drawings:', error);
    return NextResponse.json({ message: 'Failed to fetch drawings' }, { status: 500 });
  }
}

// POST /api/residential/projects/[projectId]/drawings - Add a new drawing to a project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const data = await request.json();
    
    if (!data.drawing_name) {
      return NextResponse.json({ message: 'Drawing name is required' }, { status: 400 });
    }

    const supabase = getDb();
    
    const { data: newDrawing, error } = await supabase
      .from('residential_project_drawings')
      .insert({
        project_id: projectId,
        drawing_name: data.drawing_name,
        drawing_number: data.drawing_number || null,
        drawing_type: data.drawing_type || null,
        drawing_date: data.drawing_date || null,
        drawing_url: data.drawing_url || null,
        notes: data.notes || null,
        created_by: session.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating drawing:', error);
      if (error.code === '23503') {
        return NextResponse.json({ message: 'Project not found' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Failed to create drawing' }, { status: 500 });
    }
    
    return NextResponse.json(newDrawing, { status: 201 });
  } catch (error) {
    console.error('Error creating drawing:', error);
    return NextResponse.json({ message: 'Failed to create drawing' }, { status: 500 });
  }
}
