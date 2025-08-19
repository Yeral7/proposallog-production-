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
      .select(`
        id,
        project_name,
        start_date,
        est_completion_date,
        contract_value,
        status,
        priority,
        created_at,
        updated_at,
        subcontractor_id,
        subcontractor:residential_subcontractors!fk_subcontractor(id, name),
        builder:residential_builders!fk_builder(id, name)
      `)
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
    
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Allow all authenticated users to create residential projects
    // Previously restricted to Manager and Admin roles only

    const data = await request.json();
    
    if (!data.project_name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const supabase = getDb();
    const { data: newProject, error } = await supabase
      .from('residential_projects')
      .insert({
        project_name: data.project_name, // Match the actual column name in the database
        builder_id: data.builder_id,
        subcontractor_id: data.subcontractor_id,
        start_date: data.start_date || null,
        est_completion_date: data.est_completion_date || null,
        contract_value: data.contract_value || null,
        status: data.status || '',
        priority: data.priority || 'Medium',
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
          action: `Added residential project: "${data.project_name}"`,
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
