// Pré-processa Natural Earth (domínio público) em JSON compacto e projetado para o jogo.
// Uso: node tools/build-geo.mjs   (requer tools/raw/*.geojson e npm i em tools/)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import mapshaper from 'mapshaper';
import * as topo from 'topojson-client';
import { geoNaturalEarth1, geoPath, geoCentroid, geoArea, geoGraticule10 } from 'd3-geo';

const RAW = new URL('./raw/', import.meta.url);
const OUT = new URL('../data/geo/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const read = f => readFileSync(new URL(f, RAW), 'utf8');
const W = 2000, H = 1040;
const proj = geoNaturalEarth1().fitSize([W, H], { type: 'Sphere' });

// Contexto de path que grava coordenadas relativas com 1 casa decimal.
function pathOf(geom) {
  let d = '', px = 0, py = 0, sx = 0, sy = 0, n = 0;
  const r = v => Math.round(v * 10);
  const ctx = {
    moveTo(x, y) { const X = r(x), Y = r(y); d += `M${(X / 10)} ${(Y / 10)}`; px = X; py = Y; sx = X; sy = Y; n++; },
    lineTo(x, y) { const X = r(x), Y = r(y); if (X === px && Y === py) return; d += `l${(X - px) / 10} ${(Y - py) / 10}`; px = X; py = Y; n++; },
    closePath() { d += 'z'; px = sx; py = sy; },
    arc() {},
  };
  geoPath(proj, ctx)(geom);
  return { d: d.replace(/ -/g, '-'), n };
}

const ms = async (cmd, input) => {
  const out = await mapshaper.applyCommands(cmd, { 'in.json': input });
  return JSON.parse(out['out.json']);
};

console.log('Simplificando países…');
const a0raw = JSON.parse(read('ne_10m_admin_0_countries.geojson'));
const a0topo = await ms('-i in.json snap -simplify 4% weighted keep-shapes -o out.json format=topojson quantization=200000', JSON.stringify(a0raw));
const a0 = topo.feature(a0topo, a0topo.objects[Object.keys(a0topo.objects)[0]]).features;
const obj0 = a0topo.objects[Object.keys(a0topo.objects)[0]];
const arcUse0 = new Map();
const walk0 = (arcs, fn) => Array.isArray(arcs) ? arcs.forEach(x => walk0(x, fn)) : fn(arcs < 0 ? ~arcs : arcs);
obj0.geometries.forEach(g => walk0(g.arcs || [], x => arcUse0.set(x, (arcUse0.get(x) || 0) + 1)));
const coast0 = {};
obj0.geometries.forEach((g, i) => { let c = false; walk0(g.arcs || [], x => { if (arcUse0.get(x) === 1) c = true; }); coast0[a0[i].properties.ADM0_A3] = c; });

console.log('Simplificando províncias…');
const a1raw = JSON.parse(read('ne_10m_admin_1_states_provinces.geojson'));
for (const f of a1raw.features) {
  const p = f.properties;
  f.properties = { id: p.adm1_code, name: p.name || p.name_alt || p.adm1_code, a3: p.adm0_a3, sov: p.sov_a3, type: p.type_en, area: p.area_sqkm, lat: p.latitude, lon: p.longitude, region: p.region };
}
const a1topo = await ms('-i in.json snap -simplify 3% weighted keep-shapes -o out.json format=topojson quantization=200000', JSON.stringify(a1raw));
const obj1 = a1topo.objects[Object.keys(a1topo.objects)[0]];
const a1 = topo.feature(a1topo, obj1).features;
const nb1 = topo.neighbors(obj1.geometries);

// Arcos usados por apenas uma província = litoral (ou fronteira sem vizinho).
const arcUse = new Map();
const walk = (arcs, fn) => Array.isArray(arcs) ? arcs.forEach(a => walk(a, fn)) : fn(arcs < 0 ? ~arcs : arcs);
obj1.geometries.forEach(g => walk(g.arcs || [], a => arcUse.set(a, (arcUse.get(a) || 0) + 1)));
const coastal = obj1.geometries.map(g => { let c = false; walk(g.arcs || [], a => { if (arcUse.get(a) === 1) c = true; }); return c; });

console.log('Lugares e capitais…');
const places = JSON.parse(read('ne_10m_populated_places_simple.geojson')).features.map(f => f.properties);
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');

const countries = {};
for (const f of a0) {
  const p = f.properties;
  const id = p.ADM0_A3;
  const { d } = pathOf(f);
  const [lx, ly] = proj([p.LABEL_X, p.LABEL_Y]) || proj(geoCentroid(f));
  const iso2 = p.ISO_A2_EH && p.ISO_A2_EH !== '-99' ? p.ISO_A2_EH : null;
  const iso3 = p.ISO_A3_EH && p.ISO_A3_EH !== '-99' ? p.ISO_A3_EH : null;
  countries[id] = {
    id, name: p.NAME_PT || p.NAME, nameEn: p.NAME, formal: p.FORMAL_EN || null, iso2, iso3, type: p.TYPE, sov: p.SOV_A3, sovName: p.SOVEREIGNT,
    continent: p.CONTINENT, regionUN: p.REGION_UN, subregion: p.SUBREGION, regionWB: p.REGION_WB, pop: p.POP_EST, gdp: p.GDP_MD, economy: p.ECONOMY, income: p.INCOME_GRP,
    wikidata: p.WIKIDATAID, label: [Math.round(lx), Math.round(ly)], minLabel: p.MIN_LABEL, d, area: 0, provinces: [], nb: [], sea: [], coast: false, capital: null,
  };
}

const provinces = {};
const byCountry = {};
a1.forEach((f, i) => {
  const p = f.properties;
  let a3 = countries[p.a3] ? p.a3 : countries[p.sov] ? p.sov : null;
  if (!a3) { console.warn('Província sem país:', p.id, p.a3); return; }
  const { d } = pathOf(f);
  const c = proj([p.lon, p.lat]) || proj(geoCentroid(f));
  const area = p.area > 0 ? p.area : Math.round(geoArea(f) * 6371 ** 2);
  provinces[p.id] = { id: p.id, n: p.name, a3, t: p.type, a: area, c: [Math.round(c[0] * 10) / 10, Math.round(c[1] * 10) / 10], d, nb: [], coast: coastal[i], rg: p.region || null, cityPop: 0, i };
  (byCountry[a3] ||= []).push(p.id);
});
const idxToId = a1.map(f => f.properties.id);
a1.forEach((f, i) => { const P = provinces[f.properties.id]; if (P) P.nb = nb1[i].map(j => idxToId[j]).filter(id => provinces[id]); });

// País sem províncias no admin-1: cria uma província única a partir da geometria do país.
for (const id in countries) {
  if (byCountry[id]?.length) continue;
  const f = a0.find(x => x.properties.ADM0_A3 === id);
  const pid = id + '-0';
  provinces[pid] = { id: pid, n: countries[id].name, a3: id, t: 'Território', a: Math.round(geoArea(f) * 6371 ** 2), c: countries[id].label, d: countries[id].d, nb: [], coast: true, rg: null, cityPop: 0, synthetic: true };
  byCountry[id] = [pid];
}

// População estimada por província: metade cidades (Natural Earth populated places), metade área.
const nameIdx = {};
for (const id in provinces) { const P = provinces[id]; (nameIdx[P.a3 + '|' + norm(P.n)] ||= []).push(id); }
const nearestProv = (a3, lon, lat) => {
  const xy = proj([lon, lat]); if (!xy) return null;
  let best = null, bd = Infinity;
  for (const id of byCountry[a3] || []) { const c = provinces[id].c; const dd = (c[0] - xy[0]) ** 2 + (c[1] - xy[1]) ** 2; if (dd < bd) { bd = dd; best = id; } }
  return best;
};
for (const pl of places) {
  const a3 = countries[pl.adm0_a3] ? pl.adm0_a3 : countries[pl.sov_a3] ? pl.sov_a3 : null;
  if (!a3) continue;
  const pid = (nameIdx[a3 + '|' + norm(pl.adm1name)] || [])[0] || nearestProv(a3, pl.longitude, pl.latitude);
  if (!pid) continue;
  provinces[pid].cityPop += pl.pop_max || 0;
  const isCap = pl.adm0cap === 1 || pl.featurecla === 'Admin-0 capital';
  if (isCap && (!countries[a3].capital || (pl.pop_max || 0) > countries[a3].capital.pop)) {
    const xy = proj([pl.longitude, pl.latitude]);
    countries[a3].capital = { name: pl.name, prov: pid, pop: pl.pop_max, xy: [Math.round(xy[0] * 10) / 10, Math.round(xy[1] * 10) / 10] };
  }
}
for (const a3 in byCountry) {
  const C = countries[a3], ids = byCountry[a3];
  const cityTot = ids.reduce((s, id) => s + provinces[id].cityPop, 0);
  const ruralTot = ids.reduce((s, id) => s + Math.pow(provinces[id].a + 1, 0.6), 0);
  const u = Math.max(0.25, Math.min(0.8, cityTot / Math.max(1, C.pop)));
  for (const id of ids) {
    const P = provinces[id];
    const share = (cityTot ? u * P.cityPop / cityTot : 0) + (1 - (cityTot ? u : 0)) * Math.pow(P.a + 1, 0.6) / ruralTot;
    P.pop = Math.round(C.pop * share);
  }
  C.provinces = ids;
  C.area = ids.reduce((s, id) => s + provinces[id].a, 0);
  C.coast = !!coast0[a3];
  if (!C.coast) for (const id of ids) provinces[id].coast = false;
  if (!C.capital) { const big = ids.reduce((b, id) => provinces[id].pop > provinces[b].pop ? id : b, ids[0]); C.capital = { name: provinces[big].n, prov: big, pop: 0, xy: provinces[big].c, estimated: true }; }
  const land = new Set();
  for (const id of ids) for (const n of provinces[id].nb) if (provinces[n].a3 !== a3) land.add(provinces[n].a3);
  C.nb = [...land].sort();
}

// Vizinhos marítimos: vértices de províncias costeiras a menos de ~350 km (≈ 18 unidades).
console.log('Vizinhos marítimos…');
const pts = {};
for (const a3 in byCountry) {
  const arr = [];
  for (const id of byCountry[a3]) { const P = provinces[id]; if (!P.coast) continue; const m = P.d.match(/-?[\d.]+/g); if (!m) continue; let x = 0, y = 0; const seg = P.d.split(/(?=[Ml])/); for (const sgm of seg) { const v = sgm.slice(1).trim().split(/[ ]|(?=-)/).filter(Boolean).map(Number); if (sgm[0] === 'M') { x = v[0]; y = v[1]; } else { x += v[0]; y += v[1]; } if (Math.random() < 0.35) arr.push([x, y]); } }
  pts[a3] = arr;
}
const bb = a3 => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts[a3]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; };
const boxes = Object.fromEntries(Object.keys(pts).filter(k => pts[k].length).map(k => [k, bb(k)]));
const ids = Object.keys(boxes), R = 18;
for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
  const A = ids[i], B = ids[j], a = boxes[A], b = boxes[B];
  if (a[0] - R > b[2] || b[0] - R > a[2] || a[1] - R > b[3] || b[1] - R > a[3]) continue;
  if (countries[A].nb.includes(B)) continue;
  let hit = false;
  for (const p of pts[A]) { for (const q of pts[B]) if ((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 < R * R) { hit = true; break; } if (hit) break; }
  if (hit) { countries[A].sea.push(B); countries[B].sea.push(A); }
}

// Arestas: trechos de fronteira entre pares de províncias (ou litoral), para desenhar só as fronteiras entre donos diferentes.
console.log('Arestas…');
const arcOwners = new Map();
obj1.geometries.forEach((g, gi) => walk(g.arcs || [], a => { const l = arcOwners.get(a) || []; if (!l.includes(gi)) l.push(gi); arcOwners.set(a, l); }));
const pairArcs = new Map();
for (const [a, gs] of arcOwners) {
  const ids2 = gs.map(gi => idxToId[gi]).filter(id => provinces[id]).sort();
  const key = ids2.length >= 2 ? ids2[0] + '|' + ids2[1] : (ids2[0] || '') + '|';
  if (!ids2.length) continue;
  (pairArcs.get(key) || pairArcs.set(key, []).get(key)).push([a]);
}
const edges = [];
for (const [key, arcs] of pairArcs) {
  const [pa, pb] = key.split('|');
  const ml = topo.feature(a1topo, { type: 'MultiLineString', arcs });
  const { d } = pathOf(ml);
  if (d) edges.push([pa, pb, d.replace(/z/g, '')]);
}
for (const id in provinces) if (provinces[id].synthetic) edges.push([id, '', provinces[id].d.replace(/z/g, '')]);
writeFileSync(new URL('edges.geo.json', OUT), JSON.stringify({ meta: { note: 'Fronteiras entre províncias [a, b, path]; b vazio = litoral' }, edges }));
console.log('edges', edges.length);

for (const id in provinces) { delete provinces[id].i; delete provinces[id].cityPop; }
const provOut = {};
for (const a3 in byCountry) provOut[a3] = byCountry[a3].map(id => provinces[id]);
const meta = { sphere: pathOf({ type: 'Sphere' }).d, graticule: pathOf(geoGraticule10()).d, source: 'Natural Earth 10m Admin 0 / Admin 1 / Populated Places (domínio público), simplificado com mapshaper', projection: 'Natural Earth I', width: W, height: H, built: new Date().toISOString().slice(0, 10), countries: Object.keys(countries).length, provinces: Object.keys(provinces).length };
for (const id in countries) delete countries[id].d;
writeFileSync(new URL('countries.geo.json', OUT), JSON.stringify({ meta, countries }));
writeFileSync(new URL('provinces.geo.json', OUT), JSON.stringify({ meta, provinces: provOut }));
console.log(meta);
