export const WORLD = 'liberal_world', CAT = 'Fim da História';
const P = (t, d, o) => ({ t, d, o });
const AUT = { min: { ax_auth: 15 } }, DIS = { max: { ax_econ: -15 } }, LIBR = { max: { ax_auth: -10 } }, MKT = { min: { ax_econ: 10 } };
export const ARCS = [
  { id: 'ngos', cond: AUT, role: 'power', spec: 'hostile', ctx: 'Num mundo liberal, governos autoritários são pressionados por quase todos os vizinhos.', parts: [
    P('ONGs financiadas por {power}', 'Fundações ligadas a {power} financiam ONGs, jornais independentes e partidos pequenos no seu país, "em defesa da democracia".', [['Proibir financiamento externo.', 'R'], ['Exigir transparência das ONGs.', 'N'], ['Aceitar e abrir o jogo.', 'E']]),
    P('Jornalistas em campo', 'Correspondentes estrangeiros investigam corrupção e prisões políticas. A imprensa da região ecoa as denúncias.', [['Expulsar os correspondentes.', 'R'], ['Dar entrevistas e acesso.', 'D'], ['Processar os jornais.', 'N']]),
    P('A resolução do clube', '{power} propõe uma resolução liberal pedindo eleições livres no seu país, com ameaça de sanções.', [['Fazer eleições limitadas.', 'E'], ['Rejeitar como ingerência.', 'F'], ['Negociar um calendário.', 'D']])] },
  { id: 'sanctionlib', cond: AUT, role: 'power', spec: 'hostile', parts: [
    P('Sanções do consenso', 'O Clube das Democracias aprova um pacote de sanções financeiras contra o seu governo, liderado por {power}.', [['Contrapor com um bloco alternativo.', 'F'], ['Buscar isenções.', 'D'], ['Aceitar e resistir.', 'I']]),
    P('Capital em fuga', 'Investidores retiram dinheiro. Bancos fecham contas de aliados do regime.', [['Impor controle de capitais.', 'N'], ['Reformar o sistema bancário.', 'M'], ['Pedir ajuda a outros países.', 'A']]),
    P('Cláusula de saída', '{power} diz que as sanções caem se você libertar presos políticos e abrir a imprensa.', [['Libertar presos.', 'E'], ['Recusar tudo.', 'F'], ['Libertar alguns e prorrogar.', 'D']])] },
  { id: 'exceptionalist', cond: DIS, parts: [
    P('O último socialista', 'Num mundo de mercado, seu governo é visto como uma excentricidade. Estudantes de toda parte vêm visitar o "museu vivo".', [['Receber os visitantes.', 'D'], ['Cobrar ingresso.', 'M'], ['Fechar as portas.', 'N']]),
    P('O cerco financeiro', 'Bancos e fundos recusam crédito ao seu país. Sua moeda perde valor.', [['Estatizar bancos.', 'N'], ['Aceitar o capital externo.', 'M'], ['Racionar importações.', 'S']]),
    P('Oferta de "adesão"', 'A comunidade liberal oferece integração plena com a condição de privatizar os setores estratégicos.', [['Aceitar a adesão.', 'M'], ['Recusar.', 'F'], ['Aceitar parte das condições.', 'D']])] },
  { id: 'greenpeace', cond: LIBR, parts: [
    P('Agenda verde do consenso', 'O consenso liberal impõe metas ambientais e cobra "tarifas de carbono" de quem não as cumpre.', [['Cumprir as metas.', 'X'], ['Pedir prazos.', 'D'], ['Ignorar.', 'I']]),
    P('Indústria reclama', 'Indústrias dizem que as metas vão tirar empregos e ameaçam migrar.', [['Subsidiar a transição.', 'G'], ['Manter as metas.', 'X'], ['Afrouxar.', 'M']]),
    P('Resultado da transição', 'A economia se reorganiza com novas energias; alguns setores sofrem.', [['Retreinar os trabalhadores.', 'S'], ['Atrair investidores verdes.', 'M'], ['Cobrar de quem sofrer.', 'N']])] },
  { id: 'techgiants', cond: MKT, parts: [
    P('Gigantes digitais', 'Plataformas globais dominam informação, dados e comércio. Reguladores querem limites.', [['Regular fortemente.', 'N'], ['Autorregulação.', 'M'], ['Criar plataforma estatal.', 'P']]),
    P('Escândalo de dados', 'Vazamentos expõem milhões de cidadãos. A opinião pública exige punições.', [['Multas pesadas.', 'V'], ['Acordo com as empresas.', 'B'], ['Lei de proteção de dados.', 'E']]),
    P('Moeda digital privada', 'As plataformas lançam uma moeda própria, ameaçando a soberania monetária.', [['Proibir a moeda.', 'N'], ['Adotar e regular.', 'M'], ['Lançar uma moeda estatal.', 'P']])] },
  { id: 'refugeelib', role: 'nb', spec: 'any', parts: [
    P('Corredor humanitário', 'O consenso liberal pressiona você a aceitar refugiados de {nb}, onde há conflitos locais.', [['Aceitar a cota.', 'S'], ['Aceitar parcialmente.', 'D'], ['Recusar.', 'F']]),
    P('Integração difícil', 'Cidades superlotadas, escolas sob pressão e partidos nacionalistas crescendo.', [['Investir em integração.', 'G'], ['Restringir novas entradas.', 'C'], ['Distribuir pelo país.', 'B']]),
    P('Eleição e xenofobia', 'A xenofobia vira tema da campanha. {nb} diz que os refugiados vão voltar logo.', [['Defender os refugiados.', 'E'], ['Adotar linha dura.', 'F'], ['Fazer acordo com {nb}.', 'D']])] },
  { id: 'freetrade', cond: MKT, role: 'power', spec: 'friendly', parts: [
    P('Tratado de livre comércio', '{power} propõe o fim de tarifas entre os países da comunidade. Produtores locais temem concorrência.', [['Assinar o tratado.', 'M'], ['Exigir proteção a setores.', 'D'], ['Recusar.', 'F']]),
    P('Fábricas fecham', 'Produtos importados inundam o mercado. Algumas fábricas fecham e o desemprego sobe.', [['Seguro-desemprego ampliado.', 'S'], ['Nenhuma ajuda.', 'M'], ['Salvaguardas temporárias.', 'V']]),
    P('Mercado em alta', 'Os setores competitivos prosperam. Exportações crescem.', [['Investir em inovação.', 'G'], ['Reduzir impostos.', 'M'], ['Reforçar a rede social.', 'S']])] },
  { id: 'proxywar', role: 'power', spec: 'hostile', parts: [
    P('Intervenção humanitária', '{power} propõe uma intervenção armada contra um ditador vizinho. Sua participação seria política e militar.', [['Participar com tropas.', 'W'], ['Participar com ajuda humanitária.', 'D'], ['Recusar.', 'C']]),
    P('Guerra curta', 'A intervenção termina rápido, mas o país vizinho vive um vácuo de poder.', [['Ajudar na reconstrução.', 'S'], ['Retirar-se.', 'C'], ['Manter tropas.', 'W']]),
    P('Passivo moral', 'Críticos dizem que a intervenção foi interesseira. Famílias pedem contas.', [['Abrir inquérito.', 'E'], ['Defender a decisão.', 'F'], ['Assumir os erros.', 'D']])] },
  { id: 'democracyprom', cond: LIBR, parts: [
    P('Promover a democracia', 'Organizações propõem que você use diplomacia e dinheiro para ajudar movimentos democráticos em países fechados.', [['Financiar movimentos.', 'T'], ['Fazer apenas diplomacia.', 'D'], ['Não interferir.', 'I']]),
    P('Governo ameaçado', 'Um governo autoritário reclama de interferência e ameaça retaliar.', [['Manter o apoio.', 'F'], ['Reduzir o apoio.', 'C'], ['Pedir uma mediação.', 'D']]),
    P('Revolução de cores', 'Protestos derrubam o governo autoritário. Você é acusado de orquestrar tudo.', [['Reconhecer o novo governo.', 'D'], ['Esperar eleições.', 'I'], ['Oferecer ajuda para a transição.', 'S']])] },
  { id: 'populism', parts: [
    P('Revolta contra o consenso', 'Um movimento populista cresce, dizendo que o consenso liberal enriquece elites e abandona o povo.', [['Dialogar com o movimento.', 'E'], ['Isolá-lo.', 'N'], ['Adotar parte da sua agenda.', 'S']]),
    P('Comícios', 'O líder populista ataca a imprensa e pede plebiscitos.', [['Defender as instituições.', 'D'], ['Processar o líder.', 'R'], ['Ignorar.', 'I']]),
    P('Eleição decisiva', 'As pesquisas apontam empate técnico. O consenso liberal observa.', [['Fazer campanha de unidade.', 'D'], ['Prometer reformas.', 'S'], ['Atacar o populista.', 'F']])] },
  { id: 'bailout', cond: MKT, parts: [
    P('Banco grande demais', 'Um grande banco quebra e pede resgate público, citando o risco sistêmico.', [['Salvar o banco.', 'S'], ['Deixar quebrar.', 'M'], ['Estatizar.', 'P']]),
    P('Raiva nas ruas', 'Protestos acusam o governo de salvar banqueiros e abandonar o povo.', [['Punir os executivos.', 'N'], ['Anunciar auxílio às famílias.', 'S'], ['Ignorar.', 'I']]),
    P('Reforma bancária', 'Reguladores propõem novas regras de capital e supervisão.', [['Aprovar regras duras.', 'N'], ['Adotar regras moderadas.', 'D'], ['Deixar para depois.', 'I']])] },
  { id: 'immigdev', role: 'power', spec: 'friendly', parts: [
    P('Pacto de livre circulação', '{power} propõe que cidadãos da comunidade possam viver e trabalhar livremente nos dois países.', [['Assinar o pacto.', 'M'], ['Assinar com cotas.', 'D'], ['Recusar.', 'F']]),
    P('Migração em massa', 'Jovens saem para países mais ricos e a mão de obra qualificada escasseia.', [['Retenção com bônus.', 'S'], ['Deixar fluir.', 'M'], ['Restrições à saída.', 'N']]),
    P('Remessas', 'Os emigrantes enviam dinheiro e ideias. A economia se movimenta e algumas aldeias esvaziam.', [['Investir em polos locais.', 'G'], ['Taxar remessas.', 'N'], ['Não fazer nada.', 'I']])] },
  { id: 'spacerace', cond: MKT, parts: [
    P('Turismo espacial', 'Empresas de foguetes oferecem sua base para lançamentos privados em troca de royalties.', [['Aceitar os lançamentos.', 'M'], ['Criar agência estatal.', 'P'], ['Recusar.', 'I']]),
    P('Detritos e moradores', 'Moradores reclamam do barulho e de detritos caindo. Ambientalistas se opõem.', [['Indenizar.', 'S'], ['Reforçar segurança.', 'N'], ['Ignorar.', 'I']]),
    P('Orgulho nacional', 'Um satélite nacional é lançado. O país comemora; críticos cobram prioridades.', [['Festejar e investir mais.', 'G'], ['Usar o dinheiro em saúde.', 'S'], ['Vender patentes.', 'M']])] },
  { id: 'cultural', cond: AUT, parts: [
    P('Cultura pop do clube', 'Séries, músicas e redes sociais do bloco liberal se espalham entre jovens do seu país.', [['Censurar parte.', 'N'], ['Criar cultura própria.', 'P'], ['Deixar fluir.', 'E']]),
    P('Jovens nas ruas', 'Jovens usam símbolos do bloco liberal e pedem liberdades.', [['Prender os líderes.', 'R'], ['Dialogar.', 'E'], ['Ignorar.', 'I']]),
    P('Onda de memes', 'Uma onda de sátiras sobre seu governo viraliza. A imagem do país no mundo se deteriora.', [['Processar autores.', 'R'], ['Rir junto.', 'D'], ['Bloquear plataformas.', 'N']])] },
  { id: 'anticapital', cond: DIS, role: 'power', spec: 'hostile', parts: [
    P('Uma ilha vermelha num mar de mercado', '{power} propõe uma "ponte" econômica ao seu país: crédito a juros baixos em troca de abrir mercados.', [['Aceitar o crédito.', 'A'], ['Recusar.', 'F'], ['Negociar.', 'D']]),
    P('Ofensiva de marcas', 'Marcas globais invadem o seu mercado. A população adora; os planejadores torcem o nariz.', [['Proibir marcas.', 'N'], ['Taxar pesadamente.', 'V'], ['Aceitar.', 'M']]),
    P('Crise de identidade', 'Jovens deixam o partido e vão trabalhar nas empresas globais.', [['Reformar o partido.', 'E'], ['Reforçar a doutrina.', 'N'], ['Deixar ir.', 'I']])] },
];
