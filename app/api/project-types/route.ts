import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const supabase = getDb();
    
    const { data: projectTypes, error } = await supabase
      .from('project_types')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Database query error', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(projectTypes || []);
  } catch (error) {
    console.error('Error fetching project types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project types' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Project type name is required' },
        { status: 400 }
      );
    }

    const supabase = getDb();
    
    const { data, error } = await supabase
      .from('project_types')
      .insert([{ name: name.trim() }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to add project type', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Project type added successfully',
      data
    });
  } catch (error) {
    console.error('Error adding project type:', error);
    return NextResponse.json(
      { error: 'Failed to add project type' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Project type ID is required' },
        { status: 400 }
      );
    }

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Project type name is required' },
        { status: 400 }
      );
    }

    const supabase = getDb();

    const { data: existingType } = await supabase
      .from('project_types')
      .select('id')
      .eq('name', name.trim())
      .neq('id', id)
      .single();

    if (existingType) {
      return NextResponse.json(
        { error: 'Project type with this name already exists' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('project_types')
      .update({ name: name.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update project type', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Project type updated successfully',
      data
    });
  } catch (error) {
    console.error('Error updating project type:', error);
    return NextResponse.json(
      { error: 'Failed to update project type' },
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
        { error: 'Project type ID is required' },
        { status: 400 }
      );
    }

    const supabase = getDb();
    
    const { error } = await supabase
      .from('project_types')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete project type', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Project type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project type:', error);
    return NextResponse.json(
      { error: 'Failed to delete project type' },
      { status: 500 }
    );
  }
}
