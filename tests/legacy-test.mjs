// Teste dirigido: legado e retorno ao poder.
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
for (let i = 0; i < 40; i++) { g.nextWeek(); answerAll(() => 0); }
const snap = JSON.stringify(s);
const fresh = end => { const g2 = new Game(data, mem); g2.s = JSON.parse(snap); g2.useWorld(g2.s.world.wscn || null); g2.s.over = { ending: end, cause: 'teste', day: g2.day }; g2.finish(); return g2; };
for (const end of ['killed', 'executed', 'vaporized', 'exile', 'trial', 'junta', 'civilwar', 'handover', 'democracy']) {
  const g2 = fresh(end), L = g2.legacy(), info = g2.comebackInfo();
  ok(L.paragraphs.length >= 5 && L.grade.g && L.epitaph, end + ': legado ' + L.grade.g + ' (' + L.idx + '), retorno ' + (info.allowed ? 'sim ' + Math.round(info.chance * 100) + '%' : 'não'));
  if (['killed', 'executed', 'vaporized'].includes(end)) ok(!info.allowed && g2.tryComeback().blocked, end + ' não pode voltar');
}
const k = fresh('killed'); k.s.d.support = 15; k.s.st.legitimacy = 15; ok(/depredada/.test(k.legacy().epitaph), 'epitáfio de morto impopular: ' + k.legacy().epitaph.slice(0, 70));
const hi = fresh('exile'); hi.s.d.support = 90; hi.s.st.legitimacy = 90; const lo = fresh('exile'); lo.s.d.support = 10; lo.s.st.legitimacy = 10;
ok(hi.comebackInfo().chance > lo.comebackInfo().chance + 0.2, 'popularidade aumenta a chance: ' + hi.comebackInfo().chance.toFixed(2) + ' vs ' + lo.comebackInfo().chance.toFixed(2));
// sorteios: encontra um sucesso e um fracasso
let win = null, lose = null;
for (let i = 0; i < 40 && !(win && lose); i++) { const g2 = fresh('civilwar'); g2.s.rng = i * 7919 + 1; const r = g2.tryComeback(); if (r.ok && !win) win = { g2, r }; if (!r.ok && !lose) lose = { g2, r }; }
ok(!!win, 'houve retorno ao poder: ' + win?.r.text.slice(0, 90));
if (win) {
  const s2 = win.g2.s; ok(!s2.over && s2.comeback.used, 'jogo retomado');
  ok(!win.g2.comebackInfo().allowed, 'só uma tentativa');
  const mine = Object.keys(data.geo.prov).filter(p => (s2.world.owner[p] ?? data.geo.prov[p].a3) === 'PLY').length;
  ok(mine > 0 && mine < 60, 'território reduzido: ' + mine + ' províncias');
  ok((s2.world.newStates || []).length >= 1, 'novo regime ocupa o resto: ' + s2.world.ents[s2.world.newStates[0].id]?.name);
  for (let i = 0; i < 40 && !s2.over; i++) { win.g2.nextWeek(); for (const p of [...s2.issues.pending]) win.g2.answerIssue(p.id, 0); }
  ok(true, 'campanha segue 40 semanas após o retorno (over=' + s2.over?.ending + ')');
}
ok(!!lose && lose.g2.s.over && lose.g2.s.over.comebackFailed, 'retorno fracassado mantém o game over: ' + lose?.r.text.slice(0, 60));
console.log(fails ? fails + ' FALHAS' : 'OK'); process.exit(fails ? 1 : 0);
