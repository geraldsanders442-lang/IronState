import { DIFFICULTY, GROUPS, SPEND } from './constants.js';
import { clamp } from './util.js';
import { territoryStats, simProfile, initWorld, PLY, relRecord as relRecordOf } from './world.js';
import { classify } from './ideology.js';
import { SEP_PRIOR } from './cohesion.js';

// Cria uma campanha a partir das províncias escolhidas, das 20 respostas e do cenário.
export function newGame(cfg, data) {
  const scen = data.scenarios.find(x => x.id === cfg.scenario) || data.scenarios[0];
  const pids = cfg.provinces;
  const ts = territoryStats(data, pids);
  const prof = simProfile(ts);
  const diff = DIFFICULTY[cfg.difficulty] || DIFFICULTY.normal;
  const ideology = classify(cfg.answers, data.identity);
  const start = scen.start || {};
  const pop = scen.micro ? Math.max(scen.micro.minPop ?? 0.0003, ts.pop / 1e6) : Math.max(0.02, ts.pop / 1e6);
  const gdppc = clamp(ts.gdppc || 3000, 400, 150000) * (start.gdpMult || 1);
  const gdp = pop * gdppc / 1000;
  const groups = {};
  for (const g in GROUPS) groups[g] = 50 + diff.mood + (g === 'opposition' ? -25 : 0);
  const policies = {};
  for (const p of data.policies) policies[p.id] = p.def;
  const spend = {};
  for (const k in SPEND) spend[k] = SPEND[k].def;
  const capComp = ts.comps.find(c => c.id === scen.capital) || ts.comps[0];
  const capProv = cfg.capitalProv && pids.includes(cfg.capitalProv) ? cfg.capitalProv
    : scen.capitalProv && pids.includes(scen.capitalProv) ? scen.capitalProv
    : pids.includes(data.reg[capComp?.id]?.capital?.prov) ? data.reg[capComp.id].capital.prov
    : pids.reduce((b, p) => (data.geo.prov[p].pop || 0) > (data.geo.prov[b].pop || 0) ? p : b, pids[0]);

  const s = {
    v: 3,
    nation: {
      ...cfg.nation, flag: cfg.flag, worldHostile: cfg.worldHostile || 'ideology', difficulty: cfg.difficulty || 'normal', scenario: scen.id, scenarioName: scen.name, alt: !!scen.alt,
      capital: cfg.nation.capital || (data.reg[capComp?.id]?.capital?.prov === capProv && data.reg[capComp.id].capital.name) || data.geo.prov[capProv].n, capitalProv: capProv,
      area: Math.round(ts.area), coastal: ts.coast, profile: prof, ideology, answers: [...cfg.answers], startGdppc: gdppc,
      components: ts.comps.map(c => ({ id: c.id, name: c.name, share: +c.share.toFixed(3), full: c.full })), sizeClass: ts.sizeClass,
    },
    time: { min: 0 },
    econ: { gdp, pop, treasury: gdp * (diff.treasury + (start.treasury || 0)) / 100, debt: gdp * (ts.debt + (start.debt || 0)) / 100, reserves: gdp * 0.08, printed: 0 },
    st: {
      health: ts.health + (start.health || 0), education: ts.education, inequality: 45, poverty: ts.poverty + (start.poverty || 0), hunger: ts.hunger + (start.hunger || 0),
      qol: 45, civil: 40, political: 30, protest: 25, legitimacy: 55, stability: 58, corruption: ts.corruption, efficiency: ts.efficiency, taxCapacity: 55,
      control: 60 + prof.control, opposition: 30, coupRisk: 20, revoRisk: 18, productivity: 30 + ts.education * 0.4, industry: ts.industry, tech: ts.tech,
      readiness: 40, equipment: 30 + ts.tech * 0.3, logistics: ts.infra * 0.6 + 10, intel: 30, defense: 35, projection: 15, milIndustry: ts.industry * 0.5,
      reputation: 50, influence: 30, growth: 2.5, inflation: 4, unemployment: 9, market: 50, troops: ts.troops, warWeariness: 0, pollution: 30,
      migration: 0, popGrowth: 1.2, crime: 40, housing: 50, congestion: 30, separatism: prof.sep + (start.separatism || 0),
    },
    groups, policies, budget: { tax: 25, spend }, initiatives: {}, longMods: [], flags: {},
    issues: { pending: [], last: {}, answered: 0, ignored: 0, scheduled: [], dyn: {} }, events: { last: {} }, turns: [],
    partners: {}, orgs: {}, regions: [], wars: [], mobilized: 0,
    history: [], reports: [], log: [], decisions: [],
    counters: { lowStab: 0, hyper: 0, costPressure: 0 }, achievements: [], missions: { active: [], done: [], failed: [] }, characters: null,
    over: null, monthStart: null, yearStart: null, settings: { autoPause: true, pauseMonthly: false, popupIssues: true }, sector: {},
  };
  s.regions = buildRegions(data, pids, ts, capProv, start);
  // Propensão histórica a separatismo do território (ver cohesion.js): países coesos começam com regiões bem mais tranquilas.
  { const tot = ts.comps.reduce((a, c) => a + (c.share || 0), 0) || 1, pr = ts.comps.reduce((a, c) => a + (SEP_PRIOR[c.id] ?? 0.7) * (c.share || 0), 0) / tot;
    s.nation.sepPrior = +pr.toFixed(3);
    if (ts.comps.length <= 1) for (const r of s.regions) r.sep = clamp(r.sep * Math.min(1.2, pr * 1.4), 0, 1);
    s.st.separatism = clamp(s.st.separatism * clamp(0.4 + pr * 0.6, 0.4, 1.2), 0, 100); }
  // Rivalidades entre os países unificados viram nacionalismo e separatismo internos.
  let tensionW = 0;
  for (const r of s.regions) {
    const me = ts.comps.find(c => c.id === r.key);
    if (!me) continue;
    let t = 0;
    for (const o of ts.comps) { if (o === me) continue; const rec = relRecordOf(data, r.key, o.id); if (rec && rec.s < 0) t += -rec.s * o.pop / Math.max(1, ts.pop) * 2 + rec.hg * 0.1; }
    t = Math.min(100, t);
    r.tension = Math.round(t);
    if (!r.cap) r.sep = (r.sep || 0) + t / 110;
    r.unrest = Math.min(95, r.unrest + t / (r.cap ? 8 : 4));
    tensionW += t * r.popShare;
  }
  s.st.separatism += tensionW * 0.3;
  s.nation.internalTension = Math.round(tensionW);
  applyIdentity(s, data);
  initWorld(s, data, pids, scen, ts);
  for (const f of start.flags || []) s.flags[f] = 1;
  if (start.stability) s.longMods.push({ k: 'stability', v: start.stability, d: 180, left: 180, src: 'Condições iniciais', id: 'start_stab' });
  if (start.reputation) s.st.reputation += start.reputation;
  if (start.infra) for (const r of s.regions) r.infra = clamp(r.infra + start.infra, 3, 99);
  for (const k of ['readiness', 'equipment', 'defense', 'control', 'corruption', 'legitimacy', 'industry', 'tech', 'intel']) if (start[k]) s.st[k] = clamp(s.st[k] + start[k], 1, 99);
  // Herança militar dos países-base: intensidade militar, porte econômico e arsenal nuclear.
  const milI = ts.comps.reduce((a, c) => a + (data.reg[c.id]?.profile?.milIntensity ?? 0.8) * c.pop, 0) / Math.max(1, ts.pop);
  const lg = Math.max(0, Math.log10(Math.max(1, gdp)) - 2);
  const heritage = { equipment: (milI - 1) * 12 + lg * 6 + (ts.nuclear ? 6 : 0), readiness: (milI - 1) * 10, projection: lg * 13 + (ts.nuclear ? 8 : 0) + (milI - 1) * 6, milIndustry: (milI - 1) * 8 + lg * 5, defense: (milI - 1) * 8 + (ts.nuclear ? 12 : 0), intel: lg * 4 };
  for (const k in heritage) if (Math.abs(heritage[k]) > 0.5) s.longMods.push({ k, v: +heritage[k].toFixed(1), d: 0, left: 0, src: 'Herança militar', id: 'heritage_' + k });
  s.nation.nuclear = ts.nuclear;
  if (diff.risk < 1) s.st.coupRisk -= 6;
  return s;
}

// Aplica os efeitos concretos das 20 respostas.
export function applyIdentity(s, data) {
  const Q = data.identity.questions;
  s.nation.identityRel = [];
  Q.forEach((q, i) => {
    const a = q.a[s.nation.answers[i]];
    if (!a) return;
    for (const p in a.pol || {}) s.policies[p] = a.pol[p];
    for (const k in a.bud || {}) { if (k === 'tax') s.budget.tax = a.bud.tax; else s.budget.spend[k] = a.bud[k]; }
    for (const k in a.mods || {}) s.longMods.push({ k, v: a.mods[k], d: 0, left: 0, src: 'Identidade: ' + q.topic, id: 'id_' + q.id + '_' + k });
    for (const k in a.gi || {}) s.longMods.push({ k: 'gi_' + k, v: a.gi[k], d: 0, left: 0, src: 'Identidade: ' + q.topic, id: 'id_' + q.id + '_gi_' + k });
    for (const g in a.grp || {}) s.groups[g] = clamp(s.groups[g] + a.grp[g], 0, 100);
    for (const k in a.st || {}) if (k === 'treasury') s.econ.treasury += s.econ.gdp * a.st[k] / 100;
    for (const f of a.flags || []) s.flags[f] = 1;
    for (const k in a.rel || {}) s.nation.identityRel.push({ [k]: a.rel[k] });
  });
  const ax = s.nation.ideology.axes;
  // Os eixos também deslocam diretamente as metas institucionais.
  s.longMods.push(
    { k: 'civil', v: -ax.auth * 0.12, d: 0, left: 0, src: 'Identidade', id: 'id_ax_civil' },
    { k: 'political', v: -ax.auth * 0.1, d: 0, left: 0, src: 'Identidade', id: 'id_ax_pol' },
    { k: 'market', v: ax.econ * 0.15, d: 0, left: 0, src: 'Identidade', id: 'id_ax_mkt' },
    { k: 'control', v: ax.central * 0.04 + ax.auth * 0.04, d: 0, left: 0, src: 'Identidade', id: 'id_ax_ctrl' },
    { k: 'g_military', v: ax.mil * 0.08, d: 0, left: 0, src: 'Identidade', id: 'id_ax_mil' },
    { k: 'tech', v: ax.tech * 0.04, d: 0, left: 0, src: 'Identidade', id: 'id_ax_tech' },
  );
}

const INC_INFRA = { '1. High income: OECD': 72, '2. High income: nonOECD': 64, '3. Upper middle income': 50, '4. Lower middle income': 35, '5. Low income': 22 };
export function buildRegions(data, pids, ts, capProv, start = {}) {
  const P = data.geo.prov;
  let groups;
  const big = ts.comps.filter(c => c.pop / Math.max(1, ts.pop) > 0.04 || c.pids.length > 3);
  if (big.length >= 2) {
    groups = big.slice(0, 8).map(c => ({ key: c.id, name: c.name, pids: [...c.pids] }));
    const rest = ts.comps.filter(c => !big.slice(0, 8).includes(c)).flatMap(c => c.pids);
    if (rest.length) groups.push({ key: 'OUT', name: 'Territórios menores', pids: rest });
  } else {
    const k = Math.min(5, Math.max(1, Math.round(Math.log2(pids.length + 1))));
    const pts = pids.map(p => P[p].c);
    let cent = [P[capProv].c, ...pts.filter((_, i) => i % Math.max(1, Math.floor(pts.length / k)) === 1)].slice(0, k);
    let asg = [];
    for (let it = 0; it < 10; it++) {
      asg = pts.map(p => cent.reduce((b, c, j) => (Math.hypot(p[0] - c[0], p[1] - c[1]) < Math.hypot(p[0] - cent[b][0], p[1] - cent[b][1]) ? j : b), 0));
      cent = cent.map((c, j) => { const m = pts.filter((_, i) => asg[i] === j); return m.length ? [m.reduce((a, p) => a + p[0], 0) / m.length, m.reduce((a, p) => a + p[1], 0) / m.length] : c; });
    }
    groups = cent.map((_, j) => ({ key: 'R' + j, pids: pids.filter((_, i) => asg[i] === j) })).filter(g => g.pids.length);
    groups.forEach(g => { const main = g.pids.reduce((b, p) => (P[p].pop || 0) > (P[b].pop || 0) ? p : b, g.pids[0]); g.name = `Região de ${P[main].n}`; });
  }
  const totPop = pids.reduce((a, p) => a + (P[p].pop || 0), 0) || 1;
  const capKey = groups.find(g => g.pids.includes(capProv))?.key;
  const unrestIn = new Set(start.unrestIn || []);
  return groups.map((g, i) => {
    const gp = g.pids.reduce((a, p) => a + (P[p].pop || 0), 0);
    const inc = INC_INFRA[data.reg[ts.comps.find(c => c.id === g.key)?.id || P[g.pids[0]].a3]?.income] ?? ts.infra;
    const cap = g.key === capKey;
    const sepBase = big.length >= 2 && !cap ? 0.6 : (!cap && i === groups.length - 1 ? 0.3 : 0.1);
    return {
      id: 'r' + i, key: g.key, name: g.name, provinces: g.pids, popShare: gp / totPop, cap,
      urban: cap ? 75 : 45, infra: clamp(inc + (cap ? 10 : -4), 5, 95), housing: 50, pollution: 25, unrest: 25 + (unrestIn.has(g.key) ? 30 : 0), invest: Math.round(100 / groups.length),
      industryShare: 1 / groups.length, sep: sepBase + (unrestIn.has(g.key) ? 0.4 : 0),
    };
  });
}

// Reatribui províncias às regiões após mudanças territoriais (anexações, cessões, secessões).
export function syncRegions(s, data, mine) {
  const set = new Set(mine), known = new Set();
  for (const r of s.regions) { r.provinces = r.provinces.filter(p => set.has(p)); r.provinces.forEach(p => known.add(p)); }
  const fresh = mine.filter(p => !known.has(p));
  if (fresh.length) {
    const byC = {};
    for (const p of fresh) (byC[data.geo.cOf[p] || data.geo.prov[p].a3] ||= []).push(p);
    for (const a3 in byC) s.regions.push({ id: 'r' + s.regions.length + '_' + a3, key: a3, name: `Territórios anexados (${data.reg[a3]?.name || a3})`, provinces: byC[a3], popShare: 0, cap: false, urban: 35, infra: 25, housing: 40, pollution: 20, unrest: 75, invest: 5, industryShare: 0.05, sep: 0.9, annexed: true });
  }
  s.regions = s.regions.filter(r => r.provinces.length);
  const pop = r => r.provinces.reduce((a, p) => a + (data.geo.prov[p].pop || 0), 0);
  const tot = s.regions.reduce((a, r) => a + pop(r), 0) || 1;
  for (const r of s.regions) { r.popShare = pop(r) / tot; r.cap = r.provinces.includes(s.nation.capitalProv); }
  const ind = s.regions.reduce((a, r) => a + r.industryShare, 0) || 1;
  for (const r of s.regions) r.industryShare /= ind;
}

export { PLY };
