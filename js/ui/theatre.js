// Teatro de operações: linha de frente, setas de ofensiva e pressão inimiga, marcadores de corpos e municípios tomados.
import { esc } from './dom.js';
import { lucidePath } from './lucide.js';
import { munisOf } from '../sim/munis.js';
import { ownerOf, PLY } from '../sim/world.js';

const badge = (c, path, color, n, label) => c ? `<g pointer-events="none" data-sx="${c[0]}" data-sy="${c[1]}"><circle r="11" fill="#fff" stroke="${color}" stroke-width="2"/><g transform="translate(-7 -8) scale(.58)" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${path}</g><text y="19" font-size="9" font-weight="bold" text-anchor="middle" fill="${color}" stroke="#fff" stroke-width="2.5" paint-order="stroke">${esc(label || n)}</text></g>` : '';

export function theatre(game, w) {
  const s = game.s, data = game.data, P = data.geo.prov, W = s.world;
  const own = pid => W.occ[pid] ?? ownerOf(s, data, pid);
  const side = pid => { const o = own(pid); return o === PLY ? 'me' : w.enemies.includes(o) ? 'en' : null; };
  const front = [], touch = new Set();
  for (const e of data.geo.edges) { if (!e[1]) continue; const a = side(e[0]), b = side(e[1]); if (a && b && a !== b) { front.push(e[2]); touch.add(e[0]); touch.add(e[1]); } }
  const near = (T, want) => { const c = P[T.pid]?.c; if (!c) return null; let best = null, bd = 1e9; for (const n of P[T.pid].nb || []) { if (side(n) !== want || !P[n]) continue; const d = Math.hypot(P[n].c[0] - c[0], P[n].c[1] - c[1]); if (d < bd) { bd = d; best = n; } } return best; };
  const arrow = (from, to, color, id) => from && to ? `<line x1="${P[from].c[0]}" y1="${P[from].c[1]}" x2="${P[to].c[0]}" y2="${P[to].c[1]}" stroke="${color}" stroke-width="3.4" stroke-linecap="round" marker-end="url(#${id})" opacity=".92" vector-effect="non-scaling-stroke" pointer-events="none"/>` : '';
  const cells = (T, mine) => {
    const Pv = T && P[T.pid]; if (!Pv || !T.order) return '';
    const M = munisOf(Pv), taken = new Set(T.order.slice(0, T.k ?? Math.floor(T.p / 100 * M.cells.length)));
    return M.cells.map(c => `<path d="${c.d}" fill="${taken.has(c.i) ? (mine ? 'rgba(231,183,48,.78)' : 'rgba(192,57,43,.7)') : 'rgba(255,255,255,.1)'}" stroke="${mine ? '#7a4b00' : '#7a1d12'}" stroke-width="1" vector-effect="non-scaling-stroke" fill-rule="evenodd" pointer-events="none"><title>${esc(c.name)} · ${taken.has(c.i) ? (mine ? 'tomado por você' : 'tomado pelo inimigo') : 'em disputa'}</title></path>`).join('');
  };
  const corps = (s.forces?.corps || []).filter(c => c.war === w.id), att = corps.filter(c => c.role === 'attack').length, dfn = corps.filter(c => c.role === 'defend').length;
  let svg = `<defs><marker id="arrA" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#d9a600"/></marker><marker id="arrE" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#c0392b"/></marker></defs>`;
  svg += cells(w.target, true) + cells(w.target2, true) + cells(w.etarget, false) + cells(w.etarget2, false);
  svg += front.map(d => `<path d="${d}" fill="none" stroke="#fff" stroke-width="5" opacity=".7" vector-effect="non-scaling-stroke" pointer-events="none"/><path d="${d}" fill="none" stroke="#c0392b" stroke-width="2.6" stroke-dasharray="7 4" vector-effect="non-scaling-stroke" pointer-events="none"/>`).join('');
  const from1 = w.target && near(w.target, 'me'), from2 = w.target2 && near(w.target2, 'me'), fromE = w.etarget && near(w.etarget, 'en'), fromE2 = w.etarget2 && near(w.etarget2, 'en');
  svg += arrow(from1, w.target?.pid, '#d9a600', 'arrA') + arrow(from2, w.target2?.pid, '#d9a600', 'arrA') + arrow(fromE, w.etarget?.pid, '#c0392b', 'arrE') + arrow(fromE2, w.etarget2?.pid, '#c0392b', 'arrE');
  if (w.target) svg += badge(P[from1 || w.target.pid]?.c, lucidePath('swords'), '#9a6b00', att, `${att} corpo${att === 1 ? '' : 's'}`);
  if (w.target2) svg += badge(P[from2 || w.target2.pid]?.c, lucidePath('swords'), '#9a6b00', att, '2ª frente');
  if (w.etarget) svg += badge(P[w.etarget.pid]?.c, lucidePath('shield'), '#1b4f9c', dfn, `${dfn} corpo${dfn === 1 ? '' : 's'}`);
  if (w.mySiege && P[s.nation.capitalProv]) svg += badge(P[s.nation.capitalProv].c, lucidePath('castle'), '#c0392b', '', 'CAPITAL SITIADA');
  const focus = new Set([...touch, ...(w.target ? [w.target.pid] : []), ...(w.target2 ? [w.target2.pid] : []), ...(w.etarget ? [w.etarget.pid] : [])]);
  return { svg, focus: [...focus] };
}
