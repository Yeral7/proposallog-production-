import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received data for new builder:', data);

    if (!data.name) {
      return NextResponse.json(
        { error: 'Builder name is required' },
        { status: 400 }
      );
    }

    const supabase = getDb();

    // Check if builder with this name already exists
    const { data: existingBuilder } = await supabase
      .from('builders')
      .select('id')
      .eq('name', data.name)
      .single();

    if (existingBuilder) {
      return NextResponse.json(
        { error: 'A builder with this name already exists' },
        { status: 400 }
      );
    }

    const { data: result, error } = await supabase
      .from('builders')
      .insert({ name: data.name })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create builder' },
        { status: 500 }
      );
    }
    console.log('Database insert result:', result);

    return NextResponse.json({ 
      success: true,
      id: result.lastID 
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding builder:', error);
    return NextResponse.json(
      { error: 'Failed to add builder' },
      { status: 500 }
    );
  }
}
