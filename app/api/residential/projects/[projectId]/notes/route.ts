import { NextResponse } from 'next/server';
import { openDb } from '../../../../../../db';
import { authenticate } from '@/lib/auth';

// GET /api/residential/projects/[projectId]/notes - Get all notes for a specific project
export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.projectId;
    const db = await openDb();
    
    // Get the notes for the specific project
    const notes = await db.all(`
      SELECT rn.*, u.name as author_name
      FROM residential_project_notes rn
      LEFT JOIN users u ON rn.created_by = u.id
      WHERE rn.project_id = ?
      ORDER BY rn.created_at DESC
    `, [projectId]);

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ message: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST /api/residential/projects/[projectId]/notes - Add a new note to a project
export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.projectId;
    const data = await request.json();
    
    // Validate required fields
    if (!data.note_text || data.note_text.trim() === '') {
      return NextResponse.json({ message: 'Note text is required' }, { status: 400 });
    }

    const db = await openDb();
    
    // Check if the project exists
    const project = await db.get('SELECT id FROM residential_projects WHERE id = ?', [projectId]);
    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }
    
    // Insert the new note
    const result = await db.run(`
      INSERT INTO residential_project_notes (
        project_id,
        note_text,
        created_by,
        created_at
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      projectId,
      data.note_text.trim(),
      user.id
    ]);
    
    // Get the newly created note with author name
    const newNote = await db.get(`
      SELECT n.*, u.name as author_name
      FROM residential_project_notes n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.id = ?
    `, result.lastID);
    
    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ message: 'Failed to create note' }, { status: 500 });
  }
}
