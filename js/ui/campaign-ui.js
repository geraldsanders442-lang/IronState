// Mesa de operações: um único painel por guerra com situação, previsão da semana, postura, comando, ordens e ciência.
import { esc, num, bar, toast } from './dom.js';
import { li } from './lucide.js';
import { rerender } from './app.js';
import { entName } from '../sim/war.js';
import { dipHTML, dipClick } from './wardip-ui.js';
import { fmtDate } from '../sim/util.js';
import { ensureAsym, lostOccupied } from '../sim/asym.js';
import { UPGRADES, TACTICS, DEFENSE, PLANS, ensureCamp, ensureCmd, objectivesOf, upCost, commandMods, supplyIncome, warStanding, warAdvice } from '../sim/campaign.js';

const MODES = [['auto', 'Automático', 'cpu', 'Os generais cuidam de tudo.'], ['strategist', 'Estrategista', 'scale', 'Você define o plano; os generais executam.'], ['general', 'General', 'swords', 'Você escolhe a tática de cada frente.']];
const STANCES = [['offensive', 'Ofensiva', 'swords'], ['defensive', 'Defensiva', 'shield'], ['hold', 'Manter linhas', 'castle']];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Previsão da próxima semana (sem alterar o estado).
function forecast(game, w) {
  const s = game.s, ratio = w.ratio || 1, C = commandMods(s, game.data, w, true), out = {};
  const frontEst = (key, mult) => (ratio * mult * C.front(key) - 0.95) * 22;
  out.front1 = w.target ? frontEst('target', w.target2 ? 0.9 : 1) : null;
  out.front2 = w.target2 ? frontEst('target2', 0.7) : null;
  const push = (1 / Math.max(0.05, ratio)) * (w.stance === 'hold' ? 0.75 : 1) * (w.estance === 'surge' ? 1.12 : 1);
  const fort = (1 + s.st.defense / 200 + (w.stance === 'hold' ? 0.2 : 0)) * C.def;
  out.enemy = w.etarget ? (push / fort - 0.95) * 22 : null;
  out.loss = s.st.troops * 0.004 * (w.stance === 'hold' ? 0.5 : 1) * C.loss * clamp(1.3 - ratio * 0.3, 0.5, 1.6);
  return out;
}
const trendTxt = d => d == null ? '—' : d > 6 ? `<b class="c-good">▲ avançando (≈ +${num(d, 0)}%/sem)</b>` : d > -2 ? `<span class="c-warn">■ estagnado (≈ ${d >= 0 ? '+' : ''}${num(d, 0)}%/sem)</span>` : `<b class="c-bad">▼ recuando (≈ ${num(d, 0)}%/sem)</b>`;

const enemyTrend = d => d == null ? '—' : d > 6 ? `<b class="c-bad">▲ inimigo avançando (≈ +${num(d, 0)}%/sem)</b>` : d > -2 ? `<span class="c-warn">■ estagnado (≈ ${d >= 0 ? '+' : ''}${num(d, 0)}%/sem)</span>` : `<b class="c-good">▼ inimigo contido (≈ ${num(d, 0)}%/sem)</b>`;
export function opsDeskHTML(game, w) {
  const s = game.s, K = ensureCamp(s), c = ensureCmd(w), F = s.forces, wid = w.id, P = game.data.geo.prov;
  const fc = forecast(game, w), corps = (F?.corps || []).filter(x => x.war === wid);
  const att = corps.filter(x => x.role === 'attack').length, dfn = corps.filter(x => x.role === 'defend').length, res = (F?.corps || []).filter(x => !x.war || x.war === wid && x.role === 'reserve').length;
  const btn = (attr, val, on, ic, label, tip) => `<button class="small ${on ? 'primary' : ''}" ${attr}="${val}" data-w="${wid}" title="${esc(tip || '')}">${li(ic, 14)} ${esc(label)}</button>`;
  const stanceBtns = STANCES.map(([k, n, ic]) => `<button class="small ${w.stance === k ? 'primary' : ''}" data-wa="${wid}|${k}" title="Postura geral da guerra">${li(ic, 14)} ${n}</button>`).join(' ');
  const modeBtns = MODES.map(([k, n, ic, tip]) => btn('data-cmode', k, c.mode === k, ic, n, tip)).join(' ');
  const off = w.stance === 'offensive';
  let cmd = '';
  if (c.mode === 'strategist') cmd = `<div class="small"><b>Plano de guerra</b></div><div class="row" style="flex-wrap:wrap;gap:4px">${Object.entries(PLANS).map(([k, [n, ic, tip]]) => btn('data-cplan', k, c.plan === k, ic, n, tip)).join('')}</div><div class="small muted">${esc(PLANS[c.plan][2])}</div>`;
  else if (c.mode === 'general') {
    const front = (key, label) => `<div class="small"><b>${label}</b></div><div class="row" style="flex-wrap:wrap;gap:4px">${Object.entries(TACTICS).map(([k, [n, ic, tip]]) => btn('data-corder', key + '|' + k, c.orders[key] === k, ic, n, tip)).join('')}</div>`;
    cmd = `${off ? front('target', 'Frente principal' + (w.target ? ' — ' + esc(P[w.target.pid]?.n || '') : '')) + (w.target2 ? front('target2', 'Segunda frente — ' + esc(P[w.target2.pid]?.n || '')) : '') : '<div class="small muted">Táticas de ataque só valem na postura <b>Ofensiva</b>.</div>'}
      <div class="small"><b>Defesa</b></div><div class="row" style="flex-wrap:wrap;gap:4px">${Object.entries(DEFENSE).map(([k, [n, ic, tip]]) => btn('data-corder', 'def|' + k, c.orders.def === k, ic, n, tip)).join('')}</div>
      <div class="small muted">Inimigo: ${K.up.intel >= 1 ? ({ entrenched: 'entrincheirado', surge: 'em surto ofensivo' }[w.estance] || 'postura normal') : 'postura desconhecida (pesquise Inteligência)'}.</div>`;
  } else cmd = '<div class="small muted">Os generais escolhem alvos e táticas. Suas melhorias de ciência continuam valendo.</div>';
  const line = (label, t, d) => `<div class="row small" style="justify-content:space-between;gap:8px"><span>${label}</span><span style="text-align:right">${t}</span></div>${t ? '' : ''}`;
  const frontRow = (T, d, label) => T ? `<div class="small"><b>${label}</b>: ${esc(P[T.pid]?.n || '')} — ${num(T.p, 0)}% ${trendTxt(d)}</div>${bar(T.p, 'good')}` : '';
  const ups = Object.entries(UPGRADES).map(([k, [n, ic, tip]]) => { const l = K.up[k] || 0; return `<button class="small" data-cup="${k}" title="${esc(tip)} Custo: ${upCost(l)} pts." ${l >= 3 ? 'disabled' : ''}>${li(ic, 14)} ${esc(n)} <b>${l}/3</b></button>`; }).join(' ');
  const objs = objectivesOf(s, game.data, w);
  const aird = (F.campaigns?.[wid] || 0) > game.day, blk = !!F.blockades?.[wid];
  return `<div class="panel" style="border-left:6px solid #c0392b;margin-bottom:8px" data-desk="${wid}">
    <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:6px"><h3 style="border:none;margin:0">${li('crown', 18)} Mesa de operações — guerra contra ${esc(entName(game.s, game.data, w.enemy))}</h3>
      <span class="small" title="${esc(supplyIncome(s).parts.map(([n, f]) => n + ' ×' + num(f, 2)).join(' · '))}">${li('package', 14)} Suprimentos <b>${num(K.supply, 1)}</b> <span class="muted">(+${num(supplyIncome(s).inc * (1 - K.alloc / 100), 1)}/sem)</span> · ${li('flask', 14)} Ciência <b>${num(K.sci, 1)}</b> · ${li('medal', 14)} <b>${K.medals}</b></span></div>
    ${standingHTML(game, w)}
    <div data-theatre="${wid}" style="margin-top:6px"></div>
    <div class="small muted" style="margin-bottom:4px">${li('swords', 13)} seta dourada: ofensiva · seta vermelha: pressão inimiga · linha tracejada: frente · ${li('shield', 13)} defesa. Dourado nos municípios: tomados por você; vermelho: perdidos.</div>
    <div class="grid" style="grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:10px;margin-top:6px">
      <div><div class="small" style="margin-bottom:3px"><b>${li('eye', 14)} Previsão da semana</b> <span class="muted">(razão de forças ${num(w.ratio || 1, 2)}×)</span></div>
        ${frontRow(w.target, fc.front1, 'Ofensiva')}${frontRow(w.target2, fc.front2, 'Segunda frente')}${w.etarget ? `<div class="small"><b>Pressão inimiga</b>: ${esc(P[w.etarget.pid]?.n || '')} — ${num(w.etarget.p, 0)}% ${enemyTrend(fc.enemy)}</div>${bar(w.etarget.p, 'bad')}` : '<div class="small muted">Sem pressão inimiga relevante.</div>'}
        ${!w.target && !off ? '<div class="small muted">Sem ofensiva: mude a postura para <b>Ofensiva</b> para atacar.</div>' : ''}
        <div class="small" style="margin-top:3px">Baixas esperadas: <b>≈ ${num(fc.loss, 1)} mil</b>/semana · Placar <b>${num(w.score, 0)}</b> · Exaustão inimiga ${num(w.enemyExh, 0)}</div>
        <div class="small muted">Corpos: ${att} no ataque · ${dfn} na defesa · ${Math.max(0, (F?.corps || []).length - att - dfn)} em reserva.
          <button class="small" data-corpsall="attack|${wid}">Todos ao ataque</button> <button class="small" data-corpsall="defend|${wid}">Todos à defesa</button></div></div>
      <div><div class="small"><b>Postura</b></div><div class="row" style="flex-wrap:wrap;gap:4px">${stanceBtns}</div>
        <div class="small" style="margin-top:5px"><b>Comando</b> <span class="muted">— quanto você se envolve</span></div><div class="row" style="flex-wrap:wrap;gap:4px">${modeBtns}</div>${cmd}</div></div>
    ${reportsHTML(game, w, c)}
    ${asymHTML(game, w)}
    ${dipHTML(game, w)}
    <div class="small" style="margin-top:8px"><b>Ordens</b> <span class="muted">(gastam suprimentos ou dinheiro)</span></div>
    <div class="row" style="flex-wrap:wrap;gap:4px">
      <button class="small" data-cact="reinforce" data-w="${wid}" title="3 suprimentos">${li('users', 14)} Reforçar (3)</button>
      <button class="small" data-cact="airstrike" data-w="${wid}" title="4 suprimentos">${li('plane', 14)} Bombardeio (4)</button>
      <button class="small" data-cact="fortify" data-w="${wid}" title="3 suprimentos">${li('shield', 14)} Fortificar (3)</button>
      <button class="small" data-aircamp="${wid}" ${aird ? 'disabled' : ''}>${li('plane', 14)} ${aird ? 'Campanha aérea em curso' : 'Campanha aérea (4 sem.)'}</button>
      <button class="small" data-block="${wid}" ${blk ? 'disabled' : ''}>${li('ship', 14)} ${blk ? 'Bloqueio ativo' : 'Bloqueio naval'}</button>
      <button class="small" data-wa="${wid}|allies" ${(s.counters.allyAsk || 0) > game.day ? 'disabled' : ''}>${li('users', 14)} Pedir aliados</button>
      <button class="small" data-neg="${wid}|0">${li('scale', 14)} Cessar-fogo</button>
      ${w.pendingTerms ? `<button class="small primary" data-conf="${wid}">Conferência de paz no mapa</button>` : ''}</div>
    <label class="small" style="display:block;margin-top:6px">Produção: ${100 - K.alloc}% exército · ${K.alloc}% ciência <input type="range" min="0" max="100" step="10" value="${K.alloc}" data-calloc="${wid}" style="width:220px;vertical-align:middle"></label>
    <details style="margin-top:6px"><summary class="small"><b>Ciência e objetivos</b></summary><div class="row" style="flex-wrap:wrap;gap:4px;margin-top:4px">${ups}</div>
      <div style="margin-top:4px">${objs.map(o => `<div class="small">${li(o.done ? 'check' : 'target', 13)} <span class="${o.done ? '' : 'muted'}">${esc(o.text)}</span></div>`).join('')}</div></details></div>`;
}
// Quem está ganhando: termômetro com os fatores e conselhos do estado-maior.
function standingHTML(game, w) {
  const s = game.s, st = warStanding(s, game.data, w), adv = warAdvice(s, game.data, w), pos = (st.total + 100) / 2;
  const col = st.tone === 'good' ? '#2f8f4e' : st.tone === 'warn' ? '#c9a227' : '#c0392b';
  return `<div style="margin:6px 0;padding:6px 8px;background:#f7f4ea;border:1px solid #ddd">
    <div class="row" style="justify-content:space-between;align-items:center"><b style="font-size:15px;color:${col}">${li('scale', 16)} ${st.verdict}</b><span class="small muted">índice ${st.total >= 0 ? '+' : ''}${num(st.total, 0)} · você ${st.gained} província(s) ganha(s) · ${st.lost} perdida(s)</span></div>
    <div style="position:relative;height:12px;margin:5px 0;background:linear-gradient(90deg,#c0392b,#e0b84a 50%,#2f8f4e);border-radius:6px"><i style="position:absolute;left:calc(${pos}% - 2px);top:-3px;width:4px;height:18px;background:#222;border-radius:2px"></i></div>
    <div class="small" style="display:flex;flex-wrap:wrap;gap:4px 12px">${st.parts.map(([n, v]) => `<span title="${esc(n)}">${esc(n)}: <b class="${v > 2 ? 'c-good' : v < -2 ? 'c-bad' : ''}">${v >= 0 ? '+' : ''}${num(v, 0)}</b></span>`).join('')}</div>
    ${adv.map(([ic, tx]) => `<div class="small" style="margin-top:3px">${li(ic, 14)} <b>Estado-maior:</b> ${esc(tx)}</div>`).join('')}</div>`;
}
export const campaignHTML = opsDeskHTML;

// Assimetria: ferramentas de quem está em desvantagem (resistência, sanções, ajuda, recuo).
function asymHTML(game, w) {
  if (!(w.ratio < 0.95 || !w.aggressor)) return '';
  ensureAsym(w);
  const lost = lostOccupied(game.s, w).length, d = game.day, wk = k => Math.max(0, Math.ceil(((w.acd[k] || 0) - d) / 7));
  const b = (op, ic, label, tip, dis) => `<button class="small" data-cact="${op}" data-w="${w.id}" title="${esc(tip)}" ${dis ? 'disabled' : ''}>${li(ic, 14)} ${label}${wk({ sanctions: 'sanc', aid: 'aid', withdraw: 'wd' }[op]) ? ' (' + wk({ sanctions: 'sanc', aid: 'aid', withdraw: 'wd' }[op]) + ' sem.)' : ''}</button>`;
  return `<div style="margin-top:8px;border-top:1px dashed #ccc;padding-top:6px"><div class="small"><b>${li('flag', 14)} Assimetria e apoio</b> <span class="muted">— ferramentas de quem luta em desvantagem</span></div>
    <div class="grid g3" style="margin-top:4px"><div class="small">Resistência nas terras ocupadas (${lost} província${lost === 1 ? '' : 's'})${bar(w.guer, 'good')}</div><div class="small">Sanções ao agressor: nível <b>${w.sanc}/3</b>${bar(w.sanc, 'warn', 3)}</div><div class="small">Simpatia internacional${bar(w.sym, w.sym > 50 ? 'good' : 'warn')}</div></div>
    <div class="row" style="flex-wrap:wrap;gap:4px;margin-top:4px">${b('resist', 'skull', 'Armar resistência (3)', 'Organiza células de guerrilha nas províncias ocupadas. Custa 3 suprimentos.', !lost && w.guer <= 0)}${b('sanctions', 'scale', 'Pedir sanções', 'Pressão diplomática para sancionar o agressor.', false)}${b('aid', 'package', 'Pedir ajuda externa', 'Pede armas e munição a um país amigo.', false)}${b('withdraw', 'move-up-right', 'Recuo estratégico', 'Cede espaço, ganha tempo e desgasta o inimigo.', !w.etarget)}</div></div>`;
}

// Relatório de batalha: o que aconteceu em cada frente nas últimas semanas.
function reportsHTML(game, w, c) {
  const P = game.data.geo.prov, R = (w.reports || []).slice(0, 6), wk = w.weeks?.[0];
  if (!R.length && !wk) return '<div class="small muted" style="margin-top:8px">Sem relatórios ainda: avance a semana.</div>';
  const tac = (r) => r.tac ? ({ assault: 'assalto frontal', flank: 'flanqueamento', siege: 'cerco e desgaste', hold: 'manter a linha', elastic: 'defesa elástica', counter: 'contra-ataque' })[r.tac] || r.tac : (c.mode === 'auto' ? 'tática dos generais' : '');
  const row = r => {
    const good = r.side === 'atk' ? r.dp > 0 : r.dp <= 0, name = esc(P[r.pid]?.n || r.pid), arrow = r.dp > 0 ? '▲' : r.dp < 0 ? '▼' : '■';
    const head = r.side === 'atk' ? `${li('swords', 14)} Ofensiva sobre <b>${name}</b>` : `${li('shield', 14)} Defesa de <b>${name}</b>`;
    return `<div class="small" style="border-left:3px solid ${good ? '#3c9d57' : '#c0392b'};padding:2px 8px;margin:3px 0">${head} <span class="muted">· ${fmtDate(r.day)}${tac(r) ? ' · ' + tac(r) : ''}${r.terrain ? ' · ' + esc(r.terrain) : ''}</span><br>Força efetiva <b>${num(r.eff, 2)}×</b> → <b class="${good ? 'c-good' : 'c-bad'}">${arrow} ${r.dp >= 0 ? '+' : ''}${num(r.dp, 1)}%</b> (frente em ${r.p}%)</div>`;
  };
  return `<div style="margin-top:8px"><div class="small"><b>${li('clipboard', 14)} Relatório de batalha</b>${wk ? ` <span class="muted">— última semana: suas perdas ≈ ${num(wk.my, 2)} mil · inimigas ≈ ${num(wk.en || 0, 2)} mil</span>` : ''}</div>${R.map(row).join('')}</div>`;
}

export function campChange(e, game) {
  const r = e.target.closest('[data-calloc]'); if (!r) return false;
  game.campAct('alloc', { v: +r.value, war: r.dataset.calloc }); rerender(); return true;
}
export function campClick(e, game) {
  if (dipClick(e, game)) return true;
  const t = e.target;
  let r = null;
  const all = t.closest('[data-corpsall]');
  if (all) {
    const [role, wid] = all.dataset.corpsall.split('|'), res = (game.s.forces?.corps || []).map(c => game.assignCorps(c.id, wid, role));
    toast(role === 'attack' ? 'Todos os corpos foram designados ao ataque.' : 'Todos os corpos foram designados à defesa.', 'good'); rerender(); return true;
  }
  const m = t.closest('[data-cmode]'); if (m) r = game.campAct('mode', { mode: m.dataset.cmode, war: m.dataset.w });
  const p = t.closest('[data-cplan]'); if (p) r = game.campAct('plan', { plan: p.dataset.cplan, war: p.dataset.w });
  const o = t.closest('[data-corder]'); if (o) { const [front, tactic] = o.dataset.corder.split('|'); r = game.campAct('order', { front, tactic, war: o.dataset.w }); }
  const u = t.closest('[data-cup]'); if (u) r = game.campAct('upgrade', { k: u.dataset.cup });
  const a = t.closest('[data-cact]'); if (a) r = game.campAct(a.dataset.cact, { war: a.dataset.w });
  if (!r) return false;
  if (r.msg) toast(esc(r.msg), r.ok ? 'good' : 'warn');
  rerender(); return true;
}
