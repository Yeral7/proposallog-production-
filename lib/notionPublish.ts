import type { SupabaseClient } from '@supabase/supabase-js';
import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { createNotionReader, createNotionRequest, getNotionSyncConfig, loadNotionSource } from './notionSyncServer';
import { NOTION_OWNED_FIELDS, resolveBindings, STATUS_TWINS, toNotionProperties } from './notionSync';
import type { NotionProperty } from './notionSync';

type Config = ReturnType<typeof getNotionSyncConfig>;
type Schema = Record<string, NotionProperty>;
export const ID_FIELD = 'Supabase Project ID';
export const META_FIELD = 'Supabase Sync Snapshot';
export const RELATION_FIELD = 'Estimated Project';
const DEV_PROPOSALS = '8c275b2d077e83ae9c6401d4877c73f0';
const DEV_ESTIMATED = '3d775b2d077e80608206e8fc185a1452';

function normalizedId(id: string) { return id.replace(/-/g, '').toLowerCase(); }
export function assertTarget(config: Config, dryRun: boolean) {
  if (normalizedId(config.proposalDatabaseId) !== DEV_PROPOSALS || normalizedId(config.estimatedDatabaseId) !== DEV_ESTIMATED) throw new Error('Publishing is restricted to the approved development Notion databases.');
  if (!dryRun && !config.publishEnabled) throw new Error('Set NOTION_SYNC_PUBLISH_ENABLED=true or use the explicitly confirmed local publisher.');
}

export function textProperty(text: string) {
  const chunks = Array.from(text).reduce<string[]>((parts, character) => {
    if (!parts.length || parts[parts.length - 1].length + character.length > 1800) parts.push('');
    parts[parts.length - 1] += character;
    return parts;
  }, []);
  if (chunks.length > 100) throw new Error('Sync metadata exceeds the safe Notion property limit.');
  return { rich_text: chunks.map(content => ({ type: 'text', text: { content } })) };
}

export function readText(property: any): string {
  return (property?.rich_text || property?.title || []).map((part: any) => part.plain_text ?? part.text?.content ?? '').join('');
}
export function readId(page: any, schema: Schema) {
  const property = Object.values(page.properties || {}).find((value: any) => value.id === schema[ID_FIELD]?.id) as any;
  return property?.type === 'number' ? String(property.number ?? '') : readText(property);
}
export function byId(page: any, id: string): any {
  return Object.values(page.properties || {}).find((property: any) => property.id === id);
}

export function propertyFingerprint(property: any): string {
  const type = property?.type || ['title', 'rich_text', 'select', 'status', 'date', 'number', 'relation', 'email', 'phone_number'].find(key => Object.hasOwn(property || {}, key));
  const raw = property?.[type];
  let value: any = raw ?? null;
  if (type === 'title' || type === 'rich_text') {
    value = (raw || []).map((part: any) => [part.type || 'text', part.plain_text ?? part.text?.content ?? '', part.href ?? part.text?.link?.url ?? null, Object.entries(part.annotations || {}).filter(([key, setting]) => key === 'color' ? setting !== 'default' : setting === true)]);
  } else if (type === 'select' || type === 'status') value = raw?.name ?? null;
  else if (type === 'date') value = raw ? [raw.start, raw.end ?? null, raw.time_zone ?? null] : null;
  else if (type === 'relation') value = (raw || []).map((item: any) => normalizedId(item.id)).sort();
  return createHash('sha256').update(JSON.stringify([type, value])).digest('hex');
}

export function metadata(properties: Record<string, any>, context: Record<string, any>) {
  return { version: 1, ...context, fingerprints: Object.fromEntries(Object.entries(properties).map(([id, property]) => [id, propertyFingerprint(property)])) };
}

export function planManagedUpdate(page: any, desired: Record<string, any>, schema: Schema, context: Record<string, any>) {
  const raw = readText(byId(page, schema[META_FIELD].id));
  let previous: any;
  try { previous = JSON.parse(raw); } catch { throw new Error('Existing Notion row has no valid sync baseline; explicit linking is required.'); }
  if (previous.version !== 1 || !previous.fingerprints || typeof previous.fingerprints !== 'object') throw new Error('Unsupported sync baseline; row was left unchanged.');
  const changes: Record<string, any> = {};
  for (const [id, property] of Object.entries(desired)) {
    const current = byId(page, id);
    if (!current) throw new Error('A mapped Notion property is missing; row was left unchanged.');
    const before = previous.fingerprints[id];
    const now = propertyFingerprint(current);
    const wanted = propertyFingerprint(property);
    const emptyNewProperty = before === undefined && ((current.type === 'date' && current.date === null) || (current.type === 'rich_text' && !current.rich_text?.length));
    if (now !== wanted && now !== before && !emptyNewProperty) throw new Error(`Notion property ${Object.keys(page.properties).find(name => page.properties[name].id === id) || id} differs from its last published value; review before overwriting.`);
    if (now !== wanted) changes[id] = property;
  }
  const next = metadata(desired, context);
  next.fingerprints = { ...previous.fingerprints, ...next.fingerprints };
  if (Object.keys(changes).length || previous.sourceProjectId !== context.sourceProjectId) changes[schema[META_FIELD].id] = textProperty(JSON.stringify(next));
  return changes;
}

export function setupProperties(schema: Schema, estimatedSourceId?: string) {
  const additions: Record<string, any> = {};
  for (const name of [ID_FIELD, META_FIELD]) {
    if (!schema[name]) additions[name] = { type: 'rich_text', rich_text: {} };
    else if (schema[name].type !== 'rich_text' && !(name === ID_FIELD && schema[name].type === 'number')) throw new Error(`${name} exists with an incompatible type. It will not be replaced.`);
  }
  if (estimatedSourceId) {
    if (!resolveBindings(schema).builder_name) {
      if (schema['OG GC / Client']) throw new Error('OG GC / Client exists with an unsupported type.');
      additions['OG GC / Client'] = { type: 'rich_text', rich_text: {} };
    }
    const relations = Object.values(schema).filter(property => property.type === 'relation' && normalizedId(property.relation.data_source_id || '') === normalizedId(estimatedSourceId));
    if (!relations.length) {
      if (schema[RELATION_FIELD]) throw new Error('Estimated Project exists but does not point to the approved Estimated Projects database.');
      additions[RELATION_FIELD] = { type: 'relation', relation: { data_source_id: estimatedSourceId, single_property: {} } };
    } else if (relations.length !== 1) throw new Error('More than one Estimated Projects relation exists; select one before publishing.');
    const status = resolveBindings(schema).status_label;
    if (!status) throw new Error('The development Proposal Log needs a Status property.');
    const options = status[status.type]?.options || [];
    const missing = Object.values(STATUS_TWINS).filter(name => !options.some((option: any) => option.name === name));
    if (missing.length) additions[status.id] = { type: status.type, [status.type]: { options: [...options.map((option: any) => ({ id: option.id })), ...missing.map(name => ({ name }))] } };
  }
  return additions;
}

export class LockHeldError extends Error {}

type SavedState = Record<string, { pending?: boolean; pageId?: string; projectId?: number } | any>;

function syncTarget(config: Config) {
  return createHash('sha256').update(config.proposalDatabaseId + config.estimatedDatabaseId).digest('hex').slice(0, 16);
}

const LOCK_MESSAGE = 'Another publisher is running, or its lock survived an interrupted run. Check the sync lock before retrying.';
const LOCK_LEASE_MS = 120_000;

async function withSupabaseState<T>(config: Config, dryRun: boolean, db: SupabaseClient | undefined, action: (state: SavedState, save: () => Promise<void>) => Promise<T>) {
  if (!db) throw new Error('The Supabase sync state store requires a database client.');
  const target = syncTarget(config);
  const owner = randomUUID();
  const lease = () => new Date(Date.now() + LOCK_LEASE_MS).toISOString();
  let locked = false;
  if (!dryRun) {
    const { error } = await db.from('notion_sync_lock').insert({ target, owner, expires_at: lease() });
    if (error) {
      if (error.code !== '23505') throw new Error('Could not acquire the sync lock.');
      const { data, error: takeoverError } = await db.from('notion_sync_lock').update({ owner, expires_at: lease() }).eq('target', target).lt('expires_at', new Date().toISOString()).select();
      if (takeoverError || !Array.isArray(data) || !data.length) throw new LockHeldError(LOCK_MESSAGE);
    }
    locked = true;
  }
  try {
    const { data, error } = await db.from('notion_sync_journal').select('key, value').eq('target', target);
    if (error || !Array.isArray(data)) throw new Error('Could not read the sync recovery journal. Sync stopped.');
    const state: SavedState = {};
    const loaded = new Set<string>();
    const deleted = new Set<string>();
    for (const row of data as { key: string; value: any }[]) { state[row.key] = row.value; loaded.add(row.key); }
    const save = async () => {
      if (dryRun) throw new Error('Dry run cannot write sync state.');
      for (const key of loaded) if (!Object.hasOwn(state, key)) deleted.add(key);
      const rows = Object.entries(state).map(([key, value]) => ({ target, key, value }));
      if (rows.length) {
        const { error: upsertError } = await db.from('notion_sync_journal').upsert(rows, { onConflict: 'target,key' });
        if (upsertError) throw new Error('Could not save the sync recovery journal.');
      }
      if (deleted.size) {
        const { error: deleteError } = await db.from('notion_sync_journal').delete().eq('target', target).in('key', [...deleted]);
        if (deleteError) throw new Error('Could not save the sync recovery journal.');
        for (const key of deleted) loaded.delete(key);
        deleted.clear();
      }
      if (locked) await db.from('notion_sync_lock').update({ expires_at: lease() }).eq('target', target).eq('owner', owner);
    };
    return await action(state, save);
  } finally {
    if (locked) await db.from('notion_sync_lock').delete().eq('target', target).eq('owner', owner);
  }
}

async function withFileState<T>(config: Config, dryRun: boolean, action: (state: SavedState, save: () => Promise<void>) => Promise<T>) {
  const directory = path.resolve(config.stateDirectory);
  const target = syncTarget(config);
  const file = path.join(directory, `${target}.json`);
  const lockPath = path.join(directory, `${target}.lock`);
  let lock: Awaited<ReturnType<typeof fs.open>> | undefined;
  if (!dryRun) {
    await fs.mkdir(directory, { recursive: true });
    try { lock = await fs.open(lockPath, 'wx'); }
    catch { throw new LockHeldError('Another publisher is running, or its lock survived an interrupted run. Check the local sync lock before retrying.'); }
  }
  try {
    if (lock) await lock.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    let state: SavedState = {};
    try { state = JSON.parse(await fs.readFile(file, 'utf8')); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new Error('Could not read the sync recovery journal. Publishing stopped.'); }
    const save = async () => {
      if (dryRun) throw new Error('Dry run cannot write sync state.');
      await fs.writeFile(`${file}.tmp`, JSON.stringify(state), { mode: 0o600 });
      await fs.rename(`${file}.tmp`, file);
    };
    return await action(state, save);
  } finally {
    if (lock) { await lock.close(); await fs.unlink(lockPath); }
  }
}

export async function withState<T>(config: Config, dryRun: boolean, action: (state: SavedState, save: () => Promise<void>) => Promise<T>, db?: SupabaseClient) {
  if (config.stateStore === 'supabase') return withSupabaseState(config, dryRun, db, action);
  return withFileState(config, dryRun, action);
}

export async function readJournalValue(db: SupabaseClient | undefined, config: Config, key: string) {
  const target = syncTarget(config);
  if (config.stateStore === 'supabase') {
    if (!db) throw new Error('The Supabase sync state store requires a database client.');
    const { data, error } = await db.from('notion_sync_journal').select('value').eq('target', target).eq('key', key).single();
    if (error && error.code !== 'PGRST116') throw new Error('Could not read the sync journal.');
    return (data as any)?.value;
  }
  try {
    const state = JSON.parse(await fs.readFile(path.join(path.resolve(config.stateDirectory), `${target}.json`), 'utf8'));
    return state[key];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw new Error('Could not read the sync recovery journal.');
  }
}

export async function writeJournalValue(db: SupabaseClient | undefined, config: Config, key: string, value: any) {
  const target = syncTarget(config);
  if (config.stateStore === 'supabase') {
    if (!db) throw new Error('The Supabase sync state store requires a database client.');
    const { error } = await db.from('notion_sync_journal').upsert({ target, key, value }, { onConflict: 'target,key' });
    if (error) throw new Error('Could not write the sync journal.');
    return;
  }
  const directory = path.resolve(config.stateDirectory);
  const file = path.join(directory, `${target}.json`);
  await fs.mkdir(directory, { recursive: true });
  let state: SavedState = {};
  try { state = JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new Error('Could not read the sync recovery journal.'); }
  state[key] = value;
  await fs.writeFile(`${file}.tmp`, JSON.stringify(state), { mode: 0o600 });
  await fs.rename(`${file}.tmp`, file);
}

export async function setupNotionPublishing(config: Config, dryRun = true, db?: SupabaseClient) {
  assertTarget(config, dryRun);
  return withState(config, dryRun, async () => {
    const request = createNotionRequest(config);
    const reader = createNotionReader(config, fetch, request);
    const proposals = await reader.discover(config.proposalDatabaseId, config.proposalDataSourceId);
    const estimated = await reader.discover(config.estimatedDatabaseId, config.estimatedDataSourceId);
    const changes = [
      { source: estimated, properties: setupProperties(estimated.properties) },
      { source: proposals, properties: setupProperties(proposals.properties, estimated.id) },
    ];
    for (const change of changes) {
      if (!dryRun && Object.keys(change.properties).length) await request(`data_sources/${change.source.id}`, { properties: change.properties }, 'PATCH');
    }
    return { dryRun, supabaseWrites: 0, changes: changes.map(change => ({ dataSourceId: change.source.id, properties: Object.keys(change.properties) })) };
  }, db);
}

export async function publishNotionProjects(db: SupabaseClient, config: Config, options: { dryRun?: boolean; limit: number; projectId?: number; afterProjectId?: number }) {
  const dryRun = options.dryRun !== false;
  assertTarget(config, dryRun);
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 100 || (options.projectId !== undefined && (!Number.isSafeInteger(options.projectId) || options.projectId <= 0)) || (options.afterProjectId !== undefined && (!Number.isSafeInteger(options.afterProjectId) || options.afterProjectId < 0)) || (options.dryRun !== undefined && typeof options.dryRun !== 'boolean')) throw new Error('Invalid publish options.');
  return withState(config, dryRun, async (journal, save) => {
    const source = await loadNotionSource(db, config, options);
    const request = createNotionRequest(config);
    const reader = createNotionReader(config, fetch, request);
    const proposals = await reader.discover(config.proposalDatabaseId, config.proposalDataSourceId);
    const estimated = await reader.discover(config.estimatedDatabaseId, config.estimatedDataSourceId);
    if (Object.keys(setupProperties(estimated.properties)).length || Object.keys(setupProperties(proposals.properties, estimated.id)).length) throw new Error('Run the approved Notion setup action first. Supabase does not need a migration.');
    const bindings = resolveBindings(proposals.properties);
    if (!bindings.project_name || !bindings.status_label) throw new Error('Project and Status must have supported Notion properties.');
    const relation = Object.values(proposals.properties).find(property => property.type === 'relation' && normalizedId(property.relation.data_source_id || '') === normalizedId(estimated.id))!;
    const estimatedTitle = Object.values(estimated.properties).find(property => property.type === 'title');
    if (!estimatedTitle) throw new Error('Estimated Projects needs a title property.');
    const proposalPages = await reader.pages(proposals.id);
    const estimatedPages = await reader.pages(estimated.id);
    const results: { projectId: number; sourceProjectId: number; action: string; notionPageId?: string; warnings?: string[]; error?: string }[] = [];

    async function upsert(dataSource: typeof proposals, pages: any[], projectId: number, properties: Record<string, any>, sourceProjectId: number, requireTitle = true) {
      const schema = dataSource.properties;
      const key = `${dataSource.id}:${projectId}`;
      const matches = pages.filter(page => readId(page, schema) === String(projectId));
      if (matches.length > 1) throw new Error('Duplicate Supabase Project ID in Notion; nothing was overwritten.');
      let page = matches[0];
      if (journal[key]?.pageId) {
        const remembered = journal[key].pageId!;
        if (page && normalizedId(page.id) !== normalizedId(remembered)) throw new Error('Notion identity and recovery journal disagree.');
        if (!page) page = await reader.page(remembered);
      }
      if (page && (page.archived || page.in_trash || readId(page, schema) !== String(projectId) || normalizedId(page.parent?.data_source_id || '') !== normalizedId(dataSource.id))) throw new Error('Previously linked page was moved, archived or changed identity; it will not be recreated.');
      if (!page && journal[key]?.pending) throw new Error('Previous create outcome is uncertain. Reconcile the Notion page before retrying; duplicate creation was prevented.');
      const identity = schema[ID_FIELD];
      properties = { ...properties, [identity.id]: identity.type === 'number' ? { number: projectId } : textProperty(String(projectId)) };
      const context = { projectId, sourceProjectId };
      if (page) {
        let changes = planManagedUpdate(page, properties, schema, context);
        if (!dryRun && Object.keys(changes).length) {
          page = await reader.page(page.id);
          if (page.archived || page.in_trash || readId(page, schema) !== String(projectId) || normalizedId(page.parent?.data_source_id || '') !== normalizedId(dataSource.id)) throw new Error('Page identity changed before update.');
          changes = planManagedUpdate(page, properties, schema, context);
          if (Object.keys(changes).length) await request(`pages/${page.id}`, { properties: changes }, 'PATCH');
        }
        if (!dryRun && !journal[key]?.pageId) { journal[key] = { pageId: page.id }; await save(); }
        return { id: page.id, action: Object.keys(changes).length ? 'updated' : 'unchanged' };
      }
      const title = Object.values(schema).find(property => property.type === 'title');
      const projectTitle = readText(properties[title?.id || '']);
      if (requireTitle && !projectTitle.trim()) throw new Error('Cannot create an untitled project.');
      const candidates = requireTitle ? pages.filter(candidate => !readId(candidate, schema) && readText(byId(candidate, title!.id)).trim().toLowerCase() === projectTitle.trim().toLowerCase()) : [];
      if (candidates.length) throw new Error('An unlinked same-name Notion page already exists; explicit matching is required.');
      if (dryRun) return { id: '00000000-0000-0000-0000-000000000000', action: 'created' };
      journal[key] = { pending: true };
      await save();
      try {
        const created = await request('pages', { parent: { type: 'data_source_id', data_source_id: dataSource.id }, properties: { ...properties, [schema[META_FIELD].id]: textProperty(JSON.stringify(metadata(properties, context))) } });
        if (!created.id) throw new Error('Notion did not return the created page ID.');
        journal[key] = { pageId: created.id };
        await save();
        pages.push(created);
        return { id: created.id, action: 'created' };
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (status && status >= 400 && status < 500 && !journal[key].pageId) { delete journal[key]; await save(); }
        throw error;
      }
    }

    let interrupted = false;
    for (const proposal of source.proposals) {
      try {
        const properties: Record<string, any> = {};
        const warnings: string[] = [];
        for (const [field, value] of Object.entries(proposal.values)) {
          if (NOTION_OWNED_FIELDS.includes(field) || !bindings[field] || (value === null && !['project_name', 'status_label', 'estimation_due_date'].includes(field))) continue;
          if (field === 'estimation_due_date' && value === null) {
            const existing = proposalPages.find(page => readId(page, proposals.properties) === String(proposal.projectId));
            const baseline = existing ? readText(byId(existing, proposals.properties[META_FIELD].id)) : '';
            if (!baseline || !JSON.parse(baseline).fingerprints?.[bindings[field].id]) continue;
          }
          const encoded = toNotionProperties({ [field]: value }, bindings);
          if (encoded.issues.length && ['project_name', 'status_label'].includes(field)) throw new Error(encoded.issues.join(' '));
          warnings.push(...encoded.issues);
          Object.assign(properties, encoded.properties);
        }
        if (!properties[bindings.project_name.id]) throw new Error('No valid Project mapping.');
        const projectName = String(proposal.values.project_name || '');
        const estimatedProperties = { [estimatedTitle.id]: { title: [{ type: 'text', text: { content: projectName } }] } };
        const parent = await upsert(estimated, estimatedPages, proposal.projectId, estimatedProperties, proposal.projectId);
        properties[relation.id] = { relation: [{ id: parent.id }] };
        const result = await upsert(proposals, proposalPages, proposal.projectId, properties, proposal.sourceProjectId, false);
        results.push({ projectId: proposal.projectId, sourceProjectId: proposal.sourceProjectId, action: dryRun ? `would_${result.action}` : result.action, notionPageId: dryRun && result.action === 'created' ? undefined : result.id, warnings });
      } catch (error) {
        results.push({ projectId: proposal.projectId, sourceProjectId: proposal.sourceProjectId, action: 'blocked', error: error instanceof Error ? error.message : 'Publishing failed' });
        if ([401, 403, 429].includes((error as { status?: number }).status)) { interrupted = true; break; }
      }
    }
    return { dryRun, supabaseWrites: 0, interrupted, nextAfterProjectId: interrupted ? results[results.length - 1].projectId - 1 : source.nextAfterProjectId, sourceProjectCount: source.sourceProjectCount, groupedProjectCount: source.groupedProjectCount, issues: source.issues, results };
  }, db);
}
