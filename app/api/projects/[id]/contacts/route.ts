import { NextResponse } from 'next/server';
const { getDb } = require('../../../../../lib/db.js');

// GET project contacts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);
    
    // Validate project ID
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }
    
    const db = await getDb();
    
    // Get all contacts for the project
    const contacts = await db.all(
      `SELECT * FROM project_contacts WHERE project_id = ? ORDER BY created_at ASC`,
      [projectId]
    );
    
    return NextResponse.json(contacts, { status: 200 });
  } catch (error) {
    console.error('Error fetching project contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project contacts' },
      { status: 500 }
    );
  }
}

// POST new contact
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);
    
    // Validate project ID
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    const db = await getDb();
    
    // Check if project exists
    const existingProject = await db.get('SELECT id FROM projects WHERE id = ?', [projectId]);
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Check if we already have 3 contacts for this project
    const contactCount = await db.get(
      'SELECT COUNT(*) as count FROM project_contacts WHERE project_id = ?',
      [projectId]
    );
    
    if (contactCount.count >= 3) {
      return NextResponse.json(
        { error: 'Project already has the maximum of 3 contacts' },
        { status: 400 }
      );
    }
    
    // Insert new contact
    const result = await db.run(
      `INSERT INTO project_contacts (project_id, title, name, email, phone)
       VALUES (?, ?, ?, ?, ?)`,
      [projectId, data.title || null, data.name, data.email || null, data.phone || null]
    );
    
    // Get the inserted contact
    const newContact = await db.get(
      'SELECT * FROM project_contacts WHERE id = ?',
      [result.lastID]
    );
    
    return NextResponse.json(
      newContact,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project contact:', error);
    return NextResponse.json(
      { error: 'Failed to create project contact' },
      { status: 500 }
    );
  }
}

// PUT/UPDATE contact
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);
    
    // Validate project ID
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Validate contact ID and required fields
    if (!data.id || !data.name) {
      return NextResponse.json(
        { error: 'Contact ID and name are required' },
        { status: 400 }
      );
    }
    
    const db = await getDb();
    
    // Check if contact exists and belongs to the project
    const existingContact = await db.get(
      'SELECT * FROM project_contacts WHERE id = ? AND project_id = ?',
      [data.id, projectId]
    );
    
    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found for this project' },
        { status: 404 }
      );
    }
    
    // Update contact
    await db.run(
      `UPDATE project_contacts
       SET title = ?, name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND project_id = ?`,
      [data.title || null, data.name, data.email || null, data.phone || null, data.id, projectId]
    );
    
    // Get the updated contact
    const updatedContact = await db.get(
      'SELECT * FROM project_contacts WHERE id = ?',
      [data.id]
    );
    
    return NextResponse.json(updatedContact, { status: 200 });
  } catch (error) {
    console.error('Error updating project contact:', error);
    return NextResponse.json(
      { error: 'Failed to update project contact' },
      { status: 500 }
    );
  }
}

// DELETE contact
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);
    const { id: contactId } = await request.json();

    // Validate IDs
    if (isNaN(projectId) || !contactId) {
      return NextResponse.json(
        { error: 'Invalid project ID or contact ID' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if contact exists and belongs to the project
    const existingContact = await db.get(
      'SELECT * FROM project_contacts WHERE id = ? AND project_id = ?',
      [contactId, projectId]
    );

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found for this project' },
        { status: 404 }
      );
    }

    // Delete contact
    await db.run(
      'DELETE FROM project_contacts WHERE id = ? AND project_id = ?',
      [contactId, projectId]
    );

    return NextResponse.json(
      { success: true, message: 'Contact deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting project contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete project contact' },
      { status: 500 }
    );
  }
}
