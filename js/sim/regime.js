import { clamp, chance, rand } from './util.js';
import { DIFFICULTY } from './constants.js';
import { gdppc, tradeWeight, debtRatio } from './model.js';

const day = s => Math.floor(s.time.min / 1440);

export const ENDINGS = {
  junta: { title: 'Uma junta militar assume o poder', good: false, text: n => `Tanques cercaram o palácio de ${n.capital} ao amanhecer. Generais anunciaram na TV estatal que "a ordem foi restaurada" e que ${n.leader} está "sob custódia". Uma junta militar governa ${n.shortName} desde então.` },
  killed: { title: 'Morto durante o golpe', good: false, text: n => `Um grupo de oficiais invadiu a residência oficial. As versões sobre o que aconteceu com ${n.leader} divergem, mas o comunicado da madrugada foi curto: o líder está morto e um Conselho de Salvação Nacional assumiu.` },
  executed: { title: 'Executado após a revolução', good: false, text: n => `As multidões tomaram ${n.capital}. ${n.leader} foi capturado tentando fugir, julgado por um tribunal revolucionário improvisado e executado. Os novos líderes prometem um país diferente.` },
  trial: { title: 'Preso e julgado', good: false, text: n => `${n.leader} foi detido e levado a julgamento por corrupção e abusos de poder. O processo, transmitido ao vivo, tornou-se o símbolo do fim de uma era em ${n.shortName}.` },
  exile: { title: 'Fuga para o exílio', good: false, text: n => `Um avião decolou de madrugada de ${n.capital} com ${n.leader}, familiares e boa parte das reservas. O ex-governante vive hoje no exterior, protegido por antigos aliados.` },
  civilwar: { title: 'O país entra em guerra civil', good: false, text: n => `Com o Exército dividido e as regiões em revolta, ${n.shortName} mergulhou na guerra civil. ${n.leader} controla apenas parte da capital; o futuro do país é incerto.` },
  captured: { title: 'Capturado pelo inimigo', good: false, text: n => `Com a capital cercada e as linhas de defesa em colapso, a evacuação falhou. ${n.leader} foi capturado por tropas inimigas e levado diante de um tribunal de guerra. ${n.shortName} assina a rendição.` },
  occupation: { title: 'Intervenção estrangeira', good: false, text: n => `Tropas estrangeiras ocuparam ${n.capital}. ${n.leader} foi entregue a um tribunal internacional, e uma administração provisória governa ${n.shortName}.` },
  icc: { title: 'Cassado e preso pelo tribunal internacional', good: false, text: n => `Com o mandado do Tribunal Penal Internacional em aberto, ${n.leader} perdeu a proteção que restava. Foi detido e transferido a Haia para responder por crimes contra a humanidade. ${n.shortName} mergulha em uma transição turbulenta sob olhar do mundo.` },
  handover: { title: 'Entrega voluntária do poder', good: null, text: n => `Em um discurso breve, ${n.leader} anunciou que deixaria o governo. Um sucessor escolhido pelo partido assumiu sem disparos. A história ainda decidirá o legado do regime.` },
  democracy: { title: 'Transição democrática negociada', good: true, text: n => `Após meses de negociação com a oposição, ${n.leader} convocou eleições livres e entregou o poder pacificamente. ${n.shortName} entra em uma nova era como democracia, e o ex-governante é lembrado como o arquiteto da transição.` },
  vaporized: { title: 'Morto no ataque nuclear à capital', good: false, text: n => `O clarão foi visto a duzentos quilômetros. O palácio do governo em ${n.capital} deixou de existir em um milésimo de segundo — e ${n.leader} com ele. Uma junta de emergência, reunida às pressas no interior, assumiu o que restou de ${n.shortName}.` },
  nuclear: { title: 'Inverno nuclear', good: false, text: n => `As sirenes tocaram em ${n.capital} às 4h12. Quando a poeira baixou, não havia mais governo para contar a história. ${n.shortName} entrou para os livros como o país que cruzou a linha que ninguém deveria cruzar.` },
  modeWin: { title: 'Desafio cumprido', good: true, text: n => `${n.leader} cumpriu a missão. ${n.shortName} saiu da crise mais forte do que entrou — e o seu nome entrou para a história.` },
  modeLose: { title: 'Desafio fracassado', good: false, text: n => `O prazo acabou e a meta não foi alcançada. ${n.shortName} segue em crise, e ${n.leader} terá de explicar o que deu errado.` },
  modeEnd: { title: 'Fim da temporada', good: null, text: n => `Um ano no poder chega ao fim. Hora de contar os pontos de ${n.leader} e de ${n.shortName}.` },
  death: { title: 'Morte no cargo', good: null, text: n => `${n.leader} morreu no cargo. O funeral de Estado em ${n.capital} reuniu multidões — de admiradores e de curiosos. O que vem depois já não é a sua história.` },
  retired: { title: 'Aposentadoria triunfal', good: true, text: n => `Com metas alcançadas, ${n.leader} deixou o comando de ${n.shortName} em seus próprios termos, cercado de honras oficiais.` },
};

export const VICTORIES = {
  developed: { name: 'País desenvolvido', desc: 'PIB per capita 40% maior que no início, qualidade de vida ≥ 68, pobreza ≤ 12% e fome < 3%.' },
  regional: { name: 'Potência regional', desc: 'Influência regional ≥ 72 e projeção externa ≥ 50, sem derrota militar.' },
  hegemony: { name: 'Hegemonia econômica', desc: 'Estar entre as 3 maiores economias do mundo com 4+ acordos comerciais.' },
  enduring: { name: 'Regime duradouro', desc: 'Sobreviver 3 anos com estabilidade ≥ 55.' },
  integration: { name: 'Integração internacional', desc: 'Membro de 3+ organizações, reputação ≥ 72 e 5+ acordos comerciais.' },
  sphere: { name: 'Esfera de influência', desc: 'Fundar um bloco com 4+ membros e manter 2+ Estados clientes ou aliados com tratado de defesa.' },
  autarky: { name: 'Autossuficiência isolacionista', desc: 'Postura isolacionista por 180 dias, dependência alimentar e energética < 5% e estabilidade ≥ 60.' },
};

export function checkVictories(s, data, log) {
  const d = day(s);
  if (d < 120) return [];
  const st = s.st, got = [];
  const has = id => s.achievements.some(a => a.id === id);
  const test = {
    developed: () => gdppc(s) >= s.nation.startGdppc * 1.4 && st.qol >= 68 && st.poverty <= 12 && st.hunger < 3,
    regional: () => st.influence >= 72 && st.projection >= 50 && !s.flags.lostWar,
    hegemony: () => (s.world.rankings?.gdp?.pos || 999) <= 3 && Object.values(s.partners).filter(p => p.trade).length >= 4,
    enduring: () => d >= 1095 && st.stability >= 55,
    integration: () => Object.keys(s.orgs).length >= 3 && st.reputation >= 72 && tradeWeight(s, data) >= 5,
    sphere: () => s.world.blocs.some(b => b.members.length >= 4) && (Object.values(s.world.c).filter(c => c.puppetOf === 'PLY').length + Object.values(s.partners).filter(p => p.pact).length) >= 2,
    autarky: () => (s.counters.isoDays || 0) >= 180 && (s.sector.rows?.food.dep || 0) < 0.05 && (s.sector.rows?.energy.dep || 0) < 0.05 && st.stability >= 60,
  };
  for (const id in test) if (!has(id) && test[id]()) {
    s.achievements.push({ id, day: d });
    log(`Conquista: ${VICTORIES[id].name}!`, 'good');
    got.push(id);
  }
  return got;
}

export function endGame(s, ending, cause) {
  s.over = { ending, cause, day: day(s) };
}

export function resign(s) {
  const st = s.st;
  const good = st.legitimacy > 50 && st.political > 40 && st.stability > 45;
  const ending = s.achievements.length >= 2 && st.stability > 50 ? (st.political > 45 ? 'democracy' : 'retired') : good ? 'democracy' : st.legitimacy > 35 ? 'handover' : 'exile';
  endGame(s, ending, 'Decisão do governante');
}

export function dailyRegime(s, data, log, notify, hooks = {}) {
  const d = day(s), st = s.st, risk = DIFFICULTY[s.nation.difficulty].risk;
  s.counters.isoDays = s.policies.foreign === 'isolationist' ? (s.counters.isoDays || 0) + 1 : 0;
  if (d < 25) return;
  const G = s.groups;

  if (s.flags.occupationEnding) return endGame(s, 'occupation', 'Derrota militar e invasão');

  if (st.coupRisk > 60 && chance((st.coupRisk - 60) / 1600 * risk)) {
    s.flags.coupAttempt = 1;
    const p = clamp((st.coupRisk - 45) / 70 - st.intel / 300 + (40 - G.military) / 150, 0.1, 0.85);
    if (chance(p)) { if (hooks.uprising?.('coup', p)) return; return endGame(s, (s.d.repression > 30 || chance(0.3)) ? 'killed' : 'junta', `Golpe militar (risco ${st.coupRisk.toFixed(0)})`); }
    st.coupRisk = clamp(st.coupRisk - 25, 0, 100); G.military = clamp(G.military - 10, 0, 100); st.readiness -= 10;
    log('Tentativa de golpe fracassou! Oficiais rebeldes foram presos.', 'war');
    notify('Tentativa de golpe', `Unidades do Exército tentaram tomar o poder, mas forças leais resistiram (chance de sucesso era ${(p * 100).toFixed(0)}%). O risco de golpe caiu, mas os militares estão ressentidos.`);
  }

  if (st.revoRisk > 65 && chance((st.revoRisk - 65) / 1400 * risk)) {
    const p = clamp((st.revoRisk - st.control * 0.4 - G.military * 0.3) / 50, 0.1, 0.85);
    if (chance(p) && hooks.uprising?.('revolution', p)) return;
    if (chance(p)) {
      let ending = 'trial';
      if (G.military > 35 && G.military < 55) ending = 'civilwar';
      else if (s.econ.reserves > s.econ.gdp * 0.05 && Object.values(s.partners).some(x => x.rel > 50)) ending = 'exile';
      else if (s.d.repression > 35) ending = 'executed';
      return endGame(s, ending, `Revolução popular (risco ${st.revoRisk.toFixed(0)})`);
    }
    st.revoRisk = clamp(st.revoRisk - 20, 0, 100); st.protest = clamp(st.protest - 15, 0, 100);
    st.reputation = clamp(st.reputation - 8, 0, 100); G.opposition = clamp(G.opposition - 10, 0, 100);
    s.flags.atrocity = 1;
    s.longMods.push({ k: 'g_youth', v: -8, d: 365, left: 365, src: 'Repressão da revolta' }, { k: 'reputation', v: -8, d: 365, left: 365, src: 'Repressão da revolta' });
    for (const id in s.partners) if (((data.reg[id] || s.world.ents?.[id])?.profile?.liberty ?? 50) > 50) s.partners[id].rel -= 12;
    log('Levante popular esmagado pelas forças de segurança. Há mortos.', 'war');
    notify('Levante popular', `Uma insurreição tomou as ruas, mas o aparato de segurança conteve a revolta (chance de sucesso era ${(p * 100).toFixed(0)}%). A comunidade internacional condena a violência.`);
  }

  s.counters.lowStab = st.stability < 12 ? s.counters.lowStab + 1 : 0;
  if (s.counters.lowStab >= 25) return endGame(s, G.military > 45 ? 'civilwar' : 'exile', 'Colapso da autoridade do Estado');
  s.counters.hyper = st.inflation > 150 ? s.counters.hyper + 1 : 0;
  if (s.counters.hyper >= 60) return endGame(s, 'exile', 'Hiperinflação e colapso econômico');

  const sepR = s.regions.filter(r => !r.cap && (r.sep || 0) >= 0.3 && r.unrest > 70);
  if (sepR.length && st.separatism > 60 && st.control < 45 && d - (s.flags.secessionDay || -999) > 180 && chance(0.008 * risk) && hooks.secede) {
    const r = sepR.reduce((b, x) => x.unrest > b.unrest ? x : b, sepR[0]);
    s.flags.secessionDay = d;
    s.longMods.push({ k: 'legitimacy', v: -14, d: 365, left: 365, src: 'Secessão' });
    const name = hooks.secede(r);
    log(`${r.name} declarou independência como ${name}!`, 'bad');
    notify('Secessão', `Líderes de ${r.name} proclamaram a independência (${name}). O país perdeu população, território e prestígio; o novo Estado aparece no mapa.`);
  }

  if (st.protest > 62 && chance(0.012)) {
    s.longMods.push({ k: 'growth', v: -1.5, d: 30, left: 30, src: 'Greve geral' });
    log('Greve geral paralisa o país.', 'bad');
  }
  if (G.military < 25 && chance(0.01)) {
    st.readiness = clamp(st.readiness - 10, 0, 100);
    log('Motim em quartéis do interior; tropas se recusam a cumprir ordens.', 'bad');
  }
  if (st.protest > 50 && st.civil < 30 && chance(0.01)) {
    st.taxCapacity = clamp(st.taxCapacity - 4, 0, 100);
    log('Campanha de desobediência civil: cidadãos se recusam a pagar impostos.', 'warn');
  }
  if (debtRatio(s) > 150 && !s.flags.defaulted && chance(0.01)) {
    s.flags.defaulted = 1; s.econ.debt *= 0.6;
    s.longMods.push({ k: 'growth', v: -2, d: 365, left: 365, src: 'Calote' });
    log('Calote da dívida soberana! Credores cortam o crédito.', 'bad');
    notify('Calote', 'O governo deixou de pagar seus credores. Parte da dívida foi perdoada à força, mas o país perdeu acesso ao crédito e a reputação despencou.');
  }
  if (chance(0.0012)) {
    s.flags.disaster = d;
    const kind = rand() < 0.5 ? 'Enchentes devastadoras' : 'Um terremoto';
    s.econ.gdp *= 0.99; st.hunger += 3; st.qol -= 2;
    log(`${kind} atingiram o país. Ajuda humanitária é possível.`, 'bad');
  }
}
