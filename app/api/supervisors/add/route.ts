import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received data for new supervisor:', data);

    if (!data.name) {
      return NextResponse.json(
        { error: 'Supervisor name is required' },
        { status: 400 }
      );
    }

    const supabase = getDb();

    // Check if supervisor with this name already exists
    const { data: existingSupervisor } = await supabase
      .from('supervisors')
      .select('id')
      .eq('name', data.name)
      .single();

    if (existingSupervisor) {
      return NextResponse.json(
        { error: 'Supervisor with this name already exists' },
        { status: 409 }
      );
    }

    // Insert new supervisor
    const { data: newSupervisor, error } = await supabase
      .from('supervisors')
      .insert([{ name: data.name }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create supervisor' },
        { status: 500 }
      );
    }

    console.log('Successfully created supervisor:', newSupervisor);
    return NextResponse.json(newSupervisor);

  } catch (error) {
    console.error('Error creating supervisor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
