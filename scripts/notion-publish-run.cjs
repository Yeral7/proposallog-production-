// One-off runner: publishes Supabase projects to the dev Notion Proposal Log via lib/notionPublish.ts.
// Usage: node scripts/notion-publish-run.cjs [--live] [--limit N] [--after ID] [--project ID]
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf(name); return i === -1 ? undefined : args[i + 1]; };
const live = args.includes('--live');
const limit = Number(flag('--limit') || 100);
const projectId = flag('--project') ? Number(flag('--project')) : undefined;
let afterProjectId = flag('--after') ? Number(flag('--after')) : 0;
if (live) process.env.NOTION_SYNC_PUBLISH_ENABLED = 'true';

function loadTs(file) {
  const filename = path.resolve(__dirname, '..', file);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded.require = id => {
    if (id.startsWith('./')) return loadTs(path.join(path.dirname(file), `${id.slice(2)}.ts`));
    if (id.startsWith('@/')) return loadTs(`${id.slice(2)}.ts`);
    return module.require(id);
  };
  loaded._compile(compiled.outputText, filename);
  return loaded.exports;
}

(async () => {
  const { publishNotionProjects } = loadTs('lib/notionPublish.ts');
  const { getNotionSyncConfig } = loadTs('lib/notionSyncServer.ts');
  const { getDb } = loadTs('lib/db.ts');
  const config = getNotionSyncConfig();
  const all = [];
  for (let batch = 0; batch < 20; batch++) {
    let out;
    for (let attempt = 1; ; attempt++) {
      try { out = await publishNotionProjects(getDb(), config, { dryRun: !live, limit, projectId, afterProjectId }); break; }
      catch (error) { if (attempt >= 3) throw error; console.log(`batch ${batch + 1} attempt ${attempt} failed: ${error.message}; retrying`); }
    }
    all.push(...out.results);
    const tally = out.results.reduce((acc, r) => ((acc[r.action] = (acc[r.action] || 0) + 1), acc), {});
    console.log(`batch ${batch + 1}: after=${afterProjectId} ->`, tally, out.interrupted ? 'INTERRUPTED' : '', out.issues.length ? `issues=${out.issues.length}` : '');
    if (out.interrupted || out.nextAfterProjectId == null || projectId) break;
    afterProjectId = out.nextAfterProjectId;
  }
  const file = path.join(require('node:os').tmpdir(), `notion-publish-${live ? 'live' : 'dry'}-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(all, null, 2));
  const tally = all.reduce((acc, r) => ((acc[r.action] = (acc[r.action] || 0) + 1), acc), {});
  console.log('TOTAL', all.length, tally);
  const blocked = all.filter(r => r.action === 'blocked');
  const reasons = blocked.reduce((acc, r) => ((acc[r.error] = (acc[r.error] || 0) + 1), acc), {});
  if (blocked.length) console.log('BLOCKED reasons:', reasons);
  console.log('results written to', file);
})().catch(error => { console.error('FAILED:', error.message); process.exit(1); });
