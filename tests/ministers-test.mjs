// Autonomia dos ministros: mais delegação e menos lealdade levam a mudanças de agenda, escândalos, conspiração e queda.
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
import { autonomyOf, minRisk } from '../js/sim/ministers.js';
const data = loadData();
const mem = () => ({ store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} });
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
function run(seed, delegate, weeks = 150, answer = 0) {
  const g = new Game(data, mem());
  g.start({ seed, scenario: 'existing', provinces: data.geo.byCountry.BRA, answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'T', shortName: 'T', leader: 'L', currency: 'x', motto: '', regime: 'R' } });
  const s = g.s, P = s.pol;
  for (const k in P.cabinet) { const m = P.cabinet[k]; m.loyalty = delegate ? 30 : 80; m.amb = delegate ? 70 : 10; m.faction = delegate ? 'oligarchs' : m.faction; if (delegate) m.trait = 'ambicioso'; P.mandates[k] = delegate ? (Object.keys(P.mandates).length ? (k === 'finance' ? 'balance' : 'regional') : 'off') : 'off'; }
  if (delegate) { s.chief = { on: true, level: 'all', chief: { name: 'C' }, redlines: [], digest: [], decided: 0 }; for (const k in P.mandates) if (k !== 'finance') P.mandates[k] = Object.keys(P.mandates).length ? { economy: 'regional', defense: 'buildup', interior: 'order', health: 'expand', education: 'expand', foreign: 'trade', justice: 'clean' }[k] || 'off' : 'off'; }
  let cards = 0, plot = false;
  for (let w = 0; w < weeks && !s.over; w++) {
    g.s.econ.treasury = Math.max(g.s.econ.treasury, g.s.econ.gdp);
    g.nextWeek();
    for (const p of [...s.issues.pending]) { if (String(p.id).startsWith('mins_')) cards++; if (String(p.id).startsWith('mins_plot')) plot = true; g.answerIssue(p.id, String(p.id).startsWith('mins_') ? answer : 0); }
  }
  return { g, s, cards, plot };
}
{ const g = run('mn-a', false, 5).g, s = g.s; ok(autonomyOf(s, 'finance') < 0.2, `sem mandatos a autonomia é baixa (${autonomyOf(s, 'finance').toFixed(2)})`); }
{ const r = run('mn-b', true, 2), s = r.s; ok(autonomyOf(s, 'finance') > 0.7 && minRisk(s, 'finance') > 0.5, `com mandato e chefe de gabinete a autonomia é alta (${autonomyOf(s, 'finance').toFixed(2)}), risco ${minRisk(s, 'finance').toFixed(2)}`); }
let cabinetEnd = 0, plots = 0, cardsTot = 0;
for (let i = 0; i < 6; i++) { const r = run('mn-c' + i, true, 260, i % 2 ? 1 : 0); cardsTot += r.cards; if (r.plot) plots++; if (r.s.over?.ending === 'cabinet') cabinetEnd++; }
ok(cardsTot >= 6, `ministros com autonomia geram questões (${cardsTot} em 6 partidas)`);
ok(plots >= 1, `conspirações aparecem (${plots}/6)`);
let ctrl = 0; for (let i = 0; i < 4; i++) ctrl += run('mn-d' + i, false, 200, 0).cards;
ok(ctrl < cardsTot / 3, `sem delegação há muito menos (${ctrl} contra ${cardsTot})`);
console.log(`quedas pelo gabinete: ${cabinetEnd}/6`);
console.log(fails ? 'FALHOU' : 'OK'); process.exit(fails ? 1 : 0);
