// Autonomia dos ministros: quanto mais poder você delega (mandatos, chefe de gabinete), mais cada ministro age por conta própria.
// Conforme a lealdade, a ambição, a facção e a distância ideológica em relação a você, ele pode mudar a sua agenda, desviar verba,
// conspirar contra você ou até derrubá-lo. Cada caso vira uma questão com saídas diferentes.
import { clamp, chance, rand, pick } from './util.js';
import { PORTFOLIOS, makeMinister, candidates } from './politics.js';
import { endGame } from './regime.js';
import { ensureOrd } from './order.js';
import { ensureRights } from './rights.js';

const day = s => Math.floor(s.time.min / 1440);
const grp = (s, g, v) => { s.groups[g] = clamp((s.groups[g] ?? 50) + v, 0, 100); };

// Posição típica de cada facção nos eixos ideológicos do jogo (-100 a 100).
const FAC_AXES = { hard: { auth: 70, nation: 40 }, reform: { auth: -50, econ: -10 }, military: { mil: 70, nation: 55, auth: 40 }, tech: {}, oligarchs: { econ: 70, redist: -40 }, clergy: { trad: 70, relig: 60 } };
export const SIDE = { hard: 'right', military: 'right', oligarchs: 'right', clergy: 'right', reform: 'left', tech: 'tech' };

// Distância ideológica entre o ministro e o governante (0 a 1).
export function ideoDistance(s, m) {
  const ax = s.nation.ideology?.axes || {}, t = FAC_AXES[m.faction] || {}, keys = Object.keys(t);
  if (!keys.length) return 0.3;
  return clamp(keys.reduce((a, k) => a + Math.abs((ax[k] || 0) - t[k]), 0) / (keys.length * 200), 0, 1);
}
// Autonomia efetiva (0 a 1): mandato ativo e nível de delegação do chefe de gabinete.
export function autonomyOf(s, k) {
  const P = s.pol, on = P.mandates?.[k] && P.mandates[k] !== 'off';
  const ch = s.chief?.on ? ({ off: 0, minor: 0.08, most: 0.2, all: 0.35 })[s.chief.level] || 0 : 0;
  return clamp((on ? 0.55 : 0.12) + ch - (P.hold?.[k] > day(s) ? 0.1 : 0), 0, 1);
}
// Risco semanal de o ministro agir contra você (0 a 1).
export function minRisk(s, k) {
  const m = s.pol.cabinet[k]; if (!m) return 0;
  const amb = (m.amb ?? 20) / 100, loy = m.loyalty / 100, dist = ideoDistance(s, m), aut = autonomyOf(s, k);
  return clamp(aut * (0.15 + amb * 0.45 + (1 - loy) * 0.45 + dist * 0.35 + (m.trait === 'ambicioso' ? 0.12 : 0) - (m.trait === 'leal' ? 0.18 : 0)), 0, 1);
}

// ---------- Agendas: o que cada ministro faz sozinho (como mudanças reversíveis) ----------
// d: { tax, spend:{k:v}, pol:{k:[de,para]}, groups:{g:v}, police, abuse, ideo:{eixo:v}, rel:{partner:v} }
const AG = {
  finance: {
    right: ['cortou a assistência social e baixou impostos dos mais ricos', { tax: -2, spend: { welfare: -0.7 }, groups: { business: 5, workers: -5 }, ideo: { econ: 6 } }],
    left: ['subiu os impostos dos mais ricos e ampliou o gasto social', { tax: 2, spend: { welfare: 0.7 }, groups: { business: -6, workers: 5 }, ideo: { econ: -6 } }],
    tech: ['decretou um ajuste fiscal duro, cortando custeio e defesa', { tax: 1.5, spend: { admin: -0.5, military: -0.4 }, groups: { bureaucracy: -4, military: -3 } }],
  },
  defense: {
    right: ['ordenou rearmamento e mobilização sem consultar o governo', { spend: { military: 0.9 }, groups: { military: 6 }, ideo: { mil: 6 } }],
    left: ['cortou o orçamento militar e aceitou inspeções estrangeiras', { spend: { military: -0.8 }, groups: { military: -6 }, ideo: { mil: -6 } }],
    tech: ['redirecionou a verba para modernização e deixou quartéis sem manutenção', { spend: { military: 0.2, infra: -0.3 }, groups: { military: -2 } }],
  },
  interior: {
    right: ['deu carta branca à polícia para endurecer nas ruas', { police: 14, abuse: 4, groups: { military: 3, youth: -4, opposition: -3 }, ideo: { auth: 6 } }],
    left: ['abriu a polícia ao controle civil e libertou presos políticos', { police: -10, abuse: -3, groups: { youth: 4, military: -3 }, ideo: { auth: -6 } }],
    tech: ['reorganizou a segurança com câmeras e bases de dados em todo o país', { police: 6, abuse: 1.5, groups: { youth: -2 } }],
  },
  health: {
    right: ['abriu a gestão dos hospitais a empresas privadas', { spend: { health: -0.6 }, groups: { business: 4, workers: -4 } }],
    left: ['expandiu a rede pública e contratou milhares de profissionais', { spend: { health: 0.8 }, groups: { workers: 4, business: -2 } }],
    tech: ['implantou protocolos de eficiência e cortou leitos de baixa demanda', { spend: { health: -0.3 }, groups: { rural: -3 } }],
  },
  education: {
    right: ['impôs um currículo tradicionalista e cortou áreas de humanas', { spend: { education: -0.3 }, groups: { youth: -6, rural: 3 }, ideo: { trad: 6 } }],
    left: ['expandiu a educação pública e ampliou as bolsas', { spend: { education: 0.7 }, groups: { youth: 5, business: -2 }, ideo: { trad: -4 } }],
    tech: ['focou o ensino técnico e cortou cursos sem demanda de mercado', { spend: { education: 0.2 }, groups: { youth: -2, business: 3 } }],
  },
  foreign: {
    right: ['rompeu com uma potência vizinha em um discurso nacionalista', { rel: { _rival: -20 }, groups: { military: 3 }, ideo: { nation: 6 } }],
    left: ['aproximou o país de uma potência rival por conta própria, fechando acordos secretos', { rel: { _rival: 18 }, groups: { military: -3 } }],
    tech: ['trocou aliados por parceiros comerciais mais lucrativos', { rel: { _ally: -8, _rival: 8 }, groups: { business: 3 } }],
  },
  justice: {
    right: ['mandou prender opositores e blindou aliados do governo', { abuse: 5, groups: { opposition: -6, bureaucracy: 3 }, ideo: { auth: 6 } }],
    left: ['abriu inquéritos contra aliados e ampliou as garantias de defesa', { abuse: -3, groups: { opposition: 3, bureaucracy: -4 } }],
    tech: ['reformou o sistema judiciário e demitiu juízes sem consulta', { groups: { bureaucracy: -5 } }],
  },
  economy: {
    right: ['privatizou empresas e liberou setores sem licitação', { groups: { business: 6, workers: -5 }, spend: { admin: -0.2 }, ideo: { econ: 6 } }],
    left: ['estatizou setores estratégicos e congelou preços', { groups: { business: -6, workers: 4 }, ideo: { econ: -6 } }],
    tech: ['lançou um plano industrial com subsídios a empresas amigas', { groups: { business: 3 }, spend: { infra: 0.3 } }],
  },
};

function partnerOf(s, kind) {
  const ids = Object.keys(s.partners).filter(id => s.world?.c?.[id]);
  const sorted = ids.sort((a, b) => s.world.c[b].gdp - s.world.c[a].gdp).slice(0, 12);
  return kind === '_rival' ? [...sorted].sort((a, b) => s.partners[a].rel - s.partners[b].rel)[0] || sorted[0] : [...sorted].sort((a, b) => s.partners[b].rel - s.partners[a].rel)[0] || sorted[0];
}
// Aplica (sign=1) ou desfaz (sign=-1) uma mudança. A de relações usa países resolvidos no momento da criação.
function applyDelta(s, d, sign = 1, data) {
  if (d.tax) s.budget.tax = clamp(s.budget.tax + d.tax * sign, 5, 60);
  for (const k in d.spend || {}) s.budget.spend[k] = clamp((s.budget.spend[k] ?? 2) + d.spend[k] * sign, 0.2, 15);
  for (const g in d.groups || {}) grp(s, g, d.groups[g] * sign);
  if (d.police) ensureOrd(s).police = clamp(ensureOrd(s).police + d.police * sign, 0, 100);
  if (d.abuse) { const R = ensureRights(s, data || { policies: [] }); R.abuse = clamp(R.abuse + d.abuse * sign, 0, 100); }
  for (const k in d.ideo || {}) { const ax = (s.nation.ideology ||= { axes: {} }).axes ||= {}; ax[k] = clamp((ax[k] || 0) + d.ideo[k] * sign, -100, 100); }
  for (const id in d.relR || {}) if (s.partners[id]) s.partners[id].rel = clamp(s.partners[id].rel + d.relR[id] * sign, -100, 100);
}
const label = (s, k) => PORTFOLIOS[k]?.name || k;

// ---------- Simulação semanal ----------
export function weeklyMinisters(s, data, ctx) {
  if (s.flags.micronation || s.ascent || s.spectator || !s.pol?.cabinet) return;
  const P = s.pol, d = day(s); P.cd ||= {};
  // Ambição: cresce com autonomia, tempo no cargo e governante fraco; cai com lealdade, medo e poder do governante.
  for (const k in P.cabinet) {
    const m = P.cabinet[k]; m.amb ??= Math.round(rand(10, 40));
    const aut = autonomyOf(s, k), weak = (55 - (s.d?.support ?? 50)) / 100;
    m.amb = clamp(m.amb + aut * 0.38 + weak * 0.5 + (m.trait === 'ambicioso' ? 0.25 : 0) - (m.trait === 'leal' ? 0.28 : 0) - (m.loyalty > 70 ? 0.12 : 0) - (aut < 0.2 ? 0.2 : 0) - (s.st.coupRisk < 15 ? 0.05 : 0), 0, 100);
    m.loyalty = clamp(m.loyalty + (aut < 0.25 ? 0.05 : -aut * 0.04) + (m.faction && (P.factions.find(f => f.id === m.faction)?.sat ?? 50) < 35 ? -0.12 : 0), 0, 100);
  }
  // Conspiração em curso.
  if (P.plot) plotStep(s, data, ctx);
  else for (const k of Object.keys(P.cabinet)) {
    const m = P.cabinet[k], r = minRisk(s, k);
    if (m.amb > 62 && (m.loyalty < 55 || m.amb > 85) && autonomyOf(s, k) > 0.4 && (s.st.coupRisk > 20 || (s.d?.support ?? 50) < 55) && (P.cd.plot ?? -999) + 200 < d && chance(0.0035 + r * 0.01)) { startPlot(s, ctx, k); return; }
  }
  // Ação por conta própria (mudança de agenda ou desvio).
  if (P.cd.agenda === undefined) P.cd.agenda = d - 40;
  if (d - P.cd.agenda < 21 || s.issues.pending.some(p => String(p.id).startsWith('mins_'))) return;
  const ks = Object.keys(P.cabinet).map(k => [k, minRisk(s, k)]).filter(x => x[1] > 0.28);
  if (!ks.length) return;
  const [k, r] = ks.sort((a, b) => b[1] - a[1])[0];
  if (!chance(clamp((r - 0.2) * 0.09, 0, 0.1))) return;
  P.cd.agenda = d; const m = P.cabinet[k];
  if (m.corrupt > 60 && chance(0.4)) return scandal(s, data, ctx, k);
  return agenda(s, data, ctx, k);
}

function agenda(s, data, ctx, k) {
  const P = s.pol, m = P.cabinet[k], side = SIDE[m.faction] || 'tech', row = AG[k]?.[side]; if (!row) return;
  const dist = ideoDistance(s, m);
  let delta = structuredClone(row[1]);
  if (delta.rel) { delta.relR = {}; for (const key in delta.rel) { const id = partnerOf(s, key === '_ally' ? '_ally' : '_rival'); if (id) delta.relR[id] = (delta.relR[id] || 0) + delta.rel[key]; } delete delta.rel; }
  applyDelta(s, delta, 1, data);
  const fav = dist < 0.35;
  const id = 'mins_agenda_' + k + '_' + day(s);
  P.pending = { ...(P.pending || {}), [id]: { k, delta } };
  ctx.card({ id, dyn: true, cat: 'Gabinete', title: `${m.name} age por conta própria`,
    desc: `${m.name}, ministro de ${label(s, k)} (${m.trait}), ${row[0]}, sem consultar você. Com o mandato e a delegação que recebeu, ${fav ? 'ele acredita estar fazendo o que você faria' : 'ele agiu contra as ideias que você defende'}.`,
    context: `Lealdade ${Math.round(m.loyalty)} · ambição ${Math.round(m.amb)} · distância ideológica ${Math.round(dist * 100)}% · autonomia ${Math.round(autonomyOf(s, k) * 100)}%.`, deadline: 10, default: 0,
    options: [
      { text: 'Deixar passar: o ministro tem a minha confiança.', hint: 'A medida fica. Ele ganha confiança e ambição; a sua agenda se desloca na direção dele.', act: { type: 'extra', op: 'minsAct', id, choice: 'accept' } },
      { text: 'Desfazer a medida e repreendê-lo em público.', hint: 'Anula a mudança. A lealdade dele cai, a ambição sobe e o mandato é cassado.', now: { legitimacy: 0.4 }, act: { type: 'extra', op: 'minsAct', id, choice: 'revert' } },
      { text: 'Demitir o ministro.', hint: 'Anula a medida e troca o ministro. A facção dele fica furiosa.', now: { stability: -0.6 }, act: { type: 'extra', op: 'minsAct', id, choice: 'fire' } },
      { text: 'Negociar: manter a medida, mas limitar o mandato.', hint: 'Meio-termo: a medida fica, o mandato dele fica reduzido a "só aconselhar".', act: { type: 'extra', op: 'minsAct', id, choice: 'limit' } },
    ] });
  note(s, `${m.name} (${label(s, k)}) ${row[0]}.`);
}
function scandal(s, data, ctx, k) {
  const P = s.pol, m = P.cabinet[k], lost = s.econ.gdp * rand(0.0006, 0.002);
  const id = 'mins_scandal_' + k + '_' + day(s);
  P.pending = { ...(P.pending || {}), [id]: { k, lost } };
  s.econ.treasury -= lost * 0.5; s.st.corruption = clamp(s.st.corruption + 2, 0, 100);
  ctx.card({ id, dyn: true, cat: 'Gabinete', title: `Escândalo: ${m.name} e o dinheiro público`,
    desc: `Reportagens mostram que ${m.name}, ministro de ${label(s, k)}, desviou cerca de ${lost.toFixed(2)} bi em contratos sem licitação — e que ele agiu sozinho porque você lhe deu liberdade demais.`, context: `Corrupção do ministro ${Math.round(m.corrupt)} · lealdade ${Math.round(m.loyalty)}.`, deadline: 10, default: 1,
    options: [
      { text: 'Demitir e abrir investigação.', hint: 'Custa a confiança da facção dele, mas limpa a imagem.', now: { reputation: 1, legitimacy: 1 }, act: { type: 'extra', op: 'minsAct', id, choice: 'fire' } },
      { text: 'Abafar o caso.', hint: 'O ministro fica; a corrupção sobe e ele fica mais confiante.', now: { legitimacy: -1.5 }, act: { type: 'extra', op: 'minsAct', id, choice: 'cover' } },
      { text: 'Exigir a devolução do dinheiro e rebaixar o mandato.', hint: 'Recupera metade, mas a lealdade dele cai.', now: { treasury: 0.3 }, act: { type: 'extra', op: 'minsAct', id, choice: 'limit' } },
    ] });
  note(s, `Escândalo de ${m.name} (${label(s, k)}): desvio de ${lost.toFixed(2)} bi.`);
}

// ---------- Conspiração ----------
function startPlot(s, ctx, k) {
  const P = s.pol, m = P.cabinet[k]; P.cd.plot = day(s);
  P.plot = { k, who: m.name, prog: 12, warned: false, day: day(s) };
  note(s, `${m.name} (${label(s, k)}) começa a articular a sua queda.`);
}
function plotStep(s, data, ctx) {
  const P = s.pol, pl = P.plot, m = P.cabinet[pl.k];
  if (!m || m.name !== pl.who) { P.plot = null; return; }
  const aut = autonomyOf(s, pl.k), guard = s.st.intel / 300 + (s.groups.military - 40) / 400;
  pl.prog = clamp(pl.prog + 1.2 + aut * 2 + (m.amb - 60) * 0.03 + (s.st.coupRisk - 30) * 0.02 - guard * 2, 0, 130);
  s.st.coupRisk = clamp(s.st.coupRisk + 0.05, 0, 100);
  if (pl.prog >= 40 && !pl.warned) {
    pl.warned = true; const id = 'mins_plot_' + day(s);
    ctx.card({ id, dyn: true, cat: 'Gabinete', title: `Conspiração no gabinete: ${pl.who}`,
      desc: `Seus serviços de inteligência trazem uma gravação: ${pl.who}, ministro de ${label(s, pl.k)}, costura com generais, empresários e a oposição um plano para afastar você. Ele usa a autonomia que recebeu para montar a rede sem que ninguém olhe.`, context: `Progresso da conspiração: ${Math.round(pl.prog)}% · lealdade ${Math.round(m.loyalty)} · ambição ${Math.round(m.amb)}.`, deadline: 7, default: 2,
      options: [
        { text: 'Prender o ministro e os envolvidos.', hint: 'Pode desmontar tudo; se falhar, os militares veem um governo paranoico.', now: { civil: -2 }, act: { type: 'extra', op: 'minsAct', id, choice: 'arrest' } },
        { text: 'Comprar a lealdade dele com cargos e verbas.', hint: 'Custa dinheiro e corrupção; ele recua por ora.', now: { treasury: -0.5, corruption: 1.5 }, act: { type: 'extra', op: 'minsAct', id, choice: 'buy' } },
        { text: 'Ignorar: provavelmente é blefe.', hint: 'A conspiração continua e pode derrubar o governo.', act: { type: 'extra', op: 'minsAct', id, choice: 'ignore' } },
        { text: 'Cassar a autonomia de todos os ministros.', hint: 'Retoma o controle: todos os mandatos viram "só aconselhar", mas a engrenagem do governo desacelera.', now: { efficiency: -2 }, act: { type: 'extra', op: 'minsAct', id, choice: 'purge' } },
      ] });
  }
  if (pl.prog >= 100) {
    P.plot = null;
    if (chance(0.7)) { note(s, `${m.name} derruba o governo.`); return endGame(s, 'cabinet', `O ministro de ${label(s, pl.k)}, ${m.name}, liderou a deposição`); }
    note(s, `A conspiração de ${m.name} fracassou no último momento.`); P.cabinet[pl.k] = { ...makeMinister(s), since: day(s) }; s.st.stability = clamp(s.st.stability - 4, 0, 100);
  }
}
const note = (s, text) => { const P = s.pol; (P.minLog ||= []).unshift({ day: day(s), text }); if (P.minLog.length > 30) P.minLog.length = 30; };

// ---------- Respostas às questões ----------
export function minsAct(s, data, act, ctx) {
  const P = s.pol, rec = P.pending?.[act.id], k = rec?.k || P.plot?.k, m = k && P.cabinet[k];
  if (rec) delete P.pending[act.id];
  const bye = () => { const c = candidates(s, k)[0]; P.cabinet[k] = { ...(c || makeMinister(s)), since: day(s) }; const f = P.factions.find(x => x.id === m.faction); if (f) f.sat = clamp(f.sat - 9, 0, 100); if (P.mandates) P.mandates[k] = 'off'; };
  switch (act.choice) {
    case 'accept': if (m) { m.loyalty = clamp(m.loyalty + 5, 0, 100); m.amb = clamp(m.amb + 8, 0, 100); } return 'A medida do ministro fica; o governo caminha na direção dele.';
    case 'revert': if (rec?.delta) applyDelta(s, rec.delta, -1, data); if (m) { m.loyalty = clamp(m.loyalty - 12, 0, 100); m.amb = clamp(m.amb + 6, 0, 100); } if (P.mandates) P.mandates[k] = 'off'; return 'A medida é desfeita e o ministro, repreendido.';
    case 'fire': if (rec?.delta) applyDelta(s, rec.delta, -1, data); if (m) { note(s, `${m.name} é demitido.`); bye(); } return 'O ministro é demitido.';
    case 'limit': if (m) { m.loyalty = clamp(m.loyalty - 5, 0, 100); } if (P.mandates) P.mandates[k] = 'off'; if (rec?.lost) s.econ.treasury += rec.lost * 0.5; return 'O mandato do ministro é reduzido a "só aconselhar".';
    case 'cover': if (m) { m.amb = clamp(m.amb + 10, 0, 100); m.corrupt = clamp(m.corrupt + 8, 0, 100); } s.st.corruption = clamp(s.st.corruption + 2, 0, 100); return 'O caso é abafado.';
    case 'arrest': { const ok = chance(clamp(0.45 + s.st.intel / 200 + (s.groups.military - 40) / 300, 0.2, 0.85)); if (ok) { note(s, `${m.name} é preso; a conspiração é desmontada.`); P.plot = null; bye(); ensureRights(s, data).abuse = clamp(ensureRights(s, data).abuse + 3, 0, 100); return 'O ministro e a rede são presos: a conspiração acaba.'; } if (P.plot) P.plot.prog = clamp(P.plot.prog + 25, 0, 130); s.st.coupRisk = clamp(s.st.coupRisk + 8, 0, 100); return 'A prisão falha: o ministro escapa e a conspiração acelera.'; }
    case 'buy': if (m) { m.loyalty = clamp(m.loyalty + 25, 0, 100); m.amb = clamp(m.amb - 20, 0, 100); } if (P.plot) P.plot.prog = Math.max(10, P.plot.prog - 25); return 'A lealdade do ministro é comprada, por enquanto.';
    case 'ignore': if (P.plot) P.plot.prog += 8; return '';
    case 'purge': for (const x in P.mandates || {}) P.mandates[x] = 'off'; if (s.chief) s.chief.level = 'off'; if (P.plot) P.plot.prog = Math.max(5, P.plot.prog - 35); for (const x in P.cabinet) P.cabinet[x].amb = clamp((P.cabinet[x].amb || 30) - 15, 0, 100); return 'A autonomia de todos os ministros é cassada.';
  }
  return '';
}
