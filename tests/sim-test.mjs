// Teste headless: node tests/sim-test.mjs [estratégia] [dias] [cenário] [país p/ cenários de escolha]
import { Game, PLY } from '../js/sim/game.js';
import { gdppc } from '../js/sim/model.js';
import { provincesOf } from '../js/sim/world.js';

import { loadData } from './sim-data.mjs';
export { loadData };
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem(k) { delete this.store[k]; } };
const strategy = process.argv[2] || 'random';
const weeks = Math.ceil(+(process.argv[3] || 365) / 7);
const scenId = process.argv[4] || 'ussr';
const pickC = process.argv[5] || 'FRA';
let fails = 0;
const assert = (c, m) => { if (!c) { fails++; console.error('FAIL:', m); } };

const scen = data.scenarios.find(s => s.id === scenId);
const ents = scen.territory ? scen.territory.entities || [] : pickC.split(',');
const provinces = [...ents.flatMap(e => data.geo.byCountry[e] || []), ...(scen.territory?.provinces || [])];
const answers = scen.answers || data.identity.questions.map(() => Math.floor(Math.random() * 4));
const g = new Game(data, mem);
g.start({ scenario: scenId, provinces, answers, difficulty: 'normal', flag: scen.flag || {}, nation: scen.nation || { officialName: 'República de Teste', shortName: 'Teste', leader: 'Líder', currency: 'Coroa', motto: '', regime: 'República' } });
const s0 = g.s;
console.log(`[${scenId}] ${s0.nation.ideology.primary} | ${s0.nation.ideology.government} | ${s0.nation.ideology.economic} | traits: ${s0.nation.ideology.traits.join(', ')}`);
console.log(`provinces=${provinces.length} pop=${s0.econ.pop.toFixed(1)}M gdp=${s0.econ.gdp.toFixed(0)}bi gdppc=${gdppc(s0).toFixed(0)} regions=${s0.regions.length} partners=${Object.keys(s0.partners).length} orgs=${Object.keys(s0.orgs).join(',')} claims vs me=${s0.world.claims.filter(c => c.holder === PLY).length}`);
const sorted = Object.entries(s0.partners).sort((a, b) => a[1].rel - b[1].rel);
console.log('worst', sorted.slice(0, 6).map(([k, p]) => `${k}:${p.rel.toFixed(0)}`).join(' '), '| best', sorted.slice(-6).reverse().map(([k, p]) => `${k}:${p.rel.toFixed(0)}`).join(' '));

let cards = 0;
g.on('issue', () => cards++);
for (let wk = 0; wk < weeks && !g.s.over; wk++) {
  for (let k = 0; k < 5 && !g.s.over; k++) {
    g.skipToNext();
    for (const p of [...g.s.issues.pending]) {
      const iss = g.getIssue(p.id);
      assert(iss, 'issue exists ' + p.id);
      if (!iss) continue;
      g.answerIssue(p.id, strategy === 'first' ? 0 : Math.floor(Math.random() * iss.options.length));
    }
  }
  const s = g.s;
  if (strategy !== 'idle' && wk % 3 === 0) {
    const cands = data.initiatives.filter(i => !g.initiativeBlock(i.id));
    if (cands.length) g.buyInitiative(cands[Math.floor(Math.random() * cands.length)].id);
  }
  if (strategy === 'war' && wk === 6) {
    s.flags.casusBelli = 1;
    const t = process.env.WAR_TARGET || [...(s.world._nb || [])].filter(id => !g.canDeclare(id)).sort((a, b) => s.world.c[a].gdp - s.world.c[b].gdp)[0];
    console.log('declare on', t, t ? g.declareWar(t, 'border').msg : 'no target');
  }
  if (strategy === 'diplo' && wk === 4) {
    const nb = [...(s.world._nb || [])].slice(0, 4);
    const r = g.createBloc({ name: 'Bloco Teste', purpose: 'both', defense: 'collective', founders: nb, policies: ['tariff'], hq: 'Capital', leave: 'free', expel: 'majority', req: {} });
    console.log('bloc', r.msg, r.results.map(x => x.msg).join(' | '));
    const lender = Object.keys(s.partners).find(id => s.partners[id].rel > 20 && (s.world.c[id]?.gdp || 0) > 100);
    if (lender) console.log('borrow', g.partnerAction(lender, 'borrow').msg);
  }
  if (strategy === 'covert') {
    const nb = [...(s.world._nb || [])].filter(id => s.world.c[id] && !s.world.c[id].dep);
    const tgt = process.env.COVERT_TARGET || nb[0];
    if (tgt && wk % 2 === 0) for (const o of g.covertOptions(tgt)) if (!o.block) g.covert(tgt, o.key);
    if (wk === 2) { console.log('program', g.startProgram('pac').msg, '|', g.startProgram('stimulus').msg); console.log('nuke', g.startNuke().msg); }
    if (wk === 10 && nb[1]) { const t2 = g.inciteTargets(nb[1]); console.log('incite', nb[1], t2[0], t2[0] ? g.incite(nb[1], t2[0]).msg : 'no targets'); }
    if (wk % 13 === 0) console.log('wk', wk, 'covert', JSON.stringify(s.world.covert), 'nuke', JSON.stringify(s.nuke), 'progs', (s.programs || []).map(x => x.id).join(','), 'insurg', JSON.stringify(s.world.insurg || {}));
  }
  for (const w of s.wars) if (w.pendingTerms) { const av = g.availableTerms(w.id).filter(x => x.ok); console.log('day', g.day, 'terms available:', av.map(x => x.key).join(','), 'score', Math.round(w.score), 'occupied', w.gained.length); g.terms(w.id, av.at(-1)?.key || 'cession'); }
  for (const k in s.st) assert(Number.isFinite(s.st[k]), `NaN st.${k} week ${wk}`);
  for (const k in s.econ) assert(Number.isFinite(s.econ[k]), `NaN econ.${k} week ${wk}`);
  if (fails > 5) break;
}
const s = g.s, st = s.st;
console.log(`strategy=${strategy} day=${g.day} cards=${cards} answered=${s.issues.answered} over=${JSON.stringify(s.over)}`);
console.log(`gdp=${s.econ.gdp.toFixed(1)} gdppc=${gdppc(s).toFixed(0)} pop=${s.econ.pop.toFixed(1)} debt%=${(s.econ.debt / s.econ.gdp * 100).toFixed(0)} treasury=${s.econ.treasury.toFixed(1)} bal=${s.d.budget.balance.toFixed(2)} provinces=${provincesOf(s, data, PLY).length}`);
console.log(['growth', 'inflation', 'unemployment', 'poverty', 'stability', 'legitimacy', 'coupRisk', 'revoRisk', 'protest', 'civil', 'political', 'separatism', 'reputation'].map(k => `${k}=${st[k].toFixed(1)}`).join(' '));
{ const b = s.d.budget, G = s.econ.gdp, f = o => Object.entries(o).filter(([, v]) => Math.abs(v) > 0.001).map(([k, v]) => k + '=' + (v / G * 100).toFixed(1)).join(' '); console.log('rev', f(b.rev), '| exp', f(b.exp), '| sanctions', s.d.sanctions.toFixed(2)); }
console.log('projection', s.st.projection.toFixed(1), 'troops', s.st.troops.toFixed(0), 'equip', s.st.equipment.toFixed(0), s.wars.map(w => `amphib=${w.amphibious} target=${w.target?.pid}:${Math.round(w.target?.p || 0)} ratio=${(w.ratio || 0).toFixed(2)}`).join(' '));
console.log('ranks', Object.entries(s.world.rankings).map(([k, v]) => `${k}:${v.pos}/${v.of}`).join(' '));
console.log('missions', s.missions.active.map(m => m.id).join(','), 'done', s.missions.done.map(m => m.id).join(','), '| cast', s.characters.filter(c => c.status === 'active').map(c => `${c.id}:${c.loyalty.toFixed(0)}`).join(' '));
console.log('wars', s.wars.map(w => `${w.enemy}:${w.result || 'active'} score ${Math.round(w.score)} gained ${w.gained.length} lost ${w.lost.length}`).join(', '), '| ai wars', s.world.wars.filter(w => w.active).map(w => w.a + 'v' + w.b).join(','), '| loans', s.world.loans.length, '| blocs', s.world.blocs.map(b => b.members.length).join(','));
console.log('log sample:', s.log.slice(0, +(process.env.LOGN || 6)).map(l => l.text).join(' || '));
g.save();
const g2 = new Game(data, mem);
assert(g2.load() && g2.s.time.min === s.time.min && provincesOf(g2.s, data, PLY).length === provincesOf(s, data, PLY).length, 'save/load roundtrip');
console.log('save size KB', Math.round(mem.store['ironstate.v3.auto'].length / 1024));
console.log(fails ? `${fails} failures` : 'OK');
process.exit(fails ? 1 : 0);
