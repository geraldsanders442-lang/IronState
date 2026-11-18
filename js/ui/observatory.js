// Observatório (modo espectador / laboratório geopolítico) no MESMO layout do modo clássico: barra superior com
// relógio e indicadores, ticker de manchetes, menu lateral e páginas com painéis, tabelas e gráficos.
// Usa os elementos #topbar, #ticker, #sidebar e #main do jogo, mas com páginas próprias (data-ogo): o jogo
// clássico não é alterado.
import { $, esc, num, money, modal, toast, ICONS } from './dom.js';
import { WorldMap } from './worldmap.js';
import { entityFlag, flagHTML } from './flag.js';
import { tintOf } from './mapviews.js';
import { mountLine, barsHTML, pieSVG, PALETTE } from './charts.js';
import { fmtDate, dateOf, fmtMonth } from '../sim/util.js';
import { PLY, ownerOf, aiPower, relAI, provincesOf, RANK_INFO } from '../sim/world.js';
import { entName } from '../sim/war.js';
import { leaderOf } from '../sim/worldlife.js';
import { FAMILIES, POSTURES, famOf, postureOf, nationalismOf, ethnicIndex, compat } from '../sim/geopol.js';

const SPEEDS = [[30, '1 mês / 30 s'], [15, '1 mês / 15 s'], [6, '1 mês / 6 s'], [2, 'Turbo (2 s)']];
const MAPMODES = [['political', 'Político'], ['ideology', 'Ideologias'], ['posture', 'Política externa'], ['wars', 'Guerras'], ['alliances', 'Alianças'], ['ethnic', 'Etnias e tensões'], ['relations', 'Relações'], ['before', 'Mapa inicial']];
const PCOL = { isolationist: '#8d99ae', neutral: '#cfd8c4', aligned: '#7fb3d5', interventionist: '#e59866', expansionist: '#b03a2e' };
const ALC = ['#2e86ab', '#e4572e', '#76b041', '#9b5de5', '#f4a259', '#17bebb', '#bc4b51', '#5b8e7d', '#f15bb5', '#ffc914', '#8d6a9f', '#3d5a80'];
const NAV = [
  ['Observatório', [['painel', 'Painel', 'overview'], ['mapa', 'Mapa-múndi', 'map'], ['jornal', 'Jornal', 'reports'], ['graficos', 'Gráficos e dados', 'stats']]],
  ['Mundo', [['paises', 'Países', 'encyclopedia'], ['guerras', 'Guerras', 'military'], ['diplomacia', 'Diplomacia e alianças', 'diplomacy'], ['ideologias', 'Ideologias', 'politics'], ['etnias', 'Etnias e tensões', 'regions'], ['rankings', 'Rankings', 'rankings']]],
  ['Laboratório', [['lab', 'Regras e intervenções', 'research'], ['comparar', 'Antes × depois', 'analysis'], ['config', 'Configurações', 'options']]],
];
const mix = (hex, f) => { const n = parseInt(String(hex || '#cccccc').slice(1), 16); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (255 - v) * f).toString(16).padStart(2, '0')).join(''); };
const DEF_CFG = { speed: 30, pauseWar: false, pauseState: true, pauseRegime: false, paperMonthly: false, ticker: true, mapMode: 'political', labels: true };

export function mountObservatory(game, { onExit }) {
  const S = () => game.s, D = () => game.data, W = () => game.s.world;
  const cfg = () => (W().obsCfg ||= { ...DEF_CFG });
  const O = { page: 'painel', arg: null, playing: false, elapsed: 0, busy: false, sel: null, mode: cfg().mapMode, sort: ['gdp', -1], filt: { q: '', cont: '', fam: '', post: '' } };
  const nm = id => id === PLY ? 'Observatório' : entName(S(), D(), id);
  const ent = id => S().world.ents?.[id] || D().reg[id];
  const fl = (id, w = 16) => entityFlag(ent(id), w, D().reg);
  const alive = () => Object.keys(W().c).filter(id => !W().c[id].dep);
  let map = null, mapEl = null, timer = null;

  // ---------- Barra superior, ticker e menu (classes do modo clássico) ----------
  function renderTop() {
    const s = S(), M = W().meters || {}, d = game.day;
    const months = Math.round((d - (W().obsStart?.day || 0)) / 30.4);
    const chips = [];
    if (M.wars) chips.push([`${M.wars} GUERRA(S)`, M.wars >= 6 ? '' : 'warn']);
    if (W().crisis) chips.push(['CRISE GLOBAL', '']);
    if ((M.tension ?? 0) > 70) chips.push(['TENSÃO EXTREMA', '']); else if ((M.tension ?? 0) > 50) chips.push(['Tensão alta', 'warn']);
    if ((M.chaos ?? 0) > 70) chips.push(['MUNDO EM CAOS', '']);
    const k = (lab, v, tip, col) => `<div class="kpi" data-tip="${esc(tip)}">${lab}<b${col ? ` style="color:${col}"` : ''}>${v}</b></div>`;
    $('#topbar').innerHTML = `<button class="hamb" data-hamb aria-label="Menu">☰</button>
      <div class="nation"><span class="obs-eye">◉</span><div><div class="nm">Observatório</div><div class="sub">${esc(worldName())} · ${months} mês(es) de observação</div></div></div>
      <div class="clock"><div style="min-width:150px"><div class="date">${fmtDate(d, true)}</div><div class="next">Semana ${game.week + 1}${O.playing ? ' · avançando' : ' · pausado'}</div><div class="cd"><i data-prog style="width:${O.playing ? Math.min(100, O.elapsed / cfg().speed * 100) : 0}%"></i></div></div>
        <button class="endturn" data-oplay data-tip="Avanço rápido (barra de espaço)">${O.playing ? '❚❚ Pausar' : '▶ Avançar'}</button>
        <select data-ospeed>${SPEEDS.map(([v, n]) => `<option value="${v}" ${cfg().speed === v ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <button data-ostep="week" data-tip="Avança uma semana (Enter)">+1 sem.</button><button data-ostep="month" data-tip="Avança um mês">+1 mês</button></div>
      <div class="alerts">${chips.map(([t, c]) => `<span class="alert-chip ${c}">${t}</span>`).join('')}</div>
      <div class="kpis">${k('Caos mundial', num(M.chaos, 0), 'Guerras, golpes, secessões e crises recentes', M.chaos > 60 ? '#ff9b8f' : M.chaos > 35 ? '#ffe08a' : '#9be3a5')}${k('Tensão', num(M.tension, 0), 'Risco de guerra entre as potências', M.tension > 60 ? '#ff9b8f' : M.tension > 35 ? '#ffe08a' : '#9be3a5')}${k('Guerras', M.wars ?? 0, 'Conflitos ativos')}${k('Polarização', num(M.polarization, 0), 'Pares de potências ideologicamente hostis')}${k('Democracias', num(M.democracy, 0) + '%', 'Países liberais ou social-democratas')}${k('Países', M.countries ?? 0, 'Estados soberanos existentes')}</div>`;
  }
  const worldName = () => S().world.cwdef?.name || D().worldScenarios?.find(x => x.id === S().world.wscn)?.name || 'Mundo real';
  function renderTicker() {
    const t = $('#ticker'); if (!t) return;
    if (!cfg().ticker) { t.innerHTML = ''; t.style.display = 'none'; return; }
    t.style.display = '';
    const items = headlines(40, 16).map(l => `<span class="tk-${l.type}">◆ ${esc(l.text)}</span>`).join('');
    t.innerHTML = `<b>AO VIVO</b><div class="tk-wrap"><div class="tk-run" style="animation-duration:${Math.max(40, items.length / 40)}s">${items}${items}</div></div>`;
  }
  function renderNav() {
    let html = '';
    for (const [sec, items] of NAV) {
      html += `<div class="sec">${sec}</div>`;
      for (const [id, name, ic] of items) {
        const badge = id === 'guerras' && W().meters?.wars ? `<span class="badge">${W().meters.wars}</span>` : '';
        html += `<a href="#" data-ogo="${id}" class="${id === O.page ? 'active' : ''}"><svg viewBox="0 0 20 20">${ICONS[ic] || ICONS.reports}</svg>${name}${badge}</a>`;
      }
    }
    html += `<div class="sec">Partida</div><a href="#" data-omenu="save"><svg viewBox="0 0 20 20">${ICONS.options}</svg>Salvar agora</a><a href="#" data-omenu="exit"><svg viewBox="0 0 20 20">${ICONS.overview}</svg>Voltar ao menu</a>`;
    $('#sidebar').innerHTML = html;
    $('#sidebar').classList.remove('open'); $('#nav-backdrop')?.classList.remove('open');
    const bn = $('#bottomnav'); if (bn) bn.innerHTML = [['painel', 'Painel', 'overview'], ['mapa', 'Mapa', 'map'], ['jornal', 'Jornal', 'reports'], ['lab', 'Lab', 'research']].map(([id, n, ic]) => `<button data-ogo="${id}" class="${id === O.page ? 'active' : ''}"><svg viewBox="0 0 20 20">${ICONS[ic]}</svg>${n}</button>`).join('') + '<button data-hamb aria-label="Menu"><svg viewBox="0 0 20 20"><path d="M3 5h14M3 10h14M3 15h14"/></svg>Menu</button>';
  }

  // ---------- Notícias ----------
  const TYPE_W = { war: 4, bad: 3, good: 2, warn: 2, info: 1 };
  const headlines = (days = 31, n = 12) => { const d = game.day; return S().log.filter(l => l.day > d - days && l.type !== 'decision' && !/^\[Laboratório\]/.test(l.text)).map((l, i) => ({ ...l, w: (TYPE_W[l.type] || 1) * 10 - i * 0.05 + (/Guerra!|GOLPE|REVOLUÇÃO|independência|anexa|Nasce a|esmaga/.test(l.text) ? 15 : 0) })).sort((a, b) => b.w - a.w).slice(0, n); };

  // ---------- Mapa ----------
  function colorFn() {
    const s = S(), data = D(), Wd = s.world, mode = O.mode;
    const warA = new Set(Wd.wars.filter(w => w.active).flatMap(w => w.a)), warB = new Set(Wd.wars.filter(w => w.active).flatMap(w => w.b));
    const alIdx = {}; (Wd.alliances || []).forEach((a, i) => a.members.forEach(m => { alIdx[m] = i; }));
    let ethP = null;
    if (mode === 'ethnic') { const E = ethnicIndex(s, data); ethP = {}; for (const x of E.stateless) for (const p of x.provs) ethP[p] = '#e08a2b'; for (const m of E.minorities) for (const p of m.provs) ethP[p] = Wd.claims.some(c => c.src === 'ethnic' && c.holder === m.holder && c.claimant === m.kin) ? '#c0392b' : '#e6a3a3'; }
    const before = Wd.obsStart?.owner || {};
    return (pid, own) => {
      if (own === PLY) return '#d8d8d0';
      if (mode === 'before') { const o = before[pid] || data.geo.prov[pid].a3; return O.sel && o === O.sel ? '#ffd54a' : tintOf(o); }
      if (O.sel && own === O.sel && mode !== 'relations') return '#ffd54a';
      const e = ent(own);
      if (!e || !Wd.c[own]) return '#e6e1cf';
      switch (mode) {
        case 'ideology': return FAMILIES[famOf(s, data, own)].color;
        case 'posture': return PCOL[postureOf(s, data, own)] || '#ddd';
        case 'wars': return warA.has(own) ? '#b8342a' : warB.has(own) ? '#d98c2b' : '#e6e1cf';
        case 'alliances': return alIdx[own] != null ? ALC[alIdx[own] % ALC.length] : '#e6e1cf';
        case 'ethnic': return ethP[pid] || '#e9e6dc';
        case 'relations': { if (!O.sel) return tintOf(own); if (own === O.sel) return '#ffd54a'; const r = relAI(s, data, O.sel, own); return r >= 60 ? '#2e8b3e' : r >= 25 ? '#a9d6a0' : r > -25 ? '#e6e1cf' : r > -60 ? '#e7a39a' : '#b8342a'; }
        default: { if (e.born && e.flag?.colors) return mix(e.flag.colors.find(c => !/^#f{3,6}$/i.test(c)) || e.flag.colors[0], 0.5); if (e.custom && e.flag?.colors) return mix(e.flag.colors[0], 0.45); return tintOf(own); }
      }
    };
  }
  const capXY = id => { const pid = W().c[id]?.capitalProv || ent(id)?.capital?.prov; return pid && D().geo.prov[pid] ? D().geo.prov[pid].c : ent(id)?.capital?.xy; };
  const arc = (a, b, st) => { if (!a || !b) return ''; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.min(80, Math.hypot(a[0] - b[0], a[1] - b[1]) * 0.25); return `<path d="M${a[0]} ${a[1]}Q${mx} ${my} ${b[0]} ${b[1]}" fill="none" ${st} pointer-events="none"/>`; };
  function overlay() {
    const Wd = W(); let out = '';
    if (O.mode !== 'before') for (const w of Wd.wars.filter(x => x.active)) out += arc(capXY(w.a[0]), capXY(w.b[0]), 'stroke="#8a1c1c" stroke-width="2" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"');
    if (O.sel) { const c = capXY(O.sel); if (c) out += `<g pointer-events="none" data-sx="${c[0]}" data-sy="${c[1]}"><circle r="6" fill="#fff" stroke="#1d2b45" stroke-width="2"/><circle r="2.5" fill="#1d2b45"/></g>`; }
    return out;
  }
  function tip(pid, own) {
    const s = S(), data = D(), P = data.geo.prov[pid];
    if (own === PLY) return '<b>Estação do Observatório</b>';
    const e = ent(own), c = s.world.c[own]; if (!e) return esc(P.n);
    const f = c ? famOf(s, data, own) : null;
    return `<div class="tip-h">${fl(own, 26)} <b>${esc(e.name)}</b></div><span class="muted">${esc(P.n)}${P.o3 && P.o3 !== own ? ' · origem: ' + esc(data.reg[P.o3]?.name || P.o3) : ''}</span><br>
      ${f ? `${esc(FAMILIES[f].name)} · ${esc(POSTURES[postureOf(s, data, own)]?.name || '')}<br>População: ${num(c.pop, 1)} mi · PIB: ${money(c.gdp, 'US$')}<br>Poder militar: ${num(aiPower(c), 1)} · Estabilidade: ${num(c.stab, 0)}` : ''}
      ${(s.world.alliances || []).filter(a => a.members.includes(own)).map(a => `<br>Aliança: ${esc(a.name)}`).join('')}${s.world.wars.some(w => w.active && [...w.a, ...w.b].includes(own)) ? '<br><b class="c-bad">Em guerra</b>' : ''}${s.world.occ[pid] ? `<br><b class="c-bad">Ocupada por ${esc(nm(s.world.occ[pid]))}</b>` : ''}`;
  }
  // Uma só instância do mapa, reaproveitada entre páginas (mantém zoom e posição).
  function mountMap(container, { height } = {}) {
    if (!mapEl) {
      mapEl = document.createElement('div');
      const data = D();
      map = new WorldMap(mapEl, data.geo, {
        owner: pid => O.mode === 'before' ? (W().obsStart?.owner?.[pid] || data.geo.prov[pid].a3) : ownerOf(S(), D(), pid),
        color: colorFn(), occupied: () => O.mode === 'before' ? {} : W().occ, tip: (pid, own) => tip(pid, own),
        labelOf: id => id === PLY ? '' : (O.mode === 'before' ? (W().obsStart?.names?.[id] || D().reg[id]?.name || id) : nm(id)),
        onClick: (pid, own) => { if (own === PLY || !W().c[own]) return; O.sel = own; redrawMap(); showSel(); },
        onSearch: id => { if (W().c[id]) { O.sel = id; redrawMap(); showSel(); } },
      });
    }
    mapEl.style.height = height || '';
    container.appendChild(mapEl);
    redrawMap();
    return map;
  }
  function redrawMap() { if (!map) return; map.o.color = colorFn(); map.o.labels = cfg().labels; map.recolor(); map.setOverlay(overlay()); const lg = $('[data-olegend]'); if (lg) lg.innerHTML = legendHTML(); }
  function legendHTML() {
    const L = O.mode === 'ideology' ? Object.entries(FAMILIES).map(([k, f]) => [f.color, `${f.name} (${W().meters?.fams?.[k] || 0})`])
      : O.mode === 'posture' ? Object.entries(POSTURES).map(([k, p]) => [PCOL[k], p.name])
      : O.mode === 'wars' ? [['#b8342a', 'Atacantes'], ['#d98c2b', 'Defensores'], ['#e6e1cf', 'Em paz']]
      : O.mode === 'ethnic' ? [['#e08a2b', 'Povos sem Estado (Mapuches, Curdos, Sámi...)'], ['#c0392b', 'Minorias reivindicadas pelo Estado-mãe'], ['#e6a3a3', 'Outras minorias']]
      : O.mode === 'relations' ? [['#2e8b3e', 'Aliado'], ['#a9d6a0', 'Amistoso'], ['#e6e1cf', 'Neutro'], ['#e7a39a', 'Tenso'], ['#b8342a', 'Hostil'], ['#ffd54a', O.sel ? nm(O.sel) : 'Clique num país']]
      : O.mode === 'before' ? [['#ffd54a', 'Fronteiras no início da observação']]
      : O.mode === 'alliances' ? (W().alliances || []).slice(0, 14).map((a, i) => [ALC[i % ALC.length], a.name]) : [['#ffd54a', 'País selecionado'], ['url(#hatch)', 'Território ocupado']];
    return L.map(([c, t]) => `<span><i style="background:${c.startsWith('url') ? 'repeating-linear-gradient(45deg,#7a1d12 0 2px,transparent 2px 5px)' : c}"></i>${esc(t)}</span>`).join('');
  }
  const modeSeg = () => `<div class="seg" style="flex-wrap:wrap">${MAPMODES.map(([k, n]) => `<button data-omode="${k}" class="${k === O.mode ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  function showSel() {
    const box = $('[data-oselbox]'); if (!box) return;
    box.innerHTML = O.sel ? countryMini(O.sel) : '<p class="small muted">Clique num país do mapa para ver os dados e abrir a ficha completa.</p>';
  }
  function countryMini(id) {
    const s = S(), data = D(), c = W().c[id]; if (!c) return '';
    const f = famOf(s, data, id), L = leaderOf(s, id);
    return `<div class="row" style="gap:8px;flex-wrap:nowrap;align-items:center">${fl(id, 54)}<div><b style="font-size:15px">${esc(nm(id))}</b><div class="small">${esc(L?.name || '')}</div><div><span class="tag" style="background:${FAMILIES[f].color};color:#fff">${esc(FAMILIES[f].name)}</span> <span class="tag">${esc(POSTURES[postureOf(s, data, id)]?.name || '')}</span></div></div></div>
      <table class="data small" style="margin-top:6px"><tr><td>População</td><td class="num">${num(c.pop, 1)} mi</td></tr><tr><td>PIB</td><td class="num">${money(c.gdp, 'US$')}</td></tr><tr><td>Poder militar</td><td class="num">${num(aiPower(c), 1)}</td></tr><tr><td>Estabilidade</td><td class="num">${num(c.stab, 0)}</td></tr><tr><td>Nacionalismo</td><td class="num">${num(nationalismOf(s, data, id), 0)}</td></tr></table>
      <div class="row" style="gap:4px;margin-top:6px"><button class="small primary" data-ogo="pais:${id}">Ficha completa</button><button class="small" data-omode="relations">Ver relações</button></div>`;
  }

  // ---------- Páginas ----------
  const PAGES = {
    painel(el) {
      const s = S(), Wd = W(), M = Wd.meters || {}, H = headlines(31, 9), wars = Wd.wars.filter(w => w.active);
      const status = M.wars >= 8 || M.tension > 75 ? ['Mundo em guerra', 'c-bad'] : M.wars >= 3 || M.tension > 55 ? ['Tenso', 'c-warn'] : ['Estável', 'c-good'];
      const meter = (lab, v, col, hint) => `<div class="row" style="gap:8px;margin:4px 0;flex-wrap:nowrap"><span style="width:150px" data-tip="${esc(hint)}">${lab}</span><div class="bar" style="flex:1;height:12px"><i style="width:${Math.min(100, v || 0)}%;background:${col}"></i></div><b style="width:36px;text-align:right">${num(v, 0)}</b></div>`;
      el.innerHTML = `<div class="panel banner"><span class="obs-eye" style="font-size:54px;color:#c9a227">◉</span><div style="flex:1"><div class="title">${esc(worldName())}</div><div class="motto">"Ver o mundo agir sozinho"</div>
          <div class="small" style="margin-top:4px">Observando desde <b>${fmtDate(Wd.obsStart?.day || 0, true)}</b> · ${M.countries} países · ${M.alliances} alianças · ${M.newStates} Estados novos · caos da IA ${Wd.lab?.chaos ?? 35}/100</div></div>
          <div class="right small"><div><b>${fmtDate(game.day, true)}</b></div><div>Semana ${game.week + 1}</div><div style="margin-top:4px">Situação: <b class="${status[1]}">${status[0]}</b></div></div></div>
        <div class="grid" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)">
          <div class="panel tight"><div class="row small" style="justify-content:space-between;margin-bottom:4px"><b>Mapa-múndi</b>${modeSeg()}</div><div data-omap class="obs-map-dash"></div><div class="obs-legend2" data-olegend></div></div>
          <div><div class="panel"><h3>Medidores do mundo</h3>${meter('Caos mundial', M.chaos, '#c0392b', 'Guerras, golpes, secessões e crises recentes')}${meter('Tensão', M.tension, '#e67e22', 'Risco de guerra entre potências')}${meter('Polarização ideológica', M.polarization, '#8e44ad', 'Pares de potências ideologicamente hostis')}${meter('Nacionalismo', M.nationalism, '#34495e', 'Média ponderada pela população')}${meter('Democracias (%)', M.democracy, '#2f6db5', 'Países liberais ou social-democratas')}</div>
            <div class="panel"><h3>Selecionado</h3><div data-oselbox></div></div></div></div>
        <div class="grid g3">
          <div class="panel"><h3>Manchetes do mês</h3>${H.length ? `<div class="obs-lead-l">${esc(H[0].text)}</div>` + H.slice(1).map(l => `<div class="obs-n obs-${l.type}"><small>${fmtDate(l.day)}</small> ${esc(l.text)}</div>`).join('') : '<p class="muted small">Nada ainda — avance o tempo.</p>'}<button class="small" data-ogo="jornal" style="margin-top:6px">Abrir o jornal</button></div>
          <div class="panel"><h3>Conflitos ativos (${wars.length})</h3>${warsMini(wars.slice(0, 8))}<button class="small" data-ogo="guerras" style="margin-top:6px">Todas as guerras</button></div>
          <div class="panel"><h3>Ideologias no mundo</h3>${pieSVG(Object.entries(FAMILIES).map(([k, f]) => ({ label: f.short, value: M.fams?.[k] || 0, color: f.color })).filter(x => x.value), 130)}</div></div>
        <div class="grid g3"><div class="panel"><div data-och="chaos"></div></div><div class="panel"><div data-och="wars"></div></div><div class="panel"><h3>Mudanças de regime</h3>${(Wd.regimeLog || []).slice(0, 7).map(r => `<div class="small">${fl(r.id, 14)} <span class="muted">${fmtDate(r.day)}</span> ${esc(r.text)}</div>`).join('') || '<p class="small muted">Nenhuma ainda.</p>'}</div></div>`;
      mountMap(el.querySelector('[data-omap]')); showSel();
      const MH = Wd.meterHist || [];
      mountLine(el.querySelector('[data-och="chaos"]'), { title: 'Caos e tensão', series: [{ name: 'Caos', color: '#c0392b', data: MH.map(r => [r[0], r[1]]) }, { name: 'Tensão', color: '#e67e22', data: MH.map(r => [r[0], r[2]]) }], height: 130, yMin: 0, yMax: 100, yFmt: v => num(v, 0) });
      mountLine(el.querySelector('[data-och="wars"]'), { title: 'Guerras ativas', series: [{ name: 'Guerras', color: '#7a1d12', data: MH.map(r => [r[0], r[3]]) }], height: 130, yMin: 0, yFmt: v => num(v, 0) });
    },
    mapa(el) {
      el.innerHTML = `<h2>Mapa-múndi</h2><div class="panel tight"><div class="row" style="justify-content:space-between;gap:6px;flex-wrap:wrap">${modeSeg()}<label class="small"><input type="checkbox" data-ocfg="labels" ${cfg().labels ? 'checked' : ''}> nomes dos países</label></div></div>
        <div class="grid" style="grid-template-columns:minmax(0,3fr) minmax(260px,1fr)"><div class="panel tight"><div data-omap class="obs-map-big"></div><div class="obs-legend2" data-olegend></div></div><div class="panel"><h3>País selecionado</h3><div data-oselbox></div></div></div>`;
      mountMap(el.querySelector('[data-omap]')); showSel();
    },
    jornal(el, i = O.arg != null ? +O.arg : -1) {
      const eds = W().editions || [];
      const cur = { label: 'Edição de hoje', lines: headlines(31, 12).map(l => ({ t: l.text, k: l.type })), meters: W().meters };
      const E = i < 0 ? cur : eds[i] || cur;
      const [lead, ...rest] = E.lines;
      el.innerHTML = `<h2>Jornal</h2><div class="panel tight"><div class="seg" style="flex-wrap:wrap"><button data-ogo="jornal:-1" class="${i < 0 ? 'on' : ''}">Hoje</button>${eds.slice(0, 24).map((e, j) => `<button data-ogo="jornal:${j}" class="${j === i ? 'on' : ''}">${esc(e.label)}</button>`).join('')}</div></div>
        <div class="panel obs-paper"><div class="obs-mast"><small>${esc(fmtDate(game.day, true))}</small><h1>O Observador Mundial</h1><small>${esc(E.label)}</small></div>
        ${lead ? `<h2 class="obs-ph">${esc(lead.t)}</h2>` : '<h2 class="obs-ph">Mês tranquilo no mundo.</h2>'}<div class="obs-cols">${rest.map(l => `<p class="obs-${l.k}">${esc(l.t)}</p>`).join('')}</div>
        <div class="small muted" style="border-top:1px solid #0002;margin-top:8px;padding-top:4px">Caos ${num(E.meters?.chaos, 0)} · tensão ${num(E.meters?.tension, 0)} · ${E.meters?.wars ?? 0} guerras · polarização ${num(E.meters?.polarization, 0)} · democracias ${num(E.meters?.democracy, 0)}%</div></div>
        <div class="panel"><h3>Todas as notícias recentes</h3><table class="data small">${S().log.filter(l => l.day > game.day - 62 && l.type !== 'decision').slice(0, 60).map(l => `<tr><td style="white-space:nowrap">${fmtDate(l.day)}</td><td class="${l.type === 'war' || l.type === 'bad' ? 'c-bad' : l.type === 'good' ? 'c-good' : ''}">${esc(l.text)}</td></tr>`).join('')}</table></div>`;
    },
    graficos(el) {
      const Wd = W(), MH = Wd.meterHist || [], H = Wd.obsHist || { days: [], c: {}, fams: [] };
      const sel = O.cmp ||= [...alive()].sort((a, b) => Wd.c[b].gdp - Wd.c[a].gdp).slice(0, 4), metric = O.metric ||= '1';
      const MET = { 1: 'PIB (bi US$)', 2: 'Estabilidade', 3: 'Poder militar', 4: 'População (mi)', 5: 'Províncias' };
      el.innerHTML = `<h2>Gráficos e dados</h2>
        <div class="grid g2"><div class="panel"><div data-och="m1"></div></div><div class="panel"><div data-och="m2"></div></div><div class="panel"><div data-och="m3"></div></div><div class="panel"><div data-och="fam"></div></div></div>
        <div class="panel"><h3>Comparar países</h3><div class="row" style="gap:6px;flex-wrap:wrap"><select data-ometric>${Object.entries(MET).map(([k, n]) => `<option value="${k}" ${metric === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
          <select data-oaddcmp><option value="">+ adicionar país</option>${[...alive()].sort((a, b) => nm(a).localeCompare(nm(b), 'pt')).map(id => `<option value="${id}">${esc(nm(id))}</option>`).join('')}</select>
          ${sel.map(id => `<span class="tag">${fl(id, 14)} ${esc(nm(id))} <a href="#" data-ormcmp="${id}">×</a></span>`).join('')}</div><div data-och="cmp"></div>
          <p class="small muted">Os dados por país são registrados uma vez por mês desde o início da observação.</p></div>
        <div class="panel"><div data-och="top"></div></div>`;
      const ser = (i, name, color) => ({ name, color, data: MH.map(r => [r[0], r[i]]) });
      mountLine(el.querySelector('[data-och="m1"]'), { title: 'Caos, tensão e polarização', series: [ser(1, 'Caos', '#c0392b'), ser(2, 'Tensão', '#e67e22'), ser(5, 'Polarização', '#8e44ad')], yMin: 0, yMax: 100, yFmt: v => num(v, 0) });
      mountLine(el.querySelector('[data-och="m2"]'), { title: 'Nacionalismo e democracias (%)', series: [ser(4, 'Nacionalismo', '#34495e'), ser(6, 'Democracias', '#2f6db5')], yMin: 0, yMax: 100, yFmt: v => num(v, 0) });
      mountLine(el.querySelector('[data-och="m3"]'), { title: 'Guerras ativas', series: [ser(3, 'Guerras', '#7a1d12')], yMin: 0, yFmt: v => num(v, 0) });
      mountLine(el.querySelector('[data-och="fam"]'), { title: 'Países por família ideológica', series: Object.entries(FAMILIES).map(([k, f]) => ({ name: f.short, color: f.color, data: H.days.map((d, i) => [d, H.fams[i]?.[k] || 0]) })), yMin: 0, yFmt: v => num(v, 0) });
      mountLine(el.querySelector('[data-och="cmp"]'), { title: MET[metric], series: sel.map((id, i) => ({ name: nm(id), color: PALETTE[i % PALETTE.length], data: (H.c[id] || []).map(r => [r[0], r[+metric]]) })), yFmt: v => num(v, metric === '1' ? 0 : 1) });
      const top = [...alive()].sort((a, b) => Wd.c[b].gdp - Wd.c[a].gdp).slice(0, 8);
      mountLine(el.querySelector('[data-och="top"]'), { title: 'PIB das 8 maiores economias (bi US$)', series: top.map((id, i) => ({ name: nm(id), color: PALETTE[i % PALETTE.length], data: (H.c[id] || []).map(r => [r[0], r[1]]) })), yFmt: v => num(v, 0) });
    },
    paises(el) {
      const s = S(), data = D(), Wd = W(), F = O.filt, q = F.q.toLowerCase();
      const conts = [...new Set(alive().map(id => (data.reg[id] || data.reg[ent(id)?.origin] || data.reg[ent(id)?.secededFrom])?.continent).filter(Boolean))].sort();
      const contOf = id => (data.reg[id] || data.reg[ent(id)?.origin] || data.reg[ent(id)?.secededFrom])?.continent;
      const al = {}; for (const a of Wd.alliances || []) for (const m of a.members) al[m] = a.name;
      const war = new Set(Wd.wars.filter(w => w.active).flatMap(w => [...w.a, ...w.b]));
      const rows = alive().map(id => { const c = Wd.c[id]; return { id, name: nm(id), fam: famOf(s, data, id), post: postureOf(s, data, id), pop: c.pop, gdp: c.gdp, gdppc: c.gdp * 1e3 / Math.max(0.01, c.pop), pow: aiPower(c), stab: c.stab, nat: nationalismOf(s, data, id), prov: provincesOf(s, data, id).length }; })
        .filter(r => (!q || r.name.toLowerCase().includes(q)) && (!F.cont || contOf(r.id) === F.cont) && (!F.fam || r.fam === F.fam) && (!F.post || r.post === F.post));
      const [sk, sd] = O.sort; rows.sort((a, b) => (typeof a[sk] === 'string' ? a[sk].localeCompare(b[sk], 'pt') : a[sk] - b[sk]) * sd);
      const th = (k, n) => `<th class="${typeof rows[0]?.[k] === 'number' ? 'num' : ''}" data-osort="${k}" style="cursor:pointer">${n}${sk === k ? (sd > 0 ? ' ▲' : ' ▼') : ''}</th>`;
      el.innerHTML = `<h2>Países (${rows.length})</h2><div class="panel tight"><div class="row" style="gap:6px;flex-wrap:wrap"><input data-ofilt="q" placeholder="Buscar país…" value="${esc(F.q)}">
        <select data-ofilt="cont"><option value="">Todos os continentes</option>${conts.map(c => `<option ${F.cont === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
        <select data-ofilt="fam"><option value="">Todas as ideologias</option>${Object.entries(FAMILIES).map(([k, f]) => `<option value="${k}" ${F.fam === k ? 'selected' : ''}>${f.name}</option>`).join('')}</select>
        <select data-ofilt="post"><option value="">Todas as posturas</option>${Object.entries(POSTURES).map(([k, p]) => `<option value="${k}" ${F.post === k ? 'selected' : ''}>${p.name}</option>`).join('')}</select></div></div>
        <div class="panel tight" style="overflow-x:auto"><table class="data small"><tr>${th('name', 'País')}${th('fam', 'Regime')}${th('post', 'Política externa')}${th('pop', 'População (mi)')}${th('gdp', 'PIB')}${th('gdppc', 'PIB per capita')}${th('pow', 'Poder')}${th('stab', 'Estab.')}${th('nat', 'Nacion.')}${th('prov', 'Prov.')}<th>Aliança</th></tr>
        ${rows.map(r => `<tr data-ogo="pais:${r.id}" style="cursor:pointer"><td>${fl(r.id, 16)} ${esc(r.name)}${war.has(r.id) ? ' <span class="tag red">guerra</span>' : ''}</td><td><span style="color:${FAMILIES[r.fam].color}">■</span> ${esc(FAMILIES[r.fam].short)}</td><td>${esc(POSTURES[r.post]?.name || '')}</td><td class="num">${num(r.pop, 1)}</td><td class="num">${money(r.gdp, 'US$')}</td><td class="num">${num(r.gdppc, 0)}</td><td class="num">${num(r.pow, 1)}</td><td class="num">${num(r.stab, 0)}</td><td class="num">${num(r.nat, 0)}</td><td class="num">${r.prov}</td><td class="small">${esc(al[r.id] || '')}</td></tr>`).join('')}</table></div>`;
    },
    pais(el, id = O.arg) {
      const s = S(), data = D(), Wd = W(), c = Wd.c[id];
      if (!c) { el.innerHTML = `<h2>${esc(nm(id))}</h2><div class="panel"><p>Este país não existe mais.</p><button data-ogo="paises">← Países</button></div>`; return; }
      O.sel = id;
      const e = ent(id), f = famOf(s, data, id), L = leaderOf(s, id);
      const wars = Wd.wars.filter(w => w.active && [...w.a, ...w.b].includes(id));
      const nb = [...new Set(provincesOf(s, data, id).flatMap(p => data.geo.prov[p].nb).map(p => ownerOf(s, data, p)))].filter(o => o !== id && o !== PLY && Wd.c[o]);
      const others = [...new Set([...nb, ...alive().sort((a, b) => aiPower(Wd.c[b]) - aiPower(Wd.c[a])).slice(0, 30)])].filter(x => x !== id);
      const rels = others.map(o => [o, relAI(s, data, id, o)]).sort((a, b) => b[1] - a[1]);
      const E = ethnicIndex(s, data);
      const mins = [...E.stateless.filter(x => x.holder === id).map(x => [x.people, 'povo sem Estado', x.provs.length]), ...E.minorities.filter(x => x.holder === id).map(x => [x.people, 'Estado-mãe: ' + nm(x.kin), x.provs.length])];
      const kin = E.minorities.filter(x => x.kin === id).map(x => [x.people, nm(x.holder), x.provs.length]);
      const claims = Wd.claims.filter(x => x.status === 'active' && (x.claimant === id || x.holder === id));
      const als = (Wd.alliances || []).filter(a => a.members.includes(id));
      el.innerHTML = `<div class="row" style="gap:6px;margin-bottom:6px"><button class="small" data-ogo="paises">← Países</button></div>
        <div class="panel banner">${fl(id, 120)}<div style="flex:1"><div class="title">${esc(e.name)}</div><div class="motto">${esc(L?.name || '')}${L?.traits ? ' · ' + esc(L.traits.join(', ')) : ''}</div>
          <div class="small" style="margin-top:4px"><span class="tag" style="background:${FAMILIES[f].color};color:#fff">${esc(FAMILIES[f].name)}</span> <span class="tag">${esc(POSTURES[postureOf(s, data, id)]?.name || '')}</span> <span class="tag">nacionalismo ${num(nationalismOf(s, data, id), 0)}</span> ${e.born ? '<span class="tag warn">Estado novo</span>' : ''} ${e.custom ? '<span class="tag blue">nação customizada</span>' : ''}</div>
          <div class="small">Capital: <b>${esc(e.capital?.name || '')}</b> · ${provincesOf(s, data, id).length} províncias${als.length ? ' · Aliança: <b>' + als.map(a => esc(a.name)).join(', ') + '</b>' : ''}</div></div>
          <div class="right small"><div>PIB <b>${money(c.gdp, 'US$')}</b></div><div>População <b>${num(c.pop, 1)} mi</b></div><div>Poder militar <b>${num(aiPower(c), 1)}</b></div><div>Estabilidade <b>${num(c.stab, 0)}</b></div></div></div>
        <div class="grid g3"><div class="panel"><div data-och="gdp"></div></div><div class="panel"><div data-och="stab"></div></div><div class="panel"><div data-och="pow"></div></div></div>
        <div class="grid g3">
          <div class="panel"><h3>Relações</h3><div class="grid g2 small"><div><b>Amigos</b>${rels.slice(0, 7).map(([o, r]) => `<div data-ogo="pais:${o}" style="cursor:pointer">${fl(o, 14)} ${esc(nm(o))} <b class="c-good">${Math.round(r)}</b></div>`).join('')}</div><div><b>Inimigos</b>${rels.slice(-7).reverse().map(([o, r]) => `<div data-ogo="pais:${o}" style="cursor:pointer">${fl(o, 14)} ${esc(nm(o))} <b class="c-bad">${Math.round(r)}</b></div>`).join('')}</div></div>
            <h4>Vizinhos</h4><div class="small">${nb.map(o => `${fl(o, 14)} ${esc(nm(o))} (${Math.round(relAI(s, data, id, o))})`).join(' · ') || '—'}</div></div>
          <div class="panel"><h3>Guerras e disputas</h3>${wars.map(w => `<div class="small c-bad">⚔ contra ${esc((w.a.includes(id) ? w.b : w.a).map(nm).join(', '))} — ${esc(w.note || '')}</div>`).join('') || '<div class="small muted">Em paz.</div>'}
            <h4>Reivindicações</h4>${claims.map(x => `<div class="small">${x.claimant === id ? `Reivindica terras de <b>${esc(nm(x.holder))}</b>` : `<b>${esc(nm(x.claimant))}</b> reivindica suas terras`} (${x.provs.length} prov.)</div>`).join('') || '<div class="small muted">Nenhuma.</div>'}</div>
          <div class="panel"><h3>Povos e minorias</h3>${mins.map(m => `<div class="small"><b>${esc(m[0])}</b> — ${esc(m[1])} · ${m[2]} prov.</div>`).join('') || '<div class="small muted">Sem minorias relevantes.</div>'}
            ${kin.length ? `<h4>Seu povo em outros países</h4>${kin.map(m => `<div class="small">${esc(m[0])} sob <b>${esc(m[1])}</b> · ${m[2]} prov.</div>`).join('')}` : ''}</div></div>
        <div class="panel"><h3>⚗ Laboratório: mexer em ${esc(nm(id))}</h3><div class="grid g3">
          <label class="small">Política externa<br><select data-oc="posture">${Object.entries(POSTURES).map(([k, p]) => `<option value="${k}" ${postureOf(s, data, id) === k ? 'selected' : ''}>${p.name}</option>`).join('')}</select></label>
          <label class="small">Regime<br><select data-oc="regime">${Object.entries(FAMILIES).map(([k, x]) => `<option value="${k}" ${f === k ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
          <label class="small">Nacionalismo <b data-onatv>${Math.round(nationalismOf(s, data, id))}</b><br><input type="range" min="0" max="100" value="${Math.round(nationalismOf(s, data, id))}" data-oc="nat" style="width:100%"></label>
          <label class="small">Declarar guerra a<br><select data-oc="war"><option value="">—</option>${nb.map(o => `<option value="${o}">${esc(nm(o))} (vizinho)</option>`).join('')}${others.filter(o => !nb.includes(o)).map(o => `<option value="${o}">${esc(nm(o))}</option>`).join('')}</select></label>
          <label class="small">Melhorar/piorar relação com<br><select data-orelt>${others.map(o => `<option value="${o}">${esc(nm(o))}</option>`).join('')}</select> <button class="small" data-oact="relup">+30</button> <button class="small" data-oact="reldown">−30</button></label></div>
          <div class="row" style="gap:4px;flex-wrap:wrap;margin-top:8px"><button class="small" data-oact="coup">Golpe militar</button><button class="small" data-oact="revolution">Revolução socialista</button><button class="small" data-oact="democracy">Transição democrática</button><button class="small" data-oact="destabilize">Crise interna</button>${wars.length ? '<button class="small" data-oact="peace">Impor paz</button>' : ''}${E.stateless.some(x => x.holder === id) ? '<button class="small" data-oact="secede">Independência de um povo</button>' : ''}<button class="small" data-oact="map">Ver no mapa</button></div></div>`;
      const H = Wd.obsHist?.c?.[id] || [];
      mountLine(el.querySelector('[data-och="gdp"]'), { title: 'PIB (bi US$)', series: [{ name: 'PIB', data: H.map(r => [r[0], r[1]]) }], height: 120, yFmt: v => num(v, 0) });
      mountLine(el.querySelector('[data-och="stab"]'), { title: 'Estabilidade', series: [{ name: 'Estabilidade', color: '#2e8b3e', data: H.map(r => [r[0], r[2]]) }], height: 120, yMin: 0, yMax: 100, yFmt: v => num(v, 0) });
      mountLine(el.querySelector('[data-och="pow"]'), { title: 'Poder militar e províncias', series: [{ name: 'Poder', color: '#c0392b', data: H.map(r => [r[0], r[3]]) }, { name: 'Províncias', color: '#7b4fa6', data: H.map(r => [r[0], r[5]]) }], height: 120, yFmt: v => num(v, 0) });
    },
    guerras(el) {
      const Wd = W(), act = Wd.wars.filter(w => w.active), ended = Wd.wars.filter(w => !w.active && w.since != null).slice(-25).reverse();
      el.innerHTML = `<h2>Guerras</h2><div class="panel"><h3>Em andamento (${act.length})</h3>${act.length ? `<table class="data small"><tr><th>Atacantes</th><th>Defensores</th><th style="width:160px">Frente</th><th>Início</th><th>Ocupações</th><th>Motivo</th></tr>${act.map(w => warRow(w)).join('')}</table>` : '<p class="small muted">Paz no mundo — por enquanto.</p>'}</div>
        <div class="grid g2"><div class="panel"><div data-och="w"></div></div><div class="panel"><h3>Encerradas</h3><table class="data small">${ended.map(w => `<tr><td>${w.a.map(x => fl(x, 14) + ' ' + esc(nm(x))).join(', ')}</td><td>×</td><td>${w.b.map(x => fl(x, 14) + ' ' + esc(nm(x))).join(', ')}</td><td>${fmtDate(w.since || 0)}</td><td>${(w.front || 0) > 30 ? 'vitória atacante' : (w.front || 0) < -30 ? 'vitória defensora' : 'cessar-fogo'}</td></tr>`).join('') || '<tr><td class="muted">Nenhuma.</td></tr>'}</table></div></div>`;
      const MH = Wd.meterHist || [];
      mountLine(el.querySelector('[data-och="w"]'), { title: 'Guerras ativas ao longo do tempo', series: [{ name: 'Guerras', color: '#7a1d12', data: MH.map(r => [r[0], r[3]]) }], yMin: 0, yFmt: v => num(v, 0) });
    },
    diplomacia(el) {
      const s = S(), data = D(), Wd = W(), top = alive().sort((a, b) => aiPower(Wd.c[b]) - aiPower(Wd.c[a])).slice(0, 30), pairs = [];
      for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) pairs.push([top[i], top[j], relAI(s, data, top[i], top[j])]);
      pairs.sort((a, b) => a[2] - b[2]);
      const pr = p => `<tr><td>${fl(p[0], 14)} ${esc(nm(p[0]))}</td><td>${fl(p[1], 14)} ${esc(nm(p[1]))}</td><td class="num ${p[2] < 0 ? 'c-bad' : 'c-good'}">${Math.round(p[2])}</td></tr>`;
      const cl = Wd.claims.filter(c => c.status === 'active' && Wd.c[c.claimant] && Wd.c[c.holder]).slice(0, 40);
      el.innerHTML = `<h2>Diplomacia e alianças</h2><div class="panel"><h3>Alianças (${(Wd.alliances || []).length})</h3><table class="data small"><tr><th>Aliança</th><th>Tipo</th><th>Líder</th><th>Membros</th><th>Desde</th></tr>${(Wd.alliances || []).map(a => `<tr><td><b>${esc(a.name)}</b></td><td>${a.fam ? `<span style="color:${FAMILIES[a.fam]?.color}">■</span> ${esc(FAMILIES[a.fam]?.short || '')}` : 'regional'}</td><td>${fl(a.leader, 14)} ${esc(nm(a.leader))}</td><td>${a.members.filter(m => m !== PLY).map(m => `<span data-ogo="pais:${m}" style="cursor:pointer" title="${esc(nm(m))}">${fl(m, 16)}</span>`).join(' ')}</td><td>${fmtDate(a.since || 0)}</td></tr>`).join('') || '<tr><td class="muted">Nenhuma.</td></tr>'}</table></div>
        <div class="grid g2"><div class="panel"><h3>Maiores rivalidades entre potências</h3><table class="data small">${pairs.slice(0, 12).map(pr).join('')}</table></div><div class="panel"><h3>Maiores amizades entre potências</h3><table class="data small">${pairs.slice(-12).reverse().map(pr).join('')}</table></div></div>
        <div class="panel"><h3>Disputas territoriais (${cl.length})</h3><table class="data small"><tr><th>Reivindicante</th><th>Alvo</th><th>Tipo</th><th class="num">Prov.</th><th class="num">Risco</th><th>Justificativa</th></tr>${cl.map(c => `<tr><td>${fl(c.claimant, 14)} ${esc(nm(c.claimant))}</td><td>${fl(c.holder, 14)} ${esc(nm(c.holder))}</td><td>${esc({ irredentist: 'Irredentismo', sovereignty: 'Soberania', expansionist: 'Expansão' }[c.type] || c.type || '')}${c.src === 'ethnic' ? ' (étnica)' : ''}</td><td class="num">${c.provs.length}</td><td class="num">${c.risk ?? ''}</td><td class="small">${esc(c.just || '')}</td></tr>`).join('')}</table></div>`;
    },
    ideologias(el) {
      const s = S(), data = D(), Wd = W(), M = Wd.meters || {}, by = {};
      for (const id of alive()) (by[famOf(s, data, id)] ||= []).push(id);
      const posts = {}; for (const id of alive()) { const p = postureOf(s, data, id); posts[p] = (posts[p] || 0) + 1; }
      const fams = Object.keys(FAMILIES);
      el.innerHTML = `<h2>Ideologias</h2><div class="grid g3"><div class="panel"><h3>Países por família</h3>${pieSVG(fams.map(k => ({ label: FAMILIES[k].name, value: by[k]?.length || 0, color: FAMILIES[k].color })).filter(x => x.value), 140)}</div>
          <div class="panel"><h3>Política externa</h3>${barsHTML(Object.entries(POSTURES).map(([k, p]) => ({ label: p.name, value: posts[k] || 0, color: PCOL[k] })), { fmt: v => num(v, 0) })}<p class="small muted" style="margin-top:6px">${Object.values(POSTURES).map(p => `<b>${esc(p.name)}</b>: ${esc(p.desc)}`).join('<br>')}</p></div>
          <div class="panel"><h3>Polarização</h3><div style="font-size:32px;font-weight:bold;color:#8e44ad">${num(M.polarization, 0)}</div><p class="small">Parcela dos pares entre as 30 maiores potências cujas ideologias são hostis entre si. Socialistas × monarquias e nacionalistas, democracias × ditaduras e teocracias.</p></div></div>
        <div class="panel"><div data-och="fam"></div></div>
        <div class="panel"><h3>Afinidade entre ideologias</h3><div style="overflow-x:auto"><table class="data small"><tr><th></th>${fams.map(k => `<th>${esc(FAMILIES[k].short)}</th>`).join('')}</tr>${fams.map(a => `<tr><td><b>${esc(FAMILIES[a].short)}</b></td>${fams.map(b => { const v = compat(a, b); return `<td class="num" style="background:${v > 0.2 ? '#cfe8cf' : v < -0.2 ? '#f1c7c1' : '#f3f1ea'}">${v > 0 ? '+' : ''}${num(v, 2)}</td>`; }).join('')}</tr>`).join('')}</table></div><p class="small muted">Quanto maior, mais os regimes se aproximam (relações, alianças); valores negativos geram desconfiança, sanções e, com caos alto, guerras ideológicas. O peso disso é ajustável no laboratório.</p></div>
        <div class="grid g2">${fams.filter(k => by[k]?.length).map(k => `<div class="panel"><h3><span style="color:${FAMILIES[k].color}">■</span> ${esc(FAMILIES[k].name)} (${by[k].length})</h3><div class="small">${by[k].sort((a, b) => Wd.c[b].gdp - Wd.c[a].gdp).map(id => `<span data-ogo="pais:${id}" style="cursor:pointer;white-space:nowrap">${fl(id, 14)} ${esc(nm(id))}</span>`).join(' · ')}</div></div>`).join('')}</div>`;
      const H = Wd.obsHist || { days: [], fams: [] };
      mountLine(el.querySelector('[data-och="fam"]'), { title: 'Evolução das famílias ideológicas', series: fams.map(k => ({ name: FAMILIES[k].short, color: FAMILIES[k].color, data: H.days.map((d, i) => [d, H.fams[i]?.[k] || 0]) })), yMin: 0, yFmt: v => num(v, 0) });
    },
    etnias(el) {
      const s = S(), data = D(), Wd = W(), E = ethnicIndex(s, data);
      const st = E.stateless.filter(x => Wd.c[x.holder]), mi = E.minorities.filter(x => Wd.c[x.holder] && Wd.c[x.kin]);
      el.innerHTML = `<h2>Etnias e tensões</h2><div class="panel tight"><p class="small">Povos sem Estado tiram estabilidade de quem os governa (mais sob regimes repressivos) e, com caos alto, podem proclamar independência. Minorias com Estado-mãe geram reivindicações proporcionais ao nacionalismo desse Estado. Peso ajustável no laboratório.</p></div>
        <div class="grid" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)"><div class="panel tight"><div data-omap class="obs-map-dash"></div><div class="obs-legend2" data-olegend></div></div>
          <div class="panel"><h3>Povos sem Estado (${st.length})</h3><table class="data small"><tr><th>Povo</th><th>Governado por</th><th class="num">Prov.</th><th class="num">Estab.</th></tr>${st.map(x => `<tr><td>${esc(x.name || x.people)}</td><td data-ogo="pais:${x.holder}" style="cursor:pointer">${fl(x.holder, 14)} ${esc(nm(x.holder))}</td><td class="num">${x.provs.length}</td><td class="num">${num(Wd.c[x.holder].stab, 0)}</td></tr>`).join('')}</table></div></div>
        <div class="panel"><h3>Minorias com Estado-mãe (${mi.length})</h3><table class="data small"><tr><th>Povo</th><th>Vive em</th><th>Estado-mãe</th><th class="num">Prov.</th><th>Reivindicação</th><th class="num">Relação</th></tr>${mi.map(m => `<tr><td>${esc(m.people)}</td><td>${fl(m.holder, 14)} ${esc(nm(m.holder))}</td><td>${fl(m.kin, 14)} ${esc(nm(m.kin))}</td><td class="num">${m.provs.length}</td><td>${Wd.claims.some(c => c.claimant === m.kin && c.holder === m.holder && c.status === 'active') ? '<span class="tag red">ativa</span>' : '—'}</td><td class="num">${Math.round(relAI(s, data, m.kin, m.holder))}</td></tr>`).join('')}</table></div>`;
      const prev = O.mode; O.mode = 'ethnic'; mountMap(el.querySelector('[data-omap]')); O.modeBack = prev;
    },
    rankings(el) {
      const R = W().rankings || {};
      const fmt = (k, v) => k === 'gdp' ? money(v, 'US$') : k === 'pop' ? num(v, 1) + ' mi' : k === 'area' ? num(v / 1000, 0) + ' mil km²' : k === 'gdppc' ? num(v, 0) : num(v, 1);
      const row = (k, id, v, i) => `<tr data-ogo="pais:${id}" style="cursor:pointer"><td>${i + 1}</td><td>${fl(id, 16)} ${esc(nm(id))}</td><td class="num">${fmt(k, v)}</td></tr>`;
      el.innerHTML = `<h2>Rankings mundiais</h2><div class="muted small" style="margin-bottom:8px">Atualizados todo mês.</div>
        <div class="grid g3">${Object.entries(RANK_INFO).map(([k, info]) => { const r = R[k]; if (!r) return ''; const all = r.all || r.top; return `<div class="panel"><h3>${esc(info[0])}</h3><div class="rank-scroll"><table class="data rank-table">${all.map(([id, v], i) => row(k, id, v, i)).join('')}</table></div></div>`; }).join('') || '<p class="muted">Os rankings aparecem depois do primeiro mês.</p>'}</div>`;
    },
    lab(el) {
      const Wd = W(), L = Wd.lab || {}, ids = alive().sort((a, b) => nm(a).localeCompare(nm(b), 'pt'));
      const opts = ids.map(id => `<option value="${id}">${esc(nm(id))}</option>`).join('');
      const sl = (k, n, min, max, step, hint) => `<div class="panel tight"><div class="row" style="justify-content:space-between"><b>${n}</b><b data-oslv="${k}">${k === 'chaos' ? Math.round(L[k] ?? 35) : (+(L[k] ?? 1)).toFixed(1) + '×'}</b></div><input type="range" min="${min}" max="${max}" step="${step}" value="${L[k] ?? (k === 'chaos' ? 35 : 1)}" data-olab="${k}" style="width:100%"><div class="small muted">${hint}</div></div>`;
      el.innerHTML = `<h2>Laboratório</h2><p class="small muted">Ajuste as regras do mundo enquanto ele roda. Cada intervenção aparece no registro abaixo.</p>
        <div class="panel"><h3>Regras do mundo</h3><div class="grid g2">${sl('chaos', 'Caos (agressividade da IA)', 0, 100, 5, '0 = mundo estável · 60+ = mundo caótico: secessões, expansionismo e guerras frequentes')}${sl('ideo', 'Peso da ideologia', 0, 2, 0.1, 'Quanto socialistas, monarquias, democracias e nacionalistas se atraem ou se odeiam')}${sl('ethnic', 'Peso das etnias e do nacionalismo', 0, 2, 0.1, 'Irredentismo, minorias e povos sem Estado')}${sl('wars', 'Propensão a guerras', 0, 2, 0.1, 'Multiplica a chance de a IA iniciar conflitos')}</div></div>
        <div class="grid g2"><div class="panel"><h3>Provocar guerra</h3><div class="row" style="gap:6px;flex-wrap:wrap"><label class="small">Atacante<br><select data-olw="a">${opts}</select></label><label class="small">Alvo<br><select data-olw="b">${opts}</select></label><button class="primary" data-oact="war2" style="align-self:flex-end">Declarar guerra</button></div></div>
          <div class="panel"><h3>Relações entre dois países</h3><div class="row" style="gap:6px;flex-wrap:wrap"><label class="small">País<br><select data-olr="a">${opts}</select></label><label class="small">e<br><select data-olr="b">${opts}</select></label><span style="align-self:flex-end"><button data-oact="rel2up">+30</button> <button data-oact="rel2down">−30</button></span></div></div></div>
        <div class="panel"><h3>Eventos globais</h3><div class="row" style="gap:6px;flex-wrap:wrap"><button data-oact="peaceall">🕊 Paz mundial</button><button data-oact="tup">Tensão +15</button><button data-oact="tdown">Tensão −15</button>${[['pandemic', '🦠 Pandemia'], ['crash', '📉 Crise financeira'], ['climate', '🔥 Colapso climático'], ['cyber', '💻 Ciberataque']].map(([k, n]) => `<button data-oact="crisis:${k}">${n}</button>`).join('')}</div><p class="small muted">Para mexer em um país específico (regime, política externa, golpe, revolução, independência de povos), abra a ficha dele em <a href="#" data-ogo="paises">Países</a>.</p></div>
        <div class="panel"><h3>Registro do laboratório</h3><table class="data small">${(Wd.labLog || []).map(x => `<tr><td>${fmtDate(x.day)}</td><td>${esc(x.text)}</td></tr>`).join('') || '<tr><td class="muted">Nenhuma intervenção.</td></tr>'}</table></div>`;
    },
    comparar(el) {
      const s = S(), data = D(), Wd = W(), st = Wd.obsStart; if (!st) { el.innerHTML = '<p>Sem registro do início.</p>'; return; }
      const before = pid => st.owner[pid] || data.geo.prov[pid].a3, now = pid => ownerOf(s, data, pid);
      const cntB = {}, cntN = {};
      for (const pid in data.geo.prov) { cntB[before(pid)] = (cntB[before(pid)] || 0) + 1; cntN[now(pid)] = (cntN[now(pid)] || 0) + 1; }
      const al = alive(), gone = st.countries.filter(id => !Wd.c[id]), born = al.filter(id => !st.countries.includes(id));
      const delta = al.map(id => [id, (cntN[id] || 0) - (cntB[id] || 0)]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
      const name = id => Wd.c[id] ? nm(id) : st.names?.[id] || data.reg[id]?.name || id;
      const nowTop = [...al].sort((a, b) => Wd.c[b].gdp - Wd.c[a].gdp).slice(0, 10);
      el.innerHTML = `<h2>Antes × depois</h2><p class="small muted">De ${fmtDate(st.day, true)} a ${fmtDate(game.day, true)}.</p>
        <div class="grid g2"><div class="panel tight"><b>Início</b><div data-mb class="obs-cmpmap"></div></div><div class="panel tight"><b>Agora</b><div data-mn class="obs-cmpmap"></div></div></div>
        <div class="grid g3"><div class="panel"><h3>Países: ${st.countries.length} → ${al.length}</h3><div class="small"><b>Desapareceram (${gone.length}):</b> ${gone.map(id => esc(name(id))).join(', ') || '—'}</div><div class="small" style="margin-top:4px"><b>Surgiram (${born.length}):</b> ${born.map(id => fl(id, 14) + ' ' + esc(name(id))).join(', ') || '—'}</div></div>
          <div class="panel"><h3>Território (províncias)</h3><table class="data small">${delta.filter(x => x[1] > 0).slice(0, 8).map(([id, d]) => `<tr><td>${fl(id, 14)} ${esc(name(id))}</td><td class="num c-good">+${d}</td></tr>`).join('')}${delta.filter(x => x[1] < 0).slice(-8).reverse().map(([id, d]) => `<tr><td>${fl(id, 14)} ${esc(name(id))}</td><td class="num c-bad">${d}</td></tr>`).join('')}</table></div>
          <div class="panel"><h3>Maiores economias</h3><table class="data small"><tr><th>Antes</th><th>Agora</th></tr>${st.gdp.map(([id], i) => `<tr><td>${i + 1}. ${esc(name(id))}</td><td>${nowTop[i] ? esc(name(nowTop[i])) : ''}</td></tr>`).join('')}</table></div></div>
        <div class="panel"><h3>Mudanças de regime</h3><table class="data small">${(Wd.regimeLog || []).slice(0, 40).map(r => `<tr><td>${fmtDate(r.day)}</td><td>${esc(r.text)}</td></tr>`).join('') || '<tr><td class="muted">Nenhuma.</td></tr>'}</table></div>`;
      const mk = (box, own) => new WorldMap(box, data.geo, { owner: own, color: (pid, o) => o === PLY ? '#d8d8d0' : tintOf(o), labels: true, search: false, labelOf: id => id === PLY ? '' : name(id), tip: (pid, o) => `<b>${esc(name(o))}</b><br>${esc(data.geo.prov[pid].n)}` });
      requestAnimationFrame(() => { mk(el.querySelector('[data-mb]'), before); mk(el.querySelector('[data-mn]'), now); });
    },
    config(el) {
      const c = cfg(), ck = (k, n, hint) => `<label class="row" style="gap:8px;margin:6px 0"><input type="checkbox" data-ocfg="${k}" ${c[k] ? 'checked' : ''}><span><b>${n}</b><br><span class="small muted">${hint}</span></span></label>`;
      el.innerHTML = `<h2>Configurações do Observatório</h2><div class="grid g2"><div class="panel"><h3>Tempo</h3><label class="small">Velocidade do avanço rápido<br><select data-ospeed>${SPEEDS.map(([v, n]) => `<option value="${v}" ${c.speed === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          ${ck('pauseWar', 'Pausar quando começar uma guerra', 'O avanço rápido para e mostra a notícia.')}${ck('pauseState', 'Pausar quando nascer um Estado', 'Independências, secessões e fragmentações.')}${ck('pauseRegime', 'Pausar em golpes e revoluções', 'Mudanças de regime fora das eleições.')}${ck('paperMonthly', 'Abrir o jornal a cada mês', 'Mostra a edição do mês ao virar o mês.')}</div>
        <div class="panel"><h3>Exibição</h3>${ck('ticker', 'Manchetes rolando no topo', 'Faixa de notícias ao vivo abaixo da barra.')}${ck('labels', 'Nomes dos países no mapa', 'Rótulos sobre os territórios.')}
          <label class="small">Modo inicial do mapa<br><select data-ocfgsel="mapMode">${MAPMODES.map(([k, n]) => `<option value="${k}" ${c.mapMode === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div></div>`;
    },
  };
  function warRow(w) {
    const f = Math.max(-100, Math.min(100, w.front || 0)), occ = (w.occA?.length || 0) + (w.occB?.length || 0);
    return `<tr><td>${w.a.map(x => `<span data-ogo="pais:${x}" style="cursor:pointer">${fl(x, 14)} ${esc(nm(x))}</span>`).join('<br>')}</td><td>${w.b.map(x => `<span data-ogo="pais:${x}" style="cursor:pointer">${fl(x, 14)} ${esc(nm(x))}</span>`).join('<br>')}</td><td><div class="obs-front"><i style="left:${50 + f / 2}%"></i></div><span class="small muted">${f > 15 ? 'atacantes avançam' : f < -15 ? 'defensores resistem' : 'equilíbrio'}</span></td><td>${fmtDate(w.since || 0)}</td><td class="num">${occ}</td><td class="small">${esc(w.note || '')}</td></tr>`;
  }
  const warsMini = ws => ws.map(w => { const f = Math.max(-100, Math.min(100, w.front || 0)); return `<div class="obs-war" data-ogo="pais:${w.a[0]}"><div class="row small" style="justify-content:space-between;flex-wrap:nowrap">${fl(w.a[0], 16)} <span>${esc(nm(w.a[0]))}${w.a.length > 1 ? ` +${w.a.length - 1}` : ''}</span><span class="muted">×</span><span>${esc(nm(w.b[0]))}${w.b.length > 1 ? ` +${w.b.length - 1}` : ''}</span> ${fl(w.b[0], 16)}</div><div class="obs-front"><i style="left:${50 + f / 2}%"></i></div></div>`; }).join('') || '<p class="small muted">Paz no mundo — por enquanto.</p>';

  function renderPage() {
    renderNav();
    const main = $('#main');
    main.innerHTML = '';
    main.onclick = main.onchange = main.oninput = null;
    if (O.page !== 'etnias' && O.modeBack) { O.mode = O.modeBack; O.modeBack = null; }
    (PAGES[O.page] || PAGES.painel)(main);
  }
  function go(p) { const [page, arg] = p.split(':'); O.page = page; O.arg = arg ?? null; renderPage(); window.scrollTo(0, 0); }
  function refresh() { renderTop(); renderTicker(); const y = window.scrollY; renderPage(); window.scrollTo(0, y); }

  // ---------- Tempo ----------
  function archiveMonth(fromDay) {
    const Wd = W(), H = headlines(game.day - fromDay + 1, 10);
    (Wd.editions ||= []).unshift({ day: game.day, label: fmtMonth(fromDay), lines: H.map(l => ({ t: l.text, k: l.type })), meters: { ...Wd.meters, fams: undefined } });
    if (Wd.editions.length > 36) Wd.editions.length = 36;
  }
  function snap() { const Wd = W(); return { wars: Wd.wars.length, states: (Wd.newStates || []).length, regimes: (Wd.regimeLog || []).filter(r => r.kind === 'coup' || r.kind === 'revolution').length }; }
  function advance(kind) {
    if (O.busy) return; O.busy = true;
    const b = snap(), start = game.day, m0 = dateOf(game.day).m;
    try {
      if (kind === 'week') game.nextWeek();
      else { for (let i = 0; i < 6 && dateOf(game.day).m === m0; i++) game.nextWeek(); archiveMonth(start); }
    } catch (e) { console.error(e); toast('Erro na simulação: ' + esc(e.message), 'bad'); setPlaying(false); }
    O.busy = false; game.save();
    const a = snap(), c = cfg(), why = [];
    if (c.pauseWar && a.wars > b.wars) why.push('uma nova guerra começou');
    if (c.pauseState && a.states > b.states) why.push('nasceu um novo Estado');
    if (c.pauseRegime && a.regimes > b.regimes) why.push('houve um golpe ou revolução');
    if (why.length && O.playing) { setPlaying(false); toast(`Pausado: ${why.join(', ')}.`, 'warn'); }
    refresh();
    if (kind === 'month' && c.paperMonthly) { O.page = 'jornal'; O.arg = '0'; renderPage(); }
  }
  function setPlaying(on) {
    O.playing = on; clearInterval(timer);
    if (on) { O.elapsed = 0; timer = setInterval(() => { O.elapsed += 0.25; const p = $('[data-prog]'); if (p) p.style.width = Math.min(100, O.elapsed / cfg().speed * 100) + '%'; if (O.elapsed >= cfg().speed) { O.elapsed = 0; advance('month'); } }, 250); }
    renderTop();
  }

  // ---------- Ações ----------
  function act(kind, extra) {
    const id = O.arg, q = sel => document.querySelector(sel)?.value;
    let r = '';
    const L = (a) => { r = game.labAct(a) || r; };
    switch (kind) {
      case 'posture': L({ type: 'posture', id, v: extra }); break;
      case 'regime': L({ type: 'regime', id, v: extra }); break;
      case 'nat': L({ type: 'nat', id, v: extra }); break;
      case 'war': if (extra) L({ type: 'war', a: id, b: extra }); break;
      case 'relup': case 'reldown': L({ type: 'rel', a: id, b: q('[data-orelt]'), v: kind === 'relup' ? 30 : -30 }); break;
      case 'coup': L({ type: 'regime', id, v: 'junta', how: 'coup' }); break;
      case 'revolution': L({ type: 'regime', id, v: 'socialist', how: 'revolution' }); break;
      case 'democracy': L({ type: 'regime', id, v: 'liberal' }); break;
      case 'destabilize': L({ type: 'destabilize', id }); break;
      case 'peace': L({ type: 'peace', id }); break;
      case 'secede': L({ type: 'secede', id }); break;
      case 'map': O.sel = id; O.mode = 'political'; go('mapa'); if (map) map.zoomToProvinces(new Set(provincesOf(S(), D(), id)), 1.2); return;
      case 'war2': L({ type: 'war', a: q('[data-olw="a"]'), b: q('[data-olw="b"]') }); break;
      case 'rel2up': case 'rel2down': L({ type: 'rel', a: q('[data-olr="a"]'), b: q('[data-olr="b"]'), v: kind === 'rel2up' ? 30 : -30 }); break;
      case 'peaceall': L({ type: 'peace' }); break;
      case 'tup': case 'tdown': L({ type: 'tension', v: kind === 'tup' ? 15 : -15 }); break;
      default: if (kind.startsWith('crisis:')) L({ type: 'crisis', id: kind.slice(7) });
    }
    if (r) toast(esc(r), 'info'); else if (!['nat'].includes(kind)) toast('Nada aconteceu.', 'warn');
    refresh();
  }

  const onClick = e => {
    if ($('#app').hidden) return;
    const t = e.target;
    if (t.closest('[data-oplay]')) return setPlaying(!O.playing);
    const st = t.closest('[data-ostep]'); if (st) { setPlaying(false); return advance(st.dataset.ostep); }
    const g = t.closest('[data-ogo]'); if (g && !t.closest('select,input')) { e.preventDefault(); return go(g.dataset.ogo); }
    const md = t.closest('[data-omode]'); if (md) { O.mode = md.dataset.omode; document.querySelectorAll('[data-omode]').forEach(b => b.classList.toggle('on', b.dataset.omode === O.mode)); return redrawMap(); }
    const so = t.closest('[data-osort]'); if (so) { const k = so.dataset.osort; O.sort = [k, O.sort[0] === k ? -O.sort[1] : (k === 'name' || k === 'fam' || k === 'post' ? 1 : -1)]; return renderPage(); }
    const rm = t.closest('[data-ormcmp]'); if (rm) { e.preventDefault(); O.cmp = O.cmp.filter(x => x !== rm.dataset.ormcmp); return renderPage(); }
    const a = t.closest('[data-oact]'); if (a) return act(a.dataset.oact);
    const mn = t.closest('[data-omenu]'); if (mn) { e.preventDefault(); if (mn.dataset.omenu === 'save') { game.save(); toast('Salvo.', 'good'); } else if (confirm('Encerrar esta observação e voltar ao menu?')) { destroy(); onExit(); } }
  };
  const onChange = e => {
    if ($('#app').hidden) return;
    const t = e.target;
    if (t.matches('[data-ospeed]')) { cfg().speed = +t.value; O.elapsed = Math.min(O.elapsed, cfg().speed); renderTop(); return; }
    if (t.matches('[data-oc]')) return act(t.dataset.oc, t.dataset.oc === 'nat' ? +t.value : t.value);
    if (t.matches('[data-olab]')) { const k = t.dataset.olab; game.labAct(k === 'chaos' ? { type: 'chaos', v: +t.value } : { type: 'mul', k, v: +t.value }); renderTop(); return; }
    if (t.matches('[data-ocfg]')) { cfg()[t.dataset.ocfg] = t.checked; if (t.dataset.ocfg === 'ticker') renderTicker(); if (t.dataset.ocfg === 'labels') redrawMap(); game.save(); return; }
    if (t.matches('[data-ocfgsel]')) { cfg()[t.dataset.ocfgsel] = t.value; O.mode = t.value; game.save(); return; }
    if (t.matches('[data-ofilt]') && t.tagName === 'SELECT') { O.filt[t.dataset.ofilt] = t.value; return renderPage(); }
    if (t.matches('[data-ometric]')) { O.metric = t.value; return renderPage(); }
    if (t.matches('[data-oaddcmp]') && t.value) { if (!O.cmp.includes(t.value)) O.cmp.push(t.value); return renderPage(); }
  };
  const onInput = e => {
    if ($('#app').hidden) return;
    const t = e.target;
    if (t.matches('[data-ofilt="q"]')) { O.filt.q = t.value; clearTimeout(O._qt); O._qt = setTimeout(() => { renderPage(); const i = document.querySelector('[data-ofilt="q"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); }
    if (t.matches('[data-olab]')) { const b = document.querySelector(`[data-oslv="${t.dataset.olab}"]`); if (b) b.textContent = t.dataset.olab === 'chaos' ? t.value : (+t.value).toFixed(1) + '×'; }
    if (t.matches('[data-oc="nat"]')) { const b = document.querySelector('[data-onatv]'); if (b) b.textContent = t.value; }
  };
  const onKey = e => {
    if ($('#app').hidden || ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName) || !$('#modal').hidden) return;
    if (e.code === 'Space') { e.preventDefault(); setPlaying(!O.playing); }
    if (e.code === 'Enter') { e.preventDefault(); advance('week'); }
  };
  document.addEventListener('click', onClick); document.addEventListener('change', onChange); document.addEventListener('input', onInput); document.addEventListener('keydown', onKey);
  function destroy() { setPlaying(false); document.removeEventListener('click', onClick); document.removeEventListener('change', onChange); document.removeEventListener('input', onInput); document.removeEventListener('keydown', onKey); map = null; mapEl = null; }

  document.body.classList.add('obs-mode');
  renderTop(); renderTicker(); renderPage();
  return { destroy: () => { destroy(); document.body.classList.remove('obs-mode'); }, refresh };
}
