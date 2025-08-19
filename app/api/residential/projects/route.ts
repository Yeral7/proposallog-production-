import { NextResponse, NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedSession } from '@/lib/auth';

// GET /api/residential/projects - Get all residential projects
export async function GET(request: NextRequest) {
  try {
    const session = getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getDb();
    
    const { data: projects, error } = await supabase
      .from('residential_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching residential projects:', error);
      return NextResponse.json({ message: 'Failed to fetch projects' }, { status: 500 });
    }

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching residential projects:', error);
    return NextResponse.json({ message: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/residential/projects - Create a new residential project
export async function POST(request: NextRequest) {
  try {
    const session = getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    if (!data.project_name) {
      return NextResponse.json({ message: 'Project name is required' }, { status: 400 });
    }

    const supabase = getDb();
    
    const { data: newProject, error } = await supabase
      .from('residential_projects')
      .insert({
        project_name: data.project_name,
        builder: data.builder || null,
        subcontractor: data.subcontractor || null,
        start_date: data.start_date || null,
        est_completion_date: data.est_completion_date || null,
        contract_value: data.contract_value || null,
        status: data.status || 'Pending',
        created_by: session.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating residential project:', error);
      return NextResponse.json({ message: 'Failed to create project' }, { status: 500 });
    }
    
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating residential project:', error);
    return NextResponse.json({ message: 'Failed to create project' }, { status: 500 });
  }
}
