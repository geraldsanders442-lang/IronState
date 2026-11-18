export const WORLD = 'red_world', CAT = 'Mundo Vermelho';
const P = (t, d, o) => ({ t, d, o });
const CAP = { min: { ax_econ: 15 } }, SOC = { max: { ax_econ: -15 } };
export const ARCS = [
  { id: 'fundopp', cond: CAP, role: 'power', spec: 'hostile', ctx: 'Num mundo vermelho, um governo capitalista é visto como ameaça ao sistema.', parts: [
    P('{power} descobre a sua oposição', 'Agentes de {power} procuram seus opositores: ofertas de dinheiro, gráficas clandestinas e bolsas de estudo. O Politburo de lá chama isso de "solidariedade internacional".', [['Expor o esquema publicamente.', 'D'], ['Vigiar e prender os intermediários.', 'R'], ['Fingir que não viu.', 'I']]),
    P('Dinheiro vermelho na praça', 'Sindicatos e jornais de oposição passam a receber verbas de {power}. As greves coincidem suspeitosamente com o calendário de lá.', [['Proibir financiamento estrangeiro de partidos.', 'F'], ['Comprar a lealdade dos sindicatos.', 'B'], ['Negociar com {power} uma trégua de propaganda.', 'D']]),
    P('A oposição ergue a bandeira vermelha', 'A oposição apoiada por {power} marca um grande protesto nacional. Os aliados dizem que o capitalismo acabou; você só resiste pela força.', [['Reprimir a manifestação.', 'R'], ['Abrir diálogo e convocar eleições locais.', 'E'], ['Mobilizar o exército nas fronteiras.', 'W']])] },
  { id: 'embargo', cond: CAP, role: 'power', spec: 'hostile', parts: [
    P('Embargo do bloco vermelho', '{power} lidera um boicote ao seu comércio: navios param nos portos e fornecedores cancelam contratos "por razões ideológicas".', [['Procurar mercados alternativos.', 'G'], ['Retaliar com tarifas.', 'V'], ['Pedir uma conversa a {power}.', 'D']]),
    P('Contrabando e mercado paralelo', 'O embargo cria uma economia de sombras: caminhões cruzam a fronteira à noite e os preços sobem nas lojas.', [['Legalizar parte do comércio paralelo.', 'M'], ['Combater o contrabando.', 'R'], ['Subsidiar os produtos básicos.', 'S']]),
    P('Cerco e oferta', '{power} oferece suspender o embargo se você aceitar "assessores" na sua economia e abrir mão de privatizações.', [['Aceitar os assessores.', 'C'], ['Recusar e resistir.', 'F'], ['Aceitar só parte e ganhar tempo.', 'D']])] },
  { id: 'spyring', cond: CAP, role: 'power', spec: 'hostile', parts: [
    P('Rede de espiões de {power}', 'A contrainteligência acha uma rede de {power} infiltrada em ministérios. Eles procuravam os planos de privatização.', [['Prender todos e fazer um julgamento público.', 'R'], ['Usar a rede para passar informação falsa.', 'T'], ['Expulsar os diplomatas.', 'F']]),
    P('Caça às bruxas', 'Com medo de infiltrados, ministérios denunciam colegas. O serviço secreto cresce e ninguém confia em ninguém.', [['Limitar a caça com ordem executiva.', 'E'], ['Deixar a caça rolar.', 'N'], ['Criar uma agência civil de controle.', 'P']]),
    P('{power} responde', 'Em retaliação, {power} expulsa seus embaixadores e acusa você de atos hostis na ONU.', [['Denunciar a hipocrisia de {power} em fórum internacional.', 'D'], ['Retaliar com expulsões simétricas.', 'F'], ['Aceitar o isolamento diplomático.', 'I']])] },
  { id: 'defect', cond: CAP, parts: [
    P('Fuga de cérebros para a "terra livre"', 'Num mundo vermelho, o seu país é destino de quem foge de planos quinquenais. Cientistas e artistas pedem asilo em massa.', [['Abrir as portas e oferecer empregos.', 'M'], ['Selecionar só quem tem qualificação.', 'G'], ['Limitar a entrada para evitar atritos.', 'C']]),
    P('Os asilados falam', 'Refugiados denunciam em entrevistas a repressão em países vizinhos. Chancelarias protestam: você é acusado de "acolher agentes".', [['Dar tribuna e proteger os asilados.', 'D'], ['Silenciar as entrevistas.', 'R'], ['Reassentar longe da fronteira.', 'B']]),
    P('Uma comunidade nova', 'Os asilados abrem universidades, empresas e jornais. A economia sente o impulso, mas os vizinhos fazem ameaças.', [['Apoiar as novas empresas.', 'G'], ['Fiscalizar de perto.', 'N'], ['Pedir que moderem o discurso.', 'C']])] },
  { id: 'intloan', cond: SOC, role: 'power', spec: 'friendly', ctx: 'A Internacional Socialista financia os seus membros, mas cobra lealdade.', parts: [
    P('Empréstimo da Internacional', '{power} oferece um empréstimo fraterno: sem juros, mas com metas de produção e revisão do seu plano.', [['Aceitar o empréstimo.', 'A'], ['Recusar para manter a autonomia.', 'F'], ['Negociar prazos e metas.', 'D']]),
    P('Os auditores chegam', 'Técnicos de {power} fiscalizam seus ministérios. Querem acesso aos livros e ao desenho do plano.', [['Cooperar abertamente.', 'C'], ['Mostrar números "embelezados".', 'T'], ['Restringir o acesso.', 'N']]),
    P('Cobrança de lealdade', '{power} pede que você vote com a Internacional em tudo e envie tropas simbólicas a uma missão fraterna.', [['Enviar as tropas.', 'W'], ['Votar com {power} mas sem tropas.', 'D'], ['Recusar e arriscar o apoio.', 'F']])] },
  { id: 'quota', cond: SOC, role: 'power', spec: 'friendly', parts: [
    P('Cotas do Plano Quinquenal', 'O Plano coordenado por {power} atribui ao seu país cotas de aço, trigo e armamentos. As metas são ambiciosas.', [['Cumprir à risca.', 'P'], ['Pedir cotas menores.', 'D'], ['Falsificar relatórios.', 'T']]),
    P('Fábricas de medalhas', 'Diretores falsificam números para escapar de punições. O estoque real não aparece nos armazéns.', [['Premiar os honestos.', 'E'], ['Punir os fraudadores.', 'N'], ['Aceitar a ficção.', 'I']]),
    P('Fome nas províncias', 'A cota de trigo foi exportada para {power} e as províncias passam fome. Camponeses abandonam as aldeias.', [['Reter o trigo e distribuí-lo.', 'S'], ['Manter as cotas e importar comida.', 'A'], ['Esconder a crise.', 'R']])] },
  { id: 'heresy', cond: SOC, parts: [
    P('Acusação de "revisionismo"', 'Uma ala do partido acusa seu ministro da economia de revisionismo por defender estímulos de mercado.', [['Defender o ministro.', 'M'], ['Sacrificar o ministro.', 'N'], ['Abrir um debate interno.', 'E']]),
    P('Congresso de depuração', 'O partido convoca um congresso: cada ala quer limpar a outra. A imprensa estatal pinta tudo com a mesma tinta.', [['Moderar o congresso.', 'D'], ['Aproveitar para fortalecer seu grupo.', 'N'], ['Delegar ao comitê.', 'I']]),
    P('Os expurgados', 'Quem foi expulso forma um grupo dissidente e fala em "socialismo com rosto humano".', [['Prender os líderes.', 'R'], ['Reabilitá-los discretamente.', 'E'], ['Exilá-los.', 'C']])] },
  { id: 'unionmerge', cond: SOC, parts: [
    P('A proposta de união', 'Dirigentes de países vizinhos propõem uma "união de repúblicas irmãs", como a URSS: um só exército, moeda e partido.', [['Aceitar e entrar na união.', 'P'], ['Propor uma confederação frouxa.', 'D'], ['Recusar: soberania antes de tudo.', 'F']]),
    P('Quem comanda a união?', 'Dois partidos disputam a presidência da união. O seu país tem peso, mas os vizinhos querem alternância.', [['Reivindicar a liderança.', 'F'], ['Aceitar rodízio.', 'D'], ['Barganhar cargos e fábricas.', 'B']]),
    P('Fronteiras internas', 'A união redesenha as repúblicas. Há minorias que perdem autonomia e fábricas que mudam de dono.', [['Garantir autonomia cultural.', 'E'], ['Centralizar tudo em um plano.', 'P'], ['Premiar quem apoiou você.', 'B']])] },
  { id: 'blackmkt', parts: [
    P('Mercado negro por toda parte', 'Meias, jeans, discos e comida circulam em mercados escondidos. Agentes fecham um por dia e outro abre.', [['Legalizar mercados com imposto.', 'M'], ['Reforçar a repressão.', 'R'], ['Ampliar o racionamento oficial.', 'S']]),
    P('Fortunas na sombra', 'Revendedores acumulam fortunas e subornam fiscais. A corrupção contamina o aparato.', [['Confiscar as fortunas.', 'N'], ['Taxar e legalizar.', 'M'], ['Negociar com os "grandes".', 'B']]),
    P('A cidade do bazar', 'Um distrito inteiro vive do comércio informal e pede reconhecimento.', [['Criar zona econômica especial.', 'G'], ['Demolir o bazar.', 'R'], ['Tolerar com propinas.', 'I']])] },
  { id: 'perestroika', cond: SOC, parts: [
    P('A ala reformista', 'Jovens quadros pedem "reestruturação": autonomia de empresas, imprensa mais livre e metas flexíveis.', [['Apoiar as reformas.', 'E'], ['Esperar e observar.', 'I'], ['Silenciar os reformistas.', 'R']]),
    P('Transparência demais?', 'A abertura revela erros do passado. Arquivos mostram fome e expurgos; o prestígio do partido cai.', [['Seguir revelando a verdade.', 'E'], ['Limitar o acesso aos arquivos.', 'N'], ['Culpar o antecessor.', 'C']]),
    P('A linha-dura reage', 'A ala conservadora ameaça um golpe contra as reformas, com apoio de generais.', [['Ceder aos generais.', 'C'], ['Enfrentar e demitir os generais.', 'F'], ['Convocar um plebiscito.', 'E']])] },
  { id: 'radiofree', role: 'power', spec: 'hostile', parts: [
    P('Rádio clandestina', 'Uma rádio de {power} transmite no seu idioma: notícias proibidas, música e apelos à greve.', [['Interferir nas ondas.', 'N'], ['Montar uma rádio concorrente.', 'P'], ['Deixar ouvir.', 'E']]),
    P('Panfletos e fitas', 'Fitas cassete e panfletos de {power} circulam em escolas e fábricas. Jovens os reproduzem às escondidas.', [['Prender os distribuidores.', 'R'], ['Importar as mesmas músicas legalmente.', 'E'], ['Substituir por cultura própria.', 'S']]),
    P('Troca cultural', '{power} propõe um intercâmbio: cinema, livros e músicas dos dois lados.', [['Aceitar.', 'D'], ['Aceitar com censura.', 'N'], ['Recusar.', 'F']])] },
  { id: 'collect', cond: SOC, parts: [
    P('Coletivização do campo', 'Tecnocratas pedem que os pequenos agricultores sejam reunidos em fazendas coletivas modernas.', [['Coletivizar com incentivos.', 'P'], ['Coletivizar à força.', 'R'], ['Manter a pequena propriedade.', 'M']]),
    P('Resistência rural', 'Camponeses queimam colheitas em vez de entregá-las. Em aldeias distantes, o partido é enxotado.', [['Enviar o exército.', 'W'], ['Dar concessões.', 'S'], ['Usar propaganda.', 'P']]),
    P('A colheita do plano', 'A produção cai no primeiro ano e depois se recupera, entre dúvidas.', [['Investir em maquinário.', 'G'], ['Premiar fazendas modelo.', 'B'], ['Declarar vitória.', 'I']])] },
  { id: 'refugees', role: 'nb', spec: 'any', parts: [
    P('Fronteira em chamas', 'Uma revolta no vizinho {nb} empurra milhares de refugiados para a sua fronteira. Há ideólogos escondidos entre eles.', [['Abrir a fronteira.', 'S'], ['Fechar e fortificar.', 'W'], ['Criar campos fora do território.', 'D']]),
    P('Acampamentos e politização', 'Nos campos, comitês políticos recrutam e discutem estratégias. {nb} pressiona.', [['Repatriar os refugiados.', 'C'], ['Absorver e integrar.', 'E'], ['Vigiar com o serviço secreto.', 'T']]),
    P('Pacto com {nb}', '{nb} propõe um acordo: reconhecimento mútuo em troca da entrega de líderes exilados.', [['Aceitar o acordo.', 'C'], ['Recusar.', 'F'], ['Negociar uma anistia.', 'D']])] },
  { id: 'cult', cond: { max: { ax_econ: -10 }, min: { ax_auth: 10 } }, parts: [
    P('Retratos nas ruas', 'O partido sugere erguer estátuas e retratos seus em toda praça. Pesquisas internas indicam que ajuda na mobilização.', [['Autorizar o culto.', 'N'], ['Vetar: "o povo constrói o socialismo".', 'E'], ['Permitir só em escolas.', 'H']]),
    P('Heróis e traidores', 'Historiadores reescrevem a história para exaltar sua trajetória. Quem discorda é demitido.', [['Apoiar a revisão.', 'N'], ['Garantir independência acadêmica.', 'E'], ['Nomear uma comissão.', 'P']]),
    P('Sucessão', 'Alas do partido discutem quem herdaria o poder e começam a cortejar generais.', [['Escolher um sucessor.', 'P'], ['Deixar em aberto.', 'I'], ['Eliminar rivais.', 'R']])] },
  { id: 'lastliberal', cond: CAP, role: 'power', spec: 'friendly', ctx: 'No Mundo Vermelho, os poucos Estados capitalistas se veem como irmãos de resistência.', parts: [
    P('O clube das ilhas livres', '{power}, outro país de mercado, propõe um pacto de defesa entre as "ilhas livres" do mundo vermelho.', [['Assinar o pacto.', 'W'], ['Propor só cooperação comercial.', 'D'], ['Recusar para não provocar.', 'C']]),
    P('Exercício conjunto', 'Os exércitos do pacto fazem manobras na fronteira. O bloco vermelho emite protestos inflamados.', [['Ampliar os exercícios.', 'F'], ['Reduzir o tom.', 'D'], ['Convidar observadores neutros.', 'E']]),
    P('Prova de fogo', 'Uma crise de fronteira testa o pacto: {power} pede que você mande tropas.', [['Mandar tropas.', 'W'], ['Enviar apoio logístico.', 'S'], ['Retirar-se do pacto.', 'C']])] },
];
