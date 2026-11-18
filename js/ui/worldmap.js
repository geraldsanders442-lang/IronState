// Mapa interativo em SVG a partir das províncias Natural Earth pré-projetadas.
// Os territórios são preenchidos por província; fronteiras nacionais são desenhadas só onde os donos diferem.
const NS = 'http://www.w3.org/2000/svg';

export class WorldMap {
  constructor(el, geo, opts = {}) {
    this.el = el; this.geo = geo; this.o = opts;
    this.W = geo.meta.width; this.H = geo.meta.height;
    this.vb = opts.view ? [...opts.view] : [0, 0, this.W, this.H];
    this.build();
  }

  build() {
    const { geo } = this;
    this.el.classList.add('wmap');
    this.el.innerHTML = `<div class="wm-tools"><button data-z="in" title="Aproximar">+</button><button data-z="out" title="Afastar">−</button><button data-z="reset" title="Mapa inteiro">⤢</button>${this.o.search !== false ? '<input data-search placeholder="Buscar país…" list="wm-list"><datalist id="wm-list"></datalist>' : ''}</div><div class="wm-tip" hidden></div>`;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', this.vb.join(' '));
    svg.innerHTML = `<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="transparent"/><line x1="0" y1="0" x2="0" y2="6" stroke="#7a1d12" stroke-width="2.2" opacity=".75"/></pattern>
      <pattern id="hatch2" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#1d2b45" stroke-width="2" opacity=".6"/></pattern></defs>
      <path class="wm-sphere" d="${geo.meta.sphere}"/><path class="wm-grat" d="${geo.meta.graticule}"/>
      <g class="wm-prov"></g><g class="wm-occ"></g><path class="wm-inner"/><path class="wm-coast"/><path class="wm-border"/><path class="wm-selb"/><path class="wm-hover"/><g class="wm-ov"></g><g class="wm-lab"></g>`;
    this.el.prepend(svg);
    this.svg = svg;
    const g = svg.querySelector('.wm-prov');
    const frag = document.createDocumentFragment();
    this.paths = {};
    for (const id in geo.prov) {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', geo.prov[id].d);
      p.dataset.p = id;
      frag.appendChild(p);
      this.paths[id] = p;
    }
    g.appendChild(frag);
    svg.querySelector('.wm-coast').setAttribute('d', geo.edges.filter(e => !e[1]).map(e => e[2]).join(''));
    const dl = this.el.querySelector('#wm-list');
    if (dl) dl.innerHTML = Object.values(geo.countries).sort((a, b) => a.name.localeCompare(b.name)).map(c => `<option value="${c.name}">`).join('');
    this.bindEvents();
    this.recolor();
  }

  owner(pid) { return this.o.owner ? this.o.owner(pid) : this.geo.prov[pid].a3; }

  recolor() {
    const { geo } = this;
    const own = {};
    for (const id in this.paths) {
      own[id] = this.owner(id);
      const fill = this.o.color ? this.o.color(id, own[id]) : '#e9e4d4';
      this.paths[id].setAttribute('fill', fill);
      this.paths[id].setAttribute('stroke', fill);
    }
    this.own = own;
    const border = [], inner = [], selb = [];
    const sel = this.o.selection;
    for (const e of geo.edges) {
      if (!e[1]) continue;
      if (own[e[0]] !== own[e[1]]) border.push(e[2]); else inner.push(e[2]);
      if (sel && sel.has(e[0]) !== sel.has(e[1])) selb.push(e[2]);
    }
    if (sel) for (const e of geo.edges) if (!e[1] && sel.has(e[0])) selb.push(e[2]);
    this.svg.querySelector('.wm-border').setAttribute('d', border.join(''));
    this.svg.querySelector('.wm-inner').setAttribute('d', inner.join(''));
    this.svg.querySelector('.wm-selb').setAttribute('d', selb.join(''));
    const occ = this.o.occupied ? this.o.occupied() : {};
    this.svg.querySelector('.wm-occ').innerHTML = Object.keys(occ).filter(id => geo.prov[id]).map(id => `<path d="${geo.prov[id].d}" fill="url(#hatch)" pointer-events="none"/>`).join('');
    this.el.classList.toggle('show-inner', !!this.o.provinceMode || this.zoom() > 3);
    this.drawLabels();
  }

  setOverlay(svgString) { this.svg.querySelector('.wm-ov').innerHTML = svgString || ''; this.updateScaled(); }
  // Marcadores com data-sx/data-sy mantêm tamanho constante na tela, em qualquer zoom.
  updateScaled() {
    const k = this.vb[2] / (this.svg.getBoundingClientRect().width || 1000);
    for (const g of this.svg.querySelectorAll('[data-sx]')) g.setAttribute('transform', `translate(${g.dataset.sx} ${g.dataset.sy}) scale(${k.toFixed(4)})`);
  }
  zoom() { return this.W / this.vb[2]; }

  drawLabels() {
    if (this.o.labels === false) { this.svg.querySelector('.wm-lab').innerHTML = ''; return; }
    const z = this.zoom(), px = (this.svg.getBoundingClientRect().width || 1000) / this.vb[2], fs = 11 / px;
    const groups = {};
    for (const id in this.own) { const o = this.own[id], p = this.geo.prov[id]; const g = groups[o] ||= { a: 0, x: 0, y: 0 }; g.a += p.a; g.x += p.c[0] * p.a; g.y += p.c[1] * p.a; }
    const [vx, vy, vw, vh] = this.vb;
    let out = '';
    for (const o in groups) {
      const g = groups[o];
      if (g.a < 1) continue;
      const c = this.geo.countries[o];
      let x = g.x / g.a, y = g.y / g.a;
      if (c && this.o.useLabelPoint !== false && this.geo.countries[o].provinces.every(pid => this.own[pid] === o)) [x, y] = c.label;
      if (x < vx || x > vx + vw || y < vy || y > vy + vh) continue;
      const name = this.o.labelOf ? this.o.labelOf(o) : c?.name || o;
      if (!name || Math.sqrt(g.a) / 20 * px < name.length * 6.5) continue;
      out += `<text x="${x}" y="${y}" style="font-size:${fs}px">${name.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
    }
    this.svg.querySelector('.wm-lab').innerHTML = out;
  }

  setView(vb) {
    const minW = this.W / 60;
    vb[2] = Math.max(minW, Math.min(this.W, vb[2])); vb[3] = vb[2] * this.H / this.W;
    vb[0] = Math.max(-vb[2] * 0.3, Math.min(this.W - vb[2] * 0.7, vb[0]));
    vb[1] = Math.max(-vb[3] * 0.3, Math.min(this.H - vb[3] * 0.7, vb[1]));
    this.vb = vb;
    this.svg.setAttribute('viewBox', vb.map(v => v.toFixed(1)).join(' '));
    this.el.classList.toggle('show-inner', !!this.o.provinceMode || this.zoom() > 3);
    this.el.style.setProperty('--z', this.zoom());
    this.updateScaled();
    clearTimeout(this._lt); this._lt = setTimeout(() => this.drawLabels(), 80);
  }
  zoomAt(f, cx, cy) {
    const [x, y, w, h] = this.vb, nw = w / f, nh = h / f;
    this.setView([cx - (cx - x) / f, cy - (cy - y) / f, nw, nh]);
  }
  zoomToBox([x0, y0, x1, y1], pad = 0.25) {
    let w = (x1 - x0) * (1 + pad * 2), h = (y1 - y0) * (1 + pad * 2);
    w = Math.max(w, h * this.W / this.H, 40);
    this.setView([(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - (w * this.H / this.W) / 2, w, w * this.H / this.W]);
  }
  boxOf(pids) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const id of pids) { const b = this.paths[id]?.getBBox?.(); if (!b || !b.width) continue; x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); }
    return x0 < 1e9 ? [x0, y0, x1, y1] : null;
  }
  zoomToProvinces(pids, pad) {
    // Ignora possessões ultramarinas distantes para enquadrar o núcleo do país.
    const list = [...pids];
    if (!list.length) return;
    const big = list.reduce((b, id) => this.geo.prov[id].a > this.geo.prov[b].a ? id : b, list[0]);
    const c0 = this.geo.prov[big].c;
    const core = list.filter(id => { const c = this.geo.prov[id].c; return Math.hypot(c[0] - c0[0], c[1] - c0[1]) < 260; });
    const b = this.boxOf(core.length ? core : list);
    if (b) this.zoomToBox(b, pad);
  }

  toSvg(e) {
    const pt = this.svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(this.svg.getScreenCTM().inverse());
  }

  hoverOutline(owner) {
    const h = this.svg.querySelector('.wm-hover');
    if (!owner) { h.setAttribute('d', ''); return; }
    const own = this.own, out = [];
    for (const e of this.geo.edges) {
      const a = own[e[0]] === owner, b = e[1] ? own[e[1]] === owner : false;
      if (a !== b || (!e[1] && a)) out.push(e[2]);
    }
    h.setAttribute('d', out.join(''));
  }

  bindEvents() {
    const svg = this.svg, tip = this.el.querySelector('.wm-tip');
    let drag = null, moved = false, lastHover = null;
    svg.addEventListener('wheel', e => { e.preventDefault(); const p = this.toSvg(e); this.zoomAt(e.deltaY < 0 ? 1.25 : 0.8, p.x, p.y); }, { passive: false });
    // Pinça com dois dedos para aproximar/afastar (celular).
    let pinch = 0;
    const tdist = ts => Math.hypot(ts[0].clientX - ts[1].clientX, ts[0].clientY - ts[1].clientY);
    svg.addEventListener('touchstart', e => { if (e.touches.length === 2) { pinch = tdist(e.touches); drag = null; moved = true; } }, { passive: true });
    svg.addEventListener('touchmove', e => { if (e.touches.length === 2 && pinch) { e.preventDefault(); const d = tdist(e.touches), p = this.toSvg({ clientX: (e.touches[0].clientX + e.touches[1].clientX) / 2, clientY: (e.touches[0].clientY + e.touches[1].clientY) / 2 }); this.zoomAt(d / pinch, p.x, p.y); pinch = d; } }, { passive: false });
    svg.addEventListener('touchend', e => { if (e.touches.length < 2) pinch = 0; });
    svg.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, vb: [...this.vb] }; moved = false; });
    window.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      if (!moved) return;
      const r = svg.getBoundingClientRect(), k = drag.vb[2] / r.width;
      this.setView([drag.vb[0] - dx * k, drag.vb[1] - dy * k, drag.vb[2], drag.vb[3]]);
    });
    window.addEventListener('pointerup', () => { drag = null; });
    svg.addEventListener('mousemove', e => {
      if (drag && moved) return;
      const t = e.target.closest?.('[data-p]');
      const pid = t?.dataset.p || null;
      const owner = pid ? this.own[pid] : null;
      const key = this.o.provinceMode ? pid : owner;
      if (key !== lastHover) { lastHover = key; this.hoverOutline(this.o.provinceMode ? null : owner); if (this.o.provinceMode && pid) this.svg.querySelector('.wm-hover').setAttribute('d', pid ? this.geo.prov[pid].d : ''); }
      const html = pid && this.o.tip ? this.o.tip(pid, owner) : '';
      if (!html) { tip.hidden = true; return; }
      tip.innerHTML = html; tip.hidden = false;
      const r = this.el.getBoundingClientRect();
      tip.style.left = Math.min(r.width - tip.offsetWidth - 6, e.clientX - r.left + 14) + 'px';
      tip.style.top = Math.min(r.height - tip.offsetHeight - 6, e.clientY - r.top + 14) + 'px';
    });
    svg.addEventListener('mouseleave', () => { tip.hidden = true; lastHover = null; this.hoverOutline(null); });
    svg.addEventListener('click', e => {
      if (moved) return;
      const t = e.target.closest?.('[data-p]');
      const ov = e.target.closest?.('[data-ov]');
      if (ov && this.o.onOverlay) return this.o.onOverlay(ov.dataset.ov, e);
      if (t && this.o.onClick) this.o.onClick(t.dataset.p, this.own[t.dataset.p], e);
    });
    this.el.querySelector('.wm-tools').addEventListener('click', e => {
      const z = e.target.closest('[data-z]')?.dataset.z;
      if (!z) return;
      const [x, y, w, h] = this.vb;
      if (z === 'in') this.zoomAt(1.6, x + w / 2, y + h / 2);
      if (z === 'out') this.zoomAt(1 / 1.6, x + w / 2, y + h / 2);
      if (z === 'reset') this.setView([0, 0, this.W, this.H]);
    });
    this.el.querySelector('[data-search]')?.addEventListener('change', e => {
      const q = e.target.value.trim().toLowerCase();
      const c = Object.values(this.geo.countries).find(x => x.name.toLowerCase() === q) || Object.values(this.geo.countries).find(x => x.name.toLowerCase().includes(q) || x.nameEn.toLowerCase().includes(q));
      if (!c) return;
      const pids = Object.keys(this.own).filter(id => this.own[id] === c.id);
      this.zoomToProvinces(pids.length ? pids : c.provinces, 0.6);
      this.o.onSearch?.(c.id);
    });
  }
}
