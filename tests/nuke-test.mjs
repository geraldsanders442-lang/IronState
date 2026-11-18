// Teste dirigido do ataque nuclear: alvo populoso, morte na capital, 3 semanas de crise e troca de capital.
import { Game, PLY } from '../js/sim/game.js';
import { provincesOf } from '../js/sim/world.js';
import { loadData } from './sim-data.mjs';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const mk = () => { const g = new Game(data, mem); g.start({ scenario: 'existing', provinces: data.geo.byCountry.POL, answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'Teste', shortName: 'Teste', leader: 'Presidente Nowak', currency: 'x', motto: '', regime: 'República' } }); return g; };
const answer = g => { for (const p of [...g.s.issues.pending]) { const i = g.getIssue(p.id); g.answerIssue(p.id, i.default ?? 0); } };
// 1. Região populosa, não capital
let g = mk(), s = g.s, pop0 = s.econ.pop, cap0 = s.nation.capitalProv;
const nonCap = provincesOf(s, data, PLY).filter(p => p !== cap0).sort((a, b) => data.geo.prov[b].pop - data.geo.prov[a].pop)[0];
const { nuclearStrike } = await import('../js/sim/nuclear.js');
let r = nuclearStrike(s, data, 'RUS', g.ctx(), { prov: nonCap });
ok(s.econ.pop < pop0 * 0.99, `population fell ${pop0.toFixed(2)} → ${s.econ.pop.toFixed(2)} M (${data.geo.prov[nonCap].n})`);
ok(s.nukeCrisis?.weeks === 3 && !s.flags.needCapital && !s.over, 'crisis started, capital intact');
const seen = [], before = new Set(s.issues.pending.map(p => p.id));
for (let w = 0; w < 3; w++) { g.nextWeek(); for (const p of s.issues.pending) { const i = g.getIssue(p.id); if (!before.has(p.id)) seen.push([w, i.base || i.id, !!i.cond?.nukeCrisis]); } answer(g); }
const newOnes = seen.filter(([, , c]) => !c);
ok(seen.filter(x => x[2]).length >= 6, `crisis issues seen: ${[...new Set(seen.filter(x => x[2]).map(x => x[1]))].join(', ')}`);
ok(!newOnes.length, 'no new ordinary issues during crisis (' + newOnes.map(x => x[1]).join(',') + ')');
g.nextWeek();
ok(s.nukeCrisis.weeks === 0, 'crisis ended after 3 weeks');
ok(s.longMods.some(m => m.src?.startsWith('Ataque nuclear')) && s.regions.some(x => x.radiation > 50), 'long-term effects + radiation');
// 2. Capital: morte ou troca
let died = 0, moved = 0;
for (let i = 0; i < 20; i++) {
  g = mk(); s = g.s;
  r = nuclearStrike(s, data, 'RUS', g.ctx(), { prov: s.nation.capitalProv });
  if (s.over) { died++; ok(s.over.ending === 'vaporized', 'ending vaporized'); continue; }
  moved++;
  ok(s.flags.needCapital && s.nation.capitalProv !== r.pid, 'needs new capital, provisional moved');
  const bad = g.setCapital(r.pid); ok(!bad.ok, 'cannot pick nuked province');
  const pick = provincesOf(s, data, PLY).find(p => g.canBeCapital(p) && p !== s.nation.capitalProv);
  ok(g.setCapital(pick).ok && s.nation.capitalProv === pick && !s.flags.needCapital, 'player chose ' + data.geo.prov[pick].n);
  if (moved >= 2) break;
}
console.log('capital strikes: died', died, 'survived', moved);
// 3. Evacuação reduz chance de morrer
let d2 = 0; for (let i = 0; i < 30; i++) { g = mk(); g.s.flags.evacuated = 1; g.s.flags.bunker = 1; nuclearStrike(g.s, data, 'RUS', g.ctx(), { prov: g.s.nation.capitalProv }); if (g.s.over) d2++; }
ok(d2 <= 8, `with bunker+evacuation died ${d2}/30`);
console.log(fails ? fails + ' failures' : 'OK'); process.exit(fails ? 1 : 0);
