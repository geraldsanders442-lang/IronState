import { clamp } from './util.js';

const day = s => Math.floor(s.time.min / 1440);

export function milAction(s, key, log) {
  const g = s.econ.gdp, d = day(s);
  s.counters.milCd = s.counters.milCd || {};
  const cd = s.counters.milCd;
  if ((cd[key] || 0) > d) return { ok: false, msg: `Disponível em ${cd[key] - d} dias.` };
  if (key === 'mobilize') {
    if (s.mobilized > 0) { s.mobilized = 0; return { ok: true, msg: 'Desmobilização ordenada.' }; }
    s.mobilized = 120; cd.mobilize = d + 10;
    s.groups.workers -= 4; s.groups.youth -= 6;
    return { ok: true, msg: 'Mobilização geral decretada por 120 dias.', log: true };
  }
  if (key === 'exercise') {
    if (s.econ.treasury < g * 0.001) return { ok: false, msg: 'Tesouro insuficiente.' };
    s.econ.treasury -= g * 0.001; s.st.readiness = clamp(s.st.readiness + 6, 0, 100); cd.exercise = d + 30;
    for (const id of s.world._nb || []) if (s.partners[id]) s.partners[id].rel -= 2;
    return { ok: true, msg: 'Exercícios militares realizados. Vizinhos acompanharam com desconfiança.' };
  }
  if (key === 'fortify') {
    if (s.econ.treasury < g * 0.002) return { ok: false, msg: 'Tesouro insuficiente.' };
    s.econ.treasury -= g * 0.002; s.longMods.push({ k: 'defense', v: 7, d: 365, left: 365, src: 'Reforço de fronteiras' }); cd.fortify = d + 90;
    return { ok: true, msg: 'Fronteiras reforçadas por um ano.' };
  }
  if (key === 'purge') {
    s.st.coupRisk = clamp(s.st.coupRisk - 15, 0, 100); s.st.readiness = clamp(s.st.readiness - 12, 0, 100);
    s.groups.military -= 8; cd.purge = d + 120; s.longMods.push({ k: 'repression', v: 4, d: 120, left: 120, src: 'Expurgo' });
    return { ok: true, msg: 'Oficiais suspeitos afastados. Risco de golpe caiu, prontidão também.', log: true };
  }
  return { ok: false, msg: '?' };
}
