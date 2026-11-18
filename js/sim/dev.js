// Desenvolvimento: índice de qualidade institucional (educação, saúde, corrupção, infraestrutura, estabilidade) que
// move o crescimento acima ou abaixo do ponto de partida; armadilha da pobreza; risco de reformas importadas.
import { clamp, chance } from './util.js';

export function qualityIndex(s) {
  const st = s.st, infra = s.d?.infra ?? 45;
  return 0.26 * st.education + 0.2 * st.health + 0.2 * (100 - st.corruption) + 0.14 * infra + 0.2 * st.stability;
}
export function ensureDev(s) {
  if (!s.dev) { const q = qualityIndex(s); s.dev = { q, q0: q, trap: 0 }; }
  return s.dev;
}
// Efeito no crescimento (p.p./ano): subir a qualidade acima do ponto de partida acelera; cair freia.
export function devGrowth(s) {
  const D = s.dev; if (!D) return 0;
  const gp = s.econ.gdp * 1e9 / Math.max(1, s.econ.pop * 1e6);
  const poor = clamp(1 - gp / 12000, 0, 1);
  let g = (D.q - D.q0) * 0.12;                 // melhorou/piorou em relação ao início
  g += poor * (D.q - 45) * 0.025;               // quem é pobre e bem governado alcança os ricos
  if (D.q < 40 && poor > 0.55) g -= 0.7 * (1 - D.q / 40) + 0.2; // armadilha da pobreza
  D.trap = D.q < 40 && poor > 0.55 ? 1 : 0;
  return clamp(g, -3, 2.6);
}
export function weeklyDev(s) {
  const D = ensureDev(s);
  D.q += (qualityIndex(s) - D.q) * 0.03;
}

// Reformas com risco: opt.risk = { need: {education: 55, corruption: -40}, p: 0.2, fail: {...efeitos}, text, failNext, okNext }
// need com valor negativo = máximo permitido (corruption: -40 → corrupção ≤ 40).
export function riskCheck(s, risk) {
  let gap = 0;
  for (const k in risk.need || {}) {
    const need = risk.need[k], v = k === 'devQ' ? ensureDev(s).q : k === 'gdppc' ? s.econ.gdp * 1e9 / (s.econ.pop * 1e6) / 400 : s.st[k] ?? 50;
    gap += need >= 0 ? Math.max(0, need - v) / Math.max(20, need) : Math.max(0, v + need) / Math.max(20, -need);
  }
  const p = clamp((risk.p ?? 0.1) + gap * 1.1, 0.03, 0.92);
  return { p, fail: chance(p) };
}
