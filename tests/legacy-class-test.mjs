// Classificações do governo: curto = sem legado; genocídio = legado assombroso; deposto pelo gabinete etc.
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
import { classifyReign, legacy } from '../js/sim/legacy.js';
import { ensureMin } from '../js/sim/minority.js';
const data = loadData();
const mem = () => ({ store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} });
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const mk = (seed, weeks) => { const g = new Game(data, mem()); g.start({ seed, scenario: 'existing', provinces: data.geo.byCountry.ZAF, answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'T', shortName: 'T', leader: 'L', currency: 'x', motto: '', regime: 'R' } }); for (let w = 0; w < weeks; w++) { g.nextWeek(); for (const p of [...g.s.issues.pending]) g.answerIssue(p.id, 0); } return g; };
{ const g = mk('lg1', 6); g.s.over = { ending: 'exile', cause: 'x', day: 40 }; const L = legacy(g.s, data, id => id), c = classifyReign(g.s, data);
  ok(c.tags[0].name === 'Governo relâmpago' && L.grade.title.includes('relâmpago') && L.idx <= 22, `governo de 40 dias: ${L.grade.title} (índice ${L.idx})`); }
{ const g = mk('lg2', 30); ensureMin(g.s, data); g.s.min.genocide = true; g.s.min.killed = 900000; g.s.over = { ending: 'icc', cause: 'x', day: 3000 }; const L = legacy(g.s, data, id => id);
  ok(L.grade.title.startsWith('Legado assombroso') && L.grade.g === 'F' && L.tags.some(t => t.name === 'Governo genocida'), `genocídio: ${L.grade.title}`); }
{ const g = mk('lg3', 30); g.s.over = { ending: 'cabinet', cause: 'x', day: 2500 }; const L = legacy(g.s, data, id => id);
  ok(L.tags.some(t => t.name === 'Deposto pelo próprio gabinete'), 'deposto pelo gabinete é classificado'); }
{ const g = mk('lg4', 40); g.s.over = { ending: 'democracy', cause: 'x', day: 800 }; const L = legacy(g.s, data, id => id); ok(L.tags.length >= 0 && L.paragraphs.length >= 6, `governo comum tem ${L.tags.length} rótulo(s) e texto completo`); }
console.log(fails ? 'FALHOU' : 'OK'); process.exit(fails ? 1 : 0);
