export const PREFIX = 'or_', CAT = 'Ordem e sociedade';
const P = (t, d, o) => ({ t, d, o });
export const ARCS = [
  { id: 'gangs', cond: { min: { crimeGang: 45 } }, parts: [
    P('Bairros sob facção', 'Facções criminosas dominam bairros inteiros, cobram "taxas" e decidem quem entra e sai.', [['Operação policial em larga escala.', { hint: 'Retoma territórios; mortes de civis e abusos.', now: { crime: -3, control: 2, civil: -1 }, groups: { military: 2 }, act: { type: 'armed', op: 'crush', kind: 'gang' } }], ['Programa social nos bairros.', 'S'], ['Negociar uma trégua.', { hint: 'Menos violência hoje; poder da facção cresce.', now: { crime: -2, corruption: 2 }, act: { type: 'armed', op: 'coopt', kind: 'gang' } }]]),
    P('Guerra de quadrilhas', 'Duas facções entram em guerra aberta e há balas perdidas em escolas.', [['Intervir com o exército.', 'W'], ['Isolar os bairros.', 'N'], ['Tentar mediar.', 'D']]),
    P('Reforma dos presídios', 'Os presídios viraram quartéis-generais das facções. O ministro propõe trocar a gestão.', [['Presídios de segurança máxima.', 'R'], ['Reforma ressocializadora.', 'E'], ['Entregar a gestão a empresas privadas.', 'M']])] },
  { id: 'police_auto', cond: { min: { policeAuto: 62 } }, parts: [
    P('A polícia que manda', 'A polícia militar fez uma greve branca e exige o aumento do soldo e menos controle sobre suas operações.', [['Atender os policiais.', { hint: 'Polícia satisfeita; autonomia e abusos sobem.', now: { treasury: -0.3, crime: -1 }, act: { type: 'extra', op: 'noop' }, groups: { military: 2 } }], ['Negociar só o soldo.', 'D'], ['Enfrentar: reforma com corregedoria civil.', { hint: 'Reduz a autonomia, com risco de motim.', now: { coupRisk: 2, corruption: -1.5 } }]]),
    P('Chacina', 'Uma operação termina com 30 mortos. Moradores falam em execução e a polícia diz ter sido atacada.', [['Abrir inquérito independente.', 'E'], ['Defender a polícia.', 'F'], ['Abafar.', 'L']]),
    P('Esquadrões da morte', 'Descobre-se um grupo de policiais que "limpa" bairros por dinheiro de comerciantes.', [['Desmontar o grupo.', 'N'], ['Fingir ignorância.', 'I'], ['Premiar a "eficiência".', 'F']])] },
  { id: 'fled_sea', cond: { min: { fledDead: 150 }, island: true }, parts: [
    P('Barcos à deriva', 'Pescadores encontram cadáveres de pessoas que tentavam deixar o país em barcos precários. A imprensa estrangeira pergunta por que fogem.', [['Reforçar a guarda costeira.', 'R'], ['Abrir uma via legal de saída.', 'E'], ['Negar o fenômeno.', 'L']]),
    P('Naufrágio', 'Um naufrágio mata dezenas de famílias, com crianças. A cidade pede luto nacional.', [['Declarar luto e abrir inquérito.', 'D'], ['Culpar traficantes de pessoas.', 'V'], ['Calar.', 'L']]),
    P('Contrabandistas', 'Redes de contrabando de pessoas se organizam e cobram fortunas.', [['Prender os atravessadores.', 'R'], ['Negociar corredores seguros.', 'D'], ['Cobrar dos atravessadores.', 'B']])] },
  { id: 'fled_land', cond: { min: { fledDead: 150 }, island: false }, parts: [
    P('A travessia da fronteira', 'Grupos de fugitivos tentam atravessar a fronteira e muitos morrem ao longo do caminho. Os países vizinhos fecham os acessos.', [['Reforçar o controle.', 'R'], ['Criar corredores humanitários.', 'D'], ['Ignorar.', 'I']]),
    P('Os que ficaram presos', 'Guardas encontram grupos de fugitivos presos no caminho, sem comida. Alguns são entregues pelo país vizinho.', [['Recebê-los e perdoar.', 'E'], ['Prender todos.', 'R'], ['Julgá-los como traidores.', 'N']]),
    P('A rota da morte', 'ONGs documentam uma "rota da morte" de meses, com túmulos sem nome.', [['Cooperar com as ONGs.', 'D'], ['Proibir as ONGs.', 'L'], ['Culpar traficantes.', 'V']])] },
  { id: 'brain', cond: { min: { fleeing: 1.2 } }, parts: [
    P('Fuga de cérebros', 'Cientistas e médicos deixam o país. Uma pesquisa mostra que metade dos jovens pensa em emigrar.', [['Salários maiores para quem ficar.', 'S'], ['Restringir a saída de profissionais.', 'R'], ['Abrir parcerias com universidades externas.', 'D']]),
    P('Promessa de retorno', 'Uma campanha nacional convida os emigrados a voltar. Poucos respondem.', [['Dar benefícios fiscais.', 'M'], ['Garantir direitos civis.', 'E'], ['Apelar ao patriotismo.', 'H']]),
    P('Fundo de talentos', 'Empresas propõem financiar bolsas e laboratórios para reter jovens.', [['Aprovar.', 'G'], ['Rejeitar: é privatização.', 'P'], ['Fazer parceria público-privada.', 'M']])] },
  { id: 'patriot', cond: { min: { alien: 55 } }, parts: [
    P('O povo que ama o governo', 'Pesquisas mostram que a população apoia o governo em níveis recordes e quase ninguém pensa em sair do país. Críticos dizem que o povo está alienado.', [['Aproveitar a popularidade.', 'F'], ['Estimular debate crítico.', 'E'], ['Ampliar a propaganda.', 'L']]),
    P('A base aliada', 'Grupos leais ao governo exigem cargos e favores em troca de apoio contínuo.', [['Dar cargos e favores.', 'B'], ['Recusar.', 'N'], ['Criar um partido da base.', 'P']]),
    P('Militantes nas ruas', 'Militantes governistas agrediram opositores num comício. A polícia faz vista grossa.', [['Condenar publicamente os militantes.', 'E'], ['Calar.', 'I'], ['Elogiar o "zelo patriótico".', { hint: 'A base aplaude; a violência cresce.', now: { civil: -2, reputation: -2 }, groups: { opposition: -3 }, act: { type: 'armed', op: 'fund', kind: 'progov' } }]])] },
  { id: 'militants', cond: { min: { baseAliada: 55 } }, w: 1.3, parts: [
    P('Militantes batem em manifestantes', 'Um grupo de militantes governistas espancou manifestantes pacíficos diante de câmeras. Seus aliados dizem que "o povo reagiu".', [['Condenar e punir os agressores.', 'E'], ['Silêncio oficial.', 'I'], ['Culpar os manifestantes.', 'V']]),
    P('Vítimas e vídeos', 'As vítimas lotam hospitais e os vídeos circulam em todo o país. A base aliada se divide.', [['Indenizar as vítimas.', 'S'], ['Atacar a imprensa.', 'L'], ['Dissolver o grupo.', { hint: 'Perde a base; ganha respeito.', now: { civil: 1 }, act: { type: 'armed', op: 'dissolve', kind: 'progov' } }]]),
    P('Retaliação', 'Opositores reagem e atacam uma sede do partido governista, e a violência cresce.', [['Decretar toque de recolher.', 'R'], ['Convocar mesa de diálogo.', 'D'], ['Armar a base para defesa.', { hint: 'Violência escala; a base se arma.', now: { stability: -2 }, act: { type: 'armed', op: 'fund', kind: 'progov' } }]])] },
  { id: 'ministerquit', cond: { max: { legitimacy: 45 } }, parts: [
    P('Um ministro se revolta', 'Um ministro importante ameaça renunciar e dizer à imprensa que o governo ignora os dados reais.', [['Ouvir o ministro.', 'D'], ['Demitir imediatamente.', 'N'], ['Silenciar com um cargo melhor.', 'B']]),
    P('O ministro fala', 'O ministro dá uma entrevista bombástica e outros auxiliares dizem estar "preocupados".', [['Reformar o gabinete.', 'E'], ['Atacar o ex-ministro.', 'L'], ['Ignorar.', 'I']]),
    P('Um bloco de dissidentes', 'Ex-ministros formam um grupo pedindo mudanças e eleições antecipadas.', [['Negociar.', 'D'], ['Perseguir.', 'R'], ['Convocar eleições.', 'E']])] },
  { id: 'protest_wave', cond: { min: { protest: 55 } }, parts: [
    P('Onda de protestos', 'Protestos por todo o país exigem mudanças. A polícia pergunta como agir.', [['Permitir e dialogar.', 'E'], ['Dispersar à força.', 'R'], ['Concessões econômicas.', 'S']]),
    P('Greve geral', 'Sindicatos convocam greve geral e a economia para.', [['Negociar.', 'S'], ['Declarar a greve ilegal.', 'R'], ['Convocar eleição.', 'E']]),
    P('Ocupação da praça', 'Manifestantes ocupam a praça central há semanas e dormem em barracas.', [['Cercar e esperar.', 'I'], ['Retirar com força.', 'R'], ['Instalar mesa de negociação.', 'D']])] },
  { id: 'crime_corrupt', cond: { min: { crimeCorrupt: 55 } }, parts: [
    P('Corrupção sistêmica', 'Uma investigação revela que propinas ajudam a "azeitar" quase todo contrato público.', [['Criar agência anticorrupção.', 'E'], ['Abafar o caso.', 'L'], ['Punir só os pequenos.', 'N']]),
    P('Os grandes escapam', 'A investigação atinge amigos do governo. Pressão para parar a operação.', [['Seguir até o fim.', 'E'], ['Frear.', 'B'], ['Transferir os investigadores.', 'N']]),
    P('Reação da elite', 'Empresários ameaçam sair do país se a caça às bruxas continuar.', [['Manter a investigação.', 'F'], ['Cessar.', 'C'], ['Negociar um acordo de leniência.', 'D']])] },
  { id: 'prop_scandal', cond: { min: { propSpend: 0.4 } }, parts: [
    P('Escândalo de propaganda', 'Uma reportagem revela que o governo gasta uma fortuna em propaganda enquanto hospitais faltam remédios.', [['Cortar o orçamento de propaganda.', { hint: 'Corta o gasto; menos alcance.', now: { treasury: 0.15, legitimacy: 1 }, act: { type: 'extra', op: 'noop' } }], ['Defender os gastos.', 'F'], ['Atacar a reportagem.', 'L']]),
    P('Influenciadores pagos', 'Descobre-se que influenciadores recebiam pagamento oficial para elogiar o governo.', [['Admitir e proibir.', 'E'], ['Negar.', 'L'], ['Processar os vazadores.', 'R']]),
    P('Credibilidade em xeque', 'Pesquisas mostram queda na confiança nas declarações do governo.', [['Reformar a comunicação.', 'E'], ['Dobrar a aposta.', 'L'], ['Contratar nova agência.', 'M']])] },
];
