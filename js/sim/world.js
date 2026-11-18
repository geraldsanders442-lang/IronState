import { clamp, chance, rand, random } from './util.js';
import { affinity, profileAxes } from './ideology.js';
import { ideoRel } from './ideofam.js';

export const PLY = 'PLY';
const INCOME = { '1. High income: OECD': 0, '2. High income: nonOECD': 1, '3. Upper middle income': 2, '4. Lower middle income': 3, '5. Low income': 4 };
const BY_INCOME = {
  infra: [72, 64, 50, 35, 22], health: [78, 68, 55, 42, 28], education: [78, 66, 55, 42, 28], corruption: [25, 38, 48, 58, 66],
  efficiency: [65, 55, 45, 35, 25], tech: [65, 52, 38, 25, 12], industry: [55, 50, 48, 38, 22], debt: [75, 45, 55, 52, 48], poverty: [6, 10, 18, 35, 55], hunger: [0.5, 1, 3, 8, 18],
};
const incomeIdx = e => INCOME[e?.income] ?? 3;
const pairKey = (a, b) => a < b ? a + '|' + b : b + '|' + a;

// ---------- Preparação dos dados ----------
export function prepareWorld(d, raw) {
  const g = raw.geo;
  d.geo = { meta: g.countries.meta, countries: g.countries.countries, byCountry: {}, prov: {}, edges: g.edges.edges };
  for (const a3 in g.provinces.provinces) {
    d.geo.byCountry[a3] = [];
    for (const p of g.provinces.provinces[a3]) { d.geo.prov[p.id] = p; d.geo.byCountry[a3].push(p.id); }
  }
  // Províncias com soberano reconhecido diferente do admin-1 (ex.: Crimeia) contam para o país de jure.
  for (const pid in raw.claims.deJure || {}) {
    const to = raw.claims.deJure[pid], P = d.geo.prov[pid];
    if (!P || pid.startsWith('_')) continue;
    d.geo.byCountry[P.a3] = d.geo.byCountry[P.a3].filter(x => x !== pid);
    (d.geo.byCountry[to] ||= []).push(pid);
  }
  d.geo.cOf = {};
  for (const a3 in d.geo.byCountry) for (const pid of d.geo.byCountry[a3]) d.geo.cOf[pid] = a3;
  d.reg = raw.registry.entities;
  d.regions = raw.registry.regions;
  d.rel = new Map();
  for (const r of raw.relations.rel) {
    d.rel.set(r.a + '>' + r.b, { ...r, s: r.s });
    d.rel.set(r.b + '>' + r.a, { ...r, s: r.ba ?? r.s, a: r.b, b: r.a });
  }
  d.wOrgs = raw.orgs.orgs.map(o => ({ ...o, members: expandMembers(o, d.reg) }));
  d.wOrgById = Object.fromEntries(d.wOrgs.map(o => [o.id, o]));
  d.claimsDb = raw.claims;
  d.scenarios = raw.scenarios.scenarios;
  d.identity = raw.identity;
  d.ties = {};
  for (const r of raw.relations.rel) if (r.s >= 40) { d.ties[r.a] = (d.ties[r.a] || 0) + 1; d.ties[r.b] = (d.ties[r.b] || 0) + 1; }
}

function expandMembers(o, reg) {
  if (o.rule === 'un_members') return Object.values(reg).filter(e => e.cat === 'sovereign' && e.id !== 'VAT').map(e => e.id);
  if (o.rule === 'imf_members') return [...Object.values(reg).filter(e => e.cat === 'sovereign' && !['VAT', 'CUB', 'PRK', 'MCO'].includes(e.id)).map(e => e.id), 'KOS'];
  return [...(o.members || [])];
}

export const relRecord = (data, a, b) => data.rel.get(a + '>' + b) || null;
// Registro de relação com herança: nações customizadas usam o do país de origem (atenuado).
export function relRecordInh(data, a, b) {
  const r = relRecord(data, a, b); if (r) return r;
  const oa = data.reg[a]?.origin || a, ob = data.reg[b]?.origin || b;
  if ((oa === a && ob === b) || oa === ob) return null;
  const ir = relRecord(data, oa, ob);
  return ir ? { ...ir, s: ir.s * 0.6, tr: ir.tr * 0.8, ec: ir.ec * 0.7, mi: ir.mi * 0.6, tre: [] } : null;
}
// Entidade do registro estático ou criada durante a campanha (Estados sucessores, secessões).
export const entOf = (s, data, id) => s.world?.ents?.[id] || data.reg[id];
const nmOf = (s, data, id) => entOf(s, data, id)?.name || id;

// ---------- Território ----------
export function ownerOf(s, data, pid) { return s.world.owner[pid] ?? data.geo.prov[pid].a3; }
export function provincesOf(s, data, id) {
  const cache = s.world._own || (s.world._own = buildOwnIndex(s, data));
  return cache[id] || [];
}
function buildOwnIndex(s, data) {
  const idx = {};
  for (const pid in data.geo.prov) (idx[ownerOf(s, data, pid)] ||= []).push(pid);
  return idx;
}
export function territoryChanged(s) { delete s.world._own; delete s.world._nb; s.world.ver = (s.world.ver || 0) + 1; }
export const isAlive = (s, data, id) => provincesOf(s, data, id).length > 0;

export function setOwner(s, data, pid, id) {
  if (data.geo.prov[pid].a3 === id && !s.world.deJure?.[pid]) delete s.world.owner[pid]; else s.world.owner[pid] = id;
  delete s.world.occ[pid];
  territoryChanged(s);
}

// Componentes conexos de um conjunto de províncias (vizinhança terrestre).
export function components(data, pids) {
  const set = new Set(pids), seen = new Set(), out = [];
  for (const p of pids) {
    if (seen.has(p)) continue;
    const comp = [], stack = [p]; seen.add(p);
    while (stack.length) { const x = stack.pop(); comp.push(x); for (const n of data.geo.prov[x].nb) if (set.has(n) && !seen.has(n)) { seen.add(n); stack.push(n); } }
    out.push(comp);
  }
  return out.sort((a, b) => b.length - a.length);
}

// Estimativas do território escolhido (tela de criação e perfil da simulação).
export function territoryStats(data, pids, opts = {}) {
  const P = data.geo.prov, byC = {};
  let pop = 0, area = 0, coastN = 0;
  for (const id of pids) { const p = P[id]; pop += p.pop || 0; area += p.a || 0; if (p.coast) coastN++; (byC[data.geo.cOf[id] || p.a3] ||= []).push(id); }
  const comps = Object.keys(byC).map(a3 => {
    const e = data.reg[a3], all = data.geo.byCountry[a3] || [];
    const cPop = all.reduce((s, x) => s + (P[x].pop || 0), 0) || 1;
    const myPop = byC[a3].reduce((s, x) => s + (P[x].pop || 0), 0);
    const share = myPop / cPop;
    return { id: a3, name: e?.name || a3, pids: byC[a3], share, full: byC[a3].length === all.length, pop: myPop, gdp: (e?.gdp || 0) / 1000 * share, e };
  }).sort((a, b) => b.pop - a.pop);
  const gdp = comps.reduce((s, c) => s + c.gdp, 0);
  const W = c => c.pop / Math.max(1, pop);
  const byInc = k => comps.reduce((s, c) => s + BY_INCOME[k][incomeIdx(c.e)] * W(c), 0);
  const resCount = {};
  for (const c of comps) for (const r of c.e?.profile?.resources || []) resCount[r] = (resCount[r] || 0) + (c.pids.reduce((s, x) => s + P[x].a, 0) / Math.max(1, area));
  const R = k => resCount[k] || 0;
  const res = {
    food: clamp(0.75 + R('farmland') * 0.7 + Math.min(0.2, area / 3e7), 0.5, 1.7),
    energy: clamp(0.6 + R('oil') * 0.6 + R('gas') * 0.45 + R('coal') * 0.3 + R('hydro') * 0.2 + R('uranium') * 0.15, 0.4, 1.9),
    raw: clamp(0.65 + R('metals') * 0.6 + R('timber') * 0.25 + R('diamonds') * 0.2 + R('rare_earths') * 0.3, 0.4, 1.8),
  };
  const set = new Set(pids);
  const foreign = new Set(); let borderProv = 0;
  for (const id of pids) {
    let b = false;
    for (const n of P[id].nb) if (!set.has(n)) { foreign.add(opts.ownerOf ? opts.ownerOf(n) : P[n].a3); b = true; }
    if (b) borderProv++;
  }
  const parts = components(data, pids);
  const mainShare = parts.length ? parts[0].reduce((s, x) => s + P[x].a, 0) / Math.max(1, area) : 1;
  const exclaves = parts.slice(1).filter(c => c.reduce((s, x) => s + P[x].a, 0) > 20000 && !c.every(x => P[x].coast));
  const diversity = comps.filter(c => c.pop / Math.max(1, pop) > 0.05).length;
  const troops = comps.reduce((s, c) => s + c.pop / 1e6 * 3 * (c.e?.profile?.milIntensity ?? 1), 0);
  const adminDifficulty = clamp(Math.log10(area + 1) * 9 - 18 + (diversity - 1) * 7 + exclaves.length * 6 + (1 - mainShare) * 15 + Math.log10(pop / 1e6 + 1) * 6, 0, 100);
  const sizeClass = area < 100000 ? 'small' : area < 900000 ? 'medium' : area < 3500000 ? 'large' : 'continental';
  return {
    pop, area, provinces: pids.length, comps, components: diversity, gdp, gdppc: gdp * 1e9 / Math.max(1, pop), coast: coastN > 0, coastShare: coastN / Math.max(1, pids.length),
    infra: byInc('infra'), health: byInc('health'), education: byInc('education'), corruption: byInc('corruption'), efficiency: byInc('efficiency'),
    tech: byInc('tech'), industry: byInc('industry'), debt: byInc('debt'), poverty: byInc('poverty'), hunger: byInc('hunger'),
    res, resources: Object.keys(resCount).sort((a, b) => resCount[b] - resCount[a]), troops,
    neighbors: [...foreign].filter(Boolean), borderShare: borderProv / Math.max(1, pids.length), parts: parts.length, exclaves: exclaves.length, adminDifficulty, sizeClass,
    nuclear: comps.some(c => c.e?.profile?.nuclear && c.share > 0.5),
  };
}

// Converte as estimativas no perfil usado pelas regras da simulação.
export function simProfile(ts) {
  const ad = ts.adminDifficulty;
  return {
    res: ts.res, resScale: clamp(0.8 + Math.log10(ts.area / 3e5 + 1) * 0.5, 0.7, 1.5), coastal: ts.coast,
    trade: clamp((ts.coast ? 0.95 + ts.coastShare * 0.3 : 0.8) + Math.min(0.15, ts.neighbors.length * 0.015), 0.7, 1.35),
    admin: 0.85 + ad / 100 * 0.6, control: 10 - ad * 0.25, sep: clamp(2 + (ts.components - 1) * 5 + ts.exclaves * 4 + ad * 0.12, 0, 40),
    market: ts.area > 3e6 ? 0.5 : ts.area > 9e5 ? 0.25 : ts.area < 1e5 ? -0.4 : 0, sizeClass: ts.sizeClass,
  };
}

// ---------- Estado inicial do mundo ----------
function aiStats(e, share = 1) {
  const p = e.profile || { liberty: 50, market: 50, religiosity: 30, align: 'N', milIntensity: 0.6, regime: 'hybrid', resources: [] };
  const pop = (e.pop || 0) / 1e6 * share, gdp = (e.gdp || 0) / 1000 * share;
  const gdppc = gdp * 1e9 / Math.max(1, pop * 1e6);
  const lg = Math.log10(Math.max(300, gdppc));
  const troops = pop * 3 * p.milIntensity;
  const equip = clamp(8 + (lg - 2.5) * 22 + (p.nuclear ? 8 : 0), 5, 95);
  const ready = clamp(30 + p.milIntensity * 15, 15, 90);
  const logi = clamp(10 + (lg - 2.5) * 22, 5, 95);
  const stab = { dem: 75, flawed: 65, hybrid: 55, auth: 58 }[p.regime] ?? 55;
  return { pop, gdp, troops, equip, ready, logi, intel: clamp(20 + (lg - 2.5) * 15 + p.milIntensity * 5, 5, 90), stab, growth: [1.3, 1.7, 2.3, 3, 2.8][incomeIdx(e)] + (hash(e.id + 'g') - 0.5) * 2.4, nuclear: !!p.nuclear };
}
export function aiPower(c) {
  return Math.sqrt(Math.max(1, c.troops)) * (0.3 + c.equip / 100) * (0.3 + c.ready / 100) * (0.5 + c.logi / 200) * (0.85 + c.intel / 400) * (c.mobil ? 1.25 : 1);
}

export function initWorld(s, data, sel, scen, ts) {
  const W = s.world = { owner: {}, occ: {}, deJure: {}, c: {}, rel: {}, wars: [], blocs: [], loans: [], orgs: {}, claims: [], news: [], rankings: {}, rankHist: {}, ver: 0, cd: {} };
  const db = data.claimsDb;
  for (const pid in db.deJure) if (!pid.startsWith('_') && data.geo.prov[pid]) { W.owner[pid] = db.deJure[pid]; W.deJure[pid] = true; }
  for (const pid in db.occupied) if (!pid.startsWith('_') && data.geo.prov[pid]) W.occ[pid] = db.occupied[pid].by;
  const absorbed = new Set(ts.comps.filter(c => c.full).map(c => c.id));
  for (const pid of sel) { W.owner[pid] = PLY; if (absorbed.has(W.occ[pid])) delete W.occ[pid]; }
  for (const pid in W.occ) if (absorbed.has(W.occ[pid])) W.occ[pid] = PLY;
  territoryChanged(s);
  for (const o of data.wOrgs) W.orgs[o.id] = { members: [...o.members], suspended: [...(o.suspended || [])] };

  // Países de IA com a fatia de território que lhes resta.
  for (const id in data.reg) {
    const e = data.reg[id], all = data.geo.byCountry[id] || [];
    if (!e.playable || e.cat === 'lease') continue;
    const left = provincesOf(s, data, id).filter(p => data.geo.prov[p].a3 === id || W.owner[p] === id);
    if (!left.length) continue;
    const totPop = all.reduce((a, p) => a + (data.geo.prov[p].pop || 0), 0) || 1;
    const share = clamp(left.reduce((a, p) => a + (data.geo.prov[p].pop || 0), 0) / totPop, 0.02, 1.5);
    const st = aiStats(e, share);
    W.c[id] = { id, ...st, share, lost: 1 - share, ax: profileAxes(e.profile), dep: !['sovereign', 'partially_recognized'].includes(e.cat), parent: e.parent, aggr: 0, nego: 40 + (e.profile?.liberty ?? 50) / 3, mobil: false, debt: BY_INCOME.debt[incomeIdx(e)] };
  }
  // Remove ex-membros totalmente absorvidos das organizações; o jogador entra nas do cenário.
  for (const o in W.orgs) {
    W.orgs[o].members = W.orgs[o].members.filter(m => W.c[m]);
    W.orgs[o].suspended = W.orgs[o].suspended.filter(m => W.c[m]);
  }
  const keep = scen?.keepOrgs && ts.comps[0] ? data.wOrgs.filter(o => o.members.includes(ts.comps[0].id)).map(o => o.id) : [];
  const unAll = ts.comps.every(c => data.wOrgById.UN.members.includes(c.id));
  const startOrgs = new Set([...(scen?.orgs || []), ...keep, ...(unAll ? ['UN'] : [])]);
  for (const o of startOrgs) if (W.orgs[o] && !W.orgs[o].members.includes(PLY)) W.orgs[o].members.push(PLY);
  s.orgs = Object.fromEntries([...startOrgs].filter(o => W.orgs[o]).map(o => [o, { since: 0, warn: 0 }]));

  // Reivindicações: banco de dados + as geradas pela composição territorial.
  for (const c of db.claims) {
    const tp = [...(c.target.provinces || []), ...(c.target.entities || []).flatMap(e => data.geo.byCountry[e] || [])];
    W.claims.push({ ...c, provs: tp, src: 'db' });
  }
  for (const c of ts.comps) if (!c.full && W.c[c.id]) W.claims.push({ id: 'lost_' + c.id, claimant: c.id, holder: PLY, provs: c.pids, type: 'irredentist', just: `${data.reg[c.id].name} considera ilegítima a separação de ${c.pids.length} província(s).`, strat: 60, dom: 85, risk: 70, status: 'active', src: 'generated' });
  for (const x of scen?.claimsAgainst || []) {
    const tp = [...(x.provinces || []), ...(x.entities || []).flatMap(e => data.geo.byCountry[e] || [])];
    W.claims.push({ id: 'scen_' + x.claimant + '_' + W.claims.length, claimant: x.claimant, holder: PLY, provs: tp, type: x.type || 'irredentist', just: 'Reivindicação criada pelo cenário.', strat: 60, dom: 80, risk: 65, status: 'active', src: 'scenario' });
  }
  // Reivindicações do próprio jogador definidas pelo cenário (terras "irredentas" a conquistar).
  for (const x of scen?.claimsBy || []) {
    const tp = [...(x.provinces || []), ...(x.entities || []).flatMap(e => data.geo.byCountry[e] || [])].filter(p => W.owner[p] !== PLY && data.geo.prov[p]);
    if (tp.length && W.c[x.holder]) W.claims.push({ id: 'own_' + x.holder + '_' + W.claims.length, claimant: PLY, holder: x.holder, provs: tp, type: 'irredentist', just: x.just || 'Território reivindicado pelo cenário.', strat: 60, dom: 85, risk: 70, status: 'active', src: 'scenario' });
  }

  // Relações iniciais do jogador com cada país.
  s.partners = {};
  const nb = playerNeighbors(s, data);
  const ax = s.nation.ideology?.axes;
  for (const id in W.c) {
    const e = data.reg[id], ai = W.c[id];
    let inh = 0, wsum = 0, trust = 0, econ = 0, mil = 0, minRel = 0;
    for (const c of ts.comps) {
      if (c.id === id) continue;
      const r = relRecordInh(data, id, c.id);
      const w = c.pop / Math.max(1, ts.pop);
      if (r) { inh += r.s * w; trust += r.tr * w; econ += r.ec * w; mil += r.mi * w; wsum += w; minRel = Math.min(minRel, r.s); }
    }
    let rel = inh + minRel * 0.35 + affinity(ax, e.profile) * 22 - (nb.has(id) ? 3 : 0);
    // Um novo Estado bem maior que seus antecessores alarma vizinhos sem afinidade.
    if (nb.has(id) && ts.comps.length >= 3 && ts.pop > 2.2 * ts.comps[0].pop && affinity(ax, e.profile) < 0.35) rel -= 8;
    const lost = ts.comps.find(c => c.id === id);
    if (lost) rel -= 45 + 30 * lost.share;
    if (W.claims.some(c => c.claimant === id && c.holder === PLY && c.src !== 'db')) rel -= 10;
    if (W.claims.some(c => c.claimant === id && c.provs.some(p => W.owner[p] === PLY))) rel -= 15;
    for (const o of startOrgs) if (W.orgs[o]?.members.includes(id)) rel += 3;
    const ovr = scen?.rel || {};
    rel += ovr[id] || 0;
    const bloc = e.profile?.align;
    if (ovr.west && ['W', 'WL'].includes(bloc)) rel += ovr.west * (bloc === 'W' ? 1 : 0.5);
    if (ovr.east && ['E', 'EL'].includes(bloc)) rel += ovr.east * (bloc === 'E' ? 1 : 0.5);
    if (ovr.all) rel += ovr.all;
    if (ovr.neighbors && nb.has(id)) rel += ovr.neighbors;
    for (const k of s.nation.identityRel || []) rel += relFromIdentity(k, e, nb.has(id));
    if (s.nation.worldHostile === 'friendly') rel += 12; else if (s.nation.worldHostile === 'hostile') rel -= 10 + (affinity(ax, e.profile) < 0.3 ? 14 : 0);
    s.partners[id] = { rel: clamp(rel, -95, 95), trust: clamp(wsum ? trust / wsum : 40, 0, 100), trade: wsum > 0 && econ / Math.max(wsum, 1e-9) > 60 && rel > 15, pact: false, sanctionsOn: false, sanctionsBy: false, broken: false, cd: {} };
    if (scen?.keepOrgs && ts.comps[0]) {
      const r = relRecord(data, id, ts.comps[0].id);
      if (r?.tre?.length && r.mi >= 70) s.partners[id].pact = true;
      if (r?.ec >= 55) s.partners[id].trade = true;
    }
    ai.aggr = clamp(W.claims.filter(c => c.claimant === id && c.holder === PLY).length * 25 + (lost ? 30 : 0), 0, 100);
  }
  for (const w of db.wars || []) if (W.c[w.a] && W.c[w.b]) W.wars.push({ id: 'ai_' + w.a + '_' + w.b, ai: true, a: [w.a], b: [w.b], since: 0, front: 0, note: w.note, active: true });
  // Guerras do mundo-base em que o jogador absorveu um dos lados deixam de existir.
}

function relFromIdentity(k, e, isNb) {
  const al = e.profile?.align;
  if (k.west) return ['W', 'WL'].includes(al) ? k.west * (al === 'W' ? 1 : 0.5) : 0;
  if (k.east) return ['E', 'EL'].includes(al) ? k.east * (al === 'E' ? 1 : 0.5) : 0;
  if (k.all) return k.all;
  if (k.neighbors) return isNb ? k.neighbors : 0;
  return 0;
}

export function playerNeighbors(s, data) {
  if (s.world._nb) return s.world._nb;
  const mine = new Set(provincesOf(s, data, PLY)), out = new Set();
  const comps = new Set();
  for (const pid of mine) {
    comps.add(data.geo.prov[pid].a3);
    for (const n of data.geo.prov[pid].nb) if (!mine.has(n)) out.add(ownerOf(s, data, n));
  }
  for (const c of comps) for (const x of data.geo.countries[c]?.sea || []) if (isAlive(s, data, x)) out.add(x);
  out.delete(PLY);
  s.world._nb = out;
  return out;
}

// Relação entre dois países de IA: base documentada + afinidade ideológica + alterações da campanha.
export function relAI(s, data, a, b) {
  if (a === PLY) return s.partners[b]?.rel ?? 0;
  if (b === PLY) return s.partners[a]?.rel ?? 0;
  const r = relRecord(data, a, b);
  let v = r ? r.s : 0;
  if (!r) {
    // Nações do mundo customizado e Estados novos herdam (atenuada) a diplomacia do país de origem; a ideologia pesa forte.
    const ea = entOf(s, data, a), eb = entOf(s, data, b);
    const oa = ea?.origin || ea?.secededFrom || a, ob = eb?.origin || eb?.secededFrom || b;
    const ir = (oa !== a || ob !== b) && oa !== ob ? relRecord(data, oa, ob) : null;
    if (ir) v = ir.s * 0.6;
    if (ea?.nb?.includes(b)) v -= 2;
    if (ea?.profile && eb?.profile) v += ideoRel(ea.profile, eb.profile, s);
    if (ea?.parent === b || eb?.parent === a) v = 60;
  } else if (s.world.ents?.[a]?.profile || s.world.ents?.[b]?.profile) {
    // Regime mudou durante a partida: a afinidade ideológica nova substitui a antiga.
    const pa = entOf(s, data, a)?.profile, pb = entOf(s, data, b)?.profile, pa0 = data.reg[a]?.profile, pb0 = data.reg[b]?.profile;
    if (pa && pb && pa0 && pb0) v += ideoRel(pa, pb, s) - ideoRel(pa0, pb0, s);
  }
  return clamp(v + (s.world.rel[pairKey(a, b)] || 0), -100, 100);
}
export function shiftRelAI(s, a, b, d) { const k = pairKey(a, b); s.world.rel[k] = clamp((s.world.rel[k] || 0) + d, -150, 150); }

export function orgMembers(s, id) { return s.world.orgs[id]?.members || s.world.blocs.find(b => b.id === id)?.members || []; }
export function sharedOrgs(s, data, a, b) {
  const out = [];
  for (const o in s.world.orgs) { const m = s.world.orgs[o].members; if (m.includes(a) && m.includes(b)) out.push(o); }
  for (const bl of s.world.blocs) if (bl.members.includes(a) && bl.members.includes(b)) out.push(bl.id);
  return out;
}
export function defenseAllies(s, data, id) {
  const out = new Set();
  for (const o of data.wOrgs) if (o.kind === 'collective' && s.world.orgs[o.id]?.members.includes(id)) for (const m of s.world.orgs[o.id].members) out.add(m);
  for (const bl of s.world.blocs) if (bl.defense === 'collective' && bl.members.includes(id)) for (const m of bl.members) out.add(m);
  if (id === PLY) { for (const k in s.partners) if (s.partners[k].pact) out.add(k); }
  else if (s.partners[id]?.pact) out.add(PLY);
  out.delete(id);
  return out;
}

// ---------- Rodada semanal do mundo ----------
export function weeklyWorld(s, data, ctx) {
  const W = s.world;
  for (const id in W.c) {
    const c = W.c[id];
    const war = W.wars.some(w => w.active && (w.a.includes(id) || w.b.includes(id)));
    const sancN = W.sanc ? Object.keys(W.sanc).filter(k => k.endsWith('>' + id)).length : 0;
    c.gdp *= 1 + (c.growth - (war ? 3 : 0) - (s.partners[id]?.sanctionsOn ? 1.5 : 0) - Math.min(3, sancN * 0.5)) / 100 / 52;
    c.pop *= 1 + 0.009 / 52;
    c.stab = clamp(c.stab + ((war ? 45 : 62) - c.stab) * 0.02 + rand(-0.6, 0.6), 5, 95);
    const mi = entOf(s, data, id)?.profile?.milIntensity ?? 0.6;
    c.ready = clamp(c.ready + ((c.mobil ? 80 : 30 + mi * 15) - c.ready) * 0.03, 5, 95);
    c.troops = Math.max(1, c.troops + (c.pop * 3 * mi * (c.mobil ? 1.6 : 1) - c.troops) * 0.02);
  }
  aiWars(s, data, ctx);
  loansWeekly(s, data, ctx);
  const actors = relevantActors(s, data);
  let cards = 0;
  const hot = (W.tension || 0) > 60 || W.wars.filter(w => w.active && w.ai).length >= 3;
  for (const id of actors) {
    if (cards >= (W.chaos ? 2 : 1) + (hot ? 1 : 0) && chance(0.7)) continue;
    const r = aiDecide(s, data, id, ctx);
    if (r === 'card') cards++;
  }
}

function relevantActors(s, data) {
  const W = s.world, set = new Set(playerNeighbors(s, data));
  const powers = Object.values(W.c).filter(c => !c.dep).sort((a, b) => aiPower(b) - aiPower(a)).slice(0, 15).map(c => c.id);
  powers.forEach(x => set.add(x));
  for (const id in s.partners) if (Math.abs(s.partners[id].rel) > 45 && W.c[id]) set.add(id);
  const all = Object.keys(W.c).filter(id => !W.c[id].dep);
  for (let i = 0; i < 4; i++) set.add(all[Math.floor(random() * all.length)]);
  return [...set].filter(id => W.c[id] && !W.c[id].dep).sort(() => random() - 0.5).slice(0, 18);
}

function aiDecide(s, data, id, ctx) {
  const W = s.world, c = W.c[id], p = s.partners[id], e = entOf(s, data, id), nm = e?.name || id;
  if (!e) return;
  if (!p || p.broken) return;
  if (s.flags.micronation || s.spectator) return; // Bir Tawil: ninguém quer se aproximar, nem ameaçar
  const cd = W.cd[id] ||= {};
  const day = ctx.day;
  const ready = k => (cd[k] || 0) - (W.chaos ? 60 : 0) <= day;
  const CH = W.chaos ? 1.7 : 1;
  const myPow = ctx.playerPower, theirPow = aiPower(c);
  const nb = playerNeighbors(s, data).has(id);
  const atWarWithMe = s.wars.some(w => w.active && w.enemy === id);
  const claims = W.claims.filter(x => x.claimant === id && x.provs.some(pp => ownerOf(s, data, pp) === PLY) && x.status !== 'resolved');
  const libertyGap = (e.profile?.liberty ?? 50) - ((s.st.civil + s.st.political) / 2);
  const opts = [];
  const add = (k, w, fn) => { if (w > 0 && ready(k)) opts.push({ k, w, fn }); };

  add('trade', !p.trade && !p.sanctionsBy && !p.sanctionsOn && p.rel > 18 ? (p.rel - 15) / 40 : 0, () => {
    ctx.card(offerCard('trade', id, nm, { title: `${nm} propõe um acordo comercial`, desc: `O governo de ${nm} oferece reduzir tarifas mutuamente e abrir mercados.`, context: `Relação atual: ${Math.round(p.rel)}. Acordos ampliam exportações e importações.` }));
    cd.trade = day + 120; return 'card';
  });
  add('aid', p.rel > 25 && (c.stab < 45 || incomeIdx(e) >= 3) && s.econ.treasury > s.econ.gdp * 0.01 && s.econ.gdp > 5 ? 0.25 : 0, () => {
    const amt = +(Math.max(0.05, c.gdp * 0.01)).toFixed(2);
    ctx.card(offerCard('aid', id, nm, { amt, title: `${nm} pede assistência financeira`, desc: `${nm} enfrenta dificuldades e pede ${amt} bi para estabilizar suas contas.`, context: 'Um empréstimo rende juros mas pode não ser pago; uma doação compra influência.' }));
    cd.aid = day + 180; return 'card';
  });
  add('arms', (e.profile?.milIntensity ?? 0) >= 1.3 && c.gdp > 100 && p.rel > 15 && !atWarWithMe ? 0.2 : 0, () => {
    ctx.card(offerCard('arms', id, nm, { title: `${nm} oferece um pacote de armamentos`, desc: `A indústria de defesa de ${nm} oferece blindados, mísseis e treinamento com desconto.`, context: 'Melhora equipamentos imediatamente; aproxima você do fornecedor e afasta seus rivais.' }));
    cd.arms = day + 240; return 'card';
  });
  add('summit', p.rel > -45 && p.rel < 10 && c.nego > 50 && !atWarWithMe ? 0.18 : 0, () => {
    ctx.card(offerCard('summit', id, nm, { title: `${nm} propõe uma cúpula de reaproximação`, desc: `Diplomatas de ${nm} sugerem um encontro de alto nível para reduzir tensões.`, context: 'Aceitar melhora as relações; recusar mantém sua posição intacta.' }));
    cd.summit = day + 200; return 'card';
  });
  add('ready', nb && p.rel < -35 && !c.mobil ? 0.3 : 0, () => {
    c.ready = clamp(c.ready + 8, 0, 95); ctx.news(`${nm} eleva a prontidão militar na fronteira.`, 'warn'); cd.ready = day + 60;
  });
  add('opposition', p.rel < -35 && libertyGap > 25 ? 0.25 : 0, () => {
    s.longMods.push({ k: 'opposition', v: 4, d: 120, left: 120, src: 'Apoio estrangeiro à oposição' }, { k: 'revoRisk', v: 3, d: 120, left: 120, src: 'Apoio estrangeiro à oposição' });
    if (chance(0.3 + s.st.intel / 200)) ctx.news(`Inteligência descobre que ${nm} financia grupos de oposição.`, 'bad'); cd.opposition = day + 150;
  });
  add('coup', p.rel < -60 && s.st.coupRisk > 30 && theirPow > myPow * 0.8 ? 0.12 : 0, () => {
    s.longMods.push({ k: 'coupRisk', v: 7, d: 90, left: 90, src: 'Conspiração estrangeira' });
    if (chance(0.25 + s.st.intel / 200)) ctx.news(`Oficiais presos acusados de conspirar com agentes de ${nm}.`, 'bad'); cd.coup = day + 300;
  });
  add('separatism', nb && p.rel < -45 && s.st.separatism > 15 ? 0.15 : 0, () => {
    s.longMods.push({ k: 'separatism', v: 5, d: 150, left: 150, src: `Apoio de ${nm} a separatistas` });
    ctx.news(`Separatistas recebem armas contrabandeadas de ${nm}.`, 'bad'); cd.separatism = day + 200;
  });
  add('ultimatum', claims.length && nb && day > (W.chaos ? 45 : 90) && p.rel < (W.chaos ? -35 : -45) && theirPow > myPow * (W.chaos && c.expansionist ? 0.9 : 1.15) && !atWarWithMe && s.wars.filter(w => w.active).length < 2 ? (s.wars.some(w => w.active) ? 0.5 : 1) * (0.2 + c.aggr / 300) * (s.nation.nuclear && !c.nuclear ? 0.2 : 1) : 0, () => {
    const cl = claims[0];
    const held = cl.provs.filter(pp => ownerOf(s, data, pp) === PLY).length, full = held >= provincesOf(s, data, PLY).length * 0.9;
    ctx.card(offerCard('ultimatum', id, nm, { claim: cl.id, full, title: `Ultimato de ${nm}`, desc: `${nm} exige a devolução de ${cl.provs.filter(pp => ownerOf(s, data, pp) === PLY).map(pp => data.geo.prov[pp].n).slice(0, 4).join(', ')}. ${cl.just || ''}`, context: `O poder militar de ${nm} é ${(theirPow / Math.max(0.1, myPow)).toFixed(1)}× o seu. Recusar pode levar à guerra.`, crisis: true }));
    cd.ultimatum = day + 365; return 'card';
  });
  add('war', claims.length && nb && p.rel < (W.chaos ? -50 : -65) && theirPow > myPow * (W.chaos && c.expansionist ? 1.05 : 1.35) && !atWarWithMe && s.wars.filter(w => w.active).length < 2 && (s.flags['ultimatum_' + id] || 0) > 0 && !(s.nation.nuclear && !c.nuclear) ? (s.wars.some(w => w.active) ? 0.12 : 0.25) : 0, () => {
    ctx.declareWarOnPlayer(id, claims[0]); cd.war = day + 400;
  });
  add('peace', atWarWithMe && c.nego > 35 ? 0.15 : 0, () => { ctx.peaceOffer(id); cd.peace = day + 60; return 'card'; });
  add('warmup', p.rel > 10 && p.rel < 60 && affinity(s.nation.ideology?.axes, e.profile) > 0.2 ? 0.2 : 0, () => {
    p.rel = clamp(p.rel + 3, -100, 100); ctx.news(`${nm} elogia publicamente o governo de ${s.nation.shortName}.`, 'good'); cd.warmup = day + 120;
  });
  if (!opts.length) return;
  const tot = opts.reduce((a, o) => a + o.w, 0);
  if (!chance(Math.min(W.chaos ? 0.75 : 0.5, tot * 0.6 * CH))) return;
  let r = random() * tot;
  for (const o of opts) { r -= o.w; if (r <= 0) return o.fn(); }
}

function offerCard(kind, id, nm, x) {
  const T = {
    trade: [{ text: 'Assinar o acordo.', hint: 'Mais comércio; concorrência para a indústria local.', act: { type: 'trade', id } }, { text: 'Recusar educadamente.', hint: 'Mantém a proteção ao mercado interno.', rel: { [id]: -3 } }],
    aid: [{ text: `Emprestar ${x.amt} bi a 6% ao ano.`, hint: 'Juros e influência; risco de calote.', act: { type: 'lend', id, amt: x.amt, rate: 6 } }, { text: `Doar ${x.amt} bi.`, hint: 'Gasto do tesouro; grande melhora de relação e prestígio.', act: { type: 'grant', id, amt: x.amt } }, { text: 'Recusar.', hint: 'Sem custo; o pedinte se ressente.', rel: { [id]: -6 } }],
    arms: [{ text: 'Comprar o pacote (0,3% do PIB).', hint: 'Equipamentos +6; rivais do fornecedor reagem.', act: { type: 'arms', id } }, { text: 'Recusar.', hint: 'Sem custo.', rel: { [id]: -2 } }],
    summit: [{ text: 'Aceitar a cúpula.', hint: 'Relação melhora bastante.', act: { type: 'summit', id } }, { text: 'Recusar.', hint: 'Nada muda.', rel: { [id]: -2 } }],
    ultimatum: [{ text: 'Ceder as províncias exigidas.', hint: 'Evita a guerra; humilhação e perda de território.', act: { type: 'cede', id, claim: x.claim } }, { text: 'Oferecer autonomia e negociação.', hint: 'Ganha tempo; pode não satisfazer o rival.', act: { type: 'negotiateClaim', id, claim: x.claim } }, { text: 'Rejeitar o ultimato.', hint: 'Orgulho nacional; risco real de invasão.', act: { type: 'rejectUltimatum', id } }],
  };
  if (kind === 'ultimatum' && x.full) { T.ultimatum = T.ultimatum.slice(1); x.desc = `${nm} exige que ${x.nmP || 'o país'} volte a fazer parte de seu território e ameaça usar a força.`; }
  return { id: `dyn_${kind}_${id}_${Math.floor(random() * 1e6)}`, dyn: true, cat: kind === 'ultimatum' ? 'Crise internacional' : 'Diplomacia', title: x.title, desc: x.desc, context: x.context, crisis: !!x.crisis, deadline: x.crisis ? 7 : 14, default: T[kind].length - 1, options: T[kind] };
}

// ---------- Guerras entre países de IA ----------
function aiWars(s, data, ctx) {
  const W = s.world;
  for (const w of W.wars) {
    if (!w.active || !w.ai) continue;
    const A = w.a.map(i => W.c[i]).filter(Boolean), B = w.b.map(i => W.c[i]).filter(Boolean);
    if (!A.length || !B.length) { w.active = false; continue; }
    const pa = A.reduce((t, c) => t + aiPower(c), 0) * (1 + (w.supportA || 0)), pb = B.reduce((t, c) => t + aiPower(c), 0) * 1.15 * (1 + (w.supportB || 0));
    w.ratio = pa / Math.max(0.1, pb);
    w.front = clamp((w.front || 0) + clamp((w.ratio - 1) * 1.2, -1.5, 1.5) + rand(-1, 1), -100, 100);
    for (const c of [...A, ...B]) { c.troops *= 0.999; c.stab = clamp(c.stab - 0.08, 5, 95); }
    w.supportA = (w.supportA || 0) * 0.95; w.supportB = (w.supportB || 0) * 0.95;
    if (Math.abs(w.front) > 95 || chance(0.002 + (ctx.day - (w.since || 0)) / 400000)) {
      w.active = false;
      const winner = w.front > 0 ? A[0] : B[0], loser = w.front > 0 ? B[0] : A[0];
      if (Math.abs(w.front) > 95) {
        const le = entOf(s, data, loser.id), all = provincesOf(s, data, loser.id);
        // Secessão esmagada (ou Estado pequeno engolido): o vencedor fica com tudo.
        if (le?.secededFrom === winner.id || all.length <= (W.chaos ? 3 : 1)) {
          for (const pid of all) setOwner(s, data, pid, winner.id);
          winner.pop += loser.pop; winner.gdp += loser.gdp; delete W.c[loser.id];
          ctx.news(le?.secededFrom === winner.id ? `${nmOf(s, data, winner.id)} esmaga a secessão: ${le.name} deixa de existir.` : `${nmOf(s, data, winner.id)} anexa ${nmOf(s, data, loser.id)} inteiro.`, 'war');
        } else {
          const lp = all.filter(pid => data.geo.prov[pid].nb.some(n => ownerOf(s, data, n) === winner.id)).slice(0, W.chaos ? 4 : 2);
          for (const pid of lp) setOwner(s, data, pid, winner.id);
          ctx.news(`${nmOf(s, data, winner.id)} vence a guerra contra ${nmOf(s, data, loser.id)} e anexa ${lp.length} província(s).`, 'war');
        }
      } else {
        if (entOf(s, data, w.b[0])?.secededFrom === w.a[0] && W.c[w.b[0]]) { ctx.news(`Cessar-fogo: ${nmOf(s, data, w.b[0])} sobrevive como Estado de fato.`, 'info'); }
        else ctx.news(`Cessar-fogo entre ${nmOf(s, data, w.a[0])} e ${nmOf(s, data, w.b[0])}.`, 'info');
      }
    }
  }
  if (chance(W.chaos ? 0.04 : 0.01)) {
    const pairs = W.claims.filter(c => c.src === 'db' && c.status === 'active' && c.risk >= (W.chaos ? 50 : 70) && W.c[c.claimant] && W.c[c.holder] && c.holder !== PLY);
    const c = pairs[Math.floor(random() * pairs.length)];
    if (c && !W.wars.some(w => w.active && [...w.a, ...w.b].includes(c.claimant)) && relAI(s, data, c.claimant, c.holder) < (W.chaos ? -20 : -40)) {
      W.wars.push({ id: 'ai_' + c.claimant + '_' + c.holder + '_' + ctx.day, ai: true, a: [c.claimant], b: [c.holder], since: ctx.day, front: 0, active: true, note: c.just });
      ctx.news(`Guerra! ${nmOf(s, data, c.claimant)} ataca ${nmOf(s, data, c.holder)} por causa de: ${c.just}`, 'war');
      ctx.onAiWar?.(W.wars.at(-1));
    }
  }
}

// ---------- Empréstimos ----------
export function addLoan(s, l) { s.world.loans.push({ id: 'ln' + s.world.loans.length + '_' + Math.floor(random() * 1e5), paid: 0, missed: 0, status: 'active', ...l }); }
function loansWeekly(s, data, ctx) {
  for (const l of s.world.loans) {
    if (l.status !== 'active') continue;
    const due = l.principal * (l.rate / 100 / 52) + l.principal / l.weeks;
    if (l.borrower === PLY) {
      s.econ.treasury -= due; l.paid += due; l.remaining = Math.max(0, (l.remaining ?? l.principal) - l.principal / l.weeks);
    } else {
      const c = s.world.c[l.borrower];
      const pDefault = c ? clamp((50 - c.stab) / 3000 + (s.partners[l.borrower]?.rel < 0 ? 0.004 : 0), 0, 0.03) : 0.05;
      if (chance(pDefault)) { l.missed++; if (l.missed >= 3) { l.status = 'default'; ctx.news(`${nmOf(s, data, l.borrower) || l.borrower} deu calote no empréstimo de ${l.principal.toFixed(2)} bi.`, 'bad'); if (s.partners[l.borrower]) s.partners[l.borrower].rel -= 10; } continue; }
      s.econ.treasury += due; l.paid += due; l.remaining = Math.max(0, (l.remaining ?? l.principal) - l.principal / l.weeks);
    }
    if ((l.remaining ?? 1) <= 1e-6) { l.status = 'repaid'; ctx.news(`Empréstimo ${l.borrower === PLY ? 'quitado' : 'recebido integralmente de ' + (data.reg[l.borrower]?.name || '')}.`, 'good'); }
  }
}

// ---------- Rankings ----------
const RANKS = {
  gdp: ['Maiores economias', 'bi', true], gdppc: ['PIB per capita', '', true], growth: ['Crescimento econômico', '%', true], military: ['Poder militar', '', true],
  authoritarian: ['Governos mais autoritários', '', true], liberty: ['Maiores liberdades civis', '', true], pop: ['Maiores populações', 'mi', true], poverty: ['Menor pobreza', '%', false],
  inequality: ['Maior desigualdade', '', true], influence: ['Países mais influentes', '', true], network: ['Maiores redes diplomáticas', '', true], area: ['Maior território', 'km²', true],
  approval: ['Maior aprovação pública', '', true], debt: ['Mais endividados', '% PIB', true],
};
export const RANK_INFO = RANKS;
const INEQ = { south_america: 50, central_america: 50, caribbean: 45, sub_saharan_africa: 47, north_africa: 35, middle_east: 38, europe: 30, eastern_europe: 33, balkans: 33, caucasus: 36, central_asia: 34, south_asia: 35, east_asia: 36, southeast_asia: 38, north_america: 40, oceania: 34, other: 35 };
export function computeRankings(s, data, player) {
  const W = s.world, rows = [];
  for (const id in W.c) {
    const c = W.c[id], e = entOf(s, data, id);
    if (!e || c.dep || e.cat === 'disputed_area') continue;
    const area = provincesOf(s, data, id).reduce((a, p) => a + data.geo.prov[p].a, 0);
    rows.push({ id, gdp: c.gdp, gdppc: c.gdp * 1e9 / Math.max(1, c.pop * 1e6), growth: c.growth, military: aiPower(c), authoritarian: 100 - (e.profile?.liberty ?? 50), liberty: e.profile?.liberty ?? 50, pop: c.pop,
      poverty: BY_INCOME.poverty[incomeIdx(e)] * (0.8 + hash(id) * 0.4), inequality: (INEQ[e.regions?.[0]] ?? 35) * (0.85 + hash(id + 'i') * 0.3), influence: Math.log10(c.gdp + 1) * 15 + aiPower(c) * 0.6 + orgCount(s, id) * 2,
      network: orgCount(s, id) + (data.ties[id] || 0) + Object.values(s.partners[id]?.pact ? [1] : []).length, area, approval: clamp(30 + c.stab * 0.45 + (hash(id + 'a') - 0.5) * 30, 5, 95), debt: c.debt * (0.6 + hash(id + 'd') * 0.8) });
  }
  if (!s.spectator) rows.push({ id: PLY, ...player, network: orgCount(s, PLY) + Object.values(s.partners).filter(p => p.rel >= 40).length });
  const out = {};
  for (const k in RANKS) {
    const sorted = rows.filter(r => Number.isFinite(r[k])).sort((a, b) => RANKS[k][2] ? b[k] - a[k] : a[k] - b[k]);
    const pos = sorted.findIndex(r => r.id === PLY) + 1;
    out[k] = { top: sorted.slice(0, 10).map(r => [r.id, r[k]]), all: sorted.map(r => [r.id, +(+r[k]).toPrecision(5)]), pos, of: sorted.length, value: player[k] };
    (W.rankHist[k] ||= []).push([s.time.min / 1440 | 0, pos]);
    if (W.rankHist[k].length > 120) W.rankHist[k].shift();
  }
  W.rankings = out;
  return out;
}
// Variação determinística por país para estimativas sem dados (0..1).
export const hash = str => { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };
const orgCount = (s, id) => Object.values(s.world.orgs).filter(o => o.members.includes(id)).length + s.world.blocs.filter(b => b.members.includes(id)).length;
