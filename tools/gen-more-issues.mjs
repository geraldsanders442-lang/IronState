// Gera mais questões gerais (economia, sociedade, política, meio ambiente, tecnologia, cultura, segurança e mundo).
// Uso: node tools/gen-more-issues.mjs   (reescreve data/issues_general.json e o registra em data/content.json)
import { writeFileSync, readFileSync } from 'node:fs';
const out = f => new URL('../data/' + f, import.meta.url);
const o = (text, hint, e = {}) => ({ text, hint, ...e });
const I = (id, cat, title, desc, context, cond, options, extra = {}) => ({ id, cat, title, desc, context, cond, w: 1, options, ...extra });

const L = [
  // ---------- Economia ----------
  I('gn_eco_gig', 'Economia', 'Motoristas de aplicativo param o país', 'Entregadores e motoristas de aplicativo bloqueiam avenidas exigindo salário mínimo por hora e seguro contra acidentes. As plataformas ameaçam sair do país.', 'A economia sob demanda cresceu mais rápido que as leis.', {}, [
    o('Regulamentar: piso por hora e seguro obrigatório.', 'Protege os trabalhadores; encarece o serviço.', { now: { unemployment: 0.1, poverty: -0.2 }, groups: { workers: 4, business: -3, youth: 1 } }),
    o('Manter como "autônomos" e criar um fundo voluntário.', 'Equilíbrio frágil.', { now: { treasury: -0.05 }, groups: { workers: 1, business: 1 } }),
    o('Reprimir os bloqueios.', 'Restaura a ordem; revolta crescente.', { now: { civil: -1, legitimacy: -2 }, groups: { workers: -4, business: 2 } })]),
  I('gn_eco_crypto_mining', 'Economia', 'Mineradores de criptomoedas devoram a energia', 'Fazendas de mineração se instalaram perto de usinas baratas e já consomem energia de cidades inteiras. Moradores sofrem apagões.', 'Energia barata virou ímã de especuladores.', {}, [
    o('Proibir a mineração em larga escala.', 'Alivia a rede; investidores reclamam.', { now: { reputation: 0 }, groups: { business: -2, youth: -1 }, long: [{ k: 's_energy', v: 2, d: 180 }] }),
    o('Taxar pesadamente o consumo.', 'Receita extra; reduz o excesso.', { now: { treasury: 0.2 }, groups: { business: -1 } }),
    o('Atrair mais, como estratégia nacional.', 'Divisas e empregos de tecnologia; risco de apagões.', { now: { treasury: 0.15 }, long: [{ k: 's_energy', v: -2, d: 180 }, { k: 'tech', v: 1, d: 0 }], groups: { youth: 2, workers: -2 } })]),
  I('gn_eco_minwage', 'Economia', 'O salário mínimo em debate', 'Sindicatos pedem aumento real do salário mínimo; empresários alertam para demissões e informalidade.', 'O número mais disputado do orçamento das famílias.', {}, [
    o('Aumento forte, acima da inflação.', 'Renda sobe; custo para as empresas.', { now: { poverty: -0.6, inflation: 0.3, unemployment: 0.2 }, groups: { workers: 5, business: -4 } }),
    o('Reajuste só pela inflação.', 'Neutro.', { groups: { workers: 0 } }),
    o('Congelar para estimular contratações.', 'Barateia o trabalho; piora a vida dos mais pobres.', { now: { poverty: 0.4, unemployment: -0.2 }, groups: { workers: -5, business: 3 } })]),
  I('gn_eco_bank', 'Economia', 'Um banco grande vacila', 'Um dos maiores bancos do país revela um rombo escondido. Poupadores correm para sacar. O mercado espera a sua decisão.', 'Salvar um banco custa; deixá-lo cair pode custar mais.', {}, [
    o('Salvar com dinheiro público.', 'Evita o pânico; custa caro e premia a imprudência.', { now: { treasury: -0.8, stability: 2 }, groups: { business: 3, workers: -3, youth: -2 } }),
    o('Intervir e vender a bons compradores.', 'Preserva depósitos, mas os acionistas perdem.', { now: { treasury: -0.3 }, groups: { business: -1 } }),
    o('Deixar quebrar e garantir só os pequenos poupadores.', 'Disciplina o mercado; risco de contágio.', { now: { growth: -0.3, stability: -1 }, groups: { business: -3, workers: 1 } })]),
  I('gn_eco_housing', 'Economia', 'Aluguéis fora de controle', 'Os aluguéis dispararam e jovens não conseguem sair da casa dos pais. Há ocupações e protestos nas grandes cidades.', 'A moradia virou o tema do momento.', { max: { housing: 60 } }, [
    o('Programa massivo de habitação popular.', 'Caro, lento, popular.', { now: { treasury: -0.5 }, long: [{ k: 'housing', v: 3, d: 0 }], groups: { youth: 4, workers: 3, business: -1 } }),
    o('Controle de aluguéis.', 'Alívio imediato; menos oferta no futuro.', { now: { inequality: -0.3 }, long: [{ k: 'housing', v: -1, d: 365 }], groups: { youth: 3, business: -4 } }),
    o('Liberar a construção e cortar burocracia.', 'Mais oferta; efeito demora.', { long: [{ k: 'housing', v: 2, d: 0 }], groups: { business: 3, youth: -1 } })]),
  I('gn_eco_import_tariff', 'Economia', 'Pressão para proteger a indústria nacional', 'Fábricas fecham diante de importações baratas. Empresários e sindicatos pedem tarifas, mas consumidores temem preços mais altos.', 'Protecionismo ou abertura?', {}, [
    o('Elevar tarifas sobre os setores ameaçados.', 'Salva empregos; encarece produtos.', { now: { inflation: 0.3, unemployment: -0.2 }, rel: { all: -1 }, groups: { workers: 3, business: 2, youth: -1 } }),
    o('Subsidiar a modernização, sem tarifas.', 'Custa dinheiro; preserva o livre comércio.', { now: { treasury: -0.35 }, long: [{ k: 'industry', v: 1.5, d: 0 }], groups: { business: 3 } }),
    o('Manter a abertura.', 'Preços baixos; desindustrialização.', { now: { inflation: -0.1 }, long: [{ k: 'industry', v: -1, d: 365 }], groups: { workers: -3, youth: 1 } })]),
  I('gn_eco_startup', 'Tecnologia', 'Uma startup nacional vira gigante', 'Uma empresa de tecnologia do país vale bilhões e quer sede em um paraíso fiscal. Funcionários e acionistas aguardam o governo.', 'Orgulho nacional, mas a empresa é móvel.', { min: { tech: 35 } }, [
    o('Isenção fiscal para ficar.', 'Mantém a empresa e empregos; contribuintes pagam.', { now: { treasury: -0.15 }, long: [{ k: 'tech', v: 1, d: 0 }], groups: { business: 3, youth: 2 } }),
    o('Exigir contrapartidas (fábrica e pesquisa locais).', 'Exige mais; pode afugentá-la.', { long: [{ k: 'productivity', v: 0.6, d: 0 }], groups: { workers: 2, business: -2 } }),
    o('Deixar partir.', 'Sem custo; perde prestígio.', { now: { reputation: -1 }, groups: { youth: -2 } })]),
  I('gn_eco_informal', 'Economia', 'A economia informal passa da metade', 'Milhões trabalham sem carteira e sem pagar impostos. A arrecadação sofre e os direitos trabalhistas não chegam a quem mais precisa.', 'Formalizar é caro; ignorar é pior.', { min: { poverty: 15 } }, [
    o('Simplificar impostos e abrir contas para microempreendedores.', 'Formaliza aos poucos.', { now: { treasury: -0.1 }, long: [{ k: 'revenue', v: 0.15, d: 0 }, { k: 'taxCapacity', v: 1, d: 0 }], groups: { business: 2, workers: 1 } }),
    o('Fiscalização dura.', 'Receita rápida; arruína pequenos negócios.', { now: { treasury: 0.15, poverty: 0.3 }, groups: { workers: -4, business: -1 } }),
    o('Deixar como está.', 'Paz com o povo; Estado frágil.', { groups: { workers: 1 } })]),
  I('gn_eco_trade_deal', 'Economia', 'Um grande tratado comercial regional', 'Seis países vizinhos propõem uma zona de livre comércio com moeda de conta comum.', 'Mercado grande, soberania menor.', {}, [
    o('Assinar o tratado.', 'Exportações e investimentos sobem; indústrias frágeis sofrem.', { now: { reputation: 1 }, long: [{ k: 'exportAccess', v: 0.04, d: 0 }, { k: 'importAccess', v: 0.03, d: 0 }], rel: { neighbors: 4 }, groups: { business: 3, workers: -2 } }),
    o('Assinar com exceções para setores sensíveis.', 'Ganho menor; menos riscos.', { long: [{ k: 'exportAccess', v: 0.02, d: 0 }], rel: { neighbors: 2 } }),
    o('Recusar.', 'Autonomia; isolamento comercial.', { rel: { neighbors: -3 }, groups: { workers: 1 } })]),
  I('gn_eco_inheritance', 'Economia', 'Imposto sobre grandes fortunas e heranças', 'Uma campanha popular exige taxar as maiores fortunas para financiar saúde e educação. A elite ameaça levar o dinheiro para fora.', 'Desigualdade em debate.', { min: { inequality: 40 } }, [
    o('Criar o imposto.', 'Receita e justiça fiscal; fuga de capitais.', { now: { treasury: 0.4, inequality: -1 }, groups: { workers: 4, youth: 3, business: -6 } }),
    o('Reduzir isenções e combater a evasão.', 'Menos conflito, menos receita.', { now: { treasury: 0.2, inequality: -0.4 }, groups: { business: -2, workers: 2 } }),
    o('Rejeitar.', 'A elite agradece.', { now: { inequality: 0.2 }, groups: { business: 3, workers: -3, youth: -2 } })]),

  // ---------- Sociedade ----------
  I('gn_soc_schoolfood', 'Sociedade', 'Merenda escolar e obesidade infantil', 'Pesquisas mostram crianças mal nutridas e também com excesso de peso. Nutricionistas pedem mudanças na merenda e nos refrigerantes vendidos nas escolas.', 'Saúde que começa na escola.', {}, [
    o('Merenda saudável universal e proibição de ultraprocessados.', 'Caro e eficaz.', { now: { treasury: -0.3, health: 1.5, hunger: -0.2 }, groups: { youth: 2, workers: 2, business: -2 } }),
    o('Campanhas educativas.', 'Barato, resultado modesto.', { now: { treasury: -0.05, health: 0.4 } }),
    o('Deixar as famílias decidirem.', 'Sem custo.', { now: { health: -0.5 } })]),
  I('gn_soc_elderly', 'Sociedade', 'Asilos lotados e idosos abandonados', 'Reportagens mostram asilos sem recursos e idosos sozinhos. As famílias não conseguem pagar cuidadores.', 'A população envelhece.', {}, [
    o('Rede pública de cuidados de longa duração.', 'Dignidade; custo permanente.', { now: { treasury: -0.4, qol: 1 }, groups: { workers: 3, youth: 1 } }),
    o('Crédito e incentivo a cuidadores familiares.', 'Mais barato.', { now: { treasury: -0.1, qol: 0.4 }, groups: { workers: 2 } }),
    o('Deixar a cargo das famílias e igrejas.', 'Sem custo.', { now: { qol: -0.5 }, groups: { workers: -2, rural: 1 } })]),
  I('gn_soc_universities', 'Educação', 'Universidades públicas em greve', 'Professores e funcionários param as universidades exigindo reposição salarial e verbas para pesquisa. Estudantes ocupam reitorias.', 'A educação superior em crise.', {}, [
    o('Reajuste e fundo de pesquisa.', 'Encerra a greve; custo alto.', { now: { treasury: -0.4, education: 1 }, long: [{ k: 'tech', v: 0.8, d: 0 }], groups: { youth: 4, bureaucracy: 2 } }),
    o('Reajuste parcial e metas de desempenho.', 'Compromisso.', { now: { treasury: -0.2, education: 0.4 }, groups: { youth: 1, bureaucracy: 1 } }),
    o('Cortar verbas e cobrar mensalidades.', 'Economiza; elitiza o ensino.', { now: { treasury: 0.2, education: -1 }, groups: { youth: -5, business: 2 }, long: [{ k: 'inequality', v: 1, d: 0 }] })]),
  I('gn_soc_drugs', 'Sociedade', 'Descriminalizar o uso de drogas?', 'Médicos e juristas defendem tratar o vício como saúde pública; conservadores veem permissividade. As prisões estão lotadas de usuários.', 'Política de drogas em transformação.', {}, [
    o('Descriminalizar o uso e investir em tratamento.', 'Menos presos, mais saúde; polêmica.', { now: { crime: -0.5, health: 0.6, civil: 1 }, groups: { youth: 4, rural: -3, military: -1 } }),
    o('Manter a repressão e endurecer penas.', 'Linha dura.', { now: { civil: -1, crime: 0.2 }, groups: { rural: 3, youth: -3 } }),
    o('Liberar apenas a cannabis medicinal.', 'Meio-termo.', { now: { health: 0.3 }, groups: { youth: 1 } })]),
  I('gn_soc_abortion', 'Sociedade', 'O debate sobre direitos reprodutivos', 'Movimentos opostos mobilizam multidões: um pede ampliar direitos, outro restringi-los. O parlamento se divide.', 'Um tema que racha famílias.', {}, [
    o('Ampliar o acesso legal e seguro.', 'Aplaudido por jovens e movimentos de mulheres.', { now: { civil: 1.5, health: 0.4 }, groups: { youth: 4, rural: -4, opposition: 1 } }),
    o('Restringir mais.', 'Agrada os conservadores.', { now: { civil: -1.5 }, groups: { rural: 4, youth: -5 } }),
    o('Manter a lei atual e evitar o tema.', 'Neutro; ninguém fica satisfeito.', {})]),
  I('gn_soc_prison', 'Segurança', 'Rebelião e superlotação nos presídios', 'Uma rebelião deixou mortos e reféns. As prisões abrigam o triplo da capacidade e viraram escritórios do crime.', 'Sistema penal em colapso.', {}, [
    o('Construir presídios e separar facções.', 'Caro; recupera o controle.', { now: { treasury: -0.4, crime: -0.5, control: 2 }, groups: { military: 1 } }),
    o('Penas alternativas e liberdade condicional para pequenos delitos.', 'Reduz lotação; polêmico.', { now: { crime: 0.1, civil: 1 }, groups: { youth: 2, rural: -2 } }),
    o('Reforçar a repressão e isolar líderes.', 'Rápido; pode radicalizar.', { now: { control: 1, civil: -1 }, groups: { military: 2, youth: -1 } })]),
  I('gn_soc_misinfo', 'Sociedade', 'Desinformação inunda as redes', 'Boatos sobre vacinas e eleições viralizam e geram ataques a postos de saúde. As plataformas se recusam a agir.', 'Verdade e liberdade em choque.', {}, [
    o('Lei de transparência e responsabilização das plataformas.', 'Combate boatos; risco de censura.', { now: { health: 0.3, civil: -0.5, reputation: -1 }, groups: { youth: -2, opposition: -2 } }),
    o('Campanhas públicas e agências de checagem.', 'Menos intrusivo, menos eficaz.', { now: { treasury: -0.1, health: 0.3 }, groups: { youth: 1 } }),
    o('Não interferir.', 'Liberdade total; danos reais.', { now: { health: -0.4, stability: -0.5 } })]),
  I('gn_soc_sport', 'Cultura', 'A seleção nacional vence o campeonato mundial', 'O país explode em festa depois de um título inesperado. O presidente é convidado a receber os atletas.', 'Aproveitar a euforia?', {}, [
    o('Feriado nacional e grande homenagem.', 'Popularidade imediata; um dia de produção a menos.', { now: { treasury: -0.1, legitimacy: 2, growth: -0.05 }, groups: { youth: 3, workers: 3 } }),
    o('Investir em esporte de base.', 'Legado duradouro.', { now: { treasury: -0.2 }, long: [{ k: 'health', v: 0.8, d: 0 }], groups: { youth: 3 } }),
    o('Cerimônia simples.', 'Discreto.', { groups: { youth: 1 } })]),
  I('gn_soc_museum', 'Cultura', 'Devolver peças roubadas dos museus', 'Países de origem exigem artefatos históricos guardados há séculos em museus nacionais. A opinião pública se divide.', 'Memória e orgulho.', {}, [
    o('Devolver as peças.', 'Gesto de reparação; críticas de tradicionalistas.', { now: { reputation: 2 }, groups: { youth: 2, rural: -1 }, rel: { all: 1 } }),
    o('Emprestar com acordos de cooperação.', 'Meio-termo.', { now: { reputation: 0.6 } }),
    o('Recusar.', 'Preserva o acervo; imagem pior.', { now: { reputation: -1.5 } })]),
  I('gn_soc_language', 'Cultura', 'Língua oficial e escolas', 'Um projeto propõe tornar uma segunda língua obrigatória nas escolas; outros defendem preservar línguas minoritárias.', 'Identidade e futuro.', {}, [
    o('Ensino bilíngue obrigatório.', 'Abre portas; custa formação de professores.', { now: { treasury: -0.2, education: 0.8 }, groups: { youth: 3, rural: -1 } }),
    o('Proteger e ensinar línguas minoritárias.', 'Reduz tensão cultural.', { now: { civil: 0.5 }, groups: { regional: 3 }, long: [{ k: 'separatism', v: -1, d: 365 }] }),
    o('Manter só a língua oficial.', 'Unidade e simplicidade.', { groups: { regional: -2, military: 1 } })]),

  // ---------- Política ----------
  I('gn_pol_leak', 'Política', 'Vazamento de documentos secretos', 'Um jornalista publica centenas de documentos do governo: contratos suspeitos e conversas privadas de ministros.', 'Transparência à força.', {}, [
    o('Abrir uma investigação independente.', 'Preserva a credibilidade; revela mais.', { now: { corruption: -1, legitimacy: 1 }, groups: { opposition: 2, bureaucracy: -2 } }),
    o('Processar o jornalista e a fonte.', 'Contém o caso; imagem péssima.', { now: { civil: -1.5, reputation: -2 }, groups: { opposition: -3, youth: -3 } }),
    o('Negar tudo e dizer que são falsificações.', 'Arrisca ser desmentido depois.', { now: { legitimacy: -1 } })]),
  I('gn_pol_votereform', 'Política', 'Reforma do sistema eleitoral', 'Partidos pequenos exigem voto proporcional; os grandes preferem o sistema atual. Uma comissão de especialistas propõe mudanças.', 'A regra do jogo.', { min: { political: 35 } }, [
    o('Adotar o voto proporcional.', 'Mais pluralismo; governos de coalizão.', { now: { political: 2 }, groups: { opposition: 3 } }),
    o('Manter o sistema atual.', 'Estabilidade para quem governa.', { groups: { opposition: -2 } }),
    o('Voto distrital misto.', 'Compromisso.', { now: { political: 1 }, groups: { opposition: 1 } })]),
  I('gn_pol_term', 'Política', 'Reeleição e limite de mandatos', 'Aliados sugerem estender o mandato presidencial; opositores falam em golpe constitucional.', 'Poder e prazo.', {}, [
    o('Propor a emenda.', 'Mais tempo no poder; legitimidade em xeque.', { now: { legitimacy: -3, political: -2 }, groups: { opposition: -4, military: 2, youth: -3 }, long: [{ k: 'revoRisk', v: 2, d: 240 }] }),
    o('Respeitar o limite e preparar sucessor.', 'Imagem democrática.', { now: { legitimacy: 2, political: 1 }, groups: { opposition: 1 } }),
    o('Referendo popular sobre o tema.', 'Decisão do povo; resultado incerto.', { now: { legitimacy: 0.5 } })]),
  I('gn_pol_judges', 'Política', 'O Supremo contra o governo', 'A suprema corte anula uma lei emblemática do governo. Aliados pedem mudar a composição do tribunal.', 'Separação de poderes em teste.', { min: { political: 30 } }, [
    o('Acatar a decisão.', 'Respeita as instituições; perde a pauta.', { now: { political: 1.5, legitimacy: 1 }, groups: { opposition: 2, bureaucracy: 1 } }),
    o('Ampliar o número de juízes.', 'Controla o tribunal; custa a reputação.', { now: { political: -2, reputation: -2 }, groups: { opposition: -4, military: 1 } }),
    o('Reescrever a lei dentro das exigências da corte.', 'Saída discreta.', { now: { legitimacy: 0.5 } })]),
  I('gn_pol_corruption_wave', 'Política', 'Operação anticorrupção prende aliados', 'Uma operação da polícia federal prende empresários e dois deputados da base governista.', 'Limpeza ou perseguição?', {}, [
    o('Apoiar a operação.', 'Credibilidade; base abalada.', { now: { corruption: -1.5, legitimacy: 2 }, groups: { bureaucracy: -3, youth: 3, opposition: 1 } }),
    o('Frear a operação nos bastidores.', 'Protege aliados; escândalo se vazar.', { now: { corruption: 1, legitimacy: -2 }, groups: { bureaucracy: 2, youth: -3 } }),
    o('Exigir limites e respeito a garantias.', 'Equilíbrio.', { now: { civil: 0.5 } })]),
  I('gn_pol_regions_tax', 'Política', 'Estados querem ficar com mais impostos', 'Governadores exigem uma fatia maior da arrecadação nacional e ameaçam reduzir serviços.', 'Federalismo em tensão.', { min: { separatism: 15 } }, [
    o('Aumentar o repasse às regiões.', 'Acalma; o governo central perde caixa.', { now: { treasury: -0.4 }, groups: { regional: 5, bureaucracy: -2 }, long: [{ k: 'separatism', v: -1.5, d: 365 }] }),
    o('Manter o pacto e oferecer obras.', 'Barato e menos eficaz.', { now: { treasury: -0.15 }, groups: { regional: 2 } }),
    o('Rejeitar.', 'Firmeza; conflito.', { groups: { regional: -4 }, long: [{ k: 'separatism', v: 2, d: 365 }] })]),
  I('gn_pol_oppleader', 'Política', 'Líder da oposição é preso', 'O principal rival do governo foi detido sob acusação de corrupção. Seus apoiadores dizem que é perseguição; a imprensa cobra provas.', 'Decisão que o mundo observa.', { max: { political: 70 } }, [
    o('Garantir julgamento justo e público.', 'Imagem respeitável.', { now: { political: 1, reputation: 1 }, groups: { opposition: 1 } }),
    o('Manter a prisão sem alarde.', 'Elimina o rival; críticas.', { now: { political: -1.5, reputation: -2 }, groups: { opposition: -4, youth: -2 } }),
    o('Soltá-lo e acusar a polícia de excesso.', 'Gesto de moderação.', { now: { legitimacy: 0.5 }, groups: { opposition: 2, military: -2 } })]),
  I('gn_pol_censorship', 'Política', 'Jornais criticam o governo de forma dura', 'Colunistas e redes sociais compararam o governo a ditaduras do passado. Aliados pedem ação contra os críticos.', 'Resistir à tentação de calar.', {}, [
    o('Responder com argumentos e ignorar.', 'Preserva a democracia.', { now: { civil: 0.5 }, groups: { opposition: 1, youth: 1 } }),
    o('Processar os veículos por difamação.', 'Efeito inibidor.', { now: { civil: -1.5, reputation: -1.5 }, groups: { opposition: -2, youth: -3 } }),
    o('Criar uma agência de comunicação estatal.', 'Mais propaganda oficial.', { now: { treasury: -0.1 }, long: [{ k: 'propaganda', v: 2, d: 0 }], groups: { bureaucracy: 1, youth: -1 } })]),

  // ---------- Meio ambiente ----------
  I('gn_env_drought', 'Meio ambiente', 'Racionamento de água', 'Reservatórios no mínimo histórico. A população reclama das torneiras vazias e a indústria pede prioridade.', 'A água virou questão de Estado.', {}, [
    o('Racionar por região e punir desperdício.', 'Distribui o sacrifício.', { now: { qol: -0.5, legitimacy: -0.5 }, groups: { workers: -1 } }),
    o('Obras de transposição e dessalinização.', 'Solução definitiva; muito caro.', { now: { treasury: -0.6 }, long: [{ k: 's_food', v: 1.5, d: 0 }], groups: { rural: 3, business: 2 } }),
    o('Priorizar a indústria e a agricultura.', 'Economia protegida; casas sofrem.', { now: { qol: -1, legitimacy: -2 }, groups: { business: 3, workers: -3 } })]),
  I('gn_env_floods', 'Meio ambiente', 'Enchentes arrasam bairros inteiros', 'Chuvas históricas deixaram milhares de desabrigados e destruíram pontes. A prefeitura culpa a falta de drenagem.', 'Reconstruir ou realocar?', {}, [
    o('Reconstruir e realocar famílias de áreas de risco.', 'Caro e duradouro.', { now: { treasury: -0.5, qol: 0.5, legitimacy: 2 }, long: [{ k: 'housing', v: 1.5, d: 0 }], groups: { workers: 3 } }),
    o('Auxílio emergencial e reconstrução rápida no mesmo lugar.', 'Barato; o risco permanece.', { now: { treasury: -0.25, legitimacy: 1 } }),
    o('Declarar calamidade e pedir ajuda internacional.', 'Traz doadores.', { now: { treasury: -0.1, reputation: 0.5 }, rel: { all: 1 } })]),
  I('gn_env_plastic', 'Meio ambiente', 'Praias cobertas de plástico', 'Turistas voltam indignados: o litoral está tomado por lixo e redes de pesca. Pescadores perdem renda.', 'Mar sujo, imagem suja.', { coast: true }, [
    o('Proibir plásticos descartáveis e pagar reciclagem.', 'Resultado visível; custo à indústria.', { now: { pollution: -1, treasury: -0.1 }, groups: { youth: 3, business: -2 } }),
    o('Mutirões de limpeza e educação ambiental.', 'Efeito temporário.', { now: { pollution: -0.3 }, groups: { youth: 1 } }),
    o('Priorizar outros temas.', 'Sem custo.', { now: { pollution: 0.5 }, groups: { youth: -1 } })]),
  I('gn_env_solar', 'Meio ambiente', 'O boom da energia solar', 'Empresas oferecem parques solares enormes em troca de contratos longos. Há ainda a opção de subsidiar painéis em telhados.', 'Matriz energética em disputa.', {}, [
    o('Leilões de grandes parques solares.', 'Energia barata e limpa.', { now: { treasury: -0.2 }, long: [{ k: 's_energy', v: 3, d: 0 }, { k: 'pollution', v: -1, d: 0 }], groups: { business: 3 } }),
    o('Subsídio a painéis residenciais.', 'Distribui renda e energia.', { now: { treasury: -0.3 }, long: [{ k: 's_energy', v: 2, d: 0 }], groups: { workers: 2, youth: 2 } }),
    o('Manter a matriz atual.', 'Sem mudança.', {})]),
  I('gn_env_deforest', 'Meio ambiente', 'Desmatamento acelera', 'Satélites mostram a floresta desaparecendo. Madeireiros e fazendeiros avançam; ambientalistas ameaçam denunciar o país.', 'Floresta em pé ou terra para produzir?', { min: { pollution: 0 } }, [
    o('Fiscalização severa e multas.', 'Reduz o desmate; irrita o campo.', { now: { pollution: -0.8, reputation: 2 }, groups: { rural: -4, youth: 3 } }),
    o('Pagar para preservar (compensação a produtores).', 'Funciona; custa.', { now: { treasury: -0.3, pollution: -0.5, reputation: 1 }, groups: { rural: 1 } }),
    o('Liberar mais áreas para produção.', 'Renda de curto prazo; imagem global pior.', { now: { pollution: 1.5, reputation: -3 }, groups: { rural: 4, youth: -3 } })]),
  I('gn_env_ev', 'Meio ambiente', 'Carros elétricos: subsidiar ou não?', 'Fabricantes pedem incentivos para instalar linhas de montagem elétricas. Críticos lembram que os ricos serão os maiores beneficiados.', 'Transição ou favor?', { min: { industry: 30 } }, [
    o('Subsídios e rede de recarga.', 'Atrai fábricas; reduz poluição.', { now: { treasury: -0.4, pollution: -0.6 }, long: [{ k: 'industry', v: 1.5, d: 0 }, { k: 'tech', v: 1, d: 0 }], groups: { business: 3, youth: 2 } }),
    o('Só transporte público elétrico.', 'Mais equidade.', { now: { treasury: -0.3, pollution: -0.5 }, groups: { workers: 3 } }),
    o('Não intervir.', 'Mercado decide.', {})]),

  // ---------- Tecnologia ----------
  I('gn_tech_ai', 'Tecnologia', 'Inteligência artificial ameaça empregos', 'Bancos, call centers e fábricas anunciam demissões com a automação. Sindicatos pedem regras; empresas pedem liberdade.', 'A nova revolução industrial.', { min: { tech: 30 } }, [
    o('Imposto sobre automação e requalificação.', 'Financia a transição; reduz o ritmo.', { now: { treasury: 0.2, unemployment: -0.1 }, long: [{ k: 'productivity', v: -0.3, d: 240 }], groups: { workers: 4, business: -3 } }),
    o('Apoiar a adoção e criar programas de reciclagem profissional.', 'Produtividade e treinamento.', { now: { treasury: -0.25 }, long: [{ k: 'productivity', v: 1, d: 0 }, { k: 'tech', v: 1, d: 0 }], groups: { business: 3, workers: 1 } }),
    o('Não fazer nada.', 'Mercado ajusta; custo social.', { now: { unemployment: 0.4 }, groups: { workers: -4, business: 2 } })]),
  I('gn_tech_privacy', 'Tecnologia', 'Reconhecimento facial nas ruas', 'A polícia pede câmeras com reconhecimento facial em todo o centro. Defensores da privacidade alertam para vigilância em massa.', 'Segurança contra privacidade.', {}, [
    o('Autorizar com controle judicial.', 'Equilíbrio.', { now: { crime: -0.3, civil: -0.5 }, groups: { military: 1, youth: -1 } }),
    o('Autorizar amplamente.', 'Mais segurança; Estado vigilante.', { now: { crime: -0.6, civil: -2 }, long: [{ k: 'repression', v: 1, d: 240 }], groups: { military: 2, youth: -3 } }),
    o('Proibir.', 'Privacidade preservada.', { now: { civil: 1 }, groups: { youth: 2, military: -1 } })]),
  I('gn_tech_cyber', 'Tecnologia', 'Ciberataque paralisa um hospital', 'Um ataque de sequestro de dados trava hospitais e prefeituras. Os criminosos pedem resgate em criptomoedas.', 'A fragilidade digital do Estado.', {}, [
    o('Recusar o resgate e reconstruir com agência de cibersegurança.', 'Boa política de longo prazo.', { now: { treasury: -0.3, health: -0.5, intel: 1 }, long: [{ k: 'intel', v: 1.5, d: 0 }], groups: { bureaucracy: 1 } }),
    o('Pagar o resgate em silêncio.', 'Resolve rápido; incentiva novos ataques.', { now: { treasury: -0.1, corruption: 0.5 }, long: [{ k: 'intel', v: -0.5, d: 180 }] }),
    o('Culpar um país vizinho.', 'Distrai; tensão externa.', { rel: { neighbors: -4 }, groups: { military: 1 } })]),
  I('gn_tech_space', 'Tecnologia', 'Um programa espacial nacional', 'Cientistas propõem lançar um satélite próprio e, depois, uma missão lunar. O custo é alto, mas o orgulho também.', 'Prestígio ou luxo?', { min: { tech: 40, industry: 35 } }, [
    o('Aprovar o programa espacial.', 'Prestígio e tecnologia de ponta.', { now: { treasury: -0.7, reputation: 2 }, long: [{ k: 'tech', v: 2, d: 0 }, { k: 'milIndustry', v: 1, d: 0 }], groups: { youth: 3, military: 2, workers: -1 } }),
    o('Só satélites de comunicação e observação.', 'Útil e barato.', { now: { treasury: -0.25 }, long: [{ k: 'tech', v: 1, d: 0 }, { k: 'intel', v: 1, d: 0 }] }),
    o('Recusar: há prioridades na Terra.', 'Economiza.', { groups: { youth: -1 } })]),
  I('gn_tech_5g', 'Tecnologia', 'A guerra das redes 5G', 'Duas potências pressionam o país para excluir o fornecedor do rival das redes 5G. As operadoras estão no meio.', 'Tecnologia como geopolítica.', {}, [
    o('Excluir o fornecedor chinês.', 'Agrada o Ocidente; encarece a rede.', { now: { treasury: -0.15 }, rel: { west: 3, china: -4 } }),
    o('Excluir o fornecedor ocidental.', 'Preço baixo; tensão com o Ocidente.', { rel: { west: -4, china: 3 } }),
    o('Abrir à concorrência com regras de segurança.', 'Equilíbrio.', { now: { intel: 0.5 } })]),
  I('gn_tech_broadband', 'Tecnologia', 'Internet para o interior', 'Milhões ainda estão sem banda larga. Um plano de fibra e satélites custa caro, mas promete alavancar o interior.', 'Inclusão digital.', {}, [
    o('Plano nacional de conectividade.', 'Educação e renda no campo.', { now: { treasury: -0.5 }, long: [{ k: 'education', v: 1.5, d: 0 }, { k: 'growth', v: 0.1, d: 365 }], groups: { rural: 4, youth: 3 } }),
    o('Parcerias com operadoras e subsídios.', 'Mais barato; cobertura menor.', { now: { treasury: -0.2 }, long: [{ k: 'education', v: 0.6, d: 0 }], groups: { rural: 2, business: 1 } }),
    o('Deixar o mercado agir.', 'Interior continua isolado.', { groups: { rural: -2 } })]),

  // ---------- Segurança e defesa ----------
  I('gn_sec_terror', 'Segurança', 'Atentado terrorista em uma estação lotada', 'Uma bomba matou dezenas em hora de pico. Uma organização extremista reivindica a autoria. O país pede ação imediata.', 'Segurança e liberdade em choque.', {}, [
    o('Leis antiterror e vigilância ampliada.', 'Sensação de segurança; liberdades reduzidas.', { now: { civil: -2, legitimacy: 1, crime: -0.3 }, long: [{ k: 'intel', v: 1.5, d: 0 }], groups: { military: 3, youth: -2 } }),
    o('Investigação policial e cooperação internacional.', 'Respeita direitos; resultados mais lentos.', { now: { treasury: -0.15, intel: 1 }, rel: { all: 1 }, groups: { military: 1 } }),
    o('Operação militar contra a base do grupo.', 'Resposta forte; riscos políticos.', { now: { readiness: 1, legitimacy: 2, reputation: -1 }, groups: { military: 4, youth: -1 } })]),
  I('gn_sec_border', 'Segurança', 'Contrabando e tráfico na fronteira', 'Contrabandistas dominam trilhas na fronteira, com armas e drogas. Moradores dizem que a polícia só aparece nas reportagens.', 'Fronteiras porosas.', {}, [
    o('Reforçar com tropas e drones.', 'Eficaz e caro.', { now: { treasury: -0.4, control: 2, crime: -0.4 }, groups: { military: 3 } }),
    o('Cooperar com o vizinho em patrulhas conjuntas.', 'Bom para as relações.', { now: { treasury: -0.15, crime: -0.2 }, rel: { neighbors: 4 } }),
    o('Ignorar.', 'Sem custo.', { now: { crime: 0.3, control: -1 } })]),
  I('gn_sec_conscription', 'Defesa', 'Serviço militar obrigatório', 'Generais pedem retomar o serviço militar obrigatório; jovens e famílias reagem.', 'Prontidão ou liberdade.', {}, [
    o('Restabelecer o serviço obrigatório.', 'Efetivo e coesão; jovens protestam.', { now: { readiness: 3, troops: 8 }, long: [{ k: 'laborSupply', v: -0.2, d: 0 }], groups: { military: 4, youth: -6 } }),
    o('Reforçar o exército profissional com salários melhores.', 'Mais caro, mais aceito.', { now: { treasury: -0.4, readiness: 1.5 }, groups: { military: 3, youth: 1 } }),
    o('Manter o modelo atual.', 'Sem mudanças.', {})]),
  I('gn_sec_veterans', 'Defesa', 'Veteranos esquecidos', 'Veteranos de guerra protestam por pensões, atendimento médico e emprego. A imprensa mostra um deles dormindo na rua.', 'Quem luta merece mais.', {}, [
    o('Programa completo para veteranos.', 'Honra e custo.', { now: { treasury: -0.3, legitimacy: 1.5 }, groups: { military: 4, workers: 1 } }),
    o('Pensão mínima e vagas em empresas estatais.', 'Meio-termo.', { now: { treasury: -0.1 }, groups: { military: 2 } }),
    o('Ignorar os protestos.', 'Sem custo; a corporação se ressente.', { groups: { military: -4 }, long: [{ k: 'coupRisk', v: 1.5, d: 180 }] })]),
  I('gn_sec_arms_export', 'Defesa', 'Exportar armas para um regime controverso', 'Uma empresa nacional fechou um contrato bilionário com um governo acusado de violar direitos humanos. O Ministério das Relações Exteriores hesita.', 'Dinheiro ou princípios.', { min: { milIndustry: 25 } }, [
    o('Liberar a exportação.', 'Receitas e empregos; manchas na imagem.', { now: { treasury: 0.4, reputation: -3 }, groups: { business: 3, military: 2, youth: -3 } }),
    o('Vetar o contrato.', 'Coerência; perde dinheiro.', { now: { reputation: 2 }, groups: { youth: 3, business: -2 } }),
    o('Liberar só equipamentos não letais.', 'Compromisso.', { now: { treasury: 0.15, reputation: -0.5 } })]),
  I('gn_sec_disaster_army', 'Defesa', 'O exército nas ruas contra a violência', 'Governadores pedem que as Forças Armadas assumam o policiamento de uma capital tomada pelo crime.', 'Uso interno das forças.', {}, [
    o('Enviar tropas por tempo limitado.', 'Resultados rápidos; riscos de abusos.', { now: { crime: -1, control: 2, civil: -0.5 }, groups: { military: 2, youth: -1 } }),
    o('Fortalecer a polícia civil e a inteligência.', 'Demorado, mais saudável.', { now: { treasury: -0.3, crime: -0.3 }, long: [{ k: 'crime', v: -0.8, d: 365 }] }),
    o('Recusar.', 'Preserva a separação civil-militar.', { now: { crime: 0.2 }, groups: { military: -1 } })]),

  // ---------- Mundo e diplomacia ----------
  I('gn_wld_refugees_far', 'Mundo', 'Uma guerra distante enche os campos de refugiados', 'Uma guerra em outro continente gera milhões de deslocados. A ONU pede que todos os países recebam alguns milhares.', 'A solidariedade tem preço.', {}, [
    o('Aceitar uma cota e apoiar a integração.', 'Imagem humanitária.', { now: { treasury: -0.2, reputation: 3 }, groups: { youth: 2, rural: -2 } }),
    o('Contribuir só com dinheiro.', 'Ajuda sem receber gente.', { now: { treasury: -0.15, reputation: 1 } }),
    o('Recusar.', 'Sem custo; críticas.', { now: { reputation: -2 }, groups: { rural: 1 } })]),
  I('gn_wld_summit', 'Mundo', 'Sede de uma cúpula internacional', 'O país foi convidado a sediar uma importante cúpula de líderes. Hotéis, segurança e protestos são parte do pacote.', 'Prestígio custa caro.', {}, [
    o('Sediar com grande pompa.', 'Prestígio e turismo; custo.', { now: { treasury: -0.35, reputation: 3, legitimacy: 1 }, rel: { all: 2 }, groups: { business: 2 } }),
    o('Sediar de forma enxuta.', 'Metade do custo.', { now: { treasury: -0.15, reputation: 1.5 } }),
    o('Declinar.', 'Economiza.', { now: { reputation: -0.5 } })]),
  I('gn_wld_oil_cartel', 'Mundo', 'Cartel de produtores pede adesão', 'Os grandes exportadores de energia querem cortar a produção para elevar preços e convidam o país a participar.', 'Clube exclusivo e caro.', {}, [
    o('Aderir ao cartel.', 'Receita extra; fricção com consumidores.', { now: { treasury: 0.4 }, rel: { west: -3 }, groups: { business: 2 } }),
    o('Observador.', 'Meia-porta.', { now: { treasury: 0.1 } }),
    o('Rejeitar e vender mais.', 'Concorrência; boa relação com consumidores.', { rel: { west: 2 } })]),
  I('gn_wld_border_dispute', 'Mundo', 'Disputa por uma ilha desabitada', 'O vizinho enviou um navio-pesquisa a uma ilha reivindicada pelos dois países. Pescadores e almirantes pedem ação.', 'Soberania e petróleo possível.', {}, [
    o('Patrulhar com a marinha.', 'Mostra firmeza; risco de choque.', { now: { readiness: 1 }, rel: { neighbors: -6 }, groups: { military: 3 } }),
    o('Propor exploração conjunta.', 'Solução criativa.', { now: { reputation: 1.5 }, rel: { neighbors: 3 } }),
    o('Levar ao tribunal internacional.', 'Lento, mas legítimo.', { now: { reputation: 1 }, rel: { neighbors: -1 } })]),
  I('gn_wld_aid_bridge', 'Mundo', 'Uma potência oferece financiar a nova ponte', 'Uma grande potência propõe financiar uma ponte e um porto, mas com empresas e mão de obra dela e juros altos.', 'Presente grego?', {}, [
    o('Aceitar o financiamento.', 'Infraestrutura rápida; dívida e dependência.', { now: { debt: 0.5, treasury: 0.1 }, long: [{ k: 'infra', v: 1.5, d: 0 }, { k: 'exportAccess', v: 0.02, d: 0 }], rel: { china: 4 } }),
    o('Exigir contratar empresas locais.', 'Negocia melhores termos.', { now: { debt: 0.3 }, long: [{ k: 'infra', v: 1, d: 0 }, { k: 'industry', v: 0.5, d: 0 }] }),
    o('Recusar.', 'Evita a dívida.', {})]),
  I('gn_wld_spy', 'Mundo', 'Espião estrangeiro é descoberto', 'Um funcionário do ministério foi flagrado repassando documentos a uma embaixada. A imprensa pede expulsão.', 'Diplomacia da sombra.', {}, [
    o('Expulsar o embaixador.', 'Mostra firmeza; crise diplomática.', { now: { reputation: 0.5 }, rel: { all: -1 }, groups: { military: 2 } }),
    o('Protestar discretamente e reforçar a contrainteligência.', 'Sem barulho.', { now: { intel: 1.5, treasury: -0.1 } }),
    o('Abafar para não irritar o parceiro.', 'Evita problemas agora.', { now: { intel: -1 }, groups: { military: -2 } })]),
  I('gn_wld_pandemic_prep', 'Saúde', 'Um novo vírus preocupa a OMS', 'A Organização Mundial da Saúde alerta para um vírus respiratório que se espalha em outro continente. Especialistas pedem preparar o país.', 'Prevenir ou esperar?', {}, [
    o('Estocar insumos, reforçar vigilância e leitos.', 'Caro agora; vale muito depois.', { now: { treasury: -0.4, health: 1 }, long: [{ k: 'health', v: 1.5, d: 0 }], groups: { workers: 1, youth: 1 } }),
    o('Vigilância nas fronteiras e comunicação.', 'Medidas leves.', { now: { treasury: -0.1, health: 0.3 } }),
    o('Esperar para ver.', 'Sem custo; pode custar caro.', { now: { health: -0.3 } })]),
  I('gn_wld_olympics', 'Mundo', 'Candidatura aos Jogos Olímpicos', 'O comitê nacional quer disputar a sede dos Jogos. A candidatura promete turismo e obras; economistas alertam para o histórico de prejuízos.', 'Festa ou armadilha?', {}, [
    o('Candidatar-se com plano de legado.', 'Prestígio; risco financeiro.', { now: { treasury: -0.3, reputation: 1.5 }, groups: { youth: 3, business: 2 } }),
    o('Candidatar-se só em parceria regional.', 'Divide o custo.', { now: { treasury: -0.15, reputation: 1 }, rel: { neighbors: 2 } }),
    o('Declinar.', 'Foco em saúde e escola.', { groups: { youth: -1 } })]),
  I('gn_wld_diaspora', 'Mundo', 'Diáspora quer votar e investir', 'Milhões de nacionais vivem no exterior. Seus líderes pedem representação no parlamento e incentivos para investir de volta.', 'Cidadãos de longe.', {}, [
    o('Dar representação e incentivos.', 'Capital e influência; muda o jogo político.', { now: { treasury: -0.1 }, long: [{ k: 'growth', v: 0.1, d: 365 }, { k: 'influence', v: 1, d: 0 }], groups: { business: 2, opposition: 1 } }),
    o('Só incentivos de investimento.', 'Mais simples.', { long: [{ k: 'growth', v: 0.08, d: 365 }] }),
    o('Nada além do atual.', 'Sem mudança.', {})]),
];

writeFileSync(out('issues_general.json'), JSON.stringify(L, null, 1));
const cp = out('content.json'), c = JSON.parse(readFileSync(cp, 'utf8'));
if (!c.issues.includes('issues_general')) { c.issues.push('issues_general'); writeFileSync(cp, JSON.stringify(c, null, 1)); }
console.log('questões gerais:', L.length);
