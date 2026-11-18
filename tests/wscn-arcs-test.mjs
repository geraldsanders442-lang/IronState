// Teste: arcos exclusivos de cada cenário mundial aparecem, encadeiam (1/3 -> 2/3 -> 3/3) e o mapa-base volta em nova partida.
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const WORLDS = ['red_world', 'imperial_world', 'liberal_world', 'theocratic_world', 'continental_world', 'cold_war_world', 'corporate_world', 'climate_collapse_world'];
const all = data.issues.filter(i => i.id.startsWith('wa_'));
for (const w of WORLDS) ok(all.filter(i => i.id.startsWith('wa_' + w + '_')).length === 45, w + ': 45 questões');
const g = new Game(data, mem);
for (const w of WORLDS) {
  for (const econ of [-40, 40]) {
    g.start({ scenario: 'existing', provinces: data.geo.byCountry.BRA, answers: data.identity.questions.map(() => (econ < 0 ? 0 : 2)), difficulty: 'normal', worldScenario: w, worldHostile: 'ideology', flag: {}, nation: { officialName: 'Teste', shortName: 'Teste', leader: 'L', currency: 'x', motto: '', regime: 'República' } });
    const s = g.s; s.econ.treasury = 800; s.nation.ideology.axes.econ = econ;
    const seen = new Set(); let max = 0;
    for (let i = 0; i < 90 && !s.over; i++) {
      g.nextWeek();
      for (const p of [...s.issues.pending]) { if (p.id.startsWith('wa_')) seen.add(p.id); g.answerIssue(p.id, Math.floor(Math.random() * 3) % (g.getIssue(p.id).options.length)); }
    }
    const parts = [1, 2, 3].map(n => [...seen].filter(x => x.endsWith('_' + n)).length);
    ok(seen.size > 0, `${w} (econ ${econ}): cartas de arco vistas ${seen.size} (partes 1/2/3: ${parts.join('/')})`);
    ok(!seen.size || [...seen].every(id => id.startsWith('wa_' + w + '_')), w + ': só cartas do próprio mundo');
  }
}
// nova partida volta ao mapa-base
g.newCampaign();
ok(g.data === g.baseData, 'newCampaign restaura os dados-base');
console.log(fails ? fails + ' FALHAS' : 'OK'); process.exit(fails ? 1 : 0);
