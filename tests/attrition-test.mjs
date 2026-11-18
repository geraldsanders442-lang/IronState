// Teste: custo das guerras (baixas, destruição, cansaço, resistência em territórios conquistados).
import { Game } from '../js/sim/game.js';
import { presetWorld } from '../js/sim/customworld.js';
import { warSummary, fmtK } from '../js/sim/attrition.js';
import { entOf, provincesOf, PLY } from '../js/sim/world.js';
import { loadData } from './sim-data.mjs';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const NAT = { officialName: 'Observatório Mundial', shortName: 'Observatório', leader: 'Observador', currency: '-', motto: '', regime: '' };
const weeks = +(process.argv[2] || 104);

const g = new Game(data, mem);
g.start({ seed: 5, spectator: true, scenario: 'existing', provinces: ['ATA+99?'], answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: NAT, lab: { chaos: 90 } });
const s = g.s, W = s.world;
// Guerra provocada entre um país forte e um fraco vizinho: o forte não pode crescer sem limite.
g.labAct({ type: 'war', a: 'TUR', b: 'SYR' });
g.labAct({ type: 'war', a: 'RUS', b: 'KAZ' });
const p0 = provincesOf(s, g.data, 'TUR').length, gdp0 = W.c.SYR.gdp;
let maxExh = 0, t0 = Date.now();
for (let i = 0; i < weeks; i++) { g.nextWeek(); for (const id in W.c) maxExh = Math.max(maxExh, W.c[id].exh || 0); }
const ms = (Date.now() - t0) / weeks;
const S = warSummary(s, g.data);
console.log(`   ${weeks} semanas, ${ms.toFixed(0)} ms/semana`);
console.log(`   mortos: ${fmtK(S.mil)} soldados, ${fmtK(S.civ)} civis · refugiados ${fmtK(S.ref)} · PIB destruído ${S.lost.toFixed(0)} bi · destruição ${S.destruction.toFixed(2)}% · ${S.devastated} províncias devastadas · ${S.insurg} focos de insurgência · ${S.revolts} levantes`);
console.log('   mais devastadas:', S.worst.slice(0, 5).map(([p, D]) => `${g.data.geo.prov[p].n} ${D[0]}% (${D[1]} sem.)`).join(' | '));
console.log('   insurgência:', S.hot.slice(0, 5).map(([p, R]) => `${g.data.geo.prov[p].n} ${R[0]}`).join(' | '));
console.log('   Turquia: províncias', p0, '→', provincesOf(s, g.data, 'TUR').length, '· cansaço', (W.c.TUR?.exh || 0).toFixed(0), '· sobre-extensão', W.c.TUR?.overext || 0);
console.log('   guerras:', W.wars.filter(w => w.ai).slice(0, 10).map(w => `${entOf(s, g.data, w.a[0])?.name}×${entOf(s, g.data, w.b[0])?.name} ${w.active ? 'ativa' : w.exhausted ? 'exaustão' : 'fim'} baixas ${Math.round((w.casA || 0) + (w.casB || 0))}k civis ${Math.round(w.civ || 0)}k`).join(' | '));
ok(S.mil > 1 && S.civ > 0.5, 'guerras matam soldados e civis');
ok(S.devastated > 0 && S.lost > 0, 'guerras destroem infraestrutura e PIB');
ok(maxExh > 30, `países acumulam cansaço de guerra (máx. ${maxExh.toFixed(0)})`);
ok(W.wars.some(w => w.exhausted) || W.wars.filter(w => w.ai && w.active).length < W.wars.filter(w => w.ai).length, 'guerras terminam (por exaustão ou decisão)');
ok(Object.keys(W.res).length > 0 || S.revolts > 0, 'territórios conquistados resistem');
ok(ms < 450, 'desempenho aceitável');
g.save(); const g2 = new Game(data, mem); ok(g2.load('auto') && g2.s.world.dmg, 'save/load mantém danos e resistência');

// Jogo normal: guerra do jogador gera destruição e questões de pós-guerra.
const gp = new Game(data, mem);
gp.start({ seed: 8, scenario: 'existing', provinces: data.geo.byCountry.ARM, answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { ...NAT, officialName: 'Armênia', shortName: 'Armênia' } });
const r = gp.declareWar ? gp.declareWar('AZE', 'border') : null;
let cards = new Set();
for (let i = 0; i < 40 && !gp.s.over; i++) { gp.nextWeek(); for (const p of gp.s.issues.pending) if (String(p.id).startsWith('dyn_attr')) cards.add(String(p.id).split('_')[2]); }
const Wp = gp.s.world;
console.log('   jogador: guerra', r?.ok ?? r, '· províncias danificadas', Object.keys(Wp.dmg || {}).length, '· civis do jogador', (Wp.plyCiv || 0).toFixed(2), 'mil · questões:', [...cards].join(', ') || 'nenhuma');
ok(Object.keys(Wp.dmg || {}).length > 0, 'guerra do jogador danifica províncias');
console.log(fails ? fails + ' FALHAS' : 'OK'); process.exit(fails ? 1 : 0);
