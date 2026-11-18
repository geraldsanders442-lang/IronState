import { clamp, chance, rand, pick, random } from './util.js';
import { personName, playerCulture } from './names.js';

// Elenco recorrente: seis figuras com lealdade, influência, ambição e rivalidades.
const ROLES = {
  general: { role: 'General ambicioso', title: 'Gen.', group: 'military', wants: 'verbas militares, vitórias e respeito à hierarquia' },
  finance: { role: 'Ministro(a) da Fazenda', title: '', group: 'business', wants: 'contas equilibradas, inflação baixa e mercados calmos' },
  security: { role: 'Chefe da segurança', title: 'Cel.', group: 'bureaucracy', wants: 'controle, inteligência e mão firme' },
  diplomat: { role: 'Chanceler', title: 'Emb.', group: null, wants: 'reputação, tratados e boas relações' },
  broker: { role: 'Cacique regional', title: '', group: 'regional', wants: 'autonomia, obras nas regiões e vista grossa' },
  opposition: { role: 'Líder da oposição', title: '', group: 'opposition', wants: 'liberdade política, eleições e a sua queda' },
};
const FIRST = ['Elena', 'Viktor', 'Amara', 'Rafael', 'Leyla', 'Tomás', 'Nadia', 'Omar', 'Irina', 'Kofi', 'Sofia', 'Dmitri', 'Yara', 'Marco', 'Aiko', 'Farid', 'Lucía', 'Pavel', 'Zainab', 'André', 'Mira', 'Hassan', 'Ingrid', 'Joaquim'];
const LAST = ['Varga', 'Moreau', 'Kader', 'Novak', 'Haddad', 'Silva', 'Petrov', 'Okafor', 'Rahman', 'Lindqvist', 'Costa', 'Demir', 'Mendes', 'Ivanova', 'Tanaka', 'Rossi', 'Barzani', 'Kowalski', 'Ortega', 'Nasser', 'Albescu', 'Corvo'];

export function initCast(s, data) {
  const used = new Set(), cul = data ? playerCulture(s, data) : 'en';
  const nameOf = () => { let n, k = 0; do n = personName(cul); while (used.has(n) && k++ < 20); used.add(n); return n; };
  s.nation.culture = cul;
  s.characters = Object.entries(ROLES).map(([id, r]) => ({
    id, role: r.role, name: (r.title ? r.title + ' ' : '') + nameOf(), loyalty: id === 'opposition' ? 15 : Math.round(rand(45, 70)), influence: Math.round(rand(35, 70)),
    ambition: Math.round(rand(30, 85)), status: 'active', since: 0, rival: null, mood: 0,
  }));
  const ids = s.characters.filter(c => c.id !== 'opposition').map(c => c.id);
  const a = pick(ids), b = pick(ids.filter(x => x !== a));
  s.characters.find(c => c.id === a).rival = b;
  s.characters.find(c => c.id === b).rival = a;
}

export const castById = (s, id) => s.characters?.find(c => c.id === id && c.status === 'active');

// Satisfação de cada personagem com o rumo do governo (alvo da lealdade).
function wantScore(s, c) {
  const st = s.st, g = s.groups, bal = (s.d?.budget?.balance || 0) / s.econ.gdp * 100;
  switch (c.id) {
    case 'general': return g.military * 0.6 + s.budget.spend.military * 6 + (s.flags.wonWar ? 10 : 0) - (s.flags.lostWar ? 20 : 0);
    case 'finance': return 60 - Math.max(0, st.inflation - 4) * 2 + clamp(bal, -6, 3) * 5 + g.business * 0.2 - (s.flags.defaulted ? 30 : 0);
    case 'security': return 30 + st.control * 0.4 + (s.d?.repression || 0) * 0.4 + st.intel * 0.2 - st.protest * 0.2;
    case 'diplomat': return 20 + st.reputation * 0.5 + Object.values(s.partners).filter(p => p.trade || p.pact).length * 2 - Object.values(s.partners).filter(p => p.sanctionsBy).length * 5;
    case 'broker': return g.regional * 0.7 + (s.policies.autonomy === 'federal' ? 15 : s.policies.autonomy === 'centralized' ? -10 : 0) + st.corruption * 0.1;
    case 'opposition': return 5 + st.political * 0.5 + (s.policies.elections === 'multiparty' ? 20 : 0) - (s.d?.repression || 0) * 0.3;
  }
  return 50;
}

export function castMods(s) {
  const M = {};
  const add = (k, v) => { M[k] = (M[k] || 0) + v; };
  for (const c of s.characters || []) {
    if (c.status !== 'active') continue;
    const w = c.influence / 100, l = (c.loyalty - 50) / 50;
    if (c.id === 'general') { add('coupRisk', -l * 8 * w); add('readiness', l * 4 * w); }
    if (c.id === 'finance') { add('taxCapacity', l * 4 * w); add('inflation', -l * 0.4 * w); }
    if (c.id === 'security') { add('revoRisk', -l * 6 * w); add('control', l * 4 * w); add('intel', l * 3 * w); }
    if (c.id === 'diplomat') add('reputation', l * 4 * w);
    if (c.id === 'broker') add('separatism', -l * 6 * w);
    if (c.id === 'opposition') { add('opposition', w * 6); add('protest', (0.3 - l) * 4 * w); }
  }
  return M;
}

export function weeklyCast(s, data, ctx) {
  if (!s.characters) return;
  for (const c of s.characters) {
    if (c.status !== 'active') continue;
    const target = clamp(wantScore(s, c), 0, 100);
    c.loyalty = clamp(c.loyalty + (target - c.loyalty) * 0.04 + rand(-1, 1), 0, 100);
    c.influence = clamp(c.influence + (c.ambition - 50) * 0.01 + rand(-0.5, 0.6), 5, 95);
  }
  s.longMods = s.longMods.filter(m => m.id !== 'cast');
  const M = castMods(s);
  for (const k in M) s.longMods.push({ k, v: M[k], d: 0, left: 0, src: 'Personagens', id: 'cast' });
  const day = ctx.day;
  if ((s.counters.castCd || 0) > day || !chance(0.35)) return;
  s.counters.castCd = day + 14;
  const act = s.characters.filter(c => c.status === 'active');
  const c = pick(act);
  if (!c) return;
  const nm = c.name;
  if (c.id === 'opposition') {
    if (c.influence > 60 && chance(0.5)) ctx.card(card(c, 'opp_rally', `${nm} convoca grande comício`, `O líder da oposição ${nm} reuniu dezenas de milhares e exige eleições antecipadas.`, [
      { text: 'Permitir o comício e debater publicamente.', hint: 'Imagem de abertura; oposição cresce.', now: { political: 2, legitimacy: 1 }, cast: { opposition: { influence: 6 } } },
      { text: `Prender ${nm} por incitação.`, hint: 'Elimina a ameaça por ora; vira mártir.', now: { civil: -4, protest: 6, reputation: -4 }, cast: { opposition: { status: 'jailed' } }, long: [{ k: 'revoRisk', v: 5, d: 180 }] },
      { text: `Oferecer a ${nm} um ministério.`, hint: 'Coopta a oposição; seus aliados se dividem.', now: { treasury: -0.05 }, cast: { opposition: { loyalty: 35, influence: -15 } }, groups: { opposition: 6, bureaucracy: -3 } }]));
    return;
  }
  if (c.loyalty < 25 && c.ambition > 55) {
    if (c.id === 'general') { s.longMods.push({ k: 'coupRisk', v: 10, d: 90, left: 90, src: `Conspiração de ${nm}` }); ctx.news(`Rumores: ${nm} reúne oficiais descontentes.`, 'bad'); }
    else if (c.id === 'finance') { c.status = 'resigned'; s.longMods.push({ k: 'growth', v: -0.6, d: 120, left: 120, src: 'Saída do ministro' }); ctx.news(`${nm} renuncia à Fazenda e critica o governo; mercados reagem mal.`, 'bad'); replace(s, c); }
    else if (c.id === 'security') { s.longMods.push({ k: 'intel', v: -6, d: 120, left: 120, src: 'Vazamentos' }); ctx.news(`Documentos sigilosos vazam; suspeitas recaem sobre ${nm}.`, 'bad'); }
    else if (c.id === 'broker') { s.longMods.push({ k: 'separatism', v: 6, d: 150, left: 150, src: `Traição de ${nm}` }); ctx.news(`${nm} rompe com o governo e flerta com os separatistas.`, 'bad'); }
    else if (c.id === 'diplomat') { s.st.reputation = clamp(s.st.reputation - 4, 0, 100); ctx.news(`${nm} dá entrevista explosiva a um jornal estrangeiro.`, 'bad'); }
    return;
  }
  if (c.rival && castById(s, c.rival) && chance(0.4)) {
    const r = castById(s, c.rival);
    ctx.card(card(c, 'feud', `${nm} contra ${r.name}`, `A rivalidade entre ${nm} (${c.role}) e ${r.name} (${r.role}) paralisa o gabinete. Cada um exige que você escolha um lado.`, [
      { text: `Apoiar ${nm}.`, hint: `${r.name} perde lealdade.`, cast: { [c.id]: { loyalty: 15 }, [r.id]: { loyalty: -20 } } },
      { text: `Apoiar ${r.name}.`, hint: `${nm} perde lealdade.`, cast: { [c.id]: { loyalty: -20 }, [r.id]: { loyalty: 15 } } },
      { text: `Demitir ${nm}.`, hint: 'Encerra a briga; seus aliados se ressentem.', cast: { [c.id]: { status: 'fired' } }, now: { stability: -2 } }]));
    return;
  }
  const demands = {
    general: ['exige verba extra para as Forças Armadas', { now: { treasury: -0.4, readiness: 4 }, groups: { military: 6 } }],
    finance: ['exige um corte de 5% em todos os ministérios', { now: { treasury: 0.4 }, groups: { bureaucracy: -5, workers: -3 } }],
    security: ['pede poderes para grampear opositores sem ordem judicial', { now: { intel: 4, civil: -4 }, long: [{ k: 'repression', v: 4, d: 180 }] }],
    diplomat: ['quer uma turnê internacional cara para melhorar a imagem do país', { now: { treasury: -0.15, reputation: 4 } }],
    broker: ['exige obras em sua região em troca de votos e lealdade', { now: { treasury: -0.25 }, groups: { regional: 6 }, long: [{ k: 'corruption', v: 1.5, d: 240 }] }],
  }[c.id];
  if (!demands) return;
  ctx.card(card(c, 'demand', `${nm} ${demands[0]}`, `${nm}, ${c.role.toLowerCase()}, ${demands[0]}. Quer, sobretudo, ${ROLES[c.id].wants}.`, [
    { text: 'Atender ao pedido.', hint: 'Ganha lealdade.', ...demands[1], cast: { [c.id]: { loyalty: 15, influence: 3 } } },
    { text: 'Recusar.', hint: 'Perde lealdade.', cast: { [c.id]: { loyalty: -15 } } },
    { text: `Demitir ${nm}.`, hint: 'Um substituto assume, inicialmente menos experiente.', cast: { [c.id]: { status: 'fired' } }, now: { stability: -1 } }]));
}

function card(c, kind, title, desc, options) {
  return { id: `dyn_cast_${c.id}_${kind}_${Math.floor(random() * 1e6)}`, dyn: true, cat: 'Gabinete', title, desc, context: `${c.name}: lealdade ${Math.round(c.loyalty)}, influência ${Math.round(c.influence)}, ambição ${Math.round(c.ambition)}.`, deadline: 14, default: 1, options };
}

export function replace(s, c) {
  const fresh = { ...c, name: (c.name.split(' ')[0].endsWith('.') ? c.name.split(' ')[0] + ' ' : '') + personName(s.nation.culture || 'en'), loyalty: 45, influence: 30, ambition: Math.round(rand(30, 80)), status: 'active', since: Math.floor(s.time.min / 1440), rival: null };
  c.status = c.status === 'active' ? 'fired' : c.status;
  s.characters.push(fresh);
}

// Aplicado pelo jogo quando uma opção traz o campo "cast".
export function applyCast(s, opt, log) {
  for (const id in opt.cast || {}) {
    const c = castById(s, id);
    if (!c) continue;
    const ch = opt.cast[id];
    if (ch.loyalty) c.loyalty = clamp(c.loyalty + ch.loyalty, 0, 100);
    if (ch.influence) c.influence = clamp(c.influence + ch.influence, 0, 100);
    if (ch.status) {
      c.status = ch.status;
      if (ch.status === 'fired') { log(`${c.name} foi demitido(a).`, 'decision'); if (c.id === 'general') s.longMods.push({ k: 'g_military', v: -6, d: 120, left: 120, src: 'Demissão do general' }); replace(s, c); }
      if (ch.status === 'jailed') { log(`${c.name} foi preso(a).`, 'warn'); replace(s, c); }
    }
  }
}

// Conselhos: cada personagem recomenda a opção mais alinhada aos seus interesses.
const INTEREST = {
  general: { g_military: 2, readiness: 1, equipment: 1, coupRisk: -0.5 }, finance: { treasury: 6, inflation: -3, g_business: 1, growth: 4 },
  security: { control: 2, intel: 2, protest: -1, revoRisk: -1 }, diplomat: { reputation: 2, rel: 0.6 }, broker: { g_regional: 2, separatism: -1, corruption: 0.3 },
};
export function advice(s, data, iss) {
  if (!s.characters || !iss?.options) return [];
  const out = [];
  for (const c of s.characters) {
    if (c.status !== 'active' || !INTEREST[c.id]) continue;
    const W = INTEREST[c.id];
    let best = -1, bv = -Infinity;
    iss.options.forEach((o, i) => {
      let v = 0;
      for (const k in o.now || {}) v += (W[k] || 0) * o.now[k];
      for (const g in o.groups || {}) v += (W['g_' + g] || 0) * o.groups[g];
      for (const m of o.long || []) v += (W[m.k] || 0) * m.v * 0.6;
      for (const r in o.rel || {}) v += (W.rel || 0) * o.rel[r];
      if (v > bv) { bv = v; best = i; }
    });
    if (best >= 0 && bv > 0.5) out.push({ name: c.name, role: c.role, opt: best, text: `Recomendo a opção ${best + 1}. ${c.loyalty < 30 ? '(Sua lealdade é duvidosa.)' : ''}`.trim(), loyalty: c.loyalty });
  }
  return out.slice(0, 3);
}
