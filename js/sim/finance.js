// Financiamento de investimentos: fundo nacional (enche com superávits e rende juros), emissão de moeda e
// títulos de investimento. Tudo vai para uma "carteira de investimentos" que só paga obras, iniciativas,
// programas, compras militares e investimentos setoriais — nunca o custeio. Cada fonte tem teto anual.
import { clamp } from './util.js';
import { debtRatio } from './model.js';

const day = s => Math.floor(s.time.min / 1440);
export const FIN_CAPS = { fundCap: 6, printYear: 1.5, bondsYear: 3 }; // % do PIB

export function initFinance(s) {
  if (s.fin) return;
  const g = s.econ.gdp;
  s.fin = { fund: Math.min(g * 0.02, s.econ.reserves * 0.15 + g * 0.005), pool: 0, year: Math.floor(day(s) / 365), printed: 0, bonds: 0, log: [] };
}
const yearReset = s => { const y = Math.floor(day(s) / 365); if (s.fin.year !== y) { s.fin.year = y; s.fin.printed = 0; s.fin.bonds = 0; } };

export function creditRoom(s) {
  const limit = (0.6 + s.st.reputation / 100 * 0.6 + (s.d?.mods?.creditLimit || 0)) * 100;
  return Math.max(0, (limit - debtRatio(s)) / 100 * s.econ.gdp);
}
export function financeLimits(s) {
  initFinance(s); yearReset(s);
  const g = s.econ.gdp, F = s.fin;
  return {
    fund: F.fund, fundCap: g * FIN_CAPS.fundCap / 100,
    print: Math.max(0, g * FIN_CAPS.printYear / 100 - F.printed), printCap: g * FIN_CAPS.printYear / 100,
    bonds: Math.max(0, Math.min(g * FIN_CAPS.bondsYear / 100 - F.bonds, creditRoom(s))), bondsCap: g * FIN_CAPS.bondsYear / 100,
    defaulted: !!s.flags.defaulted,
  };
}

// Leva dinheiro de uma fonte para a carteira de investimentos.
export function raiseFunds(s, source, pctGdp) {
  initFinance(s); yearReset(s);
  const L = financeLimits(s), g = s.econ.gdp, F = s.fin;
  let amt = g * pctGdp / 100;
  if (source === 'fund') {
    amt = Math.min(amt, F.fund);
    if (amt <= 1e-6) return { ok: false, msg: 'O fundo nacional está vazio. Ele volta a encher com superávits.' };
    F.fund -= amt;
  } else if (source === 'print') {
    amt = Math.min(amt, L.print);
    if (amt <= 1e-6) return { ok: false, msg: 'Teto anual de emissão atingido: mais dinheiro impresso viraria hiperinflação.' };
    F.printed += amt; s.econ.printed += amt;
    s.st.reputation = clamp(s.st.reputation - amt / g * 100 * 1.2, 0, 100);
    s.longMods.push({ k: 'inflation', v: +(amt / g * 100 * 1.6).toFixed(2), d: 180, left: 180, src: 'Emissão para investimentos' });
  } else if (source === 'bonds') {
    if (L.defaulted) return { ok: false, msg: 'Depois do calote, ninguém compra títulos do governo.' };
    amt = Math.min(amt, L.bonds);
    if (amt <= 1e-6) return { ok: false, msg: 'Sem espaço: teto anual de títulos ou limite de crédito atingido.' };
    F.bonds += amt; s.econ.debt += amt;
  } else return { ok: false, msg: '?' };
  F.pool += amt;
  F.log.unshift({ day: day(s), source, amt });
  F.log.length = Math.min(F.log.length, 20);
  const nm = { fund: 'do fundo nacional', print: 'com emissão de moeda', bonds: 'com títulos de investimento' }[source];
  return { ok: true, msg: `${amt.toFixed(2)} bi levantados ${nm} para investimentos.`, log: true };
}

// Disponível para investir e pagamento (carteira primeiro, depois o tesouro).
export const investCash = s => (s.fin?.pool || 0) + Math.max(0, s.econ.treasury);
export function payInvest(s, cost) {
  initFinance(s);
  const fromPool = Math.min(s.fin.pool, cost);
  s.fin.pool -= fromPool;
  s.econ.treasury -= cost - fromPool;
  return fromPool;
}

// Investimentos setoriais de uma vez: cada setor tem retorno decrescente se repetido no mesmo ano.
export const SECTOR_INVEST = {
  infra: { name: 'Infraestrutura nacional', mods: [['logistics', 3], ['growth', 0.25], ['housing', 1.5]], regional: 6 },
  health: { name: 'Saúde pública', mods: [['health', 3], ['g_workers', 2]] },
  education: { name: 'Educação e escolas técnicas', mods: [['education', 2.5], ['productivity', 1.2], ['g_youth', 2]] },
  industry: { name: 'Indústria e crédito produtivo', mods: [['industry', 3], ['growth', 0.3], ['unemployment', -0.8], ['g_business', 2]] },
  tech: { name: 'Ciência e tecnologia', mods: [['tech', 3], ['productivity', 1]] },
  military: { name: 'Reequipamento militar', mods: [['equipment', 5], ['readiness', 3], ['g_military', 3]] },
  energy: { name: 'Energia', mods: [['s_energy', 3], ['growth', 0.15]] },
  agro: { name: 'Agricultura e irrigação', mods: [['s_food', 3], ['hunger', -1.5], ['g_rural', 3]] },
};
export function sectorInvest(s, key, pctGdp = 0.5) {
  initFinance(s);
  const S = SECTOR_INVEST[key]; if (!S) return { ok: false, msg: '?' };
  const cost = s.econ.gdp * pctGdp / 100;
  if (investCash(s) < cost) return { ok: false, msg: 'Sem recursos: levante dinheiro na aba Financiamento (fundo, emissão ou títulos).' };
  const yr = Math.floor(day(s) / 365), rec = (s.fin.sector ||= {});
  const n = rec[key]?.year === yr ? rec[key].n : 0;
  const eff = pctGdp / 0.5 / (1 + n * 0.6);
  payInvest(s, cost);
  rec[key] = { year: yr, n: n + 1 };
  for (const [k, v] of S.mods) s.longMods.push({ k, v: +(v * eff).toFixed(2), d: 540, left: 540, src: `Investimento: ${S.name}` });
  if (S.regional) for (const r of s.regions) r.infra = clamp(r.infra + S.regional * eff * (r.infra < 50 ? 1.3 : 0.7), 0, 99);
  s.counters.costPressure += 0.01 * pctGdp;
  return { ok: true, msg: `${S.name}: ${cost.toFixed(2)} bi investidos${n ? ' (retorno menor: setor já recebeu verba este ano)' : ''}.`, log: true };
}

export function weeklyFinance(s) {
  initFinance(s); yearReset(s);
  const F = s.fin, g = s.econ.gdp, bal = s.d?.budget?.balance || 0, cap = g * FIN_CAPS.fundCap / 100;
  // O fundo rende 3% ao ano e recebe 25% dos superávits; acima do teto, a sobra fica no tesouro.
  F.fund += F.fund * 0.03 / 52;
  if (bal > 0) { const take = bal / 52 * 0.25; F.fund += take; s.econ.treasury -= take; }
  if (F.fund > cap) { s.econ.treasury += F.fund - cap; F.fund = cap; }
  // Dinheiro parado na carteira perde valor com a inflação.
  F.pool *= 1 - Math.max(0, s.st.inflation) / 100 / 52;
}
