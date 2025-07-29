import { NextResponse } from 'next/server';
const { getDb } = require('../../../lib/db.js');

export async function GET() {
  try {
    const db = await getDb();
    
    // First, get all the projects
    try {
      const projects = await db.all(`
        SELECT
          p.id,
          p.project_name,
          p.builder_id,
          b.name as builder_name,
          p.estimator_id,
          e.name as estimator_name,
          p.supervisor_id,
          COALESCE(sv.name, 'N/A') as supervisor_name,
          p.status_id,
          s.label as status_label,
          p.location_id,
          l.name as location_name,
          p.due_date,
          p.submission_date,
          p.follow_up_date,
          p.contract_value,
          p.reference_project_id,
          p.priority
        FROM projects p
        LEFT JOIN builders b ON p.builder_id = b.id
        LEFT JOIN estimators e ON p.estimator_id = e.id
        LEFT JOIN statuses s ON p.status_id = s.id
        LEFT JOIN locations l ON p.location_id = l.id
        LEFT JOIN supervisors sv ON p.supervisor_id = sv.id
      `);
      
      // Return projects without divisions
      return NextResponse.json(projects);
    } catch (error) {
      console.error('Error in SQL query:', error);
      // Log the detailed error message to help with debugging
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('SQL Error Details:', errorMessage);
      return NextResponse.json(
        { error: 'Database query error', details: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const db = await getDb();
    
    // Correctly validate only the fields that are always required.
    if (!data.project_name || !data.builder_id || !data.estimator_id || !data.status_id) {
      return NextResponse.json(
        { error: 'Missing required fields: project_name, builder_id, estimator_id, and status_id are required.' },
        { status: 400 }
      );
    }

    // Insert the new project
    const projectResult = await db.run(
      `INSERT INTO projects (
        project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, 
        due_date, submission_date, follow_up_date, contract_value, reference_project_id, priority
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [
        data.project_name,
        data.builder_id,
        data.estimator_id,
        data.supervisor_id, // Frontend sends null if not provided
        data.status_id,
        data.location_id,   // Frontend sends null if not provided
        data.due_date,      // Frontend sends null if not provided
        data.submission_date,
        data.follow_up_date,
        data.contract_value, // Frontend sends null if not provided
        data.reference_project_id,
        data.priority
      ]
    );

    const projectId = projectResult.lastID;

    // Division associations removed

    return NextResponse.json({ 
      success: true, 
      id: projectId 
    }, { status: 201 });
  } catch (error) {
    // Log detailed error information
    console.error('Error creating project:', error);
    
    // Return a generic but informative error
    return NextResponse.json(
      { 
        error: 'Failed to create project',
        details: error instanceof Error ? error.message : 'An unknown database error occurred'
      },
      { status: 500 }
    );
  }
}
