import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const supabase = getDb();
    
    // First get the project IDs that are already ongoing
    const { data: ongoingProjectIds, error: ongoingError } = await supabase
      .from('projects_ongoing')
      .select('project_id');

    if (ongoingError) {
      console.error('Error fetching ongoing project IDs:', ongoingError);
      return NextResponse.json(
        { error: 'Database query error', details: ongoingError.message },
        { status: 500 }
      );
    }

    const excludeIds = ongoingProjectIds?.map(p => p.project_id) || [];

    // First get the status ID for "Awarded"
    const { data: awardedStatus, error: statusError } = await supabase
      .from('statuses')
      .select('id')
      .eq('label', 'Awarded')
      .single();

    if (statusError || !awardedStatus) {
      console.error('Error fetching Awarded status:', statusError);
      return NextResponse.json(
        { error: 'Could not find Awarded status' },
        { status: 500 }
      );
    }

    // Fetch awarded projects that are not already in the ongoing projects table
    let query = supabase
      .from('projects')
      .select(`
        id,
        project_name
      `)
      .eq('status_id', awardedStatus.id)
      .order('project_name');

    // Only add the not.in filter if there are ongoing projects to exclude
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    const { data: awardedProjects, error } = await query;
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Database query error', details: error.message },
        { status: 500 }
      );
    }
    
    // Transform the data to match expected format
    const formattedProjects = (awardedProjects || []).map((project: any) => ({
      id: project.id,
      project_name: project.project_name
    }));

    return NextResponse.json(formattedProjects);
  } catch (error) {
    console.error('Error fetching awarded projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch awarded projects' },
      { status: 500 }
    );
  }
}
