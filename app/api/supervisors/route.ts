import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export async function GET() {
  try {
    const supabase = getDb();
    const { data: supervisors, error } = await supabase.from('supervisors').select('*').order('name');
    if (error) throw error;
    return NextResponse.json(supervisors);
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supervisors' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const supabase = getDb();
    const { data: result, error } = await supabase
      .from('supervisors')
      .insert({ name })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create supervisor' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      id: result.id,
      name: result.name 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating supervisor:', error);
    return NextResponse.json(
      { error: 'Failed to create supervisor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!id) {
    return NextResponse.json(
      { error: 'Supervisor ID is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = getDb();
    
    // Check if any projects are using this supervisor
    const { count, error: countError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('supervisor_id', id);

    if (countError) {
      console.error('Error checking supervisor usage:', countError);
      return NextResponse.json(
        { error: 'Failed to check supervisor usage' },
        { status: 500 }
      );
    }
    
    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete supervisor that is assigned to projects' },
        { status: 400 }
      );
    }
    
    const { error } = await supabase
      .from('supervisors')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting supervisor:', error);
      return NextResponse.json(
        { error: 'Failed to delete supervisor' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting supervisor:', error);
    return NextResponse.json(
      { error: 'Failed to delete supervisor' },
      { status: 500 }
    );
  }
}
