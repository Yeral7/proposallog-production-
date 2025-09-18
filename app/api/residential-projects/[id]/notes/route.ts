import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolved = await params;
    const projectId = Number(resolved.id);
    if (!projectId || Number.isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
    }

    const supabase = getDb();
    const { data, error } = await supabase
      .from('residential_notes')
      .select('id, project_id, content, timestamp, user_id, users:users!residential_notes_user_id_fkey(name)')
      .eq('project_id', projectId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    const notes = (data || []).map((n: any) => {
      const u: any = (n as any).users;
      const author_name = Array.isArray(u) ? (u[0]?.name ?? null) : (u?.name ?? null);
      return {
        id: n.id,
        project_id: n.project_id,
        content: n.content,
        timestamp: n.timestamp,
        user_id: n.user_id,
        author_name,
      };
    });
    return NextResponse.json(notes, { status: 200 });
  } catch (e) {
    console.error('GET residential notes error:', e);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolved = await params;
    const projectId = Number(resolved.id);
    if (!projectId || Number.isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
    }

    const body = await request.json();
    const content = (body?.content || '').toString().trim();
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const supabase = getDb();
    const userId = decoded?.id ?? decoded?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('residential_notes')
      .insert({ project_id: projectId, content, user_id: userId })
      .select('id, project_id, content, timestamp, user_id, users:users!residential_notes_user_id_fkey(name)')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
    }

    const u: any = (data as any).users;
    const author_name = Array.isArray(u) ? (u[0]?.name ?? null) : (u?.name ?? null);
    const note = {
      id: data.id,
      project_id: data.project_id,
      content: data.content,
      timestamp: data.timestamp,
      user_id: data.user_id,
      author_name,
    };
    return NextResponse.json(note, { status: 201 });
  } catch (e) {
    console.error('POST residential note error:', e);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get('id');
    const noteId = Number(idStr);
    if (!noteId || Number.isNaN(noteId)) {
      return NextResponse.json({ error: 'Invalid note id' }, { status: 400 });
    }

    const supabase = getDb();
    const { data: note, error: fetchErr } = await supabase
      .from('residential_notes')
      .select('id, user_id')
      .eq('id', noteId)
      .single();
    if (fetchErr || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const userId = decoded?.id ?? decoded?.userId;
    const role = decoded?.role ?? 'viewer';
    const canDelete = (userId && note.user_id === userId) || ['manager', 'admin'].includes(role);
    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: delErr } = await supabase
      .from('residential_notes')
      .delete()
      .eq('id', noteId);
    if (delErr) {
      console.error('Supabase delete error:', delErr);
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error('DELETE residential note error:', e);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
