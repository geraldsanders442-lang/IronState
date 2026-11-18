export const PREFIX = 'cr_', CAT = 'Região';
const P = (t, d, o) => ({ t, d, o });
const W = (k, cat) => ({ cond: { wr: [k] }, cat });
export const ARCS = [
  // ---------------- CARIBE ----------------
  { id: 'car_hurr', ...W('caribbean', 'Caribe'), parts: [
    P('Temporada de furacões', 'Uma tempestade devasta ilhas turísticas e portos.', [['Ajuda emergencial.', 'S'], ['Seguro regional.', 'G'], ['Pedir ajuda externa.', 'A']]),
    P('Reconstrução e dívida', 'Reconstruir custa mais do que o PIB do ano.', [['Perdão de dívida.', 'C'], ['Empréstimo.', 'A'], ['Taxa de turismo.', 'M']]),
    P('Migração climática', 'Famílias deixam ilhas inabitáveis.', [['Acordos de vistos.', 'D'], ['Realocar.', 'S'], ['Fechar.', 'N']])] },
  { id: 'car_tour', ...W('caribbean', 'Caribe'), parts: [
    P('Cruzeiros e resorts', 'O turismo traz divisas, mas pressiona praias e salários.', [['Limitar navios.', 'N'], ['Expandir.', 'M'], ['Taxas ambientais.', 'X']]),
    P('Resorts com praias fechadas', 'Moradores perdem acesso ao mar.', [['Praias públicas.', 'E'], ['Proteger investidores.', 'B'], ['Compensar.', 'S']]),
    P('Recifes de coral', 'O branqueamento ameaça a pesca e o turismo.', [['Reservas marinhas.', 'X'], ['Ignorar.', 'I'], ['Parceria científica.', 'G']])] },
  { id: 'car_drug', ...W('caribbean', 'Caribe'), parts: [
    P('Rota do tráfico', 'Lanchas rápidas cruzam o mar com drogas e armas.', [['Cooperação com a Guarda Costeira.', 'D'], ['Patrulhas próprias.', 'W'], ['Fechar os olhos.', 'I']]),
    P('Lavagem de dinheiro', 'Bancos offshore são usados por cartéis.', [['Reforma.', 'E'], ['Proteger.', 'B'], ['Sigilo.', 'M']]),
    P('Violência em bairros', 'Gangues disputam territórios.', [['Operação.', 'K'], ['Programas jovens.', 'S'], ['Acordo.', 'Y']])] },
  { id: 'car_reparations', ...W('caribbean', 'Caribe'), parts: [
    P('Reparações pela escravidão', 'Governos cobram indenização das antigas metrópoles.', [['Liderar o pedido.', 'F'], ['Negociar fundos.', 'D'], ['Silenciar.', 'I']]),
    P('Rei e república', 'Países debatem cortar laços com a coroa.', [['Virar república.', 'E'], ['Manter.', 'H'], ['Plebiscito.', 'D']]),
    P('Cultura e memória', 'Monumentos e currículos mudam.', [['Reescrever.', 'E'], ['Preservar.', 'H'], ['Diálogo.', 'D']])] },
  { id: 'car_china', ...W('caribbean', 'Caribe'), parts: [
    P('Investimento chinês', 'Portos e estádios chegam com crédito de Pequim.', [['Aceitar.', 'A'], ['Diversificar.', 'D'], ['Recusar.', 'F']]),
    P('Dívida e controle', 'Empréstimos pesam sobre o orçamento.', [['Renegociar.', 'D'], ['Ceder o porto.', 'C'], ['Calote.', 'V']]),
    P('Pressão dos EUA', 'Washington exige afastar a China.', [['Alinhar.', 'A'], ['Neutralidade.', 'E'], ['Jogar com os dois.', 'T']])] },
  { id: 'car_haiti', ...W('caribbean', 'Caribe'), parts: [
    P('Crise no Haiti', 'Gangues dominam a capital e milhares fogem.', [['Missão internacional.', 'U'], ['Ajuda humanitária.', 'S'], ['Fechar fronteira.', 'N']]),
    P('Refugiados', 'Barcos chegam às praias vizinhas.', [['Receber.', 'S'], ['Repatriar.', 'R'], ['Campos.', 'N']]),
    P('Eleições impossíveis', 'Sem Estado, não há como votar.', [['Pacto de transição.', 'D'], ['Adiar.', 'I'], ['Intervenção.', 'W']])] },
  { id: 'car_sugar', ...W('caribbean', 'Caribe'), parts: [
    P('O fim da cana', 'Usinas fecham e cortadores perdem o emprego.', [['Reconversão.', 'G'], ['Subsídio.', 'S'], ['Deixar.', 'I']]),
    P('Fábricas offshore', 'Zonas francas prometem empregos mal pagos.', [['Aceitar.', 'M'], ['Regras trabalhistas.', 'N'], ['Rejeitar.', 'E']]),
    P('Remessas', 'Emigrantes sustentam a economia.', [['Taxar.', 'M'], ['Incentivar.', 'S'], ['Deixar.', 'I']])] },

  // ---------------- ANDES ----------------
  { id: 'and_mining', ...W('andes', 'Andes'), parts: [
    P('Mineração e povos andinos', 'Cobre e lítio atraem empresas; comunidades temem a água.', [['Consulta prévia.', 'E'], ['Licenciar rápido.', 'M'], ['Estatal.', 'P']]),
    P('Bloqueio de estradas', 'Camponeses fecham as rotas da mina.', [['Diálogo.', 'D'], ['Exército.', 'R'], ['Compensação.', 'S']]),
    P('Lítio', 'O "ouro branco" desperta cobiça mundial.', [['Controle estatal.', 'P'], ['Parceria.', 'D'], ['Leilão.', 'M']])] },
  { id: 'and_coca', ...W('andes', 'Andes'), parts: [
    P('A folha de coca', 'Camponeses vivem da coca, ameaçada por erradicação.', [['Erradicar.', 'R'], ['Substituir.', 'S'], ['Tolerar o uso tradicional.', 'C']]),
    P('Pressão americana', 'Washington condiciona ajuda à erradicação.', [['Cumprir.', 'A'], ['Negar.', 'F'], ['Negociar.', 'D']]),
    P('Cartéis nas montanhas', 'Laboratórios clandestinos se espalham.', [['Operação.', 'K'], ['Desenvolvimento.', 'S'], ['Acordo.', 'Q']])] },
  { id: 'and_inca', ...W('andes', 'Andes'), parts: [
    P('Identidade indígena', 'Povos quéchua e aimará pedem um Estado plurinacional.', [['Reformar a constituição.', 'E'], ['Manter.', 'N'], ['Autonomias locais.', 'D']]),
    P('Línguas nas escolas', 'Aulas em quéchua e aimará.', [['Adotar.', 'S'], ['Só espanhol.', 'H'], ['Misto.', 'D']]),
    P('Machu Picchu e turismo', 'O turismo lota sítios sagrados.', [['Limitar.', 'N'], ['Taxar.', 'M'], ['Comunidades.', 'S']])] },
  { id: 'and_altitude', ...W('andes', 'Andes'), parts: [
    P('Geleiras que somem', 'O derretimento seca rios e hidrelétricas.', [['Reservatórios.', 'G'], ['Racionar.', 'N'], ['Cooperação regional.', 'D']]),
    P('Deslizamentos', 'Chuvas extremas destroem aldeias.', [['Realocar.', 'S'], ['Alerta precoce.', 'G'], ['Ajuda.', 'A']]),
    P('Agricultura em altitude', 'Batatas e quinoa sofrem com geadas.', [['Seguro rural.', 'S'], ['Sementes novas.', 'G'], ['Deixar.', 'I']])] },
  { id: 'and_coup', ...W('andes', 'Andes'), parts: [
    P('Instabilidade política', 'Presidentes caem em sequência e o Congresso trava.', [['Reforma política.', 'E'], ['Poder forte.', 'N'], ['Governo de unidade.', 'D']]),
    P('Militares no cenário', 'Generais se oferecem como árbitros.', [['Reafirmar o poder civil.', 'E'], ['Aceitar tutela.', 'C'], ['Negociar.', 'B']]),
    P('Protestos do interior', 'O campo marcha sobre a capital.', [['Dialogar.', 'D'], ['Reprimir.', 'R'], ['Concessões.', 'S']])] },
  { id: 'and_border', ...W('andes', 'Andes'), parts: [
    P('Disputa por mar e fronteira', 'Países discutem acesso ao oceano e rios.', [['Arbitragem.', 'E'], ['Pressão.', 'F'], ['Cooperação.', 'D']]),
    P('Migrantes venezuelanos', 'Milhões cruzam os Andes a pé.', [['Receber.', 'S'], ['Cotas.', 'N'], ['Fechar.', 'R']]),
    P('Corredor bioceânico', 'Um projeto liga o Atlântico ao Pacífico.', [['Construir.', 'G'], ['Rejeitar.', 'X'], ['Parceria.', 'D']])] },
  { id: 'and_pop', ...W('andes', 'Andes'), parts: [
    P('Populismo andino', 'Candidatos prometem nacionalizar tudo.', [['Plano fiscal.', 'M'], ['Copiar promessas.', 'S'], ['Dialogar.', 'D']]),
    P('Constituinte', 'Uma assembleia quer refundar o Estado.', [['Apoiar.', 'E'], ['Barrar.', 'N'], ['Referendo.', 'D']]),
    P('Corrupção das obras', 'Empreiteiras pagam propina a governos.', [['Investigar.', 'E'], ['Acordo de leniência.', 'D'], ['Abafar.', 'L']])] },

  // ---------------- AMÉRICA CENTRAL ----------------
  { id: 'cam_gang', ...W('central_america', 'América Central'), parts: [
    P('Maras e estado de exceção', 'Gangues extorquem bairros; o governo prende milhares.', [['Estado de exceção.', 'K'], ['Prevenção social.', 'S'], ['Acordo com gangues.', 'Q']]),
    P('Prisões gigantes', 'Presos se amontoam; ONGs denunciam abusos.', [['Ampliar.', 'R'], ['Reforma.', 'E'], ['Esconder.', 'L']]),
    P('Popularidade e liberdades', 'A população apoia a mão dura.', [['Aproveitar.', 'F'], ['Limitar.', 'E'], ['Eleição.', 'D']])] },
  { id: 'cam_caravan', ...W('central_america', 'América Central'), parts: [
    P('Caravanas de migrantes', 'Milhares marcham rumo ao norte.', [['Corredor humanitário.', 'D'], ['Dissolver.', 'R'], ['Acordo com os EUA.', 'A']]),
    P('Remessas', 'Dinheiro do exterior sustenta a economia.', [['Incentivar.', 'S'], ['Taxar.', 'M'], ['Reter.', 'G']]),
    P('Esvaziamento', 'Povoados ficam sem jovens.', [['Programas locais.', 'S'], ['Ignorar.', 'I'], ['Turismo.', 'M']])] },
  { id: 'cam_canal', ...W('central_america', 'América Central'), parts: [
    P('O canal e a água', 'A seca reduz o tráfego e ameaça o comércio.', [['Novos reservatórios.', 'G'], ['Taxas.', 'M'], ['Rota alternativa.', 'G']]),
    P('Concessões portuárias', 'Empresas chinesas e americanas disputam portos.', [['Licitar.', 'M'], ['Estatal.', 'P'], ['Dividir.', 'D']]),
    P('Soberania do canal', 'O debate sobre bases estrangeiras volta.', [['Reforçar a neutralidade.', 'E'], ['Aliança.', 'A'], ['Referendo.', 'D']])] },
  { id: 'cam_volcano', ...W('central_america', 'América Central'), parts: [
    P('Vulcão e terremoto', 'A terra treme e cidades ficam sem luz e água.', [['Mobilizar.', 'S'], ['Ajuda externa.', 'A'], ['Minimizar.', 'L']]),
    P('Café e clima', 'Pragas e calor derrubam a safra.', [['Seguro.', 'S'], ['Variedades.', 'G'], ['Deixar.', 'I']]),
    P('Furacões', 'Chuvas inundam o litoral.', [['Reconstruir.', 'G'], ['Realocar.', 'S'], ['Esperar.', 'I']])] },
  { id: 'cam_mil', ...W('central_america', 'América Central'), parts: [
    P('Legado das guerras civis', 'Ex-guerrilheiros e militares ainda disputam a memória.', [['Comissão da verdade.', 'E'], ['Anistia total.', 'C'], ['Esquecer.', 'I']]),
    P('Desaparecidos', 'Famílias pedem reabertura de casos.', [['Reabrir.', 'E'], ['Rejeitar.', 'F'], ['Reparação.', 'S']]),
    P('Corrupção e narcopolítica', 'Políticos ligados ao tráfico.', [['Extradição.', 'D'], ['Proteger.', 'B'], ['Investigar.', 'N']])] },
  { id: 'cam_indig', ...W('central_america', 'América Central'), parts: [
    P('Terras maias e mineradoras', 'Comunidades defendem rios contra minas.', [['Consulta.', 'E'], ['Licenciar.', 'M'], ['Compensar.', 'S']]),
    P('Representação indígena', 'Povos pedem cadeiras no Congresso.', [['Aprovar.', 'E'], ['Barrar.', 'N'], ['Parcial.', 'D']]),
    P('Idiomas e escola', 'A educação bilíngue é precária.', [['Investir.', 'S'], ['Esperar.', 'I'], ['Parcerias.', 'D']])] },
  { id: 'cam_trade', ...W('central_america', 'América Central'), parts: [
    P('Maquilas e salários', 'Fábricas de exportação pagam pouco.', [['Salário mínimo.', 'S'], ['Zonas livres.', 'M'], ['Sindicatos.', 'E']]),
    P('Tratado de livre comércio', 'Produtores locais temem as importações.', [['Assinar.', 'M'], ['Proteger.', 'V'], ['Salvaguardas.', 'D']]),
    P('Banana e empresas', 'Multinacionais pressionam por incentivos.', [['Impostos.', 'N'], ['Aceitar.', 'B'], ['Estatizar.', 'P']])] },

  // ---------------- BÁLTICO ----------------
  { id: 'bal_rus', ...W('baltic', 'Báltico'), parts: [
    P('A vizinha Rússia', 'Tropas russas se concentram e jornais falam em "provocação".', [['Reforçar as defesas.', 'W'], ['Pedir tropas da Otan.', 'A'], ['Diplomacia.', 'D']]),
    P('Ciberataques', 'Hackers derrubam bancos e ministérios.', [['Reforçar defesa cibernética.', 'G'], ['Retaliar.', 'T'], ['Denunciar.', 'D']]),
    P('Minoria russa', 'A minoria é pressionada por propaganda externa.', [['Integrar.', 'E'], ['Restringir.', 'R'], ['Língua oficial dupla.', 'D']])] },
  { id: 'bal_energy', ...W('baltic', 'Báltico'), parts: [
    P('Independência energética', 'As redes elétricas ainda ligam a Rússia.', [['Desconectar.', 'G'], ['Gradual.', 'D'], ['Manter.', 'I']]),
    P('Terminal de GNL', 'Um terminal reduz a dependência do gás.', [['Construir.', 'G'], ['Alugar.', 'M'], ['Cancelar.', 'X']]),
    P('Parques eólicos no mar', 'O Báltico vira usina de vento.', [['Expandir.', 'G'], ['Proteger pesca.', 'X'], ['Parceria.', 'D']])] },
  { id: 'bal_digital', ...W('baltic', 'Báltico'), parts: [
    P('República digital', 'O governo online atrai empreendedores do mundo todo.', [['E-residência.', 'M'], ['Cautela.', 'N'], ['Dados soberanos.', 'P']]),
    P('Vazamento de dados', 'Milhões de cidadãos têm dados expostos.', [['Punir.', 'E'], ['Abafar.', 'L'], ['Reformar.', 'N']]),
    P('Startups e talentos', 'Unicórnios saem para Londres.', [['Incentivos.', 'M'], ['Educação.', 'G'], ['Aceitar.', 'I']])] },
  { id: 'bal_mem', ...W('baltic', 'Báltico'), parts: [
    P('Memória soviética', 'Monumentos da era soviética dividem a sociedade.', [['Remover.', 'N'], ['Museu.', 'D'], ['Manter.', 'I']]),
    P('Cidadania e língua', 'Idosos sem passaporte e sem direito a voto.', [['Facilitar.', 'E'], ['Exigir prova.', 'R'], ['Plano gradual.', 'D']]),
    P('Deportações e memória', 'Famílias exigem reconhecimento.', [['Reconhecer.', 'E'], ['Ignorar.', 'I'], ['Memorial.', 'S']])] },
  { id: 'bal_mig', ...W('baltic', 'Báltico'), parts: [
    P('Emigração', 'Jovens vão para Londres e Estocolmo.', [['Bônus.', 'S'], ['Imigração.', 'M'], ['Ignorar.', 'I']]),
    P('Envelhecimento', 'A população cai.', [['Natalidade.', 'S'], ['Robótica.', 'G'], ['Trabalhadores.', 'M']]),
    P('Refugiados ucranianos', 'Milhares chegam em semanas.', [['Acolher.', 'S'], ['Limitar.', 'N'], ['Dividir na UE.', 'D']])] },
  { id: 'bal_sea', ...W('baltic', 'Báltico'), parts: [
    P('Cabos submarinos', 'Cabos de energia e dados são cortados.', [['Patrulha naval.', 'W'], ['Investigar.', 'T'], ['Diplomacia.', 'D']]),
    P('Navios-fantasma', 'Petroleiros velhos ameaçam o mar.', [['Inspeções.', 'N'], ['Sanções.', 'V'], ['Ignorar.', 'I']]),
    P('Poluição do Báltico', 'Algas e metais ameaçam a pesca.', [['Tratado.', 'X'], ['Subsídios.', 'S'], ['Esperar.', 'I']])] },
  { id: 'bal_otan', ...W('baltic', 'Báltico'), parts: [
    P('Gastos militares', 'A Otan pede 3% do PIB.', [['Aceitar.', 'W'], ['2%.', 'D'], ['Recusar.', 'E']]),
    P('Serviço militar', 'Reservistas treinam em escolas.', [['Obrigatório.', 'N'], ['Voluntário.', 'S'], ['Misto.', 'D']]),
    P('Brigada aliada', 'Tropas estrangeiras pedem bases permanentes.', [['Aceitar.', 'A'], ['Rotação.', 'D'], ['Recusar.', 'F']])] },

  // ---------------- IBÉRIA ----------------
  { id: 'ibe_water', ...W('iberia', 'Península Ibérica'), parts: [
    P('Seca e rios', 'Reservatórios secam e agricultores disputam a água.', [['Dessalinização.', 'G'], ['Racionar.', 'N'], ['Plano nacional.', 'P']]),
    P('Incêndios', 'O fogo consome floresta e vilas.', [['Brigadas.', 'S'], ['Manejo.', 'X'], ['Ajuda externa.', 'A']]),
    P('Agricultura intensiva', 'Estufas esgotam aquíferos.', [['Regular.', 'N'], ['Tolerar.', 'M'], ['Reconverter.', 'G']])] },
  { id: 'ibe_regions', ...W('iberia', 'Península Ibérica'), parts: [
    P('Regiões e independentismo', 'Comunidades autônomas pedem referendos.', [['Autorizar.', 'E'], ['Barrar.', 'N'], ['Mais autonomia.', 'D']]),
    P('Financiamento regional', 'As regiões ricas reclamam de transferências.', [['Reformar.', 'D'], ['Manter.', 'N'], ['Pacto fiscal.', 'B']]),
    P('Línguas cooficiais', 'Catalão, basco e galego pedem mais espaço.', [['Ampliar.', 'E'], ['Manter.', 'I'], ['Equilibrar.', 'D']])] },
  { id: 'ibe_tourism', ...W('iberia', 'Península Ibérica'), parts: [
    P('Turismo de massa', 'Moradores protestam contra preços e barulho.', [['Limitar aluguéis curtos.', 'N'], ['Taxa turística.', 'M'], ['Expandir.', 'G']]),
    P('Aluguéis impagáveis', 'Jovens saem das cidades.', [['Controle.', 'N'], ['Construir.', 'G'], ['Mercado.', 'M']]),
    P('Cidades-museu', 'Centros históricos perdem moradores.', [['Moradia.', 'S'], ['Hotéis.', 'M'], ['Cota.', 'N']])] },
  { id: 'ibe_empire', ...W('iberia', 'Península Ibérica'), parts: [
    P('Memória colonial', 'Debates sobre o império e a escravidão.', [['Reconhecer.', 'E'], ['Orgulho.', 'H'], ['Diálogo.', 'D']]),
    P('Lusofonia e Hispanidade', 'Antigas colônias querem mais cooperação.', [['Fundo comum.', 'S'], ['Cultural.', 'D'], ['Ignorar.', 'I']]),
    P('Cidadania a descendentes', 'Milhares pedem passaporte.', [['Facilitar.', 'E'], ['Restringir.', 'N'], ['Taxar.', 'M']])] },
  { id: 'ibe_dictator', ...W('iberia', 'Península Ibérica'), parts: [
    P('Pacto de esquecimento', 'Valas comuns da ditadura são reabertas.', [['Exumar.', 'E'], ['Deixar.', 'I'], ['Memorial.', 'S']]),
    P('Monumentos', 'Símbolos de ditadores permanecem.', [['Remover.', 'N'], ['Contextualizar.', 'D'], ['Manter.', 'H']]),
    P('Extremismos', 'Partidos nostálgicos crescem.', [['Proibir símbolos.', 'R'], ['Debate.', 'E'], ['Ignorar.', 'I']])] },
  { id: 'ibe_energy', ...W('iberia', 'Península Ibérica'), parts: [
    P('Solar e vento', 'O país vira exportador de energia limpa.', [['Interconexão.', 'G'], ['Mercado.', 'M'], ['Estatal.', 'P']]),
    P('Apagão', 'A rede cai por horas.', [['Reforçar.', 'G'], ['Culpar.', 'V'], ['Investigar.', 'N']]),
    P('Hidrogênio verde', 'Uma aposta de longo prazo.', [['Subsidiar.', 'G'], ['Parceria.', 'D'], ['Aguardar.', 'I']])] },
  { id: 'ibe_border', ...W('iberia', 'Península Ibérica'), parts: [
    P('Gibraltar e Ceuta', 'Disputas de território e de fronteira.', [['Negociar.', 'D'], ['Pressão.', 'F'], ['Tratado.', 'E']]),
    P('Migração pelo Mediterrâneo', 'Botes chegam às praias.', [['Resgate.', 'S'], ['Patrulha.', 'W'], ['Acordo com vizinhos.', 'D']]),
    P('Cooperação ibérica', 'Os dois países querem trens e energia comuns.', [['Aprofundar.', 'G'], ['Limitar.', 'N'], ['Aguardar.', 'I']])] },

  // ---------------- GOLFO ----------------
  { id: 'gul_oil', ...W('gulf', 'Golfo Pérsico'), parts: [
    P('Pós-petróleo', 'O petróleo vai perder valor e o país precisa diversificar.', [['Fundo soberano.', 'G'], ['Turismo e finanças.', 'M'], ['Manter.', 'I']]),
    P('Cidades futuristas', 'Megaprojetos prometem empregos e consomem bilhões.', [['Avançar.', 'G'], ['Reduzir.', 'N'], ['Parceria privada.', 'M']]),
    P('Subsídios', 'A população se acostumou com energia barata.', [['Cortar.', 'N'], ['Manter.', 'S'], ['Gradual.', 'D']])] },
  { id: 'gul_labor', ...W('gulf', 'Golfo Pérsico'), parts: [
    P('Trabalhadores migrantes', 'Operários vivem em alojamentos precários.', [['Reforma trabalhista.', 'E'], ['Manter.', 'M'], ['Fiscalizar.', 'N']]),
    P('Kafala', 'O sistema de patrocínio prende trabalhadores.', [['Abolir.', 'E'], ['Reformar.', 'D'], ['Manter.', 'I']]),
    P('Copa e megaeventos', 'Mortes nas obras chocam o mundo.', [['Investigar.', 'E'], ['Negar.', 'L'], ['Indenizar.', 'S']])] },
  { id: 'gul_succ', ...W('gulf', 'Golfo Pérsico'), parts: [
    P('Sucessão na dinastia', 'Príncipes disputam a herança do emir.', [['Escolher o jovem.', 'N'], ['Conselho familiar.', 'D'], ['Esperar.', 'I']]),
    P('Reforma social', 'Mulheres e jovens pedem liberdades.', [['Abrir.', 'E'], ['Manter.', 'H'], ['Reforma gradual.', 'D']]),
    P('Parlamento consultivo', 'Pedem eleições diretas.', [['Permitir.', 'E'], ['Rejeitar.', 'N'], ['Piloto.', 'D']])] },
  { id: 'gul_iran', ...W('gulf', 'Golfo Pérsico'), parts: [
    P('A sombra do Irã', 'Petroleiros e instalações são atacados.', [['Escolta naval.', 'W'], ['Diálogo.', 'D'], ['Aliança.', 'A']]),
    P('Bloqueio do Estreito de Ormuz', 'A passagem do petróleo é ameaçada.', [['Reabrir.', 'F'], ['Rota alternativa.', 'G'], ['Mediar.', 'D']]),
    P('Aliados e bases', 'Bases estrangeiras garantem segurança.', [['Manter.', 'A'], ['Reduzir.', 'E'], ['Diversificar.', 'D']])] },
  { id: 'gul_water', ...W('gulf', 'Golfo Pérsico'), parts: [
    P('Dessalinização', 'A água vem de usinas caras e vulneráveis.', [['Expandir.', 'G'], ['Eficiência.', 'X'], ['Cooperação.', 'D']]),
    P('Calor extremo', 'Temperaturas acima de 50 graus ameaçam trabalhadores.', [['Regras.', 'N'], ['Tecnologia.', 'G'], ['Ignorar.', 'I']]),
    P('Agricultura no deserto', 'Fazendas irrigadas gastam água demais.', [['Importar.', 'A'], ['Hidroponia.', 'G'], ['Subsídio.', 'S']])] },
  { id: 'gul_faith', ...W('gulf', 'Golfo Pérsico'), parts: [
    P('Peregrinos e religião', 'Milhões de peregrinos pedem estrutura e segurança.', [['Investir.', 'G'], ['Limitar.', 'N'], ['Parcerias.', 'D']]),
    P('Xiitas e sunitas', 'Tensões religiosas aumentam.', [['Direitos iguais.', 'E'], ['Vigiar.', 'T'], ['Diálogo.', 'D']]),
    P('Extremismo online', 'Pregadores radicais ganham seguidores.', [['Censura.', 'L'], ['Desradicalização.', 'S'], ['Inteligência.', 'T']])] },
  { id: 'gul_finance', ...W('gulf', 'Golfo Pérsico'), parts: [
    P('Fundos soberanos', 'Bilhões compram clubes e empresas no exterior.', [['Investir em tecnologia.', 'G'], ['Esportes.', 'M'], ['Reserva.', 'S']]),
    P('Lavagem de reputação', 'Críticos acusam o país de "sportswashing".', [['Reformas.', 'E'], ['Ignorar.', 'I'], ['Contra-campanha.', 'L']]),
    P('Moeda única do Golfo', 'Projeto de integração monetária.', [['Avançar.', 'D'], ['Adiar.', 'I'], ['Rejeitar.', 'F']])] },

  // ---------------- CHIFRE DA ÁFRICA ----------------
  { id: 'hor_famine', ...W('horn_africa', 'Chifre da África'), parts: [
    P('Seca e fome', 'Chuvas falham por anos e rebanhos morrem.', [['Ajuda emergencial.', 'S'], ['Pedir apoio da ONU.', 'A'], ['Esconder.', 'L']]),
    P('Campos de deslocados', 'Milhões se deslocam atrás de comida.', [['Campos.', 'N'], ['Reassentar.', 'S'], ['Fronteira.', 'R']]),
    P('Gafanhotos', 'Nuvens devoram as lavouras.', [['Pulverização.', 'G'], ['Ajuda.', 'A'], ['Esperar.', 'I']])] },
  { id: 'hor_war', ...W('horn_africa', 'Chifre da África'), parts: [
    P('Guerra e fronteiras', 'Regiões separatistas pegam em armas.', [['Cessar-fogo.', 'Y'], ['Ofensiva.', 'K'], ['Mediação africana.', 'D']]),
    P('Crimes e acusações', 'Relatos de massacres chegam à ONU.', [['Investigar.', 'E'], ['Negar.', 'L'], ['Julgar.', '1']]),
    P('Eleições adiadas', 'A instabilidade adia as urnas.', [['Realizar.', 'E'], ['Adiar.', 'N'], ['Governo de transição.', 'D']])] },
  { id: 'hor_pirates', ...W('horn_africa', 'Chifre da África'), parts: [
    P('Pirataria', 'Barcos de pescadores armados sequestram navios.', [['Patrulha naval.', 'W'], ['Emprego costeiro.', 'S'], ['Ignorar.', 'I']]),
    P('Pesca ilegal', 'Frotas estrangeiras esvaziam o mar.', [['Fiscalizar.', 'N'], ['Acordos.', 'D'], ['Tolerar.', 'I']]),
    P('Resgate e reféns', 'Um navio é capturado.', [['Pagar.', 'C'], ['Operação.', 'K'], ['Negociar.', 'Y']])] },
  { id: 'hor_nile', ...W('horn_africa', 'Chifre da África'), parts: [
    P('A barragem no Nilo', 'A grande barragem preocupa os vizinhos de jusante.', [['Acordo de uso.', 'D'], ['Encher mais rápido.', 'F'], ['Arbitragem.', 'E']]),
    P('Energia e exportação', 'A represa promete luz para o continente.', [['Exportar.', 'M'], ['Uso interno.', 'S'], ['Parcerias.', 'D']]),
    P('Ameaças militares', 'Vizinhos falam em atacar.', [['Defesa aérea.', 'W'], ['Negociar.', 'D'], ['Aliança.', 'A']])] },
  { id: 'hor_cities', ...W('horn_africa', 'Chifre da África'), parts: [
    P('Cidades que crescem', 'Capitais explodem em população.', [['Planejar.', 'G'], ['Favelas.', 'I'], ['Parques industriais.', 'M']]),
    P('Juventude', 'Metade do país tem menos de 20 anos.', [['Educação.', 'S'], ['Empregos.', 'G'], ['Serviço.', 'R']]),
    P('Telefone e dinheiro móvel', 'A tecnologia salta etapas.', [['Regular.', 'N'], ['Incentivar.', 'M'], ['Ignorar.', 'I']])] },
  { id: 'hor_clan', ...W('horn_africa', 'Chifre da África'), parts: [
    P('Clãs e Estado', 'Chefes de clã controlam regiões inteiras.', [['Federalismo.', 'D'], ['Centralizar.', 'N'], ['Aliança com chefes.', 'B']]),
    P('Milícias locais', 'Grupos armados cobram pedágio.', [['Integrar.', 'J'], ['Desarmar.', 'K'], ['Tolerar.', 'I']]),
    P('Terrorismo', 'Um grupo radical ataca mercados.', [['Operação.', 'K'], ['Inteligência.', 'T'], ['Ajuda externa.', 'A']])] },
  { id: 'hor_port', ...W('horn_africa', 'Chifre da África'), parts: [
    P('Portos e bases', 'Potências disputam portos no Mar Vermelho.', [['Alugar.', 'M'], ['Recusar.', 'F'], ['Leilão.', 'D']]),
    P('Corredor comercial', 'Ferrovias ligam o interior ao mar.', [['Construir.', 'G'], ['Concessão.', 'M'], ['Adiar.', 'I']]),
    P('Chineses, árabes e turcos', 'Investidores competem por influência.', [['Equilibrar.', 'D'], ['Escolher um.', 'A'], ['Cobrar.', 'B']])] },

  // ---------------- ILHAS DO PACÍFICO ----------------
  { id: 'pac_sea', ...W('pacific_islands', 'Ilhas do Pacífico'), parts: [
    P('O mar sobe', 'Atóis desaparecem e a salinidade estraga as plantações.', [['Muros e aterros.', 'G'], ['Realocar.', 'S'], ['Pedir ajuda climática.', 'A']]),
    P('Cidadania climática', 'Povos pedem passaporte de países vizinhos.', [['Negociar.', 'D'], ['Resistir.', 'F'], ['Ilha artificial.', 'G']]),
    P('Nação sem território', 'Quem mantém a soberania se o território some?', [['Defender novo estatuto.', 'E'], ['Ignorar.', 'I'], ['Tratados.', 'D']])] },
  { id: 'pac_fish', ...W('pacific_islands', 'Ilhas do Pacífico'), parts: [
    P('Atum e frotas distantes', 'Embarcações estrangeiras pescam em águas nacionais.', [['Licenciar com taxas.', 'M'], ['Patrulha.', 'W'], ['Parcerias.', 'D']]),
    P('Mineração de fundo do mar', 'Empresas querem nódulos de metais.', [['Permitir.', 'M'], ['Moratória.', 'X'], ['Consulta.', 'E']]),
    P('Aquicultura', 'Fazendas marinhas prometem empregos.', [['Apoiar.', 'G'], ['Regular.', 'N'], ['Deixar.', 'I']])] },
  { id: 'pac_china', ...W('pacific_islands', 'Ilhas do Pacífico'), parts: [
    P('Disputa de influência', 'China e EUA oferecem portos, bases e ajuda.', [['Equilibrar.', 'D'], ['Alinhar.', 'A'], ['Neutralidade.', 'E']]),
    P('Acordo de segurança', 'Um pacto abre as ilhas a forças estrangeiras.', [['Assinar.', 'W'], ['Rejeitar.', 'F'], ['Referendo.', 'D']]),
    P('Dívida', 'Projetos viram dívidas pesadas.', [['Renegociar.', 'D'], ['Perdão.', 'C'], ['Calote.', 'V']])] },
  { id: 'pac_cyclone', ...W('pacific_islands', 'Ilhas do Pacífico'), parts: [
    P('Ciclones', 'Um ciclone destrói escolas, casas e plantações.', [['Reconstruir resiliente.', 'G'], ['Ajuda externa.', 'A'], ['Esperar.', 'I']]),
    P('Água doce', 'Poços salgam e faltam reservas.', [['Dessalinizar.', 'G'], ['Chuva.', 'X'], ['Importar.', 'A']]),
    P('Fundos climáticos', 'Doadores prometem e atrasam verbas.', [['Cobrar.', 'F'], ['Aceitar.', 'C'], ['Coalizão.', 'D']])] },
  { id: 'pac_culture', ...W('pacific_islands', 'Ilhas do Pacífico'), parts: [
    P('Tradição e modernidade', 'Chefes tradicionais e o governo disputam poder.', [['Conselho misto.', 'D'], ['Centralizar.', 'N'], ['Autonomia.', 'E']]),
    P('Terra comunal', 'Terras de clã sem registro bloqueiam investimentos.', [['Registrar.', 'M'], ['Proteger.', 'E'], ['Concessões.', 'B']]),
    P('Línguas e religiões', 'Missões e cultos disputam fiéis.', [['Tolerar.', 'E'], ['Regular.', 'N'], ['Ignorar.', 'I']])] },
  { id: 'pac_tourism', ...W('pacific_islands', 'Ilhas do Pacífico'), parts: [
    P('Turismo de luxo', 'Resorts exclusivos prometem divisas.', [['Aprovar.', 'M'], ['Limitar.', 'N'], ['Parcerias locais.', 'S']]),
    P('Remessas', 'Emigrantes sustentam as famílias.', [['Incentivar.', 'S'], ['Taxar.', 'M'], ['Plano de retorno.', 'G']]),
    P('Saúde nas ilhas remotas', 'Doenças crônicas explodem.', [['Telemedicina.', 'G'], ['Navio hospital.', 'S'], ['Esperar.', 'I']])] },
  { id: 'pac_nuke', ...W('pacific_islands', 'Ilhas do Pacífico'), parts: [
    P('Herança dos testes nucleares', 'Atóis ainda têm radiação.', [['Compensar.', 'S'], ['Limpar.', 'G'], ['Esquecer.', 'I']]),
    P('Lixo radioativo', 'Países querem descartar resíduos.', [['Recusar.', 'E'], ['Aceitar por dinheiro.', 'M'], ['Debate.', 'D']]),
    P('Autonomia colonial', 'Territórios dependentes pedem independência.', [['Referendo.', 'E'], ['Adiar.', 'N'], ['Autonomia maior.', 'D']])] },

  // ---------------- SAHEL ----------------
  { id: 'sah_jihad', ...W('sahel', 'Sahel'), parts: [
    P('Grupos jihadistas', 'Aldeias inteiras caem sob controle de radicais.', [['Ofensiva.', 'K'], ['Negociar com chefes.', 'Y'], ['Ajuda internacional.', 'A']]),
    P('Golpe militar', 'Oficiais derrubam o governo "para salvar o país".', [['Aceitar.', 'C'], ['Condenar.', 'E'], ['Transição.', 'D']]),
    P('Mercenários estrangeiros', 'Empresas privadas oferecem segurança.', [['Contratar.', 'M'], ['Recusar.', 'F'], ['Observar.', 'I']])] },
  { id: 'sah_desert', ...W('sahel', 'Sahel'), parts: [
    P('A muralha verde', 'Plantar árvores para frear o deserto.', [['Investir.', 'G'], ['Reduzir.', 'N'], ['Parcerias.', 'D']]),
    P('Pastores e agricultores', 'A seca empurra pastores para o sul.', [['Corredores.', 'G'], ['Armar.', 'W'], ['Mediar.', 'D']]),
    P('Poços e água', 'Aldeias disputam poços.', [['Poços novos.', 'G'], ['Taxar.', 'M'], ['Esperar.', 'I']])] },
  { id: 'sah_uranium', ...W('sahel', 'Sahel'), parts: [
    P('Urânio e ouro', 'Minas exportam riqueza sem beneficiar a população.', [['Renegociar.', 'N'], ['Estatizar.', 'P'], ['Manter.', 'M']]),
    P('Garimpo ilegal', 'Mineiros artesanais morrem em desabamentos.', [['Formalizar.', 'E'], ['Proibir.', 'R'], ['Tolerar.', 'I']]),
    P('Aliança com a Rússia', 'Instrutores e armas chegam por trás.', [['Aceitar.', 'A'], ['Neutralidade.', 'E'], ['Equilibrar.', 'D']])] },
  { id: 'sah_france', ...W('sahel', 'Sahel'), parts: [
    P('A saída das tropas francesas', 'Governos pedem a retirada e a França se retira.', [['Exigir retirada.', 'F'], ['Manter cooperação.', 'D'], ['Substituir.', 'A']]),
    P('Ressentimento colonial', 'A população culpa antigas metrópoles.', [['Aproveitar.', 'H'], ['Pragmatismo.', 'D'], ['Reparar.', 'E']]),
    P('Moeda e comércio', 'O franco CFA vira alvo de protestos.', [['Moeda própria.', 'G'], ['Manter.', 'I'], ['Reformar.', 'E']])] },
  { id: 'sah_refugee', ...W('sahel', 'Sahel'), parts: [
    P('Deslocados pela violência', 'Milhões fogem para cidades e fronteiras.', [['Campos.', 'N'], ['Integração.', 'S'], ['Ajuda.', 'A']]),
    P('Rota migratória', 'O Sahel vira corredor rumo ao Mediterrâneo.', [['Acordo com a UE.', 'B'], ['Corredores.', 'D'], ['Bloquear.', 'R']]),
    P('Tráfico de pessoas', 'Redes criminosas lucram com os migrantes.', [['Operação.', 'K'], ['Cooperação regional.', 'D'], ['Tolerar.', 'I']])] },
  { id: 'sah_youth', ...W('sahel', 'Sahel'), parts: [
    P('Juventude sem escola', 'Escolas fecham pela violência.', [['Escolas protegidas.', 'W'], ['Rádio educativo.', 'G'], ['Ajuda.', 'A']]),
    P('Casamento precoce', 'Meninas deixam a escola.', [['Lei e incentivo.', 'E'], ['Tradição.', 'H'], ['Diálogo.', 'D']]),
    P('Recrutamento', 'Grupos armados recrutam adolescentes.', [['Programas jovens.', 'S'], ['Repressão.', 'R'], ['Anistia.', 'Z']])] },
  { id: 'sah_gov', ...W('sahel', 'Sahel'), parts: [
    P('Estado ausente', 'Na aldeia remota só existe o chefe local.', [['Descentralizar.', 'D'], ['Presença militar.', 'W'], ['Ajuda.', 'A']]),
    P('Corrupção', 'Verbas de ajuda desaparecem.', [['Fiscalização.', 'E'], ['Abafar.', 'L'], ['Pagar por resultado.', 'G']]),
    P('Eleições em zona de guerra', 'Votar é arriscado.', [['Adiar.', 'N'], ['Realizar.', 'E'], ['Parcial.', 'D']])] },

  // ---------------- ÁFRICA AUSTRAL ----------------
  { id: 'aus_energy', ...W('southern_africa', 'África Austral'), parts: [
    P('Apagões e carvão', 'A rede elétrica falha por horas todos os dias.', [['Solar privada.', 'M'], ['Reformar a estatal.', 'N'], ['Importar.', 'A']]),
    P('Mineração e greves', 'Mineiros param por salário.', [['Negociar.', 'D'], ['Reprimir.', 'R'], ['Ceder.', 'C']]),
    P('Transição justa', 'Fechar o carvão deixa comunidades sem emprego.', [['Fundo.', 'S'], ['Adiar.', 'I'], ['Capacitar.', 'G']])] },
  { id: 'aus_land', ...W('southern_africa', 'África Austral'), parts: [
    P('Terra e herança colonial', 'Fazendas comerciais seguem concentradas.', [['Reforma negociada.', 'D'], ['Expropriar.', 'N'], ['Mercado.', 'M']]),
    P('Investidores', 'Fazendeiros ameaçam sair.', [['Garantias.', 'M'], ['Manter.', 'F'], ['Compensação.', 'S']]),
    P('Povos originários', 'Comunidades pedem terras ancestrais.', [['Titular.', 'E'], ['Esperar.', 'I'], ['Parcial.', 'D']])] },
  { id: 'aus_hiv', ...W('southern_africa', 'África Austral'), parts: [
    P('A epidemia', 'O HIV afeta uma em cada cinco pessoas.', [['Tratamento universal.', 'S'], ['Campanha de prevenção.', 'G'], ['Esconder.', 'L']]),
    P('Remédios genéricos', 'Patentes limitam o acesso.', [['Licença compulsória.', 'F'], ['Negociar.', 'D'], ['Pagar.', 'C']]),
    P('Órfãos', 'Gerações sem pais.', [['Renda e escola.', 'S'], ['ONGs.', 'D'], ['Estatal.', 'P']])] },
  { id: 'aus_xeno', ...W('southern_africa', 'África Austral'), parts: [
    P('Xenofobia', 'Multidões atacam lojas de imigrantes.', [['Proteger.', 'E'], ['Culpar.', 'V'], ['Deportar.', 'R']]),
    P('Imigração da região', 'Trabalhadores vizinhos sustentam setores.', [['Visto regional.', 'D'], ['Restringir.', 'N'], ['Quotas.', 'M']]),
    P('Desemprego jovem', 'Mais de 40% dos jovens sem trabalho.', [['Programa de empregos.', 'S'], ['Mercado.', 'M'], ['Educação.', 'G']])] },
  { id: 'aus_wild', ...W('southern_africa', 'África Austral'), parts: [
    P('Safáris e caça', 'Elefantes se multiplicam e invadem aldeias.', [['Cota de caça.', 'M'], ['Proibir.', 'X'], ['Compensar.', 'S']]),
    P('Caça furtiva', 'Redes de marfim e chifre operam.', [['Guardas armados.', 'K'], ['Comunidades.', 'S'], ['Tolerar.', 'I']]),
    P('Turismo ecológico', 'Parques geram divisas.', [['Expandir.', 'G'], ['Limitar.', 'X'], ['Concessão.', 'M']])] },
  { id: 'aus_water', ...W('southern_africa', 'África Austral'), parts: [
    P('Seca e rios compartilhados', 'Rios cruzam várias fronteiras.', [['Tratado.', 'D'], ['Barragem própria.', 'G'], ['Racionar.', 'N']]),
    P('Cidade sem água', 'Uma metrópole se aproxima do "dia zero".', [['Racionar.', 'N'], ['Dessalinizar.', 'G'], ['Importar.', 'A']]),
    P('Minas e poluição', 'Rios ficam contaminados.', [['Fiscalizar.', 'N'], ['Tolerar.', 'M'], ['Compensar.', 'S']])] },
  { id: 'aus_party', ...W('southern_africa', 'África Austral'), parts: [
    P('Partido da libertação', 'O partido no poder há décadas perde a popularidade.', [['Reformar.', 'E'], ['Resistir.', 'F'], ['Coalizão.', 'D']]),
    P('Corrupção e captura do Estado', 'Famílias poderosas controlam contratos.', [['Comissão.', 'E'], ['Abafar.', 'L'], ['Punir poucos.', 'N']]),
    P('Eleição apertada', 'A oposição quase vence.', [['Aceitar o resultado.', 'E'], ['Contestar.', 'V'], ['Recontagem.', 'D']])] },
];
