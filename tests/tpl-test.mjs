// Conta questões com modelo instanciadas e procura marcadores não substituídos.
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
const pick = process.argv[2] || 'POL', weeks = +(process.argv[3] || 100);
const g = new Game(data, mem);
g.start({ scenario: 'existing', provinces: pick.split(',').flatMap(c => data.geo.byCountry[c]), answers: data.identity.questions.map(() => Math.floor(Math.random() * 4)), difficulty: 'normal', flag: {}, nation: { officialName: 'Teste', shortName: 'Teste', leader: 'Presidente X', currency: 'x', motto: '', regime: 'República' } });
const seen = {}, bad = [];
g.on('issue', iss => { const b = iss.base || iss.id; seen[b] = (seen[b] || 0) + 1; const t = JSON.stringify([iss.title, iss.desc, iss.options.map(o => [o.text, o.hint])]); const m = t.match(/\{[a-zA-Z0-9]+\}|"\$[a-zA-Z]+"/g); if (m) bad.push(b + ': ' + m.join(',')); if (iss.base && seen[b] === 1) console.log(' ·', iss.title); });
for (let w = 0; w < weeks && !g.s.over; w++) { g.nextWeek(); for (const p of [...g.s.issues.pending]) { const iss = g.getIssue(p.id); g.answerIssue(p.id, Math.floor(Math.random() * iss.options.length)); } }
const tpl = Object.keys(seen).filter(id => data.issueById[id]?.tpl);
console.log(`weeks=${weeks} distinct issues=${Object.keys(seen).length} templated distinct=${tpl.length} over=${JSON.stringify(g.s.over)}`);
console.log('unfilled:', bad.slice(0, 10));
