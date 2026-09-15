import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getNotionSyncConfig } from '@/lib/notionSyncServer';
import { LockHeldError, publishNotionProjects, readJournalValue, writeJournalValue } from '@/lib/notionPublish';
import { pullNotionChanges } from '@/lib/notionInbound';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const tally = (results: { action?: string }[]) =>
  results.reduce<Record<string, number>>((acc, row) => ((acc[row.action || 'unknown'] = (acc[row.action || 'unknown'] || 0) + 1), acc), {});

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const config = getNotionSyncConfig();
  if (!config.publishEnabled || !config.inboundEnabled) {
    return NextResponse.json({ skipped: 'sync flags disabled' });
  }
  try {
    const db = getDb();
    const pull = await pullNotionChanges(db, config, { dryRun: false, limit: 20 });
    for (const row of pull.results) {
      if (row.action === 'blocked' || row.action === 'review') {
        console.warn('Notion inbound', row.action, row.projectId ?? row.notionPageId, row.error ?? (row.conflicts || []).join(','));
      }
    }
    const cursor = Number(await readJournalValue(db, config, 'cron:publishCursor')) || 0;
    const publish = await publishNotionProjects(db, config, { dryRun: false, limit: 100, afterProjectId: cursor });
    const nextAfterProjectId = publish.nextAfterProjectId ?? 0;
    await writeJournalValue(db, config, 'cron:publishCursor', nextAfterProjectId);
    for (const row of publish.results) {
      if (row.action === 'blocked') console.warn('Notion publish blocked', row.projectId, row.error);
    }
    return NextResponse.json({
      pull: { supabaseWrites: pull.supabaseWrites, actions: tally(pull.results) },
      publish: { actions: tally(publish.results), nextAfterProjectId },
    });
  } catch (error) {
    if (error instanceof LockHeldError || (error instanceof Error && error.message.includes('Another publisher'))) {
      return NextResponse.json({ skipped: 'locked' });
    }
    console.error('Notion cron sync failed', error);
    return NextResponse.json({ error: 'Notion sync failed' }, { status: 502 });
  }
}
