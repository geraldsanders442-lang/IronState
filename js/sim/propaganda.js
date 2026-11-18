// Propaganda e discursos: orçamento de propaganda por canal, filmes, campanhas de unidade nacional,
// discursos (público, tema, tom, promessas), credibilidade e cobrança de promessas não cumpridas.
import { clamp, chance, rand, pick } from './util.js';
import { fmtDate } from './util.js';
import { BUILDINGS } from './markets.js';

const day = s => Math.floor(s.time.min / 1440);
const add = (s, k, v) => { s.st[k] = clamp((s.st[k] ?? 0) + v, 0, 100); };
const grp = (s, g, v) => { s.groups[g] = clamp((s.groups[g] ?? 50) + v, 0, 100); };

export const CHANNELS = {
  tv: ['Televisão e rádio estatais', 'Alcance amplo; barato por pessoa.', { rural: 1.2, workers: 1, youth: 0.5 }],
  social: ['Redes sociais e influenciadores', 'Atinge jovens; menos confiável.', { youth: 1.4, workers: 0.7, rural: 0.3 }],
  press: ['Imprensa e publicidade oficial', 'Atinge elites e empresários.', { business: 1.3, bureaucracy: 1 }],
  school: ['Escolas e universidades', 'Lenta, mas molda gerações.', { youth: 1.1, workers: 0.5 }],
  cinema: ['Cinema, séries e artes', 'Filmes e séries de apelo emocional.', { youth: 0.9, workers: 0.9, rural: 0.6 }],
  local: ['Campanhas regionais', 'Mensagens sob medida para cada região.', { regional: 1.4, rural: 0.8 }],
};
export const GOALS = {
  loyalty: ['Lealdade ao governo', 'Eleva a base aliada e o patriotismo.'],
  unity: ['Unidade nacional', 'Reduz o separatismo da região-alvo, sem coerção.'],
  erase_nat: ['Apagar o nacionalismo regional', 'Corta o separatismo à força da mensagem: eficaz, mas gera revolta e violações.'],
  prosperity: ['Prosperidade e progresso', 'Aumenta confiança de empresários e jovens.'],
  fear: ['Medo do inimigo externo', 'Eleva patriotismo e apoio militar; esquenta a diplomacia.'],
  image: ['Imagem no exterior', 'Melhora a reputação internacional.'],
};
export const TONES = {
  agressivo: ['Agressivo', 'Mobiliza a base e assusta adversários.', { military: 3, rural: 1, workers: 0, business: -2, youth: -2, opposition: -4, regional: -2 }],
  heroico: ['Heroico', 'Exalta o povo e o sacrifício.', { military: 3, rural: 2, workers: 2, business: 0, youth: 1, opposition: -1, regional: 0 }],
  calmo: ['Calmo', 'Técnico e tranquilizador.', { military: 0, rural: 0, workers: 1, business: 3, youth: 1, opposition: 0, regional: 0 }],
  apaziguador: ['Apaziguador', 'Pede entendimento e concede gestos.', { military: -2, rural: 0, workers: 1, business: 1, youth: 2, opposition: 3, regional: 3 }],
  mediador: ['Mediador', 'Reúne lados e propõe pactos.', { military: -1, rural: 0, workers: 1, business: 1, youth: 1, opposition: 3, regional: 4 }],
};
export const TOPICS = {
  economy: ['Economia e emprego', { workers: 1, business: 1 }],
  taxes: ['Impostos', { business: 1 }],
  security: ['Segurança e crime', { rural: 1, military: 1, business: 1 }],
  education: ['Educação e juventude', { youth: 1 }],
  rights: ['Liberdades e direitos', { youth: 1, opposition: 1 }],
  defense: ['Defesa e soberania', { military: 1 }],
  unity: ['Unidade nacional', { regional: 1, military: 1 }],
  land: ['Campo e terra', { rural: 1 }],
  autonomy: ['Autonomia regional e obras', { regional: 1 }],
  dialogue: ['Diálogo e reformas', { opposition: 1, regional: 1 }],
  war: ['Guerra e sacrifício', { military: 1, rural: 1 }],
  welfare: ['Saúde e proteção social', { workers: 1, rural: 1 }],
};
export const AUDIENCES = { workers: 'Trabalhadores', business: 'Empresários', military: 'Forças armadas', bureaucracy: 'Funcionalismo', youth: 'Juventude', rural: 'Povo do campo', regional: 'Elites regionais', opposition: 'Oposição', nation: 'A nação inteira' };

export function ensureProp(s) {
  if (s.prop) return s.prop;
  s.prop = { pct: 0, level: 0, ch: { tv: 30, social: 20, press: 15, school: 15, cinema: 10, local: 10 }, goal: 'loyalty', region: null, cred: 60, skill: Math.round(rand(40, 72)), speeches: [], promises: [], films: 0, base: 0, spent: 0, cd: {}, seq: 0 };
  return s.prop;
}

// Orçamento: % do PIB por ano (0–1,5%). Eficácia depende da credibilidade, dos canais e do patamar da mensagem.
export function weeklyPropaganda(s, data, ctx) {
  const P = ensureProp(s), o = s.ord, d = day(s);
  const cost = s.econ.gdp * P.pct / 100 / 52; // bi por semana
  if (cost > 0) { s.econ.treasury -= cost; P.spent += cost; }
  const tgt = clamp(P.pct * 60, 0, 100) * (cost > 0 && s.econ.treasury < -1 ? 0.3 : 1);
  P.level += (tgt - P.level) * 0.08;
  const cr = P.cred / 100, L = P.level / 100;
  if (L > 0.02) {
    const eff = L * (0.35 + cr * 0.9);
    add(s, 'legitimacy', eff * 0.12 - (cr < 0.35 ? L * 0.2 : 0));
    add(s, 'protest', -eff * 0.1);
    const sp = P.ch.social / 100;
    if (sp > 0.3) grp(s, 'youth', -L * (sp - 0.3) * 0.8); // propaganda pesada em redes irrita jovens
    for (const [k, c] of Object.entries(CHANNELS)) for (const g in c[2]) grp(s, g, eff * (P.ch[k] / 100) * c[2][g] * 0.12);
    if (P.goal === 'loyalty') P.base = clamp((P.base || 0) + eff * 0.15, 0, 18);
    else P.base = Math.max(0, (P.base || 0) - 0.05);
    if (o) { o.patriot = clamp(o.patriot + eff * 0.05, 0, 100); }
    const r = s.regions.find(x => x.id === P.region);
    if (P.goal === 'unity' && r) { r.sep = Math.max(0, (r.sep || 0) - 0.0006 * L * (1 + cr)); r.unrest = clamp(r.unrest - 0.12 * L, 0, 100); }
    if (P.goal === 'erase_nat' && r) { r.sep = Math.max(0, (r.sep || 0) - 0.0016 * L); r.unrest = clamp(r.unrest + 0.15 * L, 0, 100); if (s.rights) s.rights.abuse = clamp(s.rights.abuse + 0.05 * L, 0, 100); if (chance(0.01 * L)) { r.sep = (r.sep || 0) + 0.004; ctx.news(`A campanha para apagar a identidade de ${r.name} provoca revolta local.`, 'bad'); } }
    if (P.goal === 'prosperity') { grp(s, 'business', eff * 0.06); grp(s, 'youth', eff * 0.04); }
    if (P.goal === 'fear') { grp(s, 'military', eff * 0.08); if (o) o.patriot = clamp(o.patriot + eff * 0.05, 0, 100); for (const id of s.world._nb || []) if (s.partners[id] && chance(0.02)) s.partners[id].rel -= 1; }
    if (P.goal === 'image') add(s, 'reputation', eff * 0.1);
  }
  P.cred = clamp(P.cred + (P.cred < 60 ? 0.05 : -0.02) - (s.st.corruption > 60 ? 0.04 : 0), 0, 100);
  checkPromises(s, data, ctx, P);
}

// ---------- Promessas ----------
function fulfilled(s, p) {
  switch (p.kind) {
    case 'build': {
      const r = s.regions.find(x => x.id === p.region); if (!r) return false;
      return r.provinces.some(pid => (s.buildings?.[pid] || []).some(b => (!p.type || b.type === p.type) && b.start >= p.day));
    }
    case 'taxcut': return s.budget.tax <= p.val;
    case 'jobs': return s.st.unemployment <= p.val;
    case 'security': return s.st.crime <= p.val;
    case 'peace': return !s.wars.some(w => w.active);
    case 'rights': return (s.st.civil + s.st.political) / 2 >= p.val;
    case 'wage': return s.st.poverty <= p.val;
  }
  return true;
}
export const PROMISE_KINDS = {
  build: 'Obra regional', taxcut: 'Cortar impostos', jobs: 'Reduzir o desemprego', security: 'Reduzir o crime', peace: 'Paz (encerrar guerras)', rights: 'Ampliar liberdades', wage: 'Reduzir a pobreza',
};
export function promiseLabel(s, p) {
  const r = s.regions.find(x => x.id === p.region);
  switch (p.kind) {
    case 'build': return `${p.type ? BUILDINGS[p.type].name.toLowerCase() : 'uma obra'} em ${r?.name || 'uma região'}`;
    case 'taxcut': return `reduzir os impostos para ${p.val}%`;
    case 'jobs': return `baixar o desemprego para ${p.val}%`;
    case 'security': return `reduzir o crime para ${p.val}`;
    case 'peace': return 'encerrar as guerras';
    case 'rights': return 'ampliar as liberdades';
    case 'wage': return `reduzir a pobreza para ${p.val}%`;
  }
  return 'algo';
}
function checkPromises(s, data, ctx, P) {
  const d = day(s);
  for (const p of P.promises) {
    if (p.status !== 'open') continue;
    if (fulfilled(s, p)) { p.status = 'kept'; P.cred = clamp(P.cred + 6, 0, 100); grp(s, p.aud && s.groups[p.aud] != null ? p.aud : 'workers', 3); ctx.news(`Promessa cumprida: ${promiseLabel(s, p)} (discurso de ${fmtDate(p.day)}).`, 'good'); continue; }
    if (d >= p.due) {
      p.status = 'broken'; P.cred = clamp(P.cred - 10, 0, 100); grp(s, p.aud && s.groups[p.aud] != null ? p.aud : 'workers', -4); add(s, 'legitimacy', -1.5);
      ctx.news(`Promessa não cumprida: ${promiseLabel(s, p)}.`, 'bad');
      if (ctx.card && chance(0.85)) ctx.card(brokenIssue(s, p));
    }
  }
}
function brokenIssue(s, p) {
  const aud = AUDIENCES[p.audKey] || 'o público', what = promiseLabel(s, p);
  return {
    id: 'prom_' + p.id, dyn: true, cat: 'Imprensa', title: 'A promessa não cumprida', w: 1, keepIn: false,
    desc: `Uma repórter, numa coletiva, lembra o discurso feito em ${fmtDate(p.day)} para ${aud.toLowerCase()}, no qual você prometeu ${what}, e pergunta por que nada foi feito.`,
    context: `Credibilidade do governo: ${Math.round(s.prop.cred)}%.`,
    options: [
      { text: 'Assumir o erro e marcar um novo prazo.', hint: 'Honestidade: perde pouco e abre novo prazo.', now: { legitimacy: -1 }, act: { type: 'extra', op: 'recommit', id: p.id } },
      { text: 'Fazer a obra/medida agora, com urgência.', hint: 'Custa dinheiro, recupera credibilidade.', now: { treasury: -0.3 }, act: { type: 'extra', op: 'rush', id: p.id } },
      { text: 'Culpar a oposição e o Congresso.', hint: 'Mobiliza a base, mas a credibilidade cai.', groups: { opposition: -3 }, act: { type: 'extra', op: 'blame', id: p.id } },
      { text: 'Atacar a repórter e a imprensa.', hint: 'Intimida; alimenta alienação e a imagem de censura.', now: { civil: -2, reputation: -2 }, act: { type: 'extra', op: 'attackPress', id: p.id } },
      { text: 'Ignorar a pergunta.', hint: 'Passa o tempo; a promessa vira piada.', now: { legitimacy: -1.5 } },
    ],
    default: 4,
  };
}
export function propActExtra(s, data, act) {
  const P = ensureProp(s), p = P.promises.find(x => x.id === act.id); if (!p) return '';
  switch (act.op) {
    case 'recommit': p.status = 'open'; p.due = day(s) + 90; P.cred = clamp(P.cred + 2, 0, 100); return 'Novo prazo marcado.';
    case 'rush': p.status = 'open'; p.due = day(s) + 45; P.cred = clamp(P.cred + 3, 0, 100); if (p.kind === 'build') s.flags['rush_' + p.id] = 1; return 'Você promete resolver em semanas.';
    case 'blame': p.status = 'broken'; P.cred = clamp(P.cred - 3, 0, 100); return 'Você joga a culpa na oposição.';
    case 'attackPress': P.cred = clamp(P.cred - 4, 0, 100); if (s.ord) s.ord.alien = clamp(s.ord.alien + 2, 0, 100); return 'Você ataca a imprensa.';
  }
  return '';
}

// ---------- Discursos ----------
export function speechSuggestions(s) {
  const gs = Object.entries(s.groups).filter(([g]) => AUDIENCES[g] && g !== 'opposition').sort((a, b) => a[1] - b[1]);
  const res = [];
  const low = gs[0]?.[0] || 'workers', low2 = gs[1]?.[0] || 'business';
  const topicFor = { workers: 'economy', business: 'taxes', military: 'defense', bureaucracy: 'economy', youth: 'education', rural: 'land', regional: 'autonomy' };
  const toneFor = { workers: 'heroico', business: 'calmo', military: 'agressivo', bureaucracy: 'calmo', youth: 'apaziguador', rural: 'heroico', regional: 'mediador' };
  res.push({ who: 'Ministério da Comunicação', aud: [low], topics: [topicFor[low]], tone: toneFor[low], promises: [], why: `${AUDIENCES[low]} são o grupo menos satisfeito (${Math.round(s.groups[low])}).` });
  res.push({ who: 'Gabinete', aud: [low2], topics: [topicFor[low2], 'unity'], tone: toneFor[low2], promises: [], why: `Reforça a base em ${AUDIENCES[low2].toLowerCase()}.` });
  const sep = s.regions.filter(r => !r.cap && ((r.sep || 0) > 0.2 || r.unrest > 55)).sort((a, b) => b.unrest - a.unrest)[0];
  if (sep) res.push({ who: 'Assessor regional', aud: ['regional'], region: sep.id, topics: ['autonomy', 'dialogue'], tone: 'mediador', promises: [{ kind: 'build', type: 'hospital', region: sep.id }], why: `${sep.name} está em ebulição (descontentamento ${Math.round(sep.unrest)}).` });
  else res.push({ who: 'Marqueteiro', aud: ['nation'], topics: ['unity', 'security'], tone: 'calmo', promises: [], why: 'Discurso à nação para reforçar a unidade.' });
  return res;
}
export function deliverSpeech(s, data, sp, ctx) {
  const P = ensureProp(s), d = day(s);
  if ((P.cd.speech || 0) > d) return { ok: false, msg: `Aguarde ${P.cd.speech - d} dia(s) para outro discurso.` };
  P.cd.speech = d + 5;
  const own = !!sp.own;
  const skill = clamp(P.skill + (own ? rand(-28, 24) : rand(-10, 8)) + (own ? 0 : 6), 5, 100);
  const aud = sp.aud?.length ? sp.aud : ['nation'];
  const keys = aud.includes('nation') ? Object.keys(AUDIENCES).filter(k => k !== 'nation') : aud;
  const tone = TONES[sp.tone] || TONES.calmo, topics = sp.topics || [];
  const lines = []; let sum = 0;
  const promises = (sp.promises || []).filter(Boolean);
  for (const g of keys) {
    let score = tone[2][g] ?? 0;
    for (const t of topics) if (TOPICS[t]?.[1][g]) score += 3;
    score += promises.length * 1.5;
    if (aud.includes('nation')) score *= 0.6;
    const mood = (skill - 45) / 40; // -1..1,4
    const delta = clamp(score * (0.6 + mood) * (0.4 + P.cred / 160), -9, 9);
    grp(s, g, delta);
    lines.push({ g, delta, text: delta > 3.5 ? 'aplaudiu de pé' : delta > 1 ? 'reagiu bem' : delta > -1 ? 'ficou indiferente' : delta > -3.5 ? 'torceu o nariz' : 'reagiu com hostilidade' });
    sum += delta;
  }
  const avg = sum / Math.max(1, keys.length);
  const grade = skill > 78 ? 'Discurso memorável' : skill > 58 ? 'Bom discurso' : skill > 40 ? 'Discurso mediano' : 'Discurso desastroso';
  add(s, 'legitimacy', clamp(avg * 0.35, -3, 3));
  if (sp.tone === 'agressivo') for (const id of s.world._nb || []) if (s.partners[id] && chance(0.3)) s.partners[id].rel -= 1;
  if (sp.tone === 'mediador' || sp.tone === 'apaziguador') add(s, 'reputation', 0.4);
  if (sp.region) { const r = s.regions.find(x => x.id === sp.region); if (r) { r.unrest = clamp(r.unrest - avg * 0.8, 0, 100); if (topics.includes('autonomy') || topics.includes('dialogue')) r.sep = Math.max(0, (r.sep || 0) - 0.0005 * Math.max(0, avg)); } }
  if (s.ord) { s.ord.patriot = clamp(s.ord.patriot + (sp.tone === 'heroico' || sp.tone === 'agressivo' ? 0.8 : 0.1), 0, 100); }
  const audKey = aud.length === 1 ? aud[0] : 'nation';
  for (const pr of promises) {
    P.seq++;
    const mk = { id: 'p' + P.seq, status: 'open', day: d, due: d + (pr.days || 120), aud: audKey === 'nation' ? 'workers' : audKey, audKey, ...pr };
    if (mk.kind === 'taxcut') mk.val = pr.val || Math.max(8, Math.round(s.budget.tax - 4));
    if (mk.kind === 'jobs') mk.val = pr.val || Math.max(3, Math.round(s.st.unemployment - 2));
    if (mk.kind === 'security') mk.val = pr.val || Math.max(10, Math.round(s.st.crime - 8));
    if (mk.kind === 'rights') mk.val = pr.val || Math.round((s.st.civil + s.st.political) / 2 + 8);
    if (mk.kind === 'wage') mk.val = pr.val || Math.max(3, Math.round(s.st.poverty - 5));
    P.promises.push(mk);
  }
  const rec = { day: d, aud: keys.length > 6 ? ['nation'] : aud, region: sp.region || null, topics, tone: sp.tone, own, grade, avg: +avg.toFixed(1), promises: promises.length };
  P.speeches.unshift(rec); if (P.speeches.length > 30) P.speeches.length = 30;
  P.skill = clamp(P.skill + (own ? 0.4 : 0.1), 0, 100);
  return { ok: true, log: true, msg: `${grade}: reação média ${avg >= 0 ? '+' : ''}${avg.toFixed(1)}.`, result: { grade, avg, lines, skill: Math.round(skill), promises: promises.map(p => ({ ...p })) } };
}

export function propAct(s, data, op, arg) {
  const P = ensureProp(s), d = day(s);
  switch (op) {
    case 'budget': P.pct = clamp(+arg, 0, 1.5); return { ok: true, msg: `Orçamento de propaganda: ${P.pct.toFixed(2)}% do PIB por ano.` };
    case 'channel': { const [k, v] = arg; P.ch[k] = clamp(+v, 0, 100); return { ok: true, msg: '' }; }
    case 'goal': P.goal = arg.goal; P.region = arg.region || null; return { ok: true, log: true, msg: `Campanha: ${GOALS[arg.goal][0]}${arg.region ? ' em ' + (s.regions.find(r => r.id === arg.region)?.name || '') : ''}.` };
    case 'film': {
      if ((P.cd.film || 0) > d) return { ok: false, msg: 'O estúdio ainda está ocupado com o último filme.' };
      const cost = Math.max(0.05, s.econ.gdp * 0.0003); if (s.econ.treasury < cost) return { ok: false, msg: 'Sem caixa para o filme.' };
      s.econ.treasury -= cost; P.cd.film = d + 60; P.films++;
      const q = rand(0, 100) * 0.5 + P.cred * 0.3 + (100 - Math.min(100, (s.ord?.alien || 0))) * 0.2;
      if (q > 62) { add(s, 'legitimacy', 2); grp(s, 'youth', 3); grp(s, 'workers', 2); if (s.ord) s.ord.patriot = clamp(s.ord.patriot + 3, 0, 100); return { ok: true, log: true, msg: 'O filme oficial é um sucesso de público e crítica.' }; }
      if (q > 38) { add(s, 'legitimacy', 0.6); if (s.ord) s.ord.patriot = clamp(s.ord.patriot + 1, 0, 100); return { ok: true, log: true, msg: 'O filme oficial passa quase despercebido.' }; }
      grp(s, 'youth', -3); add(s, 'reputation', -1); P.cred = clamp(P.cred - 3, 0, 100); return { ok: true, log: true, msg: 'O filme oficial vira piada nas redes: "propaganda mal feita".' };
    }
    case 'festival': {
      if ((P.cd.fest || 0) > d) return { ok: false, msg: 'Já houve um festival recentemente.' };
      s.econ.treasury -= 0.2; P.cd.fest = d + 90; add(s, 'qol', 0.6); grp(s, 'workers', 2); grp(s, 'youth', 2); if (s.ord) s.ord.patriot = clamp(s.ord.patriot + 2, 0, 100);
      return { ok: true, log: true, msg: 'Festival nacional: desfile, música e bandeiras.' };
    }
  }
  return { ok: false, msg: '' };
}
