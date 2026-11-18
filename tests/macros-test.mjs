// Teste dirigido: macro-regiões.
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
import { PLY as PL } from '../js/sim/world.js';
const pol = data.geo.byCountry.POL;
const r1 = g.saveMacro({ name: 'Polônia Ocidental', provs: pol.slice(0, 8) });
ok(r1.ok && g.macros().length === 1, 'macro-região criada: ' + r1.msg);
ok(!g.saveMacro({ name: '', provs: ['x'] }).ok, 'nome obrigatório');
const mid = g.macros()[0].id;
s.partners.POL.rel = -80; s.flags.casusBelli = 1; s.st.readiness = 80;
const rw = g.declareWar('POL', 'macro', mid); ok(rw.ok, 'guerra com objetivo macro-região');
const w = s.wars.find(x => x.active); ok(w && w.macro === mid, 'guerra guarda a macro-região');
// foco restringe alvos
for (let i = 0; i < 12; i++) { g.nextWeek(); answerAll(() => 0); if (w.target) break; }
const set = new Set(g.macros()[0].provs);
ok(!w.target || set.has(w.target.pid), 'alvo da ofensiva dentro da macro-região (' + (w.target && data.geo.prov[w.target.pid].n) + ')');
// ocupa a macro e verifica o termo de paz
for (const p of g.macros()[0].provs) { s.world.occ[p] = PL; w.gained.push(p); }
w.score = 80; w.pendingTerms = true;
const terms = g.availableTerms(w.id); const mt = terms.find(x => x.key === 'macro');
ok(mt && mt.ok, 'termo de paz «macro-região» disponível: ' + (mt && mt.name));
const own0 = g.macros()[0].provs.filter(p => data.geo.prov[p] && s.world.owner?.[p] === 'PLY').length;
g.terms(w.id, 'macro');
const own1 = g.macros()[0].provs.filter(p => (s.world.owner?.[p] || data.geo.prov[p].a3) === 'PLY').length;
ok(own1 >= g.macros()[0].provs.length, 'macro-região anexada pelo tratado (' + own1 + '/' + g.macros()[0].provs.length + ')');
ok(g.deleteMacro(mid).ok && g.macros().length === 0, 'macro-região excluída');
console.log(fails ? fails + ' FALHAS' : 'OK'); process.exit(fails ? 1 : 0);
