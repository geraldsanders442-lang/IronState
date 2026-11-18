export const PREFIX = 'st_', CAT = 'Natureza do Estado';
const P = (t, d, o) => ({ t, d, o });
const UT = { state: 'utopia' }, TH = { state: 'taxhaven' }, FA = { state: 'failed' }, RI = { state: 'rich' }, DY = { state: 'dystopia' };
export const ARCS = [
  // ---- Utopia ----
  { id: 'ut_envy', cond: UT, parts: [
    P('A inveja dos vizinhos', 'O seu país virou referência mundial em bem-estar e liberdade. Milhares de pessoas pedem para imigrar e vizinhos acusam você de "roubar talentos".', [['Abrir as portas com critérios.', 'D'], ['Receber todos.', 'S'], ['Restringir para não sobrecarregar.', 'N']]),
    P('Fardo da perfeição', 'Filas nos hospitais e aluguéis disparam com a chegada de gente nova.', [['Investir em moradia e saúde.', 'G'], ['Cobrar taxa de ingresso.', 'M'], ['Limitar vistos.', 'C']]),
    P('Ameaça de fora', 'Um regime autoritário vizinho acusa seu país de "subverter" seus cidadãos com propaganda livre.', [['Manter as transmissões.', 'E'], ['Reduzir o tom.', 'D'], ['Aumentar a defesa.', 'W']])] },
  { id: 'ut_boredom', cond: UT, parts: [
    P('O tédio da prosperidade', 'Uma geração que nunca viu crise questiona se tudo "vale a pena". Jovens pedem desafios e propósito.', [['Criar serviço civil voluntário.', 'S'], ['Investir em exploração e ciência.', 'G'], ['Deixar o tempo resolver.', 'I']]),
    P('Seitas e novos credos', 'Novos movimentos espirituais ganham adeptos. Alguns aparecem como seitas fechadas.', [['Liberdade total de culto.', 'E'], ['Regular seitas.', 'N'], ['Campanha de ceticismo.', 'X']]),
    P('Um grande projeto', 'Cientistas propõem um programa espacial e climático de décadas.', [['Aprovar.', 'G'], ['Rejeitar: priorizar gastos sociais.', 'S'], ['Aprovar parcialmente.', 'D']])] },
  { id: 'ut_fragile', cond: UT, parts: [
    P('Um mundo frágil', 'O sistema funciona tão bem que ninguém lembra por que ele existe. Um grupo propõe cortar a vigilância das instituições "porque já é confiável".', [['Cortar a vigilância.', 'E'], ['Manter a fiscalização.', 'N'], ['Criar auditoria cidadã.', 'D']]),
    P('Fraude escondida', 'Uma pequena fraude cresce sem que ninguém perceba, até virar escândalo.', [['Punir e reformar.', 'E'], ['Abafar.', 'L'], ['Pedir desculpas ao público.', 'D']]),
    P('Teste de resiliência', 'Um choque externo ameaça o modelo. O país descobre se aprendeu a lidar com crises.', [['Apelar à solidariedade.', 'S'], ['Declarar emergência.', 'R'], ['Pedir ajuda externa.', 'A']])] },
  { id: 'ut_cult', cond: UT, parts: [
    P('Turismo de "cidade ideal"', 'Milhões de turistas querem ver o "país perfeito". O setor gera riqueza, mas moradores se sentem num zoológico.', [['Estimular o turismo.', 'M'], ['Limitar visitantes.', 'N'], ['Taxa para financiar a cultura.', 'S']]),
    P('Teatro da felicidade', 'Críticos dizem que o país esconde infelicidades atrás da propaganda de paraíso.', [['Abrir estatísticas completas.', 'E'], ['Rebater as críticas.', 'D'], ['Silenciar os críticos.', 'L']]),
    P('Prêmio internacional', 'Uma entidade internacional concede ao país um prêmio de "melhor sociedade do mundo".', [['Aceitar e festejar.', 'S'], ['Recusar e pedir cautela.', 'D'], ['Usar o prêmio na campanha.', 'H']])] },
  // ---- Paraíso fiscal ----
  { id: 'th_leak', cond: TH, parts: [
    P('Vazamento de contas', 'Um consórcio de jornalistas vaza documentos: líderes de vários países escondem fortunas nos seus bancos.', [['Negar e prender os vazadores.', 'R'], ['Colaborar com investigações.', 'D'], ['Jogar a culpa nos bancos privados.', 'V']]),
    P('Sanções ameaçadas', 'Grandes potências ameaçam colocar o país numa lista de paraísos fiscais com sanções.', [['Aprovar transparência parcial.', 'D'], ['Resistir.', 'F'], ['Mudar de modelo.', 'M']]),
    P('Fuga dos bancos', 'Clientes tiram o dinheiro. O governo precisa decidir se muda o modelo.', [['Prometer sigilo total.', 'M'], ['Adotar regras internacionais.', 'E'], ['Criar uma moeda digital.', 'G']])] },
  { id: 'th_oligarch', cond: TH, parts: [
    P('O hóspede incômodo', 'Um oligarca estrangeiro, procurado por seu país, quer comprar cidadania com um bilhão em investimentos.', [['Conceder.', 'M'], ['Recusar.', 'E'], ['Aceitar só o dinheiro, sem cidadania.', 'B']]),
    P('Ordem de extradição', 'Seu país de origem exige a extradição, ameaça sanções e envia agentes.', [['Entregar o oligarca.', 'C'], ['Proteger.', 'F'], ['Mandá-lo para terceiro país.', 'D']]),
    P('Cartel de cobertura', 'Uma rede de bancos pede um tratado de proteção contra "perseguição".', [['Assinar.', 'M'], ['Não assinar.', 'E'], ['Cobrar uma taxa.', 'B']])] },
  { id: 'th_shell', cond: TH, parts: [
    P('Empresas de fachada', 'Há mais empresas registradas do que habitantes. Fiscais estrangeiros alertam para lavagem de dinheiro.', [['Fechar empresas de fachada.', 'E'], ['Cobrar taxa por empresa.', 'M'], ['Ignorar os alertas.', 'I']]),
    P('Cartel de drogas usa o país', 'Descobre-se que um cartel lava milhões por aqui. A polícia local é pequena.', [['Pedir ajuda de agentes estrangeiros.', 'A'], ['Endurecer a lei.', 'N'], ['Negar.', 'L']]),
    P('Lista negra', 'O país é incluído numa lista cinza. Os bancos globais passam a cobrar mais caro.', [['Reformar rápido.', 'E'], ['Contestar a lista.', 'F'], ['Aceitar a perda.', 'I']])] },
  { id: 'th_pop', cond: TH, parts: [
    P('Riqueza sem povo', 'O dinheiro entra, mas o povo comum vive à margem: aluguéis altos e poucos empregos locais.', [['Imposto especial para investir em moradia.', 'S'], ['Manter tudo.', 'M'], ['Cotas de emprego local.', 'N']]),
    P('Paraíso e favelas', 'Bairros pobres crescem ao lado de condomínios de luxo e a tensão aumenta.', [['Reprimir.', 'R'], ['Urbanizar.', 'G'], ['Isolar os bairros.', 'N']]),
    P('Greve geral', 'Garçons, motoristas e serventes entram em greve geral.', [['Aumentar o salário mínimo.', 'S'], ['Contratar trabalhadores estrangeiros.', 'M'], ['Intervir.', 'R']])] },
  // ---- País falido ----
  { id: 'fa_looting', cond: FA, parts: [
    P('Estado sem Estado', 'A polícia não recebe há meses. Grupos armados cobram "taxas de proteção" em bairros inteiros.', [['Pagar os salários atrasados.', 'S'], ['Contratar milícias.', 'Q'], ['Pedir tropas estrangeiras.', 'A']]),
    P('Moeda sem valor', 'O dinheiro vale cada vez menos. Mercadorias só circulam por escambo e moedas estrangeiras.', [['Dolarizar.', 'M'], ['Emitir moeda.', 'I'], ['Lançar um novo padrão.', 'G']]),
    P('Governos paralelos', 'Prefeitos e chefes locais passam a governar sozinhos. Alguns cobram impostos próprios.', [['Reconhecer a realidade e negociar.', 'D'], ['Tentar retomar o controle.', 'W'], ['Pedir ajuda externa.', 'A']])] },
  { id: 'fa_bailout', cond: FA, parts: [
    P('O resgate com condições', 'O FMI oferece um resgate com condições duras: cortes e privatizações.', [['Aceitar.', 'C'], ['Recusar.', 'F'], ['Negociar prazos.', 'D']]),
    P('Cortes e protestos', 'As medidas provocam cortes de salários e protestos violentos.', [['Manter o programa.', 'N'], ['Suavizar.', 'S'], ['Reprimir.', 'R']]),
    P('Vendas de bens públicos', 'Empresas estrangeiras compram portos e minas a preço de banana.', [['Autorizar.', 'M'], ['Vetar.', 'F'], ['Exigir participação estatal.', 'P']])] },
  { id: 'fa_exodus', cond: FA, parts: [
    P('O êxodo dos que podem', 'Médicos, engenheiros e professores deixam o país em massa.', [['Impor serviço obrigatório.', 'R'], ['Dar incentivos para ficar.', 'S'], ['Aceitar a perda.', 'I']]),
    P('Hospitais vazios', 'Hospitais fecham por falta de médicos. A mortalidade infantil sobe.', [['Contratar médicos estrangeiros.', 'A'], ['Criar cursos rápidos.', 'G'], ['Esperar.', 'I']]),
    P('Remessas e esperança', 'Os emigrantes enviam dinheiro e ajudam a manter a economia.', [['Taxar as remessas.', 'N'], ['Dar benefícios a quem investir.', 'M'], ['Criar um fundo de retorno.', 'G']])] },
  { id: 'fa_coupmen', cond: FA, parts: [
    P('Generais impacientes', 'Oficiais sem pagamento falam em "salvar a pátria" e pedem reunião secreta.', [['Pagar os salários da tropa.', 'S'], ['Demitir os oficiais.', 'N'], ['Dividir o comando.', 'B']]),
    P('Quartel inquieto', 'Há movimentos estranhos em quartéis da capital.', [['Reforçar a guarda presidencial.', 'W'], ['Chamar os oficiais ao diálogo.', 'D'], ['Ignorar.', 'I']]),
    P('Última chance', 'Um general ligado à oposição propõe um pacto: governo de transição em troca de anistia.', [['Aceitar.', 'C'], ['Recusar.', 'F'], ['Prender o general.', 'R']])] },
  // ---- País rico ----
  { id: 'ri_decay', cond: RI, parts: [
    P('A opulência cansada', 'A população envelhece, jovens não querem trabalhos manuais e as fábricas fecham.', [['Atrair imigrantes qualificados.', 'M'], ['Investir em robôs.', 'G'], ['Incentivar natalidade.', 'S']]),
    P('Fundo de pensão em risco', 'Cada vez menos trabalhadores sustentam cada vez mais aposentados.', [['Aumentar a idade mínima.', 'N'], ['Aumentar impostos.', 'S'], ['Reformar o sistema.', 'G']]),
    P('Protesto grisalho', 'Aposentados bloqueiam estradas em protesto contra cortes.', [['Recuar.', 'C'], ['Manter a reforma.', 'F'], ['Negociar.', 'D']])] },
  { id: 'ri_aid', cond: RI, parts: [
    P('A pressão para ajudar', 'Organizações pedem que países ricos aumentem a ajuda externa. Seu eleitorado está dividido.', [['Dobrar a ajuda.', 'S'], ['Manter.', 'I'], ['Cortar.', 'N']]),
    P('Ajuda com condições', 'Os países receptores reclamam das exigências políticas anexas.', [['Reduzir as condições.', 'D'], ['Manter.', 'F'], ['Vincular a contratos de empresas locais.', 'M']]),
    P('Uma estrela da caridade', 'Um bilionário cria uma fundação gigantesca e pede apoio do governo.', [['Apoiar.', 'B'], ['Regular.', 'N'], ['Ignorar.', 'I']])] },
  { id: 'ri_inequal', cond: RI, parts: [
    P('Riqueza concentrada', 'Os 1% mais ricos controlam metade da riqueza nacional. Movimentos pedem um imposto sobre fortunas.', [['Criar o imposto.', 'S'], ['Rejeitar.', 'M'], ['Imposto menor com isenções.', 'D']]),
    P('Fuga de capitais', 'Bilionários ameaçam sair do país e transferem bens para paraísos fiscais.', [['Controle de capitais.', 'N'], ['Reduzir a alíquota.', 'M'], ['Acordo com paraísos fiscais.', 'D']]),
    P('Eleição polarizada', 'A disputa política é dominada pelo tema.', [['Defender a taxa.', 'S'], ['Apostar na redução.', 'M'], ['Convocar referendo.', 'E']])] },
  { id: 'ri_tech', cond: RI, parts: [
    P('Gigantes tecnológicas', 'Uma empresa nacional domina a internet global e pressiona o governo por regras sob medida.', [['Regular com rigor.', 'N'], ['Parceria estratégica.', 'M'], ['Dividir a empresa.', 'V']]),
    P('Poder demais', 'A empresa passa a ter mais dados que o Estado.', [['Lei de proteção de dados.', 'E'], ['Acordo de colaboração.', 'T'], ['Nacionalizar.', 'P']]),
    P('Fuga de cérebros', 'Os melhores engenheiros são recrutados no exterior.', [['Cláusulas de retenção.', 'N'], ['Aumentar salários.', 'S'], ['Atrair estrangeiros.', 'M']])] },
  // ---- Distopia extra ----
  { id: 'dy_rationing', cond: DY, parts: [
    P('Cartões de racionamento', 'O governo quer distribuir cartões de racionamento e premiar os cidadãos "leais" com cotas maiores.', [['Criar o sistema de pontos.', 'L'], ['Distribuir igualmente.', 'S'], ['Abrir o mercado.', 'M']]),
    P('Mercado de cartões', 'Cartões são vendidos e falsificados. Quem não tem pontos passa fome.', [['Executar falsificadores.', 'R'], ['Anistia.', 'E'], ['Ampliar a distribuição.', 'S']]),
    P('Revolta dos sem-ponto', 'Os excluídos queimam um depósito do governo.', [['Reprimir.', 'R'], ['Distribuir comida.', 'S'], ['Negociar.', 'D']])] },
  { id: 'dy_exit', cond: DY, parts: [
    P('Fim das saídas', 'Cresce o número de pessoas que querem deixar o país. O ministro propõe exigir autorização para sair.', [['Aprovar a autorização.', 'N'], ['Exigir fiança.', 'M'], ['Liberar.', 'E']]),
    P('A fronteira como cela', 'Famílias são separadas na fronteira, e histórias de fugas dramáticas chegam à imprensa estrangeira.', [['Reforçar as fronteiras.', 'R'], ['Abrir um canal legal.', 'D'], ['Calar a imprensa.', 'L']]),
    P('Um túnel', 'Descobre-se um túnel de fuga cavado por 200 pessoas.', [['Prender todos.', 'R'], ['Tapar o túnel e perdoar.', 'C'], ['Transformar em propaganda.', 'L']])] },
];
