import { clamp, chance, rand, random } from './util.js';
import { PLY, entOf, ownerOf, provincesOf, setOwner, territoryChanged, aiPower, relAI, shiftRelAI, playerNeighbors, defenseAllies } from './world.js';
import { militaryPower } from './model.js';
import { regionalFlagFor } from './regflags.js';

const day = s => Math.floor(s.time.min / 1440);
const nm = (s, data, id) => id === PLY ? s.nation.shortName : entOf(s, data, id)?.name || id;
const op = (s, id) => ((s.world.covert ||= {})[id] ||= { party: 0, militia: 0, arms: 0, found: 0 });

// Converte os eixos do jogador num perfil de governo (usado quando um aliado ideológico chega ao poder).
export function profileFromAxes(ax, base) {
  const align = ax.align >= 50 ? 'W' : ax.align >= 20 ? 'WL' : ax.align <= -50 ? 'E' : ax.align <= -20 ? 'EL' : 'N';
  return { ...(base || {}), liberty: clamp(Math.round((100 - ax.auth) / 2), 2, 98), market: clamp(Math.round((ax.econ + 100) / 2), 2, 98), religiosity: clamp(Math.round((ax.relig + 100) / 2), 0, 100), align, regime: ax.auth > 40 ? 'auth' : ax.auth > 0 ? 'hybrid' : 'dem', regimeName: ax.auth > 40 ? 'Autoritário' : ax.auth > 0 ? 'Regime híbrido' : 'Democracia' };
}
export function changeRegime(s, data, id, how) {
  const base = entOf(s, data, id);
  s.world.ents ||= {};
  s.world.ents[id] = { ...base, profile: profileFromAxes(s.nation.ideology.axes, base.profile), regimeChanged: how };
  if (s.world.c[id]) s.world.c[id].ax = { ...s.nation.ideology.axes };
  const p = s.partners[id];
  if (p) { p.rel = Math.max(p.rel, 55); p.trust = clamp(p.trust + 20, 0, 100); }
}

// Províncias-alvo de uma milícia: as que você reivindica nesse país; senão, as de fronteira com você.
export function militiaTargets(s, data, id) {
  const mine = new Set(provincesOf(s, data, PLY));
  const claimed = s.world.claims.filter(c => c.claimant === PLY && c.holder === id && c.status === 'active').flatMap(c => c.provs).filter(p => ownerOf(s, data, p) === id);
  if (claimed.length) return { provs: [...new Set(claimed)], claimed: true };
  const border = provincesOf(s, data, id).filter(p => data.geo.prov[p].nb.some(n => mine.has(n)));
  return { provs: border.slice(0, 4), claimed: false };
}

export function covertOptions(s, data, id) {
  const c = s.world.c[id], p = s.partners[id], e = entOf(s, data, id), g = s.econ.gdp, o = s.world.covert?.[id] || {};
  if (!c || c.dep || !p) return [];
  const nb = playerNeighbors(s, data).has(id);
  const t = militiaTargets(s, data, id);
  const A = [];
  const add = (key, name, desc, block) => A.push({ key, name, desc, block: block || null });
  add('fundParty', 'Financiar partido afim', `Custo ${(g * 0.0006).toFixed(2)} bi. Fortalece um partido com ideologia parecida com a sua (${Math.round(o.party || 0)}/100). Em ~75 ele pode chegar ao poder.`, s.econ.treasury < g * 0.0006 ? 'Tesouro insuficiente' : null);
  add('fundMilitia', t.claimed ? 'Financiar movimento irredentista' : 'Financiar milícia de minoria', `Custo ${(g * 0.0008).toFixed(2)} bi. Alvo: ${t.provs.map(x => data.geo.prov[x].n).slice(0, 3).join(', ') || '—'} (${Math.round(o.militia || 0)}/100). Em ~65 pode haver levante.`, !t.provs.length ? 'Sem províncias-alvo (é preciso fronteira ou reivindicação)' : s.econ.treasury < g * 0.0008 ? 'Tesouro insuficiente' : !nb && !t.claimed ? 'Só em vizinhos ou territórios reivindicados' : null);
  add('sendArms', 'Enviar armas aos rebeldes', `Custo ${(g * 0.0015).toFixed(2)} bi. Grande impulso à milícia; risco alto de descoberta.`, (o.militia || 0) < 10 ? 'Milícia ainda inexistente' : s.econ.treasury < g * 0.0015 ? 'Tesouro insuficiente' : null);
  return A;
}

export function doCovert(s, data, id, key) {
  const c = s.world.c[id], g = s.econ.gdp, o = op(s, id), e = entOf(s, data, id), name = nm(s, data, id);
  const lib = e?.profile?.liberty ?? 50;
  if (key === 'fundParty') { s.econ.treasury -= g * 0.0006; o.party = clamp(o.party + 12 * (0.55 + lib / 110), 0, 100); return { ok: true, msg: `Recursos enviados discretamente a aliados políticos em ${name}.` }; }
  if (key === 'fundMilitia') { s.econ.treasury -= g * 0.0008; o.militia = clamp(o.militia + 10, 0, 100); o.provs = militiaTargets(s, data, id).provs; return { ok: true, msg: `Dinheiro chega a grupos armados em ${name}.` }; }
  if (key === 'sendArms') { s.econ.treasury -= g * 0.0015; o.militia = clamp(o.militia + 18, 0, 100); o.arms++; o.heat = (o.heat || 0) + 2; return { ok: true, msg: `Carregamento de armas atravessa a fronteira de ${name}.` }; }
  return { ok: false, msg: '?' };
}

// Incitar um aliado contra um inimigo comum.
export function inciteTargets(s, data, id) {
  const e = entOf(s, data, id);
  const nb = [...new Set([...(e?.nb || []), ...(data.geo.countries[id]?.sea || [])])];
  return nb.filter(x => x !== PLY && s.world.c[x] && !s.world.c[x].dep && relAI(s, data, id, x) < 25 && !defenseAllies(s, data, id).has(x));
}
export function incite(s, data, id, target, ctx) {
  const g = s.econ.gdp, p = s.partners[id];
  if (!p || p.rel < 25) return { ok: false, msg: 'É preciso relação ≥ 25 com o país a ser incitado.' };
  if ((p.cd.incite || 0) > day(s)) return { ok: false, msg: `Aguarde ${p.cd.incite - day(s)} dias.` };
  s.econ.treasury -= g * 0.001; p.cd.incite = day(s) + 45;
  const drop = 12 + p.rel / 8 + (s.partners[target]?.rel < -30 ? 6 : 0);
  shiftRelAI(s, id, target, -drop);
  const r = relAI(s, data, id, target);
  const A = s.world.c[id], B = s.world.c[target];
  let msg = `Diplomatas de ${s.nation.shortName} alimentam a desconfiança de ${nm(s, data, id)} contra ${nm(s, data, target)} (relação entre eles: ${Math.round(r)}).`;
  if (chance(0.25)) { if (s.partners[target]) s.partners[target].rel -= 15; msg += ` ${nm(s, data, target)} descobriu a manobra.`; }
  if (r < -55 && aiPower(A) > aiPower(B) * 1.05 && !s.world.wars.some(w => w.active && [...w.a, ...w.b].includes(id)) && chance(0.45)) {
    startAiWar(s, data, id, target, ctx, `incitado por ${s.nation.shortName}`);
    msg += ` ${nm(s, data, id)} declarou guerra a ${nm(s, data, target)}!`;
  }
  return { ok: true, msg, log: true };
}

export function startAiWar(s, data, a, b, ctx, why) {
  const w = { id: `ai_${a}_${b}_${day(s)}`, ai: true, a: [a], b: [b], since: day(s), front: 0, active: true, occA: [], occB: [], note: why || '' };
  s.world.wars.push(w);
  ctx.news(`Guerra! ${nm(s, data, a)} ataca ${nm(s, data, b)}${why ? ' (' + why + ')' : ''}.`, 'war');
  aggressorSanctions(s, data, w, ctx);
  ctx.onAiWar?.(w);
  return w;
}
// Potências próximas da vítima e contrárias ao agressor impõem sanções.
function aggressorSanctions(s, data, w, ctx) {
  const a = w.a[0], b = w.b[0];
  w.sancDone = true;
  for (const id in s.world.c) {
    const c = s.world.c[id];
    if (c.dep || c.gdp < 800 || id === a || id === b) continue;
    if (relAI(s, data, id, b) > 35 && relAI(s, data, id, a) < 10 && (entOf(s, data, id)?.profile?.liberty ?? 50) > 45) {
      (s.world.sanc ||= {})[`${id}>${a}`] = day(s);
      ctx.news(`${nm(s, data, id)} impõe sanções a ${nm(s, data, a)} pela agressão.`, 'warn');
    }
  }
}

// Transfere território entre países de IA (ou de/para o jogador via ctx.transfer).
function aiTransfer(s, data, pids, from, to) {
  const F = s.world.c[from], T = s.world.c[to];
  for (const pid of pids) {
    const popM = (data.geo.prov[pid].pop || 0) / 1e6;
    if (F) { const g = F.gdp / Math.max(0.01, F.pop) * popM; F.pop = Math.max(0.01, F.pop - popM); F.gdp = Math.max(0.01, F.gdp - g); if (T) { T.pop += popM; T.gdp += g; } }
    setOwner(s, data, pid, to);
  }
  for (const id in s.world.c) if (!provincesOf(s, data, id).length) delete s.world.c[id];
}

export function weeklyAiWarFronts(s, data, ctx) {
  const W = s.world;
  // Sanções vencem depois de dois anos.
  for (const k in W.sanc || {}) if (day(s) - W.sanc[k] > 730) delete W.sanc[k];
  // Rivalidades que explodem sem reivindicação formal.
  if (chance(0.006) && W.wars.filter(w => w.active && w.ai).length < 4) {
    const ids = Object.keys(W.c).filter(id => !W.c[id].dep && W.c[id].gdp > 20);
    const a = ids[Math.floor(random() * ids.length)], A = W.c[a];
    const nbs = (entOf(s, data, a)?.nb || []).filter(x => x !== PLY && W.c[x] && !W.c[x].dep && relAI(s, data, a, x) < -55 && aiPower(A) > aiPower(W.c[x]) * 1.3 && !(W.c[x].nuclear && !A.nuclear));
    if (nbs.length && !W.wars.some(w => w.active && [...w.a, ...w.b].includes(a))) startAiWar(s, data, a, nbs[0], ctx, 'rivalidade histórica');
  }
  for (const w of s.world.wars) {
    if (!w.active || !w.ai) continue;
    if (!w.sancDone) aggressorSanctions(s, data, w, ctx);
    w.occA ||= []; w.occB ||= [];
    const step = Math.floor(Math.abs(w.front) / (W.chaos ? 12 : 20));
    const winner = w.front > 0 ? w.a[0] : w.b[0], loser = w.front > 0 ? w.b[0] : w.a[0];
    const occ = w.front > 0 ? w.occA : w.occB;
    if (step > occ.length && s.world.c[winner] && s.world.c[loser]) {
      const held = new Set([...provincesOf(s, data, winner), ...occ]);
      const cand = provincesOf(s, data, loser).filter(p => !s.world.occ[p] && data.geo.prov[p].nb.some(n => held.has(n)));
      const pid = cand.sort((x, y) => (data.geo.prov[y].pop || 0) - (data.geo.prov[x].pop || 0))[0];
      if (pid) { s.world.occ[pid] = winner; occ.push(pid); territoryChanged(s); ctx.news(`${nm(s, data, winner)} ocupa ${data.geo.prov[pid].n} (${nm(s, data, loser)}).`, 'war'); }
    }
    w._wasActive = true;
  }
  for (const w of s.world.wars) {
    if (w.active || !w._wasActive) continue;
    w._wasActive = false;
    for (const [list, by] of [[w.occA || [], w.a[0]], [w.occB || [], w.b[0]]]) {
      const keep = list.filter(p => s.world.occ[p] === by);
      const winnerSide = (w.front > 0 && by === w.a[0]) || (w.front < 0 && by === w.b[0]);
      if (winnerSide && keep.length) { aiTransfer(s, data, keep, ownerOf(s, data, keep[0]), by); ctx.news(`Pelo acordo de paz, ${nm(s, data, by)} anexa ${keep.length} província(s).`, 'war'); }
      else for (const p of keep) delete s.world.occ[p];
    }
    territoryChanged(s);
  }
}

// Criação de um novo Estado (cliente do jogador) a partir de províncias rebeldes.
export function newClientState(s, data, pids, from, ctx) {
  s.world.ents ||= {};
  const n = Object.keys(s.world.ents).length + 1;
  const id = 'REB' + n;
  const big = pids.reduce((b, p) => (data.geo.prov[p].pop || 0) > (data.geo.prov[b].pop || 0) ? p : b, pids[0]);
  const name = `República de ${data.geo.prov[big].n}`;
  const base = entOf(s, data, from);
  const rk = regionalFlagFor(data, pids);
  s.world.ents[id] = { ...base, id, name, nameEn: name, iso2: null, cat: 'partially_recognized', parent: null, recognition: `Separada de ${base?.name || from} com apoio de ${s.nation.shortName}`, capital: { name: data.geo.prov[big].n, prov: big }, profile: profileFromAxes(s.nation.ideology.axes, base?.profile), flag: rk ? { reg: rk, alt: null } : { layout: 'h3', colors: ['#7a1d12', '#f2f2f2', '#1d2b45'], emblems: [{ type: 'star', color: '#c9a227', x: 0.5, y: 0.5, s: 0.3 }] } };
  const popM = pids.reduce((a, p) => a + (data.geo.prov[p].pop || 0), 0) / 1e6;
  s.world.c[id] = { id, pop: 0, gdp: 0, troops: popM * 2, equip: 30, ready: 40, logi: 25, intel: 20, stab: 35, growth: 2, share: 1, dep: false, aggr: 0, nego: 50, mobil: false, debt: 40, capitalProv: big, puppetOf: PLY };
  s.partners[id] = { rel: 70, trust: 60, trade: true, pact: true, sanctionsOn: false, sanctionsBy: false, broken: false, cd: {} };
  if (from === PLY) ctx.transfer(pids, id); else aiTransfer(s, data, pids, from, id);
  s.world.claims.push({ id: 'irr_' + id, claimant: from, holder: id, provs: [...pids], type: 'sovereignty', just: `${base?.name || from} não reconhece a separação.`, strat: 50, dom: 80, risk: 70, status: 'active', src: 'rebellion' });
  ctx.news(`Nasce a ${name}, separada de ${base?.name || from}.`, 'war');
  return id;
}

export function weeklyCovert(s, data, ctx) {
  const W = s.world;
  for (const id in W.covert || {}) {
    const o = W.covert[id], c = W.c[id], p = s.partners[id];
    if (!c || !p) { delete W.covert[id]; continue; }
    const e = entOf(s, data, id), lib = e?.profile?.liberty ?? 50;
    o.party = Math.max(0, o.party - 0.6); o.militia = Math.max(0, o.militia - 0.4); o.heat = Math.max(0, (o.heat || 0) - 0.2);
    // Descoberta
    const pDetect = clamp(0.015 + (o.party + o.militia * 1.5) / 3000 + (c.intel || 30) / 2500 - s.st.intel / 2500 + (o.heat || 0) * 0.01, 0.005, 0.25);
    if ((o.party > 5 || o.militia > 5) && chance(pDetect)) {
      o.found++;
      const severe = o.militia > o.party;
      p.rel = clamp(p.rel - (severe ? 25 : 12), -100, 100); p.trust = clamp(p.trust - 15, 0, 100);
      if (severe && chance(0.5)) p.sanctionsBy = true;
      if (severe) o.militia *= 0.5; else o.party *= 0.3;
      s.st.reputation = clamp(s.st.reputation - (severe ? 5 : 2), 0, 100);
      ctx.news(`${nm(s, data, id)} acusa ${s.nation.shortName} de ${severe ? 'armar rebeldes em seu território' : 'financiar ilegalmente partidos locais'}.`, 'bad');
      ((s.world.memory ||= {})[id] ||= []).unshift({ day: day(s), text: severe ? 'Armou rebeldes no nosso território' : 'Financiou partidos no nosso país', v: severe ? -20 : -8 });
    }
    // Partido afim: aproxima a ideologia e pode chegar ao poder.
    if (o.party > 30) { p.rel = clamp(p.rel + 0.3, -100, 100); if (c.ax) for (const k in s.nation.ideology.axes) c.ax[k] = c.ax[k] + (s.nation.ideology.axes[k] - c.ax[k]) * 0.01 * o.party / 100; }
    if (o.party >= 75 && chance(lib >= 40 ? 0.1 : 0.04)) {
      changeRegime(s, data, id, 'covert');
      o.party = 40;
      ctx.news(lib >= 40 ? `Partido apoiado por ${s.nation.shortName} vence as eleições em ${nm(s, data, id)}!` : `Facção alinhada a ${s.nation.shortName} assume o poder em ${nm(s, data, id)}.`, 'good');
    }
    // Levante armado
    if (o.militia >= 65 && chance(0.15)) {
      const provs = (o.provs || militiaTargets(s, data, id).provs).filter(x => ownerOf(s, data, x) === id);
      if (!provs.length) { o.militia = 20; continue; }
      const pWin = clamp(o.militia / 100 - c.stab / 220 - aiPower(c) / Math.max(1, militaryPower(s)) * 0.08 + o.arms * 0.03, 0.12, 0.8);
      if (chance(pWin)) {
        const claimed = W.claims.some(x => x.claimant === PLY && x.holder === id && x.provs.some(z => provs.includes(z)));
        if (claimed) { ctx.transfer(provs, PLY); ctx.news(`Levante em ${data.geo.prov[provs[0]].n}: a região rompe com ${nm(s, data, id)} e se une a ${s.nation.shortName}.`, 'war'); }
        else newClientState(s, data, provs, id, ctx);
        p.rel = clamp(p.rel - 40, -100, 100); s.st.reputation = clamp(s.st.reputation - 6, 0, 100);
        delete W.covert[id];
      } else {
        o.militia = 5; p.rel = clamp(p.rel - 15, -100, 100); c.stab = clamp(c.stab + 3, 0, 100);
        ctx.news(`Levante armado esmagado em ${nm(s, data, id)}; o governo acusa interferência estrangeira.`, 'bad');
      }
    }
  }
  playerInsurgencies(s, data, ctx);
  nuclearProgramsWeekly(s, data, ctx);
}

// Zonas suas reivindicadas por outro país: se insatisfeitas, podem se rebelar.
function playerInsurgencies(s, data, ctx) {
  const W = s.world;
  W.insurg ||= {};
  const regOf = {};
  for (const r of s.regions) for (const p of r.provinces) regOf[p] = r;
  for (const cl of W.claims) {
    if (cl.holder !== PLY || cl.status !== 'active') continue;
    const provs = cl.provs.filter(p => ownerOf(s, data, p) === PLY && !W.occ[p]);
    if (!provs.length) continue;
    const unrest = provs.reduce((a, p) => a + (regOf[p]?.unrest ?? 40), 0) / provs.length;
    const ins = W.insurg[cl.id] ||= { level: 10, sponsor: 0 };
    const target = clamp((unrest - 35) * 1.1 + s.st.separatism * 0.35 + ins.sponsor - s.st.control * 0.2 + (W.c[cl.claimant] ? 5 : 0), 0, 100);
    ins.level = clamp(ins.level + (target - ins.level) * 0.08, 0, 100);
    ins.sponsor = Math.max(0, ins.sponsor - 0.5);
    ins.provs = provs;
    if (ins.level > 72 && (ins.cd || 0) <= day(s) && chance(0.25)) {
      ins.cd = day(s) + 120;
      ctx.card(insurgencyCard(s, data, cl, ins, provs));
    }
  }
}
export function sponsorInsurgency(s, claimant, amount) {
  for (const cl of s.world.claims) if (cl.claimant === claimant && cl.holder === PLY && cl.status === 'active') { const i = ((s.world.insurg ||= {})[cl.id] ||= { level: 10, sponsor: 0 }); i.sponsor = Math.min(40, i.sponsor + amount); }
}
function insurgencyCard(s, data, cl, ins, provs) {
  const names = provs.map(p => data.geo.prov[p].n).slice(0, 3).join(', ');
  const cn = nm(s, data, cl.claimant);
  return { id: `dyn_insurg_${cl.id}_${day(s)}`, dyn: true, crisis: true, cat: 'Revolta regional', title: `Revolta em ${names}`, deadline: 7, default: 0,
    desc: `Grupos armados tomaram prédios públicos em ${names} e exigem ${W(cl) ? `a união com ${cn}` : 'a independência'}. A polícia local se recusa a reprimir; ${cn} declara "solidariedade" aos rebeldes.`,
    context: `Nível da insurgência: ${Math.round(ins.level)}/100. A região é reivindicada por ${cn}.`,
    options: [
      { text: 'Esmagar a revolta com o Exército.', hint: 'Mantém o território; mortes, condenação e ressentimento.', act: { type: 'insurgency', claim: cl.id, choice: 'crush' } },
      { text: 'Oferecer autonomia ampla à região.', hint: 'Desarma a revolta; o centro perde poder.', act: { type: 'insurgency', claim: cl.id, choice: 'autonomy' } },
      { text: 'Aceitar um referendo sobre o futuro da região.', hint: 'Legítimo; você pode perder as províncias.', act: { type: 'insurgency', claim: cl.id, choice: 'referendum' } },
    ] };
  function W(c) { return !!s.world.c[c.claimant]; }
}
export function resolveInsurgency(s, data, act, ctx) {
  const cl = s.world.claims.find(c => c.id === act.claim);
  if (!cl) return '';
  const ins = ((s.world.insurg ||= {})[act.claim] ||= { level: 50, sponsor: 0 });
  const provs = (ins.provs || cl.provs).filter(p => ownerOf(s, data, p) === PLY);
  if (!provs.length) return '';
  const regs = s.regions.filter(r => r.provinces.some(p => provs.includes(p)));
  if (act.choice === 'crush') {
    s.econ.treasury -= s.econ.gdp * 0.003; s.st.control = clamp(s.st.control + 5, 0, 100); s.st.reputation = clamp(s.st.reputation - 6, 0, 100); s.st.civil = clamp(s.st.civil - 3, 0, 100);
    ins.level = 35; for (const r of regs) r.unrest = clamp(r.unrest + 10, 0, 100);
    if (s.partners[cl.claimant]) s.partners[cl.claimant].rel -= 12;
    return `A revolta em ${data.geo.prov[provs[0]]?.n || 'região'} foi esmagada.`;
  }
  if (act.choice === 'autonomy') {
    ins.level = 15; for (const r of regs) { r.unrest = clamp(r.unrest - 20, 0, 100); r.sep = Math.max(0, (r.sep || 0) - 0.2); }
    s.st.control = clamp(s.st.control - 3, 0, 100); s.groups.regional = clamp(s.groups.regional + 6, 0, 100); s.st.legitimacy = clamp(s.st.legitimacy - 2, 0, 100);
    s.longMods.push({ k: 'separatism', v: -6, d: 365, left: 365, src: 'Autonomia regional' });
    return 'Autonomia concedida; os rebeldes depõem as armas.';
  }
  const leave = chance(clamp(0.3 + (ins.level - 70) / 60 + (100 - s.st.legitimacy) / 300, 0.15, 0.85));
  s.st.reputation = clamp(s.st.reputation + 4, 0, 100);
  if (!leave) { ins.level = 5; cl.status = 'resolved'; for (const r of regs) r.unrest = clamp(r.unrest - 25, 0, 100); return 'O referendo confirmou a região no país; a reivindicação estrangeira perde força.'; }
  if (s.world.c[cl.claimant]) ctx.transfer(provs, cl.claimant); else newClientState(s, data, provs, PLY, ctx);
  cl.status = 'resolved'; delete s.world.insurg[act.claim];
  s.st.legitimacy = clamp(s.st.legitimacy - 8, 0, 100);
  return `O referendo aprovou a separação: ${provs.length} província(s) deixam ${s.nation.shortName}.`;
}

// Programas nucleares de países de IA.
function nuclearProgramsWeekly(s, data, ctx) {
  for (const id in s.world.c) {
    const c = s.world.c[id], e = entOf(s, data, id);
    if (c.dep) continue;
    if (c.nuclear == null) c.nuclear = !!e?.profile?.nuclear;
    if (c.nuclear) continue;
    if (c.nukeProg) {
      c.nukeProg += rand(0.4, 1.1);
      if (c.nukeProg >= 100) {
        c.nuclear = true; c.nukeProg = 0;
        ctx.news(`${nm(s, data, id)} realiza seu primeiro teste nuclear!`, 'war');
        for (const x in s.world.c) if (s.world.c[x].gdp > 1500 && (entOf(s, data, x)?.profile?.liberty ?? 50) > 55 && relAI(s, data, x, id) < 30) (s.world.sanc ||= {})[`${x}>${id}`] = day(s);
        if (s.partners[id] && s.partners[id].rel < 0) s.partners[id].rel -= 8;
      }
      continue;
    }
    const mi = e?.profile?.milIntensity ?? 0.6;
    const threatened = Object.keys(s.world.c).some(x => s.world.c[x].nuclear && relAI(s, data, id, x) < -50) || (s.nation.nuclear && (s.partners[id]?.rel ?? 0) < -50);
    if (c.gdp > 120 && (mi >= 1.3 || threatened) && chance(0.0015 * (threatened ? 3 : 1))) {
      c.nukeProg = 1;
      ctx.news(`Inteligência estrangeira suspeita que ${nm(s, data, id)} iniciou um programa nuclear secreto.`, 'warn');
    }
  }
}
export function sanctionCount(s, id) { return Object.keys(s.world.sanc || {}).filter(k => k.endsWith('>' + id)).length; }
