// Choques globais: recessão, alta de commodities, onda de doença, boom e crises que atingem todos os países
// (frequência e dureza dependem da dificuldade). Dão ao mundo vida própria além das decisões do jogador.
import { chance, pick, random } from './util.js';
import { DIFFICULTY } from './constants.js';

const day = s => Math.floor(s.time.min / 1440);
const mod = (s, k, v, d, src) => s.longMods.push({ k, v, d, left: d, src });

const SHOCKS = {
  recession: { w: 1.2, title: 'Recessão global', desc: 'Uma crise financeira derruba o comércio e o crédito no mundo todo. Os preços das exportações caem e o desemprego sobe.', apply: (s, k) => { mod(s, 'growth', -1.3 * k, 220, 'Recessão global'); mod(s, 'exportAccess', -0.04 * k, 220, 'Recessão global'); },
    opts: [['Estimular a economia com gastos públicos.', 'Amortece a queda; custa caixa.', s => { s.econ.treasury -= s.econ.gdp * 0.004; mod(s, 'growth', 0.6, 160, 'Estímulo'); }], ['Austeridade: cortar gastos e esperar.', 'Poupa o caixa; a recessão pesa mais.', s => { s.econ.treasury += s.econ.gdp * 0.002; mod(s, 'growth', -0.3, 160, 'Austeridade'); }], ['Proteger os empregos com subsídios.', 'Segura o desemprego; custa.', s => { s.econ.treasury -= s.econ.gdp * 0.003; mod(s, 'unemployment', -0.8, 160, 'Subsídios ao emprego'); }]] },
  commodity: { w: 1, title: 'Alta dos preços de energia e alimentos', desc: 'Conflitos distantes e quebras de safra elevam os preços de energia e comida em todo o mundo.', apply: (s, k) => { mod(s, 'inflation', 2.2 * k, 160, 'Alta de commodities'); mod(s, 'hunger', 1.5 * k, 160, 'Alta de commodities'); },
    opts: [['Subsidiar combustíveis e alimentos.', 'Alivia a inflação; custa caro.', s => { s.econ.treasury -= s.econ.gdp * 0.004; mod(s, 'inflation', -1.5, 140, 'Subsídios'); }], ['Subir os juros para conter preços.', 'Inflação cai; economia desacelera.', s => { mod(s, 'inflation', -1.2, 140, 'Juros altos'); mod(s, 'growth', -0.5, 140, 'Juros altos'); }], ['Deixar o mercado ajustar.', 'Sem custo; população sofre.', s => { s.st.protest = Math.min(100, s.st.protest + 3); }]] },
  pandemic: { w: 0.7, title: 'Nova onda de doença', desc: 'Um vírus de transmissão rápida se espalha pelo mundo. Hospitais lotam e fronteiras fecham.', apply: (s, k) => { mod(s, 'health', -4 * k, 120, 'Epidemia'); mod(s, 'growth', -0.6 * k, 120, 'Epidemia'); },
    opts: [['Quarentena e testes em massa.', 'Contém o contágio; custa à economia.', s => { s.econ.treasury -= s.econ.gdp * 0.002; mod(s, 'health', 2, 100, 'Quarentena'); mod(s, 'growth', -0.4, 100, 'Quarentena'); }], ['Proteger só os grupos de risco.', 'Equilíbrio incerto.', s => { mod(s, 'health', 1, 100, 'Proteção focada'); }], ['Manter tudo aberto.', 'Economia preservada; mais mortes.', s => { mod(s, 'health', -2, 100, 'Sem restrições'); }]] },
  boom: { w: 0.8, title: 'Boom econômico global', desc: 'Juros baixos e novas tecnologias aquecem o comércio e o crédito em todo o mundo.', apply: (s, k) => { mod(s, 'growth', 0.9 / k, 200, 'Boom global'); mod(s, 'exportAccess', 0.03, 200, 'Boom global'); }, opts: null },
  disaster: { w: 0.8, title: 'Desastre climático regional', desc: 'Secas, enchentes e tempestades atingem várias regiões do globo e interrompem cadeias de suprimento.', apply: (s, k) => { mod(s, 'qol', -2 * k, 140, 'Desastre climático'); mod(s, 'growth', -0.4 * k, 140, 'Desastre climático'); }, opts: null },
};

export function weeklyShocks(s, data, ctx) {
  if (s.flags.micronation || s.ascent) return;
  const risk = DIFFICULTY[s.nation.difficulty]?.risk ?? 1, W = (s.world.shock ||= { cd: 0 }), d = day(s);
  if (W.cd > d || !chance(0.022 * risk)) return;
  const keys = Object.keys(SHOCKS), tot = keys.reduce((a, k) => a + SHOCKS[k].w, 0);
  let r = random() * tot, kind = keys[0]; for (const k of keys) { r -= SHOCKS[k].w; if (r <= 0) { kind = k; break; } }
  const S = SHOCKS[kind], k = 0.7 + 0.3 * risk; W.cd = d + 70; W.last = kind;
  S.apply(s, k);
  ctx.news(`${S.title}: ${S.desc.split('.')[0]}.`, kind === 'boom' ? 'good' : 'bad');
  if (S.opts && ctx.card) ctx.card({ id: `dyn_shock_${kind}_${d}`, dyn: true, cat: 'Mundo', crisis: false, deadline: 10, title: S.title, desc: S.desc, context: 'Todos os países são atingidos; a sua resposta faz diferença.', default: S.opts.length - 1,
    options: S.opts.map(([text, hint, f], i) => ({ text, hint, act: { type: 'extra', op: 'shock', kind, i } })) });
}
export function shockAct(s, act) {
  const S = SHOCKS[act.kind], o = S?.opts?.[act.i]; if (!o) return '';
  o[2](s); return o[0];
}
