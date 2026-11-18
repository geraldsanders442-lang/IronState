// Mundo caótico: Estados novos surgem com nome e bandeira regionais, IAs expansionistas guerreiam e formam alianças.
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
import { advisorPick } from '../js/sim/advisor.js';
import { MOVEMENTS, movementProvinces } from '../js/sim/newstates.js';
const data = loadData();
const miss = MOVEMENTS.filter(m => !movementProvinces(data, m).length).map(m => m.id);
console.log(miss.length ? 'FAIL movimentos sem províncias: ' + miss : 'ok   todos os movimentos têm províncias');
const sc = data.scenarios.find(s => s.id === 'existing');
const g = new Game(data, null);
g.start({ seed: 'chaos-1', chaos: true, scenario: 'existing', provinces: data.geo.byCountry.BRA, answers: data.identity.questions.map((_, i) => i % 4), difficulty: 'normal', flag: {}, nation: { officialName: 'T', shortName: 'T', leader: 'L', currency: 'x', motto: '', regime: 'R' } });
for (let w = 0; w < 104 && !g.s.over; w++) { g.nextWeek(); for (const p of [...g.s.issues.pending]) { const iss = g.getIssue(p.id); if (iss && !g.s.over) g.answerIssue(p.id, advisorPick(iss)); } }
const W = g.s.world;
console.log('novos Estados:', (W.newStates || []).map(x => `${x.name}${W.c[x.id] ? '' : ' (extinto)'}`).join(' · '));
console.log('alianças:', (W.alliances || []).map(a => a.name + ' [' + a.members.length + ']').join(' · '));
console.log('guerras de IA:', W.wars.filter(w => w.ai).length, 'ativas', W.wars.filter(w => w.ai && w.active).length);
console.log((W.newStates || []).length >= 3 ? 'ok   o mundo caótico gera Estados novos' : 'FAIL poucos Estados novos');
const g2 = new Game(data, null);
g2.start({ seed: 'chaos-1', chaos: false, scenario: 'existing', provinces: data.geo.byCountry.BRA, answers: data.identity.questions.map((_, i) => i % 4), difficulty: 'normal', flag: {}, nation: { officialName: 'T', shortName: 'T', leader: 'L', currency: 'x', motto: '', regime: 'R' } });
for (let w = 0; w < 52; w++) g2.nextWeek();
console.log(!(g2.s.world.newStates || []).length ? 'ok   sem o modo, nenhum Estado novo' : 'FAIL Estados novos com o modo desligado');
