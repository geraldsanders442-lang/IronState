// Biblioteca de emblemas para bandeiras (caixa 100×100). Partes desenhadas com traço usam stroke="currentColor"
// para manter a cor do emblema mesmo quando o contorno usa outra cor.
// A categoria 'totalitarian' reúne símbolos históricos de regimes totalitários, disponíveis a pedido do jogador; o jogo penaliza seu uso.
const P = pts => pts.map(([x, y]) => `${+x.toFixed(1)},${+y.toFixed(1)}`).join(' ');
const poly = pts => `<polygon points="${P(pts)}"/>`;
const mir = pts => poly(pts) + poly(pts.map(([x, y]) => [100 - x, y]));
const rot = (svg, deg) => `<g transform="rotate(${deg} 50 50)">${svg}</g>`;
const ring = (n, f) => Array.from({ length: n }, (_, i) => f(i, i / n * Math.PI * 2)).join('');
const starPts = (n, r1, r2, cx = 50, cy = 50, a0 = -Math.PI / 2) => Array.from({ length: n * 2 }, (_, i) => { const a = a0 + i * Math.PI / n, r = i % 2 ? r2 : r1; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
const star = (n, r1, r2, cx, cy) => poly(starPts(n, r1, r2, cx, cy));
const rays = (n, r1, r2, w = 0.12, a0 = 0, span = Math.PI * 2) => `<path d="${Array.from({ length: n }, (_, i) => { const a = a0 + i / n * span; const p = (r, d) => `${(50 + Math.cos(a + d) * r).toFixed(1)} ${(50 + Math.sin(a + d) * r).toFixed(1)}`; return `M${p(r1, -w)}L${p(r2, 0)}L${p(r1, w)}Z`; }).join('')}"/>`;
const circ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const sector = (r1, r2, a1, a2) => { const p = (r, a) => `${(50 + Math.cos(a) * r).toFixed(2)} ${(50 + Math.sin(a) * r).toFixed(2)}`; return `M${p(r1, a1)}L${p(r2, a1)}A${r2} ${r2} 0 0 1 ${p(r2, a2)}L${p(r1, a2)}A${r1} ${r1} 0 0 0 ${p(r1, a1)}Z`; };
const deg = d => d * Math.PI / 180;
const SWORD = 'M47 5h6v60h12v6H53v10h4v8H43v-8h4V71H35v-6h12z';
const RIFLE = 'M4 44H60l4-4h28v7H70l-4 5H56l5 18H50l-4-16H37l-6 8H18l4-10H4z';
const SKULL = `M50 8C26 8 14 26 16 46c1 12 8 18 14 20v20h40V66c6-2 13-8 14-20C86 26 74 8 50 8z${circ(39, 42, 9)}${circ(61, 42, 9)}M50 52l-5 10h10z M37 72h3v12h-3z M48.5 72h3v12h-3z M60 72h3v12h-3z`;
const BONE = '<rect x="10" y="46" width="80" height="8"/><circle cx="10" cy="44" r="6"/><circle cx="10" cy="56" r="6"/><circle cx="90" cy="44" r="6"/><circle cx="90" cy="56" r="6"/>';
const EAGLE_WING = [[50, 34], [40, 30], [34, 18], [30, 28], [22, 14], [20, 30], [10, 22], [12, 36], [4, 34], [10, 48], [24, 52], [38, 48]];
const EAGLE_BODY = '<ellipse cx="50" cy="54" rx="11" ry="17"/>' + poly([[42, 66], [36, 90], [45, 82], [50, 94], [55, 82], [64, 90], [58, 66]]) + mir([[42, 64], [30, 74], [33, 78], [45, 69]]);
const FLAME = 'M50 6c16 20 23 33 13 50 8-4 10-13 9-19 11 16 4 40-22 47-26-7-33-31-22-47-1 6 1 15 9 19-10-17-3-30 13-50z';
const leaves = (n, r, a1, a2, flip) => ring(n, i => { const a = deg(a1 + (a2 - a1) * i / (n - 1)), x = 50 + Math.cos(a) * r, y = 50 + Math.sin(a) * r; return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4" ry="9" transform="rotate(${(a * 180 / Math.PI + (flip ? -25 : 25)).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; });

export const EMBLEM_CATS = { arms: 'Brasões reais (Commons)', forms: 'Formas', heraldry: 'Heráldica', national: 'Nacionais e nacionalistas', religion: 'Religião', politics: 'Política e ideologia', communism: 'Comunismo e esquerda', fascism: 'Fascismo e autoritarismo', imperial: 'Brasões e insígnias imperiais', war: 'Armas e guerra', heavy: 'Pesados', totalitarian: 'Regimes totalitários (histórico)', nature: 'Natureza', objects: 'Objetos e técnica' };

const E = (cat, name, svg) => ({ cat, name, svg });
export const EMBLEMS = {
  // ---- Formas ----
  star: E('forms', 'Estrela', star(5, 46, 18)),
  starline: E('forms', 'Estrela vazada', `<polygon points="${P(starPts(5, 44, 17))}" fill="none" stroke="currentColor" stroke-width="7"/>`),
  star4: E('forms', 'Estrela de quatro pontas', star(4, 46, 12)),
  star6: E('forms', 'Estrela de seis pontas', star(6, 46, 24)),
  star7: E('forms', 'Estrela de sete pontas', star(7, 46, 20)),
  star8: E('forms', 'Estrela de oito pontas', star(8, 46, 22)),
  star12: E('forms', 'Estrela de doze raios', star(12, 46, 28)),
  stars3: E('forms', 'Três estrelas', star(5, 16, 6.5, 18, 50) + star(5, 16, 6.5, 50, 50) + star(5, 16, 6.5, 82, 50)),
  starring: E('forms', 'Anel de estrelas', ring(12, (i, a) => star(5, 7, 2.8, 50 + Math.cos(a) * 38, 50 + Math.sin(a) * 38))),
  starsarc: E('forms', 'Arco de estrelas', ring(7, i => { const a = deg(200 + i * 23.3); return star(5, 8, 3.2, 50 + Math.cos(a) * 40, 70 + Math.sin(a) * 40); })),
  circle: E('forms', 'Disco', '<circle cx="50" cy="50" r="40"/>'),
  ring: E('forms', 'Anel', '<circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="9"/>'),
  crescent: E('forms', 'Crescente', '<path d="M60 8a42 42 0 1 0 0 84a28 42 0 0 1 0-84z"/>'),
  crescentstar: E('forms', 'Crescente e estrela', '<path d="M52 8a42 42 0 1 0 0 84a28 42 0 0 1 0-84z"/>' + star(5, 15, 6, 72, 50)),
  diamond: E('forms', 'Losango', poly([[50, 4], [92, 50], [50, 96], [8, 50]])),
  triangle: E('forms', 'Triângulo', poly([[50, 8], [94, 88], [6, 88]])),
  square: E('forms', 'Quadrado', '<rect x="12" y="12" width="76" height="76"/>'),
  heart: E('forms', 'Coração', '<path d="M50 88C20 66 6 50 6 32 6 18 18 8 30 8c10 0 16 6 20 14 4-8 10-14 20-14 12 0 24 10 24 24 0 18-14 34-44 56z"/>'),
  chevron: E('forms', 'Divisa', poly([[6, 60], [50, 20], [94, 60], [94, 80], [50, 40], [6, 80]])),
  arrow: E('forms', 'Flecha', poly([[50, 4], [86, 44], [62, 44], [62, 96], [38, 96], [38, 44], [14, 44]])),
  bars3: E('forms', 'Três barras', '<rect x="10" y="14" width="80" height="14"/><rect x="10" y="43" width="80" height="14"/><rect x="10" y="72" width="80" height="14"/>'),
  target: E('forms', 'Alvo', `<path fill-rule="evenodd" d="${circ(50, 50, 44)}${circ(50, 50, 32)}${circ(50, 50, 20)}${circ(50, 50, 8)}"/>`),
  // ---- Heráldica ----
  shield: E('heraldry', 'Escudo', '<path d="M15 8h70v37c0 26-17 39-35 48C32 84 15 71 15 45z"/>'),
  shieldline: E('heraldry', 'Escudo vazado', '<path d="M17 10h66v35c0 24-16 37-33 46-17-9-33-22-33-46z" fill="none" stroke="currentColor" stroke-width="6"/>'),
  crown: E('heraldry', 'Coroa', '<path d="M10 78L16 28l19 23 15-31 15 31 19-23 6 50z"/>'),
  crownimp: E('heraldry', 'Coroa imperial', '<path d="M14 82V58c0-18 16-34 36-36 20 2 36 18 36 36v24z"/><rect x="10" y="80" width="80" height="10"/><path d="M47 4h6v8h6v6h-6v6h-6v-6h-6v-6h6z"/>'),
  laurel: E('heraldry', 'Coroa de louros', leaves(9, 38, 100, 250) + leaves(9, 38, 80, -70, true)),
  // ---- Brasões e insígnias imperiais (desenhos simplificados; os originais heráldicos pesam megabytes) ----
  imp_brazil_arms: E('imperial', 'Armas do Império do Brasil', '<g transform="translate(0 8)">' + leaves(9, 34, 100, 250) + leaves(9, 34, 80, -70, true) + '</g><g fill="none" stroke="currentColor" stroke-width="4"><circle cx="50" cy="54" r="19"/><ellipse cx="50" cy="54" rx="8" ry="19"/><path d="M31 54h38M35 44h30M35 64h30"/></g><path d="M45 42h10v8h8v8h-8v8H45v-8h-8v-8h8z"/><path d="M32 22V14c0-7 8-11 18-11s18 4 18 11v8z"/><rect x="30" y="20" width="40" height="5"/><path d="M48 0h4v5h4v4h-4v4h-4V9h-4V5h4z"/>'),
  imp_orb: E('imperial', 'Globo imperial', '<circle cx="50" cy="56" r="30"/><g fill="none" stroke="#000" stroke-opacity=".35" stroke-width="3"><ellipse cx="50" cy="56" rx="30" ry="11"/><path d="M50 26v60"/></g><path d="M46 4h8v10h10v8H54v8h-8v-8H36v-8h10z"/>'),
  imp_eagle_arms: E('imperial', 'Águia imperial coroada', mir(EAGLE_WING) + EAGLE_BODY + '<path d="M38 20l3-10 5 6 4-9 4 9 5-6 3 10z"/>'),
  castle: E('heraldry', 'Castelo', '<path d="M18 92V40h8V28h8v12h8V28h16v12h8V28h8v12h8v52H58V72c0-8-16-8-16 0v20z"/>'),
  tower: E('heraldry', 'Torre', '<path d="M30 92V30h-6V12h10v8h8v-8h16v8h8v-8h10v18h-6v62H56V74c0-8-12-8-12 0v18z"/>'),
  key: E('heraldry', 'Chave', `<path fill-rule="evenodd" d="${circ(26, 50, 18)}${circ(26, 50, 8)}M42 46h50v8h-8v10h-8V54h-6v8h-8v-8H42z"/>`),
  keys: E('heraldry', 'Chaves cruzadas', rot(`<path fill-rule="evenodd" d="${circ(22, 50, 14)}${circ(22, 50, 6)}M34 47h58v6h-6v8h-6v-8h-5v6h-6v-6H34z"/>`, 40) + rot(`<path fill-rule="evenodd" d="${circ(22, 50, 14)}${circ(22, 50, 6)}M34 47h58v6h-6v8h-6v-8h-5v6h-6v-6H34z"/>`, 140)),
  fleur: E('heraldry', 'Flor-de-lis', '<path d="M50 4c10 12 12 26 6 40 10-14 30-14 34 2 2 10-6 16-14 14 6-6 2-14-6-10-6 4-10 10-12 18h8v8H34v-8h8c-2-8-6-14-12-18-8-4-12 4-6 10-8 2-16-4-14-14 4-16 24-16 34-2-6-14-4-28 6-40z"/><path d="M44 82h12l-6 14z"/>'),
  tudorrose: E('heraldry', 'Rosa heráldica', ring(5, (i, a) => `<circle cx="${(50 + Math.cos(a - Math.PI / 2) * 24).toFixed(1)}" cy="${(50 + Math.sin(a - Math.PI / 2) * 24).toFixed(1)}" r="20"/>`) + '<circle cx="50" cy="50" r="12"/>'),
  helmet: E('heraldry', 'Elmo', '<path d="M14 64c0-28 16-46 36-46s36 18 36 46h10v8H4v-8z"/><path d="M47 4h6v16h-6z"/>'),
  knot: E('heraldry', 'Nó celta', '<g fill="none" stroke="currentColor" stroke-width="8"><circle cx="50" cy="32" r="18"/><circle cx="32" cy="64" r="18"/><circle cx="68" cy="64" r="18"/></g>'),
  // ---- Religião ----
  cross: E('religion', 'Cruz grega', '<path d="M41 6h18v35h35v18H59v35H41V59H6V41h35z"/>'),
  crosslatin: E('religion', 'Cruz latina', '<path d="M43 4h14v26h23v14H57v52H43V44H20V30h23z"/>'),
  crossortho: E('religion', 'Cruz ortodoxa', '<path d="M46 4h8v92h-8z M38 14h24v6H38z M24 30h52v8H24z"/>' + poly([[30, 66], [70, 58], [70, 64], [30, 72]])),
  crossmaltese: E('religion', 'Cruz de Malta', [0, 90, 180, 270].map(d => rot(poly([[50, 48], [34, 6], [50, 18], [66, 6]]), d)).join('')),
  crosspattee: E('religion', 'Cruz pátea', [0, 90, 180, 270].map(d => rot(poly([[50, 50], [36, 6], [64, 6]]), d)).join('')),
  crosslorraine: E('religion', 'Cruz de Lorena', '<path d="M46 6h8v90h-8z M34 20h32v7H34z M24 38h52v8H24z"/>'),
  crosscoptic: E('religion', 'Cruz ancorada', '<path d="M45 8h10v34h34v10H55v40H45V52H11V42h34z"/>' + ['<circle cx="50" cy="8" r="7"/>', '<circle cx="50" cy="92" r="7"/>', '<circle cx="11" cy="47" r="7"/>', '<circle cx="89" cy="47" r="7"/>'].join('')),
  hexagram: E('religion', 'Estrela de Davi', `<g fill="none" stroke="currentColor" stroke-width="6">${poly([[50, 6], [88, 72], [12, 72]])}${poly([[50, 94], [12, 28], [88, 28]])}</g>`),
  ankh: E('religion', 'Ankh', '<ellipse cx="50" cy="26" rx="14" ry="18" fill="none" stroke="currentColor" stroke-width="9"/><path d="M45 42h10v54H45zM22 44h56v10H22z"/>'),
  dharma: E('religion', 'Roda do dharma', '<circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="7"/><circle cx="50" cy="50" r="9"/>' + ring(8, (i, a) => `<path d="M50 50L${(50 + Math.cos(a) * 46).toFixed(1)} ${(50 + Math.sin(a) * 46).toFixed(1)}" stroke="currentColor" stroke-width="5"/>`)),
  yinyang: E('religion', 'Yin-yang', `<circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="4"/><path fill-rule="evenodd" d="M50 6a44 44 0 0 1 0 88a22 22 0 0 1 0-44a22 22 0 0 0 0-44z${circ(50, 72, 6)}"/><circle cx="50" cy="28" r="6"/>`),
  lotus: E('religion', 'Lótus', '<ellipse cx="50" cy="48" rx="11" ry="30"/>' + [-38, -19, 19, 38].map(d => `<ellipse cx="50" cy="48" rx="9" ry="28" transform="rotate(${d} 50 80)"/>`).join('') + '<path d="M14 80h72c-6 10-20 14-36 14S20 90 14 80z"/>'),
  om: E('religion', 'Tridente sagrado', '<path d="M47 30h6v66h-6z"/><path d="M50 4c8 10 8 20 0 28-8-8-8-18 0-28zM20 20c12 4 18 14 18 26H30c0-10-4-18-10-26zM80 20c-12 4-18 14-18 26h8c0-10 4-18 10-26z"/><rect x="28" y="44" width="44" height="6"/>'),
  mosque: E('religion', 'Cúpula e minaretes', '<path d="M28 88V60c0-16 10-28 22-30 12 2 22 14 22 30v28z"/><path d="M50 18v12" stroke="currentColor" stroke-width="3"/><path d="M10 88V40l4-8 4 8v48zM82 88V40l4-8 4 8v48z"/><rect x="6" y="86" width="88" height="8"/>'),
  candle: E('religion', 'Menorá', '<rect x="47" y="30" width="6" height="56"/><rect x="30" y="86" width="40" height="8"/>' + [12, 24, 36].map(r => `<path d="M${50 - r} 30v${r * 0.9}a${r} ${r} 0 0 0 ${2 * r} 0V30" fill="none" stroke="currentColor" stroke-width="5"/>`).join('') + ring(7, i => `<ellipse cx="${14 + i * 12}" cy="22" rx="3.5" ry="7"/>`)),
  // ---- Política e ideologia ----
  hammersickle: E('politics', 'Foice e martelo', '<path d="M30 20c22-12 52-6 62 18 6 16 2 34-10 46l9 9-6 6-9-9C64 99 40 98 26 86l6-6c12 9 30 9 42-1L58 63l6-6 16 16c8-9 10-22 6-33-7-17-28-23-46-14z"/><path d="M14 74l38-38-8-8 12-12 22 22-12 12-8-8-38 38z"/>'),
  hammer: E('politics', 'Martelo', '<path d="M26 12h48v20H58v60H42V32H26z"/>'),
  hammers: E('politics', 'Martelos cruzados', rot('<path d="M30 10h40v16H56v66H44V26H30z"/>', 35) + rot('<path d="M30 10h40v16H56v66H44V26H30z"/>', -35)),
  hammerpen: E('politics', 'Martelo, foice e pincel', rot('<path d="M34 10h32v14H55v70H45V24H34z"/>', 0) + rot('<path d="M46 8h8v56l-4 30-4-30z"/>', 40) + rot('<path d="M47 6h6v60l6 4-9 26-9-26 6-4z"/>', -40)),
  gear: E('politics', 'Engrenagem', `<circle cx="50" cy="50" r="30"/>${ring(8, i => `<rect x="43" y="6" width="14" height="16" transform="rotate(${i * 45} 50 50)"/>`)}`),
  gearwheat: E('politics', 'Engrenagem e trigo', `<path fill-rule="evenodd" d="${circ(50, 46, 24)}${circ(50, 46, 12)}"/>${ring(8, i => `<rect x="45" y="14" width="10" height="10" transform="rotate(${i * 45} 50 46)"/>`)}` + leaves(6, 40, 100, 200) + leaves(6, 40, 80, -20, true)),
  compass: E('politics', 'Compasso', poly([[50, 8], [55, 14], [30, 92], [25, 90]]) + poly([[50, 8], [45, 14], [70, 92], [75, 90]]) + '<circle cx="50" cy="10" r="7"/><path d="M28 70h44" stroke="currentColor" stroke-width="5"/>'),
  wheat: E('politics', 'Trigo', '<rect x="48" y="30" width="4" height="64"/>' + [0, 1, 2, 3].map(i => `<ellipse cx="42" cy="${30 + i * 12}" rx="5" ry="9" transform="rotate(-30 42 ${30 + i * 12})"/><ellipse cx="58" cy="${30 + i * 12}" rx="5" ry="9" transform="rotate(30 58 ${30 + i * 12})"/>`).join('') + '<ellipse cx="50" cy="16" rx="5" ry="11"/>'),
  fist: E('politics', 'Punho erguido', '<path d="M30 92V58c-4-4-4-16 0-20V24c0-6 8-6 8 0v-4c0-6 8-6 8 0v-2c0-6 8-6 8 0v4c0-6 8-6 8 0v8c8 0 12 8 10 16l-6 14c0 6-2 10-4 12v20z"/>'),
  torch: E('politics', 'Tocha', '<path d="M40 50h20l-5 46H45z"/><path d="M50 4c10 12 16 22 10 34 4-2 6-8 6-12 6 10 2 22-16 24-18-2-22-14-16-24 0 4 2 10 6 12-6-12 0-22 10-34z"/>'),
  rose: E('politics', 'Rosa', '<path d="M50 14c16 0 24 12 20 26-4 12-14 16-20 16s-16-4-20-16c-4-14 4-26 20-26z"/><rect x="47" y="54" width="6" height="42"/><path d="M53 72c10-8 20-8 26-2-8 8-18 8-26 2zM47 80c-10-8-20-8-26-2 8 8 18 8 26 2z"/>'),
  rosefist: E('politics', 'Punho e rosa', '<path d="M24 92V62c-4-4-4-14 0-18v-8c0-5 7-5 7 0v-3c0-5 7-5 7 0v-2c0-5 7-5 7 0v3c0-5 7-5 7 0v8c6 0 9 6 8 12l-5 12c0 5-2 8-3 10v18z"/><path d="M70 4c10 0 16 8 13 16-3 8-9 10-13 10s-10-2-13-10c-3-8 3-16 13-16z"/><path d="M68 30h4v18h-4z"/>'),
  anarchy: E('politics', 'A circulado', '<circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="8"/><path d="M50 4L12 96h12l26-62 26 62h12zM28 62h44v8H28z"/>'),
  fasces: E('politics', 'Fasces', ring(4, i => `<rect x="${37 + i * 7}" y="14" width="5" height="80"/>`) + '<rect x="33" y="30" width="34" height="5"/><rect x="33" y="72" width="34" height="5"/><path d="M64 10c16-2 28 8 28 22-8-4-18-4-28 0z"/><rect x="48" y="4" width="4" height="12"/>'),
  scales: E('politics', 'Balança da justiça', '<rect x="47" y="14" width="6" height="72"/><rect x="30" y="86" width="40" height="7"/><rect x="12" y="20" width="76" height="5"/><path d="M6 56h34c-2 10-32 10-34 0zM60 56h34c-2 10-32 10-34 0z"/><path d="M15 25L8 56M15 25l23 31M85 25L62 56M85 25l7 31" fill="none" stroke="currentColor" stroke-width="2"/>'),
  book: E('politics', 'Livro aberto', '<path fill-rule="evenodd" d="M50 26C38 18 20 18 8 24v60c12-6 30-6 42 2 12-8 30-8 42-2V24c-12-6-30-6-42 2zM48 32v46h4V32z"/>'),
  pen: E('politics', 'Pena', '<path d="M84 6C58 10 30 30 22 70l-6 22 8-4c10-30 24-48 46-60-20 16-30 32-36 54 34-12 50-40 50-76z"/>'),
  eye: E('politics', 'Olho', `<path fill-rule="evenodd" d="M6 50c20-28 68-28 88 0-20 28-68 28-88 0z${circ(50, 50, 15)}"/><circle cx="50" cy="50" r="7"/>`),
  pyramideye: E('politics', 'Pirâmide com olho', `<path fill-rule="evenodd" d="M50 8l44 80H6zM30 62c10-12 30-12 40 0-10 12-30 12-40 0z"/><circle cx="50" cy="62" r="5"/>`),
  chainbroken: E('politics', 'Corrente partida', '<g fill="none" stroke="currentColor" stroke-width="7"><rect x="6" y="38" width="30" height="24" rx="12"/><path d="M40 40c-6-2-10 4-10 10M60 60c6 2 10-4 10-10"/><rect x="64" y="38" width="30" height="24" rx="12"/></g><path d="M46 30l-4-10M54 30l4-10M50 72v10" stroke="currentColor" stroke-width="4"/>'),
  globe: E('politics', 'Globo', '<g fill="none" stroke="currentColor" stroke-width="5"><circle cx="50" cy="50" r="40"/><ellipse cx="50" cy="50" rx="18" ry="40"/><path d="M10 50h80M18 30h64M18 70h64"/></g>'),
  globelaurel: E('politics', 'Globo e louros', '<g fill="none" stroke="currentColor" stroke-width="4"><circle cx="50" cy="48" r="26"/><ellipse cx="50" cy="48" rx="11" ry="26"/><path d="M24 48h52M28 36h44M28 60h44"/></g>' + leaves(7, 40, 110, 230) + leaves(7, 40, 70, -50, true)),
  // ---- Armas e guerra ----
  sword: E('war', 'Espada', `<path d="${SWORD}"/>`),
  swords: E('war', 'Espadas cruzadas', `<path d="${SWORD}" transform="rotate(40 50 50)"/><path d="${SWORD}" transform="rotate(-40 50 50)"/>`),
  scimitar: E('war', 'Cimitarra', '<path d="M20 90l6-6c30-10 52-40 56-78 10 30 2 62-26 80l-20 6-6 6zM14 78l12 12-4 4-12-12z"/>'),
  dagger: E('war', 'Punhal', '<path d="M50 2l6 54h10v6H54v18h4v8H42v-8h4V62H34v-6h10z"/>'),
  spear: E('war', 'Lança', '<path d="M50 3l9 22h-6v72h-6V25h-6z"/>'),
  spears: E('war', 'Lanças cruzadas', rot('<path d="M50 3l8 20h-5v74h-6V23h-5z"/>', 35) + rot('<path d="M50 3l8 20h-5v74h-6V23h-5z"/>', -35)),
  axe: E('war', 'Machado', '<path d="M46 10h8v84h-8zM54 16c20-2 34 10 36 28-10-4-22-4-36 2z"/>'),
  labrys: E('war', 'Machado duplo', '<path d="M47 8h6v86h-6z"/><path d="M47 22C30 12 14 18 10 34c-2 12 4 24 16 28 8-12 14-16 21-16zM53 22c17-10 33-4 37 12 2 12-4 24-16 28-8-12-14-16-21-16z"/>'),
  trident: E('war', 'Tridente', '<path d="M47 30h6v66h-6zM20 10l6-6 4 8v22c0 8 8 12 20 12s20-4 20-12V12l4-8 6 6v26c0 14-14 20-30 20S20 50 20 36zM44 12l6-8 6 8v28H44z"/>'),
  mace: E('war', 'Maça', '<circle cx="50" cy="30" r="17"/>' + rays(10, 14, 28, 0.2).replace('<path', '<path transform="translate(0 -20)"') + '<rect x="46" y="44" width="8" height="52"/>'),
  shieldswords: E('war', 'Escudo e espadas', `<path d="${SWORD}" transform="rotate(40 50 50)"/><path d="${SWORD}" transform="rotate(-40 50 50)"/><path d="M28 24h44v24c0 16-10 24-22 30-12-6-22-14-22-30z"/>`),
  bowarrow: E('war', 'Arco e flecha', '<path d="M30 8c30 14 30 70 0 84" fill="none" stroke="currentColor" stroke-width="6"/><path d="M30 8v84" stroke="currentColor" stroke-width="2"/><path d="M14 48h66v4H14z"/>' + poly([[78, 42], [94, 50], [78, 58]])),
  rifle: E('war', 'Fuzil', `<path d="${RIFLE}"/>`),
  rifles: E('war', 'Fuzis cruzados', rot(`<path d="${RIFLE}"/>`, 35) + rot(`<path d="${RIFLE}"/>`, -35)),
  riflebayonet: E('war', 'Fuzil com baioneta e livro', rot(`<path d="${RIFLE}"/><path d="M90 42l10 2-10 2z"/>`, -40) + '<path fill-rule="evenodd" d="M50 66c-8-5-20-5-28-1v24c8-4 20-4 28 1 8-5 20-5 28-1V65c-8-4-20-4-28 1z"/>'),
  cannon: E('war', 'Canhão', '<path d="M6 46l70-18 4 16-70 18z"/><circle cx="40" cy="70" r="16"/><rect x="60" y="76" width="34" height="6"/>'),
  cannonballs: E('war', 'Balas de canhão', '<circle cx="50" cy="26" r="16"/><circle cx="32" cy="58" r="16"/><circle cx="68" cy="58" r="16"/>'),
  tank: E('war', 'Tanque', '<path d="M8 70h84c0 10-6 16-14 16H22c-8 0-14-6-14-16zM18 66h64l-6-14H24zM36 52V40h28v12zM64 43h32v5H64z"/>'),
  plane: E('war', 'Avião', '<path d="M50 4c4 0 6 6 6 14v20l38 20v8L56 56v24l12 10v6l-18-6-18 6v-6l12-10V56L6 66v-8l38-20V18c0-8 2-14 6-14z"/>'),
  helicopter: E('war', 'Helicóptero', '<path d="M8 22h84v4H8zM48 26h4v10h-4z"/><path d="M20 50c0-10 10-16 22-16h12c12 0 18 8 18 18v6H30c-6 0-10-4-10-8zM72 50h22v6H72z"/><path d="M30 68h40" stroke="currentColor" stroke-width="4"/>'),
  ship: E('war', 'Navio', '<path d="M8 66h84L80 86H22zM47 16h4v50h-4z"/>' + poly([[51, 20], [80, 60], [51, 60]]) + poly([[47, 26], [20, 60], [47, 60]])),
  warship: E('war', 'Navio de guerra', '<path d="M4 62h92l-10 18H16zM30 62V50h30v12zM40 50V36h12v14zM44 36V20h4v16zM60 54h26v4H60z"/>'),
  helmetww: E('war', 'Capacete de combate', '<path d="M10 66c0-30 18-46 40-46s40 16 40 46zM4 64h92v8H4z"/>'),
  medal: E('war', 'Medalha', poly([[34, 4], [50, 30], [66, 4], [76, 4], [58, 36], [42, 36], [24, 4]]) + star(8, 30, 20, 50, 64)),
  wings: E('war', 'Asas militares', mir([[44, 44], [30, 34], [4, 30], [10, 38], [2, 40], [12, 46], [6, 50], [18, 54], [30, 54], [44, 56]]) + '<circle cx="50" cy="50" r="9"/>'),
  crosshair: E('war', 'Mira', '<g fill="none" stroke="currentColor" stroke-width="6"><circle cx="50" cy="50" r="30"/><path d="M50 4v30M50 66v30M4 50h30M66 50h30"/></g>'),
  // ---- Pesados ----
  skull: E('heavy', 'Caveira', `<path fill-rule="evenodd" d="${SKULL}"/>`),
  skullbones: E('heavy', 'Caveira e ossos', rot(BONE, 45) + rot(BONE, -45) + `<path fill-rule="evenodd" transform="translate(20 12) scale(0.6)" d="${SKULL}"/>`),
  bones: E('heavy', 'Ossos cruzados', rot(BONE, 45) + rot(BONE, -45)),
  skullhelm: E('heavy', 'Caveira com capacete', `<path fill-rule="evenodd" transform="translate(14 18) scale(0.72)" d="${SKULL}"/><path d="M12 40c0-22 16-34 38-34s38 12 38 34zM6 38h88v6H6z"/>`),
  skullswords: E('heavy', 'Caveira e espadas', `<path d="${SWORD}" transform="rotate(40 50 50)"/><path d="${SWORD}" transform="rotate(-40 50 50)"/><path fill-rule="evenodd" transform="translate(24 16) scale(0.52)" d="${SKULL}"/>`),
  nuke: E('heavy', 'Símbolo radioativo', `<circle cx="50" cy="50" r="8"/><path d="${sector(13, 44, deg(-120), deg(-60))}${sector(13, 44, deg(0), deg(60))}${sector(13, 44, deg(120), deg(180))}"/>`),
  mushroom: E('heavy', 'Cogumelo atômico', '<path d="M30 40c-12 0-16-14-6-20 2-10 16-14 24-8 8-8 24-4 26 8 12 2 12 20-2 20-6 4-14 4-16 2v28c8 2 18 10 22 22H22c4-12 14-20 22-22V42c-4 2-10 2-14-2z"/>'),
  bomb: E('heavy', 'Bomba', '<circle cx="46" cy="58" r="32"/><path d="M58 26l8-8 10 10-8 8z"/><path d="M72 20c4-8 10-10 16-8" fill="none" stroke="currentColor" stroke-width="4"/>' + star(8, 9, 3, 90, 10)),
  grenade: E('heavy', 'Granada', `<path fill-rule="evenodd" d="M50 30c16 0 26 14 26 32S64 92 50 92 24 80 24 62s10-32 26-32zM42 44h3v42h-3zM55 44h3v42h-3zM28 56h44v3H28zM28 70h44v3H28z"/><path d="M42 16h16v14H42zM58 18l16-6 3 5-17 8z"/><circle cx="36" cy="16" r="7" fill="none" stroke="currentColor" stroke-width="3"/>`),
  missile: E('heavy', 'Míssil', '<path d="M50 2c8 10 10 20 10 28v44l12 14v6l-12-6H40l-12 6v-6l12-14V30c0-8 2-18 10-28z"/>'),
  missiles: E('heavy', 'Mísseis cruzados', rot('<path d="M50 4c6 8 8 16 8 24v42l9 12v5l-9-5H42l-9 5v-5l9-12V28c0-8 2-16 8-24z"/>', 35) + rot('<path d="M50 4c6 8 8 16 8 24v42l9 12v5l-9-5H42l-9 5v-5l9-12V28c0-8 2-16 8-24z"/>', -35)),
  biohazard: E('heavy', 'Risco biológico', ring(3, (i, a) => { const x = 50 + Math.cos(a - Math.PI / 2) * 18, y = 50 + Math.sin(a - Math.PI / 2) * 18; return `<path fill-rule="evenodd" d="${circ(x, y, 22)}${circ(50 + Math.cos(a - Math.PI / 2) * 24, 50 + Math.sin(a - Math.PI / 2) * 24, 14)}"/>`; }) + '<circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="5"/>'),
  gasmask: E('heavy', 'Máscara de gás', `<path fill-rule="evenodd" d="M50 8c22 0 34 16 34 36 0 14-6 22-14 28H30c-8-6-14-14-14-28C16 24 28 8 50 8z${circ(36, 40, 9)}${circ(64, 40, 9)}"/><path d="M38 70h24l-4 16H42z"/><circle cx="50" cy="90" r="8"/>`),
  bolt: E('heavy', 'Raio', poly([[58, 4], [22, 54], [46, 54], [38, 96], [78, 40], [54, 40]])),
  bolts2: E('heavy', 'Raios duplos', poly([[40, 4], [16, 50], [32, 50], [24, 96], [52, 40], [36, 40]]) + poly([[72, 4], [48, 50], [64, 50], [56, 96], [84, 40], [68, 40]])),
  barbed: E('heavy', 'Arame farpado', '<path d="M2 50c16-10 32 10 48 0s32-10 48 0" fill="none" stroke="currentColor" stroke-width="4"/>' + [18, 50, 82].map(x => `<path d="M${x - 8} 40l16 20M${x + 8} 40l-16 20" stroke="currentColor" stroke-width="4"/>`).join('')),
  chain: E('heavy', 'Corrente', '<g fill="none" stroke="currentColor" stroke-width="7"><rect x="6" y="38" width="34" height="24" rx="12"/><rect x="33" y="38" width="34" height="24" rx="12"/><rect x="60" y="38" width="34" height="24" rx="12"/></g>'),
  noose: E('heavy', 'Forca', '<path d="M14 94V6h64v8H22v80zM8 90h28v6H8z"/><path d="M60 14v26" stroke="currentColor" stroke-width="4"/><ellipse cx="60" cy="54" rx="10" ry="14" fill="none" stroke="currentColor" stroke-width="5"/>'),
  guillotine: E('heavy', 'Guilhotina', '<path d="M24 94V8h8v86zM68 94V8h8v86zM18 4h64v8H18zM32 30h36l-36 14z"/><path d="M14 86h72v8H14zM40 74h20v12H40z"/>'),
  flamesword: E('heavy', 'Espada flamejante', `<path d="${FLAME}" transform="translate(10 0) scale(0.8)"/><path d="${SWORD}"/>`),
  devil: E('heavy', 'Cabeça de bode', '<path d="M14 6c8 20 18 26 26 26-6 6-8 16-6 26 4 18 10 30 16 38 6-8 12-20 16-38 2-10 0-20-6-26 8 0 18-6 26-26-14 8-24 10-32 10H46C38 16 28 14 14 6z"/>'),
  // ---- Regimes totalitários (histórico) ----
  swastika: E('totalitarian', 'Suástica', [0, 90, 180, 270].map(d => rot('<path d="M44 12h12v44H44zM44 12h40v12H44z"/>', d)).join('')),
  swastikaL: E('totalitarian', 'Suástica invertida', [0, 90, 180, 270].map(d => rot('<path d="M44 12h12v44H44zM16 12h40v12H16z"/>', d)).join('')),
  sigrunes: E('totalitarian', 'Runas sig duplas', poly([[20, 6], [40, 6], [30, 40], [46, 40], [22, 94], [30, 54], [14, 54]]) + poly([[56, 6], [76, 6], [66, 40], [82, 40], [58, 94], [66, 54], [50, 54]])),
  wolfsangel: E('totalitarian', 'Wolfsangel', poly([[20, 8], [80, 8], [80, 20], [38, 80], [80, 80], [80, 92], [20, 92], [20, 80], [62, 20], [20, 20]]) + '<rect x="28" y="45" width="44" height="10"/>'),
  reichseagle: E('totalitarian', 'Águia do Reich', mir([[50, 30], [40, 26], [4, 18], [8, 24], [2, 26], [10, 32], [4, 34], [14, 40], [8, 42], [20, 48], [36, 46], [44, 50]]) + '<ellipse cx="50" cy="44" rx="8" ry="16"/><circle cx="46" cy="24" r="6"/>' + poly([[42, 22], [34, 25], [42, 28]]) + '<circle cx="50" cy="78" r="13" fill="none" stroke="currentColor" stroke-width="4"/>' + mir([[46, 58], [40, 66], [43, 68], [48, 61]])),
  totenkopf: E('totalitarian', 'Caveira de cabeça da morte', `<g transform="translate(14 44) scale(0.72)">${rot(BONE, 25)}${rot(BONE, -25)}</g><path fill-rule="evenodd" transform="translate(25 2) scale(0.5)" d="${SKULL}"/>`),
  balkenkreuz: E('totalitarian', 'Cruz de ferro (Balkenkreuz)', '<path fill-rule="evenodd" d="M38 4h24v34h34v24H62v34H38V62H4V38h34zM44 10v34H10v12h34v34h12V56h34V44H56V10z"/>'),
  arrowcross: E('totalitarian', 'Cruz flechada', [0, 90, 180, 270].map(d => rot(poly([[44, 52], [44, 24], [34, 24], [50, 4], [66, 24], [56, 24], [56, 52]]), d)).join('')),
  ironguard: E('totalitarian', 'Cruz da Guarda de Ferro', [26, 45, 64].map(x => `<rect x="${x}" y="10" width="10" height="80"/><rect x="10" y="${x}" width="80" height="10"/>`).join('')),
  ustase: E('totalitarian', 'U da Ustaše', '<path d="M16 8h18v52a16 16 0 0 0 32 0V8h18v52a34 34 0 0 1-68 0z"/>' + '<circle cx="50" cy="44" r="10"/>' + poly([[46, 32], [50, 20], [54, 32]])),
  blacksun: E('totalitarian', 'Sol negro', '<circle cx="50" cy="50" r="10"/>' + ring(12, (i, a) => `<path d="M${(50 + Math.cos(a) * 10).toFixed(1)} ${(50 + Math.sin(a) * 10).toFixed(1)}L${(50 + Math.cos(a) * 46).toFixed(1)} ${(50 + Math.sin(a) * 46).toFixed(1)}A46 46 0 0 1 ${(50 + Math.cos(a + 0.35) * 46).toFixed(1)} ${(50 + Math.sin(a + 0.35) * 46).toFixed(1)}L${(50 + Math.cos(a + 0.2) * 22).toFixed(1)} ${(50 + Math.sin(a + 0.2) * 22).toFixed(1)}Z"/>`)),
  triskelionsw: E('totalitarian', 'Trisquel de ganchos', ring(3, (i, a) => rot('<path d="M45 50V12h10v26l22 0v10H45z"/>', i * 120)).replace(/rotate\(0 50 50\)/, 'rotate(0 50 50)')),
  claw: E('heavy', 'Garras', [30, 50, 70].map(x => `<path d="M${x - 8} 92C${x - 10} 60 ${x - 4} 30 ${x + 6} 8c-2 26-2 54 4 84z"/>`).join('')),
  // ---- Natureza ----
  sun: E('nature', 'Sol', `<circle cx="50" cy="50" r="22"/>${rays(12, 26, 46)}`),
  sunface: E('nature', 'Sol de maio', `<circle cx="50" cy="50" r="20"/>${rays(16, 24, 46, 0.09)}`),
  sunrise: E('nature', 'Sol nascente', '<path d="M14 82a36 36 0 0 1 72 0z"/><rect x="4" y="84" width="92" height="6"/>' + rays(9, 40, 58, 0.08, Math.PI, Math.PI).replace('<path', '<path transform="translate(0 32)"')),
  moon: E('nature', 'Lua', '<path d="M64 6a44 44 0 1 0 30 70A36 36 0 0 1 64 6z"/>'),
  mountain: E('nature', 'Montanha', '<path d="M2 88L36 30l14 22 14-16 34 52z"/>'),
  volcano: E('nature', 'Vulcão', '<path d="M4 90l30-46h32l30 46z"/><path d="M40 40c-4-10 0-20 10-24 10 4 14 14 10 24z"/>'),
  wave: E('nature', 'Ondas', '<g fill="none" stroke="currentColor" stroke-width="7">' + [34, 54, 74].map(y => `<path d="M4 ${y}c12-10 18-10 24 0s18 10 24 0 18-10 24 0 14 10 20 4"/>`).join('') + '</g>'),
  tree: E('nature', 'Árvore', '<path d="M50 6L82 54H63L84 80H55v14H45V80H16L37 54H18z"/>'),
  oak: E('nature', 'Carvalho', '<circle cx="50" cy="36" r="24"/><circle cx="30" cy="48" r="18"/><circle cx="70" cy="48" r="18"/><path d="M44 56h12l4 38H40z"/>'),
  palm: E('nature', 'Palmeira', '<path d="M48 40c4 20 6 40 2 56h8c4-16 0-36-6-56z"/><path d="M50 40C40 24 24 20 8 26c14 0 24 6 32 16zM50 40c10-16 26-20 42-14-14 0-24 6-32 16zM50 40c-4-16-14-28-28-32 10 8 16 18 18 30zM50 40c4-16 14-28 28-32-10 8-16 18-18 30z"/>'),
  maple: E('nature', 'Folha de bordo', poly([[50, 4], [56, 20], [64, 16], [62, 36], [76, 26], [80, 32], [94, 30], [88, 44], [96, 48], [76, 62], [80, 70], [56, 66], [54, 96], [46, 96], [44, 66], [20, 70], [24, 62], [4, 48], [12, 44], [6, 30], [20, 32], [24, 26], [38, 36], [36, 16], [44, 20]])),
  leaf: E('nature', 'Folha', '<path d="M10 90C10 40 40 10 90 10 90 60 60 90 10 90z"/>'),
  olive: E('nature', 'Ramo de oliveira', '<path d="M14 88C30 60 50 36 86 14" fill="none" stroke="currentColor" stroke-width="4"/>' + [[26, 70], [38, 56], [50, 44], [62, 34], [74, 24]].map(([x, y], i) => `<ellipse cx="${x - 6}" cy="${y - 8}" rx="4" ry="10" transform="rotate(-20 ${x - 6} ${y - 8})"/><ellipse cx="${x + 8}" cy="${y + 4}" rx="4" ry="10" transform="rotate(60 ${x + 8} ${y + 4})"/>`).join('')),
  flame: E('nature', 'Chama', `<path d="${FLAME}"/>`),
  snowflake: E('nature', 'Floco de neve', '<g stroke="currentColor" stroke-width="6" stroke-linecap="round" fill="none">' + ring(6, i => `<g transform="rotate(${i * 60} 50 50)"><path d="M50 50V6M50 22l-10-10M50 22l10-10M50 36l-8-8M50 36l8-8"/></g>`) + '</g>'),
  flower: E('nature', 'Flor', ring(6, (i, a) => `<ellipse cx="${(50 + Math.cos(a) * 22).toFixed(1)}" cy="${(50 + Math.sin(a) * 22).toFixed(1)}" rx="16" ry="10" transform="rotate(${i * 60} ${(50 + Math.cos(a) * 22).toFixed(1)} ${(50 + Math.sin(a) * 22).toFixed(1)})"/>`) + '<circle cx="50" cy="50" r="10"/>'),
  cactus: E('nature', 'Cacto', '<path d="M42 94V20c0-10 16-10 16 0v74zM42 60H28c-6 0-8-4-8-10V34c0-6 8-6 8 0v16h14zM58 52h14V30c0-6 8-6 8 0v22c0 6-2 10-8 10H58z"/>'),
  // ---- Objetos e técnica ----
  anchor: E('objects', 'Âncora', '<path d="M47 6h6v10h12v6H53v52c10-2 18-8 22-18l-7-2 15-10 2 18-5-3c-6 15-18 24-30 26-12-2-24-11-30-26l-5 3 2-18 15 10-7 2c4 10 12 16 22 18V22H35v-6h12z"/>'),
  atom: E('objects', 'Átomo', '<g fill="none" stroke="currentColor" stroke-width="4"><ellipse cx="50" cy="50" rx="44" ry="15"/><ellipse cx="50" cy="50" rx="44" ry="15" transform="rotate(60 50 50)"/><ellipse cx="50" cy="50" rx="44" ry="15" transform="rotate(-60 50 50)"/></g><circle cx="50" cy="50" r="8"/>'),
  rocket: E('objects', 'Foguete', `<path fill-rule="evenodd" d="M50 4c14 12 18 30 16 56l14 16v12l-16-8H36l-16 8V76l14-16c-2-26 2-44 16-56z${circ(50, 34, 6)}"/>`),
  satellite: E('objects', 'Satélite', '<rect x="38" y="38" width="24" height="24" transform="rotate(45 50 50)"/><rect x="6" y="40" width="26" height="20"/><rect x="68" y="40" width="26" height="20"/><path d="M32 50h6M62 50h6" stroke="currentColor" stroke-width="4"/>'),
  factory: E('objects', 'Fábrica', '<path d="M6 92V50l20 12V50l20 12V50l20 12V20h10v-8h8v8h8v72z"/>'),
  oil: E('objects', 'Torre de petróleo', '<path d="M50 4l26 90h-8L50 26 32 94h-8z"/><path d="M36 50h28M30 72h40" stroke="currentColor" stroke-width="5"/>'),
  pickaxe: E('objects', 'Picareta e pá', rot('<path d="M10 22C30 8 70 8 90 22l-4 4C66 16 34 16 14 26zM47 18h6v76h-6z"/>', 35) + rot('<path d="M47 4h6v60h-6zM38 62h24l-2 24c0 6-20 6-20 0z"/>', -35)),
  ship2: E('objects', 'Caravela', '<path d="M6 64h88l-12 22H20zM47 10h4v54h-4z"/>' + poly([[51, 14], [76, 22], [76, 44], [51, 48]]) + poly([[47, 18], [24, 26], [24, 48], [47, 52]]) + '<path d="M76 16h6v4h-6z"/>'),
  train: E('objects', 'Locomotiva', '<path d="M10 70V40h40V26h16v14h20v30z"/><circle cx="26" cy="78" r="9"/><circle cx="50" cy="78" r="9"/><circle cx="74" cy="78" r="9"/><rect x="18" y="20" width="10" height="20"/>'),
  sunwheel: E('objects', 'Roda solar', `<circle cx="50" cy="50" r="18"/>${rays(16, 22, 40, 0.1)}<circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="4"/>`),
  hourglass: E('objects', 'Ampulheta', '<path d="M22 6h56v8h-4c0 18-14 26-20 36 6 10 20 18 20 36h4v8H22v-8h4c0-18 14-26 20-36-6-10-20-18-20-36h-4z"/>'),
  lamp: E('objects', 'Lâmpada', '<path d="M50 6c18 0 30 14 30 30 0 12-8 20-14 28v10H34V64c-6-8-14-16-14-28C20 20 32 6 50 6z"/><rect x="36" y="78" width="28" height="6"/><rect x="40" y="88" width="20" height="6"/>'),
  coin: E('objects', 'Moeda', `<path fill-rule="evenodd" d="${circ(50, 50, 42)}${circ(50, 50, 34)}"/><path d="M44 28h12v6c6 1 10 5 10 10H56c0-3-12-3-12 0 0 8 22 4 22 16 0 5-4 9-10 10v6H44v-6c-6-1-10-5-10-10h10c0 3 12 3 12 0 0-8-22-4-22-16 0-5 4-9 10-10z"/>`),
  hand: E('objects', 'Mão aberta', '<path d="M30 94l-6-34c-2-8-14-24-8-28 4-2 10 6 14 14V18c0-6 8-6 8 0v24V10c0-6 8-6 8 0v32V14c0-6 8-6 8 0v30V22c0-6 8-6 8 0v36c0 16-6 28-10 36z"/>'),
  bell: E('objects', 'Sino', '<path d="M50 8c4 0 6 2 6 6 14 4 20 16 20 30v20l10 12H14l10-12V44c0-14 6-26 20-30 0-4 2-6 6-6z"/><circle cx="50" cy="86" r="7"/>'),
};

// Lista ordenada por categoria (para a paleta do editor).
export const EMBLEM_KEYS = Object.keys(EMBLEMS);
