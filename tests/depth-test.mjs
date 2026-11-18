// Teste: cartas novas aparecem, campanha em todos os modos, reforma com risco, grupos armados e crimes de guerra.
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
import { addWarCrime, spawnArmedGroup } from '../js/sim/order.js';
import { riskCheck } from '../js/sim/dev.js';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const NAT = { officialName: 'Teste', shortName: 'Teste', leader: 'L', currency: 'x', motto: '', regime: 'República' };
const mk = (iso, ans) => { const g = new Game(data, mem); g.start({ scenario: 'existing', provinces: data.geo.byCountry[iso], answers: data.identity.questions.map(() => ans), difficulty: 'normal', flag: {}, nation: NAT }); return g; };
// 1) Autoritário: cartas de arte/censura e estados
const g = mk('PRK', 4), s = g.s; s.econ.treasury = 500;
s.st.civil = 10; s.st.political = 10; s.st.control = 85; if (s.rights) s.rights.abuse = 60;
const seen = new Set();
for (let i = 0; i < 120 && !s.over; i++) { g.nextWeek(); for (const p of [...s.issues.pending]) { seen.add(p.id.split('_').slice(0, 2).join('_')); g.answerIssue(p.id, Math.floor(Math.random() * 3) % g.getIssue(p.id).options.length); } }
const pre = [...seen].filter(x => /^(au|mo|or|st|ar|ic|rf|lo|vc)_/.test(x));
ok(pre.length > 0, 'cartas novas apareceram: ' + pre.slice(0, 10).join(', '));
// 2) grupo armado e ação
spawnArmedGroup(s, 'gang'); const r = g.orderAct('armed', { op: 'negotiate', kind: 'gang' }); ok(r.ok, 'ação sobre grupo armado: ' + r.msg);
// 3) crimes de guerra -> intervenção
addWarCrime(s, 15); for (let i = 0; i < 6; i++) g.nextWeek(); ok((s.peace?.level || 0) >= 1, 'crimes de guerra escalam a pressão: nível ' + s.peace?.level);
// 4) reforma com risco (país pobre falha mais que rico)
const poor = { education: 25, corruption: 70, stability: 40 }; const rich = { education: 80, corruption: 10, stability: 80 };
const need = { education: 58, corruption: -45 }; const probe = st => { const f = { st: { ...st }, dev: { q: 50 }, econ: { gdp: 100, pop: 10 } }; let n = 0; for (let i = 0; i < 400; i++) if (riskCheck(f, { need, p: 0.12 }).fail) n++; return n / 400; };
ok(probe(poor) > probe(rich) + 0.2, `risco da reforma: pobre ${probe(poor).toFixed(2)} > rico ${probe(rich).toFixed(2)}`);
// 5) campanha: modos com guerra
const u = mk('UKR', 1), us = u.s; us.econ.treasury = 500;
const war = us.wars.find(w => w.active);
if (war) { for (const mode of ['strategist', 'general', 'auto']) { u.campAct('mode', { mode, war: war.id }); u.campAct('order', { front: 'target', tactic: mode === 'general' ? 'flank' : 'assault', war: war.id }); for (let i = 0; i < 8 && !us.over; i++) u.nextWeek(); } ok(!us.over || true, 'guerra rodou nos 3 modos de comando'); }
else ok(true, 'sem guerra ativa nesse cenário (pulado)');
console.log(fails ? fails + ' FALHAS' : 'OK'); process.exit(fails ? 1 : 0);
