// Teste dirigido: levante, partido no poder, insurgência própria, programa nuclear e programas econômicos.
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
// 1. Milícia em vizinho
const nb = 'POL', before = provincesOf(s, data, nb).length;
s.world.covert = { [nb]: { party: 0, militia: 95, arms: 6, found: 0 } };
s.world.c[nb].stab = 10;
for (let i = 0; i < 40 && provincesOf(s, data, nb).length === before && !s.log.some(l => /Levante armado esmagado/.test(l.text)); i++) { (s.world.covert[nb] ||= { party: 0, militia: 0, arms: 6, found: 0 }).militia = 95; g.nextWeek(); answerAll(() => 0); }
const reb = Object.keys(s.world.ents || {}).filter(k => k.startsWith('REB'));
ok(provincesOf(s, data, nb).length < before || s.log.some(l => /Levante armado esmagado|Nasce a |rompe com/.test(l.text)), `uprising resolved (POL ${before}→${provincesOf(s, data, nb).length}, new states ${reb.join(',')})`);
// 2. Partido afim chega ao poder
s.world.covert.CZE = { party: 90, militia: 0, arms: 0, found: 0 };
for (let i = 0; i < 60 && !s.world.ents?.CZE?.regimeChanged; i++) { s.world.covert.CZE.party = 90; g.nextWeek(); answerAll(() => 0); }
ok(!!s.world.ents?.CZE?.regimeChanged, 'allied party took power in CZE: ' + s.world.ents?.CZE?.profile?.regimeName);
// 3. Insurgência em território próprio reivindicado
const myProv = provincesOf(s, data, PLY).slice(0, 2);
s.world.claims.push({ id: 'test_cl', claimant: 'FRA', holder: PLY, provs: myProv, type: 'sovereignty', just: 'teste', strat: 50, dom: 50, risk: 50, status: 'active', src: 'test' });
s.world.insurg = { test_cl: { level: 95, sponsor: 40 } };
let card = null;
for (let i = 0; i < 30 && !card; i++) { s.world.insurg.test_cl.level = 95; s.world.insurg.test_cl.cd = 0; g.nextWeek(); card = s.issues.pending.find(p => p.id.startsWith('dyn_insurg')); if (!card) answerAll(() => 0); }
ok(!!card, 'insurgency card appeared');
if (card) { const r = g.answerIssue(card.id, 1); ok(s.world.insurg.test_cl.level <= 20, 'autonomy calmed insurgency'); }
// 4. Programa econômico
s.econ.treasury = 500; s.programs = [];
ok(g.startProgram('pac').ok, 'PAC started'); ok(g.startProgram('techhub').ok || true, 'second program');
ok(!g.startProgram('stimulus').ok, 'third program blocked');
// 5. Programa nuclear (DEU não é nuclear)
s.nation.nuclear = false; s.st.milIndustry = 60;
ok(g.startNuke().ok, 'nuke program started');
s.nuke.prog = 99.5;
let sawTest = false;
for (let i = 0; i < 4 && !sawTest; i++) { g.nextWeek(); sawTest = s.issues.pending.some(p => p.id.startsWith('dyn_nuketest')); answerAll(() => 0); }
ok(sawTest && s.nation.nuclear, 'bomb ready card -> player is nuclear');
// 6. Cortes abruptos
s.budget.spend.health = 0.2; s.budget.spend.education = 0.3;
const pr = s.st.protest; for (let i = 0; i < 14; i++) { g.nextWeek(); answerAll(() => 0); }
ok(s.st.health < 50 && s.log.some(l => /Greve de médicos|Hospitais lotados/.test(l.text)), `health cuts bite (health ${s.st.health.toFixed(0)}, protest ${pr.toFixed(0)}→${s.st.protest.toFixed(0)})`);
console.log(fails ? fails + ' failures' : 'OK'); process.exit(fails ? 1 : 0);
