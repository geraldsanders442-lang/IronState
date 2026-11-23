// Saúde e saneamento: dados reais de partida, obras elevam a cobertura, falta de verba e guerra corroem, IDH coerente.
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
import { healthBaseline, healthAct, hdiOf, ensureHealth } from '../js/sim/health.js';
const data = loadData();
const mem = () => ({ store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} });
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
function play(a3, level, weeks = 104) {
  const g = new Game(data, mem());
  g.start({ seed: 'saude-' + a3, scenario: 'existing', provinces: data.geo.byCountry[a3], answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'T', shortName: 'T', leader: 'L', currency: 'x', motto: '', regime: 'R' } });
  ensureHealth(g.s, data);
  for (const k of ['san', 'water', 'hyg', 'clinic']) healthAct(g.s, data, 'fund', `${k}|${level}`);
  const h0 = { ...g.s.hlt };
  for (let w = 0; w < weeks && !g.s.over; w++) { g.s.econ.treasury = Math.max(g.s.econ.treasury, g.s.econ.gdp); g.nextWeek(); for (const p of [...g.s.issues.pending]) g.answerIssue(p.id, 0); }
  return { g, h0, h: g.s.hlt };
}
// Dados reais: o Chade é bem pior que a Noruega, e valores batem com o Banco Mundial.
const tcd = healthBaseline(data, 'TCD'), nor = healthBaseline(data, 'NOR'), ind = healthBaseline(data, 'IND');
ok(tcd.real && tcd.san < 20 && tcd.od > 50, `Chade: saneamento ${tcd.san}% e céu aberto ${tcd.od}%`);
ok(nor.san > 95 && nor.le > 80, `Noruega: saneamento ${nor.san}% e vida ${nor.le}`);
ok(ind.od < 15 && ind.san > 75, `Índia: saneamento ${ind.san}%`);
// Sem verba o saneamento não sobe como com prioridade nacional; com prioridade nacional a cobertura e o IDH sobem.
const a = play('NER', 0), b = play('NER', 3);
ok(b.h.san > a.h.san + 3, `Níger: com prioridade ${b.h.san.toFixed(1)}% > sem verba ${a.h.san.toFixed(1)}%`);
ok(b.h.od < a.h.od, `defecação a céu aberto cai com obras (${b.h.od.toFixed(1)}% < ${a.h.od.toFixed(1)}%)`);
ok(b.h.idx > a.h.idx + 2 && b.h.water > a.h.water, `índice de saúde pública sobe com obras (${b.h.idx.toFixed(1)} > ${a.h.idx.toFixed(1)}); água ${b.h.water.toFixed(1)}% > ${a.h.water.toFixed(1)}%`);
{ const s = b.g.s, v0 = hdiOf(s); s.hlt.le += 5; const v1 = hdiOf(s); s.hlt.le -= 5; ok(v1 > v0, `IDH sobe com a expectativa de vida (${v0.toFixed(3)} → ${v1.toFixed(3)})`); }
ok(hdiOf(b.g.s) > 0.2 && hdiOf(b.g.s) < 0.98, 'IDH em faixa plausível');
console.log(fails ? 'FALHOU' : 'OK'); process.exit(fails ? 1 : 0);
