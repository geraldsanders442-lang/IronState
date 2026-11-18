// Teste: mundo customizado (país fraturado), módulos novos (ordem, propaganda, vocações, campanha) e nova partida.
import { Game } from '../js/sim/game.js';
import { presetWorld, PRESETS } from '../js/sim/customworld.js';
import { deliverSpeech, speechSuggestions } from '../js/sim/propaganda.js';
import { loadData } from './sim-data.mjs';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const NAT = { officialName: 'Teste', shortName: 'Teste', leader: 'L', currency: 'x', motto: '', regime: 'República' };
for (const pid of ['rus', 'bra', 'eur']) {
  const def = presetWorld(data, pid);
  ok(def.nations.length >= 3, `${pid}: ${def.nations.length} nações: ${def.nations.map(n => n.name).join(' | ')}`);
}
const def = presetWorld(data, 'bra');
const g = new Game(data, mem), mine = def.nations[0];
g.start({ scenario: 'existing', provinces: mine.provs, answers: data.identity.questions.map(() => 1), difficulty: 'normal', worldScenario: 'custom', customWorld: def, worldHostile: 'ideology', flag: {}, nation: NAT });
const s = g.s;
ok(s.world.wscn === 'custom' && g.data.reg[def.nations[1].id]?.custom, 'mundo custom carregado');
ok(def.nations.slice(1).every(n => s.world.c[n.id]), 'nações-irmãs existem como países de IA');
ok(Object.values(s.partners).some(p => p.rel <= -35), 'rival/antagonista começam hostis');
// salvar/carregar mantém o mundo
g.save(); const g2 = new Game(data, mem); ok(g2.load('auto') && g2.data.reg[def.nations[1].id]?.custom, 'save/load preserva o mundo custom');
// 70 semanas de simulação com módulos novos
s.econ.treasury = 500;
for (let i = 0; i < 70 && !s.over; i++) { g.nextWeek(); for (const p of [...s.issues.pending]) g.answerIssue(p.id, 0); }
ok(!!s.ord && !!s.prop && !!s.camp && !!s.dev, 'estados novos criados (ord/prop/camp/dev)');
ok(s.ord.crime.theft >= 0 && s.ord.alien >= 0, `crime/alienação: ${Math.round(s.ord.crime.theft)}/${Math.round(s.ord.alien)}`);
ok(s.regions.every(r => r.voc), 'vocações regionais definidas');
// propaganda e discurso
g.propAct('budget', 0.5);
const sug = speechSuggestions(s)[0];
const r = g.giveSpeech({ ...sug, own: true, promises: [{ kind: 'taxcut' }] });
ok(r.ok && r.result.lines.length > 0, 'discurso entregue: ' + r.msg);
ok(s.prop.promises.length === 1, 'promessa registrada');
// campanha: modos
const r2 = g.campAct('upgrade', { k: 'infantry' }); ok(typeof r2.ok === 'boolean', 'campanha: ação de ciência responde');
// nova partida restaura o mapa
g.newCampaign(); ok(g.data === g.baseData, 'nova partida restaura os dados-base');
console.log(fails ? fails + ' FALHAS' : 'OK'); process.exit(fails ? 1 : 0);
