// Geopolítica da IA: famílias ideológicas (socialistas x monarquias e nacionalistas, democracias x ditaduras),
// posturas de política externa (isolacionista, neutra, alinhada, intervencionista, expansionista), nacionalismo,
// minorias étnicas e povos sem Estado (Mapuches, Sámi, Cabilas, Tâmeis, Maias...) com irredentismo e separatismo,
// alianças ideológicas e guerras entre IAs. Vale para o jogo normal, o mundo customizado e o Observatório.
import { clamp, chance, rand, pick, random } from './util.js';
import { PLY, entOf, ownerOf, provincesOf, relAI, shiftRelAI, aiPower, playerNeighbors } from './world.js';
import { secessionMult } from './cohesion.js';
import { startAiWar, foundState, aiNeighborsOf, MOVEMENTS, movementProvinces } from './newstates.js';
import { cultureOf } from './names.js';
import { CRISES } from './worldlife.js';

const day = s => Math.floor(s.time.min / 1440);
const norm = x => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const nm = (s, data, id) => id === PLY ? s.nation.shortName : entOf(s, data, id)?.name || id;
const hashS = str => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100000) / 100000; };

export { FAMILIES, famOfProfile, playerFam, compat, ideoRel, POSTURES } from './ideofam.js';
import { FAMILIES, famOfProfile, playerFam, compat, ideoRel, POSTURES } from './ideofam.js';
import { labCountryAct, warSummary } from './attrition.js';
export const famOf = (s, data, id) => id === PLY ? playerFam(s) : famOfProfile(entOf(s, data, id)?.profile);
const labMul = (s, k) => s?.world?.lab?.[k] ?? 1;

const KNOWN_POSTURE = { CHE: 'neutral', AUT: 'neutral', IRL: 'neutral', MLT: 'neutral', CRI: 'neutral', PRK: 'isolationist', TKM: 'isolationist', BTN: 'isolationist', ERI: 'isolationist', USA: 'interventionist', GBR: 'interventionist', FRA: 'interventionist', RUS: 'expansionist', IRN: 'interventionist', ISR: 'interventionist', TUR: 'interventionist', SAU: 'interventionist', CHN: 'aligned', ARE: 'interventionist', AZE: 'expansionist' };
export function defaultPosture(s, data, id) {
  const c = s.world.c[id], e = entOf(s, data, id); if (!c || !e) return 'neutral';
  const base = e.origin || id;
  if (KNOWN_POSTURE[id]) return KNOWN_POSTURE[id];
  if (e.posture && POSTURES[e.posture]) return e.posture;
  if (c.expansionist) return 'expansionist';
  const f = famOfProfile(e.profile), mil = e.profile?.milIntensity ?? 0.8, h = hashS(base + 'post' + (e.custom ? id : ''));
  if (['nationalist', 'junta'].includes(f) && mil > 1.4 && h < 0.4) return 'expansionist';
  if (['liberal', 'socdem'].includes(f)) return c.gdp > 1500 && mil > 1.1 ? 'interventionist' : h < 0.25 ? 'neutral' : 'aligned';
  if (f === 'socialist') return h < 0.2 ? 'isolationist' : 'aligned';
  if (f === 'theocratic') return h < 0.5 ? 'interventionist' : 'aligned';
  return h < 0.45 ? 'neutral' : 'aligned';
}
export const postureOf = (s, data, id) => (id === PLY ? s.nation.posture : s.world.c[id]?.posture) || 'neutral';
const FAM_NAT = { nationalist: 75, junta: 70, monarchist: 55, theocratic: 55, socialist: 42, hybrid: 50, liberal: 25, socdem: 20 };
export function nationalismOf(s, data, id) {
  if (id === PLY) return clamp(50 + (s.nation.ideology?.axes?.nation || 0) * 0.45, 0, 100);
  const c = s.world.c[id]; if (!c) return 0;
  if (c.nat != null) return c.nat;
  return clamp(FAM_NAT[famOf(s, data, id)] + (postureOf(s, data, id) === 'expansionist' ? 15 : 0) + (hashS(id + 'nat') - 0.5) * 20, 0, 100);
}

// ---------- Minorias e povos sem Estado ----------
// kin: Estado-nação de referência (a minoria "pertence" a ele). Sem kin, é um povo sem Estado.
const em = (type, alt, color, x, y, sz) => ({ type, alt, color, x, y, s: sz });
export const ETHNIC = [
  { id: 'albanians', people: 'albaneses', kin: 'ALB', where: { KOS: '*', MKD: ['Tetovo', 'Gostivar', 'Debar', 'Struga', 'Saraj', 'Čair', 'Lipkovo', 'Bogovinje', 'Tearce', 'Želino', 'Vrapcište', 'Brvenica', 'Jegunovce', 'Mavrovo and Rostusa'], MNE: ['Ulcinj', 'Plav'], SRB: ['Pcinjski'] } },
  { id: 'serbs', people: 'sérvios', kin: 'SRB', where: { BIH: { rg: ['Repuplika Srpska'] }, KOS: ['Leposavić', 'Zubin Potok', 'Zvečan', 'Štrpce'] } },
  { id: 'croats', people: 'croatas', kin: 'HRV', where: { BIH: ['West Herzegovina', 'Herzegovina-Neretva', 'West Bosnia'] } },
  { id: 'bosniaks', people: 'bosníacos', kin: 'BIH', where: { SRB: ['Raški'], MNE: ['Rožaje', 'Bijelo Polje'] } },
  { id: 'hungarians', people: 'húngaros', kin: 'HUN', where: { ROU: ['Harghita', 'Covasna', 'Mures'], SRB: ['Severno-Backi'], SVK: ['Nitriansky'] } },
  { id: 'russians', people: 'russos étnicos', kin: 'RUS', where: { EST: ['Ida-Viru'], LVA: { rg: ['Latgale'] }, KAZ: ['North Kazakhstan', 'Qostanay', 'Pavlodar', 'East Kazakhstan'], UKR: ["Donets'k", "Luhans'k"] } },
  { id: 'armenians', people: 'armênios', kin: 'ARM', where: { GEO: ['Samtskhe-Javakheti'] } },
  { id: 'ossetians', people: 'ossétios', kin: 'RUS', where: { GEO: ['Shida Kartli'] } },
  { id: 'greeks', people: 'gregos', kin: 'GRC', where: { ALB: ['Gjirokastër'] } },
  { id: 'turks_bg', people: 'turcos', kin: 'TUR', where: { BGR: ['Kardzhali'] } },
  { id: 'pashtuns', people: 'pachtuns', kin: 'AFG', where: { PAK: ['K.P.', 'F.A.T.A.'] } },
  { id: 'somali_eth', people: 'somalis', kin: 'SOM', where: { ETH: ['Somali'] } },
  // Povos sem Estado: separatismo e regionalismo (os Estados que os governam pagam o preço em estabilidade).
  { id: 'mapuche', people: 'mapuches', name: 'Wallmapu (Nação Mapuche)', short: 'Wallmapu', culture: 'es', ideo: 'Autonomismo mapuche', where: { CHL: ['La Araucanía', 'Bío-Bío', 'Los Ríos', 'Los Lagos'], ARG: ['Neuquén', 'Río Negro', 'Chubut'] },
    flag: { layout: 'h3', colors: ['#0b3d91', '#0b3d91', '#1e8c3c'], emblems: [em('r_kultrun', 'sun', '#ffffff', 0.5, 0.45, 0.42)] }, profile: { liberty: 55, market: 40, religiosity: 50, align: 'N', milIntensity: 0.7, regime: 'hybrid' } },
  { id: 'sami', people: 'sámis', name: 'Sápmi', short: 'Sápmi', culture: 'nordic', ideo: 'Autonomismo sámi', where: { NOR: ['Finnmark', 'Troms'], SWE: ['Norrbotten'], FIN: ['Lapland'] },
    flag: { layout: 'nordic', colors: ['#0035ad', '#d00c33', '#ffce00'], emblems: [em('r_sami', 'circle', '#d00c33', 0.36, 0.5, 0.34)] }, profile: { liberty: 85, market: 50, religiosity: 25, align: 'W', milIntensity: 0.2, regime: 'dem' } },
  { id: 'kabyle', people: 'cabilas (amazigh)', name: 'Kabília', short: 'Kabília', culture: 'ar', ideo: 'Nacionalismo amazigh', where: { DZA: ['Tizi Ouzou', 'Béjaïa', 'Bouira'] },
    flag: { layout: 'h3', colors: ['#0072c6', '#3a9d23', '#f9dd16'], emblems: [em('n_tamga', 'sunwheel', '#e10600', 0.5, 0.5, 0.5)] }, profile: { liberty: 60, market: 50, religiosity: 40, align: 'WL', milIntensity: 0.7, regime: 'hybrid' } },
  { id: 'rif', people: 'rifenhos', name: 'República do Rif', short: 'Rif', culture: 'ar', ideo: 'Nacionalismo rifenho', where: { MAR: ['Taza - Al Hoceima - Taounate'] },
    flag: { layout: 'solid', colors: ['#c8102e'], emblems: [em('crescentstar', null, '#1e8c3c', 0.5, 0.5, 0.45)] }, profile: { liberty: 40, market: 45, religiosity: 70, align: 'N', milIntensity: 1, regime: 'hybrid' } },
  { id: 'sahrawi', people: 'saarauis', name: 'República Árabe Saarauí', short: 'Saara Ocidental', culture: 'ar', ideo: 'Nacionalismo saarauí', where: { MAR: ['Laâyoune - Boujdour - Sakia El Hamra', 'Oued el Dahab'] },
    flag: { layout: 'triangle', colors: ['#000000', '#ffffff', '#007a3d', '#c8102e'], emblems: [em('crescentstar', null, '#c8102e', 0.5, 0.5, 0.28)] }, profile: { liberty: 35, market: 40, religiosity: 70, align: 'N', milIntensity: 1.4, regime: 'auth' } },
  { id: 'tamil', people: 'tâmeis', name: 'Tamil Eelam', short: 'Eelam', culture: 'hi', ideo: 'Nacionalismo tâmil', where: { LKA: { rg: ['Uturu paḷāta'] } },
    extra: { LKA: ['Trikuṇāmalaya', 'Maḍakalapuva', 'Ampāra'] }, flag: { layout: 'solid', colors: ['#c8102e'], emblems: [em('r_lion', 'lion', '#f2c400', 0.5, 0.5, 0.6)] }, profile: { liberty: 35, market: 40, religiosity: 50, align: 'N', milIntensity: 1.6, regime: 'auth' } },
  { id: 'maya', people: 'maias', name: 'Confederação Maia', short: 'Maia', culture: 'es', ideo: 'Indigenismo maia', where: { MEX: ['Chiapas', 'Yucatán', 'Quintana Roo', 'Campeche'], GTM: ['Quiché', 'Huehuetenango', 'Alta Verapaz', 'Totonicapán', 'Sololá'] },
    flag: { layout: 'h3', colors: ['#1e8c3c', '#ffffff', '#c8102e'], emblems: [em('n_quetzal', 'falcon', '#1e8c3c', 0.5, 0.5, 0.42)] }, profile: { liberty: 55, market: 35, religiosity: 55, align: 'N', milIntensity: 0.6, regime: 'hybrid' } },
  { id: 'andean', people: 'aimarás e quéchuas', name: 'Qullasuyu', short: 'Qullasuyu', culture: 'es', ideo: 'Indigenismo andino', where: { BOL: ['La Paz', 'Oruro', 'Potosí'], PER: ['Puno', 'Cusco'] },
    flag: { layout: 'checker', colors: ['#ffffff', '#1e8c3c'], emblems: [em('r_chakana', 'cross', '#c8102e', 0.5, 0.5, 0.42)] }, profile: { liberty: 45, market: 30, religiosity: 50, align: 'EL', milIntensity: 0.7, regime: 'hybrid' } },
  { id: 'abkhaz', people: 'abcázios', name: 'Abcázia', short: 'Abcázia', culture: 'cau', ideo: 'Separatismo abcázio', where: { GEO: ['Abkhazia'] },
    flag: { layout: 'h3', colors: ['#00964b', '#ffffff', '#00964b'], emblems: [em('square', null, '#c8102e', 0.2, 0.25, 0.4)] }, profile: { liberty: 35, market: 40, religiosity: 40, align: 'E', milIntensity: 1.3, regime: 'auth' } },
  { id: 'khalistan', people: 'sikhs', name: 'Khalistão', short: 'Khalistão', culture: 'hi', ideo: 'Nacionalismo sikh', where: { IND: ['Punjab'] },
    flag: { layout: 'solid', colors: ['#ff9933'], emblems: [em('r_khanda', 'swords', '#0b3d91', 0.5, 0.5, 0.55)] }, profile: { liberty: 45, market: 50, religiosity: 80, align: 'N', milIntensity: 1, regime: 'hybrid' } },
  { id: 'naga', people: 'nagas', name: 'Nagalim', short: 'Nagalim', culture: 'hi', ideo: 'Nacionalismo naga', where: { IND: ['Nagaland', 'Manipur'] },
    flag: { layout: 'h3', colors: ['#0b3d91', '#ffffff', '#c8102e'], emblems: [em('star', null, '#ffffff', 0.25, 0.25, 0.24)] }, profile: { liberty: 45, market: 45, religiosity: 85, align: 'N', milIntensity: 1, regime: 'hybrid' } },
  { id: 'caprivi', people: 'lozis', name: 'Itenge (Caprivi Livre)', short: 'Caprivi', culture: 'af_s', ideo: 'Separatismo lozi', where: { NAM: ['Caprivi'] },
    flag: { layout: 'h3', colors: ['#0b3d91', '#ffffff', '#1e8c3c'], emblems: [em('r_zimbird', 'falcon', '#c8102e', 0.5, 0.5, 0.36)] }, profile: { liberty: 45, market: 45, religiosity: 55, align: 'N', milIntensity: 0.8, regime: 'hybrid' } },
  { id: 'zulu', people: 'zulus', name: 'Reino Zulu', short: 'Zululândia', culture: 'af_s', ideo: 'Nacionalismo zulu', where: { ZAF: ['KwaZulu-Natal'] },
    flag: { layout: 'h3', colors: ['#007a4d', '#000000', '#ffb612'], emblems: [em('shield', null, '#ffffff', 0.5, 0.5, 0.42)] }, profile: { liberty: 50, market: 50, religiosity: 60, align: 'N', milIntensity: 0.9, regime: 'hybrid' } },
  { id: 'kashmir', people: 'caxemires', name: 'Caxemira Livre', short: 'Caxemira', culture: 'ur', ideo: 'Nacionalismo caxemire', where: { IND: ['Jammu and Kashmir'], PAK: ['Azad Kashmir'] },
    flag: { layout: 'solid', colors: ['#1e8c3c'], emblems: [em('crescentstar', null, '#ffffff', 0.4, 0.5, 0.42)] }, profile: { liberty: 35, market: 45, religiosity: 85, align: 'N', milIntensity: 1.3, regime: 'hybrid' } },
];
function resolveWhere(data, where) {
  const out = [];
  for (const a3 in where || {}) {
    const spec = where[a3]; if (!spec) continue;
    const list = data.geo.byCountry[a3] || [];
    if (spec === '*') { out.push(...list); continue; }
    if (Array.isArray(spec)) { const want = new Set(spec.map(norm)); for (const p of list) if (want.has(norm(data.geo.prov[p].n))) out.push(p); }
    else if (spec.rg) { const want = new Set(spec.rg.map(norm)); for (const p of list) if (want.has(norm(data.geo.prov[p].rg))) out.push(p); }
  }
  return out;
}
const PROV_CACHE = new WeakMap();
export const ethnicProvinces = (data, g) => { let m = PROV_CACHE.get(data); if (!m) PROV_CACHE.set(data, m = {}); return (m[g.id] ||= (g.movement ? movementProvinces(data, g.movement) : [...new Set([...resolveWhere(data, g.where), ...resolveWhere(data, g.extra)])]).filter(p => data.geo.prov[p])); };
// Grupos com povo sem Estado conhecido (movimentos separatistas reais + lista acima).
export function statelessGroups(data) {
  return [...ETHNIC.filter(g => !g.kin), ...MOVEMENTS.map(m => ({ id: m.id, people: m.short, name: m.name, short: m.short, culture: m.culture, ideo: m.ideo, flag: m.flag, profile: m.profile, movement: m }))];
}
// País "de origem" de uma província (mesmo depois de o mundo customizado reescrever o dono).
export const baseOf = (data, pid) => data.geo.prov[pid]?.o3 || data.geo.prov[pid]?.a3;
// Quem detém hoje a maior parte do território-base de um país (o "Estado-nação" atual daquele povo).
function heirOfBase(s, data, a3, cache) {
  if (!cache._cnt) { // uma só passada: contagem de (país-base, dono atual)
    const cnt = cache._cnt = {};
    for (const pid in data.geo.prov) { const b = baseOf(data, pid), o = ownerOf(s, data, pid); const m = cnt[b] ||= { _t: 0 }; m._t++; m[o] = (m[o] || 0) + 1; }
  }
  if (a3 in cache) return cache[a3];
  const m = cache._cnt[a3]; if (!m) return (cache[a3] = null);
  let best = null, bn = 0; for (const o in m) if (o !== '_t' && m[o] > bn) { bn = m[o]; best = o; }
  return (cache[a3] = best && bn >= m._t * 0.35 ? best : null);
}

// Índice de minorias: quem detém províncias de que povo, e quem é o Estado-mãe desse povo.
const ETH_CACHE = new WeakMap(); // fora do estado salvo (contém referências aos dados)
export function ethnicIndex(s, data) {
  const W = s.world;
  const cached = ETH_CACHE.get(W);
  if (cached && cached.ver === W.ver && cached.data === data) return cached;
  const heir = {}, minorities = [], stateless = [];
  const P = data.geo.prov;
  // 1) Minorias explícitas com Estado-mãe.
  for (const g of ETHNIC) {
    if (!g.kin) continue;
    const kin = heirOfBase(s, data, g.kin, heir); if (!kin) continue;
    const by = {};
    for (const pid of ethnicProvinces(data, g)) { const o = ownerOf(s, data, pid); if (o !== kin) (by[o] ||= []).push(pid); }
    for (const holder in by) minorities.push({ group: g.id, people: g.people, kin, holder, provs: by[holder], pop: by[holder].reduce((a, p) => a + (P[p].pop || 0), 0) });
  }
  // 2) Terras de um país-base que hoje estão com outro (fronteiras redesenhadas, conquistas, mundo customizado).
  const byPair = {};
  for (const pid in P) {
    const b = baseOf(data, pid), o = ownerOf(s, data, pid);
    if (!b || b === o || b === 'ATA') continue;
    (byPair[b + '>' + o] ||= []).push(pid);
  }
  for (const k in byPair) {
    const [b, holder] = k.split('>'), kin = heirOfBase(s, data, b, heir);
    if (!kin || kin === holder) continue;
    const ent = entOf(s, data, holder);
    if (ent?.origin === b && kin !== holder && !ent.custom) continue;
    if (minorities.some(m => m.kin === kin && m.holder === holder && m.provs.some(p => byPair[k].includes(p)))) continue;
    const base = data.reg[b];
    minorities.push({ base: b, group: 'base_' + b, people: `população de ${base?.name || b}`, kin, holder, provs: byPair[k], pop: byPair[k].reduce((a, p) => a + (P[p].pop || 0), 0), lost: true });
  }
  // 2b) Povos absorvidos: o país inteiro foi engolido por uma união ou conquista (URSS, Iugoslávia, anexações) e o Estado-mãe deixou de existir.
  // Sem isto, ucranianos, georgianos, armênios, bálticos etc. sumiam das minorias e do separatismo nos mundos de uniões.
  for (const b of Object.keys(heir._cnt || {})) {
    if (b === 'ATA' || b === 'undefined') continue;
    const h = heirOfBase(s, data, b, heir); if (!h || h === b || !W.c[h]) continue;
    const he = entOf(s, data, h); if ((he?.origin || h) === b || he?.secededFrom === b) continue;
    const base = data.reg[b]; if (!base) continue;
    const provs = Object.keys(P).filter(pid => baseOf(data, pid) === b && ownerOf(s, data, pid) === h); if (!provs.length) continue;
    if (minorities.some(m => m.base === b && m.holder === h)) continue;
    const mv = { id: 'lib_' + b, name: base.name, short: base.name, culture: cultureOf(data, b), ideo: 'independência nacional', flag: base.iso2 ? { iso: String(base.iso2).toLowerCase() } : { layout: 'h3', colors: ['#7a1d12', '#f2f2f2', '#1d2b45'], emblems: [] }, profile: { ...(base.profile || {}) } };
    stateless.push({ group: 'abs_' + b, people: `povo de ${base.name}`, name: base.name, holder: h, provs, absorbed: true, g: { id: 'abs_' + b, people: `povo de ${base.name}`, name: base.name, short: base.name, culture: mv.culture, ideo: mv.ideo, flag: mv.flag, profile: mv.profile, movement: mv } });
  }
  // 3) Povos sem Estado.
  for (const g of statelessGroups(data)) {
    const by = {};
    for (const pid of ethnicProvinces(data, g)) (by[ownerOf(s, data, pid)] ||= []).push(pid);
    for (const holder in by) if (!entOf(s, data, holder)?.movement || entOf(s, data, holder).movement !== g.id) stateless.push({ group: g.id, people: g.people, name: g.name, holder, provs: by[holder], g });
  }
  const out = { ver: W.ver, data, minorities, stateless }; ETH_CACHE.set(W, out); return out;
}

// ---------- Relação herdada (nações do mundo customizado e Estados novos herdam a diplomacia do país de origem) ----------
export const originOf = (s, data, id) => { const e = entOf(s, data, id); return e?.origin || e?.secededFrom || id; };

// ---------- Início da partida ----------
export function initGeopol(s, data, lab = {}) {
  const W = s.world;
  W.lab = { chaos: W.chaos ? 70 : 35, ideo: 1, ethnic: 1, wars: 1, realConflicts: true, ...(W.lab || {}), ...lab };
  for (const id in W.c) { const c = W.c[id]; if (!c.posture) c.posture = defaultPosture(s, data, id); }
  s.nation.posture ||= s.nation.ideology?.axes?.global < -50 ? 'isolationist' : s.nation.ideology?.axes?.expand > 50 ? 'expansionist' : 'aligned';
  if (!W.lab.realConflicts) for (const w of W.wars) if (w.ai && !w.chaos && !w.lab) w.active = false;
  // Guerras reais só continuam se os dois lados ainda existem com a maior parte do território.
  for (const w of W.wars) if (w.active && w.ai && !w.since) for (const id of [...w.a, ...w.b]) { const c = W.c[id]; if (!c || (c.share ?? 1) < 0.5) w.active = false; }
  fixClaims(s, data);
  ethnicClaims(s, data, true);
  // Afinidade ideológica com o jogador: irmãos ideológicos se aproximam, inimigos ideológicos se afastam.
  if (!s.spectator) {
    const pf = playerFam(s);
    for (const id in s.partners) {
      const p = s.partners[id], f = famOf(s, data, id);
      p.rel = clamp(p.rel + compat(pf, f) * 18 * labMul(s, 'ideo'), -95, 95);
    }
    // Regiões do jogador com povos sem Estado ou minorias ficam mais separatistas.
    const E = ethnicIndex(s, data);
    for (const r of s.regions || []) {
      const set = new Set(r.provinces);
      const st = E.stateless.filter(x => x.holder === PLY && x.provs.some(p => set.has(p))).length;
      const mi = E.minorities.filter(x => x.holder === PLY && x.provs.some(p => set.has(p))).length;
      if (st || mi) { r.sep = clamp((r.sep || 0) + 0.12 * st + 0.08 * mi, 0, 1); r.ethnic = [...new Set([...E.stateless, ...E.minorities].filter(x => x.holder === PLY && x.provs.some(p => set.has(p))).map(x => x.people))]; }
    }
  }
  W.geoInit = true;
  computeMeters(s, data);
}

// Reivindicações antigas cujo dono mudou (mundo customizado, fraturas): passam ao novo dono ou deixam de existir.
export function fixClaims(s, data) {
  const W = s.world;
  W.claims = W.claims.filter(c => {
    if (c.claimant !== PLY && !W.c[c.claimant]) return false;
    const held = {}; for (const p of c.provs) { const o = ownerOf(s, data, p); held[o] = (held[o] || 0) + 1; }
    delete held[c.claimant];
    const best = Object.entries(held).sort((a, b) => b[1] - a[1])[0];
    if (!best) return false;
    if (best[0] !== c.holder && (W.c[best[0]] || best[0] === PLY)) { c.holder = best[0]; c.provs = c.provs.filter(p => ownerOf(s, data, p) === best[0]); }
    return true;
  });
}

// Irredentismo: o Estado-mãe reivindica as terras onde vive "seu" povo, se for nacionalista o bastante.
function ethnicClaims(s, data, init) {
  const W = s.world, E = ethnicIndex(s, data), mul = labMul(s, 'ethnic');
  for (const m of E.minorities) {
    if (m.kin !== PLY && !W.c[m.kin]) continue;
    if (m.holder !== PLY && !W.c[m.holder]) continue;
    const id = 'eth_' + m.group + '_' + m.holder;
    const natK = nationalismOf(s, data, m.kin), share = m.lost ? 1 : 0.6;
    const existing = W.claims.find(c => c.id === id);
    if (init || !existing) {
      // Tensão diplomática proporcional ao nacionalismo do Estado-mãe.
      const d = -(6 + natK * 0.22) * share * mul;
      if (m.kin === PLY) { if (s.partners[m.holder]) s.partners[m.holder].rel = clamp(s.partners[m.holder].rel + d * 0.6, -95, 95); }
      else if (m.holder === PLY) { if (s.partners[m.kin]) s.partners[m.kin].rel = clamp(s.partners[m.kin].rel + d, -95, 95); }
      else shiftRelAI(s, m.kin, m.holder, d);
    }
    if (existing || m.kin === PLY) continue;
    if (mul <= 0.05 || natK < (m.lost && m.kin === m.base ? 15 : m.lost ? 50 : 45) * mul) continue;
    W.claims.push({ id, claimant: m.kin, holder: m.holder, provs: [...m.provs], type: 'irredentist', just: `${nm(s, data, m.kin)} reivindica as terras dos ${m.people} sob ${nm(s, data, m.holder)}.`, strat: 50, dom: 85, risk: clamp(35 + natK * 0.45, 30, 90), status: 'active', src: 'ethnic' });
  }
}

// ---------- Medidores do mundo ----------
export function computeMeters(s, data) {
  const W = s.world, ids = Object.keys(W.c).filter(id => !W.c[id].dep), d = day(s);
  const wars = W.wars.filter(w => w.active).length + (s.spectator ? 0 : s.wars.filter(w => w.active).length);
  const recent = (W.regimeLog || []).filter(x => d - x.day < 120 && x.kind !== 'election').length;
  const newS = (W.newStates || []).filter(x => d - x.day < 365).length;
  let pop = 0, natW = 0, dem = 0, fams = {}, hdiW = 0, povW = 0, libW = 0;
  const warSet = new Set(W.wars.filter(w => w.active).flatMap(w => [...w.a, ...w.b]));
  for (const id of ids) {
    const c = W.c[id], f = famOf(s, data, id); fams[f] = (fams[f] || 0) + 1; pop += c.pop; natW += nationalismOf(s, data, id) * c.pop; if (f === 'liberal' || f === 'socdem') dem++;
    const sd = socialOf(c, warSet.has(id)); hdiW += sd.hdi * c.pop; povW += sd.poverty * c.pop; libW += (entOf(s, data, id)?.profile?.liberty ?? 50) * c.pop;
  }
  const top = ids.sort((a, b) => aiPower(W.c[b]) - aiPower(W.c[a])).slice(0, 30);
  let hostile = 0, pairs = 0;
  for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) { pairs++; if (compat(famOf(s, data, top[i]), famOf(s, data, top[j])) <= -0.35) hostile++; }
  const tension = W.tension ?? 30;
  const chaos = clamp(wars * 3.5 + recent * 3 + newS * 3 + tension * 0.3 + (W.crisis ? 8 : 0) + (W.lab?.chaos ?? 35) * 0.12, 0, 100);
  const M = W.meters = { chaos, tension, wars, nationalism: pop ? natW / pop : 50, polarization: pairs ? hostile / pairs * 100 : 0, democracy: ids.length ? dem / ids.length * 100 : 0, hdi: pop ? hdiW / pop : 0.7, poverty: pop ? povW / pop : 15, freedom: pop ? libW / pop : 50, countries: ids.length, alliances: (W.alliances || []).length, newStates: (W.newStates || []).length, fams };
  const WS = warSummary(s, data);
  Object.assign(M, { dead: WS.mil + WS.civ, milDead: WS.mil, civDead: WS.civ, refugees: WS.ref, destruction: WS.destruction, devastated: WS.devastated, insurg: WS.insurg, revolts: WS.revolts, gdpLost: WS.lost });
  M.era = classifyWorld(M, fams, ids.length);
  if (W.eraNow !== M.era.id) { if (W.eraNow) (W.eraLog ||= []).unshift({ day: d, id: M.era.id, name: M.era.name }); W.eraNow = M.era.id; }
  (W.meterHist ||= []).push([d, Math.round(M.chaos), Math.round(M.tension), M.wars, Math.round(M.nationalism), Math.round(M.polarization), Math.round(M.democracy), Math.round(M.hdi * 1000) / 10, Math.round(M.poverty * 10) / 10, Math.round(M.freedom), Math.round(M.destruction * 100) / 100, Math.round(M.dead), Math.round(M.refugees), M.insurg]);
  if (W.meterHist.length > 260) W.meterHist.shift();
  // Observatório: série mensal por país (PIB, estabilidade, poder, população, províncias) e das famílias ideológicas.
  if (s.spectator && (!W.obsHist || d - (W.obsHist.days.at(-1) ?? -99) >= 28)) {
    const H = W.obsHist ||= { days: [], c: {}, fams: [], prov: {} };
    H.days.push(d); H.fams.push({ ...fams });
    const pc = {}; for (const pid in data.geo.prov) { const o = ownerOf(s, data, pid); pc[o] = (pc[o] || 0) + 1; }
    for (const id of Object.keys(W.c)) { const c = W.c[id]; if (c.dep) continue; (H.c[id] ||= []).push([d, Math.round(c.gdp), Math.round(c.stab), +aiPower(c).toFixed(1), +c.pop.toFixed(1), pc[id] || 0, Math.round(c.exh || 0), Math.round((c.dmg || 0) * 1000) / 10]); if (H.c[id].length > 120) H.c[id].shift(); }
    if (H.days.length > 120) { H.days.shift(); H.fams.shift(); }
  }
  return M;
}

// ---------- Indicadores sociais estimados (IDH e pobreza) ----------
// IDH aproximado pela renda per capita (escala logarítmica), com perdas por guerra e instabilidade.
export function socialOf(c, atWar) {
  const pc = Math.max(150, c.gdp * 1e3 / Math.max(0.01, c.pop));
  const dm = c.dmg || 0; // infraestrutura destruída derruba saúde, escolas e renda
  const hdi = clamp(0.25 + 0.25 * Math.log10(pc / 100) - (atWar ? 0.04 : 0) - Math.max(0, 40 - c.stab) * 0.002 - dm * 0.2, 0.25, 0.97);
  const poverty = clamp(90 - 23 * Math.log10(pc) + (atWar ? 7 : 0) + Math.max(0, 40 - c.stab) * 0.25 + dm * 35, 0.5, 85);
  return { hdi, poverty, gdppc: pc };
}

// ---------- Classificação do mundo ----------
export const ERAS = {
  worldwar: { name: 'Guerra mundial', color: '#7a1d12', desc: 'Conflitos simultâneos em vários continentes e tensão máxima entre as potências.' },
  chaos: { name: 'Anarquia global', color: '#a93226', desc: 'Estados se desfazendo, golpes e secessões em série: a ordem internacional colapsou.' },
  ruins: { name: 'Mundo em ruínas', color: '#6e2c00', desc: 'Guerras longas devastaram regiões inteiras: cidades destruídas, milhões de refugiados e economias para reconstruir.' },
  insurgency: { name: 'Era das insurgências', color: '#7d6608', desc: 'As fronteiras mudaram à força e os povos conquistados não aceitam: guerrilhas e levantes em toda parte.' },
  orwell: { name: 'Distopia orwelliana ("1984")', color: '#2c2c2c', desc: 'Regimes totalitários dominam o planeta; quase não há liberdade e os blocos vivem em guerra permanente.' },
  dystopia: { name: 'Distopia', color: '#5b2c6f', desc: 'Pobreza em massa, regimes fechados e instabilidade em toda parte.' },
  nationalist: { name: 'Era dos nacionalismos', color: '#3b3f8f', desc: 'Fronteiras contestadas, irredentismo e governos nacionalistas em alta.' },
  red: { name: 'Mundo vermelho', color: '#c0261d', desc: 'O socialismo é a força dominante do planeta.' },
  theocratic: { name: 'Era teocrática', color: '#2e7d4f', desc: 'A religião governa boa parte dos Estados.' },
  coldwar: { name: 'Guerra fria', color: '#566573', desc: 'Blocos ideológicos rivais, tensão alta e guerras por procuração — mas sem confronto direto.' },
  multipolar: { name: 'Multipolaridade instável', color: '#ca6f1e', desc: 'Várias potências disputam influência; crises frequentes.' },
  fragile: { name: 'Equilíbrio frágil', color: '#b7950b', desc: 'Paz relativa, mas com focos de tensão e conflitos regionais.' },
  liberal: { name: 'Paz liberal', color: '#2f6db5', desc: 'Democracias prevalecem, guerras são raras e o comércio floresce.' },
  utopia: { name: 'Utopia', color: '#1e8449', desc: 'Paz, prosperidade, liberdade e quase nenhuma pobreza.' },
};
export function classifyWorld(M, fams = {}, n = 1) {
  const share = k => (fams[k] || 0) / Math.max(1, n);
  let id;
  if (M.wars >= 10 || (M.tension >= 85 && M.wars >= 5)) id = 'worldwar';
  else if (M.chaos >= 80) id = 'chaos';
  else if ((M.destruction || 0) >= 3 || (M.refugees || 0) > 40000) id = 'ruins';
  else if ((M.insurg || 0) >= 20 && M.wars < 6) id = 'insurgency';
  else if (M.freedom < 32 && M.democracy < 25 && (M.polarization > 35 || M.wars >= 3)) id = 'orwell';
  else if (M.poverty > 30 || (M.hdi < 0.55 && M.chaos > 50)) id = 'dystopia';
  else if (share('socialist') > 0.35) id = 'red';
  else if (share('theocratic') > 0.25) id = 'theocratic';
  else if (M.nationalism > 60) id = 'nationalist';
  else if (M.wars === 0 && M.hdi > 0.8 && M.democracy > 60 && M.tension < 25 && M.poverty < 8) id = 'utopia';
  else if (M.polarization > 45 && M.tension >= 45 && M.wars < 5) id = 'coldwar';
  else if (M.democracy > 50 && M.wars <= 1 && M.tension < 35) id = 'liberal';
  else if (M.tension > 50 || M.wars >= 4) id = 'multipolar';
  else id = 'fragile';
  return { id, ...ERAS[id] };
}

// ---------- Rodada semanal ----------
const ALLY_NAMES = {
  socialist: ['Pacto Socialista {r}', 'Internacional Vermelha {r}', 'Conselho de Assistência Mútua {r}'],
  monarchist: ['Liga das Coroas {r}', 'Santa Aliança {r}', 'Concerto Monárquico {r}'],
  nationalist: ['Eixo de {c}', 'Pacto de Ferro {r}', 'Bloco Soberanista {r}'],
  theocratic: ['Conselho da Fé {r}', 'Liga Sagrada {r}'],
  liberal: ['Aliança Democrática {r}', 'Pacto de Defesa Democrático {r}', 'Comunidade das Democracias {r}'],
  socdem: ['Aliança Progressista {r}', 'Liga Social {r}'],
  junta: ['Pacto dos Generais {r}', 'Conselho Militar {r}'],
  hybrid: ['Pacto de {c}', 'Entente {r}'],
};
const REG = { europe: 'da Europa', eastern_europe: 'do Leste', balkans: 'dos Bálcãs', caucasus: 'do Cáucaso', central_asia: 'da Ásia Central', middle_east: 'do Oriente Médio', north_africa: 'do Magrebe', sub_saharan_africa: 'da África', south_asia: 'do Sul da Ásia', east_asia: 'do Extremo Oriente', southeast_asia: 'do Sudeste Asiático', south_america: 'da América do Sul', central_america: 'da América Central', caribbean: 'do Caribe', north_america: 'da América do Norte', oceania: 'do Pacífico' };
const allied = (W, a, b) => (W.alliances || []).some(x => x.members.includes(a) && x.members.includes(b));
const inWar = (s, id) => s.world.wars.some(w => w.active && [...w.a, ...w.b].includes(id));

function ideologicalAlliances(s, data, ctx) {
  const W = s.world, k = chaosK(s);
  if (!chance(0.09 * (0.6 + k))) return;
  const free = Object.keys(W.c).filter(id => !W.c[id].dep && !(W.alliances || []).some(a => a.members.includes(id)) && POSTURES[postureOf(s, data, id)].ally > 0.3);
  const lead = free.sort((a, b) => aiPower(W.c[b]) - aiPower(W.c[a])).slice(0, 40)[Math.floor(random() * Math.min(40, free.length))];
  if (!lead) return;
  const f = famOf(s, data, lead); if (compat(f, f) < 0.2) return;
  const reg0 = entOf(s, data, lead)?.regions?.[0];
  const near = new Set(aiNeighborsOf(s, data, lead));
  const cand = free.filter(id => id !== lead && famOf(s, data, id) === f && (near.has(id) || entOf(s, data, id)?.regions?.[0] === reg0) && relAI(s, data, lead, id) > -5)
    .sort((a, b) => relAI(s, data, lead, b) - relAI(s, data, lead, a)).slice(0, 4);
  if (!cand.length) return;
  const members = [lead, ...cand], e = entOf(s, data, lead);
  const used = new Set((W.alliances || []).map(a => a.name));
  let name = pick(ALLY_NAMES[f] || ALLY_NAMES.hybrid).replace('{c}', e?.capital?.name || e?.name || lead).replace('{r}', REG[reg0] || '').trim();
  for (let i = 2; used.has(name); i++) name = name.replace(/ \d+$/, '') + ' ' + i;
  (W.alliances ||= []).push({ id: 'al' + (W.alliances.length + 1) + '_' + day(s), name, members, leader: lead, since: day(s), fam: f });
  for (const a of members) for (const b of members) if (a < b) shiftRelAI(s, a, b, 12);
  // Inimigos ideológicos da nova aliança se alarmam.
  for (const id of Object.keys(W.c)) if (compat(famOf(s, data, id), f) <= -0.5 && members.some(m => aiNeighborsOf(s, data, m).includes(id))) for (const m of members) shiftRelAI(s, m, id, -6);
  ctx.news?.(`Nasce a ${name}: ${members.map(m => nm(s, data, m)).join(', ')} firmam aliança ${FAMILIES[f].short.toLowerCase()}.`, 'info');
  // Convite ao jogador que compartilha a ideologia e está na vizinhança.
  if (!s.spectator && playerFam(s) === f && members.some(m => playerNeighbors(s, data).has(m) || entOf(s, data, m)?.regions?.some(r => s.nation.regions?.includes(r)))) {
    const al = W.alliances.at(-1);
    ctx.card?.({ id: `dyn_alliance_${al.id}_${day(s)}`, dyn: true, cat: 'Diplomacia ideológica', title: `A ${al.name} convida ${s.nation.shortName}`, desc: `Governos ${FAMILIES[f].short.toLowerCase()}s da região (${members.map(m => nm(s, data, m)).join(', ')}) formaram uma aliança militar e ideológica e querem você dentro.`,
      context: 'Membros se defendem mutuamente; inimigos ideológicos do bloco passam a desconfiar de você.', deadline: 14, default: 1,
      options: [{ text: 'Entrar na aliança.', hint: 'Pacto de defesa com todos os membros.', act: { type: 'joinAlliance', id: al.id } }, { text: 'Manter distância.', hint: 'Liberdade de ação; os irmãos ideológicos ficam decepcionados.', rel: Object.fromEntries(members.map(m => [m, -4])) }] });
  }
}

const chaosK = s => (s.world.lab?.chaos ?? (s.world.chaos ? 70 : 35)) / 50; // 0..2

function aiWarDecisions(s, data, ctx) {
  const W = s.world, k = chaosK(s) * labMul(s, 'wars');
  const cap = Math.round(3 + k * 6);
  if (W.wars.filter(w => w.active && w.ai).length >= cap) return;
  const ids = Object.keys(W.c).filter(id => !W.c[id].dep && !inWar(s, id));
  for (let i = 0; i < 10; i++) {
    const a = ids[Math.floor(random() * ids.length)]; if (!a) return;
    const A = W.c[a], post = POSTURES[postureOf(s, data, a)];
    if ((A.exh || 0) > 35 || (A.overext || 0) > 0.12) continue; // ainda lambendo as feridas ou ocupado demais com territórios rebeldes
    if (post.war < 0.3 && !chance(0.2)) continue;
    const fa = famOf(s, data, a);
    for (const b of aiNeighborsOf(s, data, a)) {
      if (b === PLY || !W.c[b] || W.c[b].dep || allied(W, a, b) || inWar(s, b)) continue;
      const B = W.c[b], rel = relAI(s, data, a, b), ratio = aiPower(A) / Math.max(0.1, aiPower(B));
      if (B.nuclear && !A.nuclear) continue;
      const claim = W.claims.find(c => c.claimant === a && c.holder === b && c.status === 'active');
      const ideoH = compat(fa, famOf(s, data, b));
      const motive = claim ? 1 : ideoH <= -0.55 && post.help >= 1 ? 0.6 : postureOf(s, data, a) === 'expansionist' ? 0.5 : 0;
      if (!motive || rel > -35 + k * 8 || ratio < 1.15 - k * 0.08) continue;
      const p = 0.012 * post.war * motive * (0.4 + k) * clamp((-rel - 20) / 50, 0.2, 1.6);
      if (!chance(p)) continue;
      const why = claim ? `${nm(s, data, a)} invade ${nm(s, data, b)} para "libertar" ${claim.src === 'ethnic' ? 'os seus irmãos étnicos' : 'territórios reivindicados'}`
        : ideoH <= -0.55 ? `${nm(s, data, a)} (${FAMILIES[fa].short.toLowerCase()}) ataca o regime ${FAMILIES[famOf(s, data, b)].short.toLowerCase()} de ${nm(s, data, b)}`
        : `${nm(s, data, a)} invade ${nm(s, data, b)} em busca de expansão`;
      const w = startAiWar(s, data, ctx, a, b, why);
      if (w) { w.geo = true; if (claim) w.claim = claim.id; }
      return;
    }
  }
}

// Povos sem Estado e minorias desestabilizam quem os governa; com caos alto, proclamam independência.
function ethnicUnrest(s, data, ctx) {
  const W = s.world, E = ethnicIndex(s, data), k = chaosK(s) * labMul(s, 'ethnic'), d = day(s);
  for (const x of E.stateless) {
    const c = W.c[x.holder]; if (!c) continue;
    const f = famOf(s, data, x.holder), repress = ['nationalist', 'junta', 'theocratic', 'socialist'].includes(f) ? 1.3 : ['liberal', 'socdem'].includes(f) ? 0.6 : 1;
    c.stab = clamp(c.stab - 0.04 * repress * (0.5 + k), 5, 95);
  }
  for (const m of E.minorities) { const c = W.c[m.holder]; if (c) c.stab = clamp(c.stab - 0.02 * (nationalismOf(s, data, m.kin) / 50) * k, 5, 95); }
  if (!(W.chaos || s.spectator) || d - (W.lastEthnicSecession || -999) < 60) return;
  const pool = E.stateless.filter(x => W.c[x.holder] && x.holder !== PLY && provincesOf(s, data, x.holder).length - x.provs.length >= 2 && W.c[x.holder].stab < 50 + k * 8 && secessionMult(s, data, x.holder) >= 0.15);
  const x = pool[Math.floor(random() * pool.length)];
  if (!x || !chance(0.02 * k * k * secessionMult(s, data, x.holder) * (x.absorbed ? 1.6 : 1))) return;
  const g = x.g, mv = g.movement || { id: g.id, name: g.name, short: g.short, culture: g.culture, ideo: g.ideo, flag: g.flag, profile: g.profile };
  const id = foundState(s, data, ctx, { pids: x.provs, from: x.holder, movement: mv, why: `(${g.people}) declara independência` });
  if (id) { W.lastEthnicSecession = d; const pc = W.c[x.holder]; if (pc && chance(0.55)) startAiWar(s, data, ctx, x.holder, id, `${nm(s, data, x.holder)} tenta esmagar a independência de ${nm(s, data, id)}`); }
}

// Solidariedade e hostilidade ideológica com o jogador (lenta, mas constante).
function ideologicalDrift(s, data) {
  if (s.spectator) return;
  const pf = playerFam(s), mul = labMul(s, 'ideo');
  for (const id in s.partners) {
    const p = s.partners[id]; if (!s.world.c[id]) continue;
    const c = compat(pf, famOf(s, data, id)); if (Math.abs(c) < 0.3) continue;
    const lim = c * 55;
    if ((c > 0 && p.rel < lim) || (c < 0 && p.rel > lim)) p.rel = clamp(p.rel + c * 0.12 * mul, -100, 100);
  }
  // Vizinhos ideologicamente hostis e nacionalistas tendem a se armar contra você.
}

// Intervenções: potências intervencionistas entram nas guerras de aliados ideológicos.
function interventions(s, data, ctx) {
  const W = s.world;
  for (const w of W.wars) {
    if (!w.active || !w.ai || w.intervened || !chance(0.05)) continue;
    const A = w.a[0], B = w.b[0], fa = famOf(s, data, A), fb = famOf(s, data, B);
    const helpers = Object.keys(W.c).filter(id => !W.c[id].dep && !inWar(s, id) && POSTURES[postureOf(s, data, id)].help >= 1.5 && aiPower(W.c[id]) > 8);
    for (const h of helpers) {
      const fh = famOf(s, data, h), side = compat(fh, fa) > compat(fh, fb) + 0.4 ? 'a' : compat(fh, fb) > compat(fh, fa) + 0.4 ? 'b' : null;
      if (!side) continue;
      w['support' + side.toUpperCase()] = (w['support' + side.toUpperCase()] || 0) + 0.25;
      w.intervened = true;
      shiftRelAI(s, h, side === 'a' ? B : A, -15);
      ctx.news?.(`${nm(s, data, h)} envia armas e conselheiros para ajudar ${nm(s, data, side === 'a' ? A : B)} na guerra contra ${nm(s, data, side === 'a' ? B : A)}.`, 'war');
      break;
    }
  }
}

// Pulso do mundo: a vida diplomática miúda entre as IAs (incidentes, cúpulas, sanções, protestos, corrida armamentista).
// Cada notícia mexe de verdade nas relações, na estabilidade ou nas tropas. No jogo normal é mais rara (não polui o jornal).
function worldPulse(s, data, ctx) {
  const W = s.world, k = chaosK(s), D = data;
  const n = s.spectator ? 1 + Math.round(random() * (1.5 + k * 1.5)) : (chance(0.25) ? 1 : 0);
  const ids = Object.keys(W.c).filter(id => !W.c[id].dep && W.c[id].gdp > 3);
  const big = ids.filter(id => aiPower(W.c[id]) > 4);
  const capital = id => entOf(s, D, id)?.capital?.name || nm(s, D, id);
  for (let i = 0; i < n; i++) {
    const roll = random(), a = (roll < 0.6 ? big : ids)[Math.floor(random() * (roll < 0.6 ? big : ids).length)]; if (!a) return;
    const nbs = aiNeighborsOf(s, D, a).filter(x => x !== PLY && W.c[x] && !W.c[x].dep);
    const fa = famOf(s, D, a), A = W.c[a];
    const hostile = nbs.filter(b => relAI(s, D, a, b) < -25 && !inWar(s, a)), friendly = nbs.filter(b => relAI(s, D, a, b) > 20);
    const kind = pick(['incident', 'incident', 'summit', 'summit', 'sanction', 'protest', 'arms', 'ideo', 'kin', 'trade']);
    if (kind === 'incident' && hostile.length) { const b = pick(hostile); shiftRelAI(s, a, b, -6 - k * 2); ctx.news?.(pick([`Incidente na fronteira entre ${nm(s, D, a)} e ${nm(s, D, b)}: patrulhas trocam tiros.`, `${nm(s, D, a)} acusa ${nm(s, D, b)} de violar seu espaço aéreo.`, `${nm(s, D, a)} expulsa diplomatas de ${nm(s, D, b)} sob acusação de espionagem.`, `Exercícios militares de ${nm(s, D, a)} perto da fronteira alarmam ${nm(s, D, b)}.`]), 'warn'); continue; }
    if (kind === 'summit') { const b = pick(friendly.length ? friendly : ids.filter(x => x !== a && compat(fa, famOf(s, D, x)) >= 0.45)); if (!b) continue; shiftRelAI(s, a, b, 6); ctx.news?.(pick([`Cúpula em ${capital(a)}: ${nm(s, D, a)} e ${nm(s, D, b)} assinam acordo de cooperação.`, `${nm(s, D, a)} e ${nm(s, D, b)} anunciam parceria estratégica.`, `Visita de Estado: líder de ${nm(s, D, b)} é recebido com honras em ${capital(a)}.`]), 'good'); continue; }
    if (kind === 'sanction' && ['liberal', 'socdem'].includes(fa) && A.gdp > 400) { const b = pick(ids.filter(x => compat(fa, famOf(s, D, x)) <= -0.45 && relAI(s, D, a, x) < 0)); if (!b) continue; (W.sanc ||= {})[a + '>' + b] = day(s); shiftRelAI(s, a, b, -10); ctx.news?.(`${nm(s, D, a)} impõe sanções a ${nm(s, D, b)} por violações de direitos humanos.`, 'warn'); continue; }
    if (kind === 'protest' && A.stab < 55) { A.stab = clamp(A.stab - 3, 5, 95); ctx.news?.(pick([`Protestos em massa em ${capital(a)} contra o governo de ${nm(s, D, a)}.`, `Greve geral paralisa ${nm(s, D, a)}.`, `Confrontos entre polícia e manifestantes deixam mortos em ${nm(s, D, a)}.`]), 'bad'); continue; }
    if (kind === 'arms' && ['expansionist', 'interventionist'].includes(postureOf(s, D, a))) { A.troops *= 1.06; A.equip = clamp(A.equip + 2, 0, 95); for (const b of nbs) if (relAI(s, D, a, b) < 0) shiftRelAI(s, a, b, -3); ctx.news?.(`${nm(s, D, a)} anuncia forte aumento dos gastos militares; vizinhos protestam.`, 'warn'); continue; }
    if (kind === 'ideo') { const b = pick(ids.filter(x => x !== a && compat(fa, famOf(s, D, x)) <= -0.5 && aiPower(W.c[x]) > 3)); if (!b) continue; shiftRelAI(s, a, b, -5); ctx.news?.(`${nm(s, D, a)} (${FAMILIES[fa].short.toLowerCase()}) chama o regime de ${nm(s, D, b)} de "${{ socialist: 'reacionário e feudal', monarchist: 'ameaça vermelha', nationalist: 'decadente', liberal: 'tirania', socdem: 'autoritário', theocratic: 'ímpio', junta: 'caótico', hybrid: 'hostil' }[fa]}".`, 'info'); continue; }
    if (kind === 'kin') { const m = ethnicIndex(s, D).minorities.find(x => x.kin === a && W.c[x.holder]); if (!m) continue; shiftRelAI(s, a, m.holder, -5 * labMul(s, 'ethnic')); ctx.news?.(`Nacionalistas em ${nm(s, D, a)} marcham pelos ${m.people} sob ${nm(s, D, m.holder)} e exigem "a volta das terras irmãs".`, 'warn'); continue; }
    if (kind === 'trade' && friendly.length) { const b = pick(friendly); A.gdp *= 1.002; shiftRelAI(s, a, b, 3); ctx.news?.(`${nm(s, D, a)} e ${nm(s, D, b)} fecham acordo comercial bilionário.`, 'good'); }
  }
}

export function weeklyGeopol(s, data, ctx) {
  const W = s.world;
  if (!W.geoInit) initGeopol(s, data);
  if (W.ver !== W._ethClaimsVer) { W._ethClaimsVer = W.ver; fixClaims(s, data); ethnicClaims(s, data, false); }
  for (const id in W.c) if (!W.c[id].posture) W.c[id].posture = defaultPosture(s, data, id);
  worldPulse(s, data, ctx);
  ideologicalAlliances(s, data, ctx);
  aiWarDecisions(s, data, ctx);
  ethnicUnrest(s, data, ctx);
  interventions(s, data, ctx);
  ideologicalDrift(s, data);
  W.chaos = (W.lab?.chaos ?? 35) >= 60 || W.chaosForced || W.chaos && !s.spectator;
  computeMeters(s, data);
}

// ---------- Controles do laboratório (Observatório) ----------
export function labAct(s, data, act, ctx) {
  const W = s.world, d = day(s);
  const mark = text => { (W.labLog ||= []).unshift({ day: d, text }); if (W.labLog.length > 60) W.labLog.length = 60; ctx.news?.('[Laboratório] ' + text, 'info'); return text; };
  switch (act.type) {
    case 'chaos': W.lab.chaos = clamp(+act.v, 0, 100); W.chaos = W.lab.chaos >= 60; return '';
    case 'mul': W.lab[act.k] = clamp(+act.v, 0, 2); return '';
    case 'posture': { const c = W.c[act.id]; if (!c || !POSTURES[act.v]) return ''; c.posture = act.v; if (act.v === 'expansionist') { c.expansionist = true; c.aggr = clamp((c.aggr || 0) + 30, 0, 100); } else c.expansionist = false; return mark(`${nm(s, data, act.id)} adota política externa ${POSTURES[act.v].name.toLowerCase()}.`); }
    case 'regime': {
      const e = entOf(s, data, act.id); if (!e) return '';
      const P = { liberal: { liberty: 82, market: 70, regime: 'dem', gov: 'parl', regimeName: 'Democracia liberal' }, socdem: { liberty: 78, market: 42, regime: 'dem', gov: 'parl', regimeName: 'Social-democracia' }, socialist: { liberty: 22, market: 18, regime: 'auth', gov: 'party', regimeName: 'Estado socialista', align: 'E' }, nationalist: { liberty: 22, market: 55, regime: 'auth', gov: 'pres', regimeName: 'Regime nacionalista' }, monarchist: { liberty: 35, market: 55, regime: 'auth', gov: 'amon', regimeName: 'Monarquia' }, theocratic: { liberty: 15, market: 35, regime: 'auth', gov: 'theo', regimeName: 'Teocracia', religiosity: 92 }, junta: { liberty: 10, market: 45, regime: 'auth', gov: 'mil', regimeName: 'Junta militar' }, hybrid: { liberty: 48, market: 55, regime: 'hybrid', gov: 'semi', regimeName: 'Regime híbrido' } }[act.v];
      if (!P) return '';
      W.ents ||= {}; W.ents[act.id] = { ...e, profile: { ...e.profile, ...P, fam: act.v } };
      if (W.leaders) W.leaders[act.id] = null;
      (W.regimeLog ||= []).unshift({ day: d, id: act.id, kind: 'lab', text: `${nm(s, data, act.id)}: ${FAMILIES[act.v].name}` });
      return mark(`${act.how === 'coup' ? 'Golpe' : act.how === 'revolution' ? 'Revolução' : 'Mudança de regime'} em ${nm(s, data, act.id)}: o país passa a ser ${FAMILIES[act.v].name.toLowerCase()}.`);
    }
    case 'war': { if (!W.c[act.a] || !W.c[act.b] || act.a === act.b) return ''; const w = startAiWar(s, data, ctx, act.a, act.b, `${nm(s, data, act.a)} declara guerra a ${nm(s, data, act.b)}`); if (w) w.lab = true; return w ? mark(`Guerra provocada: ${nm(s, data, act.a)} × ${nm(s, data, act.b)}.`) : ''; }
    case 'peace': { let n = 0; for (const w of W.wars) if (w.active && w.ai && (!act.id || [...w.a, ...w.b].includes(act.id))) { w.active = false; n++; } return n ? mark(act.id ? `Cessar-fogo imposto às guerras de ${nm(s, data, act.id)}.` : `Paz mundial imposta: ${n} guerra(s) encerrada(s).`) : ''; }
    case 'rel': { if (!W.c[act.a] || !W.c[act.b]) return ''; shiftRelAI(s, act.a, act.b, +act.v); return mark(`Relações entre ${nm(s, data, act.a)} e ${nm(s, data, act.b)} ${act.v > 0 ? 'melhoram' : 'pioram'} (${act.v > 0 ? '+' : ''}${act.v}).`); }
    case 'secede': {
      const E = ethnicIndex(s, data), x = E.stateless.find(y => y.holder === act.id && (!act.group || y.group === act.group));
      if (!x) return 'Nenhum povo sem Estado nesse país.';
      const g = x.g, mv = g.movement || { id: g.id, name: g.name, short: g.short, culture: g.culture, ideo: g.ideo, flag: g.flag, profile: g.profile };
      const id = foundState(s, data, ctx, { pids: x.provs, from: act.id, movement: mv, why: `(${g.people}) declara independência` });
      return id ? mark(`${nm(s, data, id)} proclama independência de ${nm(s, data, act.id)}.`) : '';
    }
    case 'destabilize': { const c = W.c[act.id]; if (!c) return ''; c.stab = clamp(c.stab - 30, 5, 95); return mark(`Crise interna em ${nm(s, data, act.id)}: estabilidade despenca.`); }
    case 'tension': W.tension = clamp((W.tension ?? 30) + +act.v, 0, 100); return mark(`Tensão mundial ${act.v > 0 ? 'elevada' : 'reduzida'}.`);
    case 'crisis': { const C = CRISES[act.id]; if (!C || W.crisis) return W.crisis ? 'Já há uma crise global em curso.' : ''; W.crisis = { id: act.id, weeks: C.weeks, start: d }; s.flags['gc_' + act.id] = 1; for (const c of Object.values(W.c)) c.gdp *= 1 + (C.mods.growth || 0) / 100; W.tension = clamp((W.tension ?? 30) + 6, 0, 100); ctx.news?.(C.news, 'war'); return mark(C.name + ' desencadeada.'); }
    case 'country': return labCountryAct(s, data, act, ctx, mark);
    case 'nat': { const c = W.c[act.id]; if (!c) return ''; c.nat = clamp(+act.v, 0, 100); W._ethClaimsVer = -1; return ''; }
  }
  return '';
}
