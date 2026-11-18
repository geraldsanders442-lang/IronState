// Editor do Mundo customizado ("País fraturado"): presets, fratura automática, edição de nações (nome, líder, regime,
// papel, bandeira) e atribuição de províncias no mapa.
import { esc, num, modal, toast } from './dom.js';
import { li } from './lucide.js';
import { WorldMap } from './worldmap.js';
import { flagHTML, mountFlagEditor } from './flag.js';
import { pagedGrid } from './paginate.js';
import { REGIMES, ROLES, PRESETS, presetWorld, fracture, autoFlag, autoRoles, loadCustom, saveCustom, regionalIdentity } from '../sim/customworld.js';
import { POSTURES, FAMILIES, famOfProfile, ideoRel } from '../sim/ideofam.js';
import { relRecord } from '../sim/world.js';
import { regionalFlags, historicalFlags, hasIsoFlag, defaultFlag } from './flag.js';
import { regionalBest } from '../sim/regflags.js';
import { personName, cultureOf, leaderName } from '../sim/names.js';

const COLORS = ['#e4572e', '#17bebb', '#ffc914', '#76b041', '#9b5de5', '#f15bb5', '#2e86ab', '#f4a259', '#5b8e7d', '#bc4b51', '#8d99ae', '#a3b18a'];

export function customPanelHTML(W, list) {
  const cur = W.customWorld;
  return `<div class="panel"><h3>${li('split', 18)} Mundo customizado / País fraturado</h3>
    <p class="small muted">Crie nações novas dividindo países (a Rússia fragmentada, um Brasil do Norte, do Nordeste e do Sul...). Cada nação tem nome, bandeira, líder, regime e papel (aliada, rival, antagonista ou neutra). Você também pode deixar tudo no automático.</p>
    ${cur ? `<div class="small"><b>Ativo:</b> ${esc(W.customWorld.name)} (${W.customWorld.nations.length} nações) <button class="small" data-cw="edit">Editar</button> <button class="small" data-cw="off">Desativar</button> <button class="small" data-cw="export">⬇ Exportar JSON</button></div>` : ''}
    <div class="small"><b>Presets</b></div><div class="scen-grid">${PRESETS.map(p => `<div class="scen ${cur && W.customWorld.pid === p.id ? 'on' : ''}" data-cw="preset:${p.id}"><h4>${li('split', 14)} ${esc(p.name)}</h4><div class="small">${esc(p.desc)}</div></div>`).join('')}</div>
    ${list.length ? `<div class="small" style="margin-top:6px"><b>Seus mundos salvos</b></div><div class="scen-grid">${list.map((d, i) => `<div class="scen" data-cw="saved:${i}"><h4>${esc(d.name)}</h4><div class="small">${d.nations.length} nações</div><div class="row" style="gap:4px;margin-top:4px"><button class="small" data-cw="exportsaved:${i}" title="Baixar este mundo como arquivo JSON">⬇ JSON</button><button class="small" data-cw="delsaved:${i}" title="Apagar dos mundos salvos">✕</button></div></div>`).join('')}</div>` : ''}
    <div style="margin-top:8px"><button class="primary" data-cw="new">${li('plus', 14)} Criar mundo do zero</button> <button data-cw="import" title="Carregar um mundo exportado (.json)">⬆ Importar JSON</button></div></div>`;
}

export function openEditor(data, def, { onUse, onSave }) {
  const E = { def: structuredClone(def), sel: def.nations[0]?.id || null, mode: 'prov', flagFor: null, first: true };
  const prov = data.geo.prov, byId = id => E.def.nations.find(n => n.id === id);
  const colorOf = id => COLORS[Math.max(0, E.def.nations.findIndex(n => n.id === id)) % COLORS.length];
  const assign = () => { const a = {}; for (const n of E.def.nations) for (const p of n.provs) a[p] = n.id; return a; };
  const sov = Object.values(data.reg).filter(e => e.playable && e.cat === 'sovereign' && (data.geo.byCountry[e.id] || []).length > 1).sort((a, b) => a.name.localeCompare(b.name, 'pt'));
  let map = null, A = assign();
  // Rascunho automático: nada se perde ao fechar sem querer.
  const DKEY = 'ironstate.cwdraft';
  const saveDraft = () => { try { localStorage.setItem(DKEY, JSON.stringify({ def: E.def, at: Date.now() })); } catch {} };
  const clearDraft = () => { try { localStorage.removeItem(DKEY); } catch {} };
  if (!E.def.nations.length) { try { const d = JSON.parse(localStorage.getItem(DKEY) || 'null'); if (d?.def?.nations?.length) { E.def = d.def; E.sel = d.def.nations[0]?.id || null; setTimeout(() => toast('Rascunho recuperado do seu último trabalho.', 'good'), 300); } } catch {} }
  const m = modal('<div data-ed></div>', { wide: true, locked: true });
  m.el.classList.add('huge');
  const root = m.el.querySelector('[data-ed]');
  const FB = { layout: 'h3', colors: ['#888', '#fff', '#888'], emblems: [] };
  // Nome e bandeira automáticos pela região mais influente (a menos que o jogador tenha editado).
  function autoIdentity(n) {
    if (!n.provs.length) return;
    // país dominante (por população) e quanto dele está incluído
    const pop = {}; for (const p of n.provs) pop[prov[p].a3] = (pop[prov[p].a3] || 0) + (prov[p].pop || 1);
    const dom = Object.keys(pop).sort((x, y) => pop[y] - pop[x])[0], reg = data.reg[dom];
    const total = (data.geo.byCountry[dom] || []).length || 1, cover = n.provs.filter(p => prov[p].a3 === dom).length / total;
    const ident = regionalIdentity(data, n.provs);
    const top = n.provs.reduce((bb, p) => (prov[p].pop || 0) > (prov[bb].pop || 0) ? p : bb, n.provs[0]);
    const isoFlag = reg?.iso2 && hasIsoFlag(reg.iso2) ? { iso: reg.iso2 } : null;
    let name, flag, region = null;
    if (cover >= 0.9 && reg) { name = reg.name; flag = isoFlag || (ident ? { reg: ident.key } : null); }            // país inteiro
    else if (ident) { name = ident.name; flag = { reg: ident.key }; region = ident.key; }                         // região com bandeira
    else { name = prov[top].n; const rb = regionalBest(data, n.provs, 0); flag = rb ? { reg: rb.key } : autoFlag(n.id, cultureOf(data, dom), dom); }                                                                  // província sem bandeira: nome dela e bandeira do país
    if (!n.manualLeader && (n.autoLeader || !n.leader)) { n.leader = leaderName(cultureOf(data, dom)); n.autoLeader = true; }
    if (!n.manualName) { n.name = name; n.formal = (n.provs.length > 1 && cover < 0.9 ? 'República Federal de ' : 'República de ') + name; }
    if (!n.manualFlag) n.flagSpec = flag || (n.flagSpec?.layout ? n.flagSpec : autoFlag(n.id, cultureOf(data, dom), dom));
    n.region = region;
  }
  // ---------- Filtros da lista (busca e continente) ----------
  const contOf = n => data.reg[n.parent]?.continent || data.reg[prov[n.provs[0]]?.a3]?.continent || 'Outros';
  const CONTS = [...new Set(Object.values(data.reg).map(e => e.continent).filter(c => c && !/Seven seas|Antarctica/.test(c)))].sort();
  const sovIn = () => sov.filter(e => !E.fcont || e.continent === E.fcont);
  const visible = () => {
    const q = (E.q || '').trim().toLowerCase();
    return E.def.nations.filter(n => (!E.cont || contOf(n) === E.cont) && (!q || `${n.name} ${n.leader || ''} ${data.reg[n.parent]?.name || ''}`.toLowerCase().includes(q)));
  };
  // ---------- Relações estimadas (as mesmas regras da IA: herança do país de origem + ideologia + minorias) ----------
  const profOf = id => { const n = byId(id); if (!n) return data.reg[id]?.profile; return { ...(data.reg[n.parent]?.profile || {}), ...(REGIMES[n.regime]?.p || {}) }; };
  const originOf = id => byId(id)?.parent || id;
  const nameOf = id => byId(id)?.name || data.reg[id]?.name || id;
  const flagOf = id => byId(id) ? (byId(id).flagSpec || FB) : (data.reg[id]?.iso2 && hasIsoFlag(data.reg[id].iso2) ? { iso: data.reg[id].iso2 } : FB);
  function estRel(a, b) {
    const oa = originOf(a), ob = originOf(b);
    const r = oa !== ob ? relRecord(data, oa, ob) : null;
    let v = r ? r.s * (oa === a && ob === b ? 1 : 0.6) : (oa === ob ? 10 : 0);
    if (!(oa === a && ob === b && r)) v += ideoRel(profOf(a), profOf(b));
    // Terras de um no território do outro (minorias e irredentismo).
    const na = byId(a), nb = byId(b);
    if (na?.provs.some(p => prov[p].a3 === b || (nb && nb.parent === prov[p].a3 && nb.parent !== na.parent))) v -= 25;
    if (nb?.provs.some(p => prov[p].a3 === a || (na && na.parent === prov[p].a3 && na.parent !== nb.parent))) v -= 25;
    for (const [x, y] of [[a, b], [b, a]]) { const n = byId(x); if (!n) continue; if (n.role === 'antagonist') v -= 10; }
    return Math.round(Math.max(-100, Math.min(100, v)));
  }
  function neighborsOf(n) {
    const own = new Set(n.provs), out = new Set();
    for (const p of n.provs) for (const q of prov[p].nb || []) if (!own.has(q)) { const o = A[q] || prov[q].a3; if (o && o !== n.id && (data.reg[o]?.playable || byId(o))) out.add(o); }
    return [...out].sort((x, y) => nameOf(x).localeCompare(nameOf(y), 'pt'));
  }
  let listScroll = 0;
  function draw() {
    saveDraft();
    A = assign();
    const fe = E.flagFor && byId(E.flagFor), cols = fe ? 'minmax(0,1fr) minmax(560px,1.5fr)' : 'minmax(0,2.1fr) minmax(340px,1fr)';
    const sc = root.querySelector('[data-list]'); if (sc) listScroll = sc.scrollTop;
    root.innerHTML = `<h3>${li('split', 18)} Editor de mundo customizado</h3>
      <div class="cw-bar"><input data-wname value="${esc(E.def.name)}" placeholder="Nome do mundo" style="min-width:200px">
        <span class="cw-group"><select data-fr-cont title="Filtrar países por continente"><option value="">Todos os continentes</option>${CONTS.map(c => `<option ${E.fcont === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
        <select data-fr-c>${sovIn().map(e => `<option value="${e.id}">${esc(e.name)}</option>`).join('')}</select><input type="number" data-fr-n min="2" max="12" value="4" style="width:56px"><button class="small" data-fr>${li('wand', 14)} Fraturar</button></span>
        <button class="small" data-addn>${li('plus', 14)} Nação vazia</button>
        <span class="seg"><button class="small ${E.mode === 'prov' ? 'on' : ''}" data-mode="prov" title="Clique atribui uma província">Província</button><button class="small ${E.mode === 'country' ? 'on' : ''}" data-mode="country" title="Clique atribui o país inteiro da província clicada">País inteiro</button></span></div>
      <div class="grid" style="grid-template-columns:${cols};margin-top:6px;gap:10px"><div><div data-map class="cw-map"></div><div class="small muted">Selecione uma nação e clique nas províncias para atribuí-las (clique de novo para remover). Nome e bandeira seguem a região mais influente; relações e postura seguem a ideologia, a história do país de origem e as minorias — e podem ser editadas na aba <b>Relações</b>.</div></div>
      <div>${fe ? flagPanel(fe) : `<div class="cw-filter"><input data-q placeholder="Buscar nação…" value="${esc(E.q || '')}"><select data-cont><option value="">Todos os continentes</option>${CONTS.map(c => `<option ${E.cont === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select><span class="small muted" data-cnt></span></div>
        <div data-list class="cw-list"></div>`}</div></div>
      <div class="row" style="margin-top:8px;gap:6px;flex-wrap:wrap"><button class="primary" data-use>Usar este mundo</button><button data-save>Salvar</button><button data-export title="Baixar este mundo como arquivo JSON">⬇ Exportar JSON</button><button data-close title="O rascunho fica guardado automaticamente">Fechar (guarda rascunho)</button></div>`;
    map = new WorldMap(root.querySelector('[data-map]'), data.geo, {
      owner: pid => A[pid] || prov[pid].a3, provinceMode: true, labels: false, search: false,
      color: (pid, own) => A[pid] ? (A[pid] === E.sel ? '#ffd54a' : colorOf(A[pid])) : '#d9d4c3',
      tip: pid => `<b>${esc(prov[pid].n)}</b><br>${A[pid] ? esc(byId(A[pid])?.name || '') : esc(data.reg[prov[pid].a3]?.name || '')}`,
      onClick: pid => {
        const n = byId(E.sel); if (!n) return toast('Selecione uma nação primeiro.', 'warn');
        const ids = E.mode === 'country' ? (data.geo.byCountry[prov[pid].a3] || [pid]) : [pid];
        const all = ids.every(x => n.provs.includes(x));
        if (all) n.provs = n.provs.filter(x => !ids.includes(x));
        else { for (const o of E.def.nations) if (o !== n) o.provs = o.provs.filter(x => !ids.includes(x)); for (const x of ids) if (!n.provs.includes(x)) n.provs.push(x); n.parent ||= prov[pid].a3; }
        A = assign(); autoIdentity(n); map.recolor(); refreshCards(); saveDraft();
      },
    });
    const everyone = new Set(E.def.nations.flatMap(n => n.provs)), sel = byId(E.sel);
    const zoomTo = !E.first && sel?.provs.length ? new Set(sel.provs) : everyone;
    const zpad = E.first ? 0.18 : 1.1; if (zoomTo.size) requestAnimationFrame(() => map.zoomToProvinces(zoomTo, zpad));
    E.first = false;
    if (fe) drawFlagBody(fe); else renderList(true);
  }
  // A lista é redesenhada sozinha (sem recriar o mapa) e mantém a posição de rolagem: a nação escolhida não "sobe".
  function renderList(restore) {
    const box = root.querySelector('[data-list]'); if (!box) return;
    const keep = restore ? listScroll : box.scrollTop, L = visible();
    box.innerHTML = L.map(n => nationCard(n)).join('') || `<p class="small muted">${E.def.nations.length ? 'Nenhuma nação com esse filtro.' : 'Nenhuma nação. Fracture um país ou crie uma nação vazia.'}</p>`;
    const cnt = root.querySelector('[data-cnt]'); if (cnt) cnt.textContent = `${L.length}/${E.def.nations.length}`;
    box.scrollTop = keep;
  }
  function select(id) {
    if (E.sel === id) return;
    E.sel = id; E.ntab = E.ntab || 'geral';
    renderList(false); map?.recolor();
    const n = byId(id); if (n?.provs.length) map.zoomToProvinces(new Set(n.provs), 1.1);
    // garante que o cartão escolhido fique visível sem pular a lista para o topo
    const c = root.querySelector(`[data-nid="${id}"]`), box = root.querySelector('[data-list]');
    if (c && box) { const top = c.offsetTop - box.offsetTop; if (top < box.scrollTop || top + c.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = Math.max(0, top - 40); }
  }
  const refreshCards = () => { for (const n of E.def.nations) { const c = root.querySelector(`[data-nid="${n.id}"]`); if (!c) continue; c.querySelector('[data-count]').textContent = n.provs.length; c.querySelector('[data-flag]').innerHTML = flagHTML(n.flagSpec || FB, 38); const inp = c.querySelector('[data-f="name"]'); if (inp && document.activeElement !== inp) inp.value = n.name; const rg = c.querySelector('[data-reg]'); if (rg) rg.textContent = n.region ? 'região: ' + regionalIdentity(data, n.provs)?.name : ''; } if (E.ntab === 'rel') { const b = root.querySelector(`[data-nid="${E.sel}"] [data-relbox]`); if (b) b.innerHTML = relBox(byId(E.sel)); } };
  const relBox = n => {
    const nbs = neighborsOf(n);
    if (!nbs.length) return '<p class="small muted">Atribua províncias para ver os vizinhos.</p>';
    return `<p class="small muted" style="margin:2px 0 4px">Valor automático pela ideologia, história e minorias; mova o controle para fixar à mão (−100 hostil … +100 aliado).</p>` + nbs.map(o => {
      const auto = estRel(n.id, o), cur = n.rels?.[o], v = cur ?? auto;
      return `<div class="cw-rel" data-relrow="${o}">${flagHTML(flagOf(o), 22)}<span class="cw-rn">${esc(nameOf(o))}${byId(o) ? '' : ' <span class="muted">(real)</span>'}</span>
        <input type="range" min="-100" max="100" step="5" value="${v}" data-rel="${o}"><b class="${v >= 25 ? 'c-good' : v <= -25 ? 'c-bad' : ''}" data-relv>${v > 0 ? '+' : ''}${v}</b>
        ${cur == null ? '<span class="tag">auto</span>' : `<button class="small" data-relauto="${o}" title="Voltar ao automático (${auto})">↺</button>`}</div>`;
    }).join('');
  };
  const nationCard = n => {
    const on = E.sel === n.id, tab = E.ntab || 'geral';
    return `<div class="panel cw-card ${on ? 'on' : ''}" style="border-left:5px solid ${colorOf(n.id)}" data-nid="${n.id}">
    <div class="row" style="gap:6px;align-items:center;flex-wrap:nowrap"><span data-flag>${flagHTML(n.flagSpec || FB, 38)}</span><input data-f="name" value="${esc(n.name)}" style="flex:1;min-width:0"><span class="small muted" title="Províncias"><b data-count="${n.id}">${n.provs.length}</b> prov.</span>${on ? '' : `<button class="small" data-pick>Editar</button>`}</div>
    ${on ? `<div class="tabs small" style="margin:5px 0 3px"><button data-ntab="geral" class="${tab === 'geral' ? 'on' : ''}">Geral</button><button data-ntab="rel" class="${tab === 'rel' ? 'on' : ''}">Relações com vizinhos</button></div>
    ${tab === 'geral' ? `<div class="cw-fields small"><label>Líder <input data-f="leader" value="${esc(n.leader || '')}"></label>
      <label>Regime <select data-f="regime">${Object.entries(REGIMES).map(([k, r]) => `<option value="${k}" ${n.regime === k ? 'selected' : ''}>${r.name}</option>`).join('')}</select></label>
      <label>Papel com você <select data-f="role">${Object.entries(ROLES).map(([k, r]) => `<option value="${k}" ${n.role === k ? 'selected' : ''}>${r}</option>`).join('')}</select></label>
      <label>Política externa <select data-f="posture"><option value="">Automática (pela ideologia)</option>${Object.entries(POSTURES).map(([k, p]) => `<option value="${k}" ${n.posture === k ? 'selected' : ''} title="${esc(p.desc)}">${p.name}</option>`).join('')}</select></label></div>
      <div class="small muted" style="margin-top:3px">${esc(FAMILIES[famOfProfile(profOf(n.id))]?.name || '')} · ${esc(contOf(n))} <span data-reg>${n.region ? '· região: ' + esc(regionalIdentity(data, n.provs)?.name || '') : ''}</span></div>
      <div class="row" style="gap:4px;margin-top:4px"><button class="small" data-auto>${li('dice', 13)} Autopreencher</button><button class="small primary" data-flagedit>Bandeira…</button><button class="small" data-del>${li('x', 13)} Excluir</button></div>`
      : `<div data-relbox>${relBox(n)}</div>`}` : `<div class="small muted">${esc(REGIMES[n.regime]?.name || '')} · ${esc(ROLES[n.role] || '')}${n.posture ? ' · ' + esc(POSTURES[n.posture]?.name || '') : ''} · ${esc(contOf(n))}</div>`}</div>`;
  };
  const isoList = Object.values(data.reg).filter(e => e.iso2 && hasIsoFlag(e.iso2)).sort((x, y) => x.name.localeCompare(y.name, 'pt'));
  const flagPanel = n => `<div class="panel" style="padding:10px"><div class="row" style="justify-content:space-between;align-items:center"><h3 style="margin:0">Bandeira — ${esc(n.name)}</h3><button class="small primary" data-flagback>← Concluir</button></div>
    <div class="row" style="gap:14px;align-items:flex-start;margin:8px 0;flex-wrap:nowrap"><div data-fprev>${flagHTML(n.flagSpec || FB, 120)}</div><div style="flex:1"><div class="row small" style="gap:4px;flex-wrap:wrap"><button class="small" data-fauto>Bandeira regional automática</button><button class="small" data-frand>${li('dice', 13)} Sortear</button></div>
      <div class="tabs" style="margin-top:6px">${[['current', 'Atuais'], ['hist', 'Históricas'], ['imp', 'Imperiais'], ['reg', 'Regionais'], ['custom', 'Personalizada']].map(([k, nm]) => `<button data-ftab="${k}" class="${(E.ftab || 'reg') === k ? 'on' : ''}">${nm}</button>`).join('')}</div></div></div>
    <div data-fbody></div></div>`;
  function drawFlagBody(fe) {
    const fb = root.querySelector('[data-fbody]'); if (!fb) return; const tab = E.ftab || 'reg';
    const cur = fe.flagSpec || {};
    const pv = () => { const p = root.querySelector('[data-fprev]'); if (p) p.innerHTML = flagHTML(fe.flagSpec, 120); };
    const mark = (attr, val) => fb.querySelectorAll('[' + attr + ']').forEach(b => b.classList.toggle('on', b.getAttribute(attr) === val));
    if (tab === 'current') { fb.innerHTML = '<input data-fsearch placeholder="Buscar bandeira…" style="margin:6px 0;width:100%"><div data-fpg></div>'; fb._pg?.destroy(); fb._pg = pagedGrid(fb.querySelector('[data-fpg]'), isoList, { size: 48, max: '46vh', item: e => `<button data-iso="${e.iso2}" class="${cur.iso === e.iso2 ? 'on' : ''}">${flagHTML({ iso: e.iso2 }, 48)}${esc(e.name)}</button>`, name: e => e.name }); }
    else if (tab === 'imp' || tab === 'reg') { const imp = tab === 'imp', list = regionalFlags().filter(x => !!x.imperial === imp).sort((x, y) => x.name.localeCompare(y.name)); fb.innerHTML = '<input data-fsearch placeholder="Buscar…" style="margin:6px 0;width:100%"><div data-fpg></div>'; fb._pg?.destroy(); fb._pg = pagedGrid(fb.querySelector('[data-fpg]'), list, { size: 48, max: '46vh', item: x => `<button data-regf="${x.key}" class="${cur.reg === x.key ? 'on' : ''}">${flagHTML({ reg: x.key }, 48)}${esc(x.name)}</button>`, name: x => x.name + ' ' + (x.a3 || '') }); }
    else if (tab === 'hist') fb.innerHTML = `<div class="flag-grid" style="max-height:46vh">${Object.entries(historicalFlags()).map(([k, h]) => `<button data-hist="${k}" class="${cur.hist === k ? 'on' : ''}">${flagHTML({ hist: k }, 48)}${esc(h.name)}<span class="muted">${esc(h.years || '')}</span></button>`).join('')}</div>`;
    else { if (!fe.flagSpec?.layout || !Array.isArray(fe.flagSpec.colors)) fe.flagSpec = fe.flagSpec?.hist ? structuredClone(historicalFlags()[fe.flagSpec.hist].spec) : defaultFlag(); fe.manualFlag = true; mountFlagEditor(fb, fe.flagSpec, () => { fe.manualFlag = true; pv(); }); pv(); }
    fb.onclick = e => {
      const i = e.target.closest('[data-iso]'); if (i) { fe.flagSpec = { iso: i.dataset.iso }; fe.manualFlag = true; pv(); mark('data-iso', i.dataset.iso); }
      const r = e.target.closest('[data-regf]'); if (r) { fe.flagSpec = { reg: r.dataset.regf }; fe.manualFlag = true; pv(); mark('data-regf', r.dataset.regf); }
      const h = e.target.closest('[data-hist]'); if (h) { fe.flagSpec = { hist: h.dataset.hist }; fe.manualFlag = true; pv(); mark('data-hist', h.dataset.hist); }
    };
    fb.oninput = e => { if (e.target.matches('[data-fsearch]')) fb._pg?.reset(e.target.value); };
  }
  root.onclick = e => {
    const mode = e.target.closest('[data-mode]'); if (mode) { E.mode = mode.dataset.mode; root.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b === mode)); return; }
    const card = e.target.closest('[data-nid]'), n = card && byId(card.dataset.nid);
    const ft = e.target.closest('[data-ftab]'); if (ft) { E.ftab = ft.dataset.ftab; draw(); return; }
    const nt = e.target.closest('[data-ntab]'); if (nt) { E.ntab = nt.dataset.ntab; renderList(false); return; }
    const ra = e.target.closest('[data-relauto]'); if (ra && n) { delete n.rels?.[ra.dataset.relauto]; saveDraft(); renderList(false); return; }
    if (e.target.closest('[data-flagback]')) { E.flagFor = null; draw(); return; }
    if (e.target.closest('[data-fauto]')) { const fe = byId(E.flagFor); fe.manualFlag = false; autoIdentity(fe); draw(); return; }
    if (e.target.closest('[data-frand]')) { const fe = byId(E.flagFor); fe.flagSpec = autoFlag(fe.id + Math.random(), cultureOf(data, fe.parent || 'BRA'), Math.random() < 0.6 ? fe.parent : null); fe.manualFlag = true; draw(); return; }
    if (e.target.closest('[data-pick]') && n) { select(n.id); return; }
    if (card && !e.target.closest('input,select,button,label')) { select(n.id); return; }
    if (e.target.closest('[data-auto]') && n) { const par = n.parent || 'BRA', cult = cultureOf(data, par), keys = Object.keys(REGIMES); n.leader = leaderName(cult); n.manualLeader = false; n.autoLeader = true; n.regime = keys[Math.floor(Math.random() * keys.length)]; n.manualName = false; n.manualFlag = false; autoIdentity(n); if (!n.region) n.flagSpec = autoFlag(n.id + Math.random(), cult, Math.random() < 0.6 ? par : null); saveDraft(); renderList(false); return; }
    if (e.target.closest('[data-del]') && n) { if (!confirm(`Excluir ${n.name}?`)) return; E.def.nations = E.def.nations.filter(x => x !== n); E.sel = E.def.nations[0]?.id || null; A = assign(); map.recolor(); saveDraft(); renderList(false); return; }
    if (e.target.closest('[data-flagedit]') && n) { E.flagFor = n.id; E.sel = n.id; draw(); return; }
    if (e.target.closest('[data-fr]')) {
      const c = root.querySelector('[data-fr-c]').value, k = Math.max(2, Math.min(12, +root.querySelector('[data-fr-n]').value || 4));
      if (!c) return;
      E.def.nations = E.def.nations.filter(x => x.parent !== c);
      const add = fracture(data, c, k, String(Date.now() % 997)); E.def.nations.push(...add); autoRoles(E.def.nations); E.sel = add[0]?.id; E.first = true; E.q = ''; E.cont = ''; draw(); return;
    }
    if (e.target.closest('[data-addn]')) { const id = 'CW_X' + (Date.now() % 100000); E.def.nations.unshift({ id, parent: null, name: 'Nova nação', formal: 'Nova nação', leader: '', autoLeader: true, regime: 'hybrid', role: 'neutral', provs: [], flagSpec: autoFlag(id) }); E.sel = id; E.q = ''; E.cont = ''; draw(); root.querySelector('[data-list]')?.scrollTo(0, 0); return; }
    if (e.target.closest('[data-export]')) { E.def.name = root.querySelector('[data-wname]')?.value || E.def.name || 'Meu mundo'; exportWorld(clean()); return; }
    if (e.target.closest('[data-save]')) { E.def.name = root.querySelector('[data-wname]').value || 'Meu mundo'; onSave(clean()); clearDraft(); toast('Mundo salvo.', 'good'); return; }
    if (e.target.closest('[data-use]')) { E.def.name = root.querySelector('[data-wname]')?.value || E.def.name || 'Meu mundo'; const d = clean(); if (!d.nations.length) return toast('Crie ao menos uma nação com províncias.', 'warn'); clearDraft(); m.close(); onUse(d); }
  };
  root.oninput = e => {
    if (e.target.matches('[data-q]')) { E.q = e.target.value; renderList(false); return; }
    if (e.target.matches('[data-rel]')) { const row = e.target.closest('[data-relrow]'), v = +e.target.value, b = row.querySelector('[data-relv]'); b.textContent = (v > 0 ? '+' : '') + v; b.className = v >= 25 ? 'c-good' : v <= -25 ? 'c-bad' : ''; }
  };
  root.onchange = e => {
    if (e.target.matches('[data-wname]')) { E.def.name = e.target.value; saveDraft(); return; }
    if (e.target.matches('[data-cont]')) { E.cont = e.target.value; renderList(false); return; }
    if (e.target.matches('[data-fr-cont]')) { E.fcont = e.target.value; const s = root.querySelector('[data-fr-c]'); s.innerHTML = sovIn().map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join(''); return; }
    const card = e.target.closest('[data-nid]'), n = card && byId(card.dataset.nid);
    if (e.target.matches('[data-rel]') && n) { (n.rels ||= {})[e.target.dataset.rel] = +e.target.value; saveDraft(); renderList(false); return; }
    const f = e.target.dataset.f;
    if (f && n) { n[f] = e.target.value || (f === 'posture' ? null : ''); if (f === 'name') { n.formal = e.target.value; n.manualName = true; } if (f === 'leader') n.manualLeader = true; saveDraft(); if (f === 'regime' || f === 'posture' || f === 'role') renderList(false); }
  };
  const clean = () => ({ ...E.def, id: 'custom', nations: E.def.nations.filter(n => n.provs.length).map(n => ({ ...n, parent: n.parent || prov[n.provs[0]]?.a3 })) });
  draw();
}

export { loadCustom, saveCustom, presetWorld };

// ---------- Exportar / importar mundos como JSON ----------
export function exportWorld(def) {
  const out = { format: 'ironstate-customworld', version: 1, exported: new Date().toISOString(), world: def };
  const blob = new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (def.name || 'mundo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w-]+/g, '_').slice(0, 60) + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(`Mundo "${esc(def.name || 'mundo')}" exportado.`, 'good');
}
// Abre o seletor de arquivo e devolve o mundo validado (ou null).
export function importWorld(data, onLoad) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = async () => {
    const f = inp.files?.[0]; if (!f) return;
    try {
      const raw = JSON.parse(await f.text()), def = raw?.world || raw;
      if (!Array.isArray(def?.nations)) throw new Error('o arquivo não contém nações');
      const P = data.geo.prov;
      def.nations = def.nations.filter(n => n && n.id && Array.isArray(n.provs)).map(n => ({ ...n, provs: n.provs.filter(p => P[p]) })).filter(n => n.provs.length);
      if (!def.nations.length) throw new Error('nenhuma nação com províncias válidas');
      def.id = 'custom'; def.name = def.name || f.name.replace(/\.json$/i, '');
      onLoad(def);
      toast(`Mundo "${esc(def.name)}" importado (${def.nations.length} nações).`, 'good');
    } catch (e) { toast('Não foi possível importar: ' + esc(e.message), 'bad'); }
  };
  inp.click();
}
