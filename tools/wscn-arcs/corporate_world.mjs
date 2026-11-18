export const WORLD = 'corporate_world', CAT = 'Mundo das Corporações';
const P = (t, d, o) => ({ t, d, o });
const STA = { max: { ax_econ: -10 } }, MKT = { min: { ax_econ: 10 } };
export const ARCS = [
  { id: 'lobby', parts: [
    P('Lobistas no gabinete', 'Executivos de conglomerados ocupam a antessala do gabinete, exigindo isenções e leis sob medida.', [['Atender os lobistas.', 'B'], ['Proibir a entrada deles.', 'N'], ['Exigir transparência.', 'E']]),
    P('Lei sob encomenda', 'Um projeto de lei chega pronto, redigido pelo departamento jurídico de uma megaempresa.', [['Aprovar.', 'M'], ['Alterar.', 'D'], ['Rejeitar.', 'F']]),
    P('Porta giratória', 'Ex-ministros assumem cargos em corporações, e a imprensa fala em "captura".', [['Proibir a porta giratória.', 'N'], ['Ignorar.', 'I'], ['Criar quarentena.', 'D']])] },
  { id: 'buyout', cond: STA, role: 'power', spec: 'any', ctx: 'Num mundo dominado por corporações, o Estado forte é visto como um ativo a ser desmontado.', parts: [
    P('Oferta pelo Estado', 'Um conglomerado de {power} propõe comprar empresas estatais estratégicas e gerenciar serviços públicos.', [['Recusar.', 'F'], ['Vender parte.', 'M'], ['Licitar.', 'D']]),
    P('Greve contra a venda', 'Sindicatos paralisam o país contra as privatizações.', [['Negociar garantias.', 'S'], ['Reprimir.', 'R'], ['Suspender a venda.', 'C']]),
    P('O contra-ataque', 'O conglomerado inicia uma campanha de imprensa e corta crédito ao seu governo.', [['Estatizar a concorrente.', 'P'], ['Pedir ajuda a outros.', 'D'], ['Ceder.', 'C']])] },
  { id: 'corpfund', cond: STA, role: 'power', spec: 'hostile', parts: [
    P('Dinheiro corporativo na oposição', 'Empresas de {power} financiam partidos e jornais de oposição contra a sua política de controle.', [['Proibir doações.', 'R'], ['Fiscalizar.', 'N'], ['Aceitar o jogo.', 'B']]),
    P('Fábricas ameaçam sair', 'Corporações ameaçam deslocar fábricas se você não reduzir impostos e regras.', [['Reduzir impostos.', 'M'], ['Nacionalizar a fábrica.', 'P'], ['Negociar.', 'D']]),
    P('Campanha na imprensa', 'Redes de mídia ligadas às empresas atacam seu governo todos os dias.', [['Criar mídia pública.', 'P'], ['Processar.', 'R'], ['Ignorar.', 'I']])] },
  { id: 'privatearmy', parts: [
    P('Segurança privada', 'Uma empresa militar privada oferece contratos para proteger fábricas e minas.', [['Contratar.', 'M'], ['Recusar.', 'N'], ['Criar uma agência estatal.', 'P']]),
    P('Excessos', 'Seguranças privados agridem manifestantes. Vítimas pedem justiça.', [['Punir a empresa.', 'E'], ['Proteger a empresa.', 'B'], ['Investigar.', 'D']]),
    P('Contrato de guerra', 'A empresa propõe assumir uma operação militar de fronteira por um preço atraente.', [['Aprovar.', 'W'], ['Recusar.', 'N'], ['Contratar parte.', 'D']])] },
  { id: 'adtax', cond: MKT, parts: [
    P('Paraíso fiscal', 'Corporações pedem que seu país vire paraíso fiscal, com imposto zero e sigilo bancário.', [['Aceitar.', 'M'], ['Aceitar com fiscalização.', 'D'], ['Recusar.', 'N']]),
    P('Fluxo de dinheiro', 'Entra capital às pencas, mas denúncias ligam as contas a crimes.', [['Reforçar controles.', 'N'], ['Ignorar.', 'I'], ['Cobrar taxas.', 'M']]),
    P('Pressão externa', 'Outros países ameaçam sanções por sua conivência.', [['Reformar.', 'E'], ['Resistir.', 'F'], ['Negociar.', 'D']])] },
  { id: 'gigcity', parts: [
    P('Cidade-empresa', 'Uma corporação propõe construir uma cidade inteira, com polícia, escolas e leis próprias.', [['Aprovar.', 'M'], ['Vetar.', 'N'], ['Aprovar com limites.', 'D']]),
    P('Moradores sem direitos', 'Moradores reclamam de demissões sumárias e proibição de sindicatos.', [['Impor leis trabalhistas.', 'S'], ['Deixar.', 'I'], ['Estatizar.', 'P']]),
    P('Autonomia total', 'A empresa pede independência formal em troca de uma taxa mensal.', [['Recusar.', 'F'], ['Aceitar.', 'C'], ['Negociar.', 'D']])] },
  { id: 'patent', role: 'power', spec: 'any', parts: [
    P('Guerra de patentes', 'Empresas de {power} processam seu país por "pirataria" de medicamentos e tecnologias.', [['Pagar royalties.', 'C'], ['Licença compulsória.', 'F'], ['Negociar.', 'D']]),
    P('Remédios caros', 'Os preços sobem, hospitais reclamam e a opinião pública se revolta.', [['Subsidiar.', 'S'], ['Produzir genéricos.', 'P'], ['Nada.', 'I']]),
    P('Tribunal arbitral', 'Um tribunal arbitral decide a favor de {power}. Multas pesadas.', [['Pagar.', 'C'], ['Contestar.', 'F'], ['Negociar prazos.', 'D']])] },
  { id: 'workers', parts: [
    P('Sindicatos proibidos', 'Corporações exigem que sindicatos sejam enfraquecidos para atrair investimento.', [['Aceitar.', 'M'], ['Proteger os sindicatos.', 'S'], ['Mediar.', 'D']]),
    P('Greve geral', 'Operários cruzam os braços. As fábricas estão paradas.', [['Negociar.', 'S'], ['Reprimir.', 'R'], ['Intervir.', 'N']]),
    P('Acordo coletivo', 'Empresas oferecem um acordo coletivo de longo prazo com bônus e produtividade.', [['Assinar.', 'D'], ['Exigir mais.', 'F'], ['Recusar.', 'I']])] },
  { id: 'datamine', parts: [
    P('Mineração de dados', 'Empresas pedem acesso aos dados de saúde e transporte da população em troca de serviços gratuitos.', [['Autorizar.', 'M'], ['Proibir.', 'N'], ['Autorizar anonimizado.', 'D']]),
    P('Vazamento', 'Um vazamento expõe milhões de cidadãos. Famílias exigem indenização.', [['Multar.', 'V'], ['Abafar.', 'B'], ['Lei de proteção.', 'E']]),
    P('Mercado de perfis', 'Corretores vendem perfis detalhados a campanhas políticas.', [['Banir.', 'N'], ['Taxar.', 'M'], ['Ignorar.', 'I']])] },
  { id: 'rating', parts: [
    P('Agência de classificação', 'Uma agência privada ameaça rebaixar sua nota se você não cortar gastos sociais.', [['Cortar.', 'M'], ['Resistir.', 'S'], ['Negociar.', 'D']]),
    P('Fuga de capital', 'Mercados reagem com queda na bolsa e fuga de capitais.', [['Estabilizar com reservas.', 'A'], ['Controle de capitais.', 'N'], ['Deixar.', 'I']]),
    P('Nota reclassificada', 'A agência concede uma nota melhor em troca de reformas.', [['Aceitar.', 'M'], ['Recusar.', 'F'], ['Aceitar parte.', 'D']])] },
  { id: 'brandwar', role: 'power', spec: 'hostile', parts: [
    P('Guerra comercial entre conglomerados', 'Dois conglomerados, um de {power}, disputam seu mercado e pressionam por proteção.', [['Apoiar o nacional.', 'F'], ['Neutralidade.', 'I'], ['Taxar ambos.', 'M']]),
    P('Sabotagem', 'Fábricas sofrem apagões misteriosos. Cada um culpa o outro.', [['Investigar.', 'T'], ['Prender suspeitos.', 'R'], ['Exigir trégua.', 'D']]),
    P('Fusão', 'Os rivais anunciam fusão, formando um monopólio.', [['Autorizar.', 'M'], ['Bloquear.', 'N'], ['Autorizar com condições.', 'D']])] },
  { id: 'greenwash', parts: [
    P('Selo verde comprado', 'Uma indústria poluidora paga por certificados ambientais falsos.', [['Fiscalizar.', 'N'], ['Deixar.', 'I'], ['Taxar o carbono.', 'X']]),
    P('Rio contaminado', 'Peixes morrem e comunidades adoecem.', [['Multar.', 'V'], ['Acordo de compensação.', 'B'], ['Fechar a fábrica.', 'N']]),
    P('Eleições', 'O caso vira tema de campanha. A empresa promete empregos.', [['Aliar-se à empresa.', 'M'], ['Aliar-se aos moradores.', 'S'], ['Neutro.', 'I']])] },
  { id: 'robotlabor', parts: [
    P('Automação', 'As empresas anunciam fábricas totalmente robotizadas e prometem lucros recordes.', [['Aprovar.', 'M'], ['Taxar robôs.', 'N'], ['Exigir requalificação.', 'S']]),
    P('Desemprego em massa', 'Milhares ficam sem emprego. Há quem peça renda básica.', [['Renda básica.', 'S'], ['Treinamento.', 'G'], ['Nada.', 'I']]),
    P('Revolta dos desempregados', 'Desempregados ocupam uma fábrica e pedem apoio.', [['Apoiar.', 'S'], ['Reprimir.', 'R'], ['Mediar.', 'D']])] },
  { id: 'cyberattack', role: 'power', spec: 'hostile', parts: [
    P('Ataque cibernético', 'Hackers de uma corporação de {power} derrubam sistemas do governo.', [['Retaliar.', 'T'], ['Reforçar defesas.', 'G'], ['Denunciar.', 'D']]),
    P('Resgate', 'Os hackers pedem um resgate em moeda digital para devolver os dados.', [['Pagar.', 'C'], ['Recusar.', 'F'], ['Negociar.', 'D']]),
    P('Escândalo', 'Descobre-se que ministros contrataram o grupo para espionar rivais.', [['Demitir.', 'E'], ['Negar.', 'R'], ['Investigar.', 'D']])] },
  { id: 'sovereign', cond: STA, parts: [
    P('Fundo soberano', 'Um fundo soberano estatal poderia competir com os conglomerados. Os mercados reagem mal.', [['Criar o fundo.', 'P'], ['Adiar.', 'I'], ['Criar com sócios privados.', 'D']]),
    P('Aquisições', 'O fundo compra participações em empresas estratégicas.', [['Ampliar.', 'P'], ['Limitar.', 'N'], ['Vender.', 'M']]),
    P('Briga de gigantes', 'Os conglomerados formam uma frente contra o fundo.', [['Resistir.', 'F'], ['Ceder.', 'C'], ['Negociar.', 'D']])] },
];
