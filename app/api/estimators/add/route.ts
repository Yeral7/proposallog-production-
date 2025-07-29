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

    const db = await getDb();
    
    // Check if estimator with this name already exists
    const existingEstimator = await db.get(
      'SELECT id FROM estimators WHERE name = ?',
      [data.name]
    );
    
    if (existingEstimator) {
      return NextResponse.json(
        { error: 'An estimator with this name already exists' },
        { status: 400 }
      );
    }

    const result = await db.run(
      'INSERT INTO estimators (name) VALUES (?)',
      [data.name]
    );
    
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
