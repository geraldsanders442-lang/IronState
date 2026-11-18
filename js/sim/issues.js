import { clamp, random } from './util.js';
import { GROUPS, STAT_INFO } from './constants.js';
import { gdppc, debtRatio, atWar, militaryPower } from './model.js';
import { personName, playerCulture, cultureOf } from './names.js';
import { rightsValue } from './rights.js';
import { extraValue, stateOk } from './kinds.js';

export function pickEvent(s, data) {
  const day = Math.floor(s.time.min / 1440);
  const pending = new Set(s.issues.pending.map(p => p.id));
  const pool = data.events.filter(e => !e.chain && !pending.has(e.id) && day - (s.events.last[e.id] ?? -999) >= (e.cd ?? 120) && eligible(s, e));
  if (!pool.length) return null;
  const w = pool.map(e => (e.w || 1) * (e.cond && Object.keys(e.cond).length ? 1.8 : 1));
  let r = random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; }
  return pool.at(-1);
}

export function valueOf(s, k) {
  if (k in s.st) return s.st[k];
  if (k.startsWith('g_')) return s.groups[k.slice(2)];
  { const ex = extraValue(s, k); if (ex !== undefined) return ex; }
  switch (k) {
    case 'support': return s.d?.support ?? 50;
    case 'satisfaction': return s.d?.satisfaction ?? 50;
    case 'debtRatio': return debtRatio(s);
    case 'gdppc': return gdppc(s);
    case 'treasuryRatio': return s.econ.treasury / s.econ.gdp * 100;
    case 'foodShort': return (s.d?.foodShort || 0) * 100;
    case 'energyShort': return (s.d?.energyShort || 0) * 100;
    case 'sanctions': return s.d?.sanctions || 0;
    case 'day': return Math.floor(s.time.min / 1440);
    case 'repression': return s.d?.repression || 0;
    case 'nukeProg': return s.nuke?.prog || 0;
    case 'programs': return (s.programs || []).length;
    case 'covertOps': return Object.keys(s.world?.covert || {}).length;
    case 'tension': return s.world?.tension || 0;
    case 'aiWars': return (s.world?.wars || []).filter(w => w.active && w.ai).length;
    case 'newStates': return (s.world?.newStates || []).filter(x => s.world.c[x.id]).length;
    case 'chaos': return s.world?.chaos ? 1 : 0;
    case 'alliances': return (s.world?.alliances || []).length;
    case 'imm': case 'abuse': case 'prisoners': case 'liberty': case 'bans': case 'ethnic': case 'minorities': case 'emigrated': return rightsValue(s, k);
  }
  if (k.startsWith('ax_')) return s.nation.ideology?.axes?.[k.slice(3)] ?? 0;
  if (k.startsWith('under_')) return (s.d?.under?.[k.slice(6)] || 0) * 100;
  return 0;
}

export function eligible(s, issue) {
  const c = issue.cond || {};
  for (const k in c.min || {}) if (valueOf(s, k) < c.min[k]) return false;
  for (const k in c.max || {}) if (valueOf(s, k) > c.max[k]) return false;
  if (c.flag && !s.flags[c.flag]) return false;
  if (c.noflag && s.flags[c.noflag]) return false;
  for (const p in c.policy || {}) if (![].concat(c.policy[p]).includes(s.policies[p])) return false;
  for (const p in c.notPolicy || {}) if ([].concat(c.notPolicy[p]).includes(s.policies[p])) return false;
  if (c.war === true && !atWar(s)) return false;
  if (c.war === false && atWar(s)) return false;
  if (c.coast && !s.nation.coastal) return false;
  if (c.size && !c.size.includes(s.nation.sizeClass)) return false;
  if (c.org && !s.orgs[c.org]) return false;
  if (s.flags?.micronation && issue.cond?.flag !== 'micronation') return false; // Bir Tawil só tem questões próprias
  if (s.ascent) return false;
  if (!!c.nukeCrisis !== (s.nukeCrisis?.weeks > 0)) return false;
  if (c.nukeCapital === true && !s.nukeCrisis?.capital) return false;
  if (c.nukeCapital === false && s.nukeCrisis?.capital) return false;
  if (c.nuclear === true && !s.nation.nuclear) return false;
  if (c.nuclear === false && s.nation.nuclear) return false;
  if (c.ownBloc && !s.world?.blocs.length) return false;
  if (c.program && !(s.programs || []).some(p => p.id === c.program)) return false;
  if (c.countries && !c.countries.some(id => (s.nation.components || []).some(x => x.id === id))) return false;
  if (c.regions && !c.regions.some(r => (s.nation.regions || []).includes(r))) return false;
  if (c.notRegions && c.notRegions.some(r => (s.nation.regions || []).includes(r))) return false;
  if (c.wr && !c.wr.some(r => (s.nation.wregions || []).includes(r))) return false;
  if (c.notWr && c.notWr.some(r => (s.nation.wregions || []).includes(r))) return false;
  if (c.cold === true && !isCold(s)) return false;
  if (c.cold === false && isCold(s)) return false;
  if (c.scn && ![].concat(c.scn).includes(s.nation.scenario)) return false;
  if (c.wscn !== undefined && (c.wscn === false ? !!s.world?.wscn : ![].concat(c.wscn).includes(s.world?.wscn))) return false;
  if (!stateOk(s, c)) return false;
  if (c.island === true && !s.nation.island) return false;
  if (c.island === false && s.nation.island) return false;
  if (issue.tpl && !bindTemplate(s, issue)) return false;
  return true;
}

// Território frio: latitude média (ponderada pela área) alta. Aproximação a partir da projeção do mapa.
export function isCold(s) {
  const c = s.nation._cold, ver = s.world?.ver ?? 0;
  if (c && c.ver === ver) return c.v;
  const P = DATA?.geo.prov; let w = 0, sum = 0;
  for (const r of s.regions || []) for (const pid of r.provinces) { const p = P?.[pid]; if (!p) continue; const a = p.a || 1; w += a; sum += Math.abs((520 - p.c[1]) / 6.2) * a; }
  const v = w > 0 && sum / w >= 54;
  s.nation._cold = { ver, v };
  return v;
}

// ---------- Questões com modelo: papéis preenchidos por países, blocos e pessoas reais ----------
const NB_KEY = s => s.world?._nb || new Set();
let DATA = null;
const PLACEHOLDER = /\{(person|person2|nation|capital|leader|hitCity|hitRegion|attacker|dead|oldCapital)\}/;
export function setIssueData(d) { DATA = d; for (const i of [...d.issues, ...d.events]) if (!i.tpl && PLACEHOLDER.test(JSON.stringify(i))) i.fillOnly = true; }
const nameOf = (s, id) => DATA?.reg[id]?.name || s.world?.ents?.[id]?.name || id;
const alive = (s, id) => s.world?.c[id] && !s.world.c[id].dep;
const powerOf = c => Math.sqrt(Math.max(1, c.troops)) * (0.3 + c.equip / 100) * (0.3 + c.ready / 100) * (0.5 + c.logi / 200);
const rnd = arr => arr[Math.floor(random() * arr.length)];

function candidates(s, role, spec) {
  const W = s.world, P = s.partners;
  const nbs = [...NB_KEY(s)].filter(id => alive(s, id) && P[id]);
  const my = militaryPower(s);
  switch (role) {
    case 'nb': case 'nb2': return nbs.filter(id => spec === 'hostile' ? P[id].rel < -15 : spec === 'friendly' ? P[id].rel > 25 : spec === 'strong' ? powerOf(W.c[id]) > my : spec === 'weak' ? powerOf(W.c[id]) < my * 0.8 : spec === 'nuclear' ? W.c[id].nuclear : spec === 'democracy' ? (DATA?.reg[id]?.profile?.liberty ?? 0) > 60 : spec === 'autocracy' ? (DATA?.reg[id]?.profile?.liberty ?? 100) < 40 : true);
    case 'power': return Object.keys(W.c).filter(id => alive(s, id) && W.c[id].gdp > 1500 && P[id] && (spec === 'hostile' ? P[id].rel < -10 : spec === 'friendly' ? P[id].rel > 25 : true));
    case 'bloc': {
      const own = W.blocs.map(b => b.id), real = Object.keys(s.orgs).filter(o => !['UN', 'IMF', 'G20', 'G7'].includes(o) && !own.includes(o));
      return spec === 'own' ? own : spec === 'real' ? real : [...own, ...real];
    }
    case 'blocMember': {
      const ids = [...W.blocs.flatMap(b => b.members), ...Object.keys(s.orgs).filter(o => !['UN', 'IMF', 'G20', 'G7'].includes(o)).flatMap(o => W.orgs[o]?.members || [])].filter(id => id !== 'PLY' && alive(s, id));
      return [...new Set(ids)];
    }
    case 'outsideBloc': return Object.keys(W.orgs).filter(o => !s.orgs[o] && !['UN', 'IMF'].includes(o) && W.orgs[o].members.some(m => NB_KEY(s).has(m)));
    case 'claimant': return [...new Set(W.claims.filter(c => c.holder === 'PLY' && c.status === 'active' && alive(s, c.claimant)).map(c => c.claimant))];
    case 'target': return [...new Set(W.claims.filter(c => c.claimant === 'PLY' && c.status === 'active' && alive(s, c.holder)).map(c => c.holder))];
    case 'enemy': return s.wars.filter(w => w.active).map(w => w.enemy);
    case 'ally': return Object.keys(P).filter(id => alive(s, id) && (P[id].pact || W.c[id].puppetOf === 'PLY'));
    case 'sanctioner': return Object.keys(P).filter(id => alive(s, id) && P[id].sanctionsBy);
    case 'aiWar': return W.wars.filter(w => w.active && w.ai && alive(s, w.a[0]) && alive(s, w.b[0])).map(w => w.id);
    case 'region': return s.regions.filter(r => spec === 'separatist' ? (r.sep || 0) >= 0.3 : spec === 'poor' ? r.infra < 40 : !r.cap).map(r => r.id);
    case 'newstate': return (W.newStates || []).map(x => x.id).filter(id => alive(s, id) && P[id] && (spec === 'near' ? NB_KEY(s).has(id) : spec === 'friendly' ? P[id].rel > 10 : spec === 'hostile' ? P[id].rel < -20 : true));
    case 'covert': return Object.keys(W.covert || {}).filter(id => alive(s, id) && ((W.covert[id].militia || 0) > 10 || (W.covert[id].party || 0) > 10));
  }
  return [];
}

const W_members = (s, id) => s.world.blocs.find(x => x.id === id)?.members || s.world.orgs[id]?.members || [];
export function bindTemplate(s, iss, preset) {
  if (!s.world) return null;
  const b = {};
  for (const role in iss.tpl) {
    if (preset?.[role] != null && (!/^[A-Z]{2,4}\d*$/.test(preset[role]) || alive(s, preset[role]))) { b[role] = preset[role]; continue; }
    let list = candidates(s, role, iss.tpl[role]);
    if (role === 'nb2') list = list.filter(x => x !== b.nb);
    if (role === 'blocMember' && b.bloc) { const m = W_members(s, b.bloc); list = list.filter(x => m.includes(x)); }
    if (!list.length) return null;
    b[role] = rnd(list);
  }
  return b;
}


// ---------- Artigos e contrações em português ("da Ucrânia", "no Brasil", "em Portugal") ----------
const NOART = new Set('Portugal Israel Cuba Angola Moçambique Andorra Mónaco Mônaco Singapura Malta Chipre Omã Taiwan Macau Madagáscar Madagascar Liechtenstein Barém Bahrein Granada Barbados Tuvalu Nauru Kiribati Palau Samoa Tonga Vanuatu Fiji Gibraltar Aruba Curaçau Guam Honduras Dominica Jersey Guernsey Niue Mayotte Montserrat Anguila'.split(' '));
const NOART_FULL = new Set(['Cabo Verde', 'São Tomé e Príncipe', 'Timor-Leste', 'Hong Kong', 'Porto Rico', 'San Marino', 'Santa Lúcia', 'São Vicente e Granadinas', 'São Cristóvão e Neves', 'Antígua e Barbuda', 'El Salvador', 'Trindade e Tobago', 'Costa do Marfim']);
const MASC = new Set('Camboja Quénia Quênia Gana Uganda Ruanda Botsuana Botswana Panamá Canadá Malawi Malaui Benim Togo Saara'.split(' '));
const FEM = new Set('Guiné Guiné-Bissau Reunião'.split(' '));
const PLUR = { Filipinas: 'as', Maldivas: 'as', Bahamas: 'as', Seicheles: 'as', Seychelles: 'as', Comores: 'as', Camarões: 'os', Bermudas: 'as', Malvinas: 'as' };
const FIRST = { República: 'a', Reino: 'o', Estados: 'os', Ilhas: 'as', Emirados: 'os', Federação: 'a', Confederação: 'a', Principado: 'o', União: 'a', Grão: 'o', Sultanato: 'o', Organização: 'a', Comunidade: 'a', Liga: 'a', Aliança: 'a', Conselho: 'o', Mercado: 'o', Associação: 'a', Acordo: 'o', Tratado: 'o', Banco: 'o', Fundo: 'o', Grupo: 'o', Cooperação: 'a', Bloco: 'o', Pacto: 'o', Frente: 'a', Movimento: 'o', Zona: 'a', Parceria: 'a', Comissão: 'a', Fórum: 'o', Países: 'os', Territórios: 'os', Região: 'a', Sri: 'o', Burkina: 'o', Costa: 'a', Nova: 'a', Arábia: 'a', África: 'a', Coreia: 'a', Guiné: 'a', Papua: 'a', Bósnia: 'a', Macedónia: 'a', Macedônia: 'a', Ossétia: 'a', Polinésia: 'a', Serra: 'a' };
export function artOf(n) {
  if (!n) return '';
  if (NOART_FULL.has(n) || NOART.has(n)) return '';
  if (PLUR[n]) return PLUR[n];
  const w = n.split(/[\s-]/)[0];
  if (FIRST[w]) return FIRST[w];
  if (/^[A-Z0-9]{2,}$/.test(n)) return 'o';
  if (MASC.has(w)) return 'o';
  if (FEM.has(w)) return 'a';
  return /a$/.test(w) ? 'a' : 'o';
}
const CONTR = { de: { o: 'do', a: 'da', os: 'dos', as: 'das', '': 'de' }, em: { o: 'no', a: 'na', os: 'nos', as: 'nas', '': 'em' }, a: { o: 'ao', a: 'à', os: 'aos', as: 'às', '': 'a' }, por: { o: 'pelo', a: 'pela', os: 'pelos', as: 'pelas', '': 'por' } };
const PREP = { de: 'de', do: 'de', da: 'de', dos: 'de', das: 'de', em: 'em', no: 'em', na: 'em', nos: 'em', nas: 'em', a: 'a', ao: 'a', à: 'a', aos: 'a', às: 'a', por: 'por', pelo: 'por', pela: 'por', pelos: 'por', pelas: 'por' };
const ADD = new Set(['com', 'contra', 'para', 'entre', 'até', 'sobre']);
function grammar(str, arts) {
  return str.replace(/(^|[^\p{L}])(\p{L}+) \{([a-zA-Z0-9]+)\}/gu, (all, pre, word, key) => {
    if (!(key in arts)) return all;
    const art = arts[key], lw = word.toLowerCase(), cap = word[0] !== lw[0];
    const up = x => cap ? x[0].toUpperCase() + x.slice(1) : x;
    if (PREP[lw]) return `${pre}${up(CONTR[PREP[lw]][art])} {${key}}`;
    if ((lw === 'o' || lw === 'a') && ['bloc', 'outsideBloc'].includes(key)) return `${pre}${art ? up(art) + ' ' : ''}{${key}}`;
    if (ADD.has(lw) && art) return `${pre}${word} ${art} {${key}}`;
    return all;
  });
}

function fill(s, b) {
  const W = s.world, map = {};
  const put = (k, v) => { map['{' + k + '}'] = v; };
  for (const role of Object.keys(b)) {
    const id = b[role];
    if (role === 'bloc' || role === 'outsideBloc') { const o = DATA.wOrgById[id] || W.blocs.find(x => x.id === id); put(role, o?.name || id); continue; }
    if (role === 'aiWar') { const w = W.wars.find(x => x.id === id); put('aiA', nameOf(s, w.a[0])); put('aiB', nameOf(s, w.b[0])); b.aiA = w.a[0]; b.aiB = w.b[0]; continue; }
    if (role === 'region') { const r = s.regions.find(x => x.id === id); put('region', r?.name || ''); continue; }
    put(role, nameOf(s, id));
    if (role === 'claimant') { const c = W.claims.find(x => x.claimant === id && x.holder === 'PLY' && x.status === 'active'); put('claimProv', DATA.geo.prov[c?.provs?.[0]]?.n || 'a região'); b.claim = c?.id; }
    if (role === 'target') { const c = W.claims.find(x => x.claimant === 'PLY' && x.holder === id && x.status === 'active'); put('targetProv', DATA.geo.prov[c?.provs?.[0]]?.n || 'a região'); b.claim = c?.id; }
  }
  const cul = playerCulture(s, DATA);
  put('person', personName(cul)); put('person2', personName(cul));
  if (b.nb) put('nbPerson', personName(cultureOf(DATA, b.nb)));
  put('nation', s.nation.shortName); put('capital', s.nation.capital); put('leader', s.nation.leader);
  const nk = s.nukeCrisis || {};
  if (nk.by) b.attacker = nk.by;
  if (nk.city) { put('hitCity', nk.city); put('hitRegion', nk.regionName); put('attacker', nameOf(s, nk.by)); put('dead', nk.dead >= 1 ? nk.dead.toFixed(1).replace('.', ',') + ' milhão(ões)' : Math.round(nk.dead * 1000) + ' mil'); put('oldCapital', nk.oldCapital || nk.city); }
  map._arts = {};
  for (const k of ['nb', 'nb2', 'power', 'bloc', 'outsideBloc', 'aiA', 'aiB', 'claimant', 'target', 'enemy', 'ally', 'sanctioner', 'blocMember', 'covert', 'nation', 'region', 'attacker', 'newstate']) if (map['{' + k + '}'] != null) map._arts[k] = artOf(map['{' + k + '}']);
  return map;
}

export function instantiate(s, iss, preset) {
  const b = bindTemplate(s, iss, preset);
  if (!b) return null;
  const map = fill(s, b);
  const sub = str => typeof str === 'string' ? grammar(str, map._arts).replace(/\{[a-zA-Z0-9]+\}/g, m => map[m] ?? m) : str;
  const res = v => typeof v === 'string' && v.startsWith('$') ? (b[v.slice(1)] ?? v) : v;
  const inst = JSON.parse(JSON.stringify(iss));
  inst.id = iss.id + '~' + Math.floor(random() * 1e6);
  inst.base = iss.id; inst.dyn = true; inst.bind = b;
  for (const k of ['title', 'desc', 'context']) inst[k] = sub(inst[k]);
  for (const o of inst.options) {
    o.text = sub(o.text); o.hint = sub(o.hint); if (o.headline) o.headline = sub(o.headline);
    if (o.rel) { const r = {}; for (const k in o.rel) r[res(k)] = o.rel[k]; o.rel = r; }
    if (o.act) for (const k in o.act) o.act[k] = res(o.act[k]);
  }
  delete inst.tpl;
  return inst;
}

// Urgência: quanto mais a situação ultrapassa as condições da questão, mais provável ela é.
function urgency(s, iss) {
  const c = iss.cond || {};
  let u = 0;
  for (const k in c.min || {}) { const v = valueOf(s, k), m = c.min[k]; u += Math.min(2, Math.max(0, v - m) / Math.max(5, Math.abs(m) * 0.5)); }
  for (const k in c.max || {}) { const v = valueOf(s, k), m = c.max[k]; u += Math.min(2, Math.max(0, m - v) / Math.max(5, Math.abs(m) * 0.5)); }
  if (c.war || c.flag) u += 1;
  if (iss.tpl) u += 0.8;
  return 1 + u;
}

export function pickIssue(s, data) {
  const day = Math.floor(s.time.min / 1440);
  const pendingIds = new Set(s.issues.pending.map(p => p.id));
  const pendingBase = new Set(s.issues.pending.map(p => p.id.split('~')[0]));
  // Categorias que saíram nas últimas cartas pesam menos (variedade); cada questão vista pesa menos a cada repetição.
  const recent = (s.issues.recentCats ||= []);
  const seen = (s.issues.seen ||= {}), seenT = (s.issues.seenT ||= {}), tkey = i => (i.title || '').replace(/\{[^}]+\}/g, '').replace(/\d+/g, '').slice(0, 32);
  for (const mult of [1, 0.5, 0.2, 0.05]) {
    const pool = data.issues.filter(i => !i.chain && !pendingIds.has(i.id) && !pendingBase.has(i.id) && day - (s.issues.last[i.id] ?? -9999) >= (i.cd ?? 300) * mult && eligible(s, i));
    if (!pool.length) continue;
    const weights = pool.map(i => {
      const last = s.issues.last[i.id], n = seen[i.id] || 0;
      const fresh = last == null ? 2 : Math.min(1, (day - last) / 540);
      const catRep = recent.filter(c => c === i.cat).length;
      const nT = seenT[tkey(i)] || 0, dip = i.cat === 'Diplomacia' ? 0.6 : 1;
      return (i.w || 1) * dip * urgency(s, i) * fresh / (1 + n * 0.7) / (1 + catRep * 1.1) / (1 + nT * 1.3);
    });
    let r = random() * weights.reduce((a, b) => a + b, 0);
    let chosen = pool[pool.length - 1];
    for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) { chosen = pool[i]; break; } }
    seen[chosen.id] = (seen[chosen.id] || 0) + 1; seenT[tkey(chosen)] = (seenT[tkey(chosen)] || 0) + 1;
    recent.push(chosen.cat); if (recent.length > 12) recent.shift();
    return chosen.tpl || chosen.fillOnly ? instantiate(s, chosen) : chosen;
  }
  return null;
}

const label = k => STAT_INFO[k]?.[0] || GROUPS[k]?.name || k;

// Quatro questões por dia: efeitos imediatos são frações, e o efeito de longo prazo de cada questão substitui a escolha anterior.
export const SCALE = { stat: 1, group: 1, money: 0.16, macro: 0.3 };

export function applyEffects(s, eff, data, srcName = '', srcId = '') {
  const out = [];
  const g = s.econ.gdp, K = srcId && !eff.raw ? SCALE : { stat: 1, group: 1, money: 1, macro: 1 };
  for (const k in eff.now || {}) {
    const raw = eff.now[k];
    const v = +(raw * (['treasury', 'debt', 'reserves'].includes(k) ? K.money : ['gdp', 'pop'].includes(k) ? K.macro : k === 'troops' ? 1 : K.stat)).toFixed(3);
    if (k === 'treasury') { s.econ.treasury += g * v / 100; out.push(['Tesouro', v, '% PIB']); }
    else if (k === 'debt') { s.econ.debt = Math.max(0, s.econ.debt + g * v / 100); out.push(['Dívida', v, '% PIB']); }
    else if (k === 'gdp') { s.econ.gdp *= 1 + v / 100; out.push(['PIB', v, '%']); }
    else if (k === 'reserves') { s.econ.reserves = Math.max(0, s.econ.reserves + g * v / 100); out.push(['Reservas', v, '% PIB']); }
    else if (k === 'pop') { s.econ.pop *= 1 + v / 100; out.push(['População', v, '%']); }
    else if (k === 'support') { for (const gr in s.groups) s.groups[gr] = clamp(s.groups[gr] + v, 0, 100); out.push(['Todos os grupos', v, '']); }
    else if (k in s.st) {
      const lim = ['growth', 'inflation', 'unemployment', 'migration', 'troops'].includes(k) ? [-50, 500] : [0, 100];
      if (k === 'troops') s.st.troops = Math.max(0, s.st.troops * (1 + v / 100));
      else s.st[k] = clamp(s.st[k] + v, lim[0], lim[1]);
      out.push([label(k), v, k === 'troops' ? '%' : '']);
    }
  }
  for (const gr in eff.groups || {}) {
    const v = eff.groups[gr] * K.group;
    s.groups[gr] = clamp(s.groups[gr] + v, 0, 100);
    out.push([GROUPS[gr].name, v, '']);
  }
  if (srcId) s.longMods = s.longMods.filter(m => m.id !== srcId);
  for (const m of eff.long || []) {
    s.longMods.push({ k: m.k, v: m.v, d: m.d || 0, left: m.d || 0, src: srcName, id: srcId || undefined });
    out.push([label(m.k.replace(/^g_/, '')) + (m.d ? ` (${m.d} dias)` : ' (permanente)'), m.v, 'tendência']);
  }
  for (const p in eff.policy || {}) {
    s.policies[p] = eff.policy[p];
    const pol = data.policies.find(x => x.id === p);
    out.push([`Lei: ${pol.name}`, pol.levels.find(l => l.id === eff.policy[p]).name, 'policy']);
  }
  for (const id in eff.rel || {}) {
    const v = eff.rel[id];
    const targets = relTargets(s, data, id);
    for (const t of targets) if (s.partners[t]) s.partners[t].rel = clamp(s.partners[t].rel + v, -100, 100);
    out.push([`Relações: ${relName(id, data, s)}`, v, '']);
  }
  for (const f of eff.flags?.set || []) s.flags[f] = (s.flags[f] || 0) + 1;
  for (const f of eff.flags?.clear || []) delete s.flags[f];
  return out;
}

const OLD_IDS = { usa: 'USA', china: 'CHN', uk: 'GBR', germany: 'DEU', russia: 'RUS', japan: 'JPN', india: 'IND', brazil: 'BRA' };
const alignOf = (data, id, s) => { const e = data.reg[id] || s?.world?.ents?.[id]; return e?.profile?.align || data.reg[e?.parent]?.profile?.align; };
export function rivalOf(s) {
  let best = null, v = 999;
  for (const id of s.world?._nb || []) if (s.partners[id] && s.partners[id].rel < v) { v = s.partners[id].rel; best = id; }
  if (!best) for (const id in s.partners) if (s.partners[id].rel < v && s.world.c[id] && !s.world.c[id].dep) { v = s.partners[id].rel; best = id; }
  return best;
}
export function relTargets(s, data, id) {
  const all = Object.keys(s.partners);
  if (id === 'all') return all;
  if (id === 'west') return all.filter(x => ['W', 'WL'].includes(alignOf(data, x, s)) && (s.world.c[x]?.gdp || 0) > 200);
  if (id === 'east') return all.filter(x => ['E', 'EL'].includes(alignOf(data, x, s)));
  if (id === 'sul') return all.filter(x => alignOf(data, x, s) === 'N' && (s.world.c[x]?.gdp || 0) > 200);
  if (id === 'neighbors') return [...(s.world?._nb || [])];
  if (id === 'rival') { const r = rivalOf(s); return r ? [r] : []; }
  const bl = s.world?.blocs?.find(b => b.id === id) || s.world?.orgs?.[id];
  if (bl) return bl.members.filter(m => m !== 'PLY');
  return [OLD_IDS[id] || id];
}

function relName(id, data, s) {
  if (id === 'all') return 'todos';
  if (id === 'west') return 'Ocidente';
  if (id === 'east') return 'Bloco oriental';
  if (id === 'sul') return 'Sul global';
  if (id === 'neighbors') return 'vizinhos';
  if (id === 'rival') return data.reg[rivalOf(s)]?.name || 'rival';
  const bl = s.world?.blocs?.find(b => b.id === id);
  if (bl || data.wOrgById?.[id]) return 'membros de ' + (bl?.name || data.wOrgById[id].name);
  const x = OLD_IDS[id] || id;
  return data.reg[x]?.name || s.world?.ents?.[x]?.name || x;
}

export function issueGroupsImpact(opt) {
  const res = { up: [], down: [] };
  const all = { ...(opt.groups || {}) };
  for (const m of opt.long || []) if (m.k.startsWith('g_')) all[m.k.slice(2)] = (all[m.k.slice(2)] || 0) + m.v;
  for (const g in all) (all[g] > 0 ? res.up : res.down).push(GROUPS[g]?.name || g);
  return res;
}
