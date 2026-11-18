// Editor da camada de macro-regiões no mapa-múndi.
import { esc, num, toast } from './dom.js';
import { PLY, ownerOf } from '../sim/world.js';
import { entName } from '../sim/war.js';
import { macroControl, presetProvs, subregions, MACRO_COLORS } from '../sim/macros.js';

export const MACRO_LEGEND = [['#ffd54a', 'Seleção em edição'], ['#e76f51', 'Macro-regiões suas (cada uma com sua cor)'], ['#efe3b4', 'Seu território fora de macro-regiões'], ['#e4e1d6', 'Resto do mundo']];

export function macroClick(game, own, pid, redraw) {
  const D = game._macroDraft;
  if (!D || !pid) return;
  const P = game.data.geo.prov;
  const ids = D.byCountry ? Object.keys(P).filter(p => P[p].a3 === P[pid].a3) : [pid];
  const all = ids.every(p => D.provs.has(p));
  for (const p of ids) all ? D.provs.delete(p) : D.provs.add(p);
  redraw();
}

export function macroPanel(info, game, mapInst, redraw) {
  const s = game.s, data = game.data, list = game.macros(), D = game._macroDraft;
  const owners = m => { const c = macroControl(s, data, m); return Object.entries(c.by).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, v]) => `${esc(id === PLY ? s.nation.shortName : entName(s, data, id))} ${Math.round(v * 100)}%`).join(' · '); };
  const draftHTML = D ? `<div class="panel tight" style="border:2px solid #e7b730;margin:6px 0"><b>${D.id ? 'Editando' : 'Nova macro-região'}</b>
      <div class="row" style="gap:6px;margin:4px 0"><input data-mname value="${esc(D.name)}" placeholder="Nome (ex.: Cinturão do Petróleo)" style="flex:1"> </div>
      <div class="row" style="gap:3px;margin:4px 0">${MACRO_COLORS.map(c => `<button data-mcolor="${c}" style="width:20px;height:20px;border-radius:50%;border:${D.color === c ? '3px solid #111' : '1px solid #888'};background:${c};padding:0"></button>`).join('')}</div>
      <div class="small"><label><input type="checkbox" data-mbycountry ${D.byCountry ? 'checked' : ''}> clique seleciona o <b>país inteiro</b></label></div>
      <div class="small" style="margin:4px 0">Adicionar:
        <select data-mpreset><option value="">— região geopolítica —</option>${subregions().map(([k, n]) => `<option value="wr|${k}">${esc(n)}</option>`).join('')}</select></div>
      <div class="small"><b>${D.provs.size}</b> províncias: ${[...D.provs].slice(0, 6).map(p => esc(data.geo.prov[p].n)).join(', ')}${D.provs.size > 6 ? '…' : ''}</div>
      <div class="row" style="gap:6px;margin-top:6px"><button class="small primary" data-msave>Salvar</button><button class="small" data-mclear>Limpar</button><button class="small" data-mcancel>Cancelar</button></div>
      <p class="small muted">Clique nas províncias do mapa para incluí-las ou removê-las. Zoom e arraste continuam funcionando.</p></div>` : '';
  info.innerHTML = `<h3>Macro-regiões</h3><p class="small muted">Suas fronteiras customizadas: agrupe províncias de qualquer país. Use-as como <b>objetivo e foco de guerra</b> (página Forças armadas) e como pacote nas negociações de paz.</p>
    ${draftHTML}
    ${list.length ? list.map(m => `<div class="panel tight" style="margin:4px 0"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><b><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:${m.color}"></span> ${esc(m.name)}</b>
      <span class="small">${m.provs.length} prov.</span></div><div class="small muted">${owners(m)}</div>
      <div class="row" style="gap:4px;margin-top:3px"><button class="small" data-mzoom="${m.id}">Ver</button><button class="small" data-medit="${m.id}">Editar</button><button class="small danger" data-mdel="${m.id}">Excluir</button></div></div>`).join('') : '<p class="small muted">Nenhuma macro-região ainda.</p>'}
    ${D ? '' : '<button class="small primary" data-mnew>+ Nova macro-região</button>'}`;
  info.onclick = e => {
    const q = sel => e.target.closest(sel);
    if (q('[data-mnew]')) { game._macroDraft = { id: null, name: '', color: MACRO_COLORS[list.length % MACRO_COLORS.length], provs: new Set(), byCountry: false }; return redraw(); }
    const ed = q('[data-medit]'); if (ed) { const m = list.find(x => x.id === ed.dataset.medit); game._macroDraft = { id: m.id, name: m.name, color: m.color, provs: new Set(m.provs), byCountry: false }; return redraw(); }
    const dl = q('[data-mdel]'); if (dl) { if (confirm('Excluir esta macro-região?')) { toast(esc(game.deleteMacro(dl.dataset.mdel).msg), 'info'); redraw(); } return; }
    const z = q('[data-mzoom]'); if (z) { const m = list.find(x => x.id === z.dataset.mzoom); mapInst.zoomToProvinces(m.provs, 0.4); return; }
    if (!D) return;
    const c = q('[data-mcolor]'); if (c) { D.color = c.dataset.mcolor; return redraw(); }
    if (q('[data-mcancel]')) { game._macroDraft = null; return redraw(); }
    if (q('[data-mclear]')) { D.provs.clear(); return redraw(); }
    if (q('[data-msave]')) {
      D.name = info.querySelector('[data-mname]').value;
      const r = game.saveMacro({ id: D.id, name: D.name, color: D.color, provs: [...D.provs] });
      toast(esc(r.msg), r.ok ? 'good' : 'warn'); if (r.ok) game._macroDraft = null; redraw();
    }
  };
  info.onchange = e => {
    if (!D) return;
    if (e.target.matches('[data-mbycountry]')) D.byCountry = e.target.checked;
    if (e.target.matches('[data-mname]')) D.name = e.target.value;
    if (e.target.matches('[data-mpreset]') && e.target.value) {
      const [kind, key] = e.target.value.split('|');
      D.name = info.querySelector('[data-mname]').value || subregions().find(x => x[0] === key)?.[1] || key;
      for (const p of presetProvs(data, kind, key)) D.provs.add(p);
      redraw();
    }
  };
}
