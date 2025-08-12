import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json(
        { error: 'Estimator name is required' },
        { status: 400 }
      );
    }

    const supabase = getDb();
    
    // Check if estimator with this name already exists
    const { data: existingEstimator } = await supabase
      .from('estimators')
      .select('id')
      .eq('name', data.name)
      .single();
    
    if (existingEstimator) {
      return NextResponse.json(
        { error: 'An estimator with this name already exists' },
        { status: 400 }
      );
    }

    const { data: result, error } = await supabase
      .from('estimators')
      .insert({ name: data.name })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create estimator' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      id: result.lastID 
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding estimator:', error);
    return NextResponse.json(
      { error: 'Failed to add estimator' },
      { status: 500 }
    );
  }
}
