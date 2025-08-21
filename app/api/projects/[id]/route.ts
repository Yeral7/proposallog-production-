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
    
    const { lost_reason, user_id, ...projectData } = data;

    // Correctly validate only the fields that are always required.
    if (!projectData.project_name || !projectData.builder_id || !projectData.estimator_id || !projectData.status_id) {
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

    const updateData = { ...projectData };
    if (lost_reason) {
      updateData.lost_reason = lost_reason;
      if (user_id) {
        updateData.lost_reason_by_user_id = user_id;
      }
    }

    // Update project
    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

    if (error) {
      console.error('Error updating project:', error);
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      );
    }

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
