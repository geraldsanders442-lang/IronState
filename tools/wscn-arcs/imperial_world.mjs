export const WORLD = 'imperial_world', CAT = 'Mundo Imperialista';
const P = (t, d, o) => ({ t, d, o });
const REV = { max: { ax_econ: -15 } }, LIB = { min: { ax_auth: -100, ax_global: 10 }, max: { ax_auth: -10 } }, MIL = { min: { ax_nation: 10 } };
export const ARCS = [
  { id: 'agitators', cond: REV, role: 'power', spec: 'hostile', ctx: 'Num mundo de impérios, ideias revolucionárias são tratadas como traição.', parts: [
    P('Cartas do império', 'O império de {power} envia uma nota: seus panfletos revolucionários "perturbam a ordem das coroas". Exigem o fechamento das gráficas.', [['Recusar e publicar a nota.', 'F'], ['Fechar as gráficas mais radicais.', 'C'], ['Mandar um enviado conciliar.', 'D']]),
    P('Os agentes da coroa', 'Espiões de {power} subornam jornalistas e financiam jornais monárquicos para derrubar seu governo.', [['Prender os jornalistas subornados.', 'R'], ['Responder com agitação do outro lado.', 'T'], ['Abrir o jogo à população.', 'E']]),
    P('Ultimato imperial', '{power} dá um prazo: expulsar os "agitadores" ou sofrer um bloqueio naval.', [['Expulsar os agitadores.', 'C'], ['Aceitar o bloqueio e mobilizar.', 'W'], ['Pedir mediação de outro império.', 'D']])] },
  { id: 'tribute', cond: REV, role: 'power', spec: 'hostile', parts: [
    P('Tributo ao trono', '{power} exige um "tributo de lealdade" anual, como outros Estados menores pagam ao seu trono.', [['Recusar o tributo.', 'F'], ['Pagar uma vez para ganhar tempo.', 'C'], ['Propor pagamento em mercadorias.', 'D']]),
    P('Coletores no porto', 'Coletores de {power} aparecem nos portos para recolher o tributo e inspecionar navios.', [['Escoltá-los até a saída.', 'F'], ['Aceitar a inspeção.', 'C'], ['Cobrar uma taxa deles.', 'V']]),
    P('Canhoneiras', 'Canhoneiras de {power} cercam seu porto principal em "visita de cortesia".', [['Preparar a defesa costeira.', 'W'], ['Negociar um novo acordo.', 'D'], ['Ceder o tributo.', 'C']])] },
  { id: 'colonialrev', cond: REV, parts: [
    P('Povos coloniais pedem apoio', 'Delegados de colônias vizinhas pedem armas e conselheiros para a sua libertação do jugo imperial.', [['Enviar armas.', 'T'], ['Enviar só conselheiros.', 'D'], ['Recusar para evitar guerra.', 'C']]),
    P('A revolta se espalha', 'A insurreição colonial cresce e atrai atenção das metrópoles. Seu nome aparece nos relatórios de inteligência.', [['Apoiar com dinheiro.', 'A'], ['Fazer propaganda pela libertação.', 'E'], ['Manter distância.', 'I']]),
    P('A metrópole contra-ataca', 'O império repressor lança uma ofensiva e acusa o seu governo de organizar a revolta.', [['Negar e apoiar em segredo.', 'T'], ['Admitir e pedir solidariedade.', 'F'], ['Condenar a violência.', 'D']])] },
  { id: 'republican', cond: LIB, role: 'power', spec: 'hostile', parts: [
    P('Republicanos num mundo de coroas', 'Seu programa liberal incomoda {power}, que teme que a ideia de república se espalhe por seus súditos.', [['Reforçar a liberdade de imprensa.', 'E'], ['Amenizar o discurso.', 'C'], ['Convidar a corte de {power} para o diálogo.', 'D']]),
    P('Embaixador expulso', '{power} expulsa seu embaixador e proíbe suas publicações em seu território.', [['Retaliar com as publicações deles.', 'V'], ['Buscar aliados republicanos.', 'D'], ['Ignorar.', 'I']]),
    P('A conspiração monárquica', 'Nobres exilados tramam restaurar uma coroa em seu país com dinheiro de {power}.', [['Desmantelar a conspiração.', 'R'], ['Oferecer anistia aos nobres.', 'E'], ['Ficar neutro.', 'I']])] },
  { id: 'concert', role: 'power', spec: 'friendly', parts: [
    P('Concerto das potências', '{power} convida o seu governo para um congresso imperial que dividirá zonas de influência no mapa.', [['Participar do congresso.', 'D'], ['Exigir cadeira própria.', 'F'], ['Recusar.', 'I']]),
    P('Linhas no mapa', 'No congresso, linhas são traçadas em mapas sem consultar populações locais. A sua fatia aparece como "zona protegida".', [['Aceitar a zona protegida.', 'C'], ['Reivindicar mais território.', 'W'], ['Pedir um acordo comercial.', 'M']]),
    P('Resistência local', 'Povos da zona não aceitam as linhas e atacam postos de {power} e do seu governo.', [['Reprimir a revolta.', 'R'], ['Negociar com os líderes locais.', 'D'], ['Pedir ajuda militar de {power}.', 'A']])] },
  { id: 'dynastic', parts: [
    P('Casamento dinástico', 'A corte propõe casar seu herdeiro com a filha de um império vizinho para selar a paz.', [['Aceitar a aliança.', 'D'], ['Recusar: casar por amor.', 'E'], ['Usar como moeda de troca.', 'B']]),
    P('Os cortesãos', 'Nobres brigam por cargos e títulos com o novo parentesco. O orçamento da corte dispara.', [['Cortar privilégios.', 'N'], ['Distribuir cargos.', 'B'], ['Gastar com festas.', 'S']]),
    P('Herança em disputa', 'Com a morte de um parente, duas coroas reivindicam a mesma herança. Querem seu apoio.', [['Apoiar a nova família.', 'W'], ['Mediar.', 'D'], ['Tomar parte da herança.', 'F']])] },
  { id: 'navalrace', parts: [
    P('A corrida dos encouraçados', 'Os impérios constroem encouraçados cada vez maiores. Almirantes pedem que você entre na corrida.', [['Construir uma frota moderna.', 'W'], ['Investir em submarinos.', 'G'], ['Evitar a corrida.', 'D']]),
    P('Estaleiros em greve', 'Operários dos estaleiros exigem melhores salários às vésperas de uma entrega importante.', [['Atender as greves.', 'S'], ['Reprimir.', 'R'], ['Militarizar o estaleiro.', 'N']]),
    P('Teste no mar', 'Seu novo navio é testado diante de embaixadores. Um acidente ou uma vitória definirão sua imagem.', [['Apostar em uma exibição.', 'F'], ['Fazer teste discreto.', 'T'], ['Convidar todos para o lançamento.', 'D']])] },
  { id: 'chartered', parts: [
    P('Companhia de comércio', 'Uma companhia privada pede o monopólio do comércio com as colônias, em troca de impostos.', [['Conceder o monopólio.', 'M'], ['Criar uma companhia estatal.', 'P'], ['Manter o comércio livre.', 'G']]),
    P('Fortes e feitorias', 'A companhia constrói fortes e contrata mercenários, tornando-se um Estado dentro do Estado.', [['Limitar seu poder.', 'N'], ['Deixar agir.', 'I'], ['Tornar-se sócio.', 'B']]),
    P('Escândalo colonial', 'A imprensa denuncia abusos nas feitorias: trabalho forçado e massacres.', [['Investigar e punir.', 'E'], ['Silenciar a imprensa.', 'R'], ['Negar tudo.', 'I']])] },
  { id: 'peasant', cond: REV, parts: [
    P('Camponeses sem terra', 'Em sua zona rural, nobres dominam a terra. Comitês de camponeses pedem a reforma agrária.', [['Distribuir as terras da nobreza.', 'N'], ['Comprar as terras.', 'S'], ['Adiar a reforma.', 'I']]),
    P('Nobreza revoltada', 'Os nobres se armam, formam milícias e pedem ajuda a um império vizinho.', [['Desarmar as milícias.', 'W'], ['Negociar compensações.', 'D'], ['Ceder.', 'C']]),
    P('A terra e a coroa', 'Agentes imperiais oferecem apoio aos nobres em troca de bases. Camponeses pedem proteção.', [['Aceitar a proteção dos camponeses.', 'S'], ['Convocar a milícia popular.', 'W'], ['Negociar com o império.', 'D']])] },
  { id: 'reichstag', parts: [
    P('Parlamento consultivo', 'Reformistas pedem um parlamento consultivo, sem poderes reais, para acalmar a burguesia.', [['Criar o parlamento.', 'E'], ['Manter o poder absoluto.', 'N'], ['Criar um conselho de nobres.', 'B']]),
    P('Discursos incendiários', 'Deputados criticam a corte e pedem mais poderes. Os nobres reclamam ao monarca.', [['Dissolver o parlamento.', 'R'], ['Ampliar os poderes.', 'E'], ['Ignorar os discursos.', 'I']]),
    P('Crise de constituição', 'Reformistas e conservadores se dividem. O exército aguarda uma ordem.', [['Outorgar uma constituição.', 'E'], ['Declarar estado de sítio.', 'R'], ['Negociar uma regência.', 'D']])] },
  { id: 'warfront', role: 'power', spec: 'hostile', parts: [
    P('Fronteira imperial', 'Tropas de {power} concentram-se na sua fronteira, alegando "proteger súditos" que vivem no seu lado.', [['Enviar reforços.', 'W'], ['Propor uma comissão de fronteira.', 'D'], ['Ceder uma faixa de terra.', 'C']]),
    P('Incidentes', 'Soldados trocam tiros num vilarejo. Cada lado diz que foi atacado primeiro.', [['Pedir desculpas formais.', 'C'], ['Exigir desculpas.', 'F'], ['Chamar mediadores.', 'D']]),
    P('Mobilização geral', 'Os telégrafos anunciam mobilização em {power}. A corte aguarda sua decisão.', [['Mobilizar também.', 'W'], ['Propor conferência de paz.', 'D'], ['Recuar e ceder.', 'C']])] },
  { id: 'telegraph', parts: [
    P('Ferrovias e telégrafos', 'Engenheiros propõem ferrovias e telégrafos até as províncias distantes. Um império vizinho oferece crédito.', [['Aceitar o crédito.', 'A'], ['Financiar com impostos.', 'G'], ['Adiar o projeto.', 'I']]),
    P('Operários e trilhos', 'Trabalhadores forçados morrem em massa abrindo as linhas. Reformistas protestam.', [['Melhorar condições.', 'S'], ['Continuar forçando.', 'N'], ['Contratar estrangeiros.', 'M']]),
    P('Inauguração', 'A primeira linha liga a capital ao porto. Comerciantes e militares comemoram; algumas províncias sentem o peso do controle central.', [['Fazer um festival.', 'S'], ['Reforçar a administração central.', 'P'], ['Cobrar tarifas altas.', 'M']])] },
  { id: 'sepoy', parts: [
    P('Tropas coloniais', 'Soldados recrutados nas colônias reclamam de soldos e de insultos religiosos.', [['Aumentar soldos.', 'S'], ['Punir a indisciplina.', 'R'], ['Respeitar costumes.', 'E']]),
    P('Motim', 'Um batalhão se amotina e toma um arsenal. Oficiais pedem tropa de confiança.', [['Esmagar o motim.', 'W'], ['Negociar.', 'D'], ['Anistiar os rebeldes.', 'C']]),
    P('Depois do motim', 'Os rebeldes fogem para as montanhas. Impérios vizinhos acusam você de fraqueza.', [['Perseguir os rebeldes.', 'F'], ['Fazer reformas militares.', 'G'], ['Esquecer o episódio.', 'I']])] },
  { id: 'missionary', cond: { min: { ax_relig: 10 } }, parts: [
    P('Missionários da corte', 'Seu império financia missionários para "civilizar" regiões vizinhas. Povos locais resistem.', [['Apoiar as missões.', 'H'], ['Limitar a pregação.', 'E'], ['Cortar o financiamento.', 'I']]),
    P('Incidente em uma missão', 'Missionários são atacados, e a imprensa pede vingança.', [['Enviar expedição punitiva.', 'W'], ['Pedir justiça local.', 'D'], ['Aceitar o risco.', 'I']]),
    P('Escolas e hospitais', 'As missões abrem escolas e hospitais, ganhando prestígio mas também influência.', [['Expandir a rede.', 'S'], ['Tornar tudo estatal.', 'P'], ['Deixar com a igreja.', 'H']])] },
  { id: 'abdication', parts: [
    P('Monarca doente', 'O monarca adoece e a corte se divide em facções sobre quem deve governar.', [['Apoiar o herdeiro.', 'D'], ['Apoiar a regência.', 'B'], ['Aproveitar para centralizar.', 'N']]),
    P('Intrigas', 'Cartas anônimas acusam ministros de envenenar a corte. Cortesãos pedem processos.', [['Abrir inquérito.', 'R'], ['Reprimir boatos.', 'N'], ['Acalmar a corte.', 'D']]),
    P('Sucessão', 'A corte exige uma decisão final. O exército e os banqueiros observam.', [['Coroar o herdeiro.', 'D'], ['Convocar assembleia.', 'E'], ['Impor um regente.', 'N']])] },
];
