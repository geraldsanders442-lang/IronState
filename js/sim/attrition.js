// Custo humano e material das guerras: baixas militares e civis, refugiados, destruição de infraestrutura por
// província, cansaço de guerra dos países de IA, resistência em territórios conquistados e sobre-extensão.
// Vale para guerras entre IAs (Observatório e mundo do jogador) e para as guerras do próprio jogador.
//
// Estado salvo (tudo em s.world):
//   dmg[pid]  = [destruição 0-100, semanas em guerra, civis mortos (mil), refugiados (mil), último dia de combate]
//   res[pid]  = [resistência 0-100, dia da conquista, antigo dono, política aplicada]
//   core[id]  = províncias "de casa" do país (as que tinha quando foi visto pela primeira vez)
//   ws        = totais mundiais { mil, civ, ref, lost (bi US$ destruídos), revolts, wars }
// Em cada país de IA: exh (cansaço 0-100), overext (sobre-extensão 0-1), dmg (parcela devastada 0-1),
//   milDead / civDead (mil), dmgPrev (controle do efeito no PIB).
import { clamp, chance, rand, pick, random } from './util.js';
import { PLY, entOf, provincesOf, ownerOf, setOwner, territoryChanged, aiPower } from './world.js';
import { famOf, baseOf } from './geopol.js';
import { foundState } from './newstates.js';

const day = s => Math.floor(s.time.min / 1440);
const nm = (s, data, id) => id === PLY ? s.nation.shortName : entOf(s, data, id)?.name || id;
const popK = (data, pid) => (data.geo.prov[pid]?.pop || 0) / 1000;
const REPRESSIVE = new Set(['nationalist', 'junta', 'theocratic', 'socialist']);

// ---------- Índices auxiliares ----------
function coreSets(s, data) {
  const W = s.world, out = {};
  for (const id in W.core) out[id] = new Set(W.core[id]);
  return out;
}
// Identidade "nacional" de um país (para reconhecer reunificações: Rússia retomando terras russas etc.).
const identityOf = (s, data, id) => { if (id === PLY) return s.nation.components?.[0]?.id || null; const e = entOf(s, data, id); if (!e || e.born) return null; return e.o3 || (e.custom ? e.origin : null) || id; };

// Frentes de cada guerra ativa: províncias onde se combate nesta semana, com a intensidade.
function warZones(s, data) {
  const W = s.world, zones = new Map(); // pid -> intensidade
  const add = (pid, k) => { if (pid && data.geo.prov[pid]) zones.set(pid, Math.max(zones.get(pid) || 0, k)); };
  for (const w of W.wars) {
    if (!w.active || !w.ai) continue;
    const a = w.a[0], b = w.b[0], A = W.c[a], B = W.c[b]; if (!A || !B) continue;
    const I = clamp(Math.sqrt(Math.min(A.troops, B.troops) + 1) / 9, 0.3, 1.6) * (W.chaos ? 1.15 : 1);
    w.I = +I.toFixed(2);
    for (const p of [...(w.occA || []), ...(w.occB || [])]) if (W.occ[p]) add(p, I * 1.3);
    // Linha de frente: províncias de cada lado que tocam o inimigo (as mais populosas primeiro).
    const touch = (own, other) => provincesOf(s, data, own).filter(p => data.geo.prov[p].nb.some(n => { const o = W.occ[n] || ownerOf(s, data, n); return o === other; }));
    const fa = touch(b, a), fb = touch(a, b);
    const atkWins = (w.front || 0) >= 0;
    const pickF = (list, n) => list.sort((x, y) => popK(data, y) - popK(data, x)).slice(0, n);
    for (const p of pickF(fa, atkWins ? 4 : 2)) add(p, I);
    for (const p of pickF(fb, atkWins ? 2 : 4)) add(p, I * 0.8);
    // Sem fronteira comum: bombardeios e desembarques esporádicos.
    if (!fa.length && !fb.length && chance(0.5)) { const t = provincesOf(s, data, atkWins ? b : a); if (t.length) add(pick(t), I * 0.5); }
  }
  for (const w of s.wars || []) {
    if (!w.active || w.truce > 0) continue;
    const I = clamp(Math.sqrt((s.st.troops || 1) + 1) / 9, 0.4, 1.6) * (w.stance === 'hold' ? 0.7 : 1);
    w.I = +I.toFixed(2);
    for (const T of [w.target, w.target2]) if (T) add(T.pid, I * (0.6 + T.p / 160));
    for (const T of [w.etarget, w.etarget2]) if (T) add(T.pid, I * (0.6 + T.p / 160));
    for (const p of [...(w.gained || []), ...(w.lost || [])]) if (W.occ[p]) add(p, I * 0.7);
  }
  return zones;
}

// ---------- Rodada semanal ----------
export function weeklyAttrition(s, data, ctx) {
  const W = s.world, d = day(s);
  W.core ||= {}; W.dmg ||= {}; W.res ||= {}; W.ws ||= { mil: 0, civ: 0, ref: 0, lost: 0, revolts: 0 };
  for (const id in W.c) if (!W.core[id]) W.core[id] = provincesOf(s, data, id).slice();
  if (!W.core[PLY]) W.core[PLY] = provincesOf(s, data, PLY).slice();
  for (const id in W.core) if (id !== PLY && !W.c[id]) delete W.core[id];
  const core = coreSets(s, data);
  const zones = warZones(s, data);
  const civBy = {}, refBy = {};

  // 1) Destruição e vítimas civis nas zonas de combate.
  for (const [pid, I] of zones) {
    const D = W.dmg[pid] ||= [0, 0, 0, 0, d];
    const k = popK(data, pid), occ = !!W.occ[pid];
    D[0] = +clamp(D[0] + I * (occ ? 1.9 : 1.3) * (1 - D[0] / 105) * rand(0.6, 1.4), 0, 100).toFixed(1);
    D[1]++; D[4] = d;
    const civ = k * 0.000025 * I * (1 + D[0] / 60) * (D[1] > 52 ? 1.3 : 1);
    const ref = Math.min(k * 0.3 - D[3], k * 0.0011 * I * (1 + D[0] / 50));
    D[2] = +(D[2] + civ).toFixed(3); D[3] = +(D[3] + Math.max(0, ref)).toFixed(2);
    const h = ownerOf(s, data, pid);
    civBy[h] = (civBy[h] || 0) + civ; refBy[h] = (refBy[h] || 0) + Math.max(0, ref);
  }
  // 2) Reconstrução fora das zonas de combate (mais rápida em países ricos e em paz).
  for (const pid in W.dmg) {
    if (zones.has(pid)) continue;
    const D = W.dmg[pid], h = ownerOf(s, data, pid), c = W.c[h];
    const pc = h === PLY ? s.econ.gdp * 1e3 / Math.max(0.01, s.econ.pop) : c ? c.gdp * 1e3 / Math.max(0.01, c.pop) : 2000;
    const rate = clamp(0.25 + Math.log10(Math.max(300, pc)) * 0.2, 0.4, 1.4) * (D[5] ? 2.2 : 1);
    D[0] = +Math.max(0, D[0] - rate).toFixed(1);
    if (D[0] <= 0 && d - D[4] > 720) delete W.dmg[pid];
  }

  // 3) Baixas militares das guerras entre IAs.
  for (const w of W.wars) {
    if (!w.active || !w.ai) continue;
    const r = clamp(w.ratio || 1, 0.2, 5), I = w.I || 1;
    const sides = [[w.a, clamp(1.25 - r * 0.25, 0.5, 1.6), 'casA'], [w.b, clamp(0.75 + r * 0.25, 0.5, 1.6), 'casB']];
    for (const [ids, f, key] of sides) for (const id of ids) {
      const c = W.c[id]; if (!c) continue;
      const lead = id === ids[0] ? 1 : 0.45;
      const loss = c.troops * 0.0038 * f * I * lead;
      c.troops = Math.max(1, c.troops - loss); c.milDead = (c.milDead || 0) + loss; c._lossW = (c._lossW || 0) + loss;
      w[key] = +((w[key] || 0) + loss).toFixed(2); W.ws.mil += loss;
    }
    w.civ = +((w.civ || 0) + (civBy[w.a[0]] || 0) + (civBy[w.b[0]] || 0)).toFixed(2);
  }
  for (const w of s.wars || []) if (w.active) {
    const loss = w.weeks?.[0]?.day === d ? (w.weeks[0].my || 0) + (w.weeks[0].en || 0) : 0;
    W.ws.mil += loss; w.civ = +((w.civ || 0) + (civBy[PLY] || 0) + w.enemies.reduce((t, e) => t + (civBy[e] || 0), 0)).toFixed(2);
  }

  // 4) Efeitos nos países: PIB destruído, população, estabilidade, cansaço.
  const atWar = new Set(); for (const w of W.wars) if (w.active) for (const id of [...w.a, ...w.b]) atWar.add(id);
  for (const w of s.wars || []) if (w.active) { atWar.add(PLY); for (const e of w.enemies) atWar.add(e); }
  const dmgShare = id => { let t = 0, dd = 0; for (const p of provincesOf(s, data, id)) { const k = popK(data, p); t += k; const D = W.dmg[p]; if (D) dd += k * D[0] / 100; } return t ? dd / t : 0; };
  const civT = Object.values(civBy).reduce((a, b) => a + b, 0), refT = Object.values(refBy).reduce((a, b) => a + b, 0);
  W.ws.civ += civT; W.ws.ref += refT;
  for (const id of new Set([...Object.keys(W.c), PLY])) {
    const ply = id === PLY, c = ply ? null : W.c[id];
    if (!ply && !c) continue;
    const hasD = civBy[id] || provincesOf(s, data, id).some(p => W.dmg[p]);
    const share = hasD ? dmgShare(id) : 0;
    const prev = ply ? (W.plyDmg || 0) : (c.dmg || 0);
    const gdp = ply ? s.econ.gdp : c.gdp;
    let mult = 1;
    if (share > prev) mult = 1 - (share - prev) * 0.85; else if (share < prev) mult = 1 + (prev - share) * 0.55;
    if (share > 0.02 && atWar.has(id)) mult *= 1 - share * 0.0025;
    const lostBi = gdp * (1 - Math.min(1, mult)); if (lostBi > 0) W.ws.lost += lostBi;
    const popLoss = ((civBy[id] || 0) + (refBy[id] || 0)) / 1000; // milhões
    if (ply) {
      s.econ.gdp *= mult; W.plyDmg = +share.toFixed(4);
      if (popLoss) s.econ.pop = Math.max(0.01, s.econ.pop - popLoss);
      if (civBy[PLY]) { W.plyCiv = (W.plyCiv || 0) + civBy[PLY]; s.st.warWeariness = clamp(s.st.warWeariness + civBy[PLY] / Math.max(1, s.econ.pop * 1000) * 4000, 0, 100); }
      if (share > 0.05) s.st.stability = clamp(s.st.stability - share * 0.8, 0, 100);
    } else {
      c.gdp = Math.max(0.01, c.gdp * mult); c.dmg = +share.toFixed(4);
      if (popLoss) { c.pop = Math.max(0.01, c.pop - popLoss); c.civDead = (c.civDead || 0) + (civBy[id] || 0); }
      if (refBy[id]) { // refugiados fogem para vizinhos em paz
        const nb = (entOf(s, data, id)?.nb || []).filter(x => W.c[x] && !atWar.has(x));
        if (nb.length) { const t = W.c[pick(nb)]; t.pop += refBy[id] / 1000 * 0.7; t.stab = clamp(t.stab - Math.min(1.5, refBy[id] / Math.max(1, t.pop * 1000) * 300), 5, 95); }
      }
      if (share > 0.03) c.stab = clamp(c.stab - share * 0.9, 5, 95);
      // Cansaço de guerra
      if (atWar.has(id)) {
        const f = famOf(s, data, id), reg = REPRESSIVE.has(f) ? 0.75 : ['liberal', 'socdem'].includes(f) ? 1.25 : 1;
        const lossRel = (c._lossW || 0) / Math.max(1, c.troops + (c._lossW || 0));
        const civRel = (civBy[id] || 0) / Math.max(1, c.pop * 1000);
        const occShare = provincesOf(s, data, id).filter(p => W.occ[p]).length / Math.max(1, provincesOf(s, data, id).length);
        const inc = (0.18 + lossRel * 160 + civRel * 9000 + occShare * 2.2 + share * 2) * reg * (1 - (c.nat || 0) / 400);
        c.exh = +clamp((c.exh || 0) + inc, 0, 100).toFixed(2);
      } else if (c.exh) { c.exh = +Math.max(0, c.exh * 0.985 - 0.9).toFixed(2); if (c.exh < 0.5) delete c.exh; }
      c._lossW = 0;
    }
  }

  // 5) Resistência em terras conquistadas (ocupadas ou anexadas, fora do "núcleo" do país).
  const coreOwner = {};
  for (const id in W.core) for (const p of W.core[id]) if (!coreOwner[p] || !W.c[coreOwner[p]]) coreOwner[p] = id;
  const held = new Set([...Object.keys(W.owner), ...Object.keys(W.occ)]);
  for (const pid in W.res) held.add(pid);
  const over = {};
  for (const pid of held) {
    if (!data.geo.prov[pid]) continue;
    const h = W.occ[pid] || ownerOf(s, data, pid);
    const isCore = core[h]?.has(pid);
    let R = W.res[pid];
    if (isCore || h === PLY && s.spectator) { if (R) delete W.res[pid]; continue; }
    if (!W.c[h] && h !== PLY) continue;
    const from = R?.[2] && (W.c[R[2]] || R[2] === PLY) ? R[2] : (coreOwner[pid] !== h ? coreOwner[pid] : null) || baseOf(data, pid);
    const kin = baseOf(data, pid) === identityOf(s, data, h);
    if (!R) {
      const fromAlive = !!W.c[from] || from === PLY;
      const lvl = clamp(22 + (W.occ[pid] ? 14 : 0) + (fromAlive ? 16 : 4) + (W.dmg[pid]?.[0] || 0) * 0.2 - (kin ? 28 : 0) + rand(-6, 6), 3, 75);
      R = W.res[pid] = [+lvl.toFixed(1), d, from, null];
      continue;
    }
    if (R[2] !== from) R[2] = from;
    const fam = h === PLY ? null : famOf(s, data, h);
    const fromAlive = !!W.c[from] || from === PLY;
    const stab = h === PLY ? s.st.stability : W.c[h].stab;
    let drift = (fromAlive ? 0.55 : 0.2) + (W.dmg[pid]?.[0] || 0) / 120 + (fam && REPRESSIVE.has(fam) ? 0.15 : 0) - 0.42 - (stab > 60 ? 0.3 : 0) - (kin ? 0.6 : 0)
      + ({ rep: 0.35, aut: -0.45, inv: -0.3, set: -0.15 }[R[3]] || 0) - (d - R[1]) / 3650;
    if (W.occ[pid] && fromAlive) drift += 0.25;
    R[0] = +clamp(R[0] + drift + rand(-0.5, 0.5), 0, 100).toFixed(1);
    if (R[0] < 2 && !W.occ[pid]) { delete W.res[pid]; (W.core[h] ||= []).push(pid); continue; } // assimilada
    (over[h] ||= []).push(pid);
    // Guerrilha: danifica a província e pode provocar levantes.
    if (R[0] > 45) { const D = W.dmg[pid] ||= [0, 0, 0, 0, d]; D[0] = +clamp(D[0] + R[0] / 200, 0, 100).toFixed(1); }
    if (R[0] >= 80 && chance(0.025 + (R[0] - 80) / 500)) revolt(s, data, ctx, pid, h, R);
  }
  // Sobre-extensão: população em terras hostis drena tropas e estabilidade do ocupante.
  for (const id of new Set([...Object.keys(W.c), PLY])) {
    const list = (over[id] || []).filter(p => W.res[p]);
    let hostile = 0; for (const p of list) hostile += popK(data, p) * W.res[p][0] / 100;
    const total = id === PLY ? s.econ.pop * 1000 : (W.c[id]?.pop || 0) * 1000;
    const ox = total ? clamp(hostile / total, 0, 1) : 0;
    if (id === PLY) { W.plyOverext = +ox.toFixed(3); if (ox > 0.01) { s.st.stability = clamp(s.st.stability - ox * 1.5, 0, 100); s.st.troops = Math.max(1, s.st.troops * (1 - ox * 0.006)); } continue; }
    const c = W.c[id]; if (!c) continue;
    if (ox > 0.005) { c.overext = +ox.toFixed(3); c.stab = clamp(c.stab - ox * 2.5, 5, 95); c.troops = Math.max(1, c.troops * (1 - ox * 0.008)); }
    else delete c.overext;
  }

  // 6) Paz por exaustão nas guerras entre IAs.
  for (const w of W.wars) {
    if (!w.active || !w.ai) continue;
    const A = W.c[w.a[0]], B = W.c[w.b[0]]; if (!A || !B) continue;
    const age = d - (w.since || d), ea = A.exh || 0, eb = B.exh || 0, mx = Math.max(ea, eb);
    if (age < 56 || mx < 68) continue;
    if (chance((mx - 62) / 380 + (ea > 60 && eb > 60 ? 0.04 : 0))) {
      w.active = false; w.exhausted = true; w.ended = d;
      const tired = ea >= eb ? w.a[0] : w.b[0];
      ctx.news?.(`Esgotado pela guerra, ${nm(s, data, tired)} aceita um cessar-fogo com ${nm(s, data, tired === w.a[0] ? w.b[0] : w.a[0])}. Baixas: ${fmtK((w.casA || 0) + (w.casB || 0))} soldados e ${fmtK(w.civ || 0)} civis.`, 'info');
    }
  }
  for (const w of W.wars) if (!w.active && w.ai && !w.ended) w.ended = d;

  if (!s.spectator) playerCards(s, data, ctx, core);
}
export const fmtK = k => k >= 1000 ? (k / 1000).toFixed(1).replace('.', ',') + (k >= 2000 ? ' milhões' : ' milhão') : k >= 1 ? Math.round(k) + ' mil' : String(Math.round(k * 1000));

// Levante bem-sucedido: a província volta ao antigo dono (se ele existe e faz fronteira) ou funda um Estado.
function revolt(s, data, ctx, pid, h, R) {
  const W = s.world, from = R[2], P = data.geo.prov[pid];
  W.ws.revolts = (W.ws.revolts || 0) + 1;
  (W.revoltLog ||= []).unshift({ day: day(s), pid, from, holder: h }); if (W.revoltLog.length > 80) W.revoltLog.length = 80;
  if (W.occ[pid] && h !== PLY) { delete W.occ[pid]; territoryChanged(s); delete W.res[pid]; ctx.news?.(`Guerrilheiros expulsam as tropas de ${nm(s, data, h)} de ${P.n}.`, 'war'); return; }
  if (h === PLY) { // o jogador perde o controle de fato: vira crise
    s.st.stability = clamp(s.st.stability - 4, 0, 100); s.st.troops = Math.max(1, s.st.troops * 0.985); R[0] = 65;
    ctx.news?.(`Levante armado em ${P.n}: a guarnição é cercada e o governo perde o controle de parte da província.`, 'bad');
    return;
  }
  const back = (W.c[from] || from === PLY) && P.nb.some(n => ownerOf(s, data, n) === from);
  if (back && from !== PLY) {
    setOwner(s, data, pid, from); delete W.res[pid];
    const c = W.c[h]; if (c) c.stab = clamp(c.stab - 3, 5, 95);
    ctx.news?.(`Insurreição em ${P.n}: a população expulsa ${nm(s, data, h)} e a província volta para ${nm(s, data, from)}.`, 'war');
    return;
  }
  // Antigo dono não existe mais: as províncias rebeladas vizinhas proclamam (ou restauram) um Estado.
  const group = [pid, ...P.nb.filter(n => W.res[n]?.[0] >= 60 && W.res[n][2] === from && ownerOf(s, data, n) === h && !W.occ[n])].slice(0, 8);
  if (provincesOf(s, data, h).length - group.length < 2) { R[0] = 60; return; }
  const e = entOf(s, data, from);
  const mv = e && !W.c[from] ? { id: 'lib_' + from, name: e.name, short: e.short || e.name, culture: e.culture, ideo: 'libertação nacional', flag: e.flag || { layout: 'h3', colors: ['#7a1d12', '#f2f2f2', '#1d2b45'] }, profile: { milIntensity: 1.2, liberty: 45, market: 50, ...(e.profile || {}) } } : null;
  const id = foundState(s, data, ctx, { pids: group, from: h, movement: mv, why: `restaura a independência após anos de guerrilha` });
  if (id) { for (const p of group) delete W.res[p]; const c = W.c[id]; if (c) { c.troops *= 1.4; c.stab = 45; } }
  else R[0] = 60;
}

// Efeito da guerra no poder de combate (lido pelas guerras de IA).
export function warMorale(s, data, id) {
  const W = s.world, c = W.c[id]; if (!c) return 1;
  const occShare = provincesOf(s, data, id).filter(p => W.occ[p]).length / Math.max(1, provincesOf(s, data, id).length);
  const exh = c.exh || 0;
  return (1 - exh / 230) * (1 - (c.overext || 0) * 0.9) * (1 + (exh < 60 ? occShare * 0.45 : 0)); // guerra do povo: quem é invadido resiste mais
}

// ---------- Questões para o jogador ----------
const opt = (text, hint, act) => ({ text, hint, act: act ? { type: 'attr', ...act } : undefined });
function playerCards(s, data, ctx, core) {
  const W = s.world, d = day(s);
  W.attrCd ||= {};
  if ((W.attrCd.any || 0) > d) return;
  const mine = provincesOf(s, data, PLY);
  const atWar = (s.wars || []).some(w => w.active);
  const send = (key, cd, card) => { W.attrCd[key] = d + cd; W.attrCd.any = d + 21; ctx.card?.({ dyn: true, cat: 'Consequências da guerra', crisis: false, deadline: 14, ...card }); return true; };
  const free = key => (W.attrCd[key] || 0) <= d;
  // a) Reconstrução de uma província devastada (combates já cessaram ali).
  const ruin = mine.filter(p => W.dmg[p] && W.dmg[p][0] >= 30 && d - W.dmg[p][4] >= 14 && !W.dmg[p][5]).sort((a, b) => W.dmg[b][0] * popK(data, b) - W.dmg[a][0] * popK(data, a))[0];
  if (ruin && free('rb_' + ruin) && chance(0.5)) {
    const P = data.geo.prov[ruin], D = W.dmg[ruin];
    return send('rb_' + ruin, 240, { id: `dyn_attr_rebuild_${ruin}_${d}`, default: 2, title: `${P.n} em ruínas`, desc: `Meses de combate destruíram ${Math.round(D[0])}% da infraestrutura de ${P.n}: pontes, redes elétricas, hospitais e moradias. ${fmtK(D[2])} civis morreram e ${fmtK(D[3])} pessoas fugiram.`,
      context: 'A reconstrução devolve PIB e estabilidade à região; sem ela, a recuperação leva anos.',
      options: [opt('Lançar um grande plano de reconstrução.', 'Custa 1% do PIB; destruição cai pela metade e a reconstrução acelera; estabilidade e legitimidade sobem.', { k: 'rebuild', pid: ruin, v: 'state' }),
        opt('Pedir ajuda internacional.', 'Custa influência; reconstrução mais lenta, mas quase grátis; aliados ricos ganham peso no país.', { k: 'rebuild', pid: ruin, v: 'aid' }),
        opt('Deixar a iniciativa privada e os moradores reconstruírem.', 'Sem custo; recuperação lenta; a região se ressente.', { k: 'rebuild', pid: ruin, v: 'none' })] });
  }
  // b) Insurgência em terras recém-anexadas ou ocupadas pelo jogador.
  const ins = Object.keys(W.res).filter(p => (W.occ[p] === PLY || ownerOf(s, data, p) === PLY) && W.res[p][0] >= 40).sort((a, b) => W.res[b][0] - W.res[a][0])[0];
  if (ins && free('in_' + ins) && chance(0.5)) {
    const P = data.geo.prov[ins], R = W.res[ins], from = R[2];
    return send('in_' + ins, 150, { id: `dyn_attr_insurg_${ins}_${d}`, default: 0, crisis: R[0] > 70, title: `Insurgência em ${P.n}`, desc: `A população de ${P.n}${from && from !== PLY ? `, ligada a ${nm(s, data, from)},` : ''} não aceita o domínio de ${s.nation.shortName}. Emboscadas, sabotagens e greves se multiplicam (resistência ${Math.round(R[0])}/100).`,
      context: 'Territórios conquistados custam tropas e estabilidade enquanto resistem. Força bruta acalma no curto prazo e alimenta o ódio; concessões funcionam devagar.',
      options: [opt('Repressão militar: toque de recolher e prisões em massa.', 'Resistência −30 agora, mas cresce mais rápido depois; reputação −4; tropas desgastadas.', { k: 'insurg', pid: ins, v: 'rep' }),
        opt('Conceder autonomia e eleições locais.', 'Resistência −18 e passa a cair sozinha; nacionalistas e militares reclamam.', { k: 'insurg', pid: ins, v: 'aut' }),
        opt('Investir em empregos, escolas e serviços na região.', 'Custa 0,4% do PIB; resistência −14 e queda gradual.', { k: 'insurg', pid: ins, v: 'inv' }),
        opt('Assentar colonos e impor a língua oficial.', 'Resistência +10 agora; assimilação lenta a longo prazo; condenação internacional (reputação −7).', { k: 'insurg', pid: ins, v: 'set' })] });
  }
  // c) Minas e munições não detonadas onde a guerra acabou.
  const mines = mine.filter(p => W.dmg[p] && W.dmg[p][1] >= 6 && d - W.dmg[p][4] >= 7 && d - W.dmg[p][4] < 120 && !W.dmg[p][6])[0];
  if (mines && free('mn_' + mines) && chance(0.25)) {
    const P = data.geo.prov[mines]; W.dmg[mines][6] = 1;
    return send('mn_' + mines, 400, { id: `dyn_attr_mines_${mines}_${d}`, default: 2, title: `Campos minados em ${P.n}`, desc: `As linhas de frente deixaram minas e munições não detonadas em lavouras, estradas e escolas de ${P.n}. Crianças e agricultores já foram vítimas.`,
      context: 'Sem desminagem, a região continua perdendo gente e a reconstrução emperra.',
      options: [opt('Contratar uma missão internacional de desminagem.', 'Custa 0,2% do PIB; reputação +2; reconstrução acelera.', { k: 'mines', pid: mines, v: 'intl' }),
        opt('Mandar os engenheiros do exército.', 'Sem custo direto; algumas baixas entre os sapadores; militares ganham prestígio.', { k: 'mines', pid: mines, v: 'army' }),
        opt('Sinalizar as áreas e seguir em frente.', 'Sem custo; acidentes continuam por anos; estabilidade −2.', { k: 'mines', pid: mines, v: 'none' })] });
  }
  // d) Veteranos e mutilados depois de uma guerra com muitas baixas.
  const vw = (s.wars || []).find(w => !w.active && !w.vetAsked && (w.cas || 0) > 3 && d - (w.ended || w.start) < 200);
  if (vw) {
    vw.vetAsked = true;
    return send('vet', 200, { id: `dyn_attr_vets_${vw.id}`, default: 1, title: 'Veteranos de guerra exigem amparo', desc: `A guerra contra ${nm(s, data, vw.enemy)} deixou ${fmtK(vw.cas)} soldados mortos ou feridos. Associações de veteranos, viúvas e mutilados acampam diante do palácio.`,
      context: 'Militares e famílias de soldados observam como o governo trata quem lutou.',
      options: [opt('Pensões vitalícias, próteses e tratamento psicológico.', 'Custa 0,3% do PIB; militares +6; estabilidade +2.', { k: 'vets', v: 'pension' }),
        opt('Um memorial nacional e medalhas.', 'Custo baixo; efeito simbólico; militares +1.', { k: 'vets', v: 'memorial' }),
        opt('Não há dinheiro: o orçamento já está no limite.', 'Sem custo; militares −6; protestos.', { k: 'vets', v: 'none' })] });
  }
  // e) Denúncias de crimes de guerra em território ocupado.
  const cw = (s.wars || []).find(w => w.active && !w.crimeAsked && (w.gained || []).filter(p => W.occ[p] === PLY).length >= 2 && d - w.start > 30);
  if (cw && chance(0.05)) {
    cw.crimeAsked = true;
    const p = (cw.gained || []).find(x => W.occ[x] === PLY), P = data.geo.prov[p];
    return send('crime', 300, { id: `dyn_attr_crimes_${cw.id}`, default: 2, title: `Denúncia de massacre em ${P.n}`, desc: `Jornalistas estrangeiros publicam fotos de valas comuns e execuções de civis em ${P.n}, sob ocupação das tropas de ${s.nation.shortName}. Organizações de direitos humanos exigem investigação.`,
      context: 'Punir os responsáveis custa apoio no exército; encobrir arrisca isolamento internacional e alimenta a insurgência local.',
      options: [opt('Abrir um tribunal militar independente.', 'Reputação +6; militares −8; resistência local cai.', { k: 'crimes', pid: p, v: 'court' }),
        opt('Anistia: "os soldados cumpriram o dever".', 'Militares +4; reputação −8; resistência local sobe.', { k: 'crimes', pid: p, v: 'amnesty' }),
        opt('Negar tudo e chamar de propaganda inimiga.', 'Reputação −4; risco de o escândalo crescer.', { k: 'crimes', pid: p, v: 'deny' })] });
  }
  // f) Deslocados internos durante a guerra.
  const refs = mine.reduce((t, p) => t + (W.dmg[p] && d - W.dmg[p][4] < 30 ? W.dmg[p][3] : 0), 0);
  if (atWar && refs > 40 && free('idp') && chance(0.3)) {
    return send('idp', 180, { id: `dyn_attr_idp_${d}`, default: 1, title: 'Deslocados pela guerra', desc: `${fmtK(refs)} pessoas fugiram das zonas de combate e se amontoam em escolas, ginásios e estações das cidades do interior.`,
      context: 'Sem abrigo e comida, os deslocados viram fonte de protestos e epidemias; muitos podem emigrar de vez.',
      options: [opt('Montar abrigos e um programa de renda emergencial.', 'Custa 0,4% do PIB; estabilidade +2; menos emigração.', { k: 'idp', v: 'shelter' }),
        opt('Deixar prefeituras e ONGs cuidarem.', 'Sem custo; parte dos deslocados emigra; estabilidade −1.', { k: 'idp', v: 'local' }),
        opt('Abrir corredores para que saiam do país.', 'Sem custo; população cai; tensão social diminui.', { k: 'idp', v: 'exit' })] });
  }
}

export function attritionAct(s, data, act, ctx) {
  const W = s.world, g = s.econ.gdp, st = s.st, G = s.groups, P = act.pid && data.geo.prov[act.pid];
  const cl = (k, v) => { st[k] = clamp(st[k] + v, 0, 100); };
  switch (act.k) {
    case 'rebuild': { const D = W.dmg?.[act.pid]; if (!D) return '';
      if (act.v === 'state') { s.econ.treasury -= g * 0.01; D[0] = +(D[0] * 0.5).toFixed(1); D[5] = 1; cl('stability', 2); cl('legitimacy', 2); return `Plano de reconstrução de ${P.n} aprovado.`; }
      if (act.v === 'aid') { D[0] = +(D[0] * 0.75).toFixed(1); cl('influence', -2); cl('reputation', 1); return `Doadores internacionais financiam a reconstrução de ${P.n}.`; }
      if (G.regional != null) G.regional = clamp(G.regional - 4, 0, 100); return `${P.n} terá de se reerguer sozinha.`; }
    case 'insurg': { const R = W.res?.[act.pid]; if (!R) return '';
      R[3] = act.v;
      if (act.v === 'rep') { R[0] = clamp(R[0] - 30, 0, 100); cl('reputation', -4); st.troops = Math.max(1, st.troops * 0.99); G.military = clamp(G.military + 2, 0, 100); return `Toque de recolher e prisões em massa em ${P.n}.`; }
      if (act.v === 'aut') { R[0] = clamp(R[0] - 18, 0, 100); G.military = clamp(G.military - 4, 0, 100); cl('legitimacy', -1); return `${P.n} recebe autonomia e eleições locais.`; }
      if (act.v === 'inv') { R[0] = clamp(R[0] - 14, 0, 100); s.econ.treasury -= g * 0.004; return `Programa de investimentos para ${P.n}.`; }
      R[0] = clamp(R[0] + 10, 0, 100); cl('reputation', -7); return `Colonos começam a se instalar em ${P.n}.`; }
    case 'mines': { const D = W.dmg?.[act.pid];
      if (act.v === 'intl') { s.econ.treasury -= g * 0.002; cl('reputation', 2); if (D) D[5] = 1; return 'Missão internacional de desminagem contratada.'; }
      if (act.v === 'army') { st.troops = Math.max(1, st.troops - 0.3); G.military = clamp(G.military + 2, 0, 100); if (D) D[5] = 1; return 'Sapadores do exército limpam os campos minados.'; }
      cl('stability', -2); if (D) D[2] += 0.2; return 'As áreas minadas são apenas sinalizadas.'; }
    case 'vets':
      if (act.v === 'pension') { s.econ.treasury -= g * 0.003; G.military = clamp(G.military + 6, 0, 100); cl('stability', 2); return 'Pensões e tratamento para os veteranos.'; }
      if (act.v === 'memorial') { s.econ.treasury -= g * 0.0003; G.military = clamp(G.military + 1, 0, 100); return 'Um memorial nacional homenageia os mortos.'; }
      G.military = clamp(G.military - 6, 0, 100); cl('stability', -1); return 'Os veteranos ficam sem resposta.';
    case 'crimes': { const R = W.res?.[act.pid];
      if (act.v === 'court') { cl('reputation', 6); G.military = clamp(G.military - 8, 0, 100); if (R) R[0] = clamp(R[0] - 10, 0, 100); return 'Tribunal militar julgará os responsáveis.'; }
      if (act.v === 'amnesty') { cl('reputation', -8); G.military = clamp(G.military + 4, 0, 100); if (R) R[0] = clamp(R[0] + 12, 0, 100); return 'Anistia concedida às tropas.'; }
      cl('reputation', -4); if (chance(0.4)) { cl('reputation', -5); cl('legitimacy', -3); return 'Novas provas desmentem o governo: escândalo internacional.'; } return 'O governo nega as acusações.'; }
    case 'idp':
      if (act.v === 'shelter') { s.econ.treasury -= g * 0.004; cl('stability', 2); return 'Abrigos e renda emergencial para os deslocados.'; }
      if (act.v === 'local') { s.econ.pop = Math.max(0.01, s.econ.pop * 0.998); cl('stability', -1); return 'Prefeituras e ONGs assumem os deslocados.'; }
      s.econ.pop = Math.max(0.01, s.econ.pop * 0.995); cl('stability', 1); return 'Corredores humanitários levam os deslocados para fora do país.';
  }
  return '';
}

// ---------- Ações do laboratório sobre um país (Observatório) ----------
export function labCountryAct(s, data, act, ctx, mark) {
  const W = s.world, id = act.id, c = W.c[id]; if (!c) return '';
  const n = nm(s, data, id), ps = provincesOf(s, data, id);
  switch (act.v) {
    case 'boom': c.gdp *= 1.15; c.growth = (c.growth || 2) + 1.5; c.stab = clamp(c.stab + 8, 5, 95); return mark(`Milagre econômico em ${n}: PIB +15% e crescimento acelerado.`);
    case 'crash': c.gdp *= 0.8; c.growth = (c.growth || 2) - 1.5; c.stab = clamp(c.stab - 12, 5, 95); return mark(`Colapso econômico em ${n}: PIB −20%, desemprego em massa.`);
    case 'arm': c.troops *= 1.5; c.equip = clamp((c.equip || 30) + 15, 0, 100); c.ready = clamp(c.ready + 20, 5, 95); return mark(`${n} se militariza: tropas +50% e arsenal modernizado.`);
    case 'disarm': c.troops *= 0.5; c.equip = clamp((c.equip || 30) - 15, 0, 100); c.ready = clamp(c.ready - 20, 5, 95); return mark(`${n} desmobiliza metade das forças armadas.`);
    case 'nuke': c.nuclear = !c.nuclear; return mark(c.nuclear ? `${n} testa sua primeira bomba atômica.` : `${n} entrega seu arsenal nuclear.`);
    case 'exhaust': c.exh = 95; return mark(`${n} está exausto: a população não aguenta mais a guerra.`);
    case 'fresh': delete c.exh; delete c.overext; return mark(`Moral renovado em ${n}: o cansaço de guerra some.`);
    case 'rebuild': { let k = 0; for (const p of ps) if (W.dmg[p]) { W.dmg[p][0] = 0; k++; } c.gdp *= 1 + (c.dmg || 0) * 0.5; c.dmg = 0; return mark(`Plano Marshall para ${n}: ${k} província(s) reconstruída(s).`); }
    case 'disaster': { const hit = [...ps].sort(() => random() - 0.5).slice(0, Math.max(1, Math.ceil(ps.length / 6))); let dead = 0; for (const p of hit) { const D = W.dmg[p] ||= [0, 0, 0, 0, day(s)]; D[0] = clamp(D[0] + 35, 0, 100); const k = popK(data, p) * 0.0006; D[2] += k; dead += k; } c.pop = Math.max(0.01, c.pop - dead / 1000); c.stab = clamp(c.stab - 10, 5, 95); return mark(`Terremoto e enchentes devastam ${hit.length} região(ões) de ${n}: ${fmtK(dead)} mortos.`); }
    case 'famine': { const dead = c.pop * 1000 * 0.006; c.pop *= 0.994; c.stab = clamp(c.stab - 15, 5, 95); c.gdp *= 0.95; return mark(`Fome em ${n}: ${fmtK(dead)} mortos e revoltas por comida.`); }
    case 'kill': { if (W.leaders) W.leaders[id] = null; c.stab = clamp(c.stab - 12, 5, 95); return mark(`O governante de ${n} é assassinado; um sucessor assume em meio ao caos.`); }
    case 'insurgency': { let k = 0; for (const p of ps) if (W.res[p]) { W.res[p][0] = clamp(W.res[p][0] + 40, 0, 100); k++; } return k ? mark(`Revolta nos territórios conquistados por ${n} (${k} província(s)).`) : 'Este país não tem territórios conquistados.'; }
    case 'pacify': { let k = 0; for (const p of ps) if (W.res[p]) { delete W.res[p]; (W.core[id] ||= []).push(p); k++; } delete c.overext; return k ? mark(`${n} integra plenamente ${k} território(s) conquistado(s).`) : 'Este país não tem territórios conquistados.'; }
    case 'civilwar': {
      if (ps.length < 4) return 'País pequeno demais para uma guerra civil.';
      const cap = c.capitalProv, far = [...ps].sort((a, b) => dist(data, b, cap) - dist(data, a, cap)).slice(0, Math.floor(ps.length * 0.4));
      const nid = foundState(s, data, ctx, { pids: far, from: id, movement: null, why: 'rompe com o governo central: guerra civil' });
      if (!nid) return 'A guerra civil não pôde começar.';
      W.wars.push({ id: 'ai_' + id + '_' + nid + '_' + day(s), ai: true, a: [id], b: [nid], since: day(s), front: 0, active: true, note: `Guerra civil em ${n}`, chaos: true, civil: true });
      return mark(`Guerra civil em ${n}: ${nm(s, data, nid)} se rebela.`);
    }
    case 'annex': {
      const t = act.t, T = W.c[t]; if (!T || t === id) return '';
      const tn = nm(s, data, t);
      for (const p of provincesOf(s, data, t)) setOwner(s, data, p, id);
      c.pop += T.pop; c.gdp += T.gdp; c.troops += T.troops * 0.5; delete W.c[t];
      for (const w of W.wars) if (w.active && [...w.a, ...w.b].includes(t)) w.active = false;
      return mark(`${n} absorve ${tn} (união forçada).`);
    }
    case 'sanction': { W.sanc ||= {}; const top = Object.keys(W.c).filter(x => x !== id && !W.c[x].dep).sort((a, b) => W.c[b].gdp - W.c[a].gdp).slice(0, 12); for (const x of top) W.sanc[x + '>' + id] = day(s); return mark(`As 12 maiores economias impõem sanções a ${n}.`); }
    case 'unsanction': { for (const k in W.sanc || {}) if (k.endsWith('>' + id)) delete W.sanc[k]; return mark(`Sanções contra ${n} são retiradas.`); }
    case 'rename': { const e = entOf(s, data, id); if (!e || !act.name) return ''; W.ents ||= {}; W.ents[id] = { ...e, name: act.name, short: act.name }; return mark(`${n} passa a se chamar ${act.name}.`); }
    case 'leader': { if (!act.name) return ''; W.leaders ||= {}; const e = entOf(s, data, id); W.ents ||= {}; W.ents[id] = { ...e, leaderName: act.name }; W.leaders[id] = null; if (W.leaderUsed) delete W.leaderUsed[id]; return mark(`${act.name} assume o governo de ${n}.`); }
  }
  return '';
}
const dist = (data, a, b) => { const A = data.geo.prov[a]?.c, B = data.geo.prov[b]?.c; return A && B ? Math.hypot(A[0] - B[0], A[1] - B[1]) : 0; };

// Resumo para o Observatório e relatórios.
export function warSummary(s, data) {
  const W = s.world, ws = W.ws || {};
  const dm = Object.entries(W.dmg || {}).filter(([, D]) => D[0] >= 5);
  const res = Object.entries(W.res || {}).filter(([, R]) => R[0] >= 40);
  let t = 0, dd = 0; for (const pid in data.geo.prov) { const k = popK(data, pid); t += k; const D = W.dmg?.[pid]; if (D) dd += k * D[0] / 100; }
  return { mil: ws.mil || 0, civ: ws.civ || 0, ref: ws.ref || 0, lost: ws.lost || 0, revolts: ws.revolts || 0, devastated: dm.length, insurg: res.length, destruction: t ? dd / t * 100 : 0,
    worst: dm.sort((a, b) => b[1][0] * popK(data, b[0]) - a[1][0] * popK(data, a[0])).slice(0, 15), hot: res.sort((a, b) => b[1][0] - a[1][0]).slice(0, 15) };
}
