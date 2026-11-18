// Bandeiras derivadas da bandeira do país de origem: quando um país se fratura (mundo customizado, secessões),
// as partes herdam cores e símbolos nacionais em variações (Turquia → sempre crescente e estrela; Bielorrússia →
// vermelho e verde com o brasão bielorrusso; Rússia → tricolor e águia bicéfala...). Sem dependências.
const P = (pals, lays, ems, p, extra = {}) => ({ pals, lays, ems, p, ...extra });
const R = '#c8102e', W = '#ffffff', K = '#111111', G = '#007a3d', Y = '#fcd116', B = '#0b3d91';
export const NATIONAL = {
  TUR: P([['#e30a17', W]], ['solid', 'solid', 'v2', 'hborder', 'h2'], ['crescentstar'], 1),
  AZE: P([['#00b5e2', '#ef3340', '#509e2f'], ['#ef3340', '#00b5e2', '#509e2f']], ['h3'], ['crescentstar'], 1),
  TKM: P([['#28ae66', '#ca3745', '#28ae66']], ['solid', 'v3'], ['crescentstar'], 1),
  UZB: P([['#0099b5', W, '#1eb53a']], ['h3'], ['crescentstar'], 1),
  PAK: P([['#01411c', W, '#01411c']], ['solid', 'v2'], ['crescentstar'], 1),
  DZA: P([[G, W, W], [W, G, G]], ['v2'], ['crescentstar'], 1),
  TUN: P([['#e70013', W]], ['solid', 'disc'], ['crescentstar'], 1),
  LBY: P([['#e70013', K, '#239e46']], ['h3'], ['crescentstar'], 1),
  MYS: P([['#cc0001', W, '#010066']], ['cantonstripes'], ['crescentstar'], 1),
  MRT: P([['#00a95c', '#d01c1f', '#00a95c']], ['hborder'], ['crescentstar'], 1),
  BLR: P([['#c8313e', '#4aa657', '#4aa657'], [W, '#c8313e', W], ['#c8313e', W, '#4aa657']], ['h2', 'h3', 'hcenter'], ['a_belarus|crossortho', 'a_pahonia|crossortho', 'a_russia|crossortho'], 0.7),
  RUS: P([[W, '#0039a6', '#d52b1e'], [K, '#ffd700', W], ['#d52b1e', W, '#0039a6'], [W, '#0039a6', W]], ['h3', 'h3', 'h2', 'saltire'], ['a_russia', 'a_imprussian|a_russia', 'crossortho'], 0.55),
  UKR: P([['#0057b7', '#ffd700'], ['#ffd700', '#0057b7']], ['h2', 'h2', 'v2'], ['n_tryzub|trident', 'a_ukraine|trident'], 0.6),
  POL: P([[W, '#dc143c'], ['#dc143c', W]], ['h2'], ['a_poland'], 0.6),
  SRB: P([['#c6363c', '#0c4076', W], ['#0c4076', '#c6363c', W]], ['h3'], ['a_serbia'], 0.7),
  DEU: P([[K, '#dd0000', '#ffce00'], [K, W, '#dd0000'], ['#ffce00', K, '#dd0000']], ['h3'], ['a_germany'], 0.4),
  AUT: P([['#ed2939', W, '#ed2939']], ['h3', 'hcenter'], ['a_austria'], 0.5),
  CHN: P([['#de2910', '#ffde00'], ['#ffde00', '#de2910']], ['solid', 'canton'], ['star', 'stars3'], 0.9),
  IND: P([['#ff9933', W, '#138808'], ['#138808', W, '#ff9933']], ['h3'], ['r_ashoka|dharma', 'lotus'], 0.8),
  BRA: P([['#009c3b', '#ffdf00', '#002776'], ['#002776', '#ffdf00', '#009c3b'], ['#009c3b', W, '#ffdf00']], ['h3', 'v3', 'disc'], ['starring', 'star', 'stars3'], 0.5),
  USA: P([['#b22234', W, '#3c3b6e'], ['#3c3b6e', W, '#b22234']], ['cantonstripes', 'canton', 'h3'], ['star', 'stars3', 'starring'], 0.9),
  MEX: P([['#006847', W, '#ce1126']], ['v3', 'h3'], ['a_mexico'], 0.8),
  ESP: P([['#aa151b', '#f1bf00', '#aa151b']], ['hcenter', 'h3'], ['a_spain|castle', 'castle'], 0.6),
  PRT: P([['#006600', '#ff0000', '#ff0000']], ['v2'], ['a_portugal|castle'], 0.8),
  ITA: P([['#009246', W, '#ce2b37']], ['v3', 'h3'], ['star'], 0.3),
  FRA: P([['#0055a4', W, '#ef4135']], ['v3', 'h3'], ['fleur'], 0.3),
  GBR: P([['#012169', W, '#c8102e'], [W, '#c8102e', '#c8102e']], ['saltire', 'cross'], ['knot'], 0.15),
  CAN: P([['#ff0000', W, '#ff0000']], ['v3', 'hcenter'], ['n_maple_ca|tree'], 0.9),
  ARG: P([['#74acdf', W, '#74acdf']], ['h3'], ['sunface'], 0.9),
  CHL: P([[W, '#d52b1e', '#0039a6']], ['h2', 'canton'], ['star'], 0.9),
  COL: P([['#fcd116', '#003893', '#ce1126']], ['h3'], ['a_colombia|star'], 0.4),
  BOL: P([['#d52b1e', '#f9e300', '#007934']], ['h3'], ['a_bolivia|sun'], 0.5),
  NGA: P([['#008751', W, '#008751']], ['v3'], ['star'], 0.3),
  ETH: P([['#078930', '#fcdd09', '#da121a']], ['h3'], ['a_ethiopia|star', 'star'], 0.8),
  ZAF: P([['#007749', '#ffb612', '#de3831'], ['#002395', W, '#007749']], ['chevron', 'h3'], ['star'], 0.3),
  NAM: P([['#003580', '#d21034', '#009543']], ['diag', 'h3'], ['sun'], 0.8),
  IRN: P([['#239f40', W, '#da0000']], ['h3'], ['a_iran|sun', 'a_persia|sun'], 0.8),
  IRQ: P([['#ce1126', W, K]], ['h3'], ['a_iraq|stars3', 'stars3'], 0.6),
  SYR: P([['#ce1126', W, K]], ['h3'], ['stars3', 'a_syria'], 0.7),
  EGY: P([['#ce1126', W, K]], ['h3'], ['a_egypt|star', 'star'], 0.7),
  SAU: P([['#006c35', W, '#006c35']], ['solid'], ['r_shahada|crescentstar', 'swords'], 0.9),
  KAZ: P([['#00afca', '#fec50c', '#00afca']], ['solid'], ['sun', 'a_kazakhstan|sun'], 0.9),
  ALB: P([['#e41e20', K, '#e41e20']], ['solid'], ['a_albania'], 0.9),
  GEO: P([[W, '#ff0000', '#ff0000']], ['cross'], ['crosspattee'], 0.8),
  ARM: P([['#d90012', '#0033a0', '#f2a800']], ['h3'], ['a_armenia'], 0.4),
  GRC: P([['#0d5eaf', W, '#0d5eaf']], ['stripes7', 'cross', 'h3'], ['crossortho'], 0.2),
  CZE: P([[W, '#d7141a', '#11457e']], ['triangle', 'h2'], ['a_czech'], 0.4),
  ROU: P([['#002b7f', '#fcd116', '#ce1126']], ['v3'], ['a_romania'], 0.5),
  HUN: P([['#ce2939', W, '#477050']], ['h3'], ['a_hungary|crown', 'crown'], 0.4),
  LTU: P([['#fdb913', '#006a44', '#c1272d']], ['h3'], ['a_lithuania'], 0.5),
  IDN: P([['#ff0000', W]], ['h2'], ['star'], 0.15),
  JPN: P([[W, '#bc002d']], ['disc'], ['a_japan|flower'], 0.2),
  KOR: P([[W, '#c60c30', '#003478']], ['solid'], ['n_taegeuk|yinyang'], 0.9),
  VNM: P([['#da251d', '#ffff00']], ['solid'], ['star'], 0.95),
  MNG: P([['#c4272f', '#015197', '#c4272f']], ['v3'], ['r_soyombo|flame'], 0.9),
  AFG: P([[K, R, G]], ['v3'], ['r_shahada|crescentstar'], 0.6),
};
const POS = { triangle: [0.13, 0.5, 0.2], pall: [0.12, 0.5, 0.2], chevron: [0.13, 0.5, 0.2], canton: [0.2, 0.25, 0.3], cantonstripes: [0.2, 0.27, 0.3], nordic: [0.17, 0.2, 0.18], v2: [0.5, 0.5, 0.36], disc: [0.5, 0.5, 0.36] };
const light = c => parseInt(String(c).slice(1), 16) > 0xaaaaaa;
// Variação da bandeira nacional (rnd: função 0..1 determinística para a mesma parte sempre ganhar a mesma bandeira).
export function nationalVariant(a3, rnd = Math.random) {
  const N = NATIONAL[a3]; if (!N) return null;
  const pk = a => a[Math.floor(rnd() * a.length) % a.length];
  const pal = [...pk(N.pals)], layout = pk(N.lays);
  while (pal.length < 3) pal.push(pal[pal.length - 1]);
  const emblems = [];
  if (rnd() < N.p) {
    const [type, alt] = pk(N.ems).split('|');
    const isArms = type.startsWith('a_');
    const pos = POS[layout] || [0.5, 0.5, isArms ? 0.55 : 0.4];
    const bg = layout === 'v2' && type === 'crescentstar' ? pal[1] : pal[0];
    const col = type === 'crescentstar' || type === 'star' || type === 'stars3' ? (light(bg) ? pal.find(c => !light(c)) || K : W) : (light(bg) ? K : '#ffd700');
    emblems.push({ type, alt, color: a3 === 'CHN' || a3 === 'VNM' ? '#ffde00' : col, x: layout === 'v2' && type === 'crescentstar' ? 0.25 : pos[0], y: pos[1], s: isArms ? Math.max(pos[2], 0.5) : pos[2] });
  }
  return { layout, colors: pal, emblems };
}
