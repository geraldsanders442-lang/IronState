import { $, esc, num, money, signed, bar, tone, statName, modsList, toast } from './dom.js';
import { SPEND, SECTORS } from '../sim/constants.js';
import { mountNation, NATION_METRICS } from './mapviews.js';
import { interestRate, costMultiplier, efficiencyFactor, debtRatio } from '../sim/model.js';
import { mountLine, pieSVG, barsHTML } from './charts.js';
import { rerender } from './app.js';
import { statTable } from './pages.js';
import { STAT_INFO, GROUPS } from '../sim/constants.js';
import { PROGRAMS, programBlock, programById, MAX_PROGRAMS, spendNeed } from '../sim/programs.js';

const REV_NAMES = { tax: 'Impostos', state: 'Empresas estatais', tariffs: 'Tarifas de importação', other: 'Taxas e royalties' };
const EXP_NAMES = { ...Object.fromEntries(Object.entries(SPEND).map(([k, v]) => [k, v.name])), initiatives: 'Manutenção de iniciativas', interest: 'Juros da dívida', war: 'Guerra e mobilização', occupation: 'Ocupação', orgs: 'Contribuições a organizações', sizeOverhead: 'Custo administrativo do território', discretionary: 'Dotação discricionária (vai ao tesouro)', regional: 'Transferências aos governos regionais' };
const SPEND_TIP = {
  health: 'Eleva acesso à saúde (rendimentos decrescentes acima de ~6%).', education: 'Eleva educação; produtividade melhora com o tempo.', welfare: 'Reduz pobreza, fome e desigualdade; agrada trabalhadores.',
  security: 'Controle territorial e inteligência; também conta como repressão.', military: 'Prontidão, equipamento, efetivo e satisfação militar.', admin: 'Eficiência, combate à corrupção e satisfação do funcionalismo.', infra: 'Mantém e amplia a infraestrutura das regiões.',
};

function budgetTable(s) {
  const b = s.d.budget, g = s.econ.gdp;
  const row = (n, v, cls = '') => `<tr><td>${n}</td><td class="num ${cls}">${money(v)}</td><td class="num muted">${num(v / g * 100, 2)}%</td></tr>`;
  return `<div class="grid g2"><div><b>Receitas</b><table class="data">${Object.entries(b.rev).map(([k, v]) => row(REV_NAMES[k], v)).join('')}<tr><th>Total</th><th class="num">${money(b.revenue)}</th><th class="num">${num(b.revenue / g * 100, 1)}%</th></tr></table></div>
    <div><b>Despesas</b><table class="data">${Object.entries(b.exp).filter(([, v]) => v > 0.0001).map(([k, v]) => row(EXP_NAMES[k], v)).join('')}<tr><th>Total</th><th class="num">${money(b.expense)}</th><th class="num">${num(b.expense / g * 100, 1)}%</th></tr></table></div></div>
    <div class="panel tight" style="margin-top:8px;background:${b.balance < 0 ? '#fdf0ee' : '#eff8f0'}"><b>Saldo anual: <span class="${b.balance < 0 ? 'c-bad' : 'c-good'}">${money(b.balance)}</span> (${signed(b.balance / g * 100, 2)}% do PIB)</b>
    ${s.d.printing ? '<div class="c-bad small">⚠ Sem crédito: o déficit está sendo coberto com emissão de moeda — a inflação vai subir.</div>' : s.d.borrowing ? '<div class="c-warn small">O déficit está sendo financiado com nova dívida.</div>' : ''}</div>`;
}

export function budgetPage(el, game) {
  const s = game.s, g = s.econ.gdp, b = s.d.budget;
  const limit = (0.6 + s.st.reputation / 100 * 0.6 + (s.d.mods.creditLimit || 0)) * 100;
  el.innerHTML = `<h2>Orçamento nacional</h2>
    <div class="grid g2"><div class="panel"><h3>Impostos e gastos</h3>
      <div class="form-grid" style="grid-template-columns:200px 1fr 70px">
        <label><span class="stat-name" data-tip="Alíquota média sobre a economia. Acima de 30% reduz o crescimento; acima de 35% estimula sonegação. Empresários odeiam aumentos.">Carga tributária</span></label><input type="range" min="5" max="60" step="0.5" value="${s.budget.tax}" data-tax><b data-v="tax">${num(s.budget.tax, 1)}%</b>
        ${Object.entries(SPEND).map(([k, v]) => `<label><span class="stat-name" data-tip="${esc(SPEND_TIP[k])} Mínimo para não sucatear: ${num(spendNeed(s, k), 1)}%.">${v.name}</span>${s.budget.spend[k] < spendNeed(s, k) * 0.85 ? ' <span class="tag bad" data-tip="Abaixo do mínimo: o serviço se deteriora, gera protestos e crises.">sucateado</span>' : ''}</label><input type="range" min="0" max="12" step="0.1" value="${s.budget.spend[k]}" data-sp="${k}"><b data-v="${k}">${num(s.budget.spend[k], 1)}%</b>`).join('')}
      </div><div class="small c-warn" style="margin-top:4px">Cortes de mais de 0,5 p.p. em uma semana provocam greves e protestos. Gastar abaixo do mínimo de cada área degrada saúde, educação, segurança e infraestrutura.</div><div class="small muted" style="margin-top:6px">Valores em % do PIB por ano. Capacidade de arrecadação: ${num(s.st.taxCapacity, 0)}/100; corrupção desvia ${num(s.st.corruption / 3, 0)}% dos impostos.</div></div>
      <div class="panel"><h3>Contas públicas</h3><div data-table>${budgetTable(s)}</div></div></div>
    <div class="grid g3">
      <div class="panel"><h3>Dívida e crédito</h3><table class="data">
        <tr><td>${statName('debtRatio')}</td><td class="num">${num(debtRatio(s), 1)}% (${money(s.econ.debt)})</td></tr>
        <tr><td>${statName('interestRate')}</td><td class="num">${num(interestRate(s), 2)}%</td></tr>
        <tr><td><span class="stat-name" data-tip="Até esse nível de dívida/PIB os credores financiam déficits. Depende da reputação.">Limite de crédito</span></td><td class="num">${num(limit, 0)}% PIB</td></tr>
        <tr><td>Tesouro disponível</td><td class="num">${money(s.econ.treasury)}</td></tr>
        <tr><td>${statName('reserves')}</td><td class="num">${money(s.econ.reserves)}</td></tr>
        <tr><td>Moeda emitida (últimos meses)</td><td class="num">${money(s.econ.printed)}</td></tr></table>
        <div class="row" style="margin-top:8px"><button data-fmg ${s.orgs.IMF ? '' : 'disabled'}>Empréstimo do FMI</button><button data-go="diplomacy">Empréstimos bilaterais</button></div>
        <div class="small muted">${s.orgs.IMF ? '' : 'Adira ao FMI (Diplomacia › Organizações) para pedir resgate.'}</div></div>
      <div class="panel"><h3>Composição das despesas</h3><div data-pie>${pieSVG(Object.entries(b.exp).filter(([, v]) => v > 0.001).map(([k, v]) => ({ label: EXP_NAMES[k], value: v })), 140)}</div></div>
      <div class="panel"><div data-hist></div></div></div>`;
  mountLine($('[data-hist]', el), { title: 'Saldo orçamentário e dívida (% PIB)', series: [{ name: 'Saldo', data: s.history.map(h => [h.day, h.balance]) }, { name: 'Dívida', data: s.history.map(h => [h.day, h.debt]) }] });
  el.oninput = e => {
    const t = e.target;
    if (t.matches('[data-tax]')) { game.setTax(+t.value); $('[data-v="tax"]', el).textContent = num(+t.value, 1) + '%'; }
    if (t.dataset.sp) { game.setSpend(t.dataset.sp, +t.value); $(`[data-v="${t.dataset.sp}"]`, el).textContent = num(+t.value, 1) + '%'; }
    $('[data-table]', el).innerHTML = budgetTable(s);
  };
  el.onchange = () => { game.save(); rerender(); };
  el.onclick = e => { if (e.target.closest('[data-fmg]')) { const r = game.imfLoan(); toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender(); } };
}

const CATS = { civil: 'Civil', econ: 'Economia e infraestrutura', gov: 'Governamental', mil: 'Militar' };
let initCat = 'civil';

export function initiativesPage(el, game) {
  const s = game.s, data = game.data, g = s.econ.gdp;
  const list = data.initiatives.filter(i => i.cat === initCat);
  const cm = costMultiplier(s), eff = efficiencyFactor(s);
  const upkeep = Object.keys(s.initiatives).filter(id => s.initiatives[id].status === 'active').reduce((a, id) => a + data.initById[id].upkeep, 0);
  el.innerHTML = `<h2>Iniciativas governamentais</h2>
    <div class="panel row" style="justify-content:space-between"><div>Tesouro: <b>${money(s.econ.treasury)}</b> · Manutenção anual das iniciativas ativas: <b>${num(upkeep, 2)}% PIB</b></div>
      <div><span class="stat-name" data-tip="Comprar muitos projetos em pouco tempo encarece os próximos (sobrecarga de obras), assim como corrupção e inflação alta.">Multiplicador de custo</span> <b class="${cm > 1.3 ? 'c-bad' : ''}">×${num(cm, 2)}</b> ·
      <span class="stat-name" data-tip="Quanto do efeito prometido se concretiza. Depende da eficiência administrativa e da corrupção.">Eficiência dos gastos</span> <b class="${eff < 0.7 ? 'c-bad' : 'c-good'}">${num(eff * 100, 0)}%</b></div></div>
    <div class="tabs">${Object.entries(CATS).map(([k, n]) => `<button data-cat="${k}" class="${k === initCat ? 'on' : ''}">${n} (${data.initiatives.filter(i => i.cat === k && s.initiatives[i.id]?.status === 'active').length}/${data.initiatives.filter(i => i.cat === k).length})</button>`).join('')}</div>
    <div class="card-list">${list.map(i => {
      const st = s.initiatives[i.id];
      const block = game.initiativeBlock(i.id);
      const cost = game.initiativeCost(i.id);
      const status = st ? (st.status === 'active' ? '<span class="tag good">Ativa</span>' : `<span class="tag blue">Em construção</span>`) : block ? `<span class="tag">${esc(block)}</span>` : '<span class="tag warn">Disponível</span>';
      return `<div class="icard ${st?.status || ''}"><div class="row" style="justify-content:space-between"><h4>${esc(i.name)}</h4>${status}</div>
        <div class="small">${esc(i.desc)}</div>
        <div class="kv"><span>Custo inicial</span><span><b>${money(cost)}</b> <span class="muted">(${num(i.cost * cm, 2)}% PIB)</span></span>
        <span>Manutenção</span><span>${money(g * i.upkeep / 100)}/ano</span><span>Implantação</span><span>${i.days} dias</span>
        ${i.req ? `<span>Pré-requisitos</span><span>${i.req.map(r => data.initById[r].name).join(', ')}</span>` : ''}${i.coast ? '<span>Exige</span><span>Litoral</span>' : ''}</div>
        <div>${modsList(Object.fromEntries(Object.entries(i.effects).map(([k, v]) => [k, v * eff])))}</div>
        <div class="small c-warn">⚠ ${esc(i.risk)}</div>
        ${st?.status === 'building' ? `<div class="progress"><i style="width:${(st.progress / i.days * 100).toFixed(0)}%"></i></div><div class="small muted">${num(st.progress / i.days * 100, 0)}% concluído</div>` : ''}
        <div class="right">${st ? (st.status === 'active' ? `<button class="small" data-cancel="${i.id}" data-tip="Encerra o programa: economiza a manutenção, perde os efeitos.">Encerrar</button>` : '') : `<button class="primary small" data-buy="${i.id}" ${block ? 'disabled' : ''}>Iniciar projeto</button>`}</div></div>`;
    }).join('')}</div>`;
  el.onclick = e => {
    const c = e.target.closest('[data-cat]'); if (c) { initCat = c.dataset.cat; initiativesPage(el, game); }
    const b = e.target.closest('[data-buy]'); if (b) { const r = game.buyInitiative(b.dataset.buy); if (!r.ok) toast(esc(r.msg), 'warn'); rerender(); }
    const x = e.target.closest('[data-cancel]'); if (x && confirm('Encerrar esta iniciativa? O investimento inicial não é recuperado.')) { game.cancelInitiative(x.dataset.cancel); rerender(); }
  };
}

function programsHTML(game) {
  const s = game.s, g = s.econ.gdp, act = s.programs || [];
  const lab = k => k.startsWith('g_') ? 'apoio de ' + (GROUPS[k.slice(2)]?.name || k).toLowerCase() : (STAT_INFO[k]?.[0] || '').toLowerCase() || { exportAccess: 'acesso a mercados', importAccess: 'capacidade de importar', revenue: 'receita (% PIB)', housing: 'habitação', crime: 'criminalidade', congestion: 'congestionamento' }[k] || k;
  const effects = m => Object.entries(m).map(([k, v]) => `${lab(k)} ${signed(v, Number.isInteger(v) ? 0 : Math.abs(v) < 1 ? 2 : 1)}`).join(', ');
  return `<div class="panel"><h3>Programas econômicos <span class="small muted">(até ${MAX_PROGRAMS} ao mesmo tempo)</span></h3>
    ${act.length ? `<div style="margin-bottom:6px">${act.map(p => `<div class="row" style="justify-content:space-between"><span><b>${esc(programById[p.id].name)}</b> — ${Math.max(0, p.end - game.day)} dias restantes</span><button class="small" data-pcancel="${p.id}">Interromper</button></div>`).join('')}</div>` : ''}
    <table class="data"><tr><th>Programa</th><th class="num">Custo</th><th class="num">Duração</th><th>Durante</th><th>Depois</th><th></th></tr>
    ${PROGRAMS.map(p => { const b = programBlock(s, p); return `<tr><td><b>${esc(p.name)}</b><div class="small muted">${esc(p.desc)}</div></td><td class="num">${p.cost > 0 ? money(g * p.cost / 100) : p.cost < 0 ? '<span class="c-good">+' + money(-g * p.cost / 100) + '</span>' : '—'}</td><td class="num">${p.weeks} sem.</td>
      <td class="small">${esc(effects(p.mods))}</td><td class="small muted">${p.after ? esc(effects(p.after[0])) + (p.after[1] ? ` (${p.after[1]} sem.)` : ' (permanente)') : '—'}</td>
      <td><button class="small primary" data-prog="${p.id}" ${b ? `disabled data-tip="${esc(b)}"` : ''}>${b ? esc(b.length > 22 ? 'Indisponível' : b) : 'Lançar'}</button></td></tr>`; }).join('')}</table></div>`;
}

export function economyPage(el, game) {
  const s = game.s, sec = s.sector;
  el.onclick = e => {
    const p = e.target.closest('[data-prog]'); if (p) { const r = game.startProgram(p.dataset.prog); toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender(); }
    const c = e.target.closest('[data-pcancel]'); if (c && confirm('Interromper o programa? Os efeitos param e a credibilidade cai.')) { game.cancelProgram(c.dataset.pcancel); rerender(); }
  };
  el.innerHTML = `<h2>Economia nacional</h2>${programsHTML(game)}
    <div class="grid g3"><div class="panel"><h3>Macroeconomia</h3>${statTable(s, ['gdp', 'gdppc', 'growth', 'inflation', 'unemployment', 'productivity', 'industry', 'tech', 'market'], { gdppc: 'gdppc' })}</div>
    <div class="panel"><h3>Comércio exterior</h3><table class="data">
      <tr><td>Exportações/ano</td><td class="num">${money(sec.exports)}</td></tr><tr><td>Importações/ano</td><td class="num">${money(sec.imports)}</td></tr>
      <tr><td>Saldo comercial</td><td class="num ${sec.exports - sec.imports < 0 ? 'c-bad' : 'c-good'}">${money(sec.exports - sec.imports)}</td></tr>
      <tr><td><span class="stat-name" data-tip="Fração do excedente que encontra compradores no exterior. Sobe com acordos comerciais, portos, blocos e integração; cai com sanções e isolamento.">Acesso a mercados</span></td><td class="num">${num(sec.exAccess * 100, 0)}%</td></tr>
      <tr><td><span class="stat-name" data-tip="Fração do déficit de produção que pode ser coberta por importações.">Capacidade de importar</span></td><td class="num">${num(sec.imAccess * 100, 0)}%</td></tr>
      <tr><td>Acordos comerciais (peso)</td><td class="num">${num(sec.tradeW, 1)}</td></tr><tr><td>Peso das sanções</td><td class="num ${sec.sanctions > 0 ? 'c-bad' : ''}">${num(sec.sanctions, 1)}</td></tr>
      <tr><td>${statName('reserves')}</td><td class="num">${money(s.econ.reserves)}</td></tr></table></div>
    <div class="panel"><div data-gdp></div><div data-inf style="margin-top:8px"></div></div></div>
    <div class="panel"><h3>Produção e consumo por setor (bi/ano)</h3><table class="data"><tr><th>Setor</th><th class="num">Produção</th><th class="num">Consumo</th><th class="num">Exportação</th><th class="num">Importação</th><th class="num">Dependência</th><th class="num">Escassez</th><th style="width:200px">Produção vs consumo</th></tr>
      ${Object.entries(sec.rows).map(([k, r]) => `<tr><td>${SECTORS[k].name}</td><td class="num">${num(r.prod, 1)}</td><td class="num">${num(r.cons, 1)}</td><td class="num c-good">${r.exp ? num(r.exp, 1) : '—'}</td><td class="num">${r.imp ? num(r.imp, 1) : '—'}</td>
        <td class="num ${r.dep > 0.3 ? 'c-warn' : ''}">${num(r.dep * 100, 0)}%</td><td class="num ${r.short > 0.01 ? 'c-bad' : 'muted'}">${r.short > 0.001 ? num(r.short * 100, 1) + '%' : '—'}</td>
        <td>${bar(Math.min(150, r.prod / r.cons * 100), r.prod >= r.cons ? 'good' : r.short > 0.01 ? 'bad' : 'warn', 150)}</td></tr>`).join('')}</table>
      <div class="small muted" style="margin-top:6px">Excedentes são exportados conforme o acesso a mercados; déficits são importados até o limite da capacidade de importação. O que faltar vira escassez — fome, apagões, inflação e queda do crescimento.</div></div>`;
  mountLine($('[data-gdp]', el), { title: 'PIB (bi)', series: [{ name: 'PIB', data: s.history.map(h => [h.day, h.gdp]) }], yFmt: v => num(v, 0) });
  mountLine($('[data-inf]', el), { title: 'Exportações × importações (bi/ano)', series: [{ name: 'Exportações', data: s.history.map(h => [h.day, h.exports]) }, { name: 'Importações', data: s.history.map(h => [h.day, h.imports]) }], height: 120 });
}

export function lawsPage(el, game) {
  const s = game.s, data = game.data;
  const cd = s.counters.polCd || {};
  el.innerHTML = `<h2>Leis, direitos e fronteiras</h2><div class="muted small" style="margin-bottom:8px">Cada mudança de lei abala levemente a estabilidade e só pode ser revista após 20 dias. Os efeitos agem gradualmente sobre os indicadores.</div>
    <div class="grid g2">${data.policies.map(p => {
      const cur = p.levels.find(l => l.id === s.policies[p.id]);
      const wait = (cd[p.id] || 0) - game.day;
      return `<div class="panel"><div class="row" style="justify-content:space-between"><h3 style="border:none;margin:0">${esc(p.name)}</h3><span class="small muted">${wait > 0 ? `revisão em ${wait} dias` : ''}</span></div>
        <div class="small muted">${esc(p.desc)}</div>
        <div class="seg" style="margin:6px 0">${p.levels.map(l => `<button data-pol="${p.id}" data-lvl="${l.id}" class="${l.id === cur.id ? 'on' : ''}" ${wait > 0 && l.id !== cur.id ? 'disabled' : ''}>${esc(l.name)}</button>`).join('')}</div>
        <div class="small"><b>${esc(cur.name)}:</b> ${esc(cur.desc)}</div><div style="margin-top:3px">${Object.keys(cur.mods).length ? modsList(cur.mods) : '<span class="muted small">Referência neutra.</span>'}</div></div>`;
    }).join('')}</div>`;
  el.onclick = e => {
    const b = e.target.closest('[data-pol]');
    if (!b) return;
    let r = game.setPolicy(b.dataset.pol, b.dataset.lvl);
    if (!r.ok && r.needVotes && confirm(r.msg + '\n\nComprar os votos?')) r = game.setPolicy(b.dataset.pol, b.dataset.lvl, { buy: true });
    toast(esc(r.msg), r.ok ? 'good' : 'warn');
    rerender();
  };
}

const urbView = { metric: 'infra' };
export function urbanPage(el, game) {
  const s = game.s, size = s.nation.profile;
  const urbanPop = s.econ.pop * s.d.urbanShare / 100;
  const tot = s.regions.reduce((a, r) => a + r.invest, 0) || 1;
  el.innerHTML = `<h2>Desenvolvimento urbano e regional</h2>
    <div class="grid" style="grid-template-columns:320px minmax(0,1fr)"><div class="panel"><h3>Indicadores nacionais</h3><table class="data">
      <tr><td>População urbana</td><td class="num">${num(urbanPop, 2)} mi (${num(s.d.urbanShare, 0)}%)</td></tr><tr><td>População rural</td><td class="num">${num(s.econ.pop - urbanPop, 2)} mi</td></tr>
      <tr><td>${statName('infra')}</td><td class="num">${num(s.d.infra, 1)}</td></tr><tr><td><span class="stat-name" data-tip="Oferta de moradia adequada. Cai com urbanização acelerada.">Habitação</span></td><td class="num">${num(s.st.housing, 1)}</td></tr>
      <tr><td><span class="stat-name" data-tip="Trânsito e transporte. Melhora com transporte público.">Congestionamento</span></td><td class="num">${num(s.st.congestion, 1)}</td></tr>
      <tr><td>Abastecimento de energia</td><td class="num">${num(Math.min(100, s.sector.rows.energy.prod / s.sector.rows.energy.cons * 100), 0)}%</td></tr>
      <tr><td>${statName('health')} (água e saneamento)</td><td class="num">${num(s.st.health, 1)}</td></tr><tr><td>${statName('education')}</td><td class="num">${num(s.st.education, 1)}</td></tr>
      <tr><td>${statName('industry')}</td><td class="num">${num(s.st.industry, 1)}</td></tr><tr><td>${statName('pollution')}</td><td class="num">${num(s.st.pollution, 1)}</td></tr>
      <tr><td><span class="stat-name" data-tip="Diferença entre a região mais e a menos desenvolvida. Aumenta desigualdade e separatismo.">Desigualdade regional</span></td><td class="num">${num(s.d.regionSpread, 1)}</td></tr>
      <tr><td>Criminalidade</td><td class="num">${num(s.st.crime, 1)}</td></tr><tr><td>Separatismo</td><td class="num">${num(s.st.separatism, 1)}</td></tr><tr><td>Custo administrativo do território</td><td class="num">×${num(size.admin, 2)}</td></tr></table></div>
      <div class="panel tight"><div class="row small" style="justify-content:space-between;margin-bottom:4px"><b>Mapa das regiões</b><div class="seg">${Object.entries(NATION_METRICS).map(([k, v]) => `<button data-metric="${k}" class="${urbView.metric === k ? 'on' : ''}">${v[0]}</button>`).join('')}</div></div><div data-nmap></div></div></div>
    <div class="panel"><h3>Regiões administrativas</h3><div class="small muted" style="margin-bottom:6px">O gasto de infraestrutura (${num(s.budget.spend.infra, 1)}% PIB, ajustável no Orçamento) é dividido entre as regiões conforme a prioridade. Regiões anexadas ou com movimentos separatistas são mais instáveis.</div>
      <table class="data"><tr><th>Região</th><th class="num">Províncias</th><th class="num">População</th><th class="num">Urb.</th><th>Infraestrutura</th><th>Habitação</th><th>Poluição</th><th>Tensão</th><th style="width:170px">Prioridade de investimento</th></tr>
      ${s.regions.map(r => `<tr><td><b>${esc(r.name)}</b>${r.cap ? ' ★' : ''}${r.annexed ? ' <span class="tag warn">anexada</span>' : ''}${(r.sep || 0) >= 0.3 ? ' <span class="tag bad" data-tip="Movimento autonomista/separatista">separatismo</span>' : ''}${r.occupiedShare ? ` <span class="tag bad">${num(r.occupiedShare * 100, 0)}% ocupada</span>` : ''}</td><td class="num">${r.provinces.length}</td><td class="num">${num(s.econ.pop * r.popShare, 2)} mi</td><td class="num">${num(r.urban, 0)}%</td>
        <td>${num(r.infra, 0)} ${bar(r.infra, tone('infra', r.infra))}</td><td>${num(r.housing, 0)} ${bar(r.housing, r.housing > 60 ? 'good' : r.housing > 35 ? 'warn' : 'bad')}</td>
        <td>${num(r.pollution, 0)} ${bar(r.pollution, tone('pollution', r.pollution))}</td><td>${num(r.unrest, 0)} ${bar(r.unrest, r.unrest < 40 ? 'good' : r.unrest < 65 ? 'warn' : 'bad')}</td>
        <td><input type="range" min="0" max="100" value="${r.invest}" data-reg="${r.id}"> <span class="small" data-share="${r.id}">${num(r.invest / tot * 100, 0)}%</span></td></tr>`).join('')}</table></div>`;
  mountNation($('[data-nmap]', el), game, urbView.metric);
  el.onclick = e => { const m = e.target.closest('[data-metric]'); if (m) { urbView.metric = m.dataset.metric; urbanPage(el, game); } };
  el.oninput = e => {
    const id = e.target.dataset.reg; if (!id) return;
    game.setRegionInvest(id, +e.target.value);
    const t2 = s.regions.reduce((a, r) => a + r.invest, 0) || 1;
    for (const r of s.regions) $(`[data-share="${r.id}"]`, el).textContent = num(r.invest / t2 * 100, 0) + '%';
  };
  el.onchange = () => game.save();
}
