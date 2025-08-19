import { NextResponse } from 'next/server';
import { openDb } from '../../../../../../db';
import { authenticate } from '@/lib/auth';

// GET /api/residential/projects/[projectId]/contacts - Get all contacts for a specific project
export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.projectId;
    const db = await openDb();
    
    // Get the contacts for the specific project
    const contacts = await db.all(`
      SELECT * FROM residential_project_contacts
      WHERE project_id = ?
      ORDER BY created_at DESC
    `, [projectId]);

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ message: 'Failed to fetch contacts' }, { status: 500 });
  }
}

// POST /api/residential/projects/[projectId]/contacts - Add a new contact to a project
export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.projectId;
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json({ message: 'Contact name is required' }, { status: 400 });
    }

    const db = await openDb();
    
    // Check if the project exists
    const project = await db.get('SELECT id FROM residential_projects WHERE id = ?', [projectId]);
    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }
    
    // Insert the new contact
    const result = await db.run(`
      INSERT INTO residential_project_contacts (
        project_id,
        name,
        company,
        role,
        phone,
        email,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      projectId,
      data.name,
      data.company || null,
      data.role || null,
      data.phone || null,
      data.email || null,
      user.id
    ]);
    
    // Get the newly created contact
    const newContact = await db.get(`
      SELECT * FROM residential_project_contacts 
      WHERE id = ?
    `, result.lastID);
    
    return NextResponse.json(newContact, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ message: 'Failed to create contact' }, { status: 500 });
  }
}
