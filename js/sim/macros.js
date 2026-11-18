// Camada extra de território: macro-regiões customizadas, definidas pelo jogador no mapa-múndi
// (grupos livres de províncias, mesmo de países diferentes). Servem de foco e objetivo de guerra,
// de pacote de exigências na paz e de lente para acompanhar quem controla o quê.
import { clamp } from './util.js';
import { PLY, ownerOf, provincesOf } from './world.js';
import { WORLD_REGIONS } from './worldregions.js';

export const MACRO_COLORS = ['#e76f51', '#2a9d8f', '#8e6bbf', '#e9c46a', '#4f86c6', '#d4739f', '#6a994e', '#c97b3a', '#4aa3b5', '#a05c5c'];
const day = s => Math.floor(s.time.min / 1440);

export const macrosOf = s => (s.macros ||= []);
export const macroById = (s, id) => macrosOf(s).find(m => m.id === id);

export function saveMacro(s, { id, name, color, provs, note }) {
  const list = macrosOf(s);
  const nm = String(name || '').trim().slice(0, 40);
  if (!nm) return { ok: false, msg: 'Dê um nome à macro-região.' };
  if (!provs?.length) return { ok: false, msg: 'Selecione ao menos uma província.' };
  let m = id && list.find(x => x.id === id);
  if (m) Object.assign(m, { name: nm, color: color || m.color, provs: [...new Set(provs)], note: note || m.note || '' });
  else { m = { id: 'm' + day(s) + '_' + list.length + '_' + Math.floor(Math.random() * 1e4), name: nm, color: color || MACRO_COLORS[list.length % MACRO_COLORS.length], provs: [...new Set(provs)], note: note || '' }; list.push(m); }
  return { ok: true, msg: `Macro-região «${nm}» salva (${m.provs.length} províncias).`, macro: m };
}
export function deleteMacro(s, id) {
  const list = macrosOf(s), i = list.findIndex(x => x.id === id);
  if (i < 0) return { ok: false, msg: '?' };
  const [m] = list.splice(i, 1);
  for (const w of s.wars) if (w.macro === id) w.macro = null;
  return { ok: true, msg: `Macro-região «${m.name}» removida.` };
}

// Quem controla cada parte da macro-região (dono legal e ocupante).
export function macroControl(s, data, m) {
  const by = {}, tot = m.provs.reduce((a, p) => a + (data.geo.prov[p]?.pop || 1), 0) || 1;
  let mine = 0, occByMe = 0, occByEnemy = 0;
  for (const p of m.provs) {
    const own = ownerOf(s, data, p), w = data.geo.prov[p]?.pop || 1;
    by[own] = (by[own] || 0) + w / tot;
    if (own === PLY) mine += w / tot;
    if (s.world.occ[p] === PLY) occByMe += w / tot;
    else if (s.world.occ[p] && own === PLY) occByEnemy += w / tot;
  }
  return { by, mine, occByMe, occByEnemy, share: id => by[id] || 0 };
}

// Sugestões rápidas para montar macro-regiões: países inteiros e regiões administrativas.
export function presetProvs(data, kind, key) {
  const P = data.geo.prov;
  if (kind === 'country') return Object.keys(P).filter(p => P[p].a3 === key);
  if (kind === 'rg') { const [a3, rg] = key.split('|'); return Object.keys(P).filter(p => P[p].a3 === a3 && P[p].rg === rg); }
  if (kind === 'subregion') return Object.keys(P).filter(p => (data.reg[P[p].a3]?.regions || []).includes(key));
  if (kind === 'wr') { const ids = new Set(WORLD_REGIONS[key]?.ids || []); return Object.keys(P).filter(p => ids.has(data.geo.cOf?.[p] || P[p].a3)); }
  return [];
}
export const subregions = () => Object.entries(WORLD_REGIONS).map(([k, r]) => [k, r.name]);

// Alvos de ofensiva dentro da macro-região (usado por war.js).
export function macroTargets(s, w, list) {
  const m = w.macro && macroById(s, w.macro);
  if (!m) return list;
  const set = new Set(m.provs), inside = list.filter(p => set.has(p));
  return inside.length ? inside : list;
}
// Termo de paz: anexar o que está dentro da macro-região, ocupado por você.
export function macroTerm(s, data, w) {
  const m = w.macro && macroById(s, w.macro);
  if (!m) return null;
  const occ = m.provs.filter(p => s.world.occ[p] === PLY && w.enemies.includes(ownerOf(s, data, p)));
  const foreign = m.provs.filter(p => ownerOf(s, data, p) !== PLY && w.enemies.includes(ownerOf(s, data, p)));
  return { m, occ, foreign, share: foreign.length ? occ.length / foreign.length : 0 };
}
export const macroScoreBonus = (s, data, w) => { const t = macroTerm(s, data, w); return t ? clamp(t.share * 12, 0, 12) : 0; };
