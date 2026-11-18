import { clamp, chance, rand } from './util.js';
import { PLY, aiPower, playerNeighbors, relAI, sharedOrgs, addLoan, ownerOf } from './world.js';
import { affinity } from './ideology.js';
import { ent } from './war.js';
import { resolveInsurgency, doCovert, incite, changeRegime } from './covert.js';
import { resolveNuke, startNukeProgram } from './nuclear.js';
import { startProgram, cancelProgram } from './programs.js';
import { politicsAct } from './politics.js';
import { oligarchAct } from './markets.js';
import { generalAct } from './armies.js';
import { warEventAct } from './warevents.js';
import { governorsAct } from './governors.js';
import { worldWarAct } from './worldwar.js';
import { unVoteAct } from './worldlife.js';
import { ascentAct } from './modes.js';
import { chaosAct } from './newstates.js';
import { cabinetAct } from './cabinet.js';
import { endGame } from './regime.js';
import { armedAct, peaceAct } from './order.js';
import { extraAct } from './extras.js';
import { attritionAct } from './attrition.js';

const day = s => Math.floor(s.time.min / 1440);
export const partnerName = (s, data, id) => id === PLY ? s.nation.shortName : ent(s, data, id)?.name || id;
const repression = s => 100 - (s.st.civil + s.st.political) / 2;
const tolerance = (s, data, id) => 100 - (ent(s, data, id)?.profile?.liberty ?? 50);
export const orgDef = (s, data, id) => data.wOrgById[id] || s.world.blocs.find(b => b.id === id);

export function partnerActions(s, data, id) {
  const p = s.partners[id], g = s.econ.gdp, d = day(s), c = s.world.c[id];
  const cd = k => (p.cd[k] || 0) > d ? `Aguarde ${p.cd[k] - d} dias` : null;
  const war = s.wars.some(w => w.active && w.enemies.includes(id));
  const big = c && c.gdp > 500;
  const A = [];
  const add = (key, name, desc, block) => A.push({ key, name, desc, block: block || null });
  if (p.broken) { add('restore', 'Restabelecer relações', 'Reabre embaixadas. +10 relação.', cd('restore') || (war ? 'Em guerra' : null)); return A; }
  add('improve', 'Missão diplomática', `Custo ${(g * 0.0005).toFixed(2)} bi. +4 a +8 relação.`, cd('improve') || (s.econ.treasury < g * 0.0005 ? 'Tesouro insuficiente' : null));
  if (!p.trade) add('trade', 'Propor acordo comercial', 'Amplia exportações e importações. Exige relação ≥ 10.', cd('trade') || (p.rel < 10 ? 'Relação baixa' : p.sanctionsBy || p.sanctionsOn ? 'Sanções ativas' : war ? 'Em guerra' : null));
  else add('cancelTrade', 'Cancelar acordo comercial', 'Protege a produção nacional; irrita o parceiro.');
  if (big) add('invest', 'Solicitar investimentos', 'Capital estrangeiro: tesouro e crescimento. Exige relação ≥ 30.', cd('invest') || (p.rel < 30 ? 'Relação baixa' : null));
  if (c && c.gdp > 50) add('borrow', 'Pedir empréstimo', `Até ${(Math.min(g * 0.03, c.gdp * 0.01)).toFixed(2)} bi; juros conforme relação e dívida. Exige relação ≥ 15.`, cd('borrow') || (p.rel < 15 ? 'Relação baixa' : null));
  if (big) add('aid', 'Pedir ajuda humanitária', 'Só com fome acima de 8% ou desastre recente.', cd('aid') || (s.st.hunger < 8 && !(s.flags.disaster && d - s.flags.disaster < 90) ? 'Sem crise humanitária' : p.rel < 0 ? 'Relação negativa' : null));
  add('lend', 'Emprestar dinheiro', `Empresta ${(g * 0.005).toFixed(2)} bi por 2 anos a 5%.`, cd('lend') || (s.econ.treasury < g * 0.005 ? 'Tesouro insuficiente' : war ? 'Em guerra' : null));
  add('grant', 'Doação / subsídio', `Doa ${(g * 0.002).toFixed(2)} bi. Grande ganho de relação e influência.`, cd('grant') || (s.econ.treasury < g * 0.002 ? 'Tesouro insuficiente' : war ? 'Em guerra' : null));
  add('infra', 'Financiar infraestrutura no exterior', `Custo ${(g * 0.004).toFixed(2)} bi. Influência regional duradoura.`, cd('infra') || (s.econ.treasury < g * 0.004 ? 'Tesouro insuficiente' : war ? 'Em guerra' : null));
  const theirWar = s.world.wars.find(w => w.active && (w.a.includes(id) || w.b.includes(id)));
  if (theirWar) add('warSupport', 'Apoiar no esforço de guerra', `Envia ${(g * 0.003).toFixed(2)} bi em armas e crédito para ${partnerName(s, data, id)}.`, cd('warSupport') || (s.econ.treasury < g * 0.003 ? 'Tesouro insuficiente' : null));
  if (!p.pact) add('pact', 'Tratado de defesa', 'Aliado entra nas suas guerras defensivas. Exige relação ≥ 45.', cd('pact') || (p.rel < 45 ? 'Relação baixa' : war ? 'Em guerra' : null));
  else add('cancelPact', 'Encerrar tratado de defesa', 'Libera de obrigações; ofende o aliado.');
  if (!p.nap && !p.pact) add('nap', 'Pacto de não agressão', 'Compromisso de não atacar. Exige relação ≥ 0.', cd('nap') || (p.rel < 0 ? 'Relação negativa' : war ? 'Em guerra' : null));
  if (!p.intel) add('intel', 'Compartilhamento de inteligência', 'Inteligência +; exige relação ≥ 55.', cd('intel') || (p.rel < 55 ? 'Relação baixa' : null));
  if (s.world.claims.some(x => x.claimant === id && x.holder === PLY && x.status === 'active')) add('settle', 'Negociar a disputa territorial', 'Oferece autonomia, referendo ou comissão de fronteira para encerrar a reivindicação.', cd('settle') || (p.rel < -30 ? 'Relação baixa demais' : null));
  if (!p.sanctionsOn) add('sanction', 'Impor sanções', 'Corta comércio e pressiona o alvo.');
  else add('lift', 'Suspender sanções', 'Restabelece o comércio possível.');
  add('break', 'Romper relações', 'Encerra acordos e tratados. −40 relação.');
  return A;
}

export function doPartnerAction(s, data, id, key) {
  const p = s.partners[id], g = s.econ.gdp, d = day(s), nm = partnerName(s, data, id), c = s.world.c[id];
  const setCd = (k, n) => { p.cd[k] = d + n; };
  const scale = c ? clamp(c.gdp / 2000, 0.3, 3) : 0.5;
  switch (key) {
    case 'improve': s.econ.treasury -= g * 0.0005; p.rel = clamp(p.rel + rand(4, 8), -100, 100); setCd('improve', 30); return { ok: true, msg: `Missão diplomática a ${nm} bem recebida.` };
    case 'trade': {
      const pc = clamp(0.35 + (p.rel - 10) / 70 + (p.trust - 50) / 150 - (s.policies.foreign === 'isolationist' ? 0.25 : 0), 0.05, 0.95);
      setCd('trade', 30);
      if (chance(pc)) { p.trade = true; p.rel += 5; p.trust += 5; return { ok: true, msg: `Acordo comercial assinado com ${nm}.`, log: true }; }
      p.rel -= 1; return { ok: false, msg: `${nm} recusou o acordo comercial (chance era ${(pc * 100).toFixed(0)}%).` };
    }
    case 'cancelTrade': p.trade = false; p.rel -= 10; p.trust -= 12; return { ok: true, msg: `Acordo comercial com ${nm} cancelado.`, log: true };
    case 'invest': {
      setCd('invest', 120);
      const pc = clamp(0.3 + (p.trust - 40) / 100 + (s.st.stability - 50) / 100 - s.st.corruption / 200, 0.1, 0.9);
      if (!chance(pc)) return { ok: false, msg: `Investidores de ${nm} consideraram o país arriscado demais.` };
      s.econ.treasury += g * 0.004 * scale;
      s.longMods.push({ k: 'growth', v: 0.35 * Math.min(1.5, scale), d: 365, left: 365, src: 'Investimento ' + nm });
      s.groups.business = clamp(s.groups.business + 4, 0, 100);
      return { ok: true, msg: `${nm} anunciou investimentos de ${(g * 0.004 * scale).toFixed(2)} bi.`, log: true };
    }
    case 'borrow': {
      setCd('borrow', 180);
      const amt = Math.min(g * 0.03, c.gdp * 0.01);
      const dr = s.econ.debt / g;
      const pc = clamp(0.8 - Math.max(0, dr - 0.6) - (s.flags.defaulted ? 0.5 : 0) + (p.rel - 30) / 150, 0.05, 0.95);
      if (!chance(pc)) return { ok: false, msg: `${nm} negou o empréstimo: risco alto demais.` };
      const rate = clamp(3 + dr * 4 - p.rel / 25, 1, 15);
      s.econ.treasury += amt;
      addLoan(s, { lender: id, borrower: PLY, principal: amt, rate: +rate.toFixed(1), weeks: 156, kind: 'bilateral' });
      return { ok: true, msg: `${nm} emprestou ${amt.toFixed(2)} bi a ${rate.toFixed(1)}% ao ano por 3 anos.`, log: true };
    }
    case 'aid':
      setCd('aid', 90);
      s.econ.treasury += g * 0.004 * Math.min(scale, 1.5);
      s.longMods.push({ k: 'hunger', v: -4, d: 120, left: 120, src: 'Ajuda ' + nm });
      return { ok: true, msg: `${nm} enviou ajuda humanitária.`, log: true };
    case 'lend': {
      const amt = g * 0.005;
      s.econ.treasury -= amt; setCd('lend', 120);
      addLoan(s, { lender: PLY, borrower: id, principal: amt, rate: 5, weeks: 104, kind: 'bilateral' });
      p.rel += 6; p.trust += 4;
      return { ok: true, msg: `Empréstimo de ${amt.toFixed(2)} bi concedido a ${nm}.`, log: true };
    }
    case 'grant': s.econ.treasury -= g * 0.002; setCd('grant', 90); p.rel += 12; s.st.influence = clamp(s.st.influence + 1, 0, 100); if (c) c.stab = clamp(c.stab + 2, 0, 100); return { ok: true, msg: `Doação enviada a ${nm}.`, log: true };
    case 'infra': s.econ.treasury -= g * 0.004; setCd('infra', 240); p.rel += 10; p.trust += 6; if (c) c.gdp *= 1.003; s.longMods.push({ k: 'influence', v: 3, d: 730, left: 730, src: 'Obras em ' + nm }); return { ok: true, msg: `${s.nation.shortName} financiará uma ferrovia em ${nm}.`, log: true };
    case 'warSupport': {
      const w = s.world.wars.find(x => x.active && (x.a.includes(id) || x.b.includes(id)));
      s.econ.treasury -= g * 0.003; setCd('warSupport', 60); p.rel += 10;
      const bonus = g * 0.003 / Math.max(1, (c?.gdp || 1)) * 30 + 0.05;
      if (w.a.includes(id)) w.supportA = (w.supportA || 0) + bonus; else w.supportB = (w.supportB || 0) + bonus;
      const foe = (w.a.includes(id) ? w.b : w.a)[0];
      if (s.partners[foe]) s.partners[foe].rel -= 15;
      return { ok: true, msg: `Armas e crédito enviados a ${nm}. ${partnerName(s, data, foe)} protesta.`, log: true };
    }
    case 'pact':
      setCd('pact', 60);
      if (!chance(clamp(0.3 + (p.rel - 45) / 50, 0.1, 0.95))) return { ok: false, msg: `${nm} preferiu não assumir compromissos militares.` };
      p.pact = true; p.rel += 8;
      for (const o in s.partners) if (o !== id && relAI(s, data, o, id) < -40) s.partners[o].rel -= 6;
      return { ok: true, msg: `Tratado de defesa assinado com ${nm}.`, log: true };
    case 'cancelPact': p.pact = false; p.rel -= 15; p.trust -= 15; return { ok: true, msg: `Tratado de defesa com ${nm} encerrado.`, log: true };
    case 'nap': setCd('nap', 90); if (!chance(clamp(0.5 + p.rel / 100, 0.1, 0.95))) return { ok: false, msg: `${nm} recusou o pacto.` }; p.nap = true; p.rel += 5; return { ok: true, msg: `Pacto de não agressão assinado com ${nm}.`, log: true };
    case 'intel': setCd('intel', 120); if (!chance(clamp(0.3 + (p.rel - 55) / 60, 0.1, 0.9))) return { ok: false, msg: `${nm} não confia o suficiente para compartilhar segredos.` }; p.intel = true; s.longMods.push({ k: 'intel', v: 5, d: 0, left: 0, src: 'Acordo de inteligência ' + nm, id: 'intel_' + id }); return { ok: true, msg: `Acordo de inteligência com ${nm}.`, log: true };
    case 'settle': {
      setCd('settle', 180);
      const cl = s.world.claims.find(x => x.claimant === id && x.holder === PLY && x.status === 'active');
      const pc = clamp(0.25 + (p.rel + 30) / 150 + (c?.nego ?? 40) / 250 - (cl.dom || 50) / 300, 0.05, 0.85);
      if (!chance(pc)) { p.rel -= 2; return { ok: false, msg: `${nm} rejeitou a proposta de acordo (chance ${(pc * 100).toFixed(0)}%).` }; }
      cl.status = 'resolved'; p.rel += 20; p.trust += 10;
      s.longMods.push({ k: 'separatism', v: -4, d: 365, left: 365, src: 'Autonomia negociada' }, { k: 'g_military', v: -3, d: 180, left: 180, src: 'Concessão territorial' });
      return { ok: true, msg: `Acordo com ${nm}: autonomia regional e comissão mista encerram a disputa.`, log: true };
    }
    case 'sanction': p.sanctionsOn = true; p.trade = false; p.rel -= 25; if (c) c.gdp *= 0.99; return { ok: true, msg: `Sanções impostas a ${nm}.`, log: true };
    case 'lift': p.sanctionsOn = false; p.rel += 8; return { ok: true, msg: `Sanções contra ${nm} suspensas.`, log: true };
    case 'break': p.broken = true; p.trade = false; p.pact = false; p.rel = clamp(p.rel - 40, -100, 100); p.trust -= 20; return { ok: true, msg: `Relações diplomáticas com ${nm} rompidas.`, log: true };
    case 'restore': setCd('restore', 60); p.broken = false; p.rel += 10; return { ok: true, msg: `Relações com ${nm} restabelecidas.`, log: true };
  }
  return { ok: false, msg: 'Ação desconhecida.' };
}

// ---------- Organizações reais ----------
export function orgStatus(s, data, org) {
  const st = s.st, r = org.req || {}, miss = [];
  if (org.regions && !(s.nation.regions || []).some(x => org.regions.includes(x))) miss.push('Região não elegível');
  if (r.civil && st.civil < r.civil) miss.push(`Direitos civis ≥ ${r.civil}`);
  if (r.political && st.political < r.political) miss.push(`Liberdade política ≥ ${r.political}`);
  if (r.corruption_max && st.corruption > r.corruption_max) miss.push(`Corrupção ≤ ${r.corruption_max}`);
  if (r.reputation && st.reputation < r.reputation) miss.push(`Reputação ≥ ${r.reputation}`);
  if (r.market && st.market < r.market) miss.push(`Modelo econômico ≥ ${r.market}`);
  if (r.minMilSpend && s.budget.spend.military < r.minMilSpend) miss.push(`Gasto militar ≥ ${r.minMilSpend}% PIB`);
  if (r.resource && !(s.nation.resources || []).includes({ o: 'oil' }[r.resource])) miss.push('Ser grande produtor de petróleo');
  if (r.gdpRank && (s.world.rankings?.gdp?.pos || 999) > r.gdpRank) miss.push(`Estar entre as ${r.gdpRank} maiores economias`);
  for (const k in r) if (k.startsWith('rel_')) { const t = k.slice(4); if (s.partners[t] && s.partners[t].rel < r[k]) miss.push(`Relação com ${partnerName(s, data, t)} ≥ ${r[k]}`); }
  if (org.type === 'defense' && Object.keys(s.orgs).some(o => o !== org.id && orgDef(s, data, o)?.type === 'defense' && orgDef(s, data, o)?.kind === 'collective') && org.kind === 'collective') miss.push('Já está em outra aliança de defesa coletiva');
  const members = s.world.orgs[org.id]?.members || [];
  const hostile = members.filter(m => s.partners[m] && s.partners[m].rel < -40).length;
  if (members.length && hostile / members.length > 0.25) miss.push('Membros demais hostis a você (veto)');
  return miss;
}
export function joinOrg(s, data, id) {
  const org = data.wOrgById[id], miss = orgStatus(s, data, org);
  if (miss.length) return { ok: false, msg: 'Requisitos: ' + miss.join('; ') };
  s.orgs[id] = { since: day(s), warn: 0 };
  s.world.orgs[id].members.push(PLY);
  for (const m of s.world.orgs[id].members) if (s.partners[m]) s.partners[m].rel = clamp(s.partners[m].rel + 5, -100, 100);
  for (const r of org.rivals || []) if (s.partners[r]) s.partners[r].rel -= 15;
  return { ok: true, msg: `${s.nation.shortName} aderiu a: ${org.name}.`, log: true };
}
export function leaveOrg(s, data, id) {
  const org = orgDef(s, data, id);
  delete s.orgs[id];
  if (s.world.orgs[id]) s.world.orgs[id].members = s.world.orgs[id].members.filter(m => m !== PLY);
  for (const m of s.world.orgs[id]?.members || []) if (s.partners[m]) s.partners[m].rel -= 5;
  return { ok: true, msg: `${s.nation.shortName} deixou: ${org.name}.`, log: true };
}
export function imfLoan(s) {
  const g = s.econ.gdp, d = day(s);
  if (!s.orgs.IMF) return { ok: false, msg: 'É preciso ser membro do FMI.' };
  if ((s.orgs.IMF.cd || 0) > d) return { ok: false, msg: 'Novo empréstimo só daqui a ' + (s.orgs.IMF.cd - d) + ' dias.' };
  s.orgs.IMF.cd = d + 365; s.orgs.IMF.austerity = 12;
  s.econ.treasury += g * 0.04;
  addLoan(s, { lender: 'IMF', borrower: PLY, principal: g * 0.04, rate: 2.5, weeks: 260, kind: 'imf' });
  return { ok: true, msg: `O FMI liberou ${(g * 0.04).toFixed(1)} bi. Condição: déficit abaixo de 3% por 12 meses.`, log: true };
}

// ---------- Blocos personalizados ----------
export function blocMods(s, data, b) {
  const n = b.members.length, gdp = b.members.reduce((t, m) => t + (m === PLY ? s.econ.gdp : s.world.c[m]?.gdp || 0), 0);
  const weight = clamp(Math.log10(gdp + 1) / 4, 0.2, 1.2);
  const m = {};
  if (['trade', 'both'].includes(b.purpose)) { m.exportAccess = Math.min(0.25, 0.03 * (n - 1) * weight); m.importAccess = Math.min(0.2, 0.025 * (n - 1) * weight); m.growth = Math.min(0.6, 0.08 * (n - 1) * weight); }
  if (['defense', 'both'].includes(b.purpose)) { m.defense = Math.min(16, 2.5 * (n - 1) * weight * (b.defense === 'collective' ? 1 : 0.5)); m.g_military = 3; }
  if (b.purpose === 'political') m.reputation = Math.min(6, n);
  m.influence = Math.min(10, n * 1.2 * weight);
  if (b.policies?.includes('tariff')) m.importAccess = (m.importAccess || 0) - 0.04;
  if (b.policies?.includes('freeMove')) { m.migration = 1.5; m.laborSupply = 0.3; m.g_workers = -2; }
  if (b.policies?.includes('currency')) { m.inflation = -0.5; m.exportAccess = (m.exportAccess || 0) + 0.04; }
  if (b.policies?.includes('devFund')) { m.growth = (m.growth || 0) + 0.1; }
  return m;
}
export function createBloc(s, data, spec) {
  const id = 'BLOC' + (s.world.blocs.length + 1);
  const b = { id, name: spec.name, short: spec.short || spec.name.slice(0, 6), emblem: spec.emblem, purpose: spec.purpose, defense: spec.defense, req: spec.req || {}, policies: spec.policies || [], hq: spec.hq, leave: spec.leave, expel: spec.expel, members: [PLY], invited: [], founded: day(s), fee: 0.05 + (spec.policies?.includes('devFund') ? 0.1 : 0), type: spec.purpose === 'defense' ? 'defense' : spec.purpose === 'political' ? 'political' : 'trade', kind: spec.defense, custom: true, mods: {} };
  s.world.blocs.push(b);
  s.orgs[id] = { since: day(s), warn: 0 };
  const res = [];
  for (const m of spec.founders || []) res.push(inviteToBloc(s, data, b, m, true));
  b.mods = blocMods(s, data, b);
  return { ok: true, bloc: b, results: res, msg: `${b.name} fundado com ${b.members.length} membro(s).`, log: true };
}
export function blocEligible(s, data, b, id) {
  const p = s.partners[id], c = s.world.c[id], e = ent(s, data, id);
  if (!p || !c || c.dep) return 'Não pode aderir';
  if (b.members.includes(id)) return 'Já é membro';
  if (b.req.minRel != null && p.rel < b.req.minRel) return `Relação abaixo de ${b.req.minRel}`;
  if (b.req.region && !(e.regions || []).some(r => (s.nation.regions || []).includes(r))) return 'Fora da região do bloco';
  if (b.req.ideology === 'similar' && affinity(s.nation.ideology.axes, e.profile) < 0.25) return 'Ideologia incompatível';
  if (b.req.democracy && (e.profile?.liberty ?? 0) < 60) return 'Exige democracia';
  return null;
}
export function inviteToBloc(s, data, b, id, founding = false) {
  const why = blocEligible(s, data, b, id);
  const nm = partnerName(s, data, id);
  if (why) return { id, ok: false, msg: `${nm}: ${why}` };
  const p = s.partners[id], e = ent(s, data, id);
  let pc = 0.15 + (p.rel - 10) / 90 + affinity(s.nation.ideology.axes, e.profile) * 0.25;
  if (['defense', 'both'].includes(b.purpose)) {
    pc -= b.defense === 'collective' ? 0.15 : 0.05;
    const inNato = data.wOrgById.NATO && s.world.orgs.NATO.members.includes(id), inCsto = s.world.orgs.CSTO?.members.includes(id);
    if ((inNato || inCsto) && b.defense === 'collective') pc -= 0.3;
  }
  if (b.policies.includes('currency')) pc -= 0.1;
  if (b.policies.includes('freeMove')) pc -= 0.05;
  if (founding) pc += 0.05;
  pc = clamp(pc, 0.02, 0.92);
  if (!chance(pc)) { p.rel -= 1; return { id, ok: false, msg: `${nm} recusou (chance ${(pc * 100).toFixed(0)}%).` }; }
  b.members.push(id); p.rel += 8; p.trust += 5;
  if (['trade', 'both'].includes(b.purpose)) p.trade = true;
  if (b.defense === 'collective') p.pact = true;
  b.mods = blocMods(s, data, b);
  return { id, ok: true, msg: `${nm} aderiu a ${b.name}.` };
}
export function expelFromBloc(s, data, b, id) {
  b.members = b.members.filter(m => m !== id); b.mods = blocMods(s, data, b);
  if (s.partners[id]) { s.partners[id].rel -= 25; if (b.defense === 'collective') s.partners[id].pact = false; }
  for (const m of b.members) if (m !== PLY && s.partners[m]) s.partners[m].rel -= b.expel === 'founder' ? 4 : 1;
  return { ok: true, msg: `${partnerName(s, data, id)} foi expulso de ${b.name}.`, log: true };
}

// ---------- Deriva mensal das relações ----------
export function monthlyDiplomacy(s, data, log) {
  const rep = repression(s);
  const aggressor = s.wars.some(w => w.active && w.aggressor);
  const nb = playerNeighbors(s, data);
  const ax = s.nation.ideology?.axes;
  for (const id in s.partners) {
    const p = s.partners[id], c = s.world.c[id], e = ent(s, data, id);
    if (!c) continue;
    p.base ??= p.rel;
    const tol = tolerance(s, data, id);
    let att = p.base * 0.55 + affinity(ax, e?.profile) * 15;
    if (p.trade) att += 8;
    if (p.pact) att += 12;
    if (p.nap) att += 4;
    if (p.sanctionsOn) att -= 25;
    if (p.broken) att -= 35;
    att -= Math.max(0, rep - tol - 10) * 0.45;
    if (s.rights && s.rights.abuse > 45) att -= (s.rights.abuse - 45) * ((e?.profile?.liberty ?? 50) >= 55 ? 0.35 : 0.08);
    if (aggressor) att -= (relAI(s, data, id, s.wars.find(w => w.active && w.aggressor).enemy) > 20 ? 20 : 5);
    if (s.wars.some(w => w.active && w.enemies.includes(id))) att -= 60;
    att += sharedOrgs(s, data, id, PLY).length * 3;
    if (s.policies.foreign === 'isolationist') att -= 6;
    if (s.policies.foreign === 'integration') att += 3;
    if (s.flags.defaulted) att -= 15;
    if (c.puppetOf === PLY) att = Math.max(att, 40);
    for (const o in s.partners) if (s.partners[o].pact && relAI(s, data, id, o) < -50) { att -= 6; break; }
    if (s.world.claims.some(x => x.status === 'active' && ((x.claimant === id && x.holder === PLY) || (x.claimant === PLY && x.holder === id)))) att -= 12;
    p.rel = clamp(p.rel + (att - p.rel) * 0.1 + rand(-1.2, 1.2), -100, 100);
    p.trust = clamp(p.trust + ((p.trade ? 60 : 45) - (s.flags.defaulted ? 30 : 0) - p.trust) * 0.05, 0, 100);
    const shield = s.policies.foreign === 'isolationist' ? 0.5 : 1;
    const major = c.gdp > 1000;
    if (!p.sanctionsBy && p.rel < -40 && (rep - tol > 15 || aggressor || s.flags.atrocity) && chance((major ? 0.35 : 0.15) * shield)) { p.sanctionsBy = true; p.trade = false; log(`${partnerName(s, data, id)} impôs sanções econômicas a ${s.nation.shortName}.`, 'bad'); }
    else if (p.sanctionsBy && p.rel > -15) { p.sanctionsBy = false; log(`${partnerName(s, data, id)} suspendeu as sanções.`, 'good'); }
    if (p.trade && p.rel < -20 && chance(0.3)) { p.trade = false; log(`${partnerName(s, data, id)} denunciou o acordo comercial.`, 'bad'); }
    if (p.pact && p.rel < 15 && chance(0.3)) { p.pact = false; log(`${partnerName(s, data, id)} abandonou o tratado de defesa.`, 'bad'); }
  }
  for (const id in s.orgs) {
    const org = orgDef(s, data, id), o = s.orgs[id];
    if (!org) continue;
    if (org.custom) { org.mods = blocMods(s, data, org); continue; }
    if (org.scrutiny && rep > 70 && chance(0.25)) { s.st.reputation = clamp(s.st.reputation - 3, 0, 100); log(`${org.name} aprovou resolução condenando violações de direitos.`, 'bad'); }
    if (!['UN', 'IMF'].includes(id)) {
      const miss = orgStatus(s, data, org).filter(m => !m.startsWith('Já está') && !m.startsWith('Membros demais'));
      o.warn = miss.length ? (o.warn || 0) + 1 : 0;
      if (o.warn === 2) log(`${org.name} advertiu: ${miss.join('; ')}.`, 'warn');
      if (o.warn >= 4) { leaveOrg(s, data, id); log(`${s.nation.shortName} foi suspenso de ${org.name}.`, 'bad'); }
    }
    if (id === 'IMF' && o.austerity > 0) {
      o.austerity--;
      const def = -(s.d?.budget?.balance || 0) / s.econ.gdp * 100;
      if (def > 3) { o.breach = (o.breach || 0) + 1; log(`FMI: déficit de ${def.toFixed(1)}% viola o acordo (${o.breach}/3).`, 'warn'); if (o.breach >= 3) { s.budget.spend.welfare = Math.max(0, s.budget.spend.welfare - 1); s.groups.workers -= 6; o.breach = 0; log('FMI impôs cortes na assistência social como condição.', 'bad'); } }
    }
  }
}

// Ações vindas de cartões dinâmicos (propostas de países de IA).
export function executeAct(s, data, act, ctx) {
  const id = act.id, p = s.partners[id], nm = partnerName(s, data, id), g = s.econ.gdp;
  switch (act.type) {
    case 'trade': p.trade = true; p.rel += 6; return `Acordo comercial com ${nm} em vigor.`;
    case 'lend': s.econ.treasury -= act.amt; addLoan(s, { lender: PLY, borrower: id, principal: act.amt, rate: act.rate, weeks: 104, kind: 'bilateral' }); p.rel += 8; return `Empréstimo de ${act.amt} bi concedido a ${nm}.`;
    case 'grant': s.econ.treasury -= act.amt; p.rel += 15; s.st.influence = clamp(s.st.influence + 1, 0, 100); return `Doação de ${act.amt} bi entregue a ${nm}.`;
    case 'arms': s.econ.treasury -= g * 0.003; s.st.equipment = clamp(s.st.equipment + 6, 0, 100); p.rel += 8; for (const o in s.partners) if (relAI(s, data, o, id) < -40) s.partners[o].rel -= 4; return `Armamentos de ${nm} chegaram.`;
    case 'summit': p.rel += 14; p.trust += 8; return `Cúpula com ${nm} reduz tensões.`;
    case 'cede': {
      const cl = s.world.claims.find(x => x.id === act.claim);
      const give = cl.provs.filter(pp => ownerOf(s, data, pp) === PLY);
      ctx.transfer(give, id); cl.status = 'resolved';
      p.rel += 30; s.st.legitimacy = clamp(s.st.legitimacy - 12, 0, 100); s.groups.military = clamp(s.groups.military - 10, 0, 100);
      return `${s.nation.shortName} cedeu ${give.length} província(s) a ${nm}.`;
    }
    case 'negotiateClaim': {
      const c = s.world.c[id];
      if (chance(clamp(0.3 + (c?.nego ?? 40) / 200, 0.1, 0.8))) { p.rel += 10; s.flags['ultimatum_' + id] = 0; s.longMods.push({ k: 'legitimacy', v: -3, d: 120, left: 120, src: 'Negociação sob pressão' }); return `${nm} aceitou negociar. A crise esfria por ora.`; }
      s.flags['ultimatum_' + id] = 1; p.rel -= 8; return `${nm} considerou a proposta insuficiente.`;
    }
    case 'rejectUltimatum': s.flags['ultimatum_' + id] = 1; p.rel -= 15; s.st.legitimacy = clamp(s.st.legitimacy + 4, 0, 100); s.groups.military = clamp(s.groups.military + 4, 0, 100); return `${s.nation.shortName} rejeitou o ultimato de ${nm}.`;
    case 'joinAllyWar': ctx.joinAllyWar(act.war, act.side); return `${s.nation.shortName} entra na guerra para cumprir seus compromissos.`;
    case 'refuseAllyWar': for (const m of act.allies || []) if (s.partners[m]) s.partners[m].rel -= 15; return `${s.nation.shortName} recusou-se a intervir; aliados questionam sua palavra.`;
    case 'peace': ctx.acceptPeace(act); return `Paz assinada com ${nm}.`;
    case 'siege': ctx.siegeChoice(act); return '';
    case 'insurgency': return resolveInsurgency(s, data, act, ctx);
    case 'nuke': return resolveNuke(s, data, act, ctx);
    case 'nukeProgram': return startNukeProgram(s).msg;
    case 'covert': return p ? doCovert(s, data, id, act.key).msg : '';
    case 'incite': return p && act.target ? incite(s, data, id, act.target, ctx).msg : '';
    case 'partner': return p ? doPartnerAction(s, data, id, act.key).msg : '';
    case 'sanction': if (!p) return ''; p.sanctionsOn = true; p.trade = false; p.rel -= 25; return `Sanções impostas a ${nm}.`;
    case 'relAI': if (act.a && act.b) { const k = [act.a, act.b].sort().join('|'); s.world.rel[k] = clamp((s.world.rel[k] || 0) + act.v, -150, 150); } return '';
    case 'aiWarSupport': { const w = s.world.wars.find(x => x.id === act.war); if (w) { w['support' + (act.side || 'A')] = (w['support' + (act.side || 'A')] || 0) + (act.v || 0.15); s.econ.treasury -= g * (act.cost ?? 0.002); } return w ? 'Ajuda militar enviada.' : ''; }
    case 'program': { const r = startProgram(s, act.id); return r.msg; }
    case 'regime': if (s.world.c[id]) { changeRegime(s, data, id, 'issue'); return `Um governo alinhado a ${s.nation.shortName} assume em ${nm}.`; } return '';
    case 'declareWar': return ctx.declareWar ? ctx.declareWar(id, act.goal || 'border') : '';
    case 'expel': { const b = s.world.blocs.find(x => x.id === act.bloc); if (b && b.members[0] === PLY && act.id) return expelFromBloc(s, data, b, act.id).msg; return ''; }
    case 'leaveOrg': return act.bloc && s.orgs[act.bloc] ? (s.world.blocs.find(x => x.id === act.bloc) ? '' : leaveOrg(s, data, act.bloc).msg) : '';
    case 'joinOrg': return act.bloc ? joinOrg(s, data, act.bloc).msg : '';
    case 'blocMod': { const b = s.world.blocs.find(x => x.id === act.bloc); if (b) { b.mods ||= {}; for (const k in act.mods || {}) b.mods[k] = (b.mods[k] || 0) + act.mods[k]; } return ''; }
    case 'nukeRetaliate': {
      const by = s.nukeCrisis?.by, w = s.wars.find(x => x.active && x.enemies.includes(by)), c = s.world.c[by], bn = partnerName(s, data, by);
      if (act.target === 'negotiate') { if (w) ctx.acceptPeace({ war: w.id, concede: true }); return `${s.nation.shortName} aceita negociar com ${bn}.`; }
      if (act.target === 'military' && s.nation.nuclear && c) {
        c.pop *= 0.95; c.gdp *= 0.8; c.stab = clamp(c.stab - 20, 0, 100); c.troops *= 0.75;
        if (w) { w.enemyExh += 40; c.nego += 30; w.score += 20; }
        for (const id in s.partners) if (id !== by) s.partners[id].rel -= 6;
        if (chance(0.15)) ctx.nuclearStrike?.(by);
        return `Mísseis de ${s.nation.shortName} destroem bases militares de ${bn}.`;
      }
      if (w) { w.stance = 'offensive'; w.reinforce = 6; w.enemyExh += 10; }
      s.st.readiness = clamp(s.st.readiness + 5, 0, 100);
      return act.target === 'military' ? `Sem arsenal nuclear, a resposta será convencional: ofensiva total contra ${bn}.` : `Ofensiva total contra ${bn}.`;
    }
    case 'faction': case 'minister': case 'leader': case 'campaign': case 'coalition': case 'selfcoup': case 'uprising': return politicsAct(s, data, act, ctx);
    case 'oligarch': return oligarchAct(s, act);
    case 'general': return generalAct(s, act);
    case 'warEvent': return warEventAct(s, data, act);
    case 'gov': return governorsAct(s, data, act, ctx);
    case 'refugees': case 'mediate': return worldWarAct(s, data, act, ctx);
    case 'attr': return attritionAct(s, data, act, ctx);
    case 'unvote': return unVoteAct(s, act);
    case 'ascent': return ascentAct(s, act);
    case 'recognize': case 'joinAlliance': case 'separatist': return chaosAct(s, data, act, ctx);
    case 'delegate': case 'minAdvice': case 'pork': case 'regionBuild': return cabinetAct(s, data, act, ctx);
    case 'endgame': endGame(s, act.ending, 'Escolha do jogador'); return '';
    case 'armed': return armedAct(s, data, act, ctx);
    case 'peaceKeep': return peaceAct(s, data, act);
    case 'extra': return extraAct(s, data, act, ctx);
    case 'cancelProgram': return cancelProgram(s, act.id).msg;
    case 'nukeBoost': if (s.nuke?.active) s.nuke.prog = Math.min(99, s.nuke.prog + (act.v || 10)); return '';
    case 'covertBoost': { const o = ((s.world.covert ||= {})[id] ||= { party: 0, militia: 0, arms: 0, found: 0 }); o.party = clamp(o.party + (act.party || 0), 0, 100); o.militia = clamp(o.militia + (act.militia || 0), 0, 100); return ''; }
  }
  return '';
}
