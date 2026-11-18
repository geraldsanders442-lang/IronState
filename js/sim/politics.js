// Política interna: partidos, parlamento, eleições, facções do regime, gabinete por pasta,
// vida do governante, golpes e revoluções jogáveis (podem virar guerra civil) e constituição.
import { clamp, chance, rand, pick, random } from './util.js';
import { personName, leaderName, genderize } from './names.js';

const day = s => Math.floor(s.time.min / 1440);
const culture = s => s.nation.culture || 'en';

// ---------- Partidos ----------
export const PARTY_TYPES = {
  com: { names: ['Partido Comunista', 'Frente Operária', 'Partido Revolucionário dos Trabalhadores'], color: '#b71c1c', ax: { econ: -85, auth: 45, nation: 0, relig: -60 }, appeal: { workers: 0.6, youth: 0.15, opposition: 0.1 } },
  soc: { names: ['Partido Socialista', 'Partido dos Trabalhadores', 'Social-Democracia'], color: '#e53935', ax: { econ: -45, auth: -20, nation: -10, relig: -20 }, appeal: { workers: 0.5, bureaucracy: 0.25, youth: 0.2 } },
  green: { names: ['Partido Verde', 'Rede Sustentabilidade', 'Aliança Ecológica'], color: '#2e7d32', ax: { econ: -10, auth: -45, nation: -30, relig: -20 }, appeal: { youth: 0.6, opposition: 0.15 } },
  lib: { names: ['Partido Liberal', 'Novo Rumo', 'Aliança Liberal'], color: '#f9a825', ax: { econ: 65, auth: -45, nation: -20, relig: -20 }, appeal: { business: 0.5, youth: 0.25, opposition: 0.15 } },
  cons: { names: ['Partido Conservador', 'União Democrática', 'Partido Republicano'], color: '#1565c0', ax: { econ: 45, auth: 15, nation: 25, relig: 40 }, appeal: { business: 0.35, rural: 0.35, bureaucracy: 0.15 } },
  rel: { names: ['Democracia Cristã', 'Partido da Fé', 'Movimento dos Valores'], color: '#6d4c41', ax: { econ: 10, auth: 25, nation: 25, relig: 85 }, appeal: { rural: 0.6, workers: 0.1 } },
  nat: { names: ['Frente Nacional', 'Partido da Pátria', 'Movimento Nacionalista'], color: '#37474f', ax: { econ: 20, auth: 55, nation: 85, relig: 30 }, appeal: { military: 0.45, rural: 0.2, workers: 0.15 } },
  pop: { names: ['Movimento Popular', 'Partido do Povo', 'Força Cidadã'], color: '#8e24aa', ax: { econ: -15, auth: 30, nation: 40, relig: 10 }, appeal: { workers: 0.3, rural: 0.3, youth: 0.15 } },
  reg: { names: ['Partido Regionalista'], color: '#00838f', ax: { econ: 0, auth: -10, nation: -40, relig: 0 }, appeal: { regional: 1 } },
};
const AXK = ['econ', 'auth', 'nation', 'relig'];
const dist = (a, b) => Math.sqrt(AXK.reduce((t, k) => t + ((a?.[k] || 0) - (b?.[k] || 0)) ** 2, 0));
export function electionMode(s) { return s.policies.elections || 'controlled'; }

export function initPolitics(s) {
  if (s.pol) return;
  const ax = s.nation.ideology?.axes || {};
  const types = Object.keys(PARTY_TYPES).filter(t => t !== 'reg');
  const govType = types.reduce((b, t) => dist(ax, PARTY_TYPES[t].ax) < dist(ax, PARTY_TYPES[b].ax) ? t : b, types[0]);
  const parties = [];
  const mk = (type, gov) => {
    const T = PARTY_TYPES[type];
    let name = pick(T.names);
    if (type === 'reg') { const r = s.regions.filter(x => !x.cap && (x.sep || 0) > 0.2)[0] || s.regions.find(x => !x.cap); name = `${name} de ${r?.name || 'Interior'}`; }
    if (gov) name = s.nation.ideology?.primary ? `${name} (governo)` : name;
    parties.push({ id: type + parties.length, type, name: gov ? name.replace(' (governo)', '') : name, color: T.color, leader: gov ? s.nation.leader : personName(culture(s)), vote: 0, seats: 0, gov: !!gov, coalition: !!gov });
  };
  mk(govType, true);
  const others = types.filter(t => t !== govType).sort((a, b) => dist(PARTY_TYPES[b].ax, ax) - dist(PARTY_TYPES[a].ax, ax));
  for (const t of others.slice(0, 4)) mk(t);
  if (s.regions.some(r => !r.cap && (r.sep || 0) > 0.3)) mk('reg');
  const seatsTotal = clamp(Math.round(80 + Math.sqrt(s.econ.pop) * 30), 100, 600);
  const sys = electionMode(s) === 'none' ? (ax.auth > 60 && (ax.mil || 0) > 30 ? 'junta' : 'oneparty') : electionMode(s) === 'controlled' ? 'presidential' : (ax.auth < -20 ? 'parliamentary' : 'presidential');
  const factions = initFactions(s);
  s.pol = { factions };
  s.pol = {
    parties, seatsTotal, nextElection: day(s) + 52 * 7 * (1 + Math.floor(random() * 3)), campaign: null, lastResult: null, minority: false,
    factions, cabinet: initCabinet(s), leader: initLeader(s), uprising: null,
    const: { system: sys, term: 4, limits: 2, federal: s.policies.autonomy === 'federal', upper: true, judiciary: s.st.political > 40 ? 'independent' : 'controlled', rights: s.st.civil > 45 ? 'broad' : 'limited' },
  };
  computeVote(s, true);
  allocateSeats(s, true);
}

export function computeVote(s, snap = false) {
  const P = s.pol, mode = electionMode(s), G = s.groups;
  if (mode === 'none') { for (const p of P.parties) p.vote = p.gov ? 100 : 0; return; }
  const support = s.d?.support ?? 50;
  const govTarget = clamp(8 + support * 0.55 + s.st.legitimacy * 0.12 + (P.campaign?.boost || 0), 5, 78);
  const opp = P.parties.filter(p => !p.gov && !p.banned);
  const appeal = opp.map(p => { const A = PARTY_TYPES[p.type].appeal; let v = 0.4; for (const g in A) v += A[g] * (100 - (G[g] ?? 50)) / 50; return Math.max(0.05, v * (p.coalition ? 0.8 + support / 250 : 1) * (p.boost || 1)); });
  const tot = appeal.reduce((a, b) => a + b, 0) || 1;
  const rate = snap ? 1 : 0.15;
  for (const p of P.parties) {
    if (p.banned) { p.vote = 0; continue; }
    const tgt = p.gov ? govTarget : (100 - govTarget) * appeal[opp.indexOf(p)] / tot;
    p.vote = p.vote + (tgt - p.vote) * rate;
  }
}
export function allocateSeats(s, initial = false, rig = 0) {
  const P = s.pol, mode = electionMode(s), N = P.seatsTotal;
  if (mode === 'none') { for (const p of P.parties) p.seats = p.gov ? N : 0; return; }
  const v = P.parties.map(p => Math.max(0, p.vote + (p.gov ? rig : 0) + (initial ? 0 : rand(-2, 2))));
  const sum = v.reduce((a, b) => a + b, 0) || 1;
  const elig = v.map(x => x / sum * 100 >= 3 ? x : 0), es = elig.reduce((a, b) => a + b, 0) || 1;
  const quota = elig.map(x => x / es * N), base = quota.map(Math.floor);
  let left = N - base.reduce((a, b) => a + b, 0);
  const order = quota.map((q, i) => [q - Math.floor(q), i]).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) { if (left-- <= 0) break; base[i]++; }
  P.parties.forEach((p, i) => { p.seats = base[i]; });
}
export const coalitionSeats = s => s.pol.parties.filter(p => p.coalition).reduce((a, p) => a + p.seats, 0);
export const hasMajority = s => electionMode(s) !== 'multiparty' || coalitionSeats(s) > s.pol.seatsTotal / 2;

// Leis em democracia exigem maioria; sem ela, o governo negocia ou compra votos.
export function lawVote(s, buy = false) {
  if (hasMajority(s)) return { ok: true };
  const share = coalitionSeats(s) / s.pol.seatsTotal;
  if (buy) { s.econ.treasury -= s.econ.gdp * 0.0015; s.st.corruption = clamp(s.st.corruption + 2, 0, 100); return { ok: true, msg: 'Votos garantidos com cargos e emendas.' }; }
  if (chance(clamp(share * 1.6 - 0.2, 0.1, 0.85))) return { ok: true, msg: 'Aprovada com votos avulsos da oposição.' };
  return { ok: false, needVotes: true, msg: `Sem maioria (${Math.round(share * 100)}% das cadeiras): o parlamento rejeitou. Você pode comprar votos (custo ${(s.econ.gdp * 0.0015).toFixed(2)} bi e mais corrupção).` };
}

// ---------- Facções do regime ----------
const FACTIONS = {
  hard: { name: 'Linha dura', want: s => 50 + (60 - s.st.political) * 0.5 + (s.st.control - 50) * 0.4 },
  reform: { name: 'Reformistas', want: s => 30 + s.st.political * 0.5 - s.st.corruption * 0.3 + s.st.civil * 0.2 },
  military: { name: 'Militares', want: s => s.groups.military * 0.8 + s.budget.spend.military * 4 },
  tech: { name: 'Tecnocratas', want: s => 35 + s.st.efficiency * 0.4 + s.st.growth * 4 - Math.max(0, s.st.inflation - 6) },
  oligarchs: { name: 'Oligarcas', want: s => s.groups.business * 0.7 + (s.st.market - 50) * 0.3 - (s.budget.tax - 25) },
  clergy: { name: 'Clero', want: s => s.groups.rural * 0.6 + (s.policies.religion === 'state' ? 25 : s.policies.religion === 'secular' ? -15 : 5) },
};
function initFactions(s) {
  const ax = s.nation.ideology?.axes || {};
  const out = [];
  for (const id in FACTIONS) {
    if (id === 'clergy' && (ax.relig || 0) < 10) continue;
    out.push({ id, name: FACTIONS[id].name, leader: personName(culture(s)), power: clamp(25 + rand(-8, 8) + (id === 'hard' ? (ax.auth || 0) / 4 : id === 'reform' ? -(ax.auth || 0) / 4 : 0), 8, 70), sat: 55 });
  }
  return out;
}

// ---------- Gabinete ----------
export const PORTFOLIOS = {
  finance: { name: 'Fazenda', mods: { taxCapacity: 5, inflation: -0.6 } },
  foreign: { name: 'Relações Exteriores', mods: { reputation: 4, influence: 2 } },
  defense: { name: 'Defesa', mods: { readiness: 4, equipment: 2 } },
  interior: { name: 'Interior e Segurança', mods: { control: 4, crime: -3 } },
  health: { name: 'Saúde', mods: { health: 3 } },
  education: { name: 'Educação', mods: { education: 3 } },
  economy: { name: 'Indústria e Comércio', mods: { growth: 0.35, productivity: 2 } },
  justice: { name: 'Justiça', mods: { corruption: -3, civil: 2 } },
};
const TRAITS = ['técnico', 'populista', 'corrupto', 'linha-dura', 'carismático', 'leal', 'ambicioso', 'midiático'];
export function makeMinister(s, faction) {
  const trait = pick(TRAITS), fs = s.pol?.factions || [];
  return { name: personName(culture(s)), skill: Math.round(rand(30, 85)) + (trait === 'técnico' ? 10 : 0), loyalty: Math.round(rand(35, 80)) + (trait === 'leal' ? 15 : trait === 'ambicioso' ? -15 : 0), corrupt: Math.round(rand(5, 45)) + (trait === 'corrupto' ? 35 : 0), trait, faction: faction || (fs.length ? pick(fs).id : 'tech'), since: day(s) };
}
function initCabinet(s) {
  const cab = {};
  const link = { finance: 'finance', foreign: 'diplomat', interior: 'security' };
  for (const k in PORTFOLIOS) {
    const m = makeMinister(s);
    const ch = (s.characters || []).find(c => c.id === link[k] && c.status === 'active');
    if (ch) m.name = ch.name;
    cab[k] = m;
  }
  return cab;
}
export function candidates(s, portfolio) {
  s.pol.cands ||= {};
  if (!s.pol.cands[portfolio] || s.pol.cands[portfolio].day < day(s) - 60) s.pol.cands[portfolio] = { day: day(s), list: [0, 1, 2].map(() => makeMinister(s)) };
  return s.pol.cands[portfolio].list;
}
export function appoint(s, portfolio, idx) {
  const list = candidates(s, portfolio), m = list[idx];
  if (!m) return { ok: false, msg: '?' };
  const old = s.pol.cabinet[portfolio];
  const of = s.pol.factions.find(f => f.id === old?.faction), nf = s.pol.factions.find(f => f.id === m.faction);
  if (of) of.sat = clamp(of.sat - 8, 0, 100);
  if (nf) nf.sat = clamp(nf.sat + 6, 0, 100);
  s.pol.cabinet[portfolio] = { ...m, since: day(s) };
  list.splice(idx, 1);
  const link = { finance: 'finance', foreign: 'diplomat', interior: 'security' }[portfolio];
  const ch = link && (s.characters || []).find(c => c.id === link && c.status === 'active');
  if (ch) { ch.name = (ch.name.split(' ')[0].endsWith('.') ? ch.name.split(' ')[0] + ' ' : '') + m.name; ch.loyalty = m.loyalty; }
  return { ok: true, msg: `${m.name} assume ${PORTFOLIOS[portfolio].name}.`, log: true };
}
function cabinetMods(s) {
  const M = {};
  for (const k in s.pol.cabinet) {
    const m = s.pol.cabinet[k], f = (m.skill - 50) / 50;
    for (const x in PORTFOLIOS[k].mods) M[x] = (M[x] || 0) + PORTFOLIOS[k].mods[x] * f;
    M.corruption = (M.corruption || 0) + m.corrupt / 40;
    if (m.trait === 'populista') M.g_workers = (M.g_workers || 0) + 1.5;
    if (m.trait === 'carismático' || m.trait === 'midiático') M.legitimacy = (M.legitimacy || 0) + 0.8;
  }
  return M;
}

// ---------- Governante ----------
function initLeader(s) {
  const age = Math.round(rand(42, 68));
  return { name: s.nation.leader, age, born: -age * 365, health: Math.round(rand(70, 95)), charisma: Math.round(rand(35, 85)), traits: [pick(['carismático', 'paranoico', 'pragmático', 'ideológico', 'vaidoso', 'austero'])], heir: { name: leaderName(culture(s)), rel: pick(['filho(a)', 'vice-presidente', 'sobrinho(a)', 'braço-direito']) }, gen: 1, illness: null };
}

// ---------- Rodada semanal ----------
export function weeklyPolitics(s, data, ctx) {
  const P = s.pol; if (!P) return;
  const d = day(s), mode = electionMode(s);
  computeVote(s);
  // Gabinete → modificadores
  s.longMods = s.longMods.filter(m => m.id !== 'cabinet');
  const M = cabinetMods(s);
  for (const k in M) s.longMods.push({ k, v: +M[k].toFixed(2), d: 0, left: 0, src: 'Gabinete', id: 'cabinet' });
  // Facções
  for (const f of P.factions) {
    f.sat = clamp(f.sat + (clamp(FACTIONS[f.id].want(s), 0, 100) - f.sat) * 0.05 + rand(-1, 1), 0, 100);
    f.power = clamp(f.power + (f.id === 'military' ? (s.groups.military - 50) / 200 : f.id === 'oligarchs' ? (s.groups.business - 50) / 200 : 0) + rand(-0.3, 0.3), 5, 85);
  }
  s.longMods = s.longMods.filter(m => m.id !== 'factions');
  const unrest = P.factions.reduce((a, f) => a + Math.max(0, 40 - f.sat) * f.power / 400, 0);
  if (unrest > 0.3) s.longMods.push({ k: 'coupRisk', v: +unrest.toFixed(1), d: 0, left: 0, src: 'Facções insatisfeitas', id: 'factions' });
  const angry = P.factions.filter(f => f.sat < 25 && f.power > 25).sort((a, b) => b.power - a.power)[0];
  if (angry && (P.facCd || 0) <= d && chance(0.25)) { P.facCd = d + 35; ctx.card(factionCard(s, angry)); }
  // Ministros corruptos
  const crook = Object.entries(P.cabinet).find(([, m]) => m.corrupt > 60 && chance(0.02));
  if (crook && (P.scCd || 0) <= d) { P.scCd = d + 60; ctx.card(scandalCard(s, crook[0], crook[1])); }
  // Governante
  weeklyLeader(s, data, ctx);
  // Eleições
  if (mode !== 'none') {
    if (!P.campaign && d >= P.nextElection - 42) { P.campaign = { start: d, boost: 0, spent: 0 }; ctx.news(`Começa a campanha eleitoral. A eleição será em ${Math.round((P.nextElection - d) / 7)} semanas.`, 'warn'); }
    if (P.campaign && d < P.nextElection && (P.campaign.cardDay || 0) <= d - 7) { P.campaign.cardDay = d; ctx.card(campaignCard(s)); }
    if (d >= P.nextElection) holdElection(s, data, ctx);
  }
  // Levante em curso
  if (P.uprising) uprisingWeek(s, data, ctx);
}

function weeklyLeader(s, data, ctx) {
  const L = s.pol.leader, d = day(s);
  L.age = L.age + 1 / 52;
  L.health = clamp(L.health - Math.max(0, L.age - 55) * 0.004 + (s.st.health - 50) * 0.0008 + rand(-0.2, 0.2), 0, 100);
  if (!L.illness && chance(0.0015 * (L.age / 60) ** 3 + (L.health < 40 ? 0.006 : 0))) { L.illness = { day: d }; ctx.card(illnessCard(s)); }
  const pDie = Math.max(0, L.age - 62) ** 2 / 300000 + (L.health < 15 ? 0.02 : 0) + (L.illness?.hidden ? 0.004 : 0);
  if (chance(pDie)) ctx.leaderDies?.('natural');
}
export function succeed(s, how) {
  const L = s.pol.leader, heir = L.heir;
  { const tm = String(s.nation.leader || '').match(/^(Líder Supremo|Primeiro-ministro|Grão-duque|Rei|Imperador|Rainha|Imperatriz|Presidente|Sultão|Sultana|Príncipe|Princesa|Emir|Emira|Czar|Czarina|Marechal|General|Chanceler)\s/); const MF = { Rainha: 'Rei', Imperatriz: 'Imperador', Sultana: 'Sultão', Princesa: 'Príncipe', Emira: 'Emir', Czarina: 'Czar' }; if (tm) heir.name = genderize((MF[tm[1]] || tm[1]) + ' ' + heir.name); }
  s.nation.leader = heir.name;
  s.pol.leader = { ...L, name: heir.name, age: Math.round(rand(35, 55)), health: Math.round(rand(70, 95)), charisma: Math.round(rand(30, 80)), traits: [pick(['carismático', 'paranoico', 'pragmático', 'ideológico', 'vaidoso', 'austero'])], heir: { name: personName(culture(s)), rel: pick(['filho(a)', 'vice-presidente', 'braço-direito']) }, gen: (L.gen || 1) + 1, illness: null };
  const gov = s.pol.parties.find(p => p.gov); if (gov) gov.leader = heir.name;
  s.st.legitimacy = clamp(s.st.legitimacy - 8, 0, 100); s.st.stability = clamp(s.st.stability - 6, 0, 100);
  (s.dynasty ||= []).push({ name: L.name, until: day(s), how });
}

// ---------- Eleições ----------
function holdElection(s, data, ctx) {
  const P = s.pol, mode = electionMode(s);
  const rig = mode === 'controlled' ? 25 : 0;
  allocateSeats(s, false, rig);
  const gov = P.parties.find(p => p.gov);
  const result = { day: day(s), parties: P.parties.map(p => ({ name: p.name, color: p.color, vote: +p.vote.toFixed(1), seats: p.seats, gov: p.gov })), mode };
  P.lastResult = result; (P.history ||= []).push(result);
  P.campaign = null; P.nextElection = day(s) + P.const.term * 365;
  if (mode === 'controlled') {
    s.st.reputation = clamp(s.st.reputation - 2, 0, 100);
    if (gov.vote < 35) { s.longMods.push({ k: 'protest', v: 10, d: 60, left: 60, src: 'Fraude eleitoral' }); ctx.news('Oposição denuncia fraude grosseira; milhares vão às ruas.', 'bad'); }
    ctx.news(`Eleições controladas: o partido do governo fica com ${gov.seats} de ${P.seatsTotal} cadeiras.`, 'info');
    ctx.electionResult?.(result);
    return;
  }
  const majority = P.seatsTotal / 2;
  const cs = coalitionSeats(s);
  ctx.news(`Eleições: ${gov.name} ${gov.vote.toFixed(1)}% (${gov.seats} cadeiras). Coalizão do governo: ${cs} de ${P.seatsTotal}.`, cs > majority ? 'good' : 'bad');
  if (cs > majority) { P.minority = false; ctx.electionResult?.(result); return; }
  ctx.card(coalitionCard(s));
  ctx.electionResult?.(result);
}
export function formCoalition(s, ids) {
  for (const p of s.pol.parties) if (!p.gov) p.coalition = ids.includes(p.id);
  s.pol.minority = !hasMajority(s);
}

// ---------- Levantes (golpe / revolução) jogáveis ----------
export function startUprising(s, kind, p) {
  const P = s.pol;
  if (!P || P.uprising) return false;
  P.uprising = { kind, prog: clamp(45 + (p - 0.4) * 60, 30, 75), weeks: 4, leader: kind === 'coup' ? (s.characters?.find(c => c.id === 'general' && c.status === 'active')?.name || personName(culture(s))) : personName(culture(s)), day: day(s), log: [] };
  return true;
}
function uprisingWeek(s, data, ctx) {
  const U = s.pol.uprising;
  const drift = U.kind === 'coup' ? (50 - s.groups.military) / 10 + (s.st.coupRisk - 50) / 15 - s.st.intel / 40 : (s.st.revoRisk - 50) / 12 + (s.st.protest - 50) / 15 - s.st.control / 40;
  U.prog = clamp(U.prog + drift + rand(-4, 4), 0, 100);
  U.weeks--;
  if (U.prog >= 95) return ctx.uprisingEnd?.('win');
  if (U.prog <= 8) return ctx.uprisingEnd?.('crushed');
  if (U.weeks <= 0) return ctx.uprisingEnd?.(U.prog >= 60 ? 'win' : U.prog <= 35 ? 'crushed' : 'civilwar');
  ctx.card(uprisingCard(s));
}
export function uprisingAction(s, act) {
  const U = s.pol.uprising; if (!U) return '';
  const g = s.econ.gdp;
  const eff = {
    loyal: () => { U.prog -= 8 + s.groups.military / 6; s.groups.military = clamp(s.groups.military + 4, 0, 100); s.econ.treasury -= g * 0.002; return 'Unidades leais recebem soldo dobrado e cercam os rebeldes.'; },
    negotiate: () => { U.prog -= 10; s.st.legitimacy = clamp(s.st.legitimacy - 4, 0, 100); s.st.political = clamp(s.st.political + 3, 0, 100); return 'O governo abre negociações e oferece concessões.'; },
    arrest: () => { U.prog -= 6 + s.st.intel / 6; s.st.civil = clamp(s.st.civil - 4, 0, 100); return 'A polícia política prende líderes do movimento.'; },
    speech: () => { const v = (s.pol.leader.charisma - 50) / 4 + (s.st.legitimacy - 50) / 6; U.prog -= v; return v > 0 ? 'O pronunciamento comove o país; deserções nas fileiras rebeldes.' : 'O discurso soa vazio e alimenta a revolta.'; },
    repress: () => { U.prog -= 14; s.st.reputation = clamp(s.st.reputation - 8, 0, 100); s.flags.atrocity = 1; s.longMods.push({ k: 'revoRisk', v: 5, d: 365, left: 365, src: 'Repressão sangrenta' }); return 'Tropas atiram contra a multidão. O mundo condena.'; },
    concede: () => { U.prog -= 12; s.policies.elections = 'multiparty'; s.st.political = clamp(s.st.political + 8, 0, 100); return 'O governo anuncia eleições livres e liberta presos políticos.'; },
    foreign: () => { U.prog -= 9; s.st.reputation = clamp(s.st.reputation - 3, 0, 100); return 'Um aliado estrangeiro envia forças especiais e assessores.'; },
    flee: () => { U.prog = 100; s.flags.fled = 1; return 'O governante embarca às pressas num avião para o exílio.'; },
  }[act];
  if (!eff) return '';
  const msg = eff(); U.prog = clamp(U.prog, 0, 100); U.log.unshift(msg);
  return msg;
}

// ---------- Constituição ----------
export const SYSTEMS = {
  presidential: { name: 'Presidencialismo', mods: { efficiency: 2 }, elections: true },
  parliamentary: { name: 'Parlamentarismo', mods: { political: 4, stability: -1 }, elections: true },
  semi: { name: 'Semipresidencialismo', mods: { political: 2 }, elections: true },
  monarchy_const: { name: 'Monarquia constitucional', mods: { legitimacy: 4, political: 2 }, elections: true },
  monarchy_abs: { name: 'Monarquia absoluta', mods: { legitimacy: 2, political: -10, control: 4 }, elections: false },
  oneparty: { name: 'Partido único', mods: { political: -10, control: 6 }, elections: false },
  junta: { name: 'Junta militar', mods: { political: -12, control: 8, g_military: 8, reputation: -6 }, elections: false },
  theocracy: { name: 'Teocracia', mods: { civil: -6, g_rural: 6, legitimacy: 3 }, elections: false },
};
export function amendConstitution(s, change) {
  const C = s.pol.const, next = { ...C, ...change };
  const mode = electionMode(s);
  const needs = mode === 'multiparty' ? (coalitionSeats(s) / s.pol.seatsTotal >= 2 / 3 ? 'parlamento' : 'referendo') : 'decreto';
  let ok = true, msg = '';
  if (needs === 'referendo') { ok = chance(clamp((s.d?.support ?? 50) / 100 + 0.1, 0.15, 0.85)); msg = ok ? 'O referendo aprovou a emenda.' : 'O povo rejeitou a emenda no referendo.'; }
  else msg = needs === 'parlamento' ? 'Emenda aprovada por dois terços do parlamento.' : 'Nova ordem constitucional decretada.';
  if (!ok) { s.st.legitimacy = clamp(s.st.legitimacy - 4, 0, 100); return { ok: false, msg, log: true }; }
  s.pol.const = next;
  s.longMods = s.longMods.filter(m => m.id !== 'const');
  const sys = SYSTEMS[next.system];
  const M = { ...sys.mods };
  if (next.judiciary === 'independent') { M.corruption = (M.corruption || 0) - 3; M.political = (M.political || 0) + 3; } else M.control = (M.control || 0) + 2;
  if (next.rights === 'broad') M.civil = (M.civil || 0) + 5; else M.civil = (M.civil || 0) - 4;
  if (next.limits === 0) { M.political = (M.political || 0) - 4; M.reputation = (M.reputation || 0) - 2; }
  for (const k in M) s.longMods.push({ k, v: M[k], d: 0, left: 0, src: 'Constituição', id: 'const' });
  if (!sys.elections) s.policies.elections = 'none';
  else if (s.policies.elections === 'none') s.policies.elections = 'controlled';
  if (next.federal !== C.federal) s.policies.autonomy = next.federal ? 'federal' : 'administrative';
  if (needs === 'decreto') { s.st.legitimacy = clamp(s.st.legitimacy - 5, 0, 100); s.st.reputation = clamp(s.st.reputation - 3, 0, 100); }
  return { ok: true, msg, log: true };
}

// ---------- Cartões ----------
const card = (s, id, cat, title, desc, context, options, extra = {}) => ({ id: `dyn_${id}_${day(s)}_${Math.floor(random() * 1e5)}`, dyn: true, cat, title, desc, context, options, deadline: 10, default: options.length - 1, ...extra });
function factionCard(s, f) {
  const asks = { hard: ['endurecer a repressão e censurar a imprensa', { political: -4, control: 4 }], reform: ['libertar presos e abrir o regime', { political: 4, civil: 3 }], military: ['aumentar o orçamento militar', { treasury: -0.4, readiness: 3 }], tech: ['entregar a economia a técnicos', { efficiency: 3, corruption: -2 }], oligarchs: ['cortar impostos sobre grandes fortunas', { treasury: -0.3, inequality: 2 }], clergy: ['aplicar a moral religiosa nas escolas', { civil: -2 }] }[f.id];
  return card(s, 'faction_' + f.id, 'Facções do regime', `${f.name} exigem mudanças`, `${f.leader}, à frente da facção ${f.name.toLowerCase()}, exige ${asks[0]} e ameaça retirar o apoio ao governo.`, `Poder da facção: ${Math.round(f.power)} · satisfação: ${Math.round(f.sat)}. Facções fortes e insatisfeitas aumentam o risco de golpe.`, [
    { text: 'Atender às exigências.', hint: 'A facção se acalma.', now: asks[1], act: { type: 'faction', id: f.id, choice: 'concede' } },
    { text: `Expurgar ${f.leader} e seus aliados.`, hint: 'A facção perde poder; o resto do regime fica com medo.', act: { type: 'faction', id: f.id, choice: 'purge' }, now: { coupRisk: 4, political: -2 } },
    { text: 'Ignorar.', hint: 'A facção fica mais hostil.', act: { type: 'faction', id: f.id, choice: 'ignore' } },
  ]);
}
function scandalCard(s, port, m) {
  return card(s, 'scandal_' + port, 'Gabinete', `Escândalo no Ministério de ${PORTFOLIOS[port].name}`, `A imprensa revela contas secretas de ${m.name}, ministro(a) de ${PORTFOLIOS[port].name}.`, `Competência ${m.skill} · lealdade ${m.loyalty} · corrupção ${m.corrupt}.`, [
    { text: `Demitir ${m.name}.`, hint: 'Imagem limpa; a facção dele(a) se ressente.', act: { type: 'minister', port, choice: 'fire' }, now: { corruption: -2, legitimacy: 1 } },
    { text: 'Defender o ministro.', hint: 'Lealdade mantida; escândalo cresce.', now: { legitimacy: -4 }, act: { type: 'minister', port, choice: 'keep' } },
  ]);
}
function illnessCard(s) {
  const L = s.pol.leader;
  return card(s, 'illness', 'Governante', `A saúde de ${L.name}`, `${L.name}, aos ${Math.floor(L.age)} anos, foi levado(a) às pressas ao hospital. Os médicos falam em tratamento longo.`, `Saúde: ${Math.round(L.health)}/100. Herdeiro político: ${L.heir.name} (${L.heir.rel}).`, [
    { text: 'Tratamento no exterior, com transparência.', hint: 'Recupera a saúde; parece fraqueza.', act: { type: 'leader', choice: 'treat' }, now: { legitimacy: -2 } },
    { text: 'Esconder a doença e seguir governando.', hint: 'Sem desgaste agora; risco de morte maior.', act: { type: 'leader', choice: 'hide' } },
    { text: `Preparar ${L.heir.name} como sucessor(a).`, hint: 'Sucessão tranquila se algo acontecer.', act: { type: 'leader', choice: 'heir' }, now: { stability: 2 } },
  ], { crisis: true, default: 1 });
}
function campaignCard(s) {
  const left = Math.max(1, Math.round((s.pol.nextElection - day(s)) / 7));
  return card(s, 'campaign', 'Campanha eleitoral', `Campanha: faltam ${left} semana(s)`, `As pesquisas dão ${s.pol.parties.find(p => p.gov).vote.toFixed(0)}% ao partido do governo. O comitê de campanha propõe a estratégia da semana.`, 'Gastos de campanha saem do tesouro; ataques e promessas têm efeitos depois da eleição.', [
    { text: 'Comícios por todo o país.', hint: '+ votos; custo moderado.', act: { type: 'campaign', choice: 'rally' }, now: { treasury: -0.15 } },
    { text: 'Campanha pesada na TV e nas redes.', hint: '++ votos; caro.', act: { type: 'campaign', choice: 'ads' }, now: { treasury: -0.35 } },
    { text: 'Atacar o principal adversário.', hint: 'Tira votos dele; pode sair pela culatra.', act: { type: 'campaign', choice: 'attack' } },
    { text: 'Prometer aumento do salário mínimo.', hint: 'Votos agora; conta depois.', act: { type: 'campaign', choice: 'promise' } },
    { text: 'Debate na TV.', hint: 'Depende do carisma do líder.', act: { type: 'campaign', choice: 'debate' } },
  ], { deadline: 6, default: 0 });
}
function coalitionCard(s) {
  const P = s.pol, opp = P.parties.filter(p => !p.gov && p.seats > 0).sort((a, b) => b.seats - a.seats);
  const need = Math.floor(P.seatsTotal / 2) + 1 - P.parties.filter(p => p.gov).reduce((a, p) => a + p.seats, 0);
  const opts = opp.slice(0, 3).map(p => ({ text: `Coalizão com ${p.name} (${p.seats} cadeiras).`, hint: p.seats >= need ? 'Garante a maioria; o parceiro cobra ministérios.' : 'Não basta sozinho para a maioria.', act: { type: 'coalition', ids: [p.id] } }));
  const pair = opp.length >= 2 ? [opp[0], opp[1]] : null;
  if (pair) opts.push({ text: `Grande coalizão: ${pair[0].name} + ${pair[1].name}.`, hint: 'Maioria folgada; governo heterogêneo.', act: { type: 'coalition', ids: pair.map(p => p.id) } });
  opts.push({ text: 'Governar em minoria.', hint: 'Leis podem ser rejeitadas.', act: { type: 'coalition', ids: [] } });
  opts.push({ text: 'Não reconhecer o resultado e governar por decreto.', hint: 'Autogolpe: fim das eleições livres, protestos e isolamento.', act: { type: 'selfcoup' } });
  return card(s, 'coalition', 'Parlamento', 'Formar governo', `Nenhuma maioria saiu das urnas. Faltam ${need} cadeiras para o governo de ${s.nation.leader} governar com estabilidade.`, `Total de cadeiras: ${P.seatsTotal}.`, opts, { crisis: true, default: opts.length - 2 });
}
export function uprisingCard(s) {
  const U = s.pol.uprising, coup = U.kind === 'coup';
  const opts = coup ? [
    { text: 'Convocar as unidades leais.', hint: 'Depende do apoio dos militares.', act: { type: 'uprising', choice: 'loyal' } },
    { text: 'Prender os conspiradores.', hint: 'Depende da inteligência.', act: { type: 'uprising', choice: 'arrest' } },
    { text: 'Pronunciamento à nação.', hint: 'Depende do carisma e da legitimidade.', act: { type: 'uprising', choice: 'speech' } },
    { text: 'Negociar com os golpistas.', hint: 'Ganha tempo cedendo poder.', act: { type: 'uprising', choice: 'negotiate' } },
    { text: 'Fugir para o exílio.', hint: 'Fim do governo, mas você sobrevive.', act: { type: 'uprising', choice: 'flee' } },
  ] : [
    { text: 'Reprimir com força total.', hint: 'Eficaz; massacre e isolamento.', act: { type: 'uprising', choice: 'repress' } },
    { text: 'Anunciar eleições livres e anistia.', hint: 'Desarma parte do movimento.', act: { type: 'uprising', choice: 'concede' } },
    { text: 'Pronunciamento à nação.', hint: 'Depende do carisma e da legitimidade.', act: { type: 'uprising', choice: 'speech' } },
    { text: 'Pedir ajuda militar a um aliado.', hint: 'Forças estrangeiras ajudam; humilhação.', act: { type: 'uprising', choice: 'foreign' } },
    { text: 'Fugir para o exílio.', hint: 'Fim do governo, mas você sobrevive.', act: { type: 'uprising', choice: 'flee' } },
  ];
  return card(s, 'uprising', coup ? 'Golpe de Estado' : 'Revolução', coup ? `Golpe em andamento: semana ${5 - U.weeks} de 4` : `Revolução nas ruas: semana ${5 - U.weeks} de 4`,
    coup ? `Tropas lideradas por ${U.leader} cercam ministérios em ${s.nation.capital}. Parte do Exército hesita.` : `Multidões lideradas por ${U.leader} ocupam praças e prédios públicos em ${s.nation.capital} e no interior.`,
    `Força dos rebeldes: ${Math.round(U.prog)}/100. Acima de 95 eles tomam o poder; abaixo de 8, o levante acaba. Em 4 semanas, se nada se decidir, o país pode rachar em guerra civil. ${U.log[0] ? 'Última notícia: ' + U.log[0] : ''}`, opts, { crisis: true, deadline: 7, default: 2, keepInCrisis: true });
}

// ---------- Ações dos cartões políticos ----------
export function politicsAct(s, data, act, ctx) {
  const P = s.pol; if (!P) return '';
  switch (act.type) {
    case 'faction': {
      const f = P.factions.find(x => x.id === act.id); if (!f) return '';
      if (act.choice === 'concede') { f.sat = clamp(f.sat + 30, 0, 100); for (const o of P.factions) if (o !== f) o.sat = clamp(o.sat - 4, 0, 100); return `${f.name} satisfeitos com as concessões.`; }
      if (act.choice === 'purge') { f.power = clamp(f.power - 35, 5, 100); f.sat = clamp(f.sat - 20, 0, 100); f.leader = personName(culture(s)); for (const o of P.factions) if (o !== f) o.sat = clamp(o.sat - 6, 0, 100); return `Expurgo: a facção ${f.name.toLowerCase()} perde seus líderes.`; }
      f.sat = clamp(f.sat - 10, 0, 100); return `${f.name} saem da reunião em silêncio hostil.`;
    }
    case 'minister': {
      if (act.choice === 'fire') { const m = P.cabinet[act.port]; P.cabinet[act.port] = makeMinister(s); const f = P.factions.find(x => x.id === m?.faction); if (f) f.sat = clamp(f.sat - 8, 0, 100); return `${m?.name} demitido(a); ${P.cabinet[act.port].name} assume ${PORTFOLIOS[act.port].name}.`; }
      const m = P.cabinet[act.port]; if (m) m.loyalty = clamp(m.loyalty + 10, 0, 100); return '';
    }
    case 'leader': {
      const L = P.leader;
      if (act.choice === 'treat') { L.health = clamp(L.health + 25, 0, 100); L.illness = null; return `${L.name} volta do tratamento recuperado(a).`; }
      if (act.choice === 'hide') { L.illness = { ...(L.illness || {}), hidden: true }; L.health = clamp(L.health - 5, 0, 100); return ''; }
      if (act.choice === 'heir') { L.heirReady = true; return `${L.heir.name} é apresentado(a) como herdeiro(a) político(a).`; }
      if (act.choice === 'succeed') { succeed(s, act.how || 'morte'); return `${s.nation.leader} assume o governo.`; }
      return '';
    }
    case 'campaign': {
      const C = P.campaign; if (!C) return '';
      const gov = P.parties.find(p => p.gov), rival = P.parties.filter(p => !p.gov).sort((a, b) => b.vote - a.vote)[0];
      const ch = act.choice;
      if (ch === 'rally') C.boost += 2.5;
      if (ch === 'ads') C.boost += 4.5;
      if (ch === 'attack') { if (chance(0.6) && rival) { rival.boost = (rival.boost || 1) * 0.85; C.boost += 1; } else C.boost -= 2; }
      if (ch === 'promise') { C.boost += 4; s.longMods.push({ k: 'inflation', v: 1.5, d: 365, left: 365, src: 'Promessas de campanha' }, { k: 'revenue', v: -0.3, d: 730, left: 730, src: 'Promessas de campanha' }); }
      if (ch === 'debate') C.boost += (P.leader.charisma - 50) / 8 + rand(-3, 3);
      C.boost = clamp(C.boost, -10, 12);
      return '';
    }
    case 'coalition': formCoalition(s, act.ids || []); return act.ids?.length ? `Coalizão formada com ${act.ids.map(id => P.parties.find(p => p.id === id)?.name).join(' e ')}.` : 'O governo seguirá em minoria no parlamento.';
    case 'selfcoup': {
      s.policies.elections = 'none'; s.st.political = clamp(s.st.political - 20, 0, 100); s.st.legitimacy = clamp(s.st.legitimacy - 15, 0, 100); s.st.reputation = clamp(s.st.reputation - 15, 0, 100);
      s.longMods.push({ k: 'protest', v: 14, d: 120, left: 120, src: 'Autogolpe' }, { k: 'revoRisk', v: 8, d: 365, left: 365, src: 'Autogolpe' });
      for (const p of P.parties) { p.seats = p.gov ? P.seatsTotal : 0; }
      P.const.system = 'oneparty';
      for (const id in s.partners) if ((data.reg[id]?.profile?.liberty ?? 50) > 55) s.partners[id].rel = clamp(s.partners[id].rel - 15, -100, 100);
      return 'Autogolpe: o parlamento é dissolvido e as eleições suspensas.';
    }
    case 'uprising': return uprisingAction(s, act.choice);
  }
  return '';
}
