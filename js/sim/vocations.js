// Vocações regionais: cada região pode ter economia rural, tecnológica e/ou industrial (ou nenhuma), definida pelas obras.
// Regiões separatistas que recebem obras e cuidado se desenvolvem e podem exigir mais autonomia.
import { clamp, chance } from './util.js';
import { BUILDINGS } from './markets.js';

const day = s => Math.floor(s.time.min / 1440);
export const VOC = { rural: ['Economia rural', '#7aa84a', 'farm'], tech: ['Economia tecnológica', '#4aa3d8', 'cpu'], industrial: ['Zona industrial', '#d89a3a', 'factory'] };
export const VOC_ADD = { factory: { industrial: 16 }, mine: { industrial: 10 }, power: { industrial: 8 }, port: { industrial: 6 }, railway: { industrial: 4, rural: 3 }, farm: { rural: 16 }, university: { tech: 10 }, techpark: { tech: 18 }, solar: { tech: 5, rural: 2 }, hospital: {}, housing: {}, base: {} };
export const TAG_AT = 45;

export function ensureVoc(r, s) {
  if (r.voc) return r.voc;
  const urban = r.urban ?? 45, infra = r.infra ?? 40;
  r.voc = { rural: clamp(Math.round(100 - urban * 1.05), 0, 85), industrial: clamp(Math.round(8 + infra * 0.2 + (urban - 45) * 0.15), 0, 60), tech: clamp(Math.round(2 + (r.cap ? 24 : 0) + infra * 0.05), 0, 50) };
  r.dev ??= clamp(Math.round(infra * 0.8 + urban * 0.2), 0, 100);
  r.aut ??= 0;
  return r.voc;
}
export const tagsOf = r => Object.keys(VOC).filter(k => (r.voc?.[k] ?? 0) >= TAG_AT);

export function weeklyVocations(s, data, ctx) {
  const d = day(s);
  let dTech = 0, dInd = 0, dFood = 0;
  for (const r of s.regions) {
    const V = ensureVoc(r, s);
    // obras concluídas somam vocação (uma vez cada)
    for (const pid of r.provinces) for (const b of s.buildings?.[pid] || []) {
      if (b.vocDone || b.done > d) continue;
      b.vocDone = true;
      const add = VOC_ADD[b.type] || {};
      for (const k in add) V[k] = clamp(V[k] + add[k], 0, 100);
      r.dev = clamp((r.dev ?? 40) + 2.5, 0, 100);
    }
    // vocações decaem lentamente sem manutenção de infraestrutura
    for (const k in VOC) V[k] = Math.max(k === 'rural' ? 5 : 0, V[k] - 0.01);
    const share = r.popShare ?? 1 / s.regions.length;
    dTech += V.tech * share * 0.0006; dInd += V.industrial * share * 0.0006; dFood += V.rural * share * 0.0005;
    if (V.industrial >= TAG_AT) { r.pollution = clamp((r.pollution ?? 25) + 0.03, 0, 100); r.unrest = clamp(r.unrest - 0.03, 0, 100); }
    if (V.tech >= TAG_AT) r.unrest = clamp(r.unrest - 0.02, 0, 100);
    if (V.rural >= TAG_AT && V.industrial < 20) r.unrest = clamp(r.unrest + (s.st.poverty > 40 ? 0.02 : -0.01), 0, 100);
    // Desenvolvimento e autonomia (região separatista cuidada cresce e pede mais autonomia)
    const care = (r.invest ?? 0) / Math.max(10, 100 / s.regions.length) - 1;
    r.dev = clamp((r.dev ?? 40) + care * 0.04 + (s.st.stability - 50) * 0.001, 0, 100);
    if (!r.cap && ((r.sep || 0) > 0.15 || r.unrest > 45)) {
      const grow = (r.dev - 45) * 0.0012 + (r.invest > 100 / s.regions.length ? 0.03 : 0);
      r.aut = clamp((r.aut ?? 0) + grow, 0, 100);
      if (r.aut >= 55 && r.dev >= 55 && !r._autAsk && chance(0.04)) {
        r._autAsk = true; r.unrest = clamp(r.unrest + 4, 0, 100);
        ctx.news(`${r.name}, mais desenvolvida, exige um estatuto de autonomia.`, 'warn');
        if (s.issues && !s.issues.scheduled.some(x => x.id === 'vc_autonomy_1')) s.issues.scheduled.push({ id: 'vc_autonomy_1', day: d + 3, bind: { region: r.id } });
      }
      if (r.aut >= 60) { s.st.control = clamp(s.st.control - 0.01, 0, 100); r.sep = Math.max(0, (r.sep || 0) - 0.0004); }
    }
  }
  if (dTech) s.st.tech = clamp(s.st.tech + dTech, 0, 100);
  if (dInd) s.st.industry = clamp(s.st.industry + dInd, 0, 100);
  if (dFood) s.st.hunger = clamp(s.st.hunger - dFood * 0.5, 0, 100);
}
