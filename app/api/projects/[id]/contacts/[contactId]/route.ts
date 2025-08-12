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
    const { name, phone, email, role, company } = body;

    if (!name && !phone && !email) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const supabase = getDb();

    // Check if contact exists
    const { data: existingContact } = await supabase
      .from('project_contacts')
      .select('*')
      .eq('id', contactId)
      .eq('project_id', projectId)
      .single();
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

    // Build update object
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;
    if (company) updateData.company = company;

    const { data: updatedContact, error } = await supabase
      .from('project_contacts')
      .update(updateData)
      .eq('id', contactId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating contact:', error);
      return NextResponse.json(
        { error: 'Failed to update contact' },
        { status: 500 }
      );
    }

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

    const supabase = getDb();

    // Check if contact exists
    const { data: existingContact } = await supabase
      .from('project_contacts')
      .select('*')
      .eq('id', contactId)
      .eq('project_id', projectId)
      .single();
      
    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('project_contacts')
      .delete()
      .eq('id', contactId)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error deleting contact:', error);
      return NextResponse.json(
        { error: 'Failed to delete contact' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
