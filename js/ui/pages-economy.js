// Página Economia com abas: visão geral (programas, comércio, setores), obras no mapa, mercados e empresas, câmbio.
import { $, esc, num, money, signed, toast, modal } from './dom.js';
import { fmtDate } from '../sim/util.js';
import { economyPage } from './pages-gov.js';
import { mountNation } from './mapviews.js';
import { mountLine } from './charts.js';
import { BUILDINGS, buildBlock, buildCost, COMMODITIES, FX } from '../sim/markets.js';
import { financeLimits, SECTOR_INVEST, FIN_CAPS } from '../sim/finance.js';

import { rerender } from './app.js';
import { effList } from './labels.js';

const view = { tab: 'overview' };
export function economyHub(el, game) {
  const tabs = [['overview', 'Visão geral e programas'], ['works', 'Obras no mapa'], ['markets', 'Mercados e empresas'], ['fx', 'Moeda e câmbio'], ['finance', 'Financiamento e fundo']];
  el.innerHTML = `<div class="tabs" style="margin-bottom:6px">${tabs.map(([k, n]) => `<button data-etab="${k}" class="${view.tab === k ? 'on' : ''}">${n}</button>`).join('')}</div><div data-ebody></div>`;
  const body = $('[data-ebody]', el);
  ({ overview: economyPage, works, markets, fx, finance })[view.tab](body, game);
  el.onclick = e => { const t = e.target.closest('[data-etab]'); if (t) { view.tab = t.dataset.etab; economyHub(el, game); } };
}

function works(body, game) {
  const s = game.s, data = game.data;
  const list = Object.entries(s.buildings || {}).flatMap(([pid, bs]) => bs.map(b => ({ pid, ...b })));
  body.innerHTML = `<h2>Obras nas províncias</h2><div class="grid" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)"><div class="panel tight"><div data-wmap></div><div class="small muted">Clique numa província sua para construir. Ícones mostram as obras; ⏳ em construção.</div></div>
    <div class="panel"><h3>Obras (${list.length})</h3>${list.length ? `<table class="data">${list.map(b => `<tr><td>${BUILDINGS[b.type].icon} ${esc(BUILDINGS[b.type].name)}</td><td class="small">${esc(data.geo.prov[b.pid].n)}</td><td class="small">${b.active ? '<span class="c-good">ativa</span>' : `pronta em ${fmtDate(b.done)}`}</td></tr>`).join('')}</table>` : '<div class="muted small">Nenhuma obra ainda.</div>'}
      <h3 style="margin-top:8px">Tipos de obra</h3><table class="data">${Object.entries(BUILDINGS).map(([k, B]) => `<tr><td>${B.icon} <b>${B.name}</b></td><td class="num">${money(buildCost(s, k))}</td><td class="num">${B.weeks} sem.</td><td class="small muted">${effList(B.nat, v => signed(v, Math.abs(v) < 1 ? 2 : 1))}</td></tr>`).join('')}</table>
      <p class="small muted">Obras geram empregos e efeitos nacionais, e mudam a região: infraestrutura, tensão, poluição e moradia. Várias obras do mesmo tipo rendem menos que a primeira.</p></div></div>`;
  mountNation($('[data-wmap]', body), game, 'infra', pid => {
    if (!s.regions.some(r => r.provinces.includes(pid))) return toast('Essa província não é sua.', 'warn');
    const P = data.geo.prov[pid], here = s.buildings?.[pid] || [];
    const m = modal(`<h2>Construir em ${esc(P.n)}</h2><div class="small muted">População est. ${num((P.pop || 0) / 1e6, 2)} mi${P.coast ? ' · litoral' : ''} · obras atuais: ${here.map(b => BUILDINGS[b.type].icon).join(' ') || 'nenhuma'}</div>
      <table class="data" style="margin-top:6px">${Object.entries(BUILDINGS).map(([k, B]) => { const bl = buildBlock(s, data, pid, k); return `<tr><td>${B.icon} ${esc(B.name)}</td><td class="num">${money(buildCost(s, k))}</td><td class="num">${B.weeks} sem.</td><td><button class="small primary" data-bt="${k}" ${bl ? `disabled title="${esc(bl)}"` : ''}>${bl ? esc(bl) : 'Construir'}</button></td></tr>`; }).join('')}</table>
      <div class="right"><button data-close>Fechar</button></div>`, { wide: true });
    m.el.addEventListener('click', ev => { const b = ev.target.closest('[data-bt]'); if (!b) return; const r = game.build(pid, b.dataset.bt); toast(esc(r.msg), r.ok ? 'good' : 'warn'); m.close(); rerender(); });
  });
}

function markets(body, game) {
  const s = game.s, M = s.markets, H = M?.hist || [];
  const prev = H.at(-5) || {};
  body.innerHTML = `<h2>Mercados mundiais e empresas</h2><div class="grid g2"><div class="panel"><h3>Preços das commodities (índice 100 = normal)</h3>
      <table class="data"><tr><th>Produto</th><th class="num">Preço</th><th class="num">Em 1 mês</th></tr>${Object.entries(COMMODITIES).map(([k, c]) => `<tr><td>${c.name}</td><td class="num ${M.prices[k] > 120 ? 'c-bad' : M.prices[k] < 80 ? 'c-good' : ''}">${num(M.prices[k], 0)}</td><td class="num">${prev[k] ? signed(M.prices[k] - prev[k], 0) : '—'}</td></tr>`).join('')}</table>
      <div class="small">Efeito no seu país: <b class="${(M.impact || 0) >= 0 ? 'c-good' : 'c-bad'}">${(M.impact || 0) >= 0 ? 'ganha' : 'perde'}</b> com os preços atuais (exportadores ganham com alta; importadores perdem).</div><div data-cm></div></div>
    <div class="panel"><h3>Grandes empresas</h3><table class="data"><tr><th>Empresa</th><th>Controle</th><th class="num">Valor</th><th></th></tr>
      ${s.companies.map(c => `<tr><td><b>${esc(c.name)}</b><div class="small muted">${esc(c.desc)}</div></td><td class="small">${c.owner === 'state' ? '<span class="tag blue">estatal</span>' : `<div class="row" style="gap:4px;flex-wrap:nowrap"><span>${esc(c.oligarch)}<br><span class="muted">lealdade ${Math.round(c.loyalty)}</span></span></div>`}</td>
        <td class="num">${money(c.value)}</td><td>${c.owner === 'state' ? `<button class="small" data-priv="${c.id}">Privatizar</button>` : `<button class="small danger" data-nat="${c.id}">Nacionalizar</button>`}</td></tr>`).join('')}</table>
      <p class="small muted">Estatais rendem receita ao governo; privadas aceleram o crescimento, mas seus donos viram oligarcas com interesses próprios.</p></div></div>`;
  mountLine($('[data-cm]', body), { title: 'Petróleo, trigo e chips', series: ['oil', 'wheat', 'chips'].map(k => ({ name: COMMODITIES[k].name, data: H.map(h => [h.day, h[k]]) })), height: 120 });
  body.onclick = e => {
    const p = e.target.closest('[data-priv]'); if (p && confirm('Privatizar esta empresa?')) { const r = game.privatize(p.dataset.priv); toast(esc(r.msg), 'good'); rerender(); }
    const n = e.target.closest('[data-nat]'); if (n && confirm('Nacionalizar esta empresa? Investidores vão reagir.')) { const r = game.nationalize(n.dataset.nat); toast(esc(r.msg), 'warn'); rerender(); }
  };
}

function fx(body, game) {
  const s = game.s, C = s.currency;
  body.innerHTML = `<h2>Moeda e câmbio</h2><div class="grid g2"><div class="panel"><h3>Regime cambial</h3>
      <div class="seg">${Object.entries(FX).map(([k, v]) => `<button data-fx="${k}" class="${C.regime === k ? 'on' : ''}">${v.name}</button>`).join('')}</div>
      <table class="data" style="margin-top:8px"><tr><td>Cotação (índice, maior = moeda mais fraca)</td><td class="num">${num(C.rate, 1)}</td></tr><tr><td>Reservas</td><td class="num">${money(s.econ.reserves)}</td></tr><tr><td>Inflação</td><td class="num">${num(s.st.inflation, 1)}%</td></tr></table>
      <div class="row" style="margin-top:8px"><button class="danger" data-dev>Desvalorizar 20%</button></div>
      <p class="small muted">Flutuante: a moeda acompanha a inflação. Fixo: inflação menor, mas queima reservas e pode desabar. Dolarização: inflação mínima, sem moeda própria. Moeda comum: exige bloco próprio com 3+ membros. Desvalorizar barateia exportações e encarece importados.</p></div>
    <div class="panel"><div data-fxc></div></div></div>`;
  mountLine($('[data-fxc]', body), { title: 'Cotação da moeda', series: [{ name: 'Câmbio', data: C.hist }] });
  body.onclick = e => {
    const f = e.target.closest('[data-fx]'); if (f && confirm(`Adotar ${FX[f.dataset.fx].name}?`)) { const r = game.setFx(f.dataset.fx); toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender(); }
    if (e.target.closest('[data-dev]') && confirm('Desvalorizar a moeda?')) { const r = game.devalue(); toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender(); }
  };
}

// Financiamento de investimentos: fundo nacional, emissão e títulos (com teto anual) → carteira de investimentos.
function finance(body, game) {
  const s = game.s, g = s.econ.gdp, L = financeLimits(s), F = s.fin;
  const pctOf = v => (v / g * 100).toFixed(2) + '% do PIB';
  const src = (key, title, have, cap, note, risk) => `<div class="panel tight"><b>${title}</b><div class="small">${note}</div>
    <div class="small" style="margin:4px 0">Disponível: <b>${money(have)}</b> (${pctOf(have)})${cap ? ` · teto ${money(cap)}` : ''}</div><div class="small c-warn">${risk}</div>
    <div class="row" style="gap:4px;margin-top:4px">${[0.25, 0.5, 1].map(p => `<button class="small" data-raise="${key}:${p}" ${have < 1e-6 ? 'disabled' : ''}>+${p}% do PIB</button>`).join('')}</div></div>`;
  body.innerHTML = `<h2>Financiamento de investimentos</h2>
    <div class="panel"><div class="row" style="gap:24px;flex-wrap:wrap"><div><div class="small muted">Carteira de investimentos</div><div style="font-size:26px;font-family:Georgia">${money(F.pool)}</div><div class="small muted">${pctOf(F.pool)} · só paga obras, iniciativas, programas, compras militares e investimentos setoriais</div></div>
      <div><div class="small muted">Fundo nacional</div><div style="font-size:26px;font-family:Georgia">${money(F.fund)}</div><div class="small muted">teto ${FIN_CAPS.fundCap}% do PIB · rende 3% a.a. · recebe 25% dos superávits</div></div>
      <div><div class="small muted">Tesouro</div><div style="font-size:26px;font-family:Georgia">${money(s.econ.treasury)}</div></div></div>
      <p class="small">Sem caixa, ainda dá para investir: tirando do fundo, imprimindo moeda ou emitindo títulos. Cada fonte tem um <b>teto anual</b> e um preço — inflação, reputação, juros — e o fundo se esgota e só volta a encher quando o orçamento tiver superávit. Dinheiro parado na carteira perde valor com a inflação.</p></div>
    <div class="grid g3">${src('fund', '🏦 Fundo nacional', L.fund, L.fundCap, 'Poupança do Estado. Usar não custa nada agora — mas depois não haverá reserva.', 'Esgota-se; volta a encher só com superávits.')}
      ${src('print', '🖨 Emissão de moeda', L.print, L.printCap, `Até ${FIN_CAPS.printYear}% do PIB por ano.`, 'Inflação nos próximos meses e perda de reputação.')}
      ${src('bonds', '📜 Títulos de investimento', L.bonds, L.bondsCap, `Até ${FIN_CAPS.bondsYear}% do PIB por ano, dentro do limite de crédito.`, L.defaulted ? 'Indisponível depois do calote.' : 'Aumenta a dívida e os juros.')}</div>
    <div class="panel"><h3>Investimentos setoriais</h3><p class="small muted">Aplicação de uma só vez (0,5% do PIB), efeito por 18 meses. Repetir o mesmo setor no mesmo ano rende menos.</p>
      <div class="grid g4">${Object.entries(SECTOR_INVEST).map(([k, S]) => `<div class="panel tight"><b>${esc(S.name)}</b><div class="small muted">${S.mods.map(([m, v]) => `${m.replace(/^g_|^s_/, '')} ${v > 0 ? '+' : ''}${v}`).join(' · ')}</div><button class="small primary" data-sector="${k}" style="margin-top:4px">Investir ${money(g * 0.005)}</button></div>`).join('')}</div></div>
    <div class="panel"><h3>Movimentos recentes</h3>${(F.log || []).map(x => `<div class="small">${fmtDate(x.day)} · ${({ fund: 'Fundo', print: 'Emissão', bonds: 'Títulos' })[x.source]}: ${money(x.amt)}</div>`).join('') || '<div class="small muted">Nenhum.</div>'}</div>`;
  body.onclick = e => {
    const r = e.target.closest('[data-raise]'); if (r) { const [k, p] = r.dataset.raise.split(':'); const x = game.raiseFunds(k, +p); toast(esc(x.msg), x.ok ? 'good' : 'warn'); return rerender(); }
    const sc = e.target.closest('[data-sector]'); if (sc) { const x = game.sectorInvest(sc.dataset.sector, 0.5); toast(esc(x.msg), x.ok ? 'good' : 'warn'); return rerender(); }
  };
}

