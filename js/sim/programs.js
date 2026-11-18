import { clamp, chance } from './util.js';
import { SPEND } from './constants.js';
import { devF } from './model.js';
import { investCash, payInvest } from './finance.js';

const day = s => Math.floor(s.time.min / 1440);

// Programas econômicos: atalhos para acelerar (ou frear) a economia, com custo, duração e efeito colateral.
// cost: % do PIB pago no início (negativo = arrecada); weeks: duração; mods: efeitos durante; after: efeitos depois [mods, semanas (0 = permanente)].
export const PROGRAMS = [
  { id: 'pac', name: 'Programa de Aceleração do Crescimento', cost: 1.5, weeks: 52, desc: 'Pacote de obras públicas, crédito barato e incentivos.', mods: { growth: 1.2, unemployment: -1.5, logistics: 4, housing: 3, corruption: 2, g_workers: 5, g_business: 4, g_regional: 5 }, after: [{ inflation: 0.8, growth: -0.3 }, 26] },
  { id: 'liberal', name: 'Choque liberal', cost: 0, weeks: 39, desc: 'Corte de subsídios, abertura, desregulação. Dói antes de funcionar.', mods: { growth: -0.8, unemployment: 2.5, inflation: -3, market: 12, inequality: 3, protest: 6, g_business: 10, g_workers: -10, g_bureaucracy: -6 }, after: [{ growth: 1.4, productivity: 4, market: 4 }, 78], blocked: s => s.st.market > 85 ? 'A economia já é quase totalmente liberal' : null },
  { id: 'plan5', name: 'Plano quinquenal', cost: 2, weeks: 104, desc: 'O Estado dirige investimentos para a indústria pesada.', mods: { industry: 8, milIndustry: 5, growth: 0.8, market: -10, unemployment: -2, corruption: 3, g_workers: 5, g_business: -10, g_military: 4 }, after: [{ productivity: -2 }, 52], blocked: s => s.st.market > 70 ? 'Exige economia com forte presença estatal (modelo ≤ 70)' : null },
  { id: 'austerity', name: 'Austeridade fiscal', cost: 0, weeks: 52, desc: 'Congela salários e investimentos para equilibrar as contas.', mods: { revenue: 1.5, growth: -0.9, protest: 8, reputation: 4, g_bureaucracy: -10, g_workers: -6, g_business: 4 }, after: [{ reputation: 2 }, 52] },
  { id: 'freezones', name: 'Zonas francas de exportação', cost: 0.6, weeks: 104, desc: 'Isenção de impostos para fábricas exportadoras em portos e fronteiras.', mods: { exportAccess: 0.1, growth: 0.6, revenue: -0.4, corruption: 2, industry: 3, g_business: 6 }, after: [{ exportAccess: 0.04 }, 0], blocked: s => !s.nation.coastal && s.st.logistics < 45 ? 'Exige litoral ou logística ≥ 45' : null },
  { id: 'isi', name: 'Substituição de importações', cost: 0.8, weeks: 104, desc: 'Tarifas altas e crédito para a indústria nacional.', mods: { industry: 6, importAccess: -0.1, inflation: 1, growth: -0.1, g_business: 3, g_workers: 4 }, after: [{ industry: 2, growth: 0.3 }, 104] },
  { id: 'fdi', name: 'Atração de investimento estrangeiro', cost: 0.4, weeks: 78, desc: 'Garantias jurídicas, roadshows e isenções para multinacionais.', mods: { growth: 0.5, tech: 4, reputation: 2, market: 4, g_business: 5, g_opposition: 2 }, after: [{ tech: 2 }, 104], blocked: s => s.st.stability < 40 ? 'Investidores exigem estabilidade ≥ 40' : null },
  { id: 'green', name: 'Revolução verde', cost: 1, weeks: 104, desc: 'Sementes, irrigação e crédito rural.', mods: { hunger: -3, poverty: -2, pollution: 3, growth: 0.3, g_rural: 10 }, after: [{ hunger: -1.5 }, 0] },
  { id: 'techhub', name: 'Polo tecnológico nacional', cost: 1.2, weeks: 156, desc: 'Parques científicos, bolsas e capital de risco público.', mods: { tech: 8, education: 3, productivity: 4, g_youth: 6 }, after: [{ tech: 3, productivity: 2 }, 0], blocked: s => s.st.education < 40 ? 'Exige educação ≥ 40' : null },
  { id: 'stimulus', name: 'Estímulo ao consumo', cost: 1, weeks: 26, desc: 'Cheques às famílias e crédito fácil. Boom agora, ressaca depois.', mods: { growth: 2, unemployment: -2, inflation: 3, g_workers: 6, g_youth: 4, g_rural: 4 }, after: [{ growth: -1.2, inflation: 1 }, 52] },
  { id: 'tourism', name: 'Plano nacional de turismo', cost: 0.5, weeks: 78, desc: 'Promoção internacional, aeroportos e hotelaria.', mods: { growth: 0.4, unemployment: -0.8, crime: 2, reputation: 2 }, after: [{ growth: 0.2 }, 104], blocked: s => s.wars.some(w => w.active) ? 'Ninguém viaja para um país em guerra' : null },
  { id: 'taxreform', name: 'Reforma tributária', cost: 0.2, weeks: 52, desc: 'Simplifica impostos e fecha brechas.', mods: { taxCapacity: 8, corruption: -3, g_business: -5, g_regional: -4 }, after: [{ taxCapacity: 4 }, 0] },
  { id: 'print', name: 'Financiamento monetário', cost: -2, weeks: 52, desc: 'O banco central compra títulos do governo: dinheiro agora, inflação depois.', mods: { inflation: 6, reputation: -6, growth: 0.3 }, after: [{ inflation: 1.5 }, 26] },
  { id: 'megaworks', name: 'Mutirão de infraestrutura', cost: 1.8, weeks: 78, desc: 'Estradas, portos e energia em todas as regiões.', mods: { logistics: 6, growth: 0.6, housing: 4, corruption: 3, g_regional: 8 }, after: [{ logistics: 3, growth: 0.2 }, 0], regions: 12 },
  { id: 'privat', name: 'Privatização em massa', cost: -3, weeks: 26, desc: 'Vende estatais: caixa imediato, perda de controle.', mods: { market: 10, efficiency: 3, inequality: 4, g_business: 10, g_bureaucracy: -10, g_workers: -6 }, after: [{ market: 5 }, 0], blocked: s => s.st.market > 80 ? 'Quase não restam estatais' : null },
  { id: 'national', name: 'Nacionalização dos recursos', cost: 0, weeks: 52, desc: 'O Estado assume minas, petróleo e energia.', mods: { revenue: 1, market: -10, reputation: -5, g_business: -12, g_workers: 8 }, after: [{ revenue: 0.6 }, 0], blocked: s => s.st.market < 20 ? 'Os recursos já são estatais' : null },
];
export const programById = Object.fromEntries(PROGRAMS.map(p => [p.id, p]));
export const MAX_PROGRAMS = 2;

export function programBlock(s, p) {
  s.programs ||= [];
  if (s.programs.some(x => x.id === p.id)) return 'Em andamento';
  if (s.programs.length >= MAX_PROGRAMS) return `Máximo de ${MAX_PROGRAMS} programas simultâneos`;
  const last = (s.counters.progLast || {})[p.id];
  if (last && day(s) - last < 365) return `Repetido recentemente (${365 - (day(s) - last)} dias)`;
  if (p.cost > 0 && investCash(s) < s.econ.gdp * p.cost / 100 * 0.5) return 'Sem recursos (precisa de metade do custo no tesouro ou na carteira de investimentos)';
  return p.blocked?.(s) || null;
}

export function startProgram(s, id) {
  const p = programById[id];
  const b = programBlock(s, p);
  if (b) return { ok: false, msg: b };
  const g = s.econ.gdp, d = p.weeks * 7;
  if (p.cost > 0) payInvest(s, g * p.cost / 100); else s.econ.treasury -= g * p.cost / 100;
  for (const k in p.mods) s.longMods.push({ k, v: p.mods[k], d, left: d, src: 'Programa: ' + p.name, id: 'prog_' + id });
  if (p.regions) for (const r of s.regions) r.infra = clamp(r.infra + p.regions * (r.infra < 50 ? 1 : 0.5), 0, 100);
  s.programs.push({ id, start: day(s), end: day(s) + d });
  (s.counters.progLast ||= {})[id] = day(s);
  return { ok: true, msg: `${p.name} lançado.`, log: true };
}
export function cancelProgram(s, id) {
  s.longMods = s.longMods.filter(m => m.id !== 'prog_' + id);
  s.programs = (s.programs || []).filter(x => x.id !== id);
  s.st.legitimacy = clamp(s.st.legitimacy - 2, 0, 100);
  return { ok: true, msg: 'Programa interrompido.', log: true };
}

// Necessidade mínima de gasto por área (sobe com o desenvolvimento): abaixo disso há sucateamento.
export function spendNeed(s, k) {
  const df = devF(s);
  return { health: 2 + df * 1.4, education: 2 + df * 1.2, welfare: 1 + df * 1.9, security: 0.9 + df * 0.4, military: 0.8, admin: 1.4 + df * 0.8, infra: 1.1 + df * 0.6 }[k] ?? SPEND[k]?.def ?? 1;
}
export function underfunding(s) {
  const out = {};
  for (const k in s.budget.spend) out[k] = Math.max(0, spendNeed(s, k) - s.budget.spend[k]) / spendNeed(s, k);
  return out;
}

export function weeklyPrograms(s, ctx) {
  s.programs ||= [];
  const d = day(s);
  for (const p of [...s.programs]) {
    if (p.end > d) continue;
    const def = programById[p.id];
    s.programs = s.programs.filter(x => x !== p);
    if (def.after) { const [mods, w] = def.after; for (const k in mods) s.longMods.push({ k, v: mods[k], d: w * 7, left: w * 7, src: 'Efeito: ' + def.name, id: 'progA_' + p.id }); }
    ctx.news(`${def.name} chega ao fim.`, 'info');
  }
  // Cortes abruptos de gastos geram protestos e greves.
  const ref = s.counters.spendRef ||= { ...s.budget.spend };
  for (const k in s.budget.spend) {
    const cut = ref[k] - s.budget.spend[k];
    if (cut >= 0.5) {
      const who = { health: ['workers', 'Greve de médicos e enfermeiros'], education: ['youth', 'Professores e estudantes vão às ruas'], welfare: ['workers', 'Protestos contra cortes sociais'], security: ['bureaucracy', 'Policiais fazem operação-padrão'], military: ['military', 'Mal-estar nos quartéis com os cortes'], admin: ['bureaucracy', 'Servidores entram em greve'], infra: ['regional', 'Prefeitos protestam contra obras paradas'] }[k];
      s.longMods.push({ k: 'protest', v: cut * 3, d: 60, left: 60, src: 'Corte abrupto: ' + SPEND[k].name });
      s.groups[who[0]] = clamp(s.groups[who[0]] - cut * 4, 0, 100);
      if (k === 'military') s.longMods.push({ k: 'coupRisk', v: cut * 3, d: 90, left: 90, src: 'Cortes militares' });
      ctx.news(`${who[1]} (${SPEND[k].name}: −${cut.toFixed(1)} p.p. do PIB).`, 'bad');
    }
    ref[k] = s.budget.spend[k];
  }
  // Sucateamento prolongado
  const u = underfunding(s);
  s.counters.underW ||= {};
  for (const k in u) {
    s.counters.underW[k] = u[k] > 0.15 ? (s.counters.underW[k] || 0) + 1 : 0;
    const w = s.counters.underW[k];
    if (w === 12 || (w > 12 && w % 26 === 0)) {
      const msg = { health: 'Hospitais lotados e falta de remédios: epidemia de dengue se espalha', education: 'Escolas fecham por falta de professores; ranking educacional despenca', welfare: 'Filas de fome voltam às periferias', security: 'Onda de crimes: facções dominam bairros inteiros', military: 'Quartéis sem munição e blindados parados', admin: 'Serviços públicos em colapso: filas, papelada e propina', infra: 'Ponte desaba e apagões atingem várias regiões' }[k];
      ctx.news(msg + '.', 'bad');
      const hit = { health: { health: -6, qol: -3, legitimacy: -3 }, education: { education: -5, productivity: -2 }, welfare: { poverty: 3, hunger: 2, protest: 5 }, security: { crime: 8, control: -5 }, military: { readiness: -6, equipment: -4, coupRisk: 4 }, admin: { corruption: 4, efficiency: -5 }, infra: { logistics: -5, growth: -0.4 } }[k];
      for (const x in hit) s.longMods.push({ k: x, v: hit[x], d: 120, left: 120, src: 'Sucateamento: ' + SPEND[k].name });
      if (k === 'infra') for (const r of s.regions) r.infra = clamp(r.infra - 2, 0, 100);
    }
  }
}
