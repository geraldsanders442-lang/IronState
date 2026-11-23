// Página "Saúde e saneamento": cobertura de esgoto, água e higiene, expectativa de vida, IDH, surtos e financiamento.
import { esc, num, bar, toast } from './dom.js';
import { li } from './lucide.js';
import { rerender } from './app.js';
import { fmtDate } from '../sim/util.js';
import { ensureHealth, FUND, LEVEL_NAME, hdiTier, healthBaseline } from '../sim/health.js';

const good = v => v >= 85 ? 'good' : v >= 60 ? 'warn' : 'bad';
const row = (label, v, tip = '', cls = good(v), unit = '%') => `<div class="row small" style="justify-content:space-between" title="${esc(tip)}"><span>${label}</span><span><b>${num(v, 1)}${unit}</b></span></div>${bar(v, cls)}`;

export function healthPage(el, game) {
  const s = game.s, data = game.data, h = ensureHealth(s, data), st = s.st, o = h.outbreak;
  const yr = Math.max(1, s.econ.gdp), cost = k => FUND[k].cost[h.fund[k]] * yr / 100;
  const total = Object.keys(FUND).reduce((a, k) => a + cost(k), 0);
  const world = healthBaseline(data, s.nation.scenario);
  const hdiNow = h.hdi, hdi0 = h.hdi0 ?? hdiNow;
  const regRows = s.regions.map(r => { const R = h.reg[r.id]; if (!R) return ''; return `<tr><td>${esc(r.name)}${h.focus === r.id ? ' <span class="tag blue">prioridade</span>' : ''}</td><td class="num">${num(r.urban ?? 0, 0)}%</td><td class="num">${num(R.san, 0)}%</td><td class="num">${num(R.water, 0)}%</td><td class="num">${num(R.hyg, 0)}%</td><td class="num ${R.od > 10 ? 'bad' : ''}">${num(R.od, 1)}%</td><td><button class="small" data-op="focus" data-arg="${h.focus === r.id ? 'none' : r.id}">${h.focus === r.id ? 'Tirar prioridade' : 'Priorizar'}</button></td></tr>`; }).join('');
  const prog = Object.entries(FUND).map(([k, F]) => `<div style="margin:8px 0"><div class="row" style="justify-content:space-between"><b>${esc(F.name)}</b><span class="small muted">${num(cost(k), 2)} bi/ano (${F.cost[h.fund[k]]}% do PIB)</span></div>
      <div class="small muted">${esc(F.desc)}</div>
      <div class="seg" style="margin-top:4px">${LEVEL_NAME.map((n, i) => `<button class="${h.fund[k] === i ? 'on' : ''}" data-op="fund" data-arg="${k}|${i}">${n}</button>`).join('')}</div></div>`).join('');
  const spark = h.hist?.length > 3 ? (() => { const a = h.hist.map(x => x[1]), lo = Math.min(...a), hi = Math.max(...a), w = 220, hh = 36; const pts = a.map((v, i) => `${(i / (a.length - 1) * w).toFixed(1)},${(hh - (v - lo) / Math.max(0.1, hi - lo) * (hh - 4) - 2).toFixed(1)}`).join(' '); return `<svg width="${w}" height="${hh}" style="display:block"><polyline points="${pts}" fill="none" stroke="#2c4170" stroke-width="2"/></svg><div class="small muted">Saneamento básico, últimos ${a.length} registros: ${num(a[0], 1)}% → ${num(a.at(-1), 1)}%</div>`; })() : '';
  el.innerHTML = `<h2>${li('heart-pulse', 20)} Saúde e saneamento</h2>
    <div class="muted small" style="margin-bottom:8px">Esgoto, água potável e hábitos de higiene decidem quantas crianças morrem de diarreia, quantos anos as pessoas vivem e o IDH. ${h.real ? 'Pontos de partida: estimativas reais do Banco Mundial / JMP (OMS e UNICEF).' : 'Sem dado direto do país: usamos a média da sub-região.'}</div>
    ${o ? `<div class="panel" style="border-left:6px solid #b3261e;background:#fff3f0"><h3>${li('siren', 16)} Surto de ${esc(o.name)} em ${esc(o.region)}</h3><div class="small">Semana ${o.weeks} de ~${o.len} · ${num(o.dead, 0)} mortos até agora · mortalidade e protestos em alta${o.emergency ? ' · <b>resposta de emergência ativa</b>' : ''}.</div>
      ${o.emergency ? '' : `<button class="primary small" data-op="emergency" style="margin-top:6px">Decretar resposta de emergência (${num(s.econ.gdp * 0.0006, 2)} bi)</button>`}</div>` : ''}
    <div class="grid g3">
      <div class="panel"><h3>Cobertura da população</h3>
        ${row('Saneamento básico (esgoto/fossa)', h.san, 'Parcela da população com banheiro adequado, não compartilhado entre famílias.')}
        ${row('Água potável básica', h.water, 'Fonte melhorada a até 30 minutos de distância.')}
        ${row('Lavagem de mãos com sabão', h.hyg, 'Domicílios com lavatório com água e sabão.')}
        ${row('Defecação a céu aberto', h.od, 'Parcela que ainda não tem banheiro. Quanto menor, melhor.', h.od > 10 ? 'bad' : h.od > 3 ? 'warn' : 'good')}
        ${spark}</div>
      <div class="panel"><h3>Resultados</h3>
        <table class="data"><tr><td>Expectativa de vida</td><td class="num"><b>${num(h.le, 1)} anos</b></td></tr>
        <tr><td>Mortalidade abaixo de 5 anos</td><td class="num"><b>${num(h.u5m, 1)}</b> por mil</td></tr>
        <tr><td>Mortes por água/saneamento/higiene inseguros</td><td class="num"><b>${num(h.wash, 1)}</b> por 100 mil</td></tr>
        <tr><td>IDH estimado</td><td class="num"><b>${num(hdiNow, 3)}</b> (${hdiTier(hdiNow)})</td></tr>
        <tr><td>Saúde geral</td><td class="num">${num(st.health, 0)}/100</td></tr>
        <tr><td>Mortos por surtos e doenças (acumulado)</td><td class="num">${num(h.deaths.outbreak, 0)}</td></tr></table>
        <div class="small muted" style="margin-top:6px">IDH = raiz cúbica de saúde (expectativa de vida) × educação × renda (fórmula do PNUD, estimada). Mais obras e verbas sobem os três indicadores de cobertura, e com eles a vida média e o IDH.</div></div>
      <div class="panel"><h3>Ações rápidas</h3>
        <div class="row" style="gap:6px;flex-wrap:wrap"><button class="small" data-op="campaign">${li('megaphone', 14)} Campanha de higiene (${num(s.econ.gdp * 0.0012, 2)} bi)</button><button class="small" data-op="vaccination">${li('heart-pulse', 14)} Vacinação em massa (${num(s.econ.gdp * 0.0018, 2)} bi)</button></div>
        <div class="small muted" style="margin-top:6px">Gasto atual nos quatro programas: <b>${num(total, 2)} bi/ano</b> (${num(total / yr * 100, 2)}% do PIB). Obras só rendem com eficiência administrativa; corrupção desvia a verba.</div></div></div>
    <div class="panel" style="margin-top:8px"><h3>Financiamento dos programas</h3>${prog}</div>
    <div class="panel" style="margin-top:8px"><h3>Por região</h3><table class="data"><tr><th>Região</th><th class="num">Urbano</th><th class="num">Saneamento</th><th class="num">Água</th><th class="num">Higiene</th><th class="num">Céu aberto</th><th></th></tr>${regRows}</table>
      <div class="small muted">Zonas rurais costumam ficar 10 a 30 pontos atrás das cidades. A região prioritária recebe mais que o dobro do ritmo de obras.</div></div>
    <div class="panel" style="margin-top:8px"><h3>Registro</h3><div class="log-list" style="max-height:150px">${h.log.length ? h.log.map(l => `<div><span class="muted small">${fmtDate(l.day)}</span> ${esc(l.text)}</div>`).join('') : '<span class="muted small">Nada registrado.</span>'}</div></div>
    <div class="small muted" style="margin-top:6px">Fontes dos dados de partida: Banco Mundial (indicadores do JMP OMS/UNICEF, expectativa de vida e mortalidade da ONU); último valor disponível desde 2012.</div>`;
  el.onclick = e => {
    const b = e.target.closest('[data-op]'); if (!b) return;
    const r = game.healthAct(b.dataset.op, b.dataset.arg); toast(esc(r.msg || ''), r.ok ? 'good' : 'warn'); rerender();
  };
}
