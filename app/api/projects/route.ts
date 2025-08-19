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
    if (!data.project_name || !data.builder_id || !data.estimator_id || !data.status_id) {
      return NextResponse.json(
        { error: 'Missing required fields: project_name, builder_id, estimator_id, and status_id are required.' },
        { status: 400 }
      );
    }

    // Insert the new project using Supabase
    const projectData = {
      project_name: data.project_name,
      builder_id: data.builder_id,
      estimator_id: data.estimator_id,
      supervisor_id: data.supervisor_id || null,
      status_id: data.status_id,
      location_id: data.location_id || null,
      due_date: data.due_date || null,
      submission_date: data.submission_date || null,
      follow_up_date: data.follow_up_date || null,
      contract_value: data.contract_value || null,
      reference_project_id: data.reference_project_id || null,
      priority_id: data.priority_id || null
    };

    const { data: result, error } = await db
      .from('projects')
      .insert(projectData)
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
      id: result.id 
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
