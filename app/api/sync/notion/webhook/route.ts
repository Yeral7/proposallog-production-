import { after, NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getDb } from '@/lib/db';
import { getNotionSyncConfig } from '@/lib/notionSyncServer';
import { pullNotionChanges } from '@/lib/notionInbound';
import { LockHeldError } from '@/lib/notionPublish';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const HANDLED = ['page.created', 'page.properties_updated', 'page.content_updated', 'page.deleted', 'page.undeleted'];
const sameId = (a: string, b: string) => Boolean(a && b) && a.replace(/-/g, '').toLowerCase() === b.replace(/-/g, '').toLowerCase();

async function pullWithRetry(pageId: string) {
  const config = getNotionSyncConfig();
  try {
    await pullNotionChanges(getDb(), config, { dryRun: false, limit: 1, pageId });
  } catch (error) {
    if (!(error instanceof LockHeldError || (error instanceof Error && error.message.includes('Another publisher')))) {
      console.error('Notion webhook pull failed', pageId, error instanceof Error ? error.message : error);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
    try {
      await pullNotionChanges(getDb(), config, { dryRun: false, limit: 1, pageId });
    } catch (retry) {
      console.warn('Notion webhook pull skipped; cron will retry', pageId, retry instanceof Error ? retry.message : retry);
    }
  }
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body' }, { status: 400 });
  }
  if (event?.verification_token) {
    console.log(`Notion webhook verification_token: ${event.verification_token}`);
    console.log('Set NOTION_WEBHOOK_SECRET to this token, then paste it into the Verify subscription form in the Notion integration settings.');
    return NextResponse.json({ received: true });
  }
  const secret = process.env.NOTION_WEBHOOK_SECRET;
  const signature = request.headers.get('x-notion-signature') || '';
  const expected = secret ? `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}` : '';
  const trusted = Boolean(secret)
    && signature.length === expected.length
    && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!trusted) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const type = event?.type;
  if (!HANDLED.includes(type)) return NextResponse.json({ ignored: type ?? 'unknown' });
  const pageId = event.entity?.id;
  if (typeof pageId !== 'string' || !pageId) return NextResponse.json({ ignored: 'no entity' });
  const config = getNotionSyncConfig();
  const parent = event.data?.parent;
  const parentId = parent && ['data_source', 'database'].includes(parent.type) ? parent.id : undefined;
  if (parentId) {
    const known = [config.proposalDataSourceId, config.proposalDatabaseId].filter(Boolean);
    if (known.length && !known.some(id => sameId(id, parentId))) {
      return NextResponse.json({ ignored: 'other data source' });
    }
  }
  if (config.publishEnabled && config.inboundEnabled) after(() => pullWithRetry(pageId));
  return NextResponse.json({ accepted: true });
}
