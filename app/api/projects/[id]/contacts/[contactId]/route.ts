import { NextResponse } from 'next/server';
import { getDb } from '../../../../../../lib/db';

// PUT/UPDATE contact
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    const { contactId } = resolvedParams;
    
    // Validate IDs
    if (isNaN(projectId) || !contactId) {
      return NextResponse.json({ error: 'Invalid project or contact ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, phone, email } = body;

    if (!name && !phone && !email) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const db = await getDb();

    // Check if contact exists
    const existingContact = await db.get('SELECT * FROM project_contacts WHERE id = ? AND project_id = ?', [contactId, projectId]);
    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const fieldsToUpdate = [];
    const values = [];

    if (name) {
      fieldsToUpdate.push('name = ?');
      values.push(name);
    }
    if (phone) {
      fieldsToUpdate.push('phone = ?');
      values.push(phone);
    }
    if (email) {
      fieldsToUpdate.push('email = ?');
      values.push(email);
    }

    values.push(contactId, projectId);

    const sql = `UPDATE project_contacts SET ${fieldsToUpdate.join(', ')} WHERE id = ? AND project_id = ?`;

    await db.run(sql, values);

    const updatedContact = await db.get('SELECT * FROM project_contacts WHERE id = ?', [contactId]);

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

// DELETE contact by ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    const { contactId } = resolvedParams;
    
    // Validate IDs
    if (isNaN(projectId) || !contactId) {
      return NextResponse.json({ error: 'Invalid project or contact ID' }, { status: 400 });
    }

    const db = await getDb();

    // Check if contact exists
    const existingContact = await db.get('SELECT * FROM project_contacts WHERE id = ? AND project_id = ?', [contactId, projectId]);
    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    await db.run('DELETE FROM project_contacts WHERE id = ? AND project_id = ?', [contactId, projectId]);

    return NextResponse.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
