// Enciclopédia (indicadores, mecânicas, busca de questões) e Editor de conteúdo / mods.
import { $, esc, toast, modal } from './dom.js';
import { STAT_INFO, GROUPS } from '../sim/constants.js';
import { fmtDate } from '../sim/util.js';
import { rerender } from './app.js';

const MECH = [
  ['Turnos e questões', 'Cada semana traz o jornal e novas questões. Opções mudam indicadores na hora, criam tendências duradouras, alteram leis, relações e podem gerar desdobramentos. Sem decisão até o prazo, vale a opção padrão (ou o governo parece omisso).'],
  ['Economia', 'O PIB cresce com produtividade, estabilidade, educação e comércio; cai com corrupção, impostos altos, sanções, guerra e escassez. Setores (alimentos, energia, matérias-primas, indústria, tecnologia, serviços) produzem e consomem; o que falta é importado até o limite, e o resto vira escassez.'],
  ['Orçamento e sucateamento', 'Cada área tem um gasto mínimo que cresce com o desenvolvimento. Abaixo dele os serviços se deterioram e surgem crises. Cortes de mais de 0,5 ponto do PIB numa semana provocam greves.'],
  ['Programas e obras', 'Programas econômicos são atalhos com custo e efeito colateral (até 2 ao mesmo tempo). Obras são construídas em províncias e mudam a região e o país.'],
  ['Mercados e câmbio', 'Commodities oscilam e sofrem choques; exportadores ganham com alta, importadores perdem. O regime cambial muda inflação, competitividade e o risco de crise de reservas.'],
  ['Política', 'Partidos disputam votos conforme a satisfação dos grupos. Sem maioria, leis podem ser rejeitadas. Facções do regime exigem coisas e, insatisfeitas, alimentam golpes. Ministros têm competência, lealdade e corrupção.'],
  ['Golpes, revoluções e guerra civil', 'Quando um golpe ou revolução começa, há 4 semanas de crise jogável. Se nenhum lado vence, o país racha e começa uma guerra civil pela reunificação.'],
  ['Governante', 'Envelhece, adoece e morre. Com herdeiro preparado (ou no modo Dinastia), a partida continua com o sucessor.'],
  ['Diplomacia e memória', 'Cada líder estrangeiro tem traços e lembra do que você fez (invasões, sanções, ajuda, votos na ONU). Cúpulas permitem trocar concessões.'],
  ['Operações secretas e espionagem', 'Financiar partidos afins, milícias, enviar armas, infiltrar espiões, roubar tecnologia, sabotar. Tudo tem risco de descoberta.'],
  ['Guerra', 'Placar de guerra, frentes por província, corpos de exército com generais, superioridade aérea e naval. Vitória abre a conferência de paz no mapa.'],
  ['Armas nucleares', 'Programas secretos, testes, dissuasão, ameaças. Um ataque nuclear mata parte da população, pode matar o governante na capital e abre 3 semanas de crise.'],
  ['Mundo vivo', 'Outros países fazem eleições, sofrem golpes e revoluções; a tensão mundial sobe com guerras e armas; crises globais (pandemia, crash, clima) atingem todos.'],
  ['Pesquisa', 'Pontos semanais vindos de educação, tecnologia e universidades desbloqueiam tecnologias em três eras.'],
  ['Modos de jogo', 'Sandbox, Ironman, Dinastia, Desafios, Desafio diário (mesma semente para todos), Roguelite (temporadas com legado) e Ascensão ao poder.'],
];

const enc = { q: '', tab: 'stats' };
export function encyclopediaPage(el, game) {
  const s = game.s, data = game.data, q = enc.q.toLowerCase();
  const match = t => !q || String(t).toLowerCase().includes(q);
  const tabs = [['stats', 'Indicadores'], ['mech', 'Mecânicas'], ['issues', 'Catálogo de questões'], ['mine', 'Minhas decisões']];
  let body = '';
  if (enc.tab === 'stats') body = `<table class="data">${Object.entries(STAT_INFO).filter(([k, i]) => match(i[0] + i[2])).map(([k, i]) => `<tr><td><b>${esc(i[0])}</b> <span class="muted small">${esc(i[1])}</span></td><td class="small">${esc(i[2])}</td></tr>`).join('')}${Object.values(GROUPS).filter(g => match(g.name + g.wants)).map(g => `<tr><td><b>${esc(g.name)}</b> <span class="muted small">grupo</span></td><td class="small">Querem: ${esc(g.wants)}</td></tr>`).join('')}</table>`;
  if (enc.tab === 'mech') body = MECH.filter(([t, d]) => match(t + d)).map(([t, d]) => `<div class="mission"><b>${esc(t)}</b><div class="small">${esc(d)}</div></div>`).join('');
  if (enc.tab === 'issues') { const list = data.issues.filter(i => !i.chain && match(i.title + ' ' + i.cat + ' ' + (i.desc || ''))); body = `<div class="small muted">${list.length} questões encontradas${q ? '' : ' (digite para filtrar)'}.</div><table class="data">${list.slice(0, 200).map(i => `<tr><td class="small"><span class="tag blue">${esc(i.cat)}</span></td><td><b>${esc(i.title.replace(/\{[a-zA-Z0-9]+\}/g, '…'))}</b><div class="small muted">${esc((i.desc || '').replace(/\{[a-zA-Z0-9]+\}/g, '…').slice(0, 160))}</div></td><td class="small">${s.issues.last[i.id] != null ? 'vista em ' + fmtDate(s.issues.last[i.id]) : '<span class="muted">ainda não</span>'}</td></tr>`).join('')}</table>`; }
  if (enc.tab === 'mine') { const list = s.decisions.slice().reverse().filter(d => match(d.title + d.text)); body = `<table class="data">${list.slice(0, 200).map(d => `<tr><td class="small">${fmtDate(d.day)}</td><td><b>${esc(d.title)}</b>${d.auto ? ' <span class="tag">gabinete</span>' : ''}<div class="small">${esc(d.text)}</div></td></tr>`).join('') || '<tr><td class="muted">Nada encontrado.</td></tr>'}</table>`; }
  el.innerHTML = `<h2>Enciclopédia</h2><div class="panel row" style="gap:8px"><input data-encq placeholder="Buscar…" value="${esc(enc.q)}" style="flex:1"><div class="seg">${tabs.map(([k, n]) => `<button data-enct="${k}" class="${enc.tab === k ? 'on' : ''}">${n}</button>`).join('')}</div></div><div class="panel">${body}</div>`;
  el.onclick = e => { const t = e.target.closest('[data-enct]'); if (t) { enc.tab = t.dataset.enct; encyclopediaPage(el, game); } };
  el.oninput = e => { if (e.target.matches('[data-encq]')) { enc.q = e.target.value; const pos = e.target.selectionStart; encyclopediaPage(el, game); const i = $('[data-encq]', el); i.focus(); i.setSelectionRange(pos, pos); } };
}

// ---------- Editor de conteúdo / mods ----------
export const MODS_KEY = 'ironstate.mods';
export function loadMods(storage = globalThis.localStorage) { try { return JSON.parse(storage?.getItem(MODS_KEY) || 'null') || { issues: [] }; } catch { return { issues: [] }; } }
function saveMods(m) { try { localStorage.setItem(MODS_KEY, JSON.stringify(m)); } catch {} }
const NUMKEYS = ['treasury', 'legitimacy', 'stability', 'reputation', 'civil', 'political', 'protest', 'corruption', 'health', 'education', 'growth', 'inflation'];
const GKEYS = Object.keys(GROUPS);
export function validateIssue(x) {
  const errs = [];
  if (!x.id || !/^[a-z0-9_]+$/.test(x.id)) errs.push('id: só letras minúsculas, números e _');
  if (!x.title) errs.push('título obrigatório');
  if (!x.desc) errs.push('descrição obrigatória');
  if (!Array.isArray(x.options) || x.options.length < 2 || x.options.length > 5) errs.push('2 a 5 opções');
  for (const o of x.options || []) { if (!o.text) errs.push('opção sem texto'); for (const k in o.now || {}) if (!NUMKEYS.includes(k) && !(k in STAT_INFO)) errs.push('efeito desconhecido: ' + k); for (const g in o.groups || {}) if (!GKEYS.includes(g)) errs.push('grupo desconhecido: ' + g); }
  return errs;
}
const ed = { draft: null };
const blankDraft = () => ({ id: 'mod_' + Math.random().toString(36).slice(2, 7), cat: 'Mod', title: '', desc: '', context: '', options: [{ text: '', hint: '', now: {}, groups: {} }, { text: '', hint: '', now: {}, groups: {} }] });
export function editorPage(el, game) {
  const mods = loadMods();
  ed.draft ||= blankDraft();
  const D = ed.draft;
  const effRow = (o, i) => `<div class="small">${NUMKEYS.map(k => `<label style="display:inline-block;margin:2px 6px 2px 0">${esc(STAT_INFO[k]?.[0] || k)} <input type="number" step="1" style="width:52px" data-eff="${i}|now|${k}" value="${o.now[k] ?? ''}"></label>`).join('')}</div>
    <div class="small">${GKEYS.map(g => `<label style="display:inline-block;margin:2px 6px 2px 0">${esc(GROUPS[g].name)} <input type="number" step="1" style="width:52px" data-eff="${i}|groups|${g}" value="${o.groups[g] ?? ''}"></label>`).join('')}</div>`;
  el.innerHTML = `<h2>Editor de conteúdo e mods</h2><div class="grid g2"><div class="panel"><h3>Nova questão</h3>
      <div class="form-grid" style="grid-template-columns:110px 1fr"><label>Identificador</label><input data-f="id" value="${esc(D.id)}"><label>Categoria</label><input data-f="cat" value="${esc(D.cat)}"><label>Título</label><input data-f="title" value="${esc(D.title)}"><label>Descrição</label><textarea data-f="desc" rows="3">${esc(D.desc)}</textarea><label>Contexto</label><input data-f="context" value="${esc(D.context)}"></div>
      ${D.options.map((o, i) => `<div class="panel tight" style="margin-top:6px"><b>Opção ${i + 1}</b> ${D.options.length > 2 ? `<button class="small danger" data-delopt="${i}">remover</button>` : ''}<div class="form-grid" style="grid-template-columns:110px 1fr"><label>Texto</label><input data-o="${i}|text" value="${esc(o.text)}"><label>Dica</label><input data-o="${i}|hint" value="${esc(o.hint)}"></div>${effRow(o, i)}</div>`).join('')}
      <div class="row" style="margin-top:6px">${D.options.length < 5 ? '<button class="small" data-addopt>+ opção</button>' : ''}<button class="primary" data-savemod>Salvar no mod</button><button class="small" data-newmod>Limpar</button></div>
      <p class="small muted">Use {nation}, {capital}, {leader} e {person} no texto para nomes da sua partida. Questões de mod entram no sorteio normal das próximas semanas (recarregue o jogo).</p></div>
    <div class="panel"><h3>Meu mod (${mods.issues.length} questões)</h3><table class="data">${mods.issues.map((x, i) => `<tr><td><b>${esc(x.title)}</b><div class="small muted">${esc(x.id)} · ${x.options.length} opções</div></td><td><button class="small" data-editmod="${i}">Editar</button> <button class="small danger" data-rmmod="${i}">Apagar</button></td></tr>`).join('') || '<tr><td class="muted small">Vazio.</td></tr>'}</table>
      <div class="row" style="margin-top:6px"><button data-expmod>Exportar mod (.json)</button><button data-impmod>Importar mod</button></div>
      <p class="small muted">Mods são arquivos JSON com uma lista de questões no mesmo formato do jogo (data/issues*.json). Compartilhe o arquivo exportado; quem importar recebe as questões.</p></div></div>`;
  const setVal = (t) => {
    if (t.dataset.f) D[t.dataset.f] = t.value;
    if (t.dataset.o) { const [i, k] = t.dataset.o.split('|'); D.options[+i][k] = t.value; }
    if (t.dataset.eff) { const [i, kind, k] = t.dataset.eff.split('|'); const v = t.value === '' ? null : +t.value; if (v == null || isNaN(v)) delete D.options[+i][kind][k]; else D.options[+i][kind][k] = v; }
  };
  el.oninput = e => setVal(e.target);
  el.onclick = e => {
    if (e.target.closest('[data-addopt]')) { D.options.push({ text: '', hint: '', now: {}, groups: {} }); return editorPage(el, game); }
    const d = e.target.closest('[data-delopt]'); if (d) { D.options.splice(+d.dataset.delopt, 1); return editorPage(el, game); }
    if (e.target.closest('[data-newmod]')) { ed.draft = blankDraft(); return editorPage(el, game); }
    if (e.target.closest('[data-savemod]')) {
      const x = JSON.parse(JSON.stringify(D)); for (const o of x.options) { if (!Object.keys(o.now).length) delete o.now; if (!Object.keys(o.groups).length) delete o.groups; }
      const errs = validateIssue(x); if (errs.length) return toast(esc(errs.join(' · ')), 'warn');
      const i = mods.issues.findIndex(y => y.id === x.id); if (i >= 0) mods.issues[i] = x; else mods.issues.push(x);
      saveMods(mods); ed.draft = blankDraft(); toast('Questão salva no mod. Ela entra no jogo ao recarregar.', 'good'); return editorPage(el, game);
    }
    const em = e.target.closest('[data-editmod]'); if (em) { const x = mods.issues[+em.dataset.editmod]; ed.draft = { ...x, options: x.options.map(o => ({ now: {}, groups: {}, ...o })) }; return editorPage(el, game); }
    const rm = e.target.closest('[data-rmmod]'); if (rm && confirm('Apagar esta questão do mod?')) { mods.issues.splice(+rm.dataset.rmmod, 1); saveMods(mods); return editorPage(el, game); }
    if (e.target.closest('[data-expmod]')) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(mods, null, 1)], { type: 'application/json' })); a.download = 'ironstate-mod.json'; a.click(); }
    if (e.target.closest('[data-impmod]')) {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json';
      inp.onchange = async () => { try { const m = JSON.parse(await inp.files[0].text()); const list = Array.isArray(m) ? m : m.issues || []; const ok = list.filter(x => !validateIssue(x).length); for (const x of ok) { const i = mods.issues.findIndex(y => y.id === x.id); if (i >= 0) mods.issues[i] = x; else mods.issues.push(x); } saveMods(mods); toast(`${ok.length} questão(ões) importada(s)${list.length > ok.length ? `; ${list.length - ok.length} inválida(s) ignorada(s)` : ''}.`, 'good'); editorPage(el, game); } catch { toast('Arquivo inválido.', 'bad'); } };
      inp.click();
    }
  };
}
