// Coesão nacional: quanto cada país resiste a separatismo e secessão. Um país estável, próspero (IDH alto) ou onde o Estado
// é temido quase nunca se parte; os que têm movimentos históricos fortes (Catalunha, Curdistão, Tigré...) continuam frágeis.
// Devolve um multiplicador (0,03 a 1,5) aplicado às chances de separatismo, secessão e proclamação de independência.
import { clamp } from './util.js';

// Propensão histórica a separatismo (1 = referência). O que não está aqui usa 0,7.
export const SEP_PRIOR = {
  // África: fronteiras coloniais e movimentos fracos ou inexistentes
  AGO: 0.18, BWA: 0.1, NAM: 0.15, ZMB: 0.15, MWI: 0.12, TZA: 0.2, RWA: 0.15, GHA: 0.18, SEN: 0.3, TGO: 0.15, BEN: 0.15, GAB: 0.12, COG: 0.2, LSO: 0.05, SWZ: 0.08, MUS: 0.08, CPV: 0.05, SLE: 0.18, LBR: 0.2, KEN: 0.3, UGA: 0.35, MOZ: 0.3, ZWE: 0.25, MDG: 0.25, GIN: 0.3, BFA: 0.4, GNB: 0.3, GMB: 0.1, BDI: 0.3, ERI: 0.15, DJI: 0.1, TUN: 0.15, EGY: 0.2, ZAF: 0.35,
  // América Latina
  BRA: 0.22, ARG: 0.15, CHL: 0.2, URY: 0.05, PRY: 0.15, COL: 0.3, PER: 0.25, ECU: 0.25, VEN: 0.3, BOL: 0.5, CRI: 0.05, PAN: 0.15, GTM: 0.2, HND: 0.15, SLV: 0.1, NIC: 0.3, CUB: 0.1, DOM: 0.08, MEX: 0.3,
  // Ásia
  JPN: 0.1, KOR: 0.08, PRK: 0.05, VNM: 0.2, KHM: 0.15, LAO: 0.2, THA: 0.4, MNG: 0.1, BGD: 0.3, NPL: 0.3, LKA: 0.5, SGP: 0.02, MYS: 0.35, BTN: 0.1, KAZ: 0.3, UZB: 0.3, TKM: 0.15, KGZ: 0.35, TJK: 0.5,
  // Europa e outros
  DEU: 0.22, FRA: 0.3, POL: 0.12, PRT: 0.08, AUT: 0.12, CHE: 0.08, NLD: 0.12, NOR: 0.08, SWE: 0.08, FIN: 0.12, DNK: 0.2, ISL: 0.05, IRL: 0.12, GRC: 0.2, BGR: 0.2, HUN: 0.2, CZE: 0.2, SVK: 0.3, SVN: 0.1, HRV: 0.2, EST: 0.2, LVA: 0.25, LTU: 0.15, ROU: 0.35, ALB: 0.3,
  USA: 0.3, AUS: 0.12, NZL: 0.1, ISR: 0.3, SAU: 0.25, ARE: 0.12, QAT: 0.05, KWT: 0.1, OMN: 0.15, JOR: 0.15, MAR: 0.35, DZA: 0.4,
  // Países com movimentos separatistas fortes e reais
  ESP: 1.2, GBR: 1.0, CAN: 0.9, BEL: 1.0, ITA: 0.6, IRQ: 1.4, TUR: 1.0, SYR: 1.4, IRN: 0.9, MMR: 1.5, ETH: 1.5, SDN: 1.5, SSD: 1.5, NGA: 1.0, COD: 1.2, CMR: 1.1, CAF: 1.0, TCD: 0.9, IND: 0.7, PAK: 1.1, IDN: 0.8, PHL: 0.9, CHN: 0.7, RUS: 0.9, GEO: 1.3, MDA: 1.3, UKR: 1.1, SRB: 1.2, BIH: 1.4, AZE: 0.9, ARM: 0.9, LBY: 1.5, YEM: 1.5, SOM: 1.5, MLI: 1.3, NER: 0.8, AFG: 1.1, LBN: 1.0, CYP: 1.0, MKD: 0.8, MNE: 0.4, XKX: 1.2,
};
const originOf = (s, data, id) => { const e = s.world?.ents?.[id] || data.reg?.[id]; return e?.origin || e?.secededFrom || id; };

// Resistência à secessão do país `id` (IA ou jogador). Mais alto = mais separatismo.
export function secessionMult(s, data, id) {
  const W = s.world, c = W?.c?.[id]; if (!c) return 0.7;
  const prior = SEP_PRIOR[originOf(s, data, id)] ?? 0.7;
  const pc = Math.max(150, c.gdp * 1e3 / Math.max(0.01, c.pop));
  const hdi = clamp(0.25 + 0.25 * Math.log10(pc / 100) - Math.max(0, 40 - c.stab) * 0.002 - (c.dmg || 0) * 0.2, 0.25, 0.97);
  const stabF = clamp(1.35 - c.stab / 55, 0.2, 1.3);                  // estável = coeso
  const prosperF = hdi >= 0.8 ? 0.35 : hdi >= 0.7 ? 0.55 : hdi >= 0.55 ? 0.8 : 1;   // vive bem sob o Estado = não quer sair
  const e = W.ents?.[id] || data.reg?.[id], lib = e?.profile?.liberty ?? 50;
  const fear = clamp((60 - lib) / 60, 0, 1) * clamp(0.4 + (c.ready ?? 50) / 150, 0.4, 1); // regime duro e armado inibe
  const fearF = 1 - 0.55 * fear;
  const war = W.wars?.some(w => w.active && w.ai && [...w.a, ...w.b].includes(id)) ? 1.25 : 1; // guerra abre brechas
  return clamp(prior * stabF * prosperF * fearF * war, 0.03, 1.5);
}

// Equivalente para a nação do jogador: usa o componente principal e o contentamento real da população.
export function playerSepMult(s) {
  const prior = s.nation.sepPrior ?? 0.7, st = s.st;
  const content = clamp(1.25 - Math.max(0, st.qol - 40) / 60 - Math.max(0, st.stability - 55) / 120, 0.3, 1.25);
  const fear = clamp(((s.d?.repression ?? 0) - 25) / 80, 0, 0.5);
  return clamp(prior * content * (1 - fear), 0.05, 1.5);
}
