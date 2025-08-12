import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';

// GET project notes
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    
    // Validate project ID
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }
    
    const supabase = getDb();
    
    // Get all notes for the project, ordered by newest first
    const { data: notes, error } = await supabase
      .from('project_notes')
      .select('id, project_id, content, author, timestamp')
      .eq('project_id', projectId)
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch project notes' },
        { status: 500 }
      );
    }
    
    // Transform data to match expected format
    const transformedNotes = (notes || []).map(note => ({
      id: note.id,
      project_id: note.project_id,
      note_text: note.content,
      author: note.author,
      created_at: note.timestamp
    }));
    
    return NextResponse.json(transformedNotes, { status: 200 });
  } catch (error) {
    console.error('Error fetching project notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project notes' },
      { status: 500 }
    );
  }
}

// POST new note
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    
    // Validate project ID
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.note_text || !data.author) {
      return NextResponse.json(
        { error: 'Note text and author are required' },
        { status: 400 }
      );
    }
    
    const supabase = getDb();
    
    // Check if project exists
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();
      
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Insert new note
    const { data: result, error } = await supabase
      .from('project_notes')
      .insert({
        project_id: projectId,
        content: data.note_text,
        author: data.author
      })
      .select(`
        id, 
        project_id, 
        content as note_text, 
        author, 
        timestamp as created_at
      `)
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return NextResponse.json(
        { error: 'Failed to create note' },
        { status: 500 }
      );
    }
    
    const newNote = result;
    
    return NextResponse.json(
      newNote,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project note:', error);
    return NextResponse.json(
      { error: 'Failed to create project note' },
      { status: 500 }
    );
  }
}

// DELETE note
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    const { id: noteId } = await request.json();

    // Validate IDs
    if (isNaN(projectId) || !noteId) {
      return NextResponse.json(
        { error: 'Invalid project ID or note ID' },
        { status: 400 }
      );
    }

    const supabase = getDb();

    // Check if note exists and belongs to the project
    const { data: existingNote } = await supabase
      .from('project_notes')
      .select('*')
      .eq('id', noteId)
      .eq('project_id', projectId)
      .single();

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found for this project' },
        { status: 404 }
      );
    }

    // Delete note
    const { error } = await supabase
      .from('project_notes')
      .delete()
      .eq('id', noteId)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error deleting note:', error);
      return NextResponse.json(
        { error: 'Failed to delete note' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Note deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting project note:', error);
    return NextResponse.json(
      { error: 'Failed to delete project note' },
      { status: 500 }
    );
  }
}
