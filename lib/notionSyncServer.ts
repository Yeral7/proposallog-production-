import type { SupabaseClient } from '@supabase/supabase-js';
import { APP_FIELD_COLUMNS, compareSnapshots, FIELD_ALIASES, groupProjects, latestContact, NOTION_OWNED_FIELDS, projectSnapshot, readNotionSnapshot, resolveBindings, STATUS_TWINS, toNotionProperties } from './notionSync';
import type { NotionProperty, ProjectSource } from './notionSync';

export function getNotionSyncConfig(env: NodeJS.ProcessEnv = process.env) {
  return {
    previewEnabled: env.NOTION_SYNC_PREVIEW_ENABLED === 'true',
    publishEnabled: env.NOTION_SYNC_PUBLISH_ENABLED === 'true',
    inboundEnabled: env.NOTION_SYNC_INBOUND_ENABLED === 'true',
    stateDirectory: env.NOTION_SYNC_STATE_DIR || '.notion-sync',
    token: env.NOTION_TOKEN || '',
    proposalDatabaseId: env.NOTION_PROPOSALS_DATABASE_ID || '8c275b2d-077e-83ae-9c64-01d4877c73f0',
    estimatedDatabaseId: env.NOTION_ESTIMATED_PROJECTS_DATABASE_ID || '3d775b2d-077e-8060-8206-e8fc185a1452',
    proposalDataSourceId: env.NOTION_PROPOSALS_DATA_SOURCE_ID || '',
    estimatedDataSourceId: env.NOTION_ESTIMATED_PROJECTS_DATA_SOURCE_ID || '',
  };
}

type SyncConfig = ReturnType<typeof getNotionSyncConfig>;

export function getNotionSyncStatus(config: SyncConfig) {
  return {
    mode: config.publishEnabled ? 'outbound' : 'dry-run',
    writesEnabled: config.publishEnabled,
    supabaseWritesEnabled: false,
    scheduled: false,
    previewEnabled: config.previewEnabled || config.publishEnabled,
    tokenConfigured: Boolean(config.token),
    proposalDatabaseId: config.proposalDatabaseId,
    estimatedDatabaseId: config.estimatedDatabaseId,
    statusTwins: STATUS_TWINS,
    notionOwnedFields: NOTION_OWNED_FIELDS,
    fieldAliases: FIELD_ALIASES,
  };
}

function checkedId(value: string) {
  if (!/^(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.test(value)) {
    throw new Error('Invalid Notion database or data-source ID.');
  }
  return value;
}

function sameId(a: string, b: string) {
  return Boolean(a && b) && a.replace(/-/g, '').toLowerCase() === b.replace(/-/g, '').toLowerCase();
}

export function createNotionRequest(config: SyncConfig, fetcher: typeof fetch = fetch) {
  let lastRequest = 0;
  return async (path: string, body?: Record<string, any>, method: 'GET' | 'POST' | 'PATCH' = body ? 'POST' : 'GET') => {
    const readOnly = method === 'GET' || (method === 'POST' && /^data_sources\/[a-f0-9-]+\/query$/i.test(path));
    if ((!config.previewEnabled && !config.publishEnabled) || !config.token) throw new Error('Notion access requires NOTION_TOKEN and a preview or publish flag in the server environment.');
    if (!readOnly && !config.publishEnabled) throw new Error('Notion publishing is disabled.');
    const delay = 350 - (Date.now() - lastRequest);
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
    lastRequest = Date.now();
    const response = await fetcher(`https://api.notion.com/v1/${path}`, {
      method,
      headers: { Authorization: `Bearer ${config.token}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      const retryAfter = response.headers.get('retry-after');
      throw Object.assign(new Error(`Notion request failed (${response.status})${retryAfter && /^\d+$/.test(retryAfter) ? `; retry after ${retryAfter} seconds` : ''}.`), { status: response.status });
    }
    return response.json();
  };
}

export function createNotionReader(config: SyncConfig, fetcher: typeof fetch = fetch, request = createNotionRequest(config, fetcher)) {
  return {
    async page(pageId: string) {
      return request(`pages/${checkedId(pageId)}`);
    },
    async discover(databaseId: string, selectedDataSourceId: string) {
      const database = await request(`databases/${checkedId(databaseId)}`);
      if (database.archived || database.in_trash) throw new Error('The selected Notion database is archived.');
      const sources: { id: string; name: string }[] = database.data_sources || [];
      const selected = selectedDataSourceId
        ? sources.find(source => sameId(source.id, selectedDataSourceId))
        : sources.length === 1 ? sources[0] : null;
      if (!selected) throw new Error('Select a valid NOTION_*_DATA_SOURCE_ID when the database has multiple data sources.');
      const source = await request(`data_sources/${checkedId(selected.id)}`);
      if (source.archived || source.in_trash) throw new Error('The selected Notion data source is archived.');
      return source as { id: string; properties: Record<string, NotionProperty> };
    },
    async pages(dataSourceId: string) {
      checkedId(dataSourceId);
      const pages: any[] = [];
      const cursors = new Set<string>();
      let cursor: string | undefined;
      for (let batch = 0; batch < 20; batch++) {
        const result = await request(`data_sources/${dataSourceId}/query`, { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) });
        if (!Array.isArray(result.results)) throw new Error('Invalid Notion query response.');
        pages.push(...result.results.filter((page: any) => !page.archived && !page.in_trash));
        if (!result.has_more) return pages;
        if (!result.next_cursor || cursors.has(result.next_cursor)) throw new Error('Incomplete Notion pagination; preview stopped.');
        cursor = result.next_cursor;
        cursors.add(cursor);
      }
      throw new Error('Notion preview exceeds 2000 rows; use a scoped integration before continuing.');
    },
  };
}

async function readRows(makeQuery: () => any, label: string) {
  const rows: any[] = [];
  for (let offset = 0; offset < 50000; offset += 500) {
    const { data, error } = await makeQuery().order('id', { ascending: true }).range(offset, offset + 499);
    if (error) throw new Error(`Could not read ${label}.`);
    if (!Array.isArray(data)) throw new Error(`Invalid ${label} result.`);
    rows.push(...data);
    if (data.length < 500) return rows;
  }
  throw new Error(`${label} exceeds the safe preview size.`);
}

function propertyText(page: any, name: string) {
  const property = page.properties?.[name];
  if (!property) return null;
  if (property.type === 'number') return property.number == null ? null : String(property.number);
  if (property.type === 'rich_text' || property.type === 'title') return property[property.type].map((part: any) => part.plain_text ?? part.text?.content ?? '').join('');
  return null;
}

export async function loadNotionSource(db: SupabaseClient, config: SyncConfig, options: { limit: number; projectId?: number; afterProjectId?: number }) {
  const raw = await readRows(() => db.from('projects').select('id, reference_project_id, project_name, builder_id, estimator_id, location_id, status_id, priority_id, due_date, estimation_due_date, submission_date, follow_up_date, contract_value, lost_reason, builders:builder_id(name), estimators:estimator_id(name), statuses:status_id(label), locations:location_id(name), priorities:priority_id(name)'), 'projects');
  const projects: ProjectSource[] = raw.map(row => ({
    ...row,
    builder_name: row.builders?.name ?? null,
    estimator_name: row.estimators?.name ?? null,
    location_name: row.locations?.name ?? null,
    status_label: row.statuses?.label ?? null,
    priority_name: row.priorities?.name ?? null,
  }));
  const { groups, issues } = groupProjects(projects);
  const eligible = groups.filter(group => (!options.projectId || group.memberIds.includes(options.projectId)) && group.projectId > (options.afterProjectId || 0));
  const selected = eligible.slice(0, options.limit);
  const projectIds = selected.map(group => group.latest.id);
  const builderIds = [...new Set(selected.map(group => group.latest.builder_id).filter(id => id != null))];
  const [projectContacts, builderContacts] = await Promise.all([
    projectIds.length ? readRows(() => db.from('project_contacts').select('id, project_id, name, title, email, phone, created_at').in('project_id', projectIds), 'project contacts') : [],
    builderIds.length ? readRows(() => db.from('builder_contacts').select('id, builder_id, name, title, email, phone, created_at').in('builder_id', builderIds), 'builder contacts') : [],
  ]);
  const proposals = selected.map(group => {
    const builderMatches = builderContacts.filter(contact => contact.builder_id === group.latest.builder_id);
    const candidates = builderMatches.length ? builderMatches : projectContacts.filter(contact => contact.project_id === group.latest.id);
    const contact = latestContact(candidates);
    return {
      projectId: group.projectId,
      sourceProjectId: group.latest.id,
      memberIds: group.memberIds,
      latestContactId: contact?.id ?? null,
      contactSource: contact ? builderMatches.length ? 'builder_contacts' : 'project_contacts' : null,
      selection: 'Highest existing project ID in the reference group; newest contact by created_at, then ID.',
      values: projectSnapshot(group.latest, contact),
    };
  });
  const base = {
    ...getNotionSyncStatus(config),
    sourceProjectCount: projects.length,
    groupedProjectCount: groups.length,
    returnedGroups: proposals.length,
    nextAfterProjectId: eligible.length > selected.length ? selected[selected.length - 1].projectId : null,
    issues,
  };
  return { ...base, proposals };
}

export async function previewNotionSync(db: SupabaseClient, config: SyncConfig, options: { compare: boolean; limit: number; projectId?: number }) {
  const base = await loadNotionSource(db, config, options);
  const { proposals } = base;
  if (!options.compare) return base;
  const reader = createNotionReader(config);
  const source = await reader.discover(config.proposalDatabaseId, config.proposalDataSourceId);
  const estimated = await reader.discover(config.estimatedDatabaseId, config.estimatedDataSourceId);
  const bindings = resolveBindings(source.properties);
  const pages = await reader.pages(source.id);
  const estimatedPages = await reader.pages(estimated.id);
  const relationMatches = Object.entries(source.properties).filter(([, property]) => property.type === 'relation' && sameId(property.relation?.data_source_id, estimated.id));
  const relation = relationMatches.length === 1 ? { name: relationMatches[0][0], id: relationMatches[0][1].id } : null;
  const setupIssues: string[] = [];
  if (!relation) setupIssues.push('A single relation from Proposal Log to Estimated Projects DB must be configured; no schema is changed by this preview.');
  for (const field of ['project_name', 'builder_name', 'status_label']) {
    if (!bindings[field]) setupIssues.push(`Missing supported Notion property for ${field}.`);
  }
  for (const [label, schema] of [['Proposal Log', source.properties], ['Estimated Projects', estimated.properties]] as const) {
    if (!['rich_text', 'number'].includes(schema['Supabase Project ID']?.type)) setupIssues.push(`Add a Supabase Project ID text or number property to ${label} before linking records.`);
  }
  const unmapped = Object.keys(FIELD_ALIASES).filter(field => !bindings[field]);
  const { data: links, error: linksError } = proposals.length ? await db.from('notion_project_links')
    .select('project_group_id, source_project_id, notion_page_id, estimated_page_id, baseline')
    .eq('notion_database_id', config.proposalDatabaseId)
    .eq('notion_data_source_id', source.id)
    .eq('estimated_database_id', config.estimatedDatabaseId)
    .eq('estimated_data_source_id', estimated.id)
    .in('project_group_id', proposals.map(proposal => proposal.projectId)) : { data: [], error: null };
  if (linksError && !['42P01', 'PGRST205'].includes(linksError.code)) throw new Error('Could not read Notion sync links.');
  if (linksError) setupIssues.push('Sync-link migration is not applied. This preview does not apply it.');
  const plans = proposals.map(proposal => {
    const link = links?.find(link => Number(link.project_group_id) === proposal.projectId);
    const idMatches = pages.filter(page => propertyText(page, 'Supabase Project ID') === String(proposal.projectId));
    const linkedPage = link ? pages.find(page => sameId(page.id, link.notion_page_id)) : null;
    const remote = linkedPage || (!link && idMatches.length === 1 ? idMatches[0] : null);
    const estimatedMatches = estimatedPages.filter(page => propertyText(page, 'Supabase Project ID') === String(proposal.projectId));
    const estimatedPage = link?.estimated_page_id ? estimatedPages.find(page => sameId(page.id, link.estimated_page_id)) : estimatedMatches.length === 1 ? estimatedMatches[0] : null;
    const blockers: string[] = [];
    if (idMatches.length > 1 || estimatedMatches.length > 1) blockers.push('Duplicate Supabase Project ID in Notion; manual review required.');
    if (link && !linkedPage) blockers.push('Linked Notion page is missing or archived; do not recreate automatically.');
    if (link?.estimated_page_id && !estimatedPage) blockers.push('Linked Estimated Projects page is missing or archived.');
    if (linkedPage && idMatches.some(page => !sameId(page.id, linkedPage.id))) blockers.push('Stored link and Notion project identity disagree.');
    if (remote && propertyText(remote, 'Supabase Project ID') !== String(proposal.projectId)) blockers.push('Notion project identity is missing or has changed.');
    if (estimatedPage && propertyText(estimatedPage, 'Supabase Project ID') !== String(proposal.projectId)) blockers.push('Estimated Projects identity is missing or has changed.');
    if (estimatedPage && estimatedMatches.some(page => !sameId(page.id, estimatedPage.id))) blockers.push('Stored link and Estimated Projects identity disagree.');
    if (link && Number(link.source_project_id) !== proposal.sourceProjectId) blockers.push('A newer GC proposal is now selected; review the source handover before writing back.');
    const candidates = !remote && bindings.project_name
      ? pages.filter(page => propertyText(page, bindings.project_name.name!) === proposal.values.project_name).map(page => page.id)
      : [];
    if (candidates.length) blockers.push('Existing same-name Notion rows require explicit linking; names are not used as IDs.');
    const decoded = remote ? readNotionSnapshot(remote, bindings) : null;
    const local = Object.fromEntries(Object.entries(proposal.values).filter(([field]) => bindings[field]));
    const diff = decoded ? compareSnapshots(local, decoded.values, link?.baseline ?? null) : { toNotion: Object.fromEntries(Object.entries(local).filter(([field]) => !NOTION_OWNED_FIELDS.includes(field))), toSupabase: {}, conflicts: [] };
    const encoded = toNotionProperties(diff.toNotion, bindings);
    blockers.push(...(decoded?.issues || []), ...encoded.issues);
    if (!remote && (!bindings.project_name || !encoded.properties[bindings.project_name.id])) blockers.push('No supported non-empty Project value for a new Notion proposal.');
    const estimatedTitle = Object.entries(estimated.properties).find(([, property]) => property.type === 'title');
    const estimatedCandidates = !estimatedPage && estimatedTitle
      ? estimatedPages.filter(page => propertyText(page, estimatedTitle[0]) === proposal.values.project_name).map(page => page.id)
      : [];
    if (estimatedCandidates.length) blockers.push('Existing same-name Estimated Projects entries require explicit linking.');
    if (!estimatedTitle) blockers.push('Estimated Projects has no title property.');
    if (remote && relation) {
      const relationValue = Object.values(remote.properties).find((property: any) => property.id === relation.id) as any;
      if (!estimatedPage || relationValue?.has_more || relationValue?.relation?.length !== 1 || !sameId(relationValue.relation[0].id, estimatedPage.id)) blockers.push('Estimated Projects relation must be reviewed before synchronizing this proposal.');
    }
    return {
      ...proposal,
      notionPageId: remote?.id ?? null,
      estimatedProject: { sharedProjectId: proposal.projectId, notionPageId: estimatedPage?.id ?? null, titleProperty: estimatedTitle?.[0] ?? null, projectName: proposal.values.project_name },
      action: blockers.length || diff.conflicts.length || setupIssues.length ? 'review' : remote ? 'compare' : 'propose_create',
      candidatePageIds: candidates,
      candidateEstimatedPageIds: estimatedCandidates,
      blockers,
      ...diff,
      proposedNotionProperties: encoded.properties,
      inboundRequiresValidation: Object.keys(diff.toSupabase).length > 0,
    };
  });
  return { ...base, dataSourceId: source.id, estimatedDataSourceId: estimated.id, estimatedProjectRelation: relation, propertyBindings: Object.fromEntries(Object.entries(bindings).map(([field, property]) => [field, { id: property.id, name: property.name, type: property.type }])), unmappedFields: unmapped, setupIssues, notionPageCount: pages.length, estimatedProjectCount: estimatedPages.length, proposals: plans };
}
