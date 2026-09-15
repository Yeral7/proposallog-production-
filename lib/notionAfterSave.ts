import { after } from 'next/server';
import { getDb } from './db';
import { getNotionSyncConfig } from './notionSyncServer';
import { LockHeldError, publishNotionProjects } from './notionPublish';

async function publishOnce(projectId: number) {
  const config = getNotionSyncConfig();
  try {
    await publishNotionProjects(getDb(), config, { dryRun: false, limit: 1, projectId });
  } catch (error) {
    if (!(error instanceof LockHeldError || (error instanceof Error && error.message.includes('Another publisher')))) throw error;
    await new Promise(resolve => setTimeout(resolve, 3000));
    await publishNotionProjects(getDb(), config, { dryRun: false, limit: 1, projectId });
  }
}

export function schedulePublish(projectId: number) {
  if (!getNotionSyncConfig().publishEnabled) return;
  after(() => publishOnce(projectId).catch(error => console.error('Notion publish-on-save failed', projectId, error instanceof Error ? error.message : error)));
}
