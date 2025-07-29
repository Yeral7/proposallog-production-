import { NextResponse } from 'next/server';
const { getDb } = require('../../../../../lib/db.js');

// GET project notes
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);
    
    // Validate project ID
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }
    
    const db = await getDb();
    
    // Get all notes for the project, ordered by newest first
    const notes = await db.all(
      `SELECT id, project_id, content as note_text, author, timestamp as created_at 
       FROM project_notes WHERE project_id = ? ORDER BY timestamp DESC`,
      [projectId]
    );
    
    return NextResponse.json(notes, { status: 200 });
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
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);
    
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
    
    const db = await getDb();
    
    // Check if project exists
    const existingProject = await db.get('SELECT id FROM projects WHERE id = ?', [projectId]);
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Insert new note
    const result = await db.run(
      `INSERT INTO project_notes (project_id, content, author)
       VALUES (?, ?, ?)`,
      [projectId, data.note_text, data.author]
    );
    
    // Get the inserted note, aliasing columns to match the GET request for consistency
    const newNote = await db.get(
      `SELECT id, project_id, content as note_text, author, timestamp as created_at 
       FROM project_notes WHERE id = ?`,
      [result.lastID]
    );
    
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
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);
    const { id: noteId } = await request.json();

    // Validate IDs
    if (isNaN(projectId) || !noteId) {
      return NextResponse.json(
        { error: 'Invalid project ID or note ID' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if note exists and belongs to the project
    const existingNote = await db.get(
      'SELECT * FROM project_notes WHERE id = ? AND project_id = ?',
      [noteId, projectId]
    );

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found for this project' },
        { status: 404 }
      );
    }

    // Delete note
    await db.run(
      'DELETE FROM project_notes WHERE id = ? AND project_id = ?',
      [noteId, projectId]
    );

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
