import { esc } from './dom.js';
import { EMBLEMS, EMBLEM_CATS } from './emblems.js';
export { EMBLEMS, EMBLEM_CATS };
const ANIMAL_ALIAS = { eagle: 'a_germany', eaglecrown: 'a_poland', eagle2: 'a_byzantine', eagleflight: 'a_napoleon', phoenix: 'a_napoleon', falcon: 'r_quraish', lion: 'r_flanders', lionr: 'r_flanders' };

export const LAYOUTS = {
  solid: 'Liso', h2: 'Duas faixas horiz.', h3: 'Três faixas horiz.', v2: 'Duas faixas vert.', v3: 'Três faixas vert.', hcenter: 'Faixa central larga',
  diag: 'Diagonal', diag2: 'Diagonal inversa', nordic: 'Cruz nórdica', cross: 'Cruz central', saltire: 'Aspa (X)', canton: 'Cantão', triangle: 'Triângulo', border: 'Moldura',
  quarters: 'Quartéis', pale: 'Pala central (tipo Canadá)', bend: 'Banda diagonal', bend2: 'Banda diagonal inversa', pall: 'Pala em Y', chevron: 'Chevron', disc: 'Disco central',
  stripes5: 'Cinco listras', stripes7: 'Sete listras', stripes13: 'Treze listras', vstripes5: 'Cinco listras verticais', rays: 'Raios de sol', checker: 'Xadrez',
  hborder: 'Faixas nas bordas', swallow: 'Cauda de andorinha', cantonstripes: 'Cantão e listras',
};

export const PRESETS = {
  andean: { name: 'Tricolor andino', layout: 'hcenter', colors: ['#f2c400', '#0b3d91', '#c8102e'], emblems: [{ type: 'sun', color: '#7a4b00', x: 0.5, y: 0.5, s: 0.32 }] },
  nordic: { name: 'Cruz nórdica', layout: 'nordic', colors: ['#00539b', '#ffcd00', '#ffffff'], emblems: [] },
  panarab: { name: 'Pan-árabe', layout: 'triangle', colors: ['#111111', '#ffffff', '#007a3d', '#ce1126'], emblems: [] },
  panafrican: { name: 'Pan-africana', layout: 'h3', colors: ['#078930', '#fcdd09', '#da121a'], emblems: [{ type: 'star', color: '#111111', x: 0.5, y: 0.5, s: 0.3 }] },
  slavic: { name: 'Tricolor eslava', layout: 'h3', colors: ['#ffffff', '#0039a6', '#d52b1e'], emblems: [{ type: 'eagle2', color: '#c9a227', x: 0.32, y: 0.5, s: 0.42 }] },
  lonestar: { name: 'Estrela solitária', layout: 'canton', colors: ['#bf0a30', '#ffffff', '#002868'], emblems: [{ type: 'star', color: '#ffffff', x: 0.17, y: 0.25, s: 0.3 }] },
  rising: { name: 'Disco solar', layout: 'solid', colors: ['#ffffff', '#ffffff', '#ffffff'], emblems: [{ type: 'circle', color: '#bc002d', x: 0.5, y: 0.5, s: 0.55 }] },
  crescent: { name: 'Crescente', layout: 'v2', colors: ['#ffffff', '#01411c', '#01411c'], emblems: [{ type: 'crescent', color: '#ffffff', x: 0.62, y: 0.5, s: 0.5 }, { type: 'star', color: '#ffffff', x: 0.72, y: 0.4, s: 0.18 }] },
  red: { name: 'Revolucionária', layout: 'solid', colors: ['#c8102e', '#c8102e', '#c8102e'], emblems: [{ type: 'star', color: '#ffd700', x: 0.17, y: 0.25, s: 0.28 }, { type: 'gear', color: '#ffd700', x: 0.17, y: 0.55, s: 0.18 }] },
  imperial: { name: 'Imperial', layout: 'h2', colors: ['#111111', '#f2c400', '#f2c400'], emblems: [{ type: 'eagle', color: '#c8102e', x: 0.5, y: 0.5, s: 0.55 }] },
  saltire: { name: 'Aspa marítima', layout: 'saltire', colors: ['#00247d', '#ffffff', '#ffffff'], emblems: [{ type: 'anchor', color: '#c9a227', x: 0.5, y: 0.5, s: 0.32 }] },
  pirate: { name: 'Pirata', layout: 'solid', colors: ['#111111', '#111111', '#111111'], emblems: [{ type: 'skullbones', color: '#ffffff', x: 0.5, y: 0.5, s: 0.72 }] },
  junta: { name: 'Junta militar', layout: 'h3', colors: ['#3d4a2a', '#111111', '#3d4a2a'], emblems: [{ type: 'swords', color: '#c9a227', x: 0.5, y: 0.52, s: 0.62 }, { type: 'eagle', color: '#c9a227', x: 0.5, y: 0.5, s: 0.5, ow: 1, oc: '#111111' }] },
  theocracy: { name: 'Teocracia', layout: 'border', colors: ['#c9a227', '#ffffff', '#ffffff'], emblems: [{ type: 'crosslatin', color: '#c9a227', x: 0.5, y: 0.5, s: 0.62 }] },
  insurgent: { name: 'Insurgência', layout: 'triangle', colors: ['#111111', '#c8102e', '#078930', '#f2c400'], emblems: [{ type: 'rifles', color: '#111111', x: 0.2, y: 0.5, s: 0.36 }, { type: 'star', color: '#c8102e', x: 0.2, y: 0.5, s: 0.16 }] },
  anarcho: { name: 'Anarquista', layout: 'diag2', colors: ['#c8102e', '#111111', '#111111'], emblems: [{ type: 'anarchy', color: '#ffffff', x: 0.5, y: 0.5, s: 0.6, ow: 1, oc: '#111111' }] },
  atomic: { name: 'Potência atômica', layout: 'rays', colors: ['#f2c400', '#111111', '#111111'], emblems: [{ type: 'nuke', color: '#111111', x: 0.5, y: 0.5, s: 0.5, ow: 2, oc: '#f2c400' }] },
  dragon: { name: 'Dragão', layout: 'diag', colors: ['#f2c400', '#d46a1f', '#d46a1f'], emblems: [{ type: 'dragon', color: '#ffffff', x: 0.5, y: 0.5, s: 0.7, ow: 1.5, oc: '#8a1c1c' }] },
  bearrepublic: { name: 'República do urso', layout: 'hborder', colors: ['#ffffff', '#b22234', '#b22234'], emblems: [{ type: 'bear', color: '#7a4b00', x: 0.5, y: 0.5, s: 0.5 }, { type: 'star', color: '#b22234', x: 0.15, y: 0.3, s: 0.18 }] },
};

export const SWATCHES = ['#ffffff', '#111111', '#c8102e', '#8a1c1c', '#e4572e', '#d46a1f', '#f2c400', '#c9a227', '#078930', '#01411c', '#3d4a2a', '#16879a', '#5bc0eb', '#0b3d91', '#00247d', '#5a2d82', '#d63384', '#7a4b00', '#9aa3b2', '#4a4a4a'];

export const defaultFlag = () => structuredClone(PRESETS.andean);

let FLAGS = { current: {}, historical: {}, regional: {}, regMeta: {}, entReg: {} };
export function setFlagData(current, historical, extra, regional) {
  FLAGS = { current: current || {}, historical: historical?.flags || {}, regional: regional?.flags || {}, regMeta: regional?.meta || {}, entReg: {} };
  for (const [k, m] of Object.entries(regional?.meta || {})) if (m.ent && regional.flags[k]) FLAGS.entReg[m.ent] = k;
  for (const [k, v] of Object.entries(extra?.emblems || {})) EMBLEMS[k] = { ...v, ext: true };
  // O desenho embutido da foice e martelo é fino demais: usa o do Commons quando disponível (todas as bandeiras que citam 'hammersickle' passam a usá-lo).
  if (EMBLEMS.c_hs_red && EMBLEMS.hammersickle) EMBLEMS.hammersickle = { ...EMBLEMS.c_hs_red, name: EMBLEMS.hammersickle.name, cat: EMBLEMS.hammersickle.cat };
}
export const emblemCredits = () => Object.entries(EMBLEMS).filter(([, e]) => e.ext).map(([k, e]) => ({ key: k, name: e.name, ...e.src }));
export const historicalFlags = () => FLAGS.historical;
export const regionalFlags = () => Object.entries(FLAGS.regMeta).filter(([k]) => FLAGS.regional[k]).map(([key, m]) => ({ key, ...m }));
export const hasIsoFlag = code => !!FLAGS.current[String(code || '').toLowerCase()];

// Aceita {iso:'rs'}, {hist:'ussr'} ou uma especificação do editor.
export function flagHTML(f, w = 60) {
  if (f?.reg) {
    const svg = FLAGS.regional[f.reg];
    if (svg) return `<img class="flag-img" alt="" width="${w}" height="${Math.round(w * 0.75)}" style="object-fit:contain" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}">`;
    if (f.alt) return flagSVG(f.alt, w);
  }
  if (f?.iso) {
    const svg = FLAGS.current[f.iso.toLowerCase()];
    if (svg) return `<img class="flag-img" alt="" width="${w}" height="${Math.round(w * 0.75)}" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}">`;
  }
  if (f?.hist && FLAGS.historical[f.hist]) return flagSVG(FLAGS.historical[f.hist].spec, w);
  return flagSVG(f, w);
}

// Bandeira de uma entidade do registro (atual quando houver ISO; senão desenho próprio ou do soberano).
export function entityFlag(ent, w = 24, reg) {
  if (!ent) return '';
  if (ent.flag) return flagHTML(ent.flag, w);
  if (FLAGS.entReg[ent.id]) return flagHTML({ reg: FLAGS.entReg[ent.id] }, w);
  if (ent.iso2 && hasIsoFlag(ent.iso2)) return flagHTML({ iso: ent.iso2 }, w);
  const own = FLAGS.historical[ent.id?.toLowerCase()];
  if (own) return flagSVG(own.spec, w);
  const par = ent.parent && reg?.[ent.parent];
  if (par?.iso2) return flagHTML({ iso: par.iso2 }, w);
  return `<span class="flag-none" style="width:${w}px;height:${Math.round(w * 0.66)}px"></span>`;
}

let CLIP = 0;
export function flagSVG(f, w = 60) {
  if (f?.iso || f?.hist || f?.reg) return flagHTML(f, w);
  f = f && f.layout ? f : defaultFlag();
  const [a, b, c, d] = [f.colors[0], f.colors[1] || f.colors[0], f.colors[2] || f.colors[1] || f.colors[0], f.colors[3] || f.colors[2] || f.colors[0]];
  const W = 150, H = 100;
  let defs = '';
  let body = `<rect width="${W}" height="${H}" fill="${a}"/>`;
  switch (f.layout) {
    case 'h2': body += `<rect y="50" width="${W}" height="50" fill="${b}"/>`; break;
    case 'h3': body += `<rect y="33.3" width="${W}" height="33.4" fill="${b}"/><rect y="66.7" width="${W}" height="33.3" fill="${c}"/>`; break;
    case 'hcenter': body += `<rect y="25" width="${W}" height="50" fill="${b}"/><rect y="75" width="${W}" height="25" fill="${c}"/>`; break;
    case 'v2': body += `<rect x="40" width="110" height="${H}" fill="${b}"/>`; break;
    case 'v3': body += `<rect x="50" width="50" height="${H}" fill="${b}"/><rect x="100" width="50" height="${H}" fill="${c}"/>`; break;
    case 'diag': body += `<path d="M0 ${H}L${W} 0V${H}z" fill="${b}"/>`; break;
    case 'diag2': body += `<path d="M0 0L${W} ${H}H0z" fill="${b}"/>`; break;
    case 'nordic': body += `<rect x="40" width="22" height="${H}" fill="${b}"/><rect y="39" width="${W}" height="22" fill="${b}"/><rect x="46" width="10" height="${H}" fill="${c}"/><rect y="45" width="${W}" height="10" fill="${c}"/>`; break;
    case 'cross': body += `<rect x="62" width="26" height="${H}" fill="${b}"/><rect y="37" width="${W}" height="26" fill="${b}"/>`; break;
    case 'saltire': body += `<path d="M0 0L${W} ${H}M${W} 0L0 ${H}" stroke="${b}" stroke-width="20"/><path d="M0 0L${W} ${H}M${W} 0L0 ${H}" stroke="${c}" stroke-width="6"/>`; break;
    case 'canton': body += `<rect y="50" width="${W}" height="50" fill="${b}"/><rect width="60" height="50" fill="${c}"/>`; break;
    case 'triangle': body += `<rect y="33.3" width="${W}" height="33.4" fill="${b}"/><rect y="66.7" width="${W}" height="33.3" fill="${c}"/><path d="M0 0L60 50L0 100z" fill="${d}"/>`; break;
    case 'border': body += `<rect x="12" y="12" width="126" height="76" fill="${b}"/>`; break;
    case 'quarters': body += `<rect x="75" width="75" height="50" fill="${b}"/><rect y="50" width="75" height="50" fill="${c}"/><rect x="75" y="50" width="75" height="50" fill="${d}"/>`; break;
    case 'pale': body += `<rect x="37.5" width="75" height="${H}" fill="${b}"/>`; break;
    case 'bend': body += `<path d="M0 ${H}V78L128 0H${W}V22L22 ${H}z" fill="${b}"/>`; break;
    case 'bend2': body += `<path d="M0 0H22L${W} 78V${H}H128L0 22z" fill="${b}"/>`; break;
    case 'pall': body += `<path d="M0 0L55 50L0 100M55 50H${W}" stroke="${c}" stroke-width="34" fill="none"/><path d="M0 0L55 50L0 100M55 50H${W}" stroke="${b}" stroke-width="20" fill="none"/><path d="M0 18L35 50L0 82z" fill="${d}"/>`; break;
    case 'chevron': body += `<rect y="50" width="${W}" height="50" fill="${b}"/><path d="M0 0L75 50L0 100z" fill="${c}"/>`; break;
    case 'disc': body += `<circle cx="75" cy="50" r="30" fill="${b}"/>`; break;
    case 'stripes5': case 'stripes7': case 'stripes13': { const n = +f.layout.slice(7); for (let i = 1; i < n; i += 2) body += `<rect y="${(i * H / n).toFixed(2)}" width="${W}" height="${(H / n).toFixed(2)}" fill="${b}"/>`; break; }
    case 'vstripes5': for (let i = 1; i < 5; i += 2) body += `<rect x="${i * W / 5}" width="${W / 5}" height="${H}" fill="${b}"/>`; break;
    case 'rays': for (let i = 0; i < 16; i += 2) { const a1 = i / 16 * Math.PI * 2, a2 = (i + 1) / 16 * Math.PI * 2; body += `<path d="M75 50L${(75 + Math.cos(a1) * 200).toFixed(1)} ${(50 + Math.sin(a1) * 200).toFixed(1)}L${(75 + Math.cos(a2) * 200).toFixed(1)} ${(50 + Math.sin(a2) * 200).toFixed(1)}z" fill="${b}"/>`; } break;
    case 'checker': for (let y = 0; y < 4; y++) for (let x = 0; x < 6; x++) if ((x + y) % 2) body += `<rect x="${x * 25}" y="${y * 25}" width="25" height="25" fill="${b}"/>`; break;
    case 'hborder': body += `<rect width="${W}" height="18" fill="${b}"/><rect y="82" width="${W}" height="18" fill="${b}"/>`; break;
    case 'swallow': body += `<rect y="33.3" width="${W}" height="33.4" fill="${b}"/><rect y="66.7" width="${W}" height="33.3" fill="${c}"/>`; break;
    case 'cantonstripes': for (let i = 1; i < 9; i += 2) body += `<rect y="${(i * H / 9).toFixed(2)}" width="${W}" height="${(H / 9).toFixed(2)}" fill="${b}"/>`; body += `<rect width="66" height="${(5 * H / 9).toFixed(2)}" fill="${c}"/>`; break;
  }
  for (const e of f.emblems || []) {
    if (e.type === 'bar') { body += `<rect x="0" y="${(e.y - e.s / 2) * H}" width="${W}" height="${e.s * H}" fill="${e.color}"/>`; continue; }
    let em = EMBLEMS[e.type] || EMBLEMS[e.alt], mono = false;
    // Animais desenhados à mão foram removidos: águias e leões antigos viram silhuetas de brasões reais (Commons).
    if (!em) { const al = ANIMAL_ALIAS[e.type] || ANIMAL_ALIAS[e.alt]; if (al && EMBLEMS[al]) { em = EMBLEMS[al]; mono = true; } }
    if (!em) continue;
    const k = e.s * H / 100;
    const tf = `translate(${(e.x * W).toFixed(2)} ${(e.y * H).toFixed(2)}) rotate(${e.r || 0}) scale(${((e.fx ? -k : k) * (e.sx || 1)).toFixed(4)} ${k.toFixed(4)}) translate(-50 -50)`;
    if (em.ext) {
      if (em.multi && e.orig !== false && !mono) { body += `<g opacity="${e.op ?? 1}" transform="${tf}">${em.svg}</g>`; continue; }
      // Cor única: silhueta do desenho original pintada na cor escolhida, com contorno opcional.
      const id = 'em' + (++CLIP);
      defs += `<filter id="${id}" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB"><feFlood flood-color="${e.color}"/><feComposite in2="SourceAlpha" operator="in" result="c"/>${e.ow ? `<feMorphology in="SourceAlpha" operator="dilate" radius="${e.ow * 1.4}" result="d"/><feFlood flood-color="${e.oc || '#111111'}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="c"/></feMerge>` : ''}</filter>`;
      body += `<g opacity="${e.op ?? 1}" transform="${tf}"><g filter="url(#${id})">${em.svg}</g></g>`;
      continue;
    }
    const out = e.ow ? ` stroke="${e.oc || '#111111'}" stroke-width="${e.ow * 2.5}" stroke-linejoin="round" paint-order="stroke"` : ' stroke-width="0"';
    body += `<g fill="${e.color}" color="${e.color}"${out} opacity="${e.op ?? 1}" transform="${tf}">${em.svg}</g>`;
  }
  if (f.layout === 'swallow') { const id = 'swc' + (++CLIP); defs += `<defs><clipPath id="${id}"><path d="M0 0H${W}L112 50L${W} ${H}H0z"/></clipPath></defs>`; body = `<g clip-path="url(#${id})">${body}</g>`; }
  return `<svg viewBox="0 0 ${W} ${H}" width="${w}" height="${(w * 2) / 3}" xmlns="http://www.w3.org/2000/svg" style="border:1px solid rgba(0,0,0,.35)">${defs ? (defs.startsWith('<defs>') ? defs : `<defs>${defs}</defs>`) : ''}${body}</svg>`;
}

const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
export function randomFlag() {
  const keys = Object.keys(EMBLEMS);
  const n = Math.random() < 0.2 ? 0 : Math.random() < 0.7 ? 1 : 2;
  return { layout: rnd(Object.keys(LAYOUTS)), colors: [0, 1, 2, 3].map(() => rnd(SWATCHES)),
    emblems: Array.from({ length: n }, (_, i) => ({ type: rnd(keys), color: rnd(SWATCHES), x: i ? 0.72 : rnd([0.5, 0.25]), y: 0.5, s: i ? 0.26 : 0.5 })) };
}

let pickCat = 'animals';
export function mountFlagEditor(el, flag, onChange) {
  let sel = 0;
  flag.emblems ||= [];
  const render = () => {
    const e = flag.emblems[sel];
    const sw = (cur, attr) => `<div class="swatches">${SWATCHES.map(c => `<span style="background:${c}" class="${c === cur ? 'on' : ''}" data-${attr}="${c}"></span>`).join('')}<input type="color" value="${cur}" data-${attr}-input style="width:28px;height:20px;padding:0"></div>`;
    el.innerHTML = `
      <div class="row" style="align-items:flex-start;flex-wrap:nowrap;gap:14px">
        <div class="flag-preview">${flagSVG(flag, 180)}<button class="small" data-random style="margin-top:6px;width:100%">Aleatória</button></div>
        <div style="flex:1">
          <div class="form-grid" style="grid-template-columns:90px 1fr">
            <label>Modelo</label><select data-preset><option value="">— personalizada —</option>${Object.entries(PRESETS).map(([k, p]) => `<option value="${k}">${esc(p.name)}</option>`).join('')}</select>
            <label>Divisão</label><select data-layout>${Object.entries(LAYOUTS).map(([k, n]) => `<option value="${k}" ${k === flag.layout ? 'selected' : ''}>${n}</option>`).join('')}</select>
            ${[0, 1, 2, 3].map(i => `<label>Cor ${i + 1}</label>${sw(flag.colors[i] || flag.colors[0] || '#ffffff', 'c' + i)}`).join('')}
          </div>
        </div>
      </div>
      <div style="margin-top:8px">
        <div class="row small" style="flex-wrap:wrap;gap:4px"><b>Elementos (${flag.emblems.length}/10):</b> ${flag.emblems.map((x, i) => `<button class="small ${i === sel ? 'primary' : ''}" data-sel="${i}">${i + 1}. ${esc(EMBLEMS[x.type]?.name || x.type)}</button>`).join('')}
          ${flag.emblems.length < 10 ? '<button class="small" data-add>+ adicionar</button>' : ''}
          ${e ? '<button class="small" data-dup>duplicar</button><button class="small" data-up title="Trazer para a frente">▲</button><button class="small" data-down title="Mandar para trás">▼</button><button class="small danger" data-del>remover</button>' : ''}</div>
        ${e ? `<div class="seg small" style="margin:6px 0;flex-wrap:wrap">${Object.entries(EMBLEM_CATS).map(([k, n]) => `<button data-cat="${k}" class="${k === pickCat ? 'on' : ''}">${n}</button>`).join('')}</div>
        <div class="icon-pick" style="margin:6px 0;max-height:160px;overflow-y:auto">${Object.entries(EMBLEMS).filter(([, m]) => m.cat === pickCat).map(([k, m]) => `<button class="${k === e.type ? 'on' : ''}" data-type="${k}" title="${esc(m.name)}"><svg viewBox="0 0 100 100" fill="#1d2b45" color="#1d2b45">${m.svg}</svg>${m.ext ? '<i class="em-ext"></i>' : ''}</button>`).join('')}</div>
        <div class="form-grid" style="grid-template-columns:90px 1fr">
          <label>Cor</label>${sw(e.color, 'ec')}
          <label>Contorno</label><div><input type="range" min="0" max="4" step="0.5" value="${e.ow || 0}" data-r="ow" style="width:120px"> ${sw(e.oc || '#111111', 'oc')}</div>
          <label>Horizontal</label><input type="range" min="0" max="1" step="0.01" value="${e.x}" data-r="x">
          <label>Vertical</label><input type="range" min="0" max="1" step="0.01" value="${e.y}" data-r="y">
          <label>Tamanho</label><input type="range" min="0.05" max="1.2" step="0.01" value="${e.s}" data-r="s">
          <label>Largura</label><input type="range" min="0.4" max="2.5" step="0.05" value="${e.sx || 1}" data-r="sx">
          <label>Rotação</label><input type="range" min="-180" max="180" step="5" value="${e.r || 0}" data-r="r">
          <label>Opacidade</label><input type="range" min="0.15" max="1" step="0.05" value="${e.op ?? 1}" data-r="op">
          <label>Espelhar</label><label class="small"><input type="checkbox" data-fx ${e.fx ? 'checked' : ''}> inverter horizontalmente</label>
          ${EMBLEMS[e.type]?.multi ? `<label>Cores</label><label class="small"><input type="checkbox" data-orig ${e.orig !== false ? 'checked' : ''}> usar as cores originais do desenho (desmarque para pintar com uma cor só)</label>` : ''}
          ${EMBLEMS[e.type]?.ext ? `<label>Fonte</label><span class="small muted">${esc(EMBLEMS[e.type].src?.title || '')} — ${esc(EMBLEMS[e.type].src?.artist || 'autor desconhecido')} · ${esc(EMBLEMS[e.type].src?.license || '')} (Wikimedia Commons)</span>` : ''}
        </div>` : ''}
      </div>`;
  };
  const changed = () => { render(); onChange(flag); };
  el.addEventListener('click', ev => {
    const t = ev.target.closest('[data-c0],[data-c1],[data-c2],[data-c3],[data-ec],[data-oc],[data-sel],[data-add],[data-del],[data-dup],[data-up],[data-down],[data-type],[data-cat],[data-random]');
    if (!t) return;
    const e = flag.emblems[sel];
    for (let i = 0; i < 4; i++) if (t.dataset['c' + i]) flag.colors[i] = t.dataset['c' + i];
    if (t.dataset.ec) e.color = t.dataset.ec;
    if (t.dataset.oc) { e.oc = t.dataset.oc; if (!e.ow) e.ow = 1; }
    if (t.dataset.sel) sel = +t.dataset.sel;
    if (t.dataset.cat) { pickCat = t.dataset.cat; return render(); }
    if (t.hasAttribute('data-add')) { flag.emblems.push({ type: Object.keys(EMBLEMS).find(k => EMBLEMS[k].cat === pickCat) || 'star', color: '#ffffff', x: 0.5, y: 0.5, s: 0.3 }); sel = flag.emblems.length - 1; }
    if (t.hasAttribute('data-dup') && flag.emblems.length < 10) { flag.emblems.push({ ...e, x: Math.min(0.95, e.x + 0.1) }); sel = flag.emblems.length - 1; }
    if (t.hasAttribute('data-up') && sel < flag.emblems.length - 1) { [flag.emblems[sel], flag.emblems[sel + 1]] = [flag.emblems[sel + 1], flag.emblems[sel]]; sel++; }
    if (t.hasAttribute('data-down') && sel > 0) { [flag.emblems[sel], flag.emblems[sel - 1]] = [flag.emblems[sel - 1], flag.emblems[sel]]; sel--; }
    if (t.hasAttribute('data-del')) { flag.emblems.splice(sel, 1); sel = Math.max(0, sel - 1); }
    if (t.hasAttribute('data-random')) { Object.assign(flag, randomFlag()); sel = 0; }
    if (t.dataset.type) { e.type = t.dataset.type; delete e.orig; }
    changed();
  });
  el.addEventListener('input', ev => {
    const t = ev.target;
    if (t.dataset.r) { flag.emblems[sel][t.dataset.r] = +t.value; el.querySelector('.flag-preview svg').outerHTML = flagSVG(flag, 180); onChange(flag); return; }
    for (let i = 0; i < 4; i++) if (t.hasAttribute(`data-c${i}-input`)) { flag.colors[i] = t.value; return changed(); }
    if (t.hasAttribute('data-ec-input')) { flag.emblems[sel].color = t.value; changed(); }
    if (t.hasAttribute('data-oc-input')) { flag.emblems[sel].oc = t.value; if (!flag.emblems[sel].ow) flag.emblems[sel].ow = 1; changed(); }
  });
  el.addEventListener('change', ev => {
    const t = ev.target;
    if (t.matches('[data-fx]')) { flag.emblems[sel].fx = t.checked; return changed(); }
    if (t.matches('[data-orig]')) { flag.emblems[sel].orig = t.checked; return changed(); }
    if (t.matches('[data-layout]')) { flag.layout = t.value; for (let i = 0; i < 4; i++) flag.colors[i] ||= '#c8102e'; changed(); }
    if (t.matches('[data-preset]') && t.value) { Object.assign(flag, structuredClone(PRESETS[t.value])); sel = 0; changed(); }
  });
  render();
}
