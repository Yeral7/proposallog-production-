import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET!);

    const supabase = getDb();
    const { data, error } = await supabase
      .from('residential_subcontractors')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error fetching subcontractors:', error);
      return NextResponse.json({ error: 'Failed to fetch subcontractors' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching subcontractors:', error);
    return NextResponse.json({ error: 'Failed to fetch subcontractors' }, { status: 500 });
  }
}
