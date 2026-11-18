// Regiões do mundo, condições `wr` e partida de todos os cenários do jogador.
import { Game } from '../js/sim/game.js';
import { eligible } from '../js/sim/issues.js';
import { WORLD_REGIONS, wrOf } from '../js/sim/worldregions.js';
import { loadData } from './sim-data.mjs';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const answers = data.identity.questions.map(() => 1);
const start = (scenario, provinces, extra = {}) => { const g = new Game(data, mem); const sc = data.scenarios.find(x => x.id === scenario); g.start({ scenario, provinces, answers, difficulty: 'normal', flag: sc?.flag || {}, nation: { ...(sc?.nation || { officialName: 'Teste', shortName: 'Teste', leader: 'L', currency: 'x', motto: '', regime: 'República' }), capital: '' }, ...extra }); return g; };

ok(Object.keys(WORLD_REGIONS).length >= 30, 'regiões do mundo: ' + Object.keys(WORLD_REGIONS).length);
const unknown = Object.values(WORLD_REGIONS).flatMap(r => r.ids).filter(id => !data.reg[id]);
ok(unknown.length === 0, 'todos os ids das regiões existem no registro' + (unknown.length ? ': ' + [...new Set(unknown)].join(',') : ''));
const sov = Object.values(data.reg).filter(e => e.cat === 'sovereign').map(e => e.id), orphan = sov.filter(id => !wrOf(id).length);
console.log('  soberanos sem região do mundo:', orphan.join(' ') || '—');
ok(orphan.length <= 6, 'quase todos os países pertencem a alguma região');

// Condição wr
const sea = data.issues.find(i => i.id === 'wr_sea_scs'), nor = data.issues.find(i => i.id === 'wr_nor_welfare');
const idn = start('existing', data.geo.byCountry.IDN), fin = start('existing', data.geo.byCountry.FIN);
ok(idn.s.nation.wregions.includes('southeast_asia') && !idn.s.nation.wregions.includes('nordic'), 'Indonésia: ' + idn.s.nation.wregions.join(','));
ok(fin.s.nation.wregions.includes('nordic') && fin.s.nation.wregions.includes('baltic') === false, 'Finlândia: ' + fin.s.nation.wregions.join(','));
ok(eligible(idn.s, sea) && !eligible(fin.s, sea), 'questão do Mar do Sul só para o Sudeste Asiático');
ok(eligible(fin.s, nor) && !eligible(idn.s, nor), 'questão do modelo nórdico só para os Nórdicos');

// Todos os cenários do jogador iniciam e rodam algumas semanas
const bad = [];
let n = 0;
for (const sc of data.scenarios) {
  if (sc.pick || !sc.territory) continue;
  const provs = [...(sc.territory.entities || []).flatMap(e => data.geo.byCountry[e] || []), ...(sc.territory.provinces || [])];
  if (!provs.length) { bad.push(sc.id + ' (vazio)'); continue; }
  try { const g = start(sc.id, provs); for (let i = 0; i < 3 && !g.s.over; i++) { g.nextWeek(); for (const p of [...g.s.issues.pending]) g.answerIssue(p.id, 0); } n++; }
  catch (e) { bad.push(sc.id + ': ' + e.message.slice(0, 80)); }
}
ok(bad.length === 0, `${n} cenários iniciam e rodam 3 semanas` + (bad.length ? ' — falhas: ' + bad.join(' | ') : ''));
console.log(fails ? fails + ' FALHAS' : 'OK'); process.exit(fails ? 1 : 0);
