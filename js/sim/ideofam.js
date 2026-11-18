// Famílias ideológicas, compatibilidade e posturas (módulo-folha, sem dependências: usado por world.js e customworld.js).
// ---------- Famílias ideológicas ----------
export const FAMILIES = {
  liberal: { name: 'Democracia liberal', short: 'Liberal', color: '#2f6db5' },
  socdem: { name: 'Social-democracia', short: 'Social-democrata', color: '#e58fb0' },
  socialist: { name: 'Socialismo', short: 'Socialista', color: '#c0261d' },
  nationalist: { name: 'Nacionalismo autoritário', short: 'Nacionalista', color: '#3b3f8f' },
  monarchist: { name: 'Monarquia', short: 'Monárquico', color: '#8a5fbf' },
  theocratic: { name: 'Teocracia', short: 'Teocrático', color: '#2e7d4f' },
  junta: { name: 'Junta militar', short: 'Militar', color: '#5d6b2a' },
  hybrid: { name: 'Regime híbrido', short: 'Híbrido', color: '#d7b443' },
};
export function famOfProfile(p) {
  if (!p) return 'hybrid';
  if (p.fam && FAMILIES[p.fam]) return p.fam;
  const lib = p.liberty ?? 50, mk = p.market ?? 50, rel = p.religiosity ?? 30, g = p.gov || '', rn = `${p.regimeName || ''} ${p.govName || ''}`;
  if (g === 'mil' || /junta/i.test(rn)) return 'junta';
  if (g === 'theo' || /teocr/i.test(rn) || (rel >= 85 && lib < 30 && g !== 'amon' && g !== 'mon' && g !== 'cmon')) return 'theocratic';
  if ((g === 'party' && mk < 56) || /socialis|comunis|popular|soviét|revolucionário/i.test(rn) || (mk < 28 && lib < 45)) return 'socialist';
  if (g === 'amon' || ((g === 'mon' || g === 'cmon') && lib < 60)) return 'monarchist';
  if (lib >= 65) return mk < 50 ? 'socdem' : 'liberal';
  if (lib < 40) return 'nationalist';
  return 'hybrid';
}
export function playerFam(s) {
  const I = s.nation?.ideology; if (!I) return 'hybrid';
  if (s.nation.famOverride) return s.nation.famOverride;
  const ax = I.axes || {}, gov = I.government || '';
  if (/junta/i.test(gov)) return 'junta';
  if (/teocr/i.test(gov)) return 'theocratic';
  if (ax.econ < -35 && (ax.auth > 5 || /partido único/i.test(gov))) return 'socialist';
  if (/monarquia/i.test(gov) && (ax.auth > 15 || !/constitucional/i.test(gov))) return 'monarchist';
  if (ax.auth < -20) return ax.econ < 0 ? 'socdem' : 'liberal';
  if (ax.auth > 25) return 'nationalist';
  return 'hybrid';
}

// Compatibilidade ideológica (−1 hostil … +1 irmãos ideológicos).
const C = {
  liberal: { liberal: 0.6, socdem: 0.5, socialist: -0.6, nationalist: -0.35, monarchist: -0.05, theocratic: -0.45, junta: -0.45, hybrid: 0 },
  socdem: { socdem: 0.6, socialist: -0.15, nationalist: -0.5, monarchist: -0.2, theocratic: -0.4, junta: -0.45, hybrid: 0 },
  socialist: { socialist: 0.7, nationalist: -0.6, monarchist: -0.8, theocratic: -0.55, junta: -0.35, hybrid: -0.05 },
  nationalist: { nationalist: 0.25, monarchist: 0.3, theocratic: 0.1, junta: 0.35, hybrid: 0.1 },
  monarchist: { monarchist: 0.45, theocratic: 0.3, junta: 0.2, hybrid: 0.05 },
  theocratic: { theocratic: 0.3, junta: -0.1, hybrid: 0 },
  junta: { junta: 0.3, hybrid: 0.05 },
  hybrid: { hybrid: 0.1 },
};
export const compat = (a, b) => C[a]?.[b] ?? C[b]?.[a] ?? 0;
const labMul = (s, k) => s?.world?.lab?.[k] ?? 1;
// Termo de relação entre dois perfis (usado em relAI e na criação da partida).
export function ideoRel(pa, pb, s) {
  const fa = famOfProfile(pa), fb = famOfProfile(pb);
  let v = compat(fa, fb) * 30;
  if (pa?.align && pb?.align) { const A = { W: 2, WL: 1, N: 0, EL: -1, E: -2 }; const d = Math.abs((A[pa.align] ?? 0) - (A[pb.align] ?? 0)); v += 6 - d * 4; }
  return v * labMul(s, 'ideo');
}

// ---------- Posturas de política externa ----------
export const POSTURES = {
  isolationist: { name: 'Isolacionista', desc: 'Fecha-se ao mundo: quase não forma alianças nem entra em guerras alheias.', war: 0.15, ally: 0.15, help: 0 },
  neutral: { name: 'Neutra', desc: 'Evita blocos; só luta se for atacada.', war: 0.45, ally: 0.4, help: 0.2 },
  aligned: { name: 'Alinhada ao bloco', desc: 'Segue os aliados ideológicos e entra em alianças.', war: 0.8, ally: 1.5, help: 0.8 },
  interventionist: { name: 'Intervencionista', desc: 'Projeta poder: apoia aliados, intervém em guerras e regimes vizinhos.', war: 1.3, ally: 1.2, help: 1.5 },
  expansionist: { name: 'Expansionista', desc: 'Quer território: fabrica reivindicações e invade vizinhos fracos.', war: 2.3, ally: 0.8, help: 0.6 },
};
