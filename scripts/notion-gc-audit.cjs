// Dev Proposal Log helper. Usage: node scripts/notion-gc-audit.cjs [--clear-titles] [--link-gcs]
// Default: audit OG GC / Client text vs Client DB titles. Flags perform writes.
const path = require('node:path');
const fs = require('node:fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const TOKEN = process.env.NOTION_TOKEN;
const PROPOSALS = '05c75b2d-077e-8376-8c36-077107bed9ad';
const CLIENTS = 'f0528f4d-5864-4380-8383-0378232038ec';
const args = process.argv.slice(2);
let last = 0;
async function notion(p, body, method = body ? 'POST' : 'GET') {
  const wait = 350 - (Date.now() - last); if (wait > 0) await new Promise(r => setTimeout(r, wait)); last = Date.now();
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`https://api.notion.com/v1/${p}`, { method, headers: { Authorization: `Bearer ${TOKEN}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
      if (res.status === 429) { await new Promise(r => setTimeout(r, 1000 * Number(res.headers.get('retry-after') || 2))); continue; }
      if (!res.ok) throw new Error(`${method} ${p} -> ${res.status} ${await res.text()}`);
      return res.json();
    } catch (e) { if (attempt >= 3) throw e; }
  }
}
async function allPages(ds) {
  const out = []; let cursor;
  do { const r = await notion(`data_sources/${ds}/query`, { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }); out.push(...r.results.filter(p => !p.archived && !p.in_trash)); cursor = r.has_more ? r.next_cursor : null; } while (cursor);
  return out;
}
const text = prop => (prop?.[prop?.type] || []).map(x => x.plain_text ?? '').join('').trim();
const norm = s => s.toLowerCase().replace(/[.,]/g, '').replace(/\b(inc|llc|corp|corporation|company|co)\b/g, '').replace(/\s+/g, ' ').trim();

(async () => {
  const [proposals, clients] = await Promise.all([allPages(PROPOSALS), allPages(CLIENTS).catch(e => { console.log('Client DB not readable by integration:', e.message.slice(0, 120)); return []; })]);
  const clientByNorm = new Map();
  for (const c of clients) { const n = norm(text(c.properties['Client Name'])); if (n) (clientByNorm.get(n) || clientByNorm.set(n, []).get(n)).push(c); }
  console.log(`proposals=${proposals.length} clients=${clients.length}`);

  const rows = proposals.map(p => ({ id: p.id, sid: text(p.properties['Supabase Project ID']), project: text(p.properties['Project']), title: text(p.properties['Project Name + GC']), og: text(p.properties['OG GC / Client']), rel: p.properties['GC / Client']?.relation || [] }));
  const missing = {}; const matched = []; const ambiguous = {};
  for (const r of rows) {
    if (!r.og) continue;
    const hits = clientByNorm.get(norm(r.og)) || [];
    if (hits.length === 1) matched.push({ ...r, client: hits[0] });
    else if (hits.length > 1) (ambiguous[r.og] = ambiguous[r.og] || []).push(r.sid);
    else (missing[r.og] = missing[r.og] || []).push(r.sid);
  }
  console.log(`\nOG GC rows: ${rows.filter(r => r.og).length} | matched to Client DB: ${matched.length} | already have relation: ${rows.filter(r => r.rel.length).length}`);
  console.log(`\nOG GC names with NO Client DB page (${Object.keys(missing).length} names, ${Object.values(missing).flat().length} rows):`);
  for (const [gc, ids] of Object.entries(missing).sort((a, b) => b[1].length - a[1].length)) console.log(`  ${gc}  (${ids.length}) ids=${ids.slice(0, 8).join(',')}${ids.length > 8 ? ',…' : ''}`);
  if (Object.keys(ambiguous).length) { console.log('\nAmbiguous (multiple Client DB pages):'); for (const [gc, ids] of Object.entries(ambiguous)) console.log(`  ${gc} (${ids.length})`); }
  fs.writeFileSync(path.join(require('node:os').tmpdir(), 'notion-gc-audit.json'), JSON.stringify({ missing, ambiguous, matched: matched.map(m => ({ sid: m.sid, og: m.og, client: text(m.client.properties['Client Name']) })) }, null, 2));

  if (args.includes('--clear-titles')) {
    const targets = rows.filter(r => r.title);
    console.log(`\nClearing ${targets.length} titles...`);
    let n = 0; for (const r of targets) { await notion(`pages/${r.id}`, { properties: { 'Project Name + GC': { title: [] } } }, 'PATCH'); if (++n % 50 === 0) console.log(`  ${n}/${targets.length}`); }
    console.log(`cleared ${n}`);
  }
  if (args.includes('--link-gcs')) {
    const targets = matched.filter(m => !m.rel.length);
    console.log(`\nLinking GC / Client relation on ${targets.length} rows...`);
    let n = 0; for (const m of targets) { await notion(`pages/${m.id}`, { properties: { 'GC / Client': { relation: [{ id: m.client.id }] } } }, 'PATCH'); if (++n % 50 === 0) console.log(`  ${n}/${targets.length}`); }
    console.log(`linked ${n}`);
  }
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
