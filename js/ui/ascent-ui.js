// Painel do movimento (modo Alcance o poder): recursos, rotas ao poder, ações, facções, propaganda e discursos.
import { esc, num, bar, toast, modal } from './dom.js';
import { li } from './lucide.js';
import { rerender } from './app.js';
import { fmtDate } from '../sim/util.js';
import { ACTIONS, FACS, ORIGINS, MAX_WEEK, routeInfo, regimeStr } from '../sim/ascent2.js';
import { TONES, TOPICS, PROMISE_KINDS } from '../sim/propaganda.js';

const sp = { own: false, aud: ['unions'], topics: ['economy'], tone: 'calmo', promises: [] };
const meter = (label, v, cls, tip = '') => `<div class="row small" style="justify-content:space-between" title="${esc(tip)}"><span>${label}</span><b>${num(v, 0)}</b></div>${bar(v, cls)}`;

export function ascentHub(main, game) {
  const s = game.s, A = s.ascent, n = s.nation, R = routeInfo(s), reg = regimeStr(s), d = game.day;
  const cd = k => Math.max(0, Math.ceil(((A.cd[k] || 0) - d) / 7));
  main.innerHTML = `<h2>${li('flag', 20)} O movimento — semana ${A.week} de ${MAX_WEEK}</h2>
    <div class="muted small" style="margin-bottom:8px">Você lidera a oposição em <b>${esc(n.shortName)}</b> (${esc(ORIGINS[A.origin][0])}). Orçamento, leis e forças armadas ainda estão com o governo. Cada semana você tem pontos de ação para jogar; depois chega um evento. Chegue ao poder por eleição, golpe ou insurreição antes da semana ${MAX_WEEK}.</div>
    <div class="grid g3">
      <div class="panel"><h3>Movimento</h3>${meter('Apoio popular', A.support, 'good')}${meter('Força nas ruas', A.force, 'warn')}${meter('Dinheiro', A.money, 'neutral')}${meter('Credibilidade', A.cred, A.cred > 45 ? 'good' : 'warn', 'Baixa credibilidade enfraquece a propaganda e as rotas.')}${meter('Pressão do regime', A.heat, A.heat > 50 ? 'bad' : 'warn', 'Chance de repressão a cada semana.')}
        <div class="small" style="margin-top:4px">Pontos de ação: <b>${A.ap}</b> · Força do regime: <b>${num(reg, 0)}</b></div></div>
      <div class="panel"><h3>Rotas ao poder</h3>${Object.entries(R).map(([k, r]) => `<div class="small" style="margin-bottom:5px"><b>${r.name}</b> — chance <b>${num(r.p * 100, 0)}%</b><br><span class="muted">Requisito: ${r.need}. ${esc(r.risk)}</span><br><button class="small ${r.ok ? 'primary' : ''}" data-route="${k}" ${r.ok ? '' : 'disabled'}>${r.ok ? 'Tentar' : 'Indisponível'}</button></div>`).join('')}</div>
      <div class="panel"><h3>${li('megaphone', 16)} Propaganda</h3>
        <label class="small">Orçamento: <b>${num(A.prop.pct, 1)}</b> por semana <input type="range" min="0" max="3" step="0.5" value="${A.prop.pct}" data-bud></label>
        ${meter('Alcance atual', A.prop.level, 'neutral')}<div class="small muted">Orçamento reduzido: sai do seu caixa. A credibilidade multiplica o efeito.</div>
        <div style="margin-top:6px"><button class="primary" data-speech ${A.ap < 1 ? 'disabled' : ''}>${li('mic', 14)} Fazer um discurso (1 ação)</button></div>
        <div class="small muted" style="margin-top:4px">${A.promises.length ? 'Promessas feitas: ' + A.promises.length + ' (valerão no governo).' : 'Nenhuma promessa ainda.'}</div></div></div>
    <div class="panel" style="margin-top:8px"><h3>Ações da semana</h3><div class="row" style="flex-wrap:wrap;gap:4px">${Object.entries(ACTIONS).map(([k, a]) => `<button class="small" data-act="${k}" title="${esc(a.desc)}" ${A.ap < 1 || cd(k) ? 'disabled' : ''}>${li(a.icon, 14)} ${esc(a.name)}${cd(k) ? ` (${cd(k)} sem.)` : ''}</button>`).join('')}</div>
      <div class="small muted" style="margin-top:4px">Passe o mouse sobre cada ação para ver o efeito. Pontos acabaram? Avance a semana (Questões → resolver o evento).</div></div>
    <div class="panel" style="margin-top:8px"><h3>Facções e alianças</h3><table class="data"><tr><th>Facção</th><th>Lealdade</th><th>O que dá</th><th></th></tr>${Object.entries(FACS).map(([k, [name, , ic, tip]]) => `<tr><td>${li(ic, 14)} ${name}</td><td style="min-width:120px">${bar(A.fac[k].loy, A.fac[k].loy > 50 ? 'good' : 'warn')}</td><td class="small muted">${tip}</td><td><button class="small" data-court="${k}" ${A.ap < 1 || A.money < 3 ? 'disabled' : ''}>Cortejar (3)</button></td></tr>`).join('')}</table></div>
    <div class="panel" style="margin-top:8px"><h3>Registro</h3><div class="log-list" style="max-height:130px">${A.log.length ? A.log.map(l => `<div><span class="muted small">${fmtDate(l.day)}</span> ${esc(l.text)}</div>`).join('') : '<span class="muted small">Sem registros.</span>'}</div>
      <button style="margin-top:6px" data-goissues>Abrir o evento da semana</button></div>`;
  main.onchange = e => { if (e.target.matches('[data-bud]')) { game.ascAct('budget', +e.target.value); rerender(); } };
  main.onclick = e => {
    const t = e.target, say = r => { if (r.msg) toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender(); };
    const a = t.closest('[data-act]'); if (a) return say(game.ascAct(a.dataset.act));
    const c = t.closest('[data-court]'); if (c) return say(game.ascAct('court:' + c.dataset.court));
    const r = t.closest('[data-route]'); if (r && confirm(`${R[r.dataset.route].name}? Chance de sucesso: ${num(R[r.dataset.route].p * 100, 0)}%. ${R[r.dataset.route].risk}`)) { const res = game.ascAct('route', r.dataset.route); say(res); return; }
    if (t.closest('[data-speech]')) return openSpeech(game);
    if (t.closest('[data-goissues]')) import('./app.js').then(m => m.go('issues'));
  };
}

function openSpeech(game) {
  const m = modal(`<h3>${li('mic', 18)} Discurso do movimento</h3>
    <label class="small"><input type="checkbox" data-own ${sp.own ? 'checked' : ''}> <b>Eu sei discursar</b> — monto o discurso (mais risco e recompensa); desmarcado, o comitê escreve um discurso seguro.</label>
    <div class="small"><b>Para quem</b></div><div class="row" style="flex-wrap:wrap;gap:6px">${Object.entries(FACS).map(([k, f]) => `<label class="small"><input type="checkbox" data-aud="${k}" ${sp.aud.includes(k) ? 'checked' : ''}> ${f[0]}</label>`).join('')}</div>
    <div class="small"><b>Sobre o quê</b></div><div class="row" style="flex-wrap:wrap;gap:6px">${['economy', 'taxes', 'security', 'education', 'rights', 'defense', 'land', 'welfare', 'dialogue'].map(k => `<label class="small"><input type="checkbox" data-top="${k}" ${sp.topics.includes(k) ? 'checked' : ''}> ${TOPICS[k][0]}</label>`).join('')}</div>
    <div class="small"><b>Tom</b></div><div class="row" style="flex-wrap:wrap;gap:6px">${Object.entries(TONES).map(([k, [n, tip]]) => `<label class="small" title="${esc(tip)}"><input type="radio" name="tone" data-tone="${k}" ${sp.tone === k ? 'checked' : ''}> ${n}</label>`).join('')}</div>
    <div class="small"><b>Promessas</b> (valerão quando você governar)</div><div class="row" style="gap:4px"><select data-pk>${['taxcut', 'jobs', 'security', 'peace', 'rights', 'wage'].map(k => `<option value="${k}">${PROMISE_KINDS[k]}</option>`).join('')}</select><button class="small" data-padd>Prometer</button></div>
    <div class="small" data-plist>${sp.promises.map(p => PROMISE_KINDS[p.kind]).join(' · ') || '<span class="muted">sem promessas</span>'}</div>
    <div style="margin-top:8px"><button class="primary" data-go>Subir ao palanque</button> <button data-close>Cancelar</button></div>`, { wide: true });
  const root = m.el;
  root.onchange = e => {
    const t = e.target;
    if (t.matches('[data-own]')) sp.own = t.checked;
    if (t.matches('[data-aud]')) { sp.aud = [...root.querySelectorAll('[data-aud]:checked')].map(x => x.dataset.aud); if (!sp.aud.length) sp.aud = ['unions']; }
    if (t.matches('[data-top]')) sp.topics = [...root.querySelectorAll('[data-top]:checked')].map(x => x.dataset.top);
    if (t.matches('[data-tone]')) sp.tone = t.dataset.tone;
  };
  root.onclick = e => {
    if (e.target.closest('[data-padd]')) { sp.promises.push({ kind: root.querySelector('[data-pk]').value }); root.querySelector('[data-plist]').textContent = sp.promises.map(p => PROMISE_KINDS[p.kind]).join(' · '); }
    if (e.target.closest('[data-go]')) {
      const r = game.ascAct('speech', { ...sp, promises: [...sp.promises] }); m.close();
      if (!r.ok) return toast(esc(r.msg), 'warn');
      sp.promises = [];
      modal(`<h3>${li('mic', 18)} ${esc(r.result.grade)}</h3><div class="small muted">Oratória ${r.result.skill}/100 · reação média ${r.result.avg >= 0 ? '+' : ''}${r.result.avg.toFixed(1)}</div><table class="data">${r.result.lines.map(l => `<tr><td>${esc(FACS[l.g][0])}</td><td class="small">${esc(l.text)}</td><td class="num">${l.delta >= 0 ? '+' : ''}${l.delta.toFixed(1)}</td></tr>`).join('')}</table><div style="margin-top:8px"><button class="primary" data-close>Fechar</button></div>`);
      rerender();
    }
  };
}
