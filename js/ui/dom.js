import { STAT_INFO, GROUPS, SECTORS } from '../sim/constants.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const ctx = { game: null, currency: '' };

export function money(bn, curOverride) {
  const a = Math.abs(bn), sign = bn < 0 ? '−' : '';
  const cur = curOverride || ctx.game?.s?.nation.currency || '';
  if (a >= 1000) return `${sign}${(a / 1000).toFixed(2)} tri ${cur}`;
  if (a >= 1) return `${sign}${a.toFixed(1)} bi ${cur}`;
  return `${sign}${(a * 1000).toFixed(0)} mi ${cur}`;
}
export const num = (v, d = 1) => (v == null || !Number.isFinite(v) ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }));
export const signed = (v, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), d);

export function tone(key, v) {
  const info = STAT_INFO[key];
  const good = info?.[3];
  if (good == null) return 'neutral';
  const score = good ? v : 100 - v;
  return score >= 60 ? 'good' : score >= 35 ? 'warn' : 'bad';
}
export function deltaTone(key, d) {
  const good = STAT_INFO[key]?.[3];
  if (good == null || Math.abs(d) < 0.05) return 'muted';
  return (good ? d > 0 : d < 0) ? 'c-good' : 'c-bad';
}

export function bar(v, cls = 'neutral', max = 100) {
  return `<div class="bar"><i class="bg-${cls}" style="width:${Math.max(0, Math.min(100, v / max * 100)).toFixed(1)}%"></i></div>`;
}

export const statName = key => {
  const i = STAT_INFO[key];
  return i ? `<span class="stat-name" data-tip="${esc(i[2])}">${esc(i[0])}</span>` : esc(key);
};

const MOD_LABEL = {
  growth: ['Crescimento', ' p.p.', true], inflation: ['Inflação', ' p.p.', false], unemployment: ['Desemprego', ' p.p.', false],
  exportAccess: ['Acesso a exportações', '', true, 100], importAccess: ['Acesso a importações', '', true, 100], laborSupply: ['Oferta de mão de obra (desemprego)', ' p.p.', false],
  migration: ['Imigração', '‰', null], emigration: ['Emigração', '‰', false], troopsMult: ['Efetivo militar', '%', null, 100], repression: ['Repressão', '', false],
  revenue: ['Receitas extras', '% PIB', true], birth: ['Natalidade', '‰', null], propaganda: ['Propaganda', '', null], creditLimit: ['Limite de crédito', '% PIB', true, 100],
  infra: ['Infraestrutura', '', true], housing: ['Habitação', '', true], crime: ['Criminalidade', '', false], congestion: ['Congestionamento', '', false],
  abuse: ['Violações de direitos', '', false], separatism: ['Separatismo', '', false], sanctionShield: ['Resistência a sanções', '%', true, 100], scrutiny: ['Escrutínio internacional', '', false], aid: ['Ajuda internacional', '', true], aidAccess: ['Acesso a ajuda', '', true],
};
export function modLabel(k, v) {
  let name, unit = '', good = null, mult = 1;
  if (k.startsWith('g_')) { name = 'Satisf. ' + (GROUPS[k.slice(2)]?.name || k); good = true; }
  else if (k.startsWith('gi_')) { name = 'Influência ' + (GROUPS[k.slice(3)]?.name || k); good = null; mult = 100; unit = '%'; }
  else if (k.startsWith('s_')) { name = 'Produção: ' + (SECTORS[k.slice(2)]?.name || k); unit = '%'; good = true; }
  else if (MOD_LABEL[k]) [name, unit, good, mult = 1] = MOD_LABEL[k];
  else if (STAT_INFO[k]) { name = STAT_INFO[k][0]; good = STAT_INFO[k][3]; }
  else name = k;
  const val = v * mult;
  const cls = good == null ? 'blue' : (good ? val > 0 : val < 0) ? 'good' : 'bad';
  return `<span class="tag ${cls}">${esc(name)} ${signed(val, Math.abs(val) < 1 ? 2 : 0)}${unit}</span>`;
}
export const modsList = mods => Object.entries(mods || {}).map(([k, v]) => modLabel(k, v)).join(' ') || '<span class="muted small">Sem efeitos diretos</span>';

let tipEl;
export function initTips() {
  tipEl = $('#tip');
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-tip]');
    if (!t) { tipEl.hidden = true; return; }
    tipEl.innerHTML = t.dataset.tip;
    tipEl.hidden = false;
  });
  document.addEventListener('mousemove', e => {
    if (tipEl.hidden) return;
    const x = Math.min(window.innerWidth - tipEl.offsetWidth - 8, e.clientX + 14);
    const y = Math.min(window.innerHeight - tipEl.offsetHeight - 8, e.clientY + 14);
    tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
  });
}
export function showTip(html, e) { tipEl.innerHTML = html; tipEl.hidden = false; tipEl.style.left = e.clientX + 14 + 'px'; tipEl.style.top = e.clientY + 14 + 'px'; }
export function hideTip() { tipEl.hidden = true; }

export function toast(text, kind = 'info', onClick) {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.innerHTML = text;
  el.onclick = () => { onClick?.(); el.remove(); };
  $('#toasts').prepend(el);
  while ($('#toasts').children.length > 5) $('#toasts').lastChild.remove();
  setTimeout(() => el.remove(), 7000);
}

export function modal(html, { wide = false, onClose, locked = false } = {}) {
  const m = $('#modal');
  m.innerHTML = `<div class="box ${wide ? 'wide' : ''}">${html}</div>`;
  m.hidden = false;
  const close = () => { m.hidden = true; m.innerHTML = ''; onClose?.(); };
  m.onclick = e => { if ((e.target === m && !locked) || e.target.closest('[data-close]')) close(); };
  return { el: m.firstChild, close };
}

export const ICONS = {
  overview: '<path d="M3 10l7-6 7 6v7H3z"/><path d="M8 17v-5h4v5"/>',
  issues: '<path d="M4 3h12v14H4z"/><path d="M7 7h6M7 10h6M7 13h4"/>',
  stats: '<path d="M3 17h14"/><path d="M5 14V9M9 14V5M13 14v-7"/>',
  analysis: '<circle cx="10" cy="10" r="7"/><path d="M10 3v14M3 10h14"/>',
  budget: '<rect x="3" y="5" width="14" height="10" rx="1"/><circle cx="10" cy="10" r="2.2"/>',
  initiatives: '<path d="M4 17V8l6-5 6 5v9"/><path d="M8 17v-4h4v4"/><path d="M2 17h16"/>',
  economy: '<path d="M3 15l4-5 3 3 6-8"/><path d="M12 5h4v4"/>',
  laws: '<path d="M10 3v14M5 6h10"/><path d="M3 12l2-6 2 6a2 2 0 01-4 0zM13 12l2-6 2 6a2 2 0 01-4 0z"/>',
  encyclopedia: '<path d="M4 3h9a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3z"/><path d="M4 14a3 3 0 0 1 3-3h9"/>',
  editor: '<path d="M4 16l1-4 8-8 3 3-8 8z"/><path d="M11 6l3 3"/>',
  research: '<path d="M8 3h4M9 3v5l-4 8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l-4-8V3"/>',
  politics: '<path d="M3 16a7 7 0 0 1 14 0z"/><circle cx="6" cy="13" r="1"/><circle cx="10" cy="11" r="1"/><circle cx="14" cy="13" r="1"/>',
  society: '<circle cx="7" cy="7" r="2.5"/><circle cx="13.5" cy="7.5" r="2"/><path d="M2.5 16c0-3 2-5 4.5-5s4.5 2 4.5 5M11 12c2.5-.6 5 .8 5.5 4"/>',
  urban: '<path d="M3 17V7h5v10M8 17V3h5v14M13 17v-7h4v7"/>',
  diplomacy: '<circle cx="10" cy="10" r="7"/><path d="M3 10h14M10 3c3 3 3 11 0 14M10 3c-3 3-3 11 0 14"/>',
  military: '<path d="M10 2l6 3v5c0 4-3 6.5-6 8-3-1.5-6-4-6-8V5z"/>',
  map: '<path d="M2 5l5-2 6 2 5-2v12l-5 2-6-2-5 2z"/><path d="M7 3v12M13 5v12"/>',
  reports: '<path d="M5 2h7l3 3v13H5z"/><path d="M8 9h4M8 12h4M8 15h2"/>',
  rankings: '<path d="M3 17h14"/><rect x="4" y="9" width="3" height="8"/><rect x="8.5" y="5" width="3" height="12"/><rect x="13" y="11" width="3" height="6"/>',
  chief: '<circle cx="10" cy="6" r="3"/><path d="M4 17a6 6 0 0 1 12 0zM10 9v4"/>',
  propaganda: '<path d="M3 8l11-4v12L3 12z"/><path d="M6 12l1 5h3l-1-4"/>',
  order: '<path d="M10 3a4 4 0 0 1 4 4v4H6V7a4 4 0 0 1 4-4zM4 11h12v2H4zM6 17h8"/>',
  regions: '<path d="M10 17s-5-4-5-8a5 5 0 0 1 10 0c0 4-5 8-5 8z"/><circle cx="10" cy="9" r="1.6"/>',
  options: '<circle cx="10" cy="10" r="2.5"/><path d="M10 2v3M10 15v3M2 10h3M15 10h3M4.3 4.3l2.1 2.1M13.6 13.6l2.1 2.1M4.3 15.7l2.1-2.1M13.6 6.4l2.1-2.1"/>',
};
