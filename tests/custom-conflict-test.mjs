// Mundo customizado × conflitos reais: a Crimeia criada pelo jogador não volta à Ucrânia nem fica "ocupada pela Rússia".
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
import { presetWorld } from '../js/sim/customworld.js';
import { ownerOf } from '../js/sim/world.js';
const data = loadData();
const mem = () => ({ store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} });
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
function obs(preset, real, wscn = null) {
  const g = new Game(data, mem());
  g.start({ seed: 4, spectator: true, scenario: 'custom', provinces: ['ATA+99?'], answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'Obs', shortName: 'Obs', leader: 'O', currency: '-', motto: '', regime: '' }, worldScenario: wscn, customWorld: presetWorld(data, preset), lab: { chaos: 45, ideo: 1, ethnic: 1, realConflicts: real } });
  return g;
}
const crim = (g) => Object.keys(g.data.geo.prov).filter(p => /Crimea|Sevastopol/i.test(g.data.geo.prov[p].n) && g.data.geo.prov[p].o3);
for (const real of [false, true]) {
  const g = obs('rusrep', real), s = g.s, W = s.world; for (let w = 0; w < 20; w++) g.nextWeek();
  const ps = crim(g);
  ok(ps.length > 0 && ps.every(p => String(ownerOf(s, g.data, p)).startsWith('CW_rus_crimea') && !W.occ[p]), `Crimeia (conflitos reais ${real ? 'ligados' : 'desligados'}) pertence ao país criado e não está ocupada`);
}
{ const g = obs('rusrep', false), W = g.s.world; for (let w = 0; w < 60; w++) g.nextWeek();
  ok(!W.wars.some(w => w.active && w.a.includes('RUS') && w.b.includes('UKR')) && !W.claims.some(c => c.claimant === 'RUS' && c.holder === 'UKR'), 'sem conflitos reais: sem guerra nem reivindicação Rússia × Ucrânia'); }
{ const g = obs('rus', false), W = g.s.world; for (let w = 0; w < 10; w++) g.nextWeek();
  ok(!W.c.RUS && Object.values(W.occ).every(by => W.c[by] || by === 'PLY'), 'Rússia fragmentada: nenhuma ocupação "pela Rússia" sobrevive'); }
console.log(fails ? 'FALHOU' : 'OK'); process.exit(fails ? 1 : 0);
