// Escolha da bandeira regional real para um Estado que nasce de um conjunto de províncias.
const cache = new WeakMap();

// pid -> chaves de bandeira (por nome de província ou região administrativa).
function index(data) {
  if (cache.has(data)) return cache.get(data);
  const meta = data.regionalFlags?.meta || {}, byA3 = {};
  for (const k in meta) { const m = meta[k]; if (m.a3 && (m.n?.length || m.rg?.length)) (byA3[m.a3] ||= []).push(k); }
  const byProv = {};
  for (const pid in data.geo.prov) {
    const p = data.geo.prov[pid], rows = byA3[p.a3];
    if (!rows) continue;
    for (const k of rows) { const m = meta[k]; if (m.n?.includes(p.n) || (p.rg && m.rg?.includes(p.rg))) (byProv[pid] ||= []).push(k); }
  }
  const out = { meta, byProv };
  cache.set(data, out);
  return out;
}

// Retorna a chave da bandeira (ou null). mvId: id de um movimento conhecido do jogo.
export function regionalFlagFor(data, pids, mvId) {
  const { meta, byProv } = index(data);
  if (!Object.keys(meta).length) return null;
  if (mvId) for (const k in meta) if (meta[k].mv === mvId) return k;
  const score = {}; let tot = 0;
  for (const pid of pids) {
    const p = data.geo.prov[pid]; if (!p) continue;
    const w = p.pop || 1; tot += w;
    for (const k of byProv[pid] || []) score[k] = (score[k] || 0) + w;
  }
  let best = null;
  for (const k in score) if (!best || score[k] > score[best]) best = k;
  return best && score[best] / Math.max(1, tot) >= 0.5 ? best : null;
}
// Região "mais influente" de um conjunto de províncias (por população), mesmo sem maioria. Devolve { key, name, share }.
export function regionalBest(data, pids, minShare = 0.1) {
  const { meta, byProv } = index(data); const score = {}; let tot = 0;
  for (const pid of pids) { const p = data.geo.prov[pid]; if (!p) continue; const w = p.pop || 1; tot += w; for (const k of byProv[pid] || []) score[k] = (score[k] || 0) + w; }
  let best = null; for (const k in score) if (!best || score[k] > score[best]) best = k;
  if (!best || score[best] / Math.max(1, tot) < minShare) return null;
  return { key: best, name: meta[best].name, share: score[best] / tot, a3: meta[best].a3 };
}
// Todas as províncias que correspondem a uma bandeira regional.
export function regionalProvinces(data, key) { const { byProv } = index(data); return Object.keys(byProv).filter(pid => byProv[pid].includes(key)); }
export const regionalFlagMeta = (data, key) => data.regionalFlags?.meta?.[key] || null;
