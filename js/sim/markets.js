// Economia ativa: obras por província, preços mundiais de commodities, empresas e oligarcas, regime cambial.
import { clamp, chance, rand, pick, random } from './util.js';
import { personName } from './names.js';
import { costMultiplier } from './model.js';
import { investCash, payInvest } from './finance.js';

const day = s => Math.floor(s.time.min / 1440);

// ---------- Obras por província ----------
// cost: % do PIB · weeks: obra · nat: efeitos nacionais · reg: efeito na região · req: exigência da província
export const BUILDINGS = {
  factory: { name: 'Polo industrial', icon: '🏭', cost: 0.35, weeks: 20, nat: { industry: 1.2, unemployment: -0.25, growth: 0.06, pollution: 0.8 }, reg: { unrest: -4, pollution: 8 } },
  farm: { name: 'Complexo agrícola', icon: '🌾', cost: 0.2, weeks: 12, nat: { s_food: 1.2, unemployment: -0.1, g_rural: 0.6 }, reg: { unrest: -3 } },
  mine: { name: 'Mineração', icon: '⛏', cost: 0.3, weeks: 18, nat: { s_raw: 1.6, growth: 0.04, pollution: 0.6 }, reg: { unrest: -2, pollution: 6 } },
  port: { name: 'Porto de águas profundas', icon: '⚓', cost: 0.45, weeks: 26, nat: { exportAccess: 0.012, importAccess: 0.01, growth: 0.05 }, reg: { infra: 6 }, req: 'coast' },
  power: { name: 'Usina de energia', icon: '⚡', cost: 0.4, weeks: 24, nat: { s_energy: 1.8, pollution: 0.5 }, reg: { infra: 3, pollution: 4 } },
  solar: { name: 'Parque solar e eólico', icon: '☀', cost: 0.45, weeks: 20, nat: { s_energy: 1.2, pollution: -0.2 }, reg: { infra: 2 } },
  university: { name: 'Universidade federal', icon: '🎓', cost: 0.25, weeks: 30, nat: { education: 0.6, tech: 0.5, g_youth: 0.6 }, reg: { unrest: -3 } },
  hospital: { name: 'Hospital regional', icon: '✚', cost: 0.2, weeks: 18, nat: { health: 0.7 }, reg: { unrest: -5 } },
  base: { name: 'Base militar', icon: '★', cost: 0.3, weeks: 20, nat: { defense: 1, readiness: 0.6, g_military: 0.6 }, reg: { unrest: -1 } },
  techpark: { name: 'Parque tecnológico', icon: '💻', cost: 0.5, weeks: 30, nat: { tech: 0.9, s_tech: 1.5, productivity: 0.5 }, reg: { unrest: -2 }, minEdu: 40 },
  railway: { name: 'Ferrovia e rodovias', icon: '🚆', cost: 0.4, weeks: 28, nat: { logistics: 0.8, growth: 0.05 }, reg: { infra: 10, unrest: -2 } },
  housing: { name: 'Conjunto habitacional', icon: '🏘', cost: 0.25, weeks: 16, nat: { housing: 0.8, g_workers: 0.6 }, reg: { housing: 10, unrest: -5 } },
};
const regionOf = (s, pid) => s.regions.find(r => r.provinces.includes(pid));
export function buildBlock(s, data, pid, type) {
  const B = BUILDINGS[type], P = data.geo.prov[pid];
  const list = s.buildings?.[pid] || [];
  if (list.filter(b => b.type === type).length >= 2) return 'Já há duas obras desse tipo aqui';
  if (list.length >= 4) return 'A província já tem 4 obras';
  if (B.req === 'coast' && !P.coast) return 'Exige litoral';
  if (B.minEdu && s.st.education < B.minEdu) return `Exige educação ≥ ${B.minEdu}`;
  if (investCash(s) < buildCost(s, type)) return 'Sem recursos (tesouro + carteira de investimentos)';
  return null;
}
export const buildCost = (s, type) => s.econ.gdp * BUILDINGS[type].cost / 100 * costMultiplier(s);
export function startBuilding(s, data, pid, type) {
  const b = buildBlock(s, data, pid, type);
  if (b) return { ok: false, msg: b };
  const cost = buildCost(s, type);
  payInvest(s, cost);
  ((s.buildings ||= {})[pid] ||= []).push({ type, start: day(s), done: day(s) + BUILDINGS[type].weeks * 7, active: false, cost });
  s.counters.costPressure += 0.02;
  return { ok: true, msg: `${BUILDINGS[type].name} em construção em ${data.geo.prov[pid].n}.`, log: true };
}
function weeklyBuildings(s, data, ctx) {
  const d = day(s), counts = {};
  for (const pid in s.buildings || {}) {
    if (!regionOf(s, pid)) { delete s.buildings[pid]; continue; }
    for (const b of s.buildings[pid]) {
      if (!b.active && d >= b.done) {
        b.active = true;
        const r = regionOf(s, pid), R = BUILDINGS[b.type].reg;
        for (const k in R) if (r && k in r) r[k] = clamp(r[k] + R[k], 0, 100);
        ctx.news(`Inaugurado: ${BUILDINGS[b.type].name} em ${data.geo.prov[pid].n}.`, 'good');
      }
      if (b.active) counts[b.type] = (counts[b.type] || 0) + 1;
    }
  }
  s.longMods = s.longMods.filter(m => m.id !== 'bld');
  const M = {};
  for (const t in counts) { const f = Math.sqrt(counts[t]) * 1.6; for (const k in BUILDINGS[t].nat) M[k] = (M[k] || 0) + BUILDINGS[t].nat[k] * f; }
  for (const k in M) s.longMods.push({ k, v: +M[k].toFixed(3), d: 0, left: 0, src: 'Obras nas províncias', id: 'bld' });
}

// ---------- Commodities ----------
export const COMMODITIES = { oil: { name: 'Petróleo', sector: 'energy' }, gas: { name: 'Gás natural', sector: 'energy' }, wheat: { name: 'Trigo', sector: 'food' }, steel: { name: 'Aço', sector: 'raw' }, chips: { name: 'Semicondutores', sector: 'tech' }, gold: { name: 'Ouro', sector: 'raw' } };
const SHOCKS = [
  ['oil', 45, 'Crise no Golfo Pérsico: o barril dispara.'], ['oil', -35, 'Excesso de oferta derruba o petróleo.'], ['gas', 60, 'Gasoduto sabotado: o gás natural explode de preço.'],
  ['wheat', 50, 'Quebra de safra global: o trigo dispara.'], ['wheat', -25, 'Supersafra derruba os grãos.'], ['steel', 30, 'Boom de construção na Ásia eleva o aço.'],
  ['chips', 70, 'Escassez mundial de chips paralisa fábricas.'], ['chips', -30, 'Nova fábrica asiática barateia os chips.'], ['gold', 35, 'Pânico nos mercados: investidores correm para o ouro.'],
];
export function initMarkets(s) {
  s.markets ||= { prices: Object.fromEntries(Object.keys(COMMODITIES).map(k => [k, 100])), hist: [] };
  s.companies ||= initCompanies(s);
  s.currency ||= { regime: 'float', rate: 100, hist: [] };
}
function weeklyCommodities(s, ctx) {
  const M = s.markets, d = day(s);
  for (const k in M.prices) M.prices[k] = clamp(M.prices[k] + (100 - M.prices[k]) * 0.02 + rand(-3, 3), 35, 300);
  if (chance(0.03)) { const [k, v, txt] = pick(SHOCKS); M.prices[k] = clamp(M.prices[k] + v, 35, 300); ctx.news(txt, 'warn'); }
  M.hist.push({ day: d, ...M.prices }); if (M.hist.length > 156) M.hist.shift();
  // Efeito no país: exportadores ganham com alta; importadores perdem.
  const rows = s.sector?.rows || {}, g = s.econ.gdp;
  let impact = 0;
  for (const k in COMMODITIES) { const r = rows[COMMODITIES[k].sector]; if (!r) continue; const net = (r.exp - r.imp) / Math.max(1, g); impact += net * (M.prices[k] - 100) / 100 * (k === 'oil' || k === 'wheat' ? 1 : 0.5); }
  s.econ.treasury += g * impact * 0.03;
  s.longMods = s.longMods.filter(m => m.id !== 'cmdty');
  if (Math.abs(impact) > 0.0005) s.longMods.push({ k: 'growth', v: +clamp(impact * 40, -2, 2).toFixed(2), d: 0, left: 0, src: 'Preços das commodities', id: 'cmdty' }, { k: 'inflation', v: +clamp(-impact * 25, -2, 3).toFixed(2), d: 0, left: 0, src: 'Preços das commodities', id: 'cmdty' });
  s.markets.impact = impact;
}

// ---------- Empresas e oligarcas ----------
const CO = [['energy', 'Petro', 'Petróleo e energia'], ['raw', 'Minera', 'Mineração'], ['industrial', 'Siderúrgica', 'Aço e máquinas'], ['services', 'Banco', 'Finanças'], ['tech', 'Telecom', 'Telecomunicações'], ['services', 'Aero', 'Aviação'], ['food', 'Agro', 'Agronegócio']];
function initCompanies(s) {
  const n = s.nation.shortName, cul = s.nation.culture || 'en', state = s.st.market < 45;
  return CO.map(([sector, pre, desc], i) => ({ id: 'co' + i, name: `${pre}${n.slice(0, 3)}`.replace(/\s/g, ''), desc, sector, owner: state ? (i < 5 ? 'state' : 'private') : (i < 2 ? 'state' : 'private'), oligarch: personName(cul), value: +(s.econ.gdp * rand(0.01, 0.04)).toFixed(2), loyalty: Math.round(rand(40, 70)) }));
}
export function privatize(s, id) {
  const c = s.companies.find(x => x.id === id); if (!c || c.owner !== 'state') return { ok: false, msg: '?' };
  s.econ.treasury += c.value * 0.8; c.owner = 'private'; c.oligarch = personName(s.nation.culture || 'en'); c.loyalty = 65;
  s.st.market = clamp(s.st.market + 3, 0, 100); s.groups.business = clamp(s.groups.business + 3, 0, 100); s.groups.workers = clamp(s.groups.workers - 2, 0, 100);
  if (chance(s.st.corruption / 150)) { s.econ.treasury -= c.value * 0.3; s.st.corruption = clamp(s.st.corruption + 3, 0, 100); return { ok: true, msg: `${c.name} vendida — por um preço suspeito a ${c.oligarch}, amigo do governo.`, log: true }; }
  return { ok: true, msg: `${c.name} privatizada; ${c.oligarch} é o novo controlador.`, log: true };
}
export function nationalize(s, id) {
  const c = s.companies.find(x => x.id === id); if (!c || c.owner !== 'private') return { ok: false, msg: '?' };
  c.owner = 'state'; s.st.market = clamp(s.st.market - 3, 0, 100); s.groups.business = clamp(s.groups.business - 6, 0, 100); s.groups.workers = clamp(s.groups.workers + 3, 0, 100); s.st.reputation = clamp(s.st.reputation - 2, 0, 100);
  return { ok: true, msg: `${c.name} nacionalizada. ${c.oligarch} promete vingança.`, log: true };
}
function weeklyCompanies(s, ctx) {
  const g = s.econ.gdp;
  for (const c of s.companies) {
    c.value = Math.max(0.01, c.value * (1 + (s.st.growth / 100 + (c.owner === 'private' ? 0.01 : -0.005)) / 52));
    if (c.owner === 'private') c.loyalty = clamp(c.loyalty + (s.groups.business - 50) / 100 + (25 - s.budget.tax) / 100, 0, 100);
  }
  const st = s.companies.filter(c => c.owner === 'state').length, pr = s.companies.length - st;
  s.longMods = s.longMods.filter(m => m.id !== 'cos');
  s.longMods.push({ k: 'revenue', v: +(st * 0.08).toFixed(2), d: 0, left: 0, src: 'Estatais', id: 'cos' }, { k: 'growth', v: +(pr * 0.04 - st * 0.02).toFixed(2), d: 0, left: 0, src: 'Empresas', id: 'cos' });
  const angry = s.companies.find(c => c.owner === 'private' && c.loyalty < 25);
  if (angry && (s.counters.oligCd || 0) <= day(s) && chance(0.15)) { s.counters.oligCd = day(s) + 90; ctx.card(oligarchCard(s, angry)); }
}
function oligarchCard(s, c) {
  return { id: `dyn_olig_${c.id}_${day(s)}`, dyn: true, cat: 'Oligarcas', title: `${c.oligarch} perde a paciência`, desc: `${c.oligarch}, dono(a) da ${c.name} (${c.desc}), financia jornais de oposição e ameaça tirar os investimentos do país.`, context: `Lealdade ${Math.round(c.loyalty)} · valor da empresa ${c.value.toFixed(1)} bi.`, deadline: 10, default: 2,
    options: [
      { text: 'Contratos e isenções para acalmá-lo(a).', hint: 'Custo fiscal; corrupção.', now: { treasury: -0.3, corruption: 2 }, act: { type: 'oligarch', id: c.id, choice: 'appease' } },
      { text: 'Nacionalizar a empresa.', hint: 'Controle; investidores fogem.', act: { type: 'oligarch', id: c.id, choice: 'nationalize' } },
      { text: 'Processá-lo(a) por sonegação.', hint: 'Mensagem às elites; vira inimigo(a).', act: { type: 'oligarch', id: c.id, choice: 'prosecute' } },
    ] };
}
export function oligarchAct(s, act) {
  const c = s.companies.find(x => x.id === act.id); if (!c) return '';
  if (act.choice === 'appease') { c.loyalty = clamp(c.loyalty + 35, 0, 100); return `${c.oligarch} volta a apoiar o governo.`; }
  if (act.choice === 'nationalize') return nationalize(s, c.id).msg;
  c.loyalty = 5; s.groups.business = clamp(s.groups.business - 4, 0, 100); s.st.corruption = clamp(s.st.corruption - 1, 0, 100);
  if (chance(0.5)) { s.econ.treasury += c.value * 0.2; return `${c.oligarch} é condenado(a) e paga multa milionária.`; }
  return `${c.oligarch} foge do país e financia a oposição do exterior.`;
}

// ---------- Câmbio ----------
export const FX = { float: { name: 'Câmbio flutuante' }, peg: { name: 'Câmbio fixo (atrelado ao dólar)' }, dollarized: { name: 'Dolarização' }, union: { name: 'Moeda comum do bloco' } };
export function setFx(s, regime) {
  const C = s.currency;
  if (regime === C.regime) return { ok: false, msg: 'Já em vigor.' };
  if (regime === 'union' && !(s.world?.blocs || []).some(b => b.members[0] === 'PLY' && b.members.length >= 3)) return { ok: false, msg: 'Exige um bloco próprio com 3+ membros.' };
  if (regime === 'peg' && s.econ.reserves < s.econ.gdp * 0.08) return { ok: false, msg: 'Reservas insuficientes (≥ 8% do PIB) para sustentar o câmbio fixo.' };
  C.regime = regime;
  s.longMods = s.longMods.filter(m => m.id !== 'fx');
  const M = { float: {}, peg: { inflation: -3, exportAccess: -0.03 }, dollarized: { inflation: -6, creditLimit: -0.1, legitimacy: -3 }, union: { inflation: -2, exportAccess: 0.05, growth: 0.2 } }[regime];
  for (const k in M) s.longMods.push({ k, v: M[k], d: 0, left: 0, src: FX[regime].name, id: 'fx' });
  if (regime === 'dollarized') s.groups.military = clamp(s.groups.military - 3, 0, 100);
  return { ok: true, msg: `${FX[regime].name} em vigor.`, log: true };
}
export function devalue(s, pct = 20) {
  const C = s.currency;
  if (C.regime === 'dollarized' || C.regime === 'union') return { ok: false, msg: 'Sem moeda própria para desvalorizar.' };
  if ((C.devCd || 0) > day(s)) return { ok: false, msg: `Aguarde ${C.devCd - day(s)} dias.` };
  C.devCd = day(s) + 180; C.rate *= 1 + pct / 100;
  s.longMods.push({ k: 'exportAccess', v: 0.06, d: 365, left: 365, src: 'Desvalorização' }, { k: 'inflation', v: 4, d: 240, left: 240, src: 'Desvalorização' }, { k: 'importAccess', v: -0.05, d: 365, left: 365, src: 'Desvalorização' });
  s.st.reputation = clamp(s.st.reputation - 2, 0, 100); s.groups.workers = clamp(s.groups.workers - 3, 0, 100); s.groups.business = clamp(s.groups.business + 2, 0, 100);
  if (C.regime === 'peg') { s.st.legitimacy = clamp(s.st.legitimacy - 4, 0, 100); C.regime = 'float'; s.longMods = s.longMods.filter(m => m.id !== 'fx'); }
  return { ok: true, msg: `Moeda desvalorizada em ${pct}%. Exportações ficam competitivas; importados encarecem.`, log: true };
}
function weeklyFx(s, ctx) {
  const C = s.currency;
  if (C.regime === 'float') C.rate = clamp(C.rate * (1 + (s.st.inflation - 3) / 100 / 52 + (s.econ.reserves < s.econ.gdp * 0.03 ? 0.002 : 0) + rand(-0.003, 0.003)), 10, 100000);
  if (C.regime === 'peg') { s.econ.reserves = Math.max(0, s.econ.reserves - s.econ.gdp * Math.max(0, s.st.inflation - 4) / 100 / 52 * 0.3);
    if (s.econ.reserves < s.econ.gdp * 0.02) { C.regime = 'float'; C.rate *= 1.4; s.longMods = s.longMods.filter(m => m.id !== 'fx'); s.longMods.push({ k: 'inflation', v: 8, d: 180, left: 180, src: 'Colapso do câmbio fixo' }); ctx.news('As reservas acabaram: o câmbio fixo desaba e a moeda perde 40%.', 'bad'); } }
  C.hist.push([day(s), +C.rate.toFixed(1)]); if (C.hist.length > 156) C.hist.shift();
}

export function weeklyMarkets(s, data, ctx) {
  initMarkets(s);
  weeklyBuildings(s, data, ctx);
  weeklyCommodities(s, ctx);
  weeklyCompanies(s, ctx);
  weeklyFx(s, ctx);
}
