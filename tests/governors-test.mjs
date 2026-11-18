// Teste dirigido: líderes regionais.
import { Game, PLY } from '../js/sim/game.js';
import { provincesOf } from '../js/sim/world.js';
import { loadData } from './sim-data.mjs';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const g = new Game(data, mem);
g.start({ scenario: 'existing', provinces: data.geo.byCountry.DEU, answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'Teste', shortName: 'Teste', leader: 'L', currency: 'x', motto: '', regime: 'República' } });
const s = g.s; s.econ.treasury = 500;
const answerAll = pick => { for (const p of [...s.issues.pending]) { const iss = g.getIssue(p.id); g.answerIssue(p.id, pick(iss)); } };
const G = g.govInit();
ok(!!G && ['none', 'appointed', 'elected'].includes(G.mode), 'modo inicial: ' + G.mode);
ok(Object.keys(G.leaders).length >= 1, 'há governadores: ' + Object.values(G.leaders).map(l => l.name).slice(0, 3).join(', '));
for (let i = 0; i < 80 && !s.over; i++) { g.nextWeek(); answerAll(() => 0); }
ok(s.d.budget.exp.regional > 0 || G.mode === 'none', 'orçamento inclui transferências regionais: ' + s.d.budget.exp.regional.toFixed(1));
// Autonomia
const rid = Object.keys(G.leaders)[0]; const a0 = G.leaders[rid].autonomy;
g.setGovAutonomy(rid, 10); ok(G.leaders[rid].autonomy === a0 + 10, 'autonomia aumenta');
// Obra local financiada
s.econ.treasury = 500; const r1 = g.fundGovWork(rid, 'hospital'); ok(r1.ok, 'obra local financiada: ' + r1.msg);
// Destituição
const unrest0 = s.regions.find(x => x.id === rid).unrest, leg0 = s.st.legitimacy;
G.leaders[rid].kind = 'elected'; G.leaders[rid].popularity = 90; s.st.political = 80; s.st.civil = 80;
const r2 = g.removeGovernor(rid); ok(r2.ok, 'destituição: ' + r2.msg);
ok(s.regions.find(x => x.id === rid).unrest > unrest0, 'destituir líder popular eleito eleva a tensão regional');
ok(s.st.legitimacy < leg0, 'destituição de eleito custa legitimidade');
ok(!!G.leaders[rid] && G.leaders[rid].kind === 'appointed', 'interino nomeado assume');
// Modos
G.changeCd = 0; const r3 = g.setGovMode('none'); ok(r3.ok && Object.keys(G.leaders).length === 0, 'administração direta dissolve os líderes');
for (let i = 0; i < 10; i++) { g.nextWeek(); answerAll(() => 0); }
ok(s.longMods.some(m => m.id === 'gov_control'), 'modo direto dá controle');
G.changeCd = 0; const r4 = g.setGovMode('elected'); ok(r4.ok && Object.keys(G.leaders).length >= 1, 'eleições regionais recriam líderes');
// Cartas e eleições em simulação longa
let cards = 0, elec = 0;
for (let i = 0; i < 260 && !s.over; i++) { g.nextWeek(); cards += s.issues.pending.filter(p => p.id.startsWith('dyn_gov_')).length; elec += s.log.filter(l => /eleição em|reeleit|vence a eleição/.test(l.text) && l.day > g.day - 7).length; for (const p of [...s.issues.pending]) { const iss = g.getIssue(p.id); if (iss) g.answerIssue(p.id, p.id.startsWith('dyn_gov_') ? Math.min(1, iss.options.length - 1) : 0); } }
console.log('  cartas de governadores:', cards, '| eleições regionais:', elec);
ok(cards > 0, 'governadores geram cartas (pedidos/escândalos)');
console.log(fails ? fails + ' FALHAS' : 'OK'); process.exit(fails ? 1 : 0);
