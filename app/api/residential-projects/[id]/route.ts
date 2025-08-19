import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import jwt from 'jsonwebtoken';

// PUT update residential project
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
            if (!decoded || !['manager', 'admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const data = await request.json();
    
    if (!data.project_name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const supabase = getDb();
    
    // Get original project for audit
    const { data: originalProject } = await supabase
      .from('residential_projects')
      .select('project_name')
      .eq('id', projectId)
      .single();

    const { data: updatedProject, error } = await supabase
      .from('residential_projects')
      .update({
        project_name: data.project_name,
        builder_id: data.builder_id,
        subcontractor_id: data.subcontractor_id,
        start_date: data.start_date || null,
        est_completion_date: data.est_completion_date || null,
        contract_value: data.contract_value || null,
        status: data.status || '',
        priority: data.priority || 'Medium',
        updated_by: decoded.userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update residential project' },
        { status: 500 }
      );
    }
    
    // Add audit log
    try {
      const projectName = originalProject?.project_name || data.project_name;
      await supabase
        .from('audit_logs')
        .insert({
          user_id: decoded.userId,
          username: decoded.username,
          email: decoded.email,
          page: 'Residential Log',
          action: `Updated residential project: "${projectName}"`,
          timestamp: new Date().toISOString()
        });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }
    
    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error) {
    console.error('Error updating residential project:', error);
    return NextResponse.json({ error: 'Failed to update residential project' }, { status: 500 });
  }
}

// DELETE residential project
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
            if (!decoded || !['manager', 'admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const supabase = getDb();
    
    // Get project name for audit before deletion
    const { data: projectToDelete } = await supabase
      .from('residential_projects')
      .select('project_name')
      .eq('id', projectId)
      .single();

    const { error } = await supabase
      .from('residential_projects')
      .delete()
      .eq('id', projectId);
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete residential project' },
        { status: 500 }
      );
    }
    
    // Add audit log
    try {
      const projectName = projectToDelete?.project_name || `Project ID ${projectId}`;
      await supabase
        .from('audit_logs')
        .insert({
          user_id: decoded.userId,
          username: decoded.username,
          email: decoded.email,
          page: 'Residential Log',
          action: `Deleted residential project: "${projectName}"`,
          timestamp: new Date().toISOString()
        });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }
    
    return NextResponse.json({ message: 'Residential project deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting residential project:', error);
    return NextResponse.json({ error: 'Failed to delete residential project' }, { status: 500 });
  }
}
