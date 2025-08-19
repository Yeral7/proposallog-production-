import { NextResponse, NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedSession } from '@/lib/auth';

// GET /api/residential/projects/[projectId]/notes - Get all notes for a specific project
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
    
    const { data: notes, error } = await supabase
      .from('residential_project_notes')
      .select('*, author:users(name)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return NextResponse.json({ message: 'Failed to fetch notes' }, { status: 500 });
    }

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ message: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST /api/residential/projects/[projectId]/notes - Add a new note to a project
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
    
    // Validate required fields
    if (!data.note_text || data.note_text.trim() === '') {
      return NextResponse.json({ message: 'Note text is required' }, { status: 400 });
    }

    const supabase = getDb();
    
    // Check if the project exists
    const { data: project, error: projectError } = await supabase
      .from('residential_projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }
    
    // Insert the new note
    const { data: newNote, error: insertError } = await supabase
      .from('residential_project_notes')
      .insert({
        project_id: projectId,
        note_text: data.note_text.trim(),
        created_by: session.id
      })
      .select('*, author:users(name)')
      .single();

    if (insertError) {
      console.error('Error creating note:', insertError);
      return NextResponse.json({ message: 'Failed to create note' }, { status: 500 });
    }
    
    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ message: 'Failed to create note' }, { status: 500 });
  }
}
