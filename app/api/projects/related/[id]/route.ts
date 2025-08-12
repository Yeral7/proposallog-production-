import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    
    if (isNaN(projectId)) {
      return NextResponse.json({ relatedProjects: [] }, { status: 200 });
    }

    const supabase = getDb();
    
    // Get the current project's info
    const { data: currentProject } = await supabase
      .from('projects')
      .select(`
        *,
        builders:builder_id(name)
      `)
      .eq('id', projectId)
      .single();
    
    if (!currentProject) {
      return NextResponse.json({ relatedProjects: [] }, { status: 200 });
    }
    
    // For testing purposes, let's create a simple mock implementation that returns other projects
    // from different builders with similar names
    const { data: mockRelatedProjects } = await supabase
      .from('projects')
      .select(`
        id,
        project_name,
        builders:builder_id(name),
        statuses:status_id(label)
      `)
      .neq('id', projectId)
      .neq('builder_id', currentProject.builder_id)
      .limit(3);

    // Transform the data to match expected format
    const formattedRelatedProjects = (mockRelatedProjects || []).map((project: any) => ({
      id: project.id,
      project_name: project.project_name,
      builder_name: project.builders?.name || 'N/A',
      status_label: project.statuses?.label || 'N/A'
    }));
    
    console.log('Mock related projects:', formattedRelatedProjects);
    
    return NextResponse.json({ 
      relatedProjects: formattedRelatedProjects 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching related projects:', error);
    return NextResponse.json({ relatedProjects: [] }, { status: 200 });
  }
}
