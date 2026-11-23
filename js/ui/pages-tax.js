// Página "Impostos e tarifas": tarifas por país ou produto, impostos seletivos, de classe e de setor, com lobby e retaliação.
import { esc, num, bar, toast } from './dom.js';
import { li } from './lucide.js';
import { rerender } from './app.js';
import { fmtDate } from '../sim/util.js';
import { ensureTax, MEASURES, PRODUCTS, KINDS, RATES, TAXLV, tariffName, tariffRevenue } from '../sim/tariffs.js';

export function taxPage(el, game) {
  const s = game.s, data = game.data, T = ensureTax(s), g = s.econ.gdp;
  const nameOf = id => data.reg?.[id]?.name || s.world.ents?.[id]?.name || id;
  const partners = Object.keys(s.partners).filter(id => s.world.c[id]).sort((a, b) => s.world.c[b].gdp - s.world.c[a].gdp).slice(0, 40);
  const seg = (arg, cur, labels, op) => `<div class="seg">${labels.map((n, i) => `<button class="${cur === i ? 'on' : ''}" data-op="${op}" data-arg="${arg}|${i}">${n}</button>`).join('')}</div>`;
  const lobbyBar = v => v > 8 ? `<div class="small muted">Lobby contra: ${num(v, 0)}/100</div>${bar(v, v > 70 ? 'bad' : v > 40 ? 'warn' : 'good')}` : '';
  const cat = kind => Object.entries(MEASURES).filter(([, m]) => m.kind === kind).map(([k, m]) => {
    const L = T.m[k] || 0, rev = L ? g * m.rev * L / 100 : 0;
    return `<div class="panel tight" style="margin:6px 0"><div class="row" style="justify-content:space-between;gap:8px"><b>${esc(m.name)}</b><span class="small">${L ? `<b>${num(rev, 2)} bi/ano</b>` : '<span class="muted">sem receita</span>'}</span></div>
      <div class="small muted">${esc(m.desc)}</div>${seg(k, L, TAXLV, 'set')}${L ? lobbyBar(T.lobby?.[k] || 0) : ''}</div>`;
  }).join('');
  const tarRows = T.tar.map(t => `<tr><td>${esc(tariffName(s, data, t))}</td><td class="num">${num(tariffRevenue(s, t), 2)} bi</td><td style="min-width:120px">${lobbyBar(t.lobby || 0) || '<span class="muted small">calmo</span>'}</td><td><button class="small" data-op="tariff" data-arg="${t.country ? 'c|' + t.country : 'p|' + t.product}|0">Revogar</button></td></tr>`).join('');
  const retal = Object.entries(T.retal).map(([id, r]) => `<span class="tag bad">${esc(nameOf(id))} retalia (nível ${r.lvl})</span>`).join(' ');
  const inc = Object.entries(T.incoming || {}).map(([id, i]) => `<span class="tag warn">${esc(nameOf(id))} taxa suas exportações</span>`).join(' ');
  const total = T.rev || 0;
  el.innerHTML = `<h2>${li('banknote', 20)} Impostos e tarifas</h2>
    <div class="muted small" style="margin-bottom:8px">Proteja a indústria nacional com tarifas, taxe vícios, ricos ou setores inteiros. Toda medida rende receita, mas custa inflação, crescimento ou votos — e os prejudicados fazem lobby: empresários e o Congresso (se tiver autonomia) podem derrubar o que você criar.</div>
    <div class="grid g3">
      <div class="panel"><h3>Receita das medidas</h3><div style="font-size:22px"><b>${num(total, 2)} bi</b>/ano</div><div class="small muted">${num(total / Math.max(0.01, g) * 100, 2)}% do PIB · além do imposto geral de ${num(s.budget.tax, 0)}% (página Orçamento).</div>
        <div class="small" style="margin-top:6px">Medidas revogadas por pressão: <b>${T.overturned || 0}</b></div></div>
      <div class="panel"><h3>Guerra comercial</h3>${retal || inc ? `<div class="row" style="gap:4px;flex-wrap:wrap">${retal} ${inc}</div>` : '<span class="muted small">Nenhum país retaliou ainda.</span>'}
        <div class="small muted" style="margin-top:6px">Tarifas altas sobre um país provocam retaliação: suas exportações caem e a relação piora.</div></div>
      <div class="panel"><h3>Lobby e Congresso</h3><div class="small">${s.pol && s.policies.elections === 'multiparty' ? 'Há parlamento com poder: sem maioria, o Congresso derruba medidas impopulares por conta própria.' : 'Sem parlamento autônomo, só o lobby empresarial e a opinião pública podem forçar recuos.'}</div></div></div>
    <div class="panel" style="margin-top:8px"><h3>${li('ship', 16)} Tarifas de importação</h3>
      ${T.tar.length ? `<table class="data"><tr><th>Tarifa</th><th class="num">Receita/ano</th><th>Lobby</th><th></th></tr>${tarRows}</table>` : '<div class="small muted">Nenhuma tarifa ativa.</div>'}
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><select data-tcountry><option value="">— País —</option>${partners.map(id => `<option value="${id}">${esc(nameOf(id))}</option>`).join('')}</select>
        <select data-tcountrylv>${RATES.slice(1).map((r, i) => `<option value="${i + 1}">${r}%</option>`).join('')}</select><button class="small primary" data-op="tariffC">Taxar produtos desse país</button></div>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:6px"><select data-tprod>${Object.entries(PRODUCTS).map(([k, p]) => `<option value="${k}">${esc(p.name)}</option>`).join('')}</select>
        <select data-tprodlv>${RATES.slice(1).map((r, i) => `<option value="${i + 1}">${r}%</option>`).join('')}</select><button class="small primary" data-op="tariffP">Taxar este produto (de qualquer país)</button></div>
      <div class="small muted" style="margin-top:6px">Protecionismo: ajuda a indústria local e rende receita, mas encarece o consumo, pode gerar retaliação e irrita importadores. Tarifa sobre alimento agrada o campo e sobe a comida.</div></div>
    ${['excise', 'class', 'sector'].map(k => `<div class="panel" style="margin-top:8px"><h3>${KINDS[k]}</h3>${cat(k)}</div>`).join('')}
    <div class="panel" style="margin-top:8px"><h3>Registro</h3><div class="log-list" style="max-height:150px">${T.log.length ? T.log.map(l => `<div><span class="muted small">${fmtDate(l.day)}</span> ${esc(l.text)}</div>`).join('') : '<span class="muted small">Nada registrado.</span>'}</div></div>`;
  el.onclick = e => {
    const b = e.target.closest('[data-op]'); if (!b) return;
    let op = b.dataset.op, arg = b.dataset.arg;
    if (op === 'tariffC') { const id = el.querySelector('[data-tcountry]').value; if (!id) return toast('Escolha um país.', 'warn'); op = 'tariff'; arg = `c|${id}|${el.querySelector('[data-tcountrylv]').value}`; }
    else if (op === 'tariffP') { op = 'tariff'; arg = `p|${el.querySelector('[data-tprod]').value}|${el.querySelector('[data-tprodlv]').value}`; }
    const r = game.taxAct(op, arg); toast(esc(r.msg || ''), r.ok ? 'good' : 'warn'); rerender();
  };
}
