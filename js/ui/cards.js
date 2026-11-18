import { esc, num, signed, modal, money } from './dom.js';
import { STAT_INFO, GROUPS } from '../sim/constants.js';
import { fmtDate } from '../sim/util.js';
import { issueGroupsImpact } from '../sim/issues.js';
import { regionMiniMap } from './mapviews.js';


const LABEL_GOOD = Object.fromEntries(Object.values(STAT_INFO).map(i => [i[0], i[3]]));
const KEY_GOOD = { Apoio: true, Tesouro: true, Estabilidade: true, Inflação: false, Legitimidade: true, Reputação: true, Protestos: false, Dívida: false };
export function goodness(label, v) {
  const base = String(label).replace(/ \(.*\)$/, '');
  let g = base in KEY_GOOD ? KEY_GOOD[base] : base in LABEL_GOOD ? LABEL_GOOD[base] : null;
  if (g == null && (['PIB', 'Reservas', 'Todos os grupos', 'População'].includes(base) || Object.values(GROUPS).some(x => x.name === base) || base.startsWith('Relações'))) g = true;
  if (base === 'Dívida') g = false;
  return g == null ? 'blue' : (g ? v > 0 : v < 0) ? 'good' : 'bad';
}

export function deltaChips(delta) {
  return delta.map(([k, v, kind]) => {
    if (kind === 'trend') {
      const info = STAT_INFO[k];
      return `<span class="tag ${goodness(info?.[0] || k, v)}">${esc(info?.[0] || k)} ${v > 0 ? '↗' : '↘'} tendência</span>`;
    }
    const txt = k === 'Tesouro' || k === 'Dívida' ? money(v) : signed(v, 1);
    return `<span class="tag ${goodness(k, v)}" style="font-size:12px;padding:2px 8px">${esc(k)} ${v > 0 && !txt.startsWith('+') ? '+' : ''}${txt}</span>`;
  }).join(' ');
}

export function changesChips(changes) {
  return changes.map(([n, v, u]) => u === 'policy' ? `<span class="tag warn">${esc(n)}: ${esc(v)}</span>`
    : `<span class="tag ${goodness(n, v)}">${esc(n)} ${signed(v, Math.abs(v) < 1 ? 2 : 1)}${u && u !== 'tendência' ? ' ' + u : ''}${u === 'tendência' ? ' ↗' : ''}</span>`).join(' ');
}

export function issueBody(game, p, iss) {
  const left = p.deadline - game.day;
  const advice = game.advice?.(iss) || [];
  return `<div class="issue ${p.event ? 'event' : ''} ${iss.crisis ? 'crisis' : ''}">
    <div class="cat">${esc(iss.cat)}${iss.crisis ? ' · <b class="c-bad">CRISE</b>' : ''}${p.chain ? ' · desdobramento' : ''} · ${fmtDate(p.day)} · <span class="${left <= 3 ? 'c-bad' : ''}">prazo: ${left <= 0 ? 'hoje' : left + ' dias'}</span></div>
    <h3>${esc(iss.title)}</h3>${p.origin ? `<div class="origin">↩ Consequência da sua decisão de ${fmtDate(p.origin.day)} em <b>${esc(p.origin.title)}</b>: “${esc(p.origin.opt)}”</div>` : ''}<div class="desc">${esc(iss.desc)}</div>${iss.focusProv ? regionMiniMap(game, iss.focusRegion, iss.focusProv) + '<div class="small muted">O pedido também aparece no mapa nacional (Desenvolvimento urbano e Economia › Obras).</div>' : ''}${iss.context ? `<div class="ctx"><b>Contexto:</b> ${esc(iss.context)}</div>` : ''}
    ${advice.length ? `<div class="advice">${advice.map(a => `<div class="row" style="gap:6px;flex-wrap:nowrap;align-items:flex-start"><div><b>${esc(a.name)}</b> <span class="muted small">(${esc(a.role)})</span>: “${esc(a.text)}”</div></div>`).join('')}</div>` : ''}
    ${iss.options.map((o, i) => {
      const g = issueGroupsImpact(o);
      return `<button class="option" data-issue="${iss.id}" data-opt="${i}"><div class="opt-text">${i + 1}. ${esc(o.text)}</div><div class="hint">${esc(o.hint || '')}</div>
        <div style="margin-top:3px">${g.up.map(x => `<span class="tag good">▲ ${esc(x)}</span>`).join('')}${g.down.map(x => `<span class="tag bad">▼ ${esc(x)}</span>`).join('')}${(o.long || []).length ? '<span class="tag blue">efeito duradouro</span>' : ''}${o.policy ? '<span class="tag warn">muda lei</span>' : ''}${o.next ? '<span class="tag blue">pode ter desdobramentos</span>' : ''}</div></button>`;
    }).join('')}
    ${iss.default != null ? `<div class="small muted">Se não decidir até o prazo, prevalece a opção ${iss.default + 1}.</div>` : '<div class="small muted">Se não decidir até o prazo, o governo parecerá omisso (perde legitimidade).</div>'}</div>`;
}

export function resultHTML(iss, opt, res) {
  return `<div class="result"><b>${esc(iss.title)}</b> — ${esc(opt.text)}
    <div style="margin:6px 0">${deltaChips(res.delta)}</div><div class="small">${changesChips(res.changes)}</div></div>`;
}

// Cartão pop-up: mostra uma questão; ao decidir, mostra o resultado e oferece a próxima pendente.
export function openIssueCard(game, id, { onDone } = {}) {
  const s = game.s, p = s.issues.pending.find(x => x.id === id);
  if (!p) return null;
  const iss = game.getIssue(id);
  const m = modal(issueBody(game, p, iss) + `<div class="right" style="margin-top:8px"><button data-close class="small">Decidir depois</button></div>`, { onClose: onDone });
  m.el.classList.add('card-box');
  m.el.addEventListener('click', e => {
    const b = e.target.closest('[data-opt]');
    if (!b) return;
    const opt = iss.options[+b.dataset.opt];
    const res = game.answerIssue(id, +b.dataset.opt);
    const next = s.issues.pending[0];
    m.el.innerHTML = resultHTML(iss, opt, res) + `<div class="right" style="margin-top:10px">${next ? `<button data-next>Próxima questão (${s.issues.pending.length})</button> ` : ''}<button class="primary" data-close>Continuar</button></div>`;
    m.el.querySelector('[data-next]')?.addEventListener('click', ev => { ev.stopPropagation(); m.close(); openIssueCard(game, next.id, { onDone }); });
  });
  return m;
}
