// Teste dirigido: bandeiras regionais.
import { Game, PLY } from '../js/sim/game.js';
import { provincesOf } from '../js/sim/world.js';
import { loadData } from './sim-data.mjs';
import { regionalFlagFor } from '../js/sim/regflags.js';
import { foundState } from '../js/sim/newstates.js';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const g = new Game(data, mem);
g.start({ scenario: 'existing', provinces: data.geo.byCountry.DEU, answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'Teste', shortName: 'Teste', leader: 'L', currency: 'x', motto: '', regime: 'República' } });
const s = g.s; s.econ.treasury = 500;
const answerAll = pick => { for (const p of [...s.issues.pending]) { const iss = g.getIssue(p.id); g.answerIssue(p.id, pick(iss)); } };
const meta = data.regionalFlags?.meta || {}, has = k => !!meta[k]; // os corpos SVG ficam em regional.svg.json (carregamento sob demanda); a lista de chaves está em meta
ok(Object.keys(meta).length > 20, 'há bandeiras regionais empacotadas: ' + Object.keys(meta).length);
const P = data.geo.prov, ids = (a3, n) => Object.values(P).filter(p => p.a3 === a3 && (Array.isArray(n) ? n.includes(p.n) : p.n === n)).map(p => p.id);
const tryFlag = (label, pids, mv) => { const k = regionalFlagFor(data, pids, mv); ok(!k || has(k), label + ' → ' + k); return k; };
const cal = tryFlag('Califórnia (movimento)', ids('USA', 'California'), 'california');
ok(cal === 'usa_california' || !has('usa_california'), 'Califórnia usa a bandeira real');
tryFlag('Texas por província', ids('USA', 'Texas'));
tryFlag('Flandres (movimento)', ids('BEL', ['West Flanders', 'East Flanders', 'Antwerp', 'Limburg', 'Flemish Brabant']), 'flanders');
tryFlag('Tatarstão por província', ids('RUS', 'Tatarstan'));
const none = regionalFlagFor(data, ids('USA', ['Arizona', 'Colorado', 'New Mexico']));
ok(none === null, 'grupo misto sem maioria não recebe bandeira regional');
// Estado criado por secessão usa a bandeira real
const W = s.world;
const pids = ids('BRA', 'Rio Grande do Sul').filter(p => s.world.owner[p] !== 'PLY');
const id = foundState(s, g.data, g.ctx(), { pids, from: 'BRA', movement: null });
const e = W.ents[id];
ok(!!e && e.flag, 'estado novo criado: ' + e?.name);
ok(!has('bra_rio_grande_do_sul') || e.flag.reg === 'bra_rio_grande_do_sul', 'estado gaúcho com a bandeira do estado: ' + JSON.stringify(e.flag).slice(0, 80));
console.log(fails ? fails + ' FALHAS' : 'OK'); process.exit(fails ? 1 : 0);
