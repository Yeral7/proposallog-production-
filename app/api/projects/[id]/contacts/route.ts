import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';

// GET project contacts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    
    // Validate project ID
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }
    
    const supabase = getDb();
    
    // Get all contacts for the project using Supabase
    const { data: contacts, error } = await supabase
      .from('project_contacts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch project contacts' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(contacts || [], { status: 200 });
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    
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
    
    const supabase = getDb();
    
    // Check if project exists
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();
    
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Check if we already have 3 contacts for this project
    const { count } = await supabase
      .from('project_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);
    
    if (count && count >= 3) {
      return NextResponse.json(
        { error: 'Project already has the maximum of 3 contacts' },
        { status: 400 }
      );
    }
    
    // Insert new contact
    const { data: newContact, error } = await supabase
      .from('project_contacts')
      .insert({
        project_id: projectId,
        title: data.title || null,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create project contact' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(newContact, { status: 201 });
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    
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
    
    const supabase = getDb();
    
    // Check if contact exists and belongs to the project
    const { data: existingContact } = await supabase
      .from('project_contacts')
      .select('*')
      .eq('id', data.id)
      .eq('project_id', projectId)
      .single();
    
    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found for this project' },
        { status: 404 }
      );
    }
    
    // Update contact
    const { data: updatedContact, error } = await supabase
      .from('project_contacts')
      .update({
        title: data.title || null,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    const { id: contactId } = await request.json();

    // Validate IDs
    if (isNaN(projectId) || !contactId) {
      return NextResponse.json(
        { error: 'Invalid project ID or contact ID' },
        { status: 400 }
      );
    }

    const supabase = getDb();

    // Check if contact exists and belongs to the project
    const { data: existingContact } = await supabase
      .from('project_contacts')
      .select('*')
      .eq('id', contactId)
      .eq('project_id', projectId)
      .single();

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found for this project' },
        { status: 404 }
      );
    }

    // Delete contact
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
