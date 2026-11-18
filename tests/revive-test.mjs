// Teste: país extinto que volta a existir mantém id, nome e bandeira; nomes de regiões em português.
import { Game } from '../js/sim/game.js';
import { presetWorld } from '../js/sim/customworld.js';
import { foundState } from '../js/sim/newstates.js';
import { entOf, provincesOf } from '../js/sim/world.js';
import { loadData } from './sim-data.mjs';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const NAT = { officialName: 'Obs', shortName: 'Obs', leader: 'O', currency: '-', motto: '', regime: '' };
const g = new Game(data, mem);
g.start({ seed: 4, spectator: true, scenario: 'custom', provinces: ['ATA+99?'], answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, customWorld: presetWorld(data, 'eur'), nation: NAT, lab: { chaos: 30 } });
const s = g.s, D = g.data, ctx = g.ctx();
const gal = Object.keys(s.world.c).find(id => entOf(s, D, id)?.flag?.reg === 'esp_galicia');
ok(!!gal, 'Galiza existe no mundo "Europa fraturada": ' + (gal && entOf(s, D, gal).name));
const provs = provincesOf(s, D, gal).slice();
const spain = Object.keys(s.world.c).find(id => id !== gal && provs.some(p => D.geo.prov[p].nb.some(n => provincesOf(s, D, id).includes(n))));
g.labAct({ type: 'country', id: spain, v: 'annex', t: gal });
ok(!s.world.c[gal], `${entOf(s, D, spain).name} absorve a Galiza`);
const id = foundState(s, D, ctx, { pids: provs.slice(0, Math.max(1, provs.length - 1)), from: spain, movement: null });
const e = entOf(s, D, id);
console.log('   renasce como', id, e?.name, JSON.stringify(e?.flag).slice(0, 60));
ok(id === gal && e.flag?.reg === 'esp_galicia', 'Galiza volta com o mesmo id e a bandeira da Galiza');
// Nome em português para um Estado novo genérico na Finlândia (Lapônia).
const lap = D.geo.byCountry.FIN ? D.geo.byCountry.FIN.filter(p => D.geo.prov[p].n === 'Lapland') : [];
if (lap.length && s.world.c.FIN) { const n = foundState(s, D, ctx, { pids: lap, from: 'FIN', movement: null }); const en = entOf(s, D, n); console.log('   Lapônia:', en?.name); ok(!en || !/Lapland/.test(en.name), 'nome em português (Lapônia)'); }
console.log(fails ? fails + ' FALHAS' : 'OK'); process.exit(fails ? 1 : 0);
