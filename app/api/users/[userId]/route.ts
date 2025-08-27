import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedSession } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = getVerifiedSession(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await params;
    const supabase = getDb();
    const body = await request.json();

    const { role, estimatorId, supervisorId, positions } = body as {
      role?: 'viewer' | 'manager' | 'admin';
      estimatorId?: number | null;
      supervisorId?: number | null;
      positions?: { add?: number[]; remove?: number[]; primaryId?: number | null };
    };

    // Begin updates
    // Update user role if provided
    if (role) {
      const { error: roleErr } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);
      if (roleErr) {
        console.error('Error updating user role:', roleErr);
        return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
      }
    }

    // Handle estimator link changes
    if (typeof estimatorId !== 'undefined') {
      // Clear any existing estimator linked to this user
      const { error: clearEstErr } = await supabase
        .from('estimators')
        .update({ user_id: null })
        .eq('user_id', userId);
      if (clearEstErr) {
        console.error('Error clearing estimator link:', clearEstErr);
        return NextResponse.json({ error: 'Failed to update estimator link' }, { status: 500 });
      }
      // If new estimatorId provided (not null), link it
      if (estimatorId) {
        const { error: setEstErr } = await supabase
          .from('estimators')
          .update({ user_id: userId })
          .eq('id', estimatorId);
        if (setEstErr) {
          console.error('Error setting estimator link:', setEstErr);
          return NextResponse.json({ error: 'Failed to set estimator link' }, { status: 500 });
        }
      }
    }

    // Handle supervisor link changes
    if (typeof supervisorId !== 'undefined') {
      // Clear any existing supervisor linked to this user
      const { error: clearSupErr } = await supabase
        .from('supervisors')
        .update({ user_id: null })
        .eq('user_id', userId);
      if (clearSupErr) {
        console.error('Error clearing supervisor link:', clearSupErr);
        return NextResponse.json({ error: 'Failed to update supervisor link' }, { status: 500 });
      }
      // If new supervisorId provided (not null), link it
      if (supervisorId) {
        const { error: setSupErr } = await supabase
          .from('supervisors')
          .update({ user_id: userId })
          .eq('id', supervisorId);
        if (setSupErr) {
          console.error('Error setting supervisor link:', setSupErr);
          return NextResponse.json({ error: 'Failed to set supervisor link' }, { status: 500 });
        }
      }
    }

    // Manage positions via user_positions
    if (typeof positions !== 'undefined') {
      const uid = parseInt(userId, 10);
      // Fetch current assignments to prevent duplicates
      const { data: current, error: curErr } = await supabase
        .from('user_positions')
        .select('position_id, is_primary')
        .eq('user_id', uid);
      if (curErr) {
        console.error('Error fetching current positions:', curErr);
        return NextResponse.json({ error: 'Failed to update positions' }, { status: 500 });
      }

      const existingIds = new Set((current || []).map((r: any) => r.position_id));

      // Add positions
      if (Array.isArray(positions.add) && positions.add.length > 0) {
        const toAdd = positions.add.filter((pid) => !existingIds.has(pid));
        if (toAdd.length > 0) {
          const rows = toAdd.map((pid) => ({ user_id: uid, position_id: pid, is_primary: false }));
          const { error: addErr } = await supabase
            .from('user_positions')
            .insert(rows);
          if (addErr) {
            console.error('Error adding positions:', addErr);
            return NextResponse.json({ error: 'Failed to add positions' }, { status: 500 });
          }
        }
      }

      // Remove positions
      if (Array.isArray(positions.remove) && positions.remove.length > 0) {
        const { error: delErr } = await supabase
          .from('user_positions')
          .delete()
          .eq('user_id', uid)
          .in('position_id', positions.remove);
        if (delErr) {
          console.error('Error removing positions:', delErr);
          return NextResponse.json({ error: 'Failed to remove positions' }, { status: 500 });
        }
      }

      // Set primary position
      if ('primaryId' in positions) {
        // First, clear all
        const { error: clrErr } = await supabase
          .from('user_positions')
          .update({ is_primary: false })
          .eq('user_id', uid);
        if (clrErr) {
          console.error('Error clearing primary position:', clrErr);
          return NextResponse.json({ error: 'Failed to update primary position' }, { status: 500 });
        }
        if (positions.primaryId) {
          const { error: setPErr } = await supabase
            .from('user_positions')
            .update({ is_primary: true })
            .eq('user_id', uid)
            .eq('position_id', positions.primaryId);
          if (setPErr) {
            console.error('Error setting primary position:', setPErr);
            return NextResponse.json({ error: 'Failed to set primary position' }, { status: 500 });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
