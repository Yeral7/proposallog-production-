import { NextResponse } from 'next/server';
import { openDb } from '../../../../../../db';
import { authenticate } from '@/lib/auth';

// GET /api/residential/projects/[projectId]/drawings - Get all drawings for a specific project
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
    
    // Get the drawings for the specific project
    const drawings = await db.all(`
      SELECT * FROM residential_project_drawings
      WHERE project_id = ?
      ORDER BY created_at DESC
    `, [projectId]);

    return NextResponse.json(drawings);
  } catch (error) {
    console.error('Error fetching drawings:', error);
    return NextResponse.json({ message: 'Failed to fetch drawings' }, { status: 500 });
  }
}

// POST /api/residential/projects/[projectId]/drawings - Add a new drawing to a project
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
    if (!data.drawing_name) {
      return NextResponse.json({ message: 'Drawing name is required' }, { status: 400 });
    }

    const db = await openDb();
    
    // Check if the project exists
    const project = await db.get('SELECT id FROM residential_projects WHERE id = ?', [projectId]);
    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }
    
    // Insert the new drawing
    const result = await db.run(`
      INSERT INTO residential_project_drawings (
        project_id,
        drawing_name,
        drawing_number,
        drawing_type,
        drawing_date,
        drawing_url,
        notes,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      projectId,
      data.drawing_name,
      data.drawing_number || null,
      data.drawing_type || null,
      data.drawing_date || null,
      data.drawing_url || null,
      data.notes || null,
      user.id
    ]);
    
    // Get the newly created drawing
    const newDrawing = await db.get(`
      SELECT * FROM residential_project_drawings 
      WHERE id = ?
    `, result.lastID);
    
    return NextResponse.json(newDrawing, { status: 201 });
  } catch (error) {
    console.error('Error creating drawing:', error);
    return NextResponse.json({ message: 'Failed to create drawing' }, { status: 500 });
  }
}
