// One-off runner: pulls Notion Proposal Log changes into Supabase via lib/notionInbound.ts.
// Usage: node scripts/notion-inbound-run.cjs [--live] [--limit N] [--page <notion-page-id>]
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf(name); return i === -1 ? undefined : args[i + 1]; };
const live = args.includes('--live');
const limit = Number(flag('--limit') || 10);
const pageId = flag('--page');
if (live) {
  process.env.NOTION_SYNC_PUBLISH_ENABLED = 'true';
  process.env.NOTION_SYNC_INBOUND_ENABLED = 'true';
}

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
  const { pullNotionChanges } = loadTs('lib/notionInbound.ts');
  const { getNotionSyncConfig } = loadTs('lib/notionSyncServer.ts');
  const { getDb } = loadTs('lib/db.ts');
  const config = getNotionSyncConfig();
  const out = await pullNotionChanges(getDb(), config, { dryRun: !live, limit, pageId });
  const tally = out.results.reduce((acc, r) => ((acc[r.action] = (acc[r.action] || 0) + 1), acc), {});
  console.log(`${live ? 'LIVE' : 'DRY RUN'} | counts=${JSON.stringify(out.counts)} | supabaseWrites=${out.supabaseWrites} | ${out.interrupted ? 'INTERRUPTED | ' : ''}${out.hasMore ? 'HAS-MORE | ' : ''}actions=${JSON.stringify(tally)}`);
  for (const r of out.results) {
    console.log(`  ${r.action.padEnd(12)} project=${r.projectId ?? '-'} page=${r.notionPageId ?? '-'}${r.builder ? ` gc=${r.builder} [${r.how}]` : ''}${r.fields ? ` fields=${r.fields.join(',')}` : ''}${r.conflicts ? ` conflicts=${r.conflicts.join(',')}` : ''}${r.wouldCreateBuilder ? ` wouldCreateBuilder=${r.wouldCreateBuilder}` : ''}${r.error ? ` ERROR: ${r.error}` : ''}`);
  }
  const file = path.join(require('node:os').tmpdir(), `notion-inbound-${live ? 'live' : 'dry'}-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log('results written to', file);
})().catch(error => { console.error('FAILED:', error.message); process.exit(1); });
