export const WORLD = 'cold_war_world', CAT = 'Guerra Fria Eterna';
const P = (t, d, o) => ({ t, d, o });
const CAP = { min: { ax_econ: 15 } }, SOC = { max: { ax_econ: -15 } }, NAL = { min: { ax_global: -100 }, max: { ax_align: 100 } };
export const ARCS = [
  { id: 'coupfund', cond: CAP, role: 'power', spec: 'hostile', ctx: 'Na Guerra Fria Eterna, o bloco oposto tenta virar governos pelo mundo todo.', parts: [
    P('Dinheiro do outro bloco', 'A inteligência de {power} financia sindicatos e partidos de esquerda contra o seu governo.', [['Prender intermediários.', 'R'], ['Contra-atacar com propaganda.', 'T'], ['Apelar à ONU.', 'D']]),
    P('Greve geral', 'Uma greve geral paralisa o país por semanas, organizada por sindicatos com apoio de {power}.', [['Negociar salários.', 'S'], ['Mandar o exército.', 'R'], ['Responsabilizar {power}.', 'F']]),
    P('Governo paralelo', 'A oposição apoiada por {power} proclama um "governo popular" e pede reconhecimento.', [['Esmagar o movimento.', 'W'], ['Chamar eleições.', 'E'], ['Pedir ajuda ao seu bloco.', 'A']])] },
  { id: 'redscare', cond: CAP, parts: [
    P('Caça aos vermelhos', 'Um senador denuncia "espiões do bloco oposto" em escolas e fábricas e pede uma comissão de inquérito.', [['Apoiar a comissão.', 'N'], ['Rejeitar a caça.', 'E'], ['Criar comissão moderada.', 'D']]),
    P('Listas negras', 'Artistas e professores ficam sem emprego por suspeitas. Muitos se calam.', [['Manter as listas.', 'R'], ['Acabar com as listas.', 'E'], ['Indenizar vítimas.', 'S']]),
    P('Reabilitação', 'Anos depois, acusações se mostram falsas. A imprensa cobra desculpas.', [['Pedir desculpas.', 'E'], ['Negar.', 'N'], ['Silenciar.', 'R']])] },
  { id: 'capscare', cond: SOC, role: 'power', spec: 'hostile', parts: [
    P('Propaganda do bloco capitalista', 'Filmes, discos e jeans de {power} chegam ao seu país por caminhos secretos. O partido teme a "contaminação".', [['Censurar.', 'N'], ['Produzir cultura própria.', 'P'], ['Permitir de forma limitada.', 'E']]),
    P('Espiões do mercado', 'Dissidentes presos confessam que receberam dinheiro de {power}. Há suspeita de infiltração em ministérios.', [['Expurgar ministérios.', 'R'], ['Contra-espionagem.', 'T'], ['Negar.', 'I']]),
    P('Propaganda reversa', 'Você pode revelar escândalos de {power} em rádios internacionais.', [['Fazer a campanha.', 'F'], ['Evitar.', 'D'], ['Negociar uma trégua.', 'D']])] },
  { id: 'proxy', role: 'nb', spec: 'any', parts: [
    P('Guerra por procuração', 'No vizinho {nb}, os dois blocos armam facções rivais. Você é cobrado a escolher um lado.', [['Apoiar a facção do seu bloco.', 'W'], ['Neutralidade.', 'D'], ['Mediar.', 'D']]),
    P('Armas e conselheiros', 'Conselheiros chegam ao front. Corre o risco de um incidente direto entre blocos.', [['Enviar conselheiros.', 'T'], ['Enviar só armas.', 'A'], ['Cortar a ajuda.', 'C']]),
    P('Incidente', 'Um avião de reconhecimento é abatido na fronteira com {nb}. Os blocos trocam acusações.', [['Pedir desculpas.', 'C'], ['Retaliar.', 'F'], ['Chamar o telefone vermelho.', 'D']])] },
  { id: 'spacerace', parts: [
    P('Corrida espacial', 'Cientistas pedem verba para um programa espacial: o prestígio do bloco está em jogo.', [['Financiar o programa.', 'G'], ['Cooperar com aliados.', 'D'], ['Recusar.', 'I']]),
    P('Foguete na plataforma', 'O primeiro lançamento explode. Jornais estrangeiros ridicularizam.', [['Investigar e punir.', 'N'], ['Apoiar os cientistas.', 'S'], ['Esconder o fracasso.', 'R']]),
    P('Órbita', 'O segundo lançamento chega à órbita. Multidões saem às ruas.', [['Realizar um desfile.', 'S'], ['Investir mais.', 'G'], ['Usar o programa como arma.', 'W']])] },
  { id: 'nuclearscare', role: 'power', spec: 'hostile', parts: [
    P('Corrida de arsenais', '{power} testa um míssil de longo alcance. Generais pedem um programa próprio de mísseis.', [['Aprovar o programa.', 'W'], ['Propor tratado de limitação.', 'D'], ['Ignorar.', 'I']]),
    P('Teste', 'O teste de seu míssil provoca protestos pacifistas e críticas de neutros.', [['Prosseguir.', 'F'], ['Suspender.', 'C'], ['Convidar observadores.', 'D']]),
    P('Linha direta', '{power} propõe criar uma linha direta entre as capitais para evitar acidentes.', [['Aceitar.', 'D'], ['Recusar.', 'F'], ['Condicionar a acordo.', 'B']])] },
  { id: 'nonaligned', parts: [
    P('Cúpula dos não alinhados', 'Vários países pedem que você sedie uma cúpula dos não alinhados.', [['Sediar.', 'D'], ['Declinar.', 'I'], ['Sediar com pressa.', 'G']]),
    P('Pressão dos blocos', 'Os dois blocos oferecem presentes para você dizer o que querem na cúpula.', [['Aceitar de ambos.', 'B'], ['Recusar.', 'E'], ['Aceitar de um.', 'A']]),
    P('Resultado', 'A cúpula emite uma declaração dura. Os blocos reagem.', [['Assinar.', 'D'], ['Moderar.', 'C'], ['Retirar-se.', 'I']])] },
  { id: 'berlinwall', cond: { min: { ax_auth: 10 } }, parts: [
    P('Muro na fronteira', 'Fugas em massa para o outro lado pressionam o governo a erguer um muro.', [['Construir o muro.', 'N'], ['Reformar para reter.', 'S'], ['Abrir.', 'E']]),
    P('Fugitivos', 'Fugitivos tentam passar à noite; guardas atiram. A imprensa estrangeira divulga as imagens.', [['Ordenar atirar.', 'R'], ['Ordenar não atirar.', 'E'], ['Negar.', 'I']]),
    P('Tensão no checkpoint', 'Um incidente entre soldados quase escala. Os blocos mobilizam tropas.', [['Recuar.', 'C'], ['Reforçar.', 'W'], ['Negociar.', 'D']])] },
  { id: 'spyexchange', role: 'power', spec: 'any', parts: [
    P('Troca de espiões', 'Uma ponte, a neblina e dois espiões: {power} propõe uma troca discreta.', [['Aceitar.', 'D'], ['Exigir mais.', 'F'], ['Recusar.', 'I']]),
    P('Escândalo', 'A imprensa descobre a troca. Parlamentares pedem explicações.', [['Admitir.', 'E'], ['Negar.', 'R'], ['Culpar o serviço secreto.', 'N']]),
    P('Mole', 'A contrainteligência suspeita de um agente duplo na cúpula.', [['Prender suspeitos.', 'R'], ['Investigar com calma.', 'T'], ['Esquecer.', 'I']])] },
  { id: 'olympics', parts: [
    P('Olimpíadas', 'Seu país é convidado a sediar as Olimpíadas, e os blocos prometem boicote mútuo.', [['Sediar.', 'G'], ['Boicotar.', 'F'], ['Declinar.', 'I']]),
    P('Atletas desertores', 'Atletas fogem para o bloco oposto. A mídia cobre ao vivo.', [['Fechar fronteiras.', 'N'], ['Aceitar as defecções.', 'D'], ['Perseguir.', 'R']]),
    P('Medalhas', 'Seu país vence muitas medalhas. Dirigentes celebram; críticos denunciam doping de Estado.', [['Celebrar.', 'S'], ['Investigar.', 'E'], ['Silenciar.', 'R']])] },
  { id: 'embargo', role: 'power', spec: 'hostile', parts: [
    P('Embargo de tecnologia', 'O bloco rival proíbe a venda de computadores e peças para seu país.', [['Contrabando.', 'T'], ['Criar indústria própria.', 'G'], ['Pedir exceção.', 'D']]),
    P('Mercado negro de chips', 'Redes de contrabando levam chips a universidades e militares.', [['Combater.', 'R'], ['Usar.', 'T'], ['Regulamentar.', 'M']]),
    P('Corrida tecnológica', 'Seus engenheiros desenvolvem uma alternativa. Capitais rivais ficam alarmadas.', [['Ampliar o investimento.', 'G'], ['Vender para aliados.', 'M'], ['Manter em sigilo.', 'T']])] },
  { id: 'defectgen', parts: [
    P('General desertor', 'Um general do alto comando pede asilo do outro lado e promete revelar planos.', [['Prender a família.', 'R'], ['Reforçar a segurança.', 'N'], ['Mudar os planos.', 'T']]),
    P('Planos vazados', 'Os planos aparecem na imprensa. Os aliados estranham.', [['Admitir.', 'E'], ['Negar.', 'R'], ['Dizer que é falso.', 'T']]),
    P('Reconstrução do comando', 'O novo comando precisa recuperar a confiança das tropas.', [['Promover jovens.', 'G'], ['Manter veteranos.', 'N'], ['Reformar a hierarquia.', 'P']])] },
  { id: 'rockmusic', parts: [
    P('Rock na cortina', 'Discos de rock do outro bloco chegam em fitas. Jovens vestem jeans e cabelos longos.', [['Proibir.', 'N'], ['Criar um rock oficial.', 'P'], ['Tolerar.', 'E']]),
    P('Show proibido', 'Um show clandestino reúne milhares e termina com batida policial.', [['Prender os organizadores.', 'R'], ['Autorizar shows.', 'E'], ['Cobrar ingressos.', 'M']]),
    P('Festival oficial', 'Dirigentes propõem um festival para canalizar a juventude.', [['Realizar.', 'S'], ['Vetar.', 'N'], ['Realizar com censura.', 'N']])] },
  { id: 'grain', role: 'power', spec: 'friendly', parts: [
    P('Grãos do bloco amigo', 'Uma seca ameaça a colheita. {power} oferece grãos a preço camarada em troca de apoio.', [['Aceitar.', 'A'], ['Pagar mais para ter liberdade.', 'M'], ['Racionar.', 'S']]),
    P('Dívida do pão', '{power} cobra apoio em votos internacionais pela ajuda recebida.', [['Votar com {power}.', 'C'], ['Votar livremente.', 'F'], ['Negociar.', 'D']]),
    P('Silos', 'O governo propõe estocar grãos e criar uma reserva estratégica.', [['Criar.', 'G'], ['Deixar ao mercado.', 'M'], ['Importar sempre.', 'I']])] },
  { id: 'cuba', cond: NAL, role: 'nb', spec: 'any', parts: [
    P('Base estrangeira', 'Um bloco quer instalar uma base de mísseis em seu território. Seu vizinho {nb} está em alerta.', [['Aceitar a base.', 'W'], ['Recusar.', 'D'], ['Aceitar só radares.', 'T']]),
    P('Crise dos mísseis', 'Os blocos mobilizam navios, e {nb} fecha o espaço aéreo. A ameaça é real.', [['Manter a base.', 'F'], ['Retirar.', 'C'], ['Aceitar mediação.', 'D']]),
    P('Acordo secreto', 'Os blocos acordam retirar mísseis em troca de promessas secretas.', [['Aceitar.', 'D'], ['Exigir publicidade.', 'E'], ['Rejeitar.', 'F']])] },
];
