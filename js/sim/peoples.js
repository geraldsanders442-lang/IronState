// Composição de povos de cada Estado: vem do território que ele realmente controla hoje (e não do país de origem do nome).
// Assim um "Reino da Palestina" criado pelo jogador tem palestinos como maioria e judeus como minoria, e um Estado curdo não
// herda os curdos como povo perseguido por outro país.
import { provincesOf } from './world.js';
import { baseOf } from './geopol.js';

export const slug = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

export function fallbackGroups(data, id) {
  const inc = data.reg?.[id]?.income, rich = inc === 'High income' || inc === 'high';
  return rich ? [{ name: 'Maioria nacional', noun: 'nacionais', share: 88, kind: 'majority', kin: [], key: 'nacionais' }, { name: 'Imigrantes e seus descendentes', noun: 'imigrantes', share: 10, kind: 'immigrant', kin: [], key: 'imigrantes' }, { name: 'Povos originários', noun: 'povos originários', share: 2, kind: 'indigenous', kin: [], key: 'originarios' }]
    : [{ name: 'Maioria nacional', noun: 'nacionais', share: 82, kind: 'majority', kin: [], key: 'nacionais' }, { name: 'Minorias étnicas e religiosas', noun: 'minorias', share: 14, kind: 'ethnic', kin: [], key: 'minorias' }, { name: 'Povos indígenas e tradicionais', noun: 'indígenas', share: 4, kind: 'indigenous', kin: [], key: 'indigenas' }];
}

const CACHE = new WeakMap();
// Grupos do Estado `id` (ou do jogador, PLY), do maior para o menor; o primeiro é o grupo dominante.
export function entityGroups(s, data, id, max = 7) {
  const W = s.world, hit = CACHE.get(W)?.[id]; if (hit && hit.ver === W.ver) return hit.v;
  const P = data.geo.prov, provs = provincesOf(s, data, id), M = data.minorities?.countries || {}, bw = {}; let tot = 0;
  for (const p of provs) { const w = Math.max(1, P[p]?.pop || 1), b = baseOf(data, p); bw[b] = (bw[b] || 0) + w; tot += w; }
  const acc = {};
  for (const b in bw) {
    const rows = M[b] || fallbackGroups(data, b), w = bw[b] / (tot || 1);
    for (const r of rows) {
      const k = r.key || slug(r.noun), g = acc[k] ||= { key: k, name: r.name, noun: r.noun, kind: r.kind, share: 0, kin: new Set(), top: 0 };
      const part = r.share * w; g.share += part; for (const x of r.kin || []) g.kin.add(x);
      if (part > g.top) { g.top = part; g.name = r.name; g.noun = r.noun; g.kind = r.kind; }
    }
  }
  let list = Object.values(acc).sort((a, b) => b.share - a.share).slice(0, max);
  if (!list.length) list = fallbackGroups(data, id).map(g => ({ ...g, kin: new Set(g.kin) }));
  const sum = list.reduce((a, g) => a + g.share, 0) || 1;
  list = list.map((g, i) => ({ key: g.key, name: g.name, noun: g.noun, share: +(g.share / sum * 100).toFixed(2), kin: [...g.kin].filter(k => k !== id && data.reg?.[k]),
    kind: i === 0 ? 'majority' : g.kind === 'majority' ? 'ethnic' : g.kind }));
  (CACHE.get(W) || CACHE.set(W, {}).get(W))[id] = { ver: W.ver, v: list };
  return list;
}
