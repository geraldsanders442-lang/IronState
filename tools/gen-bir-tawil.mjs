// Mais questões exclusivas do cenário Bir Tawil (micronação). Todas exigem a flag "micronation".
// Uso: node tools/gen-bir-tawil.mjs   (reescreve data/issues_birtawil.json e o registra em data/content.json)
import { writeFileSync, readFileSync } from 'node:fs';
const out = f => new URL('../data/' + f, import.meta.url);
const o = (text, hint, e = {}) => ({ text, hint, ...e });
const C = { flag: 'micronation' };
const I = (id, title, desc, context, options, extra = {}) => ({ id, cat: 'Micronação', title, desc, context, cond: { ...C, ...(extra.cond || {}) }, w: 1, cd: 400, ...Object.fromEntries(Object.entries(extra).filter(([k]) => k !== 'cond')), options });

const L = [
  I('bt2_halaib', 'O triângulo de Halaib reaparece nos mapas', 'Um cartógrafo amador publica um mapa em que o reino ocupa Bir Tawil e Halaib ao mesmo tempo. Dois ministérios de Relações Exteriores, no Cairo e em Cartum, convocam especialistas para "esclarecer o equívoco".', 'A mentira certa no mapa errado vira crise.', [
    o('Manter o mapa: "a geografia é uma opinião".', 'Atenção mundial; irritação regional.', { now: { reputation: -1.5, influence: 1 }, rel: { neighbors: -5 } }),
    o('Corrigir o mapa e agradecer a "advertência".', 'A diplomacia respira.', { now: { reputation: 1 }, rel: { neighbors: 2 } }),
    o('Leiloar o mapa em edição limitada.', 'Dá dinheiro; ninguém leva a sério.', { now: { treasury: 0.05, reputation: -0.5 }, groups: { youth: 2 } })]),
  I('bt2_camel_post', 'Correio nacional movido a camelo', 'Um empreendedor propõe criar o serviço postal do reino: cartas viajam de camelo até o oásis mais próximo, e de lá por um motoqueiro que "provavelmente passa na quinta".', 'Selos raros de um país inexistente valem uma fortuna entre colecionadores.', [
    o('Emitir selos e vender no exterior.', 'Colecionadores pagam bem.', { now: { treasury: 0.08, reputation: 0.5 }, groups: { business: 2 } }),
    o('Correio gratuito, estatal e lento.', 'Serviço público de verdade (o único).', { now: { treasury: -0.03, legitimacy: 1.5 } }),
    o('Proibir: camelos são para trabalhar.', 'O camelo agradece.', { groups: { rural: 1 } })]),
  I('bt2_rally', 'O rali do deserto pede passagem', 'Uma equipe de rali pergunta se pode cruzar o território de carro, a 150 km/h, "já que nenhum outro país aceita nos dar licença". Pagam em dólares e em patrocínios de energéticos.', 'Poeira, dinheiro e uma duna destruída.', [
    o('Cobrar pedágio por pneu.', 'Receita imediata.', { now: { treasury: 0.1, pollution: 0.3 }, groups: { business: 2 } }),
    o('Sediar a largada oficial do rali.', 'Prestígio e transmissão de TV.', { now: { treasury: -0.03, reputation: 2, legitimacy: 1 }, groups: { youth: 3 } }),
    o('Vetar: as dunas são patrimônio nacional.', 'A duna agradece.', { now: { reputation: 0.5 }, groups: { youth: -1 } })]),
  I('bt2_tomb', 'Arqueólogos acham algo sob a areia', 'Uma missão arqueológica encontra fragmentos de cerâmica de três mil anos. Egito e Sudão, curiosamente, ficam muito interessados — em quem ficará com os cacos.', 'O reino ganha um passado; também ganha problemas.', [
    o('Declarar patrimônio nacional e exigir cooperação científica.', 'Legitimidade histórica.', { now: { legitimacy: 2, reputation: 1.5 }, long: [{ k: 'tech', v: 0.3, d: 0 }] }),
    o('Vender os fragmentos a um colecionador.', 'Dinheiro rápido; escândalo certo.', { now: { treasury: 0.15, reputation: -3 }, groups: { youth: -2 } }),
    o('Devolver tudo aos museus do Cairo.', 'Gesto de boa vontade.', { now: { reputation: 1 }, rel: { neighbors: 3 } })]),
  I('bt2_wifi', 'Alguém instala internet via satélite', 'Um turista deixa uma antena de satélite ligada à bateria de um carro. Pela primeira vez, o reino tem acesso à rede — e metade da população descobre as redes sociais num único dia.', 'Conexão é soberania digital.', [
    o('Criar o "Ministério da Internet" (o turista).', 'Burocracia máxima.', { now: { tech: 1, treasury: -0.02 }, groups: { youth: 3 } }),
    o('Racionar o acesso por ordem de idade.', 'Sábio e impopular.', { now: { legitimacy: -1 }, groups: { youth: -3 } }),
    o('Vender horas de wi-fi aos viajantes.', 'O primeiro serviço público rentável.', { now: { treasury: 0.06 }, groups: { business: 1 } })]),
  I('bt2_cult', 'Uma seita chega buscando "o centro do nada"', 'Um grupo espiritual acredita que Bir Tawil é o único lugar da Terra sem dono e pede para montar um retiro. Meditam o dia todo e comem pouco — o que sobra mais ao rei.', 'Fé, vazio e ótimos vídeos.', [
    o('Receber o retiro e cobrar hospedagem.', 'Renda e paz.', { now: { treasury: 0.07, qol: 0.3 }, groups: { youth: 2 } }),
    o('Dar-lhes cidadania em troca de doação.', 'Cidadãos novos; costumes novos.', { now: { treasury: 0.1, legitimacy: -0.5, civil: 0.3 } }),
    o('Expulsar: "aqui só se medita com autorização".', 'Cerimônia curta.', { now: { reputation: -0.5 } })]),
  I('bt2_festival', 'Festival de música no meio do nada', 'Um festival de música eletrônica quer montar palcos na areia por três dias. Prometem dez mil pessoas, geradores, água e uma conta bancária gorda.', 'O primeiro grande evento do reino.', [
    o('Autorizar com taxa e regras de lixo zero.', 'Boa receita; logística difícil.', { now: { treasury: 0.15, pollution: 0.4, reputation: 1.5 }, groups: { youth: 4, business: 2 } }),
    o('Autorizar sem restrições.', 'Mais dinheiro, mais caos.', { now: { treasury: 0.22, pollution: 1.2, health: -0.5 }, groups: { youth: 3 } }),
    o('Recusar.', 'Sem festa.', { groups: { youth: -3 } })]),
  I('bt2_nomads', 'A tribo vizinha reivindica o poço e o respeito', 'Um grupo de nômades tradicionais lembra que passa por ali há séculos e que o "reino" é uma novidade engraçada. Pedem reconhecimento de seus direitos de pastoreio e de água.', 'Quem estava aqui primeiro?', [
    o('Garantir direitos por decreto e convidá-los ao conselho.', 'Justo; reduz a autoridade do rei.', { now: { legitimacy: 2, civil: 1 }, groups: { regional: 3, rural: 2 }, long: [{ k: 'separatism', v: -1, d: 365 }] }),
    o('Cobrar taxa de uso do poço.', 'Receita e ressentimento.', { now: { treasury: 0.04, legitimacy: -1.5 }, groups: { rural: -3 } }),
    o('Oferecer cidadania honorária e um título.', 'Barato e simpático.', { now: { legitimacy: 1 } })]),
  I('bt2_nft', 'Lotes digitais do reino à venda', 'Um empreendedor sugere vender "lotes de areia" em formato digital: cada comprador recebe um certificado e coordenadas. Já há compradores — e promessas de processar o reino.', 'Imobiliária virtual de um deserto sem dono.', [
    o('Autorizar a venda, com contrato claro.', 'Rende; cheira a golpe.', { now: { treasury: 0.12, reputation: -1.5 }, groups: { business: 2, youth: 1 } }),
    o('Vender só "títulos de amigo do reino".', 'Menos arriscado.', { now: { treasury: 0.05, reputation: 0.3 } }),
    o('Proibir: terra é terra.', 'Íntegro e pobre.', { now: { legitimacy: 1 } })]),
  I('bt2_dxpedition', 'Radioamadores querem transmitir de um "país raro"', 'Uma expedição de radioamadores quer operar do território por dois dias: para eles, estar no "país 340" é um troféu. Trazem equipamentos, dinheiro e muita antena.', 'Pequena comunidade, grande alcance.', [
    o('Receber e conceder prefixo de rádio.', 'O reino fala com o mundo.', { now: { reputation: 1.5, tech: 0.5, treasury: 0.03 }, groups: { youth: 2 } }),
    o('Cobrar licença cara.', 'Mais dinheiro, menos amigos.', { now: { treasury: 0.08, reputation: -0.5 } }),
    o('Negar: sinal estrangeiro, risco de espionagem.', 'Paranoia.', { now: { intel: 0.5 }, groups: { military: 1 } })]),
  I('bt2_wedding', 'Casamentos no fim do mundo', 'Um casal de influenciadores quer casar "no país que ninguém quer". O rei se oferece como celebrante. A procura por casamentos explode.', 'Turismo romântico de nicho.', [
    o('Criar o "pacote casamento real".', 'Renda e fotos.', { now: { treasury: 0.09, reputation: 1 }, groups: { youth: 3, business: 1 } }),
    o('Celebrar de graça, em nome da nação.', 'Boa publicidade.', { now: { reputation: 1.5, legitimacy: 1 } }),
    o('Recusar: o casamento real é só do rei.', 'Tradição inventada.', {})]),
  I('bt2_mirage', 'Um lago aparece no horizonte (e some)', 'A população jura ter visto um lago e ao se aproximar encontra apenas miragem. Uma corrente política passa a defender "buscar o lago".', 'A esperança como política de Estado.', [
    o('Organizar uma expedição oficial ao lago.', 'Aventura e decepção.', { now: { treasury: -0.03, legitimacy: -0.5, qol: -0.2 }, groups: { youth: 2 } }),
    o('Declarar que o lago existe "espiritualmente".', 'Propaganda criativa.', { now: { legitimacy: 1 }, long: [{ k: 'propaganda', v: 0.5, d: 0 }] }),
    o('Contratar um geólogo para investigar de verdade.', 'Descobre onde há água subterrânea.', { now: { treasury: -0.05 }, long: [{ k: 's_food', v: 0.5, d: 0 }] })]),
  I('bt2_meteorite', 'Um meteorito cai a dois quilômetros do palácio', 'A rocha espacial atrai cientistas, colecionadores e traficantes de meteoritos. Quem ficar com ela ganha prestígio — e dinheiro.', 'O céu entregou o primeiro recurso natural do reino.', [
    o('Declarar patrimônio e abrir a um museu.', 'Prestígio científico.', { now: { reputation: 2, tech: 0.5 } }),
    o('Leiloar pedaços.', 'Muito dinheiro; briga de leilão.', { now: { treasury: 0.2, reputation: -0.5 } }),
    o('Doar a uma universidade em troca de bolsas.', 'Capital humano.', { now: { treasury: -0.02 }, long: [{ k: 'education', v: 0.8, d: 0 }] })]),
  I('bt2_china', 'Uma potência oferece um "projeto de infraestrutura"', 'Uma delegação de uma grande potência propõe construir estrada, usina solar e porto seco em troca de "direitos especiais" no território. Os termos cabem num guardanapo — e o guardanapo é caro.', 'O deserto também tem pretendentes.', [
    o('Aceitar tudo.', 'Infraestrutura e dependência.', { now: { debt: 0.3 }, long: [{ k: 'infra', v: 2, d: 0 }, { k: 'logistics', v: 2, d: 0 }], rel: { china: 5, west: -3 } }),
    o('Aceitar só a usina solar.', 'Cauteloso.', { long: [{ k: 's_energy', v: 2, d: 0 }], rel: { china: 2 } }),
    o('Recusar: o rei não é pau-mandado.', 'Orgulho de areia.', { now: { legitimacy: 1 } })]),
  I('bt2_wikipedia', 'Guerra de edições na enciclopédia', 'Voluntários do mundo todo brigam sobre se o reino "existe", é "uma brincadeira" ou "um território disputado". O rei pede para o conselho nacional "escrever a verdade".', 'A batalha pela narrativa é digital.', [
    o('Criar um comitê de comunicação.', 'Profissionaliza a lenda.', { now: { reputation: 1, treasury: -0.02 }, long: [{ k: 'propaganda', v: 1, d: 0 }] }),
    o('Deixar a internet decidir.', 'O que sobrar é história.', {}),
    o('Processar os editores.', 'Efeito Streisand garantido.', { now: { reputation: -2, legitimacy: -1 }, groups: { youth: -2 } })]),
  I('bt2_ufo', 'Luzes no céu atraem caçadores de OVNIs', 'Turistas afirmam ter visto luzes estranhas sobre o deserto. Um canal de TV propõe um especial em horário nobre.', 'Misterioso e lucrativo.', [
    o('Transformar em atração oficial.', 'Turismo de nicho.', { now: { treasury: 0.07, reputation: 0.8 }, groups: { youth: 2 } }),
    o('Dizer que foram balões do programa espacial.', 'Coerência histórica.', { now: { legitimacy: 0.5 } }),
    o('Ignorar.', 'Sem mistério.', {})]),
  I('bt2_cat', 'Um gato adotado é nomeado ministro', 'Um gato vira-lata se tornou o animal de estimação do palácio e foi aclamado pela multidão (todos os doze). O sobrinho do rei propõe nomeá-lo ministro da Fauna.', 'Política de estimação.', [
    o('Nomear o gato com pompa.', 'Memes e simpatia.', { now: { reputation: 0.8, legitimacy: 0.5 }, groups: { youth: 3 } }),
    o('Nomear e dar-lhe poder de veto.', 'Ligeiro caos.', { now: { efficiency: -0.5, reputation: 1 }, groups: { youth: 2 } }),
    o('Recusar: ministros precisam falar.', 'Sensato.', {})]),
  I('bt2_sandbags', 'O muro de sacos de areia da fronteira', 'O Marechal propõe construir uma "grande muralha" de sacos de areia contra invasões. Faltam sacos; sobra areia.', 'Defesa baseada em material local.', [
    o('Construir e inaugurar com cerimônia.', 'Símbolo de soberania.', { now: { defense: 1, legitimacy: 1, treasury: -0.03 }, groups: { military: 3 } }),
    o('Substituir por marcos de pedra bem-humorados.', 'Menos trabalho.', { now: { reputation: 0.5 } }),
    o('Cancelar: não há inimigo, só vento.', 'Realista.', { groups: { military: -2 } })]),
  I('bt2_exile', 'Um líder de outra micronação pede asilo', 'O "presidente" de uma república de um apartamento, derrubado por uma assembleia de condomínio, pede abrigo político. Traz um sofá.', 'Diplomacia de mundos estranhos.', [
    o('Conceder asilo.', 'Ganho simbólico.', { now: { reputation: 0.5, legitimacy: 0.5 } }),
    o('Dar-lhe um cargo.', 'Mais um ministro.', { now: { efficiency: -0.3 }, groups: { youth: 1 } }),
    o('Devolver ao condomínio.', 'Burocracia internacional.', { now: { reputation: -0.5 } })]),
  I('bt2_water_pipe', 'Contrabando de água pelo oásis', 'Um grupo de comerciantes instalou mangueiras clandestinas para levar água do poço a acampamentos vizinhos. Cobram caro; o reino não vê nada do lucro.', 'Recurso escasso, mercado negro.', [
    o('Regular e taxar a venda de água.', 'Receita e controle.', { now: { treasury: 0.06, control: 1 }, groups: { business: 1, rural: -1 } }),
    o('Expulsar os comerciantes.', 'Água para o povo; clima tenso.', { now: { legitimacy: 1.5, control: 1 }, groups: { business: -2 } }),
    o('Fingir que não viu.', 'Corrupção de areia.', { now: { corruption: 1.2 } })]),
  I('bt2_loan', 'Um banco ofereceu empréstimo a um país que não existe', 'Uma fintech "de impacto" oferece crédito ao reino sem exigir lastro. O contrato é incompreensível, mas o juro é muito claro.', 'Dívida de quem não tem nada.', [
    o('Pegar o empréstimo para obras.', 'Dinheiro agora; juros depois.', { now: { treasury: 0.25, debt: 0.4 }, long: [{ k: 'infra', v: 1, d: 0 }] }),
    o('Negociar um valor menor.', 'Prudência.', { now: { treasury: 0.1, debt: 0.15 } }),
    o('Recusar.', 'O rei não assina o que não lê.', { now: { legitimacy: 0.5 } })]),
  I('bt2_polar_tourists', 'Uma onda de calor extremo', 'A temperatura chega a 52 °C. O palácio (uma tenda de lona) vira forno, e duas cabras desmaiam. O rei pede um decreto contra o sol.', 'O deserto cobra o preço.', [
    o('Construir abrigos com sombra para todos.', 'Salva vidas.', { now: { treasury: -0.05, health: 0.5, qol: 0.5 } }),
    o('Decretar horário de meio-dia livre.', 'Barato e simpático.', { now: { health: 0.2, legitimacy: 0.5 } }),
    o('Ignorar: "o sol é de todos".', 'Heroico e perigoso.', { now: { health: -1, qol: -0.5 } })]),
  I('bt2_italian', 'Um aviador italiano pousa e declara-se descendente de uma antiga expedição', 'Um piloto de ultraleve aterrissa, afirma que seu bisavô mapeou a área e exige um assento no conselho. Mostra um mapa antigo com "Bir Tawil" riscado e uma anotação: "inútil".', 'Heranças suspeitas e charmosas.', [
    o('Receber com honras e chamá-lo de embaixador.', 'Diplomacia romântica.', { now: { reputation: 0.8 }, rel: { all: 0.5 } }),
    o('Pedir o mapa emprestado e nunca devolver.', 'Patrimônio histórico adquirido.', { now: { legitimacy: 0.5, reputation: -0.3 } }),
    o('Mandar embora.', 'Rude, mas eficaz.', {})]),
  I('bt2_unrecognized', 'O dia em que alguém reconhece o reino (sem querer)', 'Um pequeno país insular, por engano de tradução, envia uma nota formal "reconhecendo" o reino. O ministério dele diz que foi erro, mas o texto vazou. A imprensa pede uma coletiva.', 'O primeiro reconhecimento da história — talvez.', [
    o('Celebrar o reconhecimento em rede nacional.', 'Momento histórico.', { now: { reputation: 2, legitimacy: 3 }, rel: { all: 1 } }),
    o('Aceitar discretamente e agradecer o "equívoco".', 'Elegante.', { now: { reputation: 1, legitimacy: 1.5 } }),
    o('Devolver a nota para não criar problemas.', 'Honestidade rara.', { now: { reputation: 1.5 } })]),
  I('bt2_birthday', 'O aniversário do rei', 'O rei faz anos. O protocolo exige salvas de canhão (não há canhão), desfile (há sete pessoas) e discurso (o rei fala o dia todo).', 'Pompa para um reino do tamanho de um terreno.', [
    o('Festa grande, em tendas e com o povo todo.', 'Todos comem e bebem.', { now: { treasury: -0.04, legitimacy: 2, qol: 0.4 }, groups: { youth: 2, workers: 2 } }),
    o('Cerimônia curta, com bolo.', 'Sensato.', { now: { legitimacy: 1 } }),
    o('Cancelar: o rei "está acima das datas".', 'Misterioso.', { now: { legitimacy: -0.5 } })]),
  I('bt2_succession', 'Quem sucede o rei?', 'A pergunta chega com um sobrinho ansioso, um primo ambicioso e uma cabra eloquente. A lei de sucessão é um guardanapo, e o guardanapo sumiu.', 'Todo reino precisa de um plano B.', [
    o('Instituir eleição entre os cidadãos.', 'Democracia em miniatura.', { now: { political: 2, legitimacy: 1 }, groups: { youth: 3 } }),
    o('Nomear o sobrinho herdeiro.', 'Tradição clássica.', { now: { legitimacy: 0.5 }, groups: { youth: -1 } }),
    o('Nomear a cabra.', 'Surpreendentemente popular.', { now: { reputation: 1, legitimacy: -0.5 }, groups: { youth: 3 } })], { cd: 600 }),
];

writeFileSync(out('issues_birtawil.json'), JSON.stringify(L, null, 1));
const cp = out('content.json'), c = JSON.parse(readFileSync(cp, 'utf8'));
if (!c.issues.includes('issues_birtawil')) { c.issues.push('issues_birtawil'); writeFileSync(cp, JSON.stringify(c, null, 1)); }
console.log('questões de Bir Tawil:', L.length);
