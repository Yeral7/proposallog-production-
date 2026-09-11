const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function loadTs(name, dependencies = {}) {
  const filename = path.join(__dirname, name);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
  });
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded.require = id => {
    if (Object.hasOwn(dependencies, id)) return dependencies[id];
    if (id.startsWith('./')) return loadTs(`${id.slice(2)}.ts`);
    if (id.startsWith('@/lib/')) return loadTs(`${id.slice(6)}.ts`);
    if (id.startsWith('@/')) return loadTs(`../${id.slice(2)}.ts`);
    return module.require(id);
  };
  loaded._compile(compiled.outputText, filename);
  return loaded.exports;
}

const sync = loadTs('notionSync.ts');
const project = (id, reference_project_id = null, extra = {}) => ({
  id, reference_project_id, project_name: 'Test Project', builder_name: `GC ${id}`,
  status_label: 'Assigned', estimator_name: 'Estimator', location_name: 'Test City',
  ...extra,
});
const property = (id, type, options = []) => ({
  id, type, [type]: { options: options.map(name => ({ id: name, name })) },
});
const schema = {
  'Project Name': property('title', 'title'),
  Project: property('project', 'rich_text'),
  'GC / Client': property('gc', 'rich_text'),
  'OG Estimator': property('est', 'select', ['Estimator']),
  'OG City, State': property('loc', 'rich_text'),
  'OG Lost Reason': property('reason', 'rich_text'),
  Status: property('status', 'status', ['Estimator Assigned', 'Proposal Sent', 'For Review']),
  'Contract Value': property('value', 'number'),
  'Due Date: Bid': property('bid', 'date'),
  'Follow-up1': property('follow-up', 'date'),
  'Due Date: Estimation ': property('estimation-date', 'date'),
  'PoC: Name': property('poc', 'rich_text'),
};

test('linked GC rows share the root project identity and use the latest added row', () => {
  const { groups, issues } = sync.groupProjects([
    project(109, 105), project(101), project(105, 101), project(200),
  ]);
  assert.deepEqual(issues, []);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].projectId, 101);
  assert.deepEqual(groups[0].memberIds, [101, 105, 109]);
  assert.equal(groups[0].latest.id, 109);
  assert.equal(groups[1].projectId, 200);
});

test('matching names alone never merge independent projects', () => {
  assert.equal(sync.groupProjects([project(1), project(2)]).groups.length, 2);
});

test('missing references, cycles, duplicate IDs and unsafe IDs stop affected groups', () => {
  const result = sync.groupProjects([project(1, 2), project(2, 1), project(3, 99), project(4), project(4)]);
  assert.equal(result.groups.length, 0);
  assert.ok(result.issues.length >= 4);
  assert.throws(() => sync.groupProjects([project(Number.MAX_SAFE_INTEGER + 1)]));
});

test('latest contact means latest addition, not last edit', () => {
  const contact = sync.latestContact([
    { id: 1, created_at: '2026-01-01', updated_at: '2026-09-01', name: 'Old' },
    { id: 2, created_at: '2026-02-01', name: 'New' },
  ]);
  assert.equal(contact.name, 'New');
  assert.equal(sync.latestContact([]), null);
});

test('only existing statuses have reversible twins', () => {
  for (const [app, notion] of Object.entries(sync.STATUS_TWINS)) {
    assert.equal(sync.notionStatusToApp(notion), app);
  }
  assert.equal(sync.STATUS_TWINS.Sent, 'Proposal Sent');
  assert.equal(sync.notionStatusToApp('Needs Edits'), undefined);
  assert.equal(sync.notionStatusToApp('Estimation Ready'), undefined);
});

test('OG properties take priority and modern people/place fields are not guessed', () => {
  const bindings = sync.resolveBindings({ ...schema, 'Estimator Assigned': property('people', 'people'), Address: property('address', 'place') });
  assert.equal(bindings.estimator_name.id, 'est');
  assert.equal(bindings.location_name.id, 'loc');
  const absent = sync.resolveBindings({ 'Estimator Assigned': property('people', 'people'), Address: property('address', 'place') });
  assert.equal(absent.estimator_name, undefined);
  assert.equal(absent.location_name, undefined);
});

test('projection includes one latest contact and preserves legacy lost text', () => {
  const snapshot = sync.projectSnapshot(project(1, null, { lost_reason: 'Original history', contract_value: '0' }), { name: 'Latest', email: 'test@example.invalid', title: 'Estimator' });
  assert.equal(snapshot.lost_reason, 'Original history');
  assert.equal(snapshot.contract_value, 0);
  assert.equal(snapshot.contact_name, 'Latest');
});

test('outbound properties use status twins and do not touch unmatched fields', () => {
  const snapshot = sync.projectSnapshot(project(1, null, { status_label: 'Sent', contract_value: '100' }));
  const { properties, issues } = sync.toNotionProperties(snapshot, sync.resolveBindings(schema));
  assert.deepEqual(issues, []);
  assert.equal(properties.project.rich_text[0].text.content, 'Test Project');
  assert.equal(properties.title, undefined);
  assert.equal(properties.status.status.name, 'Proposal Sent');
  assert.equal(properties.est.select.name, 'Estimator');
  assert.equal(properties.reason.rich_text.length, 0);
  assert.equal(properties.value.number, 100);
  assert.equal(properties['Estimator Assigned'], undefined);
});

test('unknown status and priority choices require review rather than creating options', () => {
  const result = sync.toNotionProperties({ status_label: 'Not a status', priority_name: 'Overdue' }, sync.resolveBindings({ ...schema, Priority: property('priority', 'select', ['Urgent']) }));
  assert.equal(result.issues.length, 2);
  assert.equal(result.properties.status, undefined);
  assert.equal(result.properties.priority, undefined);
});

test('Notion status is decoded back to the existing app status', () => {
  const { values, issues } = sync.readNotionSnapshot({ properties: { Status: { id: 'status', type: 'status', status: { name: 'Proposal Sent' } } } }, sync.resolveBindings({ Status: schema.Status }));
  assert.equal(values.status_label, 'Sent');
  assert.deepEqual(issues, []);
});

test('date ranges and unknown Notion statuses block destructive flattening', () => {
  const { issues } = sync.readNotionSnapshot({ properties: {
    Status: { id: 'status', type: 'status', status: { name: 'Stale' } },
    'Due Date: Bid': { id: 'bid', type: 'date', date: { start: '2026-09-10', end: '2026-09-12' } },
  } }, sync.resolveBindings({ Status: schema.Status, 'Due Date: Bid': schema['Due Date: Bid'] }));
  assert.equal(issues.length, 2);
});

test('bidirectional plans merge independent edits and hold same-field conflicts', () => {
  const baseline = { project_name: 'Original', contract_value: 1, due_date: '2026-09-10' };
  const local = { ...baseline, project_name: 'App edit', due_date: '2026-09-11' };
  const remote = { ...baseline, contract_value: 2, due_date: '2026-09-12' };
  const plan = sync.compareSnapshots(local, remote, baseline);
  assert.deepEqual(plan.toNotion, { project_name: 'App edit' });
  assert.deepEqual(plan.toSupabase, { contract_value: 2 });
  assert.deepEqual(plan.conflicts, ['due_date']);
});

test('without a baseline existing differences are reviewed, never blindly overwritten', () => {
  const result = sync.compareSnapshots({ project_name: 'App' }, { project_name: 'Notion' }, null);
  assert.deepEqual(result.toNotion, {});
  assert.deepEqual(result.toSupabase, {});
  assert.deepEqual(result.conflicts, ['project_name']);
});

test('missing baseline fields are conflicts and contact writebacks require review', () => {
  const result = sync.compareSnapshots({ contact_name: 'Old', contract_value: 2 }, { contact_name: 'New', contract_value: 3 }, { contact_name: 'Old' });
  assert.deepEqual(result.toSupabase, {});
  assert.deepEqual(result.conflicts.sort(), ['contact_name', 'contract_value']);
});

test('unchanged data generates no work or sync echo', () => {
  const values = { project_name: 'Same', contract_value: null };
  assert.deepEqual(sync.compareSnapshots(values, values, values), { toNotion: {}, toSupabase: {}, conflicts: [] });
});

const server = loadTs('notionSyncServer.ts');
const databaseId = '11111111-1111-1111-1111-111111111111';
const sourceId = '22222222-2222-2222-2222-222222222222';
const configured = () => server.getNotionSyncConfig({ NOTION_TOKEN: 'test-token', NOTION_SYNC_PREVIEW_ENABLED: 'true' });

test('configuration is disabled by default and public status never contains credentials', () => {
  const config = server.getNotionSyncConfig({ NOTION_TOKEN: 'test-token' });
  const status = server.getNotionSyncStatus(config);
  assert.equal(status.previewEnabled, false);
  assert.equal(status.writesEnabled, false);
  assert.equal(status.scheduled, false);
  assert.ok(!JSON.stringify(status).includes('test-token'));
});

test('disabled Notion reader cannot make network requests', async () => {
  let calls = 0;
  const reader = server.createNotionReader(server.getNotionSyncConfig({}), async () => { calls++; });
  await assert.rejects(reader.discover(databaseId, ''), /requires/);
  assert.equal(calls, 0);
});

test('reader discovers a data-source ID instead of querying with the database ID', async () => {
  const requests = [];
  const reader = server.createNotionReader(configured(), async (url, options) => {
    requests.push({ url, options });
    return Response.json(url.includes('/databases/') ? { data_sources: [{ id: sourceId }] } : { id: sourceId, properties: schema });
  });
  const source = await reader.discover(databaseId, '');
  assert.equal(source.id, sourceId);
  assert.ok(requests[1].url.endsWith(`/data_sources/${sourceId}`));
  assert.ok(requests.every(request => request.options.method === 'GET'));
  assert.equal(requests[0].options.headers['Notion-Version'], '2025-09-03');
  assert.equal(requests[0].options.redirect, 'error');
});

test('reader refuses ambiguous sources and invalid IDs without guessing', async () => {
  let calls = 0;
  const reader = server.createNotionReader(configured(), async () => {
    calls++;
    return Response.json({ data_sources: [{ id: sourceId }, { id: databaseId }] });
  });
  await assert.rejects(reader.discover(databaseId, ''), /multiple data sources/);
  assert.equal(calls, 1);
  await assert.rejects(reader.pages('../../pages'), /Invalid Notion/);
  assert.equal(calls, 1);
});

test('Notion rows are paginated using read-only query operations', async () => {
  const requests = [];
  const reader = server.createNotionReader(configured(), async (url, options) => {
    requests.push({ url, options });
    return Response.json(requests.length === 1
      ? { results: [{ id: 'a' }], has_more: true, next_cursor: 'next' }
      : { results: [{ id: 'b' }, { id: 'archived', archived: true }], has_more: false });
  });
  assert.deepEqual((await reader.pages(sourceId)).map(page => page.id), ['a', 'b']);
  assert.ok(requests.every(request => request.url.endsWith('/query') && request.options.method === 'POST'));
  assert.equal(JSON.parse(requests[1].options.body).start_cursor, 'next');
});

test('pagination failures and rate limits stop safely without exposing response bodies', async () => {
  const broken = server.createNotionReader(configured(), async () => Response.json({ results: [], has_more: true }));
  await assert.rejects(broken.pages(sourceId), /Incomplete Notion pagination/);
  const limited = server.createNotionReader(configured(), async () => new Response('private upstream body', { status: 429, headers: { 'retry-after': '10' } }));
  await assert.rejects(limited.pages(sourceId), error => error.message.includes('retry after 10') && !error.message.includes('private upstream body'));
});

function readOnlyDb(tables) {
  return {
    from(table) {
      let rows = tables[table] || [];
      const query = {
        select() { return query; },
        order() { rows = [...rows].sort((a, b) => a.id - b.id); return query; },
        in(key, values) { rows = rows.filter(row => values.includes(row[key])); return query; },
        eq(key, value) { rows = rows.filter(row => row[key] === value); return query; },
        range(start, end) { return Promise.resolve({ data: rows.slice(start, end + 1), error: null }); },
        single() { return Promise.resolve({ data: rows[0] || null, error: null }); },
        then(resolve) { return Promise.resolve({ data: rows, error: null }).then(resolve); },
      };
      return query;
    },
  };
}

test('source preview preserves app rows, groups linked GCs, and projects only latest data', async () => {
  const rows = [project(1, null, { builder_id: 1, builders: { name: 'Old GC' } }), project(2, 1, { builder_id: 2, builders: { name: 'Latest GC' }, statuses: { label: 'Sent' } })];
  const db = readOnlyDb({
    projects: rows,
    builder_contacts: [{ id: 1, builder_id: 2, name: 'Old Contact', created_at: '2026-01-01' }, { id: 2, builder_id: 2, name: 'Latest Contact', created_at: '2026-02-01' }],
    project_contacts: [{ id: 3, project_id: 2, name: 'Legacy Contact' }],
  });
  const result = await server.previewNotionSync(db, server.getNotionSyncConfig({}), { compare: false, limit: 20 });
  assert.equal(result.writesEnabled, false);
  assert.equal(result.sourceProjectCount, 2);
  assert.equal(result.groupedProjectCount, 1);
  assert.equal(result.proposals[0].projectId, 1);
  assert.equal(result.proposals[0].sourceProjectId, 2);
  assert.equal(result.proposals[0].values.builder_name, 'Latest GC');
  assert.equal(result.proposals[0].values.contact_name, 'Latest Contact');
  assert.equal(rows.length, 2);
});

test('source pagination reads beyond a single Supabase page', async () => {
  const result = await server.previewNotionSync(readOnlyDb({ projects: Array.from({ length: 501 }, (_, index) => project(index + 1)) }), server.getNotionSyncConfig({}), { compare: false, limit: 2, projectId: 501 });
  assert.equal(result.sourceProjectCount, 501);
  assert.equal(result.proposals[0].projectId, 501);
});

function routeFor(session, role = 'admin') {
  return loadTs('../app/api/sync/notion/route.ts', {
    '@/lib/auth': { getVerifiedSession: () => session },
    '@/lib/db': { getDb: () => readOnlyDb({ users: [{ id: 1, role }] }) },
    '@/lib/notionSyncServer': { ...server, getNotionSyncConfig: () => server.getNotionSyncConfig({}), previewNotionSync: () => { throw new Error('Unexpected preview call'); } },
    '@/lib/notionPublish': { setupNotionPublishing: () => { throw new Error('Unexpected setup call'); }, publishNotionProjects: () => { throw new Error('Unexpected publish call'); } },
  });
}
const request = body => new Request('http://localhost:3000/api/sync/notion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

function publisherFixture() {
  const config = { ...configured(), publishEnabled: true };
  const estimatedId = '33333333-3333-3333-3333-333333333333';
  const identitySchema = { 'Supabase Project ID': property('app-id', 'number'), 'Supabase Sync Snapshot': property('snapshot', 'rich_text') };
  const proposalSchema = { ...schema, ...identitySchema, Status: property('status', 'status', Object.values(sync.STATUS_TWINS)), 'Estimated Project': { id: 'relation', type: 'relation', relation: { data_source_id: estimatedId } } };
  const sources = {
    [sourceId]: { id: sourceId, properties: proposalSchema },
    [estimatedId]: { id: estimatedId, properties: { 'Project Name': schema['Project Name'], ...identitySchema } },
  };
  const pages = { [sourceId]: [], [estimatedId]: [] };
  const files = new Map();
  const calls = [];
  let locked = false;
  let failCreate;
  const fakeFs = {
    async mkdir() {},
    async open() { if (locked) throw new Error('Locked'); locked = true; return { async writeFile() {}, async close() {} }; },
    async readFile(file) { if (!files.has(file)) throw Object.assign(new Error('Missing'), { code: 'ENOENT' }); return files.get(file); },
    async writeFile(file, data) { files.set(file, data); },
    async rename(from, to) { files.set(to, files.get(from)); files.delete(from); },
    async unlink() { locked = false; },
  };
  const readPage = id => Object.values(pages).flat().find(page => page.id === id);
  const api = async (url, body, method = 'POST') => {
    calls.push({ url, body, method });
    if (url === 'pages') {
      if (failCreate) throw failCreate;
      const source = body.parent.data_source_id;
      const page = { id: `00000000-0000-0000-0000-${String(calls.length).padStart(12, '0')}`, parent: body.parent, properties: {} };
      for (const [name, prop] of Object.entries(sources[source].properties)) {
        page.properties[name] = { id: prop.id, type: prop.type, [prop.type]: ['title', 'rich_text', 'relation'].includes(prop.type) ? [] : null, ...body.properties[prop.id] };
      }
      pages[source].push(page);
      return structuredClone(page);
    }
    assert.equal(method, 'PATCH');
    const page = readPage(url.slice(6));
    for (const [id, value] of Object.entries(body.properties)) Object.assign(Object.values(page.properties).find(prop => prop.id === id), value);
    return structuredClone(page);
  };
  const publisher = loadTs('notionPublish.ts', {
    'node:fs': { promises: fakeFs },
    './notionSyncServer': {
      ...server,
      createNotionRequest: () => api,
      createNotionReader: () => ({
        discover: async database => sources[database === config.proposalDatabaseId ? sourceId : estimatedId],
        pages: async id => structuredClone(pages[id]),
        page: async id => structuredClone(readPage(id)),
      }),
    },
  });
  const rows = [project(29, null, { statuses: { label: 'Sent' }, builders: { name: 'GC' }, contract_value: 100 })];
  return { publisher, config, pages, calls, rows, estimatedId, proposalSchema, fail: error => { failCreate = error; }, run: options => publisher.publishNotionProjects(readOnlyDb({ projects: rows }), config, { limit: 5, ...options }) };
}

test('publisher dry run writes neither pages nor journal; confirmed create uses twins and is idempotent', async () => {
  const f = publisherFixture();
  assert.equal((await f.run({})).results[0].action, 'would_created');
  assert.equal(f.calls.length, 0);
  assert.equal((await f.run({ dryRun: false })).results[0].action, 'created');
  assert.equal(f.calls.length, 2);
  assert.equal(f.pages[sourceId][0].properties.Status.status.name, 'Proposal Sent');
  assert.equal(f.pages[sourceId][0].properties.Project.rich_text[0].text.content, 'Test Project');
  assert.deepEqual(f.pages[sourceId][0].properties['Project Name'].title, []);
  assert.equal(f.pages[sourceId][0].properties['Supabase Project ID'].number, 29);
  assert.equal(f.pages[sourceId][0].properties['Estimated Project'].relation.length, 1);
  assert.equal((await f.run({ dryRun: false })).results[0].action, 'unchanged');
  assert.equal(f.calls.length, 2);
  f.rows[0].contract_value = 200;
  f.pages[sourceId][0].properties.Notes = { id: 'notes', type: 'rich_text', rich_text: [{ text: { content: 'Keep me' } }] };
  assert.equal((await f.run({ dryRun: false })).results[0].action, 'updated');
  assert.equal(f.pages[sourceId][0].properties['Contract Value'].number, 200);
  assert.equal(f.calls.at(-1).body.properties.notes, undefined);
  f.pages[sourceId][0].properties['Contract Value'].number = 300;
  assert.match((await f.run({ dryRun: false })).results[0].error, /review before overwriting/);
  assert.equal(f.pages[sourceId][0].properties['Contract Value'].number, 300);
});

test('publisher can migrate an empty Project property without changing the automated title', () => {
  const f = publisherFixture();
  const page = { properties: {
    'Project Name': { id: 'title', type: 'title', title: [{ type: 'text', text: { content: 'Automated title' } }] },
    Project: { id: 'project', type: 'rich_text', rich_text: [] },
    'Supabase Sync Snapshot': { id: 'snapshot', type: 'rich_text', rich_text: [{ type: 'text', text: { content: JSON.stringify({ version: 1, sourceProjectId: 29, fingerprints: {} }) } }] },
  } };
  const changes = f.publisher.planManagedUpdate(page, { project: { rich_text: [{ type: 'text', text: { content: 'Test Project' } }] } }, f.proposalSchema, { projectId: 29, sourceProjectId: 29 });
  assert.equal(changes.project.rich_text[0].text.content, 'Test Project');
  assert.equal(changes.title, undefined);
});

test('Notion owns follow-up dates: outbound never writes them and inbound planning chooses Notion', async () => {
  const f = publisherFixture();
  f.rows[0].follow_up_date = '2026-08-19';
  await f.run({ dryRun: false });
  assert.equal(f.calls[1].body.properties['follow-up'], undefined);
  f.pages[sourceId][0].properties['Follow-up1'].date = { start: '2026-09-25', end: null, time_zone: null };
  assert.equal((await f.run({ dryRun: false })).results[0].action, 'unchanged');
  assert.deepEqual(sync.compareSnapshots({ follow_up_date: '2026-08-19' }, { follow_up_date: '2026-09-25' }, null), { toNotion: {}, toSupabase: { follow_up_date: '2026-09-25' }, conflicts: [] });
});

test('publisher blocks duplicate IDs and unknown statuses without deleting anything', async () => {
  const f = publisherFixture();
  await f.run({ dryRun: false });
  f.pages[sourceId].push(structuredClone(f.pages[sourceId][0]));
  assert.match((await f.run({ dryRun: false })).results[0].error, /Duplicate/);
  assert.equal(f.calls.length, 2);
  const unknown = publisherFixture();
  unknown.rows[0].statuses.label = 'Unknown';
  assert.match((await unknown.run({ dryRun: false })).results[0].error, /No approved status twin/);
  assert.equal(unknown.calls.length, 0);
});

test('uncertain creates are never retried blindly and disabled publishing makes no writes', async () => {
  const f = publisherFixture();
  f.fail(new Error('Network timeout'));
  assert.equal((await f.run({ dryRun: false })).results[0].action, 'blocked');
  f.fail(undefined);
  assert.match((await f.run({ dryRun: false })).results[0].error, /outcome is uncertain/);
  assert.equal(f.calls.length, 1);
  f.config.publishEnabled = false;
  await assert.rejects(f.run({ dryRun: false }), /PUBLISH_ENABLED/);
  assert.equal(f.calls.length, 1);
});

test('setup leaves inaccessible GC relations untouched and adds a separate OG text property', () => {
  const f = publisherFixture();
  const additions = f.publisher.setupProperties({ ...f.proposalSchema, 'GC / Client': { id: 'hidden', type: 'relation', relation: {} } }, f.estimatedId);
  assert.equal(additions['GC / Client'], undefined);
  assert.equal(additions['OG GC / Client'].type, 'rich_text');
});

test('sync API requires both an admin token and a current admin database role', async () => {
  assert.equal((await routeFor(null).GET(request({}))).status, 401);
  assert.equal((await routeFor({ id: 1, role: 'viewer' }).GET(request({}))).status, 403);
  assert.equal((await routeFor({ id: 1, role: 'admin' }, 'viewer').GET(request({}))).status, 403);
  assert.equal((await routeFor({ id: 1, role: 'admin' }).GET(request({}))).status, 200);
});

test('publish API validates inputs, requires activation, and forwards bounded batches', async () => {
  const calls = [];
  const config = configured();
  const route = loadTs('../app/api/sync/notion/route.ts', {
    '@/lib/auth': { getVerifiedSession: () => ({ id: 1, role: 'admin' }) },
    '@/lib/db': { getDb: () => readOnlyDb({ users: [{ id: 1, role: 'admin' }] }) },
    '@/lib/notionSyncServer': { ...server, getNotionSyncConfig: () => config },
    '@/lib/notionPublish': {
      publishNotionProjects: async (db, config, options) => { calls.push(options); return { dryRun: options.dryRun, results: [] }; },
      setupNotionPublishing: async (config, dryRun) => { calls.push({ dryRun }); return { dryRun, changes: [] }; },
    },
  });
  for (const body of [{ scope: 'publish', dryRun: 'false' }, { scope: 'publish', limit: 6 }, { scope: 'publish', afterProjectId: -1 }, { scope: 'source', dryRun: false }]) {
    assert.equal((await route.POST(request(body))).status, 400);
  }
  assert.equal((await route.POST(request({ scope: 'publish', dryRun: false }))).status, 409);
  assert.equal((await route.POST(request({ scope: 'setup', dryRun: false }))).status, 409);
  assert.equal(calls.length, 0);
  assert.equal((await route.POST(request({ scope: 'publish', afterProjectId: 29 }))).status, 200);
  assert.deepEqual(calls[0], { dryRun: true, limit: 5, projectId: undefined, afterProjectId: 29 });
  config.publishEnabled = true;
  config.previewEnabled = false;
  assert.equal((await route.POST(request({ scope: 'publish', dryRun: false, projectId: 29 }))).status, 200);
  assert.equal(calls[1].dryRun, false);
  assert.equal((await route.POST(request({ scope: 'setup', dryRun: false }))).status, 200);
});

test('publish cursor does not skip the last row when rate limited', async () => {
  const f = publisherFixture();
  f.fail(Object.assign(new Error('Rate limited'), { status: 429 }));
  const result = await f.run({ dryRun: false });
  assert.equal(result.nextAfterProjectId, 28);
  assert.equal(result.interrupted, true);
});

test('admin panel renders setup and publish responses without assuming preview-only fields', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  for (const result of [{ dryRun: true, changes: [{ dataSourceId: sourceId, properties: [] }] }, { dryRun: false, results: [{ projectId: 29, sourceProjectId: 29, action: 'created' }] }]) {
    let stateIndex = 0;
    const panel = loadTs('../components/dashboard/NotionSyncPanel.tsx', {
      react: { ...React, useEffect() {}, useState(initial) { const index = stateIndex++; return [index === 0 ? { writesEnabled: false, previewEnabled: true, tokenConfigured: true } : index === 1 ? result : initial, () => {}]; } },
      '@/lib/apiClient': { fetchWithAuth() { throw new Error('Unexpected request'); } },
    });
    const html = renderToStaticMarkup(panel.default());
    assert.ok(html.includes(result.changes ? 'no changes needed' : 'created'));
    assert.ok(!html.includes('undefined'));
  }
});

test('estimation due date maps separately from bid and follow-up dates in both directions', () => {
  const dateSchema = { ...schema, 'Due Date: Estimation ': property('estimation-date', 'date') };
  const bindings = sync.resolveBindings(dateSchema);
  const encoded = sync.toNotionProperties({ estimation_due_date: '2026-10-01', due_date: '2026-10-08' }, bindings);
  assert.deepEqual(encoded.properties['estimation-date'], { date: { start: '2026-10-01' } });
  assert.deepEqual(encoded.properties.bid, { date: { start: '2026-10-08' } });
  const decoded = sync.readNotionSnapshot({ properties: { 'Due Date: Estimation ': { id: 'estimation-date', type: 'date', date: { start: '2026-10-02' } } } }, { estimation_due_date: bindings.estimation_due_date });
  assert.equal(decoded.values.estimation_due_date, '2026-10-02');
});

test('publisher initializes and clears estimation dates without replacing an unowned Notion date', async () => {
  const f = publisherFixture();
  await f.run({ dryRun: false });
  f.rows[0].estimation_due_date = '2026-10-01';
  assert.equal((await f.run({ dryRun: false })).results[0].action, 'updated');
  assert.equal(f.pages[sourceId][0].properties['Due Date: Estimation '].date.start, '2026-10-01');
  f.rows[0].estimation_due_date = null;
  assert.equal((await f.run({ dryRun: false })).results[0].action, 'updated');
  assert.equal(f.pages[sourceId][0].properties['Due Date: Estimation '].date, null);
  const untouched = publisherFixture();
  await untouched.run({ dryRun: false });
  untouched.pages[sourceId][0].properties['Due Date: Estimation '].date = { start: '2026-11-01' };
  assert.equal((await untouched.run({ dryRun: false })).results[0].action, 'unchanged');
  untouched.rows[0].estimation_due_date = '2026-10-01';
  assert.match((await untouched.run({ dryRun: false })).results[0].error, /review before overwriting/);
});

test('Proposal Log shows estimation due date instead of the follow-up column', () => {
  const { renderToStaticMarkup } = require('react-dom/server');
  const table = loadTs('../components/dashboard/ProposalTable.tsx', { '../../contexts/AuthContext': { useAuth: () => ({ canEditProjects: () => false }) } });
  const html = renderToStaticMarkup(table.default({ projects: [{ ...project(29), due_date: '2026-10-08', estimation_due_date: '2026-10-01', follow_up_date: '2026-10-20' }], onEdit() {} }));
  assert.ok(html.includes('Estimation Due Date'));
  assert.ok(html.includes('10/01/2026'));
  assert.ok(html.includes('10/08/2026'));
  assert.ok(!html.includes('Follow-up Date'));
  assert.ok(!html.includes('10/20/2026'));
});

test('project API creates, reads, edits and clears estimation dates without altering other dates', async () => {
  let row;
  const db = { from() {
    let operation = 'read';
    let data;
    const result = () => {
      if (operation === 'insert') row = { id: 1, ...data };
      if (operation === 'update') row = { ...row, ...data };
      return { data: row, error: null };
    };
    const query = { select() { return query; }, eq() { return query; }, insert(value) { operation = 'insert'; data = value; return query; }, update(value) { operation = 'update'; data = value; return query; }, async single() { return result(); }, then(resolve) { return Promise.resolve(operation === 'read' ? { data: row ? [row] : [], error: null } : result()).then(resolve); } };
    return query;
  } };
  const timezone = loadTs('timezone.ts');
  const create = loadTs('../app/api/projects/route.ts', { '../../../lib/db': { getDb: () => db }, '../../../lib/timezone': timezone });
  const edit = loadTs('../app/api/projects/[id]/route.ts', { '../../../../lib/db': { getDb: () => db }, '../../../../lib/timezone': timezone });
  const values = { project_name: 'Date test', builder_id: 1, estimator_id: 1, status_id: 1, due_date: '2026-10-08', submission_date: '2026-10-07', follow_up_date: '2026-10-20', estimation_due_date: '2026-10-01' };
  assert.equal((await create.POST(request(values))).status, 201);
  assert.equal((await (await create.GET()).json())[0].estimation_due_date, '2026-10-01');
  const params = { params: Promise.resolve({ id: '1' }) };
  assert.equal((await edit.PUT(request({ ...values, estimation_due_date: '2026-10-02' }), params)).status, 200);
  assert.equal(row.estimation_due_date, '2026-10-02');
  for (const invalid of ['2026-02-30', '2026-13-01', '0000-01-01', '2026-10-01T01:00:00Z', '10/01/2026', 123, {}]) {
    assert.equal((await create.POST(request({ ...values, estimation_due_date: invalid }))).status, 400);
    assert.equal((await edit.PUT(request({ ...values, estimation_due_date: invalid }), params)).status, 400);
  }
  const { estimation_due_date, ...legacy } = values;
  await edit.PUT(request(legacy), params);
  assert.equal(row.estimation_due_date, '2026-10-02');
  await edit.PUT(request({ ...legacy, estimation_due_date: '' }), params);
  assert.equal(row.estimation_due_date, null);
  assert.equal(row.due_date, values.due_date);
  assert.equal(row.submission_date, values.submission_date);
  assert.equal(row.follow_up_date, values.follow_up_date);
});

test('create and edit forms submit estimation dates and edit leaves Notion follow-up untouched', async () => {
  const React = require('react');
  for (const name of ['AddProjectModal', 'EditProjectModal']) {
    const states = [];
    let index = 0;
    const submitted = [];
    const component = loadTs(`../components/dashboard/${name}.tsx`, {
      react: { ...React, useEffect() {}, useState(initial) { const key = index++; if (!(key in states)) states[key] = initial; return [states[key], value => { states[key] = value; }]; } },
      '@/contexts/AuthContext': { useAuth: () => ({ user: { id: 1 } }) },
      '@/lib/apiClient': { fetchWithAuth: async (url, options) => { submitted.push(JSON.parse(options.body)); return Response.json({ id: 1 }); } },
      'react-toastify': { toast: { success() {} } },
      'react-toastify/dist/ReactToastify.css': {},
      './LostReasonModal': () => null,
    });
    const render = () => { index = 0; return component.default({ isVisible: true, onClose() {}, onProjectAdded() {}, onProjectUpdated() {}, project: { ...project(29), estimation_due_date: '2026-10-01' } }); };
    const elements = tree => !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(elements) : [tree, ...elements(tree.props?.children)];
    const input = id => elements(render()).find(element => element.props?.id === (name === 'EditProjectModal' && ['builderId', 'estimatorId', 'statusId'].includes(id) ? id.slice(0, -2) : id));
    for (const [id, value] of Object.entries({ projectName: 'Date test', builderId: '1', estimatorId: '1', statusId: '1', dueDate: '2026-10-08', contractValue: '100', estimationDueDate: '2026-10-01' })) {
      assert.ok(input(id), `${name} needs ${id}`);
      input(id).props.onChange({ target: { value } });
    }
    assert.equal(input('estimationDueDate').props.type, 'date');
    await elements(render()).find(element => element.type === 'form').props.onSubmit({ preventDefault() {} });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(submitted[0].estimation_due_date, '2026-10-01');
    assert.equal(submitted[0].due_date, '2026-10-08');
    if (name === 'EditProjectModal') {
      assert.equal(submitted[0].follow_up_date, undefined);
      assert.equal(input('followUpDate').props.disabled, true);
      input('estimationDueDate').props.onChange({ target: { value: '' } });
      await elements(render()).find(element => element.type === 'form').props.onSubmit({ preventDefault() {} });
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(submitted[1].estimation_due_date, null);
    } else {
      assert.equal(input('estimationDueDate').props.value, '');
    }
  }
});

test('estimation date migration preserves existing dates in isolated PostgreSQL', { skip: !process.env.LOCAL_NOTION_TEST_DB }, async () => {
  const url = new URL(process.env.LOCAL_NOTION_TEST_DB);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname), 'Database test must stay local');
  const { Client } = require('pg');
  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query("CREATE TABLE public.projects (id bigint PRIMARY KEY, project_name text NOT NULL, due_date date, follow_up_date date); INSERT INTO public.projects VALUES (1, 'Local fixture', '2026-10-08', '2026-10-20')");
    const migration = fs.readFileSync(path.join(__dirname, '../db/migrations/014_add_estimation_due_date.sql'), 'utf8').replace(/^BEGIN;\s*/, '').replace(/COMMIT;\s*$/, '');
    await client.query(migration);
    const result = await client.query('SELECT estimation_due_date, due_date::text, follow_up_date::text FROM public.projects');
    assert.deepEqual(result.rows, [{ estimation_due_date: null, due_date: '2026-10-08', follow_up_date: '2026-10-20' }]);
    await client.query("UPDATE public.projects SET estimation_due_date = '2026-10-01' WHERE id = 1");
    assert.equal((await client.query('SELECT estimation_due_date::text FROM public.projects')).rows[0].estimation_due_date, '2026-10-01');
  } finally {
    await client.query('ROLLBACK');
    await client.end();
  }
});

test('publish rejects invalid limits before reading or writing', async () => {
  const f = publisherFixture();
  for (const limit of [0, -1, 101, 1.5]) await assert.rejects(f.run({ limit }), /Invalid publish/);
  assert.equal(f.calls.length, 0);
});

test('sync API rejects unsupported write commands and invalid preview inputs', async () => {
  const route = routeFor({ id: 1, role: 'admin' });
  for (const body of [{ apply: true }, { scope: 'apply' }, { limit: 101 }, { projectId: -1 }, null, []]) {
    assert.equal((await route.POST(request(body))).status, 400);
  }
  assert.equal((await route.POST(request({ scope: 'compare' }))).status, 409);
});

test('comparison uses both Notion databases, stable shared IDs and a two-way baseline without writes', async () => {
  const config = configured();
  const estimatedSourceId = '33333333-3333-3333-3333-333333333333';
  const proposalPageId = '44444444-4444-4444-4444-444444444444';
  const estimatedPageId = '55555555-5555-5555-5555-555555555555';
  const textValue = (id, type, value) => ({ id, type, [type]: [{ type: 'text', plain_text: value }] });
  const proposalSchema = {
    'Project Name': schema['Project Name'], Project: schema.Project, 'GC / Client': schema['GC / Client'],
    Status: schema.Status, 'Contract Value': schema['Contract Value'],
    'Supabase Project ID': property('app-id', 'number'),
    'Estimated Projects': { id: 'relation', type: 'relation', relation: { data_source_id: estimatedSourceId } },
  };
  const notionProposal = { id: proposalPageId, properties: {
    'Project Name': textValue('title', 'title', 'Automated title'),
    Project: textValue('project', 'rich_text', 'Test Project'),
    'GC / Client': textValue('gc', 'rich_text', 'Latest GC'),
    Status: { id: 'status', type: 'status', status: { name: 'Estimator Assigned' } },
    'Contract Value': { id: 'value', type: 'number', number: 120 },
    'Supabase Project ID': { id: 'app-id', type: 'number', number: 1 },
    'Estimated Projects': { id: 'relation', type: 'relation', relation: [{ id: estimatedPageId }] },
  } };
  const notionEstimated = { id: estimatedPageId, properties: { 'Project Name': textValue('title', 'title', 'Test Project'), 'Supabase Project ID': { id: 'app-id', type: 'number', number: 1 } } };
  const link = {
    notion_database_id: config.proposalDatabaseId, notion_data_source_id: sourceId,
    estimated_database_id: config.estimatedDatabaseId, estimated_data_source_id: estimatedSourceId,
    project_group_id: 1, source_project_id: 2, notion_page_id: proposalPageId, estimated_page_id: estimatedPageId,
    baseline: { project_name: 'Test Project', builder_name: 'Latest GC', status_label: 'Assigned', contract_value: 100 },
  };
  const db = readOnlyDb({ projects: [project(1), project(2, 1, { builders: { name: 'Latest GC' }, statuses: { label: 'Sent' }, contract_value: 100 })], notion_project_links: [link] });
  const originalFetch = global.fetch;
  const requests = [];
  global.fetch = async (url, options) => {
    requests.push({ url, options });
    if (url.endsWith(`/databases/${config.proposalDatabaseId}`)) return Response.json({ data_sources: [{ id: sourceId }] });
    if (url.endsWith(`/databases/${config.estimatedDatabaseId}`)) return Response.json({ data_sources: [{ id: estimatedSourceId }] });
    if (url.endsWith(`/data_sources/${sourceId}`)) return Response.json({ id: sourceId, properties: proposalSchema });
    if (url.endsWith(`/data_sources/${estimatedSourceId}`)) return Response.json({ id: estimatedSourceId, properties: { 'Project Name': schema['Project Name'], 'Supabase Project ID': property('app-id', 'number') } });
    if (url.endsWith(`/data_sources/${sourceId}/query`)) return Response.json({ results: [notionProposal], has_more: false });
    if (url.endsWith(`/data_sources/${estimatedSourceId}/query`)) return Response.json({ results: [notionEstimated], has_more: false });
    throw new Error('Unexpected request');
  };
  try {
    const result = await server.previewNotionSync(db, config, { compare: true, limit: 20 });
    const plan = result.proposals[0];
    assert.deepEqual(result.setupIssues, []);
    assert.deepEqual(plan.blockers, []);
    assert.equal(plan.action, 'compare');
    assert.equal(plan.estimatedProject.sharedProjectId, 1);
    assert.equal(plan.estimatedProject.notionPageId, estimatedPageId);
    assert.deepEqual(plan.toNotion, { status_label: 'Sent' });
    assert.deepEqual(plan.toSupabase, { contract_value: 120 });
    assert.equal(plan.proposedNotionProperties.status.status.name, 'Proposal Sent');
    assert.equal(result.writesEnabled, false);
    assert.ok(requests.every(request => request.options.method === 'GET' || (request.options.method === 'POST' && request.url.endsWith('/query'))));
    link.source_project_id = 1;
    const changed = await server.previewNotionSync(db, config, { compare: true, limit: 20 });
    assert.equal(changed.proposals[0].action, 'review');
    assert.ok(changed.proposals[0].blockers.some(blocker => blocker.includes('source handover')));
  } finally {
    global.fetch = originalFetch;
  }
});
