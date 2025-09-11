import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/builder-contacts?builderId=<id>
export async function GET(request: NextRequest) {
  try {
    const supabase = getDb();
    const { searchParams } = new URL(request.url);
    const builderIdParam = searchParams.get('builderId');

    let query = supabase
      .from('builder_contacts')
      .select('id, builder_id, name, title, email, phone, created_at, updated_at')
      .order('name', { ascending: true });

    if (builderIdParam) {
      const builderId = parseInt(builderIdParam, 10);
      if (isNaN(builderId)) {
        return NextResponse.json({ error: 'Invalid builderId' }, { status: 400 });
      }
      query = query.eq('builder_id', builderId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Supabase error (GET builder-contacts):', error);
      return NextResponse.json({ error: 'Failed to fetch builder contacts' }, { status: 500 });
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    console.error('Error fetching builder contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch builder contacts' }, { status: 500 });
  }
}

// POST /api/builder-contacts
// body: { builder_id: number, name: string, title?: string, email?: string, phone?: string }
export async function POST(request: NextRequest) {
  try {
    const supabase = getDb();
    const body = await request.json();
    const { builder_id, name, title, email, phone } = body || {};

    if (!builder_id || !name) {
      return NextResponse.json({ error: 'builder_id and name are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('builder_contacts')
      .insert({ builder_id, name, title: title || null, email: email || null, phone: phone || null })
      .select('id, builder_id, name, title, email, phone, created_at, updated_at')
      .single();

    if (error) {
      console.error('Supabase error (POST builder-contacts):', error);
      return NextResponse.json({ error: 'Failed to create builder contact' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating builder contact:', error);
    return NextResponse.json({ error: 'Failed to create builder contact' }, { status: 500 });
  }
}

// PUT /api/builder-contacts
// body: { id: number, name?: string, title?: string, email?: string, phone?: string }
export async function PUT(request: NextRequest) {
  try {
    const supabase = getDb();
    const body = await request.json();
    const { id, name, title, email, phone } = body || {};

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (title !== undefined) updateData.title = title || null;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;

    const { data, error } = await supabase
      .from('builder_contacts')
      .update(updateData)
      .eq('id', id)
      .select('id, builder_id, name, title, email, phone, created_at, updated_at')
      .single();

    if (error) {
      console.error('Supabase error (PUT builder-contacts):', error);
      return NextResponse.json({ error: 'Failed to update builder contact' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error updating builder contact:', error);
    return NextResponse.json({ error: 'Failed to update builder contact' }, { status: 500 });
  }
}

// DELETE /api/builder-contacts?id=<id>
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getDb();
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    if (!idParam) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('builder_contacts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error (DELETE builder-contacts):', error);
      return NextResponse.json({ error: 'Failed to delete builder contact' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting builder contact:', error);
    return NextResponse.json({ error: 'Failed to delete builder contact' }, { status: 500 });
  }
}
