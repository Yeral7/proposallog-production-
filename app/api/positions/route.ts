import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedSession } from '@/lib/auth';

export async function GET(_request: NextRequest) {
  try {
    const supabase = getDb();
    const { data, error } = await supabase
      .from('positions')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching positions:', error);
      return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
    }

    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Unexpected error fetching positions:', error);
    return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getVerifiedSession(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getDb();
    const body = await request.json();
    const { name, description }: { name: string; description?: string } = body || {};

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Attempt to insert; rely on DB unique constraint for duplicates
    const { data: created, error: insertErr } = await supabase
      .from('positions')
      .insert({ name: name.trim() })
      .select('id, name')
      .single();

    if (insertErr) {
      // Handle unique violation as 409
      const msg = (insertErr as any)?.message || String(insertErr);
      const isUnique = msg.toLowerCase().includes('duplicate') || msg.includes('23505');
      const status = isUnique ? 409 : 500;
      return NextResponse.json({ error: isUnique ? 'Position name already exists' : 'Failed to create position' }, { status });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Unexpected error creating position:', error);
    return NextResponse.json({ error: 'Failed to create position' }, { status: 500 });
  }
}
