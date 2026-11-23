import { $, esc, num, money, modal } from './dom.js';
import { ENDINGS, VICTORIES } from '../sim/regime.js';
import { fmtDate } from '../sim/util.js';
import { flagHTML as flagSVG } from './flag.js';
import { entName } from '../sim/war.js';
import { orgDef } from '../sim/diplomacy.js';
import { mountLine } from './charts.js';
import { MODES, loadMeta } from '../sim/modes.js';
import { rerender } from './app.js';

export function showVictory(game, id) {
  const v = VICTORIES[id];
  const m = modal(`<h2>★ ${esc(v.name)}</h2><p>${esc(v.desc)}</p><p>Sua administração alcançou uma meta histórica. Você pode continuar governando ou encerrar a campanha com uma aposentadoria honrosa.</p>
    <div class="right"><button data-close>Continuar governando</button> <button class="primary" data-retire>Encerrar a campanha</button></div>`);
  m.el.querySelector('[data-retire]').onclick = () => { m.close(); game.s.over = { ending: 'retired', cause: 'Meta alcançada: ' + v.name, day: game.day }; game.finish(); };
}

export function showTerms(game, after) {
  const w = game.s.wars.find(x => x.pendingTerms);
  if (!w) return;
  const m = modal(`<h2>Vitória sobre ${esc(w.name)}</h2><p>As forças inimigas se renderam. Que termos impor?</p>
    <button class="option" data-t="annex"><div class="opt-text">Anexar território</div><div class="hint">+população, PIB e recursos; resistência local, custos de ocupação, sanções e condenação internacional.</div></button>
    <button class="option" data-t="reparations"><div class="opt-text">Exigir reparações</div><div class="hint">Dinheiro imediato para o tesouro; o inimigo continua hostil.</div></button>
    <button class="option" data-t="puppet"><div class="opt-text">Impor um governo cliente</div><div class="hint">Vizinho vira parceiro comercial e aumenta sua influência regional.</div></button>`);
  m.el.onclick = e => { const b = e.target.closest('[data-t]'); if (b) { game.terms(w.id, b.dataset.t); m.close(); after?.(); } };
}

export function showGameOver(game, restart) {
  const s = game.s, end = ENDINGS[s.over.ending], f = s.final || game.buildReport(s.history[0], s.history.at(-1), 'final');
  const n = s.nation, days = s.over.day;
  const years = (days / 365).toFixed(1);
  const built = Object.entries(s.initiatives).filter(([, i]) => i.status === 'active').map(([id]) => game.data.initById[id].name);
  const treaties = Object.entries(s.partners).filter(([, p]) => p.pact || (p.trade && p.rel > 40)).slice(0, 30).map(([id, p]) => `${entName(s, game.data, id)} (${[p.trade && 'comércio', p.pact && 'defesa'].filter(Boolean).join(', ')})`);
  const crises = s.log.filter(l => l.type === 'bad' || l.type === 'war').slice(0, 15).map(l => `${fmtDate(l.day)} — ${l.text}`);
  const a = f.from, b = f.to;
  const row = (nm, k, d = 1) => `<tr><td>${nm}</td><td class="num">${num(a[k], d)}</td><td class="num">${num(b[k], d)}</td></tr>`;
  const m = modal(`<div class="ending">${flagSVG(n.flag, 120)}<h1>${esc(end.title)}</h1><p style="max-width:640px;margin:8px auto;line-height:1.6">${esc(end.text(n))}</p>
      <p class="muted">Causa: ${esc(s.over.cause)} · ${esc(n.leader)} governou ${esc(n.officialName)} por ${days} dias (${years} anos), de ${fmtDate(0)} a ${fmtDate(days)}.</p>
      <div class="score-box"><div class="small muted">${esc(MODES[s.mode || 'sandbox']?.name || 'Sandbox')}${s.modeCfg?.name ? ' · ' + esc(s.modeCfg.name) : ''}</div><div style="font-size:40px;font-family:Georgia">${s.score ?? 0} pontos</div>${s.legacyGain ? `<div class="small c-good">+${s.legacyGain} de Legado para as próximas temporadas</div>` : ''}<div class="small muted">Recorde neste modo: ${Math.max(...Object.entries(loadMeta(game.storage).best).filter(([k]) => k.startsWith(s.mode || 'sandbox')).map(([, v]) => v), 0)}</div></div>
      <p>${end.good === true ? '<span class="tag good">Desfecho positivo</span>' : end.good === null ? '<span class="tag warn">Desfecho ambíguo</span>' : '<span class="tag bad">Queda do regime</span>'} ${s.achievements.map(x => `<span class="tag good">★ ${esc(VICTORIES[x.id].name)}</span>`).join('')}</p></div>
    <h3>Relatório histórico do governo</h3><div class="grid g2"><div><table class="data"><tr><th>Indicador</th><th class="num">Início</th><th class="num">Fim</th></tr>
      ${row('PIB (bi)', 'gdp')}${row('PIB per capita', 'gdppc', 0)}${row('População (mi)', 'pop', 2)}${row('Pobreza (%)', 'poverty')}${row('Fome (%)', 'hunger')}${row('Desemprego (%)', 'unemployment')}
      ${row('Inflação (%)', 'inflation')}${row('Dívida (% PIB)', 'debt')}${row('Qualidade de vida', 'qol')}${row('Direitos civis', 'civil')}${row('Liberdade política', 'political')}${row('Apoio', 'support')}${row('Estabilidade', 'stability')}${row('Reputação', 'reputation')}</table>
      <p class="small">Questões decididas: <b>${s.issues.answered}</b> · ignoradas: ${s.issues.ignored} · leis alteradas: ${s.decisions.filter(d => d.id.startsWith('law_')).length}</p></div>
      <div><div data-e1></div><div data-e2></div></div></div>
    <div class="grid g2"><div><b>Guerras</b><ul class="small">${s.wars.map(w => `<li>${esc(entName(s, game.data, w.enemy))} (${w.gained.length} províncias tomadas, ${w.lost.length} perdidas; ${fmtDate(w.start)}${w.end ? ' – ' + fmtDate(w.end) : ''}): ${esc({ victory: 'vitória', defeat: 'derrota', ceasefire: 'cessar-fogo', concession: 'paz com concessões' }[w.result] || 'em curso')}, ${num(w.cas, 1)} mil baixas, ${money(w.cost)}</li>`).join('') || '<li class="muted">Nenhuma.</li>'}</ul>
      <b>Investimentos concluídos (${built.length})</b><div class="small">${built.map(esc).join(', ') || '—'}</div>
      <b>Tratados vigentes</b><div class="small">${treaties.map(esc).join('; ') || '—'} ${Object.keys(s.orgs).length ? '<br>Organizações: ' + Object.keys(s.orgs).map(o => esc(orgDef(s, game.data, o)?.name || o)).join(', ') : ''}</div></div>
      <div><b>Crises marcantes</b><ul class="small">${crises.map(c => `<li>${esc(c)}</li>`).join('') || '<li class="muted">Nenhuma.</li>'}</ul></div></div>
    <div class="right" style="margin-top:10px"><button data-close>Ver a nação</button> <button class="primary" data-restart>Nova partida</button></div>
    <div class="row" style="justify-content:center;margin-top:10px"><button class="primary" data-legacy style="font-size:15px;padding:8px 22px">Seu legado</button></div>`, { wide: true });
  const H = s.history;
  mountLine($('[data-e1]', m.el), { title: 'PIB e população', series: [{ name: 'PIB (bi)', data: H.map(h => [h.day, h.gdp]) }, { name: 'População ×10 (mi)', data: H.map(h => [h.day, h.pop * 10]) }], height: 120 });
  mountLine($('[data-e2]', m.el), { title: 'Apoio, estabilidade e pobreza', series: [{ name: 'Apoio', data: H.map(h => [h.day, h.support]) }, { name: 'Estabilidade', data: H.map(h => [h.day, h.stability]) }, { name: 'Pobreza', data: H.map(h => [h.day, h.poverty]) }], height: 120 });
  m.el.querySelector('[data-restart]').onclick = () => { m.close(); restart(); };
  m.el.querySelector('[data-legacy]').onclick = () => showLegacy(game, restart, m);
}

// ---------- Seu legado: nota, texto histórico e retorno ao poder ----------
export function showLegacy(game, restart, parent) {
  const s = game.s, L = game.legacy(), info = game.comebackInfo(), n = s.nation;
  const runs = (loadMeta(game.storage).history || []).filter(h => h.score != null);
  const better = runs.filter(h => h.score > (s.score ?? 0)).length;
  const rankLine = runs.length > 1 ? `Entre suas ${runs.length} partidas registradas, esta ficou em <b>${better + 1}º lugar</b> em pontos.` : 'Esta é a sua primeira partida registrada.';
  const G = L.grade;
  const m = modal(`<div class="ending"><div style="display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap">
      <div style="width:96px;height:96px;border-radius:50%;background:${G.color};color:#fff;display:flex;align-items:center;justify-content:center;font:700 54px Georgia">${G.g}</div>
      <div style="text-align:left"><div class="small muted">Seu legado</div><h1 style="margin:0">${esc(G.title)}</h1>${(L.tags || []).length ? `<div class="row" style="gap:4px;flex-wrap:wrap;margin:4px 0">${L.tags.map(t => `<span class="tag ${t.tone === 'good' ? 'good' : t.tone === 'bad' ? 'bad' : ''}" title="${esc(t.text)}">${esc(t.name)}</span>`).join('')}</div>` : ''}<div class="small">Índice histórico ${L.idx}/100 · popularidade ao fim ${L.popularity}/100 · ${s.score ?? 0} pontos</div><div class="small">${rankLine}</div></div></div></div>
    <div style="max-width:760px;margin:10px auto;line-height:1.65">${L.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}
      ${L.marks.length ? `<h3>Marcos do governo</h3><ul class="small">${L.marks.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <div class="panel" style="border-left:5px solid ${L.dead ? '#555' : G.color};margin-top:10px"><h3 style="border:none;margin:0 0 4px">${L.dead ? 'Sepultamento e memória' : 'Memória'}</h3><p style="margin:0;font-style:italic">${esc(L.epitaph)}</p></div></div>
    <div class="panel" style="max-width:760px;margin:10px auto"><h3 style="border:none;margin:0 0 4px">Tentar a sorte</h3>
      ${info.allowed ? `<p class="small">Ainda não acabou: ${esc(n.leader)} está vivo e há quem queira vê-lo de volta. Um retorno é arriscado, e o apoio que você ainda tem pesa muito (${L.popularity}/100). Se der certo, você assume só uma parte pequena do território e pode tentar reconquistar o resto.</p><button class="primary" data-luck>Tentar a sorte</button>` : `<p class="small muted">${esc(info.reason || 'Não é possível tentar voltar ao poder.')}</p>`}</div>
    <div class="right" style="margin-top:10px"><button data-back>Voltar</button> <button class="primary" data-restart2>Nova partida</button></div>`, { wide: true });
  m.el.querySelector('[data-restart2]').onclick = () => { m.close(); restart(); };
  m.el.querySelector('[data-back]').onclick = () => showGameOver(game, restart);
  const luck = m.el.querySelector('[data-luck]');
  if (luck) luck.onclick = () => showComeback(game, restart);
}

function showComeback(game, restart) {
  const info = game.comebackInfo(), n = game.s.nation;
  const m = modal(`<h2>Tentar a sorte</h2><p style="line-height:1.6">${esc(info.intro)}</p>
    <p class="small muted">Sua popularidade (${info.popularity}/100) e suas alianças aumentam as chances; repressão e atrocidades diminuem. Se der certo, o país já não será o mesmo: você governará só uma parte dele.</p>
    <div class="right" data-act><button data-close>Aceitar o destino</button> <button class="primary" data-go>Arriscar</button></div>`);
  m.el.querySelector('[data-go]').onclick = () => {
    const r = game.tryComeback();
    const act = m.el.querySelector('[data-act]');
    m.el.querySelector('p').insertAdjacentHTML('afterend', `<p style="line-height:1.6;border-left:4px solid ${r.ok ? '#2e8b3e' : '#c0392b'};padding-left:10px"><b>${r.ok ? 'Deu certo!' : 'Fracassou.'}</b> ${esc(r.text)}</p>`);
    act.innerHTML = r.ok ? '<button class="primary" data-resume>Retomar o governo</button>' : '<button class="primary" data-again>Ver o legado</button>';
    const rs = act.querySelector('[data-resume]'); if (rs) rs.onclick = () => { m.close(); rerender(); };
    const ag = act.querySelector('[data-again]'); if (ag) ag.onclick = () => showLegacy(game, restart);
  };
}
