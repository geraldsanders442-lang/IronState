// Página "Minorias e direitos": imigrantes, deportações, minorias regionais, repressão e anistia, justiça internacional.
import { esc, num, bar, toast } from './dom.js';
import { rerender } from './app.js';
import { ARREST, abuseTier, immigrantCount, liberty, ensureRights } from '../sim/rights.js';
import { partnerName } from '../sim/diplomacy.js';
import { fmtDate } from '../sim/util.js';

const ICC = {
  none: ['Sem processo', 'good', 'Nenhum órgão internacional investiga o governo.'],
  inquiry: ['Exame preliminar', 'warn', 'A promotoria do tribunal examina denúncias contra o governo.'],
  cooperating: ['Cooperando', 'good', 'O governo coopera com a investigação internacional.'],
  indicted: ['Acusação formal', 'bad', 'Autoridades do governo foram formalmente acusadas.'],
  warrant: ['Mandado de prisão', 'bad', 'Há um mandado de prisão contra o chefe de governo. Viagens ao exterior e o apoio de aliados ficam em risco.'],
};
const st = { deport: 25, nat: 25, amn: 100 };

export function rightsPage(el, game) {
  const s = game.s, data = game.data, R = ensureRights(s, data);
  const tier = abuseTier(R.abuse), imm = immigrantCount(s), pop = s.econ.pop * 1e6;
  const P = s.pol, parties = (P?.parties || []).filter(p => !p.gov);
  const minority = s.regions.filter(r => r.minority && !r.cap);
  const I = R.icc, icc = ICC[I.recognized || I.state === 'warrant' ? I.state : 'none'] || ICC.none;
  const nm = n => Math.round(n).toLocaleString('pt-BR');
  const wait = k => Math.max(0, Math.ceil(((R.cd[k] || 0) - game.day) / 7));
  const dis = k => wait(k) ? `disabled title="Aguarde ${wait(k)} semana(s)"` : '';
  const sancNames = R.rightsSanctions.map(id => partnerName(s, data, id));
  const dn = Math.round(imm * st.deport / 100), nn = Math.round(imm * st.nat / 100);
  const flow = R.flow || 0;
  el.innerHTML = `<h2>Minorias e direitos</h2><div class="muted small" style="margin-bottom:8px">Imigração, minorias étnicas, dissidência e justiça internacional. Medidas duras trazem ordem no curto prazo, mas elevam o índice de violações de direitos — e o mundo reage com notas de repúdio, resoluções da ONU, sanções e, no limite, o Tribunal Penal Internacional.</div>
    <div class="grid g3">
      <div class="panel"><h3>Violações de direitos</h3><div style="font-size:26px;font-weight:bold" class="c-${tier[1]}">${num(R.abuse, 0)}<span class="small muted">/100</span></div>${bar(R.abuse, tier[1] === 'good' ? 'good' : tier[1])}
        <div class="small"><b>${tier[0]}</b>. Liberdade civil e política: ${num(liberty(s), 0)}.</div></div>
      <div class="panel"><h3>Imigrantes</h3><div style="font-size:26px;font-weight:bold">${num(R.imm, 1)}%</div><div class="small">${nm(imm)} estrangeiros residentes · saldo migratório recente: <b class="${flow >= 0 ? 'c-good' : 'c-bad'}">${flow >= 0 ? '+' : ''}${nm(flow)}</b>/semana</div>
        <div class="small muted">Total deportado: ${nm(R.deported)} · naturalizados: ${nm(R.naturalized)} · emigraram: ${nm(R.emigrated)}</div></div>
      <div class="panel"><h3>Dissidência</h3><div style="font-size:26px;font-weight:bold">${nm(R.prisoners)}</div><div class="small">presos políticos · ${R.bans.length} partido(s) banido(s) · ${R.amnesties} anistia(s)</div>
        <div class="small muted">Execuções registradas: ${nm(R.executions)}</div></div>
    </div>

    <div class="grid g2">
      <div class="panel"><h3>Imigrantes e estrangeiros</h3>
        <div class="small muted">Há muito mais chegadas em países ricos e livres, e saídas em países pobres, reprimidos ou em guerra. Mudar as leis de imigração, fronteiras e refugiados (em <b>Leis e direitos</b>) altera o fluxo.</div>
        <div class="row" style="gap:8px;margin:8px 0;align-items:center"><span style="width:90px">Deportar</span><input type="range" min="0" max="100" value="${st.deport}" data-sl="deport" style="flex:1"><b data-lbl="deport" style="width:150px;text-align:right">${st.deport}% · ${nm(dn)}</b></div>
        <button class="danger" data-rt="deport" ${imm < 1 ? 'disabled' : dis('deport')}>Deportar imigrantes</button>
        <div class="small muted" style="margin:3px 0 8px">Reduz a população e o PIB, agrada nativistas e trabalhadores, irrita empresários; reputação cai e o índice de violações sobe conforme a fatia deportada.</div>
        <div class="row" style="gap:8px;margin:8px 0;align-items:center"><span style="width:90px">Naturalizar</span><input type="range" min="0" max="100" value="${st.nat}" data-sl="nat" style="flex:1"><b data-lbl="nat" style="width:150px;text-align:right">${st.nat}% · ${nm(nn)}</b></div>
        <button data-rt="nat" ${R.imm < 0.2 ? 'disabled' : dis('natur')}>Conceder cidadania</button>
        <div class="small muted" style="margin-top:3px">Melhora a imagem, a produtividade e acalma as minorias; desagrada o interior conservador.</div></div>

      <div class="panel"><h3>Oposição e dissidência</h3>
        <div class="small muted" style="margin-bottom:6px">Controle rápido, mas custa legitimidade, liberdade e reputação. Anistias fazem o contrário — e aumentam o risco de a oposição crescer.</div>
        <div class="row" style="gap:6px;flex-wrap:wrap">${Object.entries(ARREST).map(([k, a]) => `<button class="danger small" data-arrest="${k}" ${dis('arrest')}>${esc(a.name)}</button>`).join('')}</div>
        <div style="margin-top:10px"><b class="small">Partidos de oposição</b>
          ${parties.length ? `<table class="data">${parties.map(p => `<tr><td>${esc(p.name)}</td><td class="num">${p.banned ? '<span class="tag bad">banido</span>' : num(p.seats, 0) + ' cad.'}</td><td style="text-align:right">${p.banned ? `<button class="small" data-unban="${p.id}">Legalizar</button>` : `<button class="small danger" data-ban="${p.id}" ${dis('ban')}>Banir</button>`}</td></tr>`).join('')}</table>` : '<div class="muted small">Não há partidos de oposição.</div>'}</div>
        <div class="row" style="gap:8px;margin:10px 0 4px;align-items:center"><span style="width:90px">Anistia</span><input type="range" min="0" max="100" value="${st.amn}" data-sl="amn" style="flex:1"><b data-lbl="amn" style="width:150px;text-align:right">${st.amn}% · ${nm(R.prisoners * st.amn / 100)}</b></div>
        <div class="row" style="gap:6px"><button data-amnesty="0" ${R.prisoners < 1 ? 'disabled' : dis('amnesty')}>Libertar presos políticos</button><button data-amnesty="1" ${R.prisoners < 1 && !R.bans.length ? 'disabled' : dis('amnesty')}>Anistia ampla (e legalizar partidos)</button></div></div>
    </div>

    <div class="panel"><h3>Minorias regionais</h3>
      ${minority.length ? `<table class="data"><tr><th>Região</th><th>Povo</th><th>Religião</th><th class="num">Tensão</th><th class="num">Separatismo</th><th></th></tr>${minority.map(r => `<tr><td><b>${esc(r.name)}</b></td><td>${esc(r.people || '')}</td><td>${esc(r.faith || '')}</td><td class="num">${num(r.unrest, 0)} ${bar(r.unrest, r.unrest < 40 ? 'good' : r.unrest < 65 ? 'warn' : 'bad', 60)}</td><td class="num">${num((r.sep || 0) * 100, 0)}%</td>
        <td style="text-align:right;white-space:nowrap"><button class="small" data-conc="${r.id}" ${dis('conc' + r.id)}>Reconhecer direitos culturais</button> <button class="small danger" data-crush="${r.id}" ${dis('crush' + r.id)}>Reprimir</button></td></tr>`).join('')}</table>
        <div class="small muted" style="margin-top:6px">Reprimir acalma a região por semanas, mas deixa ressentimento e separatismo e eleva o índice de violações. Direitos culturais custam dinheiro e desagradam nacionalistas. O federalismo (em Leis e direitos) esfria tensões.</div>`
      : '<div class="muted small">Nenhuma região é dominada por um povo diferente do da capital.</div>'}</div>

    <div class="grid g2">
      <div class="panel"><h3>Justiça internacional</h3>
        <div><span class="tag ${icc[1]}">${esc(icc[0])}</span>${I.coop && I.state !== 'warrant' ? ' <span class="tag good">cooperando</span>' : ''} ${I.recognized ? '<span class="tag good">reconhece o tribunal</span>' : '<span class="tag bad">não reconhece o tribunal</span>'}</div>
        <div class="small" style="margin:6px 0">${esc(icc[2])}</div>
        <div class="small muted">Pressão processual: ${num(R.heat, 1)} · condenações da ONU: ${R.un.resolutions} resoluções, ${R.un.notes} notas de repúdio${R.harbored.length ? ` · abrigados: ${R.harbored.map(h => esc(h.name)).join(', ')}` : ''}.</div>
        <div style="margin-top:8px">${I.recognized ? '<button class="danger small" data-icc="0">Retirar-se do Estatuto de Roma</button>' : '<button class="small" data-icc="1">Voltar a reconhecer o tribunal</button>'}</div></div>
      <div class="panel"><h3>Reação do mundo</h3>
        ${sancNames.length ? `<div class="small"><b>Sanções por direitos humanos:</b> ${sancNames.map(esc).join(', ')}.</div>` : '<div class="small muted">Nenhum país impôs sanções por direitos humanos.</div>'}
        <div class="small muted" style="margin-top:6px">Perto de 45 violações: notas de repúdio · 62+: resoluções da ONU · 60+: sanções de países democráticos ricos · 66+: o tribunal começa a investigar.</div>
        <h3 style="margin-top:10px">Histórico</h3>${R.events.length ? R.events.slice(0, 8).map(e => `<div class="small"><span class="muted">${fmtDate(e.day)}</span> ${esc(e.text)}</div>`).join('') : '<div class="small muted">Nada registrado ainda.</div>'}</div>
    </div>`;

  const upd = () => { for (const k of ['deport', 'nat', 'amn']) { const l = el.querySelector(`[data-lbl="${k}"]`); if (l) l.textContent = `${st[k]}% · ${nm((k === 'amn' ? R.prisoners : imm) * st[k] / 100)}`; } };
  el.querySelectorAll('[data-sl]').forEach(i => i.oninput = () => { st[i.dataset.sl] = +i.value; upd(); });
  const say = r => { toast(esc(r.msg), r.ok ? 'good' : 'warn'); rerender(); };
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const d = b.dataset;
    if (d.rt === 'deport') { if (confirm(`Deportar ${nm(dn)} imigrantes? A medida é impopular no exterior e pode render condenações.`)) say(game.rightsDeport(dn)); }
    else if (d.rt === 'nat') say(game.rightsNaturalize(st.nat / 100));
    else if (d.arrest) { if (confirm(`${ARREST[d.arrest].name}? Isso eleva o índice de violações de direitos.`)) say(game.rightsArrest(d.arrest)); }
    else if (d.ban) { if (confirm('Banir este partido? Ele perde as cadeiras e o registro.')) say(game.rightsBan(d.ban)); }
    else if (d.unban) say(game.rightsUnban(d.unban));
    else if (d.amnesty != null) say(game.rightsAmnesty(st.amn / 100, d.amnesty === '1'));
    else if (d.crush) { if (confirm('Reprimir militarmente a região? Haverá mortos e consequências internacionais.')) say(game.rightsCrush(d.crush)); }
    else if (d.conc) say(game.rightsConcede(d.conc));
    else if (d.icc != null) { if (d.icc === '1' || confirm('Deixar de reconhecer o tribunal custa reputação e desagrada as democracias. Prosseguir?')) say(game.rightsIcc(d.icc === '1')); }
  };
}
