import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const supabase = getDb();
    
    const { data: progressStatuses, error } = await supabase
      .from('progress_statuses')
      .select('id, name')
      .order('display_order', { ascending: true })
      .order('name');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Database query error', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(progressStatuses || []);
  } catch (error) {
    console.error('Error fetching progress statuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress statuses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Progress status name is required' },
        { status: 400 }
      );
    }

    const supabase = getDb();
    
    const { data, error } = await supabase
      .from('progress_statuses')
      .insert([{ name: name.trim() }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to add progress status', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Progress status added successfully',
      data
    });
  } catch (error) {
    console.error('Error adding progress status:', error);
    return NextResponse.json(
      { error: 'Failed to add progress status' },
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
        { error: 'Progress status ID is required' },
        { status: 400 }
      );
    }

    const supabase = getDb();
    
    const { error } = await supabase
      .from('progress_statuses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete progress status', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Progress status deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting progress status:', error);
    return NextResponse.json(
      { error: 'Failed to delete progress status' },
      { status: 500 }
    );
  }
}
