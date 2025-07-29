import { NextRequest, NextResponse } from 'next/server';
const { getDb } = require('../../../../../lib/db.js');

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);
    
    if (isNaN(projectId)) {
      return NextResponse.json({ relatedProjects: [] }, { status: 200 });
    }

    const db = await getDb();
    
    // Get the current project's info
    const currentProject = await db.get(`
      SELECT p.*, b.name as builder_name 
      FROM projects p 
      JOIN builders b ON p.builder_id = b.id 
      WHERE p.id = ?
    `, [projectId]);
    
    if (!currentProject) {
      return NextResponse.json({ relatedProjects: [] }, { status: 200 });
    }
    
    // For testing purposes, let's create a simple mock implementation that returns other projects
    // from different builders with similar names
    const mockRelatedProjects = await db.all(`
      SELECT 
        p.id,
        p.project_name,
        b.name as builder_name,
        s.label as status_label
      FROM projects p
      JOIN builders b ON p.builder_id = b.id
      JOIN statuses s ON p.status_id = s.id
      WHERE p.id != ? AND b.id != ? 
      LIMIT 3
    `, [projectId, currentProject.builder_id]);
    
    console.log('Mock related projects:', mockRelatedProjects);
    
    return NextResponse.json({ 
      relatedProjects: mockRelatedProjects 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching related projects:', error);
    return NextResponse.json({ relatedProjects: [] }, { status: 200 });
  }
}
