import { $, esc, num, money, signed, bar, tone, deltaTone, statName, toast } from './dom.js';
import { STAT_INFO, GROUPS } from '../sim/constants.js';
import { fmtDate, fmtTime } from '../sim/util.js';
import { gdppc, debtRatio, militaryPower, interestRate } from '../sim/model.js';
import { issueBody, resultHTML } from './cards.js';
import { flagHTML as flagSVG, entityFlag } from './flag.js';
import { mountNation, NATION_METRICS } from './mapviews.js';
import { missionProgress } from '../sim/missions.js';
import { partnerName } from '../sim/diplomacy.js';
import { aiPower } from '../sim/world.js';
import { mountLine, mountScatter, PALETTE } from './charts.js';
import { go, rerender, showCard } from './app.js';
import { warStanding } from '../sim/campaign.js';

import { budgetPage, initiativesPage, economyPage, lawsPage, urbanPage } from './pages-gov.js';
import { societyPage, diplomacyPage, militaryPage, mapPage, optionsPage, rankingsPage } from './pages-world.js';
import { politicsPage } from './pages-politics.js';
import { rightsPage } from './pages-rights.js';
import { economyHub } from './pages-economy.js';
import { researchPage } from './diplomacy-plus.js';
import { encyclopediaPage, editorPage } from './pages-extra.js';
import { orderPage, propagandaPage, regionsPage, chiefPage } from './pages-depth.js';
import { healthPage } from './pages-health.js';
import { taxPage } from './pages-tax.js';
import { ethnicPage } from './pages-minority.js';

export const NAV = [
  ['Nação', [['overview', 'Visão geral'], ['issues', 'Questões'], ['stats', 'Estatísticas'], ['analysis', 'Gráficos e plano']]],
  ['Governo', [['budget', 'Orçamento'], ['initiatives', 'Iniciativas'], ['economy', 'Economia'], ['laws', 'Leis e direitos'], ['rights', 'Minorias e direitos'], ['urban', 'Desenvolvimento urbano'], ['health', 'Saúde e saneamento'], ['tax', 'Impostos e tarifas'], ['regions', 'Regiões e vocações'], ['research', 'Pesquisa']]],
  ['Poder', [['politics', 'Política'], ['chief', 'Chefe de gabinete'], ['propaganda', 'Propaganda'], ['ethnic', 'Povos e minorias'], ['order', 'Ordem e êxodo'], ['society', 'Sociedade e gabinete'], ['diplomacy', 'Diplomacia'], ['military', 'Forças armadas'], ['map', 'Mapa-múndi'], ['rankings', 'Rankings']]],
  ['Arquivo', [['reports', 'Relatórios'], ['encyclopedia', 'Enciclopédia'], ['editor', 'Editor e mods'], ['options', 'Opções']]],
];

export function statVal(s, k) {
  switch (k) {
    case 'pop': return s.econ.pop;
    case 'gdp': return s.econ.gdp;
    case 'gdppc': return gdppc(s);
    case 'debtRatio': return debtRatio(s);
    case 'interestRate': return interestRate(s);
    case 'reserves': return s.econ.reserves;
    case 'support': return s.d.support;
    case 'satisfaction': return s.d.satisfaction;
    case 'elites': return s.d.elites;
    case 'infra': return s.d.infra;
    case 'energyDep': return (s.sector.rows?.energy.dep || 0) * 100;
    case 'foodDep': return (s.sector.rows?.food.dep || 0) * 100;
  }
  return s.st[k];
}
export function fmtStat(s, k, v = statVal(s, k)) {
  if (k === 'gdp' || k === 'reserves') return money(v);
  if (k === 'gdppc') return num(v, 0) + ' ' + esc(s.nation.currency);
  if (k === 'pop') return num(v, 2) + ' mi';
  if (k === 'troops') return num(v, 0) + ' mil';
  const u = STAT_INFO[k]?.[1] || '';
  return num(v, 1) + (u === '0-100' ? '' : ' ' + u);
}

// Tabela de indicadores com tendência dos últimos 30 dias
export function statTable(s, keys, histKey = {}) {
  const h = s.history, past = h[Math.max(0, h.length - 31)];
  return `<table class="data">${keys.map(k => {
    const v = statVal(s, k);
    const hk = histKey[k] || k;
    const d = h.length > 1 && past && past[hk] != null && h.at(-1)?.[hk] != null ? h.at(-1)[hk] - past[hk] : null;
    const t = tone(k, v);
    const idx = (STAT_INFO[k]?.[1] || '') === '0-100' || ['poverty', 'hunger', 'unemployment'].includes(k);
    return `<tr><td>${statName(k)}</td><td class="num"><b class="c-${t === 'neutral' ? 'neutral' : t}">${fmtStat(s, k, v)}</b></td>
      <td style="width:90px">${idx ? bar(v, t) : ''}</td><td class="num small ${d == null ? 'muted' : deltaTone(k, d)}" data-tip="Variação em 30 dias">${d == null ? '' : signed(d, Math.abs(d) < 10 ? 1 : 0)}</td></tr>`;
  }).join('')}</table>`;
}

const ovView = { metric: 'region' };
export function advisorBox(game, max = 4) {
  const A = game.advisorAlerts().slice(0, max);
  if (!A.length) return '<h3 style="margin-top:8px">Conselheiros</h3><div class="small muted">Nenhum alerta: o gabinete considera a situação sob controle.</div>';
  return `<h3 style="margin-top:8px">Conselheiros</h3>${A.map((a, i) => `<div class="adv-alert l${a.lvl}"><b>${esc(a.who)}:</b> ${esc(a.title)}<div class="small muted">${esc(a.text)}</div>
    <div class="acts">${a.actions.map(x => x.go ? `<button class="small" data-go="${x.go}">${esc(x.label)}</button>` : `<button class="small primary" data-advprog="${x.program}">${esc(x.label)}</button>`).join('')}</div></div>`).join('')}`;
}

function overview(el, game) {
  const s = game.s, n = s.nation, data = game.data, I = n.ideology, b = s.d.budget;
  const pend = s.issues.pending;
  const wars = s.wars.filter(w => w.active);
  const crises = pend.filter(p => game.getIssue(p.id)?.crisis);
  const risks = [['coupRisk', 'Golpe'], ['revoRisk', 'Revolução'], ['protest', 'Protestos'], ['separatism', 'Separatismo']];
  const status = s.over ? 'Regime encerrado' : wars.length ? 'Em guerra' : crises.length ? 'Crise em curso' : s.st.stability < 35 ? 'Instável' : s.st.stability > 65 ? 'Estável' : 'Tenso';
  const R = s.world.rankings || {};
  el.innerHTML = `
    <div class="panel banner">${flagSVG(n.flag, 130)}<div style="flex:1">
      <div class="title">${esc(n.officialName)}</div><div class="motto">"${esc(n.motto)}"</div>
      <div class="small" style="margin-top:4px"><b>${esc(I?.government || n.regime)}</b> · ideologia: <b>${esc(I?.primary || '')}</b> ${(I?.traits || []).slice(0, 4).map(t => `<span class="tag blue">${esc(t)}</span>`).join('')}</div>
      <div class="small">Governante: <b>${esc(n.leader)}</b> · Capital: <b>${esc(n.capital)}</b> · ${num(n.area / 1000, 0)} mil km² · ${n.scenarioName ? esc(n.scenarioName) : ''}${n.alt ? ' (história alternativa)' : ''}</div>
      <div class="row" style="margin-top:4px">${s.achievements.map(a => `<span class="tag good">★ ${esc(a.id)}</span>`).join('')}</div></div>
      <div class="right small"><div><b>${fmtDate(game.day, true)}</b></div><div>Semana ${game.week + 1}</div><div style="margin-top:4px">Situação: <b class="${status === 'Estável' ? 'c-good' : status === 'Tenso' ? 'c-warn' : 'c-bad'}">${status}</b></div>
        <div class="muted">PIB ${R.gdp ? R.gdp.pos + 'º' : '—'} · militar ${R.military ? R.military.pos + 'º' : '—'} · influência ${R.influence ? R.influence.pos + 'º' : '—'} no mundo</div></div></div>
    <div class="grid" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)"><div class="panel tight"><div class="row small" style="justify-content:space-between;margin-bottom:4px"><b>Mapa nacional</b><div class="seg">${Object.entries(NATION_METRICS).map(([k, v]) => `<button data-metric="${k}" class="${ovView.metric === k ? 'on' : ''}">${v[0]}</button>`).join('')}</div></div><div data-nmap></div>
        <div class="small muted">★ capital · hachurado: ocupado · ${s.regions.length} regiões administrativas. Clique numa província para detalhes.</div></div>
      <div class="panel"><h3>Questões e crises (${pend.length})</h3>
        ${pend.length ? pend.map(p => { const i = game.getIssue(p.id); return `<div class="row" style="justify-content:space-between;border-bottom:1px dotted #ddd;padding:3px 0"><span class="small"><span class="tag ${i.crisis ? 'bad' : 'blue'}">${esc(i.cat)}</span> ${esc(i.title)} <span class="muted">(${Math.max(0, p.deadline - game.day)} dias)</span></span><button class="small primary" data-card="${p.id}">Decidir</button></div>`; }).join('') : '<div class="muted small">Nenhuma questão aguardando.</div>'}
        ${advisorBox(game)}
        <h3 style="margin-top:8px">Riscos</h3><div class="grid g4">${risks.map(([k, nm]) => `<div class="gauge"><div class="small">${statName(k)}</div><div style="font-size:20px" class="c-${tone(k, s.st[k])}">${num(s.st[k], 0)}</div>${bar(s.st[k], tone(k, s.st[k]))}</div>`).join('')}</div>
        ${wars.length ? `<h3 style="margin-top:8px">Guerras</h3>${wars.map(w => `<div class="small"><b>${esc(partnerName(s, data, w.enemy))}</b> — <b class="c-${warStanding(s, data, w).tone}">${warStanding(s, data, w).verdict}</b> · placar ${num(w.score, 0)}${w.mySiege ? ' · <b class="c-bad">capital sitiada</b>' : ''}<div class="front"><i style="left:${(w.score + 100) / 2}%"></i></div></div>`).join('')}` : ''}
        <h3 style="margin-top:8px">Missões</h3>${s.missions.active.slice(0, 4).map(m => { const d = missionProgress(s, m); return `<div class="mission small"><b>${esc(d.name)}</b> — ${esc(d.desc)} <span class="muted">(${Math.ceil(d.left / 7)} sem.)</span></div>`; }).join('') || '<div class="muted small">—</div>'}</div></div>
    <div class="grid g4">
      <div class="panel"><h3>Finanças</h3><table class="data"><tr><td>Tesouro</td><td class="num">${money(s.econ.treasury)}</td></tr><tr><td>Receita/ano</td><td class="num">${money(b.revenue)}</td></tr><tr><td>Despesa/ano</td><td class="num">${money(b.expense)}</td></tr><tr><td>Saldo</td><td class="num ${b.balance < 0 ? 'c-bad' : 'c-good'}">${money(b.balance)}</td></tr></table>${statTable(s, ['debtRatio'], { debtRatio: 'debt' })}</div>
      <div class="panel"><h3>Economia</h3>${statTable(s, ['gdp', 'growth', 'inflation', 'unemployment'])}</div>
      <div class="panel"><h3>Sociedade</h3>${statTable(s, ['pop', 'poverty', 'hunger', 'qol'])}</div>
      <div class="panel"><h3>Poder</h3>${statTable(s, ['support', 'stability', 'corruption', 'readiness', 'reputation'])}</div></div>
    <div class="grid g2"><div class="panel"><h3>Manchetes</h3><div class="log-list">${s.log.slice(0, 25).map(l => `<div><span class="muted small">${fmtDate(l.day)}</span> <span class="c-${{ good: 'good', bad: 'bad', war: 'bad', warn: 'warn' }[l.type] || 'neutral'}">●</span> ${esc(l.text)}</div>`).join('')}</div></div>
      <div class="panel"><div data-c1></div><div data-c2 style="margin-top:8px"></div></div></div>`;
  mountNation($('[data-nmap]', el), game, ovView.metric);
  el.addEventListener('click', e => { const b = e.target.closest('[data-advprog]'); if (b) { const r = game.startProgram(b.dataset.advprog); toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender(); } });
  el.onclick = e => { const c = e.target.closest('[data-card]'); if (c) showCard(c.dataset.card); const m = e.target.closest('[data-metric]'); if (m) { ovView.metric = m.dataset.metric; overview(el, game); } };
  const H = s.history.slice(-26);
  mountLine($('[data-c1]', el), { title: 'Apoio, estabilidade e satisfação (6 meses)', series: [{ name: 'Apoio', data: H.map(h => [h.day, h.support]) }, { name: 'Estabilidade', data: H.map(h => [h.day, h.stability]) }, { name: 'Satisfação', data: H.map(h => [h.day, h.satisfaction]) }], yMin: 0, yMax: 100 });
  mountLine($('[data-c2]', el), { title: 'PIB (6 meses)', series: [{ name: 'PIB', data: H.map(h => [h.day, h.gdp]) }], yFmt: v => num(v, 0) });
}

function issuesPage(el, game) {
  const s = game.s;
  const pend = s.issues.pending;
  el.innerHTML = `<h2>Questões de governo</h2><div class="muted small" style="margin-bottom:10px">Quatro questões chegam por semana como cartões. Cada uma tem prazo; ao vencer, prevalece a opção padrão ou o governo perde legitimidade. No máximo ${6} questões ficam na fila.</div>
    <div data-result></div>
    ${pend.length ? '' : `<div class="panel muted">Nenhuma questão pendente. ${game.nextEvent().label} em breve.</div>`}
    ${pend.map(p => `<div class="panel">${issueBody(game, p, game.getIssue(p.id))}</div>`).join('')}
    <div class="panel"><h3>Decisões recentes</h3><table class="data"><tr><th>Data</th><th>Questão</th><th>Decisão</th></tr>
    ${s.decisions.slice(-15).reverse().map(d => `<tr><td class="small">${fmtDate(d.day)}</td><td>${esc(d.title)}</td><td class="small">${esc(d.text)}</td></tr>`).join('')}</table></div>`;
  el.onclick = e => {
    const b = e.target.closest('[data-issue]');
    if (!b) return;
    const iss = game.getIssue(b.dataset.issue), opt = iss.options[+b.dataset.opt];
    const res = game.answerIssue(b.dataset.issue, +b.dataset.opt);
    rerender();
    const r = $('[data-result]', $('#main'));
    if (r) r.innerHTML = `<div class="panel">${resultHTML(iss, opt, res)}</div>`;
  };
}

const STAT_GROUPS = [
  ['População e sociedade', ['pop', 'popGrowth', 'poverty', 'hunger', 'unemployment', 'inequality', 'health', 'education', 'qol', 'satisfaction', 'support', 'protest', 'migration', 'civil', 'political']],
  ['Economia', ['gdp', 'gdppc', 'growth', 'inflation', 'debtRatio', 'interestRate', 'productivity', 'industry', 'tech', 'reserves', 'energyDep', 'foodDep', 'market']],
  ['Governo', ['stability', 'legitimacy', 'corruption', 'efficiency', 'taxCapacity', 'control', 'elites', 'opposition', 'coupRisk', 'revoRisk']],
  ['Militar', ['troops', 'readiness', 'logistics', 'equipment', 'milIndustry', 'intel', 'defense', 'projection', 'warWeariness']],
  ['Política externa', ['reputation', 'influence']],
];

function statsPage(el, game) {
  const s = game.s, b = s.d.budget;
  const extra = {
    'Economia': `<tr><td>Receita pública</td><td class="num">${money(b.revenue)}</td><td></td><td></td></tr><tr><td>Despesa pública</td><td class="num">${money(b.expense)}</td><td></td><td></td></tr>
      <tr><td>Saldo orçamentário</td><td class="num ${b.balance < 0 ? 'c-bad' : 'c-good'}">${money(b.balance)}</td><td></td><td></td></tr><tr><td>Dívida pública</td><td class="num">${money(s.econ.debt)}</td><td></td><td></td></tr>
      <tr><td>Juros da dívida/ano</td><td class="num">${money(b.exp.interest)}</td><td></td><td></td></tr><tr><td>Exportações/ano</td><td class="num">${money(s.sector.exports)}</td><td></td><td></td></tr><tr><td>Importações/ano</td><td class="num">${money(s.sector.imports)}</td><td></td><td></td></tr>`,
    'Militar': `<tr><td>Gasto militar</td><td class="num">${num(s.budget.spend.military, 1)}% PIB</td><td></td><td></td></tr><tr><td>Poder militar relativo</td><td class="num">${num(militaryPower(s), 1)}</td><td></td><td></td></tr><tr><td>Guerras em andamento</td><td class="num">${s.wars.filter(w => w.active).length}</td><td></td><td></td></tr>`,
    'Política externa': `<tr><td>Acordos comerciais</td><td class="num">${Object.values(s.partners).filter(p => p.trade).length}</td><td></td><td></td></tr><tr><td>Tratados de defesa</td><td class="num">${Object.values(s.partners).filter(p => p.pact).length}</td><td></td><td></td></tr>
      <tr><td>Sanções sofridas</td><td class="num">${Object.values(s.partners).filter(p => p.sanctionsBy).length}</td><td></td><td></td></tr><tr><td>Organizações</td><td class="num">${Object.keys(s.orgs).length}</td><td></td><td></td></tr>
      <tr><td>Relação média</td><td class="num">${num(Object.values(s.partners).reduce((a, p) => a + p.rel, 0) / Object.keys(s.partners).length, 0)}</td><td></td><td></td></tr>`,
  };
  el.innerHTML = `<h2>Estatísticas nacionais de ${esc(s.nation.shortName)}</h2><div class="muted small" style="margin-bottom:8px">Passe o mouse sobre cada indicador para ver a explicação. A última coluna mostra a variação nos últimos 30 dias.</div>
    <div class="grid g2">${STAT_GROUPS.map(([t, keys]) => `<div class="panel"><h3>${t}</h3>${statTable(s, keys, { gdppc: 'gdppc', debtRatio: 'debt' }).replace('</table>', (extra[t] || '') + '</table>')}</div>`).join('')}
    <div class="panel"><h3>Grupos sociais</h3><table class="data">${Object.entries(GROUPS).map(([g, info]) => `<tr><td><span class="stat-name" data-tip="${esc(info.wants)}">${info.name}</span></td><td class="num">${num(s.groups[g], 0)}</td><td style="width:120px">${bar(s.groups[g], s.groups[g] > 60 ? 'good' : s.groups[g] > 35 ? 'warn' : 'bad')}</td><td class="num small muted">peso ${num(s.d.influence[g], 2)}</td></tr>`).join('')}</table></div></div>`;
}

const HIST_CHARTS = [
  ['PIB', [['gdp', 'PIB (bi)']]], ['Inflação e crescimento (%/ano)', [['inflation', 'Inflação'], ['growth', 'Crescimento']]], ['Pobreza e fome (%)', [['poverty', 'Pobreza'], ['hunger', 'Fome']]],
  ['Desemprego (%)', [['unemployment', 'Desemprego']]], ['População (mi)', [['pop', 'População']]], ['Dívida pública (% PIB)', [['debt', 'Dívida']]],
  ['Popularidade', [['support', 'Apoio'], ['legitimacy', 'Legitimidade']]], ['Liberdades', [['civil', 'Direitos civis'], ['political', 'Liberdade política']]],
  ['Capacidade militar', [['military', 'Poder militar']]], ['Corrupção', [['corruption', 'Corrupção']]], ['Relações internacionais', [['rel', 'Relação média'], ['reputation', 'Reputação']]],
  ['Riscos', [['coupRisk', 'Golpe'], ['revoRisk', 'Revolução'], ['protest', 'Protestos']]],
];
const AXES = {
  political: 'Liberdade política', market: 'Modelo econômico (estatal → mercado)', civil: 'Direitos civis', stability: 'Estabilidade', growth: 'Crescimento (%)', inequality: 'Desigualdade',
  milSpend: 'Gasto militar (% PIB)', qol: 'Qualidade de vida', corruption: 'Corrupção', poverty: 'Pobreza (%)', support: 'Apoio', inflation: 'Inflação (%)', gdppc: 'PIB per capita', reputation: 'Reputação', unemployment: 'Desemprego (%)', military: 'Poder militar',
};
const PRESET_PAIRS = [['political', 'market', 'Liberdade × modelo econômico'], ['growth', 'inequality', 'Crescimento × desigualdade'], ['milSpend', 'qol', 'Gasto militar × bem-estar'], ['civil', 'stability', 'Liberdade × estabilidade'], ['corruption', 'growth', 'Corrupção × crescimento']];
const view = { period: 365, x: 'political', y: 'market' };

function analysisPage(el, game) {
  const s = game.s;
  const H = view.period ? s.history.filter(h => h.day >= game.day - view.period) : s.history;
  el.innerHTML = `<h2>Gráficos e plano político-econômico</h2>
    <div class="panel row"><b>Período:</b> <div class="seg">${[[90, '3 meses'], [365, '1 ano'], [1095, '3 anos'], [0, 'Tudo']].map(([v, n]) => `<button data-period="${v}" class="${view.period === v ? 'on' : ''}">${n}</button>`).join('')}</div></div>
    <div class="grid g2"><div class="panel"><h3>Plano cartesiano</h3>
      <div class="row small" style="margin-bottom:6px">Eixo X <select data-ax="x">${Object.entries(AXES).map(([k, n]) => `<option value="${k}" ${k === view.x ? 'selected' : ''}>${n}</option>`).join('')}</select>
      Eixo Y <select data-ax="y">${Object.entries(AXES).map(([k, n]) => `<option value="${k}" ${k === view.y ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="row small" style="margin-bottom:6px">${PRESET_PAIRS.map(([x, y, n]) => `<button class="small" data-pair="${x},${y}">${n}</button>`).join('')}</div>
      <div data-scatter></div><div class="small muted">Ponto vermelho: situação atual. Pontos azuis: trajetória (mais escuros = mais recentes). Quadrados: grandes potências (roxo) e vizinhos (verde-azulado), a partir dos perfis do banco de dados (apenas no plano liberdade × mercado).</div></div>
      <div class="panel"><h3>Leitura do plano</h3><div data-read></div></div></div>
    <div class="grid g3">${HIST_CHARTS.map((_, i) => `<div class="panel"><div data-h="${i}"></div></div>`).join('')}</div>`;
  const pts = H.filter((_, i) => i % Math.max(1, Math.floor(H.length / 120)) === 0 || i === H.length - 1).map(h => ({ x: h[view.x], y: h[view.y], label: fmtDate(h.day) })).filter(p => p.x != null && p.y != null);
  const idx = ['political', 'market', 'civil', 'stability', 'qol', 'corruption', 'support', 'reputation', 'inequality'];
  const range = k => idx.includes(k) ? { min: 0, max: 100, step: 25 } : undefined;
  const pm = view.x === 'political' && view.y === 'market';
  const refs = Object.values(s.world.c).filter(c => !c.dep && game.data.reg[c.id]?.profile).sort((a, b) => aiPower(b) - aiPower(a)).slice(0, 14).map(c => c.id);
  const nbs = [...(s.world._nb || [])].filter(id => game.data.reg[id]?.profile && !refs.includes(id)).slice(0, 8);
  const extra = pm ? [...refs, ...nbs].map(id => { const e = game.data.reg[id]; return { x: e.profile.liberty, y: e.profile.market, label: `${e.name} (${e.profile.regimeName})`, short: (e.iso3 || id).slice(0, 3), color: nbs.includes(id) ? '#16879a' : '#7b4fa6' }; }) : [];
  mountScatter($('[data-scatter]', el), { points: pts, xLabel: AXES[view.x], yLabel: AXES[view.y], xRange: range(view.x), yRange: range(view.y), quadrants: pm ? ['Autoritarismo de mercado', 'Democracia liberal', 'Autoritarismo estatal', 'Socialismo pluralista'] : null, extra });
  const last = H.at(-1) || {}, first = H[0] || {};
  const pmText = pm ? `<p>${last.political < 35 ? 'O regime é <b>autoritário</b>' : last.political < 60 ? 'O regime é <b>híbrido</b>' : 'O sistema é <b>pluralista</b>'} e a economia é ${last.market < 35 ? '<b>predominantemente estatal</b>' : last.market < 65 ? '<b>mista</b>' : '<b>de mercado</b>'}.</p>` : '';
  $('[data-read]', el).innerHTML = `${pmText}<table class="data"><tr><th>Indicador</th><th class="num">Início do período</th><th class="num">Agora</th></tr>
    <tr><td>${AXES[view.x]}</td><td class="num">${num(first[view.x], 1)}</td><td class="num">${num(last[view.x], 1)}</td></tr><tr><td>${AXES[view.y]}</td><td class="num">${num(first[view.y], 1)}</td><td class="num">${num(last[view.y], 1)}</td></tr></table>
    <p class="small muted">As coordenadas vêm dos indicadores registrados diariamente. Liberdade política sobe com imprensa livre, eleições e manifestações; o modelo econômico com privatizações, impostos baixos e livre mercado.</p>`;
  HIST_CHARTS.forEach(([t, ser], i) => mountLine($(`[data-h="${i}"]`, el), { title: t, series: ser.map(([k, n], j) => ({ name: n, color: PALETTE[j], data: H.map(h => [h.day, h[k]]) })) }));
  el.onclick = e => {
    const p = e.target.closest('[data-period]'); if (p) { view.period = +p.dataset.period; analysisPage(el, game); }
    const pr = e.target.closest('[data-pair]'); if (pr) { [view.x, view.y] = pr.dataset.pair.split(','); analysisPage(el, game); }
  };
  el.onchange = e => { if (e.target.dataset.ax) { view[e.target.dataset.ax] = e.target.value; analysisPage(el, game); } };
}

let repIdx = 0;
const REP_ROWS = [['gdp', 'PIB (bi)', 1], ['growth', 'Crescimento (%)', 2], ['inflation', 'Inflação (%)', 2], ['unemployment', 'Desemprego (%)', 1], ['poverty', 'Pobreza (%)', 1], ['hunger', 'Fome (%)', 1], ['debt', 'Dívida (% PIB)', 1], ['treasury', 'Tesouro (bi)', 1], ['support', 'Apoio', 1], ['stability', 'Estabilidade', 1], ['protest', 'Protestos', 1], ['military', 'Poder militar', 1], ['reputation', 'Reputação', 1], ['rel', 'Relação média', 1]];
const GOOD = { gdp: 1, growth: 1, inflation: -1, unemployment: -1, poverty: -1, hunger: -1, debt: -1, treasury: 1, support: 1, stability: 1, protest: -1, military: 1, reputation: 1, rel: 1 };

export function reportHTML(r) {
  const f = r.forecast;
  return `<h3>${esc(r.title)}</h3><div class="grid g2"><div><table class="data"><tr><th>Indicador</th><th class="num">Início</th><th class="num">Fim</th><th class="num">Variação</th></tr>
    ${REP_ROWS.map(([k, n, d]) => { const a = r.from[k], b = r.to[k], dv = b - a; return `<tr><td>${n}</td><td class="num">${num(a, d)}</td><td class="num">${num(b, d)}</td><td class="num ${Math.abs(dv) < 0.05 ? 'muted' : (dv > 0) === (GOOD[k] > 0) ? 'c-good' : 'c-bad'}">${signed(dv, d)}</td></tr>`; }).join('')}</table>
    <p class="small">Receitas ${money(r.budget.revenue)} · Despesas ${money(r.budget.expense)} · Saldo <b class="${r.budget.balance < 0 ? 'c-bad' : 'c-good'}">${money(r.budget.balance)}</b> (anualizados)</p>
    ${r.wars.length ? `<p class="small"><b>Guerras:</b> ${r.wars.map(esc).join('; ')}</p>` : '<p class="small">Sem guerras em andamento.</p>'}
    ${r.sanctions.length ? `<p class="small"><b>Sanções sofridas:</b> ${r.sanctions.map(esc).join(', ')}</p>` : ''}</div>
    <div>${f ? `<b>Previsões para o próximo período</b><table class="data">${[['growth', 'Crescimento', '%'], ['inflation', 'Inflação', '%'], ['unemployment', 'Desemprego', '%'], ['poverty', 'Pobreza', '%'], ['stability', 'Estabilidade', ''], ['coupRisk', 'Risco de golpe', ''], ['revoRisk', 'Risco de revolução', '']].map(([k, n, u]) => `<tr><td>${n}</td><td class="num">≈ ${num(f[k], 1)}${u}</td></tr>`).join('')}</table>` : ''}
    <b>Consequências positivas</b><ul class="small">${r.good.map(x => `<li>${esc(x)}</li>`).join('') || '<li class="muted">Nenhuma registrada.</li>'}</ul>
    <b>Consequências negativas</b><ul class="small">${r.bad.map(x => `<li>${esc(x)}</li>`).join('') || '<li class="muted">Nenhuma registrada.</li>'}</ul></div></div>
    <b>Principais decisões (${r.decisions.length})</b><table class="data">${r.decisions.slice(-20).map(d => `<tr><td class="small">${fmtDate(d.day)}</td><td>${esc(d.title)}</td><td class="small">${esc(d.text)}</td></tr>`).join('') || '<tr><td class="muted">Nenhuma.</td></tr>'}</table>`;
}

function reportsPage(el, game) {
  const s = game.s;
  repIdx = Math.min(repIdx, Math.max(0, s.reports.length - 1));
  el.innerHTML = `<h2>Relatórios e histórico</h2><div class="grid" style="grid-template-columns:240px 1fr">
    <div class="panel"><h3>Relatórios</h3>${s.reports.length ? s.reports.map((r, i) => `<div><a href="#" data-rep="${i}" style="${i === repIdx ? 'font-weight:bold' : ''}">${esc(r.title)}</a></div>`).join('') : '<div class="muted small">O primeiro relatório sai no dia 1º do próximo mês.</div>'}</div>
    <div class="panel">${s.reports[repIdx] ? reportHTML(s.reports[repIdx]) : '<div class="muted">Sem relatórios ainda.</div>'}</div></div>
    <div class="grid g2"><div class="panel"><h3>Registro de eventos</h3><div class="log-list">${s.log.slice(0, 150).map(l => `<div><span class="muted small">${fmtDate(l.day)} ${fmtTime(l.min)}</span> ${esc(l.text)}</div>`).join('')}</div></div>
    <div class="panel"><h3>Histórico de turnos</h3><table class="data"><tr><th>Semana</th><th class="num">Apoio</th><th class="num">Estab.</th><th class="num">Infl.</th><th class="num">Tesouro</th><th>Destaques</th></tr>${s.turns.slice(0, 30).map(t => `<tr><td class="small">${t.week} · ${fmtDate(t.day)}</td><td class="num">${signed(t.to.support - t.from.support, 1)}</td><td class="num">${signed(t.to.stability - t.from.stability, 1)}</td><td class="num">${num(t.to.inflation, 1)}%</td><td class="num">${num(t.to.treasury, 1)}</td><td class="small">${esc(t.news.slice(0, 2).join(' · '))}</td></tr>`).join('')}</table></div>
    <div class="panel"><h3>Histórico de decisões</h3><div class="log-list">${s.decisions.slice().reverse().slice(0, 150).map(d => `<div><span class="muted small">${fmtDate(d.day)}</span> <b>${esc(d.title)}</b>: ${esc(d.text)}</div>`).join('')}</div></div></div>`;
  el.onclick = e => { const a = e.target.closest('[data-rep]'); if (a) { e.preventDefault(); repIdx = +a.dataset.rep; reportsPage(el, game); } };
}

export const PAGES = {
  rights: rightsPage, health: healthPage, tax: taxPage, ethnic: ethnicPage, chief: chiefPage, order: orderPage, propaganda: propagandaPage, regions: regionsPage,
  overview, issues: issuesPage, stats: statsPage, analysis: analysisPage, reports: reportsPage,
  budget: budgetPage, initiatives: initiativesPage, economy: economyHub, laws: lawsPage, urban: urbanPage,
  society: societyPage, politics: politicsPage, research: researchPage, encyclopedia: encyclopediaPage, editor: editorPage, diplomacy: diplomacyPage, military: militaryPage, map: mapPage, options: optionsPage, rankings: rankingsPage,
};
export { toast, go };
