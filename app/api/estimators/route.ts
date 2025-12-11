import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const supabase = getDb();
    const { data: estimators, error } = await supabase.from('estimators').select('id, name, user_id').order('name');
    if (error) throw error;
    
    // Make sure we always return an array
    return NextResponse.json(Array.isArray(estimators) ? estimators : []);
  } catch (error) {
    console.error('Error fetching estimators:', error);
    // Return an empty array on error instead of error object
    return NextResponse.json([]);
  }
}

// PUT update estimator
export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET!);

    const { id, name } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Estimator ID is required' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Estimator name is required' }, { status: 400 });
    }

    const supabase = getDb();

    const { data: existingEstimator } = await supabase
      .from('estimators')
      .select('id')
      .eq('name', name.trim())
      .neq('id', id)
      .single();

    if (existingEstimator) {
      return NextResponse.json({ error: 'Estimator with this name already exists' }, { status: 409 });
    }

    const { data: updatedEstimator, error } = await supabase
      .from('estimators')
      .update({ name: name.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to update estimator' }, { status: 500 });
    }

    return NextResponse.json(updatedEstimator, { status: 200 });
  } catch (error) {
    console.error('Error updating estimator:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update estimator' }, { status: 500 });
  }
}
