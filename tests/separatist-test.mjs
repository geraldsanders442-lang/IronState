// Cenário "Crise separatista": a região sai do país no início, com nome e bandeira próprios; referendo resolve depois.
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
const data = loadData();
const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
for (const c of ['ESP', 'GBR', 'TUR', 'BRA', 'JPN', 'POL', 'NGA']) {
  const g = new Game(data, null);
  g.start({ seed: 'sep' + c, scenario: 'separatist_crisis', provinces: data.geo.byCountry[c], answers: data.identity.questions.map((_, i) => i % 4), difficulty: 'normal', flag: {}, nation: { officialName: 'T', shortName: 'T', leader: 'L', currency: 'x', motto: '', regime: 'R' } });
  const ns = g.s.world.newStates || [], card = g.s.issues.pending.find(p => p.id.startsWith('dyn_sep'));
  ok(ns.length === 1 && card && g.s.world.c[ns[0].id], `${data.reg[c].name}: ${ns[0]?.name} se separa (${g.s.world.ents[ns[0]?.id]?.flag?.layout || g.s.world.ents[ns[0]?.id]?.flag?.iso})`);
  if (c === 'ESP') {
    g.answerIssue(card.id, 1);
    for (let w = 0; w < 54; w++) g.nextWeek();
    const t = g.s.log.find(x => /Referendo/.test(x.text));
    ok(!!t, 'o referendo acontece um ano depois: ' + t?.text);
  }
}
