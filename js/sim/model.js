import { clamp, sat, soft } from './util.js';
import { devGrowth } from './dev.js';
import { GROUPS, SECTORS, DIFFICULTY } from './constants.js';
import { transferAnnual } from './govcore.js';

const DEFAULT_PROFILE = { res: { food: 1, energy: 1, raw: 1 }, resScale: 1, coastal: true, trade: 1, admin: 1, control: 0, sep: 4, market: 0 };
export const prof = s => s.nation.profile || DEFAULT_PROFILE;

const SOFT_RATE = { growth: 2.5, inflation: 6, unemployment: 6, exportAccess: 0.4, importAccess: 0.4, migration: 6, emigration: 6, laborSupply: 3, creditLimit: 0.5 };

export const gdppc = s => s.econ.gdp * 1e9 / (s.econ.pop * 1e6);
export const devF = s => clamp(Math.log10(gdppc(s) / 800) / 2.1, 0, 1);
export const externalDebt = s => (s.world?.loans || []).filter(l => l.borrower === 'PLY' && l.status === 'active').reduce((a, l) => a + (l.remaining ?? l.principal), 0);
export const debtRatio = s => (s.econ.debt + externalDebt(s)) / s.econ.gdp * 100;
export const atWar = s => s.wars.some(w => w.active);

export function efficiencyFactor(s) {
  return clamp((0.5 + s.st.efficiency / 100 * 0.6) * (1 - s.st.corruption / 250), 0.35, 1.15);
}

export function collectMods(s, data) {
  const M = {};
  const add = (obj, mult = 1) => { for (const k in obj) M[k] = (M[k] || 0) + obj[k] * mult; };
  for (const p of data.policies) {
    const lvl = p.levels.find(l => l.id === s.policies[p.id]);
    if (lvl) add(lvl.mods);
  }
  const eff = efficiencyFactor(s);
  for (const id in s.initiatives) {
    const it = s.initiatives[id];
    if (it.status === 'active') add(data.initById[id].effects, eff);
  }
  for (const m of s.longMods) add({ [m.k]: m.v }, m.d > 0 ? Math.min(1, m.left / Math.max(1, m.d * 0.3)) : 1);
  for (const id in s.orgs) { const o = data.wOrgById?.[id] || s.world?.blocs.find(b => b.id === id); if (o) add(o.mods || {}); }
  if (s.mobilized > 0) add({ troopsMult: 0.8, readiness: 10, laborSupply: -1.5, growth: -0.6, g_workers: -4, g_military: 4 });
  for (const k in M) {
    if (k.startsWith('g_')) M[k] = soft(M[k], 30);
    else if (SOFT_RATE[k]) M[k] = soft(M[k], SOFT_RATE[k]);
    else if (!k.startsWith('gi_') && !k.startsWith('s_') && k !== 'troopsMult') M[k] = soft(M[k], 35);
  }
  return M;
}

export function sanctionWeight(s, data) {
  let w = 0;
  for (const id in s.partners) {
    const p = s.partners[id];
    if (!p.sanctionsBy) continue;
    const gd = s.world?.c[id]?.gdp || 0;
    w += gd > 5000 ? 1.4 : gd > 800 ? 0.7 : gd > 100 ? 0.3 : 0.1;
  }
  return w;
}

export function tradeWeight(s, data) {
  let w = 0;
  for (const id in s.partners) {
    const p = s.partners[id];
    if (p.trade && !p.broken && !p.sanctionsBy) { const gd = s.world?.c[id]?.gdp || 0; w += gd > 800 ? 1 : gd > 100 ? 0.5 : 0.2; }
  }
  return w;
}

export function computeSectors(s, data, M) {
  const g = s.econ.gdp, region = prof(s), st = s.st;
  const sw = soft(sanctionWeight(s, data), 2.5) * (1 - (M.sanctionShield || 0));
  const tw = tradeWeight(s, data);
  const isolated = s.policies.foreign === 'isolationist';
  const ex = clamp(0.3 + 0.07 * tw + (M.exportAccess || 0) + (region.trade - 1) * 0.5 + (s.nation.coastal ? 0.05 : -0.05) - sw * 0.1, 0.05, 1);
  const im = clamp(0.55 + 0.05 * tw + (M.importAccess || 0) - sw * 0.1 + Math.min(0.15, s.econ.reserves / g), 0.08, 1);
  const df = devF(s), infra = s.d?.infra ?? 45, base = s.nation.base || { industry: st.industry, tech: st.tech, productivity: st.productivity, infra };
  const rel = (x, b) => (x + 15) / (b + 15);
  const capF = {
    food: 1, energy: Math.pow(rel(infra, base.infra), 0.3), raw: 1,
    industrial: Math.pow(rel(st.industry, base.industry), 0.8) * (0.75 + df * 0.4), tech: Math.pow(rel(st.tech, base.tech), 0.9) * (0.5 + df * 0.8), services: Math.pow(rel(st.productivity, base.productivity), 0.5),
  };
  const out = { rows: {}, exports: 0, imports: 0, short: {}, exAccess: ex, imAccess: im, sanctions: sw, tradeW: tw };
  for (const k in SECTORS) {
    const sc = SECTORS[k];
    const resF = region.res[k] ? Math.pow(region.res[k] * region.resScale, 0.8) : 1;
    const prod = g * sc.share * resF * capF[k] * (1 + (M['s_' + k] || 0) / 100) * (isolated && k !== 'services' ? 1.05 : 1);
    let consF = 1;
    if (k === 'food') consF = 1 + (1 - df) * 0.4;
    if (k === 'energy') consF = 1 + st.industry / 200 - (s.initiatives.renewables?.status === 'active' ? 0.05 : 0);
    const cons = g * sc.cons * consF;
    const net = prod - cons;
    let exp = 0, imp = 0, short = 0;
    if (net > 0) exp = net * ex;
    else { imp = Math.min(-net, cons * im); short = (-net - imp) / cons; }
    out.rows[k] = { prod, cons, exp, imp, short, dep: imp / cons };
    out.short[k] = short;
    out.exports += exp; out.imports += imp;
  }
  out.foodShort = out.short.food;
  out.energyShort = out.short.energy;
  out.otherShort = (out.short.raw + out.short.industrial + out.short.tech) / 3;
  return out;
}

export function interestRate(s) {
  const dr = debtRatio(s) / 100;
  return clamp(2 + Math.max(0, dr - 0.4) * 7 + (60 - s.st.reputation) * 0.05 + Math.max(0, s.st.inflation - 8) * 0.12 + (s.d?.sanctions || 0) * 0.8 + (s.flags.defaulted ? 6 : 0) - (s.orgs.fmg ? 0.8 : 0), 0.5, 35);
}

export function costMultiplier(s) {
  return (1 + s.counters.costPressure) * (1 + s.st.corruption / 200) * (1 + Math.max(0, s.st.inflation - 10) / 100);
}

export function computeBudget(s, data, M, sec) {
  const g = s.econ.gdp, b = s.budget, st = s.st;
  const size = prof(s);
  const laffer = 1 - Math.max(0, b.tax - 35) / 90;
  const rev = {
    tax: g * b.tax / 100 * (0.55 + st.taxCapacity / 200) * (1 - st.corruption / 300) * laffer,
    state: g * Math.max(0, 50 - st.market) * 0.0004,
    tariffs: sec.imports * 0.06,
    other: g * (0.035 + (M.revenue || 0) / 100),
  };
  const exp = {};
  for (const k in b.spend) exp[k] = g * b.spend[k] / 100;
  let upkeep = 0;
  for (const id in s.initiatives) {
    const it = s.initiatives[id];
    if (it.status === 'active') upkeep += data.initById[id].upkeep;
  }
  exp.initiatives = g * upkeep / 100 * (1 + st.corruption / 300);
  exp.interest = s.econ.debt * interestRate(s) / 100;
  exp.war = s.wars.filter(w => w.active).length * g * 0.035 + (s.mobilized > 0 ? g * 0.012 : 0);
  exp.occupation = (s.flags.occupied || 0) * g * 0.008;
  exp.orgs = Object.keys(s.orgs).reduce((a, id) => a + g * ((data.wOrgById?.[id] || s.world?.blocs.find(b => b.id === id))?.fee || 0) / 100, 0);
  exp.sizeOverhead = g * (size.admin - 1) * 0.02;
  // Dotação discricionária: parcela do orçamento reservada ao tesouro para decisões, obras e imprevistos.
  exp.regional = transferAnnual(s);
  exp.discretionary = g * (DIFFICULTY[s.nation?.difficulty]?.discr ?? 0.035) * (0.8 + st.efficiency / 250);
  const revenue = Object.values(rev).reduce((a, v) => a + v, 0);
  const expense = Object.values(exp).reduce((a, v) => a + v, 0);
  return { rev, exp, revenue, expense, balance: revenue - expense };
}

const step = (cur, target, rate) => cur + (target - cur) * rate;

export function computeTargets(s, data, M, sec, bud) {
  const st = s.st, b = s.budget.spend, g = s.econ.gdp, df = devF(s);
  const size = prof(s);
  const m = k => M[k] || 0;
  const war = atWar(s) ? 1 : 0;
  const repression = Math.max(0, m('repression') + b.security * 3);
  const infra = s.d?.infra ?? 45;
  const deficit = -bud.balance / g * 100;
  const printedRatio = s.econ.printed / g * 100;
  const T = {};

  // Sucateamento: gastar abaixo do mínimo necessário (que sobe com o desenvolvimento) cobra caro.
  const need = { health: 2 + df * 1.4, education: 2 + df * 1.2, welfare: 1 + df * 1.9, security: 0.9 + df * 0.4, military: 0.8, admin: 1.4 + df * 0.8, infra: 1.1 + df * 0.6 };
  const U = {}; for (const k in need) U[k] = Math.max(0, need[k] - (b[k] ?? 0)) / need[k];
  s.d && (s.d.under = U);
  T.health = 12 + 45 * sat(b.health, 4) - U.health * 18 + 18 * df + m('health') - st.hunger * 0.2 - st.pollution * 0.05;
  T.education = 8 + 50 * sat(b.education, 4) + 18 * df + m('education') - U.education * 15;
  T.inequality = 42 - 18 * sat(b.welfare, 6) + (st.market - 50) * 0.2 + st.corruption * 0.12 + m('inequality') + (s.d?.regionSpread || 0) * 0.08;
  T.unemployment = 8 - (st.growth - 2) * 0.9 + (60 - st.education) * 0.05 + m('unemployment') + m('laborSupply') + (s.d?.otherShort || 0) * 10;
  T.poverty = 62 + U.welfare * 10 - df * 48 + (st.inequality - 40) * 0.35 - 16 * sat(b.welfare, 6) + (st.unemployment - 6) * 0.6 + Math.max(0, st.inflation - 8) * 0.35 + m('poverty') + war * 3;
  T.hunger = st.poverty * 0.22 + sec.foodShort * 70 + war * 4 + m('hunger') - 4 * sat(b.welfare, 6);
  T.pollution = s.d?.pollution ?? st.pollution;
  T.qol = 0.28 * st.health + 0.22 * st.education + 0.2 * (100 - st.poverty) + 0.12 * infra + 0.08 * (100 - st.pollution) + 0.05 * st.housing + 0.05 * (100 - st.crime) - st.hunger * 0.3 + m('qol') - war * 4;
  T.civil = 45 + m('civil');
  T.political = 32 + m('political');
  T.market = 50 + m('market') - (s.budget.tax - 25) * 0.4 + size.market * 4;
  T.crime = 45 + U.security * 15 - st.control * 0.2 + st.poverty * 0.25 + st.unemployment * 0.4 - 15 * sat(b.security, 2) + m('crime');
  T.housing = 30 + infra * 0.4 + m('housing') - (s.d?.urbanPressure || 0);
  T.congestion = 20 + ((s.regions.find(r => r.cap) || s.regions[0]).urban - 60) * 0.5 + df * 15 - infra * 0.1 + m('congestion');

  const satisf = s.d?.satisfaction ?? 50, support = s.d?.support ?? 50;
  T.protest = (U.health + U.education + U.welfare) * 6 + (100 - satisf) * 0.55 + st.hunger * 0.5 + Math.max(0, st.unemployment - 6) * 0.6 + Math.max(0, st.inflation - 5) * 0.4 + st.political * 0.12 - repression * 0.45 + m('protest') + st.warWeariness * 0.15;
  T.corruption = 46 + U.admin * 12 - 14 * sat(b.admin / size.admin, 3) + (100 - st.political) * 0.12 - (st.civil - 40) * 0.05 + m('corruption');
  T.efficiency = 30 - U.admin * 12 + 30 * sat(b.admin / size.admin, 3) + st.education * 0.2 - st.corruption * 0.25 + m('efficiency');
  T.taxCapacity = 38 + st.efficiency * 0.45 - st.corruption * 0.15 + st.control * 0.1 + m('taxCapacity');
  T.control = 30 - U.security * 10 + 30 * sat(b.security / size.admin, 2) + infra * 0.15 + size.control - st.separatism * 0.2 - st.protest * 0.12 + m('control') + repression * 0.1;
  T.separatism = size.sep + (100 - (s.groups.regional)) * 0.2 + (s.d?.regionSpread || 0) * 0.15 - st.control * 0.1 + m('separatism') + (s.flags.occupied || 0) * 10;
  T.legitimacy = 25 - (U.health + U.education + U.welfare) * 4 + support * 0.5 + st.qol * 0.15 + clamp(st.growth, -5, 6) * 1.5 - st.corruption * 0.15 + m('legitimacy') + (m('propaganda') * Math.max(0, 8 - st.political / 10));
  T.opposition = (100 - support) * 0.5 + st.political * 0.25 + st.civil * 0.1 + m('opposition') - repression * 0.15;
  T.stability = 0.35 * st.legitimacy + 0.25 * st.control + 0.2 * (100 - st.protest) + 0.1 * (100 - st.warWeariness) + 0.1 * (100 - st.revoRisk) + m('stability') - st.separatism * 0.1;

  const gm = s.groups.military, ge = (s.groups.business + s.groups.regional) / 2;
  T.coupRisk = clamp((55 - gm) * 1.1 + (50 - ge) * 0.5 + (50 - st.legitimacy) * 0.5 + 8 - st.intel * 0.15 + m('coupRisk') + (s.flags.lostWar ? 15 : 0), 0, 100);
  T.revoRisk = clamp((55 - satisf) * 0.9 + st.hunger * 0.6 + st.poverty * 0.15 + st.protest * 0.25 + repression * Math.max(0, 50 - satisf) / 60 - st.control * 0.15 + st.opposition * 0.1 + m('revoRisk') + 5, 0, 100);

  T.productivity = 12 - U.infra * 6 - U.education * 4 + st.education * 0.3 + infra * 0.25 + st.tech * 0.2 - st.corruption * 0.08 + m('productivity');
  T.industry = 15 + infra * 0.2 + st.productivity * 0.25 + m('industry') + (st.market < 35 ? 5 : 0);
  T.tech = 5 + st.education * 0.25 + df * 25 + m('tech') - (sec.sanctions > 1 ? 6 : 0);
  T.readiness = 15 + 50 * sat(b.military, 3) + m('readiness') - (st.corruption - 40) * 0.1;
  T.equipment = 15 + 30 * sat(b.military, 3.5) + st.milIndustry * 0.2 + st.tech * 0.1 + m('equipment') - (sec.sanctions > 0.5 ? 4 : 0);
  T.logistics = 10 + infra * 0.45 + m('logistics') - U.infra * 10;
  T.intel = 15 + 15 * sat(b.security, 2) + m('intel');
  T.milIndustry = st.industry * 0.35 + m('milIndustry');
  T.defense = 10 + st.readiness * 0.2 + st.equipment * 0.25 + st.control * 0.1 + m('defense');
  T.projection = 3 + st.equipment * 0.15 + st.logistics * 0.15 + m('projection');
  T.reputation = 42 + (st.civil - 40) * 0.3 + (st.political - 30) * 0.2 - war * (s.wars.some(w => w.active && w.aggressor) ? 18 : 0) - (s.flags.defaulted ? 15 : 0) + m('reputation') - (s.flags.atrocity ? 15 : 0);
  T.influence = 10 + Math.log10(g + 1) * 6 + st.projection * 0.2 + st.reputation * 0.15 + m('influence') + Object.keys(s.orgs).length * 2;
  T.troops = s.econ.pop * (2 + 6 * sat(b.military, 3)) * (1 + (m('troopsMult') || 0));

  T.growth = 1.3 + (st.productivity - 45) * 0.06 + (st.stability - 50) * 0.05 + (st.education - 45) * 0.025 - (st.corruption - 40) * 0.035
    - Math.max(0, s.budget.tax - 30) * 0.08 + (1 - df) * 2.2 + (sec.exports - sec.imports) / g * 4 + (sec.exAccess - 0.4) * 2
    - sec.sanctions * 1.0 - (sec.foodShort + sec.energyShort) * 8 - sec.otherShort * 4 - war * 2 - Math.max(0, st.inflation - 12) * 0.08
    + clamp(deficit, -4, 6) * 0.12 + (infra - 45) * 0.04 - U.infra * 0.8 - U.education * 0.4 - st.warWeariness * 0.01 + devGrowth(s) + m('growth');
  const resRatio = s.econ.reserves / Math.max(0.01, sec.imports);
  T.inflation = 2.2 + Math.max(0, deficit - 2) * 0.6 + printedRatio * 2.5 + (sec.foodShort + sec.energyShort) * 25 + Math.max(0, st.growth - 5) * 0.6
    + Math.max(0, 0.25 - resRatio) * 25 + sec.sanctions * 1.5 + m('inflation') - Math.max(0, -deficit) * 0.2;
  T.migration = (st.qol - 52) * 0.12 - (U.health + U.education) * 2 - repression * 0.03 + m('migration') - m('emigration') - war * 3 + (st.unemployment < 5 ? 1 : 0);

  const clampIdx = ['health', 'education', 'inequality', 'poverty', 'hunger', 'qol', 'civil', 'political', 'protest', 'corruption', 'efficiency', 'taxCapacity',
    'control', 'legitimacy', 'opposition', 'stability', 'productivity', 'industry', 'tech', 'readiness', 'equipment', 'logistics', 'intel', 'milIndustry',
    'defense', 'projection', 'reputation', 'influence', 'market', 'crime', 'housing', 'congestion', 'separatism', 'pollution'];
  for (const k of clampIdx) T[k] = clamp(T[k], k === 'hunger' ? 0 : 1, 99);
  T.unemployment = clamp(T.unemployment, 1, 45);
  T.growth = clamp(T.growth, -15, 12);
  T.inflation = clamp(T.inflation, -3, 400);
  T.migration = clamp(T.migration, -25, 15);
  T.repression = repression;
  return T;
}

// Ritmo da economia (Opções): multiplica o crescimento do PIB e a velocidade das mudanças estruturais.
export const econPace = s => s.settings?.econPace ?? 1.5;
const SLOW = new Set(['tech', 'industry', 'milIndustry', 'education', 'productivity', 'health', 'growth']);
const RATES = { growth: 0.04, inflation: 0.05, unemployment: 0.03, coupRisk: 0.05, revoRisk: 0.05, protest: 0.06, troops: 0.02, migration: 0.05, tech: 0.008, industry: 0.01, milIndustry: 0.01, education: 0.012, productivity: 0.012, market: 0.05, civil: 0.08, political: 0.08 };

export function groupTargets(s, M, bud) {
  const st = s.st, b = s.budget.spend, g = s.econ.gdp;
  const m = k => M['g_' + k] || 0;
  const repression = s.d?.repression || 0;
  const militaryWar = s.wars.reduce((a, w) => a + (w.active ? (w.front > 0 ? 6 : -8) : 0), 0) + (s.flags.wonWar ? 8 : 0) - (s.flags.lostWar ? 15 : 0);
  return {
    workers: 55 - (st.unemployment - 7) * 1.8 - Math.max(0, st.inflation - 4) * 0.7 + (b.welfare - 4) * 2 - st.poverty * 0.12 + m('workers'),
    business: 52 - (s.budget.tax - 25) * 1.1 + (st.growth - 2) * 3 - st.corruption * 0.08 + (st.market - 50) * 0.3 - st.protest * 0.1 - (s.d?.sanctions || 0) * 6 + m('business'),
    military: 38 + b.military * 5 + militaryWar - st.warWeariness * 0.2 + (st.equipment - 40) * 0.15 + m('military'),
    bureaucracy: 40 + b.admin * 4 + st.corruption * 0.1 + (st.stability - 50) * 0.2 + m('bureaucracy'),
    youth: 48 + (st.civil - 40) * 0.35 + (st.education - 45) * 0.25 - (st.unemployment - 7) * 1.4 + m('youth') - repression * 0.1,
    rural: 52 - st.hunger * 0.5 - Math.max(0, st.inflation - 4) * 0.6 + (s.d?.infraAgr ? (s.d.infraAgr - 40) * 0.2 : 0) + m('rural'),
    regional: 48 + (s.d?.infraFro ? (s.d.infraFro - 40) * 0.2 : 0) + st.corruption * 0.08 - st.control * 0.08 - (s.d?.regionSpread || 0) * 0.15 + m('regional'),
    opposition: 18 + (st.political - 30) * 0.45 + (st.civil - 40) * 0.25 - repression * 0.2 + m('opposition') + (st.qol - 50) * 0.1,
  };
}

export function groupInfluence(s, M) {
  const inf = {};
  for (const g in GROUPS) inf[g] = Math.max(0.15, GROUPS[g].inf + (M['gi_' + g] || 0));
  inf.military *= 1 + (atWar(s) ? 0.3 : 0);
  inf.opposition *= 0.6 + s.st.political / 100;
  inf.business *= 0.7 + s.st.market / 160;
  return inf;
}

export function updateRegions(s, M) {
  const b = s.budget.spend, st = s.st, size = prof(s), df = devF(s), pace = econPace(s);
  let tot = 0, wInfra = 0, wPoll = 0, wHouse = 0, minI = 100, maxI = 0;
  const investTot = s.regions.reduce((a, r) => a + r.invest, 0) || 1;
  for (const r of s.regions) {
    const funding = b.infra * (r.invest / investTot) / r.popShare / size.admin;
    const tInfra = clamp(12 + 62 * sat(funding, 2.6) + (M.infra || 0) + df * 10, 1, 99);
    r.infra = step(r.infra, tInfra, 0.01 * pace);
    const urbanT = clamp((r.cap ? 70 : 25) + df * 25, 5, 98);
    const urbanDelta = (urbanT - r.urban) * 0.002;
    r.urban += urbanDelta;
    const tHouse = clamp(30 + r.infra * 0.35 + (M.housing || 0) - Math.max(0, urbanDelta) * 400 - (r.urban - 50) * 0.1, 1, 99);
    r.housing = step(r.housing, tHouse, 0.02);
    const tPoll = clamp(5 + st.industry * r.industryShare * 1.1 + r.urban * 0.12 + (M.pollution || 0), 1, 99);
    r.pollution = step(r.pollution, tPoll, 0.015);
    const sepF = (r.sep || 0) * st.separatism * 0.6;
    const tUnrest = clamp((100 - (s.d?.support ?? 50)) * 0.4 + (50 - r.infra) * 0.25 + st.poverty * 0.2 + (60 - r.housing) * 0.15 + sepF + (r.cap ? st.protest * 0.2 : 0) + (r.annexed ? 15 : 0) + (r.occupiedShare || 0) * 40, 1, 99);
    r.unrest = step(r.unrest, tUnrest, 0.03);
    wInfra += r.infra * r.popShare; wPoll += r.pollution * r.popShare; wHouse += r.housing * r.popShare; tot += r.popShare;
    minI = Math.min(minI, r.infra); maxI = Math.max(maxI, r.infra);
  }
  s.d.infra = wInfra / tot;
  s.d.pollution = wPoll / tot;
  s.st.housing = step(s.st.housing, wHouse / tot, 0.05);
  s.d.regionSpread = maxI - minI;
  const rural = s.regions.filter(r => r.urban < 50), sepR = s.regions.filter(r => (r.sep || 0) >= 0.3);
  s.d.infraAgr = rural.length ? rural.reduce((a, r) => a + r.infra, 0) / rural.length : s.d.infra;
  s.d.infraFro = sepR.length ? sepR.reduce((a, r) => a + r.infra, 0) / sepR.length : s.d.infra;
  s.d.urbanShare = s.regions.reduce((a, r) => a + r.urban * r.popShare, 0) / tot;
}

export function militaryPower(s) {
  const st = s.st;
  return Math.sqrt(Math.max(1, st.troops)) * (0.3 + st.equipment / 100) * (0.3 + st.readiness / 100) * (0.5 + st.logistics / 200) * (0.85 + st.intel / 400);
}

export function dailyModel(s, data) {
  if (!s.d) s.d = {};
  const M = collectMods(s, data);
  updateRegions(s, M);
  const sec = computeSectors(s, data, M);
  s.sector = sec;
  s.d.sanctions = sec.sanctions;
  s.d.foodShort = sec.foodShort; s.d.energyShort = sec.energyShort; s.d.otherShort = sec.otherShort;
  const bud = computeBudget(s, data, M, sec);
  s.d.budget = bud;

  const gT = groupTargets(s, M, bud);
  for (const g in gT) s.groups[g] = clamp(step(s.groups[g], clamp(gT[g], 1, 99), 0.03), 0, 100);
  const inf = groupInfluence(s, M);
  let sw = 0, si = 0;
  for (const g in inf) { sw += s.groups[g] * inf[g]; si += inf[g]; }
  s.d.support = sw / si;
  s.d.influence = inf;
  const G = s.groups;
  s.d.satisfaction = G.workers * 0.32 + G.youth * 0.2 + G.rural * 0.23 + G.bureaucracy * 0.1 + G.opposition * 0.15;
  s.d.elites = clamp((inf.business + inf.military + inf.regional) / si * 100 * 1.4, 0, 100);

  const T = computeTargets(s, data, M, sec, bud);
  s.d.repression = T.repression;
  s.d.targets = T;
  const pace = econPace(s);
  for (const k in T) {
    if (k === 'repression') continue;
    s.st[k] = step(s.st[k], T[k], (RATES[k] ?? 0.03) * (SLOW.has(k) ? pace : 1));
  }
  s.st.warWeariness = clamp(s.st.warWeariness + (atWar(s) ? 0.35 * (1.3 - s.st.stability / 100) : -0.4), 0, 100);

  const e = s.econ;
  e.treasury += bud.balance / 360;
  if (e.treasury < 0) {
    const need = -e.treasury;
    const limit = 0.6 + s.st.reputation / 100 * 0.6 + (M.creditLimit || 0);
    if (e.debt / e.gdp < limit && !s.flags.defaulted) { e.debt += need; s.d.borrowing = true; s.d.printing = false; }
    else { e.printed += need; s.d.printing = true; s.d.borrowing = false; }
    e.treasury = 0;
  } else { s.d.borrowing = false; s.d.printing = false; }
  e.treasury += bud.exp.discretionary / 360; // a dotação discricionária sempre chega ao tesouro
  e.printed *= 1 - 1 / 360;
  e.debt *= 1 - Math.max(0, s.st.inflation) / 100 / 360 * 0.5;
  e.reserves = Math.max(0, e.reserves + (sec.exports - sec.imports) / 360 * 0.5 + e.gdp * 0.0001 - (s.d.printing ? e.gdp * 0.0002 : 0));
  e.gdp *= Math.pow(1 + s.st.growth / 100, pace / 360);

  const df = devF(s);
  const birth = 34 - df * 24 + (M.birth || 0);
  const death = clamp(15 - s.st.health * 0.09 + s.st.hunger * 0.25 + (atWar(s) ? 1.5 : 0), 4, 40);
  s.st.popGrowth = (birth - death + s.st.migration) / 10;
  e.pop *= 1 + s.st.popGrowth / 100 / 360;

  s.counters.costPressure = Math.max(0, s.counters.costPressure * (1 - 1 / 45));
  for (const m of s.longMods) m.left--;
  s.longMods = s.longMods.filter(m => m.d === 0 || m.left > 0);
  s.d.mods = M;
}

export function snapshot(s) {
  const st = s.st, d = s.d || {};
  return {
    day: Math.floor(s.time.min / 1440), gdp: +s.econ.gdp.toFixed(2), gdppc: Math.round(gdppc(s)), pop: +s.econ.pop.toFixed(3),
    growth: +st.growth.toFixed(2), inflation: +st.inflation.toFixed(2), unemployment: +st.unemployment.toFixed(2), poverty: +st.poverty.toFixed(2),
    hunger: +st.hunger.toFixed(2), debt: +debtRatio(s).toFixed(1), treasury: +s.econ.treasury.toFixed(2), support: +(d.support || 50).toFixed(1),
    satisfaction: +(d.satisfaction || 50).toFixed(1), stability: +st.stability.toFixed(1), legitimacy: +st.legitimacy.toFixed(1), civil: +st.civil.toFixed(1),
    political: +st.political.toFixed(1), market: +st.market.toFixed(1), corruption: +st.corruption.toFixed(1), inequality: +st.inequality.toFixed(1),
    qol: +st.qol.toFixed(1), military: +militaryPower(s).toFixed(1), milSpend: s.budget.spend.military, reputation: +st.reputation.toFixed(1),
    protest: +st.protest.toFixed(1), coupRisk: +st.coupRisk.toFixed(1), revoRisk: +st.revoRisk.toFixed(1), health: +st.health.toFixed(1), education: +st.education.toFixed(1),
    rel: +(Object.values(s.partners).reduce((a, p) => a + p.rel, 0) / Object.keys(s.partners).length).toFixed(1),
    balance: +((d.budget?.balance || 0) / s.econ.gdp * 100).toFixed(2), exports: +(s.sector?.exports || 0).toFixed(2), imports: +(s.sector?.imports || 0).toFixed(2),
  };
}
