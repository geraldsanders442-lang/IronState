// O mundo vivo: líderes estrangeiros com personalidade e memória, mudanças de regime na IA,
// tensão mundial, votações na ONU, cúpulas de negociação, espionagem, pesquisa tecnológica e crises globais.
import { clamp, chance, rand, pick, random, shuffle } from './util.js';
import { personName, cultureOf, leaderName, genderize } from './names.js';
import { PLY, entOf, relAI, playerNeighbors, aiPower } from './world.js';

const day = s => Math.floor(s.time.min / 1440);
let DATA = null;
export function setWorldData(d) { DATA = d; }

// ---------- Líderes e memória ----------
export const LTRAITS = { rancoroso: 'Nunca esquece uma ofensa.', oportunista: 'Muda de lado conforme o vento.', ideológico: 'Julga você pela ideologia.', pragmático: 'Negocia com qualquer um.', belicoso: 'Gosta de resolver na força.', pacifista: 'Evita conflitos a quase qualquer custo.', vaidoso: 'Adora honrarias e cúpulas.', paranoico: 'Vê conspirações em tudo.' };
export function leaderOf(s, id) {
  const W = s.world; W.leaders ||= {};
  if (!W.leaders[id] && W.c[id]) {
    const lib = entOf(s, DATA, id)?.profile?.liberty ?? 50;
    const title = lib > 60 ? pick(['Presidente', 'Primeiro-ministro', 'Chanceler']) : lib < 30 ? pick(['Presidente', 'General', 'Líder Supremo', 'Rei', 'Emir']) : pick(['Presidente', 'Primeiro-ministro']);
    const e = entOf(s, DATA, id);
    const cult = e?.culture || cultureOf(DATA, e?.origin || e?.secededFrom || id);
    const nm = e?.leaderName && !W.leaderUsed?.[id] ? e.leaderName : leaderName(cult);
    (W.leaderUsed ||= {})[id] = true;
    W.leaders[id] = { name: genderize(`${title} ${nm}`), traits: shuffle(Object.keys(LTRAITS)).slice(0, 2), since: day(s), age: Math.round(rand(45, 75)) };
  }
  return W.leaders[id];
}
export function remember(s, id, text, v) {
  if (!id || id === PLY) return;
  const M = ((s.world.memory ||= {})[id] ||= []);
  const L = leaderOf(s, id);
  const w = v < 0 && L?.traits.includes('rancoroso') ? 1.8 : v > 0 && L?.traits.includes('vaidoso') ? 1.3 : 1;
  M.unshift({ day: day(s), text, v: +(v * w).toFixed(1) });
  if (M.length > 12) M.length = 12;
  const p = s.partners[id]; if (p) p.trust = clamp(p.trust + v * w * 0.4, 0, 100);
}
export const memoryScore = (s, id) => (s.world.memory?.[id] || []).reduce((a, m) => a + m.v * Math.exp(-(day(s) - m.day) / 1500), 0);

// ---------- Mudanças de regime nos outros países ----------
function regimeChanges(s, ctx) {
  const W = s.world, ids = Object.keys(W.c).filter(id => !W.c[id].dep);
  for (const id of shuffle(ids).slice(0, 12)) {
    const c = W.c[id], e = entOf(s, DATA, id); if (!e?.profile) continue;
    const lib = e.profile.liberty ?? 50;
    let kind = null;
    if (lib > 55 && chance(1 / 208)) kind = 'election';
    else if (lib < 45 && c.stab < 35 && chance(0.02)) kind = 'coup';
    else if (c.stab < 22 && chance(0.02)) kind = 'revolution';
    if (!kind) continue;
    const old = leaderOf(s, id), nb = playerNeighbors(s, DATA).has(id);
    const prof = { ...e.profile };
    if (kind === 'election') { prof.liberty = clamp(lib + rand(-6, 6), 30, 98); prof.market = clamp((prof.market ?? 50) + rand(-15, 15), 5, 95); if (chance(0.25)) prof.align = pick(['W', 'WL', 'N', 'EL']); }
    if (kind === 'coup') { prof.liberty = clamp(lib - 25, 3, 40); prof.regime = 'auth'; prof.regimeName = 'Junta militar'; prof.milIntensity = (prof.milIntensity ?? 1) + 0.4; c.stab = clamp(c.stab + 15, 0, 100); }
    if (kind === 'revolution') { const up = chance(0.5); prof.liberty = clamp(lib + (up ? 30 : -20), 3, 95); prof.regimeName = up ? 'Governo de transição democrática' : 'Governo revolucionário'; prof.regime = up ? 'dem' : 'auth'; c.stab = 40; }
    W.ents ||= {}; W.ents[id] = { ...e, profile: prof };
    W.leaders[id] = null; const L = leaderOf(s, id);
    const nm = e.name;
    const txt = kind === 'election' ? `Eleições em ${nm}: ${L.name} vence e substitui ${old.name}.` : kind === 'coup' ? `GOLPE em ${nm}: militares derrubam ${old.name}; ${L.name} assume.` : `REVOLUÇÃO em ${nm}: ${old.name} cai; ${L.name} lidera o novo governo.`;
    ctx.news(txt, kind === 'election' ? 'info' : 'war');
    (W.regimeLog ||= []).unshift({ day: day(s), id, kind, text: txt }); if (W.regimeLog.length > 40) W.regimeLog.length = 40;
    const p = s.partners[id];
    if (p && kind !== 'election') { p.rel = clamp(p.rel * 0.5 + rand(-15, 15), -100, 100); p.pact = false; }
    if (nb && kind !== 'election') ctx.card?.(neighborRegimeCard(s, id, kind, L));
  }
}
function neighborRegimeCard(s, id, kind, L) {
  const nm = entOf(s, DATA, id).name;
  return { id: `dyn_regime_${id}_${day(s)}`, dyn: true, cat: 'Vizinhança', title: kind === 'coup' ? `Golpe em ${nm}` : `Revolução em ${nm}`, desc: `${L.name} tomou o poder em ${nm}, nosso vizinho. O novo governo pede reconhecimento.`, context: `Traços do novo líder: ${L.traits.join(', ')}.`, deadline: 14, default: 2,
    options: [
      { text: 'Reconhecer o novo governo.', hint: 'Relações começam bem.', rel: { [id]: 15 }, now: { reputation: -1 } },
      { text: 'Condenar e apoiar a oposição deposta.', hint: 'Inimizade; influência futura.', rel: { [id]: -20 }, act: { type: 'covertBoost', id, party: 15 } },
      { text: 'Aguardar.', hint: 'Neutro.' },
    ] };
}

// ---------- Tensão mundial ----------
function worldTension(s, ctx) {
  const W = s.world;
  const aiw = W.wars.filter(w => w.active).length, myw = s.wars.filter(w => w.active).length;
  const nukes = Object.values(W.c).filter(c => c.nukeProg > 0).length;
  const sanc = Object.keys(W.sanc || {}).length;
  const gp = Object.values(W.c).filter(c => c.gdp > 5000).map(c => c.id);
  let gpHost = 0; for (let i = 0; i < gp.length; i++) for (let j = i + 1; j < gp.length; j++) if (relAI(s, DATA, gp[i], gp[j]) < -40) gpHost++;
  const target = clamp(15 + aiw * 8 + myw * 10 + nukes * 6 + sanc * 0.8 + gpHost * 4 + (s.nukeCrisis ? 25 : 0) + (W.crisis ? 8 : 0), 0, 100);
  W.tension = clamp((W.tension ?? target) + (target - (W.tension ?? target)) * 0.1, 0, 100);
  (W.tensionHist ||= []).push([day(s), Math.round(W.tension)]); if (W.tensionHist.length > 156) W.tensionHist.shift();
  if (W.tension > 80 && !W.tensionWarned) { W.tensionWarned = true; ctx.news('Analistas falam no maior risco de guerra mundial em décadas.', 'war'); }
  if (W.tension < 60) W.tensionWarned = false;
}

// ---------- Crises globais ----------
export const CRISES = {
  pandemic: { name: 'Pandemia global', weeks: 16, mods: { growth: -1.8, health: -4, g_workers: -2 }, news: 'A OMS declara pandemia: um novo vírus se espalha por todos os continentes.' },
  crash: { name: 'Crise financeira global', weeks: 20, mods: { growth: -2.5, unemployment: 2, creditLimit: -0.1 }, news: 'Colapso de grandes bancos derruba bolsas no mundo inteiro.' },
  climate: { name: 'Colapso climático', weeks: 24, mods: { s_food: -1.5, hunger: 1.5, migration: 1 }, news: 'Ondas de calor e secas recordes destroem safras em vários continentes.' },
  gulf: { name: 'Guerra no Golfo', weeks: 12, mods: { inflation: 2.5, growth: -0.8 }, news: 'Conflito no Golfo Pérsico fecha o Estreito de Ormuz.', oil: 60 },
  cyber: { name: 'Ciberataque global', weeks: 6, mods: { growth: -0.6, efficiency: -4 }, news: 'Um vírus de computador paralisa bancos, hospitais e portos no mundo todo.' },
};
function globalCrises(s, ctx) {
  const W = s.world;
  if (W.crisis) {
    W.crisis.weeks--;
    if (W.crisis.weeks <= 0) { ctx.news(`${CRISES[W.crisis.id].name}: o pior já passou.`, 'good'); delete s.flags['gc_' + W.crisis.id]; s.longMods = s.longMods.filter(m => m.id !== 'gcrisis'); W.crisis = null; }
    return;
  }
  if (!chance(0.004 + (W.tension || 0) / 20000)) return;
  const id = pick(Object.keys(CRISES)), C = CRISES[id];
  W.crisis = { id, weeks: C.weeks, start: day(s) };
  s.flags['gc_' + id] = 1;
  for (const k in C.mods) s.longMods.push({ k, v: C.mods[k], d: C.weeks * 7, left: C.weeks * 7, src: C.name, id: 'gcrisis' });
  if (C.oil && s.markets) s.markets.prices.oil = Math.min(300, s.markets.prices.oil + C.oil);
  for (const c of Object.values(W.c)) c.gdp *= 1 + (C.mods.growth || 0) / 100;
  ctx.news(C.news, 'war');
  ctx.notify?.(C.name, C.news + ' O mundo inteiro sofre os efeitos por semanas.');
}

// ---------- ONU ----------
function unVote(s, ctx) {
  const W = s.world;
  if (!s.orgs.UN || (W.unCd || 0) > day(s) || !chance(0.12)) return;
  const agg = W.wars.filter(w => w.active).map(w => w.a[0]).filter(id => W.c[id]);
  const kinds = [];
  if (agg.length) kinds.push('condemn');
  if (Object.keys(W.sanc || {}).length) kinds.push('sanction');
  kinds.push('climate', 'refugees');
  const kind = pick(kinds);
  const target = kind === 'condemn' ? pick(agg) : kind === 'sanction' ? Object.keys(W.sanc)[0].split('>')[1] : null;
  if (kind !== 'climate' && kind !== 'refugees' && !target) return;
  W.unCd = day(s) + 75;
  const tn = target ? entOf(s, DATA, target)?.name : '';
  const T = { condemn: [`Resolução condenando ${tn}`, `A Assembleia Geral vota uma resolução que condena a agressão de ${tn} e pede retirada imediata.`], sanction: [`Sanções da ONU contra ${tn}`, `O Conselho de Segurança propõe sanções obrigatórias contra ${tn}.`], climate: ['Pacto climático global', 'Uma resolução propõe metas obrigatórias de redução de emissões, com punições a quem não cumprir.'], refugees: ['Pacto mundial sobre refugiados', 'A ONU propõe dividir entre todos os países o acolhimento de refugiados de guerras e catástrofes.'] }[kind];
  ctx.card({ id: `dyn_un_${kind}_${day(s)}`, dyn: true, cat: 'ONU', title: T[0], desc: T[1], context: 'O voto de cada país é registrado — e lembrado.', deadline: 14, default: 2,
    options: [
      { text: 'Votar a favor.', hint: target ? `${tn} se ressente; os autores agradecem.` : 'Compromissos e prestígio.', act: { type: 'unvote', kind, target, vote: 'yes' } },
      { text: 'Votar contra.', hint: target ? `${tn} agradece; o Ocidente se irrita.` : 'Liberdade de ação.', act: { type: 'unvote', kind, target, vote: 'no' } },
      { text: 'Abster-se.', hint: 'Sem compromissos.', act: { type: 'unvote', kind, target, vote: 'abstain' } },
    ] });
}
export function unVoteAct(s, act) {
  const W = s.world, ids = Object.keys(W.c).filter(id => !W.c[id].dep && id !== act.target);
  let yes = 0, no = 0, abs = 0;
  for (const id of ids) {
    const al = entOf(s, DATA, id)?.profile?.align;
    const r = act.target ? relAI(s, DATA, id, act.target) : 0;
    const v = act.target ? (r > 30 ? 'no' : r < -10 || al === 'W' ? 'yes' : chance(0.5) ? 'abstain' : 'yes') : (chance(0.7) ? 'yes' : chance(0.5) ? 'no' : 'abstain');
    if (v === 'yes') yes++; else if (v === 'no') no++; else abs++;
  }
  if (act.vote === 'yes') yes++; else if (act.vote === 'no') no++; else abs++;
  const pass = yes > no;
  (W.unLog ||= []).unshift({ day: day(s), kind: act.kind, target: act.target, vote: act.vote, yes, no, abs, pass }); if (W.unLog.length > 30) W.unLog.length = 30;
  if (act.target) {
    if (act.vote === 'yes') { remember(s, act.target, 'Votou contra nós na ONU', -6); if (s.partners[act.target]) s.partners[act.target].rel -= 8; }
    if (act.vote === 'no') { remember(s, act.target, 'Nos defendeu na ONU', 6); if (s.partners[act.target]) s.partners[act.target].rel += 8; for (const id in s.partners) if (['W', 'WL'].includes(entOf(s, DATA, id)?.profile?.align)) s.partners[id].rel -= 2; }
    if (pass && act.kind === 'sanction' && W.c[act.target]) for (const id of ids.slice(0, 40)) (W.sanc ||= {})[`${id}>${act.target}`] = day(s);
  } else if (act.vote === 'yes') { s.st.reputation = clamp(s.st.reputation + 2, 0, 100); if (act.kind === 'climate') s.longMods.push({ k: 'pollution', v: -2, d: 0, left: 0, src: 'Pacto climático' }, { k: 'growth', v: -0.15, d: 730, left: 730, src: 'Pacto climático' }); if (act.kind === 'refugees') s.longMods.push({ k: 'migration', v: 1, d: 730, left: 730, src: 'Pacto de refugiados' }); }
  return `Votação na ONU: ${yes} a favor, ${no} contra, ${abs} abstenções — ${pass ? 'aprovada' : 'rejeitada'}.`;
}

// ---------- Cúpula de negociação ----------
export const SUMMIT_ITEMS = {
  trade: { name: 'Acordo comercial', v: 10 }, loan: { name: 'Empréstimo de 0,5% do nosso PIB', v: 14 }, arms: { name: 'Venda de armas a preço de custo', v: 12 },
  base: { name: 'Acesso a uma base militar', v: 16 }, un: { name: 'Apoio em votações na ONU', v: 6 }, recognize: { name: 'Reconhecer as reivindicações deles', v: 18 },
  nap: { name: 'Pacto de não agressão', v: 8 }, pact: { name: 'Tratado de defesa mútua', v: 20 }, liftsanc: { name: 'Fim das sanções', v: 15 }, bloc: { name: 'Adesão ao nosso bloco', v: 14 }, money: { name: 'Pagamento de 0,3% do nosso PIB', v: 10 },
};
export function summitEval(s, id, offer, ask) {
  const p = s.partners[id], L = leaderOf(s, id), e = entOf(s, DATA, id);
  const val = list => list.reduce((a, k) => a + (SUMMIT_ITEMS[k]?.v || 0), 0);
  let give = val(offer), take = val(ask);
  if (L.traits.includes('pragmático')) give *= 1.15;
  if (L.traits.includes('vaidoso')) give += 4;
  if (L.traits.includes('paranoico') && ask.includes('pact')) take += 10;
  if (L.traits.includes('belicoso') && ask.includes('nap')) take += 8;
  if (ask.includes('pact') && p.rel < 30) take += 25;
  if (ask.includes('liftsanc') && !p.sanctionsBy) take = take - 15;
  const mood = p.rel / 4 + p.trust / 10 + memoryScore(s, id) * 0.5 + (L.traits.includes('ideológico') ? (e.profile?.align === (s.nation.ideology?.axes?.align > 20 ? 'W' : s.nation.ideology?.axes?.align < -20 ? 'E' : 'N') ? 8 : -8) : 0);
  const score = give - take + mood;
  return { score: Math.round(score), accept: score >= 0, reply: score >= 10 ? 'Proposta generosa. Aceitamos com prazer.' : score >= 0 ? 'Aceitável. Temos um acordo.' : score > -12 ? 'Quase lá. Ofereça um pouco mais.' : 'Inaceitável.' };
}
export function summitApply(s, id, offer, ask) {
  const p = s.partners[id], g = s.econ.gdp, c = s.world.c[id];
  for (const k of offer) {
    if (k === 'trade' || k === 'bloc') p.trade = true;
    if (k === 'loan') { s.econ.treasury -= g * 0.005; }
    if (k === 'money') s.econ.treasury -= g * 0.003;
    if (k === 'arms') { s.st.equipment = clamp(s.st.equipment - 2, 0, 100); if (c) c.equip = clamp(c.equip + 5, 0, 100); }
    if (k === 'base') { s.st.reputation = clamp(s.st.reputation - 1, 0, 100); s.groups.military = clamp(s.groups.military - 2, 0, 100); }
    if (k === 'recognize') for (const cl of s.world.claims) if (cl.claimant === id && cl.holder !== PLY) cl.recognizedBy = PLY;
  }
  for (const k of ask) {
    if (k === 'trade') p.trade = true;
    if (k === 'nap') p.nap = true;
    if (k === 'pact') p.pact = true;
    if (k === 'liftsanc') p.sanctionsBy = false;
    if (k === 'loan') s.econ.treasury += g * 0.005;
    if (k === 'money') s.econ.treasury += g * 0.003;
    if (k === 'arms') s.st.equipment = clamp(s.st.equipment + 4, 0, 100);
    if (k === 'bloc') { const b = s.world.blocs.find(x => x.members[0] === PLY); if (b && !b.members.includes(id)) b.members.push(id); }
  }
  p.rel = clamp(p.rel + 8, -100, 100);
  remember(s, id, 'Fechamos um acordo de cúpula', 5);
  (s.counters.summitCd ||= {})[id] = day(s) + 120;
}

// ---------- Espionagem ----------
export const SPY_OPS = {
  infiltrate: { name: 'Infiltrar agentes', cost: 0.0008, desc: 'Monta uma rede de espiões. Necessária para as demais operações.' },
  steal: { name: 'Roubar tecnologia', cost: 0.0005, desc: 'Pontos de pesquisa e tecnologia; vale mais contra países avançados.', need: 20 },
  sabotage: { name: 'Sabotar a indústria', cost: 0.0006, desc: 'Reduz o PIB e a prontidão do alvo.', need: 30 },
  report: { name: 'Relatório de inteligência', cost: 0.0002, desc: 'Revela os planos do alvo (agressividade, programa nuclear, forças).', need: 10 },
  media: { name: 'Comprar jornalistas', cost: 0.0004, desc: 'Fortalece o partido afim no alvo.', need: 15 },
};
export function spyAct(s, id, op) {
  const O = SPY_OPS[op], g = s.econ.gdp, c = s.world.c[id], net = ((s.spies ||= {})[id] ||= { agents: 0, burned: 0 });
  if (!c) return { ok: false, msg: '?' };
  if (O.need && net.agents < O.need) return { ok: false, msg: `Rede de espiões fraca (${Math.round(net.agents)}/${O.need}). Infiltre mais agentes.` };
  if (s.econ.treasury < g * O.cost) return { ok: false, msg: 'Tesouro insuficiente.' };
  s.econ.treasury -= g * O.cost;
  const nm = entOf(s, DATA, id).name;
  const risk = clamp(0.06 + (c.intel || 30) / 400 - s.st.intel / 500 + (op === 'sabotage' ? 0.08 : 0), 0.02, 0.4);
  if (op !== 'infiltrate' && chance(risk)) {
    net.agents = Math.max(0, net.agents - 25); net.burned++;
    s.partners[id].rel = clamp(s.partners[id].rel - 15, -100, 100); s.st.reputation = clamp(s.st.reputation - 3, 0, 100);
    remember(s, id, 'Pegou nossos espiões', -10);
    return { ok: false, msg: `Agentes presos em ${nm}! Escândalo diplomático.`, log: true };
  }
  if (op === 'infiltrate') { net.agents = clamp(net.agents + 15 + s.st.intel / 10, 0, 100); return { ok: true, msg: `Rede de espionagem em ${nm}: ${Math.round(net.agents)}/100.` }; }
  if (op === 'steal') { const pts = 6 + Math.max(0, (c.gdp / Math.max(0.1, c.pop) - s.econ.gdp / Math.max(0.1, s.econ.pop))) / 4; (s.tech ||= { pts: 0, done: [], cur: null }).pts += pts; s.st.tech = clamp(s.st.tech + 0.8, 0, 100); return { ok: true, msg: `Projetos secretos de ${nm} copiados: +${Math.round(pts)} pontos de pesquisa.`, log: true }; }
  if (op === 'sabotage') { c.gdp *= 0.99; c.ready = clamp(c.ready - 6, 0, 100); return { ok: true, msg: `Explosão em complexo industrial de ${nm}. Ninguém assumiu a autoria.`, log: true }; }
  if (op === 'media') { const o = ((s.world.covert ||= {})[id] ||= { party: 0, militia: 0, arms: 0, found: 0 }); o.party = clamp(o.party + 10, 0, 100); return { ok: true, msg: `Colunistas de ${nm} passam a elogiar ideias parecidas com as suas.` }; }
  if (op === 'report') { net.report = { day: day(s), aggr: Math.round(c.aggr || 0), nuke: c.nuclear ? 'possui armas nucleares' : c.nukeProg > 0 ? `programa secreto em ${Math.round(c.nukeProg)}%` : 'sem programa nuclear', power: aiPower(c).toFixed(1), plans: (c.aggr || 0) > 50 ? 'preparando ação contra vizinhos' : 'postura defensiva' }; return { ok: true, msg: `Relatório: agressividade ${net.report.aggr}, ${net.report.nuke}, ${net.report.plans}.` }; }
  return { ok: false, msg: '?' };
}

// ---------- Pesquisa ----------
export const TECHS = [
  { id: 'automation', era: 1, name: 'Automação industrial', cost: 60, mods: { productivity: 4, unemployment: 0.8 } },
  { id: 'evs', era: 1, name: 'Carros elétricos', cost: 50, mods: { pollution: -3, s_energy: 0.8 } },
  { id: 'desal', era: 1, name: 'Dessalinização em massa', cost: 45, mods: { s_food: 1, health: 1 } },
  { id: 'drones', era: 1, name: 'Drones militares', cost: 55, mods: { equipment: 5, readiness: 2 } },
  { id: 'gov_ai', era: 1, name: 'Governo digital', cost: 50, mods: { efficiency: 5, corruption: -3 } },
  { id: 'vertfarm', era: 2, name: 'Agricultura vertical', cost: 90, mods: { s_food: 2, pollution: -1 }, req: ['desal'] },
  { id: 'genmed', era: 2, name: 'Medicina genética', cost: 110, mods: { health: 6, qol: 2 } },
  { id: 'net6g', era: 2, name: 'Redes 6G', cost: 95, mods: { growth: 0.4, tech: 4 }, req: ['gov_ai'] },
  { id: 'hyper', era: 2, name: 'Mísseis hipersônicos', cost: 120, mods: { projection: 6, defense: 4 }, req: ['drones'] },
  { id: 'satmil', era: 2, name: 'Satélites militares', cost: 100, mods: { intel: 6, defense: 2 } },
  { id: 'smartgrid', era: 2, name: 'Rede elétrica inteligente', cost: 85, mods: { s_energy: 1.5, efficiency: 2 }, req: ['evs'] },
  { id: 'quantum', era: 3, name: 'Computação quântica', cost: 180, mods: { tech: 8, intel: 5, growth: 0.5 }, req: ['net6g'] },
  { id: 'abm', era: 3, name: 'Escudo antimísseis', cost: 170, mods: { defense: 10 }, req: ['hyper', 'satmil'] },
  { id: 'exo', era: 3, name: 'Exoesqueletos de combate', cost: 150, mods: { readiness: 6, equipment: 6 }, req: ['drones'] },
  { id: 'agi', era: 3, name: 'Inteligência artificial geral', cost: 240, mods: { productivity: 10, unemployment: 2, growth: 1 }, req: ['automation', 'quantum'] },
  { id: 'fusion', era: 3, name: 'Energia de fusão', cost: 260, mods: { s_energy: 4, pollution: -6, growth: 0.6 }, req: ['smartgrid'] },
];
export const techById = Object.fromEntries(TECHS.map(t => [t.id, t]));
export const ERAS = { 1: 'Era digital', 2: 'Era das redes', 3: 'Era quântica' };
export function techAvailable(s, t) { const T = s.tech; return !T.done.includes(t.id) && (t.req || []).every(r => T.done.includes(r)); }
export function setResearch(s, id) { const t = techById[id]; if (!t || !techAvailable(s, t)) return { ok: false, msg: 'Indisponível.' }; s.tech.cur = id; return { ok: true, msg: `Pesquisando: ${t.name}.` }; }
export function era(s) { const d = s.tech?.done || []; return d.some(id => techById[id]?.era === 3) ? 3 : d.filter(id => techById[id]?.era === 2).length >= 2 ? 2 : 1; }
function research(s, ctx) {
  const T = (s.tech ||= { pts: 0, done: [], cur: null });
  const uni = Object.values(s.buildings || {}).flat().filter(b => b.active && (b.type === 'university' || b.type === 'techpark')).length;
  T.rate = +(0.6 + s.st.tech / 40 + s.st.education / 60 + uni * 0.5).toFixed(2);
  T.pts += T.rate;
  if (!T.cur) { const nx = TECHS.find(t => techAvailable(s, t)); if (nx) T.cur = nx.id; }
  const t = techById[T.cur];
  if (t && T.pts >= t.cost) {
    T.pts -= t.cost; T.done.push(t.id); T.cur = null;
    for (const k in t.mods) s.longMods.push({ k, v: t.mods[k], d: 0, left: 0, src: 'Tecnologia: ' + t.name, id: 'tech_' + t.id });
    ctx.news(`Avanço científico: ${t.name} entra em uso no país.`, 'good');
  }
}

export function weeklyWorldLife(s, data, ctx) {
  DATA = data;
  for (const id in s.world.c) leaderOf(s, id);
  regimeChanges(s, ctx);
  worldTension(s, ctx);
  globalCrises(s, ctx);
  unVote(s, ctx);
  if (!s.spectator) research(s, ctx);
  for (const id in s.spies || {}) s.spies[id].agents = Math.max(0, s.spies[id].agents - 0.2);
  // A memória pesa na relação: ressentimentos e gratidão se acumulam devagar.
  for (const id in s.world.memory || {}) { const p = s.partners[id]; if (p) p.rel = clamp(p.rel + clamp(memoryScore(s, id) * 0.02, -0.4, 0.4), -100, 100); }
}
