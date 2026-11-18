// Direitos, minorias e imigração: imigrantes, presos políticos, banimento de partidos, êxodo e imigração em massa,
// condenações da ONU, sanções por direitos humanos e o Tribunal Penal Internacional.
import { clamp, chance, rand, pick } from './util.js';
import { allocateSeats, computeVote } from './politics.js';
import { endGame } from './regime.js';

const day = s => Math.floor(s.time.min / 1440);
const popPeople = s => s.econ.pop * 1e6;
export const ARREST = {
  leaders: { name: 'Prender líderes da oposição', per: 20, opp: -5, protest: -4, civil: -2, political: -3, control: 2, abuse: 5, rep: -1, leg: -1, gop: -5, gyouth: -2 },
  wave: { name: 'Onda de prisões de ativistas', per: 200, opp: -12, protest: -8, civil: -5, political: -6, control: 4, abuse: 13, rep: -3, leg: -3, gop: -12, gyouth: -5 },
  mass: { name: 'Prisões em massa de opositores', per: 1200, opp: -22, protest: -12, civil: -9, political: -10, control: 6, abuse: 26, rep: -7, leg: -6, gop: -20, gyouth: -9 },
};

// ---------- Estado ----------
export function ensureRights(s, data) {
  for (const p of data.policies) if (s.policies[p.id] == null) s.policies[p.id] = p.def;
  if (s.rights) return s.rights;
  const gp = s.econ.gdp / Math.max(0.001, s.econ.pop) * 1000;
  const rich = clamp(Math.log10(Math.max(1, gp * 1000 / 1000)) - 2.4, 0, 2);
  s.rights = {
    imm: +clamp(0.6 + rich * 3.2 + rand(-0.4, 1.4), 0.3, 14).toFixed(2), // imigrantes, % da população
    deported: 0, naturalized: 0, emigrated: 0, immigrated: 0,
    prisoners: 0, bans: [], amnesties: 0, executions: 0,
    abuse: 0, heat: 0,
    icc: { recognized: true, state: 'none', cases: 0 },
    un: { notes: 0, resolutions: 0 },
    rightsSanctions: [], harbored: [], events: [], cd: {}, flow: 0,
  };
  s.rights.abuse = floorAbuse(s, data);
  return s.rights;
}
const note = (s, text) => { const R = s.rights; R.events.unshift({ day: day(s), text }); if (R.events.length > 40) R.events.length = 40; };

// Nível mínimo de violações imposto pelas leis e pelo aparato de segurança.
export function floorAbuse(s, data) {
  let v = 0;
  for (const p of data.policies) { const l = p.levels.find(x => x.id === s.policies[p.id]); v += l?.mods?.abuse || 0; }
  const R = s.rights;
  v += Math.max(0, (s.d?.repression || 0) - 25) * 0.45 + (R ? R.bans.length * 4 + Math.min(18, R.prisoners / Math.max(1, popPeople(s)) * 60000) : 0);
  return clamp(v, 0, 100);
}
export const abuseTier = a => a >= 80 ? ['Pária internacional', 'bad'] : a >= 65 ? ['Violações graves', 'bad'] : a >= 45 ? ['Violações recorrentes', 'warn'] : a >= 25 ? ['Preocupações pontuais', 'warn'] : ['Respeito aos direitos', 'good'];
export const liberty = s => (s.st.civil + s.st.political) / 2;

// Valores para condições das questões.
export function rightsValue(s, k) {
  const R = s.rights;
  switch (k) {
    case 'imm': return R?.imm || 0;
    case 'abuse': return R?.abuse || 0;
    case 'prisoners': return (R?.prisoners || 0) / 1000;
    case 'liberty': return liberty(s);
    case 'bans': return R?.bans.length || 0;
    case 'ethnic': return Math.max(0, ...s.regions.filter(r => r.minority && !r.cap).map(r => r.unrest || 0));
    case 'minorities': return s.regions.filter(r => r.minority).reduce((a, r) => a + r.popShare * 100, 0);
    case 'emigrated': return (R?.emigrated || 0) / 1000;
  }
  return 0;
}
export const worstMinority = s => s.regions.filter(r => r.minority && !r.cap).sort((a, b) => (b.unrest || 0) - (a.unrest || 0))[0] || s.regions.filter(r => !r.cap).sort((a, b) => (b.unrest || 0) - (a.unrest || 0))[0];
export const immigrantCount = s => Math.round(popPeople(s) * (s.rights?.imm || 0) / 100);

const add = (s, k, v, lo = 0, hi = 100) => { s.st[k] = clamp(s.st[k] + v, lo, hi); };
const grp = (s, g, v) => { s.groups[g] = clamp(s.groups[g] + v, 0, 100); };
const longMod = (s, k, v, d, src) => s.longMods.push({ k, v, d, left: d, src });
const partnersByLib = (s, data, test) => Object.keys(s.partners).filter(id => s.world.c[id] && !s.world.c[id].dep && test(libOf(s, data, id)));
const libOf = (s, data, id) => data.reg[id]?.profile?.liberty ?? s.world.ents?.[id]?.profile?.liberty ?? 50;
const rel = (s, ids, v) => { for (const id of ids) if (s.partners[id]) s.partners[id].rel = clamp(s.partners[id].rel + v, -100, 100); };
const cdOk = (s, key, weeks) => { const c = (s.rights.cd[key] || 0) - day(s); return c > 0 ? `Aguarde ${Math.ceil(c / 7)} semana(s).` : (s.rights.cd[key] = day(s) + weeks * 7, null); };

// ---------- Ações do jogador (página Minorias e direitos) ----------
export function deport(s, data, n) {
  const R = s.rights, have = immigrantCount(s);
  n = Math.min(Math.round(n), have);
  if (n < 1) return { ok: false, msg: 'Não há imigrantes a deportar.' };
  const w = cdOk(s, 'deport', 3); if (w) return { ok: false, msg: w };
  const f = n / Math.max(1, have), dp = n / popPeople(s);
  R.imm = Math.max(0, R.imm - dp * 100); R.deported += n;
  s.econ.pop = Math.max(0.0001, s.econ.pop - n / 1e6);
  s.econ.gdp *= 1 - 0.7 * dp;
  s.econ.treasury -= n * 1.8e-6;
  add(s, 'unemployment', -dp * 40, 0, 60);
  grp(s, 'workers', 4 * f); grp(s, 'rural', 6 * f); grp(s, 'business', -6 * f); grp(s, 'youth', -3 * f);
  add(s, 'civil', -7 * f); add(s, 'reputation', -Math.min(14, 2 + 12 * f)); add(s, 'legitimacy', 1.5 * f - 1);
  R.abuse = clamp(R.abuse + 4 + 26 * f, 0, 100);
  longMod(s, 'laborSupply', -1.4 * f, 180, 'Deportações em massa');
  rel(s, Object.keys(s.partners).filter(id => s.world.c[id]).sort(() => rand(-1, 1)).slice(0, 3), -10 * f);
  const msg = `${n.toLocaleString('pt-BR')} imigrantes foram deportados (${(f * 100).toFixed(0)}% dos estrangeiros).`;
  note(s, msg);
  return { ok: true, msg, log: true };
}
export function naturalize(s, data, frac) {
  const R = s.rights;
  frac = clamp(frac, 0, 1);
  if (R.imm < 0.2 || frac <= 0) return { ok: false, msg: 'Não há estrangeiros a naturalizar.' };
  const w = cdOk(s, 'natur', 8); if (w) return { ok: false, msg: w };
  const n = Math.round(immigrantCount(s) * frac);
  R.imm = Math.max(0, R.imm * (1 - frac)); R.naturalized += n;
  add(s, 'civil', 3 * frac); add(s, 'reputation', 3 * frac); grp(s, 'rural', -4 * frac); grp(s, 'workers', 1 * frac); grp(s, 'youth', 3 * frac);
  for (const r of s.regions) if (r.minority) r.unrest = clamp(r.unrest - 6 * frac, 0, 100);
  R.abuse = clamp(R.abuse - 5 * frac, 0, 100);
  longMod(s, 'productivity', 0.8 * frac, 365, 'Naturalização de imigrantes');
  const msg = `${n.toLocaleString('pt-BR')} estrangeiros receberam cidadania.`;
  note(s, msg);
  return { ok: true, msg, log: true };
}
export function arrest(s, data, level) {
  const A = ARREST[level]; if (!A) return { ok: false, msg: 'Nível inválido.' };
  const R = s.rights, w = cdOk(s, 'arrest', 3); if (w) return { ok: false, msg: w };
  const n = Math.round(s.econ.pop * A.per);
  R.prisoners += n;
  add(s, 'opposition', A.opp); add(s, 'protest', A.protest); add(s, 'civil', A.civil); add(s, 'political', A.political); add(s, 'control', A.control);
  add(s, 'reputation', A.rep); add(s, 'legitimacy', A.leg); grp(s, 'opposition', A.gop); grp(s, 'youth', A.gyouth);
  R.abuse = clamp(R.abuse + A.abuse, 0, 100);
  if (level !== 'leaders') longMod(s, 'protest', level === 'mass' ? 5 : 3, 120, 'Revolta contra as prisões');
  const msg = `${A.name}: ${n.toLocaleString('pt-BR')} detidos.`;
  note(s, msg);
  return { ok: true, msg, log: true };
}
export function banParty(s, data, id) {
  const P = s.pol, p = P?.parties.find(x => x.id === id), R = s.rights;
  if (!p || p.gov) return { ok: false, msg: 'Partido inválido.' };
  if (p.banned) return { ok: false, msg: 'Já está banido.' };
  const w = cdOk(s, 'ban', 4); if (w) return { ok: false, msg: w };
  p.banned = true; p.coalition = false; p.vote = 0; p.seats = 0;
  R.bans.push(p.id);
  computeVote(s, true); allocateSeats(s);
  add(s, 'political', -7); add(s, 'civil', -3); add(s, 'legitimacy', -3); add(s, 'opposition', -4); add(s, 'reputation', -4);
  grp(s, 'opposition', -9); grp(s, 'youth', -3);
  longMod(s, 'protest', 3, 90, `Banimento do ${p.name}`);
  R.abuse = clamp(R.abuse + 11, 0, 100);
  const msg = `O partido ${p.name} foi banido.`;
  note(s, msg);
  return { ok: true, msg, log: true };
}
export function unbanParty(s, data, id) {
  const p = s.pol?.parties.find(x => x.id === id), R = s.rights;
  if (!p || !p.banned) return { ok: false, msg: 'O partido não está banido.' };
  p.banned = false; R.bans = R.bans.filter(x => x !== id);
  computeVote(s, true); allocateSeats(s);
  add(s, 'political', 5); add(s, 'civil', 2); add(s, 'reputation', 3); add(s, 'legitimacy', 2); grp(s, 'opposition', 6); grp(s, 'military', -2);
  R.abuse = clamp(R.abuse - 6, 0, 100);
  const msg = `O partido ${p.name} foi legalizado novamente.`;
  note(s, msg);
  return { ok: true, msg, log: true };
}
export function amnesty(s, data, frac, { unban = false } = {}) {
  const R = s.rights;
  frac = clamp(frac, 0, 1);
  if (R.prisoners < 1 && !(unban && R.bans.length)) return { ok: false, msg: 'Não há presos políticos nem partidos banidos.' };
  const w = cdOk(s, 'amnesty', 6); if (w) return { ok: false, msg: w };
  const n = Math.round(R.prisoners * frac);
  R.prisoners -= n; R.amnesties++;
  const k = Math.max(frac, unban ? 0.6 : 0);
  add(s, 'civil', 5 * k); add(s, 'political', 4 * k); add(s, 'legitimacy', 3.5 * k); add(s, 'reputation', 4 * k); add(s, 'opposition', 2 * k);
  grp(s, 'opposition', 9 * k); grp(s, 'youth', 5 * k); grp(s, 'military', -4 * k); grp(s, 'bureaucracy', -2 * k);
  add(s, 'coupRisk', 2 * k); add(s, 'protest', -3 * k);
  R.abuse = clamp(R.abuse - 12 * k, 0, 100);
  if (unban) for (const id of [...R.bans]) { const p = s.pol.parties.find(x => x.id === id); if (p) p.banned = false; R.bans = R.bans.filter(x => x !== id); computeVote(s, true); allocateSeats(s); }
  rel(s, partnersByLib(s, data, l => l >= 55), 3 * k);
  const msg = `Anistia: ${n.toLocaleString('pt-BR')} presos políticos libertados${unban ? ' e partidos legalizados' : ''}.`;
  note(s, msg);
  return { ok: true, msg, log: true };
}
export function crushRegion(s, data, rid) {
  const r = s.regions.find(x => x.id === rid), R = s.rights;
  if (!r) return { ok: false, msg: 'Região inválida.' };
  const w = cdOk(s, 'crush' + rid, 6); if (w) return { ok: false, msg: w };
  r.unrest = clamp(r.unrest - 28, 0, 100); r.crushedDay = day(s);
  const dead = Math.round(s.econ.pop * r.popShare * 1e6 * 0.0004);
  s.econ.pop = Math.max(0.0001, s.econ.pop - dead / 1e6);
  add(s, 'reputation', -6); add(s, 'civil', -5); add(s, 'legitimacy', -2); add(s, 'control', 4);
  grp(s, 'military', 3); grp(s, 'regional', -6); grp(s, 'rural', 2);
  longMod(s, 'separatism', 4, 240, `Repressão em ${r.name}`);
  R.abuse = clamp(R.abuse + 20, 0, 100);
  const msg = `Operação de repressão em ${r.name}: cerca de ${dead.toLocaleString('pt-BR')} mortos e milhares de desalojados.`;
  note(s, msg);
  return { ok: true, msg, log: true };
}
export function concedeRegion(s, data, rid) {
  const r = s.regions.find(x => x.id === rid), R = s.rights;
  if (!r) return { ok: false, msg: 'Região inválida.' };
  const w = cdOk(s, 'conc' + rid, 8); if (w) return { ok: false, msg: w };
  const cost = s.econ.gdp * 0.002;
  s.econ.treasury -= cost;
  r.unrest = clamp(r.unrest - 16, 0, 100); r.sep = Math.max(0, (r.sep || 0) - 0.08);
  add(s, 'reputation', 2); add(s, 'civil', 2); grp(s, 'regional', 6); grp(s, 'military', -2); grp(s, 'rural', -2);
  R.abuse = clamp(R.abuse - 3, 0, 100);
  const msg = `Direitos culturais e língua oficial reconhecidos em ${r.name} (custo ${cost.toFixed(2)} bi).`;
  note(s, msg);
  return { ok: true, msg, log: true };
}
export function setIccRecognition(s, data, on) {
  const R = s.rights, I = R.icc;
  if (on === I.recognized) return { ok: false, msg: on ? 'O tribunal já é reconhecido.' : 'Já não reconhecemos o tribunal.' };
  if (!on) {
    add(s, 'reputation', I.state === 'none' ? -7 : -11); add(s, 'legitimacy', 1); grp(s, 'military', 2);
    I.recognized = false; R.heat = Math.max(0, R.heat - 2);
    rel(s, partnersByLib(s, data, l => l >= 55), -4);
    const msg = 'O governo retirou-se do Estatuto de Roma e deixou de reconhecer o Tribunal Penal Internacional.';
    note(s, msg); return { ok: true, msg, log: true };
  }
  if (I.state === 'warrant') return { ok: false, msg: 'Não é possível reconhecer o tribunal com um mandado em aberto.' };
  I.recognized = true; add(s, 'reputation', 6); rel(s, partnersByLib(s, data, l => l >= 55), 4);
  const msg = 'O país voltou a reconhecer a jurisdição do Tribunal Penal Internacional.';
  note(s, msg); return { ok: true, msg, log: true };
}

// Ações disparadas por opções de questões: { type:'rights', op, ... }.
export function rightsAct(s, data, act, ctx) {
  const R = ensureRights(s, data);
  let msg = '';
  if (act.abuse) R.abuse = clamp(R.abuse + act.abuse, 0, 100);
  if (act.heat) R.heat = Math.max(0, R.heat + act.heat);
  if (act.imm) R.imm = clamp(R.imm + act.imm, 0, 40);
  if (act.popPct) s.econ.pop = Math.max(0.0001, s.econ.pop * (1 + act.popPct / 100));
  if (act.prisoners) R.prisoners = Math.max(0, R.prisoners + Math.round(act.prisoners * Math.max(1, s.econ.pop)));
  if (act.ethnic) for (const r of s.regions) if (r.minority && !r.cap) r.unrest = clamp(r.unrest + act.ethnic, 0, 100);
  if (act.relLib) rel(s, partnersByLib(s, data, l => l >= 55), act.relLib);
  if (act.relAuth) rel(s, partnersByLib(s, data, l => l <= 40), act.relAuth);
  if (act.flagOn) s.flags[act.flagOn] = 1;
  if (act.flagOff) delete s.flags[act.flagOff];
  switch (act.op) {
    case 'deportPct': { const r = deport(s, data, immigrantCount(s) * (act.pct || 0.1)); if (r.ok) msg = r.msg; break; }
    case 'naturalizePct': { R.cd.natur = 0; const r = naturalize(s, data, act.pct || 0.2); if (r.ok) msg = r.msg; break; }
    case 'crushWorst': { const w = worstMinority(s); if (w) { R.cd['crush' + w.id] = 0; msg = crushRegion(s, data, w.id).msg; } break; }
    case 'concedeWorst': { const w = worstMinority(s); if (w) { R.cd['conc' + w.id] = 0; msg = concedeRegion(s, data, w.id).msg; } break; }
    case 'releaseAll': { const r = amnesty(s, data, act.pct ?? 1, { unban: !!act.unban }); R.cd.amnesty = 0; if (r.ok) msg = r.msg; break; }
    case 'exile': endGame(s, 'exile', 'Fugiu do mandado do Tribunal Penal Internacional'); msg = 'Você deixou o país antes de ser preso.'; break;
    case 'iccCooperate': R.icc.coop = true; R.heat = Math.max(0, R.heat - 4); R.abuse = clamp(R.abuse - 6, 0, 100); add(s, 'reputation', 4); msg = 'O governo cooperará com os investigadores do tribunal.'; break;
    case 'iccObstruct': R.heat += 2; add(s, 'reputation', -4); rel(s, partnersByLib(s, data, l => l >= 55), -4); msg = 'O governo obstrui a investigação internacional.'; break;
    case 'iccWithdraw': msg = setIccRecognition(s, data, false).msg; break;
    case 'iccSurrender': endGame(s, 'icc', 'Entregou-se ao Tribunal Penal Internacional'); msg = 'Você se entregou ao tribunal.'; break;
    case 'harbor': R.harbored.push({ name: act.name || 'Foragido', day: day(s) }); R.heat += 1.5; add(s, 'reputation', -5); rel(s, partnersByLib(s, data, l => l >= 55), -6); rel(s, partnersByLib(s, data, l => l <= 40), 4); grp(s, 'military', 2); msg = `${act.name || 'O foragido'} recebeu abrigo no país.`; break;
    case 'extradite': add(s, 'reputation', 6); R.heat = Math.max(0, R.heat - 2); rel(s, partnersByLib(s, data, l => l >= 55), 6); rel(s, partnersByLib(s, data, l => l <= 40), -4); grp(s, 'military', -3); msg = `${act.name || 'O foragido'} foi entregue à justiça internacional.`; break;
    case 'trialSelf': if (chance(0.55)) { add(s, 'reputation', 3); add(s, 'legitimacy', 4); msg = 'O julgamento doméstico foi visto como minimamente justo.'; } else { add(s, 'reputation', -4); add(s, 'legitimacy', 1); R.abuse = clamp(R.abuse + 4, 0, 100); msg = 'O julgamento foi chamado de farsa por observadores estrangeiros.'; } break;
  }
  if (msg) note(s, msg);
  return msg;
}

// ---------- Simulação semanal ----------
export function weeklyRights(s, data, ctx) {
  if (s.flags.micronation || s.ascent) return;
  const R = ensureRights(s, data), d = day(s), st = s.st, pol = s.policies, pop = s.econ.pop;
  const lib = liberty(s), gdppc = s.econ.gdp * 1e9 / Math.max(1, popPeople(s));

  // Violações: pico decai para o piso definido pelas leis e pelo aparato repressivo.
  const flo = floorAbuse(s, data);
  R.abuse = clamp(R.abuse + (flo - R.abuse) * (R.abuse > flo ? 0.045 : 0.2), 0, 100);

  // Pena de morte
  const dp = pol.deathpenalty;
  if (dp === 'routine' || dp === 'exceptional') {
    const n = Math.round(pop * (dp === 'routine' ? 0.6 : 0.05) * rand(0.6, 1.3));
    R.executions += n;
    if (dp === 'routine') { add(s, 'crime', -0.05); R.abuse = clamp(R.abuse + 0.1, 0, 100); }
  }

  // Imigração e emigração
  let inflow = 0;
  const attract = (st.qol - 52) * 0.00002 + (gdppc > 30000 && lib > 45 ? 0.00022 : 0) + (gdppc > 15000 ? 0.00006 : 0);
  inflow += attract;
  if (pol.immigration === 'encouraged') inflow += 0.00025; else if (pol.immigration === 'restricted') inflow -= 0.0001;
  if (pol.refugees === 'welcome') inflow += 0.00012; else if (pol.refugees === 'refuse') inflow -= 0.00004;
  if (pol.borders === 'closed') inflow = Math.min(inflow, 0);
  let outflow = 0;
  if (gdppc < 4000) outflow += (4000 - gdppc) / 4000 * 0.0004;
  if (st.poverty > 35) outflow += (st.poverty - 35) * 0.000012;
  if (R.abuse > 50) outflow += (R.abuse - 50) * 0.000009;
  if (lib < 22) outflow += (22 - lib) * 0.000012;
  if (s.wars.some(w => w.active)) outflow += 0.00008;
  if (pol.emigration === 'banned') outflow *= 0.3; else if (pol.emigration === 'taxed') outflow *= 0.65;
  if (pol.borders === 'closed') outflow *= 0.7;
  const dIn = pop * inflow, dOut = pop * outflow;
  s.econ.pop = Math.max(0.0001, pop + dIn - dOut);
  R.imm = clamp(R.imm + inflow * 100 - (pol.immigration === 'restricted' ? 0.004 : 0), 0, 40);
  R.flow = (R.flow || 0) * 0.85 + (dIn - dOut) * 1e6;
  R.emigrated += Math.round(dOut * 1e6); R.immigrated += Math.round(dIn * 1e6);
  if (dOut > 0) { const bd = Math.min(0.25, outflow * 300); st.education = clamp(st.education - bd * 0.05, 0, 100); st.tech = clamp(st.tech - bd * 0.03, 0, 100); }
  if (R.imm > 10) { st.housing = clamp(st.housing - (R.imm - 10) * 0.012, 0, 100); grp(s, 'rural', -(R.imm - 10) * 0.01); for (const r of s.regions) if (r.minority) r.unrest = clamp(r.unrest + (R.imm - 10) * 0.012, 0, 100); }
  if (d % 28 < 7) {
    if (dOut * 1e6 * 4 > pop * 1e6 * 0.0012) ctx.news(`Êxodo: cerca de ${Math.round(dOut * 1e6 * 4 / 1000)} mil pessoas deixaram o país nas últimas semanas.`, 'bad');
    else if (dIn * 1e6 * 4 > pop * 1e6 * 0.0012) ctx.news(`Imigração em alta: cerca de ${Math.round(dIn * 1e6 * 4 / 1000)} mil estrangeiros chegaram nas últimas semanas.`, 'info');
  }

  // Minorias: repressão, imigração e o efeito rebote após massacres
  for (const r of s.regions) {
    if (r.crushedDay != null && d - r.crushedDay < 182 && d - r.crushedDay > 21) { r.unrest = clamp(r.unrest + 0.35, 0, 100); r.sep = (r.sep || 0) + 0.0012; }
    if (r.minority && !r.cap && R.abuse > 45) r.unrest = clamp(r.unrest + (R.abuse - 45) * 0.004, 0, 100);
    if (r.minority && !r.cap && pol.autonomy === 'federal') r.unrest = clamp(r.unrest - 0.12, 0, 100);
  }

  // Reação internacional
  if (R.abuse >= 45 && d - (R.cd.un || 0) >= 35 && chance(0.22)) {
    R.cd.un = d;
    if (R.abuse >= 78) { R.un.resolutions++; add(s, 'reputation', -6); add(s, 'legitimacy', -1.5); note(s, 'Conselho de Segurança debate sanções por violações em massa.'); ctx.news('A ONU aprovou resolução condenando violações sistemáticas de direitos humanos no país.', 'bad'); ctx.notify('Condenação da ONU', 'Resolução condena violações sistemáticas de direitos humanos.'); }
    else if (R.abuse >= 62) { R.un.resolutions++; add(s, 'reputation', -4); add(s, 'legitimacy', -1); note(s, 'Assembleia Geral da ONU aprova resolução de condenação.'); ctx.news('A Assembleia Geral da ONU condenou o histórico de direitos humanos do governo.', 'bad'); }
    else { R.un.notes++; add(s, 'reputation', -1.5); note(s, 'Nota de repúdio de governos e do Alto Comissariado para Direitos Humanos.'); ctx.news('Governos e organizações emitiram nota de repúdio às violações de direitos no país.', 'warn'); }
  }
  if (R.abuse >= 60) {
    for (const id of partnersByLib(s, data, l => l >= 62).filter(x => s.world.c[x].gdp > 350)) {
      const p = s.partners[id];
      if (R.rightsSanctions.length < 6 && !p.sanctionsBy && !R.rightsSanctions.includes(id) && chance((R.abuse - 52) / 900)) {
        p.sanctionsBy = true; p.trade = false; p.rel = clamp(p.rel - 14, -100, 100); R.rightsSanctions.push(id);
        const nm = data.reg[id]?.name || s.world.ents?.[id]?.name || id;
        note(s, `Sanções de ${nm} por violações de direitos humanos.`);
        ctx.news(`${nm} impôs sanções ao país por violações de direitos humanos.`, 'bad'); ctx.notify('Sanções internacionais', `${nm} impôs sanções por violações de direitos humanos.`);
        if (!s.flags.rt_sanc_card) { s.flags.rt_sanc_card = 1; s.issues.scheduled.push({ id: 'rt_sanctions_pack', day: d + 3 }); }
      }
    }
  } else if (R.abuse < 38) {
    for (const id of [...R.rightsSanctions]) if (chance(0.06) && s.partners[id]) { s.partners[id].sanctionsBy = false; s.partners[id].rel = clamp(s.partners[id].rel + 12, -100, 100); R.rightsSanctions = R.rightsSanctions.filter(x => x !== id); ctx.news(`${data.reg[id]?.name || id} suspendeu as sanções por direitos humanos.`, 'good'); }
  }

  // Tribunal Penal Internacional
  const I = R.icc;
  const heatGain = R.abuse >= 66 ? (R.abuse - 62) / 36 : 0;
  R.heat = Math.max(0, R.heat + heatGain - (R.abuse < 50 ? 0.5 : 0.05) + (R.harbored.length ? 0.1 : 0));
  if (R.abuse < 40 && R.heat < 1 && I.state !== 'none' && I.state !== 'warrant') { I.state = 'none'; }
  const sched = id => { if (!s.issues.scheduled.some(x => x.id === id) && !s.issues.pending.some(p => p.id === id)) s.issues.scheduled.push({ id, day: d + 2 }); };
  if (I.state === 'none' && R.heat >= 7) { I.state = 'inquiry'; s.flags.rt_icc_inquiry = 1; note(s, 'Promotoria do tribunal abre exame preliminar.'); sched('rt_icc_inquiry'); }
  else if (I.state === 'inquiry' && R.heat >= 14 && !s.flags.rt_icc_inquiry) { I.state = 'indicted'; s.flags.rt_icc_indict = 1; note(s, 'Tribunal formaliza acusações contra altos funcionários.'); ctx.news('O Tribunal Penal Internacional formalizou acusações contra autoridades do governo.', 'bad'); sched('rt_icc_indict'); }
  else if (I.state === 'indicted' && R.heat >= 22 && !s.flags.rt_icc_indict) { I.state = 'warrant'; s.flags.rt_icc_warrant = 1; I.cases++; note(s, 'Mandado de prisão internacional expedido contra o chefe de governo.'); ctx.notify('Mandado de prisão', 'O tribunal expediu mandado de prisão contra você.'); sched('rt_icc_warrant'); }
  if (I.state === 'warrant' && !s.flags.rt_icc_warrant && !s.over) {
    const p = (I.recognized ? 0.006 : 0.0025) * (1 + (60 - st.stability) / 60) * (R.abuse / 70) * (1 + Math.max(0, st.coupRisk - 30) / 60);
    if (chance(clamp(p, 0, 0.05))) { endGame(s, 'icc', 'Cassado e preso por mandado do Tribunal Penal Internacional'); ctx.log('O governante foi preso e entregue ao Tribunal Penal Internacional.', 'bad'); }
  }
}
