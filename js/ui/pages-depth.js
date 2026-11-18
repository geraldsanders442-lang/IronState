// Páginas novas: Ordem e êxodo, Propaganda e discursos, Regiões e vocações.
import { esc, num, bar, toast, modal } from './dom.js';
import { li } from './lucide.js';
import { rerender } from './app.js';
import { fmtDate } from '../sim/util.js';
import { ensureOrd, hazardOf, ARMED_KINDS, landBorder } from '../sim/order.js';
import { ensureProp, CHANNELS, GOALS, TONES, TOPICS, AUDIENCES, PROMISE_KINDS, promiseLabel, speechSuggestions } from '../sim/propaganda.js';
import { ensureVoc, VOC, tagsOf, TAG_AT } from '../sim/vocations.js';
import { BUILDINGS } from '../sim/markets.js';
import { mountNation, NATION_METRICS } from './mapviews.js';
import { stateKinds } from '../sim/kinds.js';

const KIND_NAME = { authoritarian: 'Autoritário', dystopia: 'Distopia', utopia: 'Utopia', taxhaven: 'Paraíso fiscal', failed: 'Estado falido', rich: 'País rico', poor: 'País pobre', lawless: 'Sem lei', kleptocracy: 'Cleptocracia', free: 'Sociedade livre' };
const tone = v => v > 66 ? 'bad' : v > 40 ? 'warn' : 'good';
const row = (label, v, cls, tip = '') => `<div class="row small" style="justify-content:space-between" title="${esc(tip)}"><span>${label}</span><span>${num(v, 0)}</span></div>${bar(v, cls)}`;
const HAZ_TXT = { cold: 'nevascas e frio', hot: 'calor e deserto', forest: 'florestas fechadas', mountain: 'montanhas e avalanches', river: 'rios e pântanos', plain: 'travessias abertas' };

// =============== Ordem e êxodo ===============
export function orderPage(el, game) {
  const s = game.s, data = game.data, o = ensureOrd(s), R = s.rights || {}, island = !landBorder(s, data), F = o.fled;
  const kinds = [...stateKinds(s)].map(k => KIND_NAME[k]).filter(Boolean);
  const G = (s.armed || []).filter(g => g.active), pk = s.peace || { level: 0, troops: 0 };
  const cd = k => Math.max(0, Math.ceil(((o.cd[k] || 0) - game.day) / 7));
  const dis = k => cd(k) ? `disabled title="Aguarde ${cd(k)} semana(s)"` : '';
  const bord = [['lax', 'Frouxa'], ['normal', 'Normal'], ['tight', 'Reforçada'], ['lethal', 'Ordem de atirar']];
  el.innerHTML = `<h2>${li('siren', 20)} Ordem e êxodo</h2>
    <div class="muted small" style="margin-bottom:8px">Crime, polícia, alienação política, fuga do país, grupos armados e a pressão internacional por crimes de guerra. ${kinds.length ? 'Seu Estado hoje: <b>' + kinds.join(', ') + '</b>.' : ''}</div>
    <div class="grid g3">
      <div class="panel"><h3>Criminalidade por tipo</h3>
        ${row('Furtos e roubos', o.crime.theft, tone(o.crime.theft))}${row('Crimes violentos', o.crime.violent, tone(o.crime.violent))}${row('Facções e tráfico', o.crime.gang, tone(o.crime.gang))}${row('Corrupção', o.crime.corrupt, tone(o.crime.corrupt))}${row('Violência de Estado', o.crime.state, tone(o.crime.state), 'Abusos policiais e da repressão.')}
        <h3 style="margin-top:8px">Polícia</h3>${row('Autonomia da polícia', o.police, o.police > 70 ? 'bad' : 'neutral', 'Alta: crime cai, abusos sobem, risco de golpe policial. Baixa: controle civil, mas crime solto.')}
        <div class="row" style="gap:4px;flex-wrap:wrap"><button class="small" data-op="policeReform" ${dis('pol')}>Reforma: controle civil</button><button class="small" data-op="policeFree" ${dis('pol')}>Dar liberdade à polícia</button></div></div>
      <div class="panel"><h3>Povo e base</h3>
        ${row('Alienação política', o.alien, 'neutral', 'Quanto mais alienado ou controlado, menos o povo quer fugir e mais patriota fica.')}${row('Patriotismo', o.patriot, 'good')}${row('Base aliada', o.base, 'good', 'Grupos leais ao governo: dão estabilidade e custam favores.')}
        <div class="small muted" style="margin:4px 0">Vontade de deixar o país: <b>${num(o.fleeRate, 2)}%</b> ao ano.</div>
        <div class="row" style="gap:4px;flex-wrap:wrap"><button class="small" data-op="baseFund" ${dis('base')}>${li('banknote', 14)} Favores à base (0,3 bi)</button><button class="small" data-op="baseMilitia" ${dis('base')}>${li('shield', 14)} Armar milícia aliada</button></div></div>
      <div class="panel"><h3>${li('route', 16)} Fuga do país</h3>
        <div class="small">${island ? 'País insular: saídas clandestinas por <b>barcos</b>.' : 'País continental: travessia de <b>fronteiras</b> (' + HAZ_TXT[hazardOf(s)] + ').'}</div>
        <table class="data"><tr><td>Saíram (clandestinos)</td><td class="num">${num(F.total, 0)}</td></tr><tr><td>Mortos na travessia</td><td class="num">${num(F.dead, 0)}</td></tr><tr><td>Presos tentando fugir</td><td class="num">${num(F.caught, 0)}</td></tr><tr><td>Emigração total registrada</td><td class="num">${num((R.emigrated || 0), 0)}</td></tr></table>
        <div class="small"><b>Política de fronteira</b></div><div class="row" style="gap:4px;flex-wrap:wrap">${bord.map(([k, n]) => `<button class="small ${o.border === k ? 'primary' : ''}" data-op="border" data-arg="${k}">${n}</button>`).join('')}</div>
        <div class="small muted">Fronteira dura reduz as fugas bem-sucedidas, mas aumenta mortes e violações.</div></div></div>
    <div class="panel" style="margin-top:8px"><h3>${li('skull', 16)} Grupos armados</h3>${G.length ? `<table class="data"><tr><th>Grupo</th><th>Tipo</th><th class="num">Poder</th><th class="num">Efetivo</th><th>Ação</th></tr>${G.map(g => `<tr><td>${esc(g.name)}</td><td class="small">${esc(ARMED_KINDS[g.kind][0])}</td><td class="num">${num(g.power, 0)}</td><td class="num">${num(g.size, 0)}</td><td>${[['negotiate', 'Negociar'], ['amnesty', 'Anistia'], ['crush', 'Reprimir'], ['coopt', 'Cooptar'], ['integrate', 'Integrar'], ['disarm', 'Desarmar']].map(([k, n]) => `<button class="small" data-op="armed" data-arg="${k}|${g.kind}">${n}</button>`).join(' ')}</td></tr>`).join('')}</table>` : '<p class="small muted">Nenhum grupo armado ativo. Separatismo, abusos, pobreza e uma base aliada radical podem criá-los.</p>'}</div>
    <div class="panel" style="margin-top:8px"><h3>${li('scale', 16)} Crimes de guerra e pressão internacional</h3>
      <div class="small">Índice de crimes de guerra: <b>${num(R.warCrimes || 0, 1)}</b> · Nível de pressão: <b>${['Nenhuma', 'Advertência', 'Ameaça de missão de paz', 'Tropas de paz e mandados'][pk.level] || 'Nenhuma'}</b>${pk.troops ? ` · Tropas de paz no país: <b>${pk.troops} mil</b>` : ''}</div>
      <div class="small muted">Crimes de guerra em excesso levam vizinhos e a ONU a advertir, enviar tropas de paz e tentar prender comandantes. Investigue ou julgue oficiais para reduzir o índice.</div></div>
    <div class="panel" style="margin-top:8px"><h3>Registro</h3><div class="log-list" style="max-height:160px">${o.log.length ? o.log.map(l => `<div><span class="muted small">${fmtDate(l.day)}</span> ${esc(l.text)}</div>`).join('') : '<span class="muted small">Sem registros.</span>'}</div></div>`;
  el.onclick = e => {
    const b = e.target.closest('[data-op]'); if (!b) return;
    const op = b.dataset.op; let arg = b.dataset.arg;
    if (op === 'armed') { const [k, kind] = arg.split('|'); arg = { op: k, kind }; }
    const r = game.orderAct(op, arg); toast(esc(r.msg || ''), r.ok ? 'good' : 'warn'); rerender();
  };
}

// =============== Propaganda e discursos ===============
const sp = { own: false, aud: ['nation'], topics: ['unity'], tone: 'calmo', promises: [], region: '' };
export function propagandaPage(el, game) {
  const s = game.s, P = ensureProp(s), d = game.day;
  const open = P.promises.filter(p => p.status === 'open'), done = P.promises.filter(p => p.status !== 'open').slice(-6).reverse();
  const cr = P.cred, regs = s.regions.filter(r => !r.cap);
  const filmWait = Math.max(0, (P.cd.film || 0) - d), festWait = Math.max(0, (P.cd.fest || 0) - d);
  el.innerHTML = `<h2>${li('megaphone', 20)} Propaganda e discursos</h2>
    <div class="muted small" style="margin-bottom:8px">Financie campanhas, filmes e canais de comunicação, ou fale diretamente a quem importa. Promessas não cumpridas custam credibilidade — e a imprensa vai cobrar.</div>
    <div class="grid g3">
      <div class="panel"><h3>Orçamento</h3>
        <label class="small">${num(P.pct, 2)}% do PIB por ano (≈ ${num(s.econ.gdp * P.pct / 100, 2)} bi) <input type="range" min="0" max="1.5" step="0.05" value="${P.pct}" data-pbud></label>
        ${row('Intensidade atual', P.level, 'neutral')}${row('Credibilidade', cr, cr > 55 ? 'good' : cr > 35 ? 'warn' : 'bad', 'Baixa credibilidade faz a propaganda sair pela culatra.')}
        <div class="small muted">Gasto acumulado: ${num(P.spent, 2)} bi · Filmes: ${P.films}</div>
        <div class="row" style="gap:4px;flex-wrap:wrap;margin-top:6px"><button class="small" data-pact="film" ${filmWait ? `disabled title="${filmWait} dias"` : ''}>${li('film', 14)} Produzir filme</button><button class="small" data-pact="festival" ${festWait ? `disabled title="${festWait} dias"` : ''}>${li('flag', 14)} Festival nacional</button></div></div>
      <div class="panel"><h3>Canais</h3>${Object.entries(CHANNELS).map(([k, [n, tip]]) => `<label class="small" title="${esc(tip)}">${esc(n)}: <b>${P.ch[k]}</b> <input type="range" min="0" max="100" step="5" value="${P.ch[k]}" data-pch="${k}"></label>`).join('')}</div>
      <div class="panel"><h3>Campanha</h3>
        <select data-pgoal>${Object.entries(GOALS).map(([k, [n]]) => `<option value="${k}" ${P.goal === k ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
        <div class="small muted" style="margin:3px 0">${esc(GOALS[P.goal][1])}</div>
        ${['unity', 'erase_nat'].includes(P.goal) ? `<select data-preg>${regs.map(r => `<option value="${r.id}" ${P.region === r.id ? 'selected' : ''}>${esc(r.name)} (sep. ${num((r.sep || 0) * 100, 0)})</option>`).join('')}</select>` : ''}
        <div class="small muted">A propaganda também pode ser usada para forçar a unidade nacional ou apagar nacionalismos regionais; força (polícia, exército) fica em Ordem e êxodo e Minorias e direitos.</div></div></div>
    <div class="panel" style="margin-top:8px"><div class="row" style="justify-content:space-between"><h3>${li('mic', 16)} Discursos</h3><button class="primary" data-speech>Fazer um discurso</button></div>
      ${P.speeches.length ? `<table class="data"><tr><th>Data</th><th>Público</th><th>Tom</th><th>Resultado</th></tr>${P.speeches.slice(0, 6).map(x => `<tr><td>${fmtDate(x.day)}</td><td class="small">${x.aud.map(a => AUDIENCES[a] || a).join(', ')}${x.region ? ' · ' + esc(s.regions.find(r => r.id === x.region)?.name || '') : ''}</td><td class="small">${TONES[x.tone]?.[0] || ''}${x.own ? ' (você)' : ''}</td><td class="small">${esc(x.grade)} (${x.avg >= 0 ? '+' : ''}${x.avg})</td></tr>`).join('')}</table>` : '<p class="small muted">Nenhum discurso ainda.</p>'}</div>
    <div class="panel" style="margin-top:8px"><h3>${li('clipboard', 16)} Promessas</h3>
      ${open.length ? open.map(p => `<div class="small">${li('hourglass', 13)} ${esc(promiseLabel(s, p))} — prometido em ${fmtDate(p.day)}, prazo ${fmtDate(p.due)}</div>`).join('') : '<p class="small muted">Nenhuma promessa em aberto.</p>'}
      ${done.length ? `<div class="small muted" style="margin-top:4px">Recentes: ${done.map(p => `${p.status === 'kept' ? '✔' : '✘'} ${esc(promiseLabel(s, p))}`).join(' · ')}</div>` : ''}</div>`;
  el.onchange = e => {
    const t = e.target;
    if (t.matches('[data-pbud]')) { game.propAct('budget', +t.value); rerender(); }
    else if (t.matches('[data-pch]')) { game.propAct('channel', [t.dataset.pch, +t.value]); }
    else if (t.matches('[data-pgoal],[data-preg]')) { const g = el.querySelector('[data-pgoal]').value, rg = el.querySelector('[data-preg]')?.value; game.propAct('goal', { goal: g, region: ['unity', 'erase_nat'].includes(g) ? rg || regs[0]?.id : null }); rerender(); }
  };
  el.onclick = e => {
    const a = e.target.closest('[data-pact]'); if (a) { const r = game.propAct(a.dataset.pact); toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender(); return; }
    if (e.target.closest('[data-speech]')) openSpeech(game);
  };
}

function openSpeech(game) {
  const s = game.s, sug = speechSuggestions(s), regs = s.regions.filter(r => !r.cap);
  const aud = Object.entries(AUDIENCES), tops = Object.entries(TOPICS);
  const m = modal(`<h3>${li('mic', 18)} Fazer um discurso</h3>
    <div class="small"><b>Discursos prontos do gabinete</b> (o gabinete indica o público e escreve o texto)</div>
    ${sug.map((x, i) => `<div class="panel" style="padding:6px;margin:4px 0"><div class="small"><b>${esc(x.who)}</b>: ${esc(x.why)}<br>Para ${x.aud.map(a => AUDIENCES[a]).join(', ')}${x.region ? ' (' + esc(s.regions.find(r => r.id === x.region)?.name || '') + ')' : ''} · tom ${TONES[x.tone][0].toLowerCase()} · ${x.topics.map(t => TOPICS[t][0]).join(', ')}</div><button class="small" data-prep="${i}">Fazer este discurso</button></div>`).join('')}
    <hr><label class="small"><input type="checkbox" data-own ${sp.own ? 'checked' : ''}> <b>Eu sei discursar</b> — monto o discurso (mais risco, mais recompensa)</label>
    <div data-custom ${sp.own ? '' : 'hidden'}>
      <div class="small"><b>Para quem</b></div><div class="row" style="flex-wrap:wrap;gap:6px">${aud.map(([k, n]) => `<label class="small"><input type="checkbox" data-aud="${k}" ${sp.aud.includes(k) ? 'checked' : ''}> ${n}</label>`).join('')}</div>
      <label class="small">Região-alvo: <select data-reg><option value="">—</option>${regs.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select></label>
      <div class="small"><b>Sobre o quê</b></div><div class="row" style="flex-wrap:wrap;gap:6px">${tops.map(([k, [n]]) => `<label class="small"><input type="checkbox" data-top="${k}" ${sp.topics.includes(k) ? 'checked' : ''}> ${n}</label>`).join('')}</div>
      <div class="small"><b>Tom</b></div><div class="row" style="flex-wrap:wrap;gap:6px">${Object.entries(TONES).map(([k, [n, tip]]) => `<label class="small" title="${esc(tip)}"><input type="radio" name="tone" data-tone="${k}" ${sp.tone === k ? 'checked' : ''}> ${n}</label>`).join('')}</div>
      <div class="small"><b>Promessas</b></div>
      <div class="row" style="flex-wrap:wrap;gap:4px"><select data-pk>${Object.entries(PROMISE_KINDS).map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select>
        <select data-pt>${Object.entries(BUILDINGS).map(([k, b]) => `<option value="${k}">${b.name}</option>`).join('')}</select>
        <select data-pr>${regs.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select><button class="small" data-padd>Prometer</button></div>
      <div class="small" data-plist>${sp.promises.map(p => esc(promiseLabel(s, p))).join(' · ') || '<span class="muted">sem promessas</span>'}</div>
      <div style="margin-top:8px"><button class="primary" data-go>Subir ao palanque</button></div></div>`, { wide: true });
  const root = m.el;
  const say = sugg => { const r = game.giveSpeech(sugg); m.close(); if (!r.ok) return toast(esc(r.msg), 'warn'); showResult(game, r.result); rerender(); };
  root.onclick = e => {
    const pr = e.target.closest('[data-prep]'); if (pr) return say({ ...sug[+pr.dataset.prep], own: false });
    if (e.target.closest('[data-padd]')) {
      const kind = root.querySelector('[data-pk]').value, p = { kind, type: kind === 'build' ? root.querySelector('[data-pt]').value : null, region: kind === 'build' ? root.querySelector('[data-pr]').value : null };
      sp.promises.push(p); root.querySelector('[data-plist]').innerHTML = sp.promises.map(x => esc(promiseLabel(s, x))).join(' · ');
    }
    if (e.target.closest('[data-go]')) say({ ...sp, region: root.querySelector('[data-reg]').value || null, own: true });
  };
  root.onchange = e => {
    const t = e.target;
    if (t.matches('[data-own]')) { sp.own = t.checked; root.querySelector('[data-custom]').hidden = !t.checked; }
    if (t.matches('[data-aud]')) { sp.aud = [...root.querySelectorAll('[data-aud]:checked')].map(x => x.dataset.aud); if (!sp.aud.length) sp.aud = ['nation']; }
    if (t.matches('[data-top]')) sp.topics = [...root.querySelectorAll('[data-top]:checked')].map(x => x.dataset.top);
    if (t.matches('[data-tone]')) sp.tone = t.dataset.tone;
  };
}
function showResult(game, r) {
  const mood = v => (v > 3.5 ? 'good' : v < -1 ? 'bad' : 'warn');
  modal(`<h3>${li('mic', 18)} ${esc(r.grade)}</h3><div class="small muted">Oratória: ${r.skill}/100 · reação média ${r.avg >= 0 ? '+' : ''}${r.avg.toFixed(1)}</div>
    <table class="data">${r.lines.map(l => `<tr><td>${esc(AUDIENCES[l.g] || l.g)}</td><td class="small">${esc(l.text)}</td><td class="num ${mood(l.delta)}">${l.delta >= 0 ? '+' : ''}${l.delta.toFixed(1)}</td></tr>`).join('')}</table>
    ${r.promises.length ? `<div class="small"><b>Promessas registradas:</b> ${r.promises.map(p => esc(promiseLabel(game.s, p))).join(' · ')}. Se não forem cumpridas, a imprensa vai cobrar.</div>` : ''}<div style="margin-top:8px"><button class="primary" data-close>Fechar</button></div>`);
}

// =============== Regiões e vocações ===============
let metric = 'voc_industrial';
export function regionsPage(el, game) {
  const s = game.s;
  for (const r of s.regions) ensureVoc(r, s);
  const mets = { voc_rural: 'Economia rural', voc_tech: 'Economia tecnológica', voc_industrial: 'Zona industrial', dev: 'Desenvolvimento', aut: 'Autonomia', sep: 'Separatismo' };
  el.innerHTML = `<h2>${li('map-pin', 20)} Regiões e vocações</h2>
    <div class="muted small" style="margin-bottom:8px">Cada região pode ter economia rural, tecnológica e industrial (todas, várias ou nenhuma, a partir de ${TAG_AT} pontos). As obras definem a vocação. Regiões separatistas que recebem obras e cuidado se desenvolvem e passam a exigir autonomia.</div>
    <div class="row" style="gap:4px;flex-wrap:wrap;margin-bottom:6px">${Object.entries(mets).map(([k, n]) => `<button class="small ${metric === k ? 'primary' : ''}" data-m="${k}">${n}</button>`).join('')}</div>
    <div class="grid" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1.4fr)"><div data-map></div>
    <div class="panel"><table class="data"><tr><th>Região</th><th>Vocações</th><th class="num">Desenv.</th><th class="num">Autonomia</th><th class="num">Tensão</th></tr>
      ${s.regions.map(r => `<tr><td>${esc(r.name)}${r.cap ? ' ★' : ''}</td><td class="small">${Object.entries(VOC).map(([k, [n, c, ic]]) => `<span title="${n}: ${num(r.voc[k], 0)}" style="color:${r.voc[k] >= TAG_AT ? c : 'var(--muted,#888)'};opacity:${r.voc[k] >= TAG_AT ? 1 : 0.55}">${li(ic, 14)}${num(r.voc[k], 0)}</span>`).join(' ')}</td><td class="num">${num(r.dev ?? 0, 0)}</td><td class="num">${num(r.aut ?? 0, 0)}</td><td class="num">${num(r.unrest, 0)}</td></tr>`).join('')}</table>
      <div class="small muted">${li('factory', 13)} indústria polui e emprega; ${li('cpu', 13)} tecnologia eleva educação e inovação; ${li('wheat', 13)} campo reduz a fome.</div></div></div>`;
  const box = el.querySelector('[data-map]');
  mountNation(box, game, metric.startsWith('voc_') || ['dev', 'aut', 'sep'].includes(metric) ? metric : 'region');
  el.onclick = e => { const b = e.target.closest('[data-m]'); if (b) { metric = b.dataset.m; regionsPage(el, game); } };
}
export { NATION_METRICS };

// =============== Chefe de gabinete (governo com autonomia) ===============
import { ensureChief, candidates, LEVELS, TRAITS, ALWAYS_PLAYER } from '../sim/chief.js';
export function chiefPage(el, game) {
  const s = game.s, C = ensureChief(s), data = game.data;
  const cats = [...new Set(data.issues.filter(i => !i.chain && i.cat).map(i => i.cat))].filter(c => !ALWAYS_PLAYER.has(c)).sort((a, b) => a.localeCompare(b, 'pt'));
  const cand = !C.chief ? candidates(s) : [];
  el.innerHTML = `<h2>${li('users', 20)} Chefe de gabinete</h2>
    <div class="muted small" style="margin-bottom:8px">Contrate um coordenador para governar por você: ele decide as questões de acordo com a sua ideologia, dentro dos limites que você impuser, e entrega um resumo. Crises, guerras e as linhas vermelhas continuam com você.</div>
    ${C.chief ? `<div class="grid g3"><div class="panel"><h3>${esc(C.chief.name)}</h3><div class="small">${TRAITS[C.chief.trait][0]} — ${TRAITS[C.chief.trait][1]}<br>Competência: <b>${C.chief.skill}</b> (quanto maior, menos erros)<br>Decisões tomadas: <b>${C.decided}</b></div><div style="margin-top:6px"><button class="small" data-co="fire">Demitir</button></div></div>
      <div class="panel"><h3>Nível de delegação</h3>${Object.entries(LEVELS).map(([k, [n, d]]) => `<label class="small" style="display:block;margin:3px 0"><input type="radio" name="lvl" data-lvl="${k}" ${C.level === k ? 'checked' : ''}> <b>${n}</b><br><span class="muted">${d}</span></label>`).join('')}</div>
      <div class="panel"><h3>Mais autonomia</h3><button class="small" data-co="mandates">Ministros seguem minha ideologia</button><div class="small muted" style="margin:3px 0 8px">Ajusta o mandato de cada ministério ao seu perfil ideológico.</div><button class="small" data-co="warauto">Guerras no automático</button><div class="small muted">Generais comandam as guerras em curso.</div></div></div>
      <div class="panel" style="margin-top:8px"><h3>Linhas vermelhas</h3><div class="small muted">Categorias que o chefe nunca decide por você:</div><div class="row" style="flex-wrap:wrap;gap:6px">${cats.map(c => `<label class="small"><input type="checkbox" data-red="${esc(c)}" ${C.redlines.includes(c) ? 'checked' : ''}> ${esc(c)}</label>`).join('')}</div></div>` :
      `<div class="panel"><h3>Candidatos</h3><div class="grid g3">${cand.map((c, i) => `<div class="panel" style="padding:8px"><b>${esc(c.name)}</b><div class="small">${TRAITS[c.trait][0]}: ${TRAITS[c.trait][1]}<br>Competência: <b>${c.skill}</b></div><button class="small primary" data-co="hire" data-i="${i}">Contratar</button></div>`).join('')}</div></div>`}
    <div class="panel" style="margin-top:8px"><h3>Resumo das decisões</h3>${C.digest.length ? `<table class="data"><tr><th>Quando</th><th>Questão</th><th>Decisão</th><th>Critério</th></tr>${C.digest.slice(0, 15).map(d => `<tr><td class="small">${fmtDate(d.day)}</td><td class="small">${esc(d.title)}</td><td class="small">${esc(d.text)}</td><td class="small muted">${esc(d.reason || 'estabilidade e resultados')}</td></tr>`).join('')}</table>` : '<p class="small muted">Nada decidido ainda.</p>'}</div>`;
  el.onclick = e => {
    const b = e.target.closest('[data-co]'); if (!b) return;
    const r = game.chiefAct(b.dataset.co, b.dataset.co === 'hire' ? +b.dataset.i : undefined); toast(esc(r.msg || ''), r.ok ? 'good' : 'warn'); rerender();
  };
  el.onchange = e => {
    if (e.target.matches('[data-lvl]')) { game.chiefAct('level', e.target.dataset.lvl); rerender(); }
    if (e.target.matches('[data-red]')) { game.chiefAct('redline', e.target.dataset.red); }
  };
}
