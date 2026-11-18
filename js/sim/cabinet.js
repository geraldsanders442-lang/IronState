// Governo que trabalha sozinho: cada ministro recebe um mandato ("permitir que execute o plano X") e age
// toda semana dentro dele; conselheiros contratáveis e treináveis; ministros contestam mudanças bruscas
// do governante; bancadas regionais pedem obras concretas que aparecem no mapa.
import { clamp, chance, rand, pick, random } from './util.js';
import { personName } from './names.js';
import { PORTFOLIOS } from './politics.js';
import { BUILDINGS, buildBlock, buildCost } from './markets.js';
import { programById, programBlock, startProgram } from './programs.js';
import { raiseFunds, investCash, payInvest, financeLimits, initFinance } from './finance.js';
import { debtRatio } from './model.js';
import { SPEND } from './constants.js';

const day = s => Math.floor(s.time.min / 1440);
const cul = s => s.nation.culture || 'en';
const regionOf = (s, pid) => s.regions.find(r => r.provinces.includes(pid));

// ---------- Mandatos ----------
export const MANDATES = {
  finance: { off: ['Só aconselhar', 'Não mexe no orçamento sem ordem sua.'], balance: ['Equilibrar as contas', 'Ajusta impostos e gastos aos poucos para manter o déficit perto de 2% do PIB.'], stimulus: ['Plano de estímulo', 'Aceita déficit de até 5%, corta impostos e usa títulos para investir.'], austerity: ['Plano de ajuste', 'Corta gastos e sobe impostos até zerar o déficit.'] },
  economy: { off: ['Só aconselhar', 'Não inicia obras nem programas sozinho.'], regional: ['Desenvolvimento regional', 'Redistribui o investimento para as regiões mais pobres e tocadas e constrói obras onde faltam.'], industry: ['Industrialização', 'Polos industriais, usinas e programas de indústria nacional.'], export: ['Exportação', 'Portos, agronegócio, mineração e zonas francas.'] },
  defense: { off: ['Só aconselhar', 'Não mexe nas Forças Armadas.'], maintain: ['Manter a prontidão', 'Mantém o gasto militar no mínimo necessário.'], buildup: ['Rearmamento', 'Sobe o gasto militar até 4% do PIB e compra aviões e navios.'], cut: ['Desmobilizar', 'Reduz o gasto militar a 1,2% do PIB.'] },
  interior: { off: ['Só aconselhar', ''], order: ['Lei e ordem', 'Sobe a verba de segurança quando crime e protestos crescem.'], pacify: ['Pacificar as regiões', 'Investe nas regiões tensas e separatistas.'] },
  health: { off: ['Só aconselhar', ''], expand: ['Expandir a saúde', 'Aumenta a verba da saúde até 7% do PIB e constrói hospitais.'], lean: ['Saúde enxuta', 'Mantém a verba logo acima do mínimo.'] },
  education: { off: ['Só aconselhar', ''], expand: ['Expandir a educação', 'Aumenta a verba até 6,5% do PIB.'], technical: ['Ensino técnico e universidades', 'Constrói universidades e parques tecnológicos.'] },
  foreign: { off: ['Só aconselhar', ''], trade: ['Abrir mercados', 'Fecha acordos comerciais com países amistosos.'], allies: ['Cultivar aliados', 'Visitas e gestos para melhorar relações.'] },
  justice: { off: ['Só aconselhar', ''], clean: ['Mãos limpas', 'Investigações contínuas contra a corrupção.'], rights: ['Direitos civis', 'Amplia garantias e o acesso à Justiça.'] },
};
const DEFAULT_MANDATES = { finance: 'balance', economy: 'regional', defense: 'maintain', interior: 'order', health: 'off', education: 'off', foreign: 'trade', justice: 'off' };

// ---------- Conselheiros ----------
export const ADVISORS = {
  economist: { name: 'Economista-chefe', desc: 'Apresenta planos quando a economia piora e melhora o crescimento.', mods: f => ({ growth: 0.25 * f, inflation: -0.4 * f, taxCapacity: 2 * f }) },
  strategist: { name: 'Estrategista político', desc: 'Antecipa crises, segura a base e melhora a imagem do governo.', mods: f => ({ legitimacy: 2 * f, opposition: -2 * f }) },
  security: { name: 'Conselheiro de segurança nacional', desc: 'Inteligência e alerta contra golpes.', mods: f => ({ intel: 5 * f, coupRisk: -3 * f }) },
  diplomat: { name: 'Assessor internacional', desc: 'Reputação e influência no exterior.', mods: f => ({ reputation: 3 * f, influence: 3 * f }) },
};
const A_TRAITS = ['acadêmico', 'pragmático', 'ideólogo', 'veterano', 'tecnocrata', 'midiático'];
export function makeAdvisor(s, role, skill) {
  return { role, name: personName(cul(s)), skill: Math.round(skill ?? rand(35, 85)), trait: pick(A_TRAITS), since: day(s) };
}
// Salário anual (% do PIB pequeno, mas real); contratar custa um trimestre adiantado.
export const advisorSalary = (s, a) => s.econ.gdp * 0.0006 * (0.5 + a.skill / 100);

export function initCabinet2(s) {
  const P = s.pol; if (!P) return;
  P.mandates ||= { ...DEFAULT_MANDATES };
  P.advisors ||= { economist: makeAdvisor(s, 'economist', rand(45, 70)), strategist: makeAdvisor(s, 'strategist', rand(40, 65)), security: null, diplomat: null };
  P.hold ||= {}; P.changes ||= []; P.training ||= [];
  P.wk ||= snap(s);
  s.pork ||= [];
  initFinance(s);
}
const snap = s => ({ tax: s.budget.tax, spend: { ...s.budget.spend } });

export function advisorCandidates(s, role) {
  const P = s.pol; P.acands ||= {};
  if (!P.acands[role] || P.acands[role].day < day(s) - 60) P.acands[role] = { day: day(s), list: [0, 1, 2].map(() => makeAdvisor(s, role)) };
  return P.acands[role].list;
}
export function hireAdvisor(s, role, idx) {
  const list = advisorCandidates(s, role), a = list[idx];
  if (!a) return { ok: false, msg: '?' };
  const fee = advisorSalary(s, a) * 4;
  if (s.econ.treasury < fee) return { ok: false, msg: 'Tesouro insuficiente para a contratação.' };
  s.econ.treasury -= fee;
  s.pol.advisors[role] = { ...a, since: day(s) };
  list.splice(idx, 1);
  return { ok: true, msg: `${a.name} contratado(a) como ${ADVISORS[role].name}.`, log: true };
}
export function fireAdvisor(s, role) { const a = s.pol.advisors[role]; s.pol.advisors[role] = null; return { ok: true, msg: `${a?.name || 'Conselheiro'} dispensado(a).`, log: true }; }

// Treinamento: 8 semanas de cursos e assessoria; custa e devolve competência.
export const trainCost = s => s.econ.gdp * 0.0008;
export function train(s, kind, key) {
  const P = s.pol, who = kind === 'minister' ? P.cabinet[key] : P.advisors[key];
  if (!who) return { ok: false, msg: 'Cargo vago.' };
  if (P.training.some(t => t.kind === kind && t.key === key)) return { ok: false, msg: 'Já está em treinamento.' };
  if (who.skill >= 95) return { ok: false, msg: 'Já está no máximo.' };
  const c = trainCost(s);
  if (s.econ.treasury < c) return { ok: false, msg: 'Tesouro insuficiente.' };
  s.econ.treasury -= c;
  P.training.push({ kind, key, name: who.name, until: day(s) + 56 });
  return { ok: true, msg: `${who.name} começa um programa de capacitação de 8 semanas.`, log: true };
}

export function setMandate(s, port, mandate) {
  if (!MANDATES[port]?.[mandate]) return { ok: false, msg: '?' };
  s.pol.mandates[port] = mandate;
  delete s.pol.hold[port];
  const m = s.pol.cabinet[port];
  return { ok: true, msg: mandate === 'off' ? `${m.name} (${PORTFOLIOS[port].name}) só vai aconselhar.` : `${m.name} (${PORTFOLIOS[port].name}) recebe carta branca: ${MANDATES[port][mandate][0]}.`, log: true };
}

// ---------- Registro de mudanças feitas pelo governante (para contestação) ----------
const POLICY_PORT = { economy: 'finance', unions: 'economy', press: 'interior', assembly: 'interior', elections: 'justice', surveillance: 'interior', borders: 'interior', immigration: 'interior', emigration: 'interior', refugees: 'foreign', conscription: 'defense', religion: 'justice', vices: 'justice', autonomy: 'interior', foreign: 'foreign', deathpenalty: 'justice', policing: 'interior', prisons: 'justice', gambling: 'finance', alcohol: 'justice', drugs: 'justice' };
// +1: subir o nível (índice) liberaliza; −1: subir o nível endurece.
const LIB = { press: -1, assembly: -1, elections: 1, surveillance: -1, unions: -1, borders: -1, immigration: -1, emigration: -1, refugees: -1, religion: -1, vices: 1, autonomy: 1, deathpenalty: -1, policing: -1, prisons: -1, gambling: 1, alcohol: 1, drugs: 1 };
const SPEND_PORT = { health: 'health', education: 'education', welfare: 'finance', security: 'interior', military: 'defense', admin: 'finance', infra: 'economy' };

export function notePolicyChange(s, data, id, from, to) {
  const P = s.pol; if (!P) return;
  const pol = data.policies.find(p => p.id === id); if (!pol) return;
  const i0 = pol.levels.findIndex(l => l.id === from), i1 = pol.levels.findIndex(l => l.id === to);
  P.changes.push({ kind: 'policy', id, from, to, jump: Math.abs(i1 - i0), dir: Math.sign(i1 - i0), day: day(s) });
  if (POLICY_PORT[id]) P.hold[POLICY_PORT[id]] = day(s) + 84;
}
export function noteEconChange(s, what, dir, mag = 1) { const P = s.pol; if (!P) return; P.changes.push({ kind: 'econ', what, dir, mag, day: day(s) }); P.hold.finance = day(s) + 84; P.hold.economy = day(s) + 84; }

// Ajustes dos ministros entram também no retrato da semana, para não serem contados como mudança do governante.
function adjust(s, k, dv) {
  const P = s.pol, b = s.budget;
  if (k === 'tax') { const v = clamp(b.tax + dv, 5, 60); P.wk.tax += v - b.tax; b.tax = v; return; }
  const v = clamp((b.spend[k] ?? 0) + dv, 0, 15); P.wk.spend[k] = (P.wk.spend[k] ?? 0) + v - (b.spend[k] ?? 0); b.spend[k] = v;
}

// ---------- Ações semanais por mandato ----------
const need = s => { const df = clamp(Math.log10(s.econ.gdp * 1e9 / (s.econ.pop * 1e6) / 800) / 2.1, 0, 1); return { health: 2 + df * 1.4, education: 2 + df * 1.2, welfare: 1 + df * 1.9, security: 0.9 + df * 0.4, military: 0.8, admin: 1.4 + df * 0.8, infra: 1.1 + df * 0.6 }; };
export function bestProvince(s, data, r, type) {
  const list = [...r.provinces].sort((a, b) => (data.geo.prov[b].pop || 0) - (data.geo.prov[a].pop || 0));
  return list.find(pid => { const bb = buildBlock(s, data, pid, type); return !bb || /recursos|Tesouro/.test(bb); });
}
export function regionNeed(s, r) {
  if (r.infra < 38) return 'railway';
  if (r.housing < 40 && r.urban > 50) return 'housing';
  if (r.unrest > 55) return 'hospital';
  if (r.urban < 40) return chance(0.5) ? 'farm' : 'hospital';
  if (s.st.education > 45 && chance(0.3)) return 'university';
  return pick(['factory', 'railway', 'hospital', 'power']);
}
function tryBuild(s, data, ctx, m, port, r, type, note) {
  const pid = r && bestProvince(s, data, r, type);
  if (!pid) return false;
  const cost = buildCost(s, type);
  // Ministros não esvaziam o tesouro: guardam uma reserva para o jogador e têm teto anual de obras autônomas.
  const cap = (s.counters.cabSpend ||= { year: -1, v: 0 }), yr = Math.floor(day(s) / 365);
  if (cap.year !== yr) { cap.year = yr; cap.v = 0; }
  if (investCash(s) - s.econ.gdp * 0.006 < cost * 1.3 || cap.v + cost > s.econ.gdp * 0.012) return false;
  cap.v += cost;
  payInvest(s, cost);
  ((s.buildings ||= {})[pid] ||= []).push({ type, start: day(s), done: day(s) + BUILDINGS[type].weeks * 7, active: false, cost, by: port });
  s.counters.costPressure += 0.02;
  if (chance(m.corrupt / 300)) { s.econ.treasury -= cost * 0.2; s.st.corruption = clamp(s.st.corruption + 1.5, 0, 100); ctx.news(`Denúncia: obra de ${BUILDINGS[type].name} em ${data.geo.prov[pid].n} foi superfaturada no ministério de ${m.name}.`, 'bad'); }
  ctx.log(`${m.name} (${PORTFOLIOS[port].name}) inicia ${BUILDINGS[type].icon} ${BUILDINGS[type].name} em ${data.geo.prov[pid].n}${note ? ' — ' + note : ''}.`, 'decision');
  return true;
}
function tryProgram(s, ctx, m, port, ids) {
  for (const id of ids) { const p = programById[id]; if (p && !programBlock(s, p)) { const r = startProgram(s, id); if (r.ok) { ctx.log(`${m.name} (${PORTFOLIOS[port].name}) lança: ${p.name}.`, 'decision'); return true; } } }
  return false;
}
const ACTIONS = {
  finance(s, data, ctx, m, mode) {
    const g = s.econ.gdp, def = -(s.d?.budget?.balance || 0) / g * 100, b = s.budget, N = need(s);
    const trimmable = ['admin', 'military', 'infra', 'welfare'].filter(k => b.spend[k] > N[k] + 0.3).sort((x, y) => (b.spend[y] - N[y]) - (b.spend[x] - N[x]));
    const target = mode === 'stimulus' ? 4.5 : mode === 'austerity' ? -0.5 : 2;
    if (def > target + 1) { if (b.tax < (mode === 'austerity' ? 38 : 33) && chance(0.6)) { adjust(s, 'tax', 0.5); return 'sobe impostos em 0,5 ponto'; } if (trimmable[0]) { adjust(s, trimmable[0], -0.1); return `corta 0,1% do PIB em ${SPEND[trimmable[0]]?.name || trimmable[0]}`; } }
    else if (def < target - 1.5) { if (mode === 'stimulus' || b.tax > 30) { adjust(s, 'tax', -0.5); return 'reduz impostos em 0,5 ponto'; } adjust(s, 'infra', 0.1); return 'aplica a folga do orçamento em infraestrutura'; }
    if (mode === 'stimulus' && (s.fin?.pool || 0) < g * 0.004 && chance(0.25)) { const r = raiseFunds(s, 'bonds', 0.4); if (r.ok) return 'emite títulos de investimento (0,4% do PIB)'; }
    return null;
  },
  economy(s, data, ctx, m, mode) {
    if (mode === 'regional') {
      const tot = s.regions.reduce((a, r) => a + Math.max(5, 105 - r.infra + r.unrest * 0.4), 0);
      let moved = 0;
      for (const r of s.regions) { const tgt = Math.max(5, 105 - r.infra + r.unrest * 0.4) / tot * 100 * s.regions.length / 2; const dv = (tgt - r.invest) * 0.25; moved += Math.abs(dv); r.invest = clamp(r.invest + dv, 0, 100); }
      if (chance(0.4)) { const r = [...s.regions].filter(r => !r.cap || s.regions.length === 1).sort((a, b) => (100 - b.infra + b.unrest * 0.5) - (100 - a.infra + a.unrest * 0.5))[0]; if (tryBuild(s, data, ctx, m, 'economy', r, regionNeed(s, r), `para desenvolver ${r.name}`)) return null; }
      if (moved > 4 && (s.pol.rebal || 0) < day(s) - 42) { s.pol.rebal = day(s); return 'redistribui o investimento em infraestrutura para as regiões mais carentes'; }
      return null;
    }
    if (mode === 'industry') {
      if (chance(0.2) && tryProgram(s, ctx, m, 'economy', s.st.market < 40 ? ['plan5', 'isi'] : ['isi', 'fdi'])) return null;
      if (chance(0.2)) { const r = pick(s.regions.filter(r => !r.cap)) || s.regions[0]; tryBuild(s, data, ctx, m, 'economy', r, pick(['factory', 'power', s.st.education > 45 ? 'techpark' : 'factory'])); }
      return null;
    }
    if (mode === 'export') {
      if (chance(0.2) && tryProgram(s, ctx, m, 'economy', ['freezones', 'fdi'])) return null;
      if (chance(0.2)) { const r = pick(s.regions); tryBuild(s, data, ctx, m, 'economy', r, pick(s.nation.coastal ? ['port', 'farm', 'mine'] : ['farm', 'mine', 'railway'])); }
    }
    return null;
  },
  defense(s, data, ctx, m, mode) {
    const b = s.budget.spend;
    if (mode === 'maintain' && b.military < 1.2) { adjust(s, 'military', 0.1); return 'repõe a verba militar mínima'; }
    if (mode === 'buildup') { if (b.military < 4) { adjust(s, 'military', 0.1); return 'eleva o gasto militar em 0,1% do PIB'; } }
    if (mode === 'cut' && b.military > 1.2) { adjust(s, 'military', -0.1); return 'reduz o gasto militar em 0,1% do PIB'; }
    return null;
  },
  interior(s, data, ctx, m, mode) {
    if (mode === 'order' && (s.st.crime > 55 || s.st.protest > 55) && s.budget.spend.security < 3.5) { adjust(s, 'security', 0.1); return 'reforça a verba de segurança'; }
    if (mode === 'pacify') { const hot = s.regions.filter(r => r.unrest > 55 || (r.sep || 0) >= 0.3); for (const r of hot) r.invest = clamp(r.invest + 3, 0, 100); if (hot.length && chance(0.15)) tryBuild(s, data, ctx, m, 'interior', hot[0], 'hospital', 'para acalmar a região'); }
    return null;
  },
  health(s, data, ctx, m, mode) {
    const b = s.budget.spend, N = need(s);
    if (mode === 'expand') { if (b.health < 7) { adjust(s, 'health', 0.1); return 'amplia a verba da saúde'; } if (chance(0.1)) { const r = [...s.regions].sort((a, b) => b.unrest - a.unrest)[0]; tryBuild(s, data, ctx, m, 'health', r, 'hospital'); } }
    if (mode === 'lean' && b.health > N.health + 0.6) { adjust(s, 'health', -0.1); return 'enxuga a verba da saúde'; }
    if (b.health < N.health) { adjust(s, 'health', 0.1); return 'repõe o mínimo da saúde'; }
    return null;
  },
  education(s, data, ctx, m, mode) {
    const b = s.budget.spend, N = need(s);
    if (mode === 'expand' && b.education < 6.5) { adjust(s, 'education', 0.1); return 'amplia a verba da educação'; }
    if (mode === 'technical' && chance(0.12)) { const r = [...s.regions].sort((a, b) => a.infra - b.infra)[0]; tryBuild(s, data, ctx, m, 'education', r, s.st.education > 45 && chance(0.4) ? 'techpark' : 'university'); }
    if (b.education < N.education) { adjust(s, 'education', 0.1); return 'repõe o mínimo da educação'; }
    return null;
  },
  foreign(s, data, ctx, m, mode) {
    if (mode === 'trade' && chance(0.12)) { const id = Object.keys(s.partners).find(id => { const p = s.partners[id]; return !p.trade && !p.sanctionsBy && !p.sanctionsOn && p.rel > 20 && s.world.c[id] && !s.world.c[id].dep; }); if (id) { s.partners[id].trade = true; s.partners[id].rel += 3; return `fecha acordo comercial com ${data.reg[id]?.name || s.world.ents?.[id]?.name || id}`; } }
    if (mode === 'allies' && chance(0.3)) { const ids = Object.keys(s.partners).filter(id => s.partners[id].rel > 10 && s.partners[id].rel < 70); const id = pick(ids); if (id) { s.partners[id].rel += 2; s.partners[id].trust = Math.min(100, (s.partners[id].trust || 40) + 1); } }
    return null;
  },
  justice(s, data, ctx, m, mode) {
    if (mode === 'clean') s.st.corruption = clamp(s.st.corruption - 0.04 * (m.skill / 50), 0, 100);
    if (mode === 'rights') s.st.civil = clamp(s.st.civil + 0.03, 0, 100);
    return null;
  },
};

// ---------- Rodada semanal ----------
export function weeklyCabinet(s, data, ctx) {
  const P = s.pol; if (!P || s.ascent) return;
  initCabinet2(s);
  const d = day(s);
  // Ministros com carta branca agem (respeitando 12 semanas depois de uma ordem direta sua na pasta).
  for (const port in P.mandates) {
    const mode = P.mandates[port], m = P.cabinet[port];
    if (mode === 'off' || !m || (P.hold[port] || 0) > d) continue;
    if (!chance(0.35 + m.skill / 250)) continue;
    const r = ACTIONS[port]?.(s, data, ctx, m, mode);
    if (r) ctx.log(`${m.name} (${PORTFOLIOS[port].name}) ${r}.`, 'decision');
  }
  // Conselheiros: salários e efeitos.
  s.longMods = s.longMods.filter(m => m.id !== 'advisors');
  for (const role in P.advisors) {
    const a = P.advisors[role]; if (!a) continue;
    s.econ.treasury -= advisorSalary(s, a) / 52;
    const f = (a.skill - 40) / 50;
    const M = ADVISORS[role].mods(f);
    for (const k in M) s.longMods.push({ k, v: +M[k].toFixed(2), d: 0, left: 0, src: ADVISORS[role].name, id: 'advisors' });
  }
  // Treinamentos concluídos.
  for (const t of P.training.filter(t => t.until <= d)) {
    const who = t.kind === 'minister' ? P.cabinet[t.key] : P.advisors[t.key];
    if (who && who.name === t.name) { const g = Math.round(rand(6, 12)); who.skill = clamp(who.skill + g, 0, 95); who.loyalty = clamp((who.loyalty ?? 60) + 5, 0, 100); ctx.log(`${who.name} conclui a capacitação: competência +${g}.`, 'good'); }
  }
  P.training = P.training.filter(t => t.until > d);
  // Contestação das mudanças bruscas do governante.
  contest(s, data, ctx);
  // Estratégias do economista quando a economia vai mal.
  if ((P.planCd || 0) <= d) { const c = strategyCard(s, data); if (c) { P.planCd = d + 84; ctx.card(c); } }
  // Pedidos de obras das bancadas regionais.
  weeklyPork(s, data, ctx);
  P.wk = snap(s);
}

// ---------- Contestação ----------
function contest(s, data, ctx) {
  const P = s.pol, d = day(s), ax = s.nation.ideology?.axes || {}, wk = P.wk || snap(s), b = s.budget;
  const ev = [];
  const econContra = dir => (dir > 0 && (ax.econ ?? 0) < -25) || (dir < 0 && (ax.econ ?? 0) > 25) ? 1.8 : 1;
  const dt = b.tax - wk.tax;
  if (Math.abs(dt) > 0.05) P.hold.finance = d + 84;
  for (const k in b.spend) if (Math.abs(b.spend[k] - (wk.spend[k] ?? b.spend[k])) > 0.05) P.hold[SPEND_PORT[k] || 'finance'] = d + 84;
  if (Math.abs(dt) >= 4) ev.push({ port: 'finance', mag: Math.abs(dt) / 4 * econContra(-Math.sign(dt)), text: `${dt > 0 ? 'subir' : 'baixar'} os impostos de ${wk.tax.toFixed(0)}% para ${b.tax.toFixed(0)}% de uma vez`, rev: { kind: 'tax', v: wk.tax } });
  for (const k in b.spend) { const dv = b.spend[k] - (wk.spend[k] ?? b.spend[k]); if (Math.abs(dv) >= 1.2) ev.push({ port: SPEND_PORT[k] || 'finance', mag: Math.abs(dv) / 1.2 * (dv < 0 && ['health', 'education', 'welfare'].includes(k) && (ax.econ ?? 0) < -25 ? 1.6 : 1), text: `${dv > 0 ? 'aumentar' : 'cortar'} a verba de ${SPEND[k]?.name || k} em ${Math.abs(dv).toFixed(1)}% do PIB numa só semana`, rev: { kind: 'spend', k, v: wk.spend[k] } }); }
  for (const c of P.changes) {
    if (c.kind === 'policy') {
      const pol = data.policies.find(p => p.id === c.id), lvl = pol?.levels.find(l => l.id === c.to), old = pol?.levels.find(l => l.id === c.from);
      let contra = 1;
      if (c.id === 'economy') contra = econContra(c.dir);
      else if (LIB[c.id]) { const lib = c.dir * LIB[c.id]; if ((lib > 0 && (ax.auth ?? 0) > 20) || (lib < 0 && (ax.auth ?? 0) < -20)) contra = 1.7; }
      ev.push({ port: POLICY_PORT[c.id] || 'justice', mag: (c.jump + (c.id === 'economy' ? 0.5 : 0)) * contra * 0.8, text: `trocar "${pol?.name}" de ${old?.name} para ${lvl?.name}`, rev: { kind: 'policy', id: c.id, lvl: c.from } });
    } else ev.push({ port: 'economy', mag: c.mag * econContra(c.dir), text: c.what, rev: null });
  }
  P.changes = [];
  if (!ev.length || (P.contestCd || 0) > d) return;
  const e = ev.sort((a, b) => b.mag - a.mag)[0], m = P.cabinet[e.port];
  if (!m) return;
  const free = s.st.political;
  const p = clamp(0.12 + 0.22 * e.mag + (50 - m.loyalty) / 160, 0, 0.9) * (0.35 + free / 110);
  if (!chance(p)) return;
  P.contestCd = d + 21;
  const auth = free < 35, fac = P.factions.find(f => f.id === m.faction);
  const opts = [
    { text: 'Manter a decisão: quem governa sou eu.', hint: 'O ministro perde lealdade; pode pedir demissão.', act: { type: 'minAdvice', choice: 'keep', port: e.port } },
  ];
  if (e.rev) opts.push({ text: 'Recuar e voltar atrás.', hint: 'Desfaz a mudança; o ministro ganha força.', act: { type: 'minAdvice', choice: 'revert', port: e.port, rev: e.rev } });
  if (e.rev && e.rev.kind !== 'policy') opts.push({ text: 'Meio-termo: fazer a mudança aos poucos.', hint: 'Fica no meio do caminho; o ajuste continua gradualmente.', act: { type: 'minAdvice', choice: 'half', port: e.port, rev: e.rev } });
  opts.push({ text: `Demitir ${m.name}.`, hint: `A facção ${fac?.name || ''} se ressente.`, act: { type: 'minAdvice', choice: 'fire', port: e.port } });
  if (auth) opts.push({ text: 'Calar o ministro: ordens não se discutem.', hint: 'Medo no gabinete; risco de conspiração.', act: { type: 'minAdvice', choice: 'silence', port: e.port }, long: [{ k: 'coupRisk', v: 3, d: 120 }] });
  ctx.card({ id: `dyn_contest_${e.port}_${d}`, dyn: true, cat: 'Gabinete', title: `${m.name} contesta sua decisão`, desc: `${m.name}, ministro(a) de ${PORTFOLIOS[e.port].name}, ${auth ? 'pediu uma audiência reservada' : 'foi a público'} para questionar a decisão de ${e.text}. "${pick(['Mudanças assim, do nada, assustam o mercado e a base.', 'Isso contraria tudo o que o nosso governo defendeu.', 'Ninguém foi consultado. Não posso responder por essa pasta assim.', 'Faça aos poucos, ou o país não aguenta.'])}"`,
    context: `Lealdade de ${m.name}: ${Math.round(m.loyalty)} · facção: ${fac?.name || '—'} · ${auth ? 'regime fechado: contestar é arriscado para ele(a)' : 'em liberdade, a crise vira notícia'}.`, deadline: 14, default: 0, options: opts });
}

// ---------- Estratégias do economista ----------
function strategyCard(s, data) {
  const st = s.st, g = s.econ.gdp, def = -(s.d?.budget?.balance || 0) / g * 100, dr = debtRatio(s), P = s.pol;
  const A = P.advisors.economist, who = A ? `${A.name}, ${ADVISORS.economist.name.toLowerCase()}` : `${P.cabinet.finance.name}, ministro(a) da Fazenda`;
  const L = financeLimits(s);
  const delegate = (port, mandate, extra = {}) => ({ type: 'delegate', port, mandate, ...extra });
  let kind = null;
  if (st.inflation > 25) kind = 'inflation'; else if (dr > 90 || def > 7 || (s.econ.treasury < g * 0.002 && def > 4)) kind = 'fiscal'; else if (st.growth < -0.5) kind = 'recession'; else if ((s.d?.regionSpread || 0) > 35 && investCash(s) > g * 0.006) kind = 'regions';
  if (!kind) return null;
  const T = {
    inflation: { title: 'Plano contra a inflação', desc: `${who} alerta: a inflação chegou a ${st.inflation.toFixed(0)}% ao ano e corrói salários. Apresenta três caminhos.`, options: [
      { text: 'Permitir que execute o Plano de Estabilização (corte de gastos e juros altos).', hint: 'Inflação cai em meses; recessão curta.', act: delegate('finance', 'austerity'), long: [{ k: 'inflation', v: -6, d: 180 }, { k: 'growth', v: -0.8, d: 180 }] },
      { text: 'Congelar preços e tarifas por seis meses.', hint: 'Alívio imediato; escassez e inflação reprimida depois.', long: [{ k: 'inflation', v: -8, d: 120 }, { k: 'inflation', v: 3, d: 360 }, { k: 'growth', v: -0.3, d: 180 }] },
      { text: 'Prefiro decidir eu mesmo.', hint: 'Nada muda.' }] },
    fiscal: { title: 'Plano para as contas públicas', desc: `${who} avisa que as contas estão no limite: déficit de ${def.toFixed(1)}% do PIB e dívida de ${dr.toFixed(0)}%. Sem ajuste, os juros explodem.`, options: [
      { text: 'Permitir que execute o Plano de Ajuste.', hint: 'Corta gastos e sobe impostos aos poucos até equilibrar.', act: delegate('finance', 'austerity', { program: 'austerity' }) },
      { text: 'Permitir uma reforma tributária gradual.', hint: 'Mais arrecadação sem cortes brutos; leva tempo.', act: delegate('finance', 'balance', { program: 'taxreform' }) },
      { text: 'Prefiro decidir eu mesmo.', hint: 'Nada muda.' }] },
    recession: { title: 'Plano contra a recessão', desc: `${who} mostra que a economia encolhe ${Math.abs(st.growth).toFixed(1)}% ao ano. Ela(e) propõe uma estratégia e pede carta branca.`, options: [
      { text: 'Permitir que execute o Plano de Estímulo.', hint: 'Obras e crédito: crescimento volta; déficit sobe.', act: delegate('finance', 'stimulus', { program: 'pac' }) },
      { text: 'Permitir um plano de investimentos regionais (financiado com títulos).', hint: `Levanta até ${Math.min(1, L.bonds / g * 100).toFixed(1)}% do PIB em títulos e o ministério toca obras nas regiões.`, act: delegate('economy', 'regional', { fund: { source: 'bonds', pct: Math.min(1, L.bonds / g * 100) } }) },
      { text: 'Permitir um choque de produtividade (atrair investimento estrangeiro).', hint: 'Abertura e garantias a multinacionais.', act: delegate('economy', 'export', { program: 'fdi' }) },
      { text: 'Prefiro decidir eu mesmo.', hint: 'Nada muda.' }] },
    regions: { title: 'Regiões ficando para trás', desc: `${who} mostra que a diferença entre as regiões ricas e pobres disparou. Há dinheiro em caixa para investir.`, options: [
      { text: 'Permitir que o Ministério da Indústria execute o Plano de Desenvolvimento Regional.', hint: 'Obras nas regiões pobres, decididas pelo ministério.', act: delegate('economy', 'regional') },
      { text: 'Usar o fundo nacional para um mutirão de obras.', hint: 'Fundo → carteira de investimentos; o ministério escolhe as obras.', act: delegate('economy', 'regional', { fund: { source: 'fund', pct: 0.8 } }) },
      { text: 'Prefiro decidir eu mesmo.', hint: 'Nada muda.' }] },
  }[kind];
  return { id: `dyn_plan_${kind}_${day(s)}`, dyn: true, cat: 'Economia', title: T.title, desc: T.desc, context: 'Delegar dá carta branca ao ministério: ele age sozinho toda semana até você mudar o mandato na página Política › Gabinete.', deadline: 21, default: T.options.length - 1, options: T.options };
}

// ---------- Bancadas regionais ----------
function weeklyPork(s, data, ctx) {
  const P = s.pol, d = day(s);
  for (const x of s.pork) if (x.status === 'promised' && d >= x.due) {
    const r = s.regions.find(r => r.id === x.region);
    const built = Object.entries(s.buildings || {}).some(([pid, list]) => r?.provinces.includes(pid) && list.some(b => b.start >= x.day));
    if (!built && r) { r.unrest = clamp(r.unrest + 8, 0, 100); s.groups.regional = clamp(s.groups.regional - 3, 0, 100); ctx.news(`Promessa quebrada: a obra prometida a ${r.name} não saiu do papel. A bancada rompe com o governo.`, 'bad'); }
    x.status = built ? 'done' : 'broken';
  }
  s.pork = s.pork.filter(x => x.status === 'open' || x.status === 'promised' || d - x.day < 30);
  if (s.pork.some(x => x.status === 'open') || (P.porkCd || 0) > d) return;
  const multi = s.policies.elections === 'multiparty', camp = !!P.campaign;
  if (!chance((multi ? 0.1 : 0.05) + (camp ? 0.12 : 0) + (P.minority ? 0.05 : 0))) return;
  const cands = s.regions.filter(r => !r.cap && r.provinces.length);
  if (!cands.length) return;
  const w = cands.map(r => Math.max(1, 100 - r.infra + r.unrest * 0.6));
  let k = random() * w.reduce((a, b) => a + b, 0), r = cands[0];
  for (let i = 0; i < cands.length; i++) { k -= w[i]; if (k <= 0) { r = cands[i]; break; } }
  const type = regionNeed(s, r), pid = bestProvince(s, data, r, type);
  if (!pid) return;
  const B = BUILDINGS[type], cost = buildCost(s, type), who = personName(cul(s));
  const x = { id: 'pk' + d, region: r.id, pid, type, day: d, status: 'open', cost };
  s.pork.push(x); P.porkCd = d + 35;
  ctx.card({ id: `dyn_pork_${x.id}`, dyn: true, cat: 'Regiões', focusProv: pid, focusRegion: r.id,
    title: `Bancada de ${r.name} exige ${B.name.toLowerCase()}`, desc: `Liderados pelo(a) deputado(a) ${who}, os parlamentares de ${r.name} condicionam o apoio ao governo à construção de ${B.icon} ${B.name.toLowerCase()} em ${data.geo.prov[pid].n}. O pedido já está marcado no mapa (📢).`,
    context: `Custo: ${cost.toFixed(2)} bi (${(cost / s.econ.gdp * 100).toFixed(2)}% do PIB) · infraestrutura da região ${Math.round(r.infra)} · tensão ${Math.round(r.unrest)}${multi ? ` · a bancada tem peso no parlamento${P.minority ? ' — e o governo está em minoria' : ''}` : ''}.`, deadline: 14, default: 1,
    options: [
      { text: `Aprovar a obra em ${data.geo.prov[pid].n}.`, hint: 'A obra começa já (tesouro, carteira ou dívida). A região e a bancada agradecem.', act: { type: 'pork', id: x.id, choice: 'build' } },
      { text: 'Prometer para o próximo orçamento.', hint: 'Ganha tempo: se a obra não sair em 3 meses, a região se revolta.', act: { type: 'pork', id: x.id, choice: 'promise' } },
      { text: 'Recusar: não há dinheiro para curral eleitoral.', hint: 'Contas preservadas; a bancada e a região se irritam.', act: { type: 'pork', id: x.id, choice: 'refuse' } },
    ] });
}

export function cabinetAct(s, data, act, ctx) {
  const P = s.pol;
  if (act.type === 'delegate') {
    initCabinet2(s);
    P.mandates[act.port] = act.mandate; delete P.hold[act.port];
    let msg = `${P.cabinet[act.port]?.name} recebe carta branca: ${MANDATES[act.port]?.[act.mandate]?.[0] || act.mandate}.`;
    if (act.fund) { const r = raiseFunds(s, act.fund.source, act.fund.pct); msg += ' ' + r.msg; }
    if (act.program) { const r = startProgram(s, act.program); if (r.ok) msg += ' ' + (programById[act.program]?.name || '') + ' iniciado.'; }
    return msg;
  }
  if (act.type === 'minAdvice') {
    const m = P.cabinet[act.port], fac = P.factions.find(f => f.id === m?.faction);
    if (act.choice === 'keep') { m.loyalty = clamp(m.loyalty - 15, 0, 100); if (fac) fac.sat = clamp(fac.sat - 5, 0, 100); if (m.loyalty < 28 && chance(0.6)) { const old = m.name; P.cabinet[act.port] = { ...m, ...freshMinister(s, m.faction) }; return `${old} pede demissão em protesto. ${P.cabinet[act.port].name} assume a pasta.`; } return `A decisão está mantida. ${m.name} engole a derrota.`; }
    if (act.choice === 'revert' || act.choice === 'half') {
      const r = act.rev, f = act.choice === 'half' ? 0.5 : 1;
      if (r.kind === 'tax') s.budget.tax = clamp(s.budget.tax + (r.v - s.budget.tax) * f, 5, 60);
      if (r.kind === 'spend') s.budget.spend[r.k] = clamp(s.budget.spend[r.k] + (r.v - s.budget.spend[r.k]) * f, 0, 15);
      if (r.kind === 'policy') s.policies[r.id] = r.lvl;
      P.wk = snap(s);
      m.loyalty = clamp(m.loyalty + 6, 0, 100); if (fac) fac.sat = clamp(fac.sat + 4, 0, 100);
      return act.choice === 'half' ? 'O governo recua até o meio do caminho.' : 'O governo volta atrás.';
    }
    if (act.choice === 'fire') { const old = m.name; P.cabinet[act.port] = freshMinister(s, null); if (fac) fac.sat = clamp(fac.sat - 10, 0, 100); return `${old} é demitido(a); ${P.cabinet[act.port].name} assume.`; }
    if (act.choice === 'silence') { m.loyalty = clamp(m.loyalty - 25, 0, 100); s.st.political = clamp(s.st.political - 1, 0, 100); return `${m.name} recebe o recado e se cala.`; }
  }
  if (act.type === 'regionBuild') {
    const r = s.regions.find(r => r.id === act.region) || pick(s.regions.filter(r => !r.cap)) || s.regions[0];
    if (!r) return '';
    const type = act.build && act.build !== 'auto' ? act.build : regionNeed(s, r), pid = bestProvince(s, data, r, type);
    if (!pid) return '';
    const cost = buildCost(s, type);
    payInvest(s, cost);
    if (s.econ.treasury < 0) { s.econ.debt += -s.econ.treasury; s.econ.treasury = 0; }
    ((s.buildings ||= {})[pid] ||= []).push({ type, start: day(s), done: day(s) + BUILDINGS[type].weeks * 7, active: false, cost, by: 'issue' });
    r.invest = clamp(r.invest + 5, 0, 100);
    return `Obra iniciada: ${BUILDINGS[type].icon} ${BUILDINGS[type].name} em ${data.geo.prov[pid].n} (${r.name}).`;
  }
  if (act.type === 'pork') {
    const x = s.pork.find(p => p.id === act.id), r = x && s.regions.find(r => r.id === x.region);
    if (!x || !r) return '';
    if (act.choice === 'build' || act.choice === 'promised-build') {
      const cost = buildCost(s, x.type);
      payInvest(s, cost);
      if (s.econ.treasury < 0) { s.econ.debt += -s.econ.treasury; s.econ.treasury = 0; }
      ((s.buildings ||= {})[x.pid] ||= []).push({ type: x.type, start: day(s), done: day(s) + BUILDINGS[x.type].weeks * 7, active: false, cost, by: 'pork' });
      r.unrest = clamp(r.unrest - 6, 0, 100); r.invest = clamp(r.invest + 6, 0, 100);
      s.groups.regional = clamp(s.groups.regional + 4, 0, 100); s.st.corruption = clamp(s.st.corruption + 0.8, 0, 100);
      if (P.campaign) P.campaign.boost = (P.campaign.boost || 0) + 1;
      x.status = 'done';
      return `${BUILDINGS[x.type].name} em ${data.geo.prov[x.pid].n}: obra iniciada. A bancada de ${r.name} fecha com o governo.`;
    }
    if (act.choice === 'promise') { x.status = 'promised'; x.due = day(s) + 84; r.invest = clamp(r.invest + 4, 0, 100); return `Promessa feita a ${r.name}: a obra precisa começar em até 12 semanas.`; }
    if (act.choice === 'refuse') { x.status = 'refused'; r.unrest = clamp(r.unrest + 6, 0, 100); s.groups.regional = clamp(s.groups.regional - 4, 0, 100); if (s.pol?.campaign) s.pol.campaign.boost = (s.pol.campaign.boost || 0) - 1; return `A bancada de ${r.name} rompe com o governo.`; }
  }
  return '';
}
function freshMinister(s, faction) {
  const fs = s.pol?.factions || [];
  const trait = pick(['técnico', 'populista', 'corrupto', 'linha-dura', 'carismático', 'leal', 'ambicioso', 'midiático']);
  return { name: personName(cul(s)), skill: Math.round(rand(30, 85)), loyalty: Math.round(rand(45, 80)), corrupt: Math.round(rand(5, 45)), trait, faction: faction || (fs.length ? pick(fs).id : 'tech'), since: day(s) };
}
