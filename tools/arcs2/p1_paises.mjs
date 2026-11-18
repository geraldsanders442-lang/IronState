export const PREFIX = 'cp1_', CAT = 'País';
const P = (t, d, o) => ({ t, d, o });
const K = (iso, cat) => ({ cond: { countries: [iso] }, cat });
export const ARCS = [
  // ---------------- BRASIL ----------------
  { id: 'bra_amazon', ...K('BRA', 'Brasil'), parts: [
    P('Queimadas na Amazônia', 'O fogo avança sobre a floresta e o mundo cobra o governo, enquanto produtores rurais pedem terra e crédito.', [['Fiscalização dura e embargos.', 'X'], ['Pacto com o agronegócio por metas.', 'D'], ['Priorizar produção e minimizar.', 'M']]),
    P('Fundo Amazônia', 'Países ricos oferecem bilhões em troca de metas de desmatamento e fiscais estrangeiros.', [['Aceitar com soberania garantida.', 'D'], ['Aceitar tudo.', 'A'], ['Recusar: a Amazônia é nossa.', 'F']]),
    P('Garimpo e povos indígenas', 'Garimpeiros invadem terras yanomami e a saúde indígena entra em colapso.', [['Operação militar de retirada.', 'W'], ['Negociar cooperativas legais.', 'B'], ['Fechar os olhos.', 'I']])] },
  { id: 'bra_favela', ...K('BRA', 'Brasil'), parts: [
    P('Guerra de facções no Rio', 'Tiroteios paralisam escolas e hospitais nas comunidades; a polícia pede mais blindados.', [['Operação policial em larga escala.', 'K'], ['Urbanização e serviços nas favelas.', 'S'], ['Acordo com lideranças comunitárias.', 'Y']]),
    P('Chacina e inquérito', 'Uma operação deixa dezenas de mortos e moradores acusam execuções.', [['Perícia independente.', 'E'], ['Defender a polícia.', 'F'], ['Abafar.', 'L']]),
    P('Milícias no poder local', 'Milicianos elegem vereadores e controlam gás, internet e transporte.', [['Desmontar com inteligência.', 'T'], ['Cooptar para estabilidade.', 'Q'], ['Ignorar.', 'I']])] },
  { id: 'bra_reforma', ...K('BRA', 'Brasil'), parts: [
    P('A reforma tributária', 'Estados e municípios brigam pela divisão do imposto único; empresários querem simplicidade.', [['Aprovar a reforma completa.', 'M'], ['Reforma gradual com compensações.', 'D'], ['Adiar de novo.', 'I']]),
    P('Guerra fiscal entre estados', 'Governadores ameaçam ir ao Supremo contra a perda de arrecadação.', [['Fundo de compensação.', 'S'], ['Manter a regra e enfrentar.', 'F'], ['Negociar caso a caso.', 'B']]),
    P('O primeiro ano', 'A economia reage, mas setores perdedores fazem greve e lobby.', [['Corrigir distorções.', 'E'], ['Manter o rumo.', 'N'], ['Voltar atrás em parte.', 'C']])] },
  { id: 'bra_centrao', ...K('BRA', 'Brasil'), parts: [
    P('O Centrão cobra a fatura', 'O bloco de partidos de centro exige ministérios e emendas em troca de apoio no Congresso.', [['Ceder cargos e emendas.', 'B'], ['Governar sem eles.', 'F'], ['Negociar uma agenda pública.', 'D']]),
    P('Orçamento secreto', 'Reportagens mostram verbas distribuídas sem transparência.', [['Transparência total.', 'E'], ['Manter o sistema.', 'I'], ['Investigação interna.', 'N']]),
    P('CPI no Senado', 'Uma CPI ameaça seu governo e seus aliados.', [['Cooperar.', 'D'], ['Bloquear.', 'B'], ['Contra-atacar.', 'V']])] },
  { id: 'bra_seca', ...K('BRA', 'Brasil'), parts: [
    P('Seca no Nordeste', 'A seca seca açudes e a fome volta ao sertão; prefeitos pedem carros-pipa.', [['Adutoras e transposição.', 'G'], ['Bolsa emergencial.', 'S'], ['Esperar a chuva.', 'I']]),
    P('Coronelismo da água', 'Políticos locais controlam os carros-pipa e vendem votos.', [['Fiscalizar a distribuição.', 'N'], ['Cooperar com os prefeitos.', 'B'], ['Federalizar a água.', 'P']]),
    P('Êxodo para o Sudeste', 'Famílias migram para as periferias de São Paulo e do Rio.', [['Programas de moradia.', 'S'], ['Incentivar o retorno.', 'G'], ['Deixar o mercado resolver.', 'M']])] },
  { id: 'bra_stf', ...K('BRA', 'Brasil'), parts: [
    P('O Supremo contra o governo', 'O STF derruba uma decisão sua e parlamentares falam em "ativismo judicial".', [['Acatar.', 'D'], ['Mudar a lei.', 'N'], ['Atacar os ministros.', 'V']]),
    P('PEC para limitar o Supremo', 'Aliados propõem limitar mandatos e poderes da corte.', [['Apoiar.', 'F'], ['Barrar.', 'E'], ['Negociar uma reforma.', 'D']]),
    P('Tensão institucional', 'Militares e juízes trocam notas públicas.', [['Reunir os Poderes.', 'D'], ['Reforçar a Constituição.', 'E'], ['Pressionar a corte.', 'R']])] },
  { id: 'bra_copa', ...K('BRA', 'Brasil'), parts: [
    P('Megaevento esportivo', 'O Brasil é candidato a sediar um grande torneio; estádios custam bilhões.', [['Sediar com parceria privada.', 'M'], ['Sediar com dinheiro público.', 'S'], ['Recusar.', 'I']]),
    P('Protestos e obras atrasadas', 'Moradores removidos para os estádios protestam.', [['Indenizar melhor.', 'S'], ['Manter o cronograma.', 'N'], ['Reduzir o escopo.', 'D']]),
    P('Elefantes brancos', 'Após o evento, arenas ficam vazias e a dívida pesa.', [['Concessão a empresas.', 'M'], ['Uso comunitário.', 'S'], ['Abandonar.', 'I']])] },

  // ---------------- EUA ----------------
  { id: 'usa_guns', ...K('USA', 'Estados Unidos'), parts: [
    P('Tiroteio em escola', 'Um massacre numa escola reabre o debate sobre armas; o lobby promete guerra.', [['Verificação universal e proibição de rifles.', 'E'], ['Mais seguranças nas escolas.', 'R'], ['Nada muda.', 'I']]),
    P('A Suprema Corte e a Segunda Emenda', 'A corte analisa os limites das leis estaduais.', [['Apoiar os estados.', 'D'], ['Ficar neutro.', 'I'], ['Defender o direito às armas.', 'H']]),
    P('Milícias e comícios armados', 'Grupos armados fazem manifestações diante de prédios públicos.', [['Proibir porte em eventos.', 'N'], ['Dialogar.', 'D'], ['Tolerar.', 'I']])] },
  { id: 'usa_border', ...K('USA', 'Estados Unidos'), parts: [
    P('Crise na fronteira sul', 'Milhares de migrantes chegam por semana; governadores brigam com Washington.', [['Muro e controle duro.', 'R'], ['Via legal e asilo.', 'E'], ['Acordo com o México.', 'D']]),
    P('Cidades-santuário', 'Cidades se recusam a cooperar com a deportação.', [['Cortar verbas federais.', 'V'], ['Negociar.', 'D'], ['Aceitar.', 'C']]),
    P('Trabalhadores e fazendas', 'A agricultura sem mão de obra pede vistos temporários.', [['Programa de vistos.', 'M'], ['Só cidadãos.', 'H'], ['Mecanizar.', 'G']])] },
  { id: 'usa_fed', ...K('USA', 'Estados Unidos'), parts: [
    P('Estados contra Washington', 'Estados do Texas e da Califórnia desafiam leis federais em temas opostos.', [['Impor a lei federal.', 'F'], ['Negociar autonomia.', 'D'], ['Deixar os estados decidirem.', 'C']]),
    P('Guarda Nacional', 'Governadores e o presidente disputam o comando da Guarda Nacional.', [['Federalizar.', 'R'], ['Respeitar os governadores.', 'D'], ['Ir ao tribunal.', 'E']]),
    P('Secessão simbólica', 'Um movimento pede plebiscito de independência em um estado.', [['Declarar ilegal.', 'N'], ['Dialogar.', 'D'], ['Ignorar.', 'I']])] },
  { id: 'usa_health', ...K('USA', 'Estados Unidos'), parts: [
    P('Saúde de mercado', 'Contas médicas quebram famílias e seguradoras cobram mais.', [['Opção pública.', 'S'], ['Mais concorrência.', 'M'], ['Manter como está.', 'I']]),
    P('Preço dos remédios', 'Farmacêuticas lucram com insulina; pacientes racionam doses.', [['Teto de preços.', 'N'], ['Importar genéricos.', 'G'], ['Deixar o mercado.', 'M']]),
    P('Opioides', 'Uma epidemia de overdose mata dezenas de milhares por ano.', [['Tratamento e saúde mental.', 'S'], ['Punir traficantes.', 'K'], ['Processar farmacêuticas.', 'V']])] },
  { id: 'usa_election', ...K('USA', 'Estados Unidos'), parts: [
    P('Eleição contestada', 'O perdedor alega fraude e milhões acreditam.', [['Auditoria independente.', 'E'], ['Reconhecer e seguir.', 'D'], ['Investigar o rival.', 'V']]),
    P('Invasão do Capitólio', 'Manifestantes invadem o Congresso; a Guarda hesita.', [['Prender os líderes.', 'R'], ['Comissão bipartidária.', 'E'], ['Minimizar.', 'I']]),
    P('Redistritamento', 'Os mapas eleitorais são manipulados para favorecer partidos.', [['Comissões independentes.', 'E'], ['Manter.', 'I'], ['Fazer o mesmo.', 'B']])] },
  { id: 'usa_china', ...K('USA', 'Estados Unidos'), parts: [
    P('Guerra comercial com a China', 'Tarifas e restrições a chips esquentam a disputa tecnológica.', [['Tarifas amplas.', 'V'], ['Acordo gradual.', 'D'], ['Investir em chips nacionais.', 'G']]),
    P('Taiwan', 'Uma crise no estreito pede sua posição.', [['Reforçar a defesa de Taiwan.', 'W'], ['Ambiguidade estratégica.', 'D'], ['Recuar.', 'C']]),
    P('Dependência de terras raras', 'Minerais críticos vêm da China.', [['Mineração própria.', 'G'], ['Aliados.', 'D'], ['Estoques.', 'S']])] },
  { id: 'usa_inequal', ...K('USA', 'Estados Unidos'), parts: [
    P('Dívida estudantil', 'Milhões devem mais do que podem pagar.', [['Perdoar parte.', 'S'], ['Reformar o crédito.', 'D'], ['Manter.', 'M']]),
    P('Aluguéis nas metrópoles', 'Moradias caras expulsam trabalhadores.', [['Controle de aluguéis.', 'N'], ['Liberar construção.', 'M'], ['Habitação pública.', 'S']]),
    P('Greve dos sindicatos', 'Metalúrgicos e atores param.', [['Mediação.', 'D'], ['Aumento salarial.', 'S'], ['Apoiar patrões.', 'F']])] },

  // ---------------- RÚSSIA ----------------
  { id: 'rus_oligarch', ...K('RUS', 'Rússia'), parts: [
    P('Os oligarcas', 'Bilionários ligados ao Estado controlam gás e mídia e ameaçam pôr dinheiro fora.', [['Confisco seletivo.', 'N'], ['Pacto de lealdade.', 'B'], ['Deixá-los.', 'I']]),
    P('Fuga de capitais', 'Dinheiro sai para Dubai e Londres.', [['Controle de capitais.', 'N'], ['Anistia fiscal.', 'M'], ['Prender os fugitivos.', 'R']]),
    P('Um oligarca contra o Kremlin', 'Um magnata financia a oposição.', [['Processar.', 'R'], ['Negociar.', 'D'], ['Exilar.', 'C']])] },
  { id: 'rus_regions', ...K('RUS', 'Rússia'), parts: [
    P('Repúblicas pedem mais autonomia', 'Tartaristão e Daguestão reivindicam mais impostos e língua própria na escola.', [['Dar autonomia fiscal.', 'C'], ['Reforçar o centro.', 'F'], ['Tratado federativo.', 'D']]),
    P('Um líder regional desafia Moscou', 'O presidente de uma república negocia com o exterior.', [['Demitir.', 'N'], ['Aceitar.', 'C'], ['Cooptar com cargos.', 'B']]),
    P('Separatismo no Cáucaso', 'Ataques e bandeiras proibidas voltam às ruas.', [['Ofensiva de segurança.', 'K'], ['Programa econômico.', 'S'], ['Diálogo com anciãos.', 'Y']])] },
  { id: 'rus_sanctions', ...K('RUS', 'Rússia'), parts: [
    P('Sanções ocidentais', 'Bancos são cortados do sistema global.', [['Voltar-se para a Ásia.', 'D'], ['Substituição de importações.', 'G'], ['Retaliar.', 'V']]),
    P('Comércio paralelo', 'Produtos entram por terceiros países.', [['Legalizar.', 'M'], ['Reprimir.', 'R'], ['Taxar.', 'N']]),
    P('Gás para a Europa', 'Clientes europeus buscam outros fornecedores.', [['Cortar o gás.', 'V'], ['Descontos.', 'D'], ['Novo gasoduto para a China.', 'G']])] },
  { id: 'rus_arctic', ...K('RUS', 'Rússia'), parts: [
    P('Rota do Mar do Norte', 'O degelo abre a rota ártica; vizinhos cobiçam recursos.', [['Frota de quebra-gelos.', 'G'], ['Parceria com a China.', 'D'], ['Militarizar.', 'W']]),
    P('Povos indígenas do Norte', 'Pastores de renas protestam contra poços e minas.', [['Consulta e royalties.', 'S'], ['Ignorar.', 'I'], ['Remover.', 'R']]),
    P('Vazamento de petróleo', 'Um tanque rompe no permafrost.', [['Punir a empresa.', 'N'], ['Limpeza estatal.', 'S'], ['Abafar.', 'L']])] },
  { id: 'rus_demog', ...K('RUS', 'Rússia'), parts: [
    P('Crise demográfica', 'A população encolhe e o campo se esvazia.', [['Bônus por filho.', 'S'], ['Atrair imigrantes.', 'M'], ['Campanha tradicional.', 'H']]),
    P('Mão de obra da Ásia Central', 'Imigrantes sustentam obras e serviços, mas há xenofobia.', [['Cotas e direitos.', 'D'], ['Restringir.', 'R'], ['Deportações.', 'N']]),
    P('Cidades que morrem', 'Vilas siberianas ficam sem escolas.', [['Subsídios.', 'S'], ['Concentrar serviços.', 'M'], ['Ignorar.', 'I']])] },
  { id: 'rus_media', ...K('RUS', 'Rússia'), parts: [
    P('Lei dos agentes estrangeiros', 'ONGs e jornais com dinheiro externo seriam marcados como agentes.', [['Aprovar.', 'L'], ['Suavizar.', 'D'], ['Rejeitar.', 'E']]),
    P('Jornalista preso', 'Um repórter investigativo é detido.', [['Soltar.', 'E'], ['Manter.', 'R'], ['Julgamento rápido.', 'N']]),
    P('Internet soberana', 'Plano de isolar a rede russa.', [['Aprovar.', 'L'], ['Parcial.', 'N'], ['Rejeitar.', 'E']])] },
  { id: 'rus_church', ...K('RUS', 'Rússia'), parts: [
    P('A Igreja Ortodoxa e o Estado', 'O patriarca pede leis morais e ensino religioso.', [['Aceitar.', 'H'], ['Manter laico.', 'E'], ['Aceitar em parte.', 'D']]),
    P('Minorias muçulmanas', 'Mesquitas e escolas islâmicas pedem reconhecimento.', [['Reconhecer.', 'E'], ['Vigiar.', 'T'], ['Restringir.', 'R']]),
    P('Seitas proibidas', 'Grupos religiosos são banidos como extremistas.', [['Banir.', 'L'], ['Tolerar.', 'D'], ['Investigar.', 'T']])] },

  // ---------------- CHINA ----------------
  { id: 'chn_prop', ...K('CHN', 'China'), parts: [
    P('Crise imobiliária', 'Incorporadoras quebram e compradores ficam sem casa.', [['Resgatar as empresas.', 'S'], ['Deixar quebrar.', 'M'], ['Terminar obras com dinheiro público.', 'P']]),
    P('Governos locais endividados', 'Províncias vendem terra para fechar as contas.', [['Reestruturar a dívida.', 'D'], ['Cortar gastos.', 'N'], ['Mais crédito.', 'S']]),
    P('Protestos de compradores', 'Mutuários param de pagar hipotecas.', [['Anistia.', 'C'], ['Reprimir.', 'R'], ['Mediação.', 'D']])] },
  { id: 'chn_xin', ...K('CHN', 'China'), parts: [
    P('Xinjiang e os campos', 'Relatórios internacionais denunciam detenções em massa.', [['Negar e acusar.', 'L'], ['Abrir missão da ONU.', 'E'], ['Reduzir silenciosamente.', 'D']]),
    P('Sanções por trabalho forçado', 'Marcas globais evitam o algodão local.', [['Retaliar.', 'V'], ['Negociar.', 'D'], ['Mudar a prática.', 'E']]),
    P('Vigilância digital', 'Câmeras e reconhecimento facial são ampliados.', [['Ampliar.', 'N'], ['Limitar.', 'D'], ['Exportar tecnologia.', 'G']])] },
  { id: 'chn_taiwan', ...K('CHN', 'China'), parts: [
    P('Estreito de Taiwan', 'Exercícios militares aumentam a tensão.', [['Bloqueio simulado.', 'W'], ['Oferta de integração.', 'D'], ['Esperar.', 'I']]),
    P('Embargo comercial', 'Taiwan responde com restrições.', [['Retaliar.', 'V'], ['Diálogo.', 'D'], ['Isolar diplomaticamente.', 'F']]),
    P('Resposta dos EUA', 'Washington envia navios ao estreito.', [['Recuar.', 'C'], ['Confrontar.', 'F'], ['Mediar com a ONU.', 'D']])] },
  { id: 'chn_demog', ...K('CHN', 'China'), parts: [
    P('O envelhecimento', 'A força de trabalho encolhe depressa.', [['Incentivos a três filhos.', 'S'], ['Aposentadoria tardia.', 'N'], ['Robôs e automação.', 'G']]),
    P('Jovens sem emprego', 'Graduados não acham vaga e o "deitar-se" vira mania.', [['Programa estatal.', 'P'], ['Mercado.', 'M'], ['Censurar o debate.', 'L']]),
    P('Êxodo do campo', 'Aldeias vazias e cidades lotadas.', [['Hukou flexível.', 'E'], ['Manter.', 'N'], ['Cidades novas.', 'G']])] },
  { id: 'chn_tech', ...K('CHN', 'China'), parts: [
    P('Gigantes tecnológicos', 'Plataformas dominam crédito e dados.', [['Regular duro.', 'N'], ['Parceria.', 'B'], ['Estatizar.', 'P']]),
    P('Corte de chips', 'Restrições ocidentais travam fábricas.', [['Autossuficiência.', 'G'], ['Contrabando.', 'T'], ['Acordo.', 'D']]),
    P('Fuga de cientistas', 'Pesquisadores migram para o exterior.', [['Bônus de retorno.', 'S'], ['Controle de passaportes.', 'R'], ['Aceitar.', 'I']])] },
  { id: 'chn_belt', ...K('CHN', 'China'), parts: [
    P('Nova Rota da Seda', 'Países devedores não conseguem pagar portos e ferrovias.', [['Renegociar.', 'D'], ['Tomar o ativo.', 'F'], ['Perdoar parte.', 'C']]),
    P('Bases no exterior', 'Um porto comercial vira base naval.', [['Instalar.', 'W'], ['Negar.', 'D'], ['Uso duplo.', 'T']]),
    P('Críticas de "armadilha da dívida"', 'A imprensa denuncia o modelo.', [['Contrapropaganda.', 'L'], ['Reformar.', 'E'], ['Ignorar.', 'I']])] },
  { id: 'chn_hk', ...K('CHN', 'China'), parts: [
    P('Hong Kong e Macau', 'Juristas pedem manter o status especial.', [['Integração total.', 'F'], ['Manter autonomia.', 'D'], ['Cortar gradualmente.', 'N']]),
    P('Protestos', 'Estudantes tomam as ruas.', [['Reprimir.', 'R'], ['Dialogar.', 'E'], ['Esperar.', 'I']]),
    P('Fuga de capitais e talentos', 'Empresas migram para Singapura.', [['Controle.', 'N'], ['Incentivos.', 'M'], ['Aceitar.', 'I']])] },

  // ---------------- ÍNDIA ----------------
  { id: 'ind_farm', ...K('IND', 'Índia'), parts: [
    P('Protesto dos agricultores', 'Milhares de camponeses acampam diante de Délhi contra reformas agrícolas.', [['Revogar.', 'C'], ['Diálogo.', 'D'], ['Dispersar.', 'R']]),
    P('Preço mínimo garantido', 'Os agricultores exigem preço mínimo legal.', [['Garantir.', 'S'], ['Parcial.', 'D'], ['Recusar.', 'M']]),
    P('Seca e dívidas rurais', 'Suicídios de agricultores chocam o país.', [['Perdoar dívidas.', 'S'], ['Seguro agrícola.', 'G'], ['Mercado.', 'M']])] },
  { id: 'ind_comm', ...K('IND', 'Índia'), parts: [
    P('Tensões religiosas', 'Confrontos entre comunidades hindu e muçulmana viram motim.', [['Toque de recolher e prisões.', 'R'], ['Diálogo inter-religioso.', 'D'], ['Silêncio oficial.', 'I']]),
    P('Lei de cidadania', 'Uma lei controversa divide o país.', [['Aprovar.', 'H'], ['Rever.', 'D'], ['Retirar.', 'C']]),
    P('Demolição e disputa de templo', 'Um local sagrado é disputado nos tribunais.', [['Acatar a corte.', 'E'], ['Mediar.', 'D'], ['Apoiar um lado.', 'H']])] },
  { id: 'ind_kashmir', ...K('IND', 'Índia'), parts: [
    P('Caxemira', 'Ataques e bloqueios de internet marcam o vale.', [['Reforçar tropas.', 'W'], ['Diálogo político.', 'D'], ['Investir.', 'S']]),
    P('Fronteira com o Paquistão', 'Incidentes na linha de controle.', [['Resposta militar.', 'F'], ['Canal secreto.', 'T'], ['Mediar.', 'D']]),
    P('Eleições locais', 'Partidos regionais pedem de volta o status especial.', [['Realizar.', 'E'], ['Adiar.', 'N'], ['Negociar.', 'D']])] },
  { id: 'ind_it', ...K('IND', 'Índia'), parts: [
    P('Boom da tecnologia', 'Bangalore atrai gigantes globais; o país quer ser fábrica de chips.', [['Subsídio a chips.', 'G'], ['Livre mercado.', 'M'], ['Educação técnica.', 'S']]),
    P('Fuga de cérebros', 'Engenheiros migram para os EUA.', [['Retê-los.', 'S'], ['Aceitar remessas.', 'M'], ['Parcerias.', 'D']]),
    P('Desigualdade digital', 'Aldeias sem internet ficam para trás.', [['Fibra no campo.', 'G'], ['Privado.', 'M'], ['Esperar.', 'I']])] },
  { id: 'ind_caste', ...K('IND', 'Índia'), parts: [
    P('Cotas de castas', 'Novos grupos exigem reserva de vagas.', [['Ampliar cotas.', 'S'], ['Manter.', 'I'], ['Critério econômico.', 'D']]),
    P('Violência contra dalits', 'Ataques geram protestos nacionais.', [['Leis duras.', 'N'], ['Educação.', 'S'], ['Silêncio.', 'I']]),
    P('Partidos de casta', 'Novos partidos dividem o voto.', [['Aliar-se.', 'B'], ['Combater.', 'V'], ['Ignorar.', 'I']])] },
  { id: 'ind_water', ...K('IND', 'Índia'), parts: [
    P('Crise da água', 'Rios secam e cidades racionam.', [['Interligar rios.', 'G'], ['Eficiência.', 'X'], ['Privatizar.', 'M']]),
    P('Disputa entre estados', 'Dois estados brigam pelo mesmo rio.', [['Tribunal.', 'E'], ['Arbitragem federal.', 'N'], ['Deixar.', 'I']]),
    P('Poluição do ar', 'Délhi sufoca no inverno.', [['Restringir carros.', 'X'], ['Queima de palha.', 'S'], ['Esperar.', 'I']])] },
  { id: 'ind_china', ...K('IND', 'Índia'), parts: [
    P('Fronteira do Himalaia', 'Soldados chineses e indianos se confrontam na altitude.', [['Reforçar a região.', 'W'], ['Diálogo.', 'D'], ['Aliança com os EUA.', 'A']]),
    P('Boicote a produtos chineses', 'O público pede boicote.', [['Barreiras.', 'V'], ['Manter comércio.', 'M'], ['Substituir.', 'G']]),
    P('Rio Brahmaputra', 'A China planeja uma barragem.', [['Protestar.', 'D'], ['Contra-barragem.', 'G'], ['Tratado de águas.', 'E']])] },
];
