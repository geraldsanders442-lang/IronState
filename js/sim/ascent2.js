// Alcance o poder (v2): origem do movimento, facções, pontos de ação, propaganda de oposição (orçamento reduzido),
// discursos, reação do regime, eventos semanais, rotas com chance de sucesso e herança para o governo.
import { clamp, chance, rand, pick } from './util.js';
import { endGame } from './regime.js';
import { TONES, TOPICS, PROMISE_KINDS } from './propaganda.js';

const day = s => Math.floor(s.time.min / 1440);
export const MAX_WEEK = 40;

export const FACS = {
  unions: ['Sindicatos', 'workers', 'users', 'Greves e base organizada.'],
  students: ['Estudantes', 'youth', 'flag', 'Marchas, redes e legitimidade moral.'],
  business: ['Empresários', 'business', 'banknote', 'Dinheiro e influência.'],
  officers: ['Oficiais', 'military', 'shield', 'Força nas casernas.'],
  clergy: ['Clero', 'rural', 'scroll', 'Autoridade moral no interior.'],
  rural: ['Camponeses', 'rural', 'wheat', 'Votos e milícias locais.'],
};
export const ORIGINS = {
  sindical: ['Movimento sindical', { unions: 34, students: 12 }], estudantil: ['Movimento estudantil', { students: 34, unions: 12 }], militar: ['Dissidência militar', { officers: 34, business: 10 }],
  religioso: ['Movimento religioso', { clergy: 34, rural: 18 }], liberal: ['Frente liberal', { business: 32, students: 18 }], camponês: ['Liga camponesa', { rural: 34, clergy: 12 }],
};
function originOf(s) {
  const ax = s.nation.ideology?.axes || {};
  if ((ax.mil ?? 0) > 18) return 'militar'; if ((ax.econ ?? 0) < -18) return 'sindical'; if ((ax.relig ?? 0) > 15 || (ax.trad ?? 0) > 22) return 'religioso';
  if ((ax.econ ?? 0) > 18) return 'liberal'; if ((ax.central ?? 0) < -15) return 'camponês'; return 'estudantil';
}
export function initAscent2(s) {
  const A = s.ascent, o = originOf(s), bonus = ORIGINS[o][1];
  Object.assign(A, { week: 0, cred: 55, heat: 8, ap: 3, origin: o, fac: Object.fromEntries(Object.keys(FACS).map(k => [k, { loy: 12 + (bonus[k] || 0) }])), prop: { pct: 0.5, level: 0 }, promises: [], speeches: [], log: [], seen: [], cd: {}, spoke: 0 });
  A.support += (bonus.unions || bonus.students || 0) * 0.1; A.force += (bonus.officers || 0) * 0.2;
  return A;
}
export const regimeStr = s => clamp(s.st.control * 0.45 + s.st.legitimacy * 0.35 + (s.groups.military ?? 50) * 0.2, 5, 95);
const note = (A, s, t) => { A.log.unshift({ day: day(s), text: t }); if (A.log.length > 30) A.log.length = 30; };
const lim = A => { for (const k of ['support', 'force', 'money', 'cred', 'heat']) A[k] = clamp(A[k], 0, 100); for (const f in A.fac) A.fac[f].loy = clamp(A.fac[f].loy, 0, 100); };

// ---------- Ações (cada uma custa 1 ponto de ação) ----------
export const ACTIONS = {
  rally: { name: 'Grande comício', icon: 'megaphone', desc: 'Apoio forte; custa dinheiro e atrai a polícia.', f: A => { A.support += 6 + rand(0, 3); A.money -= 3; A.heat += 4; } },
  door: { name: 'Trabalho de base', icon: 'users', desc: 'Apoio lento e seguro, sem atrair atenção.', f: A => { A.support += 3; A.cred += 1.5; A.money -= 1; } },
  media: { name: 'Mídia independente', icon: 'tv', desc: 'Apoio e credibilidade; o regime vigia.', f: A => { A.support += 3.5; A.cred += 2; A.money -= 2; A.heat += 2; } },
  donors: { name: 'Buscar doadores', icon: 'banknote', desc: 'Dinheiro; os pobres desconfiam.', f: A => { A.money += 9; A.cred -= 1.5; } },
  strike: { name: 'Greve geral', icon: 'siren', desc: 'Apoio e pressão; exige sindicatos leais; custa caro em repressão.', f: A => { A.support += 5 + A.fac.unions.loy / 20; A.heat += 8; A.money -= 2; }, need: A => A.fac.unions.loy >= 30 },
  net: { name: 'Rede clandestina', icon: 'eye', desc: 'Reduz a pressão policial e protege a organização.', f: A => { A.heat -= 9; A.money -= 2; A.risk = Math.max(0, (A.risk || 0) - 6); } },
  officers: { name: 'Cortejar oficiais', icon: 'shield', desc: 'Força; arriscado.', f: A => { A.force += 6; A.fac.officers.loy += 4; A.risk = (A.risk || 0) + 8; } },
  militia: { name: 'Organizar milícias', icon: 'skull', desc: 'Força nas ruas; mancha a imagem.', f: A => { A.force += 8; A.support -= 2; A.cred -= 3; A.risk = (A.risk || 0) + 6; A.heat += 5; } },
  foreign: { name: 'Apoio estrangeiro', icon: 'globe', desc: 'Dinheiro e força; acusação de traição.', f: A => { A.money += 6; A.force += 4; A.support -= 3; A.cred -= 3; } },
  charity: { name: 'Obras sociais do movimento', icon: 'heart-pulse', desc: 'Apoio e credibilidade duradouros.', f: A => { A.support += 2.5; A.cred += 3; A.money -= 3; } },
  talks: { name: 'Negociar com o regime', icon: 'scale', desc: 'Baixa a pressão policial; irrita os radicais.', f: A => { A.heat -= 12; A.cred -= 1; A.fac.students.loy -= 3; } },
};
export function ascAction(s, data, op, arg) {
  const A = s.ascent; if (!A) return { ok: false, msg: '' };
  const d = day(s);
  if (op === 'budget') { A.prop.pct = clamp(+arg, 0, 3); return { ok: true, msg: '' }; }
  if (op === 'speech') return ascSpeech(s, arg);
  if (op === 'route') return takeRoute(s, arg);
  if (A.ap < 1) return { ok: false, msg: 'Sem pontos de ação nesta semana.' };
  if (op.startsWith('court:')) {
    const f = op.slice(6), F = A.fac[f]; if (!F) return { ok: false, msg: '' };
    if (A.money < 3) return { ok: false, msg: 'Dinheiro insuficiente (3).' };
    A.ap--; A.money -= 3; F.loy += 9 + rand(0, 4); if (f === 'officers') A.risk = (A.risk || 0) + 3; lim(A);
    return { ok: true, log: true, msg: `Você negocia com ${FACS[f][0].toLowerCase()}: a lealdade sobe.` };
  }
  const a = ACTIONS[op]; if (!a) return { ok: false, msg: '' };
  if (a.need && !a.need(A)) return { ok: false, msg: 'Requisito não atendido (lealdade dos sindicatos).' };
  if ((A.cd[op] || 0) > d) return { ok: false, msg: `Aguarde ${Math.ceil((A.cd[op] - d) / 7)} semana(s).` };
  A.ap--; const b = { s: A.support, f: A.force }; a.f(A);
  if (A.support > b.s) A.support = b.s + (A.support - b.s) * 0.55 * (1 - b.s / 110);
  if (A.force > b.f) A.force = b.f + (A.force - b.f) * 0.6 * (1 - b.f / 110);
  A.cd[op] = d + (op === 'strike' ? 28 : 7); lim(A);
  return { ok: true, log: true, msg: `${a.name}.` };
}

// ---------- Discursos da oposição ----------
export function ascSpeech(s, sp) {
  const A = s.ascent; if (A.ap < 1) return { ok: false, msg: 'Sem pontos de ação nesta semana.' };
  if (A.money < 1) return { ok: false, msg: 'Um comício precisa de ao menos 1 de dinheiro.' };
  A.ap--; A.money -= 1;
  const tone = TONES[sp.tone] || TONES.calmo, aud = sp.aud?.length ? sp.aud : ['unions'], topics = sp.topics || [];
  const skill = clamp(50 + A.cred * 0.25 + (sp.own ? rand(-22, 20) : rand(-8, 8) + 6), 5, 100), mood = (skill - 45) / 40;
  const lines = []; let sum = 0;
  for (const f of aud) {
    const g = FACS[f][1]; let score = tone[2][g] ?? 0;
    for (const t of topics) if (TOPICS[t]?.[1][g]) score += 3;
    score += (sp.promises?.length || 0) * 1.5;
    const delta = clamp(score * (0.6 + mood) * (0.4 + A.cred / 160), -9, 9) * 1.5;
    A.fac[f].loy += delta; sum += delta; lines.push({ g: f, delta, text: delta > 3.5 ? 'aplaudiu de pé' : delta > 1 ? 'reagiu bem' : delta > -1 ? 'ficou indiferente' : 'reagiu mal' });
  }
  const avg = sum / aud.length; A.support += Math.max(avg * 0.7 * 0.5 * (1 - A.support / 110), avg < 0 ? avg * 0.7 : 0); A.cred += avg > 2 ? 1 : avg < -1 ? -2 : 0; A.heat += sp.tone === 'agressivo' ? 4 : 1.5;
  for (const pr of sp.promises || []) A.promises.push({ ...pr, day: day(s) });
  const grade = skill > 78 ? 'Discurso memorável' : skill > 58 ? 'Bom discurso' : skill > 40 ? 'Discurso mediano' : 'Discurso desastroso';
  A.speeches.unshift({ day: day(s), grade, avg: +avg.toFixed(1) }); A.spoke++; lim(A);
  return { ok: true, log: true, msg: `${grade}: reação ${avg >= 0 ? '+' : ''}${avg.toFixed(1)}.`, result: { grade, avg, lines, skill: Math.round(skill), promises: sp.promises || [] } };
}

// ---------- Rotas ----------
export function routeInfo(s) {
  const A = s.ascent, str = regimeStr(s), fraud = (s.policies.elections === 'none' ? 28 : s.policies.elections === 'controlled' ? 16 : 5) + (s.st.control - 50) * 0.1;
  const off = A.fac.officers.loy;
  return {
    election: { name: 'Disputar as eleições', ok: A.support >= 40 && A.week >= 12, p: clamp((A.support - 32) / 38 + (A.cred - 50) / 220 - fraud / 100, 0.05, 0.95), need: 'apoio ≥ 40 e semana ≥ 12', risk: 'Se perder, há fraude e perseguição; o movimento continua.' },
    coup: { name: 'Dar o golpe', ok: A.force >= 40 && A.week >= 8, p: clamp((A.force - 30) / 45 + off / 320 - str / 220, 0.05, 0.9), need: 'força ≥ 40 e semana ≥ 8', risk: 'Se falhar: prisão ou morte.' },
    revolution: { name: 'Insurreição popular', ok: A.support >= 35 && A.force >= 30 && A.week >= 10, p: clamp((A.support + A.force - 55) / 80 - str / 260 + (s.st.protest - 40) / 250, 0.05, 0.88), need: 'apoio ≥ 35, força ≥ 30 e semana ≥ 10', risk: 'Se falhar: exílio ou fuzilamento.' },
  };
}
function takeRoute(s, route) {
  const A = s.ascent, R = routeInfo(s)[route]; if (!R || !R.ok) return { ok: false, msg: 'Requisitos não atendidos.' };
  const win = chance(R.p);
  if (win) return { ok: true, log: true, msg: ascend(s, route), done: true };
  if (route === 'election') { A.support = Math.max(0, A.support - 8); A.heat += 12; A.cred = clamp(A.cred - 3, 0, 100); note(A, s, 'A eleição é fraudada e você perde; o movimento continua.'); return { ok: true, log: true, msg: 'Derrota eleitoral, com acusações de fraude. O movimento segue vivo.' }; }
  if (route === 'coup') { if (chance(0.55)) endGame(s, 'killed', 'O golpe fracassou e você foi morto'); else endGame(s, 'trial', 'O golpe fracassou e você foi preso'); return { ok: true, log: true, msg: 'O golpe fracassa.' }; }
  endGame(s, chance(0.5) ? 'executed' : 'exile', 'A insurreição foi esmagada'); return { ok: true, log: true, msg: 'A insurreição é esmagada.' };
}
function ascend(s, route) {
  const A = s.ascent; s.ascent = null; s.flags.ascended = route;
  const P = (s.prop ||= {}); P.cred = A.cred; P.base = Math.round((A.fac.unions.loy + A.fac.rural.loy) / 12);
  P.promises ||= []; P.seq ||= 0;
  for (const pr of A.promises) { P.seq++; P.promises.push({ id: 'a' + P.seq, status: 'open', day: day(s), due: day(s) + 150, aud: 'workers', audKey: 'nation', ...pr, val: undefined }); }
  const g = s.groups, F = A.fac;
  for (const f in F) { const k = FACS[f][1]; g[k] = clamp((g[k] ?? 50) * 0.5 + F[f].loy * 0.5, 0, 100); }
  if (route === 'election') { s.st.legitimacy = clamp(55 + A.support / 4, 0, 100); s.st.political = clamp(s.st.political + 8, 0, 100); s.policies.elections = s.policies.elections === 'none' ? 'controlled' : s.policies.elections; return 'Vitória nas urnas! O movimento chega ao governo e as promessas da campanha passam a valer.'; }
  if (route === 'coup') { s.st.legitimacy = clamp(30 + A.force / 5, 0, 100); g.military = clamp(g.military + 15, 0, 100); s.st.reputation = clamp(s.st.reputation - 10, 0, 100); s.policies.elections = 'none'; return 'Tanques na capital: o golpe triunfa e você assume o poder.'; }
  s.st.legitimacy = clamp(40 + A.support / 4, 0, 100); s.st.stability = clamp(s.st.stability - 10, 0, 100); g.opposition = clamp(g.opposition - 20, 0, 100); return 'A revolução vence! O antigo regime cai e o povo celebra nas ruas.';
}

// ---------- Eventos semanais ----------
const E = (id, title, desc, opts, when = () => true, w = 1) => ({ id, title, desc, opts, when, w });
const O = (text, hint, eff) => ({ text, hint, eff });
export const EVENTS = [
  E('raid', 'Batida policial', 'A polícia política invade uma gráfica do movimento e prende dezenas de militantes.', [O('Denunciar publicamente.', 'Mártires rendem apoio; a pressão sobe.', { support: 3, cred: 2, heat: 6 }), O('Esconder o material e se recolher.', 'Protege a rede; perde ritmo.', { heat: -6, support: -2 }), O('Pagar advogados.', 'Custa dinheiro; salva militantes.', { money: -4, cred: 2, heat: -2 })], A => A.heat > 25, 1.4),
  E('defector', 'Um ministro rompe com o regime', 'Um ministro de segundo escalão oferece dados reais sobre a economia, em troca de proteção.', [O('Acolher e divulgar.', 'Escândalo para o governo.', { support: 4, cred: 3, heat: 5 }), O('Usar os dados em silêncio.', 'Vantagem estratégica.', { cred: 2, money: 2 }), O('Recusar: pode ser armadilha.', 'Segurança.', { heat: -2 })]),
  E('rival', 'Outra oposição disputa a liderança', 'Um rival populista rouba a cena com discursos incendiários e atrai jovens.', [O('Aliar-se a ele.', 'Soma apoio e risco de racha.', { support: 4, cred: -2, fac: { students: 4 } }), O('Atacá-lo.', 'Divide a oposição.', { support: -2, cred: -2, heat: -2 }), O('Ignorá-lo e trabalhar a base.', 'Disputa lenta.', { cred: 2, support: 1 })]),
  E('envoy', 'Emissário estrangeiro', 'Um diplomata sugere apoio financeiro "sem condições" ao movimento.', [O('Aceitar o dinheiro.', 'Dinheiro; a acusação de traição pesa.', { money: 8, cred: -5, support: -2 }), O('Aceitar só apoio político.', 'Moderado.', { cred: 2, heat: 3 }), O('Recusar e divulgar.', 'Credibilidade, sem dinheiro.', { cred: 4, support: 2 })], A => A.week >= 4),
  E('strike_wave', 'Operários param por conta própria', 'Uma fábrica entra em greve e pede apoio do movimento.', [O('Apoiar com dinheiro e advogados.', 'Sindicatos agradecem.', { money: -3, fac: { unions: 9 }, support: 3, heat: 4 }), O('Apoiar só politicamente.', 'Barato.', { fac: { unions: 4 }, support: 1 }), O('Não se envolver.', 'Perde a base.', { fac: { unions: -5 } })]),
  E('students', 'Marcha estudantil', 'Estudantes convocam uma marcha. A polícia monta barreiras.', [O('Entrar na marcha.', 'Visibilidade; risco de repressão.', { support: 5, fac: { students: 8 }, heat: 7 }), O('Enviar um representante.', 'Moderado.', { support: 2, fac: { students: 4 } }), O('Pedir calma.', 'Evita incidentes.', { heat: -3, fac: { students: -4 } })]),
  E('church', 'O clero se pronuncia', 'Um bispo critica o governo e cita o movimento como "voz dos humildes".', [O('Agradecer e apoiar a igreja.', 'Aliança moral.', { fac: { clergy: 10 }, support: 3 }), O('Manter distância.', 'Neutro.', {}), O('Pedir que não politize.', 'Ofende o clero.', { fac: { clergy: -6 } })]),
  E('scandal', 'Escândalo envolve o líder', 'Um jornal pró-governo publica acusações sobre seu passado, reais ou forjadas.', [O('Responder com documentos.', 'Cuidado: o tom importa.', { cred: 2, support: -2, money: -2 }), O('Processar o jornal.', 'Custa dinheiro; pode ser visto como censura.', { money: -4, cred: 1 }), O('Ignorar.', 'O boato cresce.', { cred: -4, support: -3 })], A => A.week >= 3, 0.8),
  E('martyr', 'Morte de um militante', 'Um militante morre sob custódia. Sua família pede que o caso não seja esquecido.', [O('Transformar em símbolo nacional.', 'Comoção; pressão sobe.', { support: 6, cred: 3, heat: 8 }), O('Funeral discreto.', 'Respeita a família.', { cred: 2 }), O('Exigir investigação na ONU.', 'Eleva a imagem.', { cred: 3, money: -2, heat: 3 })], A => A.heat > 30),
  E('officers_meet', 'Reunião com oficiais', 'Um coronel descontente quer saber se você "assumiria a ordem" em caso de caos.', [O('Garantir a ordem e prometer anistia.', 'Força.', { force: 6, fac: { officers: 8 }, cred: -2 }), O('Defender a Constituição.', 'Credibilidade, sem tanques.', { cred: 3, fac: { officers: -2 } }), O('Encerrar a conversa.', 'Seguro.', { heat: -2 })], A => A.fac.officers.loy > 15),
  E('hunger', 'Protestos contra a fome', 'Preços disparam e há filas por comida em bairros pobres.', [O('Organizar cozinhas populares.', 'Apoio duradouro; custa.', { money: -4, support: 5, cred: 3 }), O('Culpar o regime nos comícios.', 'Apoio rápido.', { support: 4, heat: 4 }), O('Não se expor.', 'Perde espaço.', { support: -2 })], A => A.support >= 15),
  E('bribe', 'O regime tenta comprar seu aliado', 'Um líder aliado recebe uma oferta de cargo e dinheiro do governo.', [O('Cobrir a oferta.', 'Custa dinheiro.', { money: -5, fac: { business: 2 } }), O('Deixá-lo ir.', 'Perde um aliado.', { support: -3, cred: 1 }), O('Denunciar a compra.', 'Escândalo contra o regime.', { cred: 3, support: 2, heat: 4 })], A => A.week >= 5),
  E('blackout', 'Apagão de mídia', 'O governo bloqueia redes sociais e censura jornais.', [O('Usar rádios clandestinas.', 'Mantém o alcance; arriscado.', { support: 2, heat: 6, money: -2 }), O('Panfletos e boca a boca.', 'Lento, seguro.', { support: 1, cred: 1 }), O('Esperar o bloqueio passar.', 'Perde ritmo.', { support: -3 })], A => A.heat > 20),
  E('donation', 'Um empresário oferece ajuda', 'Um grande empresário se oferece para financiar a campanha, com "pedidos discretos".', [O('Aceitar e prometer favores.', 'Dinheiro; compromissos.', { money: 9, fac: { business: 9 }, cred: -3 }), O('Aceitar sem favores.', 'Menos dinheiro.', { money: 4, fac: { business: 4 } }), O('Recusar.', 'Imagem limpa.', { cred: 3 })]),
  E('fraud_alert', 'Alerta de fraude eleitoral', 'Observadores avisam que a próxima eleição pode ser manipulada.', [O('Formar fiscais em todo o país.', 'Reduz a fraude; custa.', { money: -5, cred: 3, support: 1 }), O('Pedir observadores internacionais.', 'Ajuda externa.', { cred: 3, heat: 2 }), O('Boicotar a eleição.', 'Radical; arriscado.', { support: -4, heat: 6 })], A => A.week >= 6),
  E('safehouse', 'Casa de apoio descoberta', 'Uma casa de apoio é descoberta e invadida durante a madrugada.', [O('Mudar de endereço e líderes.', 'Protege a rede.', { money: -3, heat: -5 }), O('Reforçar a segurança.', 'Dissuade.', { force: 3, money: -2 }), O('Fazer da invasão um ato político.', 'Apoio e risco.', { support: 3, heat: 6 })], A => A.heat > 15),
  E('podcast', 'Seu discurso viraliza', 'Um trecho do seu discurso ganha milhões de visualizações, mas o regime já o chamou de "extremista".', [O('Aproveitar e dar entrevistas.', 'Apoio rápido.', { support: 5, cred: 1, heat: 5 }), O('Moderar o tom.', 'Fica menos exposto.', { support: 2, heat: -2 }), O('Desmentir a edição.', 'Se confunde com a verdade.', { cred: 2 })], A => A.spoke >= 1),
];
function eventCard(s) {
  const A = s.ascent, pool = EVENTS.filter(e => !A.seen.includes(e.id) && e.when(A, s));
  const ev = pool.length ? pool[Math.floor(rand(0, pool.length))] : pick(EVENTS);
  A.seen.push(ev.id); if (A.seen.length > 8) A.seen.shift();
  return { id: `dyn_ascent_${day(s)}`, dyn: true, crisis: true, keepInCrisis: true, cat: 'Alcance o poder', title: ev.title, desc: ev.desc, context: `Semana ${A.week} de ${MAX_WEEK}. Apoio ${Math.round(A.support)} · força ${Math.round(A.force)} · dinheiro ${Math.round(A.money)}. Faça suas jogadas na página do movimento.`, default: ev.opts.length - 1,
    options: ev.opts.map(o => ({ text: o.text, hint: o.hint, act: { type: 'ascent', choice: 'eff', eff: o.eff } })) };
}
export function applyEff(s, eff) {
  const A = s.ascent; if (!A || !eff) return;
  for (const k of ['support', 'force', 'money', 'cred', 'heat']) if (eff[k]) A[k] += eff[k];
  for (const f in eff.fac || {}) A.fac[f].loy += eff.fac[f];
  lim(A);
}

// ---------- Semana ----------
export function weeklyAscent(s, ctx) {
  const A = s.ascent; if (!A.fac) initAscent2(s);
  A.week++; A.ap = 3 + Math.floor(A.allies / 2) + (A.fac.students.loy > 60 ? 1 : 0);
  const reg = regimeStr(s), gov = s.d?.support ?? 50;
  // Apoio acompanha o desgaste do governo, as facções e a propaganda
  A.support -= 0.9; A.support += (50 - gov) / 25 + (A.fac.unions.loy + A.fac.students.loy + A.fac.rural.loy - 90) * 0.003;
  A.money += 1 + A.fac.business.loy / 45 - A.prop.pct * 0.5;
  A.force += (A.fac.officers.loy - 30) * 0.01;
  A.prop.level += (A.prop.pct / 3 * 100 - A.prop.level) * 0.1;
  const L = A.prop.level / 100; A.support += L * (0.4 + A.cred / 100) * 1.8; A.cred += L * 0.25 - 0.15;
  if (A.prop.pct * 0.5 > A.money) { A.prop.pct = Math.max(0, A.money / 0.5); }
  // Reação do regime: pressão acumulada vira repressão
  A.heat = A.heat * 0.97 + (A.force > 40 ? 0.6 : 0) + (gov < 30 ? -0.3 : 0);
  if (chance(clamp(A.heat / 130, 0, 0.6)) && A.week > 1) {
    const l = Math.round(rand(2, 6));
    A.force = Math.max(0, A.force - l); A.support = Math.max(0, A.support - 2); A.money = Math.max(0, A.money - 2); A.heat *= 0.7;
    ctx.news(`A polícia política prende ${l * 12} militantes do movimento.`, 'bad'); note(A, s, `Repressão: ${l * 12} militantes presos.`);
  }
  if ((A.risk || 0) > 0 && chance(A.risk / 300)) { A.force = Math.max(0, A.force - 12); A.support = Math.max(0, A.support - 5); A.risk = 0; ctx.news('O serviço secreto descobre uma conspiração entre oficiais.', 'bad'); }
  if (reg < 35 && chance(0.1)) { A.support += 3; ctx.news('O regime se mostra fraco: protestos crescem.', 'good'); }
  lim(A);
  if (A.week > MAX_WEEK) { endGame(s, 'exile', 'O movimento fracassou em chegar ao poder'); return; }
  ctx.card(eventCard(s));
}
export function ascentFirstCard2(s) { if (!s.ascent.fac) initAscent2(s); return eventCard(s); }
