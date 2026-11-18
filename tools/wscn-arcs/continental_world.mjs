export const WORLD = 'continental_world', CAT = 'Mundo das Uniões';
const P = (t, d, o) => ({ t, d, o });
const NAT = { min: { ax_nation: 15 } }, GLO = { min: { ax_global: 15 } }, SOV = { max: { ax_global: -10 } };
export const ARCS = [
  { id: 'brexit', cond: NAT, role: 'bloc', spec: 'own', ctx: 'Num mundo de superblocos, os nacionalistas sonham em sair da união.', parts: [
    P('Plebiscito de saída', 'Partidos nacionalistas pedem um plebiscito para sair de {bloc} e recuperar a moeda e a soberania.', [['Convocar o plebiscito.', 'E'], ['Rejeitar.', 'N'], ['Negociar autonomia dentro do bloco.', 'D']]),
    P('Campanha', 'A campanha é feroz. {bloc} avisa que quem sair perderá acesso ao mercado comum e à moeda.', [['Apoiar a saída.', 'F'], ['Fazer campanha pela permanência.', 'D'], ['Deixar o povo decidir.', 'I']]),
    P('O dia seguinte', 'O resultado é apertado, e todos os lados contestam. O bloco exige uma decisão em semanas.', [['Executar a saída.', 'F'], ['Renegociar.', 'D'], ['Anular o resultado.', 'N']])] },
  { id: 'levy', role: 'bloc', spec: 'own', parts: [
    P('Imposto da união', '{bloc} cria um tributo comum para financiar o exército e as obras continentais.', [['Aceitar o tributo.', 'D'], ['Aceitar com isenção.', 'B'], ['Recusar.', 'F']]),
    P('Fraude fiscal', 'Empresas fogem do imposto usando paraísos fiscais internos do bloco.', [['Fechar os paraísos.', 'N'], ['Taxar com alíquota mínima.', 'M'], ['Deixar.', 'I']]),
    P('Obras continentais', 'Com o fundo comum, são anunciadas ferrovias e redes elétricas. Seu país disputa os projetos.', [['Pleitear obras.', 'G'], ['Aceitar a divisão.', 'D'], ['Ficar de fora.', 'I']])] },
  { id: 'monetary', cond: GLO, role: 'bloc', spec: 'own', parts: [
    P('Moeda única', '{bloc} propõe a adoção de uma moeda única, com banco central comum.', [['Adotar a moeda.', 'M'], ['Adotar com regras.', 'D'], ['Recusar.', 'F']]),
    P('Troca de moeda', 'A conversão causa filas, confusão e inflação em produtos básicos.', [['Controlar preços.', 'P'], ['Ajudar os pobres.', 'S'], ['Deixar o mercado.', 'M']]),
    P('Crise do euro-irmão', 'Um país do bloco quebra e pede ajuda; as regras exigem austeridade.', [['Ajudar o vizinho.', 'S'], ['Exigir austeridade.', 'N'], ['Sair do acordo.', 'C']])] },
  { id: 'army', role: 'bloc', spec: 'own', parts: [
    P('Exército comum', '{bloc} propõe criar um exército continental, com comando unificado.', [['Aderir.', 'W'], ['Aderir com limites.', 'D'], ['Rejeitar.', 'F']]),
    P('Quem comanda?', 'Países grandes querem os principais cargos. Os pequenos pedem rodízio.', [['Reivindicar cargos.', 'F'], ['Apoiar o rodízio.', 'D'], ['Barganhar.', 'B']]),
    P('Primeira missão', 'O exército continental é mandado para uma crise de fronteira, sob seu apoio.', [['Mandar tropas.', 'W'], ['Dar apoio logístico.', 'S'], ['Recusar a missão.', 'C']])] },
  { id: 'outsider', cond: SOV, role: 'power', spec: 'hostile', parts: [
    P('Fora dos blocos', 'Num mundo de superblocos, ficar de fora é difícil. {power} oferece "convite de adesão" em termos duros.', [['Recusar.', 'F'], ['Aceitar sob condições.', 'D'], ['Aceitar tudo.', 'C']]),
    P('Barreiras comerciais', 'Os blocos aumentam barreiras contra países de fora. Seu comércio sofre.', [['Procurar um bloco alternativo.', 'D'], ['Retaliar.', 'V'], ['Subsidiar exportadores.', 'S']]),
    P('Pressão final', '{power} diz que não haverá outra oferta. A população está dividida.', [['Convocar plebiscito.', 'E'], ['Cerrar fileiras.', 'N'], ['Ceder.', 'C']])] },
  { id: 'freemove', role: 'bloc', spec: 'own', parts: [
    P('Livre circulação', 'A união garante livre circulação de pessoas. Seus trabalhadores se mudam para países ricos.', [['Estimular.', 'M'], ['Reter talentos.', 'S'], ['Taxar a saída.', 'N']]),
    P('Cidades vazias', 'Cidades do interior perdem moradores jovens e serviços.', [['Incentivar o retorno.', 'G'], ['Fechar serviços.', 'C'], ['Atrair imigrantes.', 'M']]),
    P('Remessas e ressentimentos', 'Os emigrantes enviam dinheiro; os vizinhos reclamam de imigrantes.', [['Tolerar.', 'I'], ['Pedir cotas.', 'D'], ['Acordo bilateral.', 'D']])] },
  { id: 'unioncourt', role: 'bloc', spec: 'own', parts: [
    P('Tribunal da união', 'O tribunal do bloco anula uma lei sua que protegia a indústria local.', [['Acatar a decisão.', 'D'], ['Ignorar.', 'F'], ['Apelar.', 'E']]),
    P('Multas', 'O bloco aplica multas diárias enquanto você não cumprir a decisão.', [['Pagar e ganhar tempo.', 'A'], ['Pagar e cumprir.', 'C'], ['Recusar e esperar.', 'F']]),
    P('Crise constitucional', 'Seu parlamento se divide entre soberania e lealdade ao bloco.', [['Reformar a constituição.', 'E'], ['Reafirmar a soberania.', 'N'], ['Referendo.', 'D']])] },
  { id: 'migrunion', role: 'nb', spec: 'any', parts: [
    P('Fronteira interna', '{nb}, vizinho e membro do bloco, fecha a fronteira durante uma crise migratória.', [['Protestar ao bloco.', 'D'], ['Fechar a sua também.', 'F'], ['Ajudar {nb}.', 'S']]),
    P('Filas de caminhões', 'Quilômetros de caminhões parados. As exportações caem.', [['Corredor prioritário.', 'G'], ['Retaliar.', 'V'], ['Esperar.', 'I']]),
    P('Mediação do bloco', 'O bloco oferece mediar um acordo entre você e {nb}.', [['Aceitar.', 'D'], ['Recusar.', 'F'], ['Exigir compensação.', 'B']])] },
  { id: 'energyunion', role: 'bloc', spec: 'own', parts: [
    P('Rede elétrica comum', 'O bloco propõe uma rede elétrica e de gás integrada, com preços únicos.', [['Aderir.', 'G'], ['Aderir parcialmente.', 'D'], ['Rejeitar.', 'F']]),
    P('Apagão em cadeia', 'Uma falha numa usina derruba a energia de vários países, inclusive o seu.', [['Reforçar redes.', 'G'], ['Isolar a rede nacional.', 'N'], ['Culpar o bloco.', 'F']]),
    P('Preço único', 'A divisão de custos revela desigualdade: seu país subsidia vizinhos.', [['Aceitar.', 'D'], ['Exigir ajuste.', 'F'], ['Compensar com impostos.', 'M']])] },
  { id: 'langs', parts: [
    P('Língua oficial única', 'Em reuniões da união, propõe-se uma só língua de trabalho. Minorias protestam.', [['Apoiar.', 'M'], ['Defender o multilinguismo.', 'E'], ['Exigir a sua língua.', 'F']]),
    P('Escolas', 'As escolas começam a ensinar a nova língua. Pais reclamam do currículo.', [['Manter bilíngue.', 'S'], ['Priorizar a nova.', 'P'], ['Voltar atrás.', 'I']]),
    P('Cultura em risco', 'Artistas protestam contra a "uniformização".', [['Financiar a cultura local.', 'S'], ['Ignorar.', 'I'], ['Festival continental.', 'D']])] },
  { id: 'secession', cond: { min: { ax_central: 10 } }, parts: [
    P('Região quer ir ao bloco', 'Uma região do seu país quer sair e entrar direto na união, dispensando o governo central.', [['Negociar autonomia.', 'D'], ['Recusar.', 'N'], ['Aceitar o plebiscito.', 'E']]),
    P('Referendo local', 'A região marca um referendo e o bloco observa.', [['Declarar ilegal.', 'R'], ['Aceitar.', 'E'], ['Oferecer pacote econômico.', 'B']]),
    P('Resultado', 'O sim vence por pouco. Seu governo precisa decidir.', [['Aceitar a separação.', 'C'], ['Recusar.', 'F'], ['Aceitar a federalização.', 'D']])] },
  { id: 'megaproj', role: 'bloc', spec: 'own', parts: [
    P('Mega-obra continental', 'O bloco planeja um canal ou túnel de grande escala atravessando seu território.', [['Aceitar.', 'G'], ['Exigir compensação.', 'B'], ['Recusar.', 'F']]),
    P('Desapropriações', 'Milhares de famílias serão removidas. Protestos crescem.', [['Pagar melhor.', 'S'], ['Remover à força.', 'R'], ['Alterar o traçado.', 'D']]),
    P('Inauguração', 'A obra é inaugurada com pompa; empresas abrem filiais e a região muda.', [['Cobrar pedágio.', 'M'], ['Isentar nacionais.', 'S'], ['Dividir lucros.', 'D']])] },
  { id: 'unionelection', role: 'bloc', spec: 'own', parts: [
    P('Eleições da união', 'Os cidadãos elegem um parlamento da união. Seus partidos disputam cadeiras.', [['Fazer campanha ativa.', 'E'], ['Desestimular o voto.', 'N'], ['Apoiar um candidato.', 'B']]),
    P('Abstenção', 'Poucos cidadãos votam; a legitimidade do parlamento é questionada.', [['Defender a união.', 'D'], ['Aproveitar para criticar.', 'F'], ['Propor voto obrigatório.', 'N']]),
    P('Coalizão', 'Grupos do parlamento formam uma coalizão e pedem apoio.', [['Apoiar a coalizão.', 'D'], ['Ficar de fora.', 'I'], ['Formar oposição.', 'F']])] },
  { id: 'hegemon', cond: NAT, role: 'bloc', spec: 'own', parts: [
    P('O grande dentro da união', 'Seu país é o mais forte do bloco. Vizinhos temem que você domine.', [['Assumir a liderança.', 'F'], ['Reduzir a influência.', 'D'], ['Pedir cargos.', 'B']]),
    P('Aliança dos pequenos', 'Os pequenos formam um bloco para limitar seu poder.', [['Dividir os pequenos.', 'T'], ['Negociar.', 'D'], ['Aceitar o equilíbrio.', 'C']]),
    P('Crise de liderança', 'A união não consegue decidir sobre uma crise: pede seu comando.', [['Assumir.', 'W'], ['Rodízio.', 'D'], ['Recusar.', 'C']])] },
  { id: 'smugglers', parts: [
    P('Contrabando entre blocos', 'Uma rede de contrabando atravessa a fronteira entre dois blocos rivais.', [['Combater.', 'R'], ['Legalizar.', 'M'], ['Aceitar suborno.', 'B']]),
    P('Máfias de fronteira', 'Grupos locais controlam passagens e cobram "pedágios".', [['Enviar tropas.', 'W'], ['Negociar.', 'D'], ['Integrar na polícia.', 'B']]),
    P('Cooperação entre blocos', 'Os blocos oferecem uma operação conjunta contra o contrabando.', [['Aceitar.', 'D'], ['Conduzir sozinho.', 'F'], ['Recusar.', 'I']])] },
];
