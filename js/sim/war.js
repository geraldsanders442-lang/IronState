import { clamp, chance, rand } from './util.js';
import { militaryPower } from './model.js';
import { warFactors, onCapture } from './armies.js';
import { munisOf, frontOrder } from './munis.js';
import { macroTargets, macroTerm, macroScoreBonus } from './macros.js';
import { weeklyOccupation, weeklyWarEvents, weeklyEnemyOps, weeklyAllies, manpowerMult } from './warevents.js';
import { battleMods } from './terrain.js';
import { commandMods, settleMedals } from './campaign.js';
import { weeklyAsym } from './asym.js';
import { entOf, PLY, aiPower, ownerOf, provincesOf, setOwner, territoryChanged, defenseAllies, relAI, shiftRelAI, playerNeighbors, addLoan, components } from './world.js';

const day = s => Math.floor(s.time.min / 1440);
export const GOALS = {
  border: { name: 'Região fronteiriça', desc: 'Tomar províncias de fronteira. Reação internacional moderada.', rep: -6 },
  puppet: { name: 'Estado cliente', desc: 'Forçar um governo submisso, sem anexação formal.', rep: -8 },
  annex: { name: 'Anexação total', desc: 'Absorver todo o país. Exige domínio esmagador; condenação severa.', rep: -18 },
  regime: { name: 'Mudança de regime', desc: 'Derrubar o governo inimigo e impor um aliado ideológico.', rep: -10 },
  macro: { name: 'Macro-região customizada', desc: 'Conquistar a macro-região definida por você no mapa: a ofensiva prioriza suas províncias e a paz pode exigi-la inteira.', rep: -8 },
  defend: { name: 'Defesa', desc: 'Repelir a agressão e restaurar as fronteiras.', rep: 0 },
};
export const ent = entOf;
export const entName = (s, data, id) => id === PLY ? s.nation.shortName : ent(s, data, id)?.name || id;

// Chances antes de declarar guerra: razão de forças contando aliados que entrariam do outro lado.
export function oddsAgainst(s, data, id) {
  const c = s.world.c[id]; if (!c) return null;
  const allies = [...(defenseAllies(s, data, id) || [])].filter(a => a !== id && a !== PLY && s.world.c[a]);
  const en = aiPower(c) + allies.reduce((t, a) => t + aiPower(s.world.c[a]) * 0.5, 0);
  return { ratio: militaryPower(s) / Math.max(0.05, en), allies: allies.length };
}
export function canDeclareOn(s, data, id) {
  const c = s.world.c[id], p = s.partners[id];
  if (!c || c.dep) return 'Território dependente: declare guerra ao soberano';
  if (s.wars.some(w => w.active && w.enemies.includes(id))) return 'Já em guerra';
  if (s.wars.filter(w => w.active).length >= 2) return 'Guerras demais em andamento';
  if (!playerNeighbors(s, data).has(id) && s.st.projection < 45) return 'Sem fronteira e sem projeção externa (≥ 45)';
  if (p.pact) return 'Há tratado de defesa';
  if ((s.treaties || []).some(t => t.with === id && t.kind === 'nonagg' && t.until > day(s))) return 'Pacto de não agressão em vigor';
  if (p.rel > -10 && !s.flags.casusBelli && !(p.pretext > day(s)) && !s.world.claims.some(x => x.holder === id && x.claimant === PLY)) return 'Sem pretexto (relação > −10 e sem reivindicação)';
  if (s.st.readiness < 25) return 'Prontidão abaixo de 25';
  return null;
}

// Fabricar um pretexto (provocação, incidente forjado ou denúncia): custa reputação e pode virar escândalo.
export function fabricatePretext(s, data, id) {
  const p = s.partners[id]; if (!p) return { ok: false, msg: '' };
  if ((p.pretextCd || 0) > day(s)) return { ok: false, msg: 'Aguarde antes de nova provocação contra este país.' };
  p.pretextCd = day(s) + 60;
  s.st.reputation = clamp(s.st.reputation - 4, 0, 100); p.rel -= 8;
  if (chance(0.55 + s.st.intel / 250)) { p.pretext = day(s) + 150; return { ok: true, log: true, msg: `Incidente de fronteira "forjado" contra ${entName(s, data, id)}: você ganha um pretexto para guerra por cerca de 5 meses.` }; }
  s.st.reputation = clamp(s.st.reputation - 4, 0, 100); s.st.legitimacy = clamp(s.st.legitimacy - 2, 0, 100);
  return { ok: false, log: true, msg: 'A provocação é desmascarada pela imprensa: escândalo diplomático.' };
}

export function joinCoalitions(s, data, w, log, late = 0) {
  const W = s.world;
  for (const id of defenseAllies(s, data, w.enemies[0])) {
    if (id === PLY || w.enemies.includes(id) || !W.c[id] || W.c[id].dep) continue;
    const rp = s.partners[id]?.rel ?? 0;
    const collective = data.wOrgs.some(o => o.kind === 'collective' && W.orgs[o.id]?.members.includes(id) && W.orgs[o.id].members.includes(w.enemies[0]));
    const pJoin = ((collective ? 0.75 : 0.45) * (w.aggressor ? 1 : 0.4) - (rp > 30 ? 0.5 : 0)) * (late || 1);
    if (chance(pJoin)) { w.enemies.push(id); s.partners[id].rel = clamp(s.partners[id].rel - 40, -100, 100); log(`${entName(s, data, id)} entra na guerra ao lado de ${entName(s, data, w.enemies[0])}!`, 'war'); }
  }
  // Protetores informais: potências muito próximas da vítima podem intervir mesmo sem tratado.
  if (w.aggressor) for (const id in W.c) {
    if (id === w.enemies[0] || w.enemies.includes(id) || W.c[id].dep) continue;
    const ra = relAI(s, data, id, w.enemies[0]), rp = s.partners[id]?.rel ?? 0;
    const great = W.c[id].gdp > 3000;
    if (ra >= (great ? 50 : 60) && rp < 30 && aiPower(W.c[id]) > aiPower(W.c[w.enemies[0]]) && chance((0.3 + (ra - 55) / 100) * (late || 1))) { w.enemies.push(id); s.partners[id].rel = clamp(rp - 35, -100, 100); log(`${entName(s, data, id)} intervém em defesa de ${entName(s, data, w.enemies[0])}!`, 'war'); }
  }
  if (!late) for (const id of defenseAllies(s, data, PLY)) {
    if (w.enemies.includes(id) || w.allies.includes(id) || !W.c[id] || W.c[id].dep) continue;
    const rp = s.partners[id]?.rel ?? 0, re = relAI(s, data, id, w.enemies[0]);
    const pJoin = (w.aggressor ? 0.15 : 0.6) + (rp - 40) / 150 - (re > 30 ? 0.4 : 0);
    if (chance(pJoin)) { w.allies.push(id); log(`${entName(s, data, id)} honra a aliança e entra na guerra ao seu lado.`, 'good'); }
  }
}

export function startWar(s, data, enemy, { aggressor, goal, claim, macro }, log) {
  const w = { id: 'w' + day(s) + '_' + enemy, enemy, enemies: [enemy], allies: [], aggressor, goal: goal || (aggressor ? 'border' : 'defend'), start: day(s), score: 0, stance: aggressor ? 'offensive' : 'defensive',
    target: null, etarget: null, siege: null, mySiege: null, target2: null, etarget2: null, resist: 0, cas: 0, enemyCas: 0, cost: 0, log: [], active: true, reinforce: 0, enemyExh: 0, claim: claim?.id || null, macro: macro || null, gained: [], lost: [] };
  s.wars.push(w);
  const nm = entName(s, data, enemy);
  if (aggressor) {
    s.st.reputation = clamp(s.st.reputation + GOALS[w.goal].rep, 0, 100);
    s.groups.military = clamp(s.groups.military + 6, 0, 100); s.groups.youth = clamp(s.groups.youth - 5, 0, 100); s.groups.business = clamp(s.groups.business - 4, 0, 100);
    for (const id in s.partners) if (id !== enemy) { const tol = ent(s, data, id)?.profile?.liberty ?? 50; s.partners[id].rel -= (relAI(s, data, id, enemy) > 30 ? 12 : 3) + (tol > 70 ? 4 : 0); }
    log(`${s.nation.shortName} declarou guerra a ${nm} (objetivo: ${GOALS[w.goal].name}).`, 'war');
  } else {
    for (const g in s.groups) s.groups[g] = clamp(s.groups[g] + 3, 0, 100);
    log(`${nm} invadiu ${s.nation.shortName}! O país está em guerra.`, 'war');
  }
  s.partners[enemy].rel = -85; s.partners[enemy].trade = false; s.partners[enemy].pact = false;
  if (s.flags.casusBelli) delete s.flags.casusBelli;
  joinCoalitions(s, data, w, log);
  return w;
}

// Municípios em guerra: cada frente avança município a município (do lado atacante para o fundo da província).
const sidePts = (s, data, pid, side, w) => {
  const W = s.world, mineOrHeld = n => W.occ[n] === PLY || (ownerOf(s, data, n) === PLY && !W.occ[n]), enemyHeld = n => w.enemies.includes(ownerOf(s, data, n)) || w.enemies.includes(W.occ[n]);
  return (data.geo.prov[pid].nb || []).filter(side === 'atk' ? mineOrHeld : enemyHeld).map(n => data.geo.prov[n]?.c).filter(Boolean);
};
function cellFront(s, data, w, T, side) {
  const P = data.geo.prov[T.pid]; if (!P) return;
  if (!T.order) T.order = frontOrder(P, sidePts(s, data, T.pid, side, w));
  const M = munisOf(P), k = Math.floor(clamp(T.p, 0, 99.9) / 100 * M.cells.length), prev = T.k || 0;
  if (k > prev) { for (let i = prev; i < k; i++) { const c = M.byI[T.order[i]]; if (c) w.log.unshift({ day: day(s), text: side === 'atk' ? `Tropas avançam e tomam ${c.name}.` : `O inimigo avança sobre ${c.name}.` }); } }
  T.k = k;
  if (w.log.length > 40) w.log.length = 40;
}
const myProv = (s, data) => provincesOf(s, data, PLY);
function frontProvinces(s, data, w) {
  const enemyOwned = new Set(w.enemies.flatMap(e => provincesOf(s, data, e)));
  const mineOrHeld = new Set([...myProv(s, data), ...Object.keys(s.world.occ).filter(p => s.world.occ[p] === PLY)]);
  const atk = [], def = [];
  for (const p of enemyOwned) if (s.world.occ[p] !== PLY && data.geo.prov[p].nb.some(n => mineOrHeld.has(n) && s.world.occ[n] !== w.enemy)) atk.push(p);
  for (const p of myProv(s, data)) if (!s.world.occ[p] && data.geo.prov[p].nb.some(n => enemyOwned.has(n) && s.world.occ[n] !== PLY)) def.push(p);
  // Contra-ofensiva: o inimigo também tenta retomar o que você ocupou.
  for (const p of w.gained) if (s.world.occ[p] === PLY && data.geo.prov[p].nb.some(n => enemyOwned.has(n) && s.world.occ[n] !== PLY)) def.push(p);
  // Sem fronteira terrestre: operações anfíbias contra províncias costeiras (exige projeção).
  let amphib = false;
  if (!atk.length && s.st.projection >= 12) { for (const p of enemyOwned) if (data.geo.prov[p].coast && s.world.occ[p] !== PLY) atk.push(p); amphib = atk.length > 0; }
  if (!def.length) { const eq = w.enemies.reduce((m, e) => Math.max(m, s.world.c[e]?.equip || 0), 0); if (eq > 55) for (const p of myProv(s, data)) if (data.geo.prov[p].coast && !s.world.occ[p]) def.push(p); }
  return { atk: macroTargets(s, w, atk), def, enemyOwned, amphib };
}

function pickTarget(s, data, list, capital) {
  if (!list.length) return null;
  if (capital && list.includes(capital)) return capital;
  return list.reduce((b, p) => (data.geo.prov[p].pop || 0) > (data.geo.prov[b].pop || 0) ? p : b, list[0]);
}

const capitalOf = (s, data, id) => id === PLY ? s.nation.capitalProv : (s.world.c[id]?.capitalProv || ent(s, data, id)?.capital?.prov);

export function weeklyWar(s, data, ctx) {
  for (const w of s.wars) if (w.active && !w.pendingTerms) { if (w.truce > 0) { w.truce--; if (!w.truce) ctx.log(`A trégua com ${entName(s, data, w.enemy)} terminou; os combates recomeçam.`, 'warn'); continue; } warWeek(s, data, w, ctx); }
}

// Relatório de batalha por frente (usado pela mesa de operações).
function report(w, s, side, key, T, eff, bm, p0, tac) {
  (w.reports ||= []).unshift({ day: day(s), side, front: key, pid: T.pid, p: Math.round(T.p), dp: +(T.p - p0).toFixed(1), eff: +eff.toFixed(2), terrain: bm?.tname || '', def: bm?.def || 1, tac });
  if (w.reports.length > 24) w.reports.length = 24;
}
function warWeek(s, data, w, ctx) {
  const W = s.world, log = ctx.log;
  const E = w.enemies.map(id => W.c[id]).filter(Boolean);
  if (!E.length || !provincesOf(s, data, w.enemy).length) return endWar(s, data, w, 'victory', ctx);
  const allyPow = w.allies.reduce((t, id) => t + (W.c[id] ? aiPower(W.c[id]) * 0.5 : 0), 0);
  const morale = 0.55 + s.st.stability / 250 - s.st.warWeariness / 350;
  const supply = 0.65 + s.st.logistics / 160 + s.st.milIndustry / 600;
  const stance = { offensive: 1, defensive: 0.85, hold: 0.7 }[w.stance];
  const my = (militaryPower(s) * supply * morale * (s.mobilized > 0 ? 1.2 : 1) * (w.reinforce > 0 ? 1.18 : 1) * manpowerMult(s) + allyPow) * stance;
  const enMorale = E.reduce((t, c) => t + c.stab, 0) / E.length / 100 * 0.5 + 0.55 - w.enemyExh / 300;
  const en = E.reduce((t, c) => t + aiPower(c), 0) * enMorale * (w.supportEnemy ? 1.2 : 1);
  const F = warFactors(s, data, w);
  const C = commandMods(s, data, w);
  const ratio = my * F.air * C.atk * (w.stance === 'offensive' ? F.atk : 1) / Math.max(0.05, en) * (w.estance === 'entrenched' ? 0.92 : 1);
  w.ratio = ratio; w.factors = F; w.reinforce = Math.max(0, w.reinforce - 1);
  const { atk, def, amphib } = frontProvinces(s, data, w);
  w.amphibious = amphib;
  const ecap = capitalOf(s, data, w.enemy), mycap = s.nation.capitalProv;

  // Ofensiva do jogador: frente principal e, com 2+ corpos de ataque, uma frente secundária.
  if (w.stance === 'offensive' && atk.length) {
    const attN = (s.forces?.corps || []).filter(c => c.war === w.id && c.role === 'attack').length;
    const two = attN >= 2 && atk.length > 1;
    if (!two) w.target2 = null;
    const fronts = two ? [['target', 0.9], ['target2', 0.7]] : [['target', 1]];
    for (const [key, mult] of fronts) {
      const other = key === 'target' ? w.target2 : w.target;
      if (!w[key] || !atk.includes(w[key].pid) || (other && other.pid === w[key].pid)) {
        const pool = atk.filter(p => p !== other?.pid);
        w[key] = pool.length ? { pid: pickTarget(s, data, pool, key === 'target' && w.goal !== 'border' ? ecap : null), p: 0 } : null;
      }
      const T = w[key]; if (!T) continue;
      cellFront(s, data, w, T, 'atk');
      const bm = battleMods(data, T.pid, day(s), T.pid === ecap);
      const terrain = (T.pid === ecap ? 0.7 : data.geo.prov[T.pid].coast ? 1 : 0.92) * bm.season / bm.def * (amphib ? 0.3 + s.st.projection / 250 + F.naval * 0.5 : 1);
      const depth = 1 / Math.sqrt((data.geo.prov[T.pid].a || 5000) / 8000 + 1) * (T.pid === ecap ? 0.6 : 1);
      const p0 = T.p; T.p += clamp(((ratio * mult * C.front(key) * terrain - 0.95) * 22 + rand(-6, 6)) * depth, -15, 22 + Math.min(18, Math.max(0, ratio - 3) * 3));
      if (T.p < 0) T.p = 0;
      report(w, s, 'atk', key, T, ratio * mult * C.front(key) * terrain, bm, p0, w.cmd?.mode === 'general' ? w.cmd.orders[key] : null);
      if (T.p >= 100) {
        const pid = T.pid;
        W.occ[pid] = PLY; territoryChanged(s); w.gained.push(pid); w[key] = null;
        const hero = onCapture(s, w, pid, pid === ecap);
        const cE = W.c[w.enemy]; if (cE) { cE.stab = clamp(cE.stab - 3, 0, 100); }
        w.score += 8 + (pid === ecap ? 25 : 0);
        w.log.unshift({ day: day(s), text: `Tropas${hero ? ' de ' + hero : ''} tomam ${data.geo.prov[pid].n}.` });
        if (pid === ecap) { log(`A capital de ${entName(s, data, w.enemy)} caiu! O governo inimigo vacila.`, 'good'); w.enemyExh += 35; if (W.c[w.enemy]) W.c[w.enemy].nego += 30; }
        else log(`${s.nation.shortName} conquista ${data.geo.prov[pid].n}.`, 'war');
      }
    }
  } else { w.target2 = null; }
  // Contraofensiva inimiga: ataca terras suas e províncias ocupadas por você; coalizões abrem uma segunda frente.
  const enemyPush = (1 / Math.max(0.05, ratio)) * (w.stance === 'hold' ? 0.75 : 1) * (w.estance === 'surge' ? 1.12 : 1);
  if (def.length && (enemyPush > 0.95 || chance(0.2))) {
    const dfronts = w.enemies.length > 1 && def.length > 1 ? [['etarget', 1], ['etarget2', 0.7]] : [['etarget', 1]];
    if (dfronts.length === 1) w.etarget2 = null;
    for (const [key, mult] of dfronts) {
      const other = key === 'etarget' ? w.etarget2 : w.etarget;
      if (!w[key] || !def.includes(w[key].pid) || (other && other.pid === w[key].pid)) {
        const pool = def.filter(p => p !== other?.pid && (key === 'etarget' || p !== mycap));
        // 40% das vezes o inimigo prefere retomar terreno que você ocupou.
        const libs = pool.filter(p => W.occ[p] === PLY), src = libs.length && chance(0.4) ? libs : pool;
        w[key] = pool.length ? { pid: pickTarget(s, data, src, key === 'etarget' ? mycap : null), p: 0 } : null;
      }
      const T = w[key]; if (!T) continue;
      cellFront(s, data, w, T, 'def');
      const isLib = W.occ[T.pid] === PLY;
      const bmE = battleMods(data, T.pid, day(s), T.pid === mycap);
      const fort = (1 + s.st.defense / 200 + (w.stance === 'hold' ? 0.2 : 0)) * C.def * F.def * (0.9 + F.airSup * 0.2) * (isLib ? 0.85 : 1) * bmE.def;
      const edepth = 1 / Math.sqrt((data.geo.prov[T.pid].a || 5000) / 8000 + 1) * (T.pid === mycap ? 0.6 : 1);
      const p0 = T.p; T.p += clamp((((enemyPush * mult * bmE.season) / fort - 0.95) * 22 + rand(-6, 6)) * edepth, -15, 22);
      if (T.p < 0) T.p = 0;
      report(w, s, 'def', key, T, (enemyPush * mult * bmE.season) / fort, bmE, p0, w.cmd?.mode === 'general' ? w.cmd.orders.def : null);
      if (key === 'etarget') {
        if (T.pid === mycap && T.p > 25 && !w.mySiege) { w.mySiege = { p: T.p }; ctx.siegeCard(w); }
        if (w.mySiege) w.mySiege.p = T.p;
      }
      if (T.p >= 100) {
        const pid = T.pid; w[key] = null;
        if (isLib) {
          delete W.occ[pid]; w.gained = w.gained.filter(x => x !== pid); territoryChanged(s);
          w.enemyExh = clamp(w.enemyExh - 3, 0, 100);
          w.log.unshift({ day: day(s), text: `Contra-ataque inimigo retoma ${data.geo.prov[pid].n}.` });
          log(`${entName(s, data, w.enemy)} retoma ${data.geo.prov[pid].n}.`, 'bad');
          continue;
        }
        const occShare = (data.geo.prov[pid].pop || 0) / Math.max(1, s.econ.pop * 1e6);
        W.occ[pid] = w.enemy; territoryChanged(s); w.lost.push(pid);
        s.econ.gdp *= 1 - occShare * 0.8; w.score -= 8;
        w.log.unshift({ day: day(s), text: `Perdemos ${data.geo.prov[pid].n}.` });
        log(`${entName(s, data, w.enemy)} ocupa ${data.geo.prov[pid].n}.`, 'bad');
        if (pid === mycap) { capitalFalls(s, data, w, ctx); if (s.over) return; }
      }
    }
  }
  // Perdas, custos e exaustão
  const intensity = w.stance === 'hold' ? 0.5 : 1;
  const myLoss = s.st.troops * 0.004 * intensity * C.loss * clamp(1.3 - ratio * 0.3, 0.5, 1.6);
  s.st.troops = Math.max(1, s.st.troops - myLoss); w.cas += myLoss;
  (w.weeks ||= []).unshift({ day: day(s), my: +myLoss.toFixed(2), ratio: +ratio.toFixed(2), _e0: w.enemyCas }); if (w.weeks.length > 16) w.weeks.length = 16;
  for (const c of E) { const l = c.troops * 0.004 * intensity * clamp(0.7 + ratio * 0.3, 0.5, 1.6); c.troops = Math.max(1, c.troops - l); w.enemyCas += l; c.stab = clamp(c.stab - 0.5, 5, 95); }
  if (w.weeks?.[0]) w.weeks[0].en = +(w.enemyCas - (w.weeks[0]._e0 || 0)).toFixed(2);
  s.st.equipment = Math.max(1, s.st.equipment - 0.2 * intensity);
  w.cost += s.econ.gdp * 0.035 / 52;
  w.enemyExh = clamp(w.enemyExh + 1.5 * intensity + (ratio > 1 ? 1 : 0), 0, 100);
  const occE = w.gained.filter(p => W.occ[p] === PLY).reduce((t, p) => t + (data.geo.prov[p].pop || 0), 0);
  const ePop = E[0].pop * 1e6 || 1;
  const occM = w.lost.filter(p => W.occ[p] === w.enemy).reduce((t, p) => t + (data.geo.prov[p].pop || 0), 0);
  const eProvAll = provincesOf(s, data, w.enemy).length || 1;
  const areaShare = w.gained.filter(p => W.occ[p] === PLY).length / eProvAll;
  w.score = clamp(occE / ePop * 120 + areaShare * 90 - occM / Math.max(1, s.econ.pop * 1e6) * 200 + clamp(ratio - 1, -2, 2) * 8 + (W.occ[ecap] === PLY ? 15 : 0) + macroScoreBonus(s, data, w), -100, 100);
  if ((day(s) - w.start) % 7 === 0) {
    const why = [`força relativa ${ratio.toFixed(2)}×`];
    if (s.st.logistics < 40) why.push('logística deficiente'); else if (s.st.logistics > 65) why.push('boa logística');
    if (morale < 0.7) why.push('moral baixo'); if (allyPow > 0) why.push(`aliados: ${w.allies.map(a => entName(s, data, a)).join(', ')}`);
    if (w.enemies.length > 1) why.push(`coalizão inimiga de ${w.enemies.length}`);
    if (w.stance === 'hold') why.push('postura defensiva');
    w.log.unshift({ day: day(s), text: `Semana de combate: ${why.join('; ')}. Placar de guerra ${Math.round(w.score)}.` });
    if (w.log.length > 40) w.log.length = 40;
  }
  weeklyEnemyOps(s, data, w, ctx);
  weeklyAllies(s, data, w, ctx);
  weeklyOccupation(s, data, w, ctx);
  weeklyWarEvents(s, data, w, ctx);
  weeklyAsym(s, data, w, ctx);
  // Capitulação inimiga
  if (w.score > 70 && (w.enemyExh > 70 || W.occ[ecap] === PLY) && !w.pendingTerms) { w.pendingTerms = true; ctx.terms(w); log(`${entName(s, data, w.enemy)} pede a rendição. Defina os termos.`, 'good'); }
  else if (w.score < -75 && s.st.warWeariness > 60) ctx.forcedPeace(w);
}

function capitalFalls(s, data, w, ctx) {
  const evac = s.flags.evacuated;
  const encircle = data.geo.prov[s.nation.capitalProv].nb.filter(n => s.world.occ[n] && s.world.occ[n] !== PLY).length / Math.max(1, data.geo.prov[s.nation.capitalProv].nb.length);
  const pCapture = evac ? 0.01 : clamp(0.04 + encircle * 0.3 + (s.st.stability < 30 ? 0.1 : 0) + (w.ratio < 0.5 ? 0.1 : 0), 0.02, 0.6);
  if (chance(pCapture)) {
    s.over = { ending: 'captured', cause: `A capital caiu diante de ${entName(s, data, w.enemy)} (chance de captura ${(pCapture * 100).toFixed(0)}%)`, day: day(s) };
    return;
  }
  relocateCapital(s, data, w.enemy);
  s.st.legitimacy = clamp(s.st.legitimacy - (evac ? 12 : 22), 0, 100);
  s.st.stability = clamp(s.st.stability - 15, 0, 100);
  s.st.logistics = clamp(s.st.logistics - 12, 0, 100);
  s.st.reputation = clamp(s.st.reputation - 6, 0, 100);
  ctx.log(`A capital caiu. O governo ${evac ? 'já evacuado' : 'escapou por pouco e'} se instala em ${data.geo.prov[s.nation.capitalProv]?.n}.`, 'war');
  ctx.notify('A capital caiu', `As tropas de ${entName(s, data, w.enemy)} entraram na capital. ${evac ? 'A evacuação planejada garantiu a continuidade do governo' : `O governante escapou por pouco (risco de captura era ${(pCapture * 100).toFixed(0)}%)`}. A nova sede do governo é ${data.geo.prov[s.nation.capitalProv]?.n}.`);
  delete s.flags.evacuated; w.mySiege = null;
}

export function relocateCapital(s, data, enemy) {
  const mine = myProv(s, data).filter(p => !s.world.occ[p]);
  const safe = mine.filter(p => !data.geo.prov[p].nb.some(n => s.world.occ[n] || (enemy && ownerOf(s, data, n) === enemy)));
  const pool = safe.length ? safe : mine;
  if (!pool.length) return;
  const best = pool.reduce((b, p) => (data.geo.prov[p].pop || 0) > (data.geo.prov[b].pop || 0) ? p : b, pool[0]);
  s.nation.capitalProv = best;
  s.nation.capital = data.geo.prov[best].n;
}

export function warAction(s, data, w, key, ctx) {
  const g = s.econ.gdp;
  if (key === 'offensive' || key === 'defensive' || key === 'hold') { w.stance = key; return { ok: true, msg: `Postura alterada: ${{ offensive: 'ofensiva', defensive: 'defensiva', hold: 'manter posições' }[key]}.` }; }
  if (key === 'reinforce') {
    if (s.econ.treasury < g * 0.002) return { ok: false, msg: 'Tesouro insuficiente.' };
    s.econ.treasury -= g * 0.002; w.reinforce = 4; if (w.mySiege && w.etarget) w.etarget.p = Math.max(0, w.etarget.p - 25);
    return { ok: true, msg: 'Reforços enviados ao front por 4 semanas.' };
  }
  if (key === 'allies') {
    const cand = Object.keys(s.partners).filter(id => s.partners[id].rel > 40 && s.world.c[id] && !s.world.c[id].dep && !w.allies.includes(id) && !w.enemies.includes(id));
    let joined = 0;
    for (const id of cand) { const p = 0.05 + (s.partners[id].rel - 40) / 200 + (s.partners[id].pact ? 0.3 : 0) - (w.aggressor ? 0.1 : 0) - (relAI(s, data, id, w.enemy) > 20 ? 0.3 : 0); if (chance(p)) { w.allies.push(id); joined++; ctx.log(`${entName(s, data, id)} atende ao pedido e entra na guerra.`, 'good'); } }
    s.counters.allyAsk = day(s) + 30;
    return { ok: joined > 0, msg: joined ? `${joined} país(es) entraram na guerra ao seu lado.` : 'Nenhum aliado aceitou intervir.' };
  }
  if (key === 'evacuate') {
    s.flags.evacuated = 1; s.st.legitimacy = clamp(s.st.legitimacy - 5, 0, 100);
    return { ok: true, msg: 'Ministérios e reservas evacuados. Se a capital cair, o governo continuará funcionando.' };
  }
  if (key === 'withdraw') {
    for (const p of w.gained) if (s.world.occ[p] === PLY) delete s.world.occ[p];
    territoryChanged(s);
    s.st.legitimacy = clamp(s.st.legitimacy - 8, 0, 100); s.groups.military = clamp(s.groups.military - 10, 0, 100);
    endWar(s, data, w, 'withdrawal', ctx);
    return { ok: true, msg: 'Tropas retiradas. O conflito terminou sem vitória.' };
  }
  return { ok: false, msg: '?' };
}

// Probabilidade de aceitar um cessar-fogo branco ou com concessões.
export function ceasefireChance(s, data, w, concede) {
  const c = s.world.c[w.enemy];
  return clamp(0.1 + (day(s) - w.start) / 700 + w.enemyExh / 160 + (c?.nego ?? 40) / 300 - w.score / -250 + (concede ? 0.35 : 0) - (w.score < -40 && !concede ? 0.3 : 0), 0.03, 0.95);
}
export function proposeCeasefire(s, data, w, concede, ctx) {
  const p = ceasefireChance(s, data, w, concede);
  if (!chance(p)) { ctx.log(`${entName(s, data, w.enemy)} rejeitou a proposta (chance ${(p * 100).toFixed(0)}%).`, 'warn'); return false; }
  if (concede) { applyTerms(s, data, w, { cede: w.lost.filter(x => s.world.occ[x] === w.enemy) }, ctx, true); return true; }
  for (const p2 of w.gained) if (s.world.occ[p2] === PLY) delete s.world.occ[p2];
  for (const p2 of w.lost) if (s.world.occ[p2] === w.enemy) delete s.world.occ[p2];
  territoryChanged(s);
  endWar(s, data, w, 'ceasefire', ctx);
  return true;
}

// Termos de paz possíveis conforme o placar de guerra.
export function availableTerms(s, data, w) {
  const occ = w.gained.filter(p => s.world.occ[p] === PLY);
  const ecap = capitalOf(s, data, w.enemy);
  const eprov = provincesOf(s, data, w.enemy);
  const occShare = occ.length / Math.max(1, eprov.length);
  return [
    { key: 'cession', name: `Ceder as ${occ.length} província(s) ocupadas`, ok: occ.length > 0, why: 'Exige ocupar território inimigo.' },
    { key: 'reparations', name: 'Reparações de guerra (6% do PIB inimigo em um ano)', ok: w.score > 25, why: 'Placar de guerra > 25.' },
    { key: 'restrict', name: 'Restrições militares ao inimigo', ok: w.score > 35, why: 'Placar > 35.' },
    { key: 'puppet', name: 'Transformar em Estado cliente', ok: w.score > 55 && s.world.occ[ecap] === PLY, why: 'Placar > 55 e capital inimiga ocupada.' },
    { key: 'regime', name: 'Mudança de regime', ok: w.score > 60 && s.world.occ[ecap] === PLY, why: 'Placar > 60 e capital inimiga ocupada.' },
    { key: 'split', name: 'Dividir em Estados sucessores', ok: w.score > 75 && eprov.length >= 6 && occShare > 0.4, why: 'Placar > 75, 40% do território ocupado e ao menos 6 províncias.' },
    ...(w.macro ? (() => { const t = macroTerm(s, data, w); return t ? [{ key: 'macro', name: `Anexar a macro-região «${t.m.name}» (${t.occ.length}/${t.foreign.length} províncias ocupadas)`, ok: t.occ.length > 0 && t.share >= 0.5 && w.score > 30, why: 'Ocupar ao menos metade da macro-região inimiga e placar > 30.' }] : []; })() : []),
    { key: 'annex', name: 'Anexação total', ok: w.score > 85 && occShare > 0.55 && s.world.occ[ecap] === PLY, why: 'Placar > 85, capital e mais da metade do território ocupados.' },
  ];
}

export function applyTerms(s, data, w, terms, ctx, playerConceded = false) {
  const W = s.world, enemy = w.enemy, nm = entName(s, data, enemy), c = W.c[enemy];
  const out = [];
  if (playerConceded) {
    for (const p of terms.cede || []) { transfer(s, data, [p], enemy); }
    out.push(`cedeu ${terms.cede?.length || 0} província(s)`);
    s.st.legitimacy = clamp(s.st.legitimacy - 12, 0, 100); s.flags.lostWar = 1;
    endWar(s, data, w, 'concession', ctx);
    ctx.log(`Paz com ${nm}: ${s.nation.shortName} ${out.join(', ')}.`, 'bad');
    return;
  }
  const occ = w.gained.filter(p => W.occ[p] === PLY);
  const k = terms.key;
  if (k === 'cession' || k === 'annex' || k === 'puppet' || k === 'regime' || k === 'split' || k === 'reparations' || k === 'restrict' || k === 'macro') {
    if (k === 'macro') { const t = macroTerm(s, data, w); if (t) { transfer(s, data, t.occ, PLY); out.push(`anexou a macro-região «${t.m.name}» (${t.occ.length} províncias)`); } }
    if (k === 'cession') { transfer(s, data, occ, PLY); out.push(`anexou ${occ.length} província(s)`); }
    for (const p of occ) if (W.occ[p] === PLY && k !== 'cession' && k !== 'annex') delete W.occ[p];
    if (k === 'annex') { transfer(s, data, provincesOf(s, data, enemy), PLY); out.push(`anexou todo o território de ${nm}`); }
    if (k === 'reparations' && c) { addLoan(s, { lender: PLY, borrower: enemy, principal: c.gdp * 0.06, rate: 0, weeks: 52, kind: 'reparations' }); out.push('impôs reparações'); }
    if (k === 'restrict' && c) { c.troops *= 0.5; c.equip *= 0.7; out.push('impôs restrições militares'); }
    if (k === 'puppet' && c) { c.puppetOf = PLY; s.partners[enemy].rel = 50; s.partners[enemy].trade = true; s.partners[enemy].pact = true; out.push('tornou-o Estado cliente'); }
    if (k === 'regime' && c) { c.ax = { ...s.nation.ideology.axes }; c.regimeChanged = true; s.partners[enemy].rel = 45; s.partners[enemy].trust = 50; out.push('instalou um governo alinhado'); }
    if (k === 'split') { const n = splitCountry(s, data, enemy, ctx); out.push(`dividiu ${nm} em ${n} Estados sucessores`); }
    const rep = { macro: -6, cession: -5, annex: -18, puppet: -6, regime: -8, split: -12, reparations: -2, restrict: -2 }[k];
    s.st.reputation = clamp(s.st.reputation + rep, 0, 100);
    if (['annex', 'split'].includes(k)) for (const id in s.partners) { const lib = ent(s, data, id)?.profile?.liberty ?? 50; if (lib > 55 && !s.partners[id].pact) { s.partners[id].rel -= 12; if (s.partners[id].rel < -40 && chance(0.5)) s.partners[id].sanctionsBy = true; } }
    if (k === 'cession' || k === 'annex') W.claims.push({ id: 'revanche_' + enemy + '_' + day(s), claimant: enemy, holder: PLY, provs: k === 'annex' ? [] : occ, type: 'revanchist', just: `${nm} exige a devolução das províncias perdidas na guerra.`, strat: 60, dom: 90, risk: 70, status: 'active', src: 'war' });
  }
  for (const p of w.lost) if (W.occ[p] === enemy) delete W.occ[p];
  territoryChanged(s);
  s.flags.wonWar = 1;
  endWar(s, data, w, 'victory', ctx);
  ctx.log(`Tratado de paz com ${nm}: ${s.nation.shortName} ${out.join(', ') || 'impôs paz branca'}.`, 'good');
}

// Transfere províncias entre donos e ajusta população/PIB do jogador.
export function transfer(s, data, pids, to) {
  for (const pid of pids) {
    const P = data.geo.prov[pid], from = ownerOf(s, data, pid);
    if (from === to) { delete s.world.occ[pid]; continue; }
    const popM = (P.pop || 0) / 1e6;
    const srcC = s.world.c[from];
    const gdppc = from === PLY ? s.econ.gdp / Math.max(0.01, s.econ.pop) : srcC ? srcC.gdp / Math.max(0.01, srcC.pop) : 2;
    const gdp = popM * gdppc * 0.8;
    if (to === PLY) { s.econ.pop += popM; s.econ.gdp += gdp; s.flags.occupied = (s.flags.occupied || 0) + (from !== PLY ? 1 : 0); }
    if (from === PLY) { s.econ.pop = Math.max(0.05, s.econ.pop - popM); s.econ.gdp = Math.max(0.1, s.econ.gdp - gdp); }
    if (srcC) { srcC.pop = Math.max(0.01, srcC.pop - popM); srcC.gdp = Math.max(0.01, srcC.gdp - gdp); }
    if (s.world.c[to]) { s.world.c[to].pop += popM; s.world.c[to].gdp += gdp; }
    setOwner(s, data, pid, to);
    s.nation.area = Math.max(1, (s.nation.area || 0) + (to === PLY ? P.a : from === PLY ? -P.a : 0));
  }
  for (const id in s.world.c) if (!provincesOf(s, data, id).length) delete s.world.c[id];
  s.regionsDirty = true;
}

// Divide um país derrotado em Estados sucessores (agrupando províncias por proximidade).
export function splitCountry(s, data, id, ctx) {
  const pids = provincesOf(s, data, id);
  const k = Math.min(3, Math.max(2, Math.floor(pids.length / 4)));
  const pts = pids.map(p => data.geo.prov[p].c);
  let cent = pts.filter((_, i) => i % Math.max(1, Math.floor(pts.length / k)) === 0).slice(0, k);
  let asg = [];
  for (let it = 0; it < 8; it++) {
    asg = pts.map(p => cent.reduce((b, c, j) => (Math.hypot(p[0] - c[0], p[1] - c[1]) < Math.hypot(p[0] - cent[b][0], p[1] - cent[b][1]) ? j : b), 0));
    cent = cent.map((c, j) => { const m = pts.filter((_, i) => asg[i] === j); return m.length ? [m.reduce((a, p) => a + p[0], 0) / m.length, m.reduce((a, p) => a + p[1], 0) / m.length] : c; });
  }
  const base = ent(s, data, id), old = s.world.c[id];
  s.world.ents ||= {};
  let made = 0;
  for (let j = 1; j < k; j++) {
    const mine = pids.filter((_, i) => asg[i] === j);
    if (!mine.length) continue;
    const big = mine.reduce((b, p) => (data.geo.prov[p].pop || 0) > (data.geo.prov[b].pop || 0) ? p : b, mine[0]);
    const nid = `SUC${made + 1}_${id}`;
    const name = `República de ${data.geo.prov[big].n}`;
    s.world.ents[nid] = { ...base, id: nid, name, nameEn: name, iso2: null, cat: 'sovereign', parent: null, capital: { name: data.geo.prov[big].n, prov: big }, successorOf: id, flag: { layout: 'h2', colors: [['#2e6b3a', '#c43b2b', '#0d5c8c'][made], '#f2f2f2', '#f2f2f2'], emblems: [{ type: 'star', color: '#c9a227', x: 0.2, y: 0.25, s: 0.25 }] } };
    const popM = mine.reduce((a, p) => a + (data.geo.prov[p].pop || 0), 0) / 1e6;
    const share = popM / Math.max(0.01, old.pop);
    s.world.c[nid] = { ...old, id: nid, pop: popM, gdp: old.gdp * share, troops: old.troops * share * 0.6, stab: 35, capitalProv: big, puppetOf: PLY };
    old.pop -= popM; old.gdp -= old.gdp * share; old.troops *= 1 - share;
    for (const p of mine) setOwner(s, data, p, nid);
    s.partners[nid] = { rel: 45, trust: 40, trade: true, pact: false, sanctionsOn: false, sanctionsBy: false, broken: false, cd: {} };
    made++;
    ctx.log(`Nasce a ${name}, Estado sucessor de ${base.name}.`, 'info');
  }
  territoryChanged(s);
  return made + 1;
}

export function endWar(s, data, w, result, ctx) {
  w.active = false; w.pendingTerms = false; w.result = result; w.end = day(s); w.days = w.end - w.start; w.mySiege = null;
  const nm = entName(s, data, w.enemy);
  for (const id of w.enemies) if (s.partners[id]) s.partners[id].rel = Math.max(s.partners[id].rel, result === 'victory' ? -50 : -40);
  if (result === 'victory') {
    settleMedals(s, data, w, ctx);
    s.longMods.push({ k: 'legitimacy', v: 8, d: 240, left: 240, src: 'Vitória' }, { k: 'g_military', v: 10, d: 365, left: 365, src: 'Vitória' });
  } else if (result === 'defeat' || result === 'concession') {
    s.flags.lostWar = 1;
    s.longMods.push({ k: 'legitimacy', v: -12, d: 365, left: 365, src: 'Derrota' }, { k: 'g_military', v: -12, d: 365, left: 365, src: 'Derrota' }, { k: 'coupRisk', v: 10, d: 240, left: 240, src: 'Derrota' });
  }
  if (result === 'ceasefire') ctx.log(`Cessar-fogo assinado com ${nm}.`, 'info');
  if (result === 'withdrawal') ctx.log(`${s.nation.shortName} retirou-se da guerra contra ${nm}.`, 'warn');
  s.regionsDirty = true;
}

// Paz imposta ao jogador derrotado.
export function imposeDefeat(s, data, w, ctx) {
  const lost = w.lost.filter(p => s.world.occ[p] === w.enemy);
  for (const p of lost) transfer(s, data, [p], w.enemy);
  addLoan(s, { lender: w.enemy, borrower: PLY, principal: s.econ.gdp * 0.04, rate: 0, weeks: 104, kind: 'reparations' });
  s.longMods.push({ k: 'troopsMult', v: -0.4, d: 730, left: 730, src: 'Restrições do tratado de paz' });
  s.st.legitimacy = clamp(s.st.legitimacy - 15, 0, 100);
  ctx.log(`Derrota: ${s.nation.shortName} cede ${lost.length} província(s), paga reparações e aceita limites militares.`, 'bad');
  endWar(s, data, w, 'defeat', ctx);
  if (w.score <= -95 && s.world.occ[s.nation.capitalProv]) s.over = { ending: 'occupation', cause: `Derrota total diante de ${entName(s, data, w.enemy)}`, day: day(s) };
}
