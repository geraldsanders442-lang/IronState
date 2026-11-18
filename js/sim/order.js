// Ordem e êxodo: tipos de crime, autonomia da polícia, alienação e patriotismo, base aliada, fuga do país
// (barcos em ilhas; travessias de fronteira em continentes, com mortes por clima), grupos armados internos
// e crimes de guerra com intervenção internacional.
import { clamp, chance, rand, pick } from './util.js';
import { PLY, provincesOf } from './world.js';
import { liberty } from './rights.js';
import { personName } from './names.js';

const day = s => Math.floor(s.time.min / 1440);
const add = (s, k, v) => { s.st[k] = clamp((s.st[k] ?? 0) + v, 0, 100); };
const grp = (s, g, v) => { s.groups[g] = clamp((s.groups[g] ?? 50) + v, 0, 100); };
const people = s => s.econ.pop * 1e6;

export function ensureOrd(s) {
  if (s.ord) return s.ord;
  const c = s.st.crime ?? 40;
  s.ord = {
    crime: { theft: c, violent: c * 0.7, gang: c * 0.5, corrupt: s.st.corruption ?? 40, state: 10 },
    police: 30, alien: 20, patriot: 40, base: 20, fleeRate: 0,
    fled: { total: 0, legal: 0, sea: 0, border: 0, dead: 0, caught: 0, missing: 0 },
    border: 'normal', last: {}, cd: {}, log: [],
  };
  return s.ord;
}
const note = (s, text) => { const o = s.ord; o.log.unshift({ day: day(s), text }); if (o.log.length > 40) o.log.length = 40; };

// Fronteira terrestre? (ilha = nenhuma província vizinha de outro dono)
export function landBorder(s, data) {
  const c = s._landB; if (c && c.ver === (s.world?.ver ?? 0)) return c.v;
  const mine = new Set(provincesOf(s, data, PLY)); let v = false;
  for (const pid of mine) { for (const n of data.geo.prov[pid].nb) if (!mine.has(n)) { v = true; break; } if (v) break; }
  s._landB = { ver: s.world?.ver ?? 0, v };
  s.nation.island = !v;
  return v;
}

// Perigo da travessia por região do mundo: [probabilidade de morte, causa, probabilidade de prisão]
const HAZ = {
  cold: [0.09, 'morreram de frio numa nevasca na fronteira', 0.2],
  hot: [0.08, 'morreram de calor e sede no deserto', 0.15],
  forest: [0.07, 'ficaram perdidos e morreram na floresta', 0.15],
  mountain: [0.07, 'morreram em avalanches e passagens de montanha', 0.18],
  river: [0.05, 'morreram afogados ao cruzar o rio fronteiriço', 0.2],
  plain: [0.025, 'morreram em travessias improvisadas', 0.3],
};
const HOT = new Set(['middle_east', 'north_africa', 'central_asia', 'sub_saharan_africa', 'south_asia']);
const FOREST = new Set(['southeast_asia', 'south_america', 'central_america', 'caribbean']);
const MOUNT = new Set(['caucasus', 'balkans']);
export function hazardOf(s) {
  const R = s.nation.regions || [];
  if (s.nation._cold?.v) return 'cold';
  if (R.some(r => FOREST.has(r))) return 'forest';
  if (R.some(r => HOT.has(r))) return 'hot';
  if (R.some(r => MOUNT.has(r))) return 'mountain';
  if (R.includes('eastern_europe') || R.includes('europe')) return 'river';
  return 'plain';
}

export function weeklyOrder(s, data, ctx) {
  if (s.flags.micronation || s.ascent || !s.rights) return;
  const o = ensureOrd(s), st = s.st, R = s.rights || {}, d = day(s), pol = s.policies;
  landBorder(s, data);
  const lib = liberty(s), prop = s.prop?.level || 0, abuse = R.abuse || 0;
  // ---- Alienação e patriotismo ----
  const aT = clamp(8 + st.control * 0.3 + (100 - st.education) * 0.2 + prop * 0.35 + (pol.press === 'state' || pol.press === 'censored' ? 14 : 0) - lib * 0.18 - st.protest * 0.1, 0, 100);
  o.alien += (aT - o.alien) * 0.04;
  const nat = (s.nation.ideology?.axes?.nation ?? 0);
  const pT = clamp(30 + o.alien * 0.35 + nat * 0.15 + (s.wars.some(w => w.active) ? 8 : 0) + (st.legitimacy - 50) * 0.2 + prop * 0.2 - abuse * 0.1, 0, 100);
  o.patriot += (pT - o.patriot) * 0.04;
  // ---- Base aliada ----
  const bT = clamp(10 + o.patriot * 0.3 + (s.groups.military + s.groups.bureaucracy) * 0.12 + (s.prop?.base || 0) + (st.legitimacy - 40) * 0.25 - st.hunger * 0.3 - st.corruption * 0.1, 0, 100);
  o.base += (bT - o.base) * 0.05;
  // ---- Polícia ----
  const secB = s.budget?.spend?.security ?? 2;
  o.police = clamp(o.police + (secB - 2.2) * 0.25 + (st.control - 55) * 0.01 - (lib - 55) * 0.008 + (o.policeShift || 0), 0, 100); o.policeShift = 0;
  if (o.police > 70) { add(s, 'corruption', 0.05); add(s, 'coupRisk', 0.04); R.abuse = clamp((R.abuse || 0) + 0.04, 0, 100); }
  // ---- Tipos de crime ----
  const pov = st.poverty, ineq = st.inequality, unemp = st.unemployment;
  const sec = secB, polEff = 0.6 + (o.police < 25 ? -0.15 : o.police > 70 ? 0.15 : 0);
  const T = {
    theft: 10 + pov * 0.45 + unemp * 0.8 + ineq * 0.12 - sec * 3 * polEff - st.control * 0.1,
    violent: 8 + pov * 0.25 + ineq * 0.18 + o.crime.gang * 0.3 - sec * 2 * polEff - st.education * 0.08,
    gang: 5 + pov * 0.3 + unemp * 0.6 + (100 - st.control) * 0.25 - (o.police > 40 ? 6 : 0) - st.education * 0.1,
    corrupt: st.corruption,
    state: Math.max(abuse, (s.d?.repression || 0) * 0.5 + (o.police > 60 ? (o.police - 60) * 0.5 : 0)),
  };
  for (const k in T) o.crime[k] += (clamp(T[k], 0, 100) - o.crime[k]) * 0.08;
  // ---- Êxodo ----
  // Vontade de sair (fração da população por ano): só sobe com miséria, repressão, guerra e fome.
  const desire = clamp(Math.max(0, 50 - st.qol) * 0.0012 + st.poverty * 0.0003 + abuse * 0.0007 + (s.wars.some(w => w.active) ? 0.004 : 0) + st.hunger * 0.0008 + Math.max(0, 50 - lib) * 0.0010, 0, 0.08);
  const hold = clamp(1 - o.alien * 0.0085 - o.patriot * 0.003, 0.15, 1);
  const want = desire * hold;
  o.fleeRate = want * 100; // % da população por ano que quer sair
  // Só há fuga clandestina quando a saída legal é bloqueada (emigração proibida/taxada, fronteira fechada ou regime fechado).
  const blocked = pol.emigration === 'banned' ? 0.95 : pol.emigration === 'taxed' ? 0.5 : pol.borders === 'closed' ? 0.6 : lib < 30 ? 0.3 : 0.02;
  const illegal = want * blocked * people(s) / 52 * 0.5;
  o.border = o.border || 'normal';
  if (illegal > 5) {
    const bMul = { lax: 1.25, normal: 1, tight: 0.7, lethal: 0.5 }[o.border] || 1;
    const attempts = illegal * bMul;
    let ok = 0, dead = 0, caught = 0;
    const hz = HAZ[hazardOf(s)], island = !s.nation.island ? false : true;
    const open = blocked < 0.1 ? 0.35 : 1;
    const pDead = (island ? 0.1 + (o.border === 'lethal' ? 0.1 : 0) : hz[0] * (o.border === 'lethal' ? 2 : o.border === 'tight' ? 1.2 : 1)) * open;
    const pCaught = (island ? 0.2 : hz[2]) * (o.border === 'tight' ? 1.5 : o.border === 'lax' ? 0.6 : 1);
    dead = attempts * pDead; caught = attempts * pCaught; ok = Math.max(0, attempts - dead - caught);
    const F = o.fled;
    F.total += ok; F.dead += dead; F.caught += caught; F[island ? 'sea' : 'border'] += ok + dead;
    s.econ.pop = Math.max(0.0001, s.econ.pop - (ok + dead) / 1e6);
    if (R.prisoners != null) R.prisoners += Math.round(caught);
    if (o.border === 'lethal') { R.abuse = clamp((R.abuse || 0) + 0.15, 0, 100); }
    if (caught > 50) add(s, 'crime', 0.01);
    if (d % 28 < 7 && attempts > 100) {
      const where = island ? 'ao tentar cruzar o mar em barcos precários' : hz[1];
      note(s, `Fuga clandestina: cerca de ${Math.round(ok * 4).toLocaleString('pt-BR')} pessoas saíram em um mês; ${Math.round(dead * 4).toLocaleString('pt-BR')} ${island ? 'morreram' : 'morreram'} (${where}).`);
      ctx.news(`Fuga clandestina: ${Math.round(dead * 4).toLocaleString('pt-BR')} mortos e ${Math.round(caught * 4).toLocaleString('pt-BR')} presos em um mês.`, 'bad');
      if (dead * 4 > 80) { add(s, 'reputation', -0.6); grp(s, 'youth', -0.6); }
    }
  }
  // ---- Efeitos de ordem ----
  if (o.base > 55) { add(s, 'stability', 0.03); add(s, 'protest', -0.05); }
  if (o.alien > 60) { add(s, 'protest', -0.06); add(s, 'political', -0.03); add(s, 'productivity', -0.02); }
  if (o.crime.gang > 60) { add(s, 'stability', -0.03); add(s, 'growth', -0.01); }
  weeklyArmed(s, data, ctx, o);
  weeklyWarCrimes(s, data, ctx);
}

// ---------- Grupos armados internos ----------
const KINDS = {
  separatist: ['Frente de Libertação', 'Exige autonomia ou independência de uma região.'],
  ethnic: ['Milícia étnica', 'Defende uma minoria e ataca quem a oprime.'],
  progov: ['Milícia governista', 'Militantes que "defendem" o governo, batendo em opositores.'],
  gang: ['Facção criminosa', 'Domina bairros, tráfico e presídios.'],
  religious: ['Grupo radical religioso', 'Impõe regras e ataca "ímpios".'],
  warlord: ['Senhor da guerra', 'Comanda tropas próprias numa área sem presença do Estado.'],
};
export const ARMED_KINDS = KINDS;
function spawnArmed(s, kind, region) {
  const G = (s.armed ||= []);
  const reg = region || pick(s.regions.filter(r => !r.cap) || s.regions) || s.regions[0];
  const nm = { separatist: `Frente de Libertação de ${reg?.name || 'Norte'}`, ethnic: `Milícia de ${reg?.name || 'Leste'}`, progov: `Camisas do Governo (${reg?.name || 'Capital'})`, gang: `Comando ${personName(s.nation.culture || 'en').split(' ').pop()}`, religious: 'Guarda da Fé', warlord: `Senhor da guerra ${personName(s.nation.culture || 'en').split(' ').pop()}` }[kind];
  const g = { id: 'ar' + G.length + '_' + day(s), kind, name: nm, region: reg?.id || null, size: Math.round(rand(300, 2500)), power: rand(8, 20), active: true, born: day(s), funded: false };
  G.push(g);
  return g;
}
export const spawnArmedGroup = spawnArmed;
function weeklyArmed(s, data, ctx, o) {
  const G = (s.armed ||= []), st = s.st;
  const want = [];
  const sepReg = s.regions.filter(r => !r.cap && ((r.sep || 0) > 0.25 || r.unrest > 65));
  if (sepReg.length && !G.some(g => g.active && g.kind === 'separatist')) want.push(['separatist', 0.012 + st.separatism * 0.0004]);
  if (s.regions.some(r => r.minority && !r.cap && r.unrest > 55) && (s.rights?.abuse || 0) > 40) want.push(['ethnic', 0.01]);
  if (o.base > 55 && st.protest > 40 && !G.some(g => g.active && g.kind === 'progov')) want.push(['progov', 0.012]);
  if (o.crime.gang > 55 && !G.some(g => g.active && g.kind === 'gang')) want.push(['gang', 0.015]);
  if ((s.nation.ideology?.axes?.relig ?? 0) < -25 && st.stability < 55 && !G.some(g => g.active && g.kind === 'religious')) want.push(['religious', 0.006]);
  if (st.control < 28 && !G.some(g => g.active && g.kind === 'warlord')) want.push(['warlord', 0.02]);
  for (const [k, p] of want) if (chance(p)) {
    const g = spawnArmed(s, k, k === 'separatist' ? pick(sepReg) : null);
    ctx.news(`${KINDS[k][0]} surge: "${g.name}".`, 'bad');
    note(s, `Surgiu o grupo armado "${g.name}" (${KINDS[k][0].toLowerCase()}).`);
    const arc = ({ separatist: 'ar_sep_1', ethnic: 'ar_eth_1', progov: 'ar_pro_1', gang: 'ar_gang_1', religious: 'ar_rel_1', warlord: 'ar_war_1' })[k];
    if (arc && s.issues && !s.issues.scheduled.some(x => x.id === arc)) s.issues.scheduled.push({ id: arc, day: day(s) + 5 + Math.floor(rand(0, 10)) });
  }
  for (const g of G) {
    if (!g.active) continue;
    const grow = (g.kind === 'progov' ? o.base * 0.004 : g.kind === 'gang' ? o.crime.gang * 0.004 : g.kind === 'separatist' ? (100 - st.legitimacy) * 0.003 : (s.rights?.abuse || 0) * 0.003) - st.control * 0.004 - (st.troops > 0 ? 0.05 : 0) + (g.funded ? 0.3 : 0);
    g.power = clamp(g.power + grow, 0, 100); g.size = Math.round(g.size * (1 + grow / 100));
    if (g.power < 2) { g.active = false; note(s, `"${g.name}" se dissolveu.`); continue; }
    const pw = g.power / 100;
    if (g.kind === 'progov') { add(s, 'protest', -0.04 * g.power / 30); add(s, 'civil', -0.03 * g.power / 30); grp(s, 'opposition', -0.08); s.rights.abuse = clamp((s.rights.abuse || 0) + 0.03 * g.power / 30, 0, 100); }
    else { add(s, 'stability', -0.05 * g.power / 30); add(s, 'crime', 0.04 * g.power / 30); add(s, 'control', -0.04 * g.power / 30); }
    const r = s.regions.find(x => x.id === g.region);
    if (r && g.kind !== 'progov') { r.unrest = clamp(r.unrest + pw * 0.4, 0, 100); if (g.kind === 'separatist') r.sep = (r.sep || 0) + 0.0004 * g.power; }
  }
}

// Ações sobre grupos armados (cartas e painel): negotiate | amnesty | crush | coopt | integrate | disarm | fund | ignore
export function armedAct(s, data, act, ctx) {
  const G = (s.armed || []).filter(g => g.active); if (!G.length) return 'Não há grupo armado ativo.';
  const g = (act.kind ? G.filter(x => x.kind === act.kind) : G).sort((a, b) => b.power - a.power)[0] || G[0];
  const R = s.rights;
  switch (act.op) {
    case 'negotiate': g.power = Math.max(0, g.power - rand(6, 14)); add(s, 'legitimacy', -1); return `Negociação com "${g.name}": o poder do grupo recua.`;
    case 'amnesty': g.power = Math.max(0, g.power - rand(10, 22)); add(s, 'political', 1); add(s, 'legitimacy', -1.5); grp(s, 'military', -3); return `Anistia a "${g.name}": muitos combatentes entregam as armas.`;
    case 'crush': { const loss = rand(15, 35); const win = chance(0.35 + s.st.readiness / 250 + (s.st.troops > 10 ? 0.1 : 0)); if (win) { g.power = Math.max(0, g.power - loss); R.abuse = clamp(R.abuse + 4, 0, 100); add(s, 'control', 2); add(s, 'legitimacy', 1); return `Operação contra "${g.name}": o grupo é duramente atingido.`; } g.power += 4; R.abuse = clamp(R.abuse + 5, 0, 100); add(s, 'stability', -2); return `A operação contra "${g.name}" fracassa e causa mortes de civis.`; }
    case 'coopt': g.kind === 'gang' || g.kind === 'warlord' ? (g.power = Math.max(0, g.power - 12), add(s, 'corruption', 4), add(s, 'crime', -1)) : (g.power = Math.max(0, g.power - 10)); s.econ.treasury -= 0.15; return `"${g.name}" é cooptado com cargos e dinheiro.`;
    case 'integrate': g.power = Math.max(0, g.power - 25); add(s, 'troops', 0.2); add(s, 'coupRisk', 1.5); grp(s, 'military', -2); return `Combatentes de "${g.name}" são integrados às forças armadas.`;
    case 'disarm': g.power = Math.max(0, g.power - 15); s.econ.treasury -= 0.1; add(s, 'reputation', 1); return `Programa de desarmamento com "${g.name}".`;
    case 'fund': g.funded = true; g.power += 6; s.econ.treasury -= 0.1; return `Você financia "${g.name}" por baixo dos panos.`;
    case 'dissolve': g.power = Math.max(0, g.power - 30); add(s, 'civil', 1.5); grp(s, 'opposition', 2); return `"${g.name}" é desmobilizada por ordem do governo.`;
  }
  return '';
}

// ---------- Crimes de guerra e intervenção ----------
export function addWarCrime(s, n = 1, why = '') {
  const R = s.rights; if (!R) return;
  R.warCrimes = (R.warCrimes || 0) + n; R.heat = (R.heat || 0) + n * 0.8;
  if (why) { R.events?.unshift({ day: day(s), text: why }); }
}
function weeklyWarCrimes(s, data, ctx) {
  const R = s.rights; if (!R) return;
  const p = (s.peace ||= { troops: 0, level: 0, since: null, warned: 0 });
  const wc = R.warCrimes || 0;
  R.warCrimes = Math.max(0, wc - 0.03);
  const lvl = wc >= 24 ? 3 : wc >= 14 ? 2 : wc >= 6 ? 1 : 0;
  const d = day(s);
  if (lvl > p.level && d - (p.cd || 0) > 40) {
    p.level = lvl; p.cd = d;
    const msg = [null, 'Vizinhos e a ONU emitem advertência formal sobre crimes de guerra.', 'O Conselho de Segurança ameaça enviar uma missão de paz e pede ao Tribunal Penal Internacional que investigue.', 'A ONU aprova o envio de tropas de paz e vizinhos preparam um mandado para prender seus comandantes.'][lvl];
    ctx.news(msg, 'bad'); note(s, msg);
    add(s, 'reputation', -lvl * 2);
    for (const id of s.world._nb || []) if (s.partners[id]) s.partners[id].rel -= lvl * 3;
    const card = ['', 'ic_warn_1', 'ic_warn_2', 'ic_peace_1'][lvl];
    if (card && !s.issues.scheduled.some(x => x.id === card)) s.issues.scheduled.push({ id: card, day: d + 2 });
  }
  if (p.level < 1) return;
  if (p.level >= 2 && p.troops > 0) { add(s, 'control', -0.12); add(s, 'stability', -0.04); for (const r of s.regions) if (!r.cap) r.unrest = clamp(r.unrest - 0.1, 0, 100); }
  if (lvl === 0 && wc < 2) { p.level = 0; p.troops = 0; }
}
export function peaceAct(s, data, act) {
  const p = (s.peace ||= { troops: 0, level: 0 });
  switch (act.op) {
    case 'accept': p.troops = 15; add(s, 'reputation', 4); add(s, 'legitimacy', -3); s.rights.warCrimes = Math.max(0, (s.rights.warCrimes || 0) * 0.5); s.rights.heat = Math.max(0, (s.rights.heat || 0) - 3); return 'Tropas de paz da ONU entram no país.';
    case 'refuse': add(s, 'reputation', -3); for (const id of s.world._nb || []) if (s.partners[id]) s.partners[id].rel -= 4; return 'Você recusa a missão e desafia a ONU.';
    case 'trial': s.rights.warCrimes = Math.max(0, (s.rights.warCrimes || 0) * 0.4); add(s, 'reputation', 5); grp(s, 'military', -6); return 'Oficiais acusados são julgados internamente.';
    case 'hide': s.rights.warCrimes += 3; return 'O governo esconde os fatos.';
  }
  return '';
}

// ---------- Ações do painel ----------
export function orderPanelAct(s, data, op, arg) {
  const o = ensureOrd(s), d = day(s), cd = k => Math.max(0, (o.cd[k] || 0) - d);
  const need = (k, days) => cd(k) ? `Aguarde ${Math.ceil(cd(k) / 7)} semana(s).` : (o.cd[k] = d + days, null);
  let w;
  switch (op) {
    case 'policeReform': if ((w = need('pol', 60))) return { ok: false, msg: w }; o.policeShift = 0; o.police = clamp(o.police - 12, 0, 100); s.econ.treasury -= 0.2; add(s, 'corruption', -1.5); return { ok: true, log: true, msg: 'Reforma policial: mais controle civil, menos autonomia.' };
    case 'policeFree': if ((w = need('pol', 60))) return { ok: false, msg: w }; o.police = clamp(o.police + 12, 0, 100); add(s, 'crime', -1.5); s.rights.abuse = clamp((s.rights.abuse || 0) + 3, 0, 100); return { ok: true, log: true, msg: 'A polícia ganha liberdade de ação: o crime cai, as violações sobem.' };
    case 'border': o.border = arg; return { ok: true, log: true, msg: `Política de fronteira: ${({ lax: 'frouxa', normal: 'normal', tight: 'reforçada', lethal: 'ordem de atirar' })[arg]}.` };
    case 'baseFund': if ((w = need('base', 45))) return { ok: false, msg: w }; s.econ.treasury -= 0.3; o.base = clamp(o.base + 8, 0, 100); s.prop = s.prop || {}; add(s, 'corruption', 0.8); return { ok: true, log: true, msg: 'Você distribui favores à base aliada (cargos, subsídios e eventos).' };
    case 'baseMilitia': if ((w = need('base', 45))) return { ok: false, msg: w }; s.armed ||= []; const g = spawnArmed(s, 'progov'); g.funded = true; g.power += 8; return { ok: true, log: true, msg: `Você arma uma milícia aliada: "${g.name}".` };
    case 'armed': return { ok: true, log: true, msg: armedAct(s, data, { op: arg.op, kind: arg.kind }, {}) };
  }
  return { ok: false, msg: '' };
}
