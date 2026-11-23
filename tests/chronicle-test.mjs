// Crônica por país: notícias recentes envelhecem e somem; as importantes ficam no arquivo.
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
import { recordNews, importance, recentOf, archiveOf, ageChronicles, feedOf, IMPORTANT } from '../js/sim/chronicle.js';
const data = loadData();
const mem = () => ({ store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} });
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
ok(importance('Guerra! Rússia invade a Ucrânia.', 'war') >= IMPORTANT && importance('Cúpula em Lisboa: acordo de cooperação.', 'good') < IMPORTANT, 'peso: guerra é importante, cúpula não');
const g = new Game(data, mem());
g.start({ seed: 6, spectator: true, scenario: 'custom', provinces: ['ATA+99?'], answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'Obs', shortName: 'Obs', leader: 'O', currency: '-', motto: '', regime: '' }, chaos: true });
for (let w = 0; w < 160; w++) g.nextWeek();
const s = g.s, C = s.world.chron || {};
ok(Object.keys(C).length > 20, `${Object.keys(C).length} países com crônica`);
const nat = recordNews(s, g.data, 'Guerra! Brasil invade Argentina.', 'war'); ok(nat.includes('BRA') && nat.includes('ARG'), `a notícia vai para os dois países (${nat.join(', ')})`);
ok(archiveOf(s, 'BRA').some(x => /invade Argentina/.test(x.text)) && recentOf(s, 'BRA')[0].text.includes('Brasil'), 'importante entra no arquivo e nos recentes');
// envelhecimento: depois de ~1 ano sem novas notícias, os recentes somem e o arquivo fica
for (const id of ['BRA', 'ARG']) { const c = s.world.chron[id]; c.r = c.r.map(x => [x[0] - 400, x[1], x[2], x[3]]); }
ageChronicles(s); ok(recentOf(s, 'BRA').length === 0 && archiveOf(s, 'BRA').length >= 1, 'recentes antigos são apagados; o arquivo permanece');
for (let i = 0; i < 120; i++) recordNews(s, g.data, `Golpe de Estado em Chile número ${i}: tropas tomam o palácio.`, 'war');
ok(archiveOf(s, 'CHL').length <= 60 && recentOf(s, 'CHL').length <= 30, `limites respeitados (arquivo ${archiveOf(s, 'CHL').length}, recentes ${recentOf(s, 'CHL').length})`);
ok(feedOf(s, ['CHL', 'BRA']).length > 0, 'feed combinado funciona');
ok(JSON.stringify(s.world.chron).length < 600000, `tamanho da crônica: ${(JSON.stringify(s.world.chron).length / 1000).toFixed(0)} KB`);
console.log(fails ? 'FALHOU' : 'OK'); process.exit(fails ? 1 : 0);
