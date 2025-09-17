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
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (e) {
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
        priority,
        created_at,
        updated_at,
        subcontractor_id,
        status:residential_statuses!status_id(id, name),
        subcontractor:residential_subcontractors!subcontractor_id(id, name),
        builder:residential_builders!builder_id(id, name)
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
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Allow all authenticated users to create residential projects
    // Previously restricted to Manager and Admin roles only

    const data = await request.json();
    
    if (!data.project_name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const supabase = getDb();

    // Resolve status_id: prefer provided value; otherwise try 'Pending', then first available status
    let statusIdToUse: number | null = data.status_id ?? null;
    if (!statusIdToUse) {
      const { data: pendingStatus, error: statusError } = await supabase
        .from('residential_statuses')
        .select('id')
        .eq('name', 'Pending')
        .maybeSingle();

      if (statusError) {
        console.error('Error querying default status:', statusError);
        return NextResponse.json({ error: 'Failed to resolve default project status' }, { status: 500 });
      }

      if (pendingStatus?.id) {
        statusIdToUse = pendingStatus.id;
      } else {
        const { data: firstStatus, error: firstErr } = await supabase
          .from('residential_statuses')
          .select('id')
          .order('display_order', { ascending: true })
          .order('name', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (firstErr) {
          console.error('Error fetching fallback status:', firstErr);
          return NextResponse.json({ error: 'Failed to resolve project status' }, { status: 500 });
        }

        if (firstStatus?.id) {
          statusIdToUse = firstStatus.id;
        }
      }
    }

    if (!statusIdToUse) {
      return NextResponse.json({ error: 'No residential statuses are defined. Please create a status first.' }, { status: 400 });
    }

    const { data: newProject, error } = await supabase
      .from('residential_projects')
      .insert({
        project_name: data.project_name,
        builder_id: data.builder_id,
        subcontractor_id: data.subcontractor_id,
        start_date: data.start_date || null,
        est_completion_date: data.est_completion_date || null,
        contract_value: data.contract_value || null,
        status_id: statusIdToUse,
        priority: data.priority || 'Medium',
        created_by: decoded.userId
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
