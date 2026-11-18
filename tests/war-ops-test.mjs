// Teste dirigido: guerra viva (contra-ofensiva, 2ª frente, guerrilha, eventos, terreno, aliados, mão de obra, bloqueio).
import { Game, PLY } from '../js/sim/game.js';
import { provincesOf } from '../js/sim/world.js';
import { battleMods, terrainOf } from '../js/sim/terrain.js';
import { fogEstimate, manpowerMult, weeklyOccupation, warEventAct } from '../js/sim/warevents.js';
import { loadData } from './sim-data.mjs';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const g = new Game(data, mem);
g.start({ scenario: 'existing', provinces: data.geo.byCountry.DEU, answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'Teste', shortName: 'Teste', leader: 'L', currency: 'x', motto: '', regime: 'República' } });
const s = g.s; s.econ.treasury = 500;
const answerAll = pick => { for (const p of [...s.issues.pending]) { const iss = g.getIssue(p.id); g.answerIssue(p.id, pick(iss)); } };

// Terreno e estação
const pids = provincesOf(s, data, PLY);
const kinds = new Set(Object.keys(data.geo.prov).slice(0, 400).map(p => terrainOf(data, p)));
ok(kinds.size >= 3, 'terrenos variados: ' + [...kinds].join(','));
const bm = battleMods(data, pids[0], 0, false);
ok(bm.def >= 1 && bm.season > 0, `mods de batalha (${bm.tname}, ${bm.stag})`);

// Declara guerra a um vizinho e ocupa províncias à mão
s.partners.POL.rel = -80; s.flags.casusBelli = 1; s.st.readiness = 80;
const r = g.declareWar('POL', 'border'); ok(!r || r.ok !== false, 'guerra declarada');
const w = s.wars.find(x => x.active);
ok(!!w, 'guerra ativa');
if (w) {
  const enemyProv = provincesOf(s, data, 'POL');
  // 1. Ocupa 3 províncias de fronteira → contra-ofensiva deve poder retomá-las
  const border = enemyProv.filter(p => data.geo.prov[p].nb.some(n => pids.includes(n)));
  for (const p of border.slice(0, 3)) { s.world.occ[p] = PLY; w.gained.push(p); }
  w.stance = 'defensive'; w.ratio = 0.5;
  let retaken = false;
  for (let i = 0; i < 40 && !retaken; i++) { s.world.c.POL.troops = 9999; s.st.warWeariness = 0; s.st.stability = 90; w.ratio = 0.3; g.nextWeek(); answerAll(() => 0); retaken = w.gained.length < border.slice(0, 3).length || s.log.some(l => /retoma /.test(l.text)); if (s.over) break; }
  ok(retaken, 'inimigo retoma província ocupada');
  w.active = true; w.pendingTerms = false;
  // 2. Guerrilha
  w.resist = 90; w.guerCd = 0;
  let card = null;
  for (let i = 0; i < 30 && !card && !s.over; i++) { w.resist = 90; weeklyOccupation(s, data, w, g.ctx()); card = s.issues.pending.find(p => p.id.startsWith('dyn_wev_guerrilla')); }
  ok(!!card || w.gained.filter(p => s.world.occ[p] === PLY).length === 0, 'carta de guerrilha');
  if (card) { const before = w.resist; g.answerIssue(card.id, 0); ok(w.resist < before, 'repressão reduz a resistência'); }
  // 3. Eventos de campanha: resolve todos os tipos
  for (const [kind, choices] of [['surprise', ['hold', 'fallback', 'counter']], ['supply', ['pause', 'force', 'airlift']], ['mutiny', ['repress', 'pay', 'ignore']], ['volunteers', ['accept', 'hire', 'refuse']], ['atrocity', ['investigate', 'deny', 'praise']], ['breakthrough', ['exploit', 'consolidate', 'ignore']], ['manpower', ['draft', 'reserve', 'accept']]])
    for (const choice of choices) { w.target = { pid: [...enemyProv][0], p: 10 }; w.etarget = { pid: pids[0], p: 10 }; try { warEventAct(s, data, { war: w.id, kind, choice }); } catch (e) { ok(false, `${kind}/${choice}: ${e.message}`); } }
  ok(true, 'todos os eventos resolvem sem erro');
  // 4. Mão de obra
  s.manpowerPeak = s.st.troops * 2;
  ok(manpowerMult(s) < 0.9, 'falta de efetivos reduz o poder de combate (×' + manpowerMult(s).toFixed(2) + ')');
  // 5. Fog
  const fe = fogEstimate(s, w, g.day); ok(fe.lo < fe.hi && fe.conf >= 0, 'estimativa com névoa de guerra');
  s.st.intel = 100; const fe2 = fogEstimate(s, w, g.day); ok(fe2.hi - fe2.lo < fe.hi - fe.lo || fe.hi - fe.lo < 0.05 * 2, 'mais inteligência, menos incerteza');
  // 6. Aliado abandona
  const ally = Object.keys(s.partners).find(id => s.world.c[id] && id !== 'POL'); w.allies = [ally]; w.score = -60; s.partners[ally].rel = 0;
  let left = false; for (let i = 0; i < 60 && !left && !s.over; i++) { g.nextWeek(); answerAll(() => 0); left = !w.allies.includes(ally) || !w.active; }
  ok(left, 'aliado abandona a guerra quando o placar é ruim');
}
console.log(fails ? `\n${fails} FALHAS` : '\nOK'); process.exit(fails ? 1 : 0);
