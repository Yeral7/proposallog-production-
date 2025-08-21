import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const supabase = getDb();
    
    const { data: projectStyles, error } = await supabase
      .from('project_styles')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Database query error', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(projectStyles || []);
  } catch (error) {
    console.error('Error fetching project styles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project styles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Project style name is required' },
        { status: 400 }
      );
    }

    const supabase = getDb();
    
    const { data, error } = await supabase
      .from('project_styles')
      .insert([{ name: name.trim() }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to add project style', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Project style added successfully',
      data
    });
  } catch (error) {
    console.error('Error adding project style:', error);
    return NextResponse.json(
      { error: 'Failed to add project style' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Project style ID is required' },
        { status: 400 }
      );
    }

    const supabase = getDb();
    
    const { error } = await supabase
      .from('project_styles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete project style', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Project style deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project style:', error);
    return NextResponse.json(
      { error: 'Failed to delete project style' },
      { status: 500 }
    );
  }
}
