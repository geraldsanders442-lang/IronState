import { clamp } from './util.js';

export const AXES = ['econ', 'redist', 'trad', 'relig', 'auth', 'nation', 'mil', 'global', 'expand', 'eco', 'central', 'tech', 'align'];

// Calcula os eixos ideológicos a partir das 20 respostas (índice da alternativa por pergunta).
export function computeAxes(answers, identity) {
  // Média ponderada pela convicção: respostas fortes pesam mais que efeitos colaterais moderados.
  const sum = {}, w = {}, n = {};
  identity.questions.forEach((q, i) => {
    const a = q.a[answers[i]];
    if (!a) return;
    for (const k in a.ax) { const v = a.ax[k]; sum[k] = (sum[k] || 0) + v * Math.abs(v); w[k] = (w[k] || 0) + Math.abs(v); n[k] = (n[k] || 0) + 1; }
  });
  const ax = {};
  for (const k of AXES) ax[k] = w[k] ? clamp(sum[k] / w[k] * Math.min(1, 0.7 + 0.15 * n[k]), -100, 100) : 0;
  return ax;
}

export function classify(answers, identity) {
  const ax = computeAxes(answers, identity);
  const scored = identity.archetypes.map(a => {
    const keys = Object.keys(a.p);
    const d = Math.sqrt(keys.reduce((s, k) => s + (ax[k] - a.p[k]) ** 2, 0) / keys.length);
    return { ...a, score: Math.round(100 - d / 2) };
  }).sort((a, b) => b.score - a.score);
  const traits = identity.traits.filter(t => (t.min != null && ax[t.ax] >= t.min) || (t.max != null && ax[t.ax] <= t.max)).map(t => ({ ...t, v: ax[t.ax] }));
  traits.sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  const best = scored[0];
  // Rótulo híbrido: o arquétipo mais próximo + o traço mais forte que ele não explica.
  const covered = t => Math.sign(best.p[t.ax] ?? 0) === Math.sign(t.v) && Math.abs(best.p[t.ax] ?? 0) >= 40;
  const extra = traits.find(t => !covered(t));
  const primary = best.score < 90 && extra ? `${best.name} ${extra.label}` : best.name;
  const q = i => identity.questions[i].a[answers[i]] || {};

  let economic;
  if (ax.econ < -60) economic = 'Economia planificada';
  else if (ax.econ < -30) economic = ax.redist > 40 ? 'Socialismo de mercado' : 'Capitalismo de Estado';
  else if (ax.econ <= 30) economic = ax.redist > 40 ? 'Economia mista com Estado de bem-estar' : 'Economia mista';
  else if (ax.econ <= 70) economic = ax.redist > 30 ? 'Economia social de mercado' : 'Economia de mercado';
  else economic = 'Capitalismo de laissez-faire';
  if (ax.global < -60) economic += ' autárquica';

  const g15 = q(14).gov, g17 = q(16).gov, struct = q(15).struct;
  let government;
  if (g17 === 'junta') government = 'Junta militar';
  else if (ax.relig > 70 && ax.auth > 40) government = struct === 'monarquia' ? 'Monarquia teocrática' : 'República teocrática';
  else if (g15 === 'party') government = 'Estado de partido único';
  else if (g15 === 'personal') government = struct === 'monarquia' ? 'Monarquia absoluta' : 'Ditadura pessoal';
  else if (g15 === 'dominant') government = struct === 'monarquia' ? 'Monarquia autoritária' : 'Regime de partido dominante';
  else government = struct === 'monarquia' ? 'Monarquia constitucional parlamentar' : 'República democrática';
  if (struct === 'federal') government += ' federal';
  else if (struct === 'unitário' && !government.includes('Monarquia')) government += ' unitária';

  let social;
  if (ax.trad > 40 && ax.relig > 40) social = 'Conservadorismo religioso';
  else if (ax.trad > 40 && ax.relig < -40) social = 'Tradicionalismo secular';
  else if (ax.trad > 40) social = 'Conservadorismo cultural';
  else if (ax.trad < -40 && ax.auth > 40) social = 'Progressismo autoritário';
  else if (ax.trad < -40) social = 'Progressismo liberal';
  else social = 'Moderação social';
  if (ax.nation > 60) social += ' e nacionalismo identitário';

  let foreign;
  if (ax.global < -50) foreign = ax.mil > 30 ? 'Isolacionismo armado' : 'Isolacionismo';
  else if (ax.expand > 50) foreign = 'Revisionismo expansionista';
  else if (ax.align > 50) foreign = 'Alinhamento ocidental';
  else if (ax.align < -50) foreign = 'Alinhamento eurasiático';
  else if (ax.global > 50) foreign = 'Internacionalismo multilateral';
  else foreign = 'Não alinhamento pragmático';

  const top = AXES.map(k => [k, ax[k]]).filter(([, v]) => Math.abs(v) >= 25).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 5);
  const why = top.map(([k, v]) => {
    const pole = identity.axes[k][v < 0 ? 0 : 1];
    const drivers = identity.questions.map((qq, i) => ({ q: qq, a: qq.a[answers[i]] })).filter(x => x.a && Math.sign(x.a.ax[k] || 0) === Math.sign(v) && Math.abs(x.a.ax[k] || 0) >= 30)
      .sort((a, b) => Math.abs(b.a.ax[k]) - Math.abs(a.a.ax[k])).slice(0, 2).map(x => `“${x.a.t}” (${x.q.topic})`);
    return { axis: k, v: Math.round(v), pole, text: `${pole} (${Math.round(v)}): ${drivers.join('; ') || 'combinação de respostas'}` };
  });

  return { axes: ax, primary, archetype: best.id, archetypeName: best.name, match: best.score, runnerUp: scored.slice(1, 3).map(x => ({ name: x.name, score: x.score })), traits: traits.map(t => t.label), economic, government, social, foreign, why };
}

// Afinidade ideológica (−1..1) entre a nação do jogador e um perfil de país do registro.
export function profileAxes(p) {
  if (!p) return null;
  const align = { W: 80, WL: 40, N: 0, EL: -40, E: -80 }[p.align] ?? 0;
  return { auth: 100 - p.liberty * 2, econ: p.market * 2 - 100, relig: p.religiosity * 2 - 100, align };
}
export function affinity(ax, p) {
  const b = profileAxes(p);
  if (!b || !ax) return 0;
  const d = Math.sqrt(((ax.auth - b.auth) ** 2 * 1.2 + (ax.econ - b.econ) ** 2 * 0.6 + (ax.relig - b.relig) ** 2 * 0.5 + (ax.align - b.align) ** 2 * 1.2) / 3.5);
  return clamp(1 - d / 100, -1, 1);
}
