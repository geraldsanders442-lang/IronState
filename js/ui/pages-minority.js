// Página "Povos e minorias": grupos do país, polícia, políticas (proteger, assimilar, segregar, expulsar, exterminar) e consequências.
import { esc, num, bar, toast, modal } from './dom.js';
import { li } from './lucide.js';
import { rerender } from './app.js';
import { fmtDate } from '../sim/util.js';
import { ensureMin, STANCES, prejudice, favoredGroup } from '../sim/minority.js';
import { ensureOrd } from '../sim/order.js';

const KIND_NAME = { majority: 'maioria', ethnic: 'étnico', indigenous: 'indígena', african: 'afrodescendente', immigrant: 'imigrantes', religious: 'religioso', roma: 'roma', settler: 'minoria privilegiada' };
const tone = v => v > 66 ? 'bad' : v > 35 ? 'warn' : 'good';

export function ethnicPage(el, game) {
  const s = game.s, data = game.data, m = ensureMin(s, data), o = ensureOrd(s);
  const nameOf = id => data.reg?.[id]?.name || s.world.ents?.[id]?.name || id;
  const total = Math.max(1, s.econ.pop * 1e6);
  const rows = m.groups.map(g => {
    const isFav = g.id === m.favored, pr = prejudice(s, g), pct = g.pop / total * 100;
    const stance = Object.entries(STANCES).map(([k, v]) => `<button class="small ${g.stance === k ? (k === 'protect' ? 'primary' : 'bad') : ''}" data-op="stance" data-arg="${g.id}|${k}" title="${esc(v.desc)}" ${isFav ? 'disabled' : ''}>${v.short}</button>`).join('');
    const kin = g.kin.length ? `<div class="small muted">Simpatizantes: ${g.kin.map(k => `${esc(nameOf(k))} (${Math.round(s.partners[k]?.rel ?? 0)})`).join(', ')}</div>` : '';
    return `<div class="panel tight" style="margin:6px 0;${isFav ? 'border-left:5px solid #2c4170' : g.stance === 'exterminate' ? 'border-left:5px solid #7a1d12' : ''}">
      <div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${esc(g.name)}</b><span class="small">${isFav ? '<span class="tag blue">seu grupo</span> ' : ''}<span class="tag">${KIND_NAME[g.kind] || g.kind}</span> · ${num(pct, 1)}% · ${num(g.pop, 0)} pessoas</span></div>
      ${isFav ? '<div class="small muted">O governante se identifica com este grupo; a polícia e o Estado o favorecem.</div>' : `
      <div class="grid g3" style="margin-top:4px"><div><div class="small">Tensão <b>${num(g.tension, 0)}</b></div>${bar(g.tension, tone(g.tension))}</div><div><div class="small">Perseguição <b>${num(g.pers, 0)}</b></div>${bar(g.pers, tone(g.pers))}</div><div><div class="small">Proteção legal <b>${num(g.prot, 0)}</b></div>${bar(g.prot, g.prot > 50 ? 'good' : 'warn')}</div></div>
      <div class="small muted">Preconceito da sociedade e da polícia contra o grupo: ${num(pr * 100, 0)}%${g.dead ? ` · <b class="bad">${num(g.dead, 0)} mortos</b>` : ''}${g.expelled ? ` · ${num(g.expelled, 0)} expulsos` : ''}${g.fled ? ` · ${num(g.fled, 0)} fugiram` : ''}${g.armed ? ' · <b>milícia armada ativa</b>' : ''}</div>
      <div class="seg" style="margin-top:4px;flex-wrap:wrap">${stance}</div>`}
      ${kin}
      <div class="row" style="gap:6px;margin-top:4px"><button class="small" data-op="align" data-arg="${g.id}" ${isFav ? 'disabled' : ''}>Identificar-me com este grupo</button>${isFav ? '' : `<button class="small" data-op="seize" data-arg="${g.id}" ${g.seized ? 'disabled' : ''}>Confiscar bens e terras</button>`}</div></div>`;
  }).join('');
  const kins = [...new Set(m.groups.flatMap(g => g.kin))].filter(k => s.partners[k]);
  el.innerHTML = `<h2>${li('users', 20)} Povos e minorias</h2>
    <div class="muted small" style="margin-bottom:8px">Cada país tem grupos étnicos, religiosos ou de imigrantes. Com a polícia autônoma demais, as minorias sofrem batidas e violência — isso agrada a maioria e dá estabilidade a curto prazo, mas gera protestos, milícias, êxodo, sanções e até guerra com os países que as apoiam. Você pode, em vez disso, proteger as minorias… ou se identificar com uma delas e se voltar contra a antiga maioria.</div>
    ${m.genocide ? `<div class="panel" style="border-left:6px solid #7a1d12;background:#fbeeea"><b>${li('skull', 16)} Genocídio em curso.</b> ${num(m.killed, 0)} mortos. O Tribunal Penal Internacional, a ONU e países simpatizantes agem contra o governo; o risco de prisão, sanções e guerra é máximo.</div>` : ''}
    <div class="grid g3">
      <div class="panel"><h3>Polícia</h3><div class="small">Autonomia da polícia: <b>${num(o.police, 0)}</b>/100</div>${bar(o.police, o.police > 65 ? 'bad' : 'neutral')}
        <div class="small muted">Acima de ~50, a polícia passa a perseguir grupos hostilizados pela sociedade, sem ordem do governo.</div>
        <button class="small" data-op="reformPolice" style="margin-top:4px">Reformar a polícia (controle civil)</button></div>
      <div class="panel"><h3>Balanço</h3><table class="data"><tr><td>Mortos</td><td class="num">${num(m.killed, 0)}</td></tr><tr><td>Expulsos</td><td class="num">${num(m.expelled, 0)}</td></tr><tr><td>Fugiram</td><td class="num">${num(m.fled, 0)}</td></tr><tr><td>Indignação internacional</td><td class="num">${num(m.outrage, 0)}/100</td></tr></table></div>
      <div class="panel"><h3>Países simpatizantes</h3>${kins.length ? kins.map(k => `<div class="row small" style="justify-content:space-between"><span>${esc(nameOf(k))}</span><span class="${(s.partners[k].rel) < -20 ? 'bad' : ''}">relação ${Math.round(s.partners[k].rel)}</span></div>`).join('') : '<span class="muted small">Nenhum país tem laços fortes com os grupos daqui.</span>'}
        <div class="small muted" style="margin-top:4px">Violência real contra um grupo pode levar estes países à guerra.</div></div></div>
    <div class="panel" style="margin-top:8px"><h3>Grupos do país</h3>${rows}</div>
    <div class="panel" style="margin-top:8px"><h3>Registro</h3><div class="log-list" style="max-height:160px">${m.log.length ? m.log.map(l => `<div><span class="muted small">${fmtDate(l.day)}</span> ${esc(l.text)}</div>`).join('') : '<span class="muted small">Nada registrado.</span>'}</div></div>
    <div class="small muted" style="margin-top:6px">Os percentuais de cada grupo são aproximações de censos e do CIA World Factbook, arredondadas.</div>`;
  el.onclick = e => {
    const b = e.target.closest('[data-op]'); if (!b || b.disabled) return;
    const op = b.dataset.op, arg = b.dataset.arg;
    const run = () => { const r = game.minAct(op, arg); toast(esc(r.msg || ''), r.ok ? 'good' : 'warn'); rerender(); };
    if (op === 'stance' && /\|(expel|exterminate)$/.test(arg)) {
      const x = arg.endsWith('exterminate'), g = m.groups.find(y => y.id === arg.split('|')[0]);
      const mm = modal(`<h3>${x ? 'Ordenar o extermínio' : 'Ordenar a expulsão'} dos ${esc(g.noun)}?</h3><p>${x ? 'Isto é genocídio: crime internacional máximo. O Tribunal Penal Internacional, sanções e uma intervenção armada são prováveis, e você pode ser preso ou capturado.' : 'A expulsão cria uma crise de refugiados, sanções e risco de guerra com os países simpatizantes.'}</p><div class="row" style="gap:8px"><button class="primary" data-ok>Confirmar</button><button data-close>Cancelar</button></div>`);
      mm.el.querySelector('[data-ok]').onclick = () => { mm.close(); run(); }; return;
    }
    run();
  };
}
