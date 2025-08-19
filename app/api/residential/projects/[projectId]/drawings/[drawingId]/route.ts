import { NextResponse } from 'next/server';
import { openDb } from '../../../../../../../db';
import { authenticate } from '@/lib/auth';

// GET /api/residential/projects/[projectId]/drawings/[drawingId] - Get a specific drawing
export async function GET(
  request: Request,
  { params }: { params: { projectId: string, drawingId: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, drawingId } = params;
    const db = await openDb();
    
    // Get the specific drawing for the project
    const drawing = await db.get(`
      SELECT * FROM residential_project_drawings
      WHERE id = ? AND project_id = ?
    `, [drawingId, projectId]);

    if (!drawing) {
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
  request: Request,
  { params }: { params: { projectId: string, drawingId: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, drawingId } = params;
    const data = await request.json();
    
    // Validate required fields
    if (!data.drawing_name) {
      return NextResponse.json({ message: 'Drawing name is required' }, { status: 400 });
    }

    const db = await openDb();
    
    // Check if the drawing exists for the specific project
    const drawing = await db.get(`
      SELECT * FROM residential_project_drawings
      WHERE id = ? AND project_id = ?
    `, [drawingId, projectId]);

    if (!drawing) {
      return NextResponse.json({ message: 'Drawing not found' }, { status: 404 });
    }
    
    // Update the drawing
    await db.run(`
      UPDATE residential_project_drawings
      SET 
        drawing_name = ?,
        drawing_number = ?,
        drawing_type = ?,
        drawing_date = ?,
        drawing_url = ?,
        notes = ?,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND project_id = ?
    `, [
      data.drawing_name,
      data.drawing_number || null,
      data.drawing_type || null,
      data.drawing_date || null,
      data.drawing_url || null,
      data.notes || null,
      user.id,
      drawingId,
      projectId
    ]);
    
    // Get the updated drawing
    const updatedDrawing = await db.get(`
      SELECT * FROM residential_project_drawings
      WHERE id = ?
    `, [drawingId]);
    
    return NextResponse.json(updatedDrawing);
  } catch (error) {
    console.error('Error updating drawing:', error);
    return NextResponse.json({ message: 'Failed to update drawing' }, { status: 500 });
  }
}

// DELETE /api/residential/projects/[projectId]/drawings/[drawingId] - Delete a specific drawing
export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string, drawingId: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, drawingId } = params;
    const db = await openDb();
    
    // Check if the drawing exists for the specific project
    const drawing = await db.get(`
      SELECT * FROM residential_project_drawings
      WHERE id = ? AND project_id = ?
    `, [drawingId, projectId]);

    if (!drawing) {
      return NextResponse.json({ message: 'Drawing not found' }, { status: 404 });
    }
    
    // Delete the drawing
    await db.run(`
      DELETE FROM residential_project_drawings
      WHERE id = ? AND project_id = ?
    `, [drawingId, projectId]);
    
    return NextResponse.json({ message: 'Drawing deleted successfully' });
  } catch (error) {
    console.error('Error deleting drawing:', error);
    return NextResponse.json({ message: 'Failed to delete drawing' }, { status: 500 });
  }
}
