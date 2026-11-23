// Povos e minorias: polícia autônoma persegue, políticas (proteger, expulsar, exterminar), reações internacionais e inversão de identidade.
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
import { ensureMin, minAct, prejudice } from '../js/sim/minority.js';
import { ensureOrd } from '../js/sim/order.js';
const data = loadData();
const mem = () => ({ store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} });
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
function start(a3, seed = 'min-' + a3) {
  const g = new Game(data, mem());
  g.start({ seed, scenario: 'existing', provinces: data.geo.byCountry[a3], answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'T', shortName: 'T', leader: 'L', currency: 'x', motto: '', regime: 'R' } });
  ensureMin(g.s, data); return g;
}
const week = g => { g.s.econ.treasury = Math.max(g.s.econ.treasury, g.s.econ.gdp); g.nextWeek(); for (const p of [...g.s.issues.pending]) g.answerIssue(p.id, 0); };
const grp = (g, id) => g.s.min.groups.find(x => x.id === id);
// Dados por país
{ const g = start('ROU'), m = g.s.min; ok(m.groups.some(x => x.kind === 'roma' && x.share > 5), `Romênia tem ciganos (${m.groups.map(x => x.name + ' ' + x.share.toFixed(0) + '%').join(', ')})`); }
{ const g = start('USA'), m = g.s.min; ok(m.groups.some(x => x.kind === 'african') && m.groups.some(x => x.kind === 'indigenous'), 'EUA: negros e indígenas'); }
{ const g = start('FRA'), m = g.s.min; ok(m.groups.some(x => x.kind === 'immigrant'), 'França: imigrantes'); }
// Sem autonomia da polícia não há perseguição espontânea; com muita autonomia há.
{
  const a = start('ROU', 'a'), b = start('ROU', 'b');
  ensureOrd(a.s).police = 20; ensureOrd(b.s).police = 92;
  for (let i = 0; i < 40; i++) { ensureOrd(a.s).police = 20; ensureOrd(b.s).police = 92; week(a); week(b); }
  const ra = a.s.min.groups.find(x => x.kind === 'roma'), rb = b.s.min.groups.find(x => x.kind === 'roma');
  ok(rb.pers > ra.pers + 15, `polícia autônoma persegue ciganos (${rb.pers.toFixed(0)} vs ${ra.pers.toFixed(0)})`);
  ok(rb.tension > ra.tension, `tensão sobe (${rb.tension.toFixed(0)} vs ${ra.tension.toFixed(0)})`);
}
// Expulsão e genocídio têm custos
{
  const g = start('ZAF'), s = g.s, boers = s.min.groups.find(x => x.id.startsWith('afrikaners'));
  ok(!!boers && boers.kin.includes('NLD'), 'África do Sul tem os Boers com países simpatizantes');
  const pop0 = s.econ.pop, rep0 = s.st.reputation;
  ok(minAct(s, data, 'stance', boers.id + '|expel').ok, 'expulsar os Boers');
  for (let i = 0; i < 30; i++) week(g);
  ok(boers.expelled > boers.pop0 * 0.1, `expulsos: ${Math.round(boers.expelled)} de ${Math.round(boers.pop0)}`);
  ok((s.min.mods.reputation || 0) < 0 && (s.rights?.abuse || 0) > 10, `efeito negativo na reputação (${(s.min.mods.reputation || 0).toFixed(1)}) e violações sobem (${(s.rights.abuse).toFixed(0)})`);
}
{
  const g = start('ZAF', 'gen'), s = g.s, boers = s.min.groups.find(x => x.id.startsWith('afrikaners'));
  minAct(s, data, 'stance', boers.id + '|exterminate'); let war = false;
  for (let i = 0; i < 120 && !s.over; i++) { week(g); if (s.wars.some(w => w.active)) war = true; }
  ok(boers.dead > 0 && s.min.genocide, `genocídio: ${Math.round(boers.dead)} mortos`);
  ok(war || s.over || s.rights.icc.state !== 'none', `consequência internacional (guerra=${war}, TPI=${s.rights.icc.state}, fim=${s.over?.ending || '-'})`);
}
// Proteger reduz perseguição; identificar-se com a minoria inverte o alvo.
{
  const a = start('ROU', 'p1'), roma = a.s.min.groups.find(x => x.kind === 'roma');
  roma.pers = 60; minAct(a.s, data, 'stance', roma.id + '|protect'); for (let i = 0; i < 30; i++) { ensureOrd(a.s).police = 30; week(a); }
  ok(roma.pers < 40, `proteção reduz perseguição (${roma.pers.toFixed(0)})`);
  const z = start('ZAF', 'rev'), maj = z.s.min.groups.find(x => x.kind === 'majority'), boers = z.s.min.groups.find(x => x.id.startsWith('afrikaners'));
  const p0 = prejudice(z.s, maj); ok(minAct(z.s, data, 'align', boers.id).ok, 'líder se identifica com os Boers');
  ok(prejudice(z.s, maj) > p0, `preconceito contra a antiga maioria sobe (${p0.toFixed(2)} → ${prejudice(z.s, maj).toFixed(2)})`);
}
// Observador: perseguições aparecem no mundo
{
  const g = new Game(data, mem());
  g.start({ seed: 5, spectator: true, scenario: 'custom', provinces: ['ATA+99?'], answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'Obs', shortName: 'Obs', leader: 'O', currency: '-', motto: '', regime: '' } });
  for (let w = 0; w < 120; w++) g.nextWeek();
  const n = Object.keys(g.s.world.minor || {}).length, news = g.s.log.filter(l => /perseg|pogrom|genocídio|Expuls|polícia/i.test(l.text)).length;
  ok(n >= 1 && news >= 1, `observador: ${n} país(es) com perseguição, ${news} notícias`);
}
console.log(fails ? 'FALHOU' : 'OK'); process.exit(fails ? 1 : 0);
