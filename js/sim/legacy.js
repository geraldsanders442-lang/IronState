// Legado do governante: nota, texto histórico pronto, epitáfio e a possibilidade de "tentar a sorte" (retorno ao poder).
import { clamp, chance, rand, pick, bindRng } from './util.js';
import { fmtDate } from './util.js';
import { PLY, provincesOf, territoryChanged } from './world.js';
import { foundState } from './newstates.js';

const day = s => Math.floor(s.time.min / 1440);
const pct = (a, b) => (b ? (a / b - 1) * 100 : 0);
const f1 = n => (+n).toFixed(1).replace('.', ',');
const f0 = n => Math.round(+n).toLocaleString('pt-BR');
const DEAD = ['killed', 'executed', 'vaporized', 'nuclear', 'death'];
const VIOLENT = ['killed', 'executed', 'vaporized'];

export const GRADES = [
  { min: 85, g: 'S', title: 'Estadista lendário', color: '#c9a227' },
  { min: 72, g: 'A', title: 'Grande líder', color: '#2e8b3e' },
  { min: 58, g: 'B', title: 'Governante competente', color: '#5b8fd6' },
  { min: 44, g: 'C', title: 'Legado controverso', color: '#d48a2a' },
  { min: 30, g: 'D', title: 'Governo desastroso', color: '#c0392b' },
  { min: -999, g: 'F', title: 'Tirano ou catástrofe nacional', color: '#7a1d12' },
];

// Popularidade ao fim do governo (0-100).
export const popularity = s => clamp(0.6 * (s.d?.support ?? 50) + 0.4 * s.st.legitimacy, 0, 100);

// Nota de 0 a 100 do legado.
export function legacyIndex(s) {
  const f = s.final || { from: s.history[0], to: s.history.at(-1) }, a = f.from, b = f.to, st = s.st;
  const years = day(s) / 365;
  let v = 50;
  v += clamp(pct(b.gdppc, a.gdppc), -40, 80) * 0.22;
  v += clamp(a.poverty - b.poverty, -15, 20) * 0.7;
  v += clamp(b.qol - a.qol, -20, 25) * 0.45;
  v += ((b.civil + b.political) / 2 - 45) * 0.12;
  v += (popularity(s) - 50) * 0.22;
  v += (b.reputation - 50) * 0.1;
  v += Math.min(years, 12) * 0.9;
  v += s.achievements.length * 3.5;
  v -= Math.max(0, st.corruption - 45) * 0.25;
  v -= Math.max(0, (s.d?.repression || 0) - 25) * 0.25;
  v -= (s.flags.atrocity ? 14 : 0) + (s.flags.defaulted ? 6 : 0) + (s.flags.lostWar ? 6 : 0);
  v += s.flags.wonWar ? 4 : 0;
  if (VIOLENT.includes(s.over?.ending)) v -= 8;
  if (['nuclear', 'vaporized'].includes(s.over?.ending)) v -= 18;
  if (s.over?.ending === 'democracy' || s.over?.ending === 'retired') v += 8;
  return clamp(Math.round(v), 0, 100);
}
export const gradeOf = idx => GRADES.find(x => idx >= x.min);

// ---------- Epitáfio e memória ----------
function epitaph(s) {
  const n = s.nation, end = s.over?.ending, pop = popularity(s);
  if (end === 'vaporized') return `O local do palácio é hoje uma cratera cercada por cercas. Não houve enterro: ${n.leader} entrou para a história como a vítima mais ilustre do dia em que ${n.shortName} cruzou a linha.`;
  if (end === 'nuclear') return `Não sobrou ninguém para erguer um monumento a ${n.leader}. A memória de ${n.shortName} está nos livros dos países que sobreviveram.`;
  if (VIOLENT.includes(end)) {
    if (pop < 35) return `O enterro de ${n.leader} foi atendido apenas pela família, às pressas e sem honras. Poucos dias depois, a lápide foi depredada por civis e o nome, raspado da pedra.`;
    if (pop < 60) return `${n.leader} foi enterrado discretamente, sem honras de Estado. Alguns curiosos deixaram flores; outros, pichações. A cidade ainda discute se o túmulo deve ficar onde está.`;
    return `Apesar da violência do fim, milhares acompanharam o cortejo de ${n.leader} em silêncio. O túmulo virou lugar de peregrinação, e flores frescas aparecem todos os anos no aniversário da morte.`;
  }
  if (end === 'death') return pop < 40 ? `O funeral de Estado de ${n.leader} teve mais seguranças do que enlutados.` : `O funeral de ${n.leader} em ${n.capital} reuniu multidões, e a bandeira ficou a meio mastro por uma semana.`;
  if (pop < 30) return `As estátuas de ${n.leader} foram derrubadas e as praças com o seu nome, rebatizadas. Livros escolares tratam o governo como um erro a não repetir.`;
  if (pop < 55) return `A memória de ${n.leader} é dividida: há quem ponha flores em seus monumentos e quem peça que sejam retirados. Os historiadores ainda discutem.`;
  return `Ruas, escolas e um aeroporto de ${n.shortName} receberam o nome de ${n.leader}. Mesmo entre os adversários, poucos negam que o país mudou durante o seu governo.`;
}

// ---------- Texto do legado ----------
export function legacy(s, data, entName) {
  const n = s.nation, over = s.over || {}, end = over.ending, days = over.day ?? day(s), years = days / 365;
  const f = s.final || { from: s.history[0], to: s.history.at(-1) }, a = f.from, b = f.to;
  const idx = legacyIndex(s), G = gradeOf(idx), pop = popularity(s);
  const P = [];
  // 1. O governo
  P.push(`${n.leader} governou ${n.officialName} por ${f0(days)} dias (${f1(years)} anos), de ${fmtDate(0)} a ${fmtDate(days)}${s.mode && s.mode !== 'sandbox' ? `, no modo ${s.mode}` : ''}. ${n.alt ? 'Foi um governo de história alternativa, fora dos mapas tradicionais. ' : ''}${s.achievements.length ? `Entre as realizações reconhecidas estão: ${s.achievements.map(x => x.id).length} marcos nacionais.` : 'O governo terminou sem nenhum grande marco oficial.'}`);
  // 2. Economia
  const dg = pct(b.gdp, a.gdp), dpc = pct(b.gdppc, a.gdppc);
  const peak = s.history.reduce((m, h) => h.gdp > m.gdp ? h : m, s.history[0]);
  P.push(`Na economia, o PIB foi de ${f0(a.gdp)} para ${f0(b.gdp)} bilhões (${dg >= 0 ? '+' : ''}${f1(dg)}%) e a renda per capita ${dpc >= 0 ? 'subiu' : 'caiu'} ${f1(Math.abs(dpc))}%. ${peak.day > 30 && peak.gdp > b.gdp * 1.08 ? `O auge foi em ${fmtDate(peak.day)}, quando o PIB chegou a ${f0(peak.gdp)} bilhões; depois veio o declínio. ` : ''}A inflação terminou em ${f1(b.inflation)}% ao ano, o desemprego em ${f1(b.unemployment)}% e a dívida em ${f0(b.debt)}% do PIB.${s.flags.defaulted ? ' O país chegou a dar calote em seus credores.' : ''}`);
  // 3. O povo
  const dp = a.poverty - b.poverty;
  P.push(`Para o povo, a pobreza ${dp >= 0 ? 'caiu' : 'subiu'} de ${f1(a.poverty)}% para ${f1(b.poverty)}%, a fome terminou em ${f1(b.hunger)}% e a qualidade de vida foi de ${f0(a.qol)} para ${f0(b.qol)} pontos. A satisfação popular ao fim do governo era de ${f0(b.satisfaction)}/100 e o apoio ao regime, de ${f0(b.support)}/100 — ${pop >= 60 ? 'um governante querido por boa parte do país' : pop >= 40 ? 'um país dividido a respeito de seu líder' : 'um líder amplamente rejeitado'}.`);
  // 4. Liberdades e instituições
  const free = (b.civil + b.political) / 2, free0 = (a.civil + a.political) / 2;
  P.push(`Nas instituições, os direitos civis e a liberdade política somavam ${f0(free)} pontos (começaram em ${f0(free0)}): ${free - free0 > 6 ? 'o país ficou mais livre' : free0 - free > 6 ? 'o país ficou menos livre' : 'pouca coisa mudou'}. ${s.st.corruption > 60 ? `A corrupção, em ${f0(s.st.corruption)}, marcou a imagem do governo. ` : s.st.corruption < 30 ? 'A máquina pública terminou relativamente limpa. ' : ''}${(s.d?.repression || 0) > 40 ? 'A repressão foi parte do cotidiano. ' : ''}${s.gov?.removed ? `Foram destituídos ${s.gov.removed} governador(es) regionais. ` : ''}Foram decididas ${f0(s.issues.answered)} questões e ${f0(s.issues.ignored)} ficaram sem resposta.`);
  // 5. Mundo e guerras
  const wars = s.wars || [], won = wars.filter(w => ['victory'].includes(w.result)).length, lost = wars.filter(w => ['defeat', 'concession'].includes(w.result)).length;
  const gained = wars.reduce((t, w) => t + w.gained.length, 0), lostP = wars.reduce((t, w) => t + w.lost.length, 0);
  const treaties = Object.values(s.partners).filter(p => p.pact || (p.trade && p.rel > 40)).length;
  const newSt = (s.world?.newStates || []).filter(x => x.from === PLY).length;
  P.push(wars.length ? `Na política externa, ${n.shortName} travou ${wars.length} guerra(s): ${won} vitória(s), ${lost} derrota(s)${gained || lostP ? `, ${gained} província(s) conquistada(s) e ${lostP} perdida(s)` : ''}. Terminou com ${treaties} parceria(s) relevantes e reputação ${f0(b.reputation)}/100.${newSt ? ` Do território nacional nasceram ${newSt} novo(s) Estado(s).` : ''}` : `Na política externa, ${n.shortName} manteve a paz: ${treaties} parceria(s) relevantes, reputação ${f0(b.reputation)}/100${Object.keys(s.orgs).length ? ` e participação em ${Object.keys(s.orgs).length} organização(ões)` : ''}.${newSt ? ` Do território nacional nasceram ${newSt} novo(s) Estado(s).` : ''}`);
  // 6. Marcos históricos
  const marks = s.log.filter(l => ['war', 'bad', 'good'].includes(l.type) && l.text.length < 140).sort((x, y) => x.day - y.day);
  const pickN = (arr, k) => arr.length <= k ? arr : Array.from({ length: k }, (_, i) => arr[Math.floor(i * (arr.length - 1) / (k - 1))]);
  const chosen = pickN(marks, 8);
  // 7. Fim e veredito
  const verdict = {
    S: `Os historiadores são raros em unanimidade, mas aqui são: ${n.leader} figura entre os maiores governantes que ${n.shortName} já teve.`,
    A: `Os historiadores reconhecem um governo de grandes realizações, com defeitos que o tempo tende a suavizar.`,
    B: `O balanço é positivo: um governo competente, que deixou o país melhor do que encontrou, sem ser lembrado como excepcional.`,
    C: `O legado é controverso: tantos acertos quanto erros, e uma disputa constante sobre como ${n.leader} deve ser lembrado.`,
    D: `Os historiadores são duros: as consequências das decisões de ${n.leader} pesaram sobre o país por muitos anos.`,
    F: `A avaliação é severa: manuais de história usam o governo de ${n.leader} como exemplo do que não fazer.`,
  }[G.g];
  const tries = s.comeback ? (s.comeback.failed ? ` Sua tentativa de retornar ao poder (${fmtDate(s.comeback.day)}) fracassou.` : ` Em ${fmtDate(s.comeback.day)} voltou ao poder, ainda que em um país menor.`) : '';
  P.push(`${verdict}${tries}`);
  return { idx, grade: G, popularity: Math.round(pop), paragraphs: P, marks: chosen.map(l => `${fmtDate(l.day)} — ${l.text}`), epitaph: epitaph(s), dead: DEAD.includes(end), violent: VIOLENT.includes(end) };
}

// ---------- Tentar a sorte ----------
const INTRO = {
  trial: n => `Na sua cela, ${n.leader}, você ouve um barulho no corredor. Passos, vozes abafadas, o ranger de um portão. Do lado de fora, contrarrevolucionários gritam o seu nome: querem você de volta.`,
  exile: n => `No exílio, um mensageiro bate à porta de madrugada: oficiais leais a ${n.leader} e antigos ministros ofereceram um avião, dinheiro e uma região onde ainda lembram do governo com saudade. A pátria pode esperar.`,
  junta: n => `Sob custódia da junta, ${n.leader}, você ouve tiros distantes. Um oficial entra com uma chave: parte do Exército se rebelou contra os novos donos do poder e quer você à frente de uma contraofensiva.`,
  civilwar: n => `No meio do caos da guerra civil, ${n.leader}, aliados de confiança conseguem reunir as milícias leais em uma região que ainda lhe obedece. Há um pedaço do país onde o seu nome ainda vale alguma coisa.`,
  handover: n => `Alguns meses depois da saída, ${n.leader}, o sucessor falha em tudo. Delegações de apoiadores procuram você: o povo pede um retorno, ao menos em uma parte do país.`,
};
const ALLOWED = ['trial', 'exile', 'junta', 'civilwar', 'handover'];

export function comebackInfo(s) {
  const end = s.over?.ending, n = s.nation, pop = popularity(s);
  if (!s.over) return { allowed: false, reason: 'O jogo não terminou.' };
  if (s.comeback?.used) return { allowed: false, reason: 'Você já tentou voltar ao poder uma vez.' };
  if (VIOLENT.includes(end)) return { allowed: false, reason: `${n.leader} está morto. Não há retorno possível.` };
  if (!ALLOWED.includes(end)) return { allowed: false, reason: end === 'vaporized' || end === 'nuclear' ? 'Não restou nada a reconquistar.' : 'Este final não permite voltar ao poder.' };
  const allies = Object.values(s.partners).filter(p => p.rel > 50).length;
  const chanceV = clamp(0.1 + (pop - 30) / 150 + (end === 'civilwar' ? 0.18 : end === 'exile' ? 0.08 : end === 'handover' ? 0.15 : end === 'trial' ? -0.04 : 0) + allies * 0.006 - (s.flags.atrocity ? 0.08 : 0) - ((s.d?.repression || 0) > 40 ? 0.05 : 0), 0.04, 0.8);
  return { allowed: true, chance: chanceV, intro: INTRO[end](n), popularity: Math.round(pop) };
}

// Escolhe a parte do país que ainda lhe obedece (cerca de 20-35% da população).
function strongholdProvs(s, data) {
  const mine = provincesOf(s, data, PLY).filter(p => !s.world.occ[p]);
  if (mine.length <= 1) return { keep: mine, rest: [] };
  const P = data.geo.prov, popOf = p => P[p].pop || 1, tot = mine.reduce((t, p) => t + popOf(p), 0);
  const regs = s.regions.filter(r => !r.cap && r.provinces.some(p => mine.includes(p)));
  let keep = [];
  if (regs.length) {
    const r = regs.reduce((b, x) => (x.unrest - x.popShare * 20) < (b.unrest - b.popShare * 20) ? x : b, regs[0]);
    keep = r.provinces.filter(p => mine.includes(p));
  }
  const seed = keep.length ? keep.reduce((b, p) => popOf(p) > popOf(b) ? p : b, keep[0]) : mine.reduce((b, p) => popOf(p) > popOf(b) ? p : b, mine[0]);
  if (!keep.length) {
    const sorted = [...mine].sort((x, y) => Math.hypot(P[x].c[0] - P[seed].c[0], P[x].c[1] - P[seed].c[1]) - Math.hypot(P[y].c[0] - P[seed].c[0], P[y].c[1] - P[seed].c[1]));
    let acc = 0; for (const p of sorted) { keep.push(p); acc += popOf(p); if (acc / tot >= 0.25) break; }
  }
  // Não deixa mais de 40% do país nem menos de uma província; sempre sobra algo para o novo regime.
  while (keep.length > 1 && keep.reduce((t, p) => t + popOf(p), 0) / tot > 0.4) keep.pop();
  let rest = mine.filter(p => !keep.includes(p));
  if (!rest.length && keep.length > 1) { rest = [keep.pop()]; }
  return { keep, rest };
}

const USURPER = {
  trial: { pre: 'República Revolucionária de', ideo: 'Governo revolucionário', liberty: 45, regime: 'hybrid' },
  exile: { pre: 'Governo Provisório de', ideo: 'Governo provisório', liberty: 55, regime: 'hybrid' },
  junta: { pre: 'Junta de Salvação de', ideo: 'Junta militar', liberty: 15, regime: 'auth' },
  civilwar: { pre: 'Frente Rebelde de', ideo: 'Frente rebelde', liberty: 30, regime: 'hybrid' },
  handover: { pre: 'Governo Sucessor de', ideo: 'Sucessão fracassada', liberty: 50, regime: 'flawed' },
};

// Resultado do sorteio: devolve {ok, text} e, em caso de sucesso, reescreve o estado para continuar a campanha.
export function tryComeback(s, data, ctx) {
  const info = comebackInfo(s);
  if (!info.allowed) return { ok: false, text: info.reason, blocked: true };
  bindRng(s);
  const end = s.over.ending, n = s.nation, pop = popularity(s);
  const win = chance(info.chance);
  s.comeback = { used: true, day: day(s), from: end, chance: info.chance, failed: !win };
  if (!win) {
    const fail = {
      trial: `O barulho era só uma rebelião de presos, sufocada em minutos. Na manhã seguinte, a guarda dobrou e a sentença foi confirmada. ${n.leader} não verá mais a luz do dia fora da prisão.`,
      exile: `A viagem de volta foi denunciada antes de o avião pousar. As autoridades fecharam o espaço aéreo e os apoiadores foram presos. ${n.leader} continua no exílio, agora vigiado.`,
      junta: `A rebelião militar foi esmagada em dois dias. Os oficiais amotinados foram fuzilados e a junta endureceu o regime. ${n.leader} segue preso, em condições piores.`,
      civilwar: `As milícias leais foram cercadas e dispersadas. Sem território, ${n.leader} desaparece nas montanhas e a guerra civil prossegue sem o seu nome.`,
      handover: `A campanha pelo retorno esbarrou na máquina do sucessor, que cassou os apoiadores. ${n.leader} voltou à vida privada.`,
    }[end];
    s.over.comebackFailed = fail;
    return { ok: false, text: fail };
  }
  // ---- Sucesso: assume uma parte pequena do território ----
  const { keep, rest } = strongholdProvs(s, data);
  const total = provincesOf(s, data, PLY).length;
  const share = keep.length ? keep.reduce((t, p) => t + (data.geo.prov[p].pop || 1), 0) / Math.max(1, [...keep, ...rest].reduce((t, p) => t + (data.geo.prov[p].pop || 1), 0)) : 1;
  const U = USURPER[end] || USURPER.exile;
  if (rest.length) {
    const nm = `${U.pre} ${n.shortName}`;
    const fl = { layout: 'h3', colors: end === 'junta' ? ['#3d4a2a', '#111111', '#3d4a2a'] : ['#7a1d12', '#f2f2f2', '#1d2b45'], emblems: [{ type: end === 'junta' ? 'swords' : 'star', color: '#f2c400', x: 0.5, y: 0.5, s: 0.34 }] };
    const id = foundState(s, data, ctx, { pids: rest, from: PLY, movement: { name: nm, short: nm, culture: n.culture, ideo: U.ideo, flag: fl, profile: { liberty: U.liberty, market: 50, religiosity: 30, align: 'N', milIntensity: 1.3, regime: U.regime } }, why: 'assume o poder após a queda de ' + n.leader });
    const c = s.world.c[id];
    if (c) { c.troops = Math.max(5, s.st.troops * (1 - share) * 0.8); c.equip = s.st.equipment * 0.8; c.stab = 45; c.mobil = false; }
  }
  territoryChanged(s);
  // Estado do jogador: pequeno, instável, mas com o apoio que ainda tem.
  s.over = null; delete s.final; s.scored = false;
  s.st.troops = Math.max(2, s.st.troops * share * 0.6);
  s.econ.debt *= share; s.econ.treasury = s.econ.gdp * 0.004; s.econ.printed = 0;
  const start = clamp(pop * 0.7 + 22 + (end === 'civilwar' ? 5 : 0), 25, 85);
  s.st.legitimacy = clamp(start, 20, 85); s.st.stability = clamp(38 + pop * 0.15, 25, 60);
  s.st.coupRisk = 30; s.st.revoRisk = 25; s.st.protest = clamp(40 - pop * 0.2, 5, 50); s.st.readiness = 55;
  for (const g in s.groups) s.groups[g] = clamp(s.groups[g] * 0.4 + start * 0.6 + rand(-6, 6), 10, 95);
  s.groups.military = clamp(s.groups.military + 8, 0, 100);
  s.counters.lowStab = 0; s.counters.hyper = 0;
  delete s.flags.fled; delete s.flags.evacuated; delete s.flags.occupationEnding;
  if (s.pol) { s.pol.uprising = null; if (s.pol.leader) s.pol.leader.health = Math.max(s.pol.leader.health, 60); }
  for (const w of s.wars) if (w.active) { w.active = false; w.result = 'ceasefire'; w.end = day(s); }
  for (const p of keep) delete s.world.occ[p];
  if (keep.length) { const big = keep.reduce((b, p) => (data.geo.prov[p].pop || 0) > (data.geo.prov[b].pop || 0) ? p : b, keep[0]); s.nation.capitalProv = big; s.nation.capital = data.geo.prov[big].n; }
  s.regionsDirty = true;
  const text = `${n.leader} volta ao poder, agora à frente de uma parte pequena do país (${keep.length} de ${total} províncias, cerca de ${Math.round(share * 100)}% da população), com legitimidade ${Math.round(s.st.legitimacy)} e a missão de reconquistar o que foi perdido.`;
  ctx.log?.(text, 'good');
  return { ok: true, text, keep: keep.length, total };
}
