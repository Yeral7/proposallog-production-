import { after } from 'next/server';
import { getDb } from './db';
import { getNotionSyncConfig } from './notionSyncServer';
import { LockHeldError, publishNotionProjects, trashNotionPages } from './notionPublish';

const MAX_PUBLISH_ATTEMPTS = 6;

function isLockError(error: unknown) {
  return error instanceof LockHeldError || (error instanceof Error && error.message.includes('Another publisher'));
}

async function withLockRetries(attempt: () => Promise<unknown>, projectId: number, retryDelayMs: number) {
  for (let tries = 1; tries <= MAX_PUBLISH_ATTEMPTS; tries++) {
    try {
      await attempt();
      return;
    } catch (error) {
      if (!isLockError(error)) throw error;
      if (tries === MAX_PUBLISH_ATTEMPTS) {
        console.warn('Notion sync gave up after', MAX_PUBLISH_ATTEMPTS, 'attempts; the cron safety net will retry project', projectId);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }
}

async function publishOnce(projectId: number, retryDelayMs: number) {
  const config = getNotionSyncConfig();
  await withLockRetries(() => publishNotionProjects(getDb(), config, { dryRun: false, limit: 1, projectId }), projectId, retryDelayMs);
}

async function trashOnce(projectId: number, rootId: number, newRootId: number | null, retryDelayMs: number) {
  const config = getNotionSyncConfig();
  const { republishProjectId } = await trashNotionPages(getDb(), config, { projectId, rootId, newRootId });
  if (republishProjectId != null) {
    await withLockRetries(() => publishNotionProjects(getDb(), config, { dryRun: false, limit: 1, projectId: republishProjectId }), republishProjectId, retryDelayMs);
  }
}

export function schedulePublish(projectId: number, retryDelayMs = 5000) {
  if (!getNotionSyncConfig().publishEnabled) return;
  after(() => publishOnce(projectId, retryDelayMs).catch(error => console.error('Notion publish-on-save failed', projectId, error instanceof Error ? error.message : error)));
}

export function trashNotionProject(projectId: number, rootId: number, newRootId: number | null = null, retryDelayMs = 5000) {
  const config = getNotionSyncConfig();
  if (!config.publishEnabled) return;
  after(() => trashOnce(projectId, rootId, newRootId, retryDelayMs).catch(error => console.error('Notion delete sync failed', projectId, error instanceof Error ? error.message : error)));
}
