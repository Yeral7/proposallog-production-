import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { isDateOnly } from '../../../../lib/timezone';
import { schedulePublish, trashNotionProject } from '../../../../lib/notionAfterSave';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

    if (Object.hasOwn(projectData, 'estimation_due_date')) {
      if (projectData.estimation_due_date === '') projectData.estimation_due_date = null;
      if (projectData.estimation_due_date !== null && !isDateOnly(projectData.estimation_due_date)) {
        return NextResponse.json({ error: 'Estimation due date must be a valid YYYY-MM-DD date or null.' }, { status: 400 });
      }
    }

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

    try { schedulePublish(projectId); } catch (publishError) {
      console.error('Notion publish-on-save scheduling failed', projectId, publishError);
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
      .select('id, reference_project_id')
      .eq('id', projectId)
      .single();
      
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const rootId = existingProject.reference_project_id ?? projectId;

    // If a group root is deleted while GC-bid members remain, hand the root
    // over to the lowest-id member first so the group (and the shared Notion
    // pages keyed by the root ID) survives. Re-parenting runs before the
    // delete so a failure leaves the group intact.
    let newRootId: number | null = null;
    if (existingProject.reference_project_id == null) {
      const { data: members, error: membersError } = await supabase
        .from('projects')
        .select('id')
        .eq('reference_project_id', projectId)
        .order('id');
      if (membersError) {
        console.error('Error reading project group:', membersError);
        return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
      }
      if (members?.length) {
        newRootId = members[0].id;
        const { error: promoteError } = await supabase
          .from('projects')
          .update({ reference_project_id: null })
          .eq('id', newRootId);
        if (promoteError) {
          console.error('Error promoting new group root:', promoteError);
          return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
        }
        const { error: reparentError } = await supabase
          .from('projects')
          .update({ reference_project_id: newRootId })
          .eq('reference_project_id', projectId)
          .neq('id', newRootId);
        if (reparentError) {
          console.error('Error re-parenting project group:', reparentError);
          return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
        }
      }
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

    try { trashNotionProject(projectId, rootId, newRootId); } catch (trashError) {
      console.error('Notion delete-sync scheduling failed', projectId, trashError);
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
