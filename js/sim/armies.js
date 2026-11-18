// Camada operacional da guerra: corpos de exército com generais, marinha, aviação,
// campanhas aéreas, bloqueio naval e conferência de paz com escolha de províncias no mapa.
import { clamp, chance, rand, pick, random } from './util.js';
import { investCash, payInvest } from './finance.js';
import { personName } from './names.js';
import { PLY, provincesOf, ownerOf, territoryChanged, addLoan } from './world.js';
import { transfer, endWar, entName } from './war.js';

const day = s => Math.floor(s.time.min / 1440);
const ORD = ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º'];
const GTRAITS = { agressivo: 'Ataca bem; perde mais homens.', cauteloso: 'Defende bem; avança devagar.', logístico: 'Mantém as tropas abastecidas.', popular: 'Ganha fama rápido — e ambição.', incompetente: 'Ninguém sabe como chegou lá.', brilhante: 'Um estrategista nato.' };
export const GEN_TRAITS = GTRAITS;

export function makeGeneral(s) {
  const trait = pick(Object.keys(GTRAITS));
  return { name: 'Gen. ' + personName(s.nation.culture || 'en'), skill: Math.round(rand(35, 80)) + (trait === 'brilhante' ? 15 : trait === 'incompetente' ? -20 : 0), trait, fame: Math.round(rand(5, 25)), loyalty: Math.round(rand(40, 80)) };
}
export function initForces(s) {
  if (s.forces) return;
  const n = clamp(Math.round(s.st.troops / 150), 2, 8);
  s.forces = {
    corps: Array.from({ length: n }, (_, i) => ({ id: 'c' + i, name: `${ORD[i]} Corpo de Exército`, strength: 80, gen: makeGeneral(s), role: 'reserve', war: null })),
    navy: { ships: Math.round(clamp(s.econ.gdp / 40, 2, 300) * (s.nation.coastal ? 1 : 0.1)), quality: Math.round(clamp(s.st.equipment, 10, 90)) },
    air: { wings: Math.round(clamp(Math.sqrt(s.econ.gdp) * 1.2, 2, 120)), quality: Math.round(clamp(s.st.equipment + s.st.tech * 0.2, 10, 95)) },
    blockades: {}, campaigns: {},
  };
}
const corpsOf = (s, w, role) => s.forces.corps.filter(c => c.war === w.id && c.role === role);
const genF = g => 0.75 + g.skill / 200;
const enemyAir = (c) => c ? Math.sqrt(Math.max(1, c.gdp)) * 1.1 * (0.4 + c.equip / 100) : 1;
const enemyNavy = (c) => c ? Math.max(1, c.gdp / 45) * (0.4 + c.equip / 100) : 1;

// Multiplicadores usados por warWeek.
export function warFactors(s, data, w) {
  const F = s.forces; if (!F) return { atk: 1, def: 1, air: 1, naval: 0.5 };
  const E = s.world.c[w.enemy];
  const total = F.corps.length || 1;
  const att = corpsOf(s, w, 'attack'), dfn = corpsOf(s, w, 'defend');
  const assigned = att.length + dfn.length;
  const power = list => list.reduce((a, c) => a + c.strength / 100 * genF(c.gen) * (c.gen.trait === 'agressivo' ? 1.1 : c.gen.trait === 'cauteloso' ? 0.92 : 1), 0);
  const dpower = list => list.reduce((a, c) => a + c.strength / 100 * genF(c.gen) * (c.gen.trait === 'cauteloso' ? 1.15 : 1), 0);
  const atk = assigned ? 0.7 + 0.9 * power(att) / total : 1;
  const def = assigned ? 0.75 + 0.8 * dpower(dfn) / total : 1;
  const myAir = F.air.wings * (0.4 + F.air.quality / 100), airSup = myAir / (myAir + enemyAir(E) * (1 - (w.eAir || 0)));
  const myNavy = F.navy.ships * (0.4 + F.navy.quality / 100), navalSup = myNavy / (myNavy + enemyNavy(E) * (1 - (w.eNav || 0)));
  return { atk, def, air: 0.88 + airSup * 0.3, airSup, naval: navalSup };
}

export function weeklyForces(s, data, ctx) {
  const F = s.forces; if (!F) return;
  const atWar = s.wars.filter(w => w.active);
  for (const c of F.corps) {
    const w = atWar.find(x => x.id === c.war);
    if (!w) { if (c.war) { c.war = null; c.role = 'reserve'; } c.strength = clamp(c.strength + 3 * (0.5 + s.st.logistics / 100), 0, 100); continue; }
    const loss = (c.role === 'attack' ? 2.2 : c.role === 'defend' ? 1.2 : 0) * (c.gen.trait === 'agressivo' ? 1.3 : c.gen.trait === 'logístico' ? 0.8 : 1) * clamp(1.4 - (w.ratio || 1) * 0.4, 0.5, 1.6);
    c.strength = clamp(c.strength - loss + 1.2 * (0.4 + s.st.logistics / 100) + (s.mobilized > 0 ? 0.8 : 0), 5, 100);
    c.gen.fame = clamp(c.gen.fame + (c.role === 'attack' ? 0.3 : 0.1) + (c.gen.trait === 'popular' ? 0.4 : 0), 0, 100);
  }
  // Generais famosos e pouco leais viram ameaça política.
  const hero = F.corps.map(c => c.gen).find(g => g.fame > 70 && g.loyalty < 45);
  s.longMods = s.longMods.filter(m => m.id !== 'genfame');
  if (hero) {
    s.longMods.push({ k: 'coupRisk', v: Math.round((hero.fame - 60) / 3), d: 0, left: 0, src: `Popularidade de ${hero.name}`, id: 'genfame' });
    if ((F.heroCd || 0) <= day(s) && chance(0.2)) { F.heroCd = day(s) + 120; ctx.card(heroCard(s, hero)); }
  }
  // Bloqueios e campanhas aéreas
  for (const w of atWar) {
    const E = s.world.c[w.enemy]; if (!E) continue;
    // Atrito: quem perde o mar ou o céu perde navios e esquadrilhas; o inimigo dominado também.
    const f0 = warFactors(s, data, w);
    if (f0.naval < 0.5) F.navy.ships = Math.max(1, F.navy.ships - (0.5 - f0.naval) * 1.5);
    if (f0.airSup < 0.5) F.air.wings = Math.max(1, F.air.wings - (0.5 - f0.airSup) * 0.7);
    w.eNav = clamp((w.eNav || 0) + (f0.naval > 0.5 ? (f0.naval - 0.5) * 0.04 : -0.003), 0, 0.6);
    w.eAir = clamp((w.eAir || 0) + (f0.airSup > 0.5 ? (f0.airSup - 0.5) * 0.05 : -0.003), 0, 0.6);
    if (F.blockades[w.id]) { const f = warFactors(s, data, w); if (f.naval < 0.55) { delete F.blockades[w.id]; ctx.news(`O bloqueio naval contra ${entName(s, data, w.enemy)} foi rompido.`, 'bad'); } else { E.gdp *= 0.996; w.enemyExh = clamp(w.enemyExh + 1.2, 0, 100); } }
    if ((F.campaigns[w.id] || 0) > day(s)) { const f = warFactors(s, data, w); w.enemyExh = clamp(w.enemyExh + 2.5 * f.airSup, 0, 100); E.stab = clamp(E.stab - 0.6, 5, 95); F.air.wings = Math.max(1, F.air.wings - (1 - f.airSup) * 0.8); }
  }
}
export function onCapture(s, w, pid, isCapital) {
  const att = (s.forces?.corps || []).filter(c => c.war === w.id && c.role === 'attack');
  const best = att.sort((a, b) => b.gen.skill - a.gen.skill)[0];
  if (best) { best.gen.fame = clamp(best.gen.fame + (isCapital ? 20 : 6), 0, 100); best.gen.skill = clamp(best.gen.skill + 1, 0, 100); return best.gen.name; }
  return null;
}

// ---------- Ações ----------
export function assign(s, corpsId, warId, role) {
  const c = s.forces.corps.find(x => x.id === corpsId); if (!c) return { ok: false, msg: '?' };
  c.war = role === 'reserve' ? null : warId; c.role = role;
  return { ok: true, msg: `${c.name}: ${role === 'attack' ? 'ofensiva' : role === 'defend' ? 'defesa' : 'reserva'}.` };
}
export function recruitCorps(s) {
  const F = s.forces;
  if (F.corps.length >= 10) return { ok: false, msg: 'Máximo de 10 corpos.' };
  const cost = s.econ.gdp * 0.004;
  if (investCash(s) < cost) return { ok: false, msg: 'Sem recursos (tesouro + carteira de investimentos).' };
  payInvest(s, cost); s.st.troops += 120; s.longMods.push({ k: 'laborSupply', v: -0.2, d: 0, left: 0, src: 'Novos corpos de exército' });
  const i = F.corps.length;
  F.corps.push({ id: 'c' + i + '_' + day(s), name: `${ORD[i] || i + 1 + 'º'} Corpo de Exército`, strength: 45, gen: makeGeneral(s), role: 'reserve', war: null });
  return { ok: true, msg: 'Novo corpo de exército formado (treinamento em andamento).', log: true };
}
export function buyNavy(s, n = 4) { const cost = s.econ.gdp * 0.0012 * n; if (!s.nation.coastal) return { ok: false, msg: 'País sem litoral.' }; if (investCash(s) < cost) return { ok: false, msg: 'Sem recursos (tesouro + carteira de investimentos).' }; payInvest(s, cost); s.forces.navy.ships += n; s.forces.navy.quality = clamp(s.forces.navy.quality + 1, 0, 100); return { ok: true, msg: `${n} navios incorporados à frota.`, log: true }; }
export function buyAir(s, n = 4) { const cost = s.econ.gdp * 0.001 * n; if (investCash(s) < cost) return { ok: false, msg: 'Sem recursos (tesouro + carteira de investimentos).' }; payInvest(s, cost); s.forces.air.wings += n; s.forces.air.quality = clamp(s.forces.air.quality + 1, 0, 100); return { ok: true, msg: `${n} esquadrilhas incorporadas.`, log: true }; }
export function replaceGeneral(s, corpsId) {
  const c = s.forces.corps.find(x => x.id === corpsId); if (!c) return { ok: false, msg: '?' };
  const old = c.gen; c.gen = makeGeneral(s);
  if (old.fame > 50) { s.groups.military = clamp(s.groups.military - 4, 0, 100); s.st.legitimacy = clamp(s.st.legitimacy - 1, 0, 100); }
  return { ok: true, msg: `${old.name} substituído por ${c.gen.name} no ${c.name}.`, log: true };
}
export function airCampaign(s, data, w) {
  const F = s.forces; if ((F.campaigns[w.id] || 0) > day(s)) return { ok: false, msg: 'Campanha já em curso.' };
  F.campaigns[w.id] = day(s) + 28;
  s.st.reputation = clamp(s.st.reputation - 3, 0, 100);
  if (chance(0.3)) { s.st.reputation = clamp(s.st.reputation - 4, 0, 100); return { ok: true, msg: `Bombardeio atinge um bairro residencial em ${entName(s, data, w.enemy)}. Condenação internacional.`, log: true }; }
  return { ok: true, msg: 'Campanha aérea de quatro semanas contra alvos militares e infraestrutura.', log: true };
}
export function blockade(s, data, w) {
  const f = warFactors(s, data, w);
  if (f.naval < 0.6) return { ok: false, msg: `Superioridade naval insuficiente (${Math.round(f.naval * 100)}% — precisa de 60%).` };
  s.forces.blockades[w.id] = true;
  return { ok: true, msg: `Bloqueio naval contra ${entName(s, data, w.enemy)}: portos fechados e economia estrangulada.`, log: true };
}

// ---------- Conferência de paz ----------
// Províncias que podem ser exigidas: ocupadas ou vizinhas a território ocupado/nosso.
export function peaceCandidates(s, data, w) {
  const mine = new Set([...provincesOf(s, data, PLY), ...w.gained.filter(p => s.world.occ[p] === PLY)]);
  return provincesOf(s, data, w.enemy).filter(p => s.world.occ[p] === PLY || data.geo.prov[p].nb.some(n => mine.has(n)));
}
export function peaceCost(s, data, w, pid) {
  const ePop = (s.world.c[w.enemy]?.pop || 1) * 1e6;
  const occ = s.world.occ[pid] === PLY;
  return Math.round(((data.geo.prov[pid].pop || 0) / ePop * 160 + 4) * (occ ? 0.6 : 1.6));
}
export const peaceBudget = w => Math.max(0, Math.round(w.score * 1.2 + w.enemyExh * 0.4));
export function customPeace(s, data, w, { provs = [], reparations = 0, puppet = false }, ctx) {
  const budget = peaceBudget(w);
  const cost = provs.reduce((a, p) => a + peaceCost(s, data, w, p), 0) + reparations * 3 + (puppet ? 35 : 0);
  if (cost > budget) return { ok: false, msg: `Exigências demais: custam ${cost} e o inimigo aceita até ${budget}.` };
  const E = s.world.c[w.enemy], nm = entName(s, data, w.enemy);
  if (provs.length) transfer(s, data, provs, PLY);
  for (const p of w.gained) if (s.world.occ[p] === PLY && !provs.includes(p)) delete s.world.occ[p];
  for (const p of w.lost) if (s.world.occ[p] === w.enemy) delete s.world.occ[p];
  if (reparations && E) addLoan(s, { lender: PLY, borrower: w.enemy, principal: E.gdp * reparations / 100, rate: 0, weeks: 52, kind: 'reparations' });
  if (puppet && E) { E.puppetOf = PLY; s.partners[w.enemy].rel = 50; s.partners[w.enemy].pact = true; s.partners[w.enemy].trade = true; }
  if (provs.length) s.world.claims.push({ id: 'revanche_' + w.enemy + '_' + day(s), claimant: w.enemy, holder: PLY, provs: [...provs], type: 'revanchist', just: `${nm} exige a devolução das províncias perdidas na guerra.`, strat: 60, dom: 90, risk: 70, status: 'active', src: 'war' });
  s.st.reputation = clamp(s.st.reputation - provs.length * 0.8 - (puppet ? 5 : 0), 0, 100);
  territoryChanged(s); s.flags.wonWar = 1;
  endWar(s, data, w, 'victory', ctx);
  const parts = [provs.length && `anexou ${provs.length} província(s)`, reparations && `impôs reparações de ${reparations}% do PIB`, puppet && 'tornou-o Estado cliente'].filter(Boolean);
  ctx.log(`Conferência de paz com ${nm}: ${s.nation.shortName} ${parts.join(', ') || 'aceitou paz branca'}.`, 'good');
  return { ok: true, msg: 'Tratado assinado.' };
}

function heroCard(s, g) {
  return { id: `dyn_hero_${day(s)}`, dyn: true, cat: 'Forças armadas', title: `${g.name}, o herói da nação`, desc: `As vitórias tornaram ${g.name} mais popular que o próprio governo. Jornais especulam sobre suas ambições políticas.`, context: `Fama ${Math.round(g.fame)} · lealdade ${Math.round(g.loyalty)}. Generais populares e pouco leais aumentam o risco de golpe.`, deadline: 10, default: 2,
    options: [
      { text: 'Promovê-lo a marechal e cobri-lo de honras.', hint: 'Compra lealdade; aumenta a fama.', act: { type: 'general', name: g.name, choice: 'honor' } },
      { text: 'Aposentá-lo com pensão generosa.', hint: 'Elimina a ameaça; militares resmungam.', act: { type: 'general', name: g.name, choice: 'retire' } },
      { text: 'Ignorar.', hint: 'Ele continua crescendo.', act: { type: 'general', name: g.name, choice: 'ignore' } },
    ] };
}
export function generalAct(s, act) {
  const c = s.forces?.corps.find(x => x.gen.name === act.name); if (!c) return '';
  if (act.choice === 'honor') { c.gen.loyalty = clamp(c.gen.loyalty + 30, 0, 100); c.gen.fame = clamp(c.gen.fame + 5, 0, 100); return `${c.gen.name} é promovido a marechal.`; }
  if (act.choice === 'retire') { const old = c.gen.name; c.gen = makeGeneral(s); s.groups.military = clamp(s.groups.military - 5, 0, 100); return `${old} vai para a reserva; ${c.gen.name} assume o ${c.name}.`; }
  c.gen.loyalty = clamp(c.gen.loyalty - 5, 0, 100); return '';
}
