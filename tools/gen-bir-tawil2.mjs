// Terceira leva de questões exclusivas do cenário Bir Tawil (micronação). Todas exigem a flag "micronation".
// Uso: node tools/gen-bir-tawil2.mjs   (reescreve data/issues_birtawil2.json e o registra em data/content.json)
import { writeFileSync, readFileSync } from 'node:fs';
const out = f => new URL('../data/' + f, import.meta.url);
const o = (text, hint, e = {}) => ({ text, hint, ...e });
const I = (id, title, desc, context, options, cd = 400) => ({ id, cat: 'Micronação', title, desc, context, cond: { flag: 'micronation' }, w: 1, cd, options });

const L = [
  I('bt3_lottery', 'A loteria nacional (prêmio: um camelo)', 'O ministro da Fazenda propõe uma loteria para arrecadar fundos. O prêmio principal é um camelo com certificado; o segundo, uma tarde com o rei.', 'Jogo de azar em escala de oásis.', [
    o('Criar a loteria e vender bilhetes online.', 'Arrecada com turistas e curiosos.', { now: { treasury: 0.07, reputation: 0.3 }, groups: { youth: 2 } }),
    o('Loteria só entre cidadãos, para financiar o poço.', 'Pequena e honesta.', { now: { treasury: 0.02, legitimacy: 1 } }),
    o('Vetar: "o camelo não é prêmio, é cidadão".', 'Ética peluda.', { now: { legitimacy: 0.5 } })]),
  I('bt3_school', 'A escola de uma sala só', 'Um professor viajante se oferece para ensinar as crianças do reino (são quatro). Pede um quadro, giz e a garantia de que ninguém o prenderá por "ensinar geografia errada".', 'Educação num lugar que ninguém marcou no mapa.', [
    o('Contratar o professor e abrir a escola.', 'Educação básica garantida.', { now: { treasury: -0.03, education: 1.5 }, groups: { youth: 3, rural: 1 } }),
    o('Ensino pela internet com o wi-fi do turista.', 'Barato, instável.', { now: { education: 0.6, tech: 0.3 } }),
    o('Dispensar: a escola é a vida.', 'Filosofia gratuita.', { now: { education: -0.5 } })]),
  I('bt3_doctor', 'Médicos sem fronteiras passam pelo deserto', 'Uma equipe médica oferece montar um posto por uma semana. Eles notam falta de vacinas, água limpa e um paciente reclamando de insolação... e de reinado.', 'Saúde pública para 300 pessoas e 41 cabras.', [
    o('Receber e pedir que fiquem um mês.', 'Vacinação e atendimento.', { now: { health: 2, reputation: 1.5, treasury: -0.02 }, groups: { workers: 2 } }),
    o('Receber só por uma semana.', 'Alívio rápido.', { now: { health: 1, reputation: 0.5 } }),
    o('Recusar: "temos o curandeiro nacional".', 'Tradição que dói.', { now: { health: -0.5 }, groups: { rural: 1 } })]),
  I('bt3_mayor', 'Primeira eleição para "prefeito do oásis"', 'Os moradores do oásis pedem alguém para cuidar do poço e do lixo. Surgem dois candidatos: um nômade e o dono do único comércio. O rei suspeita de ambos.', 'A democracia chegou (de caravana).', [
    o('Permitir a eleição livre.', 'Legitimidade e dor de cabeça.', { now: { political: 2, legitimacy: 1.5 }, groups: { regional: 2 } }),
    o('Nomear o dono do comércio.', 'Eficiente e corrupto.', { now: { efficiency: 1, corruption: 1 }, groups: { business: 2, rural: -1 } }),
    o('Manter o rei como prefeito.', 'Concentração total.', { now: { legitimacy: -0.5, control: 1 } })]),
  I('bt3_tax', 'Imposto de renda para 312 pessoas', 'O ministro da Fazenda propõe criar o imposto de renda. Nenhum habitante tem renda declarada, salvo o dono do comércio, que "mistura as contas com as da cabra".', 'A fome do Estado, mesmo em miniatura.', [
    o('Imposto simbólico: 1% e um café.', 'Hábito de cidadania.', { now: { treasury: 0.02, legitimacy: 1 } }),
    o('Cobrança dura, com fiscal e tudo.', 'O fiscal é o sobrinho.', { now: { treasury: 0.06, legitimacy: -1.5, civil: -0.3 }, groups: { business: -2 } }),
    o('Sem imposto: o rei "vive do orgulho".', 'Cofre vazio.', { now: { legitimacy: 0.5 } })]),
  I('bt3_dinar', 'O dinar de areia ganha papel e tinta', 'Uma gráfica de outro país se oferece para imprimir a moeda oficial do reino em edição colecionável. O rei exige o retrato dele em cada nota — e o do camelo no verso.', 'Moeda sem Banco Central, mas com autoestima.', [
    o('Encomendar a série completa.', 'Colecionadores pagam bem.', { now: { treasury: 0.08, reputation: 0.5, legitimacy: 1 }, groups: { business: 1 } }),
    o('Imprimir uma tiragem pequena em casa.', 'Artesanal e charmoso.', { now: { treasury: 0.02 } }),
    o('Adotar o dólar e esquecer a ideia.', 'Pragmático e sem graça.', { now: { legitimacy: -1, inflation: -0.1 } })]),
  I('bt3_markers', 'O vento move os marcos da fronteira', 'Os marcos de pedra que delimitam o território sumiram sob a areia. Sem eles, ninguém sabe onde o reino termina. Um morador sugere "decidir pelo olho".', 'Fronteiras de papel, e agora de areia.', [
    o('Replantar marcos com GPS e fotos.', 'Precisão e prova.', { now: { treasury: -0.03, control: 1, reputation: 0.5 } }),
    o('Declarar a fronteira "móvel", conforme o vento.', 'Conceito inédito de soberania.', { now: { reputation: 0.8, legitimacy: -0.5 }, rel: { neighbors: -1 } }),
    o('Deixar sem marcos: ninguém quer a terra mesmo.', 'Realista.', { now: { control: -0.5 } })]),
  I('bt3_goat_ngo', 'ONG exige direitos para as cabras', 'Uma organização internacional pede garantias de bem-estar animal para as 41 cabras do reino: sombra, ração e proibição de usá-las em "cerimônias oficiais".', 'Direitos de quem não vota.', [
    o('Aprovar a Carta dos Direitos Caprinos.', 'Imagem impecável.', { now: { reputation: 1.5, civil: 0.5 }, groups: { youth: 3, rural: -1 } }),
    o('Aprovar parcialmente e manter as cerimônias.', 'Meio-termo caprino.', { now: { reputation: 0.5 } }),
    o('Recusar: "a cabra é patrimônio, não pessoa".', 'Controvérsia garantida.', { now: { reputation: -1.5 }, groups: { youth: -2, rural: 1 } })]),
  I('bt3_documentary', 'Documentário sobre o reino é indicado a um prêmio', 'Um diretor de cinema filmou o cotidiano da micronação e a obra foi indicada a um festival. Ele pede que o rei compareça em traje de gala (um lençol bem passado).', 'Fama internacional, mas o reino tem medo de turismo excessivo.', [
    o('Comparecer à premiação.', 'Visibilidade e orgulho.', { now: { reputation: 2.5, legitimacy: 1.5, treasury: -0.03 }, groups: { youth: 2 } }),
    o('Mandar o sobrinho como embaixador.', 'Aventura diplomática.', { now: { reputation: 1.5 } }),
    o('Ignorar: "cinema é vaidade".', 'Perde a chance.', { now: { reputation: -0.3 } })]),
  I('bt3_billionaire', 'Um bilionário excêntrico pede cidadania', 'Um empresário cansado de impostos oferece uma doação enorme para ser cidadão e "primeiro-ministro honorário". Ele quer isenção de qualquer obrigação.', 'O reino vira refúgio para quem tem demais.', [
    o('Aceitar a doação e dar a cidadania.', 'Dinheiro e escândalo.', { now: { treasury: 0.3, reputation: -2, legitimacy: -1 }, groups: { business: 2, youth: -2 } }),
    o('Aceitar a doação, sem cargos.', 'Equilíbrio.', { now: { treasury: 0.15, reputation: -0.5 } }),
    o('Recusar: "aqui não se compra o título".', 'Dignidade pobre.', { now: { legitimacy: 1.5, reputation: 0.5 } })]),
  I('bt3_fake_embassy', 'Golpistas abrem uma embaixada falsa do reino', 'Alguém instalou um "consulado do Reino de Bir Tawil" em uma capital distante e vende vistos por centenas de dólares. Vítimas reclamam ao Ministério das Relações Exteriores (o rei).', 'Até um país que não existe tem fraudes.', [
    o('Denunciar a fraude publicamente.', 'Imagem de seriedade (inédita).', { now: { reputation: 1, legitimacy: 1 } }),
    o('Pedir comissão aos golpistas.', 'Corrupção criativa.', { now: { treasury: 0.05, corruption: 1.5, reputation: -1.5 } }),
    o('Ignorar: "publicidade grátis".', 'Cheira mal.', { now: { reputation: -0.5 } })]),
  I('bt3_exercise', 'Exercício militar egípcio na fronteira', 'Tanques e helicópteros do exército do Egito fazem manobras a poucos quilômetros. Os onze soldados do reino pedem instruções. O camelo, calma.', 'Sinais de força de um vizinho que alega não querer o território.', [
    o('Enviar uma nota diplomática de "boas-vindas".', 'Simpático e desconcertante.', { now: { reputation: 1 }, rel: { neighbors: 2 } }),
    o('Mobilizar os onze soldados e o megafone.', 'Soberania teatral.', { now: { readiness: 1, legitimacy: 1 }, rel: { neighbors: -3 }, groups: { military: 3 } }),
    o('Esconder a bandeira e fingir que não existe.', 'Estratégia de avestruz.', { now: { legitimacy: -1 } })]),
  I('bt3_hydroponics', 'Agricultura hidropônica no deserto', 'Uma startup de agrotecnologia quer testar estufas hidropônicas usando o poço. Prometem tomates e alface — e uma conta de água alta.', 'Verde no meio do marrom.', [
    o('Aceitar o projeto-piloto.', 'Comida local e risco para o poço.', { now: { treasury: -0.03 }, long: [{ k: 's_food', v: 1.5, d: 0 }, { k: 'hunger', v: -0.5, d: 0 }], groups: { rural: 2 } }),
    o('Condicionar a um limite de água.', 'Prudência.', { long: [{ k: 's_food', v: 0.8, d: 0 }] }),
    o('Recusar: "só deserto fica bem no cartão postal".', 'Estética.', {})]),
  I('bt3_trekking', 'Turismo de aventura: trilhas e acampamentos', 'Uma agência lança pacotes de trekking que cruzam o território. A pouca infraestrutura, o clima e a falta de sombra fazem o rei sorrir de nervoso.', 'Turismo de nicho que dá dinheiro e dor de cabeça.', [
    o('Criar guias e cobrar taxa de entrada.', 'Renda e empregos pequenos.', { now: { treasury: 0.06, reputation: 0.8 }, groups: { youth: 2, business: 1 } }),
    o('Autorizar sem regras.', 'Mais gente, mais lixo.', { now: { treasury: 0.08, pollution: 0.8, health: -0.2 } }),
    o('Fechar à visitação.', 'Isolamento digno.', { groups: { youth: -1 } })]),
  I('bt3_bakery', 'A padaria nacional e o forno solar', 'Um inventor constrói um forno movido a sol para assar o pão do reino. O primeiro lote saiu duro como pedra, mas está "autenticamente nacional".', 'A segurança alimentar começa no forno.', [
    o('Financiar a padaria nacional.', 'Pão para todos, mais ou menos.', { now: { treasury: -0.03, hunger: -0.3 }, groups: { workers: 2 } }),
    o('Vender o pão como souvenir.', 'Turista paga pelo tijolo.', { now: { treasury: 0.04, reputation: 0.3 } }),
    o('Importar pão do oásis vizinho.', 'Logística heroica.', { now: { treasury: -0.02 } })]),
  I('bt3_cup', 'A Copa das Micronações de futebol', 'Uma liga de micronações convida o reino a participar do torneio. Dispõe-se de cinco jogadores (um é o rei) e um goleiro com medo de bola.', 'Esporte como diplomacia de miniatura.', [
    o('Participar e treinar com seriedade.', 'Orgulho nacional (e derrota certa).', { now: { treasury: -0.03, legitimacy: 1.5, reputation: 0.8 }, groups: { youth: 3 } }),
    o('Mandar só o rei como técnico.', 'Poupa joelhos.', { now: { legitimacy: 0.5 } }),
    o('Recusar: "futebol é para quem tem bola".', 'Cômodo.', { groups: { youth: -2 } })]),
  I('bt3_language', 'Idioma oficial: invente um', 'O ministro da Cultura sugere criar uma língua própria do reino. A primeira palavra que inventou foi "areia". A segunda também.', 'Soberania linguística em construção.', [
    o('Criar o idioma oficial e escrever o dicionário.', 'Identidade cultural.', { now: { legitimacy: 2, education: 0.3 }, groups: { youth: 2 } }),
    o('Adotar o inglês e o árabe.', 'Realista.', { now: { reputation: 0.5 } }),
    o('Falar por gestos.', 'Mais simples.', { now: { legitimacy: -0.3 } })]),
  I('bt3_trial', 'Julgamento do camelo invasor', 'Um camelo vizinho foi flagrado pastando em território nacional. Moradores exigem um julgamento e uma cerimônia de deportação.', 'O primeiro caso do sistema judiciário.', [
    o('Julgar com juiz, advogado e plateia.', 'Espetáculo de justiça.', { now: { legitimacy: 1.5, reputation: 0.8 }, groups: { youth: 2 } }),
    o('Perdoar e oferecer cidadania ao camelo.', 'Simpatia garantida.', { now: { reputation: 1.2, legitimacy: 0.5 } }),
    o('Deportar com honras.', 'Rápido e simbólico.', { now: { legitimacy: 0.3 } })]),
  I('bt3_cell', 'Torre de celular: sinal ou paisagem?', 'Uma operadora quer instalar uma torre de celular em troca de contrato. O sinal chegaria a todo o reino e, de quebra, ao território vizinho.', 'Conectar-se é também ser vigiado.', [
    o('Aceitar a torre e cobrar aluguel.', 'Sinal e renda.', { now: { treasury: 0.04, tech: 1 }, groups: { youth: 3 } }),
    o('Aceitar com condição de dados abertos.', 'Transparência.', { now: { treasury: 0.02, tech: 0.8, reputation: 0.5 } }),
    o('Recusar: "silêncio é patrimônio".', 'Paz de espírito.', { groups: { youth: -2 } })]),
  I('bt3_coins', 'Moedas de latão para turistas', 'Um artesão propõe cunhar moedas comemorativas do reino. Os turistas adoram. Os colecionadores, mais ainda.', 'Numismática de nicho.', [
    o('Cunhar uma edição limitada.', 'Boa renda.', { now: { treasury: 0.06, reputation: 0.5 } }),
    o('Cunhar em massa.', 'Muito dinheiro; vira lembrancinha.', { now: { treasury: 0.1, reputation: -0.8 } }),
    o('Recusar.', 'Sem barulho.', {})]),
  I('bt3_constitution', 'A Constituição escrita num guardanapo', 'A assembleia dos sete cidadãos mais sérios propõe redigir uma Constituição. O rascunho, em um guardanapo, tem três artigos: "o rei manda", "o camelo tem razão" e "quando em dúvida, café".', 'Um Estado sem Constituição é um clube.', [
    o('Aprovar a Constituição do guardanapo.', 'Documento histórico (e engordurado).', { now: { legitimacy: 2, political: 1 } }),
    o('Contratar um jurista de verdade.', 'Texto sério e custoso.', { now: { treasury: -0.03, legitimacy: 1.5, reputation: 1, political: 1.5 } }),
    o('Manter a tradição oral.', 'Ninguém sabe o que vale.', { now: { legitimacy: -0.5 } })], 600),
  I('bt3_refugees', 'Famílias fugindo de um conflito pedem abrigo', 'Um pequeno grupo de refugiados de uma região em guerra chega à fronteira. Não há comida suficiente, mas o reino é, em tese, o único país que "não recusa ninguém".', 'O dilema mais sério do reino mais absurdo.', [
    o('Abrigar e dividir os recursos.', 'Humanitário e apertado.', { now: { treasury: -0.05, reputation: 3, qol: -0.3, health: -0.2 }, groups: { youth: 3 } }),
    o('Abrigar temporariamente e pedir ajuda da ONU.', 'Responsável.', { now: { treasury: -0.02, reputation: 2 }, rel: { all: 1 } }),
    o('Recusar: não há recursos.', 'Realista e duro.', { now: { reputation: -2, legitimacy: -1 } })]),
  I('bt3_blackout', 'Apagão: o gerador do palácio pifa', 'O único gerador do reino deixa de funcionar e o país mergulha no escuro. As estrelas, felizmente, são lindas.', 'Sem luz, a política vira poesia.', [
    o('Comprar um gerador novo.', 'Custo alto, luz de volta.', { now: { treasury: -0.06, qol: 0.5 } }),
    o('Instalar painéis solares de segunda mão.', 'Sustentável e remendado.', { now: { treasury: -0.03 }, long: [{ k: 's_energy', v: 1, d: 0 }] }),
    o('Declarar "a hora das estrelas" e seguir.', 'Festa e preguiça.', { now: { legitimacy: 0.5, qol: -0.3 }, groups: { youth: 1 } })]),
  I('bt3_mars', 'Cientistas escolhem o deserto para simular Marte', 'Uma agência espacial procura locais desolados para testar equipamentos de pouso marciano. Bir Tawil é "perfeitamente nada".', 'Reputação científica em troca de poeira.', [
    o('Receber os testes e cobrar aluguel.', 'Renda e prestígio.', { now: { treasury: 0.08, reputation: 2, tech: 1 } }),
    o('Exigir transferência de tecnologia.', 'Negocia o futuro.', { now: { treasury: 0.03 }, long: [{ k: 'tech', v: 1.5, d: 0 }] }),
    o('Recusar: "o planeta vermelho que se vire".', 'Orgulho terrestre.', {})]),
  I('bt3_scorpions', 'Invasão de escorpiões', 'Uma chuva rara provocou uma explosão de escorpiões. Há picadas, medo e um pedido de decreto real contra a espécie.', 'A natureza também tem sua política externa.', [
    o('Comprar soro antiescorpiônico e botas para todos.', 'Salva vidas.', { now: { treasury: -0.03, health: 1 } }),
    o('Declarar guerra aos escorpiões.', 'Teatro e bota.', { now: { legitimacy: 1, health: 0.2 }, groups: { military: 2 } }),
    o('Declarar os escorpiões cidadãos honorários.', 'Convivência radical.', { now: { health: -0.8, reputation: 0.5 } })]),
  I('bt3_mausoleum', 'O rei quer um mausoléu de pedra', 'O rei pede uma pirâmide própria "para quando chegar a hora". O arquiteto nacional (o sobrinho) propõe usar sacos de areia empilhados.', 'Faraós têm referências; reis de micronação também.', [
    o('Construir um mausoléu modesto de pedra.', 'Caro e simbólico.', { now: { treasury: -0.05, legitimacy: 1.5 }, groups: { military: 1 } }),
    o('Adotar a pirâmide de sacos de areia.', 'Barato e frágil.', { now: { treasury: -0.01, legitimacy: 0.5, reputation: 0.5 } }),
    o('Adiar: "reis não morrem, apenas viajam".', 'Teologia otimista.', {})]),
  I('bt3_climbers', 'Alpinistas hasteiam a bandeira do reino numa colina', 'Um grupo de alpinistas escalou a única colina da região e colocou lá a bandeira do reino, junto com uma garrafa térmica. As fotos viralizaram.', 'O ponto mais alto do país tem 40 metros.', [
    o('Oficializar a colina como Monte Real.', 'Turismo e orgulho.', { now: { reputation: 1.2, legitimacy: 1.2, treasury: 0.02 }, groups: { youth: 2 } }),
    o('Cobrar taxa de escalada.', 'Rendimento e picuinha.', { now: { treasury: 0.04, reputation: -0.3 } }),
    o('Ignorar.', 'Modéstia.', {})]),
  I('bt3_soda', 'Marca de refrigerante pede exclusividade', 'Uma grande marca de bebidas oferece patrocinar o reino em troca de ser a única vendida em território nacional — e de nomear o poço. O rei quer saber se haverá gelo.', 'Dinheiro com sabor de açúcar.', [
    o('Aceitar o patrocínio.', 'Receita e dentes.', { now: { treasury: 0.12, health: -0.3, reputation: -0.8 }, groups: { business: 2 } }),
    o('Aceitar sem exclusividade.', 'Menos dinheiro, mais liberdade.', { now: { treasury: 0.05 } }),
    o('Recusar: "o poço não tem preço".', 'Altivo e seco.', { now: { legitimacy: 1 } })]),
  I('bt3_newspaper', 'O primeiro jornal do reino', 'Um jovem lança um boletim impresso em folha A4 com o título "O Deserto Diário". A manchete da primeira edição: "Nada acontece, e todos sabem".', 'Imprensa em território onde tudo é segredo — porque ninguém liga.', [
    o('Apoiar a imprensa livre e dar uma sala.', 'Transparência e dor de cabeça.', { now: { civil: 1.5, legitimacy: 1 }, groups: { youth: 3, opposition: 1 } }),
    o('Exigir revisão prévia do rei.', 'Censura de bolso.', { now: { civil: -1.5, legitimacy: -1 }, groups: { youth: -3 } }),
    o('Comprar o jornal e virar o jornal oficial.', 'Propaganda e eficiência.', { now: { treasury: -0.02 }, long: [{ k: 'propaganda', v: 1.5, d: 0 }] })]),
  I('bt3_hackers', 'Hackers invadem o site do reino', 'O único site oficial exibiu, por três horas, uma foto de um gato gigante e a frase "ninguém reclama". O departamento de TI (um estagiário) está em pânico.', 'Primeiro ciberataque de um país sem computadores.', [
    o('Contratar uma empresa de segurança digital.', 'Reforço, caro para o orçamento.', { now: { treasury: -0.03, intel: 1 } }),
    o('Adotar o gato como mascote nacional.', 'Memes a favor.', { now: { reputation: 1, legitimacy: 0.5 }, groups: { youth: 3 } }),
    o('Desligar o site e voltar ao papel.', 'Retrocesso decente.', { now: { tech: -0.5 } })]),
  I('bt3_strike', 'Greve geral: os soldados, o camelo e o cozinheiro', 'Os onze soldados, o camelo e o cozinheiro do palácio param. Querem aumento, folga e menos discursos do rei. O camelo, em solidariedade, não se mexe.', 'O primeiro movimento sindical do reino.', [
    o('Negociar: mais folga e salário.', 'Acordo caro (para o orçamento).', { now: { treasury: -0.03, legitimacy: 1 }, groups: { military: 3, workers: 3 } }),
    o('Demitir todos (menos o camelo).', 'Drama e fome.', { now: { legitimacy: -2, efficiency: -1 }, groups: { military: -4, workers: -3 } }),
    o('O rei faz um discurso de 6 horas.', 'Vence pelo cansaço.', { now: { legitimacy: -0.5 }, groups: { workers: -1 } })], 500),
];

writeFileSync(out('issues_birtawil2.json'), JSON.stringify(L, null, 1));
const cp = out('content.json'), c = JSON.parse(readFileSync(cp, 'utf8'));
if (!c.issues.includes('issues_birtawil2')) { c.issues.push('issues_birtawil2'); writeFileSync(cp, JSON.stringify(c, null, 1)); }
console.log('questões de Bir Tawil (3ª leva):', L.length);
