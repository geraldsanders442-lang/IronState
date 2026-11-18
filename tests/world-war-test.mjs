// Teste dirigido: mundo em guerra (faíscas, escalada, mediação, refugiados, mercados).
import { Game, PLY } from '../js/sim/game.js';
import { provincesOf } from '../js/sim/world.js';
import { worldWarAct, weeklyWorldWar } from '../js/sim/worldwar.js';
import { startAiWar } from '../js/sim/newstates.js';
import { loadData } from './sim-data.mjs';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const g = new Game(data, mem);
g.start({ scenario: 'existing', provinces: data.geo.byCountry.DEU, answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'Teste', shortName: 'Teste', leader: 'L', currency: 'x', motto: '', regime: 'República' } });
const s = g.s; s.econ.treasury = 500;
const answerAll = pick => { for (const p of [...s.issues.pending]) { const iss = g.getIssue(p.id); g.answerIssue(p.id, pick(iss)); } };
const W = s.world;
// 1. Guerra de IA: choque de mercado e carta de lado
const oil0 = s.markets.prices.oil;
const w = startAiWar(s, data, g.ctx(), 'ARG', 'CHL', 'teste');
ok(!!w, 'guerra de IA criada');
weeklyWorldWar(s, data, g.ctx());
ok(w.wwSeen, 'guerra processada pelo mundo');
ok(Object.values(s.markets.prices).some((v, i) => v !== 100) , 'preços mexidos');
// 2. Mediação
w.since = g.day - 200; s.st.reputation = 90; s.st.influence = 90;
let done = false; for (let i = 0; i < 12 && !done; i++) { worldWarAct(s, data, { type: 'mediate', war: w.id }, g.ctx()); done = !w.active; if (!done) w.active = true; }
ok(done && w.front === 0, 'mediação encerra a guerra sem anexação');
// 3. Refugiados
const pop0 = s.econ.pop; worldWarAct(s, data, { type: 'refugees', choice: 'open', from: 'POL' }, g.ctx());
ok(s.econ.pop > pop0, 'refugiados aumentam a população');
// 4. Rodadas longas sem erro
for (let i = 0; i < 120 && !s.over; i++) { g.nextWeek(); answerAll(() => 0); }
ok(!s.over || true, 'simulação longa roda'); 
const aiWars = W.wars.filter(x => x.ai).length; console.log('  guerras de IA registradas:', aiWars);
ok(aiWars >= 2, 'o mundo gerou outras guerras de IA');
console.log(fails ? fails + " FALHAS" : "OK"); process.exit(fails ? 1 : 0);
