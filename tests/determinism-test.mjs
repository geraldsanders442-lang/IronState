// Mesma semente + mesmas decisões = mesma história.
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
const data = loadData();
const mem = () => ({ store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} });
function run(seed, weeks = 40) {
  const g = new Game(data, mem());
  g.start({ seed, scenario: 'existing', provinces: data.geo.byCountry.ARG, answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'T', shortName: 'T', leader: 'L', currency: 'x', motto: '', regime: 'R' } });
  for (let w = 0; w < weeks && !g.s.over; w++) { g.nextWeek(); for (const p of [...g.s.issues.pending]) { const i = g.getIssue(p.id); g.answerIssue(p.id, 0); } }
  return JSON.stringify([g.s.econ, g.s.st, g.s.log.slice(0, 30).map(l => l.text), g.s.world.wars.length]);
}
globalThis.__IRON_RNG_LEAKS__ = []; // qualquer sorteio fora do gerador da partida (Math.random) quebraria a reprodução
const a = run('teste-1'), b = run('teste-1'), c = run('teste-2'), d = run('teste-1');
const leaks = globalThis.__IRON_RNG_LEAKS__;
if (leaks.length) console.log('FAIL sorteio fora do gerador da partida:', [...new Set(leaks)].slice(0, 3).join(' | '));
console.log(a === d ? 'ok   terceira execução idêntica' : 'FAIL terceira execução divergiu');
console.log(a === b ? 'ok   same seed → same history' : 'FAIL same seed diverged');
console.log(a !== c ? 'ok   different seed → different history' : 'FAIL seeds identical');
process.exit(a === b && a === d && a !== c && !leaks.length ? 0 : 1);
