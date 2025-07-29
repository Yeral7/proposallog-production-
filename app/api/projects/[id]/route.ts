import { NextResponse } from 'next/server';
const { getDb } = require('../../../../lib/db.js');

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
    const db = await getDb();
    
    // Correctly validate only the fields that are always required.
    // Optional fields like due_date, contract_value, supervisor_id, and location_id can be null.
    if (!data.project_name || !data.builder_id || !data.estimator_id || !data.status_id) {
      return NextResponse.json(
        { error: 'Missing required fields: project_name, builder_id, estimator_id, and status_id are required.' },
        { status: 400 }
      );
    }

    // Check if project exists
    const existingProject = await db.get('SELECT id FROM projects WHERE id = ?', [projectId]);
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update project
    const result = await db.run(
      `UPDATE projects SET 
        project_name = ?, 
        builder_id = ?, 
        estimator_id = ?, 
        supervisor_id = ?, 
        status_id = ?, 
        location_id = ?, 
        due_date = ?, 
        submission_date = ?,
        follow_up_date = ?,
        contract_value = ?,
        priority = ?
      WHERE id = ?`,
      [
        data.project_name,
        data.builder_id,
        data.estimator_id,
        data.supervisor_id,
        data.status_id,
        data.location_id,
        data.due_date,
        data.submission_date,
        data.follow_up_date,
        data.contract_value,
        data.priority,
        projectId
      ]
    );

    // Division associations removed

    return NextResponse.json({ 
      success: true, 
      id: projectId 
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    // Check if project exists
    const existingProject = await db.get('SELECT id FROM projects WHERE id = ?', [projectId]);
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Division association deletion removed

    // Then delete the project
    await db.run('DELETE FROM projects WHERE id = ?', [projectId]);

    return NextResponse.json({ 
      success: true 
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
