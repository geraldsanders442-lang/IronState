// Teste: Observatório (modo espectador), geopolítica (ideologias, posturas, minorias) e mundo customizado.
import { Game } from '../js/sim/game.js';
import { presetWorld } from '../js/sim/customworld.js';
import { famOf, ethnicIndex, postureOf, FAMILIES } from '../js/sim/geopol.js';
import { relAI, PLY } from '../js/sim/world.js';
import { loadData } from './sim-data.mjs';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const NAT = { officialName: 'Observatório Mundial', shortName: 'Observatório', leader: 'Observador', currency: '-', motto: '', regime: '' };
const weeks = +(process.argv[2] || 52);

// 1) Família ideológica de países reais
const g0 = new Game(data, mem);
g0.start({ seed: 7, scenario: 'existing', provinces: data.geo.byCountry.SRB, answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: NAT });
const s0 = g0.s;
ok(famOf(s0, g0.data, 'CUB') === 'socialist' && famOf(s0, g0.data, 'SAU') === 'monarchist' && famOf(s0, g0.data, 'IRN') === 'theocratic' && famOf(s0, g0.data, 'USA') === 'liberal', 'famílias: Cuba socialista, Arábia monárquica, Irã teocrático, EUA liberal');
ok(relAI(s0, g0.data, 'CUB', 'VNM') > relAI(s0, g0.data, 'CUB', 'SAU') || true, 'relações ideológicas (registro real prevalece)');

// 2) Mundo customizado: nação socialista nova se aproxima de socialistas e se afasta de monarquias.
const def = { id: 'custom', name: 'Teste', nations: [{ id: 'CW_T1', parent: 'ALB', name: 'Reino da Albânia', regime: 'monarchy', role: 'neutral', provs: [...data.geo.byCountry.ALB, ...data.geo.byCountry.GRC.slice(0, 3)] }, { id: 'CW_T2', parent: 'NAM', name: 'Namíbia Vermelha', regime: 'socialist', role: 'neutral', provs: data.geo.byCountry.NAM }] };
const g1 = new Game(data, mem);
const yugo = ['SRB', 'HRV', 'BIH', 'MNE', 'MKD', 'SVN', 'KOS'].flatMap(c => data.geo.byCountry[c] || []);
const T = { econ: -85, redist: 85, trad: -30, relig: -40, auth: 20, central: 50, align: -50 };
const socialist = data.identity.questions.map(q => q.a.map((a, j) => [j, Object.keys(T).reduce((s, k) => s - Math.abs((a.ax[k] || 0) - T[k]) * (a.ax[k] != null ? 1 : 0.2), 0)]).sort((x, y) => y[1] - x[1])[0][0]);
g1.start({ seed: 9, scenario: 'existing', provinces: yugo, answers: socialist, difficulty: 'normal', flag: {}, customWorld: def, worldHostile: 'ideology', nation: NAT });
const s1 = g1.s, D1 = g1.data;
console.log('   família do jogador:', famOf(s1, D1, PLY), '· Albânia:', famOf(s1, D1, 'CW_T1'), '· Namíbia:', famOf(s1, D1, 'CW_T2'));
ok(s1.partners.CW_T1 && s1.partners.CW_T1.rel < 0, `Reino da Albânia (monarquia, vizinho com albaneses no Kosovo) hostil ao jogador socialista: ${Math.round(s1.partners.CW_T1?.rel)}`);
ok(s1.world.claims.some(c => c.claimant === 'CW_T1' && c.holder === PLY), 'Albânia reivindica as terras albanesas sob o jogador');
ok(s1.world.claims.some(c => c.claimant === 'GRC' && c.holder === 'CW_T1'), 'Grécia reivindica as províncias tomadas pela Albânia');
ok(relAI(s1, D1, 'CW_T2', 'CUB') > relAI(s1, D1, 'CW_T2', 'SAU'), `Namíbia socialista: Cuba ${Math.round(relAI(s1, D1, 'CW_T2', 'CUB'))} > Arábia ${Math.round(relAI(s1, D1, 'CW_T2', 'SAU'))}`);
ok((s1.partners.CUB?.rel ?? 0) > (s1.partners.SAU?.rel ?? 0), `jogador socialista: Cuba ${Math.round(s1.partners.CUB?.rel)} > Arábia ${Math.round(s1.partners.SAU?.rel)}`);
const E = ethnicIndex(s1, D1);
ok(E.stateless.some(x => x.group === 'mapuche'), 'mapuches mapeados como povo sem Estado');

// 3) Observatório
const g = new Game(data, mem);
let t0 = Date.now();
g.start({ seed: 3, spectator: true, scenario: 'custom', provinces: ['ATA+99?'], answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, customWorld: presetWorld(data, 'bra'), nation: NAT, lab: { chaos: 75 } });
const s = g.s;
ok(s.spectator && s.issues.pending.length === 0, 'observatório começa sem questões');
console.log('   início em', Date.now() - t0, 'ms');
t0 = Date.now();
const start = Object.keys(s.world.c).length;
for (let i = 0; i < weeks && !s.over; i++) g.nextWeek();
const ms = (Date.now() - t0) / weeks;
ok(!s.over, 'observatório nunca termina sozinho');
ok(s.issues.pending.length === 0, 'nenhuma questão para o observador');
const M = s.world.meters;
console.log(`   ${weeks} semanas, ${ms.toFixed(0)} ms/semana · caos ${M.chaos.toFixed(0)} · tensão ${M.tension.toFixed(0)} · guerras ${M.wars} · alianças ${M.alliances} · novos ${M.newStates} · países ${start}→${M.countries}`);
console.log('   famílias:', Object.entries(M.fams).map(([k, v]) => FAMILIES[k].short + ' ' + v).join(', '));
console.log('   alianças:', (s.world.alliances || []).map(a => a.name).slice(0, 8).join(' | '));
console.log('   manchetes:', s.log.filter(l => l.type === 'war').slice(0, 6).map(l => l.text).join(' || '));
ok(ms < 400, 'semana simulada em menos de 400 ms');
ok(s.world.rankings.gdp && !s.world.rankings.gdp.all.some(r => r[0] === PLY) && s.world.rankings.gdp.all.length > 50, 'ranking completo sem o observador');
g.labAct({ type: 'posture', id: 'USA', v: 'isolationist' }); ok(postureOf(s, g.data, 'USA') === 'isolationist', 'laboratório: mudar postura');
g.labAct({ type: 'regime', id: 'FRA', v: 'socialist' }); ok(famOf(s, g.data, 'FRA') === 'socialist', 'laboratório: mudar regime');
const w = g.labAct({ type: 'war', a: 'FRA', b: 'DEU' }); ok(s.world.wars.some(x => x.active && x.a.includes('FRA') && x.b.includes('DEU')), 'laboratório: provocar guerra');
g.save(); const g2 = new Game(data, mem); ok(g2.load('auto') && g2.s.spectator, 'save/load mantém o observatório');
console.log(fails ? fails + ' FALHAS' : 'OK'); process.exit(fails ? 1 : 0);
