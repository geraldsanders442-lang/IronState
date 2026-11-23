// Questões novas (parte C): cultura, religião, demografia, esporte, segurança, ciência e poder.
import { Q } from './a.mjs';
const q = (id, cat, title, desc, context, cond, options, x = {}) => Q.push({ id, cat, title, desc, context, cond, options, ...x });

q('mx_cul_museum', 'Cultura', 'Museus pedem a devolução de peças históricas', 'Museus estrangeiros guardam tesouros nacionais levados no passado. Historiadores pedem a devolução.', '', { min: { day: 250 } }, [
  ['Exigir a devolução formal.', 'Orgulho nacional; atrito diplomático.', { reputation: 0.5 }, { youth: 2, military: 1 }],
  ['Aceitar empréstimos rotativos.', 'Pragmático.', { reputation: 0.5 }, {}],
  ['Deixar para lá.', 'Sem custo, sem glória.', {}, { youth: -1 }],
], { cd: 900 });
q('mx_cul_film', 'Cultura', 'Filme nacional concorre ao maior prêmio do cinema', 'Uma produção local entra na disputa por um prêmio internacional. A festa pode virar orgulho nacional... ou polêmica sobre o tema do filme.', '', { min: { day: 250 } }, [
  ['Apoiar com campanha e verba pública.', 'Orgulho e turismo.', { treasury: -0.2, reputation: 1 }, { youth: 3 }],
  ['Manter distância.', 'Neutro.', {}, {}],
  ['Criticar o filme como "ofensivo".', 'Agrada um lado, afasta artistas.', { reputation: -0.5 }, { youth: -3, rural: 2 }],
], { cd: 900 });
q('mx_rel_school', 'Religião', 'Ensino religioso nas escolas públicas', 'Líderes religiosos pedem aulas de religião obrigatórias; grupos laicos exigem escolas neutras.', '', { min: { day: 250 } }, [
  ['Tornar obrigatório.', 'Agrada o clero; polarização.', { civil: -0.8 }, { rural: 3, youth: -3 }],
  ['Opcional e plural.', 'Equilíbrio.', {}, { rural: 1 }],
  ['Proibir nas escolas públicas.', 'Estado laico; reação religiosa.', { civil: 0.8 }, { rural: -3, youth: 2 }],
], { cd: 800 });
q('mx_rel_pilgrimage', 'Religião', 'Uma grande peregrinação ameaça a ordem', 'Milhões de fiéis marcham em direção a um santuário. O sistema de saúde e o transporte não suportam a multidão.', '', { min: { day: 250 } }, [
  ['Reforçar a infraestrutura e a segurança.', 'Evento seguro; caro.', { treasury: -0.5 }, { rural: 2 }],
  ['Restringir o número de peregrinos.', 'Controla riscos; fiéis reclamam.', { civil: -0.4 }, { rural: -2 }],
  ['Deixar a organização à igreja.', 'Barato e arriscado.', { health: -0.4 }, {}],
], { cd: 900 });
q('mx_dem_birth', 'Sociedade', 'Natalidade em queda livre', 'A taxa de natalidade cai ano após ano. Escolas fecham no interior e a população envelhece.', '', { min: { day: 400 } }, [
  ['Bônus-bebê e creches gratuitas.', 'Estimula famílias; caro e lento.', { treasury: -0.7 }, { workers: 2, youth: 2 }, [{ k: 'birth', v: 1, d: 365 }]],
  ['Atrair imigrantes qualificados.', 'Rápido; gera debate.', { growth: 0.2 }, { rural: -2, business: 2 }],
  ['Nada: o mercado se ajusta.', 'Os problemas se acumulam.', {}, {}],
], { cd: 1000 });
q('mx_dem_exodus_brain', 'Sociedade', 'Fuga de cérebros', 'Médicos, engenheiros e pesquisadores recebem ofertas no exterior e vão embora.', '', { min: { day: 300 }, max: { qol: 60 } }, [
  ['Salários competitivos e bolsas de retorno.', 'Segura talentos; custa.', { treasury: -0.6, education: 0.3 }, { youth: 3, bureaucracy: 1 }],
  ['Exigir anos de serviço público após a formatura.', 'Retém; revolta jovens.', { civil: -0.5 }, { youth: -3 }],
  ['Aceitar a emigração e buscar remessas.', 'Remessas ajudam, mas o país perde capital humano.', { tech: -0.4, treasury: 0.2 }, {}],
], { cd: 800 });
q('mx_spo_worldcup', 'Esporte', 'A seleção nacional vai à final', 'O país inteiro para para ver a seleção na final do campeonato mundial. Há quem queira decretar feriado.', '', { min: { day: 250 } }, [
  ['Decretar feriado nacional.', 'Alegria; custo na produção.', { growth: -0.1, stability: 1 }, { workers: 4, business: -2 }],
  ['Transmitir em telões e liberar parte do expediente.', 'Meio-termo.', { stability: 0.5 }, { workers: 2 }],
  ['Manter o expediente normal.', 'Sem custo; sem festa.', {}, { workers: -3 }],
], { cd: 900 });
q('mx_spo_doping', 'Esporte', 'Escândalo de doping de Estado', 'Investigadores internacionais dizem que atletas nacionais eram dopados com apoio de órgãos públicos.', '', { min: { day: 300 } }, [
  ['Aceitar as conclusões e punir os responsáveis.', 'Custa orgulho; protege a imagem.', { reputation: 1 }, { military: -1 }],
  ['Chamar de campanha política.', 'Mantém o orgulho nacional; sanções esportivas.', { reputation: -2 }, { military: 1 }],
  ['Investigação interna independente.', 'Ganha tempo.', { reputation: 0.3 }, {}],
], { cd: 1000 });
q('mx_sec_gangs', 'Segurança', 'Facções disputam o controle das prisões', 'Rebeliões em presídios mostram que facções dominam o sistema. Dentro das cadeias, o Estado perdeu o controle.', '', { min: { crime: 35, day: 200 } }, [
  ['Construir presídios federais de segurança máxima.', 'Isola líderes; caro.', { treasury: -1, crime: -1.5 }, { military: 2 }],
  ['Investir em ressocialização e trabalho.', 'Resultado lento.', { treasury: -0.4, crime: -0.7 }, { youth: 1 }],
  ['Negociar discretamente com os líderes.', 'Paz frágil; corrupção.', { crime: -0.5, corruption: 1.5 }, {}],
], { cd: 600 });
q('mx_sec_police_strike', 'Segurança', 'Greve da polícia', 'Policiais se recusam a trabalhar exigindo reajuste. Saques e assaltos aumentam.', '', { min: { policeAuto: 40, day: 200 } }, [
  ['Atender às exigências.', 'Fim da greve; custo e precedente.', { treasury: -0.7, crime: -1 }, { military: 2 }, [{ k: 'coupRisk', v: 1, d: 90 }]],
  ['Chamar o Exército.', 'Mantém a ordem; racha com a polícia.', { crime: 1, civil: -0.8 }, { military: 2, workers: -1 }],
  ['Punir os grevistas.', 'Mostra força; crime sobe.', { crime: 2, protest: 1 }, { military: -2 }],
], { cd: 900 });
q('mx_sec_terror', 'Segurança', 'Ameaça terrorista em eventos públicos', 'Serviços de inteligência alertam sobre um atentado. Cancelar eventos custa dinheiro; ignorar pode custar vidas.', '', { min: { intel: 25, day: 250 } }, [
  ['Cancelar os eventos e reforçar a segurança.', 'Evita o pior; frustra a população.', { treasury: -0.3, stability: -0.5 }, { business: -2 }],
  ['Manter os eventos com segurança discreta.', 'Risco calculado.', { }, {}],
  ['Fazer prisões preventivas.', 'Pode evitar o atentado; abusos.', { civil: -1.5 }, { military: 1 }],
], { cd: 700 });
q('mx_sci_space', 'Ciência', 'Programa espacial nacional', 'Cientistas pedem um programa espacial para satélites e prestígio. Os críticos falam em "luxo" num país com pobreza.', '', { min: { tech: 35, day: 400 } }, [
  ['Criar a agência espacial.', 'Prestígio e tecnologia; caro.', { treasury: -1.2, tech: 0.8, reputation: 1 }, { youth: 2 }],
  ['Parceria com uma agência estrangeira.', 'Mais barato; menos autonomia.', { treasury: -0.4, tech: 0.4 }, {}],
  ['Priorizar a saúde e a educação.', 'Gastos sociais.', { health: 0.5, education: 0.5 }, { workers: 2 }],
], { cd: 1200 });
q('mx_sci_pandemic', 'Saúde', 'Um novo vírus aparece no país vizinho', 'Um surto de um vírus desconhecido assusta o mundo. Os vizinhos fecham fronteiras.', '', { min: { day: 300 } }, [
  ['Fechar as fronteiras e testar em massa.', 'Contém o vírus; economia sofre.', { treasury: -0.6, growth: -0.3, health: 0.8 }, { business: -2 }],
  ['Monitorar sem restrições.', 'Preserva a economia; risco alto.', { health: -0.5 }, { business: 2 }],
  ['Parceria internacional de pesquisa e vacinas.', 'Investimento de longo prazo.', { treasury: -0.4, reputation: 1.5 }, {}],
], { cd: 1000 });
q('mx_pow_succession', 'Poder', 'Quem será o seu sucessor?', 'Aliados começam a discutir a sua sucessão, e dois nomes disputam o seu favor. Cada um representa uma linha diferente.', '', { min: { day: 500 } }, [
  ['Apoiar o herdeiro ideológico.', 'Garante a continuidade; rivalidade interna.', { stability: 0.5 }, { bureaucracy: 2 }],
  ['Apoiar o pragmático.', 'Mais votos; menos pureza.', { legitimacy: 0.5 }, { business: 2 }],
  ['Não escolher ninguém.', 'Evita a disputa agora; deixa o vácuo.', {}, {}, [{ k: 'coupRisk', v: 1.5, d: 180 }]],
], { cd: 1200 });
q('mx_pow_cult_personality', 'Poder', 'Culto à personalidade', 'Aliados sugerem estátuas, avenidas com seu nome e um livro obrigatório nas escolas. Dizem que isso consolida o governo.', '', { min: { day: 400 } }, [
  ['Aprovar a campanha.', 'Reforça o poder; ridículo nas redes.', { legitimacy: 2, civil: -1 }, { youth: -3, military: 2 }],
  ['Recusar com modéstia.', 'Imagem de humildade.', { legitimacy: 0.5 }, {}],
  ['Aprovar só o essencial.', 'Meio-termo.', { legitimacy: 0.8 }, {}],
], { cd: 1000 });
q('mx_pow_family', 'Poder', 'Escândalo envolve a sua família', 'Reportagens mostram que parentes seus fecharam contratos com o governo. A oposição pede explicações.', '', { min: { corruption: 30, day: 300 } }, [
  ['Afastar os parentes e abrir contas.', 'Limpa a imagem; dói em casa.', { legitimacy: 1, corruption: -0.5 }, { opposition: -2 }],
  ['Negar tudo.', 'O escândalo cresce.', { legitimacy: -2 }, { opposition: 3 }],
  ['Culpar a imprensa.', 'Agrada a base, piora a imagem.', { civil: -0.5, legitimacy: -0.8 }, { opposition: 1 }],
], { cd: 800 });
q('mx_pow_bunker', 'Poder', 'Os serviços de segurança pedem uma "linha direta" com você', 'A chefia da inteligência quer acesso direto, sem passar pelos ministros, "para decidir rápido em crises".', '', { min: { intel: 30, day: 300 } }, [
  ['Conceder.', 'Mais controle sobre a máquina; menos transparência.', { intel: 2, civil: -0.8 }, { bureaucracy: -2, military: 2 }],
  ['Negar: a cadeia de comando fica.', 'Preserva as instituições.', {}, { bureaucracy: 2 }],
  ['Criar um conselho de segurança.', 'Organiza.', { intel: 1 }, {}],
], { cd: 900 });
q('mx_ec_mining_royalties', 'Economia', 'Royalties da mineração: para quem vão?', 'Estados produtores querem ficar com a maior parte dos royalties; os demais dizem que o recurso é nacional.', '', { min: { day: 300 } }, [
  ['Dar maior parte aos estados produtores.', 'Satisfaz o regional; rivalidade entre regiões.', { }, { regional: 4, rural: -1 }],
  ['Fundo nacional distribuído por população.', 'Equitativo; os produtores resistem.', { inequality: -0.3 }, { regional: -3, workers: 2 }],
  ['Dividir meio a meio.', 'Compromisso.', {}, { regional: 1 }],
], { cd: 900 });
q('mx_ec_oil_fund', 'Economia', 'O que fazer com a riqueza do petróleo?', 'Um aumento súbito do petróleo enche o caixa. Há quem queira gastar já, e quem prefira poupar para o futuro.', '', { min: { day: 300 } }, [
  ['Criar um fundo soberano.', 'Segurança de longo prazo.', { reserves: 1, treasury: 0.3 }, { workers: -1, business: 1 }],
  ['Investir em infraestrutura já.', 'Crescimento; risco de desperdício.', { treasury: -0.4, growth: 0.3 }, { workers: 2 }],
  ['Aumentar salários e subsídios.', 'Popularidade imediata.', { inflation: 0.4, treasury: -0.5 }, { workers: 4, business: -1 }],
], { cd: 900 });
q('mx_ec_free_zone', 'Economia', 'Zona franca de exportação', 'Investidores pedem isenções fiscais numa zona costeira. Sindicatos temem salários baixos e condições duras.', '', { min: { day: 250 } }, [
  ['Criar a zona.', 'Empregos e exportações; precariedade.', { growth: 0.2, unemployment: -0.5 }, { business: 3, workers: -2 }],
  ['Criar com regras trabalhistas rígidas.', 'Melhor equilíbrio; menos atrativa.', { growth: 0.1, unemployment: -0.3 }, { business: 1, workers: 1 }],
  ['Recusar.', 'Preserva o modelo atual.', {}, { business: -2, workers: 1 }],
], { cd: 800 });
q('mx_hlt_traditional', 'Saúde', 'Médicos tradicionais e o sistema de saúde', 'Comunidades rurais confiam em curandeiros e parteiras tradicionais. Médicos pedem proibição; antropólogos pedem integração.', '', { min: { day: 250 }, max: { health: 65 } }, [
  ['Integrar e treinar as parteiras e curandeiros.', 'Melhora o cuidado nas aldeias.', { health: 0.8, treasury: -0.2 }, { rural: 3 }],
  ['Proibir práticas sem diploma.', 'Padroniza; deixa vácuos de cuidado.', { health: -0.4, civil: -0.5 }, { rural: -3 }],
  ['Ignorar.', 'Sem mudanças.', {}, {}],
], { cd: 800 });
