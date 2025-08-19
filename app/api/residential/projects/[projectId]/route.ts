import { NextResponse } from 'next/server';
import { openDb } from '../../../../../db';
import { authenticate } from '@/lib/auth';

// GET /api/residential/projects/[projectId] - Get a specific residential project
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
    
    // Get the residential project by ID
    const project = await db.get(`
      SELECT * FROM residential_projects
      WHERE id = ?
    `, [projectId]);

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching residential project:', error);
    return NextResponse.json({ message: 'Failed to fetch project' }, { status: 500 });
  }
}

// PUT /api/residential/projects/[projectId] - Update a specific residential project
export async function PUT(
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
    if (!data.project_name) {
      return NextResponse.json({ message: 'Project name is required' }, { status: 400 });
    }

    const db = await openDb();
    
    // Check if project exists
    const existingProject = await db.get(`
      SELECT * FROM residential_projects
      WHERE id = ?
    `, [projectId]);

    if (!existingProject) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    // Update the residential project
    await db.run(`
      UPDATE residential_projects
      SET 
        project_name = ?, 
        builder = ?, 
        subcontractor = ?, 
        start_date = ?, 
        est_completion_date = ?, 
        contract_value = ?, 
        status = ?,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      data.project_name,
      data.builder || null,
      data.subcontractor || null,
      data.start_date || null,
      data.est_completion_date || null,
      data.contract_value || null,
      data.status || 'Pending',
      user.id,
      projectId
    ]);
    
    // Get the updated project
    const updatedProject = await db.get(`
      SELECT * FROM residential_projects 
      WHERE id = ?
    `, [projectId]);
    
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating residential project:', error);
    return NextResponse.json({ message: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/residential/projects/[projectId] - Delete a specific residential project
export async function DELETE(
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
    
    // Check if project exists
    const existingProject = await db.get(`
      SELECT * FROM residential_projects
      WHERE id = ?
    `, [projectId]);

    if (!existingProject) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    // Delete all project-related data first (to avoid foreign key constraints)
    await db.run('DELETE FROM residential_project_contacts WHERE project_id = ?', [projectId]);
    await db.run('DELETE FROM residential_project_drawings WHERE project_id = ?', [projectId]);
    await db.run('DELETE FROM residential_project_notes WHERE project_id = ?', [projectId]);
    
    // Delete the project
    await db.run('DELETE FROM residential_projects WHERE id = ?', [projectId]);
    
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting residential project:', error);
    return NextResponse.json({ message: 'Failed to delete project' }, { status: 500 });
  }
}
