import { esc, num, showTip, hideTip } from './dom.js';
import { fmtDate } from '../sim/util.js';

export const PALETTE = ['#2f6db5', '#c0392b', '#2e8b3e', '#c99a06', '#7b4fa6', '#16879a', '#d46a1f', '#5f6878'];

function niceRange(min, max) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min, step = Math.pow(10, Math.floor(Math.log10(span / 4)));
  const st = [1, 2, 5, 10].map(m => m * step).find(s => span / s <= 5) || step * 10;
  return { min: Math.floor(min / st) * st, max: Math.ceil(max / st) * st, step: st };
}

// series: [{name, color, data:[[x, y]]}]; x = dia do jogo
export function mountLine(el, { series, height = 150, yFmt = v => num(v, 1), yMin, yMax, title }) {
  const W = 420, H = height, L = 42, R = 8, T = 8, B = 20;
  const all = series.flatMap(s => s.data);
  if (all.length < 2) { el.innerHTML = `${title ? `<div class="chart-title">${esc(title)}</div>` : ''}<div class="muted small" style="padding:20px 0">Dados insuficientes — avance o tempo.</div>`; return; }
  const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs) || 1;
  const yr = niceRange(yMin ?? Math.min(...ys), yMax ?? Math.max(...ys));
  const X = x => L + (x - x0) / Math.max(1, x1 - x0) * (W - L - R);
  const Y = y => T + (1 - (y - yr.min) / (yr.max - yr.min)) * (H - T - B);
  let g = '';
  for (let v = yr.min; v <= yr.max + 1e-9; v += yr.step) g += `<line class="gridl" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L - 4}" y="${Y(v) + 3}" text-anchor="end">${esc(yFmt(v))}</text>`;
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) { const xv = x0 + (x1 - x0) * i / ticks; g += `<text x="${X(xv)}" y="${H - 5}" text-anchor="${i === 0 ? 'start' : i === ticks ? 'end' : 'middle'}">${x1 - x0 < 200 ? fmtDate(Math.round(xv)).replace(/ \d{4}$/, '') : fmtDate(Math.round(xv)).replace(/^\d+ /, '')}</text>`; }
  const paths = series.map((s, i) => {
    const c = s.color || PALETTE[i % PALETTE.length];
    const d = s.data.map((p, j) => (j ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('');
    return `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.8"/>`;
  }).join('');
  el.innerHTML = `${title ? `<div class="chart-title">${esc(title)}</div>` : ''}<div class="chart"><svg viewBox="0 0 ${W} ${H}">${g}<line class="ax" x1="${L}" x2="${L}" y1="${T}" y2="${H - B}"/><line class="ax" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>${paths}<line class="hover" x1="0" x2="0" y1="${T}" y2="${H - B}" stroke="#888" stroke-dasharray="3 2" visibility="hidden"/><rect class="hit" x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="transparent"/></svg>
    ${series.length > 1 ? `<div class="legend">${series.map((s, i) => `<span><i style="background:${s.color || PALETTE[i % PALETTE.length]}"></i>${esc(s.name)}</span>`).join('')}</div>` : ''}</div>`;
  const svg = el.querySelector('svg'), hl = svg.querySelector('.hover');
  svg.querySelector('.hit').addEventListener('mousemove', e => {
    const r = svg.getBoundingClientRect();
    const xv = x0 + ((e.clientX - r.left) / r.width * W - L) / (W - L - R) * (x1 - x0);
    hl.setAttribute('x1', X(xv)); hl.setAttribute('x2', X(xv)); hl.setAttribute('visibility', 'visible');
    const rows = series.map((s, i) => {
      let best = s.data[0];
      for (const p of s.data) if (Math.abs(p[0] - xv) < Math.abs(best[0] - xv)) best = p;
      return `<div><b style="color:${s.color || PALETTE[i % PALETTE.length]}">■</b> ${esc(s.name)}: <b>${esc(yFmt(best[1]))}</b></div>`;
    });
    showTip(`<b>${fmtDate(Math.round(xv))}</b>${rows.join('')}`, e);
  });
  svg.querySelector('.hit').addEventListener('mouseleave', () => { hl.setAttribute('visibility', 'hidden'); hideTip(); });
}

// items: [{label, value, color}]
export function barsHTML(items, { fmt = v => num(v, 1), max } = {}) {
  const m = max ?? Math.max(...items.map(i => Math.abs(i.value)), 1e-9);
  return `<div style="display:grid;grid-template-columns:max-content 1fr max-content;gap:3px 8px;align-items:center;font-size:11px">${items.map((it, i) => `
    <span>${esc(it.label)}</span><div class="bar" style="height:12px"><i style="width:${(Math.abs(it.value) / m * 100).toFixed(1)}%;background:${it.color || PALETTE[i % PALETTE.length]}"></i></div><span class="right">${esc(fmt(it.value))}</span>`).join('')}</div>`;
}

export function pieSVG(items, size = 150) {
  const tot = items.reduce((a, i) => a + Math.max(0, i.value), 0) || 1;
  let a0 = -Math.PI / 2, out = '';
  const r = size / 2 - 2, c = size / 2;
  items.forEach((it, i) => {
    const frac = Math.max(0, it.value) / tot, a1 = a0 + frac * Math.PI * 2;
    const large = frac > 0.5 ? 1 : 0;
    const col = it.color || PALETTE[i % PALETTE.length];
    if (frac >= 0.999) out += `<circle cx="${c}" cy="${c}" r="${r}" fill="${col}"/>`;
    else if (frac > 0) out += `<path d="M${c} ${c}L${c + r * Math.cos(a0)} ${c + r * Math.sin(a0)}A${r} ${r} 0 ${large} 1 ${c + r * Math.cos(a1)} ${c + r * Math.sin(a1)}Z" fill="${col}" stroke="#fff" stroke-width="1" data-tip="${esc(it.label)}: ${(frac * 100).toFixed(1)}%"/>`;
    a0 = a1;
  });
  const legend = items.map((it, i) => `<div class="small"><b style="color:${it.color || PALETTE[i % PALETTE.length]}">■</b> ${esc(it.label)} — ${(Math.max(0, it.value) / tot * 100).toFixed(0)}%</div>`).join('');
  return `<div class="row" style="align-items:flex-start;flex-wrap:nowrap"><svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="flex-shrink:0">${out}</svg><div>${legend}</div></div>`;
}

// Plano cartesiano com trajetória histórica
export function mountScatter(el, { points, xLabel, yLabel, xRange, yRange, quadrants, extra = [] }) {
  const W = 520, H = 420, L = 46, R = 14, T = 14, B = 40;
  if (!points.length) { el.innerHTML = '<div class="muted">Sem dados.</div>'; return; }
  const xr = xRange || niceRange(Math.min(...points.map(p => p.x)), Math.max(...points.map(p => p.x)));
  const yr = yRange || niceRange(Math.min(...points.map(p => p.y)), Math.max(...points.map(p => p.y)));
  const X = x => L + (x - xr.min) / (xr.max - xr.min) * (W - L - R);
  const Y = y => T + (1 - (y - yr.min) / (yr.max - yr.min)) * (H - T - B);
  const step = (r) => r.step || (r.max - r.min) / 4;
  let g = '';
  for (let v = xr.min; v <= xr.max + 1e-9; v += step(xr)) g += `<line class="gridl" x1="${X(v)}" x2="${X(v)}" y1="${T}" y2="${H - B}"/><text x="${X(v)}" y="${H - B + 13}" text-anchor="middle">${num(v, 0)}</text>`;
  for (let v = yr.min; v <= yr.max + 1e-9; v += step(yr)) g += `<line class="gridl" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L - 5}" y="${Y(v) + 3}" text-anchor="end">${num(v, 0)}</text>`;
  if (quadrants) {
    const mx = X((xr.min + xr.max) / 2), my = Y((yr.min + yr.max) / 2);
    g += `<line x1="${mx}" x2="${mx}" y1="${T}" y2="${H - B}" stroke="#9aa3b2" stroke-width="1.2"/><line x1="${L}" x2="${W - R}" y1="${my}" y2="${my}" stroke="#9aa3b2" stroke-width="1.2"/>`;
    const q = [[L + 6, T + 14, 'start', quadrants[0]], [W - R - 6, T + 14, 'end', quadrants[1]], [L + 6, H - B - 6, 'start', quadrants[2]], [W - R - 6, H - B - 6, 'end', quadrants[3]]];
    g += q.map(([x, y, a, t]) => `<text x="${x}" y="${y}" text-anchor="${a}" style="font-size:11px;fill:#a0a7b4;font-style:italic">${esc(t)}</text>`).join('');
  }
  const path = points.map((p, i) => (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join('');
  const n = points.length;
  const dots = points.map((p, i) => {
    const last = i === n - 1;
    const op = 0.25 + 0.75 * i / Math.max(1, n - 1);
    return `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${last ? 7 : 3}" fill="${last ? '#c0392b' : '#2f6db5'}" fill-opacity="${last ? 1 : op}" stroke="#fff" stroke-width="${last ? 2 : 0.5}" data-tip="<b>${esc(p.label)}</b><br>${esc(xLabel)}: ${num(p.x, 1)}<br>${esc(yLabel)}: ${num(p.y, 1)}"/>`;
  }).join('');
  const ex = extra.map(p => `<rect x="${X(p.x) - 4}" y="${Y(p.y) - 4}" width="8" height="8" fill="${p.color || '#7b4fa6'}" data-tip="${esc(p.label)}"/><text x="${X(p.x) + 7}" y="${Y(p.y) + 3}" style="font-size:9px">${esc(p.short || '')}</text>`).join('');
  el.innerHTML = `<div class="chart"><svg viewBox="0 0 ${W} ${H}">${g}<line class="ax" x1="${L}" x2="${L}" y1="${T}" y2="${H - B}"/><line class="ax" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>
    <path d="${path}" fill="none" stroke="#2f6db5" stroke-width="1.4" stroke-opacity=".6"/>${ex}${dots}
    <text x="${(L + W - R) / 2}" y="${H - 6}" text-anchor="middle" style="font-size:11px;fill:#333">${esc(xLabel)} →</text>
    <text transform="translate(12 ${(T + H - B) / 2}) rotate(-90)" text-anchor="middle" style="font-size:11px;fill:#333">${esc(yLabel)} →</text></svg></div>`;
}
