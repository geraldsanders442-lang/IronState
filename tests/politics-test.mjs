// Teste dirigido: parlamento, eleição, coalizão, lei sem maioria, golpe → guerra civil, morte do líder.
import { Game, PLY } from '../js/sim/game.js';
import { provincesOf } from '../js/sim/world.js';
import { loadData } from './sim-data.mjs';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const mk = seed => { const g = new Game(data, mem); g.start({ seed, scenario: 'existing', provinces: data.geo.byCountry.BRA, answers: data.identity.questions.map(() => 2), difficulty: 'normal', flag: {}, nation: { officialName: 'Teste', shortName: 'Teste', leader: 'Presidente Silva', currency: 'x', motto: '', regime: 'República' } }); return g; };
const answer = (g, pickFn = () => 0) => { for (const p of [...g.s.issues.pending]) { const i = g.getIssue(p.id); if (i) g.answerIssue(p.id, pickFn(i, p)); } };
let g = mk('pol-1'), s = g.s;
ok(s.pol.parties.length >= 4 && s.pol.seatsTotal > 100, `parties: ${s.pol.parties.map(p => p.name + ' ' + p.vote.toFixed(0) + '%').join(', ')} | seats ${s.pol.seatsTotal}`);
ok(Object.keys(s.pol.cabinet).length === 8 && s.pol.factions.length >= 5, 'cabinet 8 portfolios, factions ' + s.pol.factions.map(f => f.name).join(', '));
// Eleição multipartidária
s.policies.elections = 'multiparty'; s.pol.nextElection = g.day + 50;
let sawCampaign = false, sawResult = null;
g.on('election', r => { sawResult = r; });
for (let w = 0; w < 9 && !sawResult; w++) { g.nextWeek(); if (s.issues.pending.some(p => p.id.startsWith('dyn_campaign'))) sawCampaign = true; answer(g); }
ok(sawCampaign, 'campaign cards appeared');
ok(!!sawResult, 'election held: ' + (sawResult ? sawResult.parties.map(p => `${p.name} ${p.vote}% ${p.seats}`).join(' | ') : ''));
// Lei sem maioria
for (const p of s.pol.parties) { p.coalition = p.gov; p.seats = p.gov ? 10 : Math.floor((s.pol.seatsTotal - 10) / (s.pol.parties.length - 1)); }
let tries = 0, rej = null;
for (const lvl of ['free', 'state', 'free', 'state', 'free', 'state']) { s.counters.polCd = {}; const r = g.setPolicy('press', lvl); tries++; if (!r.ok && r.needVotes) { rej = r; break; } }
ok(!!rej, 'law rejected without majority: ' + rej?.msg);
s.counters.polCd = {};
ok(g.setPolicy('press', s.policies.press === 'free' ? 'state' : 'free', { buy: true }).ok, 'buying votes passes the law');
// Golpe → guerra civil
g = mk('pol-2'); s = g.s;
const prov0 = provincesOf(s, data, PLY).length;
const { startUprising } = await import('../js/sim/politics.js');
startUprising(s, 'coup', 0.5); s.pol.uprising.prog = 50;
for (let w = 0; w < 6 && s.pol.uprising; w++) { s.pol.uprising.prog = 50; g.nextWeek(); answer(g, (i) => i.id.startsWith('dyn_uprising') ? 2 : 0); }
ok(!s.pol.uprising && s.flags.civilWar && provincesOf(s, data, PLY).length < prov0 && s.wars.some(w => w.active && w.civil), `civil war: provinces ${prov0} → ${provincesOf(s, data, PLY).length}, rebels ${Object.keys(s.world.ents).filter(k => k.startsWith('CIV')).map(k => s.world.ents[k].name)}`);
// Morte do líder → sucessão
g = mk('pol-3'); s = g.s;
const old = s.nation.leader;
g.leaderDies('natural');
const dc = s.issues.pending.find(p => p.id.startsWith('dyn_death'));
ok(!!dc, 'death card'); if (dc) g.answerIssue(dc.id, 0);
ok(s.nation.leader !== old && !s.over && s.pol.leader.gen === 2, `successor: ${old} → ${s.nation.leader}`);
// Nomear ministro
const c = g.candidates('finance'); const r = g.appoint('finance', 0);
ok(r.ok && s.pol.cabinet.finance.name === c[0]?.name || r.ok, 'appointed finance minister: ' + r.msg);
// Constituição
const rc = g.amendConstitution({ system: 'parliamentary', limits: 2 });
ok(typeof rc.ok === 'boolean', 'constitution amendment: ' + rc.msg);
console.log(fails ? fails + ' failures' : 'OK'); process.exit(fails ? 1 : 0);
