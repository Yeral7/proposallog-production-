import { NextResponse, NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedSession } from '@/lib/auth';

// GET /api/residential/projects/[projectId]/contacts/[contactId] - Get a specific contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; contactId: string }> },
) {
  try {
    const session = getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, contactId } = await params;
    const supabase = getDb();

    const { data: contact, error } = await supabase
      .from('residential_project_contacts')
      .select('*')
      .eq('id', contactId)
      .eq('project_id', projectId)
      .single();

    if (error || !contact) {
      return NextResponse.json({ message: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { message: 'Failed to fetch contact' },
      { status: 500 },
    );
  }
}

// PUT /api/residential/projects/[projectId]/contacts/[contactId] - Update a specific contact
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; contactId: string }> },
) {
  try {
    const session = getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, contactId } = await params;
    const data = await request.json();

    if (!data.name) {
      return NextResponse.json(
        { message: 'Contact name is required' },
        { status: 400 },
      );
    }

    const supabase = getDb();

    const { data: updatedContact, error } = await supabase
      .from('residential_project_contacts')
      .update({
        name: data.name,
        company: data.company || null,
        role: data.role || null,
        phone: data.phone || null,
        email: data.email || null,
        updated_by: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating contact:', error);
      // PostgREST error `PGRST204` indicates no rows were found
      if (error.code === 'PGRST204') {
        return NextResponse.json(
          { message: 'Contact not found' },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { message: 'Failed to update contact' },
        { status: 500 },
      );
    }

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { message: 'Failed to update contact' },
      { status: 500 },
    );
  }
}

// DELETE /api/residential/projects/[projectId]/contacts/[contactId] - Delete a specific contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; contactId: string }> },
) {
  try {
    const session = getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, contactId } = await params;
    const supabase = getDb();

    const { error } = await supabase
      .from('residential_project_contacts')
      .delete()
      .eq('id', contactId)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error deleting contact:', error);
      return NextResponse.json(
        { message: 'Failed to delete contact' },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { message: 'Failed to delete contact' },
      { status: 500 },
    );
  }
}
