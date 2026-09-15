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
        is(key, value) { rows = rows.filter(row => value === null ? row[key] == null : row[key] === value); return query; },
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
  const pagesQueries = [];
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
    if (body.in_trash !== undefined) { if (page) page.in_trash = body.in_trash; return structuredClone(page); }
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
        pages: async (id, filter) => {
          pagesQueries.push({ id, filter });
          let list = structuredClone(pages[id]);
          if (filter?.property === 'Supabase Project ID') {
            const expected = String(filter.number?.equals ?? filter.rich_text?.equals);
            list = list.filter(page => publishModule.readId(page, sources[id].properties) === expected);
          }
          return list;
        },
        page: async id => structuredClone(readPage(id)),
      }),
    },
  });
  const rows = [project(29, null, { statuses: { label: 'Sent' }, builders: { name: 'GC' }, contract_value: 100 })];
  return { publisher, config, pages, calls, rows, files, estimatedId, proposalSchema, pagesQueries, fail: error => { failCreate = error; }, run: options => publisher.publishNotionProjects(readOnlyDb({ projects: rows }), config, { limit: 5, ...options }) };
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
    const query = { select() { return query; }, eq() { return query; }, is() { return query; }, insert(value) { operation = 'insert'; data = value; return query; }, update(value) { operation = 'update'; data = value; return query; }, async single() { return result(); }, then(resolve) { return Promise.resolve(operation === 'read' ? { data: row ? [row] : [], error: null } : result()).then(resolve); } };
    return query;
  } };
  const timezone = loadTs('timezone.ts');
  const create = loadTs('../app/api/projects/route.ts', { '../../../lib/db': { getDb: () => db }, '../../../lib/timezone': timezone, '../../../lib/notionAfterSave': { schedulePublish() {} } });
  const edit = loadTs('../app/api/projects/[id]/route.ts', { '../../../../lib/db': { getDb: () => db }, '../../../../lib/timezone': timezone, '../../../../lib/notionAfterSave': { schedulePublish() {} } });
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

// --- inbound (Notion -> Supabase) ---------------------------------------------------------------
const gcMatch = loadTs('gcMatch.ts');
const publishModule = loadTs('notionPublish.ts');

function loadTsDeep(name, dependencies = {}) {
  const filename = path.join(__dirname, name);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded.require = id => {
    if (Object.hasOwn(dependencies, id)) return dependencies[id];
    if (id.startsWith('./')) return loadTsDeep(path.join(path.dirname(name), `${id.slice(2)}.ts`), dependencies);
    if (id.startsWith('@/')) return loadTsDeep(`../${id.slice(2)}.ts`, dependencies);
    return module.require(id);
  };
  loaded._compile(compiled.outputText, filename);
  return loaded.exports;
}

function writableDb(tables, writes) {
  return { from(name) {
    const table = tables[name] || (tables[name] = []);
    let rows = table, inserted = null, updated = null, pendingError = null, deleting = false;
    const query = {
      select() { return query; },
      order() { rows = [...rows].sort((a, b) => (a.id || 0) - (b.id || 0)); return query; },
      in(key, values) { rows = rows.filter(row => values.includes(row[key])); return query; },
      eq(key, value) { rows = rows.filter(row => row[key] === value); return query; },
      is(key, value) { rows = rows.filter(row => value === null ? row[key] == null : row[key] === value); return query; },
      lt(key, value) { rows = rows.filter(row => row[key] < value); return query; },
      range(start, end) { return Promise.resolve({ data: rows.slice(start, end + 1), error: null }); },
      single() { return Promise.resolve({ data: inserted || rows[0] || null, error: pendingError }); },
      insert(values) {
        if (name === 'notion_sync_lock' && table.some(row => row.target === values.target)) { pendingError = { code: '23505', message: 'duplicate key' }; return query; }
        inserted = { id: Math.max(0, ...table.map(row => row.id || 0)) + 1, ...values };
        table.push(inserted);
        writes.push({ table: name, op: 'insert', values });
        return query;
      },
      upsert(values, { onConflict } = {}) {
        const keys = (onConflict || 'id').split(',');
        for (const value of [].concat(values)) {
          const existing = table.find(row => keys.every(key => row[key] === value[key]));
          if (existing) Object.assign(existing, value); else table.push({ ...value });
        }
        writes.push({ table: name, op: 'upsert', values });
        return query;
      },
      update(values) { updated = values; return query; },
      delete() { deleting = true; return query; },
      then(resolve) {
        if (pendingError) return Promise.resolve({ data: null, error: pendingError }).then(resolve);
        if (deleting) {
          writes.push({ table: name, op: 'delete', rows: [...rows] });
          for (const row of rows) table.splice(table.indexOf(row), 1);
          return Promise.resolve({ data: null, error: null }).then(resolve);
        }
        if (updated) { writes.push({ table: name, op: 'update', values: updated, ids: rows.map(row => row.id ?? row.target ?? row.key) }); rows.forEach(row => Object.assign(row, updated)); return Promise.resolve({ data: rows, error: null }).then(resolve); }
        return Promise.resolve({ data: rows, error: null }).then(resolve);
      },
    };
    return query;
  } };
}

const pageText = property => (property?.rich_text || property?.title || []).map(part => part.plain_text ?? part.text?.content ?? '').join('');
const textProp = (id, type, value) => ({ id, type, [type]: value == null ? [] : [{ type: 'text', plain_text: value, text: { content: value } }] });

function inboundFixture() {
  const config = { ...configured(), publishEnabled: true, inboundEnabled: true };
  const estimatedId = '33333333-3333-3333-3333-333333333333';
  const clientsId = '66666666-6666-6666-6666-666666666666';
  const identitySchema = { 'Supabase Project ID': property('app-id', 'rich_text'), 'Supabase Sync Snapshot': property('snapshot', 'rich_text') };
  const proposalSchema = {
    Project: property('project', 'title'),
    'OG GC / Client': property('gc', 'rich_text'),
    'GC / Client': { id: 'gc-rel', type: 'relation', relation: { data_source_id: clientsId } },
    Status: property('status', 'status', Object.values(sync.STATUS_TWINS)),
    'Contract Value': property('value', 'number'),
    'Due Date: Bid': property('bid', 'date'),
    'Estimated Project': { id: 'relation', type: 'relation', relation: { data_source_id: estimatedId } },
    ...identitySchema,
  };
  const sources = {
    [sourceId]: { id: sourceId, properties: proposalSchema },
    [estimatedId]: { id: estimatedId, properties: { 'Project Name': property('title', 'title'), ...identitySchema } },
  };
  const pages = { [sourceId]: [], [estimatedId]: [], [clientsId]: [] };
  const files = new Map();
  const calls = [];
  const writes = [];
  const pagesQueries = [];
  let locked = false;
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
      const source = body.parent.data_source_id;
      const page = { id: `99999999-9999-9999-9999-${String(calls.length).padStart(12, '0')}`, parent: body.parent, properties: {} };
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
  const inbound = loadTsDeep('notionInbound.ts', {
    'node:fs': { promises: fakeFs },
    './notionSyncServer': {
      ...server,
      createNotionRequest: () => api,
      createNotionReader: () => ({
        discover: async database => sources[database === config.proposalDatabaseId ? sourceId : estimatedId],
        pages: async (id, filter) => { pagesQueries.push({ id, filter }); return structuredClone(pages[id]).filter(page => !(page.in_trash || page.archived)); },
        page: async id => structuredClone(readPage(id)),
      }),
    },
  });
  const tables = {
    projects: [],
    builders: [{ id: 7, name: 'Weavercooke' }],
    statuses: [{ id: 3, label: 'Assigned' }],
    estimators: [],
    locations: [],
    priorities: [],
  };
  const newPage = (pageId, name, extra = {}) => ({ id: pageId, parent: { data_source_id: sourceId }, properties: {
    Project: textProp('project', 'title', name),
    'OG GC / Client': textProp('gc', 'rich_text', null),
    'GC / Client': { id: 'gc-rel', type: 'relation', relation: [] },
    Status: { id: 'status', type: 'status', status: { name: 'Estimator Assigned' } },
    'Contract Value': { id: 'value', type: 'number', number: null },
    'Due Date: Bid': { id: 'bid', type: 'date', date: null },
    'Estimated Project': { id: 'relation', type: 'relation', relation: [] },
    'Supabase Project ID': textProp('app-id', 'rich_text', null),
    'Supabase Sync Snapshot': textProp('snapshot', 'rich_text', null),
    ...extra,
  } });
  return { inbound, config, pages, calls, writes, files, tables, estimatedId, clientsId, proposalSchema, newPage, pagesQueries, run: options => inbound.pullNotionChanges(writableDb(tables, writes), config, { limit: 10, ...options }) };
}

test('name matcher resolves exact, core and fuzzy GC names and reports misses', () => {
  const matcher = gcMatch.createNameMatcher([{ name: 'Samet Corp' }, { name: 'Weaver Cooke' }]);
  assert.equal(matcher('Weaver Cooke').how, 'exact');
  assert.equal(matcher('Samet Corporation').how, 'core');
  assert.equal(matcher('Samet Corporation').match.name, 'Samet Corp');
  assert.match(matcher('Weavercooke').how, /^fuzzy/);
  assert.equal(matcher('Weavercooke').match.name, 'Weaver Cooke');
  assert.equal(matcher('Shelco LLC').match, null);
});

test('inbound creates a project from a new row, fuzzy-matches the GC relation, and writes back identity', async () => {
  const f = inboundFixture();
  const pageId = '77777777-7777-7777-7777-777777777777';
  const clientId = '88888888-8888-8888-8888-888888888888';
  f.pages[f.clientsId].push({ id: clientId, properties: { 'Client Name': { id: 'cn', type: 'title', title: [{ type: 'text', plain_text: 'Weaver Cooke' }] } } });
  f.pages[sourceId].push(f.newPage(pageId, 'New Job', {
    'GC / Client': { id: 'gc-rel', type: 'relation', relation: [{ id: clientId }] },
    'Contract Value': { id: 'value', type: 'number', number: 500 },
  }));
  const dry = await f.run({});
  assert.equal(dry.results[0].action, 'created');
  assert.equal(dry.results[0].builder, 'Weavercooke');
  assert.equal(f.writes.length, 0);
  assert.equal(f.calls.length, 0);
  const live = await f.run({ dryRun: false });
  assert.equal(live.results[0].action, 'created');
  const insert = f.writes.find(write => write.table === 'projects' && write.op === 'insert');
  assert.equal(insert.values.builder_id, 7);
  assert.equal(insert.values.status_id, 3);
  assert.equal(insert.values.contract_value, 500);
  assert.equal(insert.values.reference_project_id, null);
  assert.equal(f.pages[f.estimatedId].length, 1);
  const page = f.pages[sourceId][0];
  assert.equal(pageText(page.properties['Supabase Project ID']), '1');
  assert.equal(page.properties['Estimated Project'].relation[0].id, f.pages[f.estimatedId][0].id);
  assert.equal(pageText(page.properties['OG GC / Client']), 'Weavercooke');
  const meta = JSON.parse(pageText(page.properties['Supabase Sync Snapshot']));
  assert.equal(meta.projectId, 1);
  assert.equal(meta.sourceProjectId, 1);
  assert.ok(meta.fingerprints['app-id']);
  assert.ok(meta.fingerprints['relation']);
});

test('inbound links a new row to an existing estimated page as its reference project', async () => {
  const f = inboundFixture();
  const pageId = '77777777-7777-7777-7777-777777777778';
  const estimatedPageId = '88888888-8888-8888-8888-888888888889';
  f.pages[f.estimatedId].push({ id: estimatedPageId, properties: {
    'Project Name': textProp('title', 'title', 'New Job'),
    'Supabase Project ID': textProp('app-id', 'rich_text', '42'),
    'Supabase Sync Snapshot': textProp('snapshot', 'rich_text', null),
  } });
  f.pages[sourceId].push(f.newPage(pageId, 'new job'));
  const live = await f.run({ dryRun: false });
  assert.equal(live.results[0].action, 'created');
  const insert = f.writes.find(write => write.table === 'projects' && write.op === 'insert');
  assert.equal(insert.values.reference_project_id, 42);
  assert.equal(f.pages[f.estimatedId].length, 1);
  assert.equal(f.pages[sourceId][0].properties['Estimated Project'].relation[0].id, estimatedPageId);
  const meta = JSON.parse(pageText(f.pages[sourceId][0].properties['Supabase Sync Snapshot']));
  assert.equal(meta.projectId, 42);
});

test('inbound dry run reports builders it would create; live inserts the builder before the project', async () => {
  const f = inboundFixture();
  const pageId = '77777777-7777-7777-7777-777777777779';
  f.pages[sourceId].push(f.newPage(pageId, 'Unknown GC Job', { 'OG GC / Client': textProp('gc', 'rich_text', 'Brandnew Builders') }));
  const dry = await f.run({});
  assert.equal(dry.results[0].action, 'created');
  assert.equal(dry.results[0].wouldCreateBuilder, 'Brandnew Builders');
  assert.equal(f.writes.length, 0);
  const live = await f.run({ dryRun: false });
  const builderInsert = f.writes.find(write => write.table === 'builders');
  const projectInsert = f.writes.find(write => write.table === 'projects');
  assert.equal(builderInsert.values.name, 'Brandnew Builders');
  assert.equal(projectInsert.values.builder_id, 8);
  assert.ok(f.writes.indexOf(builderInsert) < f.writes.indexOf(projectInsert));
  assert.equal(live.results[0].action, 'created');
});

test('inbound pulls a Notion-only contract value edit into Supabase and advances the baseline', async () => {
  const f = inboundFixture();
  const pageId = '77777777-7777-7777-7777-777777777780';
  f.tables.projects.push({ id: 29, reference_project_id: null, project_name: 'Linked Job', builders: { name: 'GC' }, statuses: { label: 'Assigned' }, contract_value: 100 });
  const meta = { version: 1, projectId: 29, sourceProjectId: 29, fingerprints: { value: publishModule.propertyFingerprint({ type: 'number', number: 100 }) } };
  f.pages[sourceId].push(f.newPage(pageId, 'Linked Job', {
    'Supabase Project ID': textProp('app-id', 'rich_text', '29'),
    'Supabase Sync Snapshot': textProp('snapshot', 'rich_text', JSON.stringify(meta)),
    'OG GC / Client': textProp('gc', 'rich_text', 'GC'),
    'Contract Value': { id: 'value', type: 'number', number: 120 },
  }));
  const dry = await f.run({});
  assert.equal(dry.results[0].action, 'would_update');
  assert.equal(f.writes.length, 0);
  assert.equal(f.calls.length, 0);
  const live = await f.run({ dryRun: false });
  assert.equal(live.results[0].action, 'updated');
  assert.deepEqual(live.results[0].fields, ['contract_value']);
  const update = f.writes.find(write => write.table === 'projects' && write.op === 'update');
  assert.deepEqual(update.ids, [29]);
  assert.equal(update.values.contract_value, 120);
  const next = JSON.parse(pageText(f.pages[sourceId][0].properties['Supabase Sync Snapshot']));
  assert.equal(next.fingerprints.value, publishModule.propertyFingerprint({ type: 'number', number: 120 }));
  const again = await f.run({ dryRun: false });
  assert.equal(again.results.length, 0);
  assert.equal(again.counts.unchanged, 1);
});

test('inbound holds same-field conflicts for review and blocks unknown statuses without writes', async () => {
  const f = inboundFixture();
  const pageId = '77777777-7777-7777-7777-777777777781';
  f.tables.projects.push({ id: 29, reference_project_id: null, project_name: 'Linked Job', builders: { name: 'GC' }, statuses: { label: 'Assigned' }, contract_value: 150 });
  const meta = { version: 1, projectId: 29, sourceProjectId: 29, fingerprints: { value: publishModule.propertyFingerprint({ type: 'number', number: 100 }) } };
  f.pages[sourceId].push(f.newPage(pageId, 'Linked Job', {
    'Supabase Project ID': textProp('app-id', 'rich_text', '29'),
    'Supabase Sync Snapshot': textProp('snapshot', 'rich_text', JSON.stringify(meta)),
    'OG GC / Client': textProp('gc', 'rich_text', 'GC'),
    'Contract Value': { id: 'value', type: 'number', number: 120 },
  }));
  const live = await f.run({ dryRun: false });
  assert.equal(live.results[0].action, 'review');
  assert.deepEqual(live.results[0].conflicts, ['contract_value']);
  assert.equal(f.writes.length, 0);
  const unknown = inboundFixture();
  unknown.pages[sourceId].push(unknown.newPage('77777777-7777-7777-7777-777777777782', 'Bad Status', { Status: { id: 'status', type: 'status', status: { name: 'Weird' } } }));
  const blocked = await unknown.run({ dryRun: false });
  assert.equal(blocked.results[0].action, 'blocked');
  assert.equal(unknown.writes.length, 0);
  assert.equal(unknown.calls.length, 0);
});

test('inbound journal pending blocks inserts while a recorded projectId repairs the write-back', async () => {
  const f = inboundFixture();
  const pageId = '77777777-7777-7777-7777-777777777783';
  f.pages[sourceId].push(f.newPage(pageId, 'Journal Job', { 'OG GC / Client': textProp('gc', 'rich_text', 'Weavercooke') }));
  const target = require('node:crypto').createHash('sha256').update(f.config.proposalDatabaseId + f.config.estimatedDatabaseId).digest('hex').slice(0, 16);
  const file = path.resolve(f.config.stateDirectory, `${target}.json`);
  f.files.set(file, JSON.stringify({ [`inbound:${pageId}`]: { pending: true } }));
  const blocked = await f.run({ dryRun: false });
  assert.equal(blocked.results[0].action, 'blocked');
  assert.match(blocked.results[0].error, /reconcile/i);
  assert.equal(f.writes.length, 0);
  f.files.set(file, JSON.stringify({ [`inbound:${pageId}`]: { projectId: 88 } }));
  const repaired = await f.run({ dryRun: false });
  assert.equal(repaired.results[0].action, 'created');
  assert.equal(repaired.results[0].projectId, 88);
  assert.equal(f.writes.filter(write => write.table === 'projects' && write.op === 'insert').length, 0);
  assert.equal(f.calls.length, 2);
  assert.equal(pageText(f.pages[sourceId][0].properties['Supabase Project ID']), '88');
});

test('inbound adopts Notion values for baseline-untracked fields only when the app value is empty', async () => {
  const f = inboundFixture();
  const pageId = '77777777-7777-7777-7777-777777777784';
  f.tables.projects.push({ id: 30, reference_project_id: null, project_name: 'Linked Job', builders: { name: 'GC' }, statuses: { label: 'Assigned' }, contract_value: 120, due_date: null });
  const meta = { version: 1, projectId: 30, sourceProjectId: 30, fingerprints: { value: publishModule.propertyFingerprint({ type: 'number', number: 120 }) } };
  f.pages[sourceId].push(f.newPage(pageId, 'Linked Job', {
    'Supabase Project ID': textProp('app-id', 'rich_text', '30'),
    'Supabase Sync Snapshot': textProp('snapshot', 'rich_text', JSON.stringify(meta)),
    'OG GC / Client': textProp('gc', 'rich_text', 'GC'),
    'Contract Value': { id: 'value', type: 'number', number: 120 },
    'Due Date: Bid': { id: 'bid', type: 'date', date: { start: '2026-10-01' } },
  }));
  const dry = await f.run({});
  assert.equal(dry.results[0].action, 'would_update');
  assert.deepEqual(dry.results[0].fields, ['due_date']);
  f.tables.projects[0].due_date = '2026-09-01';
  const review = await f.run({ dryRun: false });
  assert.equal(review.results[0].action, 'review');
  assert.deepEqual(review.results[0].conflicts, ['due_date']);
  assert.equal(f.writes.length, 0);
  assert.equal(f.calls.length, 0);
});

test('inbound limit counts only rows that need a write, so unchanged rows never starve the queue', async () => {
  const f = inboundFixture();
  const meta = id => textProp('snapshot', 'rich_text', JSON.stringify({ version: 1, projectId: id, sourceProjectId: id, fingerprints: { value: publishModule.propertyFingerprint({ type: 'number', number: 100 }) } }));
  for (const id of [41, 42, 43]) {
    f.tables.projects.push({ id, reference_project_id: null, project_name: `Job ${id}`, builders: { name: 'GC' }, statuses: { label: 'Assigned' }, contract_value: 100 });
    f.pages[sourceId].push(f.newPage(`77777777-7777-7777-7777-7777777777${id}`, `Job ${id}`, {
      'Supabase Project ID': textProp('app-id', 'rich_text', String(id)),
      'Supabase Sync Snapshot': meta(id),
      'OG GC / Client': textProp('gc', 'rich_text', 'GC'),
      'Contract Value': { id: 'value', type: 'number', number: id === 43 ? 120 : 100 },
    }));
  }
  const dry = await f.run({ limit: 1 });
  assert.equal(dry.results.length, 1);
  assert.equal(dry.results[0].action, 'would_update');
  assert.equal(dry.results[0].projectId, 43);
  assert.deepEqual(dry.results[0].fields, ['contract_value']);
  assert.equal(dry.counts.unchanged, 2);
  assert.equal(dry.hasMore, false);
  const wide = await f.run({ limit: 10 });
  assert.equal(wide.hasMore, false);
  assert.equal(wide.counts.unchanged, 2);
});

test('inbound API scope validates flags, requires inbound enablement, and forwards limit and pageId', async () => {
  const calls = [];
  const config = configured();
  const route = loadTs('../app/api/sync/notion/route.ts', {
    '@/lib/auth': { getVerifiedSession: () => ({ id: 1, role: 'admin' }) },
    '@/lib/db': { getDb: () => readOnlyDb({ users: [{ id: 1, role: 'admin' }] }) },
    '@/lib/notionSyncServer': { ...server, getNotionSyncConfig: () => config },
    '@/lib/notionPublish': { publishNotionProjects: async () => ({}), setupNotionPublishing: async () => ({}) },
    '@/lib/notionInbound': { pullNotionChanges: async (db, cfg, options) => { calls.push(options); return { dryRun: options.dryRun, results: [] }; } },
  });
  assert.equal((await route.POST(request({ scope: 'inbound', dryRun: false }))).status, 409);
  assert.equal((await route.POST(request({ scope: 'publish', pageId: 'abc' }))).status, 400);
  assert.equal((await route.POST(request({ scope: 'inbound', limit: 21 }))).status, 400);
  config.inboundEnabled = true;
  assert.equal((await route.POST(request({ scope: 'inbound', limit: 15, pageId: 'abc' }))).status, 200);
  assert.deepEqual(calls[0], { dryRun: true, limit: 15, pageId: 'abc' });
  assert.equal((await route.POST(request({ scope: 'inbound' }))).status, 200);
  assert.equal(calls[1].limit, 10);
});

// --- sync state store + automation ---------------------------------------------------------------

test('supabase state store acquires and releases the lock and round-trips the journal with deletions', async () => {
  const tables = { notion_sync_lock: [], notion_sync_journal: [] };
  const db = writableDb(tables, []);
  const config = { ...configured(), publishEnabled: true, stateStore: 'supabase' };
  await publishModule.withState(config, false, async (state, save) => {
    state.a = { projectId: 1 };
    state.b = { pending: true };
    await save();
  }, db);
  assert.equal(tables.notion_sync_lock.length, 0);
  assert.equal(tables.notion_sync_journal.length, 2);
  await publishModule.withState(config, false, async (state, save) => {
    assert.equal(state.a.projectId, 1);
    delete state.b;
    await save();
  }, db);
  assert.equal(tables.notion_sync_journal.length, 1);
  assert.equal(tables.notion_sync_journal[0].key, 'a');
  await assert.rejects(publishModule.withState(config, false, async () => {}, undefined), /database client/);
});

test('supabase lock blocks a concurrent runner and an expired lease is taken over', async () => {
  const tables = { notion_sync_lock: [], notion_sync_journal: [] };
  const db = writableDb(tables, []);
  const config = { ...configured(), publishEnabled: true, stateStore: 'supabase' };
  const target = require('node:crypto').createHash('sha256').update(config.proposalDatabaseId + config.estimatedDatabaseId).digest('hex').slice(0, 16);
  let release;
  const held = publishModule.withState(config, false, () => new Promise(resolve => { release = resolve; }), db);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(tables.notion_sync_lock.length, 1);
  await assert.rejects(publishModule.withState(config, false, async () => {}, db), error => error instanceof publishModule.LockHeldError && /Another publisher/.test(error.message));
  release();
  await held;
  assert.equal(tables.notion_sync_lock.length, 0);
  tables.notion_sync_lock.push({ target, owner: 'dead-runner', expires_at: '2020-01-01T00:00:00.000Z' });
  assert.equal(await publishModule.withState(config, false, async () => 'ok', db), 'ok');
  assert.equal(tables.notion_sync_lock.length, 0);
});

test('file state store remains the default locally', async () => {
  const f = publisherFixture();
  assert.equal(f.config.stateStore, 'file');
  await f.run({ dryRun: false });
  assert.ok([...f.files.keys()].some(key => key.endsWith('.json')));
});

const authedCron = () => new Request('http://localhost:3000/api/sync/notion/cron', { headers: { authorization: 'Bearer test-secret' } });

test('notion cron requires the bearer secret and skips when sync flags are off', async () => {
  const calls = [];
  const route = loadTs('../app/api/sync/notion/cron/route.ts', {
    '@/lib/db': { getDb: () => ({}) },
    '@/lib/notionSyncServer': { ...server, getNotionSyncConfig: () => configured() },
    '@/lib/notionInbound': { pullNotionChanges: async (...args) => { calls.push(['pull', ...args]); return { supabaseWrites: 0, results: [] }; } },
    '@/lib/notionPublish': { LockHeldError: class extends Error {}, publishNotionProjects: async () => ({ results: [] }), readJournalValue: async () => undefined, writeJournalValue: async () => {} },
  });
  process.env.CRON_SECRET = 'test-secret';
  try {
    assert.equal((await route.GET(new Request('http://localhost:3000/api/sync/notion/cron'))).status, 401);
    assert.equal((await route.GET(new Request('http://localhost:3000/api/sync/notion/cron', { headers: { authorization: 'Bearer wrong' } }))).status, 401);
    const skipped = await route.GET(authedCron());
    assert.equal(skipped.status, 200);
    assert.equal((await skipped.json()).skipped, 'sync flags disabled');
    assert.equal(calls.length, 0);
  } finally { delete process.env.CRON_SECRET; }
});

test('notion cron pulls inbound then publishes the safety net from the stored cursor', async () => {
  const calls = [];
  const journal = { 'cron:publishCursor': 37 };
  const LockHeldError = class extends Error {};
  const deps = pull => ({
    '@/lib/db': { getDb: () => 'DB' },
    '@/lib/notionSyncServer': { ...server, getNotionSyncConfig: () => ({ ...configured(), publishEnabled: true, inboundEnabled: true }) },
    '@/lib/notionInbound': { pullNotionChanges: pull },
    '@/lib/notionPublish': {
      LockHeldError,
      publishNotionProjects: async (db, cfg, options) => { calls.push(['publish', options]); return { results: [{ action: 'updated' }], nextAfterProjectId: 412 }; },
      readJournalValue: async (db, cfg, key) => journal[key],
      writeJournalValue: async (db, cfg, key, value) => { journal[key] = value; },
    },
  });
  process.env.CRON_SECRET = 'test-secret';
  try {
    const route = loadTs('../app/api/sync/notion/cron/route.ts', deps(async (db, cfg, options) => {
      calls.push(['pull', options]);
      return { supabaseWrites: 2, results: [{ action: 'updated' }, { action: 'blocked', projectId: 9, error: 'x' }] };
    }));
    const res = await route.GET(authedCron());
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(calls.map(call => call[0]), ['pull', 'publish']);
    assert.deepEqual(calls[0][1], { dryRun: false, limit: 20 });
    assert.equal(calls[1][1].limit, 10);
    assert.equal(calls[1][1].afterProjectId, 37);
    assert.equal(typeof calls[1][1].deadlineMs, 'number');
    assert.equal(journal['cron:publishCursor'], 412);
    assert.deepEqual(body.pull, { supabaseWrites: 2, actions: { updated: 1, blocked: 1 } });
    assert.deepEqual(body.publish, { actions: { updated: 1 }, nextAfterProjectId: 412 });
    const locked = loadTs('../app/api/sync/notion/cron/route.ts', deps(async () => { throw new LockHeldError('Another publisher is running'); }));
    const lockedRes = await locked.GET(authedCron());
    assert.equal(lockedRes.status, 200);
    assert.equal((await lockedRes.json()).skipped, 'locked');
  } finally { delete process.env.CRON_SECRET; }
});

test('notion webhook verifies the handshake and rejects unsigned events', async () => {
  const route = loadTs('../app/api/sync/notion/webhook/route.ts', {
    'next/server': { ...require('next/server'), after: () => {} },
    '@/lib/db': { getDb: () => ({}) },
    '@/lib/notionSyncServer': { ...server, getNotionSyncConfig: () => ({ ...configured(), publishEnabled: true, inboundEnabled: true }) },
    '@/lib/notionInbound': { pullNotionChanges: async () => ({ results: [] }) },
    '@/lib/notionPublish': { LockHeldError: class extends Error {} },
  });
  const handshake = await route.POST(new Request('http://localhost:3000/api/sync/notion/webhook', { method: 'POST', body: JSON.stringify({ verification_token: 'tok' }) }));
  assert.equal(handshake.status, 200);
  process.env.NOTION_WEBHOOK_SECRET = 'tok';
  try {
    const bad = await route.POST(new Request('http://localhost:3000/api/sync/notion/webhook', { method: 'POST', body: '{}', headers: { 'x-notion-signature': 'sha256=bad' } }));
    assert.equal(bad.status, 401);
  } finally { delete process.env.NOTION_WEBHOOK_SECRET; }
});

test('notion webhook pulls the changed page for our data source and ignores others', async () => {
  const calls = [];
  const afterJobs = [];
  const config = { ...configured(), publishEnabled: true, inboundEnabled: true, proposalDataSourceId: sourceId };
  const route = loadTs('../app/api/sync/notion/webhook/route.ts', {
    'next/server': { ...require('next/server'), after: fn => { afterJobs.push(fn); } },
    '@/lib/db': { getDb: () => ({}) },
    '@/lib/notionSyncServer': { ...server, getNotionSyncConfig: () => config },
    '@/lib/notionInbound': { pullNotionChanges: async (db, cfg, options) => { calls.push(options); return { results: [] }; } },
    '@/lib/notionPublish': { LockHeldError: class extends Error {} },
  });
  process.env.NOTION_WEBHOOK_SECRET = 'tok';
  const post = event => {
    const body = JSON.stringify(event);
    const signature = 'sha256=' + require('node:crypto').createHmac('sha256', 'tok').update(body).digest('hex');
    return route.POST(new Request('http://localhost:3000/api/sync/notion/webhook', { method: 'POST', body, headers: { 'x-notion-signature': signature } }));
  };
  try {
    const ok = await post({ type: 'page.properties_updated', entity: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', type: 'page' }, data: { parent: { id: sourceId, type: 'data_source' } } });
    assert.equal((await ok.json()).accepted, true);
    assert.equal(afterJobs.length, 1);
    await afterJobs[0]();
    assert.deepEqual(calls[0], { dryRun: false, limit: 1, pageId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' });
    const other = await post({ type: 'page.properties_updated', entity: { id: 'p2' }, data: { parent: { id: databaseId, type: 'data_source' } } });
    assert.equal((await other.json()).ignored, 'other data source');
    const deleted = await post({ type: 'page.deleted', entity: { id: 'p3' } });
    assert.equal((await deleted.json()).accepted, true);
    assert.equal(afterJobs.length, 2);
    await afterJobs[1]();
    assert.deepEqual(calls[1], { dryRun: false, limit: 1, pageId: 'p3' });
    const ignored = await post({ type: 'page.moved', entity: { id: 'p4' } });
    assert.equal((await ignored.json()).ignored, 'page.moved');
    assert.equal(calls.length, 2);
  } finally { delete process.env.NOTION_WEBHOOK_SECRET; }
});

test('publish-on-save schedules a single-project publish only when enabled', async () => {
  const jobs = [];
  const calls = [];
  const config = { ...configured(), publishEnabled: false };
  const helper = loadTs('notionAfterSave.ts', {
    'next/server': { after: fn => jobs.push(fn) },
    './db': { getDb: () => 'DB' },
    './notionSyncServer': { getNotionSyncConfig: () => config },
    './notionPublish': { LockHeldError: class extends Error {}, publishNotionProjects: async (db, cfg, options) => { calls.push(options); } },
  });
  helper.schedulePublish(5);
  assert.equal(jobs.length, 0);
  config.publishEnabled = true;
  helper.schedulePublish(5);
  assert.equal(jobs.length, 1);
  await jobs[0]();
  assert.deepEqual(calls[0], { dryRun: false, limit: 1, projectId: 5 });
});

// --- deadline, filtered reads, and deletion sync ----------------------------------------------------

test('publisher honors a past deadline with zero Notion writes and keeps the cursor', async () => {
  const f = publisherFixture();
  const result = await f.run({ dryRun: false, afterProjectId: 7, deadlineMs: Date.now() - 1000 });
  assert.equal(result.interrupted, true);
  assert.equal(result.results.length, 0);
  assert.equal(result.nextAfterProjectId, 7);
  assert.equal(f.calls.length, 0);
});

test('single-project publish uses filtered queries instead of full listings', async () => {
  const f = publisherFixture();
  const result = await f.run({ dryRun: false, projectId: 29 });
  assert.equal(result.results[0].action, 'created');
  assert.ok(f.pagesQueries.length > 0 && f.pagesQueries.length <= 4);
  assert.ok(f.pagesQueries.every(query => query.filter));
  assert.ok(f.pagesQueries.some(query => query.filter.property === 'Supabase Project ID' && query.filter.number?.equals === 29));
  assert.ok(f.pagesQueries.some(query => query.filter.property === 'Project Name' && query.filter.title?.equals === 'Test Project'));
});

test('inbound archives a project whose linked Notion page is in the trash', async () => {
  const f = inboundFixture();
  const pageId = '77777777-7777-7777-7777-777777777790';
  f.tables.projects.push({ id: 55, reference_project_id: null, project_name: 'Gone', builders: { name: 'GC' }, statuses: { label: 'Estimator Assigned' }, contract_value: null });
  const trashed = f.newPage(pageId, 'Gone', {
    'Supabase Project ID': textProp('app-id', 'rich_text', '55'),
    'OG GC / Client': textProp('gc', 'rich_text', 'GC'),
  });
  trashed.in_trash = true;
  f.pages[sourceId].push(trashed);
  const target = require('node:crypto').createHash('sha256').update(f.config.proposalDatabaseId + f.config.estimatedDatabaseId).digest('hex').slice(0, 16);
  const file = path.resolve(f.config.stateDirectory, `${target}.json`);
  f.files.set(file, JSON.stringify({ [`${sourceId}:55`]: { pageId } }));
  const dry = await f.run({});
  assert.equal(dry.results[0].action, 'would_archive');
  assert.equal(dry.results[0].projectId, 55);
  assert.equal(f.writes.length, 0);
  const live = await f.run({ dryRun: false });
  assert.equal(live.results[0].action, 'archived');
  const update = f.writes.find(write => write.table === 'projects' && write.op === 'update');
  assert.deepEqual(update.ids, [55]);
  assert.ok(update.values.archived_at);
});

test('inbound archives a trashed page fetched directly by the webhook pageId', async () => {
  const f = inboundFixture();
  const pageId = '77777777-7777-7777-7777-777777777791';
  f.tables.projects.push({ id: 56, reference_project_id: null, project_name: 'Gone 2', builders: { name: 'GC' }, statuses: { label: 'Estimator Assigned' }, contract_value: null });
  const trashed = f.newPage(pageId, 'Gone 2', {
    'Supabase Project ID': textProp('app-id', 'rich_text', '56'),
    'OG GC / Client': textProp('gc', 'rich_text', 'GC'),
  });
  trashed.in_trash = true;
  f.pages[sourceId].push(trashed);
  const live = await f.run({ dryRun: false, pageId });
  assert.equal(live.results[0].action, 'archived');
  assert.equal(live.results[0].projectId, 56);
});

test('inbound restores an archived project when its Notion page returns from the trash', async () => {
  const f = inboundFixture();
  const pageId = '77777777-7777-7777-7777-777777777792';
  f.tables.projects.push({ id: 60, reference_project_id: null, project_name: 'Restored Job', builders: { name: 'GC' }, statuses: { label: 'Estimator Assigned' }, contract_value: null, archived_at: '2026-01-01T00:00:00Z' });
  f.pages[sourceId].push(f.newPage(pageId, 'Restored Job', {
    'Supabase Project ID': textProp('app-id', 'rich_text', '60'),
    'Supabase Sync Snapshot': textProp('snapshot', 'rich_text', JSON.stringify({ version: 1, projectId: 60, sourceProjectId: 60, fingerprints: {} })),
    'OG GC / Client': textProp('gc', 'rich_text', 'GC'),
  }));
  const live = await f.run({ dryRun: false });
  assert.equal(live.results[0].action, 'restored');
  const update = f.writes.find(write => write.table === 'projects' && write.op === 'update');
  assert.deepEqual(update.ids, [60]);
  assert.equal(update.values.archived_at, null);
});

function trashFixture(projects) {
  const f = publisherFixture();
  const writes = [];
  const db = writableDb({ projects }, writes);
  const target = require('node:crypto').createHash('sha256').update(f.config.proposalDatabaseId + f.config.estimatedDatabaseId).digest('hex').slice(0, 16);
  const file = path.resolve(f.config.stateDirectory, `${target}.json`);
  f.pages[sourceId].push({ id: 'prop-page-29', parent: { data_source_id: sourceId }, properties: { 'Supabase Project ID': { id: 'app-id', type: 'number', number: 29 } } });
  f.pages[f.estimatedId].push({ id: 'est-page-29', parent: { data_source_id: f.estimatedId }, properties: { 'Supabase Project ID': { id: 'app-id', type: 'number', number: 29 } } });
  f.files.set(file, JSON.stringify({ [`${sourceId}:29`]: { pageId: 'prop-page-29' }, [`${f.estimatedId}:29`]: { pageId: 'est-page-29' } }));
  return { f, db, file };
}

test('trashing a deleted project trashes the shared pages only when the group is empty', async () => {
  // (a) deleting a non-root member while the root remains: shared pages stay, surviving member is republished
  const member = trashFixture([{ id: 29, reference_project_id: null, archived_at: null }]);
  const memberResult = await member.f.publisher.trashNotionPages(member.db, member.f.config, { projectId: 31, rootId: 29 });
  assert.equal(memberResult.estimatedTrashed, false);
  assert.equal(memberResult.republishProjectId, 29);
  assert.equal(member.f.pages[sourceId][0].in_trash, undefined);
  assert.equal(member.f.pages[member.f.estimatedId][0].in_trash, undefined);

  // (b) deleting the last member: proposal and estimated pages trashed, journal cleared
  const empty = trashFixture([]);
  const result = await empty.f.publisher.trashNotionPages(empty.db, empty.f.config, { projectId: 29, rootId: 29 });
  assert.equal(result.estimatedTrashed, true);
  assert.equal(result.republishProjectId, null);
  assert.equal(empty.f.pages[sourceId][0].in_trash, true);
  assert.equal(empty.f.pages[empty.f.estimatedId][0].in_trash, true);
  const journal = JSON.parse(empty.f.files.get(empty.file));
  assert.equal(journal[`${sourceId}:29`], undefined);
  assert.equal(journal[`${empty.f.estimatedId}:29`], undefined);

  // (c) deleting the root while a member remains: re-key the shared pages to the new root instead of trashing
  const handedOver = trashFixture([{ id: 31, reference_project_id: 29, archived_at: null }]);
  const second = await handedOver.f.publisher.trashNotionPages(handedOver.db, handedOver.f.config, { projectId: 29, rootId: 29, newRootId: 31 });
  assert.equal(second.estimatedTrashed, false);
  assert.equal(second.republishProjectId, 31);
  assert.deepEqual(second.trashed, []);
  assert.equal(handedOver.f.pages[sourceId][0].in_trash, undefined);
  assert.equal(handedOver.f.pages[sourceId][0].properties['Supabase Project ID'].number, 31);
  assert.equal(handedOver.f.pages[handedOver.f.estimatedId][0].properties['Supabase Project ID'].number, 31);
  const movedJournal = JSON.parse(handedOver.f.files.get(handedOver.file));
  assert.equal(movedJournal[`${sourceId}:29`], undefined);
  assert.equal(movedJournal[`${sourceId}:31`].pageId, 'prop-page-29');
  assert.equal(movedJournal[`${handedOver.f.estimatedId}:31`].pageId, 'est-page-29');
});

test('delete sync republishes a surviving group member after trashing', async () => {
  const jobs = [];
  const calls = [];
  const helper = loadTs('notionAfterSave.ts', {
    'next/server': { after: fn => jobs.push(fn) },
    './db': { getDb: () => 'DB' },
    './notionSyncServer': { getNotionSyncConfig: () => ({ ...configured(), publishEnabled: true }) },
    './notionPublish': {
      LockHeldError: class extends Error {},
      publishNotionProjects: async (db, cfg, options) => { calls.push(options); },
      trashNotionPages: async () => ({ trashed: ['p'], estimatedTrashed: false, republishProjectId: 44 }),
    },
  });
  helper.trashNotionProject(41, 40);
  assert.equal(jobs.length, 1);
  await jobs[0]();
  assert.deepEqual(calls, [{ dryRun: false, limit: 1, projectId: 44 }]);
});

test('publish-on-save retries through a held lock and succeeds on a later attempt', async () => {
  const jobs = [];
  const calls = [];
  const LockHeldError = class extends Error {};
  let failures = 2;
  const helper = loadTs('notionAfterSave.ts', {
    'next/server': { after: fn => jobs.push(fn) },
    './db': { getDb: () => 'DB' },
    './notionSyncServer': { getNotionSyncConfig: () => ({ ...configured(), publishEnabled: true }) },
    './notionPublish': {
      LockHeldError,
      publishNotionProjects: async (db, cfg, options) => { calls.push(options); if (failures-- > 0) throw new LockHeldError('Another publisher is running'); },
    },
  });
  helper.schedulePublish(5, 0);
  assert.equal(jobs.length, 1);
  await jobs[0]();
  assert.equal(calls.length, 3);
});

test('deleting a root re-parents its members before the delete and hands the new root to Notion trash', async () => {
  const ops = [];
  const trashCalls = [];
  const rows = [
    { id: 29, reference_project_id: null },
    { id: 31, reference_project_id: 29 },
    { id: 33, reference_project_id: 29 },
  ];
  const db = { from() {
    let mode = 'read', values;
    const equals = [];
    const neqs = [];
    const apply = () => rows.filter(row => equals.every(([key, value]) => row[key] === value) && neqs.every(([key, value]) => row[key] !== value));
    const query = {
      select() { return query; },
      eq(key, value) { equals.push([key, value]); return query; },
      neq(key, value) { neqs.push([key, value]); return query; },
      order() { return query; },
      update(value) { mode = 'update'; values = value; return query; },
      delete() { mode = 'delete'; return query; },
      async single() { return { data: apply()[0] || null, error: null }; },
      then(resolve) {
        if (mode === 'update') {
          const matched = apply();
          matched.forEach(row => Object.assign(row, values));
          ops.push(['update', values, matched.map(row => row.id)]);
          return Promise.resolve({ data: matched, error: null }).then(resolve);
        }
        if (mode === 'delete') {
          const matched = apply();
          matched.forEach(row => rows.splice(rows.indexOf(row), 1));
          ops.push(['delete', matched.map(row => row.id)]);
          return Promise.resolve({ data: null, error: null }).then(resolve);
        }
        return Promise.resolve({ data: apply(), error: null }).then(resolve);
      },
    };
    return query;
  } };
  const route = loadTs('../app/api/projects/[id]/route.ts', {
    '../../../../lib/db': { getDb: () => db },
    '../../../../lib/timezone': { isDateOnly: () => true },
    '../../../../lib/notionAfterSave': { schedulePublish() {}, trashNotionProject(...args) { trashCalls.push(args); } },
  });
  const res = await route.DELETE(request({}), { params: Promise.resolve({ id: '29' }) });
  assert.equal(res.status, 200);
  assert.deepEqual(ops[0], ['update', { reference_project_id: null }, [31]]);
  assert.deepEqual(ops[1], ['update', { reference_project_id: 31 }, [33]]);
  assert.deepEqual(ops[2], ['delete', [29]]);
  assert.deepEqual(trashCalls, [[29, 29, 31]]);
});
