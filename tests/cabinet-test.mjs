// Gabinete autônomo, contestação de mudanças bruscas, pedidos regionais concretos e financiamento com teto.
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
import { advisorPick } from '../js/sim/advisor.js';
const data = loadData();
const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
const mk = (seed, answers) => { const g = new Game(data, null); g.start({ seed, scenario: 'existing', provinces: data.geo.byCountry.BRA, answers: answers || data.identity.questions.map((_, i) => i % 4), difficulty: 'normal', flag: {}, nation: { officialName: 'T', shortName: 'T', leader: 'L', currency: 'x', motto: '', regime: 'R' } }); return g; };
const play = (g, n, f) => { for (let w = 0; w < n && !g.s.over; w++) { g.nextWeek(); for (const p of [...g.s.issues.pending]) { const iss = g.getIssue(p.id); if (!iss || g.s.over) continue; const i = f ? f(iss) : advisorPick(iss); g.answerIssue(p.id, i); } } };
// 1) ministros agem sozinhos
let g = mk('cab-3');
ok(g.s.pol.mandates.finance === 'balance' && g.s.pol.advisors.economist, 'mandatos e conselheiros desde o início');
play(g, 30);
const acts = g.s.log.filter(x => x.type === 'decision' && /\((Fazenda|Indústria e Comércio|Defesa|Interior e Segurança|Relações Exteriores)\)/.test(x.text));
ok(acts.length >= 4, `ministros executaram ${acts.length} ações sozinhos (ex.: ${acts[0]?.text})`);
// 2) contestação: governo de esquerda corta impostos bruscamente
let contested = 0;
// O sorteio é sensível ao fluxo de RNG; tenta algumas sementes e exige contestação em ao menos uma.
for (const seed of ['cab-2', 'cab-5', 'cab-9']) { if (contested) break;
g = mk(seed, data.identity.questions.map(() => 0));
for (let i = 0; i < 12; i++) { g.setTax(g.s.budget.tax + (i % 2 ? -9 : 9)); g.nextWeek(); contested += g.s.issues.pending.filter(p => p.id.startsWith('dyn_contest')).length; for (const p of [...g.s.issues.pending]) { const iss = g.getIssue(p.id); if (iss) g.answerIssue(p.id, iss.options.length - 1 > 0 && p.id.startsWith('dyn_contest') ? 1 : advisorPick(iss)); } } }
ok(contested > 0, `mudanças bruscas geram contestação (${contested})`);
// 3) pedidos regionais com obra concreta no mapa
g = mk('cab-3');
let pork = null;
for (let w = 0; w < 80 && !pork; w++) { g.nextWeek(); pork = g.s.issues.pending.map(p => g.getIssue(p.id)).find(i => i?.id?.startsWith('dyn_pork')); for (const p of [...g.s.issues.pending]) { const iss = g.getIssue(p.id); if (iss && !iss.id.startsWith('dyn_pork')) g.answerIssue(p.id, advisorPick(iss)); } }
ok(pork && pork.focusProv && g.s.pork.some(x => x.status === 'open' && x.pid === pork.focusProv), 'pedido regional aparece no mapa (província marcada)');
if (pork) { const pid = pork.focusProv, n0 = (g.s.buildings?.[pid] || []).length; g.answerIssue(pork.id, 0); ok((g.s.buildings[pid] || []).length === n0 + 1, `aprovar cria a obra concreta em ${data.geo.prov[pid].n}`); }
// 4) financiamento com teto
g = mk('cab-3');
const r1 = g.raiseFunds('print', 1), r2 = g.raiseFunds('print', 1), r3 = g.raiseFunds('print', 1);
ok(r1.ok && !r3.ok, `emissão tem teto anual (${r1.msg} / ${r3.msg})`);
const pool = g.s.fin.pool;
ok(g.sectorInvest('health', 0.5).ok && g.s.fin.pool < pool, 'investimento setorial usa a carteira');
const f0 = g.s.fin.fund, rf = g.raiseFunds('fund', 50);
ok(rf.ok && g.s.fin.fund < 1e-9 && !g.raiseFunds('fund', 1).ok, `o fundo se esgota (${f0.toFixed(1)} bi)`);
