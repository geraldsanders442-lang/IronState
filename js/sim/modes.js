// Modos de jogo: sandbox, ironman, dinastia, desafios curtos, desafio diário (semente do dia),
// roguelite (temporadas de 1 ano com legado entre partidas) e ascensão ao poder.
import { clamp, chance, rand } from './util.js';
import { gdppc, debtRatio } from './model.js';
import { endGame } from './regime.js';
import { initAscent2, weeklyAscent, ascentFirstCard2, applyEff } from './ascent2.js';

const day = s => Math.floor(s.time.min / 1440);
const week = s => Math.floor(day(s) / 7);

export const MODES = {
  sandbox: { name: 'Sandbox', desc: 'Sem limite de tempo. Governe como quiser.' },
  ironman: { name: 'Ironman', desc: 'Um único save, sem voltar atrás. Conquistas valem o dobro.' },
  dynasty: { name: 'Dinastia', desc: 'Quando o governante morre, o herdeiro assume. Pontua por gerações e estabilidade.' },
  challenge: { name: 'Desafio', desc: 'Situações difíceis com meta e prazo curtos (20 a 52 semanas).' },
  daily: { name: 'Desafio diário', desc: 'Mesmo país, mesma crise e mesma sorte para todos no dia. 30 semanas.' },
  roguelite: { name: 'Roguelite', desc: 'Temporadas de 1 ano. Sua pontuação vira Legado, que compra vantagens para as próximas.' },
  observer: { name: '👁 Observatório (espectador)', desc: 'Modo laboratório: você não governa ninguém — assiste ao mundo agir sozinho guiado pela IA, com mapa grande, jornal, medidores de caos e tensão, avanço rápido com pausa e controles para mexer nas regras e nos países.' },
  ascension: { name: 'Ascensão ao poder', desc: 'Comece na oposição e chegue ao governo por eleição, golpe ou revolução.' },
};

export const CHALLENGES = [
  { id: 'hyper', name: 'Domar a hiperinflação', country: 'ARG', weeks: 40, desc: 'Inflação de 150% ao ano e cofres vazios. Leve a inflação abaixo de 15% sem cair.', setup: s => { s.st.inflation = 150; s.econ.treasury = s.econ.gdp * 0.002; s.st.stability = 40; s.longMods.push({ k: 'inflation', v: 90, d: 240, left: 240, src: 'Espiral inflacionária' }); }, goal: s => s.st.inflation < 15, goalText: 'Inflação < 15%', weekly: (s, C) => { C.floor ??= 150; const def = -(s.d?.budget?.balance || 0) / s.econ.gdp * 100; C.floor = def <= 2 && !s.d?.printing ? C.floor - 7 : C.floor + 3; C.floor = clamp(C.floor, 0, 300); s.st.inflation = Math.max(s.st.inflation, C.floor); } },
  { id: 'civil', name: 'Evitar a guerra civil', country: 'LBN', weeks: 30, desc: 'Separatismo em 60, estabilidade em 30 e milícias armadas. Estabilize o país.', setup: s => { s.st.separatism = 60; s.st.stability = 30; s.st.control = 35; for (const r of s.regions) r.unrest = Math.max(r.unrest, 65); s.longMods.push({ k: 'separatism', v: 35, d: 180, left: 180, src: 'Milícias sectárias' }, { k: 'stability', v: -20, d: 180, left: 180, src: 'Milícias sectárias' }); }, goal: s => s.st.stability > 55 && s.st.separatism < 35, goalText: 'Estabilidade > 55 e separatismo < 35' },
  { id: 'coup', name: 'Sobreviver aos generais', country: 'MLI', weeks: 26, desc: 'Os quartéis conspiram (risco de golpe 75). Termine o prazo no poder.', setup: s => { s.st.coupRisk = 75; s.groups.military = 20; s.longMods.push({ k: 'coupRisk', v: 40, d: 182, left: 182, src: 'Conspiração nos quartéis' }); }, goal: () => false, survive: true, goalText: 'Sobreviver 26 semanas' },
  { id: 'tiger', name: 'Tigre asiático', country: 'VNM', weeks: 104, desc: 'Faça o PIB per capita crescer 30% em dois anos.', setup: () => {}, goal: s => gdppc(s) >= s.nation.startGdppc * 1.3, goalText: 'PIB per capita +30%' },
  { id: 'debt', name: 'Sair do buraco', country: 'GRC', weeks: 52, desc: 'Dívida de 180% do PIB e credores impacientes. Reduza para menos de 120% sem calote.', setup: s => { s.econ.debt = s.econ.gdp * 1.8; }, goal: s => debtRatio(s) < 120 && !s.flags.defaulted, goalText: 'Dívida < 120% do PIB, sem calote' },
  { id: 'pandemic', name: 'A pandemia', country: 'BRA', weeks: 20, desc: 'Um vírus se espalha. Mantenha a aprovação acima de 40% e a saúde acima de 45.', setup: s => { s.flags.gc_pandemic = 1; s.longMods.push({ k: 'health', v: -10, d: 140, left: 140, src: 'Pandemia' }, { k: 'growth', v: -2, d: 140, left: 140, src: 'Pandemia' }); }, goal: s => (s.d?.support ?? 0) > 40 && s.st.health > 45, goalText: 'Aprovação > 40% e saúde > 45', atEnd: true },
];
export const challengeById = Object.fromEntries(CHALLENGES.map(c => [c.id, c]));
const DAILY_POOL = ['ARG', 'TUR', 'EGY', 'PAK', 'NGA', 'IDN', 'MEX', 'IRN', 'ZAF', 'COL', 'PHL', 'UKR', 'VEN', 'ETH', 'THA', 'POL', 'KEN', 'PER', 'MAR', 'BGD'];
const hashStr = t => { let h = 2166136261; for (const c of t) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
export function dailyConfig(date = new Date()) {
  const key = date.toISOString().slice(0, 10), h = hashStr(key);
  return { key, seed: 'daily-' + key, country: DAILY_POOL[h % DAILY_POOL.length], challenge: CHALLENGES[(h >>> 5) % CHALLENGES.length].id, weeks: 30 };
}

// ---------- Roguelite: legado e vantagens ----------
export const PERKS = {
  treasury: { name: 'Cofre cheio', desc: '+3% do PIB no tesouro inicial.', cost: 10, apply: s => { s.econ.treasury += s.econ.gdp * 0.03; } },
  legit: { name: 'Mandato popular', desc: '+8 de legitimidade inicial.', cost: 12, apply: s => { s.st.legitimacy += 8; } },
  intel: { name: 'Rede de informantes', desc: '+12 de inteligência.', cost: 10, apply: s => { s.st.intel += 12; } },
  loyal: { name: 'Quartéis leais', desc: 'Militares +15 e risco de golpe −10.', cost: 15, apply: s => { s.groups.military += 15; s.st.coupRisk -= 10; } },
  tech: { name: 'Cérebros repatriados', desc: '+40 pontos de pesquisa.', cost: 12, apply: s => { (s.tech ||= { pts: 0, done: [], cur: null }).pts += 40; } },
  friends: { name: 'Amigos no exterior', desc: '+10 de relação com todos.', cost: 18, apply: s => { for (const id in s.partners) s.partners[id].rel += 10; } },
};
export const META_KEY = 'ironstate.meta';
export function loadMeta(storage) { try { return JSON.parse(storage?.getItem(META_KEY) || 'null') || { legacy: 0, perks: [], runs: 0, best: {} }; } catch { return { legacy: 0, perks: [], runs: 0, best: {} }; } }
export function saveMeta(storage, m) { try { storage?.setItem(META_KEY, JSON.stringify(m)); } catch {} }

// ---------- Pontuação ----------
export function score(s) {
  const st = s.st, years = day(s) / 365;
  const gd = gdppc(s) / Math.max(1, s.nation.startGdppc) - 1;
  let v = 100 + gd * 400 + (st.stability - 50) * 2 + ((s.d?.support ?? 50) - 50) * 2 + (st.qol - 45) * 2 + years * 40 + s.achievements.length * 60 - st.poverty * 1.5 - (s.flags.atrocity ? 150 : 0) - (s.flags.defaulted ? 80 : 0) + (s.flags.wonWar ? 40 : 0);
  if (s.mode === 'dynasty') v += ((s.pol?.leader?.gen || 1) - 1) * 120;
  if (s.mode === 'ironman') v *= 1.25;
  if (s.over && ['junta', 'killed', 'executed', 'captured', 'occupation', 'civilwar', 'vaporized', 'nuclear'].includes(s.over.ending)) v *= 0.6;
  return Math.max(0, Math.round(v));
}

export function initMode(s, cfg) {
  const m = s.mode = cfg.mode || 'sandbox';
  s.modeCfg = { ...(cfg.modeCfg || {}) };
  if (m === 'challenge' || m === 'daily') {
    const ch = challengeById[s.modeCfg.challenge];
    if (ch) { ch.setup(s); s.modeCfg.weeks = s.modeCfg.weeks || ch.weeks; s.modeCfg.goalText = ch.goalText; s.modeCfg.name = ch.name; }
  }
  if (m === 'roguelite') { s.modeCfg.weeks = 52; for (const p of s.modeCfg.perks || []) PERKS[p]?.apply(s); }
  if (m === 'ascension') initAscension(s);
}

// Verificação semanal: metas, prazos e fim de temporada.
export function weeklyMode(s, ctx) {
  const m = s.mode, C = s.modeCfg || {};
  if (m === 'ascension' && s.ascent) return weeklyAscent(s, ctx);
  if (!C.weeks) return;
  const w = week(s);
  const ch = challengeById[C.challenge];
  ch?.weekly?.(s, C);
  if (ch && !ch.atEnd && !ch.survive && ch.goal(s) && !C.done) { C.done = true; C.result = 'win'; ctx.modeEnd?.('win'); return; }
  if (w >= C.weeks) { C.done = true; C.result = ch ? (ch.survive || ch.goal(s) ? 'win' : 'lose') : 'end'; ctx.modeEnd?.(C.result); }
}

// ---------- Ascensão ao poder ----------
function initAscension(s) {
  s.ascent = { support: 12, force: 8, money: 10, allies: 0, week: 0, route: null };
  initAscent2(s);
}
export const ASCENT_ACTIONS = {
  rally: { name: 'Grandes comícios', desc: '+apoio; gasta dinheiro.', f: A => { A.support += 6 + rand(0, 4); A.money -= 4; } },
  donors: { name: 'Buscar doadores ricos', desc: '+dinheiro; afasta os pobres.', f: A => { A.money += 9; A.support -= 1; } },
  unions: { name: 'Aliança com sindicatos', desc: '+apoio e base organizada.', f: A => { A.support += 4; A.allies += 1; } },
  officers: { name: 'Cortejar oficiais', desc: '+força militar; arriscado.', f: A => { A.force += 7; A.risk = (A.risk || 0) + 8; } },
  militia: { name: 'Organizar milícias', desc: '+força nas ruas; mancha a imagem.', f: A => { A.force += 9; A.support -= 2; A.risk = (A.risk || 0) + 6; } },
  foreign: { name: 'Apoio estrangeiro', desc: '+dinheiro e +força; acusação de traição.', f: A => { A.money += 6; A.force += 4; A.support -= 3; } },
  media: { name: 'Campanha nas redes', desc: '+apoio barato.', f: A => { A.support += 4; A.money -= 1; } },
};
export function ascentAct(s, act) {
  const A = s.ascent; if (!A) return '';
  if (act.choice === 'eff') { applyEff(s, act.eff); return ''; }
  if (act.choice === 'go') return ascentRoute(s, act.route);
  ASCENT_ACTIONS[act.choice]?.f(A);
  for (const k of ['support', 'force', 'money']) A[k] = clamp(A[k], 0, 100);
  return '';
}
function ascentWeek(s, ctx) {
  const A = s.ascent;
  A.week++;
  A.support = clamp(A.support + (50 - (s.d?.support ?? 50)) / 25, 0, 100);
  if ((A.risk || 0) > 0 && chance(A.risk / 300)) { A.force = Math.max(0, A.force - 12); A.support = Math.max(0, A.support - 5); A.risk = 0; ctx.news('A polícia política prende dezenas de militantes do movimento.', 'bad'); }
  if (A.week > 26) { endGame(s, 'exile', 'O movimento fracassou em chegar ao poder'); return; }
  ctx.card(ascentCard(s));
}
export const ascentFirstCard = s => ascentFirstCard2(s);
function ascentCard(s) {
  const A = s.ascent;
  const canElect = A.support >= 45, canCoup = A.force >= 45, canRev = A.support >= 35 && A.force >= 30;
  const opts = Object.entries(ASCENT_ACTIONS).slice(0, 4).map(([k, a]) => ({ text: a.name, hint: a.desc, act: { type: 'ascent', choice: k } }));
  const more = Object.entries(ASCENT_ACTIONS).slice(4);
  const pickMore = more[A.week % more.length];
  opts[3] = { text: pickMore[1].name, hint: pickMore[1].desc, act: { type: 'ascent', choice: pickMore[0] } };
  if (canElect) opts.push({ text: 'Disputar e vencer as eleições.', hint: 'Chega ao poder pela via democrática.', act: { type: 'ascent', choice: 'go', route: 'election' } });
  else if (canCoup) opts.push({ text: 'Dar o golpe com os oficiais aliados.', hint: 'Poder imediato; legitimidade baixa.', act: { type: 'ascent', choice: 'go', route: 'coup' } });
  else if (canRev) opts.push({ text: 'Convocar a insurreição popular.', hint: 'Revolução: tudo ou nada.', act: { type: 'ascent', choice: 'go', route: 'revolution' } });
  return { id: `dyn_ascent_${day(s)}`, dyn: true, crisis: true, keepInCrisis: true, cat: 'Ascensão ao poder', title: `O movimento — semana ${A.week} de 26`, desc: `Você lidera o principal movimento de oposição de ${s.nation.shortName}. O governo atual vacila; a sua chance está chegando.`, context: `Apoio popular ${Math.round(A.support)} · força ${Math.round(A.force)} · dinheiro ${Math.round(A.money)} · alianças ${A.allies}. Eleição exige apoio ≥ 45; golpe, força ≥ 45; revolução, apoio ≥ 35 e força ≥ 30.`, deadline: 7, default: 0, options: opts.slice(0, 5) };
}
function ascentRoute(s, route) {
  const A = s.ascent;
  s.ascent = null;
  s.flags.ascended = route;
  if (route === 'election') { s.st.legitimacy = clamp(55 + A.support / 4, 0, 100); s.st.political = clamp(s.st.political + 8, 0, 100); s.policies.elections = s.policies.elections === 'none' ? 'controlled' : s.policies.elections; return 'Vitória nas urnas! O movimento chega ao governo com um mandato popular.'; }
  if (route === 'coup') { s.st.legitimacy = clamp(30 + A.force / 5, 0, 100); s.groups.military = clamp(s.groups.military + 15, 0, 100); s.st.reputation = clamp(s.st.reputation - 10, 0, 100); s.policies.elections = 'none'; return 'Tanques na capital: o golpe triunfa e você assume o governo.'; }
  s.st.legitimacy = clamp(40 + A.support / 4, 0, 100); s.st.stability = clamp(s.st.stability - 10, 0, 100); s.groups.opposition = clamp(s.groups.opposition - 20, 0, 100); return 'A revolução vence! O antigo regime cai e o povo celebra nas ruas.';
}
