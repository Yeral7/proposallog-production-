import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
  const projectId = parseInt(resolvedParams.id);
    
    // Validate project ID
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const supabase = getDb();
    
    // Correctly validate only the fields that are always required.
    // Optional fields like due_date, contract_value, supervisor_id, and location_id can be null.
    if (!data.project_name || !data.builder_id || !data.estimator_id || !data.status_id) {
      return NextResponse.json(
        { error: 'Missing required fields: project_name, builder_id, estimator_id, and status_id are required.' },
        { status: 400 }
      );
    }

    // Check if project exists
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();
      
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update project
    const { data: result, error } = await supabase
      .from('projects')
      .update({
        project_name: data.project_name,
        builder_id: data.builder_id,
        estimator_id: data.estimator_id,
        supervisor_id: data.supervisor_id,
        status_id: data.status_id,
        location_id: data.location_id,
        due_date: data.due_date,
        submission_date: data.submission_date,
        follow_up_date: data.follow_up_date,
        contract_value: data.contract_value,
        priority: data.priority
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      );
    }

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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
  const projectId = parseInt(resolvedParams.id);
    
    // Validate project ID
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const supabase = getDb();

    // Check if project exists
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();
      
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Division association deletion removed

    // Then delete the project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json(
        { error: 'Failed to delete project' },
        { status: 500 }
      );
    }

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
