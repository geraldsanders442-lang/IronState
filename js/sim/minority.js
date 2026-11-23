// Povos e minorias: cada país tem grupos étnicos, religiosos ou de imigrantes (data/minorities.json). Quando a polícia tem autonomia demais,
// ou quando o governo escolhe, esses grupos sofrem batidas, pogroms, expulsão e até genocídio. Isso dá estabilidade a curto prazo
// (a maioria aprova, o controle sobe) e turbulência a longo (protestos, milícias, êxodo, sanções, guerra de países simpatizantes, TPI).
// O jogador também pode se identificar com uma minoria e voltar-se contra a maioria (ex.: expulsar os Boers na África do Sul, ou o oposto).
import { clamp, chance, rand, pick, random } from './util.js';
import { PLY, aiPower, shiftRelAI } from './world.js';
import { aiNeighborsOf, startAiWar } from './newstates.js';
import { entityGroups, slug } from './peoples.js';
import { famOf, nationalismOf } from './geopol.js';
import { ensureOrd, spawnArmedGroup } from './order.js';
import { ensureRights, liberty } from './rights.js';

const day = s => Math.floor(s.time.min / 1440);
const add = (s, k, v) => { s.st[k] = clamp((s.st[k] ?? 0) + v, 0, 100); };
const grp = (s, g, v) => { s.groups[g] = clamp((s.groups[g] ?? 50) + v, 0, 100); };
const nm = (s, data, id) => data.reg?.[id]?.name || s.world?.ents?.[id]?.name || id;
const fmt = n => Math.round(n).toLocaleString('pt-BR');

export const STANCES = {
  neutral: { name: 'Sem política', short: 'Neutro', desc: 'O Estado não faz nada: a polícia e a sociedade agem como agem.', target: null },
  protect: { name: 'Proteger', short: 'Proteção', desc: 'Leis antidiscriminação, polícia sob controle civil e cotas. A tensão cai, a maioria pode reclamar.', target: 0 },
  assimilate: { name: 'Assimilar à força', short: 'Assimilação', desc: 'Proíbe a língua, o culto e os costumes do grupo. Barato, mas gera ressentimento.', target: 28 },
  segregate: { name: 'Segregar', short: 'Segregação', desc: 'Bairros, escolas e empregos separados por lei. Violações graves e fuga.', target: 50 },
  expel: { name: 'Expulsar', short: 'Expulsão', desc: 'Deporta e empurra o grupo para fora do país, confiscando bens. Crise de refugiados, sanções e risco de guerra.', target: 82 },
  exterminate: { name: 'Exterminar (genocídio)', short: 'Genocídio', desc: 'Massacres sistemáticos. Crime internacional máximo: TPI, sanções, intervenção armada e a prisão do líder.', target: 100 },
};
// Preconceito de partida da sociedade contra cada tipo de grupo (0 a 1) e peso econômico relativo.
const KIND = {
  majority: { prej: 0, econ: 1, label: 'grupo majoritário' }, roma: { prej: 0.8, econ: 0.3, label: 'minoria' }, immigrant: { prej: 0.6, econ: 1.1, label: 'imigrantes' },
  african: { prej: 0.55, econ: 0.8, label: 'minoria' }, religious: { prej: 0.55, econ: 0.9, label: 'minoria religiosa' }, indigenous: { prej: 0.5, econ: 0.4, label: 'povo indígena' },
  ethnic: { prej: 0.45, econ: 1, label: 'minoria étnica' }, settler: { prej: 0.3, econ: 3, label: 'minoria privilegiada' },
};

// ---------- Dados do país ----------
function groupsFor(s, data) { return entityGroups(s, data, PLY).map(g => ({ name: g.name, noun: g.noun, share: g.share, kind: g.kind, kin: g.kin, key: g.key })); }

export function ensureMin(s, data) {
  if (s.min) return s.min;
  const gs = groupsFor(s, data), people = s.econ.pop * 1e6;
  const fav = gs.find(g => g.kind === 'majority') || gs[0];
  s.min = {
    favored: fav ? slug(fav.name) : null, outrage: 0, killed: 0, expelled: 0, fled: 0, mods: {}, log: [], cd: {}, wars: {}, genocide: false,
    groups: gs.map(g => ({ id: slug(g.name), name: g.name, noun: g.noun, kind: g.kind, kin: (g.kin || []).filter(k => data.reg?.[k]), share: g.share, share0: g.share, pop: people * g.share / 100, pop0: people * g.share / 100,
      tension: g.kind === 'majority' ? 5 : clamp(12 + (KIND[g.kind]?.prej || 0.4) * 16 + rand(-4, 8), 5, 45), pers: 0, prot: 20 + (s.policies?.integration === 'integration' ? 10 : 0), power: clamp(g.share * 0.9 + (g.kind === 'settler' ? 28 : 0) + rand(0, 10), 3, 85),
      stance: 'neutral', dead: 0, fled: 0, expelled: 0, armed: null })),
  };
  return s.min;
}
export const favoredGroup = s => s.min?.groups.find(g => g.id === s.min.favored);
const note = (s, text, kind = 'info') => { const m = s.min; m.log.unshift({ day: day(s), text, kind }); if (m.log.length > 50) m.log.length = 50; };
const share = (s, g) => g.pop / Math.max(1, s.econ.pop * 1e6) * 100;

// Preconceito efetivo que a sociedade (e a polícia) tem contra o grupo, dada a ideologia do regime.
export function prejudice(s, g) {
  const fav = favoredGroup(s); if (!fav || g.id === fav.id) return 0;
  const ax = s.nation.ideology?.axes || {};
  const hard = clamp(0.75 + ((ax.nation || 0) + (ax.trad || 0) * 0.5 + (ax.auth || 0) * 0.3) / 220, 0.25, 1.5);
  const base = (KIND[g.kind]?.prej ?? 0.45) * (fav.kind === 'majority' ? 1 : 0.6);
  // Quando o líder se identifica com uma minoria, a antiga maioria vira alvo de ressentimento histórico.
  const rev = fav.kind !== 'majority' && g.kind === 'majority' ? 0.55 : 0;
  return clamp((base + rev) * hard, 0, 1.4);
}

// ---------- Simulação semanal ----------
export function weeklyMinorities(s, data, ctx) {
  if (s.flags.micronation || s.ascent || s.spectator) return;
  const m = ensureMin(s, data), o = ensureOrd(s), R = ensureRights(s, data), d = day(s), st = s.st;
  const fav = favoredGroup(s), people = s.econ.pop * 1e6;
  const polPress = clamp((o.police - 48) / 52, 0, 1);               // polícia autônoma demais
  const eff = clamp(st.control / 100 * 0.8 + st.efficiency / 300 + (s.groups.military - 40) / 300, 0.25, 1.1);
  const mods = {}; const addM = (k, v) => { mods[k] = (mods[k] || 0) + v; };
  let persW = 0, tensW = 0, totDead = 0, totExp = 0, worstPers = 0;
  for (const g of m.groups) {
    if (g.id === m.favored || g.pop < 1) { g.pers = 0; if (g.pop < 1 && g.stance !== 'neutral') g.stance = 'neutral'; continue; }
    g.share = share(s, g);
    const prej = prejudice(s, g), st0 = STANCES[g.stance];
    // Meta de perseguição: política explícita ou a polícia agindo por conta própria.
    const free = polPress * prej * 78 * (1 - g.prot / 160);
    const target = st0.target == null ? free : g.stance === 'protect' ? Math.max(0, free * 0.2 - g.prot * 0.1) : Math.max(st0.target * (0.5 + eff * 0.5), free);
    const rate = g.stance === 'neutral' ? 0.045 : 0.1;
    g.pers = clamp(g.pers + (target - g.pers) * rate, 0, 100);
    g.prot = clamp(g.prot + (g.stance === 'protect' ? 1.1 : g.pers > 40 ? -0.5 : 0.04), 0, 100);
    // Tensão do grupo: reage à perseguição (com atraso), à pobreza e à desigualdade.
    const tT = clamp(g.pers * 0.95 + (st.inequality - 45) * 0.15 + (st.poverty - 20) * 0.1 - g.prot * 0.15 + (g.dead ? 20 : 0), 0, 100);
    g.tension = clamp(g.tension + (tT - g.tension) * 0.05, 0, 100);
    const w = g.share / 100; persW += w * g.pers / 100; tensW += w * g.tension / 100; worstPers = Math.max(worstPers, g.pers);
    // Efeitos da política escolhida sobre pessoas.
    const kdef = KIND[g.kind] || KIND.ethnic;
    if (g.stance === 'assimilate' && g.pop > 1000) { const mv = g.pop * 0.0016 * eff; g.pop -= mv; addToFav(m, mv); }
    if (g.pers >= 55 && g.stance !== 'expel' && g.stance !== 'exterminate') { // fuga espontânea
      const fl = Math.min(g.pop, g.pop * (g.pers - 50) / 50 * 0.0035 * (s.policies.borders === 'closed' ? 0.25 : 1));
      if (fl >= 1) { g.pop -= fl; g.fled += fl; m.fled += fl; totExp += fl; }
    }
    if (g.stance === 'expel') {
      const rm = Math.min(g.pop, g.pop * 0.012 * eff * (w > 0.4 ? 0.35 : 1) * rand(0.7, 1.3) + 10);
      g.pop -= rm; g.expelled += rm; m.expelled += rm; totExp += rm;
      const loot = rm / Math.max(1, people) * s.econ.gdp * kdef.econ * 0.6; s.econ.treasury += loot * 0.4; st.corruption = clamp(st.corruption + loot / Math.max(1, s.econ.gdp) * 4, 0, 100);
      st.inequality = clamp(st.inequality + rm / Math.max(1, people) * 3, 0, 100);
      s.econ.gdp *= 1 - rm / Math.max(1, people) * kdef.econ * 0.55;
      s.econ.pop = Math.max(0.0001, s.econ.pop - rm / 1e6);
    }
    if (g.stance === 'exterminate') {
      const k = Math.min(g.pop, g.pop * 0.009 * eff * (w > 0.4 ? 0.3 : 1) * rand(0.6, 1.4) + 5);
      g.pop -= k; g.dead += k; m.killed += k; totDead += k; m.genocide = true;
      const flee = Math.min(g.pop, g.pop * 0.01 * rand(0.5, 1.4)); g.pop -= flee; g.fled += flee; m.fled += flee; totExp += flee;
      s.econ.gdp *= 1 - (k + flee) / Math.max(1, people) * kdef.econ * 0.5;
      s.econ.pop = Math.max(0.0001, s.econ.pop - (k + flee) / 1e6);
      if (R) R.abuse = clamp(R.abuse + 0.9, 0, 100);
    }
    if (g.stance === 'seize') { /* ação pontual, ver minAct */ }
    // Resistência armada.
    if (g.tension > 68 && g.power > 8 && !g.armed && chance(0.02 + (g.tension - 68) / 800)) {
      const arm = spawnArmedGroup(s, 'ethnic', s.regions.find(r => r.minority && !r.cap)); arm.name = `Milícia ${g.noun}`; arm.power = clamp(g.power * 0.6, 6, 55); arm.size = Math.round(g.pop * 0.012);
      g.armed = arm.id; note(s, `Os ${g.noun} formam uma milícia: "${arm.name}".`, 'bad'); ctx.news(`Os ${g.noun} pegam em armas: surge a "${arm.name}".`, 'bad');
      if (!s.issues.scheduled.some(x => x.id === 'ar_eth_1')) s.issues.scheduled.push({ id: 'ar_eth_1', day: d + 4 });
    }
    // Notícias e questões por patamar.
    if (g.pers >= 25 && (m.cd['inc' + g.id] ?? -999) + 28 < d && chance(0.35)) { m.cd['inc' + g.id] = d; incident(s, data, ctx, g); }
    if (g.pers >= 35 && polPress > 0.2 && (m.cd['card' + g.id] ?? -999) + 90 < d && chance(0.5) && !s.issues.pending.some(p => String(p.id).startsWith('min_'))) { m.cd['card' + g.id] = d; ctx.card(cardPolice(s, data, g)); }
    if (g.pers >= 62 && g.stance !== 'expel' && g.stance !== 'exterminate' && (m.cd['exp' + g.id] ?? -999) + 150 < d && chance(0.25) && !s.issues.pending.some(p => String(p.id).startsWith('min_'))) { m.cd['exp' + g.id] = d; ctx.card(cardExpel(s, data, g)); }
    // Reação dos países simpatizantes.
    reactKin(s, data, ctx, g, m, d);
    if (g.pop < g.pop0 * 0.03 && g.pop0 > 500 && !g.gone) { g.gone = true; g.stance = 'neutral'; note(s, `Os ${g.noun} praticamente deixaram de existir no país.`, 'bad'); ctx.news(`Os ${g.noun} foram quase eliminados do país: ${fmt(g.dead)} mortos e ${fmt(g.fled + g.expelled)} deslocados.`, 'bad'); }
  }
  // Consequências agregadas.
  addM('stability', persW * 5.5 + (worstPers > 60 ? 0.5 : 0) - Math.max(0, tensW - 0.05) * 11);   // a maioria aprova; a tensão cobra depois
  addM('control', persW * 4 - tensW * 3);
  addM('g_military', persW * 6); addM('g_rural', persW * 4); addM('g_bureaucracy', persW * 3);
  addM('protest', tensW * 14); addM('crime', tensW * 6 + persW * 2); addM('civil', -persW * 8); addM('political', -persW * 3);
  addM('reputation', -persW * 7 - (m.genocide ? 6 : 0)); addM('growth', -tensW * 1.8 - persW * 0.8);
  addM('emigration', persW * 0.4); addM('coupRisk', tensW * 3.5 + (m.genocide ? 4 : 0)); addM('revoRisk', tensW * 3);
  m.mods = mods;
  grp(s, 'opposition', persW * 0.4);
  // Efeito direto no Direito Humanitário.
  if (R) { R.abuse = clamp(R.abuse + persW * 0.08 + (totDead > 0 ? 0.5 : 0) + clamp(totExp / Math.max(1, people) * 4000 + totDead / Math.max(1, people) * 12000, 0, 8), 0, 100); R.heat = Math.max(0, R.heat + (totDead > 0 ? 0.55 : totExp > 0 ? 0.12 : persW > 0.04 ? 0.03 : 0)); }
  m.outrage = clamp(m.outrage + persW * 3 + (totDead > 0 ? 3 : 0) + (totExp > 0 ? 0.8 : 0) - 0.4, 0, 100);
  // Polícia e Forças Armadas: motins e brigas internas.
  const guard = m.groups.some(g => g.stance === 'protect' && g.id !== m.favored);
  if (o.police > 62 && guard && (m.cd.mutiny ?? -999) + 120 < d && chance(0.02 + (o.police - 62) / 1200)) { m.cd.mutiny = d; mutiny(s, data, ctx, 'police'); }
  else if (m.genocide && s.groups.military < 52 && (m.cd.mutiny ?? -999) + 120 < d && chance(0.03)) { m.cd.mutiny = d; mutiny(s, data, ctx, 'army'); }
  // Prisão do líder: o genocídio acelera o mandado do TPI e a intervenção.
  if (m.genocide && R && R.icc.state === 'none' && R.heat >= 3) R.heat += 1.5;
}
function addToFav(m, n) { const f = m.groups.find(g => g.id === m.favored); if (f) f.pop += n; }

function incident(s, data, ctx, g) {
  const L = g.pers >= 70 ? 3 : g.pers >= 50 ? 2 : 1;
  const T = [
    [`Batidas policiais em bairros de ${g.noun}: prisões em massa e denúncias de abuso.`, `A polícia é acusada de perfilamento racial contra ${g.noun}.`, `Líder ${g.noun} é morto sob custódia policial; protestos explodem.`],
    [`Gangues atacam comunidades de ${g.noun} com a omissão da polícia.`, `Casas e templos de ${g.noun} são incendiados em ataques coordenados.`, `Linchamentos de ${g.noun} se espalham; a polícia assiste.`],
    [`Pogrom contra ${g.noun}: bairros inteiros são destruídos e dezenas morrem.`, `Milhares de ${g.noun} fogem das cidades após uma noite de massacres.`, `Execuções em massa de ${g.noun} são denunciadas por testemunhas e satélites.`],
  ];
  const txt = pick(T[L - 1]); note(s, txt, 'bad'); ctx.news(txt, 'bad');
  if (L >= 2) { const dead = Math.round(g.pop * 0.0004 * L * rand(0.5, 1.5)); if (dead > 0) { g.pop -= dead; g.dead += dead; s.min.killed += dead; s.econ.pop = Math.max(0.0001, s.econ.pop - dead / 1e6); } }
  for (const r of s.regions) if (r.minority && !r.cap) r.unrest = clamp(r.unrest + 2 * L, 0, 100);
}

function reactKin(s, data, ctx, g, m, d) {
  if (!g.kin?.length || g.pers < 30) return;
  for (const id of g.kin) {
    const c = s.world.c[id], p = s.partners[id]; if (!c || !p) continue;
    if (g.pers > 35) p.rel = clamp(p.rel - g.pers / 900 - (g.dead ? 0.15 : 0), -100, 100);
    if (m.cd['warn' + id] === undefined || m.cd['warn' + id] + 120 < d) {
      if (g.pers >= 50 && chance(0.1) && !s.issues.pending.some(x => String(x.id).startsWith('min_'))) { m.cd['warn' + id] = d; ctx.card(cardKin(s, data, g, id)); }
    }
    // Guerra de países simpatizantes: só com violência real (mortes ou expulsões em massa) e poder para isso.
    const mine = Math.max(1, s.d?.power || 40), ratio = clamp((c.gdp ** 0.5) / Math.max(5, (s.econ.gdp ** 0.5)), 0.2, 3);
    const viol = (g.dead / Math.max(1, g.pop0)) * 6 + (g.expelled / Math.max(1, g.pop0)) * 2.2;
    const pw = (g.stance === 'exterminate' || g.stance === 'expel') && viol > 0.12 ? 0.004 * ratio * (g.stance === 'exterminate' ? 3 : 1) * (1 + viol) : 0;
    const atWar = s.wars.some(w => w.active && w.enemies?.includes(id));
    if (pw && !atWar && (m.cd['war' + id] ?? -999) + 240 < d && chance(Math.min(0.05, pw)) && ctx.declareWarOnPlayer) {
      m.cd['war' + id] = d; const n = nm(s, data, id);
      note(s, `${n} declara guerra em defesa dos ${g.noun}.`, 'bad'); ctx.news(`${n} declara guerra a ${s.nation.shortName} em defesa dos ${g.noun} perseguidos.`, 'war');
      ctx.declareWarOnPlayer(id, null);
      if (g.dead > 0 && chance(0.5)) { // coalizão humanitária
        const lib = Object.keys(s.partners).filter(x => s.world.c[x] && s.world.c[x].gdp > 700 && x !== id && !s.wars.some(w => w.active && w.enemies?.includes(x)) && (s.partners[x].rel < 25)).slice(0, 2);
        for (const x of lib) if (chance(0.5)) { ctx.news(`${nm(s, data, x)} se une à intervenção contra ${s.nation.shortName}.`, 'war'); ctx.declareWarOnPlayer(x, null); }
      }
    }
  }
}
function mutiny(s, data, ctx, who) {
  const o = ensureOrd(s), m = s.min;
  if (who === 'police') {
    o.police = clamp(o.police - 8, 0, 100); add(s, 'coupRisk', 8); add(s, 'stability', -3); add(s, 'crime', 3);
    note(s, 'Motim policial: esquadrões se recusam a obedecer ao governo.', 'bad'); ctx.news('Policiais se amotinam contra a política de proteção às minorias; tiroteio entre unidades.', 'bad');
  } else {
    add(s, 'coupRisk', 12); add(s, 'stability', -5); grp(s, 'military', -6);
    note(s, 'Oficiais recusam ordens de massacre; brigas internas nas Forças Armadas.', 'bad'); ctx.news('Oficiais se recusam a cumprir ordens contra civis; há confrontos entre unidades do exército.', 'bad');
  }
  ctx.card({ id: 'min_mutiny_' + day(s), dyn: true, cat: 'Segurança', title: who === 'police' ? 'Motim na polícia' : 'Racha nas Forças Armadas',
    desc: who === 'police' ? 'Parte da polícia se revolta contra a proteção às minorias e ocupa delegacias. Há troca de tiros entre unidades.' : 'Generais e coronéis se recusam a executar ordens contra civis. Há tiroteios entre unidades e rumores de golpe.', context: 'A lealdade das forças de segurança está em jogo.', deadline: 7, default: 1,
    options: [
      { text: 'Esmagar os amotinados e purgar o comando.', hint: 'Ordem restaurada; ressentimento e abusos aumentam.', now: { coupRisk: -6, control: 3, civil: -2 }, groups: { military: -3 }, act: { type: 'extra', op: 'minAct', gid: '', choice: 'purge' } },
      { text: 'Negociar: aumentos e anistia.', hint: 'Custa dinheiro e autoridade; acalma a tropa.', now: { treasury: -0.4, legitimacy: -1.5, coupRisk: -3 }, groups: { military: 3 }, act: { type: 'extra', op: 'minAct', gid: '', choice: 'appease' } },
      { text: 'Recuar na política e dar autonomia à polícia.', hint: 'Cede ao aparato de segurança; a polícia ganha autonomia e o risco para as minorias sobe.', now: { coupRisk: -8 }, groups: { military: 4 }, act: { type: 'extra', op: 'minAct', gid: '', choice: 'concede' } },
    ] });
}

// ---------- Questões ----------
function cardPolice(s, data, g) {
  const o = ensureOrd(s);
  return { id: 'min_police_' + g.id + '_' + day(s), dyn: true, cat: 'Direitos', title: `Polícia ataca ${g.noun}`,
    desc: `Com autonomia demais, a polícia passou a perseguir ${g.noun}: batidas em bairros inteiros, prisões sem acusação e mortes sob custódia. Vídeos circulam nas redes e as comunidades ameaçam ir às ruas.`,
    context: `Autonomia da polícia: ${Math.round(o.police)}/100 · ${g.name}: tensão ${Math.round(g.tension)} · perseguição ${Math.round(g.pers)}.`, deadline: 14, default: 3,
    options: [
      { text: 'Investigar e punir os policiais; reformar o controle civil.', hint: 'Reduz a autonomia da polícia e a perseguição; a corporação e a base ficam contra.', now: { legitimacy: 1, civil: 1.5 }, groups: { military: -2, opposition: -2 }, act: { type: 'extra', op: 'minAct', gid: g.id, choice: 'reform' } },
      { text: 'Proteger o grupo por lei (cotas, ouvidoria, tribunais).', hint: 'Política de proteção: tensão cai com o tempo; a maioria nacionalista reclama.', now: { treasury: -0.2, reputation: 1.5 }, groups: { rural: -2 }, act: { type: 'extra', op: 'minAct', gid: g.id, choice: 'protect' } },
      { text: 'Defender a polícia e dizer que foi legítima defesa.', hint: 'A polícia segue livre; a perseguição continua e a imagem do governo cai.', now: { reputation: -2, civil: -2 }, groups: { military: 2 }, act: { type: 'extra', op: 'minAct', gid: g.id, choice: 'defend' } },
      { text: 'Fingir que nada aconteceu.', hint: 'Nada muda; o caso vira escândalo se continuar.', now: { legitimacy: -0.5 }, act: { type: 'extra', op: 'minAct', gid: g.id, choice: 'ignore' } },
    ] };
}
function cardExpel(s, data, g) {
  return { id: 'min_expel_' + g.id + '_' + day(s), dyn: true, cat: 'Direitos', title: `Nacionalistas exigem expulsar os ${g.noun}`,
    desc: `Milícias, parte dos generais e grupos nacionalistas pressionam para "limpar" o país dos ${g.noun}. Querem deportações em massa e o confisco dos bens. Os vizinhos e as potências observam.`,
    context: `${g.name}: ${fmt(g.pop)} pessoas · perseguição ${Math.round(g.pers)}.`, deadline: 21, default: 2,
    options: [
      { text: 'Aprovar a expulsão e confiscar os bens.', hint: 'Estabilidade e caixa curto prazo; êxodo, sanções, TPI e risco de guerra.', now: { control: 3 }, groups: { military: 4, rural: 3 }, act: { type: 'extra', op: 'minAct', gid: g.id, choice: 'expel' } },
      { text: 'Adotar segregação e restrições.', hint: 'Meio-termo duro: menos pessoas fogem do que na expulsão, mas as violações crescem.', now: { civil: -3 }, groups: { military: 2 }, act: { type: 'extra', op: 'minAct', gid: g.id, choice: 'segregate' } },
      { text: 'Recusar e dar proteção ao grupo.', hint: 'Contém a violência; nacionalistas e generais ficam furiosos.', now: { reputation: 2 }, groups: { military: -3, rural: -3 }, act: { type: 'extra', op: 'minAct', gid: g.id, choice: 'protect' } },
    ] };
}
function cardKin(s, data, g, kin) {
  const n = nm(s, data, kin);
  return { id: 'min_kin_' + kin + '_' + day(s), dyn: true, cat: 'Crise internacional', title: `${n} alerta sobre os ${g.noun}`,
    desc: `O governo de ${n} acusa ${s.nation.shortName} de perseguir os ${g.noun} e exige que cesse a violência. O embaixador foi chamado e há ameaças de sanções.`, context: `Perseguição ${Math.round(g.pers)}/100 · relações com ${n}: ${Math.round(s.partners[kin]?.rel ?? 0)}.`, deadline: 10, default: 1,
    options: [
      { text: 'Prometer proteção e abrir inquérito.', hint: 'Suaviza a pressão e reduz a perseguição um pouco.', now: { reputation: 1.5 }, act: { type: 'extra', op: 'minAct', gid: g.id, choice: 'promise', kin } },
      { text: 'Rejeitar as acusações como ingerência.', hint: 'Mantém o rumo; a relação com o país cai.', now: { reputation: -1 }, groups: { military: 1 }, act: { type: 'extra', op: 'minAct', gid: g.id, choice: 'reject', kin } },
      { text: 'Oferecer compensação e acolher um corredor humanitário.', hint: 'Custa dinheiro; melhora a relação e protege parte do grupo.', now: { treasury: -0.3, reputation: 2 }, act: { type: 'extra', op: 'minAct', gid: g.id, choice: 'compensate', kin } },
    ] };
}
// Respostas às questões: act = { type:'extra', op:'minAct', gid, choice }.
export function minCardAct(s, data, act, ctx) {
  const m = ensureMin(s, data), g = m.groups.find(x => x.id === act.gid), o = ensureOrd(s);
  switch (act.choice) {
    case 'reform': if (g) { g.pers = Math.max(0, g.pers - 22); g.tension = Math.max(0, g.tension - 12); } o.police = clamp(o.police - 14, 0, 100); return 'A polícia passa a ter controle civil; policiais foram afastados.';
    case 'protect': if (g) { g.stance = 'protect'; g.pers = Math.max(0, g.pers - 12); } return g ? `O governo adota proteção legal aos ${g.noun}.` : '';
    case 'defend': if (g) { g.pers = Math.min(100, g.pers + 6); g.tension = Math.min(100, g.tension + 6); } o.police = clamp(o.police + 5, 0, 100); return 'O governo fecha com a polícia.';
    case 'ignore': return '';
    case 'expel': if (g) { g.stance = 'expel'; } return g ? `Expulsão dos ${g.noun} autorizada.` : '';
    case 'segregate': if (g) { g.stance = 'segregate'; } return g ? `Segregação dos ${g.noun} decretada.` : '';
    case 'promise': if (g) { g.pers = Math.max(0, g.pers - 8); } if (act.kin && s.partners[act.kin]) s.partners[act.kin].rel = clamp(s.partners[act.kin].rel + 4, -100, 100); return 'O inquérito é aberto sob pressão externa.';
    case 'reject': if (act.kin && s.partners[act.kin]) s.partners[act.kin].rel = clamp(s.partners[act.kin].rel - 8, -100, 100); return '';
    case 'compensate': if (g) { g.pers = Math.max(0, g.pers - 10); g.prot = Math.min(100, g.prot + 8); g.fled = g.fled; } if (act.kin && s.partners[act.kin]) s.partners[act.kin].rel = clamp(s.partners[act.kin].rel + 12, -100, 100); return 'Compensações pagas; corredor humanitário aberto.';
    case 'purge': o.police = clamp(o.police - 6, 0, 100); s.rights && (s.rights.abuse = clamp(s.rights.abuse + 6, 0, 100)); return 'Amotinados presos e comandantes substituídos.';
    case 'appease': return 'Aumentos e anistia acalmam os quartéis.';
    case 'concede': o.police = clamp(o.police + 10, 0, 100); return 'A polícia recupera autonomia.';
  }
  return '';
}

// ---------- Ações do jogador (página) ----------
export function minAct(s, data, op, arg) {
  const m = ensureMin(s, data), d = day(s);
  const [gid, val] = String(arg).split('|'), g = m.groups.find(x => x.id === gid);
  switch (op) {
    case 'stance': {
      if (!g) return { ok: false, msg: 'Grupo inválido.' };
      if (g.id === m.favored) return { ok: false, msg: 'Você se identifica com este grupo: mude a identificação primeiro.' };
      if (!STANCES[val]) return { ok: false, msg: 'Política inválida.' };
      if (g.stance === val) return { ok: false, msg: 'Já é a política atual.' };
      if ((val === 'expel' || val === 'exterminate') && s.st.control < 25) return { ok: false, msg: 'O Estado não tem controle para executar isso (controle abaixo de 25).' };
      g.stance = val;
      if (val === 'exterminate') { ensureRights(s, data).heat += 2; }
      const msg = `${STANCES[val].name} para os ${g.noun}.`; note(s, msg, val === 'protect' ? 'good' : 'bad'); return { ok: true, msg, log: true };
    }
    case 'align': {
      if (!g) return { ok: false, msg: 'Grupo inválido.' };
      if (m.favored === g.id) return { ok: false, msg: 'Você já se identifica com este grupo.' };
      if ((m.cd.align ?? -999) + 180 > d) return { ok: false, msg: 'Aguarde para mudar de identificação de novo.' };
      m.cd.align = d; const old = favoredGroup(s); m.favored = g.id; g.stance = 'neutral'; g.pers = 0; g.tension = Math.max(0, g.tension - 15); g.prot = clamp(g.prot + 25, 0, 100);
      if (old) { old.tension = clamp(old.tension + 18, 0, 100); }
      s.nation.ethnicLeader = g.id; grp(s, 'military', -2);
      const msg = `O governante passa a se identificar com os ${g.noun}${old && old.kind === 'majority' ? '; a antiga maioria sente o golpe' : ''}.`; note(s, msg, 'info'); return { ok: true, msg, log: true };
    }
    case 'seize': {
      if (!g) return { ok: false, msg: 'Grupo inválido.' };
      if (g.id === m.favored) return { ok: false, msg: 'Não se confisca o grupo com o qual você se identifica.' };
      if (g.seized) return { ok: false, msg: 'Os bens já foram confiscados.' };
      const kd = KIND[g.kind] || KIND.ethnic, gain = s.econ.gdp * (g.pop / Math.max(1, s.econ.pop * 1e6)) * kd.econ * 0.35;
      g.seized = true; s.econ.treasury += gain; g.pers = clamp(g.pers + 18, 0, 100); g.tension = clamp(g.tension + 15, 0, 100); s.econ.gdp *= 1 - 0.015 * kd.econ * (g.pop / Math.max(1, s.econ.pop * 1e6));
      add(s, 'inequality', 2); s.st.corruption = clamp(s.st.corruption + 1.5, 0, 100); ensureRights(s, data).abuse = clamp(ensureRights(s, data).abuse + 8, 0, 100); grp(s, 'rural', 3);
      for (const id of g.kin) if (s.partners[id]) s.partners[id].rel = clamp(s.partners[id].rel - 10, -100, 100);
      const msg = `Bens e terras dos ${g.noun} confiscados (+${gain.toFixed(2)} bi); produção cai e parceiros protestam.`; note(s, msg, 'bad'); return { ok: true, msg, log: true };
    }
    case 'reformPolice': { const o = ensureOrd(s); o.police = clamp(o.police - 15, 0, 100); m.cd.refp = d; return { ok: true, msg: 'Reforma da polícia: controle civil e corregedoria independente.', log: true }; }
  }
  return { ok: false, msg: 'Ação desconhecida.' };
}

// ---------- Mundo: perseguições em outros países (modo observador e jogo normal) ----------
// Só regimes duros perseguem de verdade; democracias liberais no máximo têm incidentes policiais. Genocídio é raríssimo: exige regime
// ultranacionalista ou de junta/teocracia, pouca liberdade, crise (guerra, caos ou instabilidade) e há no máximo um em curso por vez.
const FAM_HARD = { nationalist: 1.5, junta: 1.35, theocratic: 1.2, monarchist: 0.7, socialist: 0.6, hybrid: 0.55, liberal: 0.04, socdem: 0.04 };
// Controle de genocídios e expulsões (laboratório; 0 = nunca, 1 = normal, 2 = bem mais). Em mundos customizados o padrão é 0,5.
export const genoSlider = s => s.world.lab?.genocide ?? (s.world.cwdef ? 0.5 : 1);
const levelCap = (s, data, id) => {
  const g = genoSlider(s), base = levelCapBase(s, data, id);
  return g <= 0 ? Math.min(base, 2) : g < 0.4 ? Math.min(base, 3) : base;
};
const levelCapBase = (s, data, id) => {
  const fam = famOf(s, data, id), e = s.world.ents?.[id] || data.reg[id], lib = e?.profile?.liberty ?? 50, nat = nationalismOf(s, data, id), c = s.world.c[id];
  const crisis = s.world.wars?.some(w => w.active && [...w.a, ...w.b].includes(id)) || s.world.chaos || (c?.stab ?? 60) < 40;
  if (fam === 'liberal' || fam === 'socdem') return lib < 45 ? 2 : 1;
  if (['nationalist', 'junta', 'theocratic'].includes(fam)) return nat > 75 && lib < 30 && crisis ? 4 : lib < 55 ? 3 : 2;
  return nat > 70 && lib < 30 ? 3 : 2;
};
export function weeklyWorldMinorities(s, data, ctx) {
  const W = s.world; if (!W?.c) return;
  const d = day(s), lab = W.lab?.persecution ?? 1; W.minor ||= {};
  const gs = genoSlider(s), genoNow = () => Object.values(W.minor).filter(p => !p.over && p.level >= 4).length;
  const harshNow = () => Object.values(W.minor).filter(p => !p.over && p.level >= 3).length, harshMax = Math.max(1, Math.round(Object.keys(W.c).length / 60 * Math.max(0.3, gs)));
  // 1) Evolução das perseguições em curso.
  for (const id of Object.keys(W.minor)) {
    const P = W.minor[id], c = W.c[id]; if (!c) { delete W.minor[id]; continue; }
    if (P.over || (d - P.last) < 14) continue; P.last = d;
    const n = nm(s, data, id), cap = levelCap(s, data, id);
    const up = chance(0.07 * lab * (c.stab < 55 ? 1.3 : 0.8)), down = chance(0.16 + (c.stab < 25 ? 0.08 : 0) + (P.level > cap ? 0.5 : 0));
    if (up && P.level < cap) {
      if (P.level + 1 >= 4) { if (genoNow() < Math.max(1, Math.floor(gs)) && d - (W.genoLast ?? -9999) > 1000 / Math.max(0.2, gs) && chance(0.35 * Math.min(1, gs))) { P.level = 4; W.genoLast = d; } }
      else if (P.level + 1 >= 3) { if (harshNow() < harshMax && chance(Math.min(1, 0.5 + gs / 2))) P.level++; }
      else P.level++;
    }
    else if (down && P.level > 0) P.level--;
    if (P.level > cap) P.level = cap;
    const dead = Math.round(c.pop * 1e6 * (P.share / 100) * [0, 0.0004, 0.002, 0.012, 0.05][P.level] * rand(0.6, 1.3));
    const fled = Math.round(c.pop * 1e6 * (P.share / 100) * [0, 0.0006, 0.006, 0.04, 0.1][P.level] * rand(0.6, 1.3));
    P.dead += dead; P.fled += fled; c.pop = Math.max(0.01, c.pop - (dead + fled) / 1e6);
    c.stab = clamp(c.stab + (P.level <= 1 ? 0.3 : -0.5 * P.level), 5, 95);
    if (P.level === 0) { P.over = true; P.end = d; ctx.news?.(`A perseguição aos ${P.noun} em ${n} diminui após pressão interna e internacional.`, 'good'); continue; }
    const txt = [null, `A polícia de ${n} faz batidas violentas em bairros de ${P.noun}.`, `Pogroms contra os ${P.noun} em ${n}: ${fmt(P.dead)} mortos até agora.`, `Expulsões em massa de ${P.noun} em ${n}: ${fmt(P.fled)} refugiados cruzam a fronteira.`, `Genocídio em curso contra os ${P.noun} em ${n}: ${fmt(P.dead)} mortos; organismos internacionais pedem intervenção.`][P.level];
    if (txt && (up || chance(0.3))) ctx.news?.(txt, P.level >= 3 ? 'bad' : 'warn');
    if (fled > 0) for (const nb of aiNeighborsOf(s, data, id).filter(x => x !== PLY).slice(0, 2)) { const nc = W.c[nb]; if (nc) { nc.stab = clamp(nc.stab - fled / 5e6, 5, 95); nc.pop += fled / 3e6; } }
    for (const kin of P.kin) {
      const kc = W.c[kin]; if (!kc || kin === id || kin === PLY) continue;
      if (P.level >= 2) shiftRelAI(s, kin, id, -3 * P.level * lab);
      if (P.level >= 3 && !P.warred && chance(0.04 * lab) && aiPower(kc) > aiPower(c) * 0.5) { P.warred = true; startAiWar(s, data, ctx, kin, id, `${nm(s, data, kin)} intervém em defesa dos ${P.noun} perseguidos em ${n}`); }
    }
    if (P.level >= 3 && chance(0.15)) { const libs = Object.keys(W.c).filter(x => x !== id && !W.c[x].dep && W.c[x].gdp > 1500); if (libs.length) { const a = pick(libs); (W.sanc ||= {})[a + '>' + id] = d; ctx.news?.(`${nm(s, data, a)} impõe sanções a ${n} pela perseguição aos ${P.noun}.`, 'warn'); } }
  }
  // 2) Novas perseguições: poucas, e só onde o regime e o contexto permitem.
  if (d % 7 !== 0 && !s.spectator) return;
  if (!chance((s.spectator ? 0.016 : 0.006) * lab)) return;
  const pool = Object.keys(W.c).filter(id => !W.c[id].dep && id !== PLY && (!W.minor[id] || (W.minor[id].over && d - (W.minor[id].end ?? 0) > 365)));
  const weights = pool.map(id => {
    const e = W.ents?.[id] || data.reg[id], lib = e?.profile?.liberty ?? 50, c = W.c[id], fam = famOf(s, data, id);
    const h = FAM_HARD[fam] ?? 0.5; if (levelCap(s, data, id) < 1) return 0;
    return h * Math.max(0.02, (1 - lib / 100) * 1.1 + (1 - c.stab / 100) * 0.5) * (W.chaos ? 1.25 : 1) * (0.4 + nationalismOf(s, data, id) / 100);
  });
  const tot = weights.reduce((a, b) => a + b, 0); if (tot <= 0) return;
  const id = pool[pickWeightedIdx(weights, tot)]; if (id == null) return;
  const groups = entityGroups(s, data, id).filter((g, i) => i > 0 && g.share >= 0.3 && g.kind !== 'majority');
  if (!groups.length) return;
  // O grupo alvo: os mais hostilizados pela sociedade, ponderando preconceito e tamanho.
  const gw = groups.map(g => (KIND[g.kind]?.prej ?? 0.45) * Math.sqrt(g.share));
  const g = groups[pickWeightedIdx(gw, gw.reduce((a, b) => a + b, 0))], n = nm(s, data, id);
  W.minor[id] = { key: g.key, name: g.name, noun: g.noun, kind: g.kind, share: g.share, kin: g.kin.filter(k => W.c[k] && k !== id), level: 1, dead: 0, fled: 0, since: d, last: d };
  ctx.news?.(`${pick([`A polícia de ${n} é acusada de atacar os ${g.noun}`, `Ondas de violência contra os ${g.noun} em ${n}`, `Governo de ${n} endurece contra os ${g.noun}`])}: ${pick(['organizações de direitos humanos denunciam abusos.', 'prisões e batidas em massa.', 'comunidades temem a escalada.'])}`, 'warn');
}
function pickWeightedIdx(w, tot) { let r = random() * tot; for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; } return w.length - 1; }
