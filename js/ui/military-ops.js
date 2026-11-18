// Interface operacional: comando dos corpos, marinha e aviação, mapa do teatro e conferência de paz.
import { esc, num, bar, toast, modal } from './dom.js';

import { mountNation } from './mapviews.js';
import { warFactors, peaceCost, peaceBudget, GEN_TRAITS } from '../sim/armies.js';
import { entName } from '../sim/war.js';
import { battleMods } from '../sim/terrain.js';
import { munisOf } from '../sim/munis.js';
import { manpowerMult } from '../sim/warevents.js';
import { rerender } from './app.js';
import { campClick, campChange } from './campaign-ui.js';
import { li } from './lucide.js';
import { theatre } from './theatre.js';

export function commandHTML(game) {
  const s = game.s, F = s.forces; if (!F) return '';
  const wars = s.wars.filter(w => w.active);
  const opt = (c) => `<select data-assign="${c.id}"><option value="reserve|">Reserva</option>${wars.map(w => `<option value="attack|${w.id}" ${c.war === w.id && c.role === 'attack' ? 'selected' : ''}>Ofensiva — ${esc(entName(s, game.data, w.enemy))}</option><option value="defend|${w.id}" ${c.war === w.id && c.role === 'defend' ? 'selected' : ''}>Defesa — ${esc(entName(s, game.data, w.enemy))}</option>`).join('')}</select>`;
  return `<div class="grid" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)"><div class="panel"><h3>Comando: corpos de exército</h3>
    <table class="data"><tr><th>Unidade</th><th>Comandante</th><th>Força</th><th>Missão</th><th></th></tr>
    ${F.corps.map(c => `<tr><td><b>${esc(c.name)}</b></td><td><div class="row" style="gap:6px;flex-wrap:nowrap"><span>${esc(c.gen.name)}<div class="small muted" title="${esc(GEN_TRAITS[c.gen.trait] || '')}">${esc(c.gen.trait)} · perícia ${c.gen.skill} · fama ${Math.round(c.gen.fame)} · lealdade ${Math.round(c.gen.loyalty)}</div></span></div></td>
      <td style="width:110px">${bar(c.strength, c.strength > 60 ? 'good' : c.strength > 30 ? 'warn' : 'bad', 100)} ${Math.round(c.strength)}%</td><td>${opt(c)}</td><td><button class="small" data-regen="${c.id}" title="Trocar o comandante">Trocar general</button></td></tr>`).join('')}</table>
    <div class="row" style="margin-top:6px"><button class="small primary" data-recruit>Formar novo corpo (${num(s.econ.gdp * 0.004, 2)} bi)</button><span class="small muted">Corpos na ofensiva aceleram a conquista; na defesa, seguram o inimigo. Sem ordens, todos lutam em conjunto. Generais vitoriosos ganham fama — e ambição.</span></div></div>
    <div class="panel"><h3>Marinha e aviação</h3><table class="data"><tr><td>Navios</td><td class="num">${F.navy.ships} (qualidade ${F.navy.quality})</td><td><button class="small" data-navy ${s.nation.coastal ? '' : 'disabled'}>+4 navios (${num(s.econ.gdp * 0.0048, 2)} bi)</button></td></tr>
      <tr><td>Esquadrilhas</td><td class="num">${Math.round(F.air.wings)} (qualidade ${F.air.quality})</td><td><button class="small" data-air>+4 esquadrilhas (${num(s.econ.gdp * 0.004, 2)} bi)</button></td></tr></table>
      <p class="small muted">Superioridade aérea fortalece ataque e defesa e permite campanhas de bombardeio. Superioridade naval viabiliza desembarques e bloqueios que estrangulam a economia inimiga.</p></div></div>`;
}

export function warOpsHTML(game, w) {
  const s = game.s, f = warFactors(s, game.data, w), F = s.forces;
  const att = F.corps.filter(c => c.war === w.id && c.role === 'attack').length, dfn = F.corps.filter(c => c.war === w.id && c.role === 'defend').length;
  return `<div class="grid" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);margin-top:6px"><div><div class="small muted">O mapa do teatro está na mesa de operações, no topo da página.</div></div>
    <div class="small"><b>Operações</b><table class="data"><tr><td>Corpos na ofensiva / defesa</td><td class="num">${att} / ${dfn}</td></tr>${[[li('swords', 13) + ' Alvo', w.target], [li('swords', 13) + ' 2ª frente', w.target2], [li('shield', 13) + ' Ameaçada', w.etarget]].filter(x => x[1]).map(([lb, t]) => { const bm = battleMods(game.data, t.pid, game.day, false); return `<tr><td>${lb}: ${esc(game.data.geo.prov[t.pid].n)}</td><td class="num">${bm.tname}${bm.def > 1 ? ` (defesa ×${bm.def})` : ''} · ${bm.stag}${bm.season < 1 ? ` (ataque ×${bm.season})` : ''}</td></tr>`; }).join('')}<tr><td>Efetivo / mão de obra</td><td class="num ${manpowerMult(s) < 0.9 ? 'c-bad' : ''}">${Math.round(100 * s.st.troops / Math.max(1, s.manpowerPeak || s.st.troops))}% do pico (×${manpowerMult(s).toFixed(2)})</td></tr><tr><td>Superioridade aérea</td><td class="num ${f.airSup > 0.55 ? 'c-good' : f.airSup < 0.45 ? 'c-bad' : ''}">${Math.round((f.airSup || 0) * 100)}%</td></tr><tr><td>Superioridade naval</td><td class="num ${f.naval > 0.55 ? 'c-good' : f.naval < 0.45 ? 'c-bad' : ''}">${Math.round(f.naval * 100)}%</td></tr></table>
      <div class="row" style="margin-top:6px"><button class="small" data-aircamp="${w.id}" ${(F.campaigns[w.id] || 0) > game.day ? 'disabled' : ''}>${(F.campaigns[w.id] || 0) > game.day ? 'Bombardeio em curso' : 'Campanha aérea (4 sem.)'}</button>
      <button class="small" data-block="${w.id}" ${F.blockades[w.id] ? 'disabled' : ''}>${F.blockades[w.id] ? 'Bloqueio ativo' : 'Bloqueio naval'}</button>${w.pendingTerms ? `<button class="small primary" data-conf="${w.id}">Conferência de paz no mapa</button>` : ''}</div></div></div>`;
}

export function mountTheatres(el, game) {
  const s = game.s, data = game.data;
  for (const box of el.querySelectorAll('[data-theatre]')) {
    const w = s.wars.find(x => x.id === box.dataset.theatre); if (!w) continue;
    const map = mountNation(box, game, 'region');
    const th = theatre(game, w);
    map.setOverlay(th.svg);
    map.el.classList.add('cw-map');
    const pids = th.focus.length ? th.focus : [...s.regions.flatMap(r => r.provinces), ...w.gained];
    requestAnimationFrame(() => { map.zoomToProvinces(pids, 0.45); map.updateScaled(); });
    break; // o mapa nacional é compartilhado: um teatro por vez
  }
}

export function bindMilitaryOps(el, game) {
  if (el._milOps) return; el._milOps = true;
  el.addEventListener('change', e => {
    if (campChange(e, game)) return;
    const a = e.target.closest('[data-assign]'); if (!a) return;
    const [role, wid] = a.value.split('|'); const r = game.assignCorps(a.dataset.assign, wid || null, role); toast(esc(r.msg), 'good');
  });
  el.addEventListener('click', e => {
    if (campClick(e, game)) return;
    let r;
    if (e.target.closest('[data-recruit]')) r = game.recruitCorps();
    if (e.target.closest('[data-navy]')) r = game.buyNavy();
    if (e.target.closest('[data-air]')) r = game.buyAir();
    const g = e.target.closest('[data-regen]'); if (g && confirm('Trocar o comandante desta unidade?')) r = game.replaceGeneral(g.dataset.regen);
    const ac = e.target.closest('[data-aircamp]'); if (ac) r = game.airCampaign(ac.dataset.aircamp);
    const bl = e.target.closest('[data-block]'); if (bl) r = game.blockade(bl.dataset.block);
    const cf = e.target.closest('[data-conf]'); if (cf) return openPeaceConference(game, cf.dataset.conf);
    if (r) { toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender(); }
  });
}

export function openPeaceConference(game, wid) {
  const s = game.s, data = game.data, w = s.wars.find(x => x.id === wid); if (!w) return;
  const cand = new Set(game.peaceCandidates(wid)), sel = new Set(w.gained.filter(p => s.world.occ[p] === 'PLY' && cand.has(p)));
  let rep = 0, puppet = false;
  const budget = peaceBudget(w);
  const m = modal(`<h2>Conferência de paz com ${esc(entName(s, data, w.enemy))}</h2><div class="small">Clique nas províncias inimigas (ocupadas ou de fronteira) para exigi-las. Cada exigência consome pontos do placar; o inimigo aceita até <b>${budget}</b> pontos.</div>
    <div data-pmap></div><div class="row" style="justify-content:space-between;margin-top:6px"><div class="small" data-psum></div>
    <div class="small">Reparações: <select data-prep>${[0, 3, 6, 10].map(v => `<option value="${v}">${v ? v + '% do PIB' : 'nenhuma'}</option>`).join('')}</select> <label><input type="checkbox" data-ppup> Estado cliente</label> ${game.macros().length ? `<select data-pmacro><option value="">Selecionar macro-região…</option>${game.macros().map(mm => `<option value="${mm.id}">${esc(mm.name)}</option>`).join('')}</select>` : ''}</div></div>
    <div class="right" style="margin-top:6px"><button data-close>Cancelar</button> <button class="primary" data-psign>Assinar o tratado</button></div>`, { wide: true });
  const sum = () => { const cost = [...sel].reduce((a, p) => a + peaceCost(s, data, w, p), 0) + rep * 3 + (puppet ? 35 : 0); m.el.querySelector('[data-psum]').innerHTML = `Exigências: <b class="${cost > budget ? 'c-bad' : 'c-good'}">${cost}</b> / ${budget} · ${sel.size} província(s): ${[...sel].map(p => esc(data.geo.prov[p].n)).slice(0, 8).join(', ')}${sel.size > 8 ? '…' : ''}`; };
  const map = mountNation(m.el.querySelector('[data-pmap]'), game, 'region', pid => {
    if (!cand.has(pid)) return toast('Só províncias inimigas ocupadas ou de fronteira.', 'warn');
    sel.has(pid) ? sel.delete(pid) : sel.add(pid); paint(); sum();
  });
  const paint = () => { map.setOverlay([...cand].map(p => { const c = data.geo.prov[p].c; return `<g pointer-events="none" data-sx="${c[0]}" data-sy="${c[1]}"><circle r="${sel.has(p) ? 7 : 4}" fill="${sel.has(p) ? '#2e8b3e' : '#fff'}" stroke="#333" stroke-width="1"/></g>`; }).join('')); map.updateScaled(); };
  requestAnimationFrame(() => { map.zoomToProvinces([...cand, ...s.regions.flatMap(r => r.provinces)], 0.1); paint(); });
  sum();
  m.el.addEventListener('change', e => { if (e.target.matches('[data-prep]')) rep = +e.target.value; if (e.target.matches('[data-ppup]')) puppet = e.target.checked; if (e.target.matches('[data-pmacro]') && e.target.value) { const mm = game.macros().find(x => x.id === e.target.value); for (const p of mm?.provs || []) if (cand.has(p)) sel.add(p); paint(); } sum(); });
  m.el.querySelector('[data-psign]').onclick = ev => { ev.stopPropagation(); const r = game.customPeace(wid, { provs: [...sel], reparations: rep, puppet }); toast(esc(r.msg), r.ok ? 'good' : 'warn'); if (r.ok) { m.close(); rerender(); } };
}
