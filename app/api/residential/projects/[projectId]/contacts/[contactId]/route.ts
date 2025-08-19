import { NextResponse } from 'next/server';
import { openDb } from '../../../../../../../db';
import { authenticate } from '@/lib/auth';

// GET /api/residential/projects/[projectId]/contacts/[contactId] - Get a specific contact
export async function GET(
  request: Request,
  { params }: { params: { projectId: string, contactId: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, contactId } = params;
    const db = await openDb();
    
    // Get the specific contact for the project
    const contact = await db.get(`
      SELECT * FROM residential_project_contacts
      WHERE id = ? AND project_id = ?
    `, [contactId, projectId]);

    if (!contact) {
      return NextResponse.json({ message: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json({ message: 'Failed to fetch contact' }, { status: 500 });
  }
}

// PUT /api/residential/projects/[projectId]/contacts/[contactId] - Update a specific contact
export async function PUT(
  request: Request,
  { params }: { params: { projectId: string, contactId: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, contactId } = params;
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json({ message: 'Contact name is required' }, { status: 400 });
    }

    const db = await openDb();
    
    // Check if the contact exists for the specific project
    const contact = await db.get(`
      SELECT * FROM residential_project_contacts
      WHERE id = ? AND project_id = ?
    `, [contactId, projectId]);

    if (!contact) {
      return NextResponse.json({ message: 'Contact not found' }, { status: 404 });
    }
    
    // Update the contact
    await db.run(`
      UPDATE residential_project_contacts
      SET 
        name = ?,
        company = ?,
        role = ?,
        phone = ?,
        email = ?,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND project_id = ?
    `, [
      data.name,
      data.company || null,
      data.role || null,
      data.phone || null,
      data.email || null,
      user.id,
      contactId,
      projectId
    ]);
    
    // Get the updated contact
    const updatedContact = await db.get(`
      SELECT * FROM residential_project_contacts
      WHERE id = ?
    `, [contactId]);
    
    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ message: 'Failed to update contact' }, { status: 500 });
  }
}

// DELETE /api/residential/projects/[projectId]/contacts/[contactId] - Delete a specific contact
export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string, contactId: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, contactId } = params;
    const db = await openDb();
    
    // Check if the contact exists for the specific project
    const contact = await db.get(`
      SELECT * FROM residential_project_contacts
      WHERE id = ? AND project_id = ?
    `, [contactId, projectId]);

    if (!contact) {
      return NextResponse.json({ message: 'Contact not found' }, { status: 404 });
    }
    
    // Delete the contact
    await db.run(`
      DELETE FROM residential_project_contacts
      WHERE id = ? AND project_id = ?
    `, [contactId, projectId]);
    
    return NextResponse.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ message: 'Failed to delete contact' }, { status: 500 });
  }
}
