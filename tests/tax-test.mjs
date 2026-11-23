// Impostos e tarifas: receita, custos, lobby (questão), retaliação e queda por pressão.
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
import { taxAct, ensureTax, MEASURES } from '../js/sim/tariffs.js';
const data = loadData();
const mem = () => ({ store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} });
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
function start(seed, a3 = 'BRA') {
  const g = new Game(data, mem());
  g.start({ seed, scenario: 'existing', provinces: data.geo.byCountry[a3], answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'T', shortName: 'T', leader: 'L', currency: 'x', motto: '', regime: 'R' } });
  ensureTax(g.s); return g;
}
const week = (g, answer = 0) => { g.s.econ.treasury = Math.max(g.s.econ.treasury, g.s.econ.gdp); g.nextWeek(); for (const p of [...g.s.issues.pending]) { if (p.id.startsWith('tax_lobby_')) continue; g.answerIssue(p.id, answer); } };
// 1) Medidas rendem receita e custam algo.
{
  const g = start('imp-1'); const s = g.s;
  ok(taxAct(s, data, 'set', 'tobacco|3').ok && taxAct(s, data, 'set', 'wealth|2').ok && taxAct(s, data, 'set', 'consumption|2').ok, 'define impostos seletivo, de classe e de consumo');
  const partner = Object.keys(s.partners).find(id => s.world.c[id] && s.world.c[id].gdp > 500);
  ok(taxAct(s, data, 'tariff', `c|${partner}|3`).ok && taxAct(s, data, 'tariff', 'p|electronics|2').ok, 'tarifa por país e por produto');
  for (let i = 0; i < 20; i++) week(g);
  ok(s.tx.rev > 0, `receita das medidas: ${s.tx.rev.toFixed(2)} bi/ano`);
  ok((s.tx.mods.g_business || 0) < 0 && (s.tx.mods.inflation || 0) > 0, `efeitos: empresários ${s.tx.mods.g_business.toFixed(1)}, inflação +${s.tx.mods.inflation.toFixed(2)}`);
}
// 2) Lobby vira questão e a retaliação aparece em tarifas altas.
{
  let card = 0, retal = 0;
  for (let k = 0; k < 6; k++) {
    const g = start('imp-lob-' + k), s = g.s; for (const m of ['wealth|4', 'corporate|4', 'banks|4']) taxAct(s, data, 'set', m);
    const partner = Object.keys(s.partners).find(id => s.world.c[id] && s.world.c[id].gdp > 500); taxAct(s, data, 'tariff', `c|${partner}|4`);
    for (let i = 0; i < 60; i++) { week(g); if (s.issues.pending.some(p => p.id.startsWith('tax_lobby_'))) { card++; break; } }
    if (Object.keys(s.tx.retal).length) retal++;
  }
  ok(card >= 3, `lobby gera questão em ${card}/6 partidas`);
  ok(retal >= 1, `retaliação a tarifas altas em ${retal}/6 partidas`);
}
// 3) Responder ao lobby muda a medida.
{
  const g = start('imp-resp'), s = g.s; taxAct(s, data, 'set', 'wealth|4');
  for (let i = 0; i < 80 && !s.issues.pending.some(p => p.id.startsWith('tax_lobby_')); i++) week(g);
  const p = s.issues.pending.find(x => x.id.startsWith('tax_lobby_'));
  if (p) { g.answerIssue(p.id, 1); ok(s.tx.m.wealth === 3, 'negociar reduz um nível'); } else ok(false, 'questão de lobby não apareceu');
}
// 4) Remover tarifa/medida zera.
{
  const g = start('imp-rm'), s = g.s; taxAct(s, data, 'set', 'sugar|2'); taxAct(s, data, 'set', 'sugar|0');
  ok(!s.tx.m.sugar, 'imposto extinto');
}
console.log(fails ? 'FALHOU' : 'OK'); process.exit(fails ? 1 : 0);
