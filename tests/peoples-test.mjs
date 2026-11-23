// Povos: a composição vem do território real (Palestina com judeus como minoria; Curdistão não deixa os curdos "sem Estado"); perseguições são raras.
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
import { entityGroups } from '../js/sim/peoples.js';
import { ethnicIndex, ethnicProvinces, ETHNIC } from '../js/sim/geopol.js';
import { MOVEMENTS } from '../js/sim/newstates.js';
import { statelessGroups } from '../js/sim/geopol.js';
const data = loadData();
const mem = () => ({ store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} });
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const P = data.geo.prov, byA = a3 => Object.keys(P).filter(p => P[p].a3 === a3);
const pal = (data.reg.PSX ? 'PSX' : data.reg.PSE ? 'PSE' : Object.keys(data.reg).find(k => /^PS/.test(k)));
const kurdG = statelessGroups(data).find(g => /curd/i.test(g.people || g.name));
const kurdProvs = kurdG ? ethnicProvinces(data, kurdG) : [];
const def = { id: 'custom', name: 'Teste', nations: [
  { id: 'CW_pal', parent: pal, name: 'Reino da Palestina', formal: 'Reino da Palestina', regime: 'monarchy', role: 'neutral', provs: [...byA(pal), ...byA('ISR').sort((a, b) => (P[a].pop || 0) - (P[b].pop || 0)).slice(0, 1)] },
  ...(kurdProvs.length ? [{ id: 'CW_kurd', parent: 'IRQ', name: 'República do Curdistão', formal: 'República do Curdistão', regime: 'democracy', role: 'neutral', provs: kurdProvs }] : []),
] };
const g = new Game(data, mem());
g.start({ seed: 8, spectator: true, scenario: 'custom', provinces: ['ATA+99?'], answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'Obs', shortName: 'Obs', leader: 'O', currency: '-', motto: '', regime: '' }, customWorld: def, chaos: true });
const s = g.s, d = g.data, W = s.world;
const G = entityGroups(s, d, 'CW_pal');
ok(G[0].kind === 'majority' && /palestin/i.test(G[0].noun), `Palestina: grupo dominante = ${G[0].name} (${G[0].share}%)`);
ok(G.some(x => x.key === 'jewish' && x.kind !== 'majority'), `judeus são minoria na Palestina (${G.map(x => x.noun + ' ' + x.share.toFixed(0) + '%').join(', ')})`);
if (kurdG) { const E = ethnicIndex(s, d); ok(!E.stateless.some(x => /curd/i.test(x.people || x.name) && x.holder === 'CW_kurd'), 'curdos não são "povo sem Estado" onde existe um Curdistão'); } else ok(true, '(sem grupo curdo nos dados)');
let persec = 0, geno = 0, maxL = 0, exp = 0;
for (let i = 0; i < 5; i++) {
  const gg = new Game(data, mem()); gg.start({ seed: 20 + i, spectator: true, scenario: 'custom', provinces: ['ATA+99?'], answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'Obs', shortName: 'Obs', leader: 'O', currency: '-', motto: '', regime: '' }, chaos: i % 2 === 0 });
  for (let w = 0; w < 260; w++) gg.nextWeek();
  const M = gg.s.world.minor || {}; persec += Object.keys(M).length; for (const p of Object.values(M)) { if (p.level >= 4) geno++; if (p.level >= 3) exp++; maxL = Math.max(maxL, p.level); }
}
ok(persec <= 30 && exp <= 5 && geno <= 1, `5 mundos × 5 anos: ${persec} perseguições, ${exp} com expulsão ou pior e ${geno} genocídio(s)`);
// Controle de genocídios e expulsões: com 0 nunca passa do nível 2; o padrão em mundo customizado é 0,5
import { genoSlider } from '../js/sim/minority.js';
ok(genoSlider(s) === 0.5, `padrão em mundo customizado: ${genoSlider(s)}`);
{ let hard = 0; for (let i = 0; i < 3; i++) { const gg = new Game(data, mem()); gg.start({ seed: 40 + i, spectator: true, scenario: 'custom', provinces: ['ATA+99?'], answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'Obs', shortName: 'Obs', leader: 'O', currency: '-', motto: '', regime: '' }, chaos: true, lab: { chaos: 80, genocide: 0, persecution: 2 } }); for (let w = 0; w < 260; w++) gg.nextWeek(); for (const p of Object.values(gg.s.world.minor || {})) if (p.level >= 3) hard++; }
  ok(hard === 0, `com o controle em 0 não há expulsões nem genocídios (${hard})`); }
console.log(fails ? 'FALHOU' : 'OK'); process.exit(fails ? 1 : 0);
