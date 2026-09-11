const path = require('node:path');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), quiet: true });

const cache = new Map();
function loadTs(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded.require = id => id.startsWith('.') ? loadTs(path.resolve(path.dirname(filename), `${id}.ts`)) : module.require(id);
  cache.set(filename, loaded);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  loaded._compile(compiled.outputText, filename);
  return loaded.exports;
}

async function main() {
  const server = loadTs(path.join(__dirname, '..', 'lib', 'notionSyncServer.ts'));
  const config = server.getNotionSyncConfig();
  const mcpIndex = process.argv.indexOf('--mcp-config');
  if (mcpIndex !== -1) {
    try {
      const saved = JSON.parse(fs.readFileSync(process.argv[mcpIndex + 1], 'utf8'));
      const headers = JSON.parse(saved.mcpServers['notion-mcp-server'].env.OPENAPI_MCP_HEADERS);
      if (!/^Bearer\s+\S+$/i.test(headers.Authorization)) throw new Error();
      config.token = headers.Authorization.replace(/^Bearer\s+/i, '');
      config.previewEnabled = true;
    } catch {
      throw new Error('Could not load the explicitly selected Notion MCP connection. No credential values were printed.');
    }
  }
  if (process.argv.includes('--check')) {
    console.log(JSON.stringify({ ...server.getNotionSyncStatus(config), supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) }, null, 2));
    return;
  }
  if (process.argv.includes('--inspect') || process.argv.includes('--inventory')) {
    const reader = server.createNotionReader(config);
    for (const [databaseId, sourceId] of [[config.proposalDatabaseId, config.proposalDataSourceId], [config.estimatedDatabaseId, config.estimatedDataSourceId]]) {
      const source = await reader.discover(databaseId, sourceId);
      if (process.argv.includes('--inventory')) {
        const pages = await reader.pages(source.id);
        const identities = pages.map(page => {
          const identity = page.properties['Supabase Project ID'];
          return identity?.type === 'number' ? String(identity.number ?? '') : (identity?.rich_text || []).map(part => part.plain_text ?? part.text?.content ?? '').join('');
        }).filter(Boolean);
        console.log(JSON.stringify({ databaseId, dataSourceId: source.id, count: pages.length, managedCount: identities.length, duplicateIdentities: identities.filter((id, index) => identities.indexOf(id) !== index), sample: pages.slice(0, 3).map(page => ({ id: page.id, title: Object.values(page.properties).find(property => property.type === 'title')?.title?.map(part => part.plain_text).join(''), status: page.properties.Status?.status?.name, builder: page.properties['OG GC / Client']?.rich_text?.map(part => part.plain_text).join('') })) }, null, 2));
      } else {
        console.log(JSON.stringify({ databaseId, dataSourceId: source.id, properties: Object.entries(source.properties).map(([name, property]) => ({ name, type: property.type, id: property.id, options: property[property.type]?.options?.map(option => option.name), relation: property.relation })) }, null, 2));
      }
    }
    return;
  }
  const publisher = loadTs(path.join(__dirname, '..', 'lib', 'notionPublish.ts'));
  const confirmed = process.argv.includes('--confirm');
  config.previewEnabled = config.previewEnabled || config.publishEnabled;
  config.publishEnabled = confirmed;
  const dryRun = !confirmed;
  if (process.argv.includes('--setup')) {
    console.log(JSON.stringify(await publisher.setupNotionPublishing(config, dryRun), null, 2));
    return;
  }
  if (process.argv.includes('--publish') || process.argv.includes('--watch') || process.argv.includes('--verify')) {
    const { createClient } = require('@supabase/supabase-js');
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase environment variables are required.');
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const projectIndex = process.argv.indexOf('--project-id');
    const projectId = projectIndex === -1 ? undefined : Number(process.argv[projectIndex + 1]);
    if (projectId !== undefined && (!Number.isSafeInteger(projectId) || projectId <= 0)) throw new Error('Invalid --project-id.');
    if (process.argv.includes('--verify')) {
      if (!projectId) throw new Error('--verify requires --project-id.');
      const sync = loadTs(path.join(__dirname, '..', 'lib', 'notionSync.ts'));
      const source = await server.loadNotionSource(db, config, { projectId, limit: 1 });
      const reader = server.createNotionReader(config);
      const target = await reader.discover(config.proposalDatabaseId, config.proposalDataSourceId);
      const pages = await reader.pages(target.id);
      for (const proposal of source.proposals) {
        const matches = pages.filter(page => {
          const identity = page.properties['Supabase Project ID'];
          return String(identity?.number ?? identity?.rich_text?.map(part => part.plain_text ?? part.text?.content ?? '').join('')) === String(proposal.projectId);
        });
        for (const page of matches) {
          const bindings = sync.resolveBindings(target.properties);
          const desired = sync.toNotionProperties(proposal.values, bindings);
          const differences = Object.entries(bindings).filter(([field, binding]) => desired.properties[binding.id] && proposal.values[field] !== null && publisher.propertyFingerprint(desired.properties[binding.id]) !== publisher.propertyFingerprint(Object.values(page.properties).find(property => property.id === binding.id))).map(([field, binding]) => ({ field, expected: desired.properties[binding.id], actual: Object.values(page.properties).find(property => property.id === binding.id) }));
          console.log(JSON.stringify({ projectId: proposal.projectId, notionPageId: page.id, matches: matches.length, differences }, null, 2));
        }
      }
      return;
    }
    let stopping = false;
    process.on('SIGINT', () => { stopping = true; });
    process.on('SIGTERM', () => { stopping = true; });
    do {
      let afterProjectId = 0;
      const totals = {};
      do {
        const result = await publisher.publishNotionProjects(db, config, { dryRun, limit: 25, projectId, afterProjectId });
        for (const row of result.results) totals[row.action] = (totals[row.action] || 0) + 1;
        console.log(JSON.stringify({ at: new Date().toISOString(), dryRun, supabaseWrites: result.supabaseWrites, sourceProjects: result.sourceProjectCount, projectGroups: result.groupedProjectCount, totals, nextAfterProjectId: result.nextAfterProjectId, issues: result.issues, blocked: result.results.filter(row => row.action === 'blocked'), warnings: result.results.filter(row => row.warnings?.length).map(row => ({ projectId: row.projectId, warnings: row.warnings })) }));
        if (result.interrupted || (result.nextAfterProjectId !== null && result.nextAfterProjectId <= afterProjectId)) throw new Error('Publisher paused after a Notion access or rate-limit error. Resolve the reported error before rerunning.');
        afterProjectId = result.nextAfterProjectId;
      } while (afterProjectId !== null && !stopping);
      if (!process.argv.includes('--watch') || stopping) break;
      for (let second = 0; second < 60 && !stopping; second++) await new Promise(resolve => setTimeout(resolve, 1000));
    } while (!stopping);
    return;
  }
  throw new Error('Use --check, --inspect, --inventory, --verify --project-id ID, --setup, --publish or --watch. Writes require --confirm.');
}

main().catch(error => { console.error(error.stack || error.message || 'Notion sync failed'); process.exitCode = 1; });
