// Teste dirigido: cenários mundiais.
import { Game, PLY } from '../js/sim/game.js';
import { provincesOf } from '../js/sim/world.js';
import { loadData } from './sim-data.mjs';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const g = new Game(data, mem);
g.start({ scenario: 'existing', provinces: data.geo.byCountry.BRA, answers: data.identity.questions.map(() => 1), difficulty: 'normal', worldScenario: process.argv[2] || 'red_world', worldHostile: 'ideology', flag: {}, nation: { officialName: 'Teste', shortName: 'Teste', leader: 'L', currency: 'x', motto: '', regime: 'República' } });
const s = g.s; s.econ.treasury = 500;
const answerAll = pick => { for (const p of [...s.issues.pending]) { const iss = g.getIssue(p.id); g.answerIssue(p.id, pick(iss)); } };
const W = s.world, dd = g.data;
ok(W.wscn === (process.argv[2] || 'red_world'), 'cenário mundial gravado: ' + W.wscn);
ok(dd !== g.baseData && dd.wscn, 'dados do mundo reescritos');
const align = {}; for (const id of Object.keys(W.c)) { const a = dd.reg[id]?.profile?.align; align[a] = (align[a] || 0) + 1; }
console.log('  alinhamentos:', JSON.stringify(align));
console.log('  Brasil:', dd.reg.BRA.name, '|', dd.reg.BRA.profile.regimeName, '| EUA:', dd.reg.USA.name, '|', dd.reg.USA.profile.regimeName, '| GBR:', dd.reg.GBR.name, '| RUS:', dd.reg.RUS.name);
ok(dd.reg.BRA.profile !== g.baseData.reg.BRA.profile, 'perfil do Brasil reescrito sem tocar nos dados-base');
ok((W.alliances || []).length >= 1, 'alianças temáticas criadas: ' + (W.alliances || []).map(a => a.name).join(', '));
const sorted = Object.entries(s.partners).filter(([id]) => W.c[id] && !W.c[id].dep).sort((a, b) => a[1].rel - b[1].rel);
console.log('  mais hostis:', sorted.slice(0, 4).map(([id, p]) => id + ':' + Math.round(p.rel)).join(' '), '| mais amistosos:', sorted.slice(-4).map(([id, p]) => id + ':' + Math.round(p.rel)).join(' '));
// salva/carrega preserva o cenário
g.save(); const g2 = new Game(data, mem); ok(g2.load('auto') && g2.s.world.wscn === W.wscn && g2.data.wscn?.id === W.wscn, 'save/load preserva o cenário mundial');
// eventos próprios
const wsIds = dd.issues.filter(i => i.cond?.wscn).map(i => i.id);
ok(wsIds.length > 5, 'conteúdo exclusivo do cenário: ' + wsIds.length + ' questões');
let seen = 0; for (let i = 0; i < 160 && !s.over; i++) { g.nextWeek(); seen += s.issues.pending.filter(p => p.id.startsWith('ws_')).length; answerAll(() => 0); }
console.log('  cartas ws_ vistas:', seen, '| guerras de IA:', W.wars.filter(w => w.ai).length);
ok(seen > 0, 'cartas exclusivas do cenário apareceram');
console.log(fails ? fails + ' FALHAS' : 'OK'); process.exit(fails ? 1 : 0);
