import { esc, num, money } from './dom.js';
import { WorldMap } from './worldmap.js';
import { entityFlag, flagHTML } from './flag.js';
import { PLY, ownerOf, aiPower, defenseAllies, hash } from '../sim/world.js';
import { ent, entName } from '../sim/war.js';

const PASTEL = ['#e9e1c8', '#dfe6cf', '#e6d9cf', '#d9e1e6', '#e4dbe6', '#e6e3cf', '#d6e3da', '#e8dcd2'];
export const tintOf = id => PASTEL[Math.floor(hash(id) * PASTEL.length)];
// Estados novos ganham no mapa um tom claro da cor principal da própria bandeira.
const mix = (hex, f) => { const n = parseInt(String(hex || '#cccccc').slice(1), 16); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (255 - v) * f).toString(16).padStart(2, '0')).join(''); };
const newTint = (s, id) => { const e = s.world?.ents?.[id]; return e?.born && e.flag?.colors ? mix(e.flag.colors.find(c => !/^#f{3,6}$/i.test(c)) || e.flag.colors[0], 0.55) : null; };

export const LEGENDS = {
  macro: [['#ffd54a', 'Seleção em edição'], ['#e76f51', 'Macro-regiões suas (cada uma com sua cor)'], ['#efe3b4', 'Seu território fora de macro-regiões'], ['#e4e1d6', 'Resto do mundo']],
  political: [['#e7b730', 'Seu território'], ['#5b8fd6', 'Aliados (tratado/bloco de defesa)'], ['#9cc3ef', 'Estados clientes'], ['#a9d6a0', 'Amistosos (relação ≥ 40)'], ['#e6e1cf', 'Neutros'], ['#e7a39a', 'Rivais (relação ≤ −40)'], ['#b8342a', 'Em guerra com você'], ['url(#hatch)', 'Território ocupado']],
  relations: [['#2e8b3e', 'Muito positiva'], ['#a9d6a0', 'Positiva'], ['#e6e1cf', 'Neutra'], ['#e7a39a', 'Negativa'], ['#b8342a', 'Hostil']],
  trade: [['#e7b730', 'Você'], ['#2e8b3e', 'Acordo comercial'], ['#d46a1f', 'Sanciona você / sancionado'], ['#e6e1cf', 'Sem acordo']],
  wars: [['#e7b730', 'Você'], ['#b8342a', 'Em guerra com você'], ['#8a5fbf', 'Guerras entre outros países'], ['#5b8fd6', 'Seus aliados na guerra'], ['#e6e1cf', 'Em paz']],
  org: [['#e7b730', 'Você'], ['#2f6db5', 'Membros'], ['#9cc3ef', 'Suspensos/candidatos'], ['#e6e1cf', 'Não membros']],
  regime: [['#2f6db5', 'Democracia plena'], ['#8fb8e8', 'Democracia falha'], ['#e8d58f', 'Regime híbrido'], ['#e08a5a', 'Autoritário'], ['#8a1c1c', 'Ditadura fechada'], ['#3d4a2a', 'Junta militar']],
};

// Mundos temáticos: blocos ideológicos ganham um tom próprio no mapa político (vermelho socialista x azul capitalista).
const BLOC_TINT = { red_world: { E: '#f0b0a8', W: '#b9d3ee' }, cold_war_world: { E: '#f0b0a8', W: '#b9d3ee' } };
const blocTint = (s, data, id) => { const T = BLOC_TINT[s.world?.wscn]; if (!T) return null; const al = ent(s, data, id)?.profile?.align; return T[al === 'EL' ? 'E' : al === 'WL' ? 'W' : al] || null; };
const STAR = '<circle r="5" fill="#fff" stroke="#1d2b45" stroke-width="1.4"/><circle r="2.4" fill="#1d2b45"/>';
function relColor(r) { return r >= 60 ? '#2e8b3e' : r >= 25 ? '#a9d6a0' : r > -25 ? '#e6e1cf' : r > -60 ? '#e7a39a' : '#b8342a'; }

export function colorFn(game, mode, org) {
  const s = game.s, data = game.data;
  const allies = defenseAllies(s, data, PLY);
  const atWar = new Set(s.wars.filter(w => w.active).flatMap(w => w.enemies));
  const warAllies = new Set(s.wars.filter(w => w.active).flatMap(w => w.allies));
  const aiWar = new Set(s.world.wars.filter(w => w.active).flatMap(w => [...w.a, ...w.b]));
  const macroColor = {}; if (mode === 'macro') for (const m of s.macros || []) for (const p of m.provs) macroColor[p] = m.color;
  const draft = game._macroDraft;
  const members = org ? new Set(s.world.orgs[org]?.members || s.world.blocs.find(b => b.id === org)?.members || []) : null;
  const susp = org ? new Set([...(s.world.orgs[org]?.suspended || []), ...(data.wOrgById[org]?.candidates || [])]) : null;
  return (pid, own) => {
    if (mode === 'macro') return draft?.provs.has(pid) ? '#ffd54a' : macroColor[pid] || (own === PLY ? '#efe3b4' : '#e4e1d6');
    if (own === PLY) return '#e7b730';
    const p = s.partners[own], c = s.world.c[own];
    if (mode === 'relations') return p ? relColor(p.rel) : '#d8d8d0';
    if (mode === 'trade') return !p ? '#d8d8d0' : p.sanctionsBy || p.sanctionsOn ? '#d46a1f' : p.trade ? '#2e8b3e' : '#e6e1cf';
    if (mode === 'wars') return atWar.has(own) ? '#b8342a' : warAllies.has(own) ? '#5b8fd6' : aiWar.has(own) ? '#8a5fbf' : '#e6e1cf';
    if (mode === 'org') return members.has(own) ? '#2f6db5' : susp.has(own) ? '#9cc3ef' : '#e6e1cf';
    if (mode === 'regime') { const pr = ent(s, data, own)?.profile; if (!pr) return '#d8d8d0'; if (/junta/i.test(pr.regimeName || '')) return '#3d4a2a'; const l = pr.liberty ?? 50; return l >= 80 ? '#2f6db5' : l >= 60 ? '#8fb8e8' : l >= 40 ? '#e8d58f' : l >= 20 ? '#e08a5a' : '#8a1c1c'; }
    if (atWar.has(own)) return '#b8342a';
    if (c?.puppetOf === PLY) return '#9cc3ef';
    if (allies.has(own)) return '#5b8fd6';
    if (!p) return blocTint(s, data, own) || newTint(s, own) || tintOf(own);
    if (p.rel >= 40) return '#a9d6a0';
    if (p.rel <= -40) return '#e7a39a';
    return blocTint(s, data, own) || newTint(s, own) || tintOf(own);
  };
}

export function countryTip(game, own, pid) {
  const s = game.s, data = game.data;
  const P = pid ? data.geo.prov[pid] : null;
  if (own === PLY) return `<div class="tip-h">${flagHTML(s.nation.flag, 26)} <b>${esc(s.nation.officialName)}</b></div>${P ? `Província: ${esc(P.n)}<br>` : ''}População: ${num(s.econ.pop, 1)} mi · PIB: ${money(s.econ.gdp)}<br>Estabilidade: ${num(s.st.stability, 0)} · Apoio: ${num(s.d.support, 0)}`;
  const e = ent(s, data, own), c = s.world.c[own], p = s.partners[own];
  if (!e) return '';
  const occ = pid && s.world.occ[pid] ? `<br><b class="c-bad">Ocupada por ${esc(entName(s, data, s.world.occ[pid]))}</b>` : '';
  const prof = e.profile;
  return `<div class="tip-h">${entityFlag(e, 26, data.reg)} <b>${esc(e.name)}</b></div>${P && P.a3 !== own ? `<i>${esc(P.n)} (antes ${esc(data.reg[P.a3]?.name || P.a3)})</i><br>` : P ? `<span class="muted">${esc(P.n)}</span><br>` : ''}
    ${e.cat !== 'sovereign' ? `<span class="muted">${{ dependency: 'Território dependente', constituent: 'País constituinte', partially_recognized: 'Reconhecimento limitado', disputed_area: 'Área disputada', lease: 'Arrendamento', international: 'Território internacional' }[e.cat] || ''}${e.parent ? ' de ' + esc(data.reg[e.parent]?.name || '') : ''}</span><br>` : ''}
    ${c ? `População: ${num(c.pop, 1)} mi · PIB: ${money(c.gdp, 'US$')}<br>PIB per capita: ${num(c.gdp * 1e9 / Math.max(1, c.pop * 1e6), 0)} · Poder militar: ${num(aiPower(c), 1)}<br>` : ''}
    ${prof ? `${esc(prof.govName || '')} · ${esc(prof.regimeName || '')}<br>` : ''}${e.born ? `<b>Estado novo</b> · ${esc(e.ideo || '')} · ${esc(e.recognition || '')}<br>` : ''}${(s.world.alliances || []).filter(a => a.members.includes(own)).map(a => `Aliança: ${esc(a.name)}<br>`).join('')}
    ${p ? `Relação com você: <b class="${p.rel >= 25 ? 'c-good' : p.rel <= -25 ? 'c-bad' : ''}">${num(p.rel, 0)}</b>${p.trade ? ' · comércio' : ''}${p.pact ? ' · defesa' : ''}${p.sanctionsBy ? ' · <b class="c-bad">sanciona você</b>' : ''}` : ''}${occ}`;
}

// Mapa-múndi da campanha (instância reutilizada entre páginas).
let worldInst = null, nationInst = null;
export function mountWorld(container, game, opts = {}) {
  const geo = game.data.geo;
  const o = {
    owner: pid => ownerOf(game.s, game.data, pid), color: colorFn(game, opts.mode || 'political', opts.org),
    occupied: () => game.s.world.occ, tip: (pid, own) => countryTip(game, own, pid), provinceMode: opts.mode === 'macro',
    labelOf: id => id === PLY ? game.s.nation.shortName : entName(game.s, game.data, id),
    onClick: (pid, own) => opts.onClick?.(own, pid), onSearch: id => opts.onClick?.(id),
  };
  if (!worldInst) { const el = document.createElement('div'); worldInst = new WorldMap(el, geo, o); }
  else { Object.assign(worldInst.o, o); worldInst.el.classList.toggle('show-inner', !!o.provinceMode || worldInst.zoom() > 3); }
  container.appendChild(worldInst.el);
  worldInst.recolor();
  worldInst.setOverlay(worldOverlay(game, opts.mode));
  return worldInst;
}

function capXY(game, id) {
  const s = game.s, data = game.data;
  const pid = id === PLY ? s.nation.capitalProv : (s.world.c[id]?.capitalProv || ent(s, data, id)?.capital?.prov);
  return pid && data.geo.prov[pid] ? data.geo.prov[pid].c : ent(s, data, id)?.capital?.xy;
}
function arc(a, b, style) {
  if (!a || !b) return '';
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.min(80, Math.hypot(a[0] - b[0], a[1] - b[1]) * 0.25);
  return `<path d="M${a[0]} ${a[1]}Q${mx} ${my} ${b[0]} ${b[1]}" fill="none" ${style} pointer-events="none"/>`;
}
export function worldOverlay(game, mode) {
  const s = game.s, data = game.data, me = capXY(game, PLY);
  let out = '';
  if (mode === 'trade' || mode === 'political') for (const id in s.partners) if (s.partners[id].trade && s.world.c[id]) out += arc(me, capXY(game, id), 'stroke="#2e8b3e" stroke-width="1.1" opacity=".55" vector-effect="non-scaling-stroke"');
  if (mode === 'wars' || mode === 'political') {
    for (const w of s.wars.filter(x => x.active)) for (const e of w.enemies) out += arc(me, capXY(game, e), 'stroke="#b8342a" stroke-width="2.2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"');
    for (const w of s.world.wars.filter(x => x.active)) out += arc(capXY(game, w.a[0]), capXY(game, w.b[0]), 'stroke="#8a5fbf" stroke-width="1.8" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"');
  }
  for (const w of s.wars.filter(x => x.active)) {
    if (w.target) { const c = data.geo.prov[w.target.pid]?.c; if (c) out += `<g pointer-events="none" data-sx="${c[0]}" data-sy="${c[1]}"><circle r="6" fill="#b8342a" class="pulse"/><path d="M-4 -4L4 4M4 -4L-4 4" stroke="#fff" stroke-width="1.6"/></g>`; }
    if (w.mySiege) { const c = data.geo.prov[s.nation.capitalProv]?.c; if (c) out += `<g pointer-events="none" data-sx="${c[0]}" data-sy="${c[1]}"><circle r="14" fill="none" stroke="#b8342a" stroke-width="3" stroke-dasharray="4 3" class="pulse"/><text x="17" y="4" class="siege-lbl">CERCO</text></g>`; }
  }
  if (me) out += `<g pointer-events="none" data-sx="${me[0]}" data-sy="${me[1]}">${STAR}</g>`;
  return out;
}

// Mapa nacional: mesmas geometrias, recortado no território do jogador e colorido por métrica das regiões.
export const NATION_METRICS = {
  voc_rural: ['Economia rural'], voc_tech: ['Economia tecnológica'], voc_industrial: ['Zona industrial'], dev: ['Desenvolvimento'], aut: ['Autonomia'], sep: ['Separatismo', true],
  region: ['Regiões administrativas'], unrest: ['Tensão social', true], infra: ['Infraestrutura'], housing: ['Habitação'], pollution: ['Poluição', true], urban: ['Urbanização'], claims: ['Reivindicações estrangeiras', true], radiation: ['Radiação', true],
};
const REGION_PAL = ['#e7b730', '#d98c2b', '#c9b25a', '#e3cf7a', '#b9893a', '#f0d27a', '#c99a06', '#dcb15a', '#a87d2a', '#efc75a'];
function ramp(v, bad) { const t = Math.max(0, Math.min(1, v / 100)); const x = bad ? t : 1 - t; return x > 0.66 ? '#c0392b' : x > 0.45 ? '#e08a5a' : x > 0.3 ? '#e8c26a' : x > 0.15 ? '#a9d6a0' : '#2e8b3e'; }
const BUILDINGS_NAME = { factory: 'Polo industrial', farm: 'Complexo agrícola', mine: 'Mineração', port: 'Porto', power: 'Usina', solar: 'Parque solar', university: 'Universidade', hospital: 'Hospital', base: 'Base militar', techpark: 'Parque tecnológico', railway: 'Ferrovia', housing: 'Habitação' };
const BICON = { factory: '🏭', farm: '🌾', mine: '⛏', port: '⚓', power: '⚡', solar: '☀', university: '🎓', hospital: '✚', base: '★', techpark: '💻', railway: '🚆', housing: '🏘' };
export function mountNation(container, game, metric = 'region', onClick) {
  const s = game.s, data = game.data;
  const regOf = {};
  s.regions.forEach((r, i) => r.provinces.forEach(p => { regOf[p] = [r, i]; }));
  const claimed = new Set(s.world.claims.filter(c => c.holder === PLY && c.status === 'active').flatMap(c => c.provs));
  const o = {
    owner: pid => ownerOf(s, data, pid),
    color: (pid, own) => {
      if (own !== PLY) return s.world.occ[pid] === PLY ? '#f1dca0' : '#ece9e0';
      if (pid in (s.nuked || {})) return '#3b2418';
      const ri = regOf[pid];
      if (!ri) return '#e7b730';
      if (metric === 'region') return REGION_PAL[ri[1] % REGION_PAL.length];
      if (metric === 'claims') return claimed.has(pid) ? '#e07a5f' : '#a9d6a0';
      if (metric === 'radiation') return ramp(ri[0].radiation || 0, true);
      { const r0 = ri[0], v = metric === 'sep' ? (r0.sep || 0) * 400 : metric.startsWith('voc_') ? (r0.voc?.[metric.slice(4)] ?? 0) : r0[metric]; return ramp(v ?? 0, NATION_METRICS[metric][1]); }
    },
    occupied: () => s.world.occ, labels: false, search: false, provinceMode: true,
    tip: (pid, own) => {
      const P = data.geo.prov[pid], ri = regOf[pid];
      if (own !== PLY) return `<b>${esc(P.n)}</b><br>${esc(entName(s, data, own))}${s.world.occ[pid] === PLY ? '<br><b>Ocupada por você</b>' : ''}`;
      const r = ri?.[0];
      return `<b>${esc(P.n)}</b>${pid === s.nation.capitalProv ? ' ★ capital' : ''}<br><span class="muted">${esc(r?.name || '')}</span><br>População est.: ${num((P.pop || 0) / 1e6, 2)} mi · ${num(P.a, 0)} km²${s.world.occ[pid] ? `<br><b class="c-bad">Ocupada por ${esc(entName(s, data, s.world.occ[pid]))}</b>` : ''}${claimed.has(pid) ? '<br><span class="c-bad">Reivindicada por outro país</span>' : ''}${pid in (s.nuked || {}) ? '<br><b class="c-bad">☢ Atingida por arma nuclear</b>' : ''}${r?.radiation ? `<br>Radiação ${num(r.radiation, 0)}/100` : ''}
        ${r ? `<br>Infraestrutura ${num(r.infra, 0)} · Tensão ${num(r.unrest, 0)} · Habitação ${num(r.housing, 0)}` : ''}`;
    },
    onClick: pid => onClick?.(pid),
  };
  if (!nationInst) { const el = document.createElement('div'); nationInst = new WorldMap(el, data.geo, o); }
  else { Object.assign(nationInst.o, o); nationInst.el.classList.remove('cw-map'); nationInst.el.style.height = ''; }
  container.appendChild(nationInst.el);
  nationInst.recolor();
  const cap = data.geo.prov[s.nation.capitalProv]?.c;
  const marks = Object.entries(s.buildings || {}).map(([pid, list]) => { const c = data.geo.prov[pid]?.c; if (!c || !list.length) return ''; return `<g pointer-events="none" data-sx="${c[0]}" data-sy="${c[1]}"><circle r="6" fill="#fff" stroke="#333" stroke-width="0.8" opacity="0.9"/><text font-size="7" text-anchor="middle" dy="2.5">${list.find(b => b.active) ? BICON[list[0].type] || '•' : '⏳'}</text>${list.length > 1 ? `<text x="6" y="-4" font-size="6" font-weight="bold">${list.length}</text>` : ''}</g>`; }).join('');
  const pork = (s.pork || []).filter(x => x.status === 'open' || x.status === 'promised').map(x => { const c = data.geo.prov[x.pid]?.c; if (!c) return ''; const open = x.status === 'open'; return `<g pointer-events="none" data-sx="${c[0]}" data-sy="${c[1]}"><circle r="11" fill="none" stroke="${open ? '#c0392b' : '#d68910'}" stroke-width="1.6" stroke-dasharray="3 2"><animate attributeName="r" values="8;13;8" dur="1.6s" repeatCount="indefinite"/></circle><circle r="7" fill="${open ? '#c0392b' : '#d68910'}" stroke="#fff" stroke-width="1"/><text font-size="8" text-anchor="middle" dy="3">📢</text><text y="-12" font-size="6.5" text-anchor="middle" font-weight="bold" fill="#111" stroke="#fff" stroke-width="2" paint-order="stroke">${open ? 'Pedido' : 'Prometido'}: ${esc(BUILDINGS_NAME[x.type] || x.type)}</text></g>`; }).join('');
  nationInst.setOverlay(marks + pork + (cap ? `<g pointer-events="none" data-sx="${cap[0]}" data-sy="${cap[1]}">${STAR}</g>` : ''));
  if (!nationInst._framed || nationInst._ver !== s.world.ver) {
    requestAnimationFrame(() => { nationInst.zoomToProvinces(s.regions.flatMap(r => r.provinces), 0.12); nationInst._framed = true; nationInst._ver = s.world.ver; nationInst.updateScaled(); });
  } else requestAnimationFrame(() => nationInst.updateScaled());
  return nationInst;
}
export function resetMaps() { worldInst = null; nationInst = null; }

// Minimapa estático da região (usado nas cartas): território do jogador, região destacada e o ponto do pedido.
export function regionMiniMap(game, regionId, focus, w = 300) {
  const s = game.s, data = game.data, P = data.geo.prov;
  const mine = s.regions.flatMap(r => r.provinces).filter(p => P[p]);
  if (!mine.length) return '';
  const reg = s.regions.find(r => r.id === regionId), inReg = new Set(reg?.provinces || []);
  const pts = mine.map(p => P[p].c), xs = pts.map(c => c[0]), ys = pts.map(c => c[1]);
  const pad = Math.max(6, (Math.max(...xs) - Math.min(...xs)) * 0.12);
  const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, W = Math.max(...xs) - x0 + pad, H = Math.max(...ys) - y0 + pad;
  const fc = P[focus]?.c, sw = Math.max(W, H) / 300;
  return `<svg viewBox="${x0.toFixed(1)} ${y0.toFixed(1)} ${W.toFixed(1)} ${H.toFixed(1)}" width="${w}" style="max-width:100%;background:#dfe9f2;border-radius:6px;display:block;margin:6px 0">${mine.map(p => `<path d="${P[p].d}" fill="${p === focus ? '#c0392b' : inReg.has(p) ? '#e7b730' : '#efe6cc'}" stroke="#8a7a50" stroke-width="${sw.toFixed(2)}"/>`).join('')}
    ${fc ? `<circle cx="${fc[0]}" cy="${fc[1]}" r="${(sw * 9).toFixed(1)}" fill="none" stroke="#c0392b" stroke-width="${(sw * 2).toFixed(2)}"/><text x="${fc[0]}" y="${(fc[1] - sw * 12).toFixed(1)}" font-size="${(sw * 13).toFixed(1)}" text-anchor="middle" font-weight="bold" stroke="#fff" stroke-width="${(sw * 3).toFixed(1)}" paint-order="stroke">📢 ${esc(P[focus].n)}</text>` : ''}</svg>`;
}

