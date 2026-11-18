// Diplomacia de guerra na mesa de operações: ofertas pendentes, trégua e mesa de negociação com cláusulas.
import { esc, num, modal, toast } from './dom.js';
import { li } from './lucide.js';
import { rerender } from './app.js';
import { CLAUSES, treatyChance, isSettlement } from '../sim/wardip.js';
import { entName } from '../sim/war.js';
import { fmtDate } from '../sim/util.js';

export function dipHTML(game, w) {
  const D = w.dip || { offers: [] }, d = game.day, nm = esc(entName(game.s, game.data, w.enemy));
  const offers = D.offers.map(o => `<div class="small" style="border-left:3px solid #2a6fb0;padding:2px 8px;margin:3px 0">${li('scroll', 14)} <b>${o.from === 'mediator' ? 'Mediador' : nm}</b>${o.counter ? ' (contraproposta)' : ''} propõe: ${o.clauses.map(c => esc(CLAUSES[c][0])).join('; ')} <span class="muted">· até ${fmtDate(o.exp)}</span><br>
    <button class="small primary" data-dip="accept" data-offer="${o.id}" data-w="${w.id}">Aceitar</button> <button class="small" data-dip="counter" data-offer="${o.id}" data-w="${w.id}">Contra-propor</button> <button class="small" data-dip="reject" data-offer="${o.id}" data-w="${w.id}">Recusar</button></div>`).join('');
  const wait = Math.max(0, Math.ceil(((D.cd || 0) - d) / 7));
  return `<div style="margin-top:8px;border-top:1px dashed #ccc;padding-top:6px"><div class="small"><b>${li('scroll', 14)} Diplomacia de guerra</b> <span class="muted">— negocie o fim da guerra com ${nm}${w.truce ? ` · <b>trégua: ${w.truce} sem.</b>` : ''}</span></div>
    ${offers || '<div class="small muted">Nenhuma oferta em aberto. O inimigo e mediadores podem propor tratados conforme a guerra evolui.</div>'}
    <div class="row" style="flex-wrap:wrap;gap:4px;margin-top:4px"><button class="small primary" data-dip="open" data-w="${w.id}" ${wait ? `disabled title="Aguarde ${wait} semana(s)"` : ''}>${li('scale', 14)} Propor tratado${wait ? ` (${wait} sem.)` : ''}</button><button class="small" data-dip="truce" data-w="${w.id}" ${wait || w.truce ? 'disabled' : ''}>${li('hourglass', 14)} Pedir trégua (8 sem.)</button></div></div>`;
}

export function openTreaty(game, w, preset) {
  const s = game.s, data = game.data, sel = new Set(preset || ['freeze']);
  const m = modal(`<h3>${li('scroll', 18)} Mesa de negociação — ${esc(entName(s, data, w.enemy))}</h3><div class="small muted">Escolha as cláusulas. Quanto mais o inimigo ganha, mais fácil ele aceitar. Precisa de uma cláusula de acordo (congelar, devolver ou reconhecer) para encerrar a guerra.</div>
    <div data-cl style="margin:6px 0">${Object.entries(CLAUSES).map(([k, [n, tip]]) => `<label class="small" style="display:block;margin:2px 0" title="${esc(tip)}"><input type="checkbox" data-c="${k}" ${sel.has(k) ? 'checked' : ''}> <b>${esc(n)}</b> <span class="muted">— ${esc(tip)}</span></label>`).join('')}</div>
    <div class="small" data-chance></div><div style="margin-top:8px"><button class="primary" data-send>Enviar proposta</button> <button data-close>Cancelar</button></div>`, { wide: true });
  const root = m.el, chosen = () => [...root.querySelectorAll('[data-c]:checked')].map(x => x.dataset.c);
  const upd = () => { const cl = chosen(), p = treatyChance(s, data, w, cl); root.querySelector('[data-chance]').innerHTML = `Chance de aceitação: <b>${num(p * 100, 0)}%</b> ${isSettlement(cl) ? '' : '<span class="muted">(sem cláusula de acordo a guerra continua)</span>'}`; };
  root.onchange = upd; upd();
  root.querySelector('[data-send]').onclick = () => { const r = game.dipAct('propose', { war: w.id, clauses: chosen() }); m.close(); toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender(); };
}

export function dipClick(e, game) {
  const b = e.target.closest('[data-dip]'); if (!b) return false;
  const w = game.s.wars.find(x => x.id === b.dataset.w) || game.s.wars.find(x => x.active), op = b.dataset.dip;
  if (!w) return true;
  if (op === 'open') { openTreaty(game, w, w.dip?.open); return true; }
  if (op === 'counter') { const o = (w.dip?.offers || []).find(x => x.id === b.dataset.offer); w.dip.offers = w.dip.offers.filter(x => x !== o); openTreaty(game, w, o?.clauses); return true; }
  const r = game.dipAct(op, { war: w.id, offer: b.dataset.offer });
  toast(esc(r.msg || ''), r.ok ? 'good' : 'warn'); rerender(); return true;
}
