// Teste: modo Alcance o poder v2 (facções, ações, propaganda, discursos, rotas e herança).
import { Game } from '../js/sim/game.js';
import { routeInfo } from '../js/sim/ascent2.js';
import { loadData } from './sim-data.mjs';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const NAT = { officialName: 'Teste', shortName: 'Teste', leader: 'L', currency: 'x', motto: '', regime: 'República' };
for (const iso of ['BRA', 'EGY']) {
  const g = new Game(data, mem);
  g.start({ mode: 'ascension', scenario: 'existing', provinces: data.geo.byCountry[iso], answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: NAT });
  const s = g.s, A = s.ascent;
  ok(!!A && !!A.fac && A.ap === 3 || A.ap >= 0, `${iso}: origem ${A.origin}, facções criadas`);
  let r = g.ascAct('rally'); ok(r.ok, 'ação comício: ' + r.msg);
  r = g.ascAct('court:officers'); ok(r.ok || /Dinheiro/.test(r.msg), 'cortejar facção: ' + r.msg);
  g.ascAct('budget', 1.5);
  r = g.ascAct('speech', { own: true, aud: ['unions', 'students'], topics: ['economy', 'rights'], tone: 'heroico', promises: [{ kind: 'jobs' }] });
  ok(r.ok || /ação|dinheiro/i.test(r.msg), 'discurso: ' + r.msg);
  ok(Object.keys(routeInfo(s)).length === 3, 'rotas com chance: ' + Object.values(routeInfo(s)).map(x => Math.round(x.p * 100) + '%').join('/'));
  let weeks = 0;
  while (s.ascent && !s.over && weeks < 60) {
    weeks++; g.nextWeek();
    for (const p of [...s.issues.pending]) g.answerIssue(p.id, 0);
    for (const op of ['door', 'media', 'rally', 'charity', 'net']) g.ascAct(op);
    if (s.ascent) { const R = routeInfo(s); if (R.election.ok && R.election.p > 0.5) g.ascAct('route', 'election'); }
  }
  ok(!s.ascent || s.over, `${iso}: terminou em ${weeks} semanas (${s.over ? 'game over: ' + s.over.ending : 'chegou ao poder via ' + s.flags.ascended})`);
  if (!s.ascent && !s.over) ok(s.prop?.promises?.length >= 1, 'promessas viram obrigações do governo');
}
console.log(fails ? fails + ' FALHAS' : 'OK'); process.exit(fails ? 1 : 0);
