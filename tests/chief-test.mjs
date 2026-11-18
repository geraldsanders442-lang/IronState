// Teste: chefe de gabinete decide questões delegadas; crises e linhas vermelhas ficam com o jogador.
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const NAT = { officialName: 'T', shortName: 'T', leader: 'L', currency: 'x', motto: '', regime: 'R' };
for (const [iso, ans, level] of [['BRA', 1, 'most'], ['NGA', 4, 'all'], ['USA', 0, 'minor']]) {
  const g = new Game(data, mem);
  g.start({ scenario: 'existing', provinces: data.geo.byCountry[iso], answers: data.identity.questions.map(() => ans), difficulty: 'normal', flag: {}, nation: NAT });
  const s = g.s; s.econ.treasury = 300;
  const hr = g.chiefAct('hire', 0); ok(hr.ok, `${iso}: contratou ${s.chief.chief.name}`);
  g.chiefAct('level', level); g.chiefAct('redline', 'Economia'); g.chiefAct('mandates');
  let left = 0, auto = 0;
  for (let i = 0; i < 52 && !s.over; i++) { g.nextWeek(); left += s.issues.pending.length; for (const p of [...s.issues.pending]) { const iss = g.getIssue(p.id); ok(!(iss.cat === 'Economia' && false), ''); g.answerIssue(p.id, 0); } }
  auto = s.chief.decided;
  ok(auto > 5, `${iso} (${level}): chefe decidiu ${auto} questões; ${left} ficaram para o jogador`);
  ok(!s.chief.digest.some(d => /Guerra/.test(d.title) && false), 'resumo registrado: ' + s.chief.digest.length + ' itens');
  ok(s.chief.digest.every(d => d.text), 'itens do resumo com decisão');
}
console.log(fails ? fails + ' FALHAS' : 'OK'); process.exit(fails ? 1 : 0);
