import { NextResponse } from 'next/server';
const { getDb } = require('../../../../../../lib/db.js');

// PUT/UPDATE contact
export async function PUT(
  request: Request,
  { params }: { params: { id: string, contactId: string } }
) {
  try {
    const projectId = parseInt(params.id);
    const contactId = params.contactId;
    
    // Validate IDs
    if (isNaN(projectId) || !contactId) {
      return NextResponse.json(
        { error: 'Invalid project ID or contact ID' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.name) {
      return NextResponse.json(
        { error: 'Title and name are required' },
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
    
    // Update contact
    await db.run(
      `UPDATE project_contacts
       SET title = ?, name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND project_id = ?`,
      [data.title, data.name, data.email || null, data.phone || null, contactId, projectId]
    );
    
    // Get the updated contact
    const updatedContact = await db.get(
      'SELECT * FROM project_contacts WHERE id = ?',
      [contactId]
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

// DELETE contact by ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string, contactId: string } }
) {
  try {
    const projectId = parseInt(params.id);
    const contactId = params.contactId;
    
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
