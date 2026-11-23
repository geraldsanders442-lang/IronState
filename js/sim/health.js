// Saúde, saneamento e higiene: cobertura de saneamento, água potável e lavagem de mãos (com defecação a céu aberto),
// expectativa de vida, mortalidade infantil e IDH. Os pontos de partida vêm de data/health.json (Banco Mundial: JMP OMS/UNICEF).
// Obras e financiamento elevam a cobertura; falta de investimento, guerra, crescimento populacional e pobreza a corroem.
import { clamp, chance, rand, pick } from './util.js';
import { PLY } from './world.js';

const day = s => Math.floor(s.time.min / 1440);
const add = (s, k, v) => { s.st[k] = clamp((s.st[k] ?? 0) + v, 0, 100); };

// Níveis de financiamento: custo anual em % do PIB e ritmo de ganho (fração da lacuna fechada por semana, antes da eficiência).
export const FUND = {
  san: { name: 'Saneamento básico (esgoto, fossas e banheiros)', cost: [0, 0.14, 0.34, 0.7], gain: [0, 0.05, 0.13, 0.25], desc: 'Redes de esgoto, fossas seguras, banheiros públicos e escolares. É o que mais reduz a defecação a céu aberto e as doenças diarreicas.' },
  water: { name: 'Água potável (poços, adutoras e tratamento)', cost: [0, 0.1, 0.26, 0.55], gain: [0, 0.05, 0.12, 0.22], desc: 'Captação, cloração e distribuição de água segura. Corta cólera, febre tifoide e diarreias.' },
  hyg: { name: 'Higiene e hábitos (lavar as mãos, educação sanitária)', cost: [0, 0.03, 0.08, 0.15], gain: [0, 0.06, 0.14, 0.24], desc: 'Campanhas em escolas e unidades de saúde, sabão e pontos de lavagem de mãos. Barato e muito eficaz.' },
  clinic: { name: 'Atenção básica e vacinação', cost: [0, 0.1, 0.25, 0.5], gain: [0, 0.04, 0.1, 0.18], desc: 'Postos de saúde, agentes comunitários, vacinação e pré-natal. Reduz a mortalidade infantil e a duração dos surtos.' },
};
export const LEVEL_NAME = ['Sem verba', 'Básico', 'Reforçado', 'Prioridade nacional'];

// ---------- Dados de partida ----------
const median = a => { const v = a.filter(x => x != null && isFinite(x)).sort((x, y) => x - y); return v.length ? v[Math.floor(v.length / 2)] : null; };
const CACHE = new WeakMap();
function subMedians(data) {
  if (CACHE.has(data)) return CACHE.get(data);
  const H = data.health?.countries || {}, by = {};
  for (const e of Object.values(data.reg || {})) { const h = H[e.iso3 || e.id]; if (!h || !e.subregion) continue; for (const k in h) (by[e.subregion] ||= {})[k] = [...(by[e.subregion][k] || []), h[k]]; }
  const out = {}; for (const sr in by) { out[sr] = {}; for (const k in by[sr]) out[sr][k] = median(by[sr][k]); }
  CACHE.set(data, out); return out;
}
const WORLD = { san: 82, water: 90, hyg: 60, od: 4, le: 72, u5m: 28, wash: 20 };
// Valores de um país (ou da média da sub-região quando não há dado). Sempre devolve todos os campos.
export function healthBaseline(data, id) {
  const e = data.reg?.[id], H = data.health?.countries || {};
  let h = H[e?.iso3 || id] || H[id];
  if (!h && e?.origin) h = H[data.reg?.[e.origin]?.iso3 || e.origin];
  const sm = subMedians(data)[e?.subregion] || {};
  const out = {};
  for (const k of Object.keys(WORLD)) out[k] = h?.[k] ?? sm[k] ?? WORLD[k];
  out.real = !!h;
  return out;
}

// Média ponderada pelos componentes da nação do jogador.
function nationBaseline(s, data) {
  const comps = s.nation.components?.length ? s.nation.components : [{ id: s.nation.scenario, share: 1 }];
  const acc = { san: 0, water: 0, hyg: 0, od: 0, le: 0, u5m: 0, wash: 0 }; let tot = 0, real = false;
  for (const c of comps) { const b = healthBaseline(data, c.id), w = c.share || 1 / comps.length; for (const k in acc) acc[k] += b[k] * w; tot += w; real = real || b.real; }
  for (const k in acc) acc[k] /= tot || 1;
  acc.real = real; return acc;
}

export function ensureHealth(s, data) {
  if (s.hlt) return s.hlt;
  const b = nationBaseline(s, data), st = s.st;
  const h = s.hlt = {
    san: b.san, water: b.water, hyg: b.hyg, od: b.od, le0: b.le, u5m0: b.u5m, wash0: b.wash, real: b.real,
    le: b.le, u5m: b.u5m, wash: b.wash, hdi: 0.5, idx: 0, idx0: 0, health0: st.health,
    fund: { san: 1, water: 1, hyg: 1, clinic: 1 }, focus: null, reg: {}, outbreak: null, deaths: { wash: 0, outbreak: 0 }, cd: {}, log: [], hist: [],
  };
  h.idx = h.idx0 = indexOf(h, st);
  for (const r of s.regions || []) h.reg[r.id] = regionStart(r, h);
  h.hdi = hdiOf(s);
  return h;
}
const indexOf = (h, st) => 0.35 * h.san + 0.3 * h.water + 0.2 * h.hyg + 0.15 * st.health;
// Zonas rurais têm menos cobertura que as urbanas (diferença típica do JMP: 10 a 30 pontos).
function regionStart(r, h) {
  const gap = (50 - (r.urban ?? 45)) * 0.28;
  const f = (v, k = 1) => clamp(v - gap * k * (v > 85 ? 0.35 : 1), 2, 100);
  return { san: f(h.san), water: f(h.water, 0.8), hyg: f(h.hyg, 0.7), od: clamp(h.od + gap * 0.5, 0, 90) };
}

// ---------- IDH (fórmula do PNUD: raiz cúbica de saúde × educação × renda) ----------
export function hdiOf(s) {
  const h = s.hlt, st = s.st;
  const le = h ? h.le : 60 + st.health * 0.25;
  const lei = clamp((le - 20) / 65, 0, 1);
  const mys = clamp(st.education * 0.14, 0, 15), eys = clamp(6 + st.education * 0.14, 0, 18);
  const ei = clamp((mys / 15 + eys / 18) / 2, 0, 1);
  const gni = Math.max(100, s.econ.gdp * 1e9 / Math.max(1, s.econ.pop * 1e6));
  const ii = clamp((Math.log(gni) - Math.log(100)) / (Math.log(75000) - Math.log(100)), 0, 1);
  return Math.cbrt(lei * ei * ii);
}
export const hdiTier = v => v >= 0.8 ? 'Muito alto' : v >= 0.7 ? 'Alto' : v >= 0.55 ? 'Médio' : 'Baixo';

// Mortes extras por ano, por mil habitantes, ligadas a água, saneamento e higiene inseguros (usado na demografia).
export const washDeathRate = s => s.hlt ? clamp((s.hlt.wash - s.hlt.wash0) * 0.01, -1.5, 3) : 0;

// ---------- Simulação semanal ----------
const note = (s, text, kind = 'info') => { const h = s.hlt; h.log.unshift({ day: day(s), text, kind }); if (h.log.length > 40) h.log.length = 40; };
const pcOf = s => Math.max(100, s.econ.gdp * 1e9 / Math.max(1, s.econ.pop * 1e6));
const incomeTarget = (pc, a, b) => clamp(a + b * Math.log10(Math.max(pc, 100) / 500), 3, 99.5);

export function weeklyHealth(s, data, ctx) {
  if (s.flags.micronation || s.ascent) return;
  const h = ensureHealth(s, data), st = s.st;
  const war = s.wars.some(w => w.active) ? 1 : 0, eff = clamp((st.efficiency / 100) * (1 - st.corruption / 160) * (0.55 + (st.infra ?? 40) / 140), 0.08, 1);
  const pc = pcOf(s), gdp = s.econ.gdp;
  // Financiamento: sai do tesouro; sem caixa, as obras param.
  let spent = 0;
  const active = {};
  for (const k in FUND) {
    const lvl = h.fund[k] || 0, c = gdp * FUND[k].cost[lvl] / 100 / 52;
    if (lvl && s.econ.treasury > c * 4) { s.econ.treasury -= c; spent += c; active[k] = lvl; }
  }
  h.spent = (h.spent || 0) + spent;
  // Cada indicador: ganho por obras + convergência lenta com a renda − desgaste.
  const growth = Math.max(0, st.popGrowth || 0);
  const wear = 0.004 + growth * 0.0035 + war * 0.03 + Math.max(0, st.poverty - 40) * 0.0004;
  const step = (cur, key, target, f = 1) => {
    const lvl = active[key] || 0, gain = FUND[key]?.gain[lvl] || 0;
    const up = gain * eff * f * (100 - cur) / 100;
    const drift = 0.0009 * Math.max(0, target - cur);
    return clamp(cur + up + drift - wear * (cur > 20 ? 1 : 0.4) * (100 - cur) / 100 * 0.6, 1, 99.9);
  };
  const sanOld = h.san;
  h.san = step(h.san, 'san', incomeTarget(pc, 12, 40));
  h.water = step(h.water, 'water', incomeTarget(pc, 38, 34));
  h.hyg = step(h.hyg, 'hyg', clamp(22 + st.education * 0.55, 10, 98), 1 + st.education / 200);
  h.od = clamp(h.od - Math.max(0, h.san - sanOld) * 0.9 * (h.od / Math.max(5, 100 - sanOld)) * 3 + (h.san < sanOld ? 0.02 : 0), 0, 95);
  if (h.od > 100 - h.san) h.od = Math.max(0, 100 - h.san);
  // Regiões: ganham mais quando recebem prioridade; as rurais ficam atrás.
  for (const r of s.regions) {
    const R = h.reg[r.id] ||= regionStart(r, h), f = (h.focus === r.id ? 2.4 : 0.8 + (r.invest || 0) / 120);
    const gapU = (50 - (r.urban ?? 45)) * 0.28;
    R.san = clamp(R.san + ((h.san - gapU * (h.san > 85 ? 0.35 : 1)) - R.san) * 0.02 * f, 1, 99.9);
    R.water = clamp(R.water + ((h.water - gapU * 0.8 * (h.water > 85 ? 0.35 : 1)) - R.water) * 0.02 * f, 1, 99.9);
    R.hyg = clamp(R.hyg + ((h.hyg - gapU * 0.7) - R.hyg) * 0.02 * f, 1, 99.9);
    R.od = clamp(R.od + ((h.od + gapU * 0.5) - R.od) * 0.02 * f, 0, 95);
  }
  // Indicadores derivados.
  h.idx = indexOf(h, st);
  const dI = h.idx - h.idx0, dH = st.health - h.health0;
  h.le = clamp(h.le0 + dI * 0.11 + dH * 0.17 - war * 1.2 - Math.max(0, st.hunger - 15) * 0.05, 30, 90);
  h.u5m = clamp(h.u5m0 * Math.exp(-dI * 0.014 - dH * 0.011 + war * 0.06 + (h.outbreak ? 0.08 : 0)), 1.5, 300);
  h.wash = clamp(h.wash0 * Math.exp(-(h.idx - h.idx0) * 0.03) * (1 + (h.outbreak ? 0.4 : 0)), 0.3, 200);
  h.hdi = hdiOf(s);
  // A saúde geral responde às obras pelo modelo (model.js lê h.idx − h.idx0).
  (h.hist ||= []).push([day(s), +h.san.toFixed(1), +h.water.toFixed(1), +h.hyg.toFixed(1), +h.le.toFixed(1), +h.hdi.toFixed(3)]); if (h.hist.length > 140) h.hist.shift();

  // ---- Surtos de doenças ligadas à água ----
  const o = h.outbreak;
  if (o) {
    o.weeks++;
    const dead = Math.round(s.econ.pop * 1e6 * o.rate * (o.emergency ? 0.4 : 1) * rand(0.7, 1.2));
    o.dead += dead; h.deaths.outbreak += dead; s.econ.pop = Math.max(0.0001, s.econ.pop - dead / 1e6);
    add(s, 'protest', 0.12); st.health = clamp(st.health - 0.05 * (o.emergency ? 0.4 : 1), 0, 100);
    if (o.weeks >= o.len || (o.emergency && o.weeks >= o.len * 0.5)) {
      note(s, `O surto de ${o.name} em ${o.region} foi controlado: ${o.dead.toLocaleString('pt-BR')} mortos.`, 'good');
      ctx.news(`Surto de ${o.name} em ${o.region} controlado após ${o.dead.toLocaleString('pt-BR')} mortes.`, 'info'); h.outbreak = null;
    }
  } else if (day(s) - (h.cd.out || -999) > 45) {
    const risk = Math.pow((100 - h.san) / 100, 1.3) * 0.5 + Math.pow((100 - h.water) / 100, 1.2) * 0.5 + (war ? 0.12 : 0) + Math.max(0, 50 - h.hyg) / 400;
    if (chance(clamp(risk * 0.045 * (1 - (active.clinic || 0) * 0.15), 0, 0.12))) {
      const reg = pick(s.regions.filter(r => !r.cap).length ? s.regions.filter(r => !r.cap) : s.regions);
      const R = h.reg[reg.id];
      const kind = pick(h.water < 75 || h.san < 60 ? ['cólera', 'cólera', 'febre tifoide', 'disenteria'] : ['hepatite A', 'disenteria', 'febre tifoide']);
      const sev = clamp(0.4 + (100 - (R?.san ?? h.san)) / 90 + (100 - (R?.water ?? h.water)) / 120, 0.4, 2.2);
      h.outbreak = { name: kind, region: reg.name, rid: reg.id, rate: 0.000012 * sev * (1 + (100 - h.hyg) / 120), len: Math.round(5 + sev * 5), weeks: 0, dead: 0, emergency: false };
      h.cd.out = day(s);
      note(s, `Surto de ${kind} em ${reg.name}, associado a água e saneamento inseguros.`, 'bad');
      ctx.news(`Surto de ${kind} em ${reg.name}: hospitais lotados e água contaminada.`, 'bad'); ctx.notify?.('Surto de doença', `${kind} em ${reg.name}. Decrete resposta de emergência na página Saúde e saneamento.`);
      reg.unrest = clamp(reg.unrest + 3, 0, 100);
    }
  }
  // Mortes crônicas atribuíveis à água e saneamento (para as estatísticas).
  h.deaths.wash += Math.round(s.econ.pop * 1e6 * h.wash / 100000 / 52);
}

// ---------- Ações do jogador ----------
export function healthAct(s, data, op, arg) {
  const h = ensureHealth(s, data), gdp = s.econ.gdp;
  switch (op) {
    case 'fund': { const [k, lvl] = String(arg).split('|'); if (!FUND[k]) return { ok: false, msg: 'Programa inválido.' }; h.fund[k] = clamp(+lvl, 0, 3); return { ok: true, msg: `${FUND[k].name}: ${LEVEL_NAME[h.fund[k]]}.` }; }
    case 'focus': { h.focus = arg === 'none' ? null : arg; const r = s.regions.find(x => x.id === arg); return { ok: true, msg: r ? `Obras de água e saneamento priorizam ${r.name}.` : 'Sem região prioritária.' }; }
    case 'emergency': {
      const o = h.outbreak; if (!o) return { ok: false, msg: 'Não há surto em curso.' }; if (o.emergency) return { ok: false, msg: 'A resposta de emergência já está em andamento.' };
      const cost = gdp * 0.0006; if (s.econ.treasury < cost) return { ok: false, msg: 'Tesouro insuficiente para a emergência.' };
      s.econ.treasury -= cost; o.emergency = true; add(s, 'legitimacy', 0.6);
      const msg = `Resposta de emergência (${cost.toFixed(2)} bi): cloro, reidratação e brigadas sanitárias em ${o.region}.`; note(s, msg, 'good'); return { ok: true, msg, log: true };
    }
    case 'campaign': {
      if (day(s) - (h.cd.camp || -999) < 70) return { ok: false, msg: 'Aguarde para lançar outra campanha nacional.' };
      const cost = gdp * 0.0012; if (s.econ.treasury < cost) return { ok: false, msg: 'Tesouro insuficiente.' };
      s.econ.treasury -= cost; h.cd.camp = day(s); h.hyg = clamp(h.hyg + 3.5, 0, 99); add(s, 'education', 0.15);
      const msg = `Campanha nacional de higiene (${cost.toFixed(2)} bi): +3,5 pontos de lavagem de mãos.`; note(s, msg, 'good'); return { ok: true, msg, log: true };
    }
    case 'vaccination': {
      if (day(s) - (h.cd.vac || -999) < 120) return { ok: false, msg: 'A última campanha de vacinação foi há pouco tempo.' };
      const cost = gdp * 0.0018; if (s.econ.treasury < cost) return { ok: false, msg: 'Tesouro insuficiente.' };
      s.econ.treasury -= cost; h.cd.vac = day(s); s.st.health = clamp(s.st.health + 1.5, 0, 100); h.u5m0 *= 0.97;
      const msg = `Campanha de vacinação em massa (${cost.toFixed(2)} bi): menos mortes infantis.`; note(s, msg, 'good'); return { ok: true, msg, log: true };
    }
  }
  return { ok: false, msg: 'Ação desconhecida.' };
}

// ---------- Mundo: surtos nos outros países (modo observador e jogo normal) ----------
export function weeklyWorldHealth(s, data, ctx) {
  const W = s.world; if (!W?.c) return;
  const d = day(s); if (d % 7 !== 0 && !s.spectator) return;
  const ids = Object.keys(W.c).filter(id => !W.c[id].dep && id !== PLY);
  if (!ids.length || !chance(s.spectator ? 0.35 : 0.1)) return;
  const id = pick(ids), c = W.c[id], b = healthBaseline(data, id), a = (W.hlth ||= {});
  if (a[id] && d - a[id] < 120) return;
  const risk = Math.pow((100 - b.san) / 100, 1.2) * 0.7 + Math.pow((100 - b.water) / 100, 1.1) * 0.3 + (W.wars?.some(w => w.active && [...w.a, ...w.b].includes(id)) ? 0.25 : 0);
  if (!chance(clamp(risk * 0.9, 0.01, 0.6))) return;
  a[id] = d;
  const nm = data.reg[id]?.name || W.ents?.[id]?.name || id, kind = pick(b.san < 60 ? ['cólera', 'cólera', 'febre tifoide'] : ['disenteria', 'hepatite A']);
  const dead = Math.round(c.pop * 1e6 * 0.00001 * (1 + risk * 4));
  c.pop = Math.max(0.01, c.pop - dead / 1e6); c.stab = clamp(c.stab - 1 - risk * 3, 5, 95);
  ctx.news?.(`Surto de ${kind} em ${nm} (apenas ${Math.round(b.san)}% com saneamento básico): ${dead.toLocaleString('pt-BR')} mortos.`, 'bad');
}
