import type { SupabaseClient } from '@supabase/supabase-js';
import { createNotionReader, createNotionRequest, getNotionSyncConfig } from './notionSyncServer';
import { APP_FIELD_COLUMNS, NOTION_OWNED_FIELDS, projectSnapshot, readNotionSnapshot, resolveBindings, toNotionProperties } from './notionSync';
import type { Bindings, NotionProperty, ProjectSource, Snapshot } from './notionSync';
import { assertTarget, byId, ID_FIELD, META_FIELD, metadata, propertyFingerprint, readId, readText, textProperty, withState } from './notionPublish';
import { createNameMatcher } from './gcMatch';

type Config = ReturnType<typeof getNotionSyncConfig>;
type Schema = Record<string, NotionProperty>;
const sameId = (a: string, b: string) => Boolean(a && b) && a.replace(/-/g, '').toLowerCase() === b.replace(/-/g, '').toLowerCase();
const DRY_PAGE_ID = '00000000-0000-0000-0000-000000000000';
const PROJECT_SELECT = 'id, reference_project_id, project_name, builder_id, estimator_id, location_id, status_id, priority_id, due_date, estimation_due_date, submission_date, follow_up_date, contract_value, lost_reason, archived_at, builders:builder_id(name), estimators:estimator_id(name), statuses:status_id(label), locations:location_id(name), priorities:priority_id(name)';

async function readTable(db: SupabaseClient, table: string, columns: string): Promise<any[]> {
  const { data, error } = await db.from(table).select(columns);
  if (error || !Array.isArray(data)) throw new Error(`Could not read ${table}.`);
  return data as any[];
}

const matches = (rows: any[], key: string, value: unknown) =>
  rows.find(row => String(row[key] ?? '').trim().toLowerCase() === String(value ?? '').trim().toLowerCase());

export function planInboundUpdate(page: any, local: Snapshot, remote: Snapshot, bindings: Bindings, schema: Schema) {
  const raw = readText(byId(page, schema[META_FIELD]?.id));
  let previous: any;
  try { previous = JSON.parse(raw); } catch { throw new Error('Existing Notion row has no valid sync baseline; relink or publish it first.'); }
  if (previous.version !== 1 || !previous.fingerprints || typeof previous.fingerprints !== 'object') throw new Error('Unsupported sync baseline; row was left unchanged.');
  const toSupabase: Snapshot = {};
  const conflicts: string[] = [];
  const updated: Record<string, string> = {};
  for (const [field, binding] of Object.entries(bindings)) {
    if (!Object.hasOwn(remote, field) || local[field] === remote[field]) continue;
    const current = byId(page, binding.id);
    const now = propertyFingerprint(current);
    if (NOTION_OWNED_FIELDS.includes(field)) {
      toSupabase[field] = remote[field];
      updated[binding.id] = now;
      continue;
    }
    const before = previous.fingerprints[binding.id];
    const wanted = propertyFingerprint(toNotionProperties({ [field]: local[field] }, bindings).properties[binding.id]);
    if (before === undefined) {
      if (local[field] === null && !field.startsWith('contact_')) {
        toSupabase[field] = remote[field];
        updated[binding.id] = now;
        continue;
      }
      conflicts.push(field);
      continue;
    }
    if (now !== before && wanted === before) {
      if (field.startsWith('contact_')) { conflicts.push(field); continue; }
      toSupabase[field] = remote[field];
      updated[binding.id] = now;
      continue;
    }
    if (now === before && wanted !== before) continue;
    conflicts.push(field);
  }
  return { toSupabase, conflicts, previous, updated };
}

export async function pullNotionChanges(db: SupabaseClient, config: Config, options: { dryRun?: boolean; limit: number; pageId?: string }) {
  const dryRun = options.dryRun !== false;
  assertTarget(config, dryRun);
  if (!dryRun && !config.inboundEnabled) throw new Error('Set NOTION_SYNC_INBOUND_ENABLED=true to run inbound synchronization.');
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 100 || (options.pageId !== undefined && typeof options.pageId !== 'string') || (options.dryRun !== undefined && typeof options.dryRun !== 'boolean')) throw new Error('Invalid inbound options.');
  return withState(config, dryRun, async (journal, save) => {
    const request = createNotionRequest(config);
    const reader = createNotionReader(config, fetch, request);
    const proposals = await reader.discover(config.proposalDatabaseId, config.proposalDataSourceId);
    const estimated = await reader.discover(config.estimatedDatabaseId, config.estimatedDataSourceId);
    const schema = proposals.properties;
    const bindings = resolveBindings(schema);
    if (!bindings.project_name || !bindings.status_label) throw new Error('Project and Status must have supported Notion properties.');
    const relation = Object.values(schema).find(property => property.type === 'relation' && sameId(property.relation?.data_source_id || '', estimated.id));
    const gcProperty = schema['GC / Client']?.type === 'relation' ? schema['GC / Client'] : null;
    const estimatedTitle = Object.values(estimated.properties).find(property => property.type === 'title');
    if (!estimatedTitle) throw new Error('Estimated Projects needs a title property.');
    const proposalPages = await reader.pages(proposals.id);
    const estimatedPages = await reader.pages(estimated.id);
    const [builders, statuses, estimators, locations, priorities] = await Promise.all([
      readTable(db, 'builders', 'id, name'),
      readTable(db, 'statuses', 'id, label'),
      readTable(db, 'estimators', 'id, name'),
      readTable(db, 'locations', 'id, name'),
      readTable(db, 'priorities', 'id, name'),
    ]);
    let matchBuilder = createNameMatcher(builders);
    let supabaseWrites = 0;

    const journalPageByProject = new Map<number, string>();
    const journalPrefix = `${proposals.id}:`;
    for (const [key, value] of Object.entries(journal)) {
      if (key.startsWith(journalPrefix) && (value as any)?.pageId) {
        const projectId = Number(key.slice(journalPrefix.length));
        if (Number.isSafeInteger(projectId) && projectId > 0) journalPageByProject.set(projectId, String((value as any).pageId));
      }
    }
    const storedIds = proposalPages.map(page => readId(page, schema).trim()).filter(Boolean);
    const numericIds = [...new Set([...storedIds.map(id => Number(id)), ...journalPageByProject.keys()].filter(id => Number.isSafeInteger(id) && id > 0))];
    const { data: projectRowsData, error: projectError } = numericIds.length
      ? await db.from('projects').select(PROJECT_SELECT).in('id', numericIds)
      : { data: [], error: null };
    if (projectError || !Array.isArray(projectRowsData)) throw new Error('Could not read linked projects.');
    const projectRows = projectRowsData as any[];
    const projectById = new Map<number, ProjectSource>();
    for (const row of projectRows) {
      projectById.set(row.id, {
        ...row,
        builder_name: row.builders?.name ?? null,
        estimator_name: row.estimators?.name ?? null,
        location_name: row.locations?.name ?? null,
        status_label: row.statuses?.label ?? null,
        priority_name: row.priorities?.name ?? null,
      });
    }

    const newPages: any[] = [];
    const linkedPages: any[] = [];
    const orphanPages: any[] = [];
    for (const page of proposalPages) {
      const stored = readId(page, schema).trim();
      if (!stored) {
        if (readText(byId(page, bindings.project_name.id)).trim()) newPages.push(page);
        continue;
      }
      if (projectById.has(Number(stored))) linkedPages.push(page);
      else orphanPages.push(page);
    }

    const gcName = async (page: any) => {
      if (gcProperty) {
        const property = byId(page, gcProperty.id);
        const ids = property?.type === 'relation' ? property.relation || [] : [];
        if (property?.has_more || ids.length > 1) throw new Error('GC / Client has multiple related clients; resolve it in Notion first.');
        if (ids.length === 1) {
          const clientPage = await reader.page(ids[0].id);
          const title = Object.values(clientPage.properties || {}).find((property: any) => property.type === 'title');
          const name = readText(title).trim();
          if (name) return name;
        }
      }
      return bindings.builder_name ? readText(byId(page, bindings.builder_name.id)).trim() : '';
    };

    const resolveBuilder = async (page: any, create: boolean) => {
      const name = await gcName(page);
      if (!name) return { builder_id: null as number | null };
      const { match, how } = matchBuilder(name);
      if (match) return { builder_id: match.id, builder: match.name, how };
      if (!create) return { builder_id: null as number | null, builder: name, how: 'none' };
      if (dryRun) return { builder_id: null as number | null, builder: name, how: 'none', wouldCreateBuilder: name };
      const { data, error } = await db.from('builders').insert({ name }).select('id').single();
      if (error || !data) throw new Error(`Could not create builder ${name}.`);
      supabaseWrites++;
      (builders as any[]).push({ id: data.id, name });
      matchBuilder = createNameMatcher(builders);
      return { builder_id: data.id, builder: name, how: 'created' };
    };

    const toColumns = async (values: Snapshot, gc: { builder_id: number | null }) => {
      const columns: Record<string, string | number | null> = {};
      for (const [field, value] of Object.entries(values)) {
        const column = APP_FIELD_COLUMNS[field];
        if (!column || field.startsWith('contact_')) continue;
        if (field === 'builder_name') { columns.builder_id = gc.builder_id; continue; }
        if (value == null) { columns[column] = null; continue; }
        if (field === 'status_label') {
          const row = matches(statuses, 'label', value);
          if (!row) throw new Error(`Unknown status ${String(value)}.`);
          columns.status_id = row.id;
        } else if (field === 'estimator_name') {
          const row = matches(estimators, 'name', value);
          if (!row) throw new Error(`Unknown estimator ${String(value)}.`);
          columns.estimator_id = row.id;
        } else if (field === 'priority_name') {
          const row = matches(priorities, 'name', value);
          if (!row) throw new Error(`Unknown priority ${String(value)}.`);
          columns.priority_id = row.id;
        } else if (field === 'location_name') {
          let row = matches(locations, 'name', value);
          if (!row) {
            if (dryRun) { columns.location_id = null; (columns as any).__wouldCreateLocation = String(value); }
            else {
              const { data, error } = await db.from('locations').insert({ name: String(value).trim() }).select('id').single();
              if (error || !data) throw new Error(`Could not create location ${String(value)}.`);
              supabaseWrites++;
              row = { id: data.id };
              (locations as any[]).push({ id: data.id, name: String(value).trim() });
            }
          }
          if (row) columns.location_id = row.id;
        } else columns[column] = value;
      }
      return columns;
    };

    const estimatedMatch = (projectName: string) => estimatedPages.find(page =>
      readId(page, estimated.properties).trim() && readText(byId(page, estimatedTitle.id)).trim().toLowerCase() === projectName.trim().toLowerCase());

    async function ensureEstimated(projectId: number, projectName: string, existing: any) {
      if (existing) return existing;
      if (dryRun) return { id: DRY_PAGE_ID };
      const estimatedSchema = estimated.properties;
      const identity = estimatedSchema[ID_FIELD];
      const properties: Record<string, any> = { [estimatedTitle.id]: { title: [{ type: 'text', text: { content: projectName } }] } };
      properties[identity.id] = identity.type === 'number' ? { number: projectId } : textProperty(String(projectId));
      const created = await request('pages', {
        parent: { type: 'data_source_id', data_source_id: estimated.id },
        properties: { ...properties, [estimatedSchema[META_FIELD].id]: textProperty(JSON.stringify(metadata(properties, { projectId, sourceProjectId: projectId }))) },
      });
      if (!created.id) throw new Error('Notion did not return the created page ID.');
      estimatedPages.push(created);
      return created;
    }

    async function writeBack(page: any, projectId: number, rootId: number, estimatedPage: any, builder?: string) {
      const written: Record<string, any> = {};
      const identity = schema[ID_FIELD];
      written[identity.id] = identity.type === 'number' ? { number: projectId } : textProperty(String(projectId));
      if (relation && estimatedPage) written[relation.id] = { relation: [{ id: estimatedPage.id }] };
      const gcBinding = bindings.builder_name;
      if (gcBinding?.type === 'rich_text' && builder && !readText(byId(page, gcBinding.id)).trim()) {
        written[gcBinding.id] = { rich_text: [{ type: 'text', text: { content: builder } }] };
      }
      const onPage: Record<string, any> = {};
      for (const binding of Object.values(bindings)) {
        const property = byId(page, binding.id);
        if (property) onPage[binding.id] = property;
      }
      Object.assign(onPage, written);
      written[schema[META_FIELD].id] = textProperty(JSON.stringify(metadata(onPage, { projectId: rootId, sourceProjectId: projectId })));
      if (!dryRun) await request(`pages/${page.id}`, { properties: written }, 'PATCH');
    }

    const results: Record<string, any>[] = [];
    if (!options.pageId) for (const page of orphanPages) results.push({ action: 'orphan', notionPageId: page.id, projectId: Number(readId(page, schema)) || null });
    const queue = options.pageId
      ? proposalPages.filter(page => sameId(page.id, options.pageId!))
      : [...newPages, ...linkedPages];

    const archiveProject = async (projectId: number, notionPageId: string | undefined) => {
      if (!dryRun) {
        const { error } = await db.from('projects').update({ archived_at: new Date().toISOString() }).eq('id', projectId);
        if (error) throw new Error(`Could not archive project ${projectId}.`);
        supabaseWrites++;
      }
      results.push({ action: dryRun ? 'would_archive' : 'archived', projectId, notionPageId });
    };

    const livePageIds = proposalPages.map(page => page.id);
    const missingLinked: { projectId: number; pageId: string }[] = [];
    for (const [projectId, pageId] of journalPageByProject) {
      if (livePageIds.some(id => sameId(id, pageId))) continue;
      const project = projectById.get(projectId) as any;
      if (!project || project.archived_at) continue;
      missingLinked.push({ projectId, pageId });
    }

    if (options.pageId && !queue.length) {
      const page = await reader.page(options.pageId).catch(() => undefined);
      if (page && (page.in_trash || page.archived)) {
        let projectId: number | null = null;
        for (const [pid, id] of journalPageByProject) if (sameId(id, options.pageId)) { projectId = pid; break; }
        if (!projectId) projectId = Number(readId(page, schema)) || null;
        if (projectId && !(projectById.get(projectId) as any)?.archived_at) await archiveProject(projectId, page.id);
      }
    } else if (!options.pageId) {
      for (const missing of missingLinked.slice(0, 10)) {
        try {
          const page = await reader.page(missing.pageId).catch(() => undefined);
          if (page && (page.in_trash || page.archived)) await archiveProject(missing.projectId, page.id);
          else results.push({ action: 'orphan', notionPageId: missing.pageId, projectId: missing.projectId });
        } catch (error) {
          results.push({ action: 'blocked', notionPageId: missing.pageId, projectId: missing.projectId, error: error instanceof Error ? error.message : 'Inbound sync failed' });
        }
      }
    }

    let interrupted = false;
    let hasMore = false;
    let written = 0;
    let unchanged = 0;

    for (const page of queue) {
      if (written >= options.limit) { hasMore = true; break; }
      const stored = readId(page, schema).trim();
      const key = `inbound:${page.id}`;
      try {
        if (stored && !projectById.has(Number(stored))) {
          results.push({ action: 'orphan', notionPageId: page.id, projectId: Number(stored) || null });
          continue;
        }
        if (journal[key]?.pending) throw new Error('Uncertain previous insert; reconcile the journal before retrying.');
        if (stored) {
          const project = projectById.get(Number(stored))!;
          if ((project as any).archived_at) {
            if (!dryRun) {
              const { error } = await db.from('projects').update({ archived_at: null }).eq('id', project.id);
              if (error) throw new Error(`Could not restore project ${project.id}.`);
              supabaseWrites++;
            }
            results.push({ action: 'restored', projectId: project.id, notionPageId: page.id });
            (project as any).archived_at = null;
          }
          const remote = readNotionSnapshot(page, bindings);
          if (remote.issues.length) throw new Error(remote.issues.join(' '));
          const plan = planInboundUpdate(page, projectSnapshot(project), remote.values, bindings, schema);
          if (plan.conflicts.length) {
            results.push({ action: 'review', projectId: project.id, notionPageId: page.id, conflicts: plan.conflicts });
            continue;
          }
          const fields = Object.keys(plan.toSupabase);
          if (!fields.length) {
            unchanged++;
            continue;
          }
          const gc = await resolveBuilder(page, fields.includes('builder_name'));
          const columns = await toColumns(plan.toSupabase, gc);
          if (!dryRun) {
            const { error } = await db.from('projects').update(columns).eq('id', Number(stored));
            if (error) throw new Error(`Could not update project ${stored}.`);
            supabaseWrites++;
            const next = { ...plan.previous, fingerprints: { ...plan.previous.fingerprints, ...plan.updated } };
            await request(`pages/${page.id}`, { properties: { [schema[META_FIELD].id]: textProperty(JSON.stringify(next)) } }, 'PATCH');
          }
          results.push({ action: dryRun ? 'would_update' : 'updated', projectId: project.id, notionPageId: page.id, fields });
          written++;
          continue;
        }
        const remote = readNotionSnapshot(page, bindings);
        if (remote.issues.length) throw new Error(remote.issues.join(' '));
        if (!remote.values.project_name || !remote.values.status_label) throw new Error('New Notion rows need a Project and a Status.');
        const projectName = String(remote.values.project_name);
        const existingEstimated = estimatedMatch(projectName);
        const referenceId = existingEstimated ? Number(readId(existingEstimated, estimated.properties)) || null : null;
        const rootId = referenceId ?? null;
        let projectId = journal[key]?.projectId;
        const gc = await resolveBuilder(page, !projectId);
        if (!projectId) {
          const columns = await toColumns(remote.values, gc);
          const wouldCreateLocation = (columns as any).__wouldCreateLocation;
          delete (columns as any).__wouldCreateLocation;
          if (dryRun) {
            results.push({ action: 'created', projectId: null, notionPageId: page.id, builder: gc.builder ?? null, how: gc.how, referenceProjectId: rootId, ...(gc.wouldCreateBuilder ? { wouldCreateBuilder: gc.wouldCreateBuilder } : {}), ...(wouldCreateLocation ? { wouldCreateLocation } : {}) });
            written++;
            continue;
          }
          journal[key] = { pending: true };
          await save();
          const { data, error } = await db.from('projects').insert({ ...columns, reference_project_id: rootId }).select('id').single();
          if (error || !data?.id) throw new Error('Could not insert the new project.');
          supabaseWrites++;
          projectId = data.id;
          journal[key] = { projectId };
          await save();
        }
        const estimatedPage = rootId ? existingEstimated : await ensureEstimated(projectId!, projectName, existingEstimated);
        await writeBack(page, projectId!, rootId ?? projectId!, estimatedPage, gc.builder);
        results.push({ action: 'created', projectId, notionPageId: page.id, builder: gc.builder ?? null, how: gc.how, referenceProjectId: rootId, ...(gc.wouldCreateBuilder ? { wouldCreateBuilder: gc.wouldCreateBuilder } : {}) });
        written++;
      } catch (error) {
        results.push({ action: 'blocked', notionPageId: page.id, projectId: journal[key]?.projectId ?? (Number(stored) || null), error: error instanceof Error ? error.message : 'Inbound sync failed' });
        if ([401, 403, 429].includes((error as { status?: number }).status)) { interrupted = true; break; }
      }
    }
    return {
      dryRun,
      supabaseWrites,
      interrupted,
      hasMore,
      results,
      counts: { new: newPages.length, linked: linkedPages.length, orphan: orphanPages.length, unchanged },
    };
  }, db);
}
