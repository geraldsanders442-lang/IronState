// Líderes regionais: nomeados (apoiam a unidade nacional) ou eleitos (legítimos, mas podem se opor e até fomentar
// o separatismo). Recebem verba do orçamento, executam obras locais, pedem obras ao jogador, podem ser corruptos
// e podem ser destituídos — o que gera crises internas e externas conforme a liberdade de protesto e o poder do governo.
import { clamp, chance, rand, pick, random } from './util.js';
import { personName, cultureOf } from './names.js';
import { BUILDINGS, buildCost } from './markets.js';
import { regionNeed, bestProvince } from './cabinet.js';
import { investCash, payInvest } from './finance.js';
import { sponsorInsurgency } from './covert.js';
import { GOV_MODES, LEADER_TRAITS, STANCE_NAMES, transferAnnual } from './govcore.js';

export { GOV_MODES, LEADER_TRAITS, STANCE_NAMES, transferAnnual };
const day = s => Math.floor(s.time.min / 1440);
const TERM = 4 * 365;

// ---------- Criação ----------
function defaultMode(s) {
  const a = s.policies.autonomy, el = s.policies.elections;
  if (a === 'federal') return el === 'none' ? 'appointed' : 'elected';
  if (a === 'centralized') return 'appointed';
  return el === 'multiparty' && s.st.political > 55 ? 'elected' : 'appointed';
}
function nameFor(s, data, r) {
  const a3 = data.geo.prov[r.provinces[0]]?.a3;
  return personName(cultureOf(data, a3) || s.nation.culture || 'en');
}
export function newLeader(s, data, r, kind, opt = {}) {
  const tk = opt.trait || pick(Object.keys(LEADER_TRAITS)), T = LEADER_TRAITS[tk];
  const el = kind === 'elected';
  const L = {
    name: nameFor(s, data, r), kind, trait: tk,
    skill: clamp(Math.round(rand(35, 75) + T.skill), 10, 95),
    corrupt: clamp(Math.round(rand(15, 50) + T.corrupt + (s.st.corruption - 40) * 0.4), 2, 95),
    loyalty: opt.loyalty ?? Math.round(el ? clamp(rand(30, 75) - (r.sep || 0) * 25, 8, 90) : rand(58, 88)),
    popularity: opt.popularity ?? Math.round(clamp((el ? rand(52, 78) : rand(30, 55)) + T.pop, 5, 95)),
    ambition: clamp(Math.round(rand(25, 60) + T.ambition), 5, 95),
    autonomy: opt.autonomy ?? (el ? 65 : 40), since: day(s), termEnd: el ? day(s) + (opt.term ?? Math.round(rand(150, TERM))) : null,
    bank: 0, stance: 'neutral', cd: day(s) + Math.round(rand(40, 110)), interim: !!opt.interim, defiant: 0, spent: 0, scandal: 0,
  };
  L.stance = stanceOf(L, r);
  return L;
}
const stanceOf = (L, r) => L.loyalty >= 60 ? 'loyal' : L.loyalty >= 35 ? 'neutral' : (L.loyalty < 18 && (r.sep || 0) > 0.35 ? 'separatist' : 'opposition');

export function initGovernors(s, data) {
  if (s.gov) return;
  s.gov = { mode: defaultMode(s), leaders: {}, cardCd: day(s) + 60, changeCd: 0, removed: 0, hist: [] };
  syncGovernors(s, data);
}
export function syncGovernors(s, data) {
  const G = s.gov; if (!G) return;
  const ids = new Set(s.regions.filter(r => !r.cap).map(r => r.id));
  for (const rid of Object.keys(G.leaders)) if (!ids.has(rid)) delete G.leaders[rid];
  if (G.mode === 'none') return;
  for (const r of s.regions) if (ids.has(r.id) && !G.leaders[r.id]) G.leaders[r.id] = newLeader(s, data, r, G.mode);
}
export const govRegions = s => s.regions.filter(r => !r.cap);

// ---------- Mudança de modo ----------
export function setGovMode(s, data, mode, ctx) {
  initGovernors(s, data);
  const G = s.gov;
  if (mode === G.mode) return { ok: false, msg: 'Esse já é o modelo atual.' };
  if (G.changeCd > day(s)) return { ok: false, msg: `Mudar de modelo de novo só é possível em ${G.changeCd - day(s)} dias.` };
  G.changeCd = day(s) + 365;
  const old = G.mode; G.mode = mode;
  if (mode === 'none') {
    for (const r of govRegions(s)) { const L = G.leaders[r.id]; if (L) r.unrest = clamp(r.unrest + (L.kind === 'elected' ? 0.25 : 0.08) * L.popularity * (0.4 + (s.st.political + s.st.civil) / 200), 0, 100); }
    G.leaders = {};
    s.st.legitimacy = clamp(s.st.legitimacy - (old === 'elected' ? 5 : 2), 0, 100);
    s.groups.regional = clamp(s.groups.regional - 8, 0, 100);
    return { ok: true, msg: 'Os governos regionais foram dissolvidos. A capital assume a administração direta.', log: true };
  }
  if (mode === 'elected') {
    for (const r of govRegions(s)) { const L = G.leaders[r.id]; const keep = L && chance(0.5); G.leaders[r.id] = newLeader(s, data, r, 'elected', keep ? { trait: L.trait, loyalty: clamp(L.loyalty - 5, 10, 90), term: 56 } : { term: Math.round(rand(60, 120)) }); }
    s.groups.regional = clamp(s.groups.regional + 6, 0, 100);
    return { ok: true, msg: 'Eleições regionais foram convocadas: os governadores passam a ser escolhidos pelo voto.', log: true };
  }
  for (const r of govRegions(s)) { const L = G.leaders[r.id]; if (L) { L.kind = 'appointed'; L.termEnd = null; L.autonomy = Math.min(L.autonomy, 55); L.loyalty = clamp(L.loyalty + 12, 0, 100); } else G.leaders[r.id] = newLeader(s, data, r, 'appointed'); }
  s.groups.regional = clamp(s.groups.regional - 5, 0, 100);
  s.st.legitimacy = clamp(s.st.legitimacy - (old === 'elected' ? 3 : 0), 0, 100);
  return { ok: true, msg: 'O governo passa a nomear os governadores regionais.', log: true };
}

export function setAutonomy(s, rid, delta) {
  const L = s.gov?.leaders[rid]; if (!L) return { ok: false, msg: 'Sem líder nesta região.' };
  const v = clamp(L.autonomy + delta, 0, 100);
  if (v === L.autonomy) return { ok: false, msg: 'Limite atingido.' };
  L.autonomy = v;
  L.loyalty = clamp(L.loyalty + (delta > 0 ? 3 : -4) * (L.kind === 'elected' ? 1.4 : 1), 0, 100);
  return { ok: true, msg: `Autonomia ${delta > 0 ? 'ampliada' : 'reduzida'}: ${v}/100.` };
}

// ---------- Destituição ----------
export function removeLeader(s, data, rid, reason, ctx, opt = {}) {
  const G = s.gov, L = G?.leaders[rid], r = s.regions.find(x => x.id === rid);
  if (!L || !r) return { ok: false, msg: 'Sem líder nesta região.' };
  const free = (s.st.political + s.st.civil) / 200, power = (s.st.control + s.st.legitimacy) / 200, el = L.kind === 'elected';
  const pop = L.popularity / 100;
  const protests = free * pop * (el ? 1 : 0.4);
  // Efeitos imediatos
  s.st.legitimacy = clamp(s.st.legitimacy - (reason === 'scandal' ? -1 : (el ? 3 + 8 * free * pop : 1 + 3 * pop)), 0, 100);
  r.unrest = clamp(r.unrest + (reason === 'scandal' ? -3 : L.popularity * (el ? 0.32 : 0.1) * (0.4 + free)), 0, 100);
  r.sep = clamp((r.sep || 0) + (reason === 'scandal' ? 0 : (el ? 0.1 * pop : 0.03)), 0, 1);
  if (protests > 0.08) s.longMods.push({ k: 'protest', v: +(10 * protests).toFixed(1), d: 70, left: 70, src: `Protestos por ${L.name}` });
  s.groups.regional = clamp(s.groups.regional - (reason === 'scandal' ? 0 : 4 + 6 * pop), 0, 100);
  // Efeitos externos: democracias estranham a destituição de eleitos.
  if (el && reason !== 'scandal') {
    s.st.reputation = clamp(s.st.reputation - (2 + 5 * free * pop), 0, 100);
    for (const id in s.partners) { const lib = data.reg[id]?.profile?.liberty ?? 50; if (lib > 65 && s.world.c[id]) s.partners[id].rel = clamp(s.partners[id].rel - 3 * free, -100, 100); }
  } else if (reason === 'scandal') s.st.reputation = clamp(s.st.reputation + 1, 0, 100);
  // Rivais que reivindicam a região aproveitam a crise
  for (const cl of s.world.claims) if (cl.holder === 'PLY' && cl.status === 'active' && cl.provs.some(p => r.provinces.includes(p))) sponsorInsurgency(s, cl.claimant, 12);
  G.removed++; G.hist.unshift({ day: day(s), text: `${L.name} (${r.name}) destituído(a): ${reason}` }); if (G.hist.length > 20) G.hist.length = 20;
  // Substituição
  delete G.leaders[rid];
  if (!opt.noReplace && G.mode !== 'none') {
    const nL = newLeader(s, data, r, 'appointed', { loyalty: Math.round(rand(60, 85)), popularity: Math.round(rand(15, 35)), interim: el, autonomy: Math.min(L.autonomy, 50) });
    if (el) { nL.kind = 'appointed'; nL.interim = true; nL.termEnd = null; nL.electionAt = day(s) + 182; }
    G.leaders[rid] = nL;
  }
  // Crise regional: mais provável com liberdade de protesto, líder popular e governo fraco
  const pCrisis = clamp(protests * 0.55 + (el ? 0.12 : 0) + (r.sep || 0) * 0.15 - power * 0.35, 0, 0.75);
  if (reason !== 'scandal' && chance(pCrisis) && ctx?.card) { ctx.card(crisisCard(s, data, r, L, rid, protests)); }
  const out = `${L.name} foi destituído(a) do governo de ${r.name}.`;
  return { ok: true, msg: out + (protests > 0.25 ? ' Manifestações tomam as ruas da região.' : ''), log: true };
}

// ---------- Cartas ----------
const card = (s, rid, kind, x) => ({ id: `dyn_gov_${kind}_${rid}_${day(s)}`, dyn: true, cat: 'Regiões', focusRegion: rid, deadline: 14, ...x });
function workCard(s, data, r, L) {
  const type = regionNeed(s, r), pid = bestProvince(s, data, r, type);
  if (!pid) return null;
  const B = BUILDINGS[type], cost = buildCost(s, type), share = Math.min(L.bank, cost);
  return card(s, r.id, 'work', {
    title: `${L.name} pede ${B.name.toLowerCase()} em ${data.geo.prov[pid].n}`,
    desc: `${L.kind === 'elected' ? 'O governador eleito' : 'O governador'} de ${r.name}, ${L.name}, quer erguer ${B.icon} ${B.name.toLowerCase()} em ${data.geo.prov[pid].n} e pergunta se o governo central autoriza e ajuda a financiar.`,
    context: `Custo: ${cost.toFixed(2)} bi (${(cost / s.econ.gdp * 100).toFixed(2)}% do PIB). Caixa regional: ${L.bank.toFixed(2)} bi · lealdade ${Math.round(L.loyalty)} · popularidade ${Math.round(L.popularity)}.`, focusProv: pid, default: 2,
    options: [
      { text: `Autorizar com o caixa regional${share < cost ? ` (a região cobre ${share.toFixed(2)} bi; o resto é seu)` : ''}.`, hint: 'A obra começa; a região paga o que puder.', act: { type: 'gov', kind: 'work', rid: r.id, build: type, pid, choice: 'share' } },
      { text: 'Financiar a obra por completo.', hint: 'Custa o valor integral; o governador e a região agradecem muito.', act: { type: 'gov', kind: 'work', rid: r.id, build: type, pid, choice: 'full' } },
      { text: 'Negar o pedido.', hint: 'Sem custo; o governador se ressente.', act: { type: 'gov', kind: 'work', rid: r.id, build: type, pid, choice: 'deny' } }] });
}
function scandalCard(s, data, r, L) {
  return card(s, r.id, 'scandal', {
    title: `Escândalo de corrupção em ${r.name}`, crisis: false,
    desc: `A imprensa denuncia desvios de verbas no governo de ${L.name} em ${r.name}: obras superfaturadas e empresas de aliados favorecidas.`,
    context: `Corrupção do líder ${Math.round(L.corrupt)} · popularidade ${Math.round(L.popularity)} · liberdade de protesto ${Math.round((s.st.political + s.st.civil) / 2)}. Destituir um líder popular pode causar protestos.`, default: 1,
    options: [
      { text: 'Destituir e processar o governador.', hint: 'Combate a corrupção; se ele for popular ou eleito, pode haver crise.', act: { type: 'gov', kind: 'scandal', rid: r.id, choice: 'remove' } },
      { text: 'Abafar o caso.', hint: 'Evita a crise agora; corrupção e desconfiança crescem.', act: { type: 'gov', kind: 'scandal', rid: r.id, choice: 'cover' } },
      { text: 'Abrir uma auditoria.', hint: 'Custa um pouco; reduz a corrupção do líder, mas ele se ressente.', act: { type: 'gov', kind: 'scandal', rid: r.id, choice: 'probe' } }] });
}
function refCard(s, data, r, L) {
  return card(s, r.id, 'ref', {
    title: `${L.name} exige um referendo de independência em ${r.name}`, crisis: true, deadline: 10,
    desc: `O governador ${L.kind === 'elected' ? 'eleito' : ''} de ${r.name}, ${L.name}, rompeu com o governo central e ameaça convocar um referendo de independência por conta própria.`,
    context: `Lealdade ${Math.round(L.loyalty)} · tensão regional ${Math.round(r.unrest)} · separatismo regional ${(r.sep || 0).toFixed(2)}. Recusar sem negociar pode empurrá-lo à declaração unilateral.`, default: 3,
    options: [
      { text: 'Aceitar um referendo acordado.', hint: 'Legitima o processo; se perder, a região sai.', act: { type: 'gov', kind: 'ref', rid: r.id, choice: 'referendum' } },
      { text: 'Negociar autonomia ampla.', hint: 'Mais autonomia e verba; ele volta à mesa.', act: { type: 'gov', kind: 'ref', rid: r.id, choice: 'negotiate' } },
      { text: 'Destituir o governador.', hint: 'Mostra força; risco de crise e de apoio externo aos rebeldes.', act: { type: 'gov', kind: 'ref', rid: r.id, choice: 'remove' } },
      { text: 'Ignorar o ultimato.', hint: 'Nada muda agora; ele pode declarar independência.', act: { type: 'gov', kind: 'ref', rid: r.id, choice: 'ignore' } }] });
}
function crisisCard(s, data, r, L, rid, protests) {
  return card(s, rid, 'crisis', {
    title: `Crise em ${r.name} após a queda de ${L.name}`, crisis: true, deadline: 7,
    desc: `A destituição de ${L.name} incendiou ${r.name}: comícios, greves e prefeituras ocupadas. Parte da polícia local hesita em obedecer.`,
    context: `Mobilização ${Math.round(protests * 100)}% · tensão regional ${Math.round(r.unrest)}. A resposta define se a crise esfria ou se espalha.`, default: 1,
    options: [
      { text: 'Reprimir os protestos.', hint: 'Restaura a ordem; reputação, direitos civis e ressentimento sofrem.', act: { type: 'gov', kind: 'crisis', rid, choice: 'crush' } },
      { text: 'Negociar e convocar novas eleições locais.', hint: 'Esfria a crise; o governo perde um pouco de autoridade.', act: { type: 'gov', kind: 'crisis', rid, choice: 'negotiate' } },
      { text: 'Reconduzir o governador ao cargo.', hint: 'Humilhante, mas encerra a crise.', act: { type: 'gov', kind: 'crisis', rid, choice: 'reinstate', leader: L } }] });
}

// ---------- Resolução das cartas ----------
export function governorsAct(s, data, act, ctx) {
  const G = s.gov, r = s.regions.find(x => x.id === act.rid), L = G?.leaders[act.rid];
  if (act.kind === 'work') {
    if (!L || !r) return '';
    if (act.choice === 'deny') { L.loyalty = clamp(L.loyalty - (L.kind === 'elected' ? 9 : 5), 0, 100); L.popularity = clamp(L.popularity - 2, 0, 100); r.unrest = clamp(r.unrest + 2, 0, 100); return `O pedido de ${L.name} foi negado.`; }
    const cost = buildCost(s, act.build), own = act.choice === 'share' ? Math.min(L.bank, cost) : 0;
    L.bank -= own;
    const rest = cost - own;
    if (rest > 0) { if (investCash(s) < rest) { L.bank += own; return 'Sem recursos para o restante da obra.'; } payInvest(s, rest); }
    ((s.buildings ||= {})[act.pid] ||= []).push({ type: act.build, start: day(s), done: day(s) + BUILDINGS[act.build].weeks * 7, active: false, cost, by: 'gov' });
    L.spent += cost;
    const full = act.choice === 'full';
    L.loyalty = clamp(L.loyalty + (full ? 12 : 6), 0, 100); L.popularity = clamp(L.popularity + (full ? 6 : 3), 0, 100);
    r.unrest = clamp(r.unrest - 4, 0, 100); r.invest = clamp(r.invest + 4, 0, 100); s.groups.regional = clamp(s.groups.regional + (full ? 3 : 1.5), 0, 100);
    return `${BUILDINGS[act.build].icon} ${BUILDINGS[act.build].name} em ${data.geo.prov[act.pid].n}: obra iniciada com ${full ? 'financiamento federal' : 'parceria regional'}.`;
  }
  if (act.kind === 'scandal') {
    if (!L || !r) return '';
    if (act.choice === 'remove') return removeLeader(s, data, act.rid, 'scandal', ctx).msg;
    if (act.choice === 'cover') { s.st.legitimacy = clamp(s.st.legitimacy - 2, 0, 100); s.st.corruption = clamp(s.st.corruption + 1.5, 0, 100); L.loyalty = clamp(L.loyalty + 8, 0, 100); L.scandal++; return `O caso de ${L.name} é abafado.`; }
    s.econ.treasury -= s.econ.gdp * 0.0003; L.corrupt = clamp(L.corrupt - 18, 0, 100); L.loyalty = clamp(L.loyalty - 8, 0, 100); return `Auditoria em ${r.name}: a corrupção de ${L.name} cai.`;
  }
  if (act.kind === 'ref') {
    if (!L || !r) return '';
    if (act.choice === 'remove') return removeLeader(s, data, act.rid, 'desafio ao governo central', ctx).msg;
    if (act.choice === 'negotiate') { L.autonomy = clamp(L.autonomy + 20, 0, 95); L.loyalty = clamp(L.loyalty + 24, 0, 100); r.sep = clamp((r.sep || 0) - 0.12, 0, 1); s.st.control = clamp(s.st.control - 2, 0, 100); L.defiant = 0; return `${L.name} aceita voltar à mesa: autonomia ampliada.`; }
    if (act.choice === 'ignore') { L.defiant++; L.loyalty = clamp(L.loyalty - 8, 0, 100); return ''; }
    const leave = chance(clamp(0.2 + (r.sep || 0) * 0.5 + (100 - (s.d?.support ?? 50)) / 300 + r.unrest / 400, 0.1, 0.85));
    s.st.reputation = clamp(s.st.reputation + 3, 0, 100);
    if (leave) { const nm = ctx.secede ? ctx.secede(r) : r.name; ctx.news(`O referendo em ${r.name} aprova a independência.`, 'war'); return `O referendo aprovou a separação de ${nm}.`; }
    L.loyalty = clamp(L.loyalty + 30, 0, 100); r.sep = clamp((r.sep || 0) - 0.25, 0, 1); s.st.legitimacy = clamp(s.st.legitimacy + 3, 0, 100); L.defiant = 0;
    return `O referendo rejeitou a independência de ${r.name}.`;
  }
  if (act.kind === 'crisis') {
    if (!r) return '';
    if (act.choice === 'crush') { s.st.reputation = clamp(s.st.reputation - 4, 0, 100); s.st.civil = clamp(s.st.civil - 3, 0, 100); s.st.control = clamp(s.st.control + 3, 0, 100); r.unrest = clamp(r.unrest - 10, 0, 100); r.sep = clamp((r.sep || 0) + 0.08, 0, 1); s.econ.treasury -= s.econ.gdp * 0.002; return `A crise em ${r.name} é sufocada à força.`; }
    if (act.choice === 'negotiate') { r.unrest = clamp(r.unrest - 14, 0, 100); s.st.legitimacy = clamp(s.st.legitimacy - 2, 0, 100); const nl = G.leaders[act.rid]; if (nl) { nl.electionAt = day(s) + 56; } return `Negociações esfriam ${r.name}; novas eleições locais foram marcadas.`; }
    if (act.choice === 'reinstate' && act.leader) { G.leaders[act.rid] = { ...act.leader, loyalty: clamp(act.leader.loyalty - 15, 0, 100), popularity: clamp(act.leader.popularity + 8, 0, 100), ambition: clamp(act.leader.ambition + 8, 0, 100) }; r.unrest = clamp(r.unrest - 22, 0, 100); s.st.legitimacy = clamp(s.st.legitimacy - 3, 0, 100); return `${act.leader.name} volta ao governo de ${r.name}.`; }
  }
  return '';
}

// ---------- Ação do jogador: financiar obra local ----------
export const GOV_WORKS = ['hospital', 'railway', 'housing', 'university', 'factory', 'power', 'farm'].filter(Boolean);
export function fundWork(s, data, rid, type) {
  const r = s.regions.find(x => x.id === rid), L = s.gov?.leaders[rid];
  if (!r) return { ok: false, msg: '?' };
  const B = BUILDINGS[type]; if (!B) return { ok: false, msg: 'Obra desconhecida.' };
  const pid = bestProvince(s, data, r, type); if (!pid) return { ok: false, msg: 'Nenhuma província da região comporta essa obra agora.' };
  const cost = buildCost(s, type);
  if (investCash(s) < cost) return { ok: false, msg: 'Sem recursos (tesouro + carteira de investimentos).' };
  payInvest(s, cost);
  ((s.buildings ||= {})[pid] ||= []).push({ type, start: day(s), done: day(s) + B.weeks * 7, active: false, cost, by: 'gov' });
  r.invest = clamp(r.invest + 5, 0, 100); r.unrest = clamp(r.unrest - 3, 0, 100);
  if (L) { L.loyalty = clamp(L.loyalty + 7, 0, 100); L.popularity = clamp(L.popularity + 3, 0, 100); L.spent += cost; }
  return { ok: true, msg: `${B.icon} ${B.name} em ${data.geo.prov[pid].n} financiada pelo governo central.`, log: true };
}
export function appointNew(s, data, rid) {
  const G = s.gov, r = s.regions.find(x => x.id === rid), L = G?.leaders[rid];
  if (!r || !L) return { ok: false, msg: '?' };
  if (G.mode !== 'appointed' && !L.interim) return { ok: false, msg: 'Só se nomeia governadores no modelo de líderes nomeados.' };
  return removeLeader(s, data, rid, 'substituição por nomeação', null, {});
}

// ---------- Rodada semanal ----------
export function weeklyGovernors(s, data, ctx) {
  initGovernors(s, data);
  const G = s.gov, d = day(s);
  syncGovernors(s, data);
  s.longMods = s.longMods.filter(m => !String(m.id || '').startsWith('gov_'));
  const mods = { control: 0, separatism: 0, g_regional: 0, efficiency: 0, corruption: 0 };
  const support = s.d?.support ?? 50, free = (s.st.political + s.st.civil) / 200;
  if (G.mode === 'none') {
    mods.control += 4; mods.g_regional -= 8; mods.efficiency += 1; mods.qol = -1.2; // menos serviços e obras locais
    for (const r of govRegions(s)) { r.infra = clamp(r.infra - 0.03, 1, 99); if ((r.sep || 0) > 0.3) r.unrest = clamp(r.unrest + 0.05, 0, 100); }
  } else {
    let cardMade = false;
    for (const r of govRegions(s)) {
      const L = G.leaders[r.id]; if (!L) continue;
      const el = L.kind === 'elected', pw = r.popShare;
      // Verba: parte vira melhoria contínua, parte vai ao caixa regional
      const alloc = s.econ.gdp * 0.004 * pw * (0.5 + L.autonomy / 100) * (el ? 1.25 : 1) / 52;
      const eff = alloc / s.econ.gdp * 100 * (L.skill / 60) * (1 - L.corrupt / 100 * 0.6);
      L.bank = Math.min(s.econ.gdp * 0.01, L.bank + alloc * 0.5);
      mods.qol = (mods.qol || 0) + clamp(eff * 120 * pw, 0, 0.6); // serviços e obras locais melhoram a vida
      r.infra = clamp(r.infra + eff * 55, 1, 99); r.housing = clamp(r.housing + eff * 25, 1, 99); r.unrest = clamp(r.unrest - eff * 30, 0, 100);
      s.st.corruption = clamp(s.st.corruption + L.corrupt / 100 * alloc / s.econ.gdp * 100 * 3, 0, 100);
      // Lealdade e popularidade
      const target = el ? 58 - (r.sep || 0) * 34 + (support - 50) * 0.3 + (L.autonomy - 50) * 0.18 - L.ambition * 0.12 - Math.max(0, r.unrest - 45) * 0.2
        : 74 + (support - 50) * 0.2 - Math.max(0, r.unrest - 40) * 0.25 + (L.autonomy - 50) * 0.08 - L.ambition * 0.08;
      L.loyalty = clamp(L.loyalty + (target - L.loyalty) * 0.04 + rand(-0.8, 0.8), 0, 100);
      const pTarget = clamp(60 - r.unrest * 0.45 + eff * 400 - L.corrupt * 0.2 + (el ? 8 : -8) + L.scandal * -4, 5, 95);
      L.popularity = clamp(L.popularity + (pTarget - L.popularity) * 0.03, 0, 100);
      const prev = L.stance; L.stance = stanceOf(L, r);
      if (L.stance !== prev && (L.stance === 'opposition' || L.stance === 'separatist') && ctx.news) ctx.news(`${L.name}, governador(a) de ${r.name}, rompe com o governo central.`, 'warn');
      // Efeitos agregados por postura
      const w = pw * 2.2;
      if (L.stance === 'loyal') { mods.control += 0.7 * w; mods.separatism -= 1.2 * w * (el ? 0.7 : 1); mods.g_regional += 0.8 * w; }
      else if (L.stance === 'opposition') { mods.separatism += 2.2 * w; mods.g_regional -= 0.5 * w; mods.control -= 0.8 * w; r.unrest = clamp(r.unrest + 0.1, 0, 100); }
      else if (L.stance === 'separatist') { mods.separatism += 5 * w; mods.control -= 2 * w; r.unrest = clamp(r.unrest + 0.25, 0, 100); r.sep = clamp((r.sep || 0) + 0.002, 0, 1); }
      mods.control -= (L.autonomy - 50) * 0.02 * w;
      mods.corruption += (L.corrupt - 35) * 0.02 * w;
      // Eleições regionais
      if (el && L.termEnd && d >= L.termEnd) { regionalElection(s, data, r, L, ctx); continue; }
      if (L.electionAt && d >= L.electionAt) { regionalElection(s, data, r, L, ctx); continue; }
      // Declaração unilateral
      if (L.stance === 'separatist' && L.defiant >= 1 && r.unrest > 62 && s.st.control < 48 && d - (s.flags.secessionDay || -999) > 180 && chance(0.025) && ctx.secede) {
        s.flags.secessionDay = d;
        const nm = ctx.secede(r); ctx.news(`${L.name} proclama unilateralmente a independência de ${nm}!`, 'war');
        delete G.leaders[r.id]; continue;
      }
      // Cartas (uma por vez, com intervalo)
      if (!cardMade && G.cardCd <= d && L.cd <= d) {
        let c = null;
        if (L.stance === 'separatist' && !L.refAsked && chance(0.3)) { L.refAsked = d + 180; c = refCard(s, data, r, L); }
        else if (L.refAsked && L.refAsked <= d) L.refAsked = 0;
        else if (L.corrupt > 40 && chance(L.corrupt / 100 * 0.04 * (1 - s.st.efficiency / 160)) ) c = scandalCard(s, data, r, L);
        else if (chance(0.06 + (el ? 0.03 : 0)) && L.stance !== 'separatist') c = workCard(s, data, r, L);
        if (c && ctx.card) { ctx.card(c); G.cardCd = d + 12; L.cd = d + Math.round(rand(60, 130)); cardMade = true; }
      }
    }
  }
  for (const k in mods) if (Math.abs(mods[k]) > 0.01) s.longMods.push({ k, v: +mods[k].toFixed(2), d: 0, left: 0, src: G.mode === 'none' ? 'Administração direta' : 'Líderes regionais', id: 'gov_' + k });
}

function regionalElection(s, data, r, L, ctx) {
  const G = s.gov, support = s.d?.support ?? 50;
  const free = (s.st.political + s.st.civil) / 200;
  const pOpp = clamp(0.22 + (50 - support) / 160 + (r.sep || 0) * 0.35 + r.unrest / 330 - L.popularity / 400, 0.08, 0.88);
  const oppWins = chance(pOpp);
  if (L.interim && !oppWins && G.mode === 'appointed') { L.electionAt = 0; return; }
  if (oppWins) {
    const trait = chance(0.4) ? 'regionalista' : undefined;
    G.leaders[r.id] = newLeader(s, data, r, 'elected', { trait, loyalty: Math.round(rand(10, 42)), popularity: Math.round(rand(58, 82)), autonomy: Math.max(60, L.autonomy), term: TERM });
    ctx.news(`Oposição vence a eleição em ${r.name}: ${G.leaders[r.id].name} assume o governo regional.`, 'warn');
    r.unrest = clamp(r.unrest - 3, 0, 100);
  } else {
    L.termEnd = day(s) + TERM; L.electionAt = 0; L.interim = false; L.kind = 'elected'; L.popularity = clamp(L.popularity + 6, 0, 100); L.loyalty = clamp(L.loyalty + 8, 0, 100);
    ctx.news(`${L.name} é reeleito(a) em ${r.name}.`, 'info');
  }
}
