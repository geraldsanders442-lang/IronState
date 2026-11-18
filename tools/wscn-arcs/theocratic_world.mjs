export const WORLD = 'theocratic_world', CAT = 'Mundo Teocrático';
const P = (t, d, o) => ({ t, d, o });
const SEC = { max: { ax_relig: -15 } }, DEV = { min: { ax_relig: 15 } }, PRG = { max: { ax_trad: -10 } };
export const ARCS = [
  { id: 'heretic', cond: SEC, role: 'power', spec: 'hostile', ctx: 'Num mundo de clérigos no poder, um governo secular é chamado de herege.', parts: [
    P('{power} declara você herege', 'Líderes religiosos de {power} proclamam seu governo "ímpio" e pedem que fiéis não obedeçam às leis seculares.', [['Responder com firmeza.', 'F'], ['Convidar líderes ao diálogo.', 'D'], ['Proibir sermões políticos.', 'R']]),
    P('Pregadores na fronteira', 'Pregadores de {power} atravessam a fronteira e arrastam multidões. Fiéis se recusam a pagar impostos.', [['Prender os pregadores.', 'R'], ['Negociar com o clero local.', 'B'], ['Montar festas laicas concorrentes.', 'S']]),
    P('A guerra santa', '{power} convoca uma "guerra santa" para libertar seu povo do governo secular.', [['Mobilizar as forças.', 'W'], ['Apelar à ONU.', 'D'], ['Abrir uma concordata religiosa.', 'C']])] },
  { id: 'fatwa', cond: SEC, role: 'power', spec: 'hostile', parts: [
    P('Édito contra o seu governo', 'Um conselho de clérigos de {power} emite um édito condenando suas leis seculares e prometendo recompensa a quem as desobedecer.', [['Prender quem seguir o édito.', 'R'], ['Responder com argumentos teológicos moderados.', 'E'], ['Ignorar.', 'I']]),
    P('Desobediência civil', 'Comerciantes fecham lojas nos dias santos exigidos pelo édito. A economia perde ritmo.', [['Impor multas.', 'N'], ['Conceder feriados.', 'C'], ['Negociar com os mercadores.', 'D']]),
    P('Mártir', 'Um pregador morre sob custódia. A mídia religiosa o chama de mártir.', [['Abrir investigação.', 'E'], ['Negar tudo.', 'R'], ['Pedir desculpas.', 'C']])] },
  { id: 'tithe', cond: DEV, parts: [
    P('O dízimo estatal', 'O clero propõe criar um dízimo nacional administrado pela igreja do Estado, em troca de lealdade.', [['Aceitar o dízimo.', 'H'], ['Manter os impostos comuns.', 'N'], ['Criar um sistema misto.', 'D']]),
    P('Caixa dos templos', 'Templos acumulam grandes fortunas e fazem obras sem fiscalização.', [['Auditar os templos.', 'N'], ['Deixar tudo.', 'I'], ['Parcerias com obras públicas.', 'G']]),
    P('Escândalo', 'Um bispo é pego em corrupção. Fiéis duvidam da hierarquia.', [['Punir o bispo.', 'E'], ['Abafar o caso.', 'R'], ['Reforma ética do clero.', 'D']])] },
  { id: 'holyalliance', cond: DEV, role: 'power', spec: 'friendly', parts: [
    P('Pacto de fé', '{power} convida seu governo para uma aliança baseada na mesma confissão, com defesa mútua.', [['Assinar a aliança.', 'W'], ['Propor aliança comercial.', 'D'], ['Recusar.', 'I']]),
    P('Peregrinação', 'Milhares de peregrinos de {power} cruzam seu território. O comércio cresce, mas o controle diminui.', [['Facilitar a peregrinação.', 'S'], ['Controlar fluxos.', 'N'], ['Taxar a passagem.', 'M']]),
    P('Cisma', 'Uma disputa doutrinária racha a aliança. {power} exige que você tome partido.', [['Apoiar {power}.', 'C'], ['Mediar.', 'D'], ['Declarar-se neutro.', 'I']])] },
  { id: 'pilgrim', parts: [
    P('Cidade santa', 'Uma cidade do seu país é considerada sagrada por várias religiões. Peregrinos exigem acesso livre.', [['Garantir acesso a todos.', 'D'], ['Restringir.', 'N'], ['Cobrar ingressos.', 'M']]),
    P('Brigas entre fiéis', 'Dois grupos religiosos brigam pelo controle de um santuário.', [['Dividir a administração.', 'D'], ['Escolher um lado.', 'H'], ['Fechar o santuário.', 'R']]),
    P('A reconstrução', 'O santuário é danificado num incêndio. Todos pedem reconstrução; ninguém concorda sobre quem paga.', [['Pagar com fundos públicos.', 'S'], ['Abrir doações.', 'B'], ['Deixar em ruínas.', 'I']])] },
  { id: 'schism', parts: [
    P('Cisma entre o clero', 'Duas escolas de pensamento do clero divergem sobre a doutrina econômica. Fiéis se dividem.', [['Apoiar o ramo reformista.', 'E'], ['Apoiar o conservador.', 'H'], ['Convocar um concílio.', 'D']]),
    P('Concílio', 'O concílio reúne clérigos e debate em público. Rádios transmitem cada discurso.', [['Presidir o concílio.', 'N'], ['Deixar que decidam.', 'I'], ['Exigir transparência.', 'E']]),
    P('Decisão', 'O concílio aprova uma doutrina de compromisso. Algumas alas se sentem traídas.', [['Reconhecer o resultado.', 'D'], ['Proibir os dissidentes.', 'R'], ['Dar autonomia às alas.', 'B']])] },
  { id: 'scholars', cond: PRG, parts: [
    P('Ciência e fé', 'Cientistas pedem verba para pesquisas que desafiam a leitura literal dos textos sagrados.', [['Financiar a pesquisa.', 'G'], ['Proibir o tema.', 'H'], ['Fazer comissão teológica.', 'D']]),
    P('Debates públicos', 'Pregadores atacam cientistas em sermões. Estudantes se mobilizam.', [['Defender os cientistas.', 'E'], ['Silenciar os debates.', 'N'], ['Fazer debates oficiais.', 'D']]),
    P('Universidade mista', 'Reformistas propõem uma universidade que une ciência e teologia.', [['Fundar a universidade.', 'G'], ['Vetar.', 'N'], ['Entregar ao clero.', 'H']])] },
  { id: 'holyland', role: 'nb', spec: 'any', parts: [
    P('Terra sagrada em disputa', 'Você e {nb} reivindicam um vale considerado sagrado pelas duas fés.', [['Reivindicar com firmeza.', 'F'], ['Propor gestão compartilhada.', 'D'], ['Ceder.', 'C']]),
    P('Marcha de fiéis', 'Milhares de fiéis marcham ao vale e entram em conflito com a guarda de {nb}.', [['Apoiar a marcha.', 'W'], ['Impedir a marcha.', 'R'], ['Mandar mediadores.', 'D']]),
    P('Cessar-fogo santo', '{nb} propõe uma trégua nos dias sagrados com liberdade de culto para ambos.', [['Aceitar.', 'D'], ['Exigir mais.', 'F'], ['Recusar.', 'W']])] },
  { id: 'apostates', cond: SEC, parts: [
    P('Apóstatas', 'Em seu país, uma minoria deixa a fé oficial dos países vizinhos e pede asilo ao seu governo laico.', [['Acolher.', 'E'], ['Restringir.', 'C'], ['Deixar cada país resolver.', 'I']]),
    P('Perseguidos na fronteira', 'Fugitivos contam histórias de perseguição, e jornais locais exigem ação.', [['Mandar ajuda humanitária.', 'S'], ['Abrir corredores.', 'D'], ['Fechar a fronteira.', 'N']]),
    P('Comunidade nova', 'Os asilados criam bairros, escolas e organizações culturais. O clero vizinho protesta.', [['Apoiar a comunidade.', 'S'], ['Fiscalizar.', 'N'], ['Integrar gradualmente.', 'D']])] },
  { id: 'miracle', parts: [
    P('Milagre ou fraude?', 'Surge um suposto milagre numa aldeia. Multidões vêm de longe; céticos pedem investigação.', [['Declarar oficialmente o milagre.', 'H'], ['Investigar com cientistas.', 'E'], ['Ignorar.', 'I']]),
    P('Comércio de relíquias', 'Surgem vendedores de relíquias, hotéis e feiras ao redor da aldeia.', [['Regular o comércio.', 'M'], ['Proibir.', 'N'], ['Taxar.', 'M']]),
    P('Peregrinação nacional', 'O milagre vira festa nacional. A fé e o turismo crescem.', [['Investir em estradas.', 'G'], ['Criar feriado.', 'H'], ['Manter discreto.', 'I']])] },
  { id: 'sharia', cond: DEV, parts: [
    P('Código religioso', 'Clérigos propõem que o código civil seja substituído por um código religioso.', [['Adotar.', 'H'], ['Adotar em partes.', 'D'], ['Recusar.', 'E']]),
    P('Tribunais religiosos', 'Os novos tribunais condenam por heresia e a comunidade internacional protesta.', [['Limitar as penas.', 'E'], ['Defender os tribunais.', 'F'], ['Criar apelações civis.', 'D']]),
    P('Fuga de profissionais', 'Médicos, professores e empresários deixam o país.', [['Reter com incentivos.', 'S'], ['Proibir saídas.', 'N'], ['Aceitar.', 'I']])] },
  { id: 'bhikkhu', role: 'power', spec: 'friendly', parts: [
    P('Missão de monges', '{power} envia monges e professores para fundar escolas religiosas no seu país.', [['Receber de braços abertos.', 'D'], ['Controlar o currículo.', 'N'], ['Recusar.', 'I']]),
    P('Escolas paralelas', 'As escolas religiosas competem com as estatais. Pais as preferem.', [['Integrar ao sistema público.', 'P'], ['Deixar paralelas.', 'I'], ['Fechar.', 'R']]),
    P('Lealdade dividida', 'Egressos passam a seguir ordens do clero estrangeiro, e o Estado perde autoridade.', [['Exigir lealdade ao Estado.', 'N'], ['Negociar com {power}.', 'D'], ['Aceitar.', 'C']])] },
  { id: 'inquisition', parts: [
    P('Tribunal de fé', 'Conselheiros propõem um tribunal para punir blasfêmia e sacrilégio.', [['Criar o tribunal.', 'N'], ['Rejeitar.', 'E'], ['Criar um tribunal só com penas leves.', 'D']]),
    P('Denúncias', 'Vizinhos se denunciam por rancores pessoais. Cartórios lotam de acusações.', [['Reforçar o tribunal.', 'R'], ['Reduzir os poderes.', 'E'], ['Perdoar em massa.', 'C']]),
    P('Reação popular', 'Praças enchem de manifestações contra os abusos.', [['Reprimir.', 'R'], ['Extinguir o tribunal.', 'E'], ['Reformar.', 'D']])] },
  { id: 'charity', parts: [
    P('Redes de caridade', 'Ordens religiosas distribuem comida e remédios, ganhando mais confiança que o Estado.', [['Cooperar com elas.', 'D'], ['Competir com programas estatais.', 'S'], ['Controlar.', 'N']]),
    P('Eleições das ordens', 'As ordens lançam candidatos próprios nas eleições locais.', [['Permitir.', 'E'], ['Proibir.', 'R'], ['Criar cotas.', 'B']]),
    P('Estado paralelo', 'As ordens administram hospitais e escolas melhor que o Estado.', [['Absorver a rede.', 'P'], ['Deixar a rede.', 'I'], ['Pactuar divisão de tarefas.', 'D']])] },
  { id: 'crusade', role: 'power', spec: 'hostile', cond: DEV, parts: [
    P('Convocação para a cruzada', '{power}, de outra fé, ocupa uma cidade sagrada. Clérigos do seu país pedem uma cruzada.', [['Convocar a cruzada.', 'W'], ['Negociar.', 'D'], ['Esperar.', 'I']]),
    P('Os voluntários', 'Voluntários fanáticos partem sem coordenação; muitos morrem de fome e doença.', [['Organizar o exército.', 'W'], ['Impedir as partidas.', 'R'], ['Financiar a viagem.', 'S']]),
    P('Cerco', 'As tropas cercam a cidade. {power} propõe trégua em troca de acesso livre.', [['Aceitar.', 'D'], ['Atacar.', 'W'], ['Pedir mais.', 'F']])] },
];
