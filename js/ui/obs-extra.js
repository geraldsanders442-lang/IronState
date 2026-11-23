// Extras do Observatório: crônica e arquivo por país, acompanhar países, diário do jornalista, ano em revista, corrida de rankings,
// comparação entre países, árvore causal das guerras, cenários de intervenção, comparação de execuções, alertas de mundo parado
// e exportação do mundo. Recebe um contexto X com os acessores do Observatório (S, D, W, nm, fl, alive, O, go, game).
import { esc, num, money, toast, modal } from './dom.js';
import { mountLine } from './charts.js';
import { fmtDate, fmtMonth } from '../sim/util.js';
import { recentOf, archiveOf, feedOf, IMPORTANT } from '../sim/chronicle.js';
import { entityGroups } from '../sim/peoples.js';
import { FAMILIES, famOf, postureOf, nationalismOf, socialOf, POSTURES } from '../sim/geopol.js';
import { PLY, aiPower, relAI, provincesOf } from '../sim/world.js';

const KIND_ICON = { war: '⚔', bad: '▼', good: '▲', warn: '!', info: '·' };
const kc = k => k === 'war' || k === 'bad' ? 'c-bad' : k === 'good' ? 'c-good' : k === 'warn' ? 'c-warn' : '';
const line = (x, X, withName = false) => `<div class="small" style="margin:2px 0"><span class="muted">${fmtDate(x.day)}</span> <span class="${kc(x.kind)}">${KIND_ICON[x.kind] || '·'}</span> ${withName && x.id ? `<b data-ogo="pais:${x.id}" style="cursor:pointer">${esc(X.nm(x.id))}</b>: ` : ''}${esc(x.text)}</div>`;
const watch = X => (X.W().obsWatch ||= []);

export function makeExtras(X) {
  const { S, D, W, nm, fl, alive, O, go, game } = X;

  // ===================== Notícias do país (recentes + arquivo) =====================
  function newsPanel(id) {
    const rec = recentOf(S(), id).slice(0, 12), arc = archiveOf(S(), id);
    return `<div class="panel"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Notícias de ${esc(nm(id))}</h3>
        <span><button class="small ${watch(X).includes(id) ? 'primary' : ''}" data-owatch="${id}" title="Acompanhar: avisa quando acontecer algo importante">${watch(X).includes(id) ? '★ Acompanhando' : '☆ Acompanhar'}</button> <button class="small" data-ogo="diario:${id}">Diário</button></span></div>
      <div class="grid g2"><div><b class="small">Mais recentes</b><div class="log-list" style="max-height:220px">${rec.length ? rec.map(x => line(x, X)).join('') : '<span class="muted small">Sem notícias recentes (as antigas vão sendo apagadas; as importantes ficam nos marcos).</span>'}</div></div>
        <div><b class="small">Marcos permanentes (${arc.length})</b><div class="log-list" style="max-height:220px">${arc.length ? [...arc].reverse().map(x => line(x, X)).join('') : '<span class="muted small">Nada importante ainda.</span>'}</div></div></div></div>`;
  }
  function bindCountry(el, id) {
    el.querySelector('[data-owatch]')?.addEventListener('click', () => { const w = watch(X), i = w.indexOf(id); if (i >= 0) w.splice(i, 1); else w.push(id); go('pais:' + id); });
  }

  // ===================== Acompanhar países e diário do jornalista =====================
  function pageWatch(el) {
    const w = watch(X).filter(id => W().c[id]), ids = alive().sort((a, b) => nm(a).localeCompare(nm(b), 'pt'));
    const feed = feedOf(S(), w, { limit: 50 });
    el.innerHTML = `<h2>Acompanhar países</h2><p class="small muted">Os países que você marca com ☆ aparecem aqui. Quando algo importante acontece com eles, o Observatório avisa.</p>
      <div class="panel"><div class="row" style="gap:6px;flex-wrap:wrap">${w.map(id => `<span class="tag" style="cursor:pointer" data-ogo="pais:${id}">${fl(id, 14)} ${esc(nm(id))}</span><button class="small" data-owunwatch="${id}" title="Parar de acompanhar">✕</button>`).join('') || '<span class="muted small">Nenhum país acompanhado.</span>'}
        <select data-owadd><option value="">+ acompanhar…</option>${ids.filter(i => !w.includes(i)).map(i => `<option value="${i}">${esc(nm(i))}</option>`).join('')}</select></div></div>
      <div class="panel"><h3>Últimas notícias dos acompanhados</h3>${feed.length ? feed.map(x => line(x, X, true)).join('') : '<span class="muted small">Sem notícias ainda.</span>'}</div>`;
    el.querySelector('[data-owadd]').onchange = e => { if (e.target.value) { watch(X).push(e.target.value); go('acompanhar'); } };
    el.querySelectorAll('[data-owunwatch]').forEach(b => b.onclick = () => { const a = watch(X), i = a.indexOf(b.dataset.owunwatch); if (i >= 0) a.splice(i, 1); go('acompanhar'); });
  }
  // Diário: as notícias de um país agrupadas por semana, como uma edição de jornal.
  function pageDiary(el, id = O.arg) {
    const ids = alive().sort((a, b) => nm(a).localeCompare(nm(b), 'pt')); id = id && W().c[id] ? id : ids[0];
    const items = feedOf(S(), [id], { limit: 200 }), weeks = new Map();
    for (const x of items) { const k = Math.floor(x.day / 7); (weeks.get(k) || weeks.set(k, []).get(k)).push(x); }
    el.innerHTML = `<h2>Diário do jornalista</h2><div class="row" style="gap:8px;align-items:center"><label class="small">País <select data-odsel>${ids.map(i => `<option value="${i}" ${i === id ? 'selected' : ''}>${esc(nm(i))}</option>`).join('')}</select></label>
        <button class="small" data-ogo="pais:${id}">Ficha do país</button></div>
      ${[...weeks.entries()].slice(0, 20).map(([k, L]) => `<div class="panel tight"><b>Semana de ${fmtDate(k * 7)}</b>${L.sort((a, b) => b.w - a.w).map(x => `<div class="small" style="margin:2px 0">${x.w >= IMPORTANT ? '<b>' : ''}<span class="${kc(x.kind)}">${KIND_ICON[x.kind] || '·'}</span> ${esc(x.text)}${x.w >= IMPORTANT ? '</b>' : ''}</div>`).join('')}</div>`).join('') || '<div class="panel"><span class="muted small">Sem notícias deste país ainda.</span></div>'}`;
    el.querySelector('[data-odsel]').onchange = e => go('diario:' + e.target.value);
  }

  // ===================== Ano em revista (narrador) =====================
  function pageYear(el) {
    const s = S(), Wd = W(), data = D(), st = Wd.obsStart, now = game.day;
    const spans = []; for (let t = now; t > st.day + 30; t -= 365) spans.push([Math.max(st.day, t - 365), t]);
    const k = Math.min(+(O.arg || 0), Math.max(0, spans.length - 1)), [d0, d1] = spans[k] || [st.day, now];
    const H = Wd.obsHist || { days: [], c: {} }, at = (id, day) => { const r = (H.c[id] || []).filter(x => x[0] <= day).at(-1); return r || null; };
    const wars = Wd.wars.filter(w => (w.since ?? 0) >= d0 && (w.since ?? 0) <= d1 && w.since > 0), news = Wd.newStates?.filter(n => n.day >= d0 && n.day <= d1) || [], reg = (Wd.regimeLog || []).filter(r => r.day >= d0 && r.day <= d1 && r.kind !== 'election');
    const grow = alive().map(id => [id, at(id, d0), at(id, d1)]).filter(x => x[1] && x[2] && x[1][1] > 50).map(([id, a, b]) => [id, (b[1] / a[1] - 1) * 100]).sort((a, b) => b[1] - a[1]);
    const M = (Wd.meterHist || []).filter(r => r[0] >= d0 && r[0] <= d1), avg = i => M.length ? M.reduce((a, r) => a + r[i], 0) / M.length : 0;
    const pers = Object.entries(Wd.minor || {}).filter(([, p]) => p.since >= d0 && p.since <= d1).sort((a, b) => b[1].level - a[1].level);
    const top = []; for (const id of alive()) for (const x of archiveOf(s, id)) if (x.day >= d0 && x.day <= d1) top.push({ ...x, id });
    top.sort((a, b) => b.w - a.w || a.day - b.day); const seen = new Set(), best = top.filter(x => !seen.has(x.text) && seen.add(x.text)).slice(0, 14).sort((a, b) => a.day - b.day);
    const P = [];
    P.push(`De ${fmtDate(d0)} a ${fmtDate(d1)}, o mundo viveu um período de ${avg(1) > 60 ? 'caos' : avg(1) > 40 ? 'instabilidade' : 'relativa calma'}: caos médio ${num(avg(1), 0)}, tensão ${num(avg(2), 0)} e ${num(avg(3), 0)} guerra(s) ativas em média.`);
    if (wars.length) P.push(`Começaram ${wars.length} guerra(s) neste ano${wars.length > 1 ? ', entre elas' : ':'} ${wars.slice(0, 3).map(w => `${w.a.map(nm).join(' e ')} contra ${w.b.map(nm).join(' e ')}`).join('; ')}.`); else P.push('Nenhuma guerra nova começou neste ano.');
    if (news.length) P.push(`O mapa ganhou ${news.length} novo(s) Estado(s): ${news.slice(0, 4).map(n => `${n.name} (de ${nm(n.from)})`).join(', ')}.`);
    if (reg.length) P.push(`Houve ${reg.length} mudança(s) de regime ou de governo, como ${reg.slice(0, 3).map(r => r.text).join('; ')}.`);
    if (grow.length > 4) P.push(`Na economia, quem mais cresceu foi ${nm(grow[0][0])} (${num(grow[0][1], 0)}%), seguida de ${nm(grow[1][0])} (${num(grow[1][1], 0)}%); as maiores quedas foram de ${nm(grow.at(-1)[0])} (${num(grow.at(-1)[1], 0)}%) e ${nm(grow.at(-2)[0])} (${num(grow.at(-2)[1], 0)}%).`);
    if (pers.length) P.push(`Perseguições a minorias marcaram o ano em ${pers.slice(0, 3).map(([id, p]) => `${nm(id)} (${p.noun})`).join(', ')}${pers.some(([, p]) => p.level >= 4) ? ', incluindo um genocídio' : ''}.`);
    el.innerHTML = `<h2>Ano em revista</h2><div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:6px">${spans.map(([a, b], i) => `<button class="small ${i === k ? 'primary' : ''}" data-oyear="${i}">${fmtDate(a).slice(-8)} → ${fmtDate(b).slice(-8)}</button>`).join('')}</div>
      <div class="panel" style="line-height:1.65">${P.map(p => `<p>${esc(p)}</p>`).join('')}</div>
      <div class="panel"><h3>Os fatos mais importantes</h3>${best.map(x => line(x, X, true)).join('') || '<span class="muted small">Nada de importante registrado no período.</span>'}</div>`;
    el.querySelectorAll('[data-oyear]').forEach(b => b.onclick = () => go('ano:' + b.dataset.oyear));
  }

  // ===================== Corrida de rankings =====================
  const METRICS = { gdp: ['PIB (bilhões US$)', r => r[1]], pop: ['População (milhões)', r => r[4]], power: ['Poder militar', r => r[3]], prov: ['Províncias', r => r[5]], pc: ['PIB per capita (US$)', r => r[1] * 1000 / Math.max(0.01, r[4])] };
  function pageRace(el) {
    const Wd = W(), H = Wd.obsHist || { days: [], c: {} }, T = (O.race ||= { m: 'gdp', k: 0, playing: false });
    T.playing = false;
    const days = H.days; if (days.length < 2) { el.innerHTML = '<h2>Corrida de rankings</h2><div class="panel"><p>Avance o tempo (alguns meses) para ter histórico.</p></div>'; return; }
    const ids = Object.keys(H.c), val = (id, i) => { const r = H.c[id].find(x => x[0] === days[i]); return r ? METRICS[T.m][1](r) : 0; };
    el.innerHTML = `<h2>Corrida de rankings</h2><div class="row" style="gap:8px;flex-wrap:wrap"><select data-rm>${Object.entries(METRICS).map(([k, v]) => `<option value="${k}" ${k === T.m ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>
      <button class="primary small" data-rplay>▶ Reproduzir</button><input type="range" data-rslide min="0" max="${days.length - 1}" value="${Math.min(T.k, days.length - 1)}" style="flex:1;min-width:140px"><b data-rclock></b></div>
      <div data-rbars style="position:relative;height:${12 * 26 + 8}px;margin-top:8px"></div>`;
    const box = el.querySelector('[data-rbars]'), clock = el.querySelector('[data-rclock]'), slide = el.querySelector('[data-rslide]');
    const N = 12, color = id => FAMILIES[famOf(S(), D(), id)]?.color || '#5b8fd6', rows = {};
    function draw(k) {
      k = Math.max(0, Math.min(days.length - 1, k)); T.k = k; slide.value = k; clock.textContent = fmtDate(days[k]);
      const arr = ids.map(id => [id, val(id, k)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, N), mx = arr[0]?.[1] || 1;
      const keep = new Set(arr.map(x => x[0]));
      for (const id in rows) if (!keep.has(id)) { rows[id].style.opacity = 0; }
      arr.forEach(([id, v], i) => {
        let r = rows[id]; if (!r) { r = rows[id] = document.createElement('div'); r.style.cssText = 'position:absolute;left:0;right:0;height:22px;transition:top .45s ease,opacity .3s;display:flex;align-items:center;gap:6px'; r.innerHTML = '<span style="width:130px;font-size:12px;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></span><div style="height:18px;border-radius:3px;transition:width .45s ease"></div><b style="font-size:12px"></b>'; box.appendChild(r); }
        r.style.top = i * 26 + 'px'; r.style.opacity = 1;
        const [lab, bar, num_] = r.children; lab.textContent = nm(id); bar.style.background = color(id); bar.style.width = Math.max(2, v / mx * 62) + '%'; num_.textContent = num(v, v < 100 ? 1 : 0);
      });
    }
    draw(T.k); let timer = null;
    const stop = () => { T.playing = false; clearInterval(timer); const pb = el.querySelector('[data-rplay]'); if (pb) pb.textContent = '▶ Reproduzir'; };
    el.querySelector('[data-rplay]').onclick = () => { if (T.playing) return stop(); if (T.k >= days.length - 1) draw(0); T.playing = true; el.querySelector('[data-rplay]').textContent = '⏸ Pausar'; timer = setInterval(() => { if (!box.isConnected || T.k >= days.length - 1) return stop(); draw(T.k + 1); }, 550); };
    slide.oninput = () => { stop(); draw(+slide.value); };
    el.querySelector('[data-rm]').onchange = e => { stop(); T.m = e.target.value; go('corrida'); };
  }

  // ===================== Comparar países (ficha lado a lado) =====================
  function pageDuel(el) {
    const ids = alive().sort((a, b) => nm(a).localeCompare(nm(b), 'pt')), [a0, b0] = (O.arg || '').split(',');
    const A = W().c[a0] ? a0 : ids[0], B = W().c[b0] ? b0 : ids[1], s = S(), data = D(), Wd = W();
    const row = id => { const c = Wd.c[id], so = socialOf(c, Wd.wars.some(w => w.active && [...w.a, ...w.b].includes(id))); return {
      fam: FAMILIES[famOf(s, data, id)].name, post: POSTURES[postureOf(s, data, id)]?.name || '', gdp: money(c.gdp, 'US$'), pc: num(so.gdppc, 0), hdi: num(so.hdi, 3), pop: num(c.pop, 1) + ' mi', pow: num(aiPower(c), 1), stab: num(c.stab, 0), nat: num(nationalismOf(s, data, id), 0),
      prov: provincesOf(s, data, id).length, wars: Wd.wars.filter(w => w.active && [...w.a, ...w.b].includes(id)).length, allies: (Wd.alliances || []).filter(x => x.members.includes(id)).map(x => x.name).join(', ') || '—',
      groups: entityGroups(s, data, id).slice(0, 4).map(g => `${g.noun} ${num(g.share, 0)}%`).join(', '), pers: Wd.minor?.[id] && !Wd.minor[id].over ? `${Wd.minor[id].noun} (nível ${Wd.minor[id].level})` : '—' }; };
    const ra = row(A), rb = row(B), rel = relAI(s, data, A, B);
    const T = [['Regime', 'fam'], ['Política externa', 'post'], ['PIB', 'gdp'], ['PIB per capita', 'pc'], ['IDH', 'hdi'], ['População', 'pop'], ['Poder militar', 'pow'], ['Estabilidade', 'stab'], ['Nacionalismo', 'nat'], ['Províncias', 'prov'], ['Guerras ativas', 'wars'], ['Alianças', 'allies'], ['Povos', 'groups'], ['Perseguição em curso', 'pers']];
    const opt = sel => ids.map(i => `<option value="${i}" ${i === sel ? 'selected' : ''}>${esc(nm(i))}</option>`).join('');
    el.innerHTML = `<h2>Comparar países</h2><div class="row" style="gap:8px;flex-wrap:wrap"><select data-da>${opt(A)}</select> <b>×</b> <select data-db>${opt(B)}</select> <span class="small muted">relação entre eles: <b>${Math.round(rel)}</b></span></div>
      <div class="panel"><table class="data"><tr><th></th><th>${fl(A, 16)} ${esc(nm(A))}</th><th>${fl(B, 16)} ${esc(nm(B))}</th></tr>${T.map(([n, k]) => `<tr><td>${n}</td><td>${esc(String(ra[k]))}</td><td>${esc(String(rb[k]))}</td></tr>`).join('')}</table></div>
      <div class="grid g2"><div class="panel"><div data-dg1></div></div><div class="panel"><div data-dg2></div></div></div>`;
    const H = Wd.obsHist?.c || {};
    mountLine(el.querySelector('[data-dg1]'), { title: 'PIB (bi US$)', series: [{ name: nm(A), data: (H[A] || []).map(r => [r[0], r[1]]) }, { name: nm(B), color: '#c0392b', data: (H[B] || []).map(r => [r[0], r[1]]) }], height: 140, yFmt: v => num(v, 0) });
    mountLine(el.querySelector('[data-dg2]'), { title: 'Estabilidade', series: [{ name: nm(A), color: '#2e8b3e', data: (H[A] || []).map(r => [r[0], r[2]]) }, { name: nm(B), color: '#c0392b', data: (H[B] || []).map(r => [r[0], r[2]]) }], height: 140, yMin: 0, yMax: 100, yFmt: v => num(v, 0) });
    el.querySelector('[data-da]').onchange = e => go(`duelo:${e.target.value},${B}`); el.querySelector('[data-db]').onchange = e => go(`duelo:${A},${e.target.value}`);
  }

  // ===================== Árvore causal de uma guerra =====================
  function causesHTML(w) {
    const s = S(), data = D(), Wd = W(), all = [...w.a, ...w.b], C = Wd.chron || {};
    const claims = Wd.claims.filter(c => all.includes(c.claimant) && all.includes(c.holder));
    const relAB = w.a[0] && w.b[0] ? Math.round(relAI(s, data, w.a[0], w.b[0])) : 0;
    const before = []; for (const id of all) for (const x of archiveOf(s, id)) if (x.day <= (w.since ?? 0) + 3 && x.day >= (w.since ?? 0) - 700) before.push({ ...x, id });
    before.sort((a, b) => b.w - a.w || b.day - a.day); const seen = new Set(), pre = before.filter(x => !seen.has(x.text) && seen.add(x.text)).slice(0, 8).sort((a, b) => a.day - b.day);
    const E = []; for (const id of all) { const g = Wd.minor?.[id]; if (g) E.push(`${nm(id)}: perseguição a ${g.noun} (nível ${g.level})`); }
    const sup = [w.supportA && `apoio ao lado A (${num(w.supportA, 1)})`, w.supportB && `apoio ao lado B (${num(w.supportB, 1)})`].filter(Boolean);
    const out = [];
    out.push(`<div class="small"><b>Motivo declarado:</b> ${esc(w.note || (claims[0]?.just) || 'não registrado')}</div>`);
    out.push(`<div class="small"><b>Relação entre os lados antes e agora:</b> ${relAB}${w.chaos ? ' · guerra nascida do caos do mundo' : ''}${w.civil ? ' · guerra civil' : ''}${w.lab ? ' · provocada no laboratório' : ''}</div>`);
    if (claims.length) out.push(`<div class="small"><b>Reivindicações:</b> ${claims.map(c => `${esc(nm(c.claimant))} sobre terras de ${esc(nm(c.holder))} (${esc(c.type)})`).join('; ')}</div>`);
    if (E.length) out.push(`<div class="small"><b>Tensões étnicas:</b> ${E.map(esc).join('; ')}</div>`);
    if (sup.length) out.push(`<div class="small"><b>Intervenções:</b> ${sup.join(', ')}</div>`);
    out.push(`<div class="small"><b>Antecedentes (notícias importantes dos participantes):</b></div>${pre.map(x => line(x, X, true)).join('') || '<div class="small muted">Sem antecedentes registrados.</div>'}`);
    out.push(`<div class="small"><b>Situação:</b> ${w.active ? 'em andamento' : 'encerrada'}${w.result ? ' — ' + esc(w.result) : ''}</div>`);
    return out.join('');
  }
  function causesPanel(el) {
    const Wd = W(), list = Wd.wars.filter(w => w.since != null).slice(-30).reverse();
    const box = el.querySelector('[data-ocauses]'); if (!box) return;
    box.innerHTML = `<div class="panel"><h3>Por que começou? (árvore causal)</h3><select data-ocsel><option value="">— escolha uma guerra —</option>${list.map((w, i) => `<option value="${i}">${w.active ? '⚔ ' : ''}${esc(w.a.map(nm).join(' e '))} × ${esc(w.b.map(nm).join(' e '))} (${fmtDate(w.since)})</option>`).join('')}</select><div data-ocbody style="margin-top:6px"></div></div>`;
    box.querySelector('[data-ocsel]').onchange = e => { box.querySelector('[data-ocbody]').innerHTML = e.target.value === '' ? '' : causesHTML(list[+e.target.value]); };
  }

  // ===================== Mundo parado =====================
  function quietBanner() {
    let last = W().obsStart?.day || 0; for (const id in W().chron || {}) for (const x of W().chron[id].a) if (x[0] > last) last = x[0];
    const weeks = Math.floor((game.day - last) / 7);
    if (weeks < 26) return '';
    return `<div class="panel tight" style="border-left:6px solid #c9a227"><b>O mundo está parado há ${weeks} semanas</b> — nenhum evento importante. <button class="small primary" data-oquiet>Provocar um evento</button></div>`;
  }
  function bindQuiet(el) {
    el.querySelector('[data-oquiet]')?.addEventListener('click', () => {
      const ids = alive().filter(id => W().c[id].gdp > 100), pick = a => a[Math.floor(Math.random() * a.length)], id = pick(ids), o = pick(ids.filter(x => x !== id));
      const evs = [{ type: 'crisis', id: pick(['pandemic', 'crash', 'climate', 'cyber']) }, { type: 'country', id, v: 'crash' }, { type: 'country', id, v: 'arm' }, { type: 'destabilize', id }, { type: 'rel', a: id, b: o, v: -40 }];
      game.labAct(pick(evs)); toast('Um evento foi provocado no mundo.', 'info'); go(O.page);
    });
  }

  // ===================== Cenários de intervenção =====================
  const SCENARIOS = [
    ['Revolução na Rússia', 'Crise interna e revolução socialista em Moscou.', [{ type: 'destabilize', id: 'RUS' }, { type: 'regime', id: 'RUS', v: 'socialist', how: 'revolution' }]],
    ['Guerra no estreito de Taiwan', 'A China ataca Taiwan; EUA e China se afastam; a tensão sobe.', [{ type: 'tension', v: 20 }, { type: 'rel', a: 'USA', b: 'CHN', v: -35 }, { type: 'war', a: 'CHN', b: 'TWN' }]],
    ['Colapso da União Europeia', 'Crises econômicas e rupturas entre França, Alemanha, Itália e Espanha.', ['DEU', 'FRA', 'ITA', 'ESP'].map(id => ({ type: 'country', id, v: 'crash' })).concat([{ type: 'rel', a: 'DEU', b: 'FRA', v: -35 }, { type: 'rel', a: 'ITA', b: 'DEU', v: -30 }])],
    ['Reunificação coreana pela força', 'A Coreia do Norte se arma e ataca o Sul.', [{ type: 'country', id: 'PRK', v: 'arm' }, { type: 'war', a: 'PRK', b: 'KOR' }]],
    ['Golpe nacionalista na Turquia', 'Militares nacionalistas assumem em Ancara.', [{ type: 'destabilize', id: 'TUR' }, { type: 'regime', id: 'TUR', v: 'nationalist', how: 'coup' }]],
    ['Fome no Sahel', 'Seca e fome desestabilizam os países do Sahel.', ['MLI', 'NER', 'TCD', 'BFA'].map(id => ({ type: 'country', id, v: 'famine' }))],
    ['Corrida nuclear no Oriente Médio', 'Arábia Saudita e Irã se armam; tensão regional.', [{ type: 'country', id: 'SAU', v: 'nuke' }, { type: 'country', id: 'IRN', v: 'nuke' }, { type: 'rel', a: 'SAU', b: 'IRN', v: -40 }]],
    ['Paz mundial', 'Cessar-fogo imposto a todas as guerras e distensão.', [{ type: 'peace' }, { type: 'tension', v: -25 }]],
  ];
  function scenariosPanel() {
    return `<div class="panel"><h3>Cenários de intervenção prontos</h3><p class="small muted">Um clique aplica uma sequência de intervenções (só vale para países que existem no seu mundo).</p>
      <div class="grid g2">${SCENARIOS.map(([n, d], i) => `<div class="panel tight"><b>${esc(n)}</b><div class="small muted">${esc(d)}</div><button class="small primary" data-oscn="${i}" style="margin-top:4px">Aplicar</button></div>`).join('')}</div></div>`;
  }
  function bindScenarios(el) {
    el.querySelectorAll('[data-oscn]').forEach(b => b.onclick = () => {
      const [n, , steps] = SCENARIOS[+b.dataset.oscn]; let ok = 0;
      for (const a of steps) { const ids = [a.id, a.a, a.b].filter(Boolean); if (ids.some(x => !W().c[x])) continue; try { game.labAct(a); ok++; } catch (e) { console.error(e); } }
      toast(ok ? `Cenário "${esc(n)}" aplicado (${ok}/${steps.length} passos).` : 'Nenhum passo pôde ser aplicado neste mundo.', ok ? 'good' : 'warn'); go(O.page);
    });
  }

  // ===================== Comparar duas execuções (sementes diferentes) =====================
  function comparePanel() {
    return `<div class="panel"><h3>Comparar com outra semente</h3><p class="small muted">Clona o mundo de agora e o roda de novo por alguns meses com outra semente de sorteio, para ver o que é inevitável e o que é acaso. Não altera o seu mundo.</p>
      <div class="row" style="gap:6px;flex-wrap:wrap"><select data-ocm><option value="6">6 meses</option><option value="12" selected>12 meses</option><option value="24">24 meses</option></select><button class="small primary" data-ocrun>Rodar comparação</button><span class="small muted" data-ocstat></span></div><div data-ocout></div></div>`;
  }
  function bindCompare(el) {
    const btn = el.querySelector('[data-ocrun]'); if (!btn) return;
    btn.onclick = async () => {
      const months = +el.querySelector('[data-ocm]').value, stat = el.querySelector('[data-ocstat]'), out = el.querySelector('[data-ocout]');
      btn.disabled = true; stat.textContent = 'Preparando…';
      const { Game } = await import('../sim/game.js');
      const snap = g => { const Wd = g.s.world, al = Object.keys(Wd.c).filter(i => !Wd.c[i].dep); return { countries: al.length, wars: Wd.wars.filter(w => w.active).length, states: (Wd.newStates || []).length, regimes: (Wd.regimeLog || []).filter(r => r.kind !== 'election').length, top: al.sort((a, b) => Wd.c[b].gdp - Wd.c[a].gdp).slice(0, 5), pers: Object.values(Wd.minor || {}).filter(p => !p.over).length, chaos: Wd.meters?.chaos || 0, set: new Set(al) }; };
      const raw = game.serialize(), baseRng = game.s.rng, mk = seed => { const g = new Game(game.baseData || game.data, { getItem: () => raw, setItem: () => {}, removeItem: () => {} }); if (!g.load('x')) throw new Error('não foi possível clonar o mundo'); g.s.rng = seed | 0; return g; };
      const A = mk(baseRng), B = mk((Math.random() * 4e9) | 0), total = Math.round(months * 4.35);
      for (let i = 0; i < total; i++) { A.nextWeek(); B.nextWeek(); if (i % 4 === 0) { stat.textContent = `Simulando… ${Math.round(i / total * 100)}%`; await new Promise(r => setTimeout(r, 0)); } }
      const a = snap(A), b = snap(B), nm2 = (g, id) => g.s.world.ents?.[id]?.name || game.data.reg[id]?.name || id;
      const only = (x, y) => [...x.set].filter(i => !y.set.has(i));
      out.innerHTML = `<table class="data small" style="margin-top:6px"><tr><th></th><th>Execução A</th><th>Execução B</th></tr>
        <tr><td>Países vivos</td><td>${a.countries}</td><td>${b.countries}</td></tr><tr><td>Guerras ativas</td><td>${a.wars}</td><td>${b.wars}</td></tr><tr><td>Estados novos (total)</td><td>${a.states}</td><td>${b.states}</td></tr>
        <tr><td>Mudanças de regime (registro)</td><td>${a.regimes}</td><td>${b.regimes}</td></tr><tr><td>Perseguições em curso</td><td>${a.pers}</td><td>${b.pers}</td></tr><tr><td>Caos mundial</td><td>${num(a.chaos, 0)}</td><td>${num(b.chaos, 0)}</td></tr>
        <tr><td>Cinco maiores economias</td><td>${a.top.map(i => esc(nm2(A, i))).join(', ')}</td><td>${b.top.map(i => esc(nm2(B, i))).join(', ')}</td></tr>
        <tr><td>Países só nesta execução</td><td>${only(a, b).map(i => esc(nm2(A, i))).join(', ') || '—'}</td><td>${only(b, a).map(i => esc(nm2(B, i))).join(', ') || '—'}</td></tr></table>`;
      stat.textContent = 'Pronto.'; btn.disabled = false;
    };
  }

  // ===================== Exportar e importar o mundo =====================
  function exportPanel() {
    return `<div class="panel"><h3>Compartilhar este mundo</h3><p class="small muted">Baixa o estado do mundo (compactado) para guardar, mandar a um amigo ou continuar em outro navegador.</p>
      <div class="row" style="gap:6px"><button class="small primary" data-oexp>⬇ Exportar mundo</button><button class="small" data-oimp>⬆ Importar mundo</button></div></div>`;
  }
  function bindExport(el) {
    el.querySelector('[data-oexp]')?.addEventListener('click', async () => {
      const raw = new TextEncoder().encode(JSON.stringify({ format: 'ironstate-observatory', version: 1, saved: new Date().toISOString(), state: game.s }));
      let blob, name = 'observatorio.ironstate.json';
      if (typeof CompressionStream !== 'undefined') { blob = await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).blob(); name += '.gz'; } else blob = new Blob([raw], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
      toast(`Mundo exportado (${(blob.size / 1e6).toFixed(1)} MB).`, 'good');
    });
    el.querySelector('[data-oimp]')?.addEventListener('click', () => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,.gz';
      inp.onchange = async () => {
        const f = inp.files?.[0]; if (!f) return;
        try {
          const buf = await f.arrayBuffer(), gz = new Uint8Array(buf)[0] === 0x1f;
          const txt = gz ? await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).text() : new TextDecoder().decode(buf);
          const o = JSON.parse(txt); if (o.format !== 'ironstate-observatory' || !o.state?.spectator) throw new Error('não é um mundo do Observatório');
          if (!confirm('Substituir o mundo atual pelo importado?')) return;
          game.s = o.state; game.save(); location.reload();
        } catch (e) { toast('Não foi possível importar: ' + esc(e.message), 'bad'); }
      };
      inp.click();
    });
  }

  // ===================== Avisos dos acompanhados =====================
  function onChron(ids, text, type) {
    if (!document.body.classList.contains('obs-mode')) return;
    const w = watch(X), hit = ids.filter(i => w.includes(i)); if (!hit.length) return;
    import('../sim/chronicle.js').then(({ importance }) => { if (importance(text, type) >= IMPORTANT) toast(`<b>★ ${esc(nm(hit[0]))}:</b> ${esc(text)}`, type === 'war' || type === 'bad' ? 'bad' : 'info'); });
  }
  return { newsPanel, bindCountry, pageWatch, pageDiary, pageYear, pageRace, pageDuel, causesPanel, quietBanner, bindQuiet, scenariosPanel, bindScenarios, comparePanel, bindCompare, exportPanel, bindExport, onChron };
}
