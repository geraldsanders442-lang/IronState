import { $, esc, num, money, signed, bar, tone, statName, toast, modal, modsList } from './dom.js';
import { GROUPS } from '../sim/constants.js';
import { militaryPower } from '../sim/model.js';
import { partnerActions, partnerName, orgStatus, orgDef, blocEligible } from '../sim/diplomacy.js';
import { ENDINGS, VICTORIES } from '../sim/regime.js';
import { fmtDate } from '../sim/util.js';
import { aiPower, PLY, playerNeighbors, relRecord, sharedOrgs, RANK_INFO, provincesOf, relAI } from '../sim/world.js';
import { GOALS, ent, entName, ceasefireChance, oddsAgainst } from '../sim/war.js';
import { MISSIONS, missionProgress } from '../sim/missions.js';
import { fogEstimate } from '../sim/warevents.js';
import { macroPanel, macroClick } from './macro-ui.js';
import { affinity } from '../sim/ideology.js';
import { flagHTML, entityFlag, mountFlagEditor, defaultFlag, historicalFlags } from './flag.js';
import { mountWorld, LEGENDS } from './mapviews.js';

import { leaderHTML, spyHTML, bindDiplomacyPlus, worldTab } from './diplomacy-plus.js';
import { commandHTML, warOpsHTML, mountTheatres, bindMilitaryOps } from './military-ops.js';
import { opsDeskHTML } from './campaign-ui.js';
import { applySettings } from './app.js';
import { startTutorial } from './tutorial.js';
import { barsHTML, mountLine } from './charts.js';
import { rerender, restart, go } from './app.js';
import { statTable } from './pages.js';

const fl = (game, id, w = 18) => id === PLY ? flagHTML(game.s.nation.flag, w) : entityFlag(ent(game.s, game.data, id), w, game.data.reg);
const REL_T = { strategic_ally: 'Aliado estratégico', defense_ally: 'Aliado formal de defesa', close_partner: 'Parceiro próximo', trade_partner: 'Parceiro comercial', friendly: 'Amistoso', pragmatic: 'Cooperação pragmática', neutral: 'Neutro', competitive: 'Competitivo', tension: 'Tensão diplomática', rival: 'Rival', hostile: 'Hostil', belligerent: 'Beligerante' };

export function societyPage(el, game) {
  const s = game.s, st = s.st;
  const good = st.legitimacy > 50 && st.political > 40 && st.stability > 45;
  const predicted = s.achievements.length >= 2 && st.stability > 50 ? (st.political > 45 ? 'democracy' : 'retired') : good ? 'democracy' : st.legitimacy > 35 ? 'handover' : 'exile';
  const totInf = Object.values(s.d.influence).reduce((a, x) => a + x, 0);
  const cast = (s.characters || []).filter(c => c.status === 'active');
  el.innerHTML = `<h2>Sociedade, gabinete e regime</h2>
    <div class="grid g2"><div class="panel"><h3>Grupos sociais</h3><table class="data"><tr><th>Grupo</th><th class="num">Satisfação</th><th></th><th class="num">Influência</th><th>O que querem</th></tr>
      ${Object.entries(GROUPS).map(([g, info]) => { const v = s.groups[g]; return `<tr><td><b>${info.name}</b></td><td class="num">${num(v, 0)}</td><td style="width:90px">${bar(v, v > 60 ? 'good' : v > 35 ? 'warn' : 'bad')}</td><td class="num">${num(s.d.influence[g] / totInf * 100, 0)}%</td><td class="small muted">${esc(info.wants)}</td></tr>`; }).join('')}</table>
      <div class="small" style="margin-top:6px">Apoio ponderado: <b>${num(s.d.support, 1)}</b> · Satisfação popular: <b>${num(s.d.satisfaction, 1)}</b> · Influência das elites: <b>${num(s.d.elites, 0)}</b></div></div>
      <div class="panel"><h3>Gabinete e figuras públicas</h3><div class="grid g2">${cast.map(c => `<div class="char-card row" style="gap:8px;flex-wrap:nowrap;align-items:flex-start"><div style="flex:1"><b>${esc(c.name)}</b><div class="small muted">${esc(c.role)}${c.rival ? ` · rival de ${esc(cast.find(x => x.id === c.rival)?.name || '—')}` : ''}</div>
        <div class="small">Lealdade ${bar(c.loyalty, c.loyalty > 60 ? 'good' : c.loyalty > 30 ? 'warn' : 'bad')} Influência ${bar(c.influence, 'neutral')} Ambição ${bar(c.ambition, c.ambition > 70 ? 'bad' : 'neutral')}</div></div></div>`).join('')}</div>
        <p class="small muted">Personagens leais estabilizam o país; desleais e ambiciosos conspiram, vazam segredos ou renunciam. Eles aconselham nos cartões de questões e fazem exigências.</p></div></div>
    <div class="grid g2"><div class="panel"><h3>Estabilidade do regime</h3>${statTable(s, ['stability', 'legitimacy', 'control', 'opposition', 'protest', 'coupRisk', 'revoRisk', 'warWeariness', 'separatism'])}
      <table class="data"><tr><td><span class="stat-name" data-tip="Leis repressivas e gasto policial: contêm protestos, mas alimentam ressentimento.">Repressão</span></td><td class="num">${num(s.d.repression, 0)}</td></tr><tr><td>Dias de estabilidade crítica</td><td class="num">${s.counters.lowStab}/25</td></tr></table></div>
      <div class="panel"><h3>Missões</h3>${s.missions.active.map(m => { const d = missionProgress(s, m); return `<div class="mission"><b>${esc(d.name)}</b> ${d.long ? '<span class="tag blue">longo prazo</span>' : ''}<div class="small">${esc(d.desc)}</div><div class="small muted">Prazo: ${Math.ceil(d.left / 7)} semanas · recompensa: ${modsList(d.reward)}</div></div>`; }).join('') || '<div class="muted small">Nenhuma missão ativa.</div>'}
        <div class="small muted" style="margin-top:6px">Cumpridas: ${s.missions.done.map(m => esc(MISSIONS[m.id].name)).join(', ') || '—'} · Fracassadas: ${s.missions.failed.map(m => esc(MISSIONS[m.id].name)).join(', ') || '—'}</div>
        <h3 style="margin-top:10px">Metas de governo</h3><table class="data">${Object.entries(VICTORIES).map(([id, v]) => { const a = s.achievements.find(x => x.id === id); return `<tr><td>${a ? '<b class="c-good">★</b>' : '☆'} <b>${v.name}</b><div class="small muted">${v.desc}</div></td></tr>`; }).join('')}</table>
        <h3 style="margin-top:10px">Deixar o poder</h3><p class="small">Desfecho provável hoje: <b>${ENDINGS[predicted].title}</b>. Uma transição democrática exige legitimidade &gt; 50, liberdade política &gt; 40 e estabilidade &gt; 45.</p><button class="danger" data-resign>Encerrar o governo</button></div></div>
    <div class="grid g2"><div class="panel"><h3>Povos e religiões por região</h3><table class="data"><tr><th>Região</th><th>Povo majoritário</th><th>Religião predominante (aprox.)</th><th class="num">População</th><th class="num">Tensão</th></tr>
      ${s.regions.map(r => `<tr><td>${esc(r.name)}</td><td>${esc(r.people || '—')}${r.minority ? ' <span class="tag warn">minoria nacional</span>' : ''}</td><td class="small">${esc(r.faith || '—')}</td><td class="num">${num(r.popShare * 100, 0)}%</td><td class="num">${num(r.unrest, 0)}</td></tr>`).join('')}</table>
      <p class="small muted">Regiões de outra etnia ou fé tendem a ter mais separatismo. Classificação aproximada pela cultura dominante de cada área.</p></div>
    <div class="panel"><h3>Imprensa</h3><table class="data"><tr><th>Veículo</th><th>Linha</th><th class="num">Alcance</th><th></th></tr>
      ${(s.press || []).map(o => `<tr><td><b>${esc(o.name)}</b> <span class="small muted">${esc(o.kind)}</span></td><td class="${o.stance === 'governista' ? 'c-good' : o.stance === 'oposição' ? 'c-bad' : 'muted'}">${esc(o.stance)}</td><td class="num">${num(o.reach, 0)}</td>
        <td>${o.stance === 'fechado' ? '' : `<button class="small" data-press="${o.id}|court">Cortejar</button> <button class="small" data-press="${o.id}|buy">Comprar</button> <button class="small" data-press="${o.id}|sue">Processar</button> <button class="small danger" data-press="${o.id}|close">Fechar</button>`}</td></tr>`).join('')}</table>
      <p class="small muted">Veículos governistas somam legitimidade; os de oposição tiram. A lei de imprensa muda o que é possível.</p></div></div>`;
  el.onclick = e => {
    if (e.target.closest('[data-resign]') && confirm('Encerrar a partida e deixar o poder?')) game.resign();
    const pr = e.target.closest('[data-press]'); if (pr) { const [id, act] = pr.dataset.press.split('|'); if (act === 'close' && !confirm('Fechar este veículo de imprensa?')) return; const r = game.pressAction(id, act); toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender(); }
  };
}

const dipView = { tab: 'countries', sel: null, filter: 'neighbors', q: '' };
export const selectPartner = id => { dipView.sel = id; dipView.tab = 'countries'; };

export function diplomacyPage(el, game) {
  const s = game.s, data = game.data;
  const tabs = [['countries', 'Países'], ['orgs', 'Organizações'], ['blocs', 'Blocos próprios'], ['loans', 'Empréstimos e ajuda'], ['world', 'Mundo e ONU']];
  el.innerHTML = `<h2>Diplomacia</h2><div class="panel row" style="justify-content:space-between"><div><b>Postura externa:</b> <div class="seg">${data.policies.find(p => p.id === 'foreign').levels.map(l => `<button data-foreign="${l.id}" class="${s.policies.foreign === l.id ? 'on' : ''}" data-tip="${esc(l.desc)}">${l.name}</button>`).join('')}</div></div>
    <div class="small">${statName('reputation')} <b>${num(s.st.reputation, 0)}</b> · ${statName('influence')} <b>${num(s.st.influence, 0)}</b> · Acordos comerciais <b>${Object.values(s.partners).filter(p => p.trade).length}</b> · Sanções sofridas <b class="${Object.values(s.partners).some(p => p.sanctionsBy) ? 'c-bad' : ''}">${Object.values(s.partners).filter(p => p.sanctionsBy).length}</b></div></div>
    <div class="tabs">${tabs.map(([k, n]) => `<button data-dtab="${k}" class="${dipView.tab === k ? 'on' : ''}">${n}</button>`).join('')}</div><div data-dbody></div>`;
  const body = $('[data-dbody]', el);
  ({ countries: dipCountries, orgs: dipOrgs, blocs: dipBlocs, loans: dipLoans, world: worldTab })[dipView.tab](body, game);
  el.onclick = e => {
    const t = e.target.closest('[data-dtab]'); if (t) { dipView.tab = t.dataset.dtab; return diplomacyPage(el, game); }
    const f = e.target.closest('[data-foreign]'); if (f) { const r = game.setPolicy('foreign', f.dataset.foreign); toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender(); }
  };
}

function dipCountries(body, game) {
  const s = game.s, data = game.data;
  const nb = playerNeighbors(s, data);
  const all = Object.keys(s.partners).filter(id => s.world.c[id] && !s.world.c[id].dep);
  const filters = { neighbors: id => nb.has(id), powers: id => s.world.c[id].gdp > 800 || aiPower(s.world.c[id]) > 25, allies: id => s.partners[id].pact || s.partners[id].trade || s.world.c[id].puppetOf === PLY, hostile: id => s.partners[id].rel < -30 || s.partners[id].sanctionsBy, all: () => true };
  let list = all.filter(filters[dipView.filter]);
  if (dipView.q) list = all.filter(id => entName(s, data, id).toLowerCase().includes(dipView.q.toLowerCase()));
  list.sort((a, b) => s.partners[b].rel - s.partners[a].rel);
  if (!dipView.sel || !s.partners[dipView.sel]) dipView.sel = list[0] || all[0];
  const id = dipView.sel, p = s.partners[id], c = s.world.c[id], e = ent(s, data, id);
  const rec = s.nation.components.map(cmp => [cmp, relRecord(data, id, cmp.id)]).filter(x => x[1]);
  const claims = s.world.claims.filter(x => x.status === 'active' && ((x.claimant === id && x.holder === PLY) || (x.claimant === PLY && x.holder === id)));
  const theirWars = s.world.wars.filter(w => w.active && (w.a.includes(id) || w.b.includes(id)));
  body.innerHTML = `<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1.15fr)"><div class="panel">
      <div class="row" style="margin-bottom:6px"><input data-q placeholder="Buscar país…" value="${esc(dipView.q)}" style="flex:1"><div class="seg">${[['neighbors', 'Vizinhos'], ['powers', 'Potências'], ['allies', 'Parceiros'], ['hostile', 'Hostis'], ['all', 'Todos']].map(([k, n]) => `<button data-filter="${k}" class="${dipView.filter === k ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      <div style="max-height:560px;overflow-y:auto"><table class="data"><tr><th>País</th><th>Relação</th><th>Situação</th></tr>
      ${list.map(x => { const q = s.partners[x]; const war = s.wars.some(w => w.active && w.enemies.includes(x));
        return `<tr style="cursor:pointer;${x === id ? 'background:#dce8f7' : ''}" data-sel="${x}"><td>${fl(game, x)} ${esc(entName(s, data, x))}</td><td style="width:110px"><span class="${q.rel > 20 ? 'c-good' : q.rel < -20 ? 'c-bad' : ''}">${num(q.rel, 0)}</span> ${bar(q.rel + 100, q.rel > 20 ? 'good' : q.rel < -20 ? 'bad' : 'warn', 200)}</td>
        <td>${[q.trade && '<span class="tag good">comércio</span>', q.pact && '<span class="tag blue">defesa</span>', s.world.c[x]?.puppetOf === PLY && '<span class="tag blue">cliente</span>', q.sanctionsBy && '<span class="tag bad">sanciona</span>', q.sanctionsOn && '<span class="tag warn">sancionado</span>', war && '<span class="tag bad">GUERRA</span>'].filter(Boolean).join('')}</td></tr>`; }).join('')}</table></div></div>
    <div class="panel"><div class="row" style="flex-wrap:nowrap">${fl(game, id, 64)}<div><h3 style="border:none;margin:0">${esc(e.name)}</h3><div class="small muted">${esc(e.profile?.govName || '')} · ${esc(e.profile?.regimeName || '')}${e.recognition ? ' · ' + esc(e.recognition) : ''}</div></div></div>
      <table class="data" style="margin-top:6px"><tr><td>População · PIB</td><td class="num">${num(c.pop, 1)} mi · ${money(c.gdp, 'US$')}</td></tr><tr><td>Poder militar</td><td class="num">${num(aiPower(c), 1)} (você: ${num(militaryPower(s), 1)})${e.profile?.nuclear ? ' · nuclear' : ''}</td></tr>
        <tr><td>Estabilidade</td><td class="num">${num(c.stab, 0)}</td></tr><tr><td>Alinhamento</td><td class="num">${{ W: 'Ocidente', WL: 'pende ao Ocidente', N: 'não alinhado', EL: 'pende a Rússia/China', E: 'Rússia/China' }[e.profile?.align] || '—'}</td></tr>
        <tr><td>Afinidade ideológica com você</td><td class="num">${signed(affinity(s.nation.ideology.axes, e.profile) * 100, 0)}</td></tr><tr><td>Relação · confiança</td><td class="num"><b>${num(p.rel, 1)}</b> · ${num(p.trust, 0)}</td></tr>
        <tr><td>Organizações em comum</td><td class="small">${sharedOrgs(s, data, id, PLY).map(o => esc(orgDef(s, data, o)?.short || o)).join(', ') || '—'}</td></tr>
        ${claims.length ? `<tr><td>Disputas territoriais</td><td class="small c-bad">${claims.map(x => esc(x.just || x.id)).join('<br>')}</td></tr>` : ''}
        ${theirWars.length ? `<tr><td>Em guerra com</td><td class="small c-bad">${theirWars.map(w => esc((w.a.includes(id) ? w.b : w.a).map(z => entName(s, data, z)).join(', '))).join('; ')}</td></tr>` : ''}</table>
      ${rec.length ? `<div class="small" style="margin-top:6px"><b>Histórico (base documentada):</b>${rec.map(([cmp, r]) => `<div>${esc(cmp.name)}: <i>${esc(REL_T[r.t] || r.t)}</i> (${signed(r.s, 0)}) — ${esc(r.n)} <span class="muted">[confiança ${r.c}]</span></div>`).join('')}</div>` : '<div class="small muted" style="margin-top:6px">Sem relação documentada: base neutra ajustada por fronteira, ideologia e alianças.</div>'}
      <h3 style="margin-top:8px">Ações</h3>${partnerActions(s, data, id).map(a => `<div class="row" style="justify-content:space-between;border-bottom:1px dotted #ddd;padding:3px 0"><div><b>${esc(a.name)}</b><div class="small muted">${esc(a.desc)}</div></div>
        <button class="small ${['break', 'sanction', 'cancelTrade', 'cancelPact'].includes(a.key) ? 'danger' : 'primary'}" data-act="${a.key}" ${a.block ? `disabled data-tip="${esc(a.block)}"` : ''}>${a.block ? esc(a.block) : 'Executar'}</button></div>`).join('')}
      ${leaderHTML(game, id)}
      ${covertHTML(game, id)}
      ${spyHTML(game, id)}
      <div style="margin-top:8px"><button class="small" data-go="military">Opções militares →</button> <button class="small" data-mapzoom="${id}">Ver no mapa</button></div></div></div>`;
  body.onclick = ev => {
    const r = ev.target.closest('[data-sel]'); if (r) { dipView.sel = r.dataset.sel; return dipCountries(body, game); }
    const f = ev.target.closest('[data-filter]'); if (f) { dipView.filter = f.dataset.filter; dipView.q = ''; dipView.sel = null; return dipCountries(body, game); }
    const z = ev.target.closest('[data-mapzoom]'); if (z) { mapView.focus = z.dataset.mapzoom; return go('map'); }
    const cv = ev.target.closest('[data-covert]');
    if (cv) { const res = game.covert(id, cv.dataset.covert); toast(esc(res.msg), res.ok ? 'good' : 'warn'); return rerender(); }
    const ic = ev.target.closest('[data-incite]');
    if (ic) { const t = body.querySelector('[data-incitesel]')?.value; if (!t) return; const res = game.incite(id, t); toast(esc(res.msg), res.ok ? 'good' : 'warn'); return rerender(); }
    const a = ev.target.closest('[data-act]');
    if (a) {
      if (['break', 'sanction'].includes(a.dataset.act) && !confirm('Confirmar esta ação hostil?')) return;
      const res = game.partnerAction(id, a.dataset.act); toast(esc(res.msg), res.ok ? 'good' : 'warn'); rerender();
    }
  };
  bindDiplomacyPlus(body, game, id);
  body.onchange = ev => { if (ev.target.matches('[data-q]')) { dipView.q = ev.target.value; dipView.sel = null; dipCountries(body, game); } };
}

function covertHTML(game, id) {
  const s = game.s, data = game.data, o = s.world.covert?.[id], opts = game.covertOptions(id);
  if (!opts.length) return '';
  const it = game.inciteTargets(id);
  const p = s.partners[id];
  return `<h3 style="margin-top:8px">Operações secretas</h3>
    <div class="small muted">Financie aliados ideológicos ou grupos armados. Quanto maior o apoio, maior o risco de ser descoberto (sua inteligência reduz o risco).${o?.found ? ` <b class="c-bad">Já descoberto ${o.found}×.</b>` : ''}</div>
    ${o ? `<table class="data small" style="margin:4px 0"><tr><td style="width:110px">Partido afim</td><td>${bar(o.party, 'blue', 100)}</td><td class="num" style="width:40px">${num(o.party, 0)}</td></tr><tr><td>Milícia</td><td>${bar(o.militia, 'bad', 100)}</td><td class="num">${num(o.militia, 0)}</td></tr></table>` : ''}
    ${opts.map(a => `<div class="row" style="justify-content:space-between;border-bottom:1px dotted #ddd;padding:3px 0"><div><b>${esc(a.name)}</b><div class="small muted">${esc(a.desc)}</div></div>
      <button class="small" data-covert="${a.key}" ${a.block ? `disabled data-tip="${esc(a.block)}"` : ''}>${a.block ? esc(a.block) : 'Executar'}</button></div>`).join('')}
    ${it.length ? `<div class="row" style="justify-content:space-between;padding:3px 0"><div><b>Incitar contra um inimigo comum</b><div class="small muted">Alimenta a hostilidade de ${esc(entName(s, data, id))} contra um vizinho dele; se a relação entre eles despencar, pode haver guerra. Exige relação ≥ 25.</div>
      <select data-incitesel>${it.map(x => `<option value="${x}">${esc(entName(s, data, x))} (relação entre eles: ${num(relAI(s, data, id, x), 0)})</option>`).join('')}</select></div>
      <button class="small danger" data-incite ${p.rel < 25 || (p.cd.incite || 0) > game.day ? 'disabled' : ''}>Incitar</button></div>` : ''}`;
}

function dipOrgs(body, game) {
  const s = game.s, data = game.data;
  body.innerHTML = `<div class="panel"><table class="data"><tr><th>Organização</th><th>Tipo</th><th class="num">Membros</th><th>Efeitos para você</th><th>Requisitos</th><th></th></tr>
    ${data.wOrgs.map(o => { const miss = orgStatus(s, data, o); const mem = s.orgs[o.id]; const n = s.world.orgs[o.id]?.members.length || 0;
      return `<tr><td><b>${esc(o.name)}</b> <span class="muted small">${esc(o.short)}</span><div class="small muted">${esc(o.note || '')}</div></td><td class="small">${{ global: 'Global', trade: 'Econômica', defense: o.kind === 'collective' ? 'Defesa coletiva' : 'Segurança', finance: 'Financeira', political: 'Política', intel: 'Inteligência', forum: 'Fórum' }[o.type]}</td>
        <td class="num"><a href="#" data-orgmap="${o.id}">${n}</a></td><td>${modsList(o.mods)}${o.fee ? `<div class="small muted">Contribuição ${num(o.fee, 2)}% PIB/ano</div>` : ''}</td>
        <td class="small ${miss.length ? 'c-bad' : 'c-good'}">${mem ? '—' : miss.length ? miss.map(esc).join('<br>') : 'Atendidos'}</td>
        <td>${mem ? `<span class="tag good">Membro</span><br><button class="small" data-leave="${o.id}">Sair</button>${o.id === 'IMF' ? '<br><button class="small primary" data-imf>Empréstimo</button>' : ''}` : `<button class="small primary" data-join="${o.id}" ${miss.length ? 'disabled' : ''}>Aderir</button>`}</td></tr>`; }).join('')}</table>
    <p class="small muted">Composição conforme conhecimento do autor em 2026 (itens com revisão pendente estão marcados no arquivo data/world/organizations.json). Clique no número de membros para vê-los no mapa.</p></div>`;
  body.onclick = e => {
    let r;
    const j = e.target.closest('[data-join]'); if (j) r = game.joinOrg(j.dataset.join);
    const l = e.target.closest('[data-leave]'); if (l && confirm('Sair desta organização?')) r = game.leaveOrg(l.dataset.leave);
    if (e.target.closest('[data-imf]')) r = game.imfLoan();
    const m = e.target.closest('[data-orgmap]'); if (m) { e.preventDefault(); mapView.mode = 'org'; mapView.org = m.dataset.orgmap; return go('map'); }
    if (r) { toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender(); }
  };
}

const blocForm = { name: '', short: '', purpose: 'trade', defense: 'none', minRel: 20, region: false, ideology: 'any', democracy: false, policies: [], hq: '', leave: 'free', expel: 'majority', founders: new Set(), emblem: null };
function dipBlocs(body, game) {
  const s = game.s, data = game.data;
  const mine = s.world.blocs;
  blocForm.emblem ||= { ...defaultFlag(), layout: 'solid', colors: ['#1d2b45', '#1d2b45', '#1d2b45'], emblems: [{ type: 'star', color: '#c9a227', x: 0.5, y: 0.5, s: 0.45 }] };
  blocForm.hq ||= s.nation.capital;
  const cand = Object.keys(s.partners).filter(id => s.world.c[id] && !s.world.c[id].dep && s.partners[id].rel > 0).sort((a, b) => s.partners[b].rel - s.partners[a].rel).slice(0, 40);
  body.innerHTML = `${mine.map(b => `<div class="panel"><div class="row" style="justify-content:space-between">${flagHTML(b.emblem, 48)}<div style="flex:1"><h3 style="border:none;margin:0">${esc(b.name)} <span class="muted small">${esc(b.short)}</span></h3>
      <div class="small muted">Fundado em ${fmtDate(b.founded)} · sede: ${esc(b.hq)} · ${{ trade: 'Econômico', defense: 'Defesa', both: 'Econômico e defesa', political: 'Político' }[b.purpose]} · defesa: ${{ none: 'nenhuma', consult: 'consulta', collective: 'coletiva' }[b.defense]} · saída: ${{ free: 'livre', notice: 'com aviso de 1 ano', forbidden: 'proibida' }[b.leave]} · expulsão: ${{ majority: 'por maioria', founder: 'pelo fundador' }[b.expel]}</div></div></div>
      <div class="small">Efeitos atuais: ${modsList(b.mods)}</div><div class="small">Políticas comuns: ${b.policies.map(p => ({ tariff: 'tarifa externa comum', freeMove: 'livre circulação', currency: 'moeda comum', sanctions: 'sanções conjuntas', devFund: 'fundo de desenvolvimento' }[p])).join(', ') || 'nenhuma'}</div>
      <table class="data" style="margin-top:6px"><tr><th>Membro</th><th>Relação</th><th></th></tr>${b.members.map(m => `<tr><td>${fl(game, m)} ${esc(entName(s, data, m))}${m === b.members[0] ? ' <span class="tag">fundador</span>' : ''}</td><td>${m === PLY ? '' : num(s.partners[m]?.rel ?? 0, 0)}</td><td>${m !== PLY ? `<button class="small danger" data-expel="${b.id}|${m}">Expulsar</button>` : ''}</td></tr>`).join('')}</table>
      <div class="row" style="margin-top:6px"><select data-invsel="${b.id}">${cand.filter(id => !b.members.includes(id)).map(id => `<option value="${id}">${esc(entName(s, data, id))} (${num(s.partners[id].rel, 0)})${blocEligible(s, data, b, id) ? ' — ' + esc(blocEligible(s, data, b, id)) : ''}</option>`).join('')}</select><button class="small primary" data-invite="${b.id}">Convidar</button><button class="small" data-dissolve="${b.id}">Dissolver bloco</button></div></div>`).join('')}
    <div class="panel"><h3>Fundar um novo bloco</h3><div class="grid g2"><div class="form-grid">
      <label>Nome</label><input data-bf="name" value="${esc(blocForm.name)}" placeholder="Ex.: Comunidade do Mar Interior"><label>Sigla</label><input data-bf="short" value="${esc(blocForm.short)}">
      <label>Objetivo</label><select data-bf="purpose">${[['trade', 'Econômico (livre comércio)'], ['defense', 'Aliança militar'], ['both', 'Econômico e militar'], ['political', 'Coordenação política']].map(([k, n]) => `<option value="${k}" ${blocForm.purpose === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <label>Defesa</label><select data-bf="defense">${[['none', 'Sem compromisso'], ['consult', 'Consulta mútua'], ['collective', 'Defesa coletiva (ataque a um = a todos)']].map(([k, n]) => `<option value="${k}" ${blocForm.defense === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <label>Relação mínima</label><input type="number" data-bf="minRel" value="${blocForm.minRel}" min="-50" max="80">
      <label>Admissão</label><div class="small"><label><input type="checkbox" data-bf="region" ${blocForm.region ? 'checked' : ''}> só da mesma região</label> <label><input type="checkbox" data-bf="democracy" ${blocForm.democracy ? 'checked' : ''}> só democracias</label> <label><input type="checkbox" data-bf="ideo" ${blocForm.ideology === 'similar' ? 'checked' : ''}> ideologia afim</label></div>
      <label>Políticas comuns</label><div class="small">${[['tariff', 'Tarifa externa comum'], ['freeMove', 'Livre circulação'], ['currency', 'Moeda comum'], ['sanctions', 'Sanções conjuntas'], ['devFund', 'Fundo de desenvolvimento']].map(([k, n]) => `<label><input type="checkbox" data-pol="${k}" ${blocForm.policies.includes(k) ? 'checked' : ''}> ${n}</label>`).join(' ')}</div>
      <label>Sede</label><input data-bf="hq" value="${esc(blocForm.hq)}">
      <label>Saída</label><select data-bf="leave">${[['free', 'Livre'], ['notice', 'Com aviso de 1 ano'], ['forbidden', 'Proibida']].map(([k, n]) => `<option value="${k}" ${blocForm.leave === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <label>Expulsão</label><select data-bf="expel">${[['majority', 'Por maioria'], ['founder', 'Decisão do fundador']].map(([k, n]) => `<option value="${k}" ${blocForm.expel === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div><b class="small">Emblema</b><div data-emblem></div><b class="small">Membros fundadores convidados</b><div class="chiplist" style="max-height:160px">${cand.map(id => `<span class="tag ${blocForm.founders.has(id) ? 'blue' : ''}" data-founder="${id}">${fl(game, id, 14)} ${esc(entName(s, data, id))} ${num(s.partners[id].rel, 0)}</span>`).join('')}</div>
        <p class="small muted">Cada convidado decide conforme relação, afinidade ideológica, alianças atuais e exigências do bloco (moeda comum e defesa coletiva são mais difíceis).</p>
        <button class="primary" data-found>Fundar bloco</button></div></div></div>`;
  mountFlagEditor($('[data-emblem]', body), blocForm.emblem, () => {});
  body.oninput = e => { const k = e.target.dataset.bf; if (!k) return; if (k === 'region' || k === 'democracy') blocForm[k] = e.target.checked; else if (k === 'minRel') blocForm.minRel = +e.target.value; else blocForm[k] = e.target.value; };
  body.onchange = e => {
    if (e.target.dataset.bf === 'ideo' || e.target.matches('[data-bf="ideo"]')) blocForm.ideology = e.target.checked ? 'similar' : 'any';
    const p = e.target.dataset.pol; if (p) { blocForm.policies = e.target.checked ? [...blocForm.policies, p] : blocForm.policies.filter(x => x !== p); }
  };
  body.onclick = e => {
    const f = e.target.closest('[data-founder]'); if (f) { const id = f.dataset.founder; blocForm.founders.has(id) ? blocForm.founders.delete(id) : blocForm.founders.add(id); f.classList.toggle('blue'); return; }
    if (e.target.closest('[data-found]')) {
      if (!blocForm.name.trim()) return toast('Dê um nome ao bloco.', 'warn');
      const r = game.createBloc({ ...blocForm, founders: [...blocForm.founders], req: { minRel: blocForm.minRel, region: blocForm.region, democracy: blocForm.democracy, ideology: blocForm.ideology }, emblem: structuredClone(blocForm.emblem) });
      modal(`<h2>${esc(r.bloc.name)}</h2><p>${esc(r.msg)}</p><ul class="small">${r.results.map(x => `<li class="${x.ok ? 'c-good' : 'muted'}">${esc(x.msg)}</li>`).join('')}</ul><div class="right"><button class="primary" data-close>OK</button></div>`);
      blocForm.name = ''; blocForm.short = ''; blocForm.founders = new Set(); blocForm.emblem = null; rerender(); return;
    }
    const iv = e.target.closest('[data-invite]'); if (iv) { const sel = body.querySelector(`[data-invsel="${iv.dataset.invite}"]`); if (sel?.value) { const r = game.inviteToBloc(iv.dataset.invite, sel.value); toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender(); } }
    const ex = e.target.closest('[data-expel]'); if (ex && confirm('Expulsar este membro?')) { const [b, m] = ex.dataset.expel.split('|'); const r = game.expelFromBloc(b, m); toast(esc(r.msg), 'warn'); rerender(); }
    const ds = e.target.closest('[data-dissolve]'); if (ds && confirm('Dissolver o bloco?')) { const r = game.leaveOrg(ds.dataset.dissolve); toast(esc(r.msg), 'warn'); rerender(); }
  };
}

function dipLoans(body, game) {
  const s = game.s, data = game.data;
  const L = s.world.loans;
  const row = l => `<tr><td>${l.lender === PLY ? 'Você' : l.lender === 'IMF' ? 'FMI' : esc(entName(s, data, l.lender))} → ${l.borrower === PLY ? 'você' : esc(entName(s, data, l.borrower))}</td><td class="small">${{ bilateral: 'Empréstimo', imf: 'FMI', reparations: 'Reparações' }[l.kind] || l.kind}</td>
    <td class="num">${money(l.principal)}</td><td class="num">${num(l.rate, 1)}%</td><td class="num">${l.weeks} sem.</td><td class="num">${money(l.paid)}</td><td class="num">${money(l.remaining ?? l.principal)}</td><td>${{ active: '<span class="tag blue">ativo</span>', repaid: '<span class="tag good">quitado</span>', default: '<span class="tag bad">calote</span>' }[l.status]}${l.missed ? ` (${l.missed} atrasos)` : ''}</td></tr>`;
  body.innerHTML = `<div class="panel"><h3>Empréstimos, reparações e ajuda</h3><p class="small muted">Empréstimos que você recebe aumentam a dívida externa e são pagos semanalmente pelo tesouro; os que você concede rendem juros, mas o devedor pode atrasar ou dar calote conforme sua estabilidade e relação com você. Doações, obras no exterior e apoio a países em guerra estão nas ações de cada país.</p>
    <table class="data"><tr><th>Partes</th><th>Tipo</th><th class="num">Principal</th><th class="num">Juros</th><th class="num">Prazo</th><th class="num">Pago</th><th class="num">Saldo</th><th>Situação</th></tr>${L.map(row).join('') || '<tr><td class="muted" colspan="8">Nenhum empréstimo.</td></tr>'}</table></div>`;
}

export function rankingsPage(el, game) {
  const s = game.s, data = game.data, R = s.world.rankings || {};
  const fmt = (k, v) => k === 'gdp' ? money(v, 'US$') : k === 'pop' ? num(v, 1) + ' mi' : k === 'area' ? num(v / 1000, 0) + ' mil km²' : k === 'gdppc' ? num(v, 0) : num(v, 1);
  const row = (k, id, v, i) => `<tr class="${id === PLY ? 'me' : ''}"><td>${i + 1}</td><td>${id === PLY ? flagHTML(s.nation.flag, 16) + ' ' + esc(s.nation.shortName) : fl(game, id, 16) + ' ' + esc(entName(s, data, id))}</td><td class="num">${fmt(k, v)}</td></tr>`;
  // Modo clássico: top 10 e, se você estiver fora dele, a sua posição logo abaixo (como era antes).
  const rankRows = (r, k) => `<table class="data rank-table">${r.top.map(([id, v], i) => row(k, id, v, i)).join('')}${r.pos > 10 ? `<tr class="me"><td>${r.pos}</td><td>${flagHTML(s.nation.flag, 16)} ${esc(s.nation.shortName)}</td><td class="num">${fmt(k, r.value)}</td></tr>` : ''}</table>`;
  el.innerHTML = `<h2>Rankings mundiais</h2><div class="muted small" style="margin-bottom:8px">Calculados mensalmente a partir dos dados da simulação de todos os países. Indicadores sem dados reais por país (pobreza, desigualdade, dívida e aprovação de países de IA) são estimativas por faixa de renda e região.</div>
    <div class="grid g3">${Object.entries(RANK_INFO).map(([k, info]) => { const r = R[k]; if (!r) return ''; return `<div class="panel"><h3>${esc(info[0])}</h3><div class="small">Você: <b>${r.pos}º</b> de ${r.of}</div>
      ${rankRows(r, k)}<div data-rh="${k}"></div></div>`; }).join('')}</div>`;
  for (const k in RANK_INFO) { const h = s.world.rankHist[k] || [], box = el.querySelector(`[data-rh="${k}"]`); if (box && h.length > 1) mountLine(box, { series: [{ name: 'Posição', data: h.map(([d, p]) => [d, -p]) }], height: 70, yFmt: v => num(-v, 0) + 'º' }); }
}

const RES = { victory: 'Vitória', defeat: 'Derrota', ceasefire: 'Cessar-fogo', concession: 'Paz com concessões', withdrawal: 'Retirada' };
const milView = { goal: 'border' };
export function militaryPage(el, game) {
  const s = game.s, data = game.data;
  const my = militaryPower(s);
  const nb = [...playerNeighbors(s, data)].filter(id => s.world.c[id] && !s.world.c[id].dep).sort((a, b) => aiPower(s.world.c[b]) - aiPower(s.world.c[a]));
  const items = [{ label: s.nation.shortName, value: my, color: '#e7b730' }, ...nb.slice(0, 12).map(id => ({ label: entName(s, data, id), value: aiPower(s.world.c[id]), color: s.partners[id].rel < -30 ? '#c0392b' : s.partners[id].pact ? '#2f6db5' : '#8a93a3' }))];
  const cd = s.counters.milCd || {}, left = k => Math.max(0, (cd[k] || 0) - game.day);
  const wars = s.wars.filter(w => w.active), past = s.wars.filter(w => !w.active);
  el.innerHTML = `<h2>Forças armadas</h2>
    ${wars.map(w => opsDeskHTML(game, w)).join('')}
    <div class="grid g3"><div class="panel"><h3>Capacidades</h3>${statTable(s, ['troops', 'readiness', 'equipment', 'logistics', 'intel', 'milIndustry', 'defense', 'projection', 'warWeariness'])}
      <div class="small">Gasto militar: <b>${num(s.budget.spend.military, 1)}% PIB</b> · Poder militar: <b>${num(my, 1)}</b> · <a href="#" data-go="budget">ajustar orçamento</a> · <a href="#" data-go="initiatives">modernizar</a></div></div>
      <div class="panel"><h3>Equilíbrio regional</h3>${barsHTML(items, { fmt: v => num(v, 1) })}
        <div class="small muted" style="margin-top:6px">Poder = √efetivo × equipamento × prontidão × logística × inteligência. Em guerra contam também terreno, moral (estabilidade e cansaço), indústria, aliados e coalizões.</div>
        <h3 style="margin-top:8px">Ameaças</h3><div class="small">${nb.filter(id => s.partners[id].rel < -20).slice(0, 8).map(id => { const r = aiPower(s.world.c[id]) / Math.max(0.1, my); const cl = s.world.claims.some(c => c.claimant === id && c.holder === PLY && c.status === 'active'); return `<div>${fl(game, id, 14)} ${esc(entName(s, data, id))}: relação ${num(s.partners[id].rel, 0)}, força ${num(r, 2)}×${cl ? ' · <b>reivindica seu território</b>' : ''}${r > 1.15 && cl ? ' — <b class="c-bad">risco de invasão</b>' : ''}</div>`; }).join('') || '<span class="muted">Nenhum vizinho hostil.</span>'}
        Interna: golpe ${num(s.st.coupRisk, 0)}, revolução ${num(s.st.revoRisk, 0)}, separatismo ${num(s.st.separatism, 0)}.</div></div>
      <div class="panel"><h3>Ordens permanentes</h3>
        ${[['mobilize', s.mobilized > 0 ? `Desmobilizar (${s.mobilized} dias)` : 'Mobilização geral', 'Mais tropas e prontidão por 120 dias; tira trabalhadores da economia.'], ['exercise', 'Exercícios militares', `Custo ${money(s.econ.gdp * 0.001)}. +6 prontidão.`], ['fortify', 'Reforçar fronteiras', `Custo ${money(s.econ.gdp * 0.002)}. +7 defesa por um ano.`], ['purge', 'Expurgo de oficiais', 'Reduz o risco de golpe; derruba a prontidão.']].map(([k, n, d]) => `<div class="row" style="justify-content:space-between;border-bottom:1px dotted #ddd;padding:3px 0"><div><b>${n}</b><div class="small muted">${d}</div></div><button class="small primary" data-mil="${k}" ${left(k) ? 'disabled' : ''}>${left(k) ? left(k) + ' dias' : 'Ordenar'}</button></div>`).join('')}
        <h3 style="margin-top:8px">Armas nucleares</h3><div class="small">${s.nation.nuclear ? `<b class="c-good">${s.flags.nukeAmbiguous ? 'Arsenal não declarado (ambiguidade)' : 'Potência nuclear'}</b> — países sem a bomba evitam atacar você.` : s.nuke?.active ? `Programa em andamento: <b>${num(s.nuke.prog, 0)}%</b>${s.nuke.detected ? ' <span class="tag bad">descoberto</span>' : ' <span class="tag">secreto</span>'} · custo 0,12% do PIB por semana` : `<div class="row" style="justify-content:space-between"><span>Programa nuclear secreto (~2 anos, risco de descoberta e sanções).</span><button class="small danger" data-nuke ${game.nukeBlock() ? `disabled data-tip="${esc(game.nukeBlock())}"` : ''}>${game.nukeBlock() ? esc(game.nukeBlock()) : 'Iniciar'}</button></div>`}
          ${Object.values(s.world.c).filter(c => c.nukeProg > 0).length ? `<div class="muted">Programas estrangeiros suspeitos: ${Object.values(s.world.c).filter(c => c.nukeProg > 0).map(c => esc(entName(s, data, c.id))).join(', ')}</div>` : ''}</div>
        <h3 style="margin-top:8px">Declarar guerra</h3><div class="small">Objetivo: <select data-goal>${Object.entries(GOALS).filter(([k]) => k !== 'defend').map(([k, g]) => `<option value="${k}" ${milView.goal === k ? 'selected' : ''}>${g.name}</option>`).join('')}</select><div class="muted">${esc(GOALS[milView.goal].desc)}</div>${milView.goal === 'macro' ? (game.macros().length ? `<div style="margin-top:4px">Macro-região: <select data-macro>${game.macros().map(m => `<option value="${m.id}" ${(milView.macro || game.macros()[0].id) === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div>` : '<div class="c-bad">Crie uma macro-região no Mapa-múndi (aba Macro-regiões).</div>') : ''}</div>
        ${nb.slice(0, 14).map(id => { const b = game.canDeclare(id); return `<div class="row" style="justify-content:space-between;padding:2px 0"><span class="small">${fl(game, id, 14)} ${esc(entName(s, data, id))} ${(() => { const o = oddsAgainst(s, data, id); return o ? `<span class="${o.ratio > 1.3 ? 'c-good' : o.ratio > 0.8 ? 'c-warn' : 'c-bad'}" title="Razão de forças contando aliados do alvo que entrariam na guerra">≈${num(o.ratio, 2)}×${o.allies ? ' (+' + o.allies + ' aliado' + (o.allies > 1 ? 's' : '') + ' dele)' : ''}</span>` : ''; })()}</span>${b && b.startsWith('Sem pretexto') ? `<button class="small" data-pretext="${id}" title="Custa reputação e pode virar escândalo">Forjar pretexto</button> ` : ''}<button class="small danger" data-war="${id}" ${b ? `disabled data-tip="${esc(b)}"` : ''}>${b ? 'Indisponível' : 'Declarar'}</button></div>`; }).join('')}
        <div class="small muted">Guerras exigem pretexto (relação ≤ −10, reivindicação ou incidente). Aliados do alvo podem formar uma coalizão.</div></div></div>
    ${commandHTML(game)}
    ${wars.map(w => { const terms = w.pendingTerms ? game.availableTerms(w.id) : null; const chance0 = ceasefireChance(s, data, w, false), chance1 = ceasefireChance(s, data, w, true);
      return `<div class="panel" style="border-left:4px solid #c0392b"><div class="row" style="justify-content:space-between"><h3 style="border:none;margin:0">${fl(game, w.enemy, 26)} Guerra contra ${esc(entName(s, data, w.enemy))} ${w.aggressor ? '<span class="tag bad">agressor</span>' : '<span class="tag blue">defensiva</span>'} <span class="tag">${esc(GOALS[w.goal].name)}</span></h3>
        <div class="small">Desde ${fmtDate(w.start)} (${game.day - w.start} dias) · baixas ${num(w.cas, 1)} mil · inimigas ${num(w.enemyCas, 1)} mil · custo ${money(w.cost)}</div></div>
        <div class="small">Coalizão inimiga: ${w.enemies.map(x => fl(game, x, 14) + ' ' + esc(entName(s, data, x))).join(', ')} ${w.allies.length ? '· Seus aliados: ' + w.allies.map(x => fl(game, x, 14) + ' ' + esc(entName(s, data, x))).join(', ') : ''}</div>
        <div class="row small" style="justify-content:space-between;margin-top:4px"><span>Derrota</span><span>Placar de guerra <b>${num(w.score, 0)}</b> · força relativa ${(() => { const fe = fogEstimate(s, w, game.day); return `≈${num(fe.mid, 2)}× <span class="muted" title="Estimativa da inteligência (confiabilidade ${fe.conf}%). Mais inteligência, menos incerteza.">(${num(fe.lo, 2)}–${num(fe.hi, 2)})</span>`; })()} · exaustão inimiga ${num(w.enemyExh, 0)}${w.estance === 'surge' ? ' · <span class="tag bad">inimigo na ofensiva</span>' : w.estance === 'entrenched' ? ' · <span class="tag blue">inimigo entrincheirado</span>' : ''}${w.eBlock ? ' · <span class="tag bad">portos bloqueados</span>' : ''}</span><span>Vitória</span></div>
        <div class="front"><i style="left:${(w.score + 100) / 2}%"></i></div>
        <div class="grid g3" style="margin-top:6px"><div class="small"><b>Ofensiva:</b> ${w.target ? `${esc(data.geo.prov[w.target.pid].n)} — ${num(w.target.p, 0)}%` : 'sem alvo'}<br><b>Pressão inimiga:</b> ${w.etarget ? `${esc(data.geo.prov[w.etarget.pid].n)} — ${num(w.etarget.p, 0)}%` : '—'}
          ${w.mySiege ? `<br><b class="c-bad">CAPITAL SITIADA: ${num(w.mySiege.p, 0)}%</b>${s.flags.evacuated ? ' (governo evacuado)' : ''}` : ''}<br>Ocupadas por você: ${w.gained.filter(p => s.world.occ[p] === PLY).length} · perdidas: ${w.lost.filter(p => s.world.occ[p] === w.enemy).length}</div>
          <div><div class="seg">${[['offensive', 'Ofensiva'], ['defensive', 'Defensiva'], ['hold', 'Manter linhas']].map(([k, n]) => `<button data-wa="${w.id}|${k}" class="${w.stance === k ? 'on' : ''}">${n}</button>`).join('')}</div>${game.macros().length ? `<div class="small" style="margin-top:4px">Foco: <select data-wmacro="${w.id}"><option value="">— nenhum —</option>${game.macros().map(m => `<option value="${m.id}" ${w.macro === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div>` : ''}
            <div class="row" style="margin-top:6px"><button class="small" data-wa="${w.id}|reinforce" ${w.reinforce ? 'disabled' : ''}>Reforçar front (${money(s.econ.gdp * 0.002)})</button><button class="small" data-mil="mobilize" ${s.mobilized > 0 ? 'disabled' : ''}>Mobilizar</button>
            <button class="small" data-wa="${w.id}|allies" ${(s.counters.allyAsk || 0) > game.day ? 'disabled' : ''}>Pedir intervenção aliada</button>${s.nation.nuclear ? `<button class="small danger" data-nthreat="${w.id}" ${(w.nukeThreatCd || 0) > game.day ? 'disabled' : ''}>Ameaça nuclear</button>` : ''}${s.world.c[w.enemy]?.nuclear ? '<span class="tag bad">inimigo nuclear</span>' : ''}${w.mySiege || w.etarget?.pid === s.nation.capitalProv ? `<button class="small" data-wa="${w.id}|evacuate" ${s.flags.evacuated ? 'disabled' : ''}>Evacuar governo</button>` : ''}</div></div>
          <div>${terms ? `<b>Termos de paz disponíveis</b>${terms.map(t => `<div class="row" style="justify-content:space-between"><span class="small ${t.ok ? '' : 'muted'}">${esc(t.name)}</span><button class="small primary" data-terms="${w.id}|${t.key}" ${t.ok ? '' : `disabled data-tip="${esc(t.why)}"`}>Impor</button></div>`).join('')}` : `
            <button class="small" data-neg="${w.id}|0">Propor cessar-fogo (${num(chance0 * 100, 0)}%)</button> <button class="small" data-neg="${w.id}|1">Oferecer concessões (${num(chance1 * 100, 0)}%)</button> <button class="small danger" data-wa="${w.id}|withdraw">Retirar-se</button>
            <p class="small muted">Termos de paz ficam disponíveis quando o inimigo pede rendição (placar > 70 com exaustão ou capital ocupada).</p>`}</div></div>
        ${warOpsHTML(game, w)}
        <div class="log-list" style="max-height:140px;margin-top:6px">${w.log.map(l => `<div><span class="muted small">${fmtDate(l.day)}</span> ${esc(l.text)}</div>`).join('')}</div></div>`; }).join('')}
    <div class="panel"><h3>Guerras no mundo</h3>${s.world.wars.filter(w => w.active).map(w => `<div class="small">${w.a.map(x => fl(game, x, 14) + ' ' + esc(entName(s, data, x))).join(', ')} × ${w.b.map(x => fl(game, x, 14) + ' ' + esc(entName(s, data, x))).join(', ')} — frente ${num(w.front || 0, 0)}</div>`).join('') || '<span class="muted small">Nenhuma.</span>'}
      <h3 style="margin-top:8px">Histórico</h3>${past.length ? `<table class="data"><tr><th>Inimigo</th><th>Período</th><th>Resultado</th><th class="num">Baixas</th><th class="num">Custo</th></tr>${past.map(w => `<tr><td>${esc(entName(s, data, w.enemy))}</td><td class="small">${fmtDate(w.start)} – ${fmtDate(w.end)}</td><td>${RES[w.result] || w.result}</td><td class="num">${num(w.cas, 1)} mil</td><td class="num">${money(w.cost)}</td></tr>`).join('')}</table>` : '<div class="muted small">Nenhum conflito.</div>'}</div>`;
  mountTheatres(el, game);
  bindMilitaryOps(el, game);
  el.onchange = e => { if (e.target.matches('[data-goal]')) { milView.goal = e.target.value; militaryPage(el, game); } if (e.target.matches('[data-macro]')) milView.macro = e.target.value; if (e.target.matches('[data-wmacro]')) { const r = game.setWarMacro(e.target.dataset.wmacro, e.target.value); toast(esc(r.msg), 'info'); militaryPage(el, game); } };
  el.onclick = e => {
    let r;
    const m = e.target.closest('[data-mil]'); if (m) r = game.milAction(m.dataset.mil);
    const pt = e.target.closest('[data-pretext]'); if (pt) { const r = game.fabricatePretext(pt.dataset.pretext); toast(esc(r.msg || ''), r.ok ? 'good' : 'warn'); rerender(); return; }
    const w = e.target.closest('[data-war]'); if (w && confirm(`Declarar guerra a ${entName(s, data, w.dataset.war)} com objetivo "${GOALS[milView.goal].name}"?`)) { if (milView.goal === 'macro' && !game.macros().length) { toast('Crie primeiro uma macro-região no Mapa-múndi.', 'warn'); return; } r = game.declareWar(w.dataset.war, milView.goal, milView.goal === 'macro' ? (milView.macro || game.macros()[0].id) : null); }
    const wa = e.target.closest('[data-wa]'); if (wa) { const [id, k] = wa.dataset.wa.split('|'); if (k !== 'withdraw' || confirm('Retirar-se da guerra?')) r = game.warAction(id, k); }
    if (e.target.closest('[data-nuke]') && confirm('Iniciar um programa nuclear secreto? Se descoberto, haverá sanções.')) r = game.startNuke();
    const nt = e.target.closest('[data-nthreat]'); if (nt && confirm('Ameaçar publicamente usar armas nucleares?')) r = game.nuclearThreat(nt.dataset.nthreat);
    const n = e.target.closest('[data-neg]'); if (n) { const [id, c] = n.dataset.neg.split('|'); r = game.negotiate(id, c === '1'); }
    const t = e.target.closest('[data-terms]'); if (t) { const [id, k] = t.dataset.terms.split('|'); game.terms(id, k); r = { ok: true, msg: 'Tratado de paz assinado.' }; }
    if (r) { toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender(); }
  };
}

export const mapView = { mode: 'political', org: 'NATO', focus: null };
export function mapPage(el, game) {
  const s = game.s, data = game.data;
  const orgs = [...data.wOrgs, ...s.world.blocs];
  el.innerHTML = `<h2>Mapa-múndi</h2><div class="panel tight row" style="justify-content:space-between"><div class="seg">${[['political', 'Político'], ['relations', 'Relações'], ['trade', 'Comércio'], ['wars', 'Guerras'], ['regime', 'Regimes'], ['org', 'Organizações'], ['macro', 'Macro-regiões']].map(([k, n]) => `<button data-mode="${k}" class="${mapView.mode === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      ${mapView.mode === 'org' ? `<select data-org>${orgs.map(o => `<option value="${o.id}" ${mapView.org === o.id ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select>` : ''}<span class="small muted">Role para aproximar, arraste para mover, clique em um país.</span></div>
    <div class="grid" style="grid-template-columns:minmax(0,1fr) 290px"><div><div data-map></div><div class="legend">${LEGENDS[mapView.mode].map(([c, n]) => `<span><i class="${c.startsWith('url') ? 'hatch' : ''}" style="${c.startsWith('url') ? '' : 'background:' + c}"></i>${n}</span>`).join('')}<span><i style="background:#2e8b3e;height:2px;border:none"></i>rotas comerciais</span><span><i style="background:#b8342a;height:2px;border:none"></i>frentes de guerra</span></div></div>
    <div class="panel" data-info><h3>Detalhes</h3><p class="small muted">Clique em um país para ver informações e abrir a diplomacia.</p></div></div>`;
  const info = $('[data-info]', el);
  const show = id => {
    if (!id) return;
    info.innerHTML = `<h3>Detalhes</h3><div class="small">${(id === PLY ? '' : '') + (mountedTip(game, id))}</div>${id !== PLY && s.partners[id] ? `<div style="margin-top:8px"><button class="small primary" data-dip="${id}">Abrir na diplomacia</button></div>` : ''}`;
  };
  const m = mountWorld($('[data-map]', el), game, { mode: mapView.mode, org: mapView.org, onClick: (id, pid) => mapView.mode === 'macro' ? macroClick(game, id, pid, () => mapPage(el, game)) : show(id) });
  if (mapView.mode === 'macro') macroPanel(info, game, m, () => mapPage(el, game));
  if (mapView.focus) { const f = mapView.focus; mapView.focus = null; requestAnimationFrame(() => m.zoomToProvinces(provincesOf(s, data, f), 0.6)); show(f); }
  el.onclick = e => {
    const b = e.target.closest('[data-mode]'); if (b) { mapView.mode = b.dataset.mode; return mapPage(el, game); }
    const d = e.target.closest('[data-dip]'); if (d) { selectPartner(d.dataset.dip); go('diplomacy'); }
  };
  el.onchange = e => { if (e.target.matches('[data-org]')) { mapView.org = e.target.value; mapPage(el, game); } };
}
function mountedTip(game, id) {
  const s = game.s, data = game.data;
  if (id === PLY) return `<div class="tip-h">${flagHTML(s.nation.flag, 40)} <b>${esc(s.nation.officialName)}</b></div>${esc(s.nation.ideology.primary)}<br>População ${num(s.econ.pop, 1)} mi · PIB ${money(s.econ.gdp)}`;
  const e = ent(s, data, id), c = s.world.c[id], p = s.partners[id];
  if (!e) return '';
  const orgs = Object.keys(s.world.orgs).filter(o => s.world.orgs[o].members.includes(id)).map(o => data.wOrgById[o]?.short || o);
  return `<div class="tip-h">${entityFlag(e, 40, data.reg)} <b>${esc(e.name)}</b></div>${esc(e.profile?.govName || e.cat)} · ${esc(e.profile?.regimeName || '')}<br>
    ${c ? `População ${num(c.pop, 1)} mi · PIB ${money(c.gdp, 'US$')}<br>PIB per capita ${num(c.gdp * 1e9 / Math.max(1, c.pop * 1e6), 0)} · poder militar ${num(aiPower(c), 1)}<br>Estabilidade ${num(c.stab, 0)}<br>` : ''}
    ${p ? `Relação: <b>${num(p.rel, 0)}</b>${p.trade ? ' · comércio' : ''}${p.pact ? ' · defesa' : ''}${p.sanctionsBy ? ' · sanciona você' : ''}<br>` : ''}Organizações: ${orgs.join(', ') || '—'}<br>Capital: ${esc(e.capital?.name || '—')}`;
}

export function optionsPage(el, game) {
  const s = game.s;
  const saves = game.listSaves();
  const st = s.settings, chk = (k, label, def = false) => `<label style="display:block"><input type="checkbox" data-opt="${k}" ${(st[k] ?? def) ? 'checked' : ''}> ${label}</label>`;
  el.innerHTML = `<h2>Opções</h2><div class="grid g2"><div class="panel"><h3>Turnos</h3>
      ${chk('popupIssues', 'Abrir questões como cartões', true)}
      <label style="display:block">Questões por semana: <select data-optn="cardsPerWeek">${[2, 3, 4, 5].map(n => `<option ${(st.cardsPerWeek ?? 3) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      ${chk('autoMinor', 'O gabinete decide sozinho as questões menores (sem crise e sem desdobramento)')}
      <label style="display:block">Ritmo da economia: <select data-optn="econPace">${[[1, 'Realista'], [1.5, 'Acelerado (padrão)'], [2, 'Rápido']].map(([v, n]) => `<option value="${v}" ${(st.econPace ?? 1.5) == v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label style="display:block"><input type="checkbox" data-chaos ${s.world.chaos ? 'checked' : ''}> 🌪 Mundo caótico (IA expansionista, novos países, alianças regionais)</label>
      <h3 style="margin-top:8px">Imagens e som</h3>
      ${chk('onlineImages', 'Imagens da internet: fotos das notícias (Wikimedia Commons) ', true)}
      ${chk('sfx', 'Efeitos sonoros', true)}${chk('music', 'Trilha ambiente (muda com guerra e crises)')}
      <label style="display:block">Volume: <input type="range" min="0" max="1" step="0.05" value="${st.volume ?? 0.5}" data-optr="volume"></label>
      <h3 style="margin-top:8px">Idioma</h3><label style="display:block">Interface: <select data-opts="lang"><option value="pt" ${(st.lang || 'pt') === 'pt' ? 'selected' : ''}>Português</option><option value="en" ${st.lang === 'en' ? 'selected' : ''}>English (interface; questões em português)</option></select></label>
      <button class="small" data-tutorial style="margin-top:6px">Ver tutorial</button>
      <h3 style="margin-top:8px">Acessibilidade</h3>
      <label style="display:block">Tamanho do texto: <select data-optn="fontScale">${[[0.9, 'Pequeno'], [1, 'Normal'], [1.15, 'Grande'], [1.3, 'Muito grande']].map(([v, n]) => `<option value="${v}" ${(st.fontScale || 1) == v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      ${chk('colorblind', 'Cores para daltonismo (azul/laranja no lugar de verde/vermelho)')}${chk('contrast', 'Alto contraste')}
      <p class="small muted">Cada clique em "Próxima semana" (ou Enter) simula sete dias, mostra as notícias e entrega quatro questões novas. Questões não decididas vencem em duas semanas.</p></div>
    <div class="panel save-list"><h3>Salvamento</h3><p class="small">O autosave grava a cada turno e decisão. Use os espaços manuais para guardar momentos importantes.</p>
      ${saves.map(x => `<div class="row" style="justify-content:space-between"><span><b>${x.slot === 'auto' ? 'Autosave' : 'Espaço ' + x.slot}</b> ${x.empty ? '<span class="muted">vazio</span>' : `${esc(x.name || '?')} · dia ${x.day}${x.ok ? '' : ' <span class="c-bad">(versão antiga)</span>'}${x.savedAt ? ' · ' + new Date(x.savedAt).toLocaleString('pt-BR') : ''}`}</span>
        <span>${s.mode === 'ironman' ? '<span class="small muted">Ironman: sem saves manuais</span>' : `${x.slot !== 'auto' ? `<button class="small" data-saveto="${x.slot}">Salvar aqui</button>` : ''} ${!x.empty && x.ok ? `<button class="small" data-loadfrom="${x.slot}">Carregar</button>` : ''}`}</span></div>`).join('')}
      <div class="row" style="margin-top:8px"><button data-export>Exportar arquivo</button><button data-import>Importar arquivo</button><button class="danger" data-new>Nova partida</button></div></div>
    <div class="panel" style="grid-column:span 2"><h3>Bandeira nacional</h3><div class="row" style="gap:10px;align-items:center"><span class="small">Atual:</span> ${flagHTML(s.nation.flag, 60)}
      <button class="primary small" data-adoptflag>Adotar a bandeira abaixo</button><span class="small muted">Trocar a bandeira é um gesto político: agrada uns, irrita outros.</span></div><div data-flagedit style="margin-top:8px"></div></div>
    <div class="panel" style="grid-column:span 2"><h3>Sobre o conteúdo</h3><p class="small">As questões, eventos e números deste jogo são originais e inspirados no formato narrativo de NationStates, cujos textos são protegidos por direitos autorais e não foram importados. Dados geográficos: Natural Earth (domínio público). Parte dos emblemas de bandeira vem do Wikimedia Commons, cada um com sua licença (domínio público, CC0, CC BY ou CC BY-SA) e autor listados no editor e em docs/emblem-sources.md.</p></div></div>`;
  const f0 = s.nation.flag?.layout ? s.nation.flag : s.nation.flag?.hist && historicalFlags()[s.nation.flag.hist] ? historicalFlags()[s.nation.flag.hist].spec : defaultFlag();
  const draft = structuredClone(f0);
  mountFlagEditor($('[data-flagedit]', el), draft, () => {});
  el.onchange = e => {
    const t = e.target;
    if (t.matches('[data-chaos]')) { s.world.chaos = t.checked; game.save(); return; }
    if (t.dataset.opt) { s.settings[t.dataset.opt] = t.checked; game.save(); applySettings(); }
    if (t.dataset.optn) { s.settings[t.dataset.optn] = +t.value; game.save(); applySettings(); }
    if (t.dataset.opts) { s.settings[t.dataset.opts] = t.value; game.save(); applySettings(); if (t.value === 'pt') location.reload(); }
    if (t.dataset.optr) { s.settings[t.dataset.optr] = +t.value; game.save(); applySettings(); }
  };
  el.onclick = e => {
    const sv = e.target.closest('[data-saveto]'); if (sv) { toast(game.save(sv.dataset.saveto) ? 'Partida salva.' : 'Falha ao salvar (armazenamento cheio?).', 'good'); optionsPage(el, game); }
    const ld = e.target.closest('[data-loadfrom]'); if (ld && confirm('Carregar este save? O progresso não salvo será perdido.')) { game.load(ld.dataset.loadfrom); rerender(); }
    if (e.target.closest('[data-export]')) {
      const blob = new Blob([game.exportSave()], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ironstate-${s.nation.shortName}-dia${game.day}.json`; a.click();
    }
    if (e.target.closest('[data-import]')) {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json';
      inp.onchange = async () => { try { game.importSave(await inp.files[0].text()); rerender(); } catch (err) { toast(esc(err.message || 'Arquivo inválido.'), 'bad'); } };
      inp.click();
    }
    if (e.target.closest('[data-tutorial]')) return startTutorial(game);
    if (e.target.closest('[data-adoptflag]') && confirm('Adotar a nova bandeira nacional?')) { const r = game.setFlag(structuredClone(draft)); toast(esc(r.msg), 'good'); rerender(); return; }
    if (e.target.closest('[data-new]') && confirm('Começar outra partida? O autosave atual será substituído quando a nova começar (os espaços manuais ficam guardados).')) restart();
  };
}
