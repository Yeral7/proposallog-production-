import { NextResponse } from 'next/server';
const { getDb } = require('../../../../lib/db.js');

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Status ID is required' },
        { status: 400 }
      );
    }
    
    const db = await getDb();
    await db.run('DELETE FROM statuses WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting status:', error);
    return NextResponse.json(
      { error: 'Failed to delete status' },
      { status: 500 }
    );
  }
}
