import { NextResponse } from 'next/server';
const { getDb } = require('../../../lib/db.js');

export async function GET() {
  try {
    const db = await getDb();
    const supervisors = await db.all('SELECT * FROM supervisors ORDER BY name');
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

    const db = await getDb();
    const result = await db.run(
      'INSERT INTO supervisors (name) VALUES (?)',
      [name]
    );
    
    return NextResponse.json({ 
      id: result.lastID,
      name 
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
    const db = await getDb();
    
    // Check if any projects are using this supervisor
    const projects = await db.all(
      'SELECT COUNT(*) as count FROM projects WHERE supervisor_id = ?',
      [id]
    );
    
    if (projects[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete supervisor that is assigned to projects' },
        { status: 400 }
      );
    }
    
    await db.run(
      'DELETE FROM supervisors WHERE id = ?',
      [id]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting supervisor:', error);
    return NextResponse.json(
      { error: 'Failed to delete supervisor' },
      { status: 500 }
    );
  }
}
