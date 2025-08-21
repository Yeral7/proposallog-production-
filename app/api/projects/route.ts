import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export async function GET() {
  try {
    const supabase = getDb();
    
    // Get all projects with related data using Supabase joins
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        builders:builder_id(name),
        estimators:estimator_id(name),
        supervisors:supervisor_id(name),
        statuses:status_id(label),
        locations:location_id(name),
        priorities:priority_id(name)
      `);
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Database query error', details: error.message },
        { status: 500 }
      );
    }
    
    // Transform the data to match the expected format
    const formattedProjects = (projects || []).map(project => ({
      id: project.id,
      project_name: project.project_name,
      builder_id: project.builder_id,
      builder_name: project.builders?.name || 'N/A',
      estimator_id: project.estimator_id,
      estimator_name: project.estimators?.name || 'N/A',
      supervisor_id: project.supervisor_id,
      supervisor_name: project.supervisors?.name || 'N/A',
      status_id: project.status_id,
      status_label: project.statuses?.label || 'N/A',
      status_name: project.statuses?.label || 'N/A', // Add status_name for conditional checks
      lost_reason: project.lost_reason || null,
      location_id: project.location_id,
      location_name: project.locations?.name || 'N/A',
      due_date: project.due_date,
      submission_date: project.submission_date,
      follow_up_date: project.follow_up_date,
      contract_value: project.contract_value,
      reference_project_id: project.reference_project_id,
      priority_id: project.priority_id,
      priority_name: project.priorities?.name || 'Not Set'
    }));
    
    return NextResponse.json(formattedProjects);
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
    const db = getDb();
    
    // Correctly validate only the fields that are always required.
    const { lost_reason, user_id, ...projectData } = data;

    if (!projectData.project_name || !projectData.builder_id || !projectData.estimator_id || !projectData.status_id) {
      return NextResponse.json(
        { error: 'Missing required fields: project_name, builder_id, estimator_id, and status_id are required.' },
        { status: 400 }
      );
    }

    const insertData = { ...projectData };
    if (lost_reason) {
      insertData.lost_reason = lost_reason;
      if (user_id) {
        insertData.lost_reason_by_user_id = user_id;
      }
    }

    const { data: newProject, error } = await db
      .from('projects')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      id: newProject.id 
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
