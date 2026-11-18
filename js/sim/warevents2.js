// Eventos de campanha adicionais (fase 3): cerco, civis, prisioneiros, clima, sabotagem, imprensa, generais, ajuda externa,
// desertores, ultimatos e desdobramentos encadeados. Cada evento devolve uma carta de 3 opções e um resultado.
import { clamp, chance, pick } from './util.js';
import { addWarCrime } from './order.js';

const day = s => Math.floor(s.time.min / 1440);
const spend = (s, p) => { s.econ.treasury -= s.econ.gdp * p; };
const corpsOf = (s, w) => (s.forces?.corps || []).filter(c => c.war === w.id);
const hit = (s, w, role, d) => { for (const c of corpsOf(s, w)) if (!role || c.role === role) c.strength = clamp(c.strength + d, 5, 100); };
const st = (s, k, v) => { s.st[k] = clamp((s.st[k] ?? 0) + v, 0, 100); };
const grp = (s, g, v) => { s.groups[g] = clamp((s.groups[g] ?? 50) + v, 0, 100); };
const supply = (s, v) => { if (s.camp) s.camp.supply = clamp(s.camp.supply + v, 0, 120); };
const later = (w, s, kind, days) => { (w.evq ||= []).push({ kind, at: day(s) + days }); };
const enemy = (s, w) => s.world.c[w.enemy];
const O = (text, hint, k) => ({ text, hint, k });
const P = (s, data, T) => data.geo.prov[T?.pid]?.n || 'a cidade';

export const EVENTS2 = {
  siege: {
    ok: (s, w) => !!w.target && w.target.p > 35 && w.stance === 'offensive', w: () => 1.4,
    card: (s, data, w, nm) => ({ title: `Cerco a ${P(s, data, w.target)}`, desc: `Suas tropas cercaram ${P(s, data, w.target)}, onde ${nm} concentrou defensores e civis. Os generais discutem como tomar a cidade.`, context: 'Assalto é rápido e sangrento; cerco poupa soldados, mas esgota os civis.', default: 1,
      options: [O('Assalto direto à cidade.', 'Avanço grande; perdas pesadas e risco para civis.', 'assault'), O('Cerco e bombardeio de desgaste.', 'Lento; esgota o inimigo, mas há fome entre civis.', 'starve'), O('Contornar a cidade e seguir adiante.', 'Preserva tropas; deixa uma bolsa inimiga.', 'bypass')] }),
    res: (s, data, w, k) => {
      if (k === 'assault') { if (w.target) w.target.p = Math.min(95, w.target.p + 22); hit(s, w, 'attack', -9); s.st.troops = Math.max(1, s.st.troops * 0.995); addWarCrime(s, 0.8); later(w, s, 'civilians', 6); return 'O assalto rompe as defesas, com perdas pesadas e muitas vítimas civis.'; }
      if (k === 'starve') { w.enemyExh = Math.min(100, w.enemyExh + 8); if (w.target) w.target.p = Math.min(95, w.target.p + 8); supply(s, -2); later(w, s, 'civilians', 10); return 'O cerco aperta: o inimigo se esgota, mas a fome atinge a cidade.'; }
      if (w.target) w.target.p = Math.min(95, w.target.p + 12); hit(s, w, null, -2); return 'As tropas contornam a cidade e seguem adiante, deixando uma bolsa de resistência para trás.';
    } },
  civilians: {
    ok: () => false, w: () => 0,
    card: (s, data, w, nm) => ({ title: 'Civis presos na zona de combate', desc: `Dezenas de milhares de civis estão presos entre as linhas, sem comida nem água. A Cruz Vermelha pede passagem e ${nm} acusa você de usá-los como escudo.`, context: 'A imagem do país no mundo depende disto.', default: 2,
      options: [O('Abrir um corredor humanitário.', 'Salva civis; o inimigo respira.', 'corridor'), O('Evacuar só os civis amigos.', 'Seletivo; críticas internacionais.', 'select'), O('Manter a pressão militar.', 'Efeito militar; risco de crimes de guerra.', 'press')] }),
    res: (s, data, w, k) => {
      if (k === 'corridor') { st(s, 'reputation', 3); w.enemyExh = Math.max(0, w.enemyExh - 3); addWarCrime(s, -0.5); return 'O corredor humanitário salva milhares de civis; a imagem do país melhora.'; }
      if (k === 'select') { st(s, 'reputation', -1.5); addWarCrime(s, 0.4); return 'A evacuação seletiva vira polêmica na imprensa internacional.'; }
      st(s, 'reputation', -4); addWarCrime(s, 2); grp(s, 'military', 2); return 'A pressão continua e o número de civis mortos choca o mundo.';
    } },
  prisoners: {
    ok: (s, w) => w.cas > 2 && (w.gained.length > 0 || w.stance === 'offensive'), w: () => 0.9,
    card: (s, data, w, nm) => ({ title: 'Prisioneiros de guerra', desc: `Milhares de soldados de ${nm} se renderam. Faltam campos, comida e guardas, e ${nm} propõe uma troca.`, context: 'O tratamento dos prisioneiros será julgado pela imprensa e pelos tribunais internacionais.', default: 0,
      options: [O('Tratar conforme as convenções e propor troca.', 'Reputação; custa recursos.', 'convention'), O('Usar como mão de obra forçada.', 'Ganha recursos; é crime de guerra.', 'labor'), O('Manter em campos improvisados.', 'Barato; abusos prováveis.', 'camps')] }),
    res: (s, data, w, k) => {
      if (k === 'convention') { spend(s, 0.001); st(s, 'reputation', 2); w.enemyExh = Math.max(0, w.enemyExh - 2); return 'Os prisioneiros são tratados conforme as convenções e uma troca é negociada.'; }
      if (k === 'labor') { supply(s, 2); addWarCrime(s, 3); st(s, 'reputation', -4); return 'O trabalho forçado de prisioneiros rende recursos e um escândalo.'; }
      addWarCrime(s, 1.2); st(s, 'reputation', -1.5); return 'Os campos improvisados são denunciados por organizações humanitárias.';
    } },
  weather: {
    ok: (s, w) => !!(w.target || w.etarget), w: () => 1.2,
    card: (s, data, w) => ({ title: 'O clima muda o campo de batalha', desc: 'Chuvas torrenciais (ou nevascas) transformaram as estradas em lama e congelaram a logística nas duas pontas da frente.', context: 'O clima favorece quem está entrincheirado.', default: 1,
      options: [O('Suspender as operações e se entrincheirar.', 'Poupa tropas; a frente estagna.', 'dig'), O('Forçar o avanço mesmo assim.', 'Aposta: pode surpreender o inimigo ou atolar.', 'push'), O('Investir em engenharia e logística de inverno.', 'Custa suprimentos; ajuda nas próximas semanas.', 'logi')] }),
    res: (s, data, w, k) => {
      if (k === 'dig') { if (w.target) w.target.p = Math.max(0, w.target.p - 4); st(s, 'defense', 1); hit(s, w, null, 3); return 'As tropas se entrincheiram; a frente fica parada, mas as perdas caem.'; }
      if (k === 'push') { if (chance(0.45) && w.target) { w.target.p = Math.min(95, w.target.p + 16); return 'O avanço pega o inimigo desprevenido e rende terreno.'; } hit(s, w, 'attack', -10); supply(s, -2); return 'As viaturas atolam e o avanço vira um desastre logístico.'; }
      supply(s, -2); st(s, 'logistics', 2); w.reinforce = Math.max(w.reinforce, 3); return 'Engenheiros reabrem estradas e depósitos de inverno; a logística melhora.';
    } },
  sabotage: {
    ok: () => true, w: () => 0.9,
    card: (s, data, w, nm) => ({ title: 'Sabotagem na retaguarda', desc: `Agentes de ${nm} explodiram depósitos e ferrovias atrás das suas linhas. Há suspeitas de infiltrados entre ferroviários e oficiais.`, context: 'Segurança custa dinheiro e liberdade.', default: 2,
      options: [O('Reforçar a contrainteligência e a segurança.', 'Custa; reduz novos ataques.', 'secure'), O('Retaliar com sabotagem própria.', 'Prejudica o inimigo; risco de escalada.', 'retaliate'), O('Aceitar as perdas.', 'Sem custo agora; logística sofre.', 'ignore')] }),
    res: (s, data, w, k) => {
      if (k === 'secure') { spend(s, 0.001); st(s, 'intel', 2); st(s, 'civil', -1); return 'A contrainteligência prende infiltrados; a retaguarda se estabiliza.'; }
      if (k === 'retaliate') { w.enemyExh = Math.min(100, w.enemyExh + 5); st(s, 'reputation', -1); supply(s, -1); return 'Suas equipes sabotam depósitos inimigos; a guerra nas sombras escala.'; }
      supply(s, -3); st(s, 'logistics', -1.5); return 'Depósitos queimam; os suprimentos chegam tarde às unidades.';
    } },
  rebel_general: {
    ok: s => corpsOf(s, { id: null }).length >= 0 && (s.forces?.corps || []).some(c => c.gen?.skill > 60), w: () => 0.8,
    card: (s) => { const g = [...(s.forces?.corps || [])].sort((a, b) => (b.gen?.skill || 0) - (a.gen?.skill || 0))[0]; return { title: `${g?.gen?.name || 'Um general'} desafia o comando`, desc: `${g?.gen?.name || 'Um general'}, popular entre as tropas, critica publicamente a estratégia do governo e exige mais autonomia no campo.`, context: 'Generais vitoriosos ganham fama — e ambição.', default: 1,
      options: [O('Dar mais autonomia ao general.', 'Eleva a eficácia; cresce o risco de golpe.', 'free'), O('Chamá-lo à capital e repreender.', 'Mantém o controle; cai o moral.', 'scold'), O('Demiti-lo.', 'Elimina o problema; perde competência.', 'sack')] }; },
    res: (s, data, w, k) => {
      const g = [...(s.forces?.corps || [])].sort((a, b) => (b.gen?.skill || 0) - (a.gen?.skill || 0))[0];
      if (k === 'free') { st(s, 'coupRisk', 4); if (w.target) w.target.p = Math.min(95, w.target.p + 6); grp(s, 'military', 3); return 'O general recebe autonomia e vence escaramuças, e as ambições crescem.'; }
      if (k === 'scold') { hit(s, w, null, -3); grp(s, 'military', -2); return 'A repreensão mantém a hierarquia, com o moral abalado.'; }
      if (g) { g.gen.skill = 45; g.gen.name = 'Gen. substituto'; } grp(s, 'military', -5); st(s, 'coupRisk', 2); return 'O general é demitido; um substituto menos experiente assume.';
    } },
  airraid: {
    ok: () => true, w: () => 1,
    card: (s, data, w, nm) => ({ title: `Ataques aéreos de ${nm} contra cidades`, desc: `Bombardeiros e mísseis de ${nm} atingem usinas e bairros residenciais. Há mortos e apagões em várias cidades.`, context: 'A defesa aérea e a moral civil estão em jogo.', default: 0,
      options: [O('Investir em defesa antiaérea e abrigos.', 'Custa; reduz danos futuros.', 'aa'), O('Dispersar a indústria e a energia.', 'Barato e lento; reduz a vulnerabilidade.', 'disperse'), O('Retaliar bombardeando cidades inimigas.', 'Resposta emocional; crime de guerra.', 'retaliate')] }),
    res: (s, data, w, k) => {
      if (k === 'aa') { spend(s, 0.002); st(s, 'defense', 2); st(s, 'stability', 1); return 'Baterias antiaéreas e abrigos reduzem os danos.'; }
      if (k === 'disperse') { s.econ.gdp *= 0.999; st(s, 'industry', -0.3); st(s, 'defense', 1); return 'A indústria é dispersa; a produção cai um pouco, mas o país fica menos vulnerável.'; }
      w.enemyExh = Math.min(100, w.enemyExh + 6); addWarCrime(s, 2.5); st(s, 'reputation', -5); return 'Cidades inimigas são bombardeadas, com condenação internacional.';
    } },
  ally_aid: {
    ok: s => Object.values(s.partners).some(p => p.rel > 25), w: () => 0.9,
    card: (s, data, w) => ({ title: 'Um aliado oferece armas', desc: 'Um país amigo oferece remessas de armas e munição, mas exige influência em suas decisões e acesso a portos.', context: 'Ajuda tem preço político.', default: 1,
      options: [O('Aceitar tudo.', 'Muitos suprimentos; menos autonomia.', 'accept'), O('Aceitar só armas, sem bases.', 'Menos ajuda; mais soberania.', 'weapons'), O('Recusar.', 'Autonomia total; sem reforço.', 'refuse')] }),
    res: (s, data, w, k) => {
      if (k === 'accept') { supply(s, 8); st(s, 'equipment', 3); st(s, 'influence', -3); return 'Armas e munição chegam em abundância; o aliado ganha voz no gabinete.'; }
      if (k === 'weapons') { supply(s, 4); st(s, 'equipment', 1.5); return 'Armas chegam sem condições de bases.'; }
      st(s, 'influence', 1); return 'Você recusa a ajuda e mantém a autonomia.';
    } },
  defector: {
    ok: (s, w) => !!w.target, w: () => 0.8,
    card: (s, data, w, nm) => ({ title: `Oficial de ${nm} deserta`, desc: `Um coronel inimigo cruzou as linhas com mapas das posições de ${nm}, pedindo asilo para a família.`, context: 'Pode ser um oficial sincero ou uma armadilha.', default: 0,
      options: [O('Usar o plano de imediato.', 'Grande vantagem se for verdadeiro; risco de armadilha.', 'use'), O('Verificar primeiro com a inteligência.', 'Atraso, mas seguro.', 'verify'), O('Recusar o asilo.', 'Sem risco; perde a oportunidade.', 'refuse')] }),
    res: (s, data, w, k) => {
      if (k === 'use') { if (chance(0.65) && w.target) { w.target.p = Math.min(95, w.target.p + 18); w.enemyExh = Math.min(100, w.enemyExh + 4); return 'O plano era verdadeiro: tropas surpreendem o inimigo.'; } hit(s, w, 'attack', -12); return 'Era uma armadilha: as tropas caem numa emboscada.'; }
      if (k === 'verify') { st(s, 'intel', 2); if (w.target) w.target.p = Math.min(95, w.target.p + 8); return 'A inteligência confirma os mapas; a operação segue com cuidado.'; }
      return 'Você recusa o oficial; a oportunidade passa.';
    } },
  press: {
    ok: () => true, w: () => 0.9,
    card: (s) => ({ title: 'A imprensa quer ir ao front', desc: 'Jornalistas nacionais e estrangeiros pedem credenciais para acompanhar as tropas na linha de frente.', context: 'Transparência ajuda a imagem, mas também revela erros e crimes.', default: 1,
      options: [O('Liberar o acesso.', 'Imagem e credibilidade; risco de revelações.', 'open'), O('Permitir só jornalistas escolhidos.', 'Controle; críticas por censura.', 'embed'), O('Proibir a imprensa no front.', 'Esconde falhas; alimenta desconfiança.', 'ban')] }),
    res: (s, data, w, k) => {
      const P = s.prop; if (k === 'open') { st(s, 'reputation', 2); if (P) P.cred = clamp(P.cred + 3, 0, 100); if (chance(0.3)) { addWarCrime(s, 1); return 'Repórteres revelam abusos de uma unidade; mas a credibilidade do governo cresce.'; } return 'A cobertura livre melhora a credibilidade do governo.'; }
      if (k === 'embed') { st(s, 'civil', -0.5); if (P) P.cred = clamp(P.cred + 1, 0, 100); return 'Jornalistas escolhidos acompanham as tropas.'; }
      st(s, 'civil', -1.5); st(s, 'reputation', -1); if (P) P.cred = clamp(P.cred - 3, 0, 100); return 'A proibição provoca suspeitas de que o governo esconde algo.';
    } },
  profiteers: {
    ok: () => true, w: () => 0.8,
    card: (s) => ({ title: 'Lucros de guerra', desc: 'Fornecedores de armas e alimentos faturam bilhões com a guerra. Opositores falam em "profiteers" e pedem medidas.', context: 'A guerra enriquece alguns e empobrece muitos.', default: 2,
      options: [O('Taxar os lucros extraordinários.', 'Receita; irrita empresários.', 'tax'), O('Estatizar fornecedores estratégicos.', 'Controle; custa e atrai críticas liberais.', 'nationalize'), O('Deixar o mercado agir.', 'Produção maior; ressentimento popular.', 'ignore')] }),
    res: (s, data, w, k) => {
      if (k === 'tax') { s.econ.treasury += s.econ.gdp * 0.0015; grp(s, 'business', -3); grp(s, 'workers', 2); return 'Os lucros extraordinários são taxados e ajudam o caixa.'; }
      if (k === 'nationalize') { spend(s, 0.001); supply(s, 3); grp(s, 'business', -5); st(s, 'corruption', -1); return 'Fornecedores estratégicos são estatizados e a produção militar sobe.'; }
      supply(s, 2); grp(s, 'workers', -2); st(s, 'corruption', 1.5); return 'O mercado fornece mais, mas o ressentimento popular cresce.';
    } },
  scorched: {
    ok: (s, w) => !!w.etarget && w.etarget.p > 40, w: (s, w) => 1.1,
    card: (s, data, w, nm) => ({ title: 'Terra arrasada no recuo', desc: `${nm} avança sobre ${P(s, data, w.etarget)}. Os comandantes propõem queimar plantações, pontes e depósitos para atrasar o inimigo.`, context: 'Destruir o próprio território atrasa o inimigo, mas pune a população.', default: 1,
      options: [O('Ordenar a terra arrasada.', 'O inimigo atrasa; sua população sofre.', 'burn'), O('Destruir só pontes e depósitos militares.', 'Atraso moderado, sem civis atingidos.', 'bridges'), O('Defender sem destruir.', 'Preserva o país; o inimigo avança mais rápido.', 'hold')] }),
    res: (s, data, w, k) => {
      if (k === 'burn') { if (w.etarget) w.etarget.p = Math.max(0, w.etarget.p - 14); st(s, 'hunger', 3); st(s, 'qol', -2); grp(s, 'rural', -5); return 'A terra arrasada atrasa o inimigo, mas camponeses perdem tudo.'; }
      if (k === 'bridges') { if (w.etarget) w.etarget.p = Math.max(0, w.etarget.p - 7); return 'Pontes e depósitos são destruídos; o avanço inimigo desacelera.'; }
      return 'Você defende sem destruir; o inimigo avança sem obstáculos.';
    } },
  ultimatum: {
    ok: (s, w) => w.score < -20 || w.score > 25, w: () => 0.9,
    card: (s, data, w, nm) => ({ title: `Ultimato de ${nm}`, desc: w.score < 0 ? `${nm} exige que você entregue territórios e reduza o exército em 10 dias, sob ameaça de uma ofensiva total.` : `Seus generais propõem enviar um ultimato a ${nm}, exigindo concessões imediatas sob ameaça de uma ofensiva total.`, context: 'Ultimatos fecham portas diplomáticas.', default: 1,
      options: [O('Aceitar negociar os termos.', 'Abre a diplomacia; custa prestígio.', 'talk'), O('Rejeitar e endurecer.', 'Orgulho; a guerra fica mais dura.', 'reject'), O('Ganhar tempo pedindo mediação.', 'Chance de acordo melhor; atrasa a frente.', 'mediate')] }),
    res: (s, data, w, k) => {
      const c = enemy(s, w);
      if (k === 'talk') { if (c) c.nego = clamp((c.nego || 40) + 20, 0, 100); st(s, 'legitimacy', -1.5); return 'As conversas abrem um canal de negociação.'; }
      if (k === 'reject') { w.enemyExh = Math.min(100, w.enemyExh + 3); hit(s, w, null, -2); grp(s, 'military', 2); return 'A rejeição endurece a guerra e fortalece os militares.'; }
      if (c) c.nego = clamp((c.nego || 40) + 10, 0, 100); st(s, 'reputation', 1); return 'A mediação internacional é acionada.';
    } },
  homefront: {
    ok: s => s.st.warWeariness > 25, w: s => 1 + s.st.warWeariness / 50,
    card: (s) => ({ title: 'Cansaço de guerra em casa', desc: 'Mães de soldados protestam diante do ministério da Defesa e jovens queimam convocações. A oposição pede o fim da guerra.', context: `Cansaço de guerra: ${Math.round(s.st.warWeariness)}.`, default: 1,
      options: [O('Discurso à nação sobre sacrifício e vitória.', 'Mobiliza parte da população.', 'speech'), O('Anunciar licença para tropas e amparo às famílias.', 'Custa; alivia o cansaço.', 'care'), O('Reprimir os protestos.', 'Ordem; a revolta cresce em silêncio.', 'crush')] }),
    res: (s, data, w, k) => {
      if (k === 'speech') { st(s, 'warWeariness', -4); st(s, 'legitimacy', chance(0.5) ? 2 : -2); return 'O discurso sobre sacrifício divide a opinião.'; }
      if (k === 'care') { spend(s, 0.0015); st(s, 'warWeariness', -7); grp(s, 'workers', 2); return 'As licenças e a ajuda às famílias aliviam o cansaço.'; }
      st(s, 'protest', -3); st(s, 'civil', -2); st(s, 'legitimacy', -1.5); return 'Os protestos são reprimidos, e a insatisfação fica latente.';
    } },
  hostages: {
    ok: (s, w) => day(s) - w.start > 20, w: () => 0.8,
    card: (s, data, w, nm) => ({ title: 'Reféns civis', desc: `Um grupo ligado a ${nm} sequestrou dezenas de civis e exige a libertação de prisioneiros em troca.`, context: 'Ceder incentiva novos sequestros; recusar arrisca vidas.', default: 1,
      options: [O('Negociar a troca.', 'Reféns salvos; sinal de fraqueza.', 'trade'), O('Operação de resgate.', 'Pode salvar todos ou terminar em tragédia.', 'raid'), O('Recusar qualquer acordo.', 'Linha-dura; risco de mortes.', 'refuse')] }),
    res: (s, data, w, k) => {
      if (k === 'trade') { st(s, 'legitimacy', 2); st(s, 'reputation', -1); w.enemyExh = Math.max(0, w.enemyExh - 2); return 'A troca salva os reféns, e a oposição fala em fraqueza.'; }
      if (k === 'raid') { if (chance(0.55)) { st(s, 'legitimacy', 4); grp(s, 'military', 3); return 'O resgate liberta os reféns e eleva o moral.'; } st(s, 'legitimacy', -4); hit(s, w, null, -2); return 'A operação de resgate termina em tragédia.'; }
      st(s, 'legitimacy', -2); st(s, 'reputation', 1); return 'Sem acordo, parte dos reféns morre e o país entra em luto.';
    } },
  ceasefire_break: {
    ok: s => day(s) > 0, w: (s, w) => (w.truce > 0 ? 3 : 0),
    card: (s, data, w, nm) => ({ title: 'Violação da trégua', desc: `Tropas de ${nm} abrem fogo contra posições suas durante a trégua, deixando soldados mortos. Cada lado acusa o outro de ter começado.`, context: 'Reagir pode acabar com a trégua.', default: 1,
      options: [O('Responder à altura.', 'A trégua termina; moral sobe.', 'respond'), O('Protestar e documentar o incidente.', 'Mantém a trégua; ganha simpatia.', 'protest'), O('Ignorar para preservar a trégua.', 'Evita a escalada; militares reclamam.', 'ignore')] }),
    res: (s, data, w, k) => {
      if (k === 'respond') { w.truce = 0; grp(s, 'military', 3); w.enemyExh = Math.min(100, w.enemyExh + 2); return 'A resposta encerra a trégua e os combates recomeçam.'; }
      if (k === 'protest') { w.sym = clamp((w.sym || 40) + 3, 0, 100); return 'O incidente é documentado e a simpatia internacional aumenta.'; }
      grp(s, 'military', -3); return 'Você ignora o incidente para preservar a trégua.';
    } },
  summit: {
    ok: (s, w) => day(s) - w.start > 28 && Object.values(s.partners).some(p => p.rel > 30), w: () => 0.7,
    card: (s, data, w, nm) => ({ title: 'Cúpula de paz oferecida por um amigo', desc: `Um país amigo se oferece para sediar uma cúpula secreta com ${nm} para discutir o fim da guerra.`, context: 'Uma cúpula pode abrir portas ou virar palco de propaganda.', default: 0,
      options: [O('Aceitar e enviar uma delegação.', 'Abre canal de negociação.', 'go'), O('Exigir condições prévias.', 'Pode atrasar; endurece a posição.', 'conditions'), O('Recusar: só se rendem.', 'Linha-dura; sem diálogo.', 'refuse')] }),
    res: (s, data, w, k) => {
      const c = s.world.c[w.enemy];
      if (k === 'go') { if (c) c.nego = clamp((c.nego || 40) + 18, 0, 100); st(s, 'reputation', 1); return 'A cúpula abre um canal de negociação entre os dois lados.'; }
      if (k === 'conditions') { if (c) c.nego = clamp((c.nego || 40) + 5, 0, 100); return 'As condições prévias atrasam as conversas.'; }
      grp(s, 'military', 2); return 'Você recusa a cúpula; a guerra segue.';
    } },
  warbonds: {
    ok: s => s.econ.treasury < s.econ.gdp * 0.01 || s.econ.debt > s.econ.gdp * 0.5, w: () => 1.2,
    card: () => ({ title: 'O custo da guerra pesa no caixa', desc: 'O tesouro está no limite. Assessores propõem títulos de guerra, empréstimos externos ou impostos emergenciais.', context: 'Toda opção tem preço político.', default: 0,
      options: [O('Lançar títulos de guerra patrióticos.', 'Dinheiro agora; dívida depois.', 'bonds'), O('Pedir empréstimo a um país amigo.', 'Dinheiro com dependência.', 'loan'), O('Imposto emergencial de guerra.', 'Receita; irrita a população.', 'tax')] }),
    res: (s, data, w, k) => {
      if (k === 'bonds') { s.econ.treasury += s.econ.gdp * 0.01; s.econ.debt += s.econ.gdp * 0.01; if (s.ord) s.ord.patriot = clamp(s.ord.patriot + 1, 0, 100); return 'Os títulos patrióticos arrecadam fundos, ao custo de mais dívida.'; }
      if (k === 'loan') { s.econ.treasury += s.econ.gdp * 0.012; st(s, 'influence', -2); return 'Um país amigo empresta dinheiro e ganha influência.'; }
      s.econ.treasury += s.econ.gdp * 0.008; grp(s, 'workers', -3); grp(s, 'business', -2); return 'O imposto emergencial enche o caixa e a população reclama.';
    } },
  spy_caught: {
    ok: () => true, w: () => 0.8,
    card: (s, data, w, nm) => ({ title: `Espião de ${nm} capturado`, desc: `A contrainteligência prendeu um espião de ${nm} com planos da sua logística. Ele aceita colaborar em troca de proteção.`, context: 'Um agente duplo pode enganar o inimigo, ou enganar você.', default: 0,
      options: [O('Transformá-lo em agente duplo.', 'Pode desinformar o inimigo; arriscado.', 'double'), O('Trocá-lo por um prisioneiro seu.', 'Resultado certo, ganho pequeno.', 'swap'), O('Julgá-lo publicamente.', 'Propaganda; nenhum ganho tático.', 'trial')] }),
    res: (s, data, w, k) => {
      if (k === 'double') { if (chance(0.6)) { w.enemyExh = Math.min(100, w.enemyExh + 5); st(s, 'intel', 2); return 'O agente duplo alimenta o inimigo com informação falsa.'; } st(s, 'intel', -2); hit(s, w, null, -2); return 'O agente era um duplo do inimigo e vazou planos.'; }
      if (k === 'swap') { st(s, 'warWeariness', -2); return 'A troca devolve um prisioneiro seu.'; }
      if (s.prop) s.prop.cred = clamp(s.prop.cred + 2, 0, 100); st(s, 'legitimacy', 1); return 'O julgamento público rende propaganda.';
    } },
  nuclear_rumor: {
    ok: (s, w) => !!s.world.c[w.enemy]?.nuclear && w.score < -10, w: () => 0.8,
    card: (s, data, w, nm) => ({ title: `Rumores de uso nuclear por ${nm}`, desc: `Serviços de inteligência alertam que ${nm} avalia uma demonstração nuclear tática para forçar a rendição.`, context: 'A reação define se o mundo se mobiliza ou entra em pânico.', default: 0,
      options: [O('Alertar publicamente e pedir ação da ONU.', 'Mobiliza o mundo; pode inflamar o pânico.', 'alert'), O('Negociar discretamente.', 'Reduz o risco; sem publicidade.', 'quiet'), O('Dispersar centros de comando.', 'Prudente; custa eficiência.', 'disperse')] }),
    res: (s, data, w, k) => {
      if (k === 'alert') { w.sym = clamp((w.sym || 40) + 8, 0, 100); st(s, 'stability', -2); return 'O alerta mobiliza o mundo e causa pânico em casa.'; }
      if (k === 'quiet') { const c = s.world.c[w.enemy]; if (c) c.nego = clamp((c.nego || 40) + 8, 0, 100); return 'Emissários discretos tentam baixar a tensão.'; }
      st(s, 'defense', 1); st(s, 'efficiency', -1); return 'Centros de comando são dispersos para reduzir riscos.';
    } },
  partisans: {
    ok: (s, w) => (w.lost || []).some(p => s.world.occ[p] === w.enemy), w: () => 1.4,
    card: (s, data, w, nm) => ({ title: 'Partisanos nas terras ocupadas', desc: `Grupos de civis armados atacam comboios e postos de ${nm} nas províncias ocupadas. Em retaliação, o ocupante ameaça executar reféns.`, context: 'A resistência desgasta o inimigo, mas os civis pagam o preço.', default: 1,
      options: [O('Armar e coordenar os partisanos.', 'Resistência forte; represálias contra civis.', 'arm'), O('Pedir cautela e proteger civis.', 'Menos represálias; menos desgaste do inimigo.', 'restrain'), O('Desautorizar a resistência.', 'Evita escalada; desmoraliza a população.', 'disown')] }),
    res: (s, data, w, k) => {
      if (k === 'arm') { w.guer = clamp((w.guer || 0) + 12, 0, 100); w.sym = clamp((w.sym || 40) + 2, 0, 100); w.enemyExh = Math.min(100, w.enemyExh + 3); return 'Os partisanos recebem armas; o ocupante responde com represálias que chocam o mundo.'; }
      if (k === 'restrain') { w.guer = clamp((w.guer || 0) + 3, 0, 100); st(s, 'reputation', 1.5); return 'A resistência é contida para poupar civis.'; }
      w.guer = clamp((w.guer || 0) - 10, 0, 100); st(s, 'legitimacy', -2); return 'O governo desautoriza a resistência; muitos se sentem abandonados.';
    } },
  sanction_vote: {
    ok: (s, w) => !w.aggressor, w: () => 1.1,
    card: (s, data, w, nm) => ({ title: `Votação de sanções contra ${nm}`, desc: `A ONU debate sanções contra ${nm} pela invasão. Potências divididas pedem seu posicionamento e algumas ameaçam vetar.`, context: 'Uma boa diplomacia pode isolar o agressor.', default: 1,
      options: [O('Fazer lobby intenso com os votos indecisos.', 'Custa capital político; aumenta a chance de sanções.', 'lobby'), O('Apelar à opinião pública mundial.', 'Barato; efeito moderado.', 'appeal'), O('Aceitar o que vier.', 'Sem custo; resultado incerto.', 'wait')] }),
    res: (s, data, w, k) => {
      if (k === 'lobby') { st(s, 'influence', -2); if (chance(0.6)) { w.sanc = Math.min(3, (w.sanc || 0) + 1); return 'O lobby funciona: novas sanções contra o agressor são aprovadas.'; } return 'O lobby esbarra em vetos; as sanções não passam.'; }
      if (k === 'appeal') { w.sym = clamp((w.sym || 40) + 6, 0, 100); return 'Seu apelo mobiliza a opinião pública e a simpatia cresce.'; }
      return 'A votação termina sem avanços relevantes.';
    } },
  trench: {
    ok: (s, w) => day(s) - w.start > 35 && Math.abs(w.score) < 25, w: () => 1,
    card: (s, data, w) => ({ title: 'A guerra estagna', desc: 'Semanas de combates sem mudança nas linhas. Soldados falam em "guerra de trincheiras" e o estado-maior pede uma decisão estratégica.', context: `Placar de guerra: ${Math.round(w.score)}.`, default: 1,
      options: [O('Concentrar forças numa grande ofensiva.', 'Aposta alta: ruptura ou desgaste.', 'offensive'), O('Aceitar o desgaste e fortificar.', 'Poupa tropas; a guerra se arrasta.', 'attrition'), O('Buscar uma saída negociada.', 'Abre caminho para um acordo.', 'talk')] }),
    res: (s, data, w, k) => {
      if (k === 'offensive') { if (chance(0.5) && w.target) { w.target.p = Math.min(95, w.target.p + 20); w.score += 8; return 'A grande ofensiva rompe a linha inimiga.'; } hit(s, w, 'attack', -12); s.st.troops = Math.max(1, s.st.troops * 0.99); w.score -= 6; return 'A ofensiva se desfaz em perdas pesadas.'; }
      if (k === 'attrition') { st(s, 'defense', 1.5); w.enemyExh = Math.min(100, w.enemyExh + 4); return 'As linhas se fortificam e o desgaste continua.'; }
      const c = enemy(s, w); if (c) c.nego = clamp((c.nego || 40) + 15, 0, 100); return 'Emissários exploram uma saída negociada.';
    } },
};
