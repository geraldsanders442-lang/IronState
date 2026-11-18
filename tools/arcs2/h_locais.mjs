export const PREFIX = 'lo_', CAT = 'Cenário local';
const P = (t, d, o) => ({ t, d, o });
const WR = k => ({ wr: [].concat(k) });
export const ARCS = [
  { id: 'ebola', cond: { ...WR(['subsaharan', 'west_africa', 'central_africa', 'east_africa']), max: { health: 62 } }, w: 1.3, parts: [
    P('Febre hemorrágica no interior', 'Casos de uma febre hemorrágica aparecem numa aldeia remota. Curandeiros e funerais tradicionais espalham o vírus.', [['Quarentena rigorosa da região.', { hint: 'Contém o surto; custo social e revolta local.', now: { health: 1, treasury: -0.3, protest: 2 }, groups: { rural: -3 } }], ['Equipes de saúde e educação comunitária.', 'S'], ['Pedir ajuda internacional.', 'A']]),
    P('O surto chega à cidade', 'O vírus chegou a uma cidade grande. Hospitais fecham, profissionais adoecem e a população foge.', [['Isolar bairros inteiros.', 'R'], ['Hospitais de campanha e mutirão.', 'S'], ['Receber missão internacional.', 'A']]),
    P('Medo e boatos', 'Boatos de que "médicos espalham a doença" levam multidões a atacar equipes de saúde.', [['Proteger as equipes com a polícia.', 'F'], ['Campanha com líderes locais.', 'D'], ['Ignorar.', 'I']])] },
  { id: 'malaria', cond: WR(['subsaharan', 'west_africa', 'central_africa', 'east_africa']), parts: [
    P('Malária e os mosquiteiros', 'A malária mata dezenas de milhares por ano. Doadores oferecem mosquiteiros, mas falta distribuição.', [['Distribuir pelo Estado.', 'S'], ['Contratar ONGs.', 'D'], ['Priorizar aldeias leais.', { hint: 'Barato e político; mortes entre os excluídos.', now: { health: -1, corruption: 1 }, groups: { rural: -2 } }]]),
    P('Mosquiteiros no mercado', 'Mosquiteiros doados aparecem à venda em feiras e são usados como redes de pesca.', [['Fiscalizar.', 'R'], ['Aceitar o uso.', 'I'], ['Trocar por inseticida nas casas.', 'G']]),
    P('A vacina chega', 'Uma vacina contra a malária fica disponível, mas é cara e limitada.', [['Vacinar crianças primeiro.', 'S'], ['Vender aos ricos.', 'M'], ['Esperar preço menor.', 'I']])] },
  { id: 'aids', cond: WR(['subsaharan', 'southern_africa', 'east_africa']), parts: [
    P('A epidemia silenciosa', 'Uma em cada cinco pessoas adultas está infectada pelo HIV, mas a doença é tabu e muita gente evita o teste.', [['Campanha nacional de testes e tratamento.', 'S'], ['Moralizar e priorizar a abstinência.', 'H'], ['Pedir apoio internacional.', 'A']]),
    P('Remédios e patentes', 'Remédios genéricos mais baratos exigem desafiar patentes de grandes laboratórios.', [['Licença compulsória.', 'F'], ['Negociar descontos.', 'D'], ['Pagar o preço cheio.', 'C']]),
    P('Órfãos da epidemia', 'Milhões de crianças órfãs vivem com avós ou na rua.', [['Programa de renda e escola.', 'S'], ['Deixar com ONGs.', 'I'], ['Criar orfanatos estatais.', 'P']])] },
  { id: 'ethnic_south', cond: WR(['southern_africa']), parts: [
    P('Tensões étnicas e de terra', 'A concentração de terras por uma minoria e o desemprego dos jovens esquentam disputas entre grupos.', [['Reforma agrária negociada.', 'S'], ['Ocupações organizadas.', { hint: 'Ganha apoio popular; investidores e minorias reagem.', now: { reputation: -2, growth: -0.2 }, groups: { rural: 3, business: -3 } }], ['Adiar.', 'I']]),
    P('Ataques a estrangeiros', 'Multidões atacam lojas de imigrantes de países vizinhos, acusados de roubar empregos.', [['Proteger os estrangeiros.', 'E'], ['Culpar os imigrantes.', { hint: 'Acalma os ânimos; a imagem externa afunda.', now: { reputation: -3 }, groups: { workers: 2 } }], ['Deportar ilegais.', 'R']]),
    P('Pacto nacional', 'Líderes religiosos propõem um pacto nacional entre grupos.', [['Aceitar o pacto.', 'D'], ['Ignorar.', 'I'], ['Criar uma comissão da verdade.', 'E']])] },
  { id: 'sahel', cond: WR(['sahel', 'west_africa']), parts: [
    P('Seca e extremistas no Sahel', 'A seca empurra pastores para o sul e grupos extremistas oferecem proteção e dinheiro em aldeias abandonadas pelo Estado.', [['Operação militar no interior.', 'K'], ['Levar poços e escolas.', 'S'], ['Negociar com chefes locais.', 'Y']]),
    P('Pastores e agricultores', 'Conflitos por pastos e água deixam centenas de mortos num ano.', [['Criar corredores de pastagem.', 'G'], ['Armar milícias de autodefesa.', { hint: 'Segurança imediata; violência futura.', now: { stability: -1 }, act: { type: 'armed', op: 'fund' } }], ['Mediação com anciãos.', 'D']]),
    P('Aliança com potências', 'Potências estrangeiras oferecem tropas e drones em troca de bases.', [['Aceitar.', 'A'], ['Recusar.', 'F'], ['Pedir só equipamento.', 'D']])] },
  { id: 'greatlakes', cond: WR(['central_africa', 'east_africa']), parts: [
    P('Fronteira dos Grandes Lagos', 'Grupos armados cruzam a fronteira em busca de minérios e refugio. Vizinhos se acusam de apoiá-los.', [['Reforçar a fronteira.', 'W'], ['Reunir uma conferência regional.', 'D'], ['Apoiar um grupo aliado.', { hint: 'Influência na região; risco de guerra por procuração.', now: { reputation: -2 }, act: { type: 'armed', op: 'fund' } }]]),
    P('Minerais de sangue', 'Ativistas denunciam que seus minerais financiam milícias e exigem rastreamento.', [['Criar certificação.', 'E'], ['Ignorar.', 'I'], ['Estatizar a mineração.', 'P']]),
    P('Cessar-fogo regional', 'Mediadores africanos propõem um cessar-fogo e uma força de paz regional.', [['Aceitar.', 'D'], ['Exigir garantias.', 'B'], ['Recusar.', 'F']])] },
  { id: 'narco', cond: WR(['andes', 'central_america', 'amazon', 'caribbean']), parts: [
    P('A rota do narcotráfico', 'O país virou corredor da cocaína. Cartéis compram policiais, prefeitos e juízes.', [['Guerra total aos cartéis.', 'K'], ['Legalizar e regular o consumo.', { hint: 'Corta a receita do cartel; choque moral.', now: { crime: -3, reputation: -1 }, groups: { rural: -3, youth: 3 } }], ['Negociar com o cartel.', 'Q']]),
    P('Candidatos mortos', 'Candidatos a prefeito são assassinados e os cartéis escolhem os eleitos.', [['Escolta federal para candidatos.', 'F'], ['Adiar as eleições locais.', 'N'], ['Intervir em prefeituras.', 'R']]),
    P('Camponeses da coca', 'Camponeses defendem a plantação como único meio de vida diante da fumigação.', [['Substituir a cultura com subsídios.', 'S'], ['Erradicar à força.', 'R'], ['Tolerar a produção tradicional.', 'C']])] },
  { id: 'monsoon', cond: WR(['south_asia', 'southeast_asia']), parts: [
    P('Monções e enchentes', 'Monções devastadoras alagam cidades e plantações. Milhões ficam desabrigados.', [['Ajuda emergencial ampla.', 'S'], ['Priorizar as cidades principais.', 'N'], ['Pedir ajuda internacional.', 'A']]),
    P('Doenças da água', 'Cólera e dengue se espalham nos abrigos.', [['Mutirão de saúde.', 'S'], ['Dispersar os abrigos.', 'N'], ['Contar com ONGs.', 'D']]),
    P('Diques e relocação', 'Engenheiros propõem diques gigantes e relocação de aldeias em planícies de risco.', [['Construir os diques.', 'G'], ['Relocar as aldeias.', 'S'], ['Fazer as duas coisas devagar.', 'D']])] },
  { id: 'frozen', cond: WR(['caucasus', 'balkans', 'eastern_europe']), parts: [
    P('Conflito congelado', 'Uma região separatista na fronteira reabre disputas: tiroteios, bloqueios de estradas e passaportes distribuídos por uma potência vizinha.', [['Reforçar as defesas.', 'W'], ['Negociar uma autonomia especial.', 'D'], ['Pedir mediação internacional.', 'A']]),
    P('Passaportes', 'Uma potência distribui passaportes a moradores da região separatista, usando-os como pretexto de proteção.', [['Protestar internacionalmente.', 'D'], ['Declarar os passaportes ilegais.', 'F'], ['Ignorar.', 'I']]),
    P('Exercícios militares', 'Tropas fazem exercícios ao longo da fronteira.', [['Convidar observadores.', 'D'], ['Contra-exercícios.', 'W'], ['Reunir o conselho de segurança.', 'F']])] },
  { id: 'waterwar', cond: WR(['middle_east', 'north_africa', 'central_asia']), parts: [
    P('A guerra da água', 'Uma barragem de um vizinho reduz o rio que abastece suas cidades e plantações.', [['Protesto diplomático e litígio.', 'D'], ['Ameaçar sabotagem.', 'W'], ['Investir em dessalinização.', 'G']]),
    P('Racionamento', 'Racionar água vira rotina nas grandes cidades e há protestos nos bairros pobres.', [['Racionar com justiça.', 'S'], ['Priorizar a indústria.', 'M'], ['Importar água.', 'A']]),
    P('Tratado das águas', 'O vizinho oferece um acordo de partilha com condições políticas.', [['Aceitar.', 'C'], ['Recusar.', 'F'], ['Aceitar com cláusulas.', 'D']])] },
  { id: 'cyclone', cond: WR(['pacific_islands', 'caribbean', 'oceania', 'indian_ocean']), parts: [
    P('Ciclone e ilhas', 'Um ciclone devasta ilhas remotas, cortando comunicações. Algumas ilhas ficaram dias sem socorro.', [['Mobilizar a marinha para socorro.', 'S'], ['Priorizar a ilha principal.', 'N'], ['Pedir ajuda externa.', 'A']]),
    P('Elevação do mar', 'Com o mar subindo, algumas ilhas podem ficar inabitáveis. Moradores se recusam a sair.', [['Relocar à força.', 'R'], ['Oferecer terra em outro país.', 'D'], ['Construir muros e ilhas artificiais.', 'G']]),
    P('Nação sem território', 'A diplomacia debate o estatuto de uma nação que pode perder seu território.', [['Defender o novo estatuto.', 'E'], ['Ignorar.', 'I'], ['Aceitar acordos de cidadania.', 'D']])] },
  { id: 'cold_stan', cond: WR(['central_asia', 'eastern_europe']), parts: [
    P('Energia, inverno e dívida', 'O inverno rigoroso e o preço do gás disparam. Há pressão para cortar subsídios que o povo considera sagrados.', [['Manter os subsídios.', 'S'], ['Cortar gradualmente.', 'D'], ['Cortar já.', 'N']]),
    P('Revolta do gás', 'Protestos populares por aquecimento bloqueiam avenidas.', [['Recuar.', 'C'], ['Dispersar.', 'R'], ['Mesa de negociação.', 'D']]),
    P('Gasoduto e dependência', 'Um país vizinho oferece gás barato em troca de bases.', [['Aceitar.', 'A'], ['Recusar.', 'F'], ['Negociar.', 'D']])] },
  { id: 'indep', cond: WR(['east_asia', 'southeast_asia']), parts: [
    P('Ilha no estreito', 'Disputas por ilhas e águas pesqueiras provocam incidentes entre guardas costeiras.', [['Reforçar a guarda costeira.', 'W'], ['Propor uma gestão conjunta.', 'D'], ['Levar o caso a um tribunal.', 'E']]),
    P('Pescadores presos', 'Pescadores são presos por cruzar o limite marítimo e nacionalistas pedem retaliação.', [['Negociar a soltura.', 'D'], ['Retaliar.', 'F'], ['Fazer protesto formal.', 'D']]),
    P('Ilhas artificiais', 'Um vizinho constrói ilhas artificiais com pistas e radares.', [['Construir as suas também.', 'W'], ['Protestar.', 'D'], ['Ignorar.', 'I']])] },
];
