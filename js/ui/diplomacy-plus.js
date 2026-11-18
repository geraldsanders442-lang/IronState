import { entityFlag } from './flag.js';
// Diplomacia ampliada: líder e memória de cada país, cúpula de negociação, espionagem,
// aba "Mundo" (tensão, crises, mudanças de regime, ONU) e página de Pesquisa.
import { $, esc, num, bar, toast, modal } from './dom.js';
import { fmtDate } from '../sim/util.js';
import { leaderOf, LTRAITS, memoryScore, SUMMIT_ITEMS, SPY_OPS, CRISES, TECHS, techById, techAvailable, ERAS, era } from '../sim/worldlife.js';
import { entName } from '../sim/war.js';

import { mountLine } from './charts.js';
import { effList } from './labels.js';
import { rerender } from './app.js';

export function leaderHTML(game, id) {
  const s = game.s, L = leaderOf(s, id); if (!L) return '';
  const mem = s.world.memory?.[id] || [], ms = memoryScore(s, id);
  const cd = (s.counters.summitCd || {})[id] || 0;
  return `<div class="row" style="gap:10px;flex-wrap:nowrap;margin-top:8px;align-items:flex-start"><div style="flex:1"><b>${esc(L.name)}</b><div class="small muted">no poder desde ${fmtDate(L.since)} · ${L.traits.map(t => `<span title="${esc(LTRAITS[t])}">${esc(t)}</span>`).join(', ')}</div>
    <div class="small">Memória de você: <b class="${ms > 2 ? 'c-good' : ms < -2 ? 'c-bad' : ''}">${ms > 2 ? 'grata' : ms < -2 ? 'ressentida' : 'neutra'}</b>${mem.length ? ' — ' + mem.slice(0, 3).map(m => `<span class="${m.v > 0 ? 'c-good' : 'c-bad'}">${esc(m.text)}</span> (${fmtDate(m.day)})`).join(' · ') : ''}</div>
    <button class="small primary" data-summit="${id}" style="margin-top:4px" ${cd > game.day ? `disabled title="Próxima cúpula em ${cd - game.day} dias"` : ''}>${cd > game.day ? `Cúpula em ${cd - game.day} dias` : 'Propor cúpula de negociação'}</button></div></div>`;
}
export function spyHTML(game, id) {
  const s = game.s, net = s.spies?.[id] || { agents: 0, burned: 0 };
  const rep = net.report;
  return `<h3 style="margin-top:8px">Espionagem</h3><div class="small">Rede: ${bar(net.agents, 'neutral', 100)} ${Math.round(net.agents)}/100${net.burned ? ` · <span class="c-bad">${net.burned} operação(ões) descoberta(s)</span>` : ''}</div>
    ${Object.entries(SPY_OPS).map(([k, o]) => `<div class="row" style="justify-content:space-between;padding:2px 0"><div class="small"><b>${esc(o.name)}</b> <span class="muted">${esc(o.desc)} (${num(s.econ.gdp * o.cost, 2)} bi)</span></div><button class="small" data-spy="${k}" ${o.need && net.agents < o.need ? `disabled title="Precisa de rede ${o.need}"` : ''}>Executar</button></div>`).join('')}
    ${rep ? `<div class="small" style="margin-top:4px;background:#f3f6fb;padding:4px 6px">Relatório de ${fmtDate(rep.day)}: agressividade ${rep.aggr}/100 · ${esc(rep.nuke)} · poder militar ${rep.power} · ${esc(rep.plans)}.</div>` : ''}`;
}
export function bindDiplomacyPlus(el, game, id) {
  el._dpId = id;
  if (el._dpBound) return; el._dpBound = true;
  el.addEventListener('click', e => {
    const id = el._dpId;
    const sp = e.target.closest('[data-spy]'); if (sp) { const r = game.spy(id, sp.dataset.spy); toast(esc(r.msg), r.ok ? 'good' : 'bad'); rerender(); }
    const su = e.target.closest('[data-summit]'); if (su) openSummit(game, su.dataset.summit);
  });
}

export function openSummit(game, id) {
  const s = game.s, nm = entName(s, game.data, id), L = leaderOf(s, id);
  const offer = new Set(), ask = new Set();
  const list = (side) => Object.entries(SUMMIT_ITEMS).map(([k, it]) => `<label class="small" style="display:block"><input type="checkbox" data-${side}="${k}"> ${esc(it.name)}</label>`).join('');
  const m = modal(`<h2>Cúpula com ${esc(nm)}</h2><div class="row" style="gap:10px;flex-wrap:nowrap"><div class="small"><b>${esc(L.name)}</b><br>${L.traits.map(t => `${esc(t)}: ${esc(LTRAITS[t])}`).join('<br>')}</div></div>
    <div class="grid g2" style="margin-top:8px"><div class="panel tight"><b>Nós oferecemos</b>${list('of')}</div><div class="panel tight"><b>Nós pedimos</b>${list('as')}</div></div>
    <div class="small" data-sev style="margin:6px 0"></div><div class="right"><button data-close>Encerrar</button> <button class="primary" data-sgo>Apresentar proposta</button></div>`, { wide: true });
  const upd = () => { const ev = game.summitEval(id, [...offer], [...ask]); m.el.querySelector('[data-sev]').innerHTML = `Clima da negociação: <b class="${ev.score >= 0 ? 'c-good' : ev.score > -12 ? 'c-warn' : 'c-bad'}">${ev.score >= 10 ? 'muito favorável' : ev.score >= 0 ? 'favorável' : ev.score > -12 ? 'tenso' : 'hostil'}</b> — ${esc(ev.reply)}`; };
  m.el.addEventListener('change', e => { const o = e.target.dataset.of, a = e.target.dataset.as; if (o) e.target.checked ? offer.add(o) : offer.delete(o); if (a) e.target.checked ? ask.add(a) : ask.delete(a); upd(); });
  m.el.querySelector('[data-sgo]').onclick = ev => { ev.stopPropagation(); if (!offer.size && !ask.size) return; const r = game.summit(id, [...offer], [...ask]); toast(esc(r.msg), r.ok ? 'good' : 'warn'); if (r.ok) { m.close(); rerender(); } else upd(); };
  upd();
}

export function worldTab(body, game) {
  const s = game.s, W = s.world, T = W.tension || 0, C = W.crisis;
  body.innerHTML = `<div class="grid g2"><div class="panel"><h3>Tensão mundial</h3><div style="font-size:34px;font-family:Georgia" class="${T > 70 ? 'c-bad' : T > 45 ? 'c-warn' : 'c-good'}">${Math.round(T)}/100</div>${bar(T, T > 70 ? 'bad' : T > 45 ? 'warn' : 'good', 300)}
      <div class="small muted">Sobe com guerras, programas nucleares, sanções e hostilidade entre grandes potências. Tensão alta multiplica guerras e crises.</div><div data-tens style="margin-top:6px"></div>
      ${C ? `<div class="panel tight" style="border-left:5px solid #c0392b;margin-top:6px"><b>${esc(CRISES[C.id].name)}</b> em curso — ${C.weeks} semana(s) restante(s).</div>` : '<div class="small muted" style="margin-top:6px">Nenhuma crise global em curso.</div>'}</div>
    <div class="panel"><h3>Mudanças de regime no mundo</h3><div class="log-list" style="max-height:200px">${(W.regimeLog || []).map(r => `<div class="small"><span class="muted">${fmtDate(r.day)}</span> ${esc(r.text)}</div>`).join('') || '<div class="muted small">Nenhuma ainda.</div>'}</div>
      <h3 style="margin-top:8px">Votações na ONU</h3><table class="data">${(W.unLog || []).map(u => `<tr><td class="small">${fmtDate(u.day)}</td><td class="small">${esc({ condemn: 'Condenação', sanction: 'Sanções', climate: 'Pacto climático', refugees: 'Pacto de refugiados' }[u.kind])}${u.target ? ' — ' + esc(entName(s, game.data, u.target)) : ''}</td><td class="small">seu voto: ${esc({ yes: 'a favor', no: 'contra', abstain: 'abstenção' }[u.vote])}</td><td class="small ${u.pass ? 'c-good' : 'c-bad'}">${u.yes}×${u.no} ${u.pass ? 'aprovada' : 'rejeitada'}</td></tr>`).join('') || '<tr><td class="muted small">Nenhuma votação ainda.</td></tr>'}</table></div></div>`;
  if (W.chaos || (W.newStates || []).length || (W.alliances || []).length) body.insertAdjacentHTML('beforeend', `<div class="grid g2" style="margin-top:8px"><div class="panel"><h3>🌪 Estados novos ${W.chaos ? '<span class="tag red">mundo caótico</span>' : ''}</h3>
    <table class="data">${(W.newStates || []).slice().reverse().map(x => { const e = W.ents[x.id], alive = !!W.c[x.id], p = s.partners[x.id]; return `<tr><td>${entityFlag(e, 22, game.data.reg)}</td><td><b>${esc(e?.name || x.name)}</b>${alive ? '' : ' <span class="tag">extinto</span>'}<div class="small muted">${esc(e?.ideo || '')} · separado de ${esc(entName(s, game.data, x.from))} em ${fmtDate(x.day)}</div></td><td class="small">${p && alive ? `relação ${Math.round(p.rel)}${p.unrecognized ? ' · <i>não reconhecido</i>' : ''}${p.pact ? ' · aliado' : ''}` : ''}</td></tr>`; }).join('') || '<tr><td class="muted small">Nenhum ainda.</td></tr>'}</table></div>
    <div class="panel"><h3>Alianças militares regionais</h3>${(W.alliances || []).map(a => `<div class="panel tight"><b>${esc(a.name)}</b>${a.members.includes('PLY') ? ' <span class="tag blue">você é membro</span>' : ''}<div class="small">${a.members.map(m => m === 'PLY' ? esc(s.nation.shortName) : esc(entName(s, game.data, m))).join(' · ')}</div><div class="small muted">desde ${fmtDate(a.since)}</div></div>`).join('') || '<div class="muted small">Nenhuma ainda.</div>'}</div></div>`);
  mountLine($('[data-tens]', body), { series: [{ name: 'Tensão', data: W.tensionHist || [] }], height: 100, yMin: 0, yMax: 100 });
}

export function researchPage(el, game) {
  const s = game.s, T = s.tech || { pts: 0, done: [], cur: null };
  const cur = techById[T.cur];
  el.innerHTML = `<h2>Pesquisa e tecnologia</h2><div class="panel row" style="justify-content:space-between"><div><b>${ERAS[era(s)]}</b> · ${T.done.length} de ${TECHS.length} tecnologias</div><div class="small">Pontos acumulados: <b>${num(T.pts, 0)}</b> · ritmo: <b>${num(T.rate || 0, 1)}</b>/semana (educação, tecnologia, universidades e parques tecnológicos; espionagem também rende pontos)</div></div>
    ${cur ? `<div class="panel"><b>Pesquisando:</b> ${esc(cur.name)} ${bar(Math.min(100, T.pts / cur.cost * 100), 'neutral', 300)} ${num(Math.min(T.pts, cur.cost), 0)}/${cur.cost}</div>` : ''}
    <div class="grid g3">${[1, 2, 3].map(e => `<div class="panel"><h3>${ERAS[e]}</h3>${TECHS.filter(t => t.era === e).map(t => { const done = T.done.includes(t.id), av = techAvailable(s, t); return `<div class="mission" style="${done ? 'opacity:.75;border-left-color:#2e8b3e' : t.id === T.cur ? 'border-left-color:#2f6db5' : ''}"><b>${done ? '✔ ' : ''}${esc(t.name)}</b> <span class="small muted">${t.cost} pts</span>
      <div class="small">${effList(t.mods, v => (v > 0 ? '+' : '') + v)}</div>${t.req ? `<div class="small muted">requer: ${t.req.map(r => esc(techById[r].name)).join(', ')}</div>` : ''}
      ${!done ? `<button class="small ${t.id === T.cur ? '' : 'primary'}" data-tech="${t.id}" ${!av || t.id === T.cur ? 'disabled' : ''}>${t.id === T.cur ? 'Em pesquisa' : av ? 'Pesquisar' : 'Bloqueada'}</button>` : ''}</div>`; }).join('')}</div>`).join('')}</div>`;
  el.onclick = e => { const b = e.target.closest('[data-tech]'); if (b) { const r = game.setResearch(b.dataset.tech); toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender(); } };
}
