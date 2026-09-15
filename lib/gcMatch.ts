const SUFFIX = /\b(inc|incorporated|llc|l\.l\.c|ltd|co|corp|corporation|company|companies|construction|constructors|contractors|contracting|builders|building|group|general|gc|the|of|and|&)\b/g;
const norm = (s: string) => s.toLowerCase().replace(/[.,'"()\-/]/g, ' ').replace(/\s+/g, ' ').trim();
const core = (s: string) => norm(s).replace(SUFFIX, ' ').replace(/\s+/g, ' ').trim() || norm(s);

function lev(a: string, b: string) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

const sim = (a: string, b: string) => 1 - lev(a, b) / Math.max(a.length, b.length, 1);

export function createNameMatcher<T extends { name: string }>(candidates: T[], aliases: Record<string, string> = {}) {
  const byNorm = new Map<string, T>(), byCore = new Map<string, T>();
  for (const c of candidates) { byNorm.set(norm(c.name), c); if (!byCore.has(core(c.name))) byCore.set(core(c.name), c); }
  const cache = new Map<string, { match: T | null; how: string }>();
  return (name: string) => {
    if (cache.has(name)) return cache.get(name)!;
    let match: T | null = null, how = 'none';
    const alias = aliases[name] ?? aliases[norm(name)];
    if (alias) { match = byNorm.get(norm(alias)) || null; how = match ? 'alias' : 'alias-missing'; }
    if (!match && byNorm.has(norm(name))) { match = byNorm.get(norm(name))!; how = 'exact'; }
    if (!match && byCore.has(core(name))) { match = byCore.get(core(name))!; how = 'core'; }
    if (!match) {
      const nc = name && core(name);
      let best: T | null = null, bestScore = 0;
      for (const c of candidates) { const s = sim(nc, core(c.name)); if (s > bestScore) { bestScore = s; best = c; } }
      if (best && bestScore >= 0.85 && nc.length >= 4) { match = best; how = `fuzzy ${bestScore.toFixed(2)}`; }
    }
    const res = { match, how };
    cache.set(name, res);
    return res;
  };
}
