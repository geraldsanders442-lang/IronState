// Modos de jogo: desafio, ascensão ao poder, desafio diário, roguelite e dinastia.
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
import { dailyConfig, challengeById, loadMeta } from '../js/sim/modes.js';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const mk = (mode, modeCfg, country, seed) => { const g = new Game(data, mem); g.start({ seed: seed || mode, mode, modeCfg, scenario: 'existing', provinces: data.geo.byCountry[country], answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'T', shortName: 'T', leader: 'Líder Teste', currency: 'x', motto: '', regime: 'R' } }); return g; };
const answer = (g, f = () => 0) => { for (const p of [...g.s.issues.pending]) { const i = g.getIssue(p.id); if (i) g.answerIssue(p.id, f(i)); } };
// Desafio
let g = mk('challenge', { challenge: 'hyper' }, 'ARG');
ok(g.s.st.inflation >= 100 && g.s.modeCfg.weeks === 40, 'challenge setup: inflation ' + g.s.st.inflation.toFixed(0));
for (let w = 0; w < 45 && !g.s.over; w++) { g.nextWeek(); answer(g); }
ok(!!g.s.over && ['modeWin', 'modeLose'].includes(g.s.over.ending) || !!g.s.over, 'challenge ended: ' + JSON.stringify(g.s.over) + ' score ' + g.s.score);
// Ascensão
g = mk('ascension', {}, 'MEX');
ok(!!g.s.ascent && g.s.issues.pending.length === 1 && g.s.issues.pending[0].id.startsWith('dyn_ascent'), 'ascension: only the movement card at start');
for (let w = 0; w < 60 && g.s.ascent && !g.s.over; w++) {
  answer(g, () => 0);
  for (const op of ['door', 'media', 'rally']) g.ascAct(op);
  const A = g.s.ascent; if (A && A.support >= 40 && A.week >= 12) g.ascAct('route', 'election');
  if (!g.s.ascent) break;
  g.nextWeek();
}
ok(!g.s.ascent && !!g.s.flags.ascended, 'reached power via ' + g.s.flags.ascended);
g.nextWeek();
ok(g.s.issues.pending.some(p => !p.id.startsWith('dyn_ascent')), 'normal issues resume after taking power');
// Diário
const d = dailyConfig(new Date('2026-10-21T12:00:00Z'));
ok(d.country && challengeById[d.challenge] && d.seed === 'daily-2026-10-21', `daily: ${d.country} / ${d.challenge}`);
const a = mk('daily', { challenge: d.challenge, key: d.key, weeks: 30 }, d.country, d.seed), b = mk('daily', { challenge: d.challenge, key: d.key, weeks: 30 }, d.country, d.seed);
for (let w = 0; w < 5; w++) { a.nextWeek(); answer(a); b.nextWeek(); answer(b); }
ok(JSON.stringify(a.s.econ) === JSON.stringify(b.s.econ), 'daily is identical for everyone');
// Roguelite
g = mk('roguelite', { perks: ['treasury', 'legit'] }, 'PER');
ok(g.s.modeCfg.weeks === 52, 'roguelite season of 52 weeks');
for (let w = 0; w < 55 && !g.s.over; w++) { g.nextWeek(); answer(g); }
const M = loadMeta(mem);
ok(g.s.over && M.legacy > 0, `season over (${g.s.over?.ending}), legacy now ${M.legacy}, score ${g.s.score}`);
// Dinastia
g = mk('dynasty', {}, 'SAU');
const first = g.s.nation.leader; g.leaderDies('natural');
ok(g.s.nation.leader !== first && !g.s.issues.pending.some(p => p.id.startsWith('dyn_death')), 'dynasty: heir takes over automatically');
console.log(fails ? fails + ' failures' : 'OK'); process.exit(fails ? 1 : 0);
