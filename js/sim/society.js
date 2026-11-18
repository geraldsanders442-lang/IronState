// Sociedade: grupos étnicos e religiosos por região (aproximação a partir da cultura dominante de cada área)
// e a imprensa como personagem (jornais e TVs com linha editorial própria).
import { clamp, chance, rand, pick } from './util.js';
import { cultureOf } from './names.js';

const day = s => Math.floor(s.time.min / 1440);
export const PEOPLE = { pt_br: 'brasileiros', pt: 'portugueses', es: 'hispânicos', fr: 'francófonos', it: 'italianos', de: 'germânicos', nl: 'neerlandeses', nordic: 'escandinavos', fi: 'fino-úgricos', en: 'anglófonos', pl: 'poloneses', cz: 'tchecos e eslovacos', ru: 'russos', uk: 'ucranianos', yu: 'eslavos do sul', sq: 'albaneses', bg: 'búlgaros', ro: 'romenos', hu: 'húngaros', el: 'gregos', tr: 'turcos', cau: 'caucasianos', ca: 'centro-asiáticos', ar: 'árabes', fa: 'persas', he: 'judeus israelenses', hi: 'indianos', bn: 'bengaleses', ur: 'paquistaneses', zh: 'chineses', ja: 'japoneses', ko: 'coreanos', vi: 'vietnamitas', th: 'tailandeses', ms: 'malaios', fil: 'filipinos', af_e: 'povos da África Oriental', af_w: 'povos da África Ocidental', af_s: 'povos da África Austral', et: 'etíopes', so: 'somalis', bal: 'bálticos', mn: 'mongóis', pac: 'povos do Pacífico' };
export const FAITH = { pt_br: 'cristãos', pt: 'católicos', es: 'católicos', fr: 'católicos e laicos', it: 'católicos', de: 'protestantes e laicos', nl: 'laicos', nordic: 'luteranos e laicos', fi: 'luteranos', en: 'protestantes e laicos', pl: 'católicos', cz: 'laicos', ru: 'ortodoxos', uk: 'ortodoxos', yu: 'ortodoxos e católicos', sq: 'muçulmanos', bg: 'ortodoxos', ro: 'ortodoxos', hu: 'católicos', el: 'ortodoxos', tr: 'muçulmanos', cau: 'muçulmanos e cristãos', ca: 'muçulmanos', ar: 'muçulmanos', fa: 'muçulmanos xiitas', he: 'judeus', hi: 'hindus', bn: 'muçulmanos', ur: 'muçulmanos', zh: 'tradições chinesas e laicos', ja: 'xintoístas e budistas', ko: 'cristãos e budistas', vi: 'budistas', th: 'budistas', ms: 'muçulmanos', fil: 'católicos', af_e: 'cristãos e muçulmanos', af_w: 'muçulmanos e cristãos', af_s: 'cristãos', et: 'ortodoxos e muçulmanos', so: 'muçulmanos', bal: 'luteranos e católicos', mn: 'budistas', pac: 'cristãos' };

export function initSociety(s, data) {
  const capR = s.regions.find(r => r.cap) || s.regions[0];
  const cul = p => cultureOf(data, data.geo.prov[p]?.a3 || 'BRA');
  const major = r => { const c = {}; for (const p of r.provinces) c[cul(p)] = (c[cul(p)] || 0) + (data.geo.prov[p].pop || 1); return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || 'en'; };
  const natCul = capR ? major(capR) : 'en';
  for (const r of s.regions) {
    if (r.culture) continue;
    r.culture = major(r);
    r.people = PEOPLE[r.culture] || r.culture;
    r.faith = FAITH[r.culture] || 'diversos';
    r.minority = r.culture !== natCul;
    if (r.minority) r.sep = (r.sep || 0) + 0.1;
  }
  s.nation.people = PEOPLE[natCul] || natCul;
  s.press ||= initPress(s);
}
function initPress(s) {
  const cap = s.nation.capital, n = s.nation.shortName;
  return [
    { id: 'p0', name: `O Correio de ${cap}`, kind: 'jornal', stance: 'independente', reach: 30 },
    { id: 'p1', name: `TV ${n}`, kind: 'TV', stance: s.policies.press === 'state' ? 'governista' : 'governista', reach: 45 },
    { id: 'p2', name: 'Folha Livre', kind: 'site', stance: s.policies.press === 'state' ? 'fechado' : 'oposição', reach: 25 },
  ];
}
export function weeklySociety(s, data, ctx) {
  if (!s.press) initSociety(s, data);
  for (const r of s.regions) if (!r.culture) { initSociety(s, data); break; }
  const support = s.d?.support ?? 50, pressLaw = s.policies.press;
  for (const o of s.press) {
    if (o.stance === 'fechado') { if (pressLaw === 'free' && chance(0.05)) { o.stance = 'oposição'; ctx.news(`${o.name} volta a circular.`, 'info'); } continue; }
    if (pressLaw === 'state') { o.stance = 'governista'; continue; }
    if (o.bought) continue;
    const target = support > 60 ? 'governista' : support < 35 ? 'oposição' : o.stance;
    if (target !== o.stance && chance(0.08)) { o.stance = target; ctx.news(`${o.name} muda de linha e passa a ${target === 'governista' ? 'apoiar' : 'criticar'} o governo.`, 'info'); }
    o.reach = clamp(o.reach + rand(-0.5, 0.5) + (o.kind === 'site' ? 0.1 : -0.05), 5, 80);
  }
  const net = s.press.reduce((a, o) => a + o.reach * (o.stance === 'governista' ? 1 : o.stance === 'oposição' ? -1 : 0), 0);
  s.longMods = s.longMods.filter(m => m.id !== 'press');
  s.longMods.push({ k: 'legitimacy', v: +(net / 40).toFixed(2), d: 0, left: 0, src: 'Linha editorial da imprensa', id: 'press' });
}
export function pressAction(s, id, act) {
  const o = s.press.find(x => x.id === id); if (!o) return { ok: false, msg: '?' };
  const g = s.econ.gdp;
  if (act === 'court') { s.econ.treasury -= g * 0.0004; if (chance(0.6)) { o.stance = 'independente'; return { ok: true, msg: `Entrevistas exclusivas e publicidade oficial amaciam ${o.name}.`, log: true }; } return { ok: false, msg: `${o.name} recusa a aproximação e publica que foi cortejado.` }; }
  if (act === 'buy') { s.econ.treasury -= g * 0.0015; o.stance = 'governista'; o.bought = true; s.st.corruption = clamp(s.st.corruption + 2, 0, 100); o.reach = clamp(o.reach - 5, 5, 80); return { ok: true, msg: `Um empresário amigo compra ${o.name}. A linha editorial muda da noite para o dia.`, log: true }; }
  if (act === 'sue') { s.st.political = clamp(s.st.political - 2, 0, 100); s.st.reputation = clamp(s.st.reputation - 1, 0, 100); o.reach = clamp(o.reach - 8, 5, 80); return { ok: true, msg: `Processos milionários contra ${o.name}.`, log: true }; }
  if (act === 'close') { if (s.policies.press === 'free') return { ok: false, msg: 'Com imprensa livre, fechar um veículo exige mudar a lei.' }; o.stance = 'fechado'; s.st.political = clamp(s.st.political - 4, 0, 100); s.st.reputation = clamp(s.st.reputation - 4, 0, 100); s.groups.youth = clamp(s.groups.youth - 3, 0, 100); return { ok: true, msg: `${o.name} é fechado por ordem do governo.`, log: true }; }
  return { ok: false, msg: '?' };
}
