// Cenários mundiais: o mundo inteiro vive uma história alternativa (mundo socialista, imperialista, liberal,
// teocrático, de uniões continentais). Reescreve os perfis dos países antes da partida, cria alianças temáticas,
// ajusta relações e dispara eventos próprios.
import { clamp, chance, pick, random } from './util.js';
import { hash, PLY, entOf, aiPower, shiftRelAI, relAI, setOwner, provincesOf, territoryChanged } from './world.js';
import { startAiWar } from './newstates.js';
import { customData, customWscn, initCustomRoles } from './customworld.js';

const day = s => Math.floor(s.time.min / 1440);
const pickOf = (h, variants) => { let acc = 0; for (const v of variants) { acc += v.p; if (h < acc) return v; } return variants.at(-1); };

function matches(m, id, e, h) {
  const p = e.profile || {};
  if (m.ids && !m.ids.includes(id)) return false;
  if (m.notIds && m.notIds.includes(id)) return false;
  if (m.regions && !(e.regions || []).some(r => m.regions.includes(r))) return false;
  if (m.align && !m.align.includes(p.align)) return false;
  if (m.regime && !m.regime.includes(p.regime)) return false;
  if (m.cat && !m.cat.includes(e.cat)) return false;
  if (m.minLiberty != null && (p.liberty ?? 50) < m.minLiberty) return false;
  if (m.maxLiberty != null && (p.liberty ?? 50) > m.maxLiberty) return false;
  if (m.big && !(e.gdp > m.big)) return false;
  if (m.p != null && h >= m.p) return false;
  return true;
}
function applySet(p, set) {
  const q = { ...p, ...(set.profile || {}) };
  if (set.libMax != null) q.liberty = Math.min(q.liberty ?? 50, set.libMax);
  if (set.libMin != null) q.liberty = Math.max(q.liberty ?? 50, set.libMin);
  if (set.libMul != null) q.liberty = Math.round((q.liberty ?? 50) * set.libMul);
  if (set.libAdd != null) q.liberty = clamp(Math.round((q.liberty ?? 50) + set.libAdd), 0, 100);
  if (set.marketMax != null) q.market = Math.min(q.market ?? 50, set.marketMax);
  if (set.marketMin != null) q.market = Math.max(q.market ?? 50, set.marketMin);
  if (set.milMul != null) q.milIntensity = clamp(+((q.milIntensity ?? 0.6) * set.milMul).toFixed(2), 0.1, 2.6);
  if (set.relMul != null) q.religiosity = Math.round((q.religiosity ?? 30) * set.relMul);
  if (set.relMin != null) q.religiosity = Math.max(q.religiosity ?? 30, set.relMin);
  return q;
}

// Bandeira socialista simples (editor do jogo): campo vermelho com símbolos dourados e uma cor regional.
const SEC = { europe: '#ffffff', eastern_europe: '#0057b7', balkans: '#ffffff', caucasus: '#ffd700', central_asia: '#00afca', middle_east: '#111111', north_africa: '#111111', sub_saharan_africa: '#1eb53a', south_asia: '#ff9933', east_asia: '#ffd700', southeast_asia: '#ffd700', south_america: '#0b3d91', central_america: '#0b3d91', caribbean: '#00a3dd', north_america: '#0b3d91', oceania: '#00247d' };
export function socialistFlag(id, e) {
  const h = hash(id + 'sf'), R = '#c8102e', G = '#ffd700', K = '#111111', W = '#ffffff';
  const reg0 = e.regions?.[0], S = SEC[reg0] || W;
  const star = (x, y, s, c = G) => ({ type: 'star', color: c, x, y, s }), hs = (x, y, s) => ({ type: 'hammersickle', color: G, x, y, s }), gear = (x, y, s) => ({ type: 'gear', color: G, x, y, s });
  // Bandeiras com desenho próprio (inspiradas nas históricas, sem copiá-las ao pé da letra).
  const OWN = {
    ALB: { layout: 'solid', colors: [R, R, R], emblems: [{ type: 'n_albania', color: K, x: 0.5, y: 0.55, s: 0.7 }, star(0.5, 0.15, 0.18)] }, // águia albanesa (Commons)
    TUR: { layout: 'hborder', colors: [R, W, W], emblems: [{ type: 'crescent', color: G, x: 0.4, y: 0.5, s: 0.46 }, star(0.6, 0.5, 0.2)] },
    EGY: { layout: 'h3', colors: [R, W, K], emblems: [{ type: 'a_egypt', alt: 'star', color: G, x: 0.5, y: 0.5, s: 0.4, orig: false }] },
    ETH: { layout: 'h3', colors: [R, G, R], emblems: [star(0.5, 0.5, 0.34, '#c8102e'), { type: 'circle', color: '#1b6b2f', x: 0.5, y: 0.5, s: 0.4 }, star(0.5, 0.5, 0.26)] },
    ZAF: { layout: 'chevron', colors: [R, '#007749', '#ffb612'], emblems: [star(0.17, 0.5, 0.2)] },
    DZA: { layout: 'v2', colors: [W, R, R], emblems: [{ type: 'crescent', color: R, x: 0.5, y: 0.5, s: 0.3 }, star(0.5, 0.5, 0.14)] },
    LBY: { layout: 'h3', colors: [R, K, '#007a3d'], emblems: [{ type: 'crescent', color: W, x: 0.5, y: 0.5, s: 0.3 }, star(0.55, 0.5, 0.12, W)] },
    AGO: { layout: 'h2', colors: [R, K, K], emblems: [hs(0.5, 0.5, 0.36)] },
    MOZ: { layout: 'h3', colors: ['#007168', G, R], emblems: [star(0.15, 0.5, 0.26, R), { type: 'rifles', color: K, x: 0.15, y: 0.5, s: 0.2 }] },
  };
  if (OWN[id]) return structuredClone(OWN[id]);
  const africa = ['sub_saharan_africa', 'north_africa'].includes(reg0) || (e.regions || []).some(r => /africa/.test(r));
  if (africa) {
    // Variações pan-africanas: verde, ouro e vermelho (ou cores regionais), com estrelas e emblemas.
    const GR = '#1eb53a', RR = R, Y = '#fcd116', BK = K;
    const kinds = [
      { layout: 'h3', colors: [GR, Y, RR], emblems: [star(0.5, 0.5, 0.3, BK)] },
      { layout: 'h3', colors: [RR, Y, GR], emblems: [star(0.5, 0.5, 0.3, BK)] },
      { layout: 'v3', colors: [GR, Y, RR], emblems: [star(0.5, 0.5, 0.3, BK)] },
      { layout: 'triangle', colors: [BK, RR, GR, Y], emblems: [star(0.12, 0.5, 0.18)] },
      { layout: 'diag2', colors: [RR, GR, GR], emblems: [star(0.2, 0.28, 0.22), hs(0.76, 0.7, 0.2)] },
      { layout: 'canton', colors: [GR, RR, GR], emblems: [star(0.17, 0.25, 0.24)] },
      { layout: 'chevron', colors: [RR, BK, Y], emblems: [star(0.15, 0.5, 0.22)] },
      { layout: 'h2', colors: [RR, GR, GR], emblems: [star(0.17, 0.25, 0.26), { type: 'gear', color: Y, x: 0.5, y: 0.5, s: 0.3 }] },
    ];
    return structuredClone(kinds[Math.floor(h * kinds.length)]);
  }
  const kinds = [
    { layout: 'solid', colors: [R, R, R], emblems: [star(0.17, 0.25, 0.28), hs(0.17, 0.55, 0.22)] },
    { layout: 'h2', colors: [R, S, S], emblems: [star(0.17, 0.25, 0.26)] },
    { layout: 'h3', colors: [R, S, R], emblems: [star(0.5, 0.5, 0.26)] },
    { layout: 'diag', colors: [R, S, S], emblems: [star(0.28, 0.28, 0.24)] },
    { layout: 'v2', colors: [R, S, S], emblems: [star(0.17, 0.5, 0.3)] },
    { layout: 'solid', colors: [R, R, R], emblems: [hs(0.5, 0.5, 0.4)] },
    { layout: 'canton', colors: [R, S, R], emblems: [star(0.17, 0.25, 0.24)] },
    { layout: 'solid', colors: [R, R, R], emblems: [gear(0.5, 0.5, 0.36), star(0.5, 0.5, 0.2)] },
  ];
  return structuredClone(kinds[Math.floor(h * kinds.length)]);
}

// Dados do mundo-base com os perfis reescritos pelo cenário mundial.
// Cenário mundial (opcional) + mundo customizado (opcional) combinados: o customizado fratura países sobre o mundo do cenário.
export function worldData(base, id, custom) {
  const sid = id && id !== 'custom' ? id : null;
  const d = sid ? scenarioData(base, sid) : base;
  if (custom) { const cd = customData(d, custom); return { ...cd, wscn: d.wscn ? { ...d.wscn, customDef: custom } : customWscn(custom) }; }
  return d;
}
function scenarioData(base, id) {
  const W = id && (base.worldScenarios || []).find(x => x.id === id);
  if (!W) return base;
  const reg = { ...base.reg };
  for (const rid in base.reg) {
    const e = base.reg[rid];
    if (!e.profile || e.cat === 'lease' || e.cat === 'disputed_area') continue;
    const h = hash(rid + W.id), h2 = hash(rid + W.id + 'v');
    let set = null;
    for (const rule of W.rules || []) {
      if (!matches(rule.match || {}, rid, e, h)) continue;
      set = rule.variants ? pickOf(h2, rule.variants) : rule.set;
      break;
    }
    const ex = W.entities?.[rid];
    if (!set && !ex) continue;
    let prof = set ? applySet(e.profile, set) : { ...e.profile };
    if (ex?.profile) prof = applySet(prof, { profile: ex.profile });
    const r = { ...e, profile: prof, wscn: W.id };
    if (ex?.name) { r.name = ex.name; r.nameEn = ex.nameEn || ex.name; }
    if (ex?.formal) r.formal = ex.formal;
    if (ex?.flag) r.flag = ex.flag;
    else if (set?.flag) r.flag = set.flag;
    else if (set?.socFlag) r.flag = socialistFlag(rid, e);
    reg[rid] = r;
  }
  return { ...base, reg, wscn: W };
}

// Chamado depois de initWorld: alianças temáticas e relações entre as IAs.
// Fronteiras redesenhadas: impérios absorvem países inteiros (annex) e países podem ser repartidos (partition).
function redrawBorders(s, data, W) {
  const world = s.world, P = data.geo.prov;
  const give = (pid, to) => { if (world.owner[pid] === PLY || (world.owner[pid] == null ? P[pid].a3 : world.owner[pid]) === PLY) return; setOwner(s, data, pid, to); };
  const merge = (from, to) => { const a = world.c[from], b = world.c[to]; if (a && b && !a.dep) { b.pop += a.pop; b.gdp += a.gdp; b.troops += a.troops * 0.5; } };
  const dropped = new Set();
  for (const [emp, list] of Object.entries(W.annex || {})) {
    if (!world.c[emp]) continue;
    for (const id of list) {
      if (id === emp || !data.geo.byCountry[id]) continue;
      for (const pid of data.geo.byCountry[id].slice()) give(pid, emp);
      if (world.c[id]) { merge(id, emp); dropped.add(id); }
    }
  }
  for (const [from, rule] of Object.entries(W.partition || {})) {
    const byName = {}; for (const [to, names] of Object.entries(rule)) if (Array.isArray(names)) for (const n of names) byName[n] = to;
    for (const pid of (data.geo.byCountry[from] || []).slice()) give(pid, world.c[byName[P[pid].n] || rule.default] ? (byName[P[pid].n] || rule.default) : rule.default);
    if (world.c[from]) dropped.add(from);
  }
  for (const id of dropped) { if (provincesOf(s, data, id).length) continue; delete world.c[id]; delete s.partners[id]; }
  for (const o in world.orgs) { world.orgs[o].members = world.orgs[o].members.filter(m => world.c[m] || m === PLY); world.orgs[o].suspended = world.orgs[o].suspended.filter(m => world.c[m]); }
  world.claims = world.claims.filter(c => (world.c[c.claimant] || c.claimant === PLY) && (world.c[c.holder] || c.holder === PLY));
  territoryChanged(s);
}

export function initWorldScenario(s, data) {
  const W = data.wscn; if (!W) return;
  const world = s.world;
  world.wscn = W.id; world.alliances ||= [];
  if (W.customDef) initCustomRoles(s, data, W.customDef);
  if (W.annex || W.partition) redrawBorders(s, data, W);
  const ids = Object.keys(world.c).filter(i => !world.c[i].dep);
  for (const a of W.alliances || []) {
    const members = (a.members || []).filter(m => world.c[m] && !world.c[m].dep && !world.alliances.some(x => x.members.includes(m)));
    if (members.length < 2) continue;
    world.alliances.push({ id: 'ws' + world.alliances.length, name: a.name, members, leader: a.leader && members.includes(a.leader) ? a.leader : members[0], since: 0, theme: W.id });
  }
  // Afinidades entre vizinhos e entre as grandes potências conforme o alinhamento do cenário.
  const top = ids.sort((x, y) => aiPower(world.c[y]) - aiPower(world.c[x])).slice(0, 36);
  const pairs = new Set();
  for (const a of top) { for (const b of top) if (a < b) pairs.add(a + '|' + b); for (const b of entOf(s, data, a)?.nb || []) if (world.c[b] && !world.c[b].dep && b !== PLY) pairs.add(a < b ? a + '|' + b : b + '|' + a); }
  const B = W.bloc || {};
  for (const k of pairs) {
    const [a, b] = k.split('|'), pa = entOf(s, data, a)?.profile, pb = entOf(s, data, b)?.profile;
    if (!pa || !pb) continue;
    const same = pa.align === pb.align || (pa.align?.[0] && pa.align[0] === pb.align?.[0]);
    const d = same ? (B.same ?? 0) : (B.diff ?? 0);
    if (d) shiftRelAI(s, a, b, d);
  }
  for (const al of world.alliances) if (al.theme === W.id) for (const a of al.members) for (const b of al.members) if (a < b) shiftRelAI(s, a, b, 20);
}

// Postura do mundo com o jogador: ajustada no início (initWorld chama isto por país).
export function hostilityShift(s, mode, affin) {
  if (mode === 'friendly') return 12;
  if (mode === 'hostile') return -10 - (affin < 0.3 ? 14 : 0);
  return 0;
}

// ---------- Dinâmica própria de cada cenário ----------
const DYN = {
  red_world(s, data, ctx) {
    if (chance(0.006)) { // cisma entre dois gigantes socialistas
      const big = Object.values(s.world.c).filter(c => !c.dep && entOf(s, data, c.id)?.profile?.align === 'E').sort((a, b) => aiPower(b) - aiPower(a)).slice(0, 4);
      if (big.length >= 2) { const [a, b] = [pick(big), pick(big)]; if (a !== b) { shiftRelAI(s, a.id, b.id, -45); ctx.news(`Cisma no campo socialista: ${nm(s, data, a.id)} e ${nm(s, data, b.id)} trocam acusações de "desvio revisionista".`, 'warn'); } }
    }
    if (chance(0.004)) { const c = pick(Object.values(s.world.c).filter(x => !x.dep && entOf(s, data, x.id)?.profile?.align === 'W')); if (c) ctx.news(`Greve geral e agitação em ${nm(s, data, c.id)}: o Comintern fala em "situação revolucionária".`, 'info'); }
  },
  imperial_world(s, data, ctx) {
    if (chance(0.007) && s.world.wars.filter(w => w.active && w.ai).length < 5) {
      const ps = Object.values(s.world.c).filter(c => !c.dep && c.id !== PLY).sort((a, b) => aiPower(b) - aiPower(a)).slice(0, 14);
      const a = pick(ps), cand = (entOf(s, data, a?.id)?.nb || []).filter(x => s.world.c[x] && !s.world.c[x].dep && x !== PLY && aiPower(s.world.c[x]) < aiPower(a) * 0.8);
      if (a && cand.length) startAiWar(s, data, ctx, a.id, pick(cand), `${nm(s, data, a.id)} lança uma guerra de conquista imperial contra ${nm(s, data, cand[0])}`);
    }
  },
  liberal_world(s, data, ctx) {
    if (chance(0.005)) ctx.news('Cúpula das Democracias reafirma o "consenso liberal" e ameaça sanções contra regimes fechados.', 'info');
    if ((s.st.political + s.st.civil) / 2 < 40) s.world.tension = clamp((s.world.tension ?? 30) + 0.02, 0, 100);
  },
  theocratic_world(s, data, ctx) {
    if (chance(0.005) && s.world.wars.filter(w => w.active && w.ai).length < 5) {
      const als = (s.world.alliances || []).filter(a => a.theme === 'theocratic_world');
      if (als.length >= 2) { const [x, y] = [pick(als), pick(als)]; if (x !== y) { const a = x.members[0], b = y.members[0]; if (a && b && s.world.c[a] && s.world.c[b]) startAiWar(s, data, ctx, a, b, `${x.name} proclama guerra santa contra ${y.name}`); } }
    }
  },
  cold_war_world(s, data, ctx) {
    if (chance(0.006)) ctx.news(pick(['Corrida espacial: satélite do bloco rival entra em órbita antes do esperado.', 'Troca de espiões numa ponte na fronteira entre os blocos.', 'Exercício nuclear simulado põe os dois lados em alerta máximo.', 'Guerra por procuração se intensifica em um país não alinhado.']), 'warn');
    if (chance(0.002)) s.world.tension = clamp((s.world.tension ?? 40) + 6, 0, 100);
  },
  corporate_world(s, data, ctx) {
    if (chance(0.006)) ctx.news(pick(['Megaempresa compra a rede de ferrovias de um país e muda as tarifas.', 'Lobby corporativo derruba lei de salário mínimo em três parlamentos.', 'Conglomerado financia campanha presidencial e ganha concessão de portos.']), 'info');
  },
  climate_collapse_world(s, data, ctx) {
    if (chance(0.01)) ctx.news(pick(['Ciclone devastador atinge ilhas e litoral e gera milhares de desabrigados.', 'Seca histórica seca rios inteiros e provoca fuga em massa.', 'Cidade costeira é abandonada após a invasão do mar.', 'Frente fria extrema e inundações simultâneas paralisam um continente.']), 'bad');
    if (chance(0.004)) s.world.tension = clamp((s.world.tension ?? 40) + 4, 0, 100);
  },
  continental_world(s, data, ctx) {
    if (chance(0.005)) { const al = pick((s.world.alliances || []).filter(a => a.theme === 'continental_world')); if (al) ctx.news(`Cúpula da ${al.name} aprova nova rodada de integração: moeda, tarifas e passaporte comuns.`, 'info'); }
  },
};
const nm = (s, data, id) => entOf(s, data, id)?.name || id;
export function weeklyWorldScenario(s, data, ctx) {
  const id = s.world?.wscn; if (!id || !DYN[id]) return;
  DYN[id](s, data, ctx);
}
