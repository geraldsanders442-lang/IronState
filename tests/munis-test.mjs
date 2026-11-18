// Municípios: geração, divisão de províncias, partida/saves e guerra município a município.
import { Game } from '../js/sim/game.js';
import { munisOf, applySplits, splitId, splitName } from '../js/sim/munis.js';
import { provincesOf } from '../js/sim/world.js';
import { loadData } from './sim-data.mjs';
const data = loadData(), P = data.geo.prov;
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const find = n => Object.keys(P).find(k => P[k].n === n);

// Geração
let bad = 0, cellsTotal = 0;
for (const id of Object.keys(P).filter((_, i) => i % 40 === 0)) { const M = munisOf(P[id]), sp = M.cells.reduce((a, c) => a + c.pop, 0); cellsTotal += M.cells.length; if (Math.abs(sp - (P[id].pop || 0)) > Math.max(5, M.cells.length) || M.cells.length < 1) bad++; }
ok(bad === 0, `população dos municípios fecha com a da província (amostra de ${Math.ceil(Object.keys(P).length / 40)} províncias, ${cellsTotal} municípios)`);
const M1 = munisOf(P[find('West Flanders')]);
ok(M1.cells.length >= 3 && new Set(M1.cells.map(c => c.name)).size === M1.cells.length, 'nomes únicos: ' + M1.cells.slice(0, 3).map(c => c.name).join(', '));
ok(JSON.stringify(munisOf(P[find('West Flanders')]).cells.map(c => c.d)) === JSON.stringify(M1.cells.map(c => c.d)), 'determinístico');

// Divisão e partida
const pid = find('West Flanders'), ant = find('Antwerp'), cells = [0, 1];
const sp = [{ id: splitId(pid, cells), parent: pid, cells, name: splitName(P[pid], cells, M1) }];
const d2 = applySplits(data, sp), piece = d2.geo.prov[sp[0].id];
ok(!!piece && piece.pop + d2.geo.prov[pid].pop === P[pid].pop, 'peça + resto = população original');
ok(!data.geo.prov[sp[0].id], 'dados-base não são alterados');
const g = new Game(data, mem);
g.start({ scenario: 'custom', provinces: [ant, sp[0].id], splits: sp, answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'Micro', shortName: 'Micro', leader: 'L', currency: 'x', motto: '', regime: 'R' } });
ok(provincesOf(g.s, g.data, 'PLY').includes(sp[0].id), 'jogador começa com o pedaço da província');
g.save(); const g2 = new Game(data, mem);
ok(g2.load('auto') && !!g2.data.geo.prov[sp[0].id], 'save/load recria as províncias divididas');

// Guerra município a município
const gw = new Game(data, mem);
gw.start({ scenario: 'existing', provinces: data.geo.byCountry.DEU, answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'T', shortName: 'T', leader: 'L', currency: 'x', motto: '', regime: 'R' } });
const s = gw.s; s.partners.POL.rel = -80; s.flags.casusBelli = 1; s.st.readiness = 80;
gw.declareWar('POL', 'border'); const w = s.wars.find(x => x.active);
let lines = 0;
for (let i = 0; i < 40 && w.active && !s.over; i++) { s.world.c.POL.troops = 1; gw.nextWeek(); for (const p of [...s.issues.pending]) gw.answerIssue(p.id, 0); lines = w.log.filter(l => /Tropas avançam e tomam|avança sobre/.test(l.text)).length; if (lines >= 2) break; }
ok(lines >= 1, 'a guerra registra o avanço por município: ' + (w.log.find(l => /tomam/.test(l.text))?.text || '—'));
ok(!!(w.target?.order?.length), 'o alvo guarda a ordem de queda dos municípios');
console.log(fails ? fails + ' FALHAS' : 'OK'); process.exit(fails ? 1 : 0);
