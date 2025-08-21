import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const supabase = getDb();
    
    const { data: ongoingProjects, error } = await supabase
      .from('projects_ongoing')
      .select(`
        ongoing_id,
        project_id,
        location_id,
        planned_start_date,
        planned_end_date,
        percent_complete,
        progress_status,
        project_style,
        project_type,
        project_type_id,
        project_style_id,
        progress_status_id,
        field_manager_id,
        project_manager_id,
        exact_address,
        created_at,
        updated_at,
        projects!inner (
          id,
          project_name,
          builder_id,
          estimator_id,
          supervisor_id,
          status_id,
          due_date,
          contract_value,
          builders (name),
          estimators (name),
          supervisors (name),
          statuses (label)
        ),
        locations (name),
        field_manager:users!field_manager_id (id, name),
        project_manager:users!project_manager_id (id, name),
        project_types (id, name),
        project_styles (id, name),
        progress_statuses (id, name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Database query error', details: error.message },
        { status: 500 }
      );
    }

    // Flatten the data structure for easier frontend consumption
    const flattenedProjects = ongoingProjects?.map((project: any) => ({
      ...project,
      project_name: project.projects?.project_name,
      builder_name: project.projects?.builders?.name,
      estimator_name: project.projects?.estimators?.name,
      supervisor_name: project.projects?.supervisors?.name,
      status_label: project.projects?.statuses?.label,
      contract_value: project.projects?.contract_value,
      due_date: project.projects?.due_date,
      location_name: project.locations?.name,
      field_manager_name: project.field_manager?.name,
      project_manager_name: project.project_manager?.name,
      project_type: project.project_types?.name,
      project_style: project.project_styles?.name,
      progress_status: project.progress_statuses?.name
    })) || [];

    return NextResponse.json(flattenedProjects);
  } catch (error) {
    console.error('Error fetching ongoing projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ongoing projects' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ongoingId = searchParams.get('id');
    
    if (!ongoingId) {
      return NextResponse.json(
        { error: 'Ongoing project ID is required' },
        { status: 400 }
      );
    }

    const {
      projectTypeId,
      projectStyleId,
      plannedStartDate,
      plannedEndDate,
      exactAddress,
      projectManagerId,
      fieldManagerId,
      progressStatusId,
      percentComplete
    } = await request.json();

    const supabase = getDb();
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (projectTypeId) updateData.project_type_id = projectTypeId;
    if (projectStyleId) updateData.project_style_id = projectStyleId;
    if (progressStatusId) updateData.progress_status_id = progressStatusId;
    if (plannedStartDate) updateData.planned_start_date = plannedStartDate;
    if (plannedEndDate) updateData.planned_end_date = plannedEndDate;
    if (exactAddress !== undefined) updateData.exact_address = exactAddress;
    if (projectManagerId) updateData.project_manager_id = projectManagerId;
    if (fieldManagerId) updateData.field_manager_id = fieldManagerId;
    if (percentComplete !== undefined) updateData.percent_complete = percentComplete;

    const { data, error } = await supabase
      .from('projects_ongoing')
      .update(updateData)
      .eq('ongoing_id', ongoingId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update ongoing project', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Ongoing project updated successfully',
      data
    });
  } catch (error) {
    console.error('Error updating ongoing project:', error);
    return NextResponse.json(
      { error: 'Failed to update ongoing project' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ongoingId = searchParams.get('id');
    
    if (!ongoingId) {
      return NextResponse.json(
        { error: 'Ongoing project ID is required' },
        { status: 400 }
      );
    }

    const supabase = getDb();
    
    const { error } = await supabase
      .from('projects_ongoing')
      .delete()
      .eq('ongoing_id', ongoingId);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete ongoing project', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Ongoing project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ongoing project:', error);
    return NextResponse.json(
      { error: 'Failed to delete ongoing project' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getDb();
    const body = await request.json();
    const {
      project_id,
      project_type,
      project_style,
      planned_start_date,
      planned_end_date,
      exact_address,
      project_manager_id,
      field_manager_id,
      progress_status,
      percent_complete
    } = body;

    // Validate required fields
    if (!project_id || !project_type || !project_style || !exact_address || !field_manager_id) {
      return NextResponse.json(
        { error: 'Missing required fields: project_id, project_type, project_style, exact_address, field_manager_id' },
        { status: 400 }
      );
    }

    // Check if project is already ongoing
    const { data: existingOngoing, error: checkError } = await supabase
      .from('projects_ongoing')
      .select('ongoing_id')
      .eq('project_id', project_id);

    if (checkError) {
      console.error('Error checking existing ongoing project:', checkError);
      return NextResponse.json(
        { error: 'Database error while checking existing project' },
        { status: 500 }
      );
    }

    if (existingOngoing && existingOngoing.length > 0) {
      return NextResponse.json(
        { error: 'This project is already in the ongoing projects list' },
        { status: 400 }
      );
    }

    // Get the location_id from the original project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('location_id')
      .eq('id', project_id)
      .single();

    if (projectError || !projectData) {
      console.error('Error fetching project data:', projectError);
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Insert new ongoing project
    const { data: result, error: insertError } = await supabase
      .from('projects_ongoing')
      .insert({
        project_id,
        location_id: projectData.location_id,
        planned_start_date: planned_start_date || null,
        planned_end_date: planned_end_date || null,
        percent_complete: percent_complete || 0,
        progress_status: progress_status || 'N/A',
        project_style,
        project_type,
        field_manager_id,
        project_manager_id: project_manager_id || null,
        exact_address
      })
      .select('ongoing_id')
      .single();

    if (insertError) {
      console.error('Error inserting ongoing project:', insertError);
      return NextResponse.json(
        { error: 'Failed to create ongoing project' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      ongoing_id: result.ongoing_id,
      message: 'Ongoing project created successfully'
    });

  } catch (error) {
    console.error('Error creating ongoing project:', error);
    return NextResponse.json(
      { error: 'Failed to create ongoing project' },
      { status: 500 }
    );
  }
}
