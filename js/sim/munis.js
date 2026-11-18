// Municípios: microrregiões geradas proceduralmente DENTRO de cada província (o mapa não traz dados municipais).
// Cada província é dividida em células de Voronoi recortadas pelo seu contorno (determinísticas por id).
// Usados apenas na escolha de território (assistente) e nas guerras (teatro de operações); o mapa do jogo continua em províncias.
// Seleções parciais viram "províncias divididas" (applySplits), com população e área proporcionais.

const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const hashStr = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const r1 = v => Math.round(v * 10) / 10;

// Caminhos do jogo usam só M (absoluto), l (relativo) e z.
export function parseRings(d) {
  const rings = [];
  for (const part of String(d).split('M').slice(1)) {
    const nums = part.replace(/z/gi, '').split(/[l\s,]+|(?=-)/).filter(x => x !== '').map(Number);
    if (nums.length < 6) continue;
    let x = nums[0], y = nums[1];
    const ring = [[x, y]];
    for (let i = 2; i + 1 < nums.length; i += 2) { x += nums[i]; y += nums[i + 1]; ring.push([x, y]); }
    rings.push(ring);
  }
  return rings;
}
const areaOf = ring => { let a = 0; for (let i = 0; i < ring.length; i++) { const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % ring.length]; a += x1 * y2 - x2 * y1; } return a / 2; };
const centroidOf = ring => { let cx = 0, cy = 0, a = 0; for (let i = 0; i < ring.length; i++) { const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % ring.length], f = x1 * y2 - x2 * y1; a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f; } if (Math.abs(a) < 1e-9) return ring[0]; return [cx / (3 * a), cy / (3 * a)]; };
const inRing = (x, y, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const toD = polys => polys.map(p => 'M' + p.map(([x, y]) => r1(x) + ' ' + r1(y)).join('L') + 'z').join('');

// Recorta um polígono pelo semiplano {p : (p - m)·n <= 0} (Sutherland–Hodgman).
function clip(poly, m, n) {
  const out = [];
  const side = p => (p[0] - m[0]) * n[0] + (p[1] - m[1]) * n[1];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], sa = side(a), sb = side(b);
    if (sa <= 0) out.push(a);
    if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) { const t = sa / (sa - sb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}

const DIRS = ['Leste', 'Sudeste', 'Sul', 'Sudoeste', 'Oeste', 'Noroeste', 'Norte', 'Nordeste'];
const ROMAN = ['', ' II', ' III', ' IV', ' V', ' VI'];
export const muniCount = P => Math.max(3, Math.min(28, Math.round(2 + Math.sqrt((P.pop || 0) / 120000) + Math.sqrt(P.a || 1) / 55)));

const CACHE = new Map();
// { cells: [{ i, name, d, c:[x,y], aShare, share (população), pop, a }] } — pop em habitantes, a em km².
export function munisOf(P) {
  const key = P.id + ':' + P.d.length;
  if (CACHE.has(key)) return CACHE.get(key);
  const rings = parseRings(P.d).filter(r => r.length >= 3);
  const rnd = mulberry(hashStr(P.id));
  const n = rings.length ? muniCount(P) : 1;
  let big = rings[0], bigA = 0;
  for (const r of rings) { const a = Math.abs(areaOf(r)); if (a > bigA) { bigA = a; big = r; } }
  const seeds = [];
  if (big) {
    const xs = big.map(p => p[0]), ys = big.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const sample = () => { for (let k = 0; k < 300; k++) { const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0); if (inRing(x, y, big)) return [x, y]; } return centroidOf(big); };
    seeds.push(P.c && inRing(P.c[0], P.c[1], big) ? [P.c[0], P.c[1]] : sample()); // o município-sede fica no centro de gravidade
    while (seeds.length < n) { let best = null, bd = -1; for (let k = 0; k < 14; k++) { const q = sample(); const d = Math.min(...seeds.map(s => Math.hypot(s[0] - q[0], s[1] - q[1]))); if (d > bd) { bd = d; best = q; } } seeds.push(best); }
  }
  const cells = [];
  for (let i = 0; i < seeds.length; i++) {
    const polys = [];
    for (const ring of rings) {
      let poly = ring;
      for (let j = 0; j < seeds.length && poly.length >= 3; j++) {
        if (j === i) continue;
        const nrm = [seeds[j][0] - seeds[i][0], seeds[j][1] - seeds[i][1]], mid = [(seeds[i][0] + seeds[j][0]) / 2, (seeds[i][1] + seeds[j][1]) / 2];
        poly = clip(poly, mid, nrm);
      }
      if (poly.length >= 3 && Math.abs(areaOf(poly)) > 0.02) polys.push(poly);
    }
    if (!polys.length) continue;
    const tot = polys.reduce((a, p) => a + Math.abs(areaOf(p)), 0);
    const cx = polys.reduce((a, p) => a + centroidOf(p)[0] * Math.abs(areaOf(p)), 0) / tot, cy = polys.reduce((a, p) => a + centroidOf(p)[1] * Math.abs(areaOf(p)), 0) / tot;
    cells.push({ i, d: toD(polys), c: [r1(cx), r1(cy)], area: tot, polys });
  }
  if (!cells.length) cells.push({ i: 0, d: P.d, c: P.c, area: 1, polys: rings });
  const totA = cells.reduce((a, c) => a + c.area, 0) || 1;
  // População: proporcional à área com variação e uma sede mais populosa.
  const w = cells.map((c, k) => (c.area / totA) * (0.55 + rnd() * 1.1) * (k === 0 ? 1.5 + Math.min(1.5, Math.max(0, Math.log10(Math.max(10, (P.pop || 0) / 1000)) - 2) * 0.3) : 1));
  const wt = w.reduce((a, b) => a + b, 0) || 1;
  const px = P.c || cells[0].c;
  const used = {};
  cells.forEach((c, k) => {
    c.aShare = c.area / totA; c.share = w[k] / wt;
    c.pop = Math.round((P.pop || 0) * c.share); c.a = Math.max(1, (P.a || 1) * c.aShare);
    const dx = c.c[0] - px[0], dy = c.c[1] - px[1], len = Math.hypot(dx, dy);
    const span = Math.sqrt(totA) * 0.28;
    let nm;
    if (k === 0) nm = `${P.n} (sede)`;
    else if (len < span) nm = `${P.n} Centro`;
    else { const ang = Math.atan2(dy, dx), idx = ((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8; nm = `${P.n} ${DIRS[idx]}`; }
    const base = nm; used[base] = (used[base] || 0) + 1; if (used[base] > 1) nm = base + (ROMAN[used[base] - 1] || ' ' + used[base]);
    c.name = nm;
  });
  const out = { cells, byI: Object.fromEntries(cells.map(c => [c.i, c])) };
  CACHE.set(key, out);
  return out;
}

// Ordem em que as células caem: da mais próxima do lado atacante (pontos de origem) à mais distante.
export function frontOrder(P, fromPoints) {
  const M = munisOf(P);
  if (!fromPoints?.length) return M.cells.map(c => c.i);
  return [...M.cells].sort((a, b) => Math.min(...fromPoints.map(f => Math.hypot(a.c[0] - f[0], a.c[1] - f[1]))) - Math.min(...fromPoints.map(f => Math.hypot(b.c[0] - f[0], b.c[1] - f[1])))).map(c => c.i);
}

// ---------- Divisão de províncias (seleção parcial por municípios) ----------
const distSeg = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy; let t = l ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy)); };
function touches(polysA, ringsB, tol = 1.6) {
  for (const A of polysA) for (const B of ringsB) {
    for (const p of B) { if (inRing(p[0], p[1], A)) return true; for (let i = 0; i < A.length; i++) if (distSeg(p, A[i], A[(i + 1) % A.length]) <= tol) return true; }
    for (const p of A) for (let i = 0; i < B.length; i++) if (distSeg(p, B[i], B[(i + 1) % B.length]) <= tol) return true;
  }
  return false;
}
const centroidOfCells = cells => { const t = cells.reduce((a, c) => a + c.area, 0) || 1; return [r1(cells.reduce((a, c) => a + c.c[0] * c.area, 0) / t), r1(cells.reduce((a, c) => a + c.c[1] * c.area, 0) / t)]; };

export const splitId = (pid, cells) => `${pid}~${hashStr(cells.join(',')).toString(36).slice(0, 4)}`;
export function splitName(P, cells, M) { const sel = cells.map(i => M.byI[i]).filter(Boolean); if (sel.length === 1) return sel[0].name; if (sel.length <= 2) return sel.map(c => c.name).join(' + '); return `${P.n} (${sel.length} municípios)`; }

// Devolve dados com províncias novas: não altera o objeto original (copia só o necessário).
export function applySplits(data, splits) {
  if (!splits?.length) return data;
  const geo = data.geo, prov = { ...geo.prov }, byCountry = { ...geo.byCountry }, cOf = { ...geo.cOf }, edges = [...geo.edges];
  for (const sp of splits) {
    const P = geo.prov[sp.parent]; if (!P || prov[sp.id]) continue;
    const M = munisOf(P), sel = new Set(sp.cells);
    const inC = M.cells.filter(c => sel.has(c.i)), outC = M.cells.filter(c => !sel.has(c.i));
    if (!inC.length || !outC.length) continue;
    const share = inC.reduce((a, c) => a + c.share, 0), aShare = inC.reduce((a, c) => a + c.aShare, 0);
    const inPolys = inC.flatMap(c => c.polys), outPolys = outC.flatMap(c => c.polys);
    const piece = { id: sp.id, n: sp.name || splitName(P, sp.cells, M), a3: P.a3, t: P.t, a: Math.max(1, Math.round(P.a * aShare)), c: centroidOfCells(inC), d: toD(inPolys), nb: [sp.parent], coast: P.coast, rg: P.rg, pop: Math.round((P.pop || 0) * share), synthetic: true, split: sp.parent, munis: inC.map(c => c.name) };
    for (const nid of P.nb || []) {
      const N = prov[nid]; if (!N) continue;
      const rings = parseRings(N.d);
      if (touches(inPolys, rings)) { piece.nb.push(nid); prov[nid] = { ...N, nb: [...N.nb, sp.id] }; }
    }
    prov[sp.id] = piece;
    prov[sp.parent] = { ...P, d: toD(outPolys), a: Math.max(1, Math.round(P.a * (1 - aShare))), pop: Math.round((P.pop || 0) * (1 - share)), c: centroidOfCells(outC), nb: [...(P.nb || []), sp.id] };
    const home = geo.cOf?.[sp.parent] || P.a3;
    byCountry[home] = [...(byCountry[home] || []), sp.id]; cOf[sp.id] = home;
    edges.push([sp.id, sp.parent, piece.d.replace(/z/g, 'z')]);
  }
  return { ...data, geo: { ...geo, prov, byCountry, cOf, edges } };
}
