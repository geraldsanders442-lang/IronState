// O jornal da semana: manchete com foto, matérias, resumo, pesquisa e alertas.
// A lei de imprensa muda o jornal: imprensa estatal esconde as más notícias (que aparecem na "rádio estrangeira").
import { esc, num, signed, money, modal } from './dom.js';
import { fmtDate } from '../sim/util.js';
import { fillPhotos, topicOf } from './media.js';
import { sfx } from './audio.js';

const PRI = { war: 6, bad: 4, warn: 3, good: 3, info: 2, decision: 0 };
const hashI = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
function score(it) {
  let v = PRI[it.type] ?? 1;
  if (/ATAQUE NUCLEAR|☢/.test(it.text)) v += 10;
  if (/Guerra!|declarou guerra|invadiu|golpe|capital/i.test(it.text)) v += 3;
  if (/elei|revolu|calote|teste nuclear|anexa/i.test(it.text)) v += 2;
  return v + (it.text.length > 60 ? 0.3 : 0);
}
const LEDES = {
  war: ['Fontes militares falam em horas decisivas.', 'O conflito domina as conversas nas ruas e nos quartéis.', 'Diplomatas estrangeiros acompanham a situação com apreensão.'],
  bad: ['O episódio aumenta a pressão sobre o governo.', 'Analistas preveem semanas difíceis.', 'A oposição já cobra explicações.'],
  good: ['O governo comemora; críticos pedem cautela.', 'A notícia foi recebida com alívio nas ruas.', 'Aliados do governo falam em "virada".'],
  warn: ['Especialistas recomendam atenção.', 'O tema promete voltar à pauta.'],
  info: ['O assunto deve render nas próximas semanas.', 'Reações ainda são cautelosas.'],
};
const lede = it => { const L = LEDES[it.type] || LEDES.info; return L[hashI(it.text) % L.length]; };

export function paperName(s) {
  const press = s.policies?.press, n = s.nation.shortName, cap = s.nation.capital;
  if (press === 'state') return { name: `A Voz de ${n}`, tag: 'Órgão oficial do governo' };
  if (press === 'regulated') return { name: `Jornal de ${cap}`, tag: 'Edição autorizada' };
  return { name: `O Correio de ${cap}`, tag: 'Independente desde 1891' };
}

export function showNewspaper(game, t, { notes = [], onCards, onClose, extraTop = '' } = {}) {
  const s = game.s, press = s.policies?.press;
  const ADMIN = /^(Fila cheia|Prazo esgotado|Gabinete decidiu)/;
  const all = t.items || t.news.map(text => ({ text, type: 'info' }));
  const items = all.filter(x => x.type !== 'decision' && !ADMIN.test(x.text));
  const decisions = all.filter(x => x.type === 'decision' || ADMIN.test(x.text));
  let shown = items, hidden = [];
  if (press === 'state') { shown = items.filter(x => !['bad', 'war'].includes(x.type) || /vitória|conquista|ocupa/i.test(x.text)); hidden = items.filter(x => !shown.includes(x)); }
  const ranked = [...shown].sort((a, b) => score(b) - score(a) + (press === 'regulated' && b.type === 'bad' ? -2 : 0));
  const lead = ranked[0], second = ranked.slice(1, 3), briefs = ranked.slice(3, 12);
  const P = paperName(s);
  const d = (k, dec = 1) => { const v = t.to[k] - t.from[k]; return `<span class="${Math.abs(v) < 0.05 ? 'muted' : v > 0 ? 'c-good' : 'c-bad'}">${signed(v, dec)}</span>`; };
  const poll = s.polls?.at(-1), prev = s.polls?.at(-2);
  const alerts = game.advisorAlerts?.().slice(0, 3) || [];
  const CITY = [`${s.nation.capital} city`, `${s.nation.capital} street`, `${s.nation.capital} government building`, 'press conference microphones', `${s.nation.capital} square`];
  const city = CITY[0];
  const art = (it, h, big) => it ? `<article class="${big ? 'lead' : 'story'}"><figure data-photo="${esc(topicOf(it.text, CITY[hashI(it.text) % CITY.length]))}" data-seed="${esc(it.text)}" data-h="${h}"></figure>
    <h${big ? 1 : 3}>${esc(it.text)}</h${big ? 1 : 3}><p>${esc(lede(it))}</p></article>` : '';
  const pending = s.issues.pending.length;
  const m = modal(`<div class="paper">
    <header class="masthead"><div class="mh-name">${esc(P.name)}</div><div class="mh-sub">${fmtDate(game.day, true)} · Edição nº ${t.week} · ${esc(P.tag)}</div></header>
    ${extraTop}
    ${notes.map(([h, x]) => `<div class="paper-urgent"><b>URGENTE — ${esc(h)}</b> ${esc(x)}</div>`).join('')}
    <div class="paper-grid">
      <div>${lead ? art(lead, 230, true) : `<article class="lead"><figure data-photo="${esc(city)}" data-seed="${t.week}" data-h="230"></figure><h1>Semana tranquila em ${esc(s.nation.shortName)}</h1><p>Nenhum grande acontecimento abalou o país.</p></article>`}</div>
      <aside class="paper-side">
        <div class="ps-box"><b>Indicadores da semana</b><div class="small">Apoio ${d('support')} · Estabilidade ${d('stability')}<br>Inflação ${num(t.to.inflation, 1)}% · Tesouro ${money(t.to.treasury)}</div></div>
        ${poll ? `<div class="ps-box"><b>Pesquisa da semana</b><div class="poll-big">${poll.approval}%</div><div class="small">aprovam o governo ${prev ? `(${signed(poll.approval - prev.approval, 0)} em uma semana)` : ''}</div></div>` : ''}
        ${alerts.length ? `<div class="ps-box"><b>Gabinete alerta</b>${alerts.map(a => `<div class="small ${a.lvl >= 3 ? 'c-bad' : ''}">• ${esc(a.title)}</div>`).join('')}</div>` : ''}
      </aside>
    </div>
    ${second.length ? `<div class="paper-row">${second.map(it => art(it, 120)).join('')}</div>` : ''}
    ${briefs.length ? `<div class="briefs"><b>Em resumo</b><ul>${briefs.map(it => `<li class="${it.type === 'bad' || it.type === 'war' ? 'c-bad' : it.type === 'good' ? 'c-good' : ''}">${esc(it.text)}</li>`).join('')}</ul></div>` : ''}
    ${decisions.length ? `<div class="briefs"><b>Atos do governo</b><ul>${decisions.slice(0, 8).map(it => `<li>${esc(it.text)}</li>`).join('')}</ul></div>` : ''}
    ${hidden.length ? `<div class="radio"><b>📻 Rádio estrangeira, ouvida às escondidas:</b> ${hidden.slice(0, 5).map(x => esc(x.text)).join(' · ')}</div>` : ''}
    <div class="right" style="margin-top:8px"><button data-close>Fechar</button> ${s.flags.needCapital ? '<button class="primary" data-close>Escolher a nova capital</button>' : pending ? `<button class="primary" data-cards>Ver questões (${pending})</button>` : ''}</div>
  </div>`, { wide: true, onClose });
  m.el.classList.add('paper-box');
  fillPhotos(m.el);
  m.el.querySelector('[data-cards]')?.addEventListener('click', ev => { ev.stopPropagation(); m.close(); onCards?.(); });
  sfx(lead && score(lead) >= 9 ? 'boom' : lead?.type === 'war' ? 'alarm' : 'paper');
  return m;
}
