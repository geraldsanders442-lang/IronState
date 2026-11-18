import { clamp } from './util.js';
import { debtRatio, interestRate } from './model.js';

// Conselheiros: alertas com antecedência e caminhos sugeridos (cada ação aponta uma página ou um programa).
export function advisorAlerts(s) {
  const A = [], st = s.st, g = s.econ.gdp, bal = s.d?.budget?.balance ?? 0;
  const add = (lvl, who, title, text, actions = []) => A.push({ lvl, who, title, text, actions });
  const weeklyDef = -bal / 52;
  if (weeklyDef > 0 && s.econ.treasury > 0) {
    const weeks = s.econ.treasury / weeklyDef;
    if (weeks < 26) add(weeks < 8 ? 3 : 2, 'Fazenda', `O caixa acaba em ~${Math.max(1, Math.round(weeks))} semanas`, `O déficit anual é de ${(-bal / g * 100).toFixed(1)}% do PIB. Depois disso o governo passa a se endividar ou a emitir moeda.`,
      [{ label: 'Ajustar orçamento', go: 'budget' }, { label: 'Austeridade fiscal', program: 'austerity' }, { label: 'Reforma tributária', program: 'taxreform' }]);
  }
  const limit = (0.6 + st.reputation / 100 * 0.6 + (s.d?.mods?.creditLimit || 0)) * 100, dr = debtRatio(s);
  if (dr > limit * 0.8) add(dr > limit ? 3 : 2, 'Fazenda', `Dívida em ${dr.toFixed(0)}% do PIB (limite de crédito ~${limit.toFixed(0)}%)`, `Juros de ${interestRate(s).toFixed(1)}% ao ano. Acima do limite, os credores param de financiar e o calote fica perto.`,
    [{ label: 'Ver orçamento', go: 'budget' }, { label: 'Pedir ao FMI', go: 'budget' }]);
  if (st.inflation > 12) add(st.inflation > 30 ? 3 : 2, 'Banco central', `Inflação de ${st.inflation.toFixed(0)}% ao ano`, 'Emissão de moeda, déficit e escassez alimentam os preços. Os mais pobres perdem primeiro.',
    [{ label: 'Cortar gastos', go: 'budget' }, { label: 'Austeridade', program: 'austerity' }]);
  if ((s.d?.foodShort || 0) > 0.01) add(3, 'Agricultura', 'Falta comida', `Escassez de ${(s.d.foodShort * 100).toFixed(1)}% do consumo. Fome gera revolta em semanas.`, [{ label: 'Revolução verde', program: 'green' }, { label: 'Comércio exterior', go: 'diplomacy' }]);
  if ((s.d?.energyShort || 0) > 0.01) add(2, 'Energia', 'Apagões', `Faltam ${(s.d.energyShort * 100).toFixed(1)}% da energia consumida.`, [{ label: 'Iniciativas de energia', go: 'initiatives' }]);
  if (st.growth < -1) add(2, 'Fazenda', `Recessão: ${st.growth.toFixed(1)}% ao ano`, 'Desemprego e arrecadação pioram. Programas de estímulo aceleram a retomada, com custo.', [{ label: 'Programas econômicos', go: 'economy' }]);
  if (st.coupRisk > 45) add(st.coupRisk > 65 ? 3 : 2, 'Inteligência', `Risco de golpe: ${st.coupRisk.toFixed(0)}`, 'Militares e elites estão insatisfeitos. Mais verba militar, promoções ou expurgos podem conter.', [{ label: 'Gabinete', go: 'society' }, { label: 'Forças armadas', go: 'military' }]);
  if (st.revoRisk > 45) add(st.revoRisk > 65 ? 3 : 2, 'Segurança', `Risco de revolução: ${st.revoRisk.toFixed(0)}`, 'Fome, pobreza e repressão acumulam ressentimento.', [{ label: 'Assistência social', go: 'budget' }]);
  const hot = (s.regions || []).filter(r => r.unrest > 70);
  if (hot.length) add(2, 'Interior', `Tensão alta em ${hot.map(r => r.name).slice(0, 3).join(', ')}`, 'Regiões insatisfeitas podem se rebelar, sobretudo se outro país as reivindica.', [{ label: 'Desenvolvimento urbano', go: 'urban' }]);
  const under = Object.entries(s.d?.under || {}).filter(([, v]) => v > 0.2).map(([k]) => k);
  if (under.length) add(2, 'Serviços públicos', 'Serviços abaixo do mínimo', `Sucateamento em: ${under.join(', ')}. Greves e crises vão aparecer.`, [{ label: 'Orçamento', go: 'budget' }]);
  if (s.wars.some(w => w.active && w.score < -40)) add(3, 'Estado-Maior', 'A guerra vai mal', 'O inimigo avança. Reforços, aliados ou um cessar-fogo podem evitar o desastre.', [{ label: 'Forças armadas', go: 'military' }]);
  if (s.flags?.needCapital) add(3, 'Governo', 'Sem capital', 'Escolha a nova sede do governo no mapa.', []);
  return A.sort((a, b) => b.lvl - a.lvl);
}

// Recomendação simples para decidir questões menores automaticamente: a opção com melhor saldo de apoio.
export function advisorPick(iss) {
  if (iss.default != null) return iss.default;
  let best = 0, bestV = -1e9;
  iss.options.forEach((o, i) => {
    let v = 0;
    for (const g in o.groups || {}) v += o.groups[g];
    for (const k in o.now || {}) v += ({ legitimacy: 1.5, stability: 1.5, treasury: 2, protest: -1, reputation: 0.5, corruption: -0.5, gdp: 4, growth: 3, inflation: -1 }[k] || 0) * o.now[k];
    for (const r in o.rel || {}) v += o.rel[r] * 0.1;
    if (o.act?.type && ['declareWar', 'nukeProgram', 'covert'].includes(o.act.type)) v -= 5;
    if (v > bestV) { bestV = v; best = i; }
  });
  return best;
}

// Pesquisa semanal: aprovação geral, por grupo e por região.
export function weeklyPoll(s) {
  const p = { day: Math.floor(s.time.min / 1440), approval: clamp(Math.round(s.d?.support ?? 50), 0, 100), groups: { ...s.groups }, regions: {} };
  for (const r of s.regions) p.regions[r.id] = clamp(Math.round(100 - r.unrest * 0.8 - (r.sep || 0) * 10), 0, 100);
  (s.polls ||= []).push(p);
  if (s.polls.length > 156) s.polls.splice(0, s.polls.length - 156);
  return p;
}
