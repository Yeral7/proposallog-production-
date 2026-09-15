// Uses the Notion 🏢 Client DB as the source of truth for GCs.
// Matches Supabase builder names (dupes/typos) to Client DB pages, then sets:
//   - Proposal Log (dev):  GC / Client relation  (from the project's builder)
//   - Estimated Projects:  GC1..GCn relations    (distinct GCs per reference group, bid order)
// Supabase builders are never modified. Manual overrides: scripts/gc-aliases.json { "supabase name": "Client Name" }
// Usage: node scripts/notion-gc-link.cjs [--live] [--matches]   (dry run by default; --matches prints the full match table)
const path = require('node:path');
const fs = require('node:fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const TOKEN = process.env.NOTION_TOKEN;
const ESTIMATED = process.env.NOTION_ESTIMATED_PROJECTS_DATA_SOURCE_ID;
const PROPOSALS = process.env.NOTION_PROPOSALS_DATA_SOURCE_ID;
const CLIENTS = process.env.NOTION_CLIENTS_DATA_SOURCE_ID || 'f0528f4d-5864-4380-8383-0378232038ec';
const live = process.argv.includes('--live');
const showMatches = process.argv.includes('--matches');
const aliasPath = path.join(__dirname, 'gc-aliases.json');
const aliases = fs.existsSync(aliasPath) ? JSON.parse(fs.readFileSync(aliasPath, 'utf8')) : {};

let last = 0;
async function notion(p, body, method = body ? 'POST' : 'GET') {
  const wait = 340 - (Date.now() - last); if (wait > 0) await new Promise(r => setTimeout(r, wait)); last = Date.now();
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`https://api.notion.com/v1/${p}`, { method, headers: { Authorization: `Bearer ${TOKEN}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
      if (res.status === 429) { await new Promise(r => setTimeout(r, 1000 * Number(res.headers.get('retry-after') || 2))); continue; }
      if (!res.ok) throw new Error(`${method} ${p} -> ${res.status} ${await res.text()}`);
      return res.json();
    } catch (e) { if (attempt >= 3 || /-> 4\d\d/.test(e.message)) throw e; }
  }
}
async function allPages(ds) {
  const out = []; let cursor;
  do { const r = await notion(`data_sources/${ds}/query`, { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }); out.push(...r.results.filter(p => !p.archived && !p.in_trash)); cursor = r.has_more ? r.next_cursor : null; } while (cursor);
  return out;
}
const text = prop => (prop?.[prop?.type] || []).map(x => x.plain_text ?? '').join('').trim();
const relIds = prop => (prop?.relation || []).map(r => r.id);
const sameIds = (a, b) => a.length === b.length && a.every((id, i) => id.replace(/-/g, '') === b[i].replace(/-/g, ''));

// --- name matching -------------------------------------------------------------------------------
const SUFFIX = /\b(inc|incorporated|llc|l\.l\.c|ltd|co|corp|corporation|company|companies|construction|constructors|contractors|contracting|builders|building|group|general|gc|the|of|and|&)\b/g;
const norm = s => s.toLowerCase().replace(/[.,'"()\-\/]/g, ' ').replace(/\s+/g, ' ').trim();
const core = s => norm(s).replace(SUFFIX, ' ').replace(/\s+/g, ' ').trim() || norm(s);
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
const sim = (a, b) => 1 - lev(a, b) / Math.max(a.length, b.length, 1);
function buildMatcher(clients) {
  const byNorm = new Map(), byCore = new Map();
  for (const c of clients) { byNorm.set(norm(c.name), c); if (!byCore.has(core(c.name))) byCore.set(core(c.name), c); }
  const cache = new Map();
  return name => {
    if (cache.has(name)) return cache.get(name);
    let hit = null, how = 'none';
    const alias = aliases[name] ?? aliases[norm(name)];
    if (alias) { hit = byNorm.get(norm(alias)) || null; how = hit ? 'alias' : 'alias-missing'; }
    if (!hit && byNorm.has(norm(name))) { hit = byNorm.get(norm(name)); how = 'exact'; }
    if (!hit && byCore.has(core(name))) { hit = byCore.get(core(name)); how = 'core'; }
    if (!hit) {
      const nc = name && core(name); let best = null, bestScore = 0;
      for (const c of clients) { const s = sim(nc, core(c.name)); if (s > bestScore) { bestScore = s; best = c; } }
      if (best && bestScore >= 0.85 && nc.length >= 4) { hit = best; how = `fuzzy ${bestScore.toFixed(2)}`; }
    }
    const res = { client: hit, how }; cache.set(name, res); return res;
  };
}

(async () => {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: rows, error } = await db.from('projects').select('id, reference_project_id, builders:builder_id(name)').order('id');
  if (error) throw new Error(error.message);
  const byId = new Map(rows.map(r => [r.id, r]));
  const rootOf = id => { let cur = byId.get(id), guard = 0; while (cur?.reference_project_id != null && guard++ < 10) cur = byId.get(cur.reference_project_id); return cur?.id; };
  const groups = new Map();
  for (const r of rows) { const root = rootOf(r.id); if (!root) continue; (groups.get(root) || groups.set(root, []).get(root)).push(r.builders?.name?.trim() || null); }

  const clientPages = await allPages(CLIENTS);
  const clients = clientPages.map(p => ({ id: p.id, name: text(p.properties['Client Name']) })).filter(c => c.name);
  const match = buildMatcher(clients);
  const builderNames = [...new Set(rows.map(r => r.builders?.name?.trim()).filter(Boolean))].sort();
  const table = builderNames.map(n => ({ name: n, ...match(n) }));
  const unmatched = table.filter(t => !t.client);
  console.log(`client pages=${clients.length} | supabase builder names=${builderNames.length} | matched=${table.length - unmatched.length} | unmatched=${unmatched.length}`);
  const byHow = {}; for (const t of table) byHow[t.how.split(' ')[0]] = (byHow[t.how.split(' ')[0]] || 0) + 1;
  console.log(`  by method: ${JSON.stringify(byHow)}`);
  if (showMatches) for (const t of table) if (t.how !== 'exact') console.log(`  ${t.client ? 'OK ' : '-- '} ${t.name}  =>  ${t.client?.name ?? '(no match)'}  [${t.how}]`);
  if (unmatched.length) console.log(`unmatched supabase GCs (add to scripts/gc-aliases.json or create in Client DB):\n  ${unmatched.map(u => u.name).join('\n  ')}`);
  const clientIdsFor = names => { const seen = new Set(), out = []; for (const n of names) { const c = n && match(n).client; if (c && !seen.has(c.id)) { seen.add(c.id); out.push(c.id); } } return out; };

  // --- Estimated Projects: GC1..GCn --------------------------------------------------------------
  const source = await notion(`data_sources/${ESTIMATED}`);
  const SLOTS = Array.from({ length: 10 }, (_, i) => `GC${i + 1}`).filter(s => source.properties[s]?.type === 'relation');
  if (SLOTS.length < 10) console.log(`  warning: relation slots available: ${SLOTS.join(',') || 'none'}`);
  const estPages = await allPages(ESTIMATED);
  let estUpdates = 0; const multi = [];
  for (const page of estPages) {
    const sid = Number(text(page.properties['Supabase Project ID']));
    if (!sid || !groups.has(sid)) continue;
    const ids = clientIdsFor(groups.get(sid));
    if (ids.length > 1) multi.push(`${sid} ${text(page.properties['Project Name'])}: ${ids.map(id => clients.find(c => c.id === id).name).join(' / ')}`);
    const props = {};
    ids.slice(0, SLOTS.length).forEach((id, i) => { if (!sameIds(relIds(page.properties[SLOTS[i]]), [id])) props[SLOTS[i]] = { relation: [{ id }] }; });
    if (Object.keys(props).length) { estUpdates++; if (live) { await notion(`pages/${page.id}`, { properties: props }, 'PATCH'); if (estUpdates % 50 === 0) console.log(`  estimated: ${estUpdates} updated`); } }
  }
  console.log(`${live ? 'updated' : 'would update'} ${estUpdates}/${estPages.length} estimated pages | multi-GC projects: ${multi.length}`);
  if (showMatches) console.log(`  ${multi.join('\n  ')}`);

  // --- Proposal Log: GC / Client ------------------------------------------------------------------
  const propPages = await allPages(PROPOSALS);
  let propUpdates = 0, propNoGc = 0;
  for (const page of propPages) {
    const sid = Number(text(page.properties['Supabase Project ID']));
    const builder = byId.get(sid)?.builders?.name?.trim() || text(page.properties['OG GC / Client']);
    const c = builder && match(builder).client;
    if (!c) { if (sid) propNoGc++; continue; }
    if (sameIds(relIds(page.properties['GC / Client']), [c.id])) continue;
    propUpdates++;
    if (live) { await notion(`pages/${page.id}`, { properties: { 'GC / Client': { relation: [{ id: c.id }] } } }, 'PATCH'); if (propUpdates % 50 === 0) console.log(`  proposals: ${propUpdates} updated`); }
  }
  console.log(`${live ? 'updated' : 'would update'} ${propUpdates}/${propPages.length} proposal pages | linked rows with no matchable GC: ${propNoGc}`);
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
