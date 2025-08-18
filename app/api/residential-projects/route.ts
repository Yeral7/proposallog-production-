import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import jwt from 'jsonwebtoken';

// GET all residential projects
export async function GET(request: Request) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getDb();
    const { data: projects, error } = await supabase
      .from('residential_projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch residential projects' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(projects || [], { status: 200 });
  } catch (error) {
    console.error('Error fetching residential projects:', error);
    return NextResponse.json({ error: 'Failed to fetch residential projects' }, { status: 500 });
  }
}

// POST new residential project
export async function POST(request: Request) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (!decoded || (decoded.role !== 'Manager' && decoded.role !== 'Admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const data = await request.json();
    
    if (!data.residential_project_name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const supabase = getDb();
    const { data: newProject, error } = await supabase
      .from('residential_projects')
      .insert({
        residential_project_name: data.residential_project_name,
        builder_id: data.builder_id || null,
        builder: data.builder || '',
        subcontractor: data.subcontractor || '',
        notes: data.notes || '',
        start_date: data.start_date || null,
        est_completion_date: data.est_completion_date || null,
        contract_value: data.contract_value || null,
        status_id: data.status_id || null,
        status: data.status || '',
        created_by: decoded.userId,
        updated_by: decoded.userId
      })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create residential project' },
        { status: 500 }
      );
    }
    
    // Add audit log
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: decoded.userId,
          username: decoded.username,
          email: decoded.email,
          page: 'Residential Log',
          action: `Added residential project: "${data.residential_project_name}"`,
          timestamp: new Date().toISOString()
        });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }
    
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating residential project:', error);
    return NextResponse.json({ error: 'Failed to create residential project' }, { status: 500 });
  }
}
