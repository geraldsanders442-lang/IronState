// Impostos e tarifas: tarifas de importação (por país ou por produto), impostos seletivos (cigarro, álcool, açúcar, combustível...),
// impostos sobre classes econômicas (grandes fortunas, empresas, consumo...) e sobre setores (petróleo, bancos, big techs...).
// Cada medida rende receita e tem custos: inflação, crescimento, humor dos grupos, contrabando e retaliação. O lobby dos prejudicados
// cresce até virar uma questão — e, com parlamento autônomo, o Congresso pode derrubar a medida sozinho.
import { clamp, chance, rand, pick } from './util.js';
import { PLY, relAI } from './world.js';
import { electionMode, hasMajority } from './politics.js';

const day = s => Math.floor(s.time.min / 1440);
export const RATES = [0, 10, 25, 50, 100];          // tarifas: alíquota (%) por nível
export const TAXLV = ['Isento', 'Baixa', 'Média', 'Alta', 'Muito alta']; // impostos internos

// Produtos importados (tarifa por produto). share = fração aproximada das importações.
export const PRODUCTS = {
  steel: { name: 'Aço e metais', sector: 'industrial', share: 0.09, who: 'construtoras e indústria', pro: 'siderúrgicas locais' },
  cars: { name: 'Automóveis', sector: 'industrial', share: 0.1, who: 'revendedores e consumidores', pro: 'montadoras locais' },
  electronics: { name: 'Eletrônicos e chips', sector: 'tech', share: 0.14, who: 'indústria e consumidores', pro: 'a indústria de tecnologia' },
  textiles: { name: 'Têxteis e roupas', sector: 'industrial', share: 0.06, who: 'varejo e consumidores pobres', pro: 'confecções locais' },
  food: { name: 'Alimentos importados', sector: 'food', share: 0.1, who: 'consumidores e supermercados', pro: 'agricultores locais' },
  fuel: { name: 'Combustíveis importados', sector: 'energy', share: 0.12, who: 'transportes e indústria', pro: 'a produção energética local' },
  machinery: { name: 'Máquinas e equipamentos', sector: 'industrial', share: 0.12, who: 'fábricas e agronegócio', pro: 'fabricantes locais de máquinas' },
  pharma: { name: 'Medicamentos', sector: 'tech', share: 0.05, who: 'doentes e hospitais', pro: 'laboratórios locais' },
};

// Medidas internas. rev = receita anual em % do PIB no nível 1 (cresce com o nível); mods = efeito por nível; lobby = força do lobby (0-1) e quem o faz.
export const MEASURES = {
  // --- Seletivos ---
  tobacco: { kind: 'excise', name: 'Imposto sobre cigarros', desc: 'Encarece o tabaco: receita e saúde pública, mas o contrabando cresce e a indústria do fumo faz lobby.', rev: 0.14, mods: { health: 0.35, crime: 0.35, g_rural: -0.9, g_business: -0.5 }, smug: 0.5, lobby: 0.55, lobbyWho: 'a indústria do tabaco' },
  alcohol: { kind: 'excise', name: 'Imposto sobre bebidas alcoólicas', desc: 'Receita e menos abuso de álcool; bares, cervejarias e a rotina de lazer protestam.', rev: 0.12, mods: { health: 0.2, crime: 0.2, g_workers: -0.6, g_youth: -0.8, g_business: -0.6 }, smug: 0.35, lobby: 0.5, lobbyWho: 'cervejarias, bares e restaurantes' },
  sugar: { kind: 'excise', name: 'Imposto sobre bebidas açucaradas', desc: 'Combate obesidade e diabetes; a indústria de bebidas e o varejo reclamam.', rev: 0.07, mods: { health: 0.25, g_business: -0.6, g_workers: -0.3, inflation: 0.05 }, lobby: 0.45, lobbyWho: 'a indústria de refrigerantes e o varejo' },
  fuelTax: { kind: 'excise', name: 'Imposto sobre combustíveis', desc: 'Receita alta e menos emissões, mas encarece transportes, alimentos e a vida de todos. Já derrubou governos.', rev: 0.3, mods: { inflation: 0.5, growth: -0.12, g_workers: -1.1, g_rural: -1.6, g_business: -0.8, protest: 0.6, pollution: -0.7 }, lobby: 0.6, lobbyWho: 'transportadoras e petroleiras' },
  luxury: { kind: 'excise', name: 'Imposto sobre bens de luxo', desc: 'Carros caros, joias e iates: receita simbólica, pouco custo político, algum comércio fica fora do país.', rev: 0.05, mods: { g_business: -0.9, g_workers: 0.3, inequality: -0.25 }, lobby: 0.3, lobbyWho: 'lojas de luxo e importadores' },
  gambling: { kind: 'excise', name: 'Imposto sobre jogos de azar', desc: 'Cassinos e apostas on-line pagam mais; parte migra para a ilegalidade.', rev: 0.06, mods: { crime: 0.2, g_business: -0.4 }, smug: 0.4, lobby: 0.35, lobbyWho: 'cassinos e casas de apostas' },
  carbon: { kind: 'excise', name: 'Imposto sobre carbono', desc: 'Taxa as emissões: menos poluição e boa reputação; encarece energia e indústria pesada.', rev: 0.25, mods: { pollution: -1.3, reputation: 0.15, inflation: 0.3, growth: -0.18, g_business: -1.0, g_rural: -0.6 }, lobby: 0.65, lobbyWho: 'a indústria pesada e as petroleiras' },
  // --- Classes econômicas ---
  wealth: { kind: 'class', name: 'Imposto sobre grandes fortunas', desc: 'Taxa o patrimônio dos mais ricos: reduz desigualdade e rende caixa, mas há fuga de capitais e lobby pesado.', rev: 0.22, mods: { inequality: -0.8, g_workers: 1.0, g_youth: 0.6, g_business: -2.6, growth: -0.14, emigration: 0.18 }, lobby: 0.85, lobbyWho: 'os super-ricos e os bancos' },
  incomeRich: { kind: 'class', name: 'Imposto de renda dos mais ricos', desc: 'Alíquotas maiores no topo: arrecada e distribui, mas afasta investidores.', rev: 0.3, mods: { inequality: -0.6, g_workers: 0.8, g_business: -1.8, growth: -0.1 }, lobby: 0.7, lobbyWho: 'empresários e profissionais liberais' },
  corporate: { kind: 'class', name: 'Imposto sobre lucros das empresas', desc: 'Receita grande; desestimula investimento e empregos se for alto demais.', rev: 0.5, mods: { g_business: -2.2, growth: -0.22, unemployment: 0.1, productivity: -0.1 }, lobby: 0.8, lobbyWho: 'as grandes empresas' },
  middle: { kind: 'class', name: 'Imposto de renda da classe média', desc: 'Base larga e arrecadação grande; esmaga a classe média e os assalariados.', rev: 0.55, mods: { g_workers: -2.0, g_youth: -1.0, qol: -0.4, protest: 0.45, growth: -0.08 }, lobby: 0.5, lobbyWho: 'sindicatos e classe média' },
  consumption: { kind: 'class', name: 'Imposto sobre o consumo (IVA/ICMS)', desc: 'Arrecadação fácil, mas regressivo: pesa mais sobre os pobres e eleva preços.', rev: 0.7, mods: { inflation: 0.35, poverty: 0.3, g_workers: -1.4, g_rural: -1.2, qol: -0.3, protest: 0.35 }, lobby: 0.4, lobbyWho: 'o comércio e os consumidores' },
  inherit: { kind: 'class', name: 'Imposto sobre heranças', desc: 'Pouca receita, mas combate a concentração de riqueza entre gerações.', rev: 0.06, mods: { inequality: -0.4, g_business: -0.8, g_workers: 0.4 }, lobby: 0.45, lobbyWho: 'famílias ricas e empresas familiares' },
  // --- Setores ---
  windfall: { kind: 'sector', name: 'Tributo sobre petróleo e mineração', desc: 'Os lucros extraordinários das commodities financiam o Estado; as empresas ameaçam sair e os parceiros estranham.', rev: 0.35, mods: { g_business: -1.4, reputation: -0.1, growth: -0.08 }, lobby: 0.7, lobbyWho: 'mineradoras, petroleiras e investidores estrangeiros' },
  banks: { kind: 'sector', name: 'Imposto sobre bancos e finanças', desc: 'Taxa lucros e transações financeiras; o crédito encarece.', rev: 0.25, mods: { g_business: -1.5, growth: -0.12, inflation: 0.1, g_workers: 0.4 }, lobby: 0.85, lobbyWho: 'os bancos' },
  bigtech: { kind: 'sector', name: 'Imposto sobre big techs', desc: 'Taxa plataformas e serviços digitais; rende e agrada o público, mas atrai retaliação das potências de origem.', rev: 0.12, mods: { g_business: -0.7, g_youth: 0.4, tech: -0.08 }, lobby: 0.7, lobbyWho: 'as plataformas digitais e seus governos' },
  agro: { kind: 'sector', name: 'Imposto sobre exportações agrícolas', desc: 'Retenções ao agronegócio financiam o Estado e seguram o preço dos alimentos; o campo se revolta.', rev: 0.3, mods: { g_rural: -2.0, g_business: -0.8, inflation: -0.15, exportAccess: -0.01, hunger: -0.2 }, lobby: 0.8, lobbyWho: 'o agronegócio e os ruralistas' },
  realestate: { kind: 'sector', name: 'Imposto sobre imóveis e especulação', desc: 'Freia a bolha imobiliária e financia moradia; incorporadoras e proprietários resistem.', rev: 0.15, mods: { housing: 0.4, g_business: -1.0, g_workers: 0.5, inequality: -0.2 }, lobby: 0.65, lobbyWho: 'incorporadoras e proprietários' },
};
export const KINDS = { excise: 'Impostos seletivos', class: 'Classes econômicas', sector: 'Setores da indústria', tariff: 'Tarifas de importação' };

export function ensureTax(s) {
  if (s.tx) return s.tx;
  s.tx = { m: {}, tar: [], retal: {}, mods: {}, rev: 0, log: [], cd: {}, overturned: 0 };
  return s.tx;
}
const note = (s, text, kind = 'info') => { const T = s.tx; T.log.unshift({ day: day(s), text, kind }); if (T.log.length > 40) T.log.length = 40; };
const nameOf = (s, data, id) => data.reg?.[id]?.name || s.world?.ents?.[id]?.name || id;
const levelsOf = def => def.kind === 'tariff' ? RATES : TAXLV;

// Receita e efeitos anuais estimados de uma medida (para a página).
export function measureInfo(s, data, key, level) {
  const def = MEASURES[key]; if (!def || !level) return { rev: 0 };
  return { rev: s.econ.gdp * def.rev * level / 100 };
}
export function tariffRevenue(s, t) {
  const imports = s.sector?.imports ?? s.econ.gdp * 0.2;
  const share = t.country ? 0.12 : (PRODUCTS[t.product]?.share ?? 0.08);
  const rate = RATES[t.level] / 100;
  return imports * share * rate * (1 - rate * 0.45); // a demanda cai quando a tarifa sobe (curva de Laffer das tarifas)
}

// ---------- Simulação semanal ----------
export function weeklyTax(s, data, ctx) {
  if (s.flags.micronation || s.ascent) return;
  const T = ensureTax(s), d = day(s), g = s.econ.gdp;
  const mods = {}; let rev = 0;
  const add = (k, v) => { mods[k] = (mods[k] || 0) + v; };
  // Medidas internas
  for (const key of Object.keys(T.m)) {
    const L = T.m[key], def = MEASURES[key]; if (!L || !def) continue;
    let yr = g * def.rev * L / 100;
    if (def.smug) yr *= 1 - clamp(def.smug * (L - 1) * 0.12 + Math.max(0, L - 2) * 0.07, 0, 0.5) * (1 - s.st.control / 220);
    yr *= 0.6 + s.st.taxCapacity / 250;
    rev += yr / 52;
    for (const k in def.mods) add(k, def.mods[k] * (L === 1 ? 1 : L === 2 ? 1.9 : L === 3 ? 3 : 4.4));
    const press = def.lobby * (0.6 + L * 0.4) * (0.7 + s.groups.business / 140);
    T.lobby ||= {}; T.lobby[key] = clamp((T.lobby[key] || 0) + press * 1.15 - 0.35, 0, 120);
  }
  // Tarifas de importação
  const cleanTar = [];
  for (const t of T.tar) {
    if (!t.level) continue; cleanTar.push(t);
    const rate = RATES[t.level];
    rev += tariffRevenue(s, t) / 52;
    // Efeitos: protege a indústria local, mas encarece o que se compra.
    const share = t.country ? 0.4 : (PRODUCTS[t.product]?.share ?? 0.08) * 3;
    add('inflation', rate * 0.008 * share * 2.2);
    add('g_workers', -rate * 0.009 * share * 2);
    add('g_business', (t.country ? -rate * 0.004 : rate * 0.002 - rate * 0.004 * 0.6) * 2);
    add('growth', -rate * 0.0016 * share * 2);
    if (t.product && PRODUCTS[t.product]) { const sec = PRODUCTS[t.product].sector; add('s_' + sec, rate * 0.06 * share * 2.5); if (sec === 'food') add('g_rural', rate * 0.012); }
    if (t.country) { add('importAccess', -rate * 0.0009); add('industry', rate * 0.004); }
    t.lobby = clamp((t.lobby || 0) + (0.2 + rate / 38) * (0.7 + s.groups.business / 140) - 0.3, 0, 120);
    // Retaliação: o país taxado responde com tarifas ao que você exporta.
    if (t.country && !T.retal[t.country] && chance(0.012 + rate / 5000) && s.world.c[t.country]) {
      T.retal[t.country] = { lvl: t.level, since: d }; const nm = nameOf(s, data, t.country);
      if (s.partners[t.country]) s.partners[t.country].rel = clamp(s.partners[t.country].rel - 6 - rate * 0.08, -100, 100);
      note(s, `${nm} retalia com tarifas sobre os produtos de ${s.nation.shortName}.`, 'bad');
      ctx.news(`${nm} responde às tarifas de ${s.nation.shortName} com tarifas próprias sobre suas exportações.`, 'bad');
      ctx.notify?.('Guerra comercial', `${nm} retaliou suas tarifas. Exportações em queda.`);
    }
  }
  T.tar = cleanTar;
  // Retaliações em curso derrubam exportações; terminam semanas depois do fim da tarifa.
  for (const id of Object.keys(T.retal)) {
    const r = T.retal[id], still = T.tar.some(t => t.country === id && t.level);
    if (!still && d - (r.end ||= d) > 84) { delete T.retal[id]; note(s, `${nameOf(s, data, id)} retira as tarifas retaliatórias.`, 'good'); continue; }
    if (still) delete r.end;
    add('exportAccess', -0.02 * r.lvl); add('growth', -0.05 * r.lvl); add('g_business', -0.4 * r.lvl);
  }
  // Tarifas que outros países impõem a você (mundo vivo).
  for (const id of Object.keys(T.incoming || {})) { const i = T.incoming[id]; if (d > i.until) { delete T.incoming[id]; continue; } add('exportAccess', -0.012 * i.lvl); add('growth', -0.04 * i.lvl); }
  T.mods = mods; T.rev = rev * 52;
  s.econ.treasury += rev;

  // ---- Lobby, parlamento e questões ----
  const entries = [...Object.keys(T.m).filter(k => T.m[k]).map(k => ({ key: k, kind: 'm', name: MEASURES[k].name, who: MEASURES[k].lobbyWho, val: T.lobby?.[k] || 0 })),
    ...T.tar.map((t, i) => ({ key: i, kind: 't', t, name: tariffName(s, data, t), who: t.country ? 'importadores e varejistas' : PRODUCTS[t.product]?.who, val: t.lobby || 0 }))];
  const democracy = electionMode(s) === 'multiparty' && s.pol;
  for (const e of entries) {
    // O Congresso derruba por conta própria quando o governo não tem maioria e o lobby pressiona.
    if (democracy && !hasMajority(s) && e.val > 55 && chance((e.val - 50) / 1600)) { cancel(s, data, e, ctx, 'congress'); continue; }
    if (e.val >= 80 && d - (T.cd['lobby' + e.name] || -999) > 60 && !s.issues.pending.some(p => p.id.startsWith('tax_lobby_'))) {
      T.cd['lobby' + e.name] = d; ctx.card(lobbyCard(s, e)); if (e.kind === 'm') T.lobby[e.key] = 55; else e.t.lobby = 55;
    }
  }
}
function cancel(s, data, e, ctx, who) {
  const T = s.tx;
  if (e.kind === 'm') { T.m[e.key] = 0; T.lobby[e.key] = 0; } else { e.t.level = 0; }
  T.overturned++;
  const msg = who === 'congress' ? `O Congresso derrubou: ${e.name}.` : `${e.name} foi revogado.`;
  note(s, msg, 'bad'); ctx.news(who === 'congress' ? `Congresso derruba ${e.name.toLowerCase()} após pressão de ${e.who || 'setores afetados'}.` : msg, 'bad');
  s.st.legitimacy = clamp(s.st.legitimacy - (who === 'congress' ? 0.8 : 0.2), 0, 100);
}
export function tariffName(s, data, t) {
  return t.country ? `Tarifa sobre produtos de ${nameOf(s, data, t.country)} (${RATES[t.level]}%)` : `Tarifa sobre ${PRODUCTS[t.product]?.name.toLowerCase()} (${RATES[t.level]}%)`;
}
function lobbyCard(s, e) {
  const id = e.kind === 'm' ? e.key : 'tar' + e.key;
  return {
    id: 'tax_lobby_' + id + '_' + Math.floor(Math.random() * 1e6), dyn: true, cat: 'Economia', title: `Lobby contra: ${e.name}`,
    desc: `${e.who ? e.who.charAt(0).toUpperCase() + e.who.slice(1) : 'Empresários'} fazem pressão aberta nos corredores do governo e na imprensa para derrubar a medida. Ameaçam cortar investimentos e financiar a oposição.`,
    context: `Lobby: ${Math.round(e.val)}/100. Resistir mantém a receita, mas o custo político sobe.`, deadline: 14, default: 1,
    options: [
      { text: 'Resistir e manter a medida.', hint: 'Mantém a receita; empresários e investidores ficam furiosos.', groups: { business: -4 }, now: { legitimacy: 0.4 }, act: { type: 'extra', op: 'taxLobby', id: String(id), choice: 'resist' } },
      { text: 'Negociar: reduzir um nível.', hint: 'Um meio-termo: perde parte da receita e acalma o lobby.', groups: { business: 2 }, act: { type: 'extra', op: 'taxLobby', id: String(id), choice: 'compromise' } },
      { text: 'Ceder e revogar a medida.', hint: 'Perde toda a receita; o setor comemora e a imagem de firmeza cai.', groups: { business: 5 }, now: { legitimacy: -0.6 }, act: { type: 'extra', op: 'taxLobby', id: String(id), choice: 'revoke' } },
      { text: 'Comprar o silêncio com isenções a aliados.', hint: 'Isenções seletivas: o lobby se acalma, mas a corrupção e a desigualdade sobem.', now: { corruption: 2.5, inequality: 1 }, groups: { business: 3 }, act: { type: 'extra', op: 'taxLobby', id: String(id), choice: 'bribe' } },
    ],
  };
}

// ---------- Ações ----------
export function taxAct(s, data, op, arg) {
  const T = ensureTax(s), d = day(s);
  switch (op) {
    case 'set': { const [k, lv] = String(arg).split('|'), def = MEASURES[k]; if (!def) return { ok: false, msg: 'Medida desconhecida.' };
      const L = clamp(+lv, 0, 4), was = T.m[k] || 0; if (L === was) return { ok: false, msg: 'Já está nesse nível.' };
      if (d - (T.cd['set' + k] || -999) < 14) return { ok: false, msg: 'Aguarde duas semanas para mexer de novo nesta medida.' };
      T.cd['set' + k] = d; T.m[k] = L; if (!T.lobby) T.lobby = {};
      if (!L) T.lobby[k] = 0;
      const msg = L ? `${def.name}: ${TAXLV[L]}.` : `${def.name} extinto.`; note(s, msg, 'info'); return { ok: true, msg, log: true };
    }
    case 'tariff': { const [kind, id, lv] = String(arg).split('|'), L = clamp(+lv, 0, 4);
      const t = T.tar.find(x => (kind === 'c' ? x.country === id : x.product === id));
      if (t) { if (L === t.level) return { ok: false, msg: 'Já está nesse nível.' }; t.level = L; if (!L) T.tar = T.tar.filter(x => x !== t); }
      else if (L) { if (kind === 'p' && !PRODUCTS[id]) return { ok: false, msg: 'Produto desconhecido.' }; if (kind === 'c' && !s.world.c[id]) return { ok: false, msg: 'País desconhecido.' }; T.tar.push(kind === 'c' ? { country: id, level: L, lobby: 0 } : { product: id, level: L, lobby: 0 }); }
      else return { ok: false, msg: 'Nada a remover.' };
      if (kind === 'c' && s.partners[id]) s.partners[id].rel = clamp(s.partners[id].rel - (L ? 3 + RATES[L] * 0.1 : -3), -100, 100);
      const lab = kind === 'c' ? 'produtos de ' + nameOf(s, data, id) : PRODUCTS[id]?.name.toLowerCase();
      const msg = L ? `Tarifa de ${RATES[L]}% sobre ${lab}.` : `Tarifa sobre ${lab} extinta.`; note(s, msg, 'info'); return { ok: true, msg, log: true };
    }
  }
  return { ok: false, msg: 'Ação desconhecida.' };
}
// Resposta às questões de lobby: act = { type:'extra', op:'taxLobby', id, choice }.
export function taxLobbyAct(s, data, act, ctx) {
  const T = ensureTax(s), id = act.id;
  const target = id.startsWith('tar') ? { kind: 't', t: T.tar[+id.slice(3)] } : { kind: 'm', key: id };
  if (target.kind === 't' && !target.t) return '';
  const name = target.kind === 'm' ? MEASURES[target.key]?.name : tariffName(s, data, target.t);
  if (!name) return '';
  const lvl = target.kind === 'm' ? () => T.m[target.key] : () => target.t.level;
  const set = v => { if (target.kind === 'm') { T.m[target.key] = v; T.lobby[target.key] = 0; } else target.t.level = v; };
  switch (act.choice) {
    case 'resist': if (target.kind === 'm') T.lobby[target.key] = 25; else target.t.lobby = 25; return `O governo mantém ${name}.`;
    case 'compromise': set(Math.max(0, lvl() - 1)); return `${name} é reduzido um nível após negociação com o setor.`;
    case 'revoke': set(0); T.overturned++; return `${name} é revogado.`;
    case 'bribe': if (target.kind === 'm') T.lobby[target.key] = 10; else target.t.lobby = 10; s.st.corruption = clamp(s.st.corruption + 1.5, 0, 100); return `Isenções seletivas acalmam o lobby contra ${name}.`;
  }
  return '';
}

// ---------- Mundo: guerras comerciais entre as IAs (modo observador e jogo normal) ----------
export function weeklyWorldTrade(s, data, ctx) {
  const W = s.world; if (!W?.c) return;
  const d = day(s); if (!s.spectator && d % 14 !== 0) return;
  const k = s.spectator ? 0.3 : 0.06;
  if (!chance(k)) return;
  const ids = Object.keys(W.c).filter(id => !W.c[id].dep && id !== PLY && W.c[id].gdp > 80);
  if (ids.length < 2) return;
  const a = pick(ids), cands = ids.filter(b => b !== a && relAI(s, data, a, b) < 10);
  const b = cands.length ? pick(cands) : pick(ids.filter(x => x !== a)); if (!b) return;
  const rate = pick([10, 15, 25, 25, 40, 60]), nm = id => nameOf(s, data, id);
  W.tradeWar ||= {}; const key = a + '>' + b; if (W.tradeWar[key] && d - W.tradeWar[key] < 150) return; W.tradeWar[key] = d;
  W.c[a].gdp *= 1 + 0.0003; W.c[b].gdp *= 1 - rate / 100 * 0.004;
  const reason = pick([`para proteger a indústria nacional`, `acusando concorrência desleal`, `em retaliação política`, `para pressionar por concessões comerciais`]);
  ctx.news?.(`${nm(a)} impõe tarifas de ${rate}% sobre produtos de ${nm(b)} ${reason}.`, 'warn');
  if (chance(0.6)) ctx.news?.(`${nm(b)} promete retaliar as tarifas de ${nm(a)}.`, 'warn');
  if (!s.spectator && s.partners[a] && chance(0.25)) {
    const T = ensureTax(s); (T.incoming ||= {})[a] = { lvl: rate >= 40 ? 3 : rate >= 25 ? 2 : 1, until: d + 180 };
    ctx.news?.(`${nm(a)} inclui as exportações de ${s.nation.shortName} na lista de tarifas.`, 'bad');
  }
}
