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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getDb();
    const { data, error } = await supabase
      .from('residential_projects')
      .select('subcontractor')
      .not('subcontractor', 'is', null)
      .neq('subcontractor', '');

    if (error) {
      console.error('Supabase error fetching distinct subcontractors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subcontractors' },
        { status: 500 }
      );
    }

    // Create a unique list of subcontractor names
    const distinctSubcontractors = [...new Set(data.map(item => item.subcontractor))].sort();

    return NextResponse.json(distinctSubcontractors, { status: 200 });

  } catch (error) {
    console.error('Error fetching distinct subcontractors:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch subcontractors' }, { status: 500 });
  }
}
