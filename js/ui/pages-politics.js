// Página "Política": parlamento, gabinete, facções, governante, constituição e opinião pública.
import { $, esc, num, signed, bar, toast, modal, money } from './dom.js';
import { fmtDate } from '../sim/util.js';
import { GROUPS } from '../sim/constants.js';
import { PORTFOLIOS, SYSTEMS, coalitionSeats, electionMode } from '../sim/politics.js';
import { MANDATES, ADVISORS, advisorSalary, trainCost } from '../sim/cabinet.js';
import { GOV_MODES, STANCE_NAMES, LEADER_TRAITS, GOV_WORKS, govRegions, transferAnnual } from '../sim/governors.js';
import { BUILDINGS, buildCost } from '../sim/markets.js';
import { regionalFlagFor } from '../sim/regflags.js';
import { flagHTML } from './flag.js';
const regFlag = (game, r) => { const k = regionalFlagFor(game.data, r.provinces); return k ? flagHTML({ reg: k }, 22) : ''; };

import { mountLine } from './charts.js';
import { rerender } from './app.js';

// Hemiciclo: cadeiras em arcos concêntricos, coloridas por partido.
export function hemicycleSVG(parties, total, w = 360) {
  const rows = Math.max(4, Math.round(Math.sqrt(total / 6))), R = 1, r0 = 0.38;
  const seats = [];
  for (let i = 0; i < rows; i++) { const rad = r0 + (R - r0) * (i + 0.5) / rows; seats.push({ rad, n: 0 }); }
  const circ = seats.reduce((a, x) => a + x.rad, 0);
  let left = total;
  seats.forEach((x, i) => { x.n = i === seats.length - 1 ? left : Math.round(total * x.rad / circ); left -= x.n; });
  const pts = [];
  for (const x of seats) for (let j = 0; j < x.n; j++) { const a = Math.PI * (1 - (j + 0.5) / x.n); pts.push([Math.cos(a) * x.rad, Math.sin(a) * x.rad, a]); }
  pts.sort((a, b) => b[2] - a[2]);
  const colors = []; for (const p of parties) for (let k = 0; k < p.seats; k++) colors.push(p.color);
  const dot = Math.min(0.045, 0.9 / rows / 2.2);
  return `<svg viewBox="-1.05 -1.05 2.1 1.15" width="${w}" style="max-width:100%">${pts.map((p, i) => `<circle cx="${p[0].toFixed(3)}" cy="${(-p[1]).toFixed(3)}" r="${dot}" fill="${colors[i] || '#ccc'}"/>`).join('')}
    <text x="0" y="-0.05" text-anchor="middle" font-size="0.16" font-family="Georgia">${total}</text></svg>`;
}

const view = { tab: 'parliament' };
export function politicsPage(el, game) {
  const s = game.s, P = s.pol;
  if (!P) { el.innerHTML = '<h2>Política</h2><p>Indisponível.</p>'; return; }
  const tabs = [['parliament', 'Parlamento e eleições'], ['cabinet', 'Gabinete'], ['regional', 'Líderes regionais'], ['factions', 'Facções do regime'], ['leader', 'Governante'], ['const', 'Constituição'], ['opinion', 'Opinião pública']];
  el.innerHTML = `<h2>Política</h2>${P.uprising ? `<div class="panel" style="border-left:6px solid #c0392b"><b>${P.uprising.kind === 'coup' ? 'GOLPE EM ANDAMENTO' : 'REVOLUÇÃO NAS RUAS'}</b> — força dos rebeldes ${Math.round(P.uprising.prog)}/100 · ${P.uprising.weeks} semana(s) até o desfecho. ${esc(P.uprising.log[0] || '')}</div>` : ''}
    <div class="tabs">${tabs.map(([k, n]) => `<button data-ptab="${k}" class="${view.tab === k ? 'on' : ''}">${n}</button>`).join('')}</div><div data-pbody></div>`;
  const body = $('[data-pbody]', el);
  ({ parliament, cabinet, regional, factions, leader, const: constitution, opinion })[view.tab](body, game);
  el.onclick = e => { const t = e.target.closest('[data-ptab]'); if (t) { view.tab = t.dataset.ptab; politicsPage(el, game); } };
}

function parliament(body, game) {
  const s = game.s, P = s.pol, mode = electionMode(s), cs = coalitionSeats(s);
  const sorted = [...P.parties].sort((a, b) => b.seats - a.seats);
  body.innerHTML = `<div class="grid g2"><div class="panel"><h3>Parlamento (${P.seatsTotal} cadeiras)</h3>${hemicycleSVG(sorted, P.seatsTotal)}
      <div class="small">${mode === 'none' ? 'Sem eleições: o parlamento apenas referenda os decretos.' : mode === 'controlled' ? 'Eleições controladas: a oposição existe, mas o resultado é decidido antes.' : `Coalizão do governo: <b class="${cs > P.seatsTotal / 2 ? 'c-good' : 'c-bad'}">${cs}</b> de ${P.seatsTotal} (${cs > P.seatsTotal / 2 ? 'maioria' : 'minoria — leis podem ser rejeitadas'}).`}</div></div>
    <div class="panel"><h3>Partidos</h3><table class="data"><tr><th>Partido</th><th>Líder</th><th class="num">Intenção de voto</th><th class="num">Cadeiras</th><th></th></tr>
      ${sorted.map(p => `<tr><td><span style="display:inline-block;width:10px;height:10px;background:${p.color};border-radius:2px"></span> <b>${esc(p.name)}</b>${p.gov ? ' <span class="tag blue">governo</span>' : p.coalition ? ' <span class="tag good">coalizão</span>' : ''}</td><td class="small">${esc(p.leader)}</td><td class="num">${num(p.vote, 1)}%</td><td class="num">${p.seats}</td><td>${!p.gov && mode === 'multiparty' ? `<button class="small" data-coal="${p.id}">${p.coalition ? 'Sair da coalizão' : 'Convidar'}</button>` : ''}</td></tr>`).join('')}</table>
      <div class="small" style="margin-top:6px">${mode === 'none' ? '' : `Próxima eleição: <b>${fmtDate(P.nextElection)}</b> (${Math.max(0, Math.round((P.nextElection - game.day) / 7))} semanas)${P.campaign ? ' · <b class="c-warn">campanha em andamento</b>' : ''}.`}
      ${P.lastResult ? `<br>Última eleição (${fmtDate(P.lastResult.day)}): ${P.lastResult.parties.slice().sort((a, b) => b.seats - a.seats).slice(0, 3).map(p => `${esc(p.name)} ${p.vote}%`).join(' · ')}` : ''}</div>
      <p class="small muted">Mude o tipo de eleição em Leis e direitos. Sem maioria, as leis precisam de votos: o governo negocia ou compra apoio.</p></div></div>`;
  body.onclick = e => {
    const c = e.target.closest('[data-coal]'); if (!c) return;
    const p = P.parties.find(x => x.id === c.dataset.coal);
    if (!p.coalition && !confirm(`Convidar ${p.name} para a coalizão? Eles exigirão espaço no governo.`)) return;
    p.coalition = !p.coalition;
    if (p.coalition) { s.st.efficiency = Math.max(0, s.st.efficiency - 2); s.groups.regional = Math.min(100, s.groups.regional + 2); }
    s.pol.minority = cs <= P.seatsTotal / 2;
    game.save(); rerender();
  };
}

function cabinet(body, game) {
  const s = game.s, P = s.pol;
  const fname = id => P.factions.find(f => f.id === id)?.name || id;
  const training = (kind, key) => P.training?.find(t => t.kind === kind && t.key === key);
  const held = k => (P.hold?.[k] || 0) > game.day;
  const tc = money(trainCost(s));
  body.innerHTML = `<div class="panel"><h3>Gabinete e mandatos</h3>
    <p class="small">Cada ministro pode receber <b>carta branca</b> para executar um plano: ele age sozinho toda semana (ajusta verbas, inicia obras e programas, fecha acordos). Você continua com a palavra final — quando você mesmo muda algo numa pasta, o ministro respeita sua ordem por 12 semanas, mas pode <b>contestar</b> mudanças bruscas, sobretudo se contrariarem a linha do governo.</p>
    <table class="data"><tr><th>Pasta</th><th>Ministro(a)</th><th class="num">Competência</th><th class="num">Lealdade</th><th class="num">Corrupção</th><th>Facção</th><th>Mandato</th><th></th></tr>
    ${Object.entries(PORTFOLIOS).map(([k, pf]) => { const m = P.cabinet[k], md = P.mandates?.[k] || 'off', tr = training('minister', k); return `<tr><td><b>${pf.name}</b></td><td>${esc(m.name)}<div class="small muted">${esc(m.trait)} · desde ${fmtDate(m.since)}</div></td>
      <td class="num">${m.skill} ${bar(m.skill, m.skill > 60 ? 'good' : m.skill > 40 ? 'warn' : 'bad', 50)}${tr ? '<div class="small c-warn">em treinamento</div>' : ''}</td><td class="num">${m.loyalty}</td><td class="num ${m.corrupt > 55 ? 'c-bad' : ''}">${m.corrupt}</td><td class="small">${esc(fname(m.faction))}</td>
      <td><select data-mandate="${k}" title="${esc(MANDATES[k]?.[md]?.[1] || '')}">${Object.entries(MANDATES[k] || {}).map(([mk, mv]) => `<option value="${mk}" ${mk === md ? 'selected' : ''}>${esc(mv[0])}</option>`).join('')}</select>${held(k) ? '<div class="small muted">aguardando sua ordem recente</div>' : ''}</td>
      <td class="row" style="gap:3px;flex-wrap:nowrap"><button class="small" data-train="minister:${k}" ${tr ? 'disabled' : ''} title="8 semanas · ${tc}">Treinar</button><button class="small" data-swap="${k}">Trocar</button></td></tr>`; }).join('')}</table>
    <p class="small muted">Competência aumenta os efeitos da pasta e a chance de o ministro agir bem; ministros corruptos superfaturam obras. Treinar custa ${tc} e leva 8 semanas (+6 a +12 de competência).</p></div>
  <div class="panel"><h3>Conselheiros</h3><div class="grid g2">${Object.entries(ADVISORS).map(([role, A]) => { const a = P.advisors?.[role], tr = training('advisor', role); return `<div class="panel tight"><b>${esc(A.name)}</b><div class="small muted">${esc(A.desc)}</div>
      ${a ? `<div style="margin-top:4px">${esc(a.name)} <span class="small muted">(${esc(a.trait)})</span> · competência <b>${a.skill}</b>${tr ? ' <span class="small c-warn">em treinamento</span>' : ''}<div class="small muted">salário ${money(advisorSalary(s, a))}/ano</div></div>
        <div class="row" style="gap:4px;margin-top:4px"><button class="small" data-train="advisor:${role}" ${tr ? 'disabled' : ''}>Treinar (${tc})</button><button class="small" data-hire="${role}">Substituir</button><button class="small" data-fire="${role}">Dispensar</button></div>`
      : `<div class="small" style="margin-top:4px">Cargo vago.</div><button class="small primary" data-hire="${role}" style="margin-top:4px">Contratar</button>`}</div>`; }).join('')}</div></div>`;
  body.onchange = e => { const sel = e.target.closest('[data-mandate]'); if (!sel) return; const r = game.setMandate(sel.dataset.mandate, sel.value); toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender(); };
  body.onclick = e => {
    const tb = e.target.closest('[data-train]'); if (tb) { const [kind, key] = tb.dataset.train.split(':'); const r = game.train(kind, key); toast(esc(r.msg), r.ok ? 'good' : 'warn'); return rerender(); }
    const fb = e.target.closest('[data-fire]'); if (fb) { const r = game.fireAdvisor(fb.dataset.fire); toast(esc(r.msg), 'info'); return rerender(); }
    const hb = e.target.closest('[data-hire]');
    if (hb) {
      const role = hb.dataset.hire, list = game.advisorCandidates(role);
      const m = modal(`<h2>Contratar: ${esc(ADVISORS[role].name)}</h2><div class="grid g3">${list.map((c, i) => `<div class="panel tight"><b>${esc(c.name)}</b><div class="small">${esc(c.trait)} · competência ${c.skill}</div><div class="small muted">salário ${money(advisorSalary(s, c))}/ano · contratação ${money(advisorSalary(s, c) / 4)}</div><button class="primary small" data-pick="${i}" style="margin-top:6px">Contratar</button></div>`).join('')}</div><div class="right"><button data-close>Cancelar</button></div>`, { wide: true });
      m.el.addEventListener('click', ev => { const p = ev.target.closest('[data-pick]'); if (!p) return; const r = game.hireAdvisor(role, +p.dataset.pick); toast(esc(r.msg), r.ok ? 'good' : 'warn'); m.close(); rerender(); });
      return;
    }
    const b = e.target.closest('[data-swap]'); if (!b) return;
    const port = b.dataset.swap, list = game.candidates(port);
    const m = modal(`<h2>Novo(a) ministro(a): ${PORTFOLIOS[port].name}</h2><div class="grid g3">${list.map((c, i) => `<div class="panel tight"><div class="row" style="gap:8px;flex-wrap:nowrap"><div><b>${esc(c.name)}</b><div class="small">${esc(c.trait)} · ${esc(fname(c.faction))}</div></div></div>
      <div class="small">Competência ${c.skill} · Lealdade ${c.loyalty} · Corrupção ${c.corrupt}</div><button class="primary small" data-pick="${i}" style="margin-top:6px">Nomear</button></div>`).join('')}</div><div class="right"><button data-close>Cancelar</button></div>`, { wide: true });
    m.el.addEventListener('click', ev => { const p = ev.target.closest('[data-pick]'); if (!p) return; const r = game.appoint(port, +p.dataset.pick); toast(esc(r.msg), 'good'); m.close(); rerender(); });
  };
}

function factions(body, game) {
  const P = game.s.pol;
  body.innerHTML = `<div class="panel"><h3>Facções do regime</h3><table class="data"><tr><th>Facção</th><th>Líder</th><th>Poder</th><th>Satisfação</th></tr>
    ${P.factions.map(f => `<tr><td><b>${esc(f.name)}</b></td><td><div class="row" style="gap:6px;flex-wrap:nowrap">${esc(f.leader)}</div></td><td>${bar(f.power, 'neutral', 120)} ${num(f.power, 0)}</td><td>${bar(f.sat, f.sat > 55 ? 'good' : f.sat > 30 ? 'warn' : 'bad', 120)} ${num(f.sat, 0)}</td></tr>`).join('')}</table>
    <p class="small muted">Linha dura quer controle; reformistas, abertura; militares, verbas; tecnocratas, crescimento e eficiência; oligarcas, impostos baixos e mercado; o clero, religião no Estado. Facções fortes e insatisfeitas elevam o risco de golpe e fazem exigências.</p></div>`;
}

function leader(body, game) {
  const s = game.s, L = s.pol.leader;
  body.innerHTML = `<div class="grid g2"><div class="panel"><div class="row" style="gap:12px;flex-wrap:nowrap"><div><h3 style="border:none">${esc(L.name)}</h3>
      <table class="data"><tr><td>Idade</td><td class="num">${Math.floor(L.age)} anos</td></tr><tr><td>Saúde</td><td>${bar(L.health, L.health > 60 ? 'good' : L.health > 30 ? 'warn' : 'bad', 120)} ${num(L.health, 0)}</td></tr>
      <tr><td>Carisma</td><td>${bar(L.charisma, 'neutral', 120)} ${num(L.charisma, 0)}</td></tr><tr><td>Traços</td><td class="small">${L.traits.map(esc).join(', ')}</td></tr>
      <tr><td>Herdeiro(a)</td><td class="small">${esc(L.heir.name)} (${esc(L.heir.rel)})${L.heirReady ? ' <span class="tag good">preparado(a)</span>' : ''}</td></tr><tr><td>Geração</td><td class="num">${L.gen}ª</td></tr></table></div></div>
      <p class="small muted">A saúde piora com a idade; doenças viram crises. Com um herdeiro preparado (ou no modo dinastia), a partida continua quando o governante morre.</p></div>
    <div class="panel"><h3>Linhagem</h3>${(s.dynasty || []).length ? `<table class="data">${s.dynasty.map(x => `<tr><td>${esc(x.name)}</td><td class="small">até ${fmtDate(x.until)}</td><td class="small">${esc(x.how)}</td></tr>`).join('')}</table>` : '<div class="muted small">Primeiro governante desta história.</div>'}</div></div>`;
}

function constitution(body, game) {
  const s = game.s, C = s.pol.const;
  const sel = (k, opts) => `<select data-c="${k}">${opts.map(([v, n]) => `<option value="${v}" ${String(C[k]) === String(v) ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
  body.innerHTML = `<div class="panel"><h3>Constituição</h3><div class="form-grid" style="grid-template-columns:200px 1fr">
      <label>Sistema de governo</label>${sel('system', Object.entries(SYSTEMS).map(([k, v]) => [k, v.name]))}
      <label>Mandato</label>${sel('term', [[4, '4 anos'], [5, '5 anos'], [6, '6 anos'], [99, 'Vitalício']])}
      <label>Reeleições permitidas</label>${sel('limits', [[1, 'Uma'], [2, 'Duas'], [0, 'Sem limite']])}
      <label>Organização do Estado</label>${sel('federal', [['false', 'Unitário'], ['true', 'Federação']])}
      <label>Poder Judiciário</label>${sel('judiciary', [['independent', 'Independente'], ['controlled', 'Subordinado ao governo']])}
      <label>Direitos fundamentais</label>${sel('rights', [['broad', 'Amplos'], ['limited', 'Limitados']])}</div>
      <div class="row" style="margin-top:8px"><button class="primary" data-amend>Propor a nova constituição</button><span class="small muted">Em democracia exige 2/3 do parlamento ou um referendo; em regimes fechados é decretada (perde legitimidade).</span></div></div>`;
  body.onclick = e => {
    if (!e.target.closest('[data-amend]')) return;
    const ch = {};
    for (const x of body.querySelectorAll('[data-c]')) { const v = x.value; ch[x.dataset.c] = v === 'true' ? true : v === 'false' ? false : /^\d+$/.test(v) ? +v : v; }
    if (!confirm('Submeter a nova constituição?')) return;
    const r = game.amendConstitution(ch); toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender();
  };
}

function opinion(body, game) {
  const s = game.s, polls = s.polls || [], last = polls.at(-1), prev = polls.at(-5);
  body.innerHTML = `<div class="grid g2"><div class="panel"><h3>Aprovação do governo</h3><div style="font-size:40px;font-family:Georgia">${last?.approval ?? '—'}%</div><div data-ap></div><div data-vote style="margin-top:8px"></div></div>
    <div class="panel"><h3>Por grupo</h3><table class="data"><tr><th>Grupo</th><th class="num">Hoje</th><th class="num">em 1 mês</th><th></th></tr>${Object.entries(GROUPS).map(([g, info]) => `<tr><td>${info.name}</td><td class="num">${num(last?.groups[g] ?? s.groups[g], 0)}</td><td class="num">${prev ? signed((last.groups[g] - prev.groups[g]), 0) : '—'}</td><td>${bar(s.groups[g], s.groups[g] > 55 ? 'good' : s.groups[g] > 35 ? 'warn' : 'bad', 100)}</td></tr>`).join('')}</table>
      <h3 style="margin-top:8px">Por região</h3><table class="data">${s.regions.map(r => `<tr><td>${esc(r.name)}</td><td class="num">${last?.regions[r.id] ?? '—'}%</td><td>${bar(last?.regions[r.id] ?? 50, (last?.regions[r.id] ?? 50) > 55 ? 'good' : 'warn', 100)}</td></tr>`).join('')}</table></div></div>`;
  mountLine($('[data-ap]', body), { title: 'Aprovação semanal (%)', series: [{ name: 'Aprovação', data: polls.map(p => [p.day, p.approval]) }], yMin: 0, yMax: 100 });
  const hist = (s.pol.history || []);
  if (hist.length) mountLine($('[data-vote]', body), { title: 'Votos do partido do governo por eleição (%)', series: [{ name: 'Governo', data: hist.map(h => [h.day, h.parties.find(p => p.gov)?.vote || 0]) }], yMin: 0, yMax: 100 });
}

export function showElection(game, r) {
  const sorted = [...r.parties].sort((a, b) => b.seats - a.seats), total = sorted.reduce((a, p) => a + p.seats, 0);
  modal(`<h2>Resultado das eleições</h2><div class="small muted">${fmtDate(r.day)} · ${r.mode === 'controlled' ? 'eleições controladas' : 'eleições livres'}</div>
    <div style="text-align:center">${hemicycleSVG(sorted, total, 420)}</div>
    <table class="data">${sorted.map(p => `<tr><td><span style="display:inline-block;width:10px;height:10px;background:${p.color}"></span> ${esc(p.name)}${p.gov ? ' <span class="tag blue">governo</span>' : ''}</td><td class="num">${p.vote}%</td><td class="num">${p.seats} cadeiras</td></tr>`).join('')}</table>
    <div class="right"><button class="primary" data-close>Continuar</button></div>`, { wide: true });
}

// ---------- Líderes regionais ----------
function regional(body, game) {
  const s = game.s, G = game.govInit();
  const regs = govRegions(s);
  const stTag = st => `<span class="tag ${st === 'loyal' ? 'good' : st === 'neutral' ? '' : 'bad'}">${STANCE_NAMES[st]}</span>`;
  const mode = G.mode, cd = Math.max(0, G.changeCd - game.day);
  body.innerHTML = `<div class="panel"><h3>Modelo de governo regional</h3>
    <p class="small">Governadores recebem uma parte do orçamento, fazem obras locais e podem pedir ajuda ao governo central. Sem eles, você controla mais — mas a vida local piora e as regiões se ressentem. Transferências atuais: <b>${money(transferAnnual(s))}/ano</b>.${cd ? ` Você poderá trocar de modelo em ${cd} dias.` : ''}</p>
    <div class="grid g3">${Object.entries(GOV_MODES).map(([k, m]) => `<div class="panel tight" style="${k === mode ? 'outline:2px solid #2e6f40' : ''}"><b>${esc(m.name)}</b>${k === mode ? ' <span class="tag good">atual</span>' : ''}<div class="small muted" style="margin:4px 0">${esc(m.desc)}</div>${k === mode ? '' : `<button class="small primary" data-gmode="${k}" ${cd ? 'disabled' : ''}>Adotar</button>`}</div>`).join('')}</div></div>
  ${!regs.length ? '<div class="panel"><p class="small">Seu país tem uma única região administrativa (a da capital), então não há governadores regionais. Eles surgem quando o território tem várias regiões: ao unir países ou anexar territórios.</p></div>' : mode === 'none' ? '<div class="panel"><p class="small">Administração direta: sem governadores. Controle territorial e eficiência sobem um pouco; elites regionais, obras locais e a infraestrutura das regiões sofrem.</p></div>' : `<div class="panel"><h3>Governadores</h3>
    <table class="data"><tr><th>Região</th><th>Governador(a)</th><th>Postura</th><th class="num">Lealdade</th><th class="num">Popul.</th><th class="num">Corrup.</th><th class="num">Autonomia</th><th class="num">Caixa</th><th></th></tr>
    ${regs.map(r => { const L = G.leaders[r.id]; if (!L) return `<tr><td>${esc(r.name)}</td><td colspan="8" class="muted">Sem governador</td></tr>`;
      return `<tr><td>${regFlag(game, r)} <b>${esc(r.name)}</b><div class="small muted">tensão ${Math.round(r.unrest)} · infra ${Math.round(r.infra)}</div></td>
      <td>${esc(L.name)}<div class="small muted">${esc(LEADER_TRAITS[L.trait]?.name || '')} · ${L.kind === 'elected' ? 'eleito(a)' : L.interim ? 'interino(a)' : 'nomeado(a)'}${L.termEnd ? ' · mandato até ' + fmtDate(L.termEnd) : ''}${L.electionAt ? ' · eleição em ' + fmtDate(L.electionAt) : ''}</div></td>
      <td>${stTag(L.stance)}</td><td class="num">${bar(L.loyalty, L.loyalty > 60 ? 'good' : L.loyalty > 35 ? 'warn' : 'bad', 50)} ${Math.round(L.loyalty)}</td><td class="num">${Math.round(L.popularity)}</td>
      <td class="num ${L.corrupt > 55 ? 'c-bad' : ''}">${Math.round(L.corrupt)}</td>
      <td class="num"><button class="small" data-gaut="${r.id}|-10">−</button> ${Math.round(L.autonomy)} <button class="small" data-gaut="${r.id}|10">+</button></td><td class="num">${money(L.bank)}</td>
      <td class="row" style="gap:3px;flex-wrap:nowrap"><button class="small" data-gwork="${r.id}" title="Financiar uma obra local">Obra</button>${G.mode === 'appointed' || L.interim ? `<button class="small" data-gnew="${r.id}" title="Trocar por um novo nomeado">Trocar</button>` : ''}<button class="small danger" data-grem="${r.id}" title="Destituir">Remover</button></td></tr>`; }).join('')}</table>
    <p class="small muted">Autonomia alta aumenta a verba e a satisfação local, mas reduz seu controle. Líderes eleitos de oposição podem fomentar separatismo; líderes corruptos geram escândalos. Destituir um líder popular, sobretudo eleito, causa protestos proporcionais à liberdade política do país e ao enfraquecimento do seu governo — e pode provocar crises regionais e reações no exterior.</p></div>`}
  <div class="panel"><h3>Histórico</h3>${G.hist.length ? G.hist.map(h => `<div class="small"><span class="muted">${fmtDate(h.day)}</span> ${esc(h.text)}</div>`).join('') : '<p class="small muted">Nenhuma destituição até agora.</p>'}</div>`;
  body.onclick = e => {
    const out = r => { toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender(); };
    const m = e.target.closest('[data-gmode]'); if (m) { if (m.dataset.gmode === 'none' || confirm('Mudar o modelo de governo regional? Só poderá mudar de novo em um ano.')) out(game.setGovMode(m.dataset.gmode)); return; }
    const a = e.target.closest('[data-gaut]'); if (a) { const [rid, d] = a.dataset.gaut.split('|'); return out(game.setGovAutonomy(rid, +d)); }
    const rm = e.target.closest('[data-grem]'); if (rm) { const L = G.leaders[rm.dataset.grem]; if (confirm(`Destituir ${L.name}? ${L.kind === 'elected' ? 'Governadores eleitos têm apoio popular: espere protestos.' : ''}`)) out(game.removeGovernor(rm.dataset.grem)); return; }
    const nw = e.target.closest('[data-gnew]'); if (nw) return out(game.appointGovernor(nw.dataset.gnew));
    const w = e.target.closest('[data-gwork]');
    if (w) {
      const rid = w.dataset.gwork, mo = modal(`<h2>Financiar obra local</h2><div class="grid g3">${GOV_WORKS.filter(t => BUILDINGS[t]).map(t => `<div class="panel tight"><b>${BUILDINGS[t].icon} ${esc(BUILDINGS[t].name)}</b><div class="small muted">${money(buildCost(s, t))}</div><button class="small primary" data-gb="${t}" style="margin-top:4px">Financiar</button></div>`).join('')}</div><div class="right"><button data-close>Fechar</button></div>`, { wide: true });
      mo.el.addEventListener('click', ev => { const b = ev.target.closest('[data-gb]'); if (!b) return; const r = game.fundGovWork(rid, b.dataset.gb); toast(esc(r.msg), r.ok ? 'good' : 'warn'); if (r.ok) { mo.close(); rerender(); } });
    }
  };
}
