// Mundo customizado ("País fraturado"): o jogador (ou um preset) divide países em nações novas, com nome, bandeira,
// líder, regime e papel (rival, antagonista, aliada, neutra). customData() devolve um mundo-base já reescrito.
import { personName, leaderName, cultureOf } from './names.js';
import { relAI, shiftRelAI } from './world.js';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
import { regionalBest, regionalProvinces } from './regflags.js';
import { regionalFlag } from './newstates.js';
import { nationalVariant } from './flagstyle.js';
import { POSTURES } from './ideofam.js';

const hashS = str => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100000) / 100000; };

export const REGIMES = {
  democracy: { name: 'Democracia liberal', p: { gov: 'parl', govName: 'República parlamentar', regime: 'dem', regimeName: 'Democracia liberal', liberty: 80, market: 70, align: 'W' } },
  social: { name: 'Social-democracia', p: { gov: 'parl', govName: 'República parlamentar', regime: 'dem', regimeName: 'Social-democracia', liberty: 78, market: 45, align: 'W' } },
  socialist: { name: 'Estado socialista', p: { gov: 'party', govName: 'República socialista', regime: 'auth', regimeName: 'Estado socialista', liberty: 25, market: 20, align: 'E' } },
  authoritarian: { name: 'Autoritário nacionalista', p: { gov: 'pres', govName: 'República presidencialista', regime: 'auth', regimeName: 'Regime autoritário', liberty: 22, market: 50, align: 'N' } },
  junta: { name: 'Junta militar', p: { gov: 'mil', govName: 'Junta militar', regime: 'auth', regimeName: 'Junta militar', liberty: 15, market: 40, align: 'N' } },
  theocracy: { name: 'Teocracia', p: { gov: 'theo', govName: 'República teocrática', regime: 'auth', regimeName: 'Teocracia', liberty: 20, market: 35, religiosity: 85, align: 'N' } },
  constmon: { name: 'Monarquia constitucional', p: { gov: 'cmon', govName: 'Monarquia constitucional', regime: 'dem', regimeName: 'Monarquia constitucional', liberty: 80, market: 65, align: 'W' } },
  monarchy: { name: 'Monarquia', p: { gov: 'mon', govName: 'Monarquia', regime: 'hybrid', regimeName: 'Monarquia', liberty: 45, market: 55, align: 'N' } },
  hybrid: { name: 'Regime híbrido', p: { gov: 'semi', govName: 'República semipresidencialista', regime: 'hybrid', regimeName: 'Regime híbrido', liberty: 48, market: 55, align: 'N' } },
};
// Nomes em português das regiões com bandeira regional.
const PT = { 'Andalucía': 'Andaluzia', 'Aragón': 'Aragão', 'Canary Is.': 'Canárias', 'Islas Baleares': 'Ilhas Baleares', 'Foral de Navarra': 'Navarra', Asturias: 'Astúrias', Valenciana: 'Comunidade Valenciana', Sachsen: 'Saxônia', Hamburg: 'Hamburgo', 'Baden-Württemberg': 'Baden-Württemberg', 'Nordrhein-Westfalen': 'Renânia do Norte-Vestfália', Lombardia: 'Lombardia', 'Trentino-Alto Adige': 'Tirol do Sul (Alto Ádige)', 'Cataluña': 'Catalunha', 'País Vasco': 'Euskadi (País Basco)', Galicia: 'Galiza', Bayern: 'Baviera', Sardegna: 'Sardenha', Sicily: 'Sicília', Chechnya: 'Chechênia', 'Sakha (Yakutia)': 'Sakha (Iacútia)', Bashkortostan: 'Bascortostão', Moskva: 'Moscou', 'City of St. Petersburg': 'São Petersburgo', Rostov: 'Rostov', Volgograd: 'Volgogrado', Murmansk: 'Murmansk', Leningrad: 'Leningrado', Dagestan: 'Daguestão', Karelia: 'Karélia', Tatarstan: 'Tartaristão', 'Gorno-Altay': 'Altai', Komi: 'Komi', Crimea: 'Crimeia', 'North Ossetia': 'Ossétia do Norte', Tuva: 'Tuva', Udmurt: 'Udmúrtia', Ingush: 'Inguchétia', Mordovia: 'Mordóvia', Khakass: 'Khakássia', 'Kabardin-Balkar': 'Kabardino-Balcária', Adygey: 'Adiguésia', Kalmyk: 'Calmúquia', Buryat: 'Buriácia', 'Karachay-Cherkess': 'Carachai-Circássia', Chuvash: 'Chuváchia', Kaliningrad: 'Kaliningrado', Sevastopol: 'Sebastopol', 'Mariy-El': 'Mari El', 'North Karelia': 'Carélia do Norte', 'Southern Savonia': 'Savônia do Sul', 'Northern Savonia': 'Savônia do Norte', 'Central Finland': 'Finlândia Central', Lapland: 'Lapônia', Ostrobothnia: 'Ostrobótnia', Uusimaa: 'Uusimaa' };
export const regionName = n => PT[n] || n;
// Identidade regional de um grupo de províncias: nome real e bandeira regional (quando existirem).
export function regionalIdentity(data, pids) { const b = regionalBest(data, pids); return b ? { key: b.key, name: regionName(b.name), a3: b.a3 } : null; }
export const ROLES = { rival: 'Rival', antagonist: 'Antagonista', ally: 'Aliada', neutral: 'Neutra' };
const COMPASS = ['Norte', 'Nordeste', 'Leste', 'Sudeste', 'Sul', 'Sudoeste', 'Oeste', 'Noroeste'];

// Divide os dados de um país em k grupos por k-means nos centroides das províncias (ponderado por população).
export function kmeans(provs, P, k) {
  const pts = provs.map(id => ({ id, x: P[id].c[0], y: P[id].c[1], w: Math.max(1, P[id].pop || 1) }));
  if (k >= pts.length) return pts.map(p => [p.id]);
  const cen = [pts.reduce((a, b) => (b.w > a.w ? b : a))].map(p => [p.x, p.y]);
  while (cen.length < k) { let best = null, bd = -1; for (const p of pts) { const d = Math.min(...cen.map(c => Math.hypot(p.x - c[0], p.y - c[1]))); if (d > bd) { bd = d; best = p; } } cen.push([best.x, best.y]); }
  let asg = [];
  for (let it = 0; it < 24; it++) {
    asg = pts.map(p => cen.reduce((bi, c, i) => (Math.hypot(p.x - c[0], p.y - c[1]) < Math.hypot(p.x - cen[bi][0], p.y - cen[bi][1]) ? i : bi), 0));
    for (let i = 0; i < k; i++) { const m = pts.filter((_, j) => asg[j] === i); if (m.length) { const w = m.reduce((a, p) => a + p.w, 0); cen[i] = [m.reduce((a, p) => a + p.x * p.w, 0) / w, m.reduce((a, p) => a + p.y * p.w, 0) / w]; } }
  }
  const groups = Array.from({ length: k }, () => []); asg.forEach((g, j) => groups[g].push(pts[j].id));
  return groups.filter(g => g.length);
}
const dirOf = (c, o) => { const dx = c[0] - o[0], dy = c[1] - o[1]; if (Math.hypot(dx, dy) < 1e-6) return 'Centro'; const a = Math.atan2(dx, -dy) * 180 / Math.PI; return COMPASS[Math.round(((a + 360) % 360) / 45) % 8]; };
const centroid = (ids, P) => { const w = ids.reduce((a, i) => a + Math.max(1, P[i].pop || 1), 0); return [ids.reduce((a, i) => a + P[i].c[0] * Math.max(1, P[i].pop || 1), 0) / w, ids.reduce((a, i) => a + P[i].c[1] * Math.max(1, P[i].pop || 1), 0) / w]; };

const PAL = [['#0b3d91', '#ffffff', '#c8102e'], ['#006b3f', '#fcd116', '#c8102e'], ['#111111', '#c8102e', '#ffd700'], ['#ffffff', '#0057b7', '#ffd700'], ['#c8102e', '#ffffff', '#0b3d91'], ['#1e8c3c', '#ffffff', '#111111'], ['#ff9933', '#ffffff', '#138808'], ['#00a3dd', '#ffffff', '#ffd700']];
// Ordem: variação da bandeira do país de origem (a3) → estilo cultural da região → padrão neutro.
export function autoFlag(key, culture, a3) {
  if (a3) { let j = 0; const nv = nationalVariant(a3, () => hashS(key + 'nv' + (j++))); if (nv) return nv; }
  if (culture) { let i = 0; return regionalFlag(culture, null, () => hashS(key + 'rf' + (i++))); }
  const h = hashS(key + 'flag'), pal = PAL[Math.floor(h * PAL.length)], lay = ['h3', 'v3', 'h2', 'canton', 'diag', 'cross'][Math.floor(hashS(key + 'lay') * 6)];
  return { layout: lay, colors: [...pal], emblems: hashS(key + 'em') > 0.35 ? [{ type: 'star', color: pal[2], x: lay === 'canton' ? 0.17 : 0.5, y: lay === 'canton' ? 0.25 : 0.5, s: 0.28 }] : [] };
}
// Fratura um país em n nações automaticamente (nomes pela direção, regime sorteado de forma determinística).
export function fracture(data, parentId, n, seed = '') {
  const prov = data.geo.prov, ids = (data.geo.byCountry[parentId] || []).filter(p => prov[p]);
  if (!ids.length) return [];
  const groups = kmeans(ids, prov, Math.max(2, Math.min(n, ids.length)));
  const all = centroid(ids, prov), base = data.reg[parentId]?.name || parentId;
  const cult = cultureOf(data, parentId), keys = Object.keys(REGIMES), used = new Set();
  const ranked = groups.map((g, i) => ({ g, i, c: centroid(g, prov) })).sort((x, y) => Math.hypot(y.c[0] - all[0], y.c[1] - all[1]) - Math.hypot(x.c[0] - all[0], x.c[1] - all[1]));
  const names = {};
  for (const r of ranked) { const dir = dirOf(r.c, all); let nm = dir; for (const pre of ['Extremo ', 'Alto ', 'Baixo ', 'Médio ', 'Interior ']) { if (!used.has(nm)) break; nm = pre + dir; } used.add(nm); names[r.i] = nm; }
  const usedKeys = new Set();
  return groups.map((g, i) => {
    const reg = keys[Math.floor(hashS(parentId + seed + i) * keys.length)], id = `CW_${parentId}_${i + 1}`;
    let ident = regionalIdentity(data, g); if (ident && usedKeys.has(ident.key)) ident = null; if (ident) usedKeys.add(ident.key);
    let anyReg = ident ? null : regionalBest(data, g, 0); if (anyReg && usedKeys.has(anyReg.key)) anyReg = null; if (anyReg) usedKeys.add(anyReg.key);
    const nm = ident ? ident.name : `${base} do ${names[i]}`;
    return { id, parent: parentId, name: nm, formal: ident ? `República de ${nm}` : nm, leader: leaderName(cult), regime: reg, role: 'neutral', provs: g, flagSpec: ident ? { reg: ident.key } : anyReg ? { reg: anyReg.key } : autoFlag(id, cult, parentId), auto: true, region: ident?.key || null };
  });
}

// Nação formada a partir de bandeiras regionais reais (e, opcionalmente, províncias extras).
function fromRegion(data, key, extra = []) {
  const provs = [...new Set([...regionalProvinces(data, key), ...extra.filter(p => data.geo.prov[p])])]; if (!provs.length) return null;
  const meta = data.regionalFlags?.meta?.[key], a3 = meta?.a3 || data.geo.prov[provs[0]].a3, nm = regionName(meta?.name || key);
  return { id: 'CW_' + key, parent: a3, name: nm, formal: 'República de ' + nm, leader: leaderName(cultureOf(data, a3)), regime: 'democracy', role: 'neutral', provs, flagSpec: { reg: key }, auto: true, region: key };
}
const RUS_KEYS = ['rus_tatarstan', 'rus_dagestan', 'rus_chechnya_chechen_republic', 'rus_sakha_yakutia_sakha_republic_yakutia', 'rus_bashkortostan', 'rus_karelia_republic_of_karelia', 'rus_buryatia_republic_of_buryatia', 'rus_komi_republic_komi', 'rus_north_ossetia_alania_north_ossetia', 'rus_ingushetia_republic_of_ingushetia', 'rus_kabardino_balkaria', 'rus_karachay_cherkessia', 'rus_adygea', 'rus_kalmykia_republic_of_kalmykia', 'rus_tuva', 'rus_altai_republic', 'rus_khakassia', 'rus_udmurtia_udmurt_republic', 'rus_mari_el', 'rus_chuvashia_chuvash_republic', 'rus_mordovia', 'rus_crimea_republic_of_crimea'];
// Divide um país em suas regiões históricas com bandeira real; o restante vira o núcleo (com a bandeira nacional).
const EUR_SPLIT = {
  ESP: ['esp_catalonia', 'esp_the_basque_country_basque_country', 'esp_galicia', 'esp_andalusia', 'esp_valencia', 'esp_aragon', 'esp_canarias', 'esp_baleares', 'esp_navarra', 'esp_asturias'],
  DEU: ['deu_bavaria', 'deu_saxony', 'deu_north_rhine_westphalia', 'deu_hamburg', 'deu_baden_w_rttemberg'],
  ITA: ['ita_sicily', 'ita_sardinia', 'ita_piedmont', 'ita_lombardy', 'ita_south_tyrol_trentino_alto_adige'],
};
function splitByRegions(d, a3, only) {
  const meta = d.regionalFlags?.meta || {}, own = Object.keys(d.geo.prov).filter(p => d.geo.prov[p].a3 === a3);
  const keys = only.filter(k => meta[k]);
  const taken = new Set(), out = [];
  for (const k of keys) {
    const n = fromRegion(d, k); if (!n) continue;
    n.provs = n.provs.filter(p => d.geo.prov[p].a3 === a3 && !taken.has(p)); if (!n.provs.length) continue;
    n.provs.forEach(p => taken.add(p)); out.push(n);
  }
  const rest = own.filter(p => !taken.has(p)), ent = d.reg[a3];
  if (rest.length) { const nm = ent?.name || a3; out.unshift({ id: 'CW_' + a3 + '_core', parent: a3, name: nm, formal: nm, leader: leaderName(cultureOf(d, a3)), regime: 'democracy', role: 'neutral', provs: rest, flagSpec: ent?.iso2 ? { iso: ent.iso2 } : autoFlag('CW_' + a3, cultureOf(d, a3), a3), auto: true, region: null }); }
  return out;
}
export const PRESETS = [
  { id: 'kar', name: 'Grande Karélia (russa + finlandesa)', desc: 'Uma Karélia unificada: a república russa mais a Carélia do Norte e do Sul da Finlândia.', build: d => [fromRegion(d, 'rus_karelia_republic_of_karelia', ['FIN-3190', 'FIN-3188'])].filter(Boolean) },
  { id: 'rusrep', name: 'Repúblicas russas separatistas', desc: '22 repúblicas (Daguestão, Chechênia, Tartaristão, Sakha, Bascortostão, Karélia, Buriácia, Komi, Ossétia do Norte, Tuva, Crimeia e outras) viram nações com suas bandeiras reais e regimes variados.', build: d => { const extra = k => k.includes('karelia') ? ['FIN-3190', 'FIN-3188'] : k.includes('crimea') ? regionalProvinces(d, 'rus_sevastopol') : []; const n = RUS_KEYS.map(k => fromRegion(d, k, extra(k))).filter(Boolean); const rg = Object.keys(REGIMES); n.forEach((x, i) => { x.role = ['ally', 'ally', 'rival', 'antagonist', 'rival'][i] || 'neutral'; x.regime = rg[Math.floor(hashS('rusrep' + i) * rg.length)]; }); return n; } },
  { id: 'rus', name: 'Rússia fragmentada', desc: 'A Federação se desfaz em seis nações rivais.', fr: [['RUS', 6]] },
  { id: 'bra', name: 'Brasil dividido (Norte, Nordeste, Sul...)', desc: 'O Brasil se parte em cinco países.', fr: [['BRA', 5]] },
  { id: 'usa', name: 'Estados Desunidos', desc: 'Os EUA se fraturam em seis repúblicas.', fr: [['USA', 6]] },
  { id: 'chn', name: 'China dividida', desc: 'Cinco chinas disputando a herança.', fr: [['CHN', 5]] },
  { id: 'ind', name: 'Índia fraturada', desc: 'A União Indiana se divide em cinco.', fr: [['IND', 5]] },
  { id: 'nga', name: 'Nigéria dividida', desc: 'A Nigéria se parte em quatro.', fr: [['NGA', 4]] },
  { id: 'eur', name: 'Europa fraturada', desc: 'Espanha, Alemanha e Itália se desfazem: cada região histórica (Catalunha, Euskadi, Galiza, Andaluzia, Baviera, Sicília, Sardenha…) vira nação com sua bandeira real; o que sobra forma o núcleo de cada país.', build: d => Object.entries(EUR_SPLIT).flatMap(([a3, keys]) => splitByRegions(d, a3, keys)) },
  { id: 'many', name: 'Colapso dos gigantes', desc: 'Rússia, Brasil e EUA fraturados ao mesmo tempo.', fr: [['RUS', 5], ['BRA', 4], ['USA', 5]] },
];
export function presetWorld(data, pid) {
  const P = PRESETS.find(x => x.id === pid); if (!P) return null;
  const nations = P.build ? P.build(data) : P.fr.flatMap(([c, n]) => fracture(data, c, n, pid));
  autoRoles(nations);
  return { id: 'custom', name: P.name, desc: P.desc, nations };
}
// Papéis automáticos: a primeira nação de cada fratura é aliada; a seguinte, rival; a terceira, antagonista; o resto, neutras.
export function autoRoles(nations) { const cnt = {}; for (const n of nations) { const i = cnt[n.parent] = (cnt[n.parent] || 0) + 1; n.role = ['ally', 'rival', 'antagonist'][i - 1] || 'neutral'; } }

// ---------- Aplicação aos dados ----------
export function customData(base, def) {
  if (!def?.nations?.length) return base;
  const geo = base.geo, prov = { ...geo.prov }, byCountry = { ...geo.byCountry }, cOf = { ...geo.cOf }, reg = { ...base.reg }, countries = { ...geo.countries };
  const sum = (ids, k) => ids.reduce((a, p) => a + (geo.prov[p]?.[k] || 0), 0);
  const touched = new Set();
  for (const nat of def.nations) {
    const provs = nat.provs.filter(p => prov[p]); if (!provs.length) continue;
    const par = reg[nat.parent] || {}, parentAll = geo.byCountry[nat.parent] || provs, totPop = sum(parentAll, 'pop') || 1;
    for (const pid of provs) {
      const from = cOf[pid] || prov[pid].a3;
      byCountry[from] = (byCountry[from] || []).filter(x => x !== pid); touched.add(from);
      prov[pid] = { ...prov[pid], a3: nat.id, o3: prov[pid].o3 || prov[pid].a3 }; cOf[pid] = nat.id;
    }
    byCountry[nat.id] = [...(byCountry[nat.id] || []), ...provs];
    const popS = sum(provs, 'pop'), share = popS / totPop, cap = [...provs].sort((a, b) => (geo.prov[b].pop || 0) - (geo.prov[a].pop || 0))[0];
    const profile = { ...(par.profile || {}), ...(REGIMES[nat.regime]?.p || {}), ...(nat.profile || {}), nuclear: false, federal: false };
    if (REGIMES[nat.regime]) delete profile.fam;
    reg[nat.id] = { ...par, id: nat.id, mapId: nat.id, name: nat.name, nameEn: nat.name, formal: nat.formal || nat.name, iso2: null, iso3: nat.id, cat: 'sovereign', parent: null, playable: true, custom: true,
      pop: Math.round((par.pop || popS) * share), gdp: Math.round((par.gdp || 0) * share * (nat.gdpMul ?? 1)), area: Math.round(sum(provs, 'a')) || par.area, provinces: provs.length, nb: [], sea: par.sea || [],
      capital: { name: geo.prov[cap].n, prov: cap, pop: geo.prov[cap].pop, xy: geo.prov[cap].c }, profile, origin: nat.parent || prov[provs[0]]?.o3 || null, posture: POSTURES[nat.posture] ? nat.posture : null, culture: cultureOf(base, nat.parent || prov[provs[0]]?.o3), flag: nat.flag || { reg: null, iso: par.iso2?.toLowerCase(), ...(nat.flagSpec || {}) }, leaderName: nat.leader, wscn: 'custom' };
    if (nat.flagSpec) reg[nat.id].flag = nat.flagSpec; else if (par.iso2) reg[nat.id].flag = { iso: par.iso2.toLowerCase() };
    countries[nat.id] = { ...(countries[nat.parent] || {}), sea: countries[nat.parent]?.sea || [] };
  }
  // Atualiza os países-mãe (população, PIB, capital) e a vizinhança dos afetados.
  for (const id of touched) {
    const e = reg[id]; if (!e || e.custom) continue;
    const left = byCountry[id] || [], origAll = geo.byCountry[id] || [], f = left.length ? sum(left, 'pop') / (sum(origAll, 'pop') || 1) : 0;
    reg[id] = { ...e, pop: Math.round((e.pop || 0) * f), gdp: Math.round((e.gdp || 0) * f), area: Math.round(sum(left, 'a')) || 1, provinces: left.length };
    if (left.length && !left.includes(e.capital?.prov)) { const c2 = [...left].sort((a, b) => (prov[b].pop || 0) - (prov[a].pop || 0))[0]; reg[id].capital = { name: prov[c2].n, prov: c2, pop: prov[c2].pop, xy: prov[c2].c }; }
  }
  const affected = new Set([...touched, ...def.nations.map(n => n.id)]);
  const nbOf = {};
  for (const pid in prov) { const a = cOf[pid] || prov[pid].a3; for (const q of prov[pid].nb || []) { const b = cOf[q] || prov[q]?.a3; if (b && b !== a && (affected.has(a) || affected.has(b))) (nbOf[a] ||= new Set()).add(b); } }
  for (const id in nbOf) if (reg[id]) reg[id] = { ...reg[id], nb: [...new Set([...(affected.has(id) ? [] : reg[id].nb || []), ...nbOf[id]])] };
  return { ...base, reg, geo: { ...geo, prov, byCountry, cOf, countries } };
}

export const customWscn = def => ({ id: 'custom', name: def.name || 'Mundo customizado', tag: '', desc: def.desc || '', rules: [], entities: {}, alliances: [], customDef: def });

// Papéis em relação ao jogador (aplicado ao iniciar a partida).
export function initCustomRoles(s, data, def) {
  if (!def?.nations) return;
  const cnt = { ally: 0 };
  for (const n of def.nations) {
    const p = s.partners?.[n.id]; if (!p) continue;
    if (n.role === 'ally') { p.rel = Math.max(p.rel, 55); p.pact = p.pact || false; cnt.ally++; }
    if (n.role === 'rival') p.rel = Math.min(p.rel, -35);
    if (n.role === 'antagonist') p.rel = Math.min(p.rel, -70);
  }
  const mine = new Set((s.nation?.components || []).map(c => c.id));
  for (const n of def.nations) {
    const c = s.world.c[n.id];
    if (c && POSTURES[n.posture]) { c.posture = n.posture; if (n.posture === 'expansionist') c.expansionist = true; }
    for (const [other, v] of Object.entries(n.rels || {})) {
      if (v == null || !Number.isFinite(+v)) continue;
      const aMine = mine.has(n.id) || !s.world.c[n.id], bMine = mine.has(other) || !s.world.c[other];
      if (aMine && !bMine && s.partners[other]) s.partners[other].rel = clamp(+v, -100, 100);
      else if (bMine && !aMine && s.partners[n.id]) s.partners[n.id].rel = clamp(+v, -100, 100);
      else if (!aMine && !bMine) { const cur = relAI(s, data, n.id, other); shiftRelAI(s, n.id, other, +v - cur); }
    }
  }
  const allies = def.nations.filter(n => n.role === 'ally' && s.world.c[n.id]).map(n => n.id);
  if (allies.length > 1) (s.world.alliances ||= []).push({ id: 'cw_ally', name: 'Pacto das nações irmãs', members: allies, leader: allies[0] });
}

// Armazenamento local dos mundos customizados.
const KEY = 'ironstate.customworlds';
export function loadCustom(storage = globalThis.localStorage) { try { return JSON.parse(storage?.getItem(KEY) || '[]'); } catch { return []; } }
export function saveCustom(list, storage = globalThis.localStorage) { try { storage?.setItem(KEY, JSON.stringify(list)); return true; } catch { return false; } }
