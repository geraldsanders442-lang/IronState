// Chefe de gabinete: um coordenador contratado que decide as questões por você conforme a sua ideologia,
// dentro dos limites que você define (nível de delegação e linhas vermelhas), e entrega um resumo do que fez.
import { clamp, rand, pick } from './util.js';
import { personName } from './names.js';

export const LEVELS = {
  off: ['Eu decido tudo', 'O chefe só aconselha.'],
  minor: ['Só decisões menores', 'Ele resolve o miúdo e leva a você o que importa.'],
  most: ['A maioria das questões', 'Tudo, exceto crises, guerra e as linhas vermelhas.'],
  all: ['Quase tudo', 'Tudo, exceto crises e guerra. Você só vê o resumo.'],
};
export const TRAITS = {
  pragmatic: ['Pragmático', 'Prefere resultados (estabilidade, crescimento) a dogmas.'],
  ideologue: ['Ideólogo', 'Segue a sua ideologia mesmo quando custa caro.'],
  cautious: ['Cauteloso', 'Evita decisões de grande impacto e riscos.'],
};
// Categorias que nunca são delegadas.
export const ALWAYS_PLAYER = new Set(['Guerra', 'Crise nuclear', 'Programa nuclear', 'Crise internacional', 'Diplomacia de guerra', 'Justiça internacional', 'Crimes de guerra', 'Alcance o poder']);

export function ensureChief(s) {
  return (s.chief ||= { on: false, level: 'minor', chief: null, cand: null, redlines: [], digest: [], decided: 0, since: null });
}
const day = s => Math.floor(s.time.min / 1440);
export function candidates(s) {
  const C = ensureChief(s);
  if (!C.cand || !C.cand.length) C.cand = Array.from({ length: 3 }, () => ({ name: personName(s.nation.culture || 'en'), skill: Math.round(rand(40, 92)), trait: pick(Object.keys(TRAITS)) }));
  return C.cand;
}

// Pesos de valor por ideologia (eixos de -100 a 100).
function weights(s, trait) {
  const ax = s.nation.ideology?.axes || {}, a = k => (ax[k] ?? 0) / 100;
  const ide = trait === 'ideologue' ? 1.7 : trait === 'pragmatic' ? 0.7 : 1, base = trait === 'ideologue' ? 0.6 : trait === 'pragmatic' ? 1.3 : 1;
  const B = { stability: 1, legitimacy: 0.8, growth: 1.2, qol: 0.6, reputation: 0.35, corruption: -0.6, crime: -0.3, protest: -0.4, unemployment: -0.5, treasury: 0.5, debt: -0.3, education: 0.4, health: 0.4, tech: 0.3, inflation: -0.4, hunger: -0.5 };
  const I = { civil: -0.8 * a('auth'), political: -0.8 * a('auth'), control: 0.8 * a('auth'), market: 0.5 * a('econ'), g_business: 0.2 * (1 + a('econ')), g_workers: 0.2 * (1 - a('econ')), g_military: 0.2 * (0.5 + a('mil')), defense: 0.3 * (0.5 + a('mil')), pollution: -0.4 * a('eco') - 0.1, poverty: -0.4 - 0.3 * a('redist'), inequality: -0.2 - 0.3 * a('redist'), g_rural: 0.1 * (0.5 + a('trad')), g_youth: 0.1 * (0.5 - a('trad')), reputation: 0.2 * a('global') };
  const W = {}; for (const k in B) W[k] = B[k] * base; for (const k in I) W[k] = (W[k] || 0) + I[k] * ide;
  return { W, I };
}
function scoreOption(W, I, o, cautious) {
  let v = 0, mag = 0; const why = [];
  const add = (k, x) => { const c = (W[k] || 0) * x; v += c; mag += Math.abs(x); if (I[k] && Math.abs(I[k] * x) > 0.25) why.push([k, I[k] * x]); };
  for (const k in o.now || {}) add(k, o.now[k]);
  for (const g in o.groups || {}) add('g_' + g, o.groups[g]);
  for (const m of o.long || []) add(m.k, m.v * 0.6);
  if (o.rel) v += 0.04 * Object.values(o.rel).reduce((a, b) => a + b, 0);
  if (o.risk) v -= 1.5;
  if (cautious) v -= 0.12 * mag;
  return { v, why };
}
const NAMES = { civil: 'liberdades civis', political: 'liberdades políticas', control: 'controle do Estado', market: 'abertura ao mercado', g_business: 'empresariado', g_workers: 'trabalhadores', g_military: 'militares', defense: 'defesa', pollution: 'meio ambiente', poverty: 'combate à pobreza', inequality: 'igualdade', g_rural: 'campo', g_youth: 'juventude', reputation: 'imagem externa' };

export const isMinor = iss => (iss.options || []).every(o => Object.values(o.now || {}).reduce((a, b) => a + Math.abs(b), 0) + Object.values(o.groups || {}).reduce((a, b) => a + Math.abs(b), 0) < 9 && !o.act);
export function delegable(s, iss, p) {
  const C = ensureChief(s);
  if (!C.on || C.level === 'off' || !iss || iss.crisis || p.event || iss.cond?.nukeCrisis) return false;
  if (ALWAYS_PLAYER.has(iss.cat) || C.redlines.includes(iss.cat) || String(iss.id).startsWith('dyn_wev') || String(iss.id).startsWith('dyn_offer')) return false;
  if (C.level === 'minor' && !isMinor(iss)) return false;
  return true;
}
export function chiefPick(s, iss) {
  const C = ensureChief(s), ch = C.chief, { W, I } = weights(s, ch.trait);
  const sc = iss.options.map((o, i) => ({ i, ...scoreOption(W, I, o, ch.trait === 'cautious') })).sort((x, y) => y.v - x.v);
  const good = rand(0, 1) < 0.5 + 0.45 * ch.skill / 100;
  const choice = good || sc.length < 2 ? sc[0] : sc[1 + Math.floor(rand(0, sc.length - 1))];
  const reason = choice.why.sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 2).map(([k, x]) => (x > 0 ? '+' : '−') + (NAMES[k] || k)).join(', ');
  return { idx: choice.i, reason, good };
}
export function noteDecision(s, iss, idx, reason) {
  const C = ensureChief(s); C.decided++;
  C.digest.unshift({ day: day(s), title: iss.title, text: iss.options[idx].text, reason }); if (C.digest.length > 40) C.digest.length = 40;
}
export function weeklyChief(s) {
  const C = ensureChief(s); if (!C.on || !C.chief) return;
  s.econ.treasury -= s.econ.gdp * 0.00002 * (0.5 + C.chief.skill / 100);
}

// Ministérios conforme a ideologia (mandatos do gabinete existente).
export function ideologyMandates(s) {
  const ax = s.nation.ideology?.axes || {}, a = k => (ax[k] ?? 0);
  return { finance: a('econ') > 15 ? 'austerity' : a('econ') < -15 ? 'stimulus' : 'balance', economy: a('econ') > 15 ? 'export' : a('econ') < -15 ? 'industry' : 'regional', defense: a('mil') > 15 ? 'buildup' : 'maintain', interior: a('auth') > 10 ? 'order' : 'pacify', health: a('redist') > -5 ? 'expand' : 'lean', education: a('tech') > 10 ? 'technical' : 'expand', foreign: a('global') > -10 ? 'trade' : 'allies', justice: a('auth') > 10 ? 'clean' : 'rights' };
}
export function chiefAct(s, data, op, arg) {
  const C = ensureChief(s);
  switch (op) {
    case 'hire': { const c = candidates(s)[arg]; if (!c) return { ok: false, msg: '' }; C.chief = c; C.on = true; C.since = day(s); C.cand = null; return { ok: true, log: true, msg: `${c.name} assume a chefia de gabinete (${TRAITS[c.trait][0]}, competência ${c.skill}).` }; }
    case 'fire': C.chief = null; C.on = false; return { ok: true, log: true, msg: 'Você demite o chefe de gabinete.' };
    case 'level': C.level = arg; return { ok: true, msg: '' };
    case 'redline': C.redlines = C.redlines.includes(arg) ? C.redlines.filter(x => x !== arg) : [...C.redlines, arg]; return { ok: true, msg: '' };
    case 'mandates': { const M = ideologyMandates(s); s.pol ||= {}; (s.pol.mandates ||= {}); for (const p in M) { s.pol.mandates[p] = M[p]; if (s.pol.hold) delete s.pol.hold[p]; } return { ok: true, log: true, msg: 'Os ministérios passam a seguir a sua ideologia, com autonomia.' }; }
    case 'warauto': for (const w of s.wars.filter(x => x.active)) { w.cmd ||= { mode: 'auto', plan: 'balanced', orders: { target: 'assault', target2: 'flank', def: 'hold' }, obj: null }; w.cmd.mode = 'auto'; } return { ok: true, log: true, msg: 'As guerras em curso passam ao comando automático dos generais.' };
  }
  return { ok: false, msg: '' };
}
