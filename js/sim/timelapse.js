// Time lapse do Observatório: o jogo grava só as MUDANÇAS de dono das províncias (um registro compacto de inteiros),
// e a reprodução reconstrói o mapa quadro a quadro a partir do início. Nada é guardado por quadro, então o custo é pequeno.
import { WORLD_REGIONS } from './worldregions.js';
import { ownerOf } from './world.js';

const day = s => Math.floor(s.time.min / 1440);
const CAP = 30000; // mudanças guardadas (3 inteiros cada)
// Índices pid -> posição ficam fora do estado salvo (são reconstruídos quando preciso).
const IDX = new WeakMap();
const maps = T => { let m = IDX.get(T); if (!m) { m = { p: Object.fromEntries(T.P.map((v, i) => [v, i])), o: Object.fromEntries(T.O.map((v, i) => [v, i])) }; IDX.set(T, m); } return m; };

// Uma vez por semana (só no Observatório): compara quem CONTROLA cada província (dono ou ocupante) com a semana anterior e grava as diferenças.
const LAST = new WeakMap();
export function syncTimelapse(s, data) {
  const W = s.world; if (!s.spectator || !W.obsStart) return;
  const P = data.geo.prov; let last = LAST.get(W);
  if (!last) { // depois de carregar um save: reconstrói o último estado conhecido a partir do início e do registro
    last = {}; for (const pid in P) last[pid] = W.obsStart.owner[pid] || P[pid].a3;
    const T = W.tl; if (T) for (let i = 0; i < T.c.length; i += 3) last[T.P[T.c[i + 1]]] = T.O[T.c[i + 2]];
    LAST.set(W, last);
  }
  const T = (W.tl ||= { P: [], O: [], c: [] }), M = maps(T), d = day(s);
  const ix = (arr, map, v) => map[v] ?? (map[v] = arr.push(v) - 1);
  for (const pid in P) {
    const c = W.occ[pid] ?? ownerOf(s, data, pid);
    if (last[pid] !== c) { last[pid] = c; T.c.push(d, ix(T.P, M.p, pid), ix(T.O, M.o, c)); }
  }
  if (T.c.length > CAP * 3) compact(T);
}
// Quando o registro cresce demais, as mudanças antigas viram "só a última de cada mês" (e depois de cada trimestre).
function compact(T) {
  for (const span of [30, 90, 365]) {
    if (T.c.length <= CAP * 3) break;
    const cut = T.c[T.c.length - 3 * 1500] ?? 0, old = [], keep = [];
    for (let i = 0; i < T.c.length; i += 3) (T.c[i] < cut ? old : keep).push(T.c[i], T.c[i + 1], T.c[i + 2]);
    const last = new Map();
    for (let i = 0; i < old.length; i += 3) last.set(Math.floor(old[i] / span) + '|' + old[i + 1], [Math.floor(old[i] / span) * span, old[i + 1], old[i + 2]]);
    const merged = [...last.values()].sort((a, b) => a[0] - b[0]).flat();
    T.c = [...merged, ...keep];
  }
  IDX.delete(T);
}

// Regiões oferecidas ("Europa", "Oriente Médio"...). wr = chaves de WORLD_REGIONS; cont = continente do registro.
export const TL_REGIONS = {
  world: { name: 'Mundo todo' },
  europe: { name: 'Europa', cont: ['Europe'] },
  middle_east: { name: 'Oriente Médio', wr: ['middle_east'] },
  caucasus_ca: { name: 'Cáucaso e Ásia Central', wr: ['caucasus', 'central_asia'] },
  russia_orbit: { name: 'Rússia e vizinhança', wr: ['eastern_europe', 'baltic', 'caucasus', 'central_asia'] },
  balkans: { name: 'Balcãs', wr: ['balkans'] },
  south_asia: { name: 'Sul da Ásia', wr: ['south_asia'] },
  east_asia: { name: 'Extremo Oriente', wr: ['east_asia'] },
  southeast_asia: { name: 'Sudeste Asiático', wr: ['southeast_asia'] },
  africa: { name: 'África', cont: ['Africa'] },
  north_africa: { name: 'Norte da África e Sahel', wr: ['north_africa', 'sahel'] },
  west_africa: { name: 'África Ocidental', wr: ['west_africa'] },
  north_america: { name: 'América do Norte', cont: ['North America'], not: ['caribbean', 'central_america'] },
  latin_america: { name: 'América Latina', cont: ['South America'], wr: ['central_america', 'caribbean'] },
  south_america: { name: 'América do Sul', wr: ['south_america'] },
  oceania: { name: 'Oceania', cont: ['Oceania'] },
};
const idList = v => Array.isArray(v) ? v : String(v || '').split(' ');
const cache = new WeakMap();
// Países-base (ids do registro) e províncias de uma região.
export function regionOf(data, key) {
  const m = cache.get(data) || cache.set(data, {}).get(data); if (m[key]) return m[key];
  const R = TL_REGIONS[key] || TL_REGIONS.world; let ids;
  if (!R.cont && !R.wr) ids = null;
  else {
    const set = new Set();
    for (const k of R.wr || []) for (const id of idList(WORLD_REGIONS[k]?.ids)) if (id) set.add(id);
    for (const e of Object.values(data.reg || {})) if (R.cont?.includes(e.continent) && e.cat === 'sovereign') set.add(e.id);
    for (const k of R.not || []) for (const id of idList(WORLD_REGIONS[k]?.ids)) set.delete(id);
    ids = set;
  }
  const pids = Object.keys(data.geo.prov).filter(p => !ids || ids.has(data.geo.prov[p].a3));
  return (m[key] = { ids, pids, name: R.name });
}

// Quadros: no máximo `max`, em intervalos iguais; cada quadro diz até onde do registro aplicar.
export function frames(W, nowDay, max = 150) {
  const st = W.obsStart; if (!st) return [];
  const span = Math.max(1, nowDay - st.day), step = Math.max(7, Math.ceil(span / max)), c = W.tl?.c || [];
  const out = []; let i = 0;
  for (let t = st.day; ; t += step) {
    const d = Math.min(t, nowDay);
    while (i < c.length && c[i] <= d) i += 3;
    out.push({ day: d, upto: i });
    if (d >= nowDay) break;
  }
  return out;
}

// Marcos (guerras, novos Estados, mudanças de regime) de uma região, em ordem de data.
export function milestones(W, data, region, fromDay) {
  const inR = id => { if (!region.ids) return true; const e = W.ents?.[id] || data.reg?.[id]; return region.ids.has(id) || region.ids.has(e?.origin || e?.secededFrom); };
  const nm = id => W.ents?.[id]?.name || data.reg?.[id]?.name || id;
  const out = [];
  for (const w of W.wars || []) if ((w.since ?? 0) >= fromDay && [...w.a, ...w.b].some(inR)) out.push({ day: w.since, kind: 'war', text: `Guerra: ${w.a.map(nm).join(' e ')} × ${w.b.map(nm).join(' e ')}` });
  for (const n of W.newStates || []) if (inR(n.from) || inR(n.id)) out.push({ day: n.day, kind: 'state', text: `${n.revived ? 'Renasce' : 'Nasce'} ${n.name} (de ${nm(n.from)})` });
  for (const r of W.regimeLog || []) if (r.day >= fromDay && inR(r.id) && r.kind !== 'election' && r.kind !== 'lab') out.push({ day: r.day, kind: 'regime', text: r.text });
  return out.sort((a, b) => a.day - b.day);
}

// Caixa de foco da região: quantis ponderados por população dos centros das províncias, para que territórios
// remotos (a Sibéria na "Europa", ilhas no Pacífico) não esticarem o mapa.
export function focusBox(data, pids, lo = 0.03, hi = 0.97) {
  const P = data.geo.prov, pts = pids.map(p => ({ c: P[p].c, w: Math.sqrt(Math.max(1, P[p].pop || 1)) })).filter(x => x.c);
  if (!pts.length) return null;
  const q = (axis, f) => { const a = [...pts].sort((x, y) => x.c[axis] - y.c[axis]), tot = a.reduce((s, x) => s + x.w, 0); let acc = 0; for (const x of a) { acc += x.w; if (acc >= tot * f) return x.c[axis]; } return a.at(-1).c[axis]; };
  return [q(0, lo), q(1, lo), q(0, hi), q(1, hi)];
}
