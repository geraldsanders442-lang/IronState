import { $, esc, num, money, ctx, initTips, toast, modal, ICONS, tone, signed, announce } from './dom.js';
import { installA11y } from './a11y.js';
import { Game, prepareData } from '../sim/game.js';
import { fmtDate } from '../sim/util.js';
import { debtRatio } from '../sim/model.js';
import { mountSetup } from './setup.js';
import { flagHTML as flagSVG, setFlagData, addFlagBodies, onFlagsReady } from './flag.js';
import { resetMaps, mountNation } from './mapviews.js';
import { PAGES, NAV } from './pages.js';
import { showVictory, showTerms, showGameOver } from './pages-end.js';
import { openIssueCard, deltaChips } from './cards.js';
import { showNewspaper } from './newspaper.js';
import { showElection } from './pages-politics.js';
import { setOnlineImages } from './media.js';
import { sfx, setAudio, startMusic, musicMood } from './audio.js';
import { startTutorial } from './tutorial.js';
import { loadMods } from './pages-extra.js';
import { setLang } from './i18n.js';
import { ascentHub } from './ascent-ui.js';
import { warStanding } from '../sim/campaign.js';
import { mountObservatory } from './observatory.js';
let obsInst = null;

const DATA_FILES = ['initiatives', 'policies', 'identity', 'geo/countries.geo', 'geo/provinces.geo', 'geo/edges.geo', 'world/registry', 'world/relations', 'world/organizations', 'world/claims', 'world/scenarios', 'flags/current', 'flags/historical', 'world/world_scenarios', 'flags/regional', 'health', 'minorities'];

let game, page = 'overview', cardOpen = false, batching = false, notes = [], pendingTerms = false, pendingElection = null;

async function loadData() {
  const pre = globalThis.__IRON_DATA__;
  const get = f => pre?.[f] ? Promise.resolve(pre[f]) : fetch('data/' + f + '.json').then(r => { if (!r.ok) throw new Error(f); return r.json(); });
  const content = await get('content');
  const [issueSets, eventSets] = await Promise.all([Promise.all(content.issues.map(get)), Promise.all(content.events.map(get))]);
  const mods = loadMods().issues || [];
  const issues = [...issueSets.flat(), ...mods.map(x => ({ w: 1, ...x }))], events = eventSets.flat();
  const [initiatives, policies, identity, gc, gp, ge, registry, relations, orgs, claims, scenarios, flagsCur, flagsHist, worldScen, flagsReg, health, minorities] = await Promise.all(DATA_FILES.map(get));
  setFlagData(flagsCur, flagsHist, null, flagsReg);
  // Corpos das bandeiras regionais e emblemas do Commons (pesados): chegam depois da primeira tela, sem travar a abertura.
  const lazy = () => Promise.all([get('flags/regional.svg'), get('flags/emblems-commons')]).then(([bodies, emb]) => addFlagBodies(bodies, emb)).catch(() => {});
  (globalThis.requestIdleCallback || (f => setTimeout(f, 300)))(lazy);
  return prepareData({ issues, events, initiatives, policies, identity, geo: { countries: gc, provinces: gp, edges: ge }, registry, relations, orgs, claims, scenarios, worldScenarios: worldScen, regionalFlags: flagsReg, health, minorities });
}

function showSetup() {
  $('#app').hidden = true;
  obsInst?.destroy(); obsInst = null; const tk = $('#ticker'); if (tk) tk.style.display = '';
  const el = $('#setup'); el.hidden = false;
  mountSetup(el, {
    game,
    onStart: state => { game.s = state; game.useWorld(state.world?.wscn || null); game.save(); resetMaps(); startGame(); },
    onContinue: slot => { if (game.load(slot)) { resetMaps(); startGame(); } else toast('Não foi possível carregar este save.', 'bad'); },
  });
}

export function applySettings() {
  const st = game?.s?.settings || {};
  setOnlineImages(st.onlineImages !== false);
  setAudio({ sfx: st.sfx !== false, music: !!st.music, vol: st.volume ?? 0.5 });
  document.documentElement.style.fontSize = 13 * (st.fontScale || 1) + 'px';
  document.body.classList.toggle('cb-safe', !!st.colorblind);
  document.body.classList.toggle('hi-contrast', !!st.contrast);
  setLang(st.lang || 'pt');
  updateMusic();
}
function updateMusic() {
  const s = game?.s; if (!s?.settings?.music) return;
  const mood = s.wars.some(w => w.active) || s.nukeCrisis?.weeks > 0 ? 'war' : s.st.stability < 40 || s.st.revoRisk > 50 ? 'tense' : 'calm';
  if (musicMood() !== mood) startMusic(mood);
}

function startGame() {
  $('#setup').hidden = true; $('#setup').innerHTML = '';
  // Observatório (modo espectador): interface própria, sem o painel de governo.
  // Mesmo layout do modo clássico (barra, ticker, menu e páginas), com páginas próprias do Observatório.
  if (game.s.spectator) {
    $('#app').hidden = false; applySettings();
    obsInst?.destroy();
    obsInst = mountObservatory(game, { onExit: () => { obsInst = null; restart(); } });
    return;
  }
  $('#app').hidden = false;
  applySettings();
  page = 'overview';
  renderAll();
  if (!game.s.settings.tutorialSeen && !game.s.over) setTimeout(() => startTutorial(game), 800);
  if (game.s.over) showGameOver(game, restart);
}

export function restart() { game.newCampaign(); showSetup(); }
const pageName = id => { for (const [, items] of NAV) { const f = items.find(x => x[0] === id); if (f) return f[1]; } return id; };
export function go(p) { page = p; renderPage(); window.scrollTo(0, 0); const mn = $('#main'); if (mn) { mn.setAttribute('aria-label', pageName(p)); mn.focus?.({ preventScroll: true }); } announce(`Página: ${pageName(p)}.`); }
onFlagsReady(() => { try { if (game?.s && !$('#app').hidden) rerender(); } catch {} });
export function rerender() { renderTop(); renderNav(); renderPage(); }

function renderAll() { renderTop(); renderNav(); renderPage(); renderTicker(); }

function alerts(s) {
  const a = [];
  if (s.modeCfg?.weeks) a.push([`${s.modeCfg.name || 'Temporada'}: semana ${game.week + 1}/${s.modeCfg.weeks}${s.modeCfg.goalText ? ' · meta: ' + s.modeCfg.goalText : ''}`, 'warn']);
  if (s.ascent) a.push([`OPOSIÇÃO: apoio ${Math.round(s.ascent.support)} · força ${Math.round(s.ascent.force)}`, 'warn']);
  if (s.mode === 'ironman') a.push(['IRONMAN', 'warn']);
  if (s.nukeCrisis && (s.nukeCrisis.weeks > 0 || s.nukeCrisis.roundDay === game.day)) a.push([`CRISE NUCLEAR ${Math.max(1, s.nukeCrisis.round || 1)}/3`, '']);
  if (s.flags.needCapital) a.push(['SEM CAPITAL', '']);
  if (s.wars.some(w => w.active)) { const w0 = s.wars.find(w => w.active), sd = warStanding(s, game.data, w0); a.push([`GUERRA · ${sd.verdict.toLowerCase()}`, sd.tone === 'good' ? '' : sd.tone === 'warn' ? 'warn' : 'bad']); }
  if (s.st.inflation > 15) a.push(['INFLAÇÃO', '']); else if (s.st.inflation > 8) a.push(['Inflação', 'warn']);
  if (s.st.hunger > 10) a.push(['FOME', '']);
  if (s.st.revoRisk > 55) a.push(['REVOLTA', '']);
  if (s.st.coupRisk > 50) a.push(['GOLPE', '']);
  if (s.st.protest > 55) a.push(['Protestos', 'warn']);
  if (s.d.printing) a.push(['Emissão de moeda', 'warn']);
  if (s.d.sanctions > 0) a.push(['Sanções', 'warn']);
  if (s.issues.pending.some(p => game.getIssue(p.id).crisis)) a.push(['CRISE', '']);
  return a;
}

function renderTop() {
  if (!game?.s || $('#app').hidden) return;
  const s = game.s, bal = s.d.budget.balance;
  const col = { good: '#9be3a5', warn: '#ffe08a', bad: '#ff9b8f' };
  $('#topbar').innerHTML = `
    <button class="hamb" data-hamb aria-label="Menu">☰</button><div class="nation">${flagSVG(s.nation.flag, 42)}<div><div class="nm">${esc(s.nation.shortName)}</div><div class="sub">${esc(s.nation.ideology?.primary || s.nation.regime)} · ${esc(s.nation.leader)}</div></div></div>
    <div class="clock"><div style="min-width:150px"><div class="date">${fmtDate(game.day, true)}</div><div class="next">Semana ${game.week + 1}${s.issues.pending.length ? ` · ${s.issues.pending.length} questão(ões) aberta(s)` : ''}</div></div>
      <button data-endturn class="endturn" data-tip="Processa a semana e traz as notícias e questões da próxima (Enter)">Próxima semana ▶</button></div>
    <div class="alerts">${alerts(s).map(([t, k]) => `<span class="alert-chip ${k}">${t}</span>`).join('')}${s.issues.pending.length ? `<span class="alert-chip warn" data-open-issue style="cursor:pointer">${s.issues.pending.length} questão(ões)</span>` : ''}</div>
    <div class="kpis" data-kpis>
      <div class="kpi" data-tip="Dinheiro disponível para iniciativas e emergências.">Tesouro<b>${money(s.econ.treasury)}</b></div>
      <div class="kpi" data-tip="Saldo orçamentário anual (receitas − despesas).">Saldo/ano<b style="color:${bal < 0 ? col.bad : col.good}">${money(bal)}</b></div>
      <div class="kpi" data-tip="Dívida pública em relação ao PIB.">Dívida<b>${num(debtRatio(s), 0)}% PIB</b></div>
      <div class="kpi" data-tip="Estabilidade política (0-100).">Estabilidade<b style="color:${col[tone('stability', s.st.stability)]}">${num(s.st.stability, 0)}</b></div>
      <div class="kpi" data-tip="Apoio ponderado dos grupos sociais.">Apoio<b>${num(s.d.support, 0)}</b></div>
    </div><div class="float-fb" data-float></div>`;
}

export function renderTicker() {
  const t = $('#ticker');
  if (!game?.s) return;
  const items = game.s.log.slice(0, 14).map(l => `<span class="tk-${l.type}">◆ ${esc(l.text)}</span>`).join('');
  t.innerHTML = `<b>MANCHETES</b><div class="tk-wrap"><div class="tk-run" style="animation-duration:${Math.max(30, game.s.log.slice(0, 14).reduce((a, l) => a + l.text.length, 0) / 7)}s">${items}${items}</div></div>`;
}

function renderNav() {
  const s = game.s;
  let html = '';
  for (const [sec, items] of NAV) {
    html += `<div class="sec">${sec}</div>`;
    for (const [id, name] of items) {
      const lock = s.ascent && ASCENT_LOCKED.has(id) ? ' 🔒' : '';
      const badge = id === 'issues' && s.issues.pending.length ? `<span class="badge">${s.issues.pending.length}</span>`
        : id === 'military' && s.wars.some(w => w.active) ? '<span class="badge">!</span>' : '';
      html += `<a href="#" data-go="${id}" class="${id === page ? 'active' : ''}"><svg viewBox="0 0 20 20">${ICONS[id] || ICONS.reports}</svg>${name}${lock}${badge}</a>`;
    }
  }
  $('#sidebar').innerHTML = html;
  $('#sidebar').classList.remove('open'); $('#nav-backdrop')?.classList.remove('open');
  // Barra inferior (celular): atalhos principais + menu completo
  const quick = [['overview', 'Início'], ['issues', 'Questões'], ['budget', 'Orçamento'], ['map', 'Mapa']];
  const bn = $('#bottomnav');
  if (bn) bn.innerHTML = quick.map(([id, nm]) => `<button data-go="${id}" class="${id === page ? 'active' : ''}"><svg viewBox="0 0 20 20">${ICONS[id] || ICONS.reports}</svg>${nm}${id === 'issues' && s.issues.pending.length ? `<span class="badge">${s.issues.pending.length}</span>` : ''}</button>`).join('') + '<button data-hamb aria-label="Menu"><svg viewBox="0 0 20 20"><path d="M3 5h14M3 10h14M3 15h14"/></svg>Menu</button>';
}

// Na Ascensão ao poder o jogador ainda é oposição: as páginas de governo ficam trancadas até ele assumir.
const ASCENT_LOCKED = new Set(['budget', 'initiatives', 'economy', 'laws', 'rights', 'urban', 'research', 'politics', 'society', 'diplomacy', 'military', 'propaganda', 'order', 'regions', 'chief', 'health', 'tax', 'ethnic']);
function ascentLocked(main) { return ascentHub(main, game); }
function ascentLockedOld(main) {
  const A = game.s.ascent, n = game.s.nation;
  const meter = (label, v, need) => `<div class="row" style="gap:8px;margin:6px 0"><span style="width:130px">${label}</span><div style="flex:1;max-width:320px;height:12px;background:var(--line,#ddd);border-radius:6px;position:relative;overflow:hidden"><div style="width:${Math.round(v)}%;height:100%;background:${v >= need ? '#2e8b57' : '#c9a227'}"></div><div style="position:absolute;left:${need}%;top:0;bottom:0;border-left:2px dashed #333"></div></div><b style="width:40px;text-align:right">${Math.round(v)}</b><span class="small muted">meta ${need}</span></div>`;
  main.innerHTML = `<h2>🔒 Você ainda não governa</h2>
    <div class="panel" style="border-left:6px solid #c9a227"><p>Você lidera o principal movimento de oposição de <b>${esc(n.shortName)}</b>. Orçamento, leis, economia, diplomacia, gabinete e forças armadas estão nas mãos do <b>governo atual</b> — você só poderá mexer neles depois de chegar ao poder.</p>
    <p class="small">Cada semana o movimento recebe uma carta de ações (comícios, doadores, sindicatos, oficiais, milícias…). Quanto pior o governo for avaliado, mais o seu apoio cresce. Você tem até a semana 26; depois disso o movimento se desfaz e você vai para o exílio.</p>
    <h3>O movimento — semana ${A.week} de 26</h3>
    ${meter('Apoio popular', A.support, 45)}${meter('Força', A.force, 45)}${meter('Dinheiro', A.money, 0)}
    <p class="small">Alianças: ${A.allies}. <b>Eleição</b>: apoio ≥ 45 · <b>Golpe</b>: força ≥ 45 · <b>Revolução</b>: apoio ≥ 35 e força ≥ 30.</p>
    <button class="primary" data-goissues>Abrir a carta do movimento</button></div>`;
  main.querySelector('[data-goissues]').onclick = () => go('issues');
}

function renderPage() {
  renderNav();
  const main = $('#main');
  const fn = PAGES[page] || PAGES.overview;
  main.innerHTML = '';
  main.onclick = main.onchange = main.oninput = null;
  if (game.s.ascent && (ASCENT_LOCKED.has(page) || page === 'overview')) return ascentLocked(main);
  fn(main, game);
}

function interacting() {
  const a = document.activeElement;
  return a && a.closest?.('#main') && ['INPUT', 'SELECT', 'TEXTAREA'].includes(a.tagName);
}

// A capital foi destruída: o jogador aponta no mapa nacional a nova sede do governo.
export function pickCapital() {
  const s = game.s;
  if (!s.flags.needCapital) return;
  let chosen = s.nation.capitalProv && game.canBeCapital(s.nation.capitalProv) ? s.nation.capitalProv : null;
  const m = modal(`<h2>☢ Escolha a nova capital</h2><p class="small">${esc(s.nation.oldCapital || 'A capital')} foi destruída. Clique no mapa em uma província sua — não ocupada nem atingida — para instalar o governo. A estrela mostra a sede provisória.</p>
    <div data-capmap></div><div class="row" style="justify-content:space-between;margin-top:8px"><span class="small" data-capsel></span><button class="primary" data-capok>Confirmar nova capital</button></div>`, { wide: true, onClose: () => { if (game.s.flags.needCapital) setTimeout(pickCapital, 60); } });
  const label = () => { m.el.querySelector('[data-capsel]').innerHTML = chosen ? `Nova capital: <b>${esc(game.data.geo.prov[chosen].n)}</b> · população est. ${num((game.data.geo.prov[chosen].pop || 0) / 1e6, 2)} mi` : '<span class="c-bad">Nenhuma província escolhida.</span>'; };
  const map = mountNation(m.el.querySelector('[data-capmap]'), game, 'region', pid => {
    if (!game.canBeCapital(pid)) return toast('Escolha uma província sua, não ocupada e não atingida pela bomba.', 'warn');
    chosen = pid; s.nation.capitalProv = pid; label();
    const c = game.data.geo.prov[pid].c;
    map.setOverlay(`<g pointer-events="none" data-sx="${c[0]}" data-sy="${c[1]}"><path d="M0 -9L2.6 -2.8 9.5 -2.8 4 1.4 6 8 0 4 -6 8 -4 1.4 -9.5 -2.8 -2.6 -2.8Z" fill="#c8102e" stroke="#fff" stroke-width="1.5"/></g>`); map.updateScaled();
  });
  requestAnimationFrame(() => { map.zoomToProvinces(s.regions.flatMap(r => r.provinces), 0.08); map.updateScaled(); });
  label();
  m.el.querySelector('[data-capok]').onclick = ev => {
    ev.stopPropagation();
    if (!chosen) return;
    const r = game.setCapital(chosen);
    toast(esc(r.msg), r.ok ? 'good' : 'warn');
    if (r.ok) { m.close(); rerender(); }
  };
}

export function showCard(id) {
  if (cardOpen) return;
  const pend = game.s.issues.pending;
  const target = id || pend[pend.length - 1]?.id;
  if (!target) return;
  cardOpen = true;
  openIssueCard(game, target, { onDone: () => { cardOpen = false; rerender(); renderTicker(); } });
}

export function floatFeedback(delta) {
  const f = $('[data-float]');
  if (!f || !delta.length) return;
  f.innerHTML = deltaChips(delta.filter(d => d[2] !== 'trend').slice(0, 5));
  f.classList.remove('show'); void f.offsetWidth; f.classList.add('show');
}

// Fecha a semana: simula, mostra as notícias e depois abre as questões da semana nova.
function nextWeek() {
  if (game.s?.spectator) return;
  if (!$('#modal').hidden || game.s.over) return;
  if (game.s.flags.needCapital) return pickCapital();
  batching = true; notes = []; pendingTerms = false;
  const t = game.nextWeek();
  batching = false;
  rerender(); renderTicker();
  if (!t || game.s.over) return;
  announce(`Nova semana: ${fmtDate(game.day)}. ${game.s.issues.pending.length} questões pendentes. ${game.s.log[0]?.text || ''}`);
  const nk = game.s.nukeCrisis, fresh = nk?.round === 1 && nk.roundDay === game.day;
  updateMusic();
  const extraTop = `${fresh ? `<div class="panel tight" style="background:#2b0b07;color:#ffd7c2;border-left:6px solid #ff5a1f"><b style="font-size:18px">☢ ATAQUE NUCLEAR CONTRA ${esc(nk.city.toUpperCase())}</b><div class="small">${esc(game.data.reg[nk.by]?.name || '')} detonou uma ogiva sobre ${esc(nk.city)} (${esc(nk.regionName)}). Mortos estimados: ${nk.dead >= 1 ? num(nk.dead, 1) + ' milhão(ões)' : num(nk.dead * 1000, 0) + ' mil'}.${nk.capital ? ` A capital foi destruída.${game.s.nukeVictims?.length ? ' Mortos no governo: ' + esc(game.s.nukeVictims.join(', ')) + '.' : ''}` : ''} Nas próximas 3 semanas, o país só tratará da catástrofe.</div></div>` : nk?.roundDay === game.day ? `<div class="panel tight" style="border-left:6px solid #ff5a1f"><b>☢ Crise nuclear — semana ${nk.round} de 3.</b> <span class="small">As demais pautas estão suspensas.</span></div>` : ''}`;
  // Em guerra, o jornal semanal vira um resumo curto: o foco fica na mesa de operações.
  if (game.s.wars.some(w => w.active) && !fresh && !pendingElection && !pendingTerms && !game.s.flags.needCapital && !game.s.nukeCrisis?.weeks && game.s.settings.warNewspaper !== true) {
    const lines = game.s.wars.filter(w => w.active).flatMap(w => w.log.filter(l => l.day > game.day - 7).slice(0, 3).map(l => l.text));
    toast(`<b>Semana ${game.week}</b>${lines.length ? '<br>' + lines.map(esc).join('<br>') : '<br>Sem mudanças relevantes nas frentes.'}`, 'info', () => go('military'));
    const nxt = game.s.issues.pending[0]; if (nxt) setTimeout(() => showCard(nxt.id), 150);
    return;
  }
  const m = showNewspaper(game, t, { notes, extraTop, onClose: () => { if (game.s.flags.needCapital) setTimeout(pickCapital, 60); },
    onCards: () => showCard((game.s.issues.pending.find(p => game.getIssue(p.id)?.cond?.nukeCrisis) || game.s.issues.pending[0])?.id) });
  if (pendingElection) { const r = pendingElection; pendingElection = null; m.el.querySelector('[data-close]')?.addEventListener('click', () => setTimeout(() => showElection(game, r), 50)); }
  if (pendingTerms) m.el.querySelector('[data-close]')?.addEventListener('click', () => setTimeout(() => showTerms(game, rerender), 50));
}

function bind() {
  document.addEventListener('click', e => {
    if (e.target.closest('[data-hamb]')) { const op = $('#sidebar').classList.toggle('open'); $('#nav-backdrop')?.classList.toggle('open', op); return; }
    if (e.target.closest('#nav-backdrop')) { $('#sidebar').classList.remove('open'); $('#nav-backdrop').classList.remove('open'); return; }
    if (e.target.closest('button')) sfx('click');
    if (e.target.closest('[data-endturn]')) { sfx('turn'); nextWeek(); }
    if (e.target.closest('[data-open-issue]')) showCard(game.s.issues.pending[0]?.id);
    const g = e.target.closest('[data-go]');
    if (g && !game.s?.spectator) { e.preventDefault(); go(g.dataset.go); }
  });
  installA11y({ go, nextWeek, pageName });
  document.addEventListener('keydown', e => {
    if (!game?.s || $('#app').hidden || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    if (e.code === 'Enter' && $('#modal').hidden) nextWeek();
  });
  game.on('issue', iss => {
    if (batching) return;
    renderTop(); renderNav();
    if (game.s.settings.popupIssues !== false && $('#modal').hidden) showCard(iss.id);
    else toast(`<b>Nova questão:</b> ${esc(iss.title)}`, iss.crisis ? 'bad' : 'info', () => showCard(iss.id));
  });
  game.on('answered', res => floatFeedback(res.delta));
  game.on('log', (t, k) => { if (game.s?.spectator) return; if (!batching && ['bad', 'war', 'good'].includes(k)) toast(esc(t), k); });
  game.on('notify', (title, text) => { if (game.s?.spectator) return; if (batching) notes.push([title, text]); else modal(`<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="right"><button class="primary" data-close>Continuar</button></div>`); });
  game.on('report', r => game.s?.spectator || toast(`<b>${esc(r.title)}</b> disponível. Clique para ler.`, 'info', () => go('reports')));
  game.on('victory', id => { if (!game.s?.spectator) showVictory(game, id); });
  game.on('election', r => { if (game.s?.spectator) return; if (batching) pendingElection = r; else showElection(game, r); });
  game.on('terms', () => { if (game.s?.spectator) return; if (!batching) showTerms(game, rerender); else pendingTerms = true; });
  game.on('over', () => { if (game.s?.spectator) return; renderAll(); showGameOver(game, restart); });
  window.addEventListener('beforeunload', () => game?.s && game.save());
}

async function main() {
  initTips();
  let data;
  try { data = await loadData(); }
  catch (e) {
    document.body.innerHTML = `<div style="padding:30px;font-family:Verdana"><h2>Não foi possível carregar os dados do jogo</h2><p>Abra o arquivo <b>IronState.html</b> (versão em arquivo único), que funciona com dois cliques, ou rode <code>node serve.mjs</code> e acesse http://localhost:8080.</p><p class="muted">${esc(e.message)}</p></div>`;
    return;
  }
  game = new Game(data);
  window.ironState = game; // acesso pelo console para depuração
  ctx.game = game;
  bind();
  if (game.load()) startGame(); else showSetup();
}

main();
