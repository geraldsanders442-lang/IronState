import { clamp, random } from './util.js';
import { debtRatio } from './model.js';
import { PLY } from './world.js';

// Missões: metas de curto e longo prazo, com prazo, recompensa e penalidade. Nenhuma exige uma ideologia específica.
const M = [
  { id: 'inflation', name: 'Domar a inflação', desc: 'Reduzir a inflação abaixo de 5%.', when: s => s.st.inflation > 6.5, goal: s => s.st.inflation < 5, weeks: 26, reward: { legitimacy: 5, g_business: 6 }, fail: { legitimacy: -3 } },
  { id: 'food', name: 'Fim da escassez', desc: 'Eliminar a escassez de alimentos e levar a fome abaixo de 5%.', when: s => (s.d?.foodShort || 0) > 0.01 || s.st.hunger > 8, goal: s => (s.d?.foodShort || 0) < 0.002 && s.st.hunger < 5, weeks: 20, reward: { g_rural: 8, legitimacy: 4 }, fail: { revoRisk: 4 } },
  { id: 'crisis', name: 'Atravessar a tempestade', desc: 'Trazer o risco de golpe e de revolução abaixo de 30.', when: s => s.st.coupRisk > 45 || s.st.revoRisk > 45, goal: s => s.st.coupRisk < 30 && s.st.revoRisk < 30, weeks: 16, reward: { stability: 6 }, fail: { legitimacy: -4 } },
  { id: 'bloc', name: 'Arquiteto regional', desc: 'Fundar um bloco econômico com pelo menos 3 membros.', when: s => !s.world.blocs.length, goal: s => s.world.blocs.some(b => b.members.length >= 3), weeks: 52, reward: { influence: 6, growth: 0.3 }, fail: {} },
  { id: 'army', name: 'Exército moderno', desc: 'Equipamentos ≥ 65 e prontidão ≥ 60.', when: s => s.st.equipment < 55, goal: s => s.st.equipment >= 65 && s.st.readiness >= 60, weeks: 52, reward: { g_military: 10, defense: 4 }, fail: { g_military: -5 } },
  { id: 'top10', name: 'Entre os gigantes', desc: 'Chegar ao top 10 das maiores economias.', when: s => { const p = s.world.rankings?.gdp?.pos; return p > 10 && p <= 30; }, goal: s => (s.world.rankings?.gdp?.pos || 999) <= 10, weeks: 156, reward: { influence: 10, legitimacy: 6 }, fail: {} },
  { id: 'nocoup', name: 'Regime inabalável', desc: 'Evitar qualquer tentativa de golpe por cinco anos.', when: () => true, goal: (s, m) => s.time.min / 1440 - m.start >= 1825 && !s.flags.coupAttempt, weeks: 261, long: true, reward: { legitimacy: 10, g_military: 5 }, fail: {}, failIf: s => !!s.flags.coupAttempt },
  { id: 'defwar', name: 'Defender a pátria', desc: 'Vencer ou encerrar com honra a guerra defensiva.', when: s => s.wars.some(w => w.active && !w.aggressor), goal: s => !s.wars.some(w => w.active && !w.aggressor) && !s.flags.lostWar, weeks: 52, reward: { legitimacy: 10, g_military: 8 }, fail: { legitimacy: -6 } },
  { id: 'sphere', name: 'Esfera de influência', desc: 'Ter três vizinhos com relação ≥ 60 ou Estados clientes.', when: s => true, goal: s => [...(s.world._nb || [])].filter(id => (s.partners[id]?.rel || 0) >= 60 || s.world.c[id]?.puppetOf === PLY).length >= 3, weeks: 104, long: true, reward: { influence: 8, reputation: 3 }, fail: {} },
  { id: 'debt', name: 'Contas em ordem', desc: 'Reduzir a dívida pública abaixo de 60% do PIB.', when: s => debtRatio(s) > 80, goal: s => debtRatio(s) < 60, weeks: 104, reward: { g_business: 8, reputation: 3 }, fail: { g_business: -4 } },
  { id: 'poverty', name: 'Guerra à pobreza', desc: 'Reduzir a pobreza em 5 pontos.', when: s => s.st.poverty > 15, goal: (s, m) => s.st.poverty <= m.base - 5, base: s => s.st.poverty, weeks: 52, reward: { g_workers: 8, legitimacy: 4 }, fail: { g_workers: -4 } },
  { id: 'jobs', name: 'Pleno emprego', desc: 'Levar o desemprego abaixo de 7%.', when: s => s.st.unemployment > 10, goal: s => s.st.unemployment < 7, weeks: 52, reward: { g_workers: 6, g_youth: 6 }, fail: { protest: 4 } },
  { id: 'image', name: 'Limpar a imagem', desc: 'Elevar a reputação internacional acima de 50.', when: s => s.st.reputation < 35, goal: s => s.st.reputation > 50, weeks: 52, reward: { exportAccess: 0.04 }, fail: {} },
  { id: 'legit', name: 'Conquistar o povo', desc: 'Legitimidade acima de 55.', when: s => s.st.legitimacy < 40, goal: s => s.st.legitimacy > 55, weeks: 26, reward: { stability: 5 }, fail: { revoRisk: 4 } },
  { id: 'unity', name: 'Unidade nacional', desc: 'Separatismo abaixo de 25.', when: s => s.st.separatism > 40, goal: s => s.st.separatism < 25, weeks: 52, reward: { control: 5, g_regional: 5 }, fail: { separatism: 4 } },
  { id: 'growth', name: 'Milagre econômico', desc: 'Crescimento acima de 5% ao ano.', when: s => s.st.growth < 3, goal: s => s.st.growth > 5, weeks: 52, reward: { g_business: 6, legitimacy: 4 }, fail: {} },
  { id: 'recognition', name: 'Reconhecimento internacional', desc: 'Encerrar por acordo uma reivindicação territorial contra você.', when: s => s.world.claims.some(c => c.holder === PLY && c.status === 'active'), goal: (s, m) => s.world.claims.filter(c => c.holder === PLY && c.status === 'active').length < m.base, base: s => s.world.claims.filter(c => c.holder === PLY && c.status === 'active').length, weeks: 104, reward: { reputation: 5, stability: 3 }, fail: {} },
];
export const MISSIONS = Object.fromEntries(M.map(m => [m.id, m]));
const day = s => Math.floor(s.time.min / 1440);

export function initMissions(s) { s.missions = { active: [], done: [], failed: [] }; offer(s); }

function offer(s) {
  const act = s.missions.active, taken = new Set([...act, ...s.missions.done.slice(-12), ...s.missions.failed.slice(-6)].map(m => m.id));
  const count = long => act.filter(m => !!MISSIONS[m.id].long === long).length;
  for (const m of [...M].sort(() => random() - 0.5)) {
    if (taken.has(m.id) || count(!!m.long) >= (m.long ? 2 : 3)) continue;
    let ok = false; try { ok = m.when(s); } catch { ok = false; }
    if (ok) act.push({ id: m.id, start: day(s), deadline: day(s) + m.weeks * 7, base: m.base ? m.base(s) : null });
  }
}

export function weeklyMissions(s, data, ctx) {
  const done = [];
  for (const m of s.missions.active) {
    const def = MISSIONS[m.id];
    let win = false; try { win = def.goal(s, m); } catch { win = false; }
    const lose = day(s) > m.deadline || (def.failIf && def.failIf(s));
    if (win || lose) done.push([m, win]);
  }
  for (const [m, win] of done) {
    const def = MISSIONS[m.id];
    s.missions.active = s.missions.active.filter(x => x !== m);
    (win ? s.missions.done : s.missions.failed).push({ ...m, end: day(s) });
    const eff = win ? def.reward : def.fail;
    for (const k in eff) s.longMods.push({ k, v: eff[k], d: 365, left: 365, src: `Missão: ${def.name}` });
    ctx.log(win ? `Missão cumprida: ${def.name}!` : `Missão fracassada: ${def.name}.`, win ? 'good' : 'warn');
  }
}

export function monthlyMissions(s) { offer(s); }
export function missionProgress(s, m) {
  const def = MISSIONS[m.id];
  return { ...def, left: Math.max(0, m.deadline - day(s)), start: m.start, base: m.base };
}
export { clamp };
