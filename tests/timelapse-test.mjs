// Time lapse: o registro de mudanças reconstrói exatamente o mapa atual e os quadros avançam no tempo.
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
import { ownerOf } from '../js/sim/world.js';
import { frames, regionOf, milestones, TL_REGIONS } from '../js/sim/timelapse.js';
const data = loadData();
const mem = () => ({ store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} });
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const g = new Game(data, mem());
g.start({ seed: 9, spectator: true, scenario: 'custom', provinces: ['ATA+99?'], answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'Obs', shortName: 'Obs', leader: 'O', currency: '-', motto: '', regime: '' }, chaos: true });
for (let w = 0; w < 200; w++) g.nextWeek();
const s = g.s, W = s.world, T = W.tl, st = W.obsStart;
ok(T && T.c.length >= 3, `mudanças registradas: ${T ? T.c.length / 3 : 0}`);
const own = {}; for (let i = 0; i < T.c.length; i += 3) own[T.P[T.c[i + 1]]] = T.O[T.c[i + 2]];
let bad = 0; for (const pid in data.geo.prov) { const rec = own[pid] ?? (st.owner[pid] || data.geo.prov[pid].a3), cur = W.occ[pid] ?? ownerOf(s, data, pid); if (rec !== cur) bad++; }
ok(bad === 0, `reconstrução bate com o controle atual (${bad} divergências)`);
const F = frames(W, g.day, 150); ok(F.length >= 2 && F.length <= 160 && F.at(-1).day === g.day && F[0].day === st.day, `${F.length} quadros do dia ${F[0].day} ao ${F.at(-1).day}`);
ok(F.every((f, i) => i === 0 || (f.day > F[i - 1].day && f.upto >= F[i - 1].upto)), 'quadros crescentes');
const R = regionOf(data, 'europe'); ok(R.pids.length > 300 && R.ids.has('DEU'), `Europa: ${R.pids.length} províncias`);
ok(regionOf(data, 'middle_east').ids.has('IRN') && regionOf(data, 'africa').ids.has('NGA') && !regionOf(data, 'north_america').ids.has('MEX'), 'regiões Oriente Médio, África, América do Norte');
ok(milestones(W, data, regionOf(data, 'world'), st.day).length > 0, 'marcos existem');
ok(JSON.stringify(s).length < 6e6, `save com o registro: ${(JSON.stringify(s).length / 1e6).toFixed(2)} MB`);
console.log(fails ? 'FALHOU' : 'OK'); process.exit(fails ? 1 : 0);
