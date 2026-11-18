// Questões e eventos por região do mundo (condição `wr`, ver js/sim/worldregions.js).
// Uso: node tools/gen-wr-content.mjs   (reescreve data/issues_worldregions.json e data/events_worldregions.json)
import { writeFileSync, readFileSync } from 'node:fs';
const out = f => new URL('../data/' + f, import.meta.url);

// o(texto, dica, {n: now, g: groups, l: long, r: rel})
const o = (text, hint, e = {}) => { const r = { text, hint }; if (e.n) r.now = e.n; if (e.g) r.groups = e.g; if (e.l) r.long = e.l; if (e.r) r.rel = e.r; return r; };
const L = (k, v, d = 0) => ({ k, v, d });
// Q(id, [regiões], categoria, título, descrição, contexto, [opções], extra)
const Q = (id, wr, cat, title, desc, context, options, extra = {}) => ({ id: 'wr_' + id, cat, title, desc, context, cond: { wr }, w: 1, options, ...extra });
// V(id, [regiões], categoria, título, manchete, tom, efeitos, extra) — evento aleatório sem escolha
const V = (id, wr, cat, title, headline, tone, fx = {}, extra = {}) => ({ id: 'wev_' + id, cat, title, headline, tone, w: 0.7, cd: 220, cond: { wr }, ...fx, ...extra });

const q = [
  // ---------- Ásia Central ----------
  Q('ca_water', ['central_asia'], 'Água', 'A guerra da água dos rios', 'A seca reduz os rios que irrigam o algodão. Os países de montante querem hidrelétricas; os de jusante exigem liberar a água.', 'Água é mais valiosa que petróleo na região.', [
    o('Negociar um tratado de uso conjunto.', 'Esfria a disputa; exige concessões.', { n: { treasury: -0.15, reputation: 2 }, r: { neighbors: 4 } }),
    o('Reter a água e construir a represa.', 'Energia barata; tensão com vizinhos.', { n: { treasury: -0.4 }, l: [L('s_energy', 3)], r: { neighbors: -8 }, g: { rural: -3, military: 2 } }),
    o('Modernizar a irrigação por gotejamento.', 'Caro, mas poupa água.', { n: { treasury: -0.5 }, l: [L('s_food', 2)], g: { rural: 3 } })]),
  Q('ca_pipelines', ['central_asia'], 'Energia', 'Dutos para a Rússia ou para a China?', 'Moscou e Pequim disputam o gás do país: cada uma oferece um duto, um empréstimo e condições políticas diferentes.', 'Quem controla os dutos controla o destino.', [
    o('Duto para a China.', 'Crédito generoso; dependência de Pequim.', { n: { treasury: 0.4 }, r: { china: 6, russia: -5 }, g: { business: 2 } }),
    o('Duto para a Rússia.', 'Segurança e tradição; menos dinheiro.', { n: { treasury: 0.2 }, r: { russia: 6, china: -3 }, g: { military: 2 } }),
    o('Leiloar para várias rotas.', 'Equilíbrio difícil.', { n: { treasury: 0.15, reputation: 1 } })]),
  Q('ca_language', ['central_asia'], 'Cultura', 'Alfabeto latino ou cirílico?', 'Intelectuais pedem trocar o cirílico soviético pelo latino; a minoria russa e a Rússia reagem. A língua nacional ganha estatuto.', 'Identidade e geopolítica no alfabeto.', [
    o('Adotar o alfabeto latino.', 'Modernização e distância de Moscou.', { n: { reputation: 1 }, r: { russia: -5, west: 3 }, g: { youth: 3 } }),
    o('Manter o cirílico e ampliar o idioma nacional.', 'Cautela.', { g: { rural: 1 } }),
    o('Oficializar dois alfabetos por dez anos.', 'Transição suave, custo burocrático.', { n: { treasury: -0.1 } })]),
  Q('ca_succession', ['central_asia'], 'Política', 'Sucessão no palácio', 'O líder idoso adoece e clãs rivais disputam o poder nos bastidores. A sucessão precisa ser decidida antes que o país se divida.', 'Regimes personalistas vivem crises de sucessão.', [
    o('Escolher um herdeiro e consolidar.', 'Estabilidade imediata.', { n: { stability: 2, political: -1 }, g: { military: 2, opposition: -2 } }),
    o('Abrir eleições competitivas.', 'Risco e legitimidade.', { n: { political: 3, legitimacy: 2, stability: -2 }, g: { opposition: 3, military: -2 } }),
    o('Governo colegiado de clãs.', 'Evita ruptura; fragilidade.', { n: { corruption: 1.5 } })]),
  // ---------- Sudeste Asiático ----------
  Q('sea_scs', ['southeast_asia'], 'Defesa', 'Barcos pesqueiros no mar disputado', 'Guardas costeiras estrangeiras expulsam pescadores do seu país de águas que o governo reivindica. A imprensa clama por resposta.', 'O mar é rico em peixe e petróleo.', [
    o('Escoltar pescadores com a marinha.', 'Mostra firmeza; risco de choque.', { n: { projection: 2, reputation: -1 }, r: { rival: -6 }, g: { military: 3 } }),
    o('Levar o caso a um tribunal internacional.', 'Lento e legítimo.', { n: { reputation: 3 }, r: { rival: -2, west: 2 } }),
    o('Negociar uma pesca conjunta.', 'Calma tensa.', { n: { treasury: -0.05 }, r: { rival: 3 }, g: { rural: -1 } })]),
  Q('sea_typhoon', ['southeast_asia', 'east_asia'], 'Desastre', 'Tufão atinge o litoral', 'Um tufão devasta portos, arrozais e vilas de pescadores. A reconstrução pede dinheiro e coordenação.', 'Preparação decide o número de mortos.', [
    o('Plano de reconstrução e alerta antecipado.', 'Salva vidas no futuro.', { n: { treasury: -0.45, legitimacy: 3 }, l: [L('infra', 1)] }),
    o('Ajuda emergencial e pedir apoio externo.', 'Rápido e barato.', { n: { treasury: -0.2, reputation: 1 }, r: { all: 1 } }),
    o('Deixar as províncias se virarem.', 'Poupa o caixa.', { n: { legitimacy: -3 }, g: { rural: -4, regional: -3 } })]),
  Q('sea_palm', ['southeast_asia'], 'Meio ambiente', 'A fumaça do óleo de palma', 'Queimadas de plantações cobrem cidades vizinhas de poluição. Países próximos protestam e consumidores exigem selo sustentável.', 'Óleo de palma é uma das maiores exportações.', [
    o('Proibir queimadas e certificar a produção.', 'Mercados abertos; produtores reclamam.', { n: { pollution: -2, reputation: 3 }, g: { business: -3, youth: 3 } }),
    o('Multas simbólicas.', 'Pouco efeito.', { n: { pollution: 1 }, r: { neighbors: -3 } }),
    o('Acordo regional de monitoramento por satélite.', 'Cooperação eficiente.', { n: { treasury: -0.15, pollution: -1 }, r: { neighbors: 4 } })]),
  Q('sea_ethnic', ['southeast_asia'], 'Minorias', 'Refugiados de uma minoria perseguida', 'Milhares de pessoas atravessam a fronteira em barcos precários fugindo de violência étnica no vizinho. Ninguém quer assumir a conta.', 'A região tem histórico de crises humanitárias.', [
    o('Abrir campos temporários.', 'Humanitário; custa caro.', { n: { treasury: -0.25, reputation: 3 }, g: { rural: -2 } }),
    o('Empurrar os barcos de volta.', 'Evita custo; condenação.', { n: { reputation: -4 }, g: { military: 2 } }),
    o('Pedir ajuda da ONU e dividir a conta.', 'Compartilha a carga.', { n: { treasury: -0.1, reputation: 1 }, r: { all: 1 } })]),
  Q('sea_factory', ['southeast_asia'], 'Economia', 'Fábricas deixam a China e chegam à região', 'Multinacionais buscam alternativas à China. Oferecem milhares de empregos, mas exigem isenções e mão de obra barata.', 'Janela de oportunidade industrial.', [
    o('Zonas francas com infraestrutura.', 'Empregos e dependência.', { n: { treasury: -0.4, unemployment: -0.4 }, l: [L('industry', 2), L('exportAccess', 0.02)], g: { workers: 2, business: 3 } }),
    o('Exigir transferência de tecnologia.', 'Menos investidores, mais futuro.', { l: [L('tech', 1.5)], g: { business: -1, youth: 2 } }),
    o('Manter a abertura mínima.', 'Sem mudanças.', {})]),
  // ---------- Sul da Ásia ----------
  Q('sas_monsoon', ['south_asia'], 'Clima', 'A monção falha', 'A chuva de verão está 30% abaixo da média. Os preços do arroz sobem e os agricultores endividados temem perder tudo.', 'A monção decide o humor de bilhões.', [
    o('Subsídio emergencial e seguro agrícola.', 'Protege o campo.', { n: { treasury: -0.4, hunger: -0.5 }, g: { rural: 4 } }),
    o('Importar grãos e conter preços.', 'Evita a fome urbana.', { n: { treasury: -0.3, inflation: -0.3 }, g: { workers: 2, rural: -2 } }),
    o('Esperar a próxima safra.', 'Poupa recursos.', { n: { hunger: 1.5 }, g: { rural: -5 } })]),
  Q('sas_rivers', ['south_asia'], 'Água', 'O tratado dos rios sob ameaça', 'O vizinho anuncia uma represa no rio que alimenta suas planícies. Diplomatas falam em “ato hostil”.', 'Rios dividem e unem o subcontinente.', [
    o('Exigir arbitragem internacional.', 'Legítimo, mas lento.', { n: { reputation: 2 }, r: { rival: -3 } }),
    o('Ameaçar suspender o tratado.', 'Pressão máxima; risco de crise.', { n: { stability: -1 }, r: { rival: -10 }, g: { military: 3 } }),
    o('Negociar um fundo conjunto de água.', 'Cooperação cara.', { n: { treasury: -0.2 }, r: { rival: 5 } })]),
  Q('sas_riots', ['south_asia'], 'Sociedade', 'Tumultos entre comunidades religiosas', 'Boatos nas redes incendeiam um bairro: lojas queimadas, mortos e toque de recolher. As lideranças pedem calma.', 'A convivência é frágil e tradicional.', [
    o('Mobilizar a polícia e prender provocadores.', 'Restaura a ordem.', { n: { control: 2, civil: -1, stability: 1 }, g: { military: 2, opposition: -2 } }),
    o('Mediação com líderes religiosos.', 'Mais lenta e duradoura.', { n: { stability: 1, reputation: 1 } }),
    o('Cortar a internet na região.', 'Frio e eficaz; critica.', { n: { control: 1, civil: -2, reputation: -2 }, g: { youth: -3 } })]),
  Q('sas_outsource', ['south_asia'], 'Economia', 'O boom da terceirização de serviços', 'Empresas de tecnologia contratam engenheiros e atendentes em massa. As cidades enchem de condomínios e escritórios.', 'Vantagem demográfica e inglês fluente.', [
    o('Investir em ensino técnico e infraestrutura digital.', 'Cresce o setor.', { n: { treasury: -0.35 }, l: [L('tech', 2), L('growth', 0.15)], g: { youth: 3, business: 2 } }),
    o('Deixar o mercado agir.', 'Barato; desigual.', { l: [L('growth', 0.1)], g: { business: 2, rural: -2 } }),
    o('Taxar lucros e financiar o interior.', 'Redistribui.', { n: { inequality: -0.5 }, g: { business: -3, rural: 3 } })]),
  // ---------- Extremo Oriente ----------
  Q('ea_chips', ['east_asia'], 'Tecnologia', 'A guerra dos semicondutores', 'As potências restringem exportações de chips e equipamentos. A indústria local pede subsídios e proteção.', 'Cadeias críticas viram armas políticas.', [
    o('Subsídios maciços à indústria de chips.', 'Autonomia custosa.', { n: { treasury: -0.7 }, l: [L('tech', 3), L('industry', 1.5)], g: { business: 3 } }),
    o('Alinhar-se a uma das potências.', 'Acesso e dependência.', { n: { treasury: 0.1 }, r: { west: 3, china: -4 } }),
    o('Manter neutralidade técnica.', 'Risco de ficar sem insumos.', { l: [L('tech', -1, 365)] })]),
  Q('ea_aging', ['east_asia'], 'Demografia', 'A sociedade envelhece e as maternidades fecham', 'A natalidade cai ao menor nível já visto. Escolas se esvaziam e as pensões pesam no orçamento.', 'O desafio demográfico do século.', [
    o('Bônus por filho e creches gratuitas.', 'Estimula natalidade.', { n: { treasury: -0.5 }, l: [L('birth', 1.5)], g: { youth: 3, workers: 2 } }),
    o('Abrir à imigração qualificada.', 'Mão de obra; resistência cultural.', { l: [L('laborSupply', 0.4)], g: { rural: -3, business: 3 } }),
    o('Automação e robótica.', 'Alta tecnologia.', { n: { treasury: -0.3 }, l: [L('productivity', 1), L('tech', 1)] })]),
  Q('ea_islands', ['east_asia'], 'Defesa', 'Ilhas disputadas com o vizinho', 'Um grupo de ilhotas desabitadas volta ao noticiário: pescadores, aviões e navios se encontram perigosamente.', 'Soberania simbólica e recursos submarinos.', [
    o('Reforçar a presença naval.', 'Dissuasão; risco de incidente.', { n: { treasury: -0.3, projection: 2 }, r: { rival: -6 }, g: { military: 3 } }),
    o('Propor exploração conjunta.', 'Cria laços e críticas internas.', { n: { treasury: -0.05 }, r: { rival: 4 }, g: { military: -2 } }),
    o('Apelar à arbitragem.', 'Lento.', { n: { reputation: 2 } })]),
  Q('ea_culture', ['east_asia'], 'Cultura', 'A onda pop conquista o mundo', 'Grupos musicais, séries e jogos do país explodem em popularidade global. O governo pode transformar a moda em diplomacia.', 'Soft power vale ouro.', [
    o('Apoiar a indústria cultural com fundos e embaixadas.', 'Prestígio crescente.', { n: { treasury: -0.2, reputation: 3 }, l: [L('influence', 1)], g: { youth: 3 } }),
    o('Regular conteúdos e idade.', 'Controle e menos liberdade.', { n: { civil: -1 }, g: { youth: -3, rural: 2 } }),
    o('Deixar o mercado agir.', 'Sem custos.', { n: { reputation: 1 } })]),
  // ---------- Oriente Médio / Golfo / Levante ----------
  Q('me_oil', ['middle_east'], 'Economia', 'O petróleo desaba de preço', 'O barril perdeu metade do valor em meses. O orçamento, construído sobre petróleo caro, entra em colapso.', 'Rentismo sob risco.', [
    o('Cortar subsídios e diversificar.', 'Dói, mas protege o futuro.', { n: { treasury: 0.3, protest: 3 }, l: [L('industry', 1.5)], g: { workers: -4, business: 3 } }),
    o('Gastar as reservas para manter a calma.', 'Poupança evapora.', { n: { treasury: -0.4, stability: 2 }, g: { workers: 3 } }),
    o('Pressionar a OPEP por cortes.', 'Diplomacia dura.', { n: { treasury: 0.1 }, r: { rival: -2 } })]),
  Q('me_pilgrim', ['middle_east'], 'Religião', 'Peregrinação massiva e segurança', 'Milhões de peregrinos chegam ao país santo. Atentados e epidemias são riscos; os fiéis exigem hospitalidade.', 'Orgulho religioso e exigência logística.', [
    o('Reforçar segurança e hospitais de campanha.', 'Evita tragédias.', { n: { treasury: -0.3, legitimacy: 2 }, g: { rural: 2 } }),
    o('Limitar o número de peregrinos.', 'Mais controle; críticas.', { n: { reputation: -2 }, g: { rural: -3 } }),
    o('Parceria com o setor privado.', 'Eficiente e polêmica.', { n: { treasury: 0.1 }, g: { business: 3 } })]),
  Q('me_refugees', ['middle_east'], 'Migração', 'Refugiados de uma guerra vizinha', 'Milhares de famílias chegam à fronteira com crianças e idosos. As cidades de fronteira estão sobrecarregadas.', 'O país já abriga milhões de deslocados.', [
    o('Abrir campos e integrar no mercado de trabalho.', 'Humanitário e caro.', { n: { treasury: -0.4, reputation: 3 }, l: [L('laborSupply', 0.3)], g: { workers: -3 } }),
    o('Fechar a fronteira.', 'Evita custos; imagem manchada.', { n: { reputation: -4, civil: -1 }, g: { military: 2 } }),
    o('Zona de proteção no lado vizinho.', 'Ousado e arriscado.', { n: { treasury: -0.3 }, r: { neighbors: -4 } })]),
  Q('me_desal', ['middle_east', 'gulf'], 'Água', 'Dessalinização: a nova torneira', 'Com aquíferos esgotados, o governo estuda usinas de dessalinização — energéticas e caras, mas decisivas.', 'Água é política de segurança.', [
    o('Construir usinas em escala nacional.', 'Água garantida.', { n: { treasury: -0.7 }, l: [L('s_energy', -1), L('qol', 1)], g: { rural: 2 } }),
    o('Reaproveitar águas servidas e reduzir desperdício.', 'Mais barato.', { n: { treasury: -0.3 }, l: [L('s_food', 1)] }),
    o('Importar água por navio.', 'Emergência cara.', { n: { treasury: -0.4 } })]),
  Q('me_youth', ['middle_east'], 'Política', 'Jovens desempregados nas praças', 'Uma geração com diploma e sem emprego ocupa as praças pedindo salários, liberdade e oportunidades. As câmeras do mundo estão ligadas.', 'A pressão demográfica explode.', [
    o('Programa de empregos e reformas políticas.', 'Alivia a tensão.', { n: { treasury: -0.4, political: 2, unemployment: -0.4 }, g: { youth: 4, opposition: 2 } }),
    o('Reprimir e prender organizadores.', 'Silêncio por ora.', { n: { civil: -2, reputation: -3, stability: 1 }, g: { youth: -5, military: 2 }, l: [L('revoRisk', 2, 240)] }),
    o('Distribuir subsídios temporários.', 'Compra paz.', { n: { treasury: -0.3 }, g: { youth: 1, workers: 1 } })]),
  Q('gulf_fund', ['gulf'], 'Economia', 'O fundo soberano: investir fora ou dentro?', 'Um fundo bilionário decide entre comprar clubes, empresas e imóveis no exterior ou erguer indústrias e universidades locais.', 'O petróleo não dura para sempre.', [
    o('Investir fora por retorno e influência.', 'Renda estável.', { n: { treasury: 0.4, reputation: 1 }, r: { west: 2 } }),
    o('Investir na indústria local.', 'Diversificação.', { n: { treasury: -0.3 }, l: [L('industry', 2), L('tech', 1)] }),
    o('Dividir meio a meio.', 'Equilíbrio.', { n: { treasury: 0.1 } })]),
  Q('gulf_labor', ['gulf'], 'Trabalho', 'Reforma do trabalho de migrantes', 'Milhões de trabalhadores estrangeiros erguem arranha-céus em condições duras. Sindicatos globais ameaçam boicote.', 'A força de trabalho é migrante.', [
    o('Reforma: salário mínimo e fim da retenção de passaportes.', 'Melhora imagem; encarece.', { n: { treasury: -0.2, reputation: 3 }, g: { business: -3, workers: 2 } }),
    o('Cosméticos e campanha de imagem.', 'Barato.', { n: { reputation: 1 } }),
    o('Ignorar as críticas.', 'Sem custo; isolamento.', { n: { reputation: -3 } })]),
  Q('gulf_strait', ['gulf'], 'Segurança', 'Petroleiros assediados no estreito', 'Lanchas armadas cercam petroleiros no estreito estratégico. O seguro marítimo dispara e o mundo pede calma.', 'Ponto crítico do comércio mundial.', [
    o('Escolta naval e aliança de segurança marítima.', 'Protege o fluxo.', { n: { treasury: -0.3, projection: 2 }, r: { rival: -4 }, g: { military: 3 } }),
    o('Diplomacia direta com o rival.', 'Reduz risco.', { n: { reputation: 2 }, r: { rival: 4 } }),
    o('Pagar prêmios de seguro e esperar.', 'Calma cara.', { n: { treasury: -0.2 } })]),
  Q('lev_water', ['levant'], 'Água', 'O Jordão e a divisão da água', 'A seca reduz o rio que alimenta várias nações. Os agricultores exigem água; as cidades também.', 'Recursos escassos num mapa tenso.', [
    o('Pacto de partilha com vizinhos.', 'Reduz risco.', { n: { treasury: -0.1, reputation: 2 }, r: { neighbors: 4 } }),
    o('Perfurar poços profundos.', 'Alívio com custo ambiental.', { n: { treasury: -0.3, pollution: 1 }, g: { rural: 3 } }),
    o('Racionar.', 'Dói a todos.', { n: { stability: -1 }, g: { rural: -3, workers: -2 } })]),
  Q('lev_holy', ['levant'], 'Religião', 'Tensão em um lugar sagrado', 'Uma visita polêmica a um santuário disputado desencadeia protestos de várias religiões. A mídia internacional acompanha.', 'Pequeno espaço, enorme simbolismo.', [
    o('Restringir o acesso por um tempo.', 'Evita violência.', { n: { stability: 1, civil: -0.5 }, g: { rural: -1 } }),
    o('Mediação com líderes religiosos.', 'Lento, mas duradouro.', { n: { reputation: 2 } }),
    o('Deixar a polícia agir.', 'Risco de escalada.', { n: { stability: -2 }, g: { military: 2 } })]),
  Q('lev_refugees', ['levant'], 'Migração', 'Campos de refugiados em chamas', 'Um incêndio e a falta de comida levam revolta aos campos de refugiados. O país anfitrião pede ajuda global.', 'Cuidado humanitário no limite.', [
    o('Financiar reconstrução e ensino.', 'Imagem e custo.', { n: { treasury: -0.3, reputation: 3 }, g: { youth: 2 } }),
    o('Pedir à ONU que assuma o controle.', 'Divide o fardo.', { n: { reputation: 1 } }),
    o('Reduzir a ajuda.', 'Economia; risco humanitário.', { n: { reputation: -3 } })]),
  // ---------- Cáucaso ----------
  Q('cau_pipeline', ['caucasus'], 'Energia', 'O oleoduto cruza o território', 'Um novo oleoduto conectará o mar Cáspio à Europa passando por aqui. Moscou e Teerã protestam; o Ocidente ofereceu garantias.', 'Trânsito é poder.', [
    o('Aprovar e cobrar taxas de trânsito.', 'Receita e atrito.', { n: { treasury: 0.4 }, r: { west: 4, russia: -6 } }),
    o('Exigir participação acionária.', 'Mais lucro, negociação dura.', { n: { treasury: 0.2 }, g: { bureaucracy: 2 } }),
    o('Recusar para evitar conflito.', 'Segurança; dinheiro perdido.', { r: { russia: 3 } })]),
  Q('cau_frozen', ['caucasus'], 'Segurança', 'Escaramuças no conflito congelado', 'Um incidente na linha de contato fere soldados. Uma operação “de resposta” é aconselhada por generais.', 'Tensões antigas despertam.', [
    o('Retaliação limitada.', 'Mostra força; risco.', { n: { readiness: 2, warWeariness: 1 }, r: { rival: -8 }, g: { military: 3 } }),
    o('Mediação de uma potência.', 'Esfria a situação.', { n: { reputation: 2 }, r: { rival: 2 } }),
    o('Conter as tropas e investigar.', 'Disciplina e debate interno.', { n: { stability: 1 }, g: { military: -2 } })]),
  Q('cau_wine', ['caucasus'], 'Comércio', 'Embargo ao vinho e às águas minerais', 'O grande vizinho proíbe a importação de vinhos e águas do país sob alegação de “qualidade”. A economia agrícola sente.', 'Uma arma comercial clássica.', [
    o('Procurar mercados na Europa e na Ásia.', 'Diversifica.', { n: { treasury: -0.15 }, l: [L('exportAccess', 0.02)], g: { rural: 1 } }),
    o('Ceder em questão política em troca de fim do embargo.', 'Alívio comercial.', { n: { legitimacy: -3 }, r: { russia: 5 } }),
    o('Subsidiar os produtores.', 'Paliativo.', { n: { treasury: -0.25 }, g: { rural: 3 } })]),
  // ---------- Balcãs ----------
  Q('bal_war_crimes', ['balkans'], 'Memória', 'Um general acusado de crimes de guerra', 'O tribunal internacional exige a entrega de um general nacionalista, tratado como herói por parte da população.', 'Justiça e feridas abertas.', [
    o('Entregar e cooperar.', 'Abre portas na Europa; revolta nacionalista.', { n: { reputation: 3, stability: -2 }, r: { west: 4 }, g: { military: -4, opposition: 2 } }),
    o('Recusar: justiça nacional.', 'Orgulho e sanções.', { n: { reputation: -3 }, r: { west: -4 }, g: { military: 3 } }),
    o('Julgá-lo no país com observadores.', 'Meio-termo delicado.', { n: { reputation: 1 } })]),
  Q('bal_eu', ['balkans'], 'Diplomacia', 'Condições para aderir à UE', 'Bruxelas exige reformas na justiça, na imprensa e contra a corrupção. Opiniões se dividem sobre a pressa.', 'O processo é longo e exigente.', [
    o('Cumprir o pacote de reformas.', 'Fundos europeus no futuro.', { n: { reputation: 2, corruption: -1.5, efficiency: 1 }, r: { west: 4 }, g: { bureaucracy: -3, youth: 3 } }),
    o('Adiar e priorizar a soberania.', 'Autonomia e isolamento.', { n: { reputation: -1 }, r: { west: -2, russia: 2 } }),
    o('Reformas só nas áreas fáceis.', 'Parcial.', { n: { reputation: 0.5 } })]),
  Q('bal_quota', ['balkans'], 'Política', 'Cotas étnicas no parlamento', 'A constituição reserva cadeiras por grupo étnico. Minorias exigem mais; maiorias pedem reforma.', 'O arranjo de paz agora emperra o Estado.', [
    o('Manter as cotas.', 'Estabilidade étnica; ineficiência.', { n: { stability: 1, efficiency: -1 } }),
    o('Reformar para cidadania igual.', 'Moderno e arriscado.', { n: { stability: -2, civil: 2 }, g: { youth: 3 } }),
    o('Dar mais poder às regiões.', 'Descentraliza.', { n: { control: -1 }, g: { regional: 4 } })]),
  Q('bal_tourism', ['balkans'], 'Economia', 'Turismo no Adriático e fuga de jovens', 'O litoral enche de visitantes; as cidades do interior se esvaziam de jovens que emigram.', 'Dois países numa só costa.', [
    o('Investir em estradas e universidades no interior.', 'Equilibra.', { n: { treasury: -0.4 }, l: [L('emigration', -0.3, 365)], g: { regional: 3, youth: 3 } }),
    o('Apostar tudo no litoral.', 'Receita imediata.', { n: { treasury: 0.2 }, g: { business: 3, regional: -3 } }),
    o('Visto digital para nômades.', 'Moderno e barato.', { n: { treasury: 0.1 }, g: { youth: 1 } })]),
  // ---------- Mediterrâneo ----------
  Q('med_boats', ['mediterranean'], 'Migração', 'Barcos de migrantes à deriva', 'Embarcações superlotadas pedem socorro em águas próximas. A opinião pública se divide entre resgate e controle.', 'O mar é fronteira e cemitério.', [
    o('Resgate e acolhida temporária.', 'Humanitário.', { n: { treasury: -0.25, reputation: 3 }, g: { rural: -2, youth: 2 } }),
    o('Patrulha dissuasiva e acordos com costa de origem.', 'Reduz chegadas.', { n: { treasury: -0.2, reputation: -2 }, r: { neighbors: -3 }, g: { military: 2 } }),
    o('Pedir solidariedade europeia.', 'Divide a carga.', { n: { reputation: 1 }, r: { west: 2 } })]),
  Q('med_fire', ['mediterranean'], 'Clima', 'Onda de calor e incêndios florestais', 'Temperaturas de 45 °C acendem florestas e vilas. Aviões de combate ao fogo são poucos.', 'O Mediterrâneo está esquentando.', [
    o('Frota de bombeiros aéreos e manejo florestal.', 'Prevenção custosa.', { n: { treasury: -0.4, pollution: -1 }, g: { rural: 3 } }),
    o('Pedir apoio internacional.', 'Rápido e barato.', { n: { treasury: -0.1 }, r: { all: 1 } }),
    o('Aceitar as perdas.', 'Poupa e perde votos.', { n: { legitimacy: -3 }, g: { rural: -4 } })]),
  Q('med_overtourism', ['mediterranean'], 'Turismo', 'Turismo em massa e preços dos aluguéis', 'Cruzeiros e plataformas de aluguel expulsam moradores dos centros históricos. Protestos cobrem as ruas.', 'Dinheiro versus qualidade de vida.', [
    o('Limitar cruzeiros e taxar turistas.', 'Protege a cidade.', { n: { treasury: 0.1 }, g: { business: -3, workers: 2 } }),
    o('Zonas de preservação e novos destinos.', 'Distribui o fluxo.', { n: { treasury: -0.15 }, g: { regional: 2 } }),
    o('Manter o ritmo.', 'Receita máxima.', { n: { treasury: 0.25 }, g: { workers: -3, youth: -2 } })]),
  Q('med_sea', ['mediterranean'], 'Meio ambiente', 'O mar Mediterrâneo sufocado de plástico', 'Cientistas alertam para microplásticos e queda dos estoques de pesca. Pescadores exigem alternativas.', 'Um mar fechado, vulnerável.', [
    o('Pacto regional contra o plástico e cotas de pesca.', 'Lento e necessário.', { n: { treasury: -0.15, pollution: -1.5, reputation: 2 }, g: { rural: -2, youth: 3 } }),
    o('Subsidiar a pesca sustentável.', 'Preserva empregos.', { n: { treasury: -0.25, pollution: -0.5 }, g: { rural: 2 } }),
    o('Adiar decisões.', 'Sem custo; problema cresce.', { n: { pollution: 1 } })]),
  // ---------- Nórdicos / Bálticos / Ilhas Britânicas ----------
  Q('nor_welfare', ['nordic'], 'Sociedade', 'O modelo de bem-estar e a imigração', 'Reformas de mercado e novos migrantes testam o consenso nórdico. Partidos novos questionam benefícios universais.', 'O modelo depende de confiança mútua.', [
    o('Manter benefícios com regras de trabalho.', 'Sustentável.', { n: { treasury: 0.1 }, g: { workers: 1, business: 1 } }),
    o('Expandir benefícios e integração.', 'Mais igualdade e custo.', { n: { treasury: -0.4, inequality: -0.8 }, g: { workers: 3, business: -2 } }),
    o('Cortar benefícios para novos migrantes.', 'Divisivo.', { n: { treasury: 0.2, civil: -1 }, g: { rural: 2, youth: -3 } })]),
  Q('nor_arctic', ['nordic'], 'Defesa', 'A fronteira ártica e a aliança militar', 'Exercícios e jatos estrangeiros se aproximam do Ártico. Generais pedem mais bases e radares.', 'O Norte voltou ao mapa estratégico.', [
    o('Bases e radares no extremo norte.', 'Dissuasão.', { n: { treasury: -0.5, defense: 3 }, r: { russia: -6 }, g: { military: 4 } }),
    o('Reforço via aliança multinacional.', 'Custo compartilhado.', { n: { treasury: -0.2, defense: 2 }, r: { west: 3 } }),
    o('Diplomacia e cooperação ártica.', 'Esfria.', { n: { reputation: 2 }, r: { russia: 2 } })]),
  Q('nor_wind', ['nordic'], 'Energia', 'A grande onda eólica no mar do Norte', 'Consórcios propõem parques eólicos gigantes e cabos submarinos para exportar eletricidade.', 'O Norte pode virar a bateria da Europa.', [
    o('Investir com estatal e privados.', 'Lucro e energia limpa.', { n: { treasury: -0.5 }, l: [L('s_energy', 3), L('pollution', -1)], g: { business: 2, youth: 3 } }),
    o('Deixar o setor privado.', 'Menos custo público.', { l: [L('s_energy', 2)], g: { business: 3 } }),
    o('Adiar por impacto na pesca.', 'Preserva tradições.', { g: { rural: 2 } })]),
  Q('bal_minority', ['baltic'], 'Minorias', 'Minoria russa e a língua oficial', 'Uma lei exige exames de idioma para cidadania. A minoria russa protesta e Moscou fala em “discriminação”.', 'Identidade e segurança.', [
    o('Manter a lei e oferecer cursos gratuitos.', 'Integração firme.', { n: { treasury: -0.1, reputation: 1 }, r: { russia: -5 }, g: { rural: 2 } }),
    o('Abrandar os requisitos.', 'Acalma tensões.', { n: { stability: 1 }, r: { russia: 2 }, g: { rural: -2 } }),
    o('Dupla cidadania limitada.', 'Controverso.', { n: { reputation: -1 }, r: { russia: 3 } })]),
  Q('bal_grid', ['baltic'], 'Energia', 'Desconectar-se da rede elétrica russa', 'O país ainda depende da rede elétrica do vizinho oriental. Uma desconexão custa caro e arrisca apagões.', 'Soberania energética.', [
    o('Sincronizar com a rede europeia.', 'Independência.', { n: { treasury: -0.4 }, l: [L('s_energy', 2)], r: { russia: -5, west: 3 } }),
    o('Adiar a transição.', 'Economiza; dependência.', { r: { russia: 2 } }),
    o('Construir interconexão e reservas.', 'Meio-termo.', { n: { treasury: -0.25 }, l: [L('s_energy', 1)] })]),
  Q('bal_cyber', ['baltic'], 'Segurança', 'Ataque cibernético a bancos e ministérios', 'Hackers paralisam sites do governo e caixas eletrônicos por dois dias. O vizinho nega envolvimento.', 'O front digital é permanente.', [
    o('Criar um comando de ciberdefesa.', 'Segurança e custo.', { n: { treasury: -0.25, intel: 3 }, g: { youth: 1 } }),
    o('Protestar na ONU e na OTAN.', 'Visibilidade; pouco efeito.', { n: { reputation: 1 }, r: { russia: -4 } }),
    o('Ignorar publicamente e reforçar em silêncio.', 'Discreto.', { n: { intel: 1 } })]),
  Q('bi_border', ['british_isles'], 'Política', 'A fronteira aberta no meio da ilha', 'Um novo acordo comercial ameaça a livre circulação em uma fronteira política sensível. Protestos preocupam os políticos.', 'Paz frágil, símbolos fortes.', [
    o('Arranjo especial de comércio e circulação.', 'Mantém a paz.', { n: { treasury: -0.1, stability: 1 } }),
    o('Fronteira rígida e controle.', 'Soberania; risco de violência.', { n: { stability: -2, control: 2 }, g: { regional: -3, military: 1 } }),
    o('Referendo regional.', 'Legítimo e arriscado.', { n: { legitimacy: 1 }, g: { regional: 2 } })]),
  Q('bi_fishing', ['british_isles'], 'Comércio', 'Direitos de pesca em águas disputadas', 'Barcos estrangeiros pescam em águas costeiras. Pescadores locais exigem proteção e cotas.', 'Símbolo nacional e emprego.', [
    o('Patrulha naval e licenças restritas.', 'Protege a frota local.', { n: { treasury: -0.2 }, r: { neighbors: -5 }, g: { rural: 3 } }),
    o('Acordo de cotas compartilhadas.', 'Paz e menos peixe.', { r: { neighbors: 3 }, g: { rural: -2 } }),
    o('Compensar pescadores e liberar a pesca.', 'Mercado aberto.', { n: { treasury: -0.2 }, g: { rural: -1, business: 2 } })]),
  Q('bi_housing', ['british_isles'], 'Economia', 'A crise da moradia e o preço dos aluguéis', 'O preço dos imóveis nas cidades é impagável para jovens. Políticos propõem controle de aluguéis, construção em massa ou ambos.', 'Pressão sobre as classes médias.', [
    o('Programa nacional de habitação popular.', 'Resolve a longo prazo.', { n: { treasury: -0.5 }, l: [L('housing', 2)], g: { youth: 4, workers: 3, business: -2 } }),
    o('Controle de aluguéis.', 'Alívio imediato; reduz oferta.', { n: { inflation: -0.1 }, g: { youth: 3, business: -4 } }),
    o('Liberar a construção em áreas protegidas.', 'Aumenta oferta.', { n: { pollution: 1 }, g: { business: 3, rural: -3 } })]),
  // ---------- Europa Ocidental / Central / Oriental / Ibéria ----------
  Q('weu_carbon', ['western_europe'], 'Meio ambiente', 'O imposto de carbono e os coletes colorados', 'Uma nova taxa sobre combustíveis provoca protestos de motoristas rurais em bloqueios de rodovias.', 'Transição justa ou explosão social?', [
    o('Manter com devolução social.', 'Mantém a meta.', { n: { treasury: 0.1, pollution: -1.5 }, g: { rural: -2, youth: 2 } }),
    o('Suspender e adiar.', 'Acalma o campo.', { n: { pollution: 1 }, g: { rural: 3, youth: -2 } }),
    o('Subsídio ao transporte público.', 'Alternativa.', { n: { treasury: -0.3, pollution: -1 }, g: { workers: 2 } })]),
  Q('weu_strike', ['western_europe'], 'Trabalho', 'Greve geral no transporte', 'Ferroviários e aeroviários param o país contra uma reforma. Turistas e fábricas ficam presos.', 'Tradição de sindicatos fortes.', [
    o('Negociar e adiar a reforma.', 'Acalma.', { n: { stability: 1 }, g: { workers: 3, business: -2 } }),
    o('Manter a reforma e decretar serviços mínimos.', 'Firmeza.', { n: { protest: 2 }, g: { workers: -4, business: 3 } }),
    o('Mediar uma reforma parcial.', 'Meio-termo.', { n: { treasury: -0.1 }, g: { workers: 1 } })]),
  Q('weu_terror', ['western_europe'], 'Segurança', 'Atentado em uma capital europeia', 'Um ataque em uma estação deixa vítimas e pânico. O governo é cobrado por mais poder de vigilância.', 'Liberdade versus segurança.', [
    o('Leis antiterror e vigilância reforçada.', 'Protege; fere a privacidade.', { n: { civil: -2, intel: 3, control: 2 }, g: { military: 2, youth: -3 } }),
    o('Reforçar policiamento de proximidade e inteligência.', 'Equilibrado.', { n: { treasury: -0.25, intel: 2 } }),
    o('Manter a rotina e a calma cívica.', 'Resistência simbólica.', { n: { legitimacy: 1 } })]),
  Q('ceu_funds', ['central_europe'], 'Política', 'Fundos da UE e o estado de direito', 'Bruxelas ameaça suspender bilhões por mudanças na Justiça e na imprensa. O governo diz defender a soberania.', 'Dinheiro europeu em jogo.', [
    o('Reverter as mudanças.', 'Fundos preservados.', { n: { treasury: 0.3, political: 1, reputation: 2 }, g: { opposition: 2, bureaucracy: -2 } }),
    o('Manter e buscar outras fontes.', 'Soberania cara.', { n: { treasury: -0.3, reputation: -2 }, r: { west: -4 } }),
    o('Negociar uma versão suavizada.', 'Compromisso.', { n: { treasury: 0.1 } })]),
  Q('ceu_workers', ['central_europe'], 'Migração', 'Trabalhadores e refugiados de um país vizinho', 'Milhares de refugiados e trabalhadores chegam à região. Empresas aplaudem, comunidades locais pedem moradia.', 'Acolher exige estrutura.', [
    o('Integrar com acesso a trabalho e escola.', 'Ganha mão de obra.', { n: { treasury: -0.3, reputation: 3 }, l: [L('laborSupply', 0.4)], g: { business: 3, rural: -2 } }),
    o('Limitar e priorizar nativos.', 'Agrada parte do eleitorado.', { n: { reputation: -2 }, g: { rural: 2, business: -2 } }),
    o('Pedir fundos europeus para a acolhida.', 'Divide custos.', { n: { treasury: 0.1 }, r: { west: 1 } })]),
  Q('ceu_cars', ['central_europe'], 'Indústria', 'A transição para o carro elétrico', 'As fábricas da região fazem motores a combustão. Montadoras anunciam migração para o elétrico e cortes de empregos.', 'Milhares de empregos em risco.', [
    o('Subsídios e requalificação de trabalhadores.', 'Suaviza.', { n: { treasury: -0.45 }, l: [L('industry', 1), L('tech', 1)], g: { workers: 3 } }),
    o('Atrair fábricas de baterias.', 'Oportunidade.', { n: { treasury: -0.3 }, l: [L('industry', 1.5)], g: { business: 3 } }),
    o('Defender o motor a combustão.', 'Curto prazo.', { g: { workers: 2, youth: -3 }, l: [L('tech', -0.5, 365)] })]),
  Q('eeu_gas', ['eastern_europe'], 'Energia', 'O gás para o oeste', 'Um duto estratégico atravessa o país. O fornecedor ameaça cortar o gás se as tarifas de trânsito forem mantidas.', 'Energia e política.', [
    o('Manter as tarifas.', 'Receita e confronto.', { n: { treasury: 0.3 }, r: { russia: -6 } }),
    o('Reduzir tarifas em troca de preço.', 'Alívio de custos.', { n: { treasury: -0.1 }, r: { russia: 3 } }),
    o('Diversificar com GNL e renováveis.', 'Cara e estratégico.', { n: { treasury: -0.5 }, l: [L('s_energy', 2)] })]),
  Q('eeu_oligarch', ['eastern_europe'], 'Economia', 'Oligarcas e privatizações obscuras', 'Uma venda de estatais favorece magnatas ligados a políticos. Jornalistas denunciam; a oposição pede investigação.', 'Capitalismo de compadrio.', [
    o('Cancelar e abrir investigação.', 'Moraliza; enfrenta poderosos.', { n: { corruption: -2, political: 1 }, g: { business: -4, opposition: 2 } }),
    o('Deixar a venda seguir.', 'Capital entra; corrupção.', { n: { treasury: 0.3, corruption: 2 }, g: { business: 3 } }),
    o('Leilão transparente com regras novas.', 'Reforma.', { n: { treasury: 0.15, corruption: -0.5 } })]),
  Q('eeu_draft', ['eastern_europe'], 'Defesa', 'Mobilização parcial e fuga de jovens', 'Generais pedem convocação de reservistas. Famílias protestam e muitos jovens fogem do país.', 'A guerra bate à porta.', [
    o('Decretar a mobilização.', 'Mais tropas; revolta.', { n: { readiness: 4, protest: 3, warWeariness: 2 }, g: { military: 3, youth: -5 } }),
    o('Voluntariado com bônus.', 'Menos efetivo, mais paz.', { n: { treasury: -0.3, readiness: 2 }, g: { military: 1, youth: -1 } }),
    o('Apostar em tecnologia e mercenários.', 'Caro.', { n: { treasury: -0.5, readiness: 2 } })]),
  Q('eeu_election', ['eastern_europe'], 'Política', 'Eleições sob suspeita de fraude', 'Observadores relatam urnas cheias e opositores impedidos. Multidões ocupam a praça central.', 'Praças e urnas, o ritual da região.', [
    o('Recontagem e observadores internacionais.', 'Credibilidade.', { n: { political: 2, legitimacy: 1, stability: -1 }, g: { opposition: 3 } }),
    o('Reprimir os protestos.', 'Sustenta o governo.', { n: { civil: -2, reputation: -3 }, g: { opposition: -3, military: 2 }, l: [L('revoRisk', 3, 240)] }),
    o('Concessões e nova eleição em um ano.', 'Esfria.', { n: { stability: 1, legitimacy: -1 } })]),
  Q('ibe_regions', ['iberia'], 'Política', 'Mais autonomia para as comunidades', 'Regiões com língua própria exigem competências fiscais e policiais. Madri e Lisboa se dividem.', 'Pacto territorial em revisão.', [
    o('Ampliar autonomia fiscal.', 'Reduz tensão; custa receita.', { n: { control: -1 }, g: { regional: 4 }, l: [L('separatism', -2, 365)] }),
    o('Manter o modelo atual.', 'Estável por ora.', { g: { regional: -1 } }),
    o('Recentralizar competências.', 'Autoritário.', { n: { control: 2 }, g: { regional: -5 }, l: [L('separatism', 3, 365)] })]),
  Q('ibe_drought', ['iberia'], 'Clima', 'Seca, rios baixos e tensão na agricultura', 'Barragens secam e o azeite sobe de preço. Agricultores e cidades disputam água.', 'Água virou assunto de Estado.', [
    o('Plano hídrico e dessalinização.', 'Resolve a longo prazo.', { n: { treasury: -0.5 }, l: [L('s_food', 2)], g: { rural: 3 } }),
    o('Racionar a água urbana.', 'Dói a cidades.', { g: { workers: -2, rural: 2 } }),
    o('Importar alimentos.', 'Alívio imediato.', { n: { treasury: -0.25, inflation: 0.2 } })]),
  Q('ibe_solar', ['iberia'], 'Energia', 'O boom solar', 'Sol abundante atrai investidores. Pequenos proprietários pedem parcela da renda e preservação de paisagens.', 'Energia limpa em escala.', [
    o('Leilões e participação local.', 'Equilibra.', { n: { treasury: 0.1 }, l: [L('s_energy', 3), L('pollution', -1)], g: { business: 2, rural: 2 } }),
    o('Priorizar autoconsumo em telhados.', 'Democratiza.', { n: { treasury: -0.2 }, l: [L('s_energy', 2)], g: { youth: 3 } }),
    o('Segurar a expansão.', 'Preserva paisagens.', { g: { business: -2, rural: 1 } })]),
  // ---------- Américas ----------
  Q('na_tariff', ['north_america'], 'Comércio', 'Guerra de tarifas no bloco', 'Um sócio comercial impõe tarifas altas sobre seus produtos. Fábricas e fazendas pedem retaliação.', 'Cadeias integradas sob estresse.', [
    o('Retaliar com tarifas espelhadas.', 'Pressão mútua.', { n: { inflation: 0.3 }, r: { neighbors: -5 }, g: { workers: 2, business: -2 } }),
    o('Negociar com cotas e prazos.', 'Calma.', { n: { treasury: -0.05 }, r: { neighbors: 3 } }),
    o('Diversificar mercados.', 'Longo prazo.', { l: [L('exportAccess', 0.03)], g: { business: 2 } })]),
  Q('na_border', ['north_america'], 'Migração', 'O muro e o fluxo de migrantes', 'Cidades de fronteira lotam de migrantes enquanto políticos prometem muros, visto e deportações.', 'Uma fronteira que divide eleitores.', [
    o('Reforço de fronteira e vistos de trabalho.', 'Combina controle e economia.', { n: { treasury: -0.3 }, l: [L('laborSupply', 0.2)], g: { rural: 2, business: 2 } }),
    o('Muro e deportações.', 'Linha dura.', { n: { treasury: -0.5, reputation: -2 }, g: { rural: 3, youth: -3 } }),
    o('Reforma ampla com caminho para cidadania.', 'Humano e polêmico.', { n: { reputation: 2 }, g: { youth: 3, rural: -3 } })]),
  Q('na_opioid', ['north_america'], 'Saúde', 'A crise dos opioides', 'Overdoses derrubam a expectativa de vida em cidades industriais. Processos contra farmacêuticas se acumulam.', 'Uma epidemia silenciosa.', [
    o('Tratamento público e acordo com as farmacêuticas.', 'Reduz mortes.', { n: { treasury: -0.4, health: 2 }, g: { workers: 2, business: -2 } }),
    o('Repressão e prisões.', 'Aplaude e falha.', { n: { crime: -1, civil: -1 }, g: { military: 1, youth: -2 } }),
    o('Descriminalizar e investir em redução de danos.', 'Moderno e polêmico.', { n: { health: 1.5, civil: 1 }, g: { youth: 3, rural: -2 } })]),
  Q('car_hurricane', ['caribbean', 'central_america'], 'Desastre', 'Furacão de categoria 5', 'Ventos devastam ilhas e vilas. Escolas, hospitais e portos ficam em ruínas.', 'A temporada se intensifica.', [
    o('Reconstrução com infraestrutura resiliente.', 'Prevenção.', { n: { treasury: -0.5, legitimacy: 3 }, l: [L('infra', 1)], g: { rural: 3 } }),
    o('Ajuda emergencial e pedido de doações.', 'Rápido.', { n: { treasury: -0.2 }, r: { all: 2 } }),
    o('Seguro paramétrico regional.', 'Moderno e eficiente.', { n: { treasury: -0.15 }, l: [L('creditLimit', 0.03)] })]),
  Q('car_blacklist', ['caribbean'], 'Finanças', 'Lista negra dos paraísos fiscais', 'Organismos internacionais ameaçam incluir o país na lista de jurisdições opacas. Bancos offshore pedem calma.', 'A economia depende de serviços financeiros.', [
    o('Transparência total.', 'Reputação e menos receita.', { n: { treasury: -0.2, reputation: 3 }, g: { business: -3 } }),
    o('Resistir e ocultar contas.', 'Receita e risco de sanções.', { n: { treasury: 0.2, reputation: -4 }, r: { west: -4 } }),
    o('Reformas graduais com consultoria.', 'Meio-termo.', { n: { reputation: 1 } })]),
  Q('car_cruise', ['caribbean'], 'Turismo', 'Cruzeiros: dinheiro e poluição', 'Gigantes do mar despejam milhares de turistas por dia, mas ficam pouco e poluem corais.', 'Equilíbrio entre economia e ecologia.', [
    o('Taxa ambiental e limite de navios.', 'Preserva recifes.', { n: { treasury: 0.1, pollution: -1 }, g: { business: -2, youth: 2 } }),
    o('Mais portos e terminais.', 'Receita imediata.', { n: { treasury: 0.3, pollution: 1.5 }, g: { business: 3 } }),
    o('Turismo de base comunitária.', 'Distribui lucros.', { n: { treasury: -0.1 }, g: { rural: 3 } })]),
  Q('car_sea', ['caribbean', 'pacific_islands'], 'Clima', 'O mar sobe e as praias recuam', 'A erosão consome hotéis, aeroportos e vilarejos. Uma ilha inteira discute relocalização.', 'Crise climática na linha de frente.', [
    o('Barreiras costeiras e manguezais.', 'Protege.', { n: { treasury: -0.5, pollution: -0.5 }, g: { rural: 2 } }),
    o('Relocalizar comunidades.', 'Dói e funciona.', { n: { treasury: -0.4 }, g: { rural: -3, regional: -2 } }),
    o('Cobrar compensação dos países ricos.', 'Diplomacia e pressão.', { n: { reputation: 2 }, r: { west: -2 } })]),
  Q('cam_gangs', ['central_america'], 'Segurança', 'Maras tomam bairros inteiros', 'Gangues cobram “impostos”, recrutam crianças e controlam cidades. O público pede mão pesada.', 'Violência que gera emigração.', [
    o('Estado de exceção e megaprisões.', 'Ordem e abusos.', { n: { crime: -3, civil: -3, reputation: -3 }, g: { military: 3, youth: -3 } }),
    o('Prevenção social, reintegração e policiamento comunitário.', 'Lento.', { n: { treasury: -0.4, crime: -1 }, g: { youth: 3, workers: 2 } }),
    o('Negociar tréguas com líderes.', 'Reduz homicídios; corrupção.', { n: { crime: -1.5, corruption: 2, legitimacy: -2 } })]),
  Q('cam_caravan', ['central_america'], 'Migração', 'A caravana rumo ao norte', 'Milhares caminham em direção ao norte. Países vizinhos pedem que o governo contenha o fluxo.', 'Pressão geopolítica dos vizinhos.', [
    o('Acordo de contenção em troca de ajuda.', 'Recebe fundos; é criticado.', { n: { treasury: 0.3, reputation: -2 }, r: { usa: 4 } }),
    o('Corredor humanitário e vistos regionais.', 'Humanitário.', { n: { treasury: -0.2, reputation: 3 }, r: { usa: -3 } }),
    o('Combater as causas: empregos e segurança.', 'Longo prazo.', { n: { treasury: -0.4 }, l: [L('emigration', -0.3, 365)] })]),
  Q('cam_canal', ['central_america'], 'Infraestrutura', 'Canal e corredor interoceânico', 'Investidores propõem um canal ou corredor ferroviário ligando os dois oceanos. Custo gigantesco e risco ambiental.', 'Uma obra para uma geração.', [
    o('Aprovar com capital estrangeiro.', 'Divisas e dependência.', { n: { treasury: -0.3 }, l: [L('exportAccess', 0.04), L('growth', 0.2)], g: { business: 3, rural: -2 } }),
    o('Corredor ferroviário menor.', 'Mais viável.', { n: { treasury: -0.4 }, l: [L('exportAccess', 0.02)] }),
    o('Recusar: soberania e floresta.', 'Preserva.', { g: { youth: 2, business: -2 } })]),
  Q('cam_coffee', ['central_america', 'andes'], 'Economia', 'O preço do café despenca', 'A saca do café perde valor. Famílias cafeicultoras pedem socorro e as safras ficam abandonadas.', 'Economia de monocultura.', [
    o('Fundo de estabilização e diversificação.', 'Protege.', { n: { treasury: -0.3 }, l: [L('s_food', 1)], g: { rural: 3 } }),
    o('Certificação de qualidade e exportação direta.', 'Valor agregado.', { n: { treasury: -0.1 }, l: [L('exportAccess', 0.02)], g: { rural: 1, business: 2 } }),
    o('Deixar o mercado resolver.', 'Dolorido.', { g: { rural: -5 } })]),
  Q('and_mining', ['andes'], 'Meio ambiente', 'Mineração versus água nas montanhas', 'Uma mina de cobre ameaça nascentes de comunidades indígenas. Há empregos e royalties em jogo.', 'Desenvolvimento ou território?', [
    o('Autorizar com regras e royalties locais.', 'Compromisso.', { n: { treasury: 0.25, pollution: 1.5 }, g: { business: 3, regional: 2 } }),
    o('Vetar o projeto.', 'Preserva.', { n: { reputation: 2 }, g: { business: -3, youth: 3 } }),
    o('Consulta prévia vinculante.', 'Legitimidade.', { n: { legitimacy: 2 }, g: { regional: 3 } })]),
  Q('and_coca', ['andes'], 'Segurança', 'Erradicar a coca ou legalizar o cultivo tradicional?', 'Campos de coca sustentam camponeses e narcotraficantes. Os EUA pressionam por erradicação.', 'Mercado ilegal, tradição e pressão externa.', [
    o('Erradicação forçada.', 'Agrada aliados; revolta o campo.', { n: { crime: -1, civil: -1 }, r: { usa: 4 }, g: { rural: -5, military: 2 } }),
    o('Substituição de cultivos com apoio técnico.', 'Lento e caro.', { n: { treasury: -0.3 }, l: [L('s_food', 1)], g: { rural: 2 } }),
    o('Legalizar o uso tradicional e regular.', 'Ousado.', { n: { reputation: -2 }, r: { usa: -4 }, g: { rural: 4 } })]),
  Q('and_indigenous', ['andes'], 'Direitos', 'Direitos constitucionais dos povos indígenas', 'Movimentos indígenas exigem autonomia territorial, plurinacionalidade e uso do idioma originário no Estado.', 'Reforma profunda do Estado.', [
    o('Reconhecer a plurinacionalidade.', 'Histórico e controverso.', { n: { civil: 2, legitimacy: 2 }, g: { regional: 3, business: -2 } }),
    o('Reformas parciais e fundos.', 'Pragmático.', { n: { treasury: -0.2 }, g: { regional: 1 } }),
    o('Rejeitar a mudança.', 'Conflitos.', { n: { civil: -1 }, g: { regional: -4 }, l: [L('separatism', 2, 365)] })]),
  Q('and_quake', ['andes'], 'Desastre', 'Terremoto nos Andes', 'Um abalo de magnitude 8 atinge cidades de altitude e a costa. Muitas casas de adobe caem.', 'Zona sísmica ativa.', [
    o('Reconstrução antissísmica.', 'Futuro mais seguro.', { n: { treasury: -0.5, legitimacy: 3 }, l: [L('housing', 1.5)] }),
    o('Ajuda emergencial e doações.', 'Rápido.', { n: { treasury: -0.2 }, r: { all: 2 } }),
    o('Cada um reconstrói.', 'Poupa recursos.', { n: { legitimacy: -3 }, g: { rural: -3 } })]),
  Q('sc_inflation', ['southern_cone'], 'Economia', 'Inflação e a corrida ao dólar', 'Com a moeda em queda, poupadores correm ao dólar. O governo considera congelar preços ou dolarizar.', 'Velha fantasma regional.', [
    o('Ajuste fiscal e metas de inflação.', 'Dói e funciona.', { n: { inflation: -1, protest: 2 }, g: { workers: -3, business: 3 } }),
    o('Congelar preços.', 'Efeito temporário.', { n: { inflation: -0.5, growth: -0.2 }, g: { workers: 2, business: -3 } }),
    o('Dolarizar a economia.', 'Radical.', { n: { inflation: -2, reputation: -1 }, l: [L('creditLimit', -0.05)], g: { business: 2, workers: -2 } })]),
  Q('sc_soy', ['southern_cone', 'amazon'], 'Economia', 'A soja e o apetite da China', 'A demanda chinesa dispara o preço da soja. Produtores querem desmatar mais; ambientalistas se opõem.', 'Dependência da commodity.', [
    o('Expandir a fronteira agrícola.', 'Receitas, desmatamento.', { n: { treasury: 0.3, pollution: 2 }, l: [L('s_food', 3)], g: { business: 4, youth: -3 } }),
    o('Produtividade e rastreabilidade.', 'Sustentável.', { n: { treasury: -0.15 }, l: [L('s_food', 2)], g: { business: 1, youth: 2 } }),
    o('Taxar exportações para financiar o social.', 'Redistribui.', { n: { treasury: 0.35 }, g: { business: -4, workers: 3 } })]),
  Q('sc_lithium', ['southern_cone', 'andes'], 'Recursos', 'Lítio: estatizar ou concessionar?', 'O mundo quer baterias; o salar guarda o ouro branco. Estatais e multinacionais disputam.', 'Soberania sobre recursos.', [
    o('Estatizar e beneficiar localmente.', 'Valor agregado.', { n: { treasury: -0.3 }, l: [L('industry', 2), L('revenue', 0.15)], g: { business: -4 } }),
    o('Concessões com royalties altos.', 'Receita rápida.', { n: { treasury: 0.3 }, g: { business: 3 } }),
    o('Parceria público-privada.', 'Equilíbrio.', { n: { treasury: 0.1 }, l: [L('industry', 1)] })]),
  Q('amz_fire', ['amazon'], 'Meio ambiente', 'Queimadas na floresta amazônica', 'Focos de incêndio explodem na estação seca. Satélites mostram o avanço do desmatamento e o mundo cobra.', 'Pressão ambiental global.', [
    o('Fiscalização forte com satélite e multas.', 'Reduz desmatamento.', { n: { treasury: -0.25, pollution: -2, reputation: 3 }, g: { business: -3, youth: 3 } }),
    o('Moratória negociada com produtores.', 'Compromisso.', { n: { pollution: -1 }, g: { business: -1 } }),
    o('Priorizar o desenvolvimento.', 'Receita; imagem.', { n: { pollution: 3, reputation: -4 }, g: { business: 3, rural: 2 } })]),
  Q('amz_river', ['amazon'], 'Infraestrutura', 'Hidrovias e estradas na selva', 'Uma estrada cortará a floresta ligando mercados. Indígenas e ONGs alertam; empresas apoiam.', 'Logística versus conservação.', [
    o('Construir com salvaguardas.', 'Equilíbrio.', { n: { treasury: -0.4 }, l: [L('logistics', 2)], g: { business: 2, youth: -1 } }),
    o('Priorizar hidrovias.', 'Menor impacto.', { n: { treasury: -0.3 }, l: [L('logistics', 1)] }),
    o('Cancelar o projeto.', 'Preserva.', { g: { business: -2, youth: 2 } })]),
  Q('amz_land', ['amazon', 'andes'], 'Direitos', 'Demarcação de terras indígenas', 'Comunidades exigem demarcação; garimpeiros e fazendeiros resistem.', 'Direitos e interesses econômicos.', [
    o('Demarcar e proteger com patrulhas.', 'Direito e conflito.', { n: { treasury: -0.25, reputation: 3 }, g: { regional: 3, business: -3 } }),
    o('Revisar limites.', 'Compromisso confuso.', { g: { regional: -1 } }),
    o('Suspender demarcações.', 'Agrada ruralistas.', { n: { reputation: -3 }, g: { business: 3, regional: -4 } })]),
  Q('amz_patent', ['amazon'], 'Ciência', 'Biopirataria e patentes de plantas', 'Uma multinacional patenteia princípio de uma planta tradicional. Comunidades exigem repartição de benefícios.', 'Conhecimento tradicional em disputa.', [
    o('Contestar a patente e criar lei de repartição.', 'Protege e atrai.', { n: { reputation: 2 }, l: [L('tech', 0.5)], g: { regional: 3, business: -1 } }),
    o('Licenciar com royalties.', 'Receita.', { n: { treasury: 0.15 }, g: { business: 2 } }),
    o('Ignorar.', 'Sem custos.', { g: { regional: -2 } })]),
  // ---------- África ----------
  Q('naf_protest', ['north_africa'], 'Política', 'Aniversário da revolta e novos protestos', 'Dez anos depois, jovens voltam às ruas por empregos e dignidade. Um ministro propõe diálogo; outro, repressão.', 'A memória das praças pesa.', [
    o('Pacote de empregos e reforma política.', 'Reduz tensão.', { n: { treasury: -0.4, political: 2 }, g: { youth: 4, opposition: 2 } }),
    o('Repressão seletiva.', 'Silencia a rua.', { n: { civil: -2, reputation: -2 }, g: { youth: -4, military: 2 }, l: [L('revoRisk', 2, 240)] }),
    o('Diálogo nacional e referendo.', 'Legítimo e arriscado.', { n: { legitimacy: 2, stability: -1 } })]),
  Q('naf_migration', ['north_africa'], 'Migração', 'O acordo migratório com a Europa', 'Bruxelas oferece dinheiro para que o país contenha migrantes que partem rumo ao norte. A opinião pública protesta.', 'Fronteira da Europa terceirizada.', [
    o('Aceitar o acordo.', 'Fundos e críticas.', { n: { treasury: 0.4, reputation: -2 }, r: { west: 4 } }),
    o('Recusar e exigir vistos legais.', 'Orgulho e pressão.', { n: { reputation: 1 }, r: { west: -3 }, g: { youth: 2 } }),
    o('Exigir mais ajuda ao desenvolvimento.', 'Barganha dura.', { n: { treasury: 0.2 } })]),
  Q('naf_solar', ['north_africa'], 'Energia', 'Solar no deserto para a Europa', 'Consórcios propõem usinas solares gigantescas com cabos submarinos para exportar eletricidade ao norte.', 'O deserto como mina de energia.', [
    o('Aprovar com participação local.', 'Receita e prestígio.', { n: { treasury: -0.2 }, l: [L('s_energy', 3), L('revenue', 0.1)], g: { business: 3, youth: 2 } }),
    o('Priorizar abastecimento interno.', 'Autonomia.', { n: { treasury: -0.3 }, l: [L('s_energy', 3)] }),
    o('Adiar.', 'Sem custo.', {})]),
  Q('naf_dam', ['north_africa'], 'Água', 'A grande represa no rio de cabeceira', 'Um vizinho encerra o enchimento de uma grande represa a montante. O país teme perder água da lavoura.', 'O rio é vida.', [
    o('Negociar vazões mínimas.', 'Menos risco.', { n: { reputation: 1 }, r: { neighbors: 2 } }),
    o('Ameaçar o uso da força.', 'Jogo perigoso.', { n: { stability: -1 }, r: { neighbors: -10 }, g: { military: 3 } }),
    o('Plano de uso eficiente e reuso.', 'Adaptação.', { n: { treasury: -0.4 }, l: [L('s_food', 1)] })]),
  Q('sah_attack', ['sahel'], 'Segurança', 'Ataque jihadista a um posto militar', 'Dezenas de soldados morrem num ataque coordenado. A população exige reação e mais proteção.', 'Insurgência crônica no deserto.', [
    o('Ofensiva militar e apoio de aliados.', 'Mostra resposta; risco.', { n: { readiness: 3, warWeariness: 2, treasury: -0.4 }, g: { military: 4, rural: -2 } }),
    o('Negociar com chefes locais.', 'Reduz violência; polêmica.', { n: { crime: -1, legitimacy: -1 }, g: { rural: 2 } }),
    o('Investir em segurança e desenvolvimento local.', 'Lento.', { n: { treasury: -0.4 }, g: { rural: 3 } })]),
  Q('sah_famine', ['sahel'], 'Fome', 'A seca e a fome no Sahel', 'A chuva falhou pelo terceiro ano. Rebanhos morrem e famílias abandonam vilas.', 'Aridez e conflito se alimentam.', [
    o('Apelo à ONU e distribuição de alimentos.', 'Salva vidas.', { n: { treasury: -0.2, hunger: -1.5, reputation: 1 }, r: { all: 2 } }),
    o('Programas de irrigação e poços.', 'Prevenção.', { n: { treasury: -0.4 }, l: [L('s_food', 2)], g: { rural: 3 } }),
    o('Ignorar e concentrar nas cidades.', 'Poupa.', { n: { hunger: 2, legitimacy: -3 } })]),
  Q('sah_merc', ['sahel', 'west_africa', 'central_africa'], 'Segurança', 'Mercenários internacionais oferecem seus serviços', 'Uma companhia militar privada propõe treinar o exército e proteger minas em troca de concessões.', 'Poder e dependência.', [
    o('Contratar por tempo limitado.', 'Resultados rápidos.', { n: { treasury: -0.3, readiness: 3, reputation: -3 }, r: { west: -4, russia: 4 }, g: { military: 1 } }),
    o('Recusar e pedir parceria com vizinhos.', 'Autonomia.', { n: { reputation: 1 }, r: { neighbors: 3 } }),
    o('Construir forças especiais nacionais.', 'Lento.', { n: { treasury: -0.4, readiness: 2 }, g: { military: 3 } })]),
  Q('sah_colonels', ['sahel', 'west_africa'], 'Política', 'Oficiais conspiram contra o governo', 'Coronéis descontentes planejam um golpe, citando a corrupção e a incapacidade de enfrentar a insurgência.', 'A região vive uma onda de golpes.', [
    o('Promover os coronéis e dar pasta ministerial.', 'Compra lealdade.', { n: { coupRisk: -3, corruption: 1 }, g: { military: 4 } }),
    o('Prisões preventivas.', 'Corta o risco; tensiona.', { n: { coupRisk: -2, civil: -1 }, g: { military: -4 } }),
    o('Reformar o comando e punir a corrupção.', 'Estrutural.', { n: { efficiency: 1, corruption: -1 }, g: { military: -2, bureaucracy: -1 } })]),
  Q('waf_cocoa', ['west_africa'], 'Economia', 'O cacau vale ouro, e os fazendeiros pedem mais', 'O preço do cacau dispara, mas produtores recebem pouco. Chocolateiras globais prometem sustentabilidade.', 'A cadeia de valor está longe da lavoura.', [
    o('Preço mínimo ao produtor e cooperativas.', 'Protege camponeses.', { n: { treasury: -0.2 }, g: { rural: 4, business: -2 } }),
    o('Atrair indústrias de chocolate locais.', 'Valor agregado.', { n: { treasury: -0.3 }, l: [L('industry', 1.5)] }),
    o('Taxar exportações.', 'Receita; revolta.', { n: { treasury: 0.3 }, g: { rural: -4 } })]),
  Q('waf_epidemic', ['west_africa', 'central_africa', 'east_africa'], 'Saúde', 'Epidemia de febre hemorrágica', 'Um surto assusta as cidades. Fronteiras fecham, voos são cancelados e hospitais têm poucos recursos.', 'Resposta rápida salva milhares.', [
    o('Quarentena e hospitais de campanha.', 'Contém o surto.', { n: { treasury: -0.4, health: 1, civil: -0.5 }, g: { workers: -2 } }),
    o('Pedir equipes internacionais.', 'Acelera a resposta.', { n: { treasury: -0.1, reputation: 1 }, r: { all: 2 } }),
    o('Esconder para proteger a economia.', 'Perigoso.', { n: { health: -3, reputation: -4 } })]),
  Q('waf_oil', ['west_africa'], 'Economia', 'Roubo de petróleo e dutos sabotados', 'Quadrilhas furam dutos e roubam milhões de barris. Comunidades do delta reclamam da poluição.', 'Receita e conflito.', [
    o('Militarizar o delta.', 'Protege; abusos.', { n: { treasury: -0.3, civil: -1 }, g: { military: 3, regional: -3 } }),
    o('Anistia e emprego para ex-militantes.', 'Reduz ataques.', { n: { treasury: -0.3 }, g: { regional: 3, workers: 2 } }),
    o('Refinarias locais e cota de lucro.', 'Estrutural.', { n: { treasury: -0.4 }, l: [L('industry', 1.5)], g: { regional: 2 } })]),
  Q('waf_election', ['west_africa', 'east_africa', 'central_africa'], 'Política', 'Eleição disputada e etnias em tensão', 'O resultado apertado leva multidões às ruas. O candidato derrotado fala em fraude e líderes de etnias ameaçam boicotes.', 'Eleições sob risco de violência.', [
    o('Recontagem com observadores.', 'Legitimidade.', { n: { political: 1, stability: -1, legitimacy: 2 } }),
    o('Declarar vitória e reprimir.', 'Risco de conflito.', { n: { civil: -2, reputation: -3 }, g: { opposition: -3, military: 2 }, l: [L('revoRisk', 3, 240)] }),
    o('Governo de unidade nacional.', 'Divide o poder.', { n: { stability: 2, corruption: 1 } })]),
  Q('caf_cobalt', ['central_africa'], 'Economia', 'Cobalto, trabalho infantil e os celulares do mundo', 'Reportagens mostram crianças em minas artesanais de cobalto. Multinacionais exigem selos de origem.', 'Recursos críticos da transição energética.', [
    o('Formalizar minas e fiscalizar.', 'Imagem e receita estável.', { n: { treasury: -0.2, reputation: 3 }, g: { workers: 2, business: -2 } }),
    o('Contratar empresas estrangeiras.', 'Receita imediata.', { n: { treasury: 0.4, reputation: -1 }, g: { business: 3, workers: -2 } }),
    o('Estatizar o setor.', 'Controle, ineficiência.', { n: { treasury: -0.3 }, l: [L('revenue', 0.2)], g: { bureaucracy: 3, business: -4 } })]),
  Q('caf_logging', ['central_africa'], 'Meio ambiente', 'Exploração madeireira na floresta equatorial', 'Concessões madeireiras avançam em florestas intocadas. Fundos de conservação oferecem pagar para proteger.', 'Segundo maior pulmão do planeta.', [
    o('Aceitar o pagamento por conservação.', 'Receita limpa.', { n: { treasury: 0.25, reputation: 3, pollution: -1 }, g: { business: -2, youth: 2 } }),
    o('Aprovar concessões com manejo.', 'Lucro com regras.', { n: { treasury: 0.3, pollution: 1 }, g: { business: 3 } }),
    o('Mix de reservas e madeira certificada.', 'Equilíbrio.', { n: { treasury: 0.1 } })]),
  Q('caf_rebels', ['central_africa', 'east_africa'], 'Segurança', 'Milícias rebeldes controlam minas no leste', 'Milícias tomam áreas de mineração, taxam e recrutam crianças. Vizinhos têm interesses.', 'Guerra por recursos.', [
    o('Ofensiva com apoio externo.', 'Retoma controle; mortes.', { n: { treasury: -0.4, warWeariness: 2 }, g: { military: 3 } }),
    o('Negociar integração dos rebeldes.', 'Reduz conflito.', { n: { corruption: 1.5, stability: 1 } }),
    o('Apelar à força de paz da ONU.', 'Diplomático.', { n: { reputation: 1 }, r: { all: 1 } })]),
  Q('eaf_locust', ['east_africa', 'horn_africa'], 'Agricultura', 'Nuvens de gafanhotos devoram lavouras', 'Enxames gigantescos cruzam a região destruindo pastagens e roças. A ajuda internacional chega devagar.', 'Praga bíblica nos campos.', [
    o('Pulverização aérea e fundo de emergência.', 'Controle rápido.', { n: { treasury: -0.4, hunger: -0.5 }, g: { rural: 3 } }),
    o('Pedir ajuda da FAO e vizinhos.', 'Barato.', { n: { treasury: -0.1, reputation: 1 }, r: { neighbors: 2 } }),
    o('Cada vila se defende.', 'Sem custo.', { n: { hunger: 2 }, g: { rural: -5 } })]),
  Q('eaf_pastoral', ['east_africa', 'horn_africa'], 'Conflito', 'Conflito entre pastores e agricultores', 'A seca empurra pastores com gado para terras de agricultores. Mortes e vingança escalam.', 'Terra, água e clã.', [
    o('Corredores de pastoreio e mediação de anciãos.', 'Paz sustentável.', { n: { treasury: -0.15, stability: 1 }, g: { rural: 3 } }),
    o('Desarmamento e policiamento.', 'Força.', { n: { control: 2, civil: -1 }, g: { rural: -2, military: 2 } }),
    o('Ignorar.', 'Cresce.', { n: { stability: -2 }, g: { rural: -3 } })]),
  Q('eaf_rail', ['east_africa', 'central_africa'], 'Economia', 'Uma ferrovia chinesa e a dívida', 'Pequim financia uma ferrovia ligando o porto ao interior. A dívida é alta; a economia precisa do corredor.', 'A armadilha da dívida?', [
    o('Aceitar o empréstimo.', 'Infraestrutura já.', { n: { treasury: -0.1 }, l: [L('logistics', 3), L('exportAccess', 0.03)], r: { china: 5, west: -2 } }),
    o('Exigir termos de dívida e participação local.', 'Dura negociação.', { n: { treasury: -0.1 }, l: [L('logistics', 2)], r: { china: 2 } }),
    o('Recusar e buscar outros financiadores.', 'Mais lento.', { r: { west: 2 } })]),
  Q('eaf_mobile', ['east_africa', 'west_africa'], 'Tecnologia', 'A revolução do dinheiro móvel', 'Pagamentos por celular substituem agências bancárias. O Banco Central quer regular; empresas pedem liberdade.', 'Inovação financeira de baixo custo.', [
    o('Regulação leve e inclusão financeira.', 'Cresce.', { n: { treasury: -0.05 }, l: [L('growth', 0.15), L('tech', 1)], g: { youth: 3, business: 2 } }),
    o('Imposto sobre transações móveis.', 'Receita; freio.', { n: { treasury: 0.2 }, g: { youth: -3, rural: -2 } }),
    o('Criar moeda digital estatal.', 'Controle e inovação.', { n: { treasury: -0.2 }, l: [L('tech', 1.5)] })]),
  Q('hrn_piracy', ['horn_africa'], 'Segurança', 'Pirataria no golfo', 'Lanchas armadas assaltam navios de carga. Seguradoras multiplicam prêmios e frotas estrangeiras patrulham.', 'Costas sem Estado.', [
    o('Guarda costeira e polícia marítima.', 'Soberania, custo.', { n: { treasury: -0.3, projection: 1 }, g: { military: 2 } }),
    o('Empregos para ex-pescadores armados.', 'Ataca a raiz.', { n: { treasury: -0.25 }, g: { rural: 3 } }),
    o('Aceitar frotas estrangeiras.', 'Eficaz e dependente.', { n: { reputation: 1 }, r: { west: 3 } })]),
  Q('hrn_famine', ['horn_africa'], 'Fome', 'A seca mais longa em quarenta anos', 'Rebanhos morrem, poços secam e milhões dependem de comida enviada. Grupos armados bloqueiam estradas.', 'Crise humanitária.', [
    o('Corredor humanitário negociado.', 'Salva vidas.', { n: { treasury: -0.25, hunger: -2 }, r: { all: 2 } }),
    o('Priorizar distribuição em áreas leais.', 'Politiza a ajuda.', { n: { hunger: 1, reputation: -2 }, g: { military: 1 } }),
    o('Programas de poços e pastagens.', 'Longo prazo.', { n: { treasury: -0.4 }, l: [L('s_food', 2)] })]),
  Q('hrn_port', ['horn_africa'], 'Geopolítica', 'Um porto para uma potência do Golfo', 'Um país do Golfo oferece bilhões para construir e operar um porto estratégico na sua costa.', 'Dinheiro e soberania.', [
    o('Aprovar com cláusulas de soberania.', 'Receita e atrito.', { n: { treasury: 0.4 }, r: { rival: -4 }, g: { business: 2 } }),
    o('Leilão internacional.', 'Equilíbrio.', { n: { treasury: 0.25 }, r: { all: 1 } }),
    o('Recusar e construir com recursos próprios.', 'Soberano e lento.', { n: { treasury: -0.4 }, l: [L('logistics', 1.5)] })]),
  Q('saf_load', ['southern_africa'], 'Energia', 'Apagões programados (“load shedding”)', 'A rede elétrica falha por falta de manutenção. Fábricas param e os semáforos apagam.', 'A energia como gargalo do país.', [
    o('Abrir à geração privada e solar.', 'Mais oferta.', { n: { treasury: -0.2 }, l: [L('s_energy', 3)], g: { business: 3, workers: -1 } }),
    o('Reformar a estatal e combater a corrupção.', 'Lento.', { n: { treasury: -0.3, corruption: -1 }, l: [L('s_energy', 2)], g: { bureaucracy: -3 } }),
    o('Racionar e pedir paciência.', 'Poupa.', { n: { growth: -0.3, legitimacy: -2 } })]),
  Q('saf_land', ['southern_africa'], 'Economia', 'Reforma agrária e a memória do apartheid', 'Terras agrícolas concentradas em poucas mãos brancas alimentam o debate: compensar ou desapropriar sem indenização.', 'Questão histórica e emocional.', [
    o('Compra e redistribuição com apoio técnico.', 'Gradual.', { n: { treasury: -0.4, inequality: -0.6 }, g: { rural: 3, business: -1 } }),
    o('Desapropriação sem indenização.', 'Radical; risco econômico.', { n: { inequality: -1, reputation: -3 }, g: { rural: 4, business: -5 }, l: [L('s_food', -2, 240)] }),
    o('Foco em crédito e títulos.', 'Pragmático.', { n: { treasury: -0.2 }, g: { rural: 2 } })]),
  Q('saf_hiv', ['southern_africa'], 'Saúde', 'HIV/AIDS e a nova geração', 'Prevalência alta persiste. Novos antirretrovirais exigem dinheiro; campanhas de prevenção enfrentam tabus.', 'Saúde pública e justiça social.', [
    o('Expandir tratamento e prevenção.', 'Salva vidas.', { n: { treasury: -0.5, health: 2 }, g: { workers: 2, youth: 3 } }),
    o('Parceria com ONGs e doadores.', 'Menos custo.', { n: { treasury: -0.15, health: 1 }, r: { west: 2 } }),
    o('Cortar programas.', 'Economiza.', { n: { health: -2, legitimacy: -2 } })]),
  Q('saf_mines', ['southern_africa'], 'Recursos', 'Nacionalizar as minas de diamantes e platina?', 'Mineradoras multinacionais lucram bilhões. Sindicatos e partidos pedem estatização ou participação maior.', 'Propriedade versus capital.', [
    o('Estatizar parcialmente (51%).', 'Receita e fuga de capitais.', { n: { treasury: 0.4 }, g: { bureaucracy: 2, business: -4 } }),
    o('Royalties maiores e conteúdo local.', 'Melhora sem ruptura.', { n: { treasury: 0.25 }, l: [L('industry', 1)], g: { business: -1 } }),
    o('Manter como está.', 'Investidor feliz.', { g: { workers: -3, business: 2 } })]),
  Q('ind_cyclone', ['indian_ocean'], 'Desastre', 'Ciclone no Índico', 'Um ciclone de grande porte atinge ilhas e destrói plantações de baunilha e cravo.', 'Economia frágil de ilhas.', [
    o('Fundo de resiliência e reconstrução.', 'Protege.', { n: { treasury: -0.4, legitimacy: 2 }, g: { rural: 3 } }),
    o('Pedir ajuda externa.', 'Rápido.', { n: { treasury: -0.1 }, r: { all: 1 } }),
    o('Seguro regional.', 'Moderno.', { n: { treasury: -0.15 } })]),
  Q('ind_navy', ['indian_ocean'], 'Geopolítica', 'Base naval estrangeira em arrendamento', 'Uma potência oferece fortuna para arrendar uma ilha estratégica por 50 anos. Rivais protestam.', 'Soberania em troca de dinheiro.', [
    o('Aceitar o arrendamento.', 'Dinheiro e segurança.', { n: { treasury: 0.5 }, r: { rival: -6 }, g: { military: 2 } }),
    o('Recusar: neutralidade ativa.', 'Mantém a autonomia.', { n: { reputation: 2 } }),
    o('Leiloar entre várias potências.', 'Gera concorrência.', { n: { treasury: 0.3 }, r: { all: -1 } })]),
  Q('oce_mine', ['oceania'], 'Recursos', 'Mina nova e o debate ambiental', 'Uma gigante mineradora propõe uma mina de carvão e outra de lítio. Comunidades locais e ambientalistas divergem.', 'Dependência de commodities.', [
    o('Autorizar com compensações.', 'Receita.', { n: { treasury: 0.3, pollution: 1.5 }, g: { business: 3, youth: -2 } }),
    o('Vetar a mina de carvão e aprovar a de lítio.', 'Compromisso verde.', { n: { treasury: 0.15 }, l: [L('industry', 1)] }),
    o('Vetar ambas.', 'Preserva.', { n: { reputation: 2 }, g: { business: -3, youth: 3 } })]),
  Q('oce_china', ['oceania', 'pacific_islands'], 'Geopolítica', 'A disputa de influência no Pacífico', 'Uma potência asiática oferece portos, estradas e policiamento. Aliados tradicionais alertam contra dependência.', 'Grande jogo no Pacífico.', [
    o('Aceitar os investimentos.', 'Infraestrutura e atrito.', { n: { treasury: 0.3 }, r: { china: 6, west: -5 }, l: [L('infra', 1)] }),
    o('Manter parceria com aliados históricos.', 'Fidelidade.', { n: { treasury: 0.1 }, r: { west: 4, china: -4 } }),
    o('Equilibrar as duas.', 'Diplomacia acrobática.', { n: { treasury: 0.15 }, r: { all: 1 } })]),
  Q('oce_bush', ['oceania'], 'Desastre', 'Incêndios florestais históricos', 'Uma temporada de fogo destrói milhões de hectares, queima casas e mata fauna. O verão ainda não acabou.', 'Clima extremo.', [
    o('Frota aérea e brigadas profissionais.', 'Resposta forte.', { n: { treasury: -0.4, legitimacy: 3 }, g: { rural: 3 } }),
    o('Compromisso climático acelerado.', 'Longo prazo.', { n: { pollution: -1.5, reputation: 2 }, g: { youth: 3, business: -2 } }),
    o('Defesa civil voluntária.', 'Barato.', { n: { legitimacy: -1 } })]),
  Q('pac_tuna', ['pacific_islands'], 'Economia', 'Licenças de atum para frotas estrangeiras', 'Frotas distantes pagam bilhões para pescar atum em águas do país. Ambientalistas alertam para colapso.', 'O mar é a principal riqueza.', [
    o('Leiloar e aumentar o preço.', 'Receita máxima.', { n: { treasury: 0.4, pollution: 1 }, g: { business: 2 } }),
    o('Cotas rígidas e observadores.', 'Sustentável.', { n: { treasury: 0.15, reputation: 2 }, g: { rural: 2 } }),
    o('Pescar com frota nacional.', 'Soberano, caro.', { n: { treasury: -0.4 }, l: [L('industry', 0.8)] })]),
  Q('pac_seabed', ['pacific_islands', 'oceania'], 'Recursos', 'Mineração do fundo do mar', 'Nódulos de manganês cobrem o leito oceânico. Empresas querem explorar; cientistas pedem moratória.', 'Fronteira ambiental.', [
    o('Autorizar a exploração.', 'Receita; riscos.', { n: { treasury: 0.5, pollution: 2, reputation: -2 }, g: { business: 3 } }),
    o('Moratória e pesquisa.', 'Cautela.', { n: { reputation: 3 }, g: { youth: 3 } }),
    o('Parceria estatal com royalties.', 'Equilíbrio.', { n: { treasury: 0.25, pollution: 0.8 } })]),
];

const events = [
  V('monsoon_flood', ['south_asia', 'southeast_asia'], 'Desastre', 'Enchentes da monção', 'Enchentes da monção deixam milhões desabrigados e arrasam lavouras', 'bad', { long: [L('s_food', -5, 90), L('qol', -1, 120)], groups: { rural: -4 } }, { next: [{ id: 'famine_warning', days: 35, p: 0.3 }] }),
  V('typhoon_coast', ['east_asia', 'southeast_asia'], 'Desastre', 'Tufão no litoral', 'Tufão atinge o litoral e interrompe portos e indústrias', 'bad', { now: { treasury: -0.2 }, long: [L('growth', -0.2, 60)], groups: { workers: -2 } }),
  V('sandstorm', ['middle_east', 'gulf', 'north_africa', 'sahel'], 'Clima', 'Tempestade de areia', 'Tempestade de areia fecha aeroportos e escolas por dias', 'warn', { long: [L('qol', -0.8, 30), L('growth', -0.1, 30)] }),
  V('locusts', ['east_africa', 'horn_africa', 'south_asia'], 'Agricultura', 'Nuvens de gafanhotos', 'Nuvens de gafanhotos avançam sobre as lavouras da região', 'bad', { long: [L('s_food', -6, 120)], groups: { rural: -5 } }),
  V('volcano', ['southeast_asia', 'pacific_islands', 'central_america', 'andes'], 'Desastre', 'Erupção vulcânica', 'Erupção vulcânica cobre cidades de cinzas e interrompe voos', 'bad', { now: { treasury: -0.15 }, groups: { rural: -3 } }),
  V('quake_med', ['balkans', 'mediterranean'], 'Desastre', 'Terremoto histórico', 'Terremoto abala vilarejos históricos e obriga mutirão de resgate', 'bad', { now: { treasury: -0.3, legitimacy: -1 }, groups: { rural: -3 } }),
  V('heat_med', ['mediterranean', 'iberia', 'balkans'], 'Clima', 'Onda de calor', 'Onda de calor bate recordes e lota hospitais', 'warn', { long: [L('health', -1, 40), L('s_energy', -2, 40)] }),
  V('cold_snap', ['nordic', 'baltic', 'eastern_europe', 'central_asia'], 'Clima', 'Frio extremo', 'Frio extremo congela canos e pressiona a rede elétrica', 'warn', { now: { treasury: -0.1 }, long: [L('s_energy', -3, 45)] }),
  V('hurricane_season', ['caribbean', 'central_america'], 'Desastre', 'Temporada de furacões', 'Furacão destrói escolas e plantações no litoral', 'bad', { now: { treasury: -0.25 }, groups: { rural: -4 }, long: [L('infra', -1, 150)] }),
  V('tourism_boom', ['mediterranean', 'caribbean', 'southeast_asia', 'indian_ocean'], 'Economia', 'Boom de turismo', 'Chegada recorde de turistas aquece hotéis e restaurantes', 'good', { now: { treasury: 0.25 }, groups: { business: 3 }, long: [L('growth', 0.1, 120)] }),
  V('carnival', ['south_america', 'caribbean', 'central_america'], 'Cultura', 'Carnaval e festas populares', 'Festas populares arrastam milhões às ruas e animam a economia', 'good', { now: { treasury: 0.1, legitimacy: 1 }, groups: { youth: 3, workers: 2 } }),
  V('football_glory', ['south_america', 'subsaharan', 'western_europe', 'iberia', 'central_america'], 'Esporte', 'Triunfo no futebol', 'Seleção vence campeonato e o país inteiro comemora', 'good', { now: { legitimacy: 2 }, groups: { youth: 3, workers: 2 } }),
  V('oil_discovery', ['west_africa', 'east_africa', 'central_africa', 'central_asia', 'caribbean', 'amazon'], 'Economia', 'Descoberta de petróleo', 'Geólogos anunciam grandes reservas de petróleo e gás', 'good', { now: { treasury: 0.2 }, long: [L('revenue', 0.1, 365)], groups: { business: 3 } }),
  V('tech_hub', ['south_asia', 'east_asia', 'east_africa', 'baltic', 'nordic'], 'Tecnologia', 'Polo de startups', 'Polo de startups atrai investidores e jovens talentos', 'good', { long: [L('tech', 1.5, 365), L('growth', 0.1, 365)], groups: { youth: 3 } }),
  V('brain_drain', ['eastern_europe', 'balkans', 'south_asia', 'andes', 'west_africa'], 'Demografia', 'Fuga de cérebros', 'Médicos e engenheiros fazem as malas para países ricos', 'warn', { long: [L('productivity', -0.5, 180), L('emigration', 0.3, 180)] }),
  V('border_incident', ['south_asia', 'caucasus', 'balkans', 'east_africa', 'middle_east'], 'Segurança', 'Incidente de fronteira', 'Tiros trocados na fronteira elevam a tensão com o vizinho', 'warn', { now: { readiness: 1 }, groups: { military: 2 } }, { rel: { neighbors: -3 } }),
  V('coup_rumour', ['sahel', 'west_africa', 'central_africa', 'central_asia'], 'Política', 'Boatos de golpe', 'Boatos de golpe levam tropas às ruas da capital', 'warn', { long: [L('coupRisk', 3, 90)], groups: { military: 1 } }),
  V('pandemic_scare', ['subsaharan', 'south_asia', 'southeast_asia'], 'Saúde', 'Surto de doença', 'Surto de doença infecciosa lota hospitais regionais', 'bad', { now: { treasury: -0.2, health: -1 } }),
  V('mining_rush', ['andes', 'southern_africa', 'oceania', 'central_africa'], 'Economia', 'Corrida mineral', 'Preço dos minerais dispara e atrai investimentos', 'good', { now: { treasury: 0.2 }, long: [L('industry', 1, 240)], groups: { business: 3 } }),
  V('wine_harvest', ['mediterranean', 'caucasus', 'southern_cone', 'iberia'], 'Agricultura', 'Safra histórica de vinho e azeite', 'Safra histórica de vinho e azeite enche os armazéns', 'good', { now: { treasury: 0.1 }, groups: { rural: 3 } }),
  V('wildfire_smoke', ['southeast_asia', 'amazon', 'oceania'], 'Clima', 'Fumaça de queimadas', 'Fumaça de queimadas encobre cidades e fecha escolas', 'warn', { long: [L('health', -0.8, 40)], now: { pollution: 1 } }),
  V('fishing_conflict', ['british_isles', 'nordic', 'mediterranean', 'pacific_islands', 'southeast_asia'], 'Comércio', 'Conflito de pesca', 'Frotas de pesca disputam cotas e causam bloqueios portuários', 'warn', { groups: { rural: -2 } }, { rel: { neighbors: -2 } }),
  V('migration_wave', ['mediterranean', 'central_america', 'middle_east', 'north_africa', 'balkans'], 'Migração', 'Onda migratória', 'Nova onda de migrantes pressiona cidades de fronteira', 'warn', { long: [L('migration', 0.5, 120)], now: { treasury: -0.1 } }),
  V('cyber_attack_region', ['baltic', 'nordic', 'east_asia', 'central_europe', 'western_europe'], 'Segurança', 'Ataque cibernético', 'Ataque cibernético paralisa serviços públicos por horas', 'bad', { now: { intel: -1 }, long: [L('growth', -0.1, 30)] }),
  V('independence_day', ['central_asia', 'caucasus', 'baltic', 'balkans', 'subsaharan', 'caribbean'], 'Cultura', 'Dia da independência', 'Desfiles e festas lembram a independência nacional', 'good', { now: { legitimacy: 1.5 }, groups: { military: 2, youth: 1 } }),
  V('solar_wind_boom', ['iberia', 'north_africa', 'nordic', 'oceania', 'middle_east'], 'Energia', 'Recorde de energia renovável', 'Energia solar e eólica batem recordes de produção', 'good', { long: [L('s_energy', 2, 240), L('pollution', -0.5, 240)], groups: { youth: 2 } }),
  V('flood_rhine', ['western_europe', 'central_europe'], 'Desastre', 'Enchentes de rios europeus', 'Rios transbordam e alagam cidades históricas', 'bad', { now: { treasury: -0.2 }, groups: { rural: -2 } }),
  V('drought_south', ['southern_africa', 'southern_cone', 'iberia'], 'Clima', 'Seca prolongada', 'Seca prolongada reduz reservatórios e safras', 'bad', { long: [L('s_food', -4, 120), L('s_energy', -2, 120)], groups: { rural: -3 } }),
  V('earthquake_pacific', ['pacific_islands', 'east_asia', 'andes', 'central_america'], 'Desastre', 'Terremoto e tsunami', 'Terremoto no mar gera alerta de tsunami em todo o litoral', 'bad', { now: { treasury: -0.3 }, groups: { rural: -3 } }),
];

writeFileSync(out('issues_worldregions.json'), JSON.stringify(q, null, 1));
writeFileSync(out('events_worldregions.json'), JSON.stringify(events, null, 1));
const cp = out('content.json'); const c = JSON.parse(readFileSync(cp, 'utf8'));
if (!c.issues.includes('issues_worldregions')) c.issues.push('issues_worldregions');
if (!c.events.includes('events_worldregions')) c.events.push('events_worldregions');
writeFileSync(cp, JSON.stringify(c, null, 1));
console.log('questões:', q.length, '| eventos:', events.length);
