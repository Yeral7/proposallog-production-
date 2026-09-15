import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { getNotionSyncConfig, getNotionSyncStatus, previewNotionSync } from '@/lib/notionSyncServer';
import { publishNotionProjects, setupNotionPublishing } from '@/lib/notionPublish';
import { pullNotionChanges } from '@/lib/notionInbound';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function requireAdmin(request: NextRequest) {
  const session = getVerifiedSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(session.id);
  if (!Number.isSafeInteger(id) || id <= 0 || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  const { data, error } = await getDb().from('users').select('role').eq('id', id).single();
  if (error || data?.role !== 'admin') return NextResponse.json({ error: 'Admin access could not be verified' }, { status: 403 });
  return null;
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  return json(getNotionSyncStatus(getNotionSyncConfig()));
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  let body: { scope?: string; limit?: number; projectId?: number; afterProjectId?: number; pageId?: string; dryRun?: boolean; [key: string]: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Expected a JSON request body' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'Expected a JSON object' }, 400);
  }
  const allowed = ['scope', 'limit', 'projectId', 'afterProjectId', 'pageId', 'dryRun'];
  if (Object.keys(body).some(key => !allowed.includes(key))) {
    return json({ error: `Only ${allowed.join(', ')} are accepted.` }, 400);
  }
  const scope = body.scope ?? 'source';
  const limit = body.limit ?? (scope === 'publish' ? 5 : scope === 'inbound' ? 10 : 20);
  const dryRun = body.dryRun !== false;
  if (!['source', 'compare', 'setup', 'publish', 'inbound'].includes(scope) || !Number.isInteger(limit) || limit < 1 || limit > (scope === 'publish' ? 5 : scope === 'inbound' ? 20 : 100) || (body.projectId !== undefined && (!Number.isSafeInteger(body.projectId) || body.projectId <= 0)) || (body.afterProjectId !== undefined && (scope !== 'publish' || !Number.isSafeInteger(body.afterProjectId) || body.afterProjectId < 0)) || (body.pageId !== undefined && (scope !== 'inbound' || typeof body.pageId !== 'string' || !body.pageId.trim())) || (body.dryRun !== undefined && typeof body.dryRun !== 'boolean') || (!dryRun && !['setup', 'publish', 'inbound'].includes(scope))) {
    return json({ error: 'Use scope source/compare/setup/publish/inbound, a boolean dryRun, limit 1–100 (publish: 1–5, inbound: 1–20), a positive projectId, a nonnegative afterProjectId for publishing, and a Notion pageId for inbound.' }, 400);
  }
  const config = getNotionSyncConfig();
  if (scope !== 'source' && ((!config.previewEnabled && !config.publishEnabled) || !config.token)) {
    return json({ error: 'Set NOTION_TOKEN and a preview or publish flag in the server environment to use Notion.', ...getNotionSyncStatus(config) }, 409);
  }
  if (scope === 'inbound' && !dryRun && !config.inboundEnabled) {
    return json({ error: 'Inbound sync is disabled. Set NOTION_SYNC_INBOUND_ENABLED=true on a single host with persistent NOTION_SYNC_STATE_DIR storage.' }, 409);
  }
  if (!dryRun && !config.publishEnabled) {
    return json({ error: 'Live publishing is disabled. Set NOTION_SYNC_PUBLISH_ENABLED=true on a single publisher host with persistent NOTION_SYNC_STATE_DIR storage.' }, 409);
  }
  try {
    if (scope === 'setup') {
      return json(await setupNotionPublishing(config, dryRun, getDb()));
    }
    if (scope === 'inbound') {
      return json(await pullNotionChanges(getDb(), config, { dryRun, limit, pageId: body.pageId }));
    }
    if (scope === 'publish') {
      return json(await publishNotionProjects(getDb(), config, { dryRun, limit, projectId: body.projectId, afterProjectId: body.afterProjectId }));
    }
    return json(await previewNotionSync(getDb(), config, { compare: scope === 'compare', limit, projectId: body.projectId }));
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Notion sync failed' }, 502);
  }
}
