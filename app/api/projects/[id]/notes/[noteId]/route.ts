import { NextResponse } from 'next/server';
const { getDb } = require('../../../../../../lib/db.js');

// DELETE note by ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string, noteId: string } }
) {
  try {
    const projectId = parseInt(params.id);
    const noteId = params.noteId;
    
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
