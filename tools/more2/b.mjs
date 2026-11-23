// Questões novas (parte B): economia e cotidiano, tecnologia, meio ambiente, política e justiça, mundo.
import { Q } from './a.mjs';
const q = (id, cat, title, desc, context, cond, options, x = {}) => Q.push({ id, cat, title, desc, context, cond, options, ...x });

// ===== Economia e cotidiano =====
q('mx_eco_truckers', 'Economia', 'Greve dos caminhoneiros', 'Caminhoneiros param estradas por causa do diesel. Prateleiras esvaziam em dois dias e o setor agrícola avisa que a safra vai apodrecer.', '', { min: { inflation: 3, day: 200 } }, [
  ['Subsidiar o diesel.', 'Acaba o bloqueio; custa caro.', { treasury: -0.9, inflation: -0.3 }, { workers: 2, business: 2 }],
  ['Negociar um fundo de estabilização.', 'Mais estável e lento.', { treasury: -0.4 }, { business: 1 }],
  ['Usar o Exército para desbloquear.', 'Abre as estradas e racha com a categoria.', { civil: -1, protest: 2 }, { military: 2, workers: -3 }],
], { cd: 600 });
q('mx_eco_blackout', 'Economia', 'Apagão em várias cidades', 'Falha em linhas de transmissão deixa milhões sem luz por dias. Fábricas param, hospitais usam geradores.', '', { min: { day: 200 } }, [
  ['Investir na rede e em usinas.', 'Resolve de forma duradoura.', { treasury: -0.9, growth: 0.1 }, { business: 2 }, [{ k: 'infra', v: 1, d: 365 }]],
  ['Racionar a energia por um tempo.', 'Evita novos apagões; irrita.', { growth: -0.3, protest: 1 }, { workers: -2 }],
  ['Culpar a gestão anterior.', 'Sem custo, sem solução.', { legitimacy: -0.5 }, {}],
], { cd: 700 });
q('mx_eco_housing_bubble', 'Economia', 'Bolha imobiliária no centro das cidades', 'Preços de imóveis dobraram em cinco anos. Jovens não conseguem morar perto do trabalho e fundos compram quarteirões inteiros.', '', { min: { day: 250 } }, [
  ['Controlar aluguéis e taxar imóveis vazios.', 'Alívio para inquilinos; investidores reagem.', { housing: 1.5 }, { youth: 4, business: -3 }],
  ['Construir moradia popular em larga escala.', 'Efeito lento; custo alto.', { treasury: -1, housing: 2 }, { workers: 3, business: 1 }],
  ['Deixar o mercado resolver.', 'A bolha pode estourar.', { housing: -1 }, { business: 2, youth: -3 }],
], { cd: 600 });
q('mx_eco_crypto', 'Economia', 'Criptomoedas e fuga de dólares', 'Famílias trocam o dinheiro local por criptomoedas e pressionam o câmbio. Há golpes e casos de lavagem de dinheiro.', '', { min: { day: 150 } }, [
  ['Regulamentar e tributar as corretoras.', 'Receita e controle; um pouco de burocracia.', { treasury: 0.3, reputation: 0.5 }, { business: -1, youth: -1 }],
  ['Proibir.', 'Tenta frear a fuga; vira clandestino.', { civil: -1 }, { youth: -3 }],
  ['Criar uma moeda digital do banco central.', 'Modernização com custo.', { treasury: -0.3, efficiency: 0.5 }, { business: 1 }],
], { cd: 700 });
q('mx_eco_pension', 'Economia', 'Rombo na previdência', 'A população envelhece, a previdência consome o orçamento e economistas pedem reforma já. Os sindicatos prometem greve geral.', '', { min: { day: 300 } }, [
  ['Reformar: elevar a idade mínima.', 'Equilibra as contas; revolta dos mais velhos.', { treasury: 0.9, protest: 2 }, { workers: -5, business: 3 }],
  ['Aumentar contribuições dos mais ricos.', 'Preserva direitos; reação do empresariado.', { treasury: 0.5 }, { workers: 2, business: -4 }],
  ['Adiar de novo.', 'O rombo cresce.', { debt: 0.5 }, {}],
], { cd: 900 });
q('mx_eco_min_wage', 'Economia', 'Reajuste do salário mínimo', 'Centrais sindicais pedem 15% de aumento no salário mínimo; empresários dizem que isso destrói empregos formais.', '', { min: { day: 200 } }, [
  ['Aprovar o aumento.', 'Mais renda; custo para pequenos empresários.', { poverty: -0.8, inflation: 0.3 }, { workers: 4, business: -3 }],
  ['Aumento só pela inflação.', 'Mantém o poder de compra.', {}, { workers: 1 }],
  ['Congelar.', 'Contas equilibradas; popularidade em queda.', { poverty: 0.4 }, { workers: -4, business: 3 }],
], { cd: 450 });
q('mx_eco_remote', 'Economia', 'Trabalho remoto muda as cidades', 'Milhares trabalham de casa. Centros urbanos esvaziam, bairros periféricos prosperam e o transporte público perde passageiros.', '', { min: { day: 250 } }, [
  ['Incentivar a descentralização com banda larga no interior.', 'Reequilibra o território.', { treasury: -0.5, growth: 0.1 }, { rural: 3, regional: 2 }, [{ k: 'infra', v: 1, d: 365 }]],
  ['Subsidiar o transporte e o centro.', 'Preserva o modelo; caro.', { treasury: -0.4 }, { workers: 1 }],
  ['Deixar o mercado se ajustar.', 'Mudança desordenada.', {}, {}],
], { cd: 700 });
q('mx_eco_tourism', 'Economia', 'Turismo em excesso numa cidade histórica', 'A cidade histórica recebe 10 vezes mais turistas do que moradores. Preços sobem, moradores se mudam e o patrimônio sofre.', '', { min: { day: 250 } }, [
  ['Limitar o número de visitantes e cobrar entrada.', 'Protege o patrimônio e gera receita.', { treasury: 0.3 }, { business: -2, regional: 1 }],
  ['Promover destinos alternativos no interior.', 'Distribui a renda.', { treasury: -0.2 }, { regional: 3 }],
  ['Deixar crescer.', 'Dinheiro hoje, problemas amanhã.', { treasury: 0.4 }, { business: 3, workers: -1 }],
], { cd: 800 });
q('mx_eco_fishing', 'Economia', 'Pesca predatória e a frota estrangeira', 'Barcos estrangeiros pescam em suas águas. Pescadores locais voltam com redes vazias e pedem a Marinha.', '', { min: { day: 250 } }, [
  ['Patrulhar e apreender os barcos.', 'Protege a pesca; risco de incidente.', { reputation: -0.5 }, { rural: 3, military: 1 }],
  ['Negociar cotas e licenças pagas.', 'Receita; menos confronto.', { treasury: 0.4 }, { rural: -1 }],
  ['Ignorar.', 'Os peixes e os votos acabam.', {}, { rural: -3 }],
], { cd: 800 });
q('mx_eco_informal', 'Economia', 'O setor informal engole a economia', 'Mais da metade dos trabalhadores está sem carteira. O Estado perde impostos e eles ficam sem proteção.', '', { min: { day: 300 }, max: { taxCapacity: 60 } }, [
  ['Simplificar impostos para pequenos negócios.', 'Formaliza aos poucos.', { treasury: 0.3, unemployment: -0.3 }, { business: 2, workers: 2 }],
  ['Fiscalização dura.', 'Mais arrecadação e mais desemprego.', { treasury: 0.5, unemployment: 0.8, protest: 1 }, { workers: -3, business: -1 }],
  ['Tolerar.', 'A economia segue como está.', {}, {}],
], { cd: 800 });
q('mx_eco_import_food', 'Economia', 'Preço do pão dispara', 'O trigo importado fica mais caro e padarias reajustam o pão em 30%. Filas, panelaços e especulação.', '', { min: { inflation: 4 } }, [
  ['Subsidiar o pão e controlar preços.', 'Alívio rápido; custo e escassez.', { treasury: -0.5, inflation: -0.3 }, { workers: 3, business: -2 }],
  ['Liberar importações de outros países.', 'Aumenta a oferta.', { inflation: -0.4 }, { rural: -2, business: 1 }],
  ['Incentivar o trigo local.', 'Resolve em anos.', { treasury: -0.4 }, { rural: 3 }, [{ k: 's_food', v: 1, d: 365 }]],
], { cd: 500 });
q('mx_eco_olympics', 'Economia', 'Candidatura aos Jogos Olímpicos', 'Uma comissão sugere sediar os Jogos. Haverá obras, turismo e orgulho nacional... e risco de elefantes brancos.', '', { min: { day: 400 } }, [
  ['Candidatar-se.', 'Prestígio e obras; custo alto.', { treasury: -1, reputation: 2 }, { business: 3, workers: 2 }],
  ['Recusar e investir em educação.', 'Menos glamour.', { education: 0.5, treasury: -0.3 }, { youth: 2 }],
  ['Propor jogos regionais menores.', 'Meio-termo.', { treasury: -0.3, reputation: 0.5 }, {}],
], { cd: 1200 });

// ===== Tecnologia e sociedade =====
q('mx_tec_ai_jobs', 'Tecnologia', 'Inteligência artificial e empregos', 'Empresas substituem atendentes, contadores e tradutores por sistemas de IA. Sindicatos pedem uma moratória e jovens pedem formação.', '', { min: { tech: 30, day: 300 } }, [
  ['Programa nacional de requalificação.', 'Amortece o choque.', { treasury: -0.6, unemployment: -0.2 }, { workers: 3, youth: 2 }],
  ['Taxar a automação e financiar a renda básica.', 'Redistribui os ganhos; empresas reclamam.', { treasury: 0.3, poverty: -0.5 }, { workers: 4, business: -3 }],
  ['Deixar o mercado decidir.', 'Produtividade sobe, empregos somem.', { unemployment: 0.8, growth: 0.3 }, { business: 3, workers: -4 }],
], { cd: 800 });
q('mx_tec_social_media', 'Tecnologia', 'Redes sociais e a crise de saúde mental', 'Estudos ligam o uso intenso de redes sociais por jovens à ansiedade. Pais pedem regras. Plataformas dizem que tomam cuidados.', '', { min: { day: 200 } }, [
  ['Proibir redes para menores de 14.', 'Protege jovens; aplicação difícil.', { health: 0.5, civil: -0.5 }, { youth: -3, rural: 2 }],
  ['Exigir controles dos pais e limites de tempo.', 'Equilíbrio.', { health: 0.3 }, { youth: -1 }],
  ['Campanha de educação digital nas escolas.', 'Suave e lenta.', { education: 0.4 }, { youth: 1 }],
], { cd: 800 });
q('mx_tec_surveillance', 'Tecnologia', 'Câmeras com reconhecimento facial', 'Uma empresa oferece câmeras com reconhecimento facial para a capital. A polícia promete menos crimes; ativistas, um Estado de vigilância.', '', { min: { day: 200 } }, [
  ['Instalar em toda a cidade.', 'Menos crime e menos privacidade.', { crime: -2, civil: -2 }, { military: 2, youth: -3 }],
  ['Usar só em locais críticos, com limites legais.', 'Meio-termo.', { crime: -1, civil: -0.5 }, {}],
  ['Proibir o reconhecimento facial.', 'Privacidade; mais crime.', { civil: 1, crime: 0.5 }, { youth: 2 }],
], { cd: 700 });
q('mx_tec_hack', 'Tecnologia', 'Ciberataque paralisa os serviços', 'Hackers criptografam os computadores de hospitais e prefeituras e exigem resgate. Cirurgias são adiadas.', '', { min: { day: 250 } }, [
  ['Recusar pagar e reconstruir os sistemas.', 'Dói agora; evita incentivo.', { treasury: -0.5, efficiency: -1 }, {}],
  ['Pagar o resgate discretamente.', 'Rápido; financia o crime.', { treasury: -0.3, reputation: -1 }, {}],
  ['Criar uma agência nacional de cibersegurança.', 'Investimento estrutural.', { treasury: -0.6, intel: 3 }, { bureaucracy: 1 }],
], { cd: 800 });
q('mx_tec_ev', 'Tecnologia', 'Carros elétricos e as montadoras', 'A transição para carros elétricos ameaça as fábricas de motores a combustão. Há incentivos disponíveis para quem investir.', '', { min: { industry: 30, day: 300 } }, [
  ['Incentivar a produção local de elétricos.', 'Futuro verde; custo agora.', { treasury: -0.7, pollution: -0.5 }, { business: 2, workers: -1 }, [{ k: 'tech', v: 1, d: 365 }]],
  ['Proteger as montadoras tradicionais.', 'Preserva empregos hoje.', { pollution: 0.3 }, { workers: 2, business: 1 }],
  ['Abrir o mercado a importados.', 'Preços menores; indústria local sofre.', { inflation: -0.2 }, { workers: -2 }],
], { cd: 800 });
q('mx_tec_deepfake', 'Tecnologia', 'Deepfake atinge o governo', 'Um vídeo falso com a sua voz anunciando medidas impopulares viraliza. Parte da população acredita.', '', { min: { day: 250 } }, [
  ['Desmentir com fatos e punir os autores.', 'Responde à altura; exige tempo.', { legitimacy: 0.5, civil: -0.3 }, {}],
  ['Lei de identificação de conteúdo sintético.', 'Resposta institucional.', { reputation: 0.5 }, { youth: 1 }],
  ['Ignorar.', 'O boato corre.', { legitimacy: -1.5 }, { opposition: 2 }],
], { cd: 700 });
q('mx_tec_rural_internet', 'Tecnologia', 'Internet no campo', 'Escolas rurais sem sinal ficam para trás. Uma empresa de satélites propõe uma parceria para cobrir o país.', '', { min: { day: 200 } }, [
  ['Parceria com a empresa de satélites.', 'Cobertura rápida; dependência externa.', { treasury: -0.4, education: 0.5 }, { rural: 4 }],
  ['Rede pública de fibra.', 'Mais soberania, mais caro e mais lento.', { treasury: -1 }, { rural: 3 }, [{ k: 'infra', v: 1, d: 365 }]],
  ['Esperar a iniciativa privada.', 'O campo segue isolado.', {}, { rural: -3 }],
], { cd: 800 });

// ===== Meio ambiente =====
q('mx_env_flood', 'Meio ambiente', 'Enchentes arrasam bairros inteiros', 'Chuvas extremas inundam bairros de baixa renda e áreas rurais. Milhares ficam desabrigados.', '', { min: { day: 200 } }, [
  ['Ajuda de emergência e plano de realocação.', 'Protege vidas; custa caro.', { treasury: -0.9, qol: 0.5 }, { workers: 3, rural: 2 }],
  ['Obras de drenagem e diques.', 'Resposta estrutural.', { treasury: -1.2 }, { business: 2 }, [{ k: 'infra', v: 1, d: 365 }]],
  ['Pedir doações e ajuda externa.', 'Mais barato; imagem de fraqueza.', { reputation: -0.5 }, {}],
], { cd: 700 });
q('mx_env_plastic', 'Meio ambiente', 'Plástico nos rios e praias', 'Praias lotadas de plástico e rios entupidos viram assunto internacional e afugentam turistas.', '', { min: { day: 200 } }, [
  ['Proibir plásticos descartáveis.', 'Resolve parte; custa para as empresas.', { pollution: -1, treasury: -0.1 }, { business: -2, youth: 3 }],
  ['Taxar embalagens e financiar a reciclagem.', 'Receita e menos lixo.', { pollution: -0.7, treasury: 0.2 }, { business: -1 }],
  ['Mutirões de limpeza.', 'Efeito visual, nenhuma causa atacada.', { pollution: -0.2 }, { youth: 1 }],
], { cd: 700 });
q('mx_env_illegal_mining', 'Meio ambiente', 'Garimpo ilegal contamina rios', 'Garimpeiros usam mercúrio nos rios. Comunidades ribeirinhas adoecem e peixes desaparecem.', '', { min: { day: 200 } }, [
  ['Operação militar contra os garimpos.', 'Destrói a operação; custa e gera atritos.', { treasury: -0.5, pollution: -1 }, { military: 1, rural: -1 }],
  ['Legalizar com regras ambientais.', 'Receita e controle; difícil de fiscalizar.', { treasury: 0.3 }, { business: 2 }],
  ['Fingir que não vê.', 'O problema cresce.', { health: -1 }, {}],
], { cd: 800 });
q('mx_env_nuclear_power', 'Meio ambiente', 'Usina nuclear civil', 'Uma proposta de energia nuclear promete eletricidade estável e limpa, mas há medo de acidentes e dúvidas sobre o lixo radioativo.', '', { min: { tech: 40, day: 300 } }, [
  ['Construir a usina.', 'Energia estável; investimento enorme e polêmica.', { treasury: -1.5, pollution: -1 }, { business: 2, youth: -1 }, [{ k: 's_energy', v: 1.5, d: 365 }]],
  ['Apostar em solar e eólica.', 'Verde, mas intermitente.', { treasury: -0.7, pollution: -0.8 }, { youth: 2 }],
  ['Continuar com o gás e o carvão.', 'Barato hoje, pior amanhã.', { pollution: 1 }, {}],
], { cd: 900 });
q('mx_env_glacier', 'Meio ambiente', 'Seca nas montanhas', 'O derretimento das geleiras e as secas ameaçam a água das cidades vizinhas.', '', { min: { day: 300 } }, [
  ['Plano nacional de água e reservatórios.', 'Resiliência de longo prazo.', { treasury: -1 }, { rural: 2 }, [{ k: 'infra', v: 1, d: 365 }]],
  ['Acordo regional sobre a gestão das bacias.', 'Diplomacia da água.', { reputation: 1 }, {}],
  ['Esperar.', 'Mais cedo ou mais tarde, falta água.', { health: -0.3 }, {}],
], { cd: 900 });

// ===== Política e justiça =====
q('mx_pol_electoral', 'Política', 'Reforma eleitoral: voto distrital ou proporcional?', 'Há pressão para mudar o sistema eleitoral. Cada modelo favorece partidos diferentes e pode mudar a cara do Congresso.', '', { min: { day: 400 } }, [
  ['Voto distrital.', 'Aproxima o eleitor do representante; reduz partidos pequenos.', { legitimacy: 0.3 }, { opposition: -2 }],
  ['Manter o proporcional.', 'Mais pluralismo; fragmentação.', {}, { opposition: 1 }],
  ['Referendo sobre o sistema.', 'Legitima, demora e custa.', { treasury: -0.2, legitimacy: 0.6 }, {}],
], { cd: 1000 });
q('mx_pol_media', 'Política', 'Conglomerado de mídia pró-governo', 'Um empresário aliado compra jornais, TVs e rádios. A oposição fala em "monopólio" e a imprensa independente se sente ameaçada.', '', { min: { day: 250 } }, [
  ['Lei antimonopólio de mídia.', 'Mais pluralismo; irrita o aliado.', { civil: 1 }, { business: -2, opposition: 2 }],
  ['Deixar crescer.', 'Cobertura amistosa, credibilidade em queda.', { legitimacy: 0.5, civil: -1 }, { business: 2, opposition: -2 }],
  ['Criar uma TV pública independente.', 'Contraponto; custa dinheiro.', { treasury: -0.4, civil: 0.5 }, { youth: 1 }],
], { cd: 800 });
q('mx_pol_judges', 'Política', 'O Supremo derruba uma lei sua', 'A Corte Suprema declara inconstitucional uma lei central do seu governo. Aliados sugerem aumentar o número de juízes.', '', { min: { day: 300 } }, [
  ['Acatar a decisão.', 'Respeito às instituições; perde a agenda.', { legitimacy: 0.5 }, { opposition: -1 }],
  ['Aumentar o número de juízes e nomear aliados.', 'Controla a Corte; crise institucional.', { civil: -2, reputation: -1.5 }, { opposition: 4 }],
  ['Reescrever a lei com ajustes.', 'Caminho de meio.', { efficiency: -0.3 }, {}],
], { cd: 900 });
q('mx_pol_referendum', 'Política', 'Plebiscito sobre uma questão polêmica', 'Movimentos sociais coletam assinaturas para um plebiscito sobre um tema polarizador. Você pode apoiar, boicotar ou antecipar a votação.', '', { min: { day: 300 } }, [
  ['Apoiar e participar.', 'Democracia direta; resultado incerto.', { legitimacy: 0.8 }, { youth: 2 }],
  ['Boicotar e pedir abstenção.', 'Tenta esvaziar; arrisca perder a base.', { legitimacy: -0.5 }, { opposition: 2 }],
  ['Antecipar e escolher a data.', 'Vantagem tática; acusações de manipulação.', { civil: -0.3 }, {}],
], { cd: 1000 });
q('mx_pol_corruption_probe', 'Política', 'Operação anticorrupção mira aliados', 'A Polícia Federal prende deputados da sua base por desvio de verbas. A operação toma a imprensa e o Congresso ameaça travar sua pauta.', '', { min: { corruption: 40, day: 250 } }, [
  ['Apoiar a operação.', 'Boa imagem; perde votos no Congresso.', { corruption: -1.5, legitimacy: 1 }, { opposition: -1, bureaucracy: -2 }],
  ['Pressionar para frear a operação.', 'Protege aliados; escândalo.', { corruption: 1, legitimacy: -2 }, { opposition: 3 }],
  ['Pedir investigação independente e separar os casos.', 'Posição de equilíbrio.', { legitimacy: 0.3 }, {}],
], { cd: 800 });
q('mx_pol_vote_obligatory', 'Política', 'Voto obrigatório ou voluntário?', 'Um projeto propõe tornar o voto voluntário. Defensores dizem que melhora a qualidade do debate; críticos, que exclui os mais pobres.', '', { min: { day: 400 } }, [
  ['Manter obrigatório.', 'Alta participação.', {}, {}],
  ['Tornar voluntário.', 'Menos participação popular.', { legitimacy: -0.5 }, { workers: -2, business: 1 }],
  ['Obrigatório, com multa simbólica.', 'Meio-termo.', {}, { workers: -1 }],
], { cd: 1000 });
q('mx_pol_amnesty', 'Política', 'Pedido de anistia para presos políticos', 'Famílias e organizações de direitos humanos pedem anistia para presos políticos. Setores militares avisam que reagirão.', '', { min: { prisoners: 1 } }, [
  ['Conceder a anistia.', 'Direitos e imagem; reação da linha dura.', { civil: 2, reputation: 2 }, { military: -3, opposition: 3 }],
  ['Anistia parcial, apenas para casos leves.', 'Equilíbrio.', { civil: 1 }, { military: -1 }],
  ['Negar.', 'Mantém a ordem; custa imagem.', { reputation: -1.5 }, { military: 2 }],
], { cd: 700 });

// ===== Mundo =====
q('mx_wld_summit', 'Diplomacia', 'Convite para uma cúpula internacional', 'Uma cúpula reúne chefes de Estado. Você pode ir, enviar o ministro ou recusar, em um momento delicado.', '', { min: { day: 200 } }, [
  ['Ir pessoalmente.', 'Prestígio e contatos.', { reputation: 1.5, influence: 1 }, { opposition: 1 }],
  ['Enviar o ministro das Relações Exteriores.', 'Presença sem riscos.', { reputation: 0.5 }, {}],
  ['Recusar.', 'Soberania ostensiva; isolamento.', { reputation: -1 }, { military: 1 }],
], { cd: 500 });
q('mx_wld_spy_scandal', 'Diplomacia', 'Escândalo de espionagem', 'A imprensa revela que o seu serviço de inteligência espionava aliados e rivais. Embaixadores são convocados.', '', { min: { intel: 40, day: 250 } }, [
  ['Admitir e prometer reformas.', 'Fecha a crise; dá munição à oposição.', { reputation: 0.5, intel: -2 }, { opposition: 2 }],
  ['Negar e atacar o vazamento.', 'Pode funcionar; pode piorar.', { reputation: -1.5 }, { military: 1 }],
  ['Oferecer troca de informações com os aliados.', 'Transforma a crise em acordo.', { intel: 1 }, {}],
], { cd: 800 });
q('mx_wld_aid', 'Diplomacia', 'Ajuda humanitária após um terremoto no exterior', 'Um terremoto devasta um país distante. Os governos enviam ajuda. Você pode se destacar ou ficar fora.', '', { min: { day: 200 } }, [
  ['Enviar equipes e dinheiro.', 'Prestígio e gratidão.', { treasury: -0.4, reputation: 2.5 }, { workers: -1 }],
  ['Doar o mínimo.', 'Sem custo, sem fama.', { reputation: 0.3 }, {}],
  ['Declinar: temos nossos problemas.', 'Economiza; imagem fria.', { reputation: -1 }, { rural: 1 }],
], { cd: 800 });
q('mx_wld_border_fishing', 'Diplomacia', 'Disputa por uma ilha desabitada', 'Um país vizinho hasteia a bandeira numa ilha desabitada com possível petróleo. A mídia exige resposta.', '', { min: { day: 250 } }, [
  ['Enviar a Marinha.', 'Firmeza; risco de confronto.', { reputation: -0.5, readiness: 2 }, { military: 3 }],
  ['Levar à Corte Internacional.', 'Legalismo; resposta lenta.', { reputation: 1.5 }, { military: -1 }],
  ['Acordo de exploração conjunta.', 'Pragmático.', { treasury: 0.3, reputation: 1 }, { military: -1 }],
], { cd: 800 });
q('mx_wld_embargo', 'Diplomacia', 'Embargo comercial de um bloco', 'Um bloco poderoso ameaça embargar produtos do seu país se você não alterar uma política. Exportadores em pânico.', '', { min: { day: 300 } }, [
  ['Ceder em parte.', 'Evita o embargo; perde autonomia.', { reputation: -0.5, growth: 0.2 }, { business: 3, military: -2 }],
  ['Resistir e buscar outros parceiros.', 'Mais independência; custo de transição.', { growth: -0.3 }, { business: -2, military: 1 }],
  ['Contra-atacar com tarifas.', 'Escalada.', { growth: -0.5, inflation: 0.3 }, { workers: 2, business: -3 }],
], { cd: 900 });
q('mx_wld_climate_summit', 'Diplomacia', 'Meta de emissões na conferência do clima', 'Na conferência do clima, esperam que você assuma metas ambiciosas de emissões. Isso custa à indústria.', '', { min: { day: 300 } }, [
  ['Assumir metas ambiciosas.', 'Imagem e financiamento verde; custo industrial.', { reputation: 2, pollution: -0.6, treasury: -0.2 }, { business: -2, youth: 3 }],
  ['Metas moderadas.', 'Equilíbrio.', { reputation: 0.5 }, {}],
  ['Recusar: crescimento primeiro.', 'Indústria agradece; críticas mundiais.', { reputation: -2, growth: 0.2 }, { business: 2, youth: -2 }],
], { cd: 900 });
