import { NextResponse, NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedSession } from '@/lib/auth';

// GET /api/residential/projects/[projectId] - Get a specific residential project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const supabase = getDb();
    
    const { data: project, error } = await supabase
      .from('residential_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error || !project) {
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
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const data = await request.json();
    
    if (!data.project_name) {
      return NextResponse.json({ message: 'Project name is required' }, { status: 400 });
    }

    const supabase = getDb();
    
    const { data: updatedProject, error } = await supabase
      .from('residential_projects')
      .update({
        project_name: data.project_name,
        builder: data.builder || null,
        subcontractor: data.subcontractor || null,
        start_date: data.start_date || null,
        est_completion_date: data.est_completion_date || null,
        contract_value: data.contract_value || null,
        status: data.status || 'Pending',
        updated_by: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating residential project:', error);
      if (error.code === 'PGRST204') {
        return NextResponse.json({ message: 'Project not found' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Failed to update project' }, { status: 500 });
    }
    
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating residential project:', error);
    return NextResponse.json({ message: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/residential/projects/[projectId] - Delete a specific residential project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const supabase = getDb();
    
    // The database schema should have cascading deletes set up.
    // Deleting the project will trigger deletions in related tables.
    const { error } = await supabase
      .from('residential_projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting residential project:', error);
      return NextResponse.json({ message: 'Failed to delete project' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting residential project:', error);
    return NextResponse.json({ message: 'Failed to delete project' }, { status: 500 });
  }
}
