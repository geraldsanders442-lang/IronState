// Teste dirigido: minorias, imigração, repressão, sanções e tribunal internacional.
import { Game } from '../js/sim/game.js';
import { loadData } from './sim-data.mjs';
const data = loadData();
const mem = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = v; }, removeItem() {} };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fails++; };
const g = new Game(data, mem);
g.start({ scenario: 'existing', provinces: data.geo.byCountry.DEU, answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'Teste', shortName: 'Teste', leader: 'L', currency: 'x', motto: '', regime: 'República' } });
const s = g.s; s.econ.treasury = 500;
const answerAll = () => { for (const p of [...s.issues.pending]) g.answerIssue(p.id, 0); };
const R = s.rights;
ok(!!R && R.imm > 0, 'estado de direitos criado; imigrantes ' + R.imm + '%');
ok(['abolished', 'standard', 'licensed', 'regulated', 'prisoners'].length && s.policies.deathpenalty === 'abolished' && s.policies.policing === 'standard' && s.policies.drugs === 'prohibited', 'novas leis com padrão');
// Deportação
R.imm = 10; const pop0 = s.econ.pop, rep0 = s.st.reputation, ab0 = R.abuse;
const have = Math.round(s.econ.pop * 1e6 * 0.1);
let r = g.rightsDeport(have * 0.5);
ok(r.ok && R.imm < 6 && s.econ.pop < pop0 && s.st.reputation < rep0 && R.abuse > ab0, 'deportar reduz imigrantes/população/reputação e eleva violações: ' + r.msg);
ok(!g.rightsDeport(10).ok, 'cooldown de deportação');
// Prisões
r = g.rightsArrest('wave'); ok(r.ok && R.prisoners > 0 && s.rights.abuse > ab0 + 10, 'onda de prisões: ' + r.msg);
// Banir partido
const opp = s.pol.parties.find(p => !p.gov); const seats0 = opp.seats;
r = g.rightsBan(opp.id); ok(r.ok && opp.banned && opp.seats === 0, 'partido banido perde cadeiras (' + seats0 + '→0)');
for (let i = 0; i < 6; i++) { g.nextWeek(); answerAll(); }
ok(opp.seats === 0 && opp.vote === 0, 'partido banido segue sem votos após semanas');
// Anistia
s.rights.cd = {}; const prisoners0 = R.prisoners;
r = g.rightsAmnesty(1, true); ok(r.ok && R.prisoners === 0 && !opp.banned && R.bans.length === 0, 'anistia solta presos e legaliza partidos: ' + r.msg);
// Sanções e ONU com abuso extremo
R.abuse = 95; s.st.reputation = 40;
let sanc = 0, un = 0;
for (let i = 0; i < 120 && !s.over; i++) { R.abuse = Math.max(R.abuse, 90); g.nextWeek(); answerAll(); }
sanc = R.rightsSanctions.length; un = R.un.notes + R.un.resolutions;
ok(un > 0, 'ONU condenou: ' + un + ' ações');
ok(sanc > 0, 'sanções por direitos humanos: ' + sanc);
ok(R.icc.state !== 'none', 'tribunal avançou: ' + R.icc.state + ' (calor ' + R.heat.toFixed(1) + ')');
ok(s.over?.ending === 'icc' || R.icc.state !== 'none', 'cassação possível ou processo em curso (' + (s.over?.ending || 'sem fim') + ')');
// Retirada do tribunal
const g2 = new Game(data, { ...mem, store: {} }); g2.start({ scenario: 'existing', provinces: data.geo.byCountry.FRA, answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: {}, nation: { officialName: 'T2', shortName: 'T2', leader: 'L', currency: 'x', motto: '', regime: 'República' } });
r = g2.rightsIcc(false); ok(r.ok && !g2.s.rights.icc.recognized, 'retirada do tribunal');
// Carta com act rights
g2.s.rights.imm = 12; g2.s.rights.prisoners = 5000;
const msg = g2.applyOption({ title: 't', options: [] }, { act: { type: 'rights', op: 'deportPct', pct: 0.2 } });
ok(g2.s.rights.imm < 12, 'ato rights via opção de questão');
console.log(fails ? fails + ' falhas' : 'tudo certo'); process.exit(fails ? 1 : 0);
