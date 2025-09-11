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
    
    // Get all notes for the project, with author's name, ordered by newest first
    const { data: notes, error } = await supabase
      .from('project_notes')
      .select('id, project_id, content, timestamp, created_at, users ( name )')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch project notes' },
        { status: 500 }
      );
    }
    
    // Transform data to match expected format
    const transformedNotes = (notes || []).map((note: any) => {
      let authorName = 'Unknown User';
      if (note.users) {
        const userData = Array.isArray(note.users) ? note.users[0] : note.users;
        if (userData && typeof userData.name === 'string') {
          authorName = userData.name;
        }
      }
      return {
        id: note.id,
        project_id: note.project_id,
        content: note.content,
        author: authorName,
        // Prefer explicit timestamp; fallback to created_at now that it's present
        timestamp: note.timestamp || note.created_at
      };
    });
    
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
    if (!data.content || !data.user_id) {
      return NextResponse.json(
        { error: 'Note content and user ID are required' },
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
        content: data.content,
        user_id: data.user_id,
        // Ensure we store creation time since schema has no default for timestamp
        timestamp: new Date().toISOString()
      })
      .select('id, project_id, content, user_id, timestamp, created_at, users ( name )')
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return NextResponse.json(
        { error: 'Failed to create note' },
        { status: 500 }
      );
    }
    
    // Transform the result to match expected format
    let authorName = 'Unknown User';
    if (result.users) {
      const userData = Array.isArray(result.users) ? result.users[0] : result.users;
      if (userData && typeof userData.name === 'string') {
        authorName = userData.name;
      }
    }
    const newNote = {
      id: result.id,
      project_id: result.project_id,
      content: result.content,
      author: authorName,
      // Prefer DB-provided timestamp; fallback to created_at
      timestamp: result.timestamp || result.created_at
    };
    
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
