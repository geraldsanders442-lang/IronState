import { clamp, chance, rand, random } from './util.js';
import { PLY, entOf, provincesOf, relAI } from './world.js';
import { endGame } from './regime.js';
import { replace } from './characters.js';

const day = s => Math.floor(s.time.min / 1440);
const nm = (s, data, id) => entOf(s, data, id)?.name || id;

export function nukeState(s) { return s.nuke ||= { prog: 0, active: false, detected: false, threats: 0 }; }

export function nukeProgramBlock(s) {
  const n = nukeState(s);
  if (s.nation.nuclear) return 'Você já possui armas nucleares';
  if (n.active) return `Programa em andamento (${Math.round(n.prog)}%)`;
  if (s.econ.gdp < 40) return 'Economia pequena demais (PIB ≥ 40 bi)';
  if (s.st.milIndustry < 25) return 'Indústria militar abaixo de 25';
  return null;
}
export function startNukeProgram(s) {
  const b = nukeProgramBlock(s);
  if (b) return { ok: false, msg: b };
  const n = nukeState(s);
  n.active = true; n.prog = 1; n.start = day(s);
  s.groups.military = clamp(s.groups.military + 6, 0, 100);
  return { ok: true, msg: 'Programa nuclear secreto iniciado. Custo semanal: 0,12% do PIB.', log: true };
}

export function weeklyNuclear(s, data, ctx) {
  const n = nukeState(s);
  if (n.active && !s.nation.nuclear) {
    s.econ.treasury -= s.econ.gdp * 0.0012;
    n.prog += clamp(0.5 + s.st.milIndustry / 120 + (s.st.science ?? 40) / 200 - (n.detected ? 0.25 : 0), 0.3, 2.2) * rand(0.7, 1.3);
    if (!n.detected && chance(0.02 + n.prog / 4000)) {
      n.detected = true;
      ctx.news(`Satélites estrangeiros revelam instalações nucleares secretas em ${s.nation.shortName}.`, 'bad');
      ctx.card(detectedCard(s, data));
    }
    if (n.prog >= 100) { n.active = false; ctx.card(testCard(s)); }
  }
  // Ameaça nuclear inimiga quando a IA está perdendo para você.
  for (const w of s.wars) {
    if (!w.active || w.nukeCard) continue;
    const c = s.world.c[w.enemy];
    if (!c?.nuclear) continue;
    const losing = w.score > 35 || w.gained.filter(p => s.world.occ[p] === PLY).length >= 3 || w.target?.pid === c.capitalProv;
    if (losing && chance(0.5)) { w.nukeCard = day(s); ctx.card(threatCard(s, data, w)); }
  }
  for (const w of s.wars) {
    const c = s.world.c[w.enemy];
    if (!w.active || !w.nukeIgnored || !c?.nuclear || s.nukeCrisis?.weeks > 0) continue;
    const desperate = w.score > 55 || w.target?.pid === c.capitalProv || w.mySiege;
    if (desperate && chance(0.07)) nuclearStrike(s, data, w.enemy, ctx);
  }
  weeklyFallout(s);
}

function detectedCard(s) {
  return { id: `dyn_nukedet_${day(s)}`, dyn: true, crisis: true, cat: 'Programa nuclear', title: 'O programa nuclear foi descoberto', deadline: 7, default: 1,
    desc: `Imagens de satélite publicadas na imprensa internacional mostram centrífugas e túneis em ${s.nation.shortName}. As potências exigem inspeções imediatas.`,
    context: 'Continuar provoca sanções e isolamento; abandonar rende alívio diplomático e ajuda econômica.',
    options: [
      { text: 'Negar tudo e continuar o programa.', hint: 'Sanções de várias potências; o programa segue.', act: { type: 'nuke', choice: 'defy' } },
      { text: 'Aceitar inspetores e congelar o programa.', hint: 'O programa para; reputação e relações sobem.', act: { type: 'nuke', choice: 'freeze' } },
      { text: 'Usar o programa como moeda de troca.', hint: 'Congela em troca de dinheiro e garantias.', act: { type: 'nuke', choice: 'bargain' } },
    ] };
}
function testCard(s) {
  return { id: `dyn_nuketest_${day(s)}`, dyn: true, cat: 'Programa nuclear', title: 'A bomba está pronta', deadline: 14, default: 1,
    desc: `Os cientistas de ${s.nation.shortName} informam: o primeiro artefato nuclear está montado e pode ser testado.`,
    context: 'Um teste anuncia ao mundo uma nova potência nuclear. A ambiguidade dá dissuasão com menos custo diplomático.',
    options: [
      { text: 'Realizar um teste subterrâneo público.', hint: 'Dissuasão máxima e prestígio interno; sanções e condenação.', act: { type: 'nuke', choice: 'test' } },
      { text: 'Manter a ambiguidade: não confirmar nem negar.', hint: 'Dissuasão menor; quase sem sanções.', act: { type: 'nuke', choice: 'ambiguity' } },
      { text: 'Desmontar o artefato e anunciar o fim do programa.', hint: 'Grande ganho de reputação.', act: { type: 'nuke', choice: 'dismantle' } },
    ] };
}
function threatCard(s, data, w) {
  const en = nm(s, data, w.enemy);
  const opts = [
    { text: 'Interromper a ofensiva e propor um cessar-fogo.', hint: 'Evita a escalada; você mantém o que já ocupou por ora.', act: { type: 'nuke', choice: 'halt', war: w.id } },
    { text: 'Ignorar a ameaça e avançar.', hint: 'Talvez seja blefe. Talvez não.', act: { type: 'nuke', choice: 'ignore', war: w.id } },
  ];
  if (s.nation.nuclear) opts.push({ text: 'Responder com sua própria ameaça nuclear.', hint: 'Dissuasão mútua; o mundo prende a respiração.', act: { type: 'nuke', choice: 'counter', war: w.id } });
  return { id: `dyn_nukethreat_${w.id}`, dyn: true, crisis: true, cat: 'Crise nuclear', title: `${en} ameaça usar armas nucleares`, deadline: 7, default: 0,
    desc: `Com suas linhas em colapso, o governo de ${en} coloca as forças nucleares em alerta máximo e avisa que "qualquer ameaça à existência do Estado terá resposta com todos os meios".`,
    context: 'Uma potência nuclear encurralada é o cenário mais perigoso do mundo.', options: opts };
}

export function resolveNuke(s, data, act, ctx) {
  const n = nukeState(s), all = Object.keys(s.partners);
  const libs = all.filter(id => s.world.c[id] && s.world.c[id].gdp > 1500 && (entOf(s, data, id)?.profile?.liberty ?? 50) > 55);
  switch (act.choice) {
    case 'defy': for (const id of libs) if (chance(0.6)) { s.partners[id].sanctionsBy = true; s.partners[id].rel -= 15; } s.st.reputation = clamp(s.st.reputation - 10, 0, 100); s.st.legitimacy = clamp(s.st.legitimacy + 3, 0, 100); return 'O governo nega tudo; as primeiras sanções chegam.';
    case 'freeze': n.active = false; n.frozen = true; for (const id of libs) s.partners[id].rel += 8; s.st.reputation = clamp(s.st.reputation + 6, 0, 100); s.groups.military = clamp(s.groups.military - 8, 0, 100); return 'Inspetores internacionais chegam; o programa está congelado.';
    case 'bargain': n.active = false; n.frozen = true; s.econ.treasury += s.econ.gdp * 0.01; for (const id of libs) s.partners[id].rel += 3; return 'Acordo: o programa é congelado em troca de ajuda e garantias.';
    case 'test': s.nation.nuclear = true; s.st.defense = clamp(s.st.defense + 15, 0, 100); s.st.projection = clamp(s.st.projection + 8, 0, 100); s.st.legitimacy = clamp(s.st.legitimacy + 6, 0, 100); s.st.reputation = clamp(s.st.reputation - 12, 0, 100);
      for (const id of libs) if (chance(0.7)) { s.partners[id].sanctionsBy = true; s.partners[id].rel -= 20; }
      for (const id of all) if (s.partners[id].rel < -30) s.partners[id].rel -= 5;
      return `${s.nation.shortName} é oficialmente uma potência nuclear.`;
    case 'ambiguity': s.nation.nuclear = true; s.flags.nukeAmbiguous = 1; s.st.defense = clamp(s.st.defense + 8, 0, 100); s.st.reputation = clamp(s.st.reputation - 3, 0, 100); return 'Ninguém sabe ao certo — e isso já basta para dissuadir.';
    case 'dismantle': n.active = false; s.st.reputation = clamp(s.st.reputation + 12, 0, 100); s.st.influence = clamp(s.st.influence + 4, 0, 100); for (const id of all) s.partners[id].rel += 4; s.groups.military = clamp(s.groups.military - 10, 0, 100); return 'O artefato foi desmontado diante de inspetores; o mundo aplaude.';
    case 'halt': { const w = s.wars.find(x => x.id === act.war); if (w) { w.stance = 'hold'; w.enemyExh += 15; if (s.world.c[w.enemy]) s.world.c[w.enemy].nego += 25; } s.st.reputation = clamp(s.st.reputation + 2, 0, 100); return 'A ofensiva foi suspensa; diplomatas buscam uma saída.'; }
    case 'counter': { const w = s.wars.find(x => x.id === act.war); s.st.reputation = clamp(s.st.reputation - 6, 0, 100); if (chance(0.06)) return exchange(s, data, w, ctx); if (w) { w.enemyExh += 25; if (s.world.c[w.enemy]) s.world.c[w.enemy].nego += 35; } return 'Dissuasão mútua: o inimigo recua da beira do abismo e sinaliza que quer negociar.'; }
    case 'ignore': { const w = s.wars.find(x => x.id === act.war); if (w) w.nukeIgnored = true; if (chance(0.2)) return strike(s, data, w, ctx); if (w) w.enemyExh += 10; return 'Era blefe — por enquanto. O inimigo continua recuando.'; }
  }
  return '';
}
function strike(s, data, w, ctx) { return nuclearStrike(s, data, w?.enemy, ctx).msg; }
function exchange(s, data, w, ctx) {
  const by = w?.enemy;
  const a = nuclearStrike(s, data, by, ctx, { capitalBias: 4 });
  if (!s.over) nuclearStrike(s, data, by, ctx);
  const c = s.world.c[by];
  if (c) { c.pop *= 0.88; c.gdp *= 0.6; c.stab = clamp(c.stab - 30, 0, 100); }
  if (w) { w.enemyExh += 60; if (c) c.nego += 50; }
  ctx.news(`Troca nuclear: mísseis de ${s.nation.shortName} atingem cidades de ${nm(s, data, by)}.`, 'war');
  return a.msg;
}

// ---------- Ataque nuclear contra o jogador ----------
// O alvo é sempre uma área populosa; a capital é um alvo preferencial.
export function nuclearStrike(s, data, by, ctx, opts = {}) {
  const regOf = {};
  for (const r of s.regions) for (const p of r.provinces) regOf[p] = r;
  const mine = s.regions.flatMap(r => r.provinces).filter(p => !s.world.occ[p] && !(p in (s.nuked || {})));
  if (!mine.length) return { msg: '' };
  const wt = p => Math.pow((data.geo.prov[p].pop || 1000) / 1e5, 1.3) * (p === s.nation.capitalProv ? (opts.capitalBias || 2.5) : 1);
  let pid = opts.prov;
  if (!pid) { const tot = mine.reduce((a, p) => a + wt(p), 0); let r = random() * tot; pid = mine.find(p => (r -= wt(p)) <= 0) || mine[0]; }
  const reg = regOf[pid], city = data.geo.prov[pid].n, capital = pid === s.nation.capitalProv;
  const provPop = (data.geo.prov[pid].pop || 0) / 1e6, regPop = s.econ.pop * (reg?.popShare || 0.1);
  const dead = Math.min(s.econ.pop * 0.3, provPop * rand(0.22, 0.4) + regPop * rand(0.02, 0.05) + 0.02);
  const injured = dead * rand(1.2, 1.8);
  s.econ.pop = Math.max(0.05, s.econ.pop - dead);
  s.econ.gdp *= 1 - Math.min(0.4, (reg?.popShare || 0.1) * 0.45 + (capital ? 0.08 : 0.03));
  s.econ.treasury -= s.econ.gdp * 0.01;
  (s.nuked ||= {})[pid] = day(s);
  if (reg) {
    reg.infra = clamp(reg.infra - 40, 2, 100); reg.housing = clamp(reg.housing - 35, 2, 100); reg.pollution = clamp(reg.pollution + 55, 0, 100);
    reg.unrest = clamp(reg.unrest + 30, 0, 100); reg.radiation = Math.min(100, (reg.radiation || 0) + 90); reg.nuked = { day: day(s), prov: pid, by };
  }
  const src = `Ataque nuclear contra ${city}`;
  s.longMods.push(
    { k: 'health', v: -8, d: 1095, left: 1095, src }, { k: 'qol', v: -6, d: 1095, left: 1095, src }, { k: 'growth', v: -1.6, d: 730, left: 730, src },
    { k: 'emigration', v: 3, d: 730, left: 730, src }, { k: 'stability', v: -10, d: 180, left: 180, src }, { k: 'birth', v: -2, d: 1095, left: 1095, src },
    { k: 'productivity', v: -4, d: 730, left: 730, src }, { k: 's_food', v: -0.6, d: 730, left: 730, src });
  s.st.warWeariness = clamp(s.st.warWeariness + 30, 0, 100); s.st.stability = clamp(s.st.stability - 15, 0, 100);
  for (const id in s.partners) if (id !== by) s.partners[id].rel = clamp(s.partners[id].rel + 12, -100, 100);
  if (s.partners[by]) s.partners[by].rel = -100;
  for (const id in s.world.c) if (id !== by && s.world.c[id].gdp > 500) (s.world.sanc ||= {})[`${id}>${by}`] = day(s);
  const w = s.wars.find(x => x.active && x.enemies.includes(by));
  if (w) { for (const p of w.gained) if (s.world.occ[p] === PLY) delete s.world.occ[p]; w.stance = 'defensive'; w.enemyExh += 30; }
  s.flags.nuked = (s.flags.nuked || 0) + 1;
  let killed = false;
  if (capital) {
    const pDie = clamp(0.55 - (s.flags.evacuated ? 0.4 : 0) - (s.flags.bunker ? 0.3 : 0) - s.st.defense / 500 - s.st.intel / 600, 0.05, 0.75);
    killed = chance(pDie);
    if (killed) {
      endGame(s, 'vaporized', `${s.nation.leader} morreu no ataque nuclear de ${nm(s, data, by)} contra ${city}`);
    } else {
      const victims = (s.characters || []).filter(c => c.status === 'active' && c.id !== 'opposition').sort(() => random() - 0.5).slice(0, random() < 0.5 ? 1 : 2);
      for (const c of victims) { c.status = 'dead'; replace(s, c); }
      s.nukeVictims = victims.map(c => c.name + ' (' + c.role + ')');
      s.nation.oldCapital = s.nation.capital;
      const pool = mine.filter(p => p !== pid && !data.geo.prov[pid].nb.includes(p));
      const best = (pool.length ? pool : mine.filter(p => p !== pid)).reduce((b, p) => (data.geo.prov[p].pop || 0) > (data.geo.prov[b]?.pop || 0) ? p : b, null);
      if (best) { s.nation.capitalProv = best; s.nation.capital = data.geo.prov[best].n; }
      s.flags.needCapital = 1;
      s.st.legitimacy = clamp(s.st.legitimacy - 10, 0, 100); s.st.control = clamp(s.st.control - 12, 0, 100);
      s.longMods.push({ k: 'efficiency', v: -15, d: 365, left: 365, src: 'Governo central destruído' }, { k: 'control', v: -8, d: 365, left: 365, src: 'Governo central destruído' });
    }
  }
  s.nukeCrisis = { weeks: 3, by, prov: pid, city, region: reg?.id, regionName: reg?.name || city, capital, dead, injured, day: day(s), oldCapital: capital ? city : null };
  ctx.news(`ATAQUE NUCLEAR: ${nm(s, data, by)} detona uma ogiva sobre ${city}. Cerca de ${fmtK(dead)} mortos e ${fmtK(injured)} feridos.`, 'war');
  ctx.notify?.('Ataque nuclear', capital && !killed ? `${city}, a capital, foi destruída. ${s.nation.leader} sobreviveu num abrigo. Escolha no mapa a nova sede do governo.` : `${nm(s, data, by)} usou uma arma nuclear contra ${city}. ${fmtK(dead)} mortos.`);
  return { msg: `Uma arma nuclear atingiu ${city}.`, killed, capital, pid };
}
const fmtK = m => m >= 1 ? (m.toFixed(1).replace('.', ',') + ' milhão' + (m >= 2 ? 'ões' : '')).replace('milhãoões', 'milhões') : Math.round(m * 1000) + ' mil';

// Efeitos de longo prazo das regiões atingidas e fim da crise nuclear.
export function weeklyFallout(s) {
  for (const r of s.regions) {
    if (!r.radiation) continue;
    r.radiation = Math.max(0, r.radiation * 0.994 - 0.02);
    r.pollution = Math.max(r.pollution, r.radiation * 0.7);
    r.unrest = Math.max(r.unrest, r.radiation * 0.5);
    r.infra = Math.min(r.infra, 30 + (100 - r.radiation) * 0.6);
    if (r.radiation < 1) r.radiation = 0;
  }
}

// Ameaça nuclear do jogador em uma guerra.
export function playerThreat(s, data, w, ctx) {
  if (!s.nation.nuclear) return { ok: false, msg: 'Você não tem armas nucleares.' };
  if ((w.nukeThreatCd || 0) > day(s)) return { ok: false, msg: `Aguarde ${w.nukeThreatCd - day(s)} dias.` };
  w.nukeThreatCd = day(s) + 90;
  const c = s.world.c[w.enemy];
  s.st.reputation = clamp(s.st.reputation - 8, 0, 100);
  for (const id in s.partners) s.partners[id].rel -= 4;
  if (c?.nuclear) { w.enemyExh += 8; if (chance(0.03)) return { ok: true, msg: exchange(s, data, w, ctx), log: true }; return { ok: true, msg: `${nm(s, data, w.enemy)} responde com sua própria ameaça. Impasse.`, log: true }; }
  w.enemyExh += 25; if (c) c.nego += 30;
  return { ok: true, msg: `${nm(s, data, w.enemy)} recebe a mensagem: a disposição para negociar aumenta.`, log: true };
}
// Dissuasão: fator que reduz a disposição de um país não nuclear atacar você.
export const deterred = (s, c) => !!s.nation.nuclear && !c?.nuclear;
