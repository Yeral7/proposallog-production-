import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// This is a development-only endpoint to seed a test user
export async function POST(request: Request) {
  // Auth seeding disabled for Supabase migration
  // Users should be managed through Supabase Auth or manually created
  return NextResponse.json({
    message: 'Auth seeding disabled - using Supabase for user management',
    success: true
  });
}
