import { NextResponse } from 'next/server';
import { openDb } from '../../../../db';
import { authenticate } from '@/lib/auth';

// GET /api/residential/projects - Get all residential projects
export async function GET(request: Request) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const db = await openDb();
    
    // Get all residential projects
    const projects = await db.all(`
      SELECT * FROM residential_projects
      ORDER BY created_at DESC
    `);

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching residential projects:', error);
    return NextResponse.json({ message: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/residential/projects - Create a new residential project
export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.project_name) {
      return NextResponse.json({ message: 'Project name is required' }, { status: 400 });
    }

    const db = await openDb();
    
    // Insert the new residential project
    const result = await db.run(`
      INSERT INTO residential_projects (
        project_name, 
        builder, 
        subcontractor, 
        start_date, 
        est_completion_date, 
        contract_value, 
        status,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      data.project_name,
      data.builder || null,
      data.subcontractor || null,
      data.start_date || null,
      data.est_completion_date || null,
      data.contract_value || null,
      data.status || 'Pending',
      user.id
    ]);
    
    // Get the newly created project
    const newProject = await db.get(`
      SELECT * FROM residential_projects 
      WHERE id = ?
    `, result.lastID);
    
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating residential project:', error);
    return NextResponse.json({ message: 'Failed to create project' }, { status: 500 });
  }
}
