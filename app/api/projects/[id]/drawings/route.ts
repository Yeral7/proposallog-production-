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
    const db = await getDb();
    const drawings = await db.all(
      `SELECT * FROM project_drawings WHERE project_id = ? ORDER BY created_at ASC`,
      [projectId]
    );
    return NextResponse.json(drawings, { status: 200 });
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
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO project_drawings (project_id, title, url) VALUES (?, ?, ?)`,
      [projectId, data.title, data.url]
    );
    const newDrawing = await db.get('SELECT * FROM project_drawings WHERE id = ?', [result.lastID]);
    return NextResponse.json(newDrawing, { status: 201 });
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
    const db = await getDb();
    await db.run(
      `UPDATE project_drawings SET title = ?, url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND project_id = ?`,
      [data.title, data.url, data.id, projectId]
    );
    const updatedDrawing = await db.get('SELECT * FROM project_drawings WHERE id = ?', [data.id]);
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
    const db = await getDb();
    const result = await db.run('DELETE FROM project_drawings WHERE id = ? AND project_id = ?', [drawingId, projectId]);
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Drawing not found for this project' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Drawing deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting project drawing:', error);
    return NextResponse.json({ error: 'Failed to delete project drawing' }, { status: 500 });
  }
}
