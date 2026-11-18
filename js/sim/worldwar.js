// Mundo em guerra: faíscas entre IAs, escalada por alianças, mediação, choques de commodities,
// refugiados, corrida armamentista e pressão para o jogador escolher um lado.
import { clamp, chance, pick } from './util.js';
import { PLY, entOf, aiPower, relAI, shiftRelAI, playerNeighbors, defenseAllies } from './world.js';
import { startAiWar } from './newstates.js';

const day = s => Math.floor(s.time.min / 1440);
const nm = (s, data, id) => entOf(s, data, id)?.name || id;
const inAnyWar = (W, id) => W.wars.some(w => w.active && [...w.a, ...w.b].includes(id));
const activeAi = W => W.wars.filter(w => w.active && w.ai);

// ---------- Choques de mercado ----------
const SHOCK_BY_REGION = {
  middle_east: [['oil', 12], ['gas', 8]], eastern_europe: [['wheat', 10], ['gas', 10], ['steel', 5]], caucasus: [['gas', 8], ['oil', 5]],
  central_asia: [['gas', 6], ['wheat', 5]], east_asia: [['chips', 20], ['steel', 5]], southeast_asia: [['chips', 8]],
  north_africa: [['oil', 7]], sub_saharan_africa: [['gold', 4]], south_asia: [['wheat', 4]],
};
function warShock(s, data, w, ctx) {
  const M = s.markets; if (!M) return;
  const ids = [...w.a, ...w.b], gdp = ids.reduce((t, i) => t + (s.world.c[i]?.gdp || 0), 0);
  if (gdp < 80) return;
  const scale = clamp(Math.log10(gdp + 1) / 3, 0.5, 1.6);
  const shocks = new Map([['gold', 3]]);
  for (const id of ids) for (const [k, v] of SHOCK_BY_REGION[entOf(s, data, id)?.regions?.[0]] || []) shocks.set(k, Math.max(shocks.get(k) || 0, v));
  const txt = [];
  for (const [k, v] of shocks) { M.prices[k] = clamp((M.prices[k] ?? 100) + v * scale, 35, 300); if (v >= 8) txt.push(k); }
  if (txt.length) ctx.news(`A guerra entre ${nm(s, data, w.a[0])} e ${nm(s, data, w.b[0])} abala os mercados: ${txt.map(k => ({ oil: 'petróleo', gas: 'gás', wheat: 'trigo', steel: 'aço', chips: 'chips', gold: 'ouro' }[k])).join(', ')} em alta.`, 'warn');
}

// ---------- Cartas ----------
function sideCard(s, data, w) {
  const A = w.a[0], B = w.b[0], a = nm(s, data, A), b = nm(s, data, B);
  const one = (side, id, other) => ({ text: `Apoiar ${nm(s, data, id)} com armas e dinheiro.`, hint: `Custa 0,3% do PIB; ${nm(s, data, id)} ganha força na guerra; ${nm(s, data, other)} se ressente.`, act: { type: 'aiWarSupport', war: w.id, side, v: 0.2, cost: 0.003 }, rel: { [id]: 10, [other]: -14 } });
  return { id: `dyn_wwside_${w.id}`, dyn: true, cat: 'Mundo em guerra', crisis: false, deadline: 10, default: 3,
    title: `${a} e ${b} estão em guerra`, desc: `O conflito entre ${a} e ${b} divide as chancelarias. Os dois lados pedem que ${s.nation.shortName} se posicione.`,
    context: `${w.note ? w.note + '. ' : ''}Escolher um lado rende um aliado e um inimigo; a mediação exige prestígio. Ficar neutro não custa nada.`,
    options: [one('A', A, B), one('B', B, A), { text: 'Oferecer-se como mediador.', hint: 'Custa 0,1% do PIB; chance de impor um cessar-fogo conforme seu prestígio e influência.', act: { type: 'mediate', war: w.id } }, { text: 'Manter a neutralidade.', hint: 'Sem custo.' }] };
}
function refugeeCard(s, data, w, loser) {
  const n = nm(s, data, loser);
  return { id: `dyn_wwrefugee_${w.id}_${day(s)}`, dyn: true, cat: 'Mundo em guerra', crisis: false, deadline: 7, default: 1,
    title: `Refugiados da guerra em ${n}`, desc: `Milhares de civis de ${n} chegam à fronteira fugindo dos combates. Prefeitos locais pedem uma política nacional.`,
    context: 'Acolher custa dinheiro e tensão local, mas rende reputação e braços para a economia.',
    options: [
      { text: 'Abrir as fronteiras e montar campos.', hint: 'Custa 0,2% do PIB; população e reputação sobem; estabilidade cai.', act: { type: 'refugees', choice: 'open', from: loser } },
      { text: 'Aceitar uma cota limitada.', hint: 'Custa 0,05% do PIB; efeito moderado.', act: { type: 'refugees', choice: 'quota', from: loser } },
      { text: 'Fechar a fronteira.', hint: 'Sem custo; críticas internacionais.', act: { type: 'refugees', choice: 'close', from: loser } }] };
}

export function worldWarAct(s, data, act, ctx) {
  const g = s.econ.gdp;
  if (act.type === 'refugees') {
    if (act.choice === 'open') { s.econ.treasury -= g * 0.002; s.econ.pop += 0.15; s.st.reputation = clamp(s.st.reputation + 4, 0, 100); s.st.stability = clamp(s.st.stability - 1.5, 0, 100); return 'Campos de refugiados abertos; a fronteira recebe milhares de pessoas.'; }
    if (act.choice === 'quota') { s.econ.treasury -= g * 0.0005; s.econ.pop += 0.05; s.st.reputation = clamp(s.st.reputation + 1, 0, 100); return 'Uma cota limitada de refugiados é aceita.'; }
    s.st.reputation = clamp(s.st.reputation - 3, 0, 100); return 'A fronteira é fechada; organizações humanitárias criticam o governo.';
  }
  // mediação
  const w = s.world.wars.find(x => x.id === act.war);
  if (!w || !w.active) return 'A guerra já havia terminado.';
  s.econ.treasury -= g * 0.001;
  const p = clamp(0.15 + s.st.reputation / 200 + s.st.influence / 300 + (day(s) - w.since) / 600, 0.1, 0.85);
  if (chance(p)) {
    w.active = false; w.front = 0; w.mediated = true;
    s.st.reputation = clamp(s.st.reputation + 4, 0, 100); s.st.influence = clamp(s.st.influence + 2, 0, 100);
    for (const id of [w.a[0], w.b[0]]) if (s.partners[id]) s.partners[id].rel = clamp(s.partners[id].rel + 6, -100, 100);
    ctx.news(`A mediação de ${s.nation.shortName} impõe um cessar-fogo entre ${nm(s, data, w.a[0])} e ${nm(s, data, w.b[0])}.`, 'good');
    return 'A mediação teve sucesso: cessar-fogo assinado.';
  }
  for (const id of [w.a[0], w.b[0]]) if (s.partners[id]) s.partners[id].rel = clamp(s.partners[id].rel - 3, -100, 100);
  s.st.reputation = clamp(s.st.reputation - 1, 0, 100);
  return 'A mediação fracassou; as partes não aceitaram sentar à mesa.';
}

// ---------- Rodada semanal ----------
export function weeklyWorldWar(s, data, ctx) {
  const W = s.world, d = day(s);
  const act = activeAi(W);

  // 1) Faíscas: rivalidades vizinhas que explodem, mais frequentes com a tensão mundial alta.
  if (act.length < (W.chaos ? 12 : 4) && chance(0.02 + (W.tension || 0) / 4000)) {
    const ids = Object.keys(W.c).filter(id => !W.c[id].dep && W.c[id].gdp > 15 && !inAnyWar(W, id) && (W.c[id].exh || 0) < 35 && (W.c[id].overext || 0) < 0.12);
    const a = ids.length ? pick(ids) : null, A = a && W.c[a];
    if (A) {
      const tg = (entOf(s, data, a)?.nb || []).filter(x => x !== PLY && W.c[x] && !W.c[x].dep && !inAnyWar(W, x) && relAI(s, data, a, x) < -20 && aiPower(A) > aiPower(W.c[x]) * 1.15 && !(W.c[x].nuclear && !A.nuclear));
      if (tg.length) startAiWar(s, data, ctx, a, tg[0], `${nm(s, data, a)} invade ${nm(s, data, tg[0])} após meses de escalada na fronteira`);
    }
  }

  for (const w of act) {
    const age = d - (w.since || d);
    // 2) Novas guerras: choque de mercado, aliados do defensor intervêm e o mundo é consultado.
    if (!w.wwSeen) {
      w.wwSeen = true;
      warShock(s, data, w, ctx);
      const att = w.a[0], dfn = w.b[0];
      for (const m of defenseAllies(s, data, dfn)) {
        if (m === PLY || m === att || !W.c[m] || W.c[m].dep || inAnyWar(W, m) || w.b.includes(m)) continue;
        if (relAI(s, data, m, att) < 25 && chance(0.4)) { w.b.push(m); shiftRelAI(s, m, att, -30); ctx.news(`${nm(s, data, m)} honra a aliança e entra na guerra ao lado de ${nm(s, data, dfn)}.`, 'war'); }
      }
      for (const m of defenseAllies(s, data, att)) {
        if (m === PLY || m === dfn || !W.c[m] || W.c[m].dep || inAnyWar(W, m) || w.a.includes(m)) continue;
        if (relAI(s, data, m, dfn) < 10 && chance(0.2)) { w.a.push(m); shiftRelAI(s, m, dfn, -30); ctx.news(`${nm(s, data, m)} se une a ${nm(s, data, att)} na guerra.`, 'war'); }
      }
    }
    // 3) Pressão para escolher um lado (uma vez por guerra, com intervalo global).
    const involved = [...w.a, ...w.b];
    const close = involved.some(id => (s.partners[id]?.rel ?? 0) > 35 || s.partners[id]?.pact || playerNeighbors(s, data).has(id));
    if (!w.sideAsked && age >= 7 && close && (W.sideCd || 0) <= d && chance(0.35)) {
      w.sideAsked = true; W.sideCd = d + 30; ctx.card(sideCard(s, data, w));
    }
    // 4) Refugiados na fronteira do jogador.
    if (age >= 28 && (W.refugeeCd || 0) <= d) {
      const loser = w.front >= 0 ? w.b[0] : w.a[0];
      if (playerNeighbors(s, data).has(loser) && W.c[loser] && chance(0.08)) { W.refugeeCd = d + 120; ctx.card(refugeeCard(s, data, w, loser)); }
    }
    // 5) Potências neutras impõem cessar-fogo em guerras longas.
    if (age > 70 && chance(0.02)) {
      const pool = Object.values(W.c).filter(c => !c.dep && !inAnyWar(W, c.id) && c.id !== PLY && aiPower(c) > 6 && involved.every(x => relAI(s, data, c.id, x) > -25)).sort((x, y) => aiPower(y) - aiPower(x));
      if (pool.length) {
        w.active = false; w.front = 0; w.mediated = true;
        ctx.news(`Pressão de ${nm(s, data, pool[0].id)} e da ONU impõe cessar-fogo entre ${nm(s, data, w.a[0])} e ${nm(s, data, w.b[0])}.`, 'info');
        continue;
      }
    }
    // 6) Corrida armamentista: vizinhos dos combatentes se armam.
    if (chance(0.15)) {
      const id = pick(involved), nb = (entOf(s, data, id)?.nb || []).filter(x => x !== PLY && W.c[x] && !W.c[x].dep && !involved.includes(x));
      if (nb.length) { const c = W.c[pick(nb)]; c.ready = clamp(c.ready + 3, 5, 95); c.troops *= 1.004; c.equip = clamp((c.equip || 30) + 0.4, 0, 100); }
    }
  }
}
