import { NextResponse, NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedSession } from '@/lib/auth';

// GET /api/residential/projects/[projectId]/contacts - Get all contacts for a specific project
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
    
    const { data: contacts, error } = await supabase
      .from('residential_project_contacts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json({ message: 'Failed to fetch contacts' }, { status: 500 });
    }

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ message: 'Failed to fetch contacts' }, { status: 500 });
  }
}

// POST /api/residential/projects/[projectId]/contacts - Add a new contact to a project
export async function POST(
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
    
    if (!data.name) {
      return NextResponse.json({ message: 'Contact name is required' }, { status: 400 });
    }

    const supabase = getDb();
    
    const { data: newContact, error } = await supabase
      .from('residential_project_contacts')
      .insert({
        project_id: projectId,
        name: data.name,
        company: data.company || null,
        role: data.role || null,
        phone: data.phone || null,
        email: data.email || null,
        created_by: session.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating contact:', error);
      // foreign key constraint violation
      if (error.code === '23503') { 
        return NextResponse.json({ message: 'Project not found' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Failed to create contact' }, { status: 500 });
    }
    
    return NextResponse.json(newContact, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ message: 'Failed to create contact' }, { status: 500 });
  }
}
