// Terreno e estações. O mapa não traz relevo, então o terreno de cada província é
// uma aproximação determinística: latitude, densidade populacional, costa e um sorteio por id.
import { hash } from './world.js';
import { dateOf } from './util.js';

export const TERRAIN = {
  plain: { name: 'Planície', def: 1 },
  urban: { name: 'Área urbana', def: 1.15 },
  mountain: { name: 'Montanha', def: 1.3 },
  forest: { name: 'Floresta', def: 1.12 },
  desert: { name: 'Deserto', def: 1.06 },
  tundra: { name: 'Tundra', def: 1.1 },
};
const cache = new Map();
// A projeção do mapa coloca o equador em y≈520, com ~6,2 px por grau.
export const latOf = P => (520 - P.c[1]) / 6.2;

export function terrainOf(data, pid) {
  if (cache.has(pid)) return cache.get(pid);
  const P = data.geo.prov[pid];
  const a = Math.abs(latOf(P)), dens = (P.pop || 0) / Math.max(1, P.a), h = hash(String(pid));
  let t = 'plain';
  if (dens > 400) t = 'urban';
  else if (a > 62) t = 'tundra';
  else if (a >= 15 && a <= 33 && !P.coast && h < 0.5) t = 'desert';
  else if (h > 0.82) t = 'mountain';
  else if ((a < 12 || a > 45) && h > 0.45) t = 'forest';
  cache.set(pid, t);
  return t;
}

// Fator aplicado a quem ataca naquela província, naquele dia.
export function seasonOf(day, lat) {
  const m = dateOf(day).m, north = lat >= 0, a = Math.abs(lat);
  const winter = north ? (m === 11 || m <= 1) : (m >= 5 && m <= 7);
  const thaw = north ? (m === 2 || m === 3) : (m === 8 || m === 9);
  if (winter && a > 35) return { f: a > 55 ? 0.85 : 0.92, tag: 'inverno rigoroso' };
  if (thaw && a > 40 && a < 65) return { f: 0.95, tag: 'lama do degelo' };
  return { f: 1, tag: 'clima ameno' };
}

// Modificador de defesa (multiplica a força de quem defende) e de estação (quem ataca).
export function battleMods(data, pid, day, isCapital) {
  const T = TERRAIN[terrainOf(data, pid)], S = seasonOf(day, latOf(data.geo.prov[pid]));
  return { def: isCapital ? 1 : T.def, season: S.f, tname: T.name, stag: S.tag };
}
