import { $, esc, num, money, signed, bar, toast } from './dom.js';
import { DIFFICULTY } from '../sim/constants.js';
import { WorldMap } from './worldmap.js';
import { tintOf } from './mapviews.js';
import { mountFlagEditor, flagHTML, entityFlag, historicalFlags, defaultFlag, hasIsoFlag, regionalFlags } from './flag.js';
import { territoryStats, relRecord, components } from '../sim/world.js';
import { classify, AXES } from '../sim/ideology.js';
import { Game } from '../sim/game.js';
import { MISSIONS } from '../sim/missions.js';
import { cultureOf, personName, leaderName } from '../sim/names.js';
import { WORLD_REGIONS, wrOf } from '../sim/worldregions.js';
import { munisOf, applySplits, splitId, splitName } from '../sim/munis.js';
import { pagedGrid } from './paginate.js';
import { onFlagsReady } from './flag.js';
import { customPanelHTML, openEditor, loadCustom, saveCustom, presetWorld, exportWorld, importWorld, exportAll, encodeWorld, importCode } from './customworld-ui.js';
import { customData, regionalIdentity } from '../sim/customworld.js';
import { MODES, CHALLENGES, PERKS, dailyConfig, loadMeta, saveMeta } from '../sim/modes.js';

// Regiões do mundo que um cenário toca (países inteiros e províncias) + 'cold'.
const scenRegions = sc => { const out = new Set(); for (const e of sc.territory?.entities || []) wrOf(e).forEach(k => out.add(k)); for (const p of sc.territory?.provinces || []) wrOf(String(p).split('-')[0]).forEach(k => out.add(k)); if (sc.cold || (sc.cats || []).includes('cold')) out.add('cold'); for (const k of sc.wr || []) out.add(k); return out; };
const STEPS = ['Cenário', 'Território', 'Identidade', 'Questionário', 'Resultado'];
const SIZE_NAMES = { small: 'Pequeno', medium: 'Médio', large: 'Grande', continental: 'Continental' };
const RES_NAMES = { oil: 'petróleo', gas: 'gás', coal: 'carvão', metals: 'minérios', farmland: 'terras agrícolas', timber: 'madeira', uranium: 'urânio', diamonds: 'diamantes', rare_earths: 'terras raras', hydro: 'hidrelétricas' };

export function mountSetup(el, { game, onStart, onContinue }) {
  // Sempre os dados-base: game.data pode ter o mundo (e as províncias divididas) da partida anterior.
  const BASE = game.baseData || game.data;
  let data = BASE;
  const setCustom = def => { W.customWorld = def || null; data = def ? customData(BASE, def) : BASE; W.sel = new Set(); W.selMun = {}; W.munOpen = new Set(); W._dvKey = null; DV = data; };
  const W = { selMun: {}, munOpen: new Set(), munMode: false, scenCat: 'all', scenTab: 'player', worldScenario: null, worldHostile: 'ideology', mode: 'sandbox', perks: [], chaos: false, step: 0, scenario: 'custom', sel: new Set(), provinceMode: false, capitalProv: null, difficulty: 'normal', answers: Array(21).fill(null), flagTab: 'current', flag: defaultFlag(),
    nation: { officialName: 'República Federal de Valdória', shortName: 'Valdória', leader: 'Marechal Aurélio Corvo', capital: '', currency: 'Coroa', motto: 'Ordem, Ferro e Progresso', regime: '' }, preview: null, map: null };
  const saves = game.listSaves().filter(x => !x.empty && x.ok);
  const scen = () => data.scenarios.find(x => x.id === W.scenario);

  // ---- Municípios: seleção parcial de províncias ----
  let DV = data;
  const cellsOf = pid => munisOf(data.geo.prov[pid]);
  const splitsOf = () => Object.entries(W.selMun).filter(([, set]) => set.size).map(([pid, set]) => { const cells = [...set].sort((a, b) => a - b), P = data.geo.prov[pid]; return { id: splitId(pid, cells), parent: pid, cells, name: splitName(P, cells, cellsOf(pid)) }; });
  const selIds = () => [...W.sel, ...splitsOf().map(s => s.id)];
  const refreshDV = () => { const sp = splitsOf(), key = JSON.stringify(sp.map(s => [s.id, s.cells])); if (W._dvKey !== key) { W._dvKey = key; DV = sp.length ? applySplits(data, sp) : data; } };
  const GOLD = 'rgba(231,183,48,.92)';
  const cellPath = (pid, c, on) => `<path data-ov="m:${pid}:${c.i}" d="${c.d}" fill="${on ? GOLD : 'rgba(255,255,255,.5)'}" stroke="#5a3d00" stroke-width="1.1" vector-effect="non-scaling-stroke" fill-rule="evenodd" style="cursor:pointer"><title>${esc(c.name)} · ${num(c.pop / 1000, 1)} mil hab. · ${num(c.a, 0)} km²</title></path>`;
  function munOverlay() {
    let h = '';
    for (const pid of W.munOpen) { const M = cellsOf(pid), set = W.selMun[pid] || (W.sel.has(pid) ? new Set(M.cells.map(c => c.i)) : new Set()); for (const c of M.cells) h += cellPath(pid, c, set.has(c.i)); }
    for (const [pid, set] of Object.entries(W.selMun)) if (!W.munOpen.has(pid)) for (const c of cellsOf(pid).cells) if (set.has(c.i)) h += cellPath(pid, c, true);
    return h;
  }
  function renderMunPanel() {
    const box = el.querySelector('[data-munpanel]'); if (!box) return;
    box.hidden = !W.munMode;
    if (!W.munMode) return;
    const rows = [...W.munOpen].map(pid => { const M = cellsOf(pid), n = W.selMun[pid]?.size ?? (W.sel.has(pid) ? M.cells.length : 0); return `<div class="row" style="justify-content:space-between;gap:4px"><span class="small"><b>${esc(data.geo.prov[pid].n)}</b> · ${n}/${M.cells.length} municípios</span><span><button class="small" data-munall="${pid}">Todos</button> <button class="small" data-munnone="${pid}">Nenhum</button> <button class="small" data-munclose="${pid}">Fechar</button></span></div>`; }).join('');
    box.innerHTML = `<h3>Municípios</h3><p class="small muted">Clique numa província para abri-la em municípios; clique nos municípios para incluí-los ou removê-los. Seleções parciais criam uma província menor com população e área proporcionais. Os municípios só aparecem aqui e nas guerras.</p>${rows || '<p class="small muted">Nenhuma província aberta.</p>'}`;
  }
  function drawMun() { if (W.map) W.map.setOverlay(munOverlay()); renderMunPanel(); }
  function cellClick(k) {
    const [, pid, i] = k.split(':'), M = cellsOf(pid), idx = +i;
    let set = W.selMun[pid];
    if (!set) { set = W.selMun[pid] = new Set(W.sel.has(pid) ? M.cells.map(c => c.i) : []); W.sel.delete(pid); }
    set.has(idx) ? set.delete(idx) : set.add(idx);
    if (set.size === M.cells.length) { delete W.selMun[pid]; W.sel.add(pid); } else if (!set.size) delete W.selMun[pid];
    W.map.o.selection = W.sel; W.map.recolor(); W.capitalProv = null; drawMun(); stats();
  }
  function setAllCells(pid, all) {
    const M = cellsOf(pid); W.sel.delete(pid); delete W.selMun[pid];
    if (all) W.sel.add(pid);
    W.map.o.selection = W.sel; W.map.recolor(); W.capitalProv = null; drawMun(); stats();
  }

  function applyScenario(id) {
    W.scenario = id; W.nameEdited = false; W.flagEdited = false;
    const sc = scen();
    W.selMun = {}; W.munOpen = new Set();
    W.sel = new Set([...(sc.territory?.entities || []).flatMap(e => data.geo.byCountry[e] || []), ...(sc.territory?.provinces || [])]);
    if (sc.nation) W.nation = { ...W.nation, ...sc.nation, capital: '' };
    if (sc.flag) { W.flag = sc.flag; W.flagTab = sc.flag.reg ? 'reg' : sc.flag.hist ? 'hist' : sc.flag.iso ? 'current' : 'custom'; }
    if (sc.answers) { W.answers = [...sc.answers]; while (W.answers.length < data.identity.questions.length) W.answers.push(1); }
    W.capitalProv = sc.capitalProv || null;
  }

  // Quando as bandeiras pesadas terminam de carregar, redesenha a etapa (sem interromper quem está digitando).
  onFlagsReady(() => { if (el.isConnected && !el.hidden && !el.contains(document.activeElement?.matches?.('input,textarea,select') ? document.activeElement : null)) render(); });
  function render() {
    el.innerHTML = `<div class="setup-head"><h1>IRON STATE</h1><div class="muted">Sandbox geopolítico — crie uma nação, defina no que ela acredita e tente sobreviver num mundo de potências</div>
      <div class="wizard-steps">${STEPS.map((n, i) => `<span class="${i === W.step ? 'on' : i < W.step ? 'done' : ''}">${i + 1}. ${n}</span>`).join('')}</div></div><div data-body></div>
      <div class="row" style="justify-content:space-between;margin-top:12px"><button data-prev ${W.step === 0 ? 'disabled' : ''}>← Voltar</button><span class="muted small" data-hint></span><button class="primary" data-next>${W.step === 4 ? 'Começar a campanha' : 'Avançar →'}</button></div>`;
    const body = $('[data-body]', el);
    [stepScenario, stepTerritory, stepIdentity, stepQuestions, stepResult][W.step](body);
  }

  function worldPanel() {
    const list = data.worldScenarios || [];
    return `<div class="panel"><h3>Cenários mundiais</h3><p class="small muted">Aqui o <b>mundo inteiro</b> vive uma história alternativa, não só o seu país: cada cenário reescreve os governos de todas as nações, cria alianças temáticas e traz eventos exclusivos. Depois escolha seu país ou cenário na aba <b>Cenários do jogador</b>. Os nomes e bandeiras alternativos aparecem na partida.</p>
      <div class="scen-grid"><div class="scen ${!W.worldScenario ? 'on' : ''}" data-wscn=""><h4>🌍 Mundo real</h4><div class="small">O mundo como ele é hoje, sem reescrita.</div></div>${list.map(x => `<div class="scen ${W.worldScenario === x.id ? 'on' : ''}" data-wscn="${x.id}"><h4>${x.tag} ${esc(x.name)}</h4><div class="small">${esc(x.desc)}</div><div>${(x.alliances || []).map(a => `<span class="tag">${esc(a.name)}</span>`).join('')}</div></div>`).join('')}</div>
      <h3 style="margin-top:10px">Postura do mundo com você</h3><div class="seg">${[['friendly', 'Acolhedor'], ['ideology', 'Conforme a ideologia'], ['hostile', 'Hostil']].map(([k, n]) => `<button data-whost="${k}" class="${W.worldHostile === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <p class="small muted">Acolhedor: os países começam mais simpáticos. Conforme a ideologia: a afinidade com o seu governo decide. Hostil: quem pensa diferente de você começa com forte desconfiança.</p></div>${customPanelHTML(W, loadCustom())}`;
  }

  // Cenários em blocos: filtra por região antes de renderizar e mostra 24 por vez (o selecionado sempre aparece).
  function scenList() { return data.scenarios.filter(x => W.scenCat === 'all' || x.id === W.scenario || scenRegions(x).has(W.scenCat)); }
  function scenPage() { const L = scenList(), page = L.slice(0, W.scenShown || 24), sel = L.find(x => x.id === W.scenario); if (sel && !page.includes(sel)) page.push(sel); return page; }
  function stepScenario(body) {
    body.innerHTML = `${saves.length ? `<div class="panel"><h3>Continuar</h3><div class="row">${saves.map(x => `<button class="primary" data-continue="${x.slot}">${esc(x.name)} — ${x.slot === 'auto' ? 'autosave' : 'espaço ' + x.slot}, dia ${x.day}${x.over ? ' (encerrada)' : ''}</button>`).join('')}</div></div>` : ''}
      ${modePanel()}
      <div class="panel"><h3>Escolha um cenário</h3><div class="scen-grid">${scenPage().map(s => `<div class="scen ${s.id === W.scenario ? 'on' : ''}" data-scen="${s.id}">
        <div class="row" style="justify-content:space-between"><h4>${esc(s.name)}</h4>${s.flag ? flagHTML(s.flag, 34) : ''}</div><div class="small">${esc(s.desc)}</div>
        <div>${s.alt ? '<span class="tag warn">história alternativa</span>' : ''}${s.pick ? '<span class="tag blue">escolha no mapa</span>' : ''}${s.territory ? `<span class="tag">${[s.territory.entities?.length ? s.territory.entities.length + ' países' : '', s.territory.provinces?.length ? s.territory.provinces.length + ' províncias' : ''].filter(Boolean).join(' + ')}</span>` : ''}</div></div>`).join('')}</div></div>
      <div class="panel"><h3>Dificuldade</h3><div class="seg">${Object.entries(DIFFICULTY).map(([k, v]) => `<button data-diff="${k}" class="${k === W.difficulty ? 'on' : ''}">${v.name}</button>`).join('')}</div>
      <p class="small muted">Os cenários de história alternativa são exercícios de sandbox: suas fronteiras não representam fronteiras reconhecidas internacionalmente.</p></div>`;
    {
      const sp = body.querySelector('.scen-grid')?.closest('.panel');
      if (sp) {
        sp.insertAdjacentHTML('beforebegin', `<div class="panel tight"><div class="seg"><button data-stab="player" class="${W.scenTab === 'player' ? 'on' : ''}">Cenários do jogador</button><button data-stab="world" class="${W.scenTab === 'world' ? 'on' : ''}">Cenários mundiais</button></div>${(W.worldScenario || W.customWorld) ? `<span class="tag warn" style="margin-left:8px">mundo: ${esc([BASE.worldScenarios.find(x => x.id === W.worldScenario)?.name, W.customWorld?.name].filter(Boolean).join(' + '))}</span>` : ''}</div>`);
        if (W.scenTab === 'world') sp.outerHTML = worldPanel();
        else {
          sp.insertAdjacentHTML('beforebegin', `<div class="panel tight"><span class="small muted">Região do mundo:</span> <select data-scat><option value="all">Todas (${data.scenarios.length} cenários)</option><option value="cold" ${W.scenCat === 'cold' ? 'selected' : ''}>❄ Países frios</option>${Object.entries(WORLD_REGIONS).map(([k, r]) => `<option value="${k}" ${W.scenCat === k ? 'selected' : ''}>${esc(r.name)} (${data.scenarios.filter(x => scenRegions(x).has(k)).length})</option>`).join('')}</select></div>`);
          const left = scenList().length - sp.querySelectorAll('.scen').length;
          if (left > 0) {
            sp.querySelector('.scen-grid').insertAdjacentHTML('afterend', `<div class="row" style="justify-content:center;margin:8px 0"><button class="small" data-scen-more>Mostrar mais cenários (${left})</button></div>`);
            const mb = sp.querySelector('[data-scen-more]');
            if ('IntersectionObserver' in window) { const ob = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { ob.disconnect(); mb.click(); } }, { rootMargin: '300px' }); ob.observe(mb); }
          }
        }
      }
    }
    body.onchange = e => { const sk = e.target.closest('[data-scat]'); if (sk) { W.scenCat = sk.value; W.scenShown = 24; render(); } };
    body.onclick = e => {
      const c = e.target.closest('[data-continue]'); if (c) return onContinue(c.dataset.continue);
      if (e.target.closest('[data-scen-more]')) { const y = window.scrollY; W.scenShown = (W.scenShown || 24) + 24; render(); window.scrollTo(0, y); return; }
      
      const st = e.target.closest('[data-stab]'); if (st) { W.scenTab = st.dataset.stab; return render(); }
      const cw = e.target.closest('[data-cw]');
      if (cw) {
        const k = cw.dataset.cw;
        if (k === 'off') { setCustom(null); return render(); }
        const open = def => openEditor(BASE, def, { onUse: d => { setCustom(d); render(); }, onSave: d => { const L = loadCustom(); const i = L.findIndex(x => x.name === d.name); if (i >= 0) L[i] = d; else L.push(d); saveCustom(L); } });
        if (k === 'edit') return open(W.customWorld);
        if (k === 'export') return W.customWorld && exportWorld(W.customWorld);
        if (k.startsWith('exportsaved:')) { e.stopPropagation(); const d = loadCustom()[+k.slice(12)]; if (d) exportWorld(d); return; }
        if (k.startsWith('delsaved:')) { e.stopPropagation(); const L = loadCustom(), d = L[+k.slice(9)]; if (d && confirm(`Apagar "${d.name}" dos mundos salvos?`)) { L.splice(+k.slice(9), 1); saveCustom(L); render(); } return; }
        if (k === 'saveactive') { const d = W.customWorld; if (!d) return; const L = loadCustom(), i = L.findIndex(x => x.name === d.name); if (i >= 0) L[i] = structuredClone(d); else L.push(structuredClone(d)); return saveCustom(L) ? (toast(`Mundo "${esc(d.name)}" salvo (${L.length} no total).`, 'good'), render()) : toast('Não foi possível salvar: armazenamento do navegador cheio. Use Exportar JSON.', 'bad'); }
        if (k === 'exportall') return exportAll(loadCustom());
        if (k === 'copycode') { const d = W.customWorld; if (!d) return; return encodeWorld(d).then(c => { (navigator.clipboard?.writeText(c) || Promise.reject()).then(() => toast('Código copiado. Cole em outro navegador com "Colar código".', 'good'), () => { prompt('Copie o código abaixo:', c); }); }); }
        if (k === 'pastecode') { const c = prompt('Cole o código do mundo (começa com IS1:)'); if (c) importCode(BASE, c, d => { const L = loadCustom(), i = L.findIndex(x => x.name === d.name); if (i >= 0) L[i] = d; else L.push(d); saveCustom(L); setCustom(d); render(); }); return; }
        if (k.startsWith('dupsaved:')) { e.stopPropagation(); const L = loadCustom(), d = L[+k.slice(9)]; if (d) { let n = d.name + ' (cópia)', j = 2; while (L.some(x => x.name === n)) n = `${d.name} (cópia ${j++})`; L.push({ ...structuredClone(d), name: n }); saveCustom(L); render(); } return; }
        if (k.startsWith('rensaved:')) { e.stopPropagation(); const L = loadCustom(), d = L[+k.slice(9)]; if (d) { const n = prompt('Novo nome do mundo:', d.name); if (n && n.trim() && !L.some((x, j) => j !== +k.slice(9) && x.name === n.trim())) { d.name = n.trim(); saveCustom(L); render(); } else if (n) toast('Nome vazio ou já usado.', 'warn'); } return; }
        if (k === 'import') return importWorld(BASE, d => { const L = loadCustom(), i = L.findIndex(x => x.name === d.name); if (i >= 0) L[i] = d; else L.push(d); saveCustom(L); setCustom(d); render(); });
        if (k === 'new') return open({ id: 'custom', name: 'Meu mundo', desc: '', nations: [] });
        if (k.startsWith('preset:')) { const d = presetWorld(BASE, k.slice(7)); if (d) { d.pid = k.slice(7); setCustom(d); toast('Preset carregado. Abra "Editar" para ajustar nações, bandeiras e papéis.', 'good'); } return render(); }
        if (k.startsWith('saved:')) { const d = loadCustom()[+k.slice(6)]; if (d) setCustom(d); return render(); }
      }
      const ws = e.target.closest('[data-wscn]'); if (ws) { W.worldScenario = ws.dataset.wscn || null; return render(); }
      const wh = e.target.closest('[data-whost]'); if (wh) { W.worldHostile = wh.dataset.whost; return render(); }
      const sc = e.target.closest('[data-scen]'); if (sc) { applyScenario(sc.dataset.scen); render(); }
      const d = e.target.closest('[data-diff]'); if (d) { W.difficulty = d.dataset.diff; render(); }
      const md = e.target.closest('[data-mode-pick]'); if (md) { W.mode = md.dataset.modePick; render(); }
      const ch = e.target.closest('[data-challenge]'); if (ch) return quickStart(ch.dataset.challenge);
      if (e.target.closest('[data-daily]')) return quickStart(null, true);
      const pk = e.target.closest('[data-perk]'); if (pk) { const k = pk.dataset.perk; W.perks = W.perks.includes(k) ? W.perks.filter(x => x !== k) : [...W.perks, k]; render(); }
    };
  }

  function stepTerritory(body) {
    const sc = scen();
    body.innerHTML = `<div class="grid" style="grid-template-columns:minmax(0,1fr) 340px"><div class="panel tight"><div class="row small" style="margin-bottom:6px;justify-content:space-between">
        <span><b>Seleção:</b> <span class="seg"><button data-mode="c" class="${!W.provinceMode ? 'on' : ''}">Países inteiros</button><button data-mode="p" class="${W.provinceMode && !W.munMode ? 'on' : ''}">Províncias</button><button data-mode="m" class="${W.munMode ? 'on' : ''}" title="Divide as províncias em municípios">Municípios</button></span></span>
        <span>${sc.pick === 'single' ? '<b>Escolha um país.</b>' : 'Clique para adicionar/remover. Role para aproximar; arraste para mover.'}</span><button class="small" data-clear>Limpar</button></div>
      <div data-map></div></div><div><div class="panel" data-munpanel hidden style="margin-bottom:8px"></div><div class="panel" data-stats></div></div></div>`;
    const mapEl = $('[data-map]', body);
    W.map = new WorldMap(mapEl, data.geo, {
      onOverlay: k => cellClick(k),
      color: (pid, own) => W.sel.has(pid) ? '#e7b730' : tintOf(own), selection: W.sel, provinceMode: W.provinceMode,
      tip: (pid, own) => { const e = data.reg[own], P = data.geo.prov[pid]; return `<div class="tip-h">${entityFlag(e, 24, data.reg)} <b>${esc(e?.name || own)}</b></div>${W.provinceMode ? `Província: <b>${esc(P.n)}</b><br>` : ''}População: ${num((e?.pop || 0) / 1e6, 1)} mi · PIB: ${num((e?.gdp || 0) / 1000, 0)} bi US$<br><span class="muted">${esc(e?.profile?.govName || e?.cat || '')}</span>${e && !e.playable ? '<br><b class="c-bad">Não selecionável</b>' : ''}`; },
      onClick: (pid, own) => {
        const e = data.reg[own];
        if (!e?.playable) return toast('Esta área não pode ser selecionada.', 'warn');
        if (W.munMode && sc.pick !== 'single') { W.munOpen.add(pid); return drawMun(); }
        const ids = W.provinceMode ? [pid] : data.geo.byCountry[own];
        if (sc.pick === 'single') {
          W.sel = new Set(data.geo.byCountry[own]);
          W.nation = { ...W.nation, officialName: e.formal || e.name, shortName: e.name, capital: '', regime: '', currency: 'moeda nacional' };
          if (e.iso2 && hasIsoFlag(e.iso2)) { W.flag = { iso: e.iso2 }; W.flagTab = 'current'; }
        }
        else { const has = ids.every(p => W.sel.has(p)); for (const p of ids) has ? W.sel.delete(p) : W.sel.add(p); }
        W.map.o.selection = W.sel; W.capitalProv = null; W.map.recolor(); stats();
      },
    });
    drawMun();
    if (W.sel.size) requestAnimationFrame(() => W.map.zoomToProvinces(W.sel, 0.5));
    stats();
    body.onclick = e => {
      const mu = e.target.closest('[data-munall],[data-munnone],[data-munclose]');
      if (mu) { const pid = mu.dataset.munall || mu.dataset.munnone || mu.dataset.munclose; if (mu.dataset.munclose) { W.munOpen.delete(pid); drawMun(); } else setAllCells(pid, !!mu.dataset.munall); return; }
      const m = e.target.closest('[data-mode]'); if (m) { W.munMode = m.dataset.mode === 'm'; W.provinceMode = m.dataset.mode !== 'c'; W.map.o.provinceMode = W.provinceMode; renderMunPanel(); W.map.recolor(); body.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b === m)); }
      if (e.target.closest('[data-clear]')) { W.sel.clear(); W.selMun = {}; W.munOpen = new Set(); W.map.recolor(); drawMun(); stats(); }
      const rm = e.target.closest('[data-rm]'); if (rm) { for (const p of data.geo.byCountry[rm.dataset.rm]) W.sel.delete(p); for (const pid of Object.keys(W.selMun)) if (data.geo.prov[pid].a3 === rm.dataset.rm) delete W.selMun[pid]; W.map.recolor(); drawMun(); stats(); }
      const z = e.target.closest('[data-zoomsel]'); if (z) W.map.zoomToProvinces(W.sel, 0.4);
    };
    body.onchange = e => { if (e.target.matches('[data-cap]')) W.capitalProv = e.target.value; };
  }

  function stats() {
    const box = $('[data-stats]', el);
    if (!box) return;
    refreshDV();
    const data = DV, SEL = selIds();
    if (!SEL.length) { box.innerHTML = '<h3>Território</h3><p class="muted">Nenhum território selecionado.</p>'; return; }
    const ts = territoryStats(data, SEL);
    const parts = components(data, SEL);
    const partial = ts.comps.filter(c => !c.full);
    const big = ts.comps[0];
    const capDefault = W.capitalProv || (SEL.includes(data.reg[big.id]?.capital?.prov) ? data.reg[big.id].capital.prov : SEL.reduce((b, p) => (data.geo.prov[p].pop || 0) > (data.geo.prov[b].pop || 0) ? p : b, SEL[0]));
    W.capitalProv = capDefault;
    // Nome e bandeira automáticos: país inteiro = nome do país; recorte = região mais influente (a menos que você edite).
    if (!W.nameEdited && !scen().nation) {
      const allFull = ts.comps.length > 0 && ts.comps.every(c => c.full);
      if (allFull) { const e = data.reg[big.id]; if (e) { W.nation.shortName = e.name; W.nation.officialName = e.formal || e.name; if (!W.flagEdited && e.iso2 && hasIsoFlag(e.iso2)) { W.flag = { iso: e.iso2 }; W.flagTab = 'current'; } } }
      else {
        const idn = regionalIdentity(data, SEL), top = SEL.reduce((b, p) => (data.geo.prov[p].pop || 0) > (data.geo.prov[b].pop || 0) ? p : b, SEL[0]), nm = idn?.name || data.geo.prov[top].n;
        W.nation.shortName = nm; W.nation.officialName = (SEL.length > 1 ? 'República Federal de ' : 'República de ') + nm;
        if (!W.flagEdited && idn) { W.flag = { reg: idn.key }; W.flagTab = 'reg'; }
      }
    }
    if (!W.leaderEdited && !scen().nation && W.cultureFor !== big.id) { W.cultureFor = big.id; W.nation.leader = 'Presidente ' + leaderName(cultureOf(data, big.id)); }
    const capOpts = SEL.sort((a, b) => (data.geo.prov[b].pop || 0) - (data.geo.prov[a].pop || 0)).slice(0, 60);
    const att = ts.neighbors.filter(n => data.reg[n]?.playable).map(n => {
      let v = 0, w = 0;
      for (const c of ts.comps) { const r = relRecord(data, n, c.id); const ww = c.pop / Math.max(1, ts.pop); if (r) { v += r.s * ww; w += ww; } }
      if (partial.some(c => c.id === n)) v -= 60;
      return [n, v];
    }).sort((a, b) => a[1] - b[1]);
    const lbl = v => v <= -40 ? ['Hostil', 'bad'] : v <= -10 ? ['Desconfiado', 'warn'] : v < 25 ? ['Neutro', ''] : ['Amistoso', 'good'];
    box.innerHTML = `<h3>Seu território</h3>
      <div class="chiplist">${ts.comps.map(c => `<span class="tag ${c.full ? 'blue' : 'warn'}" data-rm="${c.id}" title="Remover">${entityFlag(data.reg[c.id], 14, data.reg)} ${esc(c.name)}${c.full ? '' : ` (${c.pids.length} prov.)`} ✕</span>`).join('')}</div>
      <table class="data" style="margin-top:6px">
        <tr><td>Área</td><td class="num">${num(ts.area / 1000, 0)} mil km² · ${SIZE_NAMES[ts.sizeClass]}</td></tr>
        <tr><td>População (est.)</td><td class="num">${num(ts.pop / 1e6, 2)} mi</td></tr>
        <tr><td>Províncias / países-base</td><td class="num">${ts.provinces} / ${ts.comps.length}</td></tr>
        <tr><td>Capacidade econômica</td><td class="num">${num(ts.gdp, 0)} bi · ${num(ts.gdppc, 0)} per capita</td></tr>
        <tr><td>Infraestrutura (est.)</td><td class="num">${num(ts.infra, 0)}/100</td></tr>
        <tr><td>Potencial militar</td><td class="num">≈ ${num(ts.troops, 0)} mil soldados${ts.nuclear ? ' · <b>arsenal nuclear</b>' : ''}</td></tr>
        <tr><td>Recursos naturais</td><td class="small">${ts.resources.slice(0, 5).map(r => RES_NAMES[r] || r).join(', ') || 'escassos'}</td></tr>
        <tr><td>Acesso ao mar</td><td class="num">${ts.coast ? `sim (${num(ts.coastShare * 100, 0)}% das províncias costeiras)` : '<b class="c-bad">não</b>'}</td></tr>
        <tr><td>Exposição de fronteira</td><td class="num">${ts.neighbors.length} vizinhos · ${num(ts.borderShare * 100, 0)}% das províncias</td></tr>
        <tr><td>Dificuldade administrativa</td><td>${bar(ts.adminDifficulty, ts.adminDifficulty > 60 ? 'bad' : ts.adminDifficulty > 35 ? 'warn' : 'good')} <span class="small">${num(ts.adminDifficulty, 0)}</span></td></tr></table>
      <p class="small muted">Estimativas: população por província a partir de cidades e área (Natural Earth); PIB proporcional à população de cada país-base.</p>
      ${parts.length > 1 ? `<div class="small ${parts.length > 3 ? 'c-bad' : 'c-warn'}">⚠ Território em ${parts.length} partes desconectadas${ts.exclaves ? ` (${ts.exclaves} exclave(s) terrestres grandes)` : ' (ilhas e ultramar são aceitos)'}. Isso aumenta custos administrativos e o separatismo.</div>` : ''}
      ${partial.length ? `<div class="small c-bad">⚠ Países divididos: ${partial.map(c => esc(c.name)).join(', ')} não aceitarão a perda de províncias e passarão a reivindicá-las.</div>` : ''}
      <label class="small" style="display:block;margin-top:6px">Capital: <select data-cap>${capOpts.map(p => `<option value="${p}" ${p === W.capitalProv ? 'selected' : ''}>${esc(data.geo.prov[p].n)} (${esc(data.reg[data.geo.prov[p].a3]?.name || '')})</option>`).join('')}</select></label>
      <h3 style="margin-top:10px">Reações prováveis dos vizinhos</h3><div class="small">${att.slice(0, 10).map(([n, v]) => { const [t, k] = lbl(v); return `<div>${entityFlag(data.reg[n], 14, data.reg)} ${esc(data.reg[n].name)} — <span class="c-${k || 'neutral'}">${t}</span></div>`; }).join('') || '<span class="muted">Sem vizinhos terrestres.</span>'}</div>
      <p class="small muted">A ideologia escolhida no questionário também altera essas reações.</p><button class="small" data-zoomsel>Enquadrar seleção</button>`;
  }

  function stepIdentity(body) {
    const comps = W.sel.size ? territoryStats(data, [...W.sel]).comps : [];
    const field = (k, label) => `<label>${label}</label><input data-f="${k}" value="${esc(W.nation[k] || '')}">`;
    const hist = historicalFlags();
    const isoList = Object.values(data.reg).filter(e => e.iso2 && hasIsoFlag(e.iso2)).sort((a, b) => a.name.localeCompare(b.name));
    const compIso = comps.map(c => data.reg[c.id]).filter(e => e?.iso2 && hasIsoFlag(e.iso2));
    body.innerHTML = `<div class="grid g2"><div class="panel"><h3>Identidade nacional</h3><div class="form-grid">
        ${field('officialName', 'Nome oficial')}${field('shortName', 'Nome curto')}${field('leader', 'Governante')}${field('capital', 'Nome da capital')}${field('currency', 'Moeda')}${field('motto', 'Lema')}${field('regime', 'Nome do regime')}</div>
        <p class="small muted">Deixe "nome da capital" e "nome do regime" vazios para usar a cidade da província escolhida e a classificação ideológica.</p></div>
      <div class="panel"><h3>Bandeira</h3><div class="row" style="align-items:flex-start;flex-wrap:nowrap"><div data-flagprev>${flagHTML(W.flag, 120)}</div>
        <div class="tabs" style="flex:1">${[['current', 'Atuais'], ['hist', 'Históricas'], ['imp', 'Imperiais'], ['reg', 'Regionais'], ['custom', 'Personalizada']].map(([k, n]) => `<button data-ftab="${k}" class="${W.flagTab === k ? 'on' : ''}">${n}</button>`).join('')}</div></div>
        <div data-flagbody style="margin-top:6px"></div></div></div>`;
    const fb = $('[data-flagbody]', body);
    const setFlag = f => { W.flagEdited = true; W.flag = f; $('[data-flagprev]', body).innerHTML = flagHTML(f, 120); };
    const drawTab = () => {
      if (W.flagTab === 'current') {
        fb.innerHTML = `${compIso.length ? `<div class="small"><b>Dos seus territórios:</b></div><div class="flag-grid" style="max-height:none">${compIso.map(e => `<button data-iso="${e.iso2}" class="${W.flag.iso === e.iso2 ? 'on' : ''}">${flagHTML({ iso: e.iso2 }, 48)}${esc(e.name)}</button>`).join('')}</div>` : ''}
          <input data-fsearch placeholder="Buscar bandeira…" style="margin:6px 0;width:100%"><div data-fpg></div>
          <p class="small muted">Bandeiras atuais: pacote flag-icons (MIT), derivado do Wikimedia Commons; ver data/flags/manifest.json.</p>`;
        fb._pg?.destroy(); fb._pg = pagedGrid($('[data-fpg]', fb), isoList, { size: 48, item: e => `<button data-iso="${e.iso2}" class="${W.flag.iso === e.iso2 ? 'on' : ''}">${flagHTML({ iso: e.iso2 }, 48)}${esc(e.name)}</button>`, name: e => e.name });
      } else if (W.flagTab === 'imp' || W.flagTab === 'reg') {
        const imp = W.flagTab === 'imp', list = regionalFlags().filter(x => !!x.imperial === imp).sort((a, b) => a.name.localeCompare(b.name));
        fb.innerHTML = list.length ? `<input data-fsearch placeholder="Buscar…" style="margin:6px 0;width:100%"><div data-fpg></div><p class="small muted">${imp ? 'Bandeiras de impérios e monarquias históricas' : 'Bandeiras de estados, províncias, repúblicas e movimentos regionais'} (Wikimedia Commons, licenças livres; ver docs/flag-sources.md).</p>` : '<p class="small muted">Nenhuma bandeira deste grupo foi empacotada ainda (rode tools/build-regional-flags.mjs).</p>';
        fb._pg?.destroy(); fb._pg = null;
        if (list.length) fb._pg = pagedGrid($('[data-fpg]', fb), list, { size: 48, item: x => `<button data-regf="${x.key}" class="${W.flag.reg === x.key ? 'on' : ''}">${flagHTML({ reg: x.key }, 48)}${esc(x.name)}</button>`, name: x => x.name });
      } else if (W.flagTab === 'hist') {
        fb.innerHTML = `<div class="flag-grid">${Object.entries(hist).map(([k, h]) => `<button data-hist="${k}" class="${W.flag.hist === k ? 'on' : ''}">${flagHTML({ hist: k }, 48)}${esc(h.name)}<span class="muted">${esc(h.years)}</span></button>`).join('')}</div><p class="small muted">Designs históricos simplificados. Bandeiras do Terceiro Reich foram excluídas.</p>`;
      } else {
        if (!W.flag.layout) W.flag = W.flag.hist ? structuredClone(hist[W.flag.hist].spec) : defaultFlag();
        mountFlagEditor(fb, W.flag, f => setFlag(f));
        setFlag(W.flag);
      }
    };
    drawTab();
    body.onclick = e => {
      const t = e.target.closest('[data-ftab]'); if (t) { W.flagTab = t.dataset.ftab; body.querySelectorAll('[data-ftab]').forEach(b => b.classList.toggle('on', b === t)); drawTab(); }
      const i = e.target.closest('[data-iso]'); if (i) { setFlag({ iso: i.dataset.iso }); fb.querySelectorAll('[data-iso]').forEach(b => b.classList.toggle('on', b.dataset.iso === i.dataset.iso)); }
      const rf = e.target.closest('[data-regf]'); if (rf) { setFlag({ reg: rf.dataset.regf }); fb.querySelectorAll('[data-regf]').forEach(b => b.classList.toggle('on', b === rf)); }
      const h = e.target.closest('[data-hist]'); if (h) { setFlag({ hist: h.dataset.hist }); fb.querySelectorAll('[data-hist]').forEach(b => b.classList.toggle('on', b === h)); }
    };
    body.oninput = e => {
      if (e.target.dataset.f) { W.nation[e.target.dataset.f] = e.target.value; if (e.target.dataset.f === 'leader') W.leaderEdited = true; if (e.target.dataset.f === 'officialName' || e.target.dataset.f === 'shortName') W.nameEdited = true; }
      if (e.target.matches('[data-fsearch]')) fb._pg?.reset(e.target.value);
    };
  }

  const IDEO = [
    ['Socialismo', { econ: -85, redist: 85, trad: -30, relig: -40, auth: 20, central: 50, tech: 40, align: -50 }],
    ['Social-democracia', { econ: -25, redist: 60, auth: -40, global: 50, eco: 30, align: 20, trad: -30 }],
    ['Capitalismo liberal', { econ: 85, redist: -50, auth: -45, global: 60, trad: -20, tech: 40, align: 50 }],
    ['Libertarianismo', { econ: 90, redist: -80, auth: -85, central: -50, global: 40 }],
    ['Conservadorismo nacionalista', { trad: 70, nation: 70, auth: 40, relig: 40, econ: 30, mil: 30, global: -30 }],
    ['Autoritarismo militar', { auth: 85, mil: 80, nation: 60, central: 60, expand: 30 }],
    ['Teocracia', { relig: 90, trad: 80, auth: 60, nation: 40, econ: -10 }],
    ['Ecologismo', { eco: 85, redist: 40, auth: -30, tech: 10, global: 40, econ: -20 }],
  ];
  function applyIdeo(target) {
    W.answers = data.identity.questions.map(q => { let best = 0, bs = -1e9; q.a.forEach((a, j) => { let sc = 0; for (const k in a.ax || {}) sc += (target[k] || 0) * a.ax[k] / 100 - (target[k] == null ? Math.abs(a.ax[k]) * 0.05 : 0); if (sc > bs) { bs = sc; best = j; } }); return best; });
  }
  function stepQuestions(body) {
    const Q = data.identity.questions;
    const done = W.answers.filter(a => a != null).length;
    body.innerHTML = `<div class="panel"><b>Predefinições ideológicas</b> <span class="small muted">— escolha um ponto de partida e depois ajuste qualquer resposta com a qual não concordar.</span><div class="row" style="flex-wrap:wrap;gap:4px;margin-top:6px">${IDEO.map(([n], i) => `<button class="small" data-ideo="${i}">${n}</button>`).join('')}</div></div>
      <div class="panel row" style="justify-content:space-between"><div><b>${done}/${Q.length} respondidas.</b> Cada resposta define leis, orçamento, grupos sociais e relações iniciais — e todas juntas determinam a classificação ideológica.</div><button class="small" data-rand>Completar aleatoriamente</button></div>
      ${Q.map((q, i) => `<div class="panel q-card" data-q="${i}"><div class="cat small muted">${i + 1}. ${esc(q.topic)}</div><h3 style="border:none;margin:2px 0 8px">${esc(q.q)}</h3>
        <div class="opts">${q.a.map((a, j) => `<button data-a="${j}" class="${W.answers[i] === j ? 'on' : ''}"><b>${esc(a.t)}</b><div class="small muted">${esc(a.d)}</div></button>`).join('')}</div></div>`).join('')}`;
    body.onclick = e => {
      const pr = e.target.closest('[data-ideo]'); if (pr) { applyIdeo(IDEO[+pr.dataset.ideo][1]); return stepQuestions(body); }
      if (e.target.closest('[data-rand]')) { W.answers = W.answers.map((a, i) => a ?? Math.floor(Math.random() * Q[i].a.length)); return stepQuestions(body); }
      const b = e.target.closest('[data-a]'); if (!b) return;
      const qi = +b.closest('[data-q]').dataset.q;
      W.answers[qi] = +b.dataset.a;
      b.parentElement.querySelectorAll('[data-a]').forEach(x => x.classList.toggle('on', x === b));
      $('.panel b', body).textContent = `${W.answers.filter(a => a != null).length}/${Q.length} respondidas.`;
      const next = body.querySelector(`[data-q="${qi + 1}"]`);
      if (next && W.answers[qi + 1] == null) next.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
  }

  function observerPanel() {
    const wn = [data.worldScenarios.find(x => x.id === W.worldScenario)?.name || 'Mundo real', W.customWorld?.name].filter(Boolean).join(' + ');
    const sl = (k, n, min, max, step, v, hint) => `<label class="obs-sl"><span>${n} <b data-obsv="${k}">${k === 'obsChaos' ? v : (+v).toFixed(1) + '×'}</b></span><input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-obs="${k}"><small class="muted">${hint}</small></label>`;
    return `<div class="panel obs-setup"><h3>👁 Observatório — laboratório geopolítico</h3>
      <p class="small">Mundo escolhido: <b>${esc(wn)}</b>. Para mudar, use a aba <b>Cenários mundiais</b> logo abaixo (cenário mundial e/ou mundo customizado com as suas nações). Depois clique em <b>Iniciar observação</b>.</p>
      <div class="grid g2">${sl('obsChaos', 'Caos inicial', 0, 100, 5, W.obsChaos ?? 45, 'Mundo calmo (0) ou caótico (60+): secessões, expansionismo e guerras')}
      ${sl('obsIdeo', 'Peso da ideologia', 0, 2, 0.1, W.obsIdeo ?? 1, 'Socialistas × monarquias × democracias × nacionalistas')}
      ${sl('obsEthnic', 'Peso das etnias e do nacionalismo', 0, 2, 0.1, W.obsEthnic ?? 1, 'Irredentismo, minorias, povos sem Estado (Mapuches, Curdos, Sámi…)')}
      ${sl('obsGeno', 'Genocídios e expulsões em massa', 0, 2, 0.1, W.obsGeno ?? (W.customWorld ? 0.5 : 1), '0 = nunca · 1 = normal · 2 = bem mais comuns')}
      <label class="small" style="align-self:center"><input type="checkbox" data-obsreal ${W.obsReal === false ? '' : 'checked'}> Manter os conflitos reais em curso (ex.: Rússia × Ucrânia)</label></div>
      <button class="primary" data-obs-start style="margin-top:8px;font-size:15px">▶ Iniciar observação</button></div>`;
  }
  function startObserver() {
    const nation = { officialName: 'Observatório Mundial', shortName: 'Observatório', leader: 'Observador', capital: 'Estação Polar', currency: '—', motto: 'Ver sem intervir (ou quase)', regime: 'Observador' };
    const cfg = { spectator: true, mode: 'observer', scenario: 'custom', provinces: ['ATA+99?'], answers: data.identity.questions.map(() => 1), difficulty: 'normal', flag: { layout: 'solid', colors: ['#1d2b45'], emblems: [{ type: 'globe', alt: 'circle', color: '#ffffff', x: 0.5, y: 0.5, s: 0.5 }] },
      worldScenario: W.worldScenario, customWorld: W.customWorld || null, worldHostile: 'ideology', nation, lab: { chaos: W.obsChaos ?? 45, ideo: W.obsIdeo ?? 1, ethnic: W.obsEthnic ?? 1, genocide: W.obsGeno ?? (W.customWorld ? 0.5 : 1), realConflicts: W.obsReal !== false } };
    const pg = new Game(BASE, null);
    try { pg.start(cfg); } catch (e) { console.error(e); return toast('Não foi possível iniciar o Observatório: ' + esc(e.message), 'bad'); }
    pg.s.world.chaos = (W.obsChaos ?? 45) >= 60;
    onStart(pg.s);
  }
  function modePanel() {
    const meta = loadMeta(game.storage), daily = dailyConfig(), spent = W.perks.reduce((a, k) => a + PERKS[k].cost, 0);
    return `<div class="panel"><h3>Modo de jogo</h3><div class="seg" style="flex-wrap:wrap">${Object.entries(MODES).map(([k, m]) => `<button data-mode-pick="${k}" class="${W.mode === k ? 'on' : ''}" title="${esc(m.desc)}">${m.name}</button>`).join('')}</div>
      <p class="small">${esc(MODES[W.mode].desc)}</p>
      ${W.mode === 'observer' ? observerPanel() : ''}
      ${W.mode === 'challenge' ? `<div class="grid g3">${CHALLENGES.map(c => `<div class="panel tight"><b>${esc(c.name)}</b> <span class="tag">${c.weeks} semanas</span><div class="small">${esc(c.desc)}</div><div class="small muted">País: ${esc(data.reg[c.country]?.name || c.country)} · meta: ${esc(c.goalText)} · recorde: ${meta.best['challenge-' + c.id] || '—'}</div><button class="primary small" data-challenge="${c.id}" style="margin-top:4px">Começar</button></div>`).join('')}</div>` : ''}
      ${W.mode === 'daily' ? `<div class="panel tight"><b>Desafio de ${esc(daily.key)}</b>: ${esc(data.reg[daily.country]?.name || daily.country)} — ${esc(CHALLENGES.find(c => c.id === daily.challenge).name)} (30 semanas). Todos que jogarem hoje terão a mesma situação e a mesma sorte. Seu recorde de hoje: ${meta.best['daily-' + daily.key] || '—'}<br><button class="primary small" data-daily style="margin-top:4px">Jogar o desafio do dia</button></div>` : ''}
      ${W.mode === 'roguelite' ? `<div class="panel tight">Legado acumulado: <b>${meta.legacy}</b> pontos · temporadas jogadas: ${meta.runs}. Escolha vantagens para esta temporada (custo total ${spent}):<div class="grid g3" style="margin-top:4px">${Object.entries(PERKS).map(([k, p]) => `<label class="small"><input type="checkbox" data-perk="${k}" ${W.perks.includes(k) ? 'checked' : ''} ${!W.perks.includes(k) && spent + p.cost > meta.legacy ? 'disabled' : ''}> <b>${esc(p.name)}</b> (${p.cost}) — ${esc(p.desc)}</label>`).join('')}</div><div class="small muted">Depois, escolha o cenário e avance normalmente.</div></div>` : ''}
      ${meta.history?.length ? `<details class="small" style="margin-top:4px"><summary>Suas últimas partidas</summary><table class="data">${meta.history.slice(0, 10).map(h => `<tr><td>${new Date(h.day).toLocaleDateString('pt-BR')}</td><td>${esc(MODES[h.mode]?.name || h.mode)}</td><td>${esc(h.name)}</td><td class="num">${h.score}</td></tr>`).join('')}</table></details>` : ''}</div>`;
  }
  // Desafios e desafio diário começam direto, com país, ideologia e sorte definidos pela semente.
  function quickStart(chId, isDaily) {
    const dc = dailyConfig(), id = isDaily ? dc.challenge : chId, c = CHALLENGES.find(x => x.id === id);
    const country = isDaily ? dc.country : c.country, e = data.reg[country];
    const seed = isDaily ? dc.seed : 'challenge-' + id + '-' + Date.now();
    let h = 0; for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const answers = data.identity.questions.map((q, i) => ((h >> (i % 24)) + i) % q.a.length);
    const cfg = { seed, mode: isDaily ? 'daily' : 'challenge', modeCfg: { challenge: id, key: isDaily ? dc.key : undefined, weeks: isDaily ? 30 : c.weeks }, scenario: 'existing', provinces: data.geo.byCountry[country], answers, difficulty: W.difficulty,
      flag: e?.iso2 && hasIsoFlag(e.iso2) ? { iso: e.iso2 } : defaultFlag(), nation: { officialName: e?.formal || e?.name, shortName: e?.name, leader: 'Presidente ' + leaderName(cultureOf(data, country)), capital: '', currency: 'moeda nacional', motto: '', regime: '' } };
    const pg = new Game(BASE, null); pg.start(cfg);
    onStart(pg.s);
  }
  function buildCfg() {
    const cls = classify(W.answers, data.identity);
    return { mode: W.mode, modeCfg: W.mode === 'roguelite' ? { perks: W.perks } : {}, scenario: W.scenario, provinces: selIds(), splits: splitsOf(), answers: W.answers, difficulty: W.difficulty, flag: W.flag, capitalProv: W.capitalProv, worldScenario: W.worldScenario, customWorld: W.customWorld || null, worldHostile: W.worldHostile,
      nation: { ...W.nation, capital: W.nation.capital || '', regime: W.nation.regime || cls.government } };
  }

  function stepResult(body) {
    const cfg = buildCfg();
    const pg = new Game(BASE, null);
    pg.start(cfg);
    W.preview = pg;
    const s = pg.s, I = s.nation.ideology;
    const ax = I.axes;
    const sorted = Object.entries(s.partners).filter(([id]) => s.world.c[id] && !s.world.c[id].dep).sort((a, b) => a[1].rel - b[1].rel);
    const row = (id, p) => `<div>${entityFlag(data.reg[id] || s.world.ents?.[id], 16, data.reg)} ${esc((data.reg[id] || s.world.ents?.[id])?.name || id)} <b class="${p.rel > 0 ? 'c-good' : 'c-bad'}">${signed(p.rel, 0)}</b></div>`;
    const claims = s.world.claims.filter(c => c.holder === 'PLY');
    body.innerHTML = `<div class="panel" style="border-left:6px solid ${W.chaos ? '#c0392b' : '#888'}"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:8px"><div style="flex:1;min-width:260px"><h3 style="border:none;margin:0">🌪 Mundo caótico ${W.chaos ? '<span class="tag red">LIGADO</span>' : '<span class="tag">desligado</span>'}</h3>
      <div class="small">Uma IA bem mais ativa: países expansionistas invadem vizinhos, regiões proclamam independência (Curdistão, Catalunha, Québec, Biafra, Tibete…) com nome, bandeira e políticas próprias, e os novos Estados formam alianças, pedem reconhecimento e entram em guerra — inclusive com você. Separatistas dentro do seu país também ficam mais ousados.</div></div>
      <button class="${W.chaos ? 'primary' : ''}" data-chaos>${W.chaos ? 'Desligar mundo caótico' : 'Ligar mundo caótico'}</button></div></div>
      <div class="grid g2"><div class="panel"><div class="row" style="flex-wrap:nowrap">${flagHTML(s.nation.flag, 90)}<div><div class="small muted">Classificação ideológica</div><h2 style="margin:0">${esc(I.primary)}</h2>
        <div>${I.traits.map(t => `<span class="tag blue">${esc(t)}</span>`).join('')}</div><div class="small muted">Correspondência com o arquétipo: ${I.match}% · próximos: ${I.runnerUp.map(r => esc(r.name)).join(', ')}</div></div></div>
      <table class="data" style="margin-top:8px"><tr><td>Modelo econômico</td><td>${esc(I.economic)}</td></tr><tr><td>Estrutura de governo</td><td>${esc(I.government)}</td></tr><tr><td>Orientação social</td><td>${esc(I.social)}</td></tr><tr><td>Política externa</td><td>${esc(I.foreign)}</td></tr></table>
      <h3 style="margin-top:10px">Por que essa classificação</h3><ul class="small">${I.why.map(w => `<li>${esc(w.text)}</li>`).join('')}</ul>
      <h3>Eixos</h3><div style="display:grid;grid-template-columns:110px 1fr 110px;gap:3px 8px;font-size:11px;align-items:center">${AXES.map(k => `<span class="right muted">${esc(data.identity.axes[k][0])}</span><div class="axisbar"><i style="left:${(ax[k] + 100) / 2}%"></i></div><span class="muted">${esc(data.identity.axes[k][1])}</span>`).join('')}</div></div>
      <div class="panel"><h3>Consequências iniciais</h3><table class="data">
        <tr><td>População</td><td class="num">${num(s.econ.pop, 1)} mi</td></tr><tr><td>PIB</td><td class="num">${money(s.econ.gdp)}</td></tr><tr><td>Carga tributária</td><td class="num">${num(s.budget.tax, 0)}%</td></tr>
        <tr><td>Direitos civis / liberdade política</td><td class="num">${num(s.st.civil, 0)} / ${num(s.st.political, 0)}</td></tr><tr><td>Modelo econômico (0 estatal–100 mercado)</td><td class="num">${num(s.st.market, 0)}</td></tr>
        <tr><td>Estabilidade / legitimidade</td><td class="num">${num(s.st.stability, 0)} / ${num(s.st.legitimacy, 0)}</td></tr><tr><td>Separatismo</td><td class="num">${num(s.st.separatism, 0)}</td></tr>
        <tr><td>Influência militar</td><td class="num">${num(s.groups.military, 0)} de satisfação · gasto ${num(s.budget.spend.military, 1)}% PIB</td></tr>
        <tr><td>Organizações</td><td>${Object.keys(s.orgs).map(o => esc(data.wOrgById[o]?.short || o)).join(', ') || 'nenhuma'}</td></tr>
        <tr><td>Reivindicações contra você</td><td>${claims.length ? claims.slice(0, 5).map(c => esc(data.reg[c.claimant]?.name || c.claimant)).join(', ') : 'nenhuma'}</td></tr></table>
        <div class="grid g2" style="margin-top:8px"><div><b class="small">Mais hostis</b><div class="small">${sorted.slice(0, 7).map(([id, p]) => row(id, p)).join('')}</div></div><div><b class="small">Mais amistosos</b><div class="small">${sorted.slice(-7).reverse().map(([id, p]) => row(id, p)).join('')}</div></div></div>
        <h3 style="margin-top:8px">Gabinete</h3><div class="small">${s.characters.map(c => `<div>${esc(c.name)} — ${esc(c.role)} (lealdade ${num(c.loyalty, 0)})</div>`).join('')}</div>
        <h3 style="margin-top:8px">Primeiras missões</h3><div class="small">${s.missions.active.map(m => `<div>• <b>${esc(MISSIONS[m.id].name)}</b>: ${esc(MISSIONS[m.id].desc)}</div>`).join('') || '—'}</div></div></div>`;
  }

  el.addEventListener('click', e => {
    if (e.target.closest('[data-chaos]')) { W.chaos = !W.chaos; render(); return; }
    if (e.target.closest('[data-obs-start]')) return startObserver();
    if (W.step === 0 && W.mode === 'observer' && e.target.closest('[data-next]')) return startObserver();
    if (e.target.closest('[data-prev]')) { W.step = Math.max(0, W.step - 1); render(); }
    if (e.target.closest('[data-next]')) {
      if (W.step === 1 && !selIds().length) return toast('Selecione ao menos um território.', 'warn');
      if (W.step === 3 && W.answers.some(a => a == null)) return toast('Responda a todas as perguntas (ou use uma predefinição ou "Completar aleatoriamente").', 'warn');
      if (W.step === 4) { W.preview.s.world.chaos = W.chaos; if (W.mode === 'roguelite' && W.perks.length) { const M = loadMeta(game.storage); M.legacy -= W.perks.reduce((a, k) => a + PERKS[k].cost, 0); saveMeta(game.storage, M); } return onStart(W.preview.s); }
      if (W.step === 0 && !W.sel.size && scen().territory) applyScenario(W.scenario);
      W.step++; render(); window.scrollTo(0, 0);
    }
  });
  el.addEventListener('input', e => {
    const t = e.target.closest('[data-obs]'); if (!t) return;
    W[t.dataset.obs] = +t.value; const b = el.querySelector(`[data-obsv="${t.dataset.obs}"]`); if (b) b.textContent = t.dataset.obs === 'obsChaos' ? t.value : (+t.value).toFixed(1) + '×';
  });
  el.addEventListener('change', e => { if (e.target.matches('[data-obsreal]')) W.obsReal = e.target.checked; });
  applyScenario('custom');
  render();
}
