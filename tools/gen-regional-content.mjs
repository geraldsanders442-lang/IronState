// Gera as questões regionais (frio, América Latina, Europa) e as dos cenários mundiais.
// Uso: node tools/gen-regional-content.mjs   (reescreve data/issues_regional.json e data/issues_wscn.json)
import { writeFileSync, readFileSync } from 'node:fs';
const out = f => new URL('../data/' + f, import.meta.url);

const o = (text, hint, e = {}) => ({ text, hint, ...e });
const I = (id, cat, title, desc, context, cond, options, extra = {}) => ({ id, cat, title, desc, context, cond, w: 1, options, ...extra });
const COLD = { cold: true }, LATAM = { regions: ['south_america', 'central_america', 'caribbean'] }, EUR = { regions: ['europe', 'eastern_europe', 'balkans'] };

// ---------- Países frios ----------
const cold = [
  I('rg_cold_winter', 'Clima', 'O inverno mais duro em décadas', 'Uma onda polar derrubou as temperaturas a -35 °C. Aquecimento falha em bairros populares e a demanda por gás e lenha dispara.', 'Redes de energia e aquecimento no limite. Hospitais registram hipotermia e acidentes.', COLD, [
    o('Subsidiar o aquecimento e abrir abrigos.', 'Custa caro; evita mortes e protege o governo.', { now: { treasury: -0.35, qol: 1, legitimacy: 2 }, groups: { workers: 3, rural: 2 } }),
    o('Racionar energia da indústria para as casas.', 'Economia sofre, mas as famílias ficam aquecidas.', { now: { growth: -0.4, legitimacy: 1 }, groups: { business: -4, workers: 2 } }),
    o('Pedir que a população se vire.', 'Poupa o orçamento.', { now: { health: -2, legitimacy: -3 }, groups: { workers: -4, rural: -3 } })]),
  I('rg_cold_icebreakers', 'Infraestrutura', 'Portos congelados e rota polar', 'O gelo trava os portos do norte por meses. Empresas pedem quebra-gelos e uma rota marítima polar para escoar minérios e petróleo.', 'Investimento alto, retorno de longo prazo.', COLD, [
    o('Construir uma frota de quebra-gelos.', 'Abre rotas e dá prestígio estratégico.', { now: { treasury: -0.5, projection: 2 }, long: [{ k: 'exportAccess', v: 0.02, d: 0 }, { k: 'industry', v: 1, d: 0 }] }),
    o('Concessão a empresas privadas.', 'Menos custo; o Estado perde controle.', { now: { treasury: -0.1 }, groups: { business: 3 }, long: [{ k: 'growth', v: 0.1, d: 240 }] }),
    o('Adiar.', 'Sem gasto; o norte continua isolado.', { groups: { business: -2, regional: -3 } })]),
  I('rg_cold_permafrost', 'Meio ambiente', 'O permafrost cede', 'O solo congelado derrete: prédios racham, estradas afundam e oleodutos vazam. Cientistas falam em risco para cidades inteiras.', 'O problema só tende a crescer.', COLD, [
    o('Plano nacional de adaptação do norte.', 'Estacas, drenagem e relocação de vilas.', { now: { treasury: -0.4, pollution: -1 }, groups: { regional: 3 }, long: [{ k: 'infra', v: 1, d: 0 }] }),
    o('Reforçar só a infraestrutura de energia.', 'Evita vazamentos; vilas ficam à própria sorte.', { now: { treasury: -0.2 }, groups: { regional: -2 } }),
    o('Ignorar por ora.', 'Poupa dinheiro agora.', { now: { pollution: 2 }, groups: { regional: -4 } })]),
  I('rg_cold_herders', 'Povos', 'Pastores de renas contra a mineradora', 'Comunidades indígenas do norte bloqueiam uma nova mina que cruza as rotas de migração das renas. A empresa promete empregos; os líderes exigem consulta prévia.', 'Direitos de povos tradicionais x desenvolvimento.', COLD, [
    o('Respeitar a consulta e rever o projeto.', 'Atrasa a mina; fortalece direitos e a imagem externa.', { now: { reputation: 3, growth: -0.1 }, groups: { regional: 3, business: -3 } }),
    o('Autorizar com compensações e participação nos lucros.', 'Compromisso: mina avança com royalties locais.', { now: { treasury: 0.15 }, groups: { business: 3, regional: 1 }, long: [{ k: 'growth', v: 0.15, d: 365 }] }),
    o('Mandar a polícia liberar a estrada.', 'Mina segue; ressentimento e má imagem.', { now: { reputation: -4, civil: -2 }, groups: { business: 4, regional: -5 }, long: [{ k: 'separatism', v: 2, d: 240 }] })]),
  I('rg_cold_arctic_oil', 'Energia', 'Petróleo e gás no Ártico', 'Geólogos confirmam grandes reservas sob o mar gelado do norte. Explorar custa uma fortuna e ameaça um ecossistema frágil.', 'Os vizinhos árticos também observam.', { ...COLD, coast: true }, [
    o('Licitar blocos para petrolíferas.', 'Receitas futuras; risco de vazamentos.', { now: { treasury: 0.3, pollution: 2 }, groups: { business: 4 }, long: [{ k: 's_energy', v: 3, d: 0 }, { k: 'revenue', v: 0.15, d: 0 }] }),
    o('Explorar só com a estatal.', 'Mais controle e menos pressa.', { now: { treasury: -0.3 }, groups: { bureaucracy: 2 }, long: [{ k: 's_energy', v: 2, d: 0 }] }),
    o('Proteger a região por lei.', 'Reputação ambiental; empresários reclamam.', { now: { reputation: 3 }, groups: { business: -3, youth: 3 } })]),
  I('rg_cold_exodus', 'Demografia', 'Cidades do norte se esvaziam', 'Jovens deixam as cidades geladas rumo ao sul. Escolas fecham, hospitais perdem médicos e vilas inteiras viram fantasmas.', 'Prefeitos pedem incentivos.', COLD, [
    o('Bônus de “fronteira fria”: salários e impostos menores.', 'Fixa moradores; custa receita.', { now: { treasury: -0.3 }, groups: { regional: 4, workers: 2 }, long: [{ k: 'emigration', v: -0.3, d: 365 }] }),
    o('Concentrar serviços em poucos polos.', 'Mais eficiente; vilas perdem tudo.', { now: { treasury: 0.1 }, groups: { regional: -4 } }),
    o('Deixar o mercado decidir.', 'Sem custo; o norte encolhe.', { groups: { regional: -3 } })]),
  I('rg_cold_blizzard', 'Desastre', 'Nevasca isola uma região inteira', 'Uma nevasca de cinco dias cortou estradas, energia e comunicações no interior. Há comboios soterrados e vilarejos sem comida.', 'A resposta será lembrada.', COLD, [
    o('Mobilizar o exército e aviação para o resgate.', 'Salva vidas; mostra eficiência do Estado.', { now: { treasury: -0.2, legitimacy: 3, readiness: -2 }, groups: { military: 3, rural: 3 } }),
    o('Contar com defesa civil local.', 'Barato; dependente de sorte.', { now: { health: -1, legitimacy: -1 }, groups: { rural: -2 } }),
    o('Declarar luto e pedir ajuda externa.', 'Mostra fraqueza, mas traz parceiros.', { now: { reputation: 1 }, rel: { all: 1 } })]),
  I('rg_cold_aurora', 'Turismo', 'Turismo de aurora boreal', 'Agências estrangeiras querem pacotes de “luzes do norte”. Há quem queira uma base militar na mesma região, o que espantaria turistas.', 'Receita versus segurança.', COLD, [
    o('Apostar no turismo do Ártico.', 'Empregos locais e divisas.', { now: { treasury: -0.1, unemployment: -0.1 }, groups: { regional: 3, business: 2 }, long: [{ k: 'growth', v: 0.08, d: 365 }] }),
    o('Priorizar a base militar.', 'Defesa do flanco norte.', { now: { treasury: -0.2, defense: 2 }, groups: { military: 3 } }),
    o('Fazer as duas coisas em lugares diferentes.', 'Mais caro, mas todos ganham um pouco.', { now: { treasury: -0.3, defense: 1 }, groups: { regional: 2, military: 1 } })]),
  I('rg_cold_gas_pipe', 'Energia', 'Duto de gás para o sul', 'Um consórcio propõe um gasoduto de milhares de quilômetros ligando seus campos ao sul densamente povoado.', 'Receita certa; dependência do cliente.', COLD, [
    o('Aprovar com participação estatal.', 'Receita e influência sobre o comprador.', { now: { treasury: -0.4 }, long: [{ k: 'revenue', v: 0.2, d: 0 }, { k: 'exportAccess', v: 0.015, d: 0 }], groups: { business: 3, bureaucracy: 2 } }),
    o('Deixar o setor privado fazer.', 'Mais barato, menos controle.', { now: { treasury: -0.05 }, groups: { business: 4 } }),
    o('Recusar: gás é patrimônio nacional.', 'Soberania; renúncia de receita.', { groups: { business: -3, youth: 1 } })]),
  I('rg_cold_fuel', 'Sociedade', 'Lenha, carvão e a fumaça de inverno', 'No inverno, milhões queimam lenha e carvão para se aquecer. A poluição urbana dispara e hospitais enchem de casos respiratórios.', 'Alternativas custam dinheiro.', COLD, [
    o('Subsidiar aquecimento elétrico e centrais urbanas.', 'Ar limpo e custo alto.', { now: { treasury: -0.35, pollution: -2, health: 1 }, groups: { youth: 2, workers: 1 } }),
    o('Proibir carvão em cidades.', 'Barato, mas o povo sente frio.', { now: { pollution: -2, legitimacy: -2 }, groups: { workers: -3, rural: -3 } }),
    o('Manter como está.', 'Sem custo; saúde sofre.', { now: { health: -1, pollution: 1 } })]),
  I('rg_cold_sea_route', 'Geopolítica', 'O gelo derrete e abre uma rota marítima', 'Com o degelo, uma rota ártica encurta viagens entre a Ásia e a Europa. Vizinhos disputam o direito de cobrar pedágio e patrulhar.', 'Oportunidade e disputa.', { ...COLD, coast: true }, [
    o('Cobrar pedágio e patrulhar com a marinha.', 'Receita e tensão com rivais.', { now: { treasury: 0.2, projection: 2 }, rel: { neighbors: -3 }, groups: { military: 3 } }),
    o('Propor um regime internacional de navegação.', 'Estabilidade e prestígio, menos receita.', { now: { reputation: 3 }, rel: { all: 1 } }),
    o('Ignorar a rota.', 'Perde oportunidade.', {})]),
  I('rg_cold_darkness', 'Saúde', 'A longa noite polar', 'Meses de pouca luz elevam depressão e suicídios. Psicólogos pedem programas de saúde mental e luz terapêutica.', 'Impacto silencioso e real.', COLD, [
    o('Rede de saúde mental e luz terapêutica nas escolas.', 'Barato e eficaz.', { now: { treasury: -0.15, health: 1.5, qol: 1 }, groups: { youth: 3, workers: 2 } }),
    o('Campanha pública de esportes de inverno.', 'Popular e saudável; efeito limitado.', { now: { treasury: -0.05, health: 0.5 }, groups: { youth: 2 } }),
    o('Não é prioridade.', 'Sem gasto.', { now: { health: -1 }, groups: { youth: -2 } })]),
];

// ---------- América Latina e Caribe ----------
const latam = [
  I('rg_lat_caudillo', 'Política', 'Um caudilho local desafia a capital', 'O governador de uma região rica em soja e minério se apresenta como “o único que entrega resultados” e conta com milícias leais.', 'A tradição de caudilhos é forte; a lealdade das províncias conta.', LATAM, [
    o('Negociar: mais verbas em troca de lealdade.', 'Compra paz e fortalece o regionalismo.', { now: { treasury: -0.3, coupRisk: -2 }, groups: { regional: 4 }, long: [{ k: 'separatism', v: 1, d: 365 }] }),
    o('Intervir na província.', 'Mostra autoridade; risco de crise.', { now: { control: 3, legitimacy: -2, coupRisk: 2 }, groups: { regional: -6, military: 2 } }),
    o('Cooptar com um ministério.', 'Rouba o discurso, ao custo de poder.', { now: { corruption: 1.5 }, groups: { regional: 3, bureaucracy: 2 } })]),
  I('rg_lat_cartel', 'Segurança', 'Cartéis tomam uma fronteira', 'Facções do narcotráfico controlam estradas, prefeituras e portos de uma região de fronteira. Policiais desaparecem, empresários pagam “pedágio”.', 'Guerra às drogas ou política alternativa?', LATAM, [
    o('Ofensiva militar contra os cartéis.', 'Resultados rápidos e baixas.', { now: { crime: -2, control: 3, civil: -1, reputation: -1 }, groups: { military: 4, youth: -2 }, long: [{ k: 'repression', v: 1, d: 180 }] }),
    o('Combinar polícia federal, inteligência e programas sociais.', 'Lento e caro; menos violência.', { now: { treasury: -0.4, crime: -1 }, groups: { workers: 3, youth: 2 }, long: [{ k: 'crime', v: -1, d: 365 }] }),
    o('Negociar a “pacificação” com as facções.', 'Calma aparente; corrupção e vergonha.', { now: { crime: -1, corruption: 3, legitimacy: -3 }, groups: { military: -3 } })]),
  I('rg_lat_land', 'Economia', 'A reforma agrária volta à pauta', 'Movimentos camponeses ocupam fazendas improdutivas. Proprietários exigem despejo; o campo ferve.', 'Questão histórica da região.', LATAM, [
    o('Desapropriar e assentar famílias.', 'Reduz desigualdade; fere o agronegócio.', { now: { inequality: -1.5, poverty: -0.8 }, groups: { rural: 5, business: -5, military: -1 } }),
    o('Crédito e titulação sem desapropriação.', 'Gradual, menos conflito.', { now: { treasury: -0.25, poverty: -0.4 }, groups: { rural: 3, business: -1 } }),
    o('Despejar as ocupações.', 'Defende a propriedade.', { now: { civil: -1, legitimacy: -1 }, groups: { business: 4, rural: -5 }, long: [{ k: 'opposition', v: 2, d: 240 }] })]),
  I('rg_lat_hurricane', 'Desastre', 'Temporada de furacões', 'Um furacão devasta a costa: casas destruídas, plantações perdidas e portos fechados. Governadores pedem verba de emergência.', 'A capacidade de resposta é a prova de fogo.', { regions: ['central_america', 'caribbean'], coast: true }, [
    o('Fundo de emergência e reconstrução.', 'Caro e bem visto.', { now: { treasury: -0.5, legitimacy: 3, qol: 1 }, groups: { rural: 3, workers: 3 } }),
    o('Pedir ajuda internacional.', 'Barato; traz doadores e influência de terceiros.', { now: { treasury: -0.1, reputation: 1 }, rel: { all: 2 } }),
    o('Cada município por si.', 'Poupa recursos.', { now: { legitimacy: -4, poverty: 0.5 }, groups: { rural: -4 } })]),
  I('rg_lat_lithium', 'Recursos', 'A febre do lítio e dos metais raros', 'Multinacionais correm para os salares e as montanhas. Comunidades indígenas denunciam a água sugada e pedem royalties.', 'Soberania sobre recursos é tema quente.', LATAM, [
    o('Estatizar a exploração.', 'Controle e receitas; investidores recuam.', { now: { treasury: -0.3 }, groups: { bureaucracy: 3, business: -4, workers: 2 }, long: [{ k: 'revenue', v: 0.2, d: 0 }] }),
    o('Concessão com royalties e cota de processamento local.', 'Equilíbrio; mais indústria.', { now: { treasury: 0.1 }, groups: { business: 2, regional: 2 }, long: [{ k: 'industry', v: 1.5, d: 0 }] }),
    o('Abrir à iniciativa privada.', 'Investimento rápido, retorno local menor.', { now: { treasury: 0.25, pollution: 1.5 }, groups: { business: 5, regional: -3 } })]),
  I('rg_lat_imf', 'Economia', 'O FMI bate à porta de novo', 'A inflação e a dívida em dólar fizeram o país procurar socorro. O Fundo oferece crédito com ajuste fiscal duro.', 'Memória de crises passadas pesa.', LATAM, [
    o('Aceitar o pacote.', 'Entra dinheiro; cortes e protestos.', { now: { treasury: 0.6, reputation: 2, inflation: -0.8 }, groups: { workers: -5, youth: -3, business: 3 }, long: [{ k: 'protest', v: 3, d: 180 }] }),
    o('Reestruturar a dívida por conta própria.', 'Mais soberania e risco.', { now: { reputation: -3, inflation: 0.3 }, groups: { business: -2, workers: 1 } }),
    o('Rejeitar e buscar crédito na China ou em bancos regionais.', 'Evita o ajuste; muda parceiros.', { now: { treasury: 0.3 }, rel: { west: -3, china: 4 } })]),
  I('rg_lat_remit', 'Economia', 'Remessas de emigrantes sustentam as famílias', 'Parentes no exterior enviam bilhões, mas a fuga de jovens preocupa. Alguns propõem taxar remessas; outros querem um fundo de investimento da diáspora.', 'Fonte de divisas e vulnerabilidade.', LATAM, [
    o('Fundo de investimento da diáspora.', 'Atrai capital para as vilas.', { now: { treasury: -0.1 }, long: [{ k: 'growth', v: 0.15, d: 365 }], groups: { rural: 3 } }),
    o('Tributar remessas.', 'Receita fácil; revolta.', { now: { treasury: 0.2 }, groups: { rural: -5, workers: -3 } }),
    o('Não mexer.', 'Mantém tudo.', {})]),
  I('rg_lat_caravan', 'Migração', 'Caravana de migrantes na fronteira', 'Milhares de pessoas atravessam o país rumo ao norte, fugindo de crise e violência. Cidades de passagem pedem apoio.', 'A região é corredor migratório.', LATAM, [
    o('Corredor humanitário e vistos temporários.', 'Imagem humanitária; custo.', { now: { treasury: -0.25, reputation: 3 }, groups: { youth: 2, workers: -1 } }),
    o('Fechar a fronteira com tropas.', 'Satisfaz vizinhos ricos; tensão e denúncias.', { now: { reputation: -3, civil: -1 }, rel: { usa: 3 }, groups: { military: 2, youth: -2 } }),
    o('Negociar com os países de origem e destino.', 'Lento, mas sustentável.', { now: { treasury: -0.1, reputation: 1 }, rel: { neighbors: 2 } })]),
  I('rg_lat_stadium', 'Cultura', 'A Copa e o estádio de bilhões', 'O país disputa sediar um torneio de futebol. A paixão nacional é enorme; os custos de estádios também.', 'Prestígio ou elefante branco.', LATAM, [
    o('Candidatar-se e construir estádios.', 'Orgulho e dívidas.', { now: { treasury: -0.6, legitimacy: 3, reputation: 2 }, groups: { youth: 3, workers: 2, business: 2 }, long: [{ k: 'corruption', v: 1.5, d: 240 }] }),
    o('Sediar com estádios existentes.', 'Barato; menos glamour.', { now: { treasury: -0.15, legitimacy: 1 }, groups: { youth: 2 } }),
    o('Recusar: saúde e escolas primeiro.', 'Prioridade social; críticas dos torcedores.', { now: { legitimacy: 1 }, groups: { youth: -2, workers: 1 } })]),
  I('rg_lat_church', 'Sociedade', 'Católicos e evangélicos disputam a moral pública', 'Igrejas mobilizam multidões por leis de costumes, escolas e rádios. O Congresso se divide.', 'Os líderes religiosos têm voto e microfone.', LATAM, [
    o('Apoiar a agenda conservadora das igrejas.', 'Base fiel; jovens e liberais se afastam.', { now: { civil: -1.5 }, groups: { rural: 4, youth: -5, opposition: -1 } }),
    o('Defender o Estado laico.', 'Aplaudido pelos jovens; igrejas mobilizam fiéis contra o governo.', { now: { civil: 1 }, groups: { youth: 4, rural: -4, opposition: 1 } }),
    o('Conciliar com ministérios para cada fé.', 'Alívio temporário, custo político.', { now: { treasury: -0.05 }, groups: { rural: 1, youth: -1 } })]),
  I('rg_lat_dam', 'Energia', 'A hidrelétrica binacional e o preço da energia', 'O vizinho exige renegociar o tratado da grande usina binacional e cobra um preço mais alto pela energia.', 'Questão de soberania e contas.', LATAM, [
    o('Aceitar um novo preço.', 'Evita crise; encarece energia.', { now: { treasury: -0.2 }, rel: { neighbors: 4 } }),
    o('Manter o tratado a qualquer custo.', 'Soberania e atrito.', { rel: { neighbors: -5 }, groups: { military: 2 } }),
    o('Levar a uma arbitragem internacional.', 'Lento, desgastante, respeitado.', { now: { reputation: 1 }, rel: { neighbors: -1 } })]),
  I('rg_lat_guerrilla', 'Segurança', 'Proposta de paz com a guerrilha', 'Uma guerrilha antiga, com bases na selva, aceita negociar desarmamento em troca de terras, anistia e cadeiras no Congresso.', 'Paz exige concessões amargas.', LATAM, [
    o('Assinar o acordo de paz.', 'Reduz a violência; opinião dividida.', { now: { crime: -1, stability: 2, legitimacy: -1 }, groups: { military: -3, rural: 3, youth: 2 }, long: [{ k: 'protest', v: -1, d: 240 }] }),
    o('Seguir a ofensiva militar.', 'Mantém a linha dura; guerra longa.', { now: { warWeariness: 2, readiness: 1 }, groups: { military: 4, rural: -2 } }),
    o('Cessar-fogo e referendo sobre o acordo.', 'Legitima, mas arrisca o povo dizer não.', { now: { legitimacy: 1 }, groups: { youth: 1 } })]),
  I('rg_lat_default', 'Economia', 'Calote seletivo da dívida', 'Credores externos exigem pagamento; a população exige escolas e hospitais. Um calote parcial divide o gabinete.', 'Memória de moratórias passadas.', { regions: ['south_america', 'central_america'] }, [
    o('Pagar tudo em dia.', 'Credibilidade; cortes de gastos.', { now: { treasury: -0.5, reputation: 2 }, groups: { workers: -2, business: 3 } }),
    o('Moratória parcial e renegociação.', 'Fôlego imediato; juros sobem.', { now: { treasury: 0.4, reputation: -4 }, long: [{ k: 'creditLimit', v: -0.08, d: 365 }], groups: { workers: 2 } }),
    o('Auditoria da dívida e suspensão do pagamento.', 'Soberania; sanções financeiras.', { now: { treasury: 0.6, reputation: -7 }, rel: { west: -4 }, groups: { youth: 3, business: -4 } })]),
];

// ---------- Europa ----------
const europe = [
  I('rg_eu_gas', 'Energia', 'Crise do gás e a dependência do vizinho', 'O principal fornecedor de gás ameaça fechar as torneiras. Preços sobem e indústrias param.', 'A Europa depende de poucos gasodutos.', EUR, [
    o('Buscar fornecedores alternativos e GNL.', 'Mais caro, mais seguro.', { now: { treasury: -0.4 }, long: [{ k: 's_energy', v: 2, d: 0 }] }),
    o('Acelerar renováveis e nucleares.', 'Mudança estrutural de longo prazo.', { now: { treasury: -0.3 }, groups: { youth: 2 }, long: [{ k: 's_energy', v: 3, d: 0 }, { k: 'pollution', v: -1, d: 0 }] }),
    o('Ceder às condições do fornecedor.', 'Alívio imediato e dependência política.', { now: { treasury: -0.1 }, rel: { russia: 3, west: -2 }, groups: { business: 2 } })]),
  I('rg_eu_refugees', 'Migração', 'Cotas de refugiados e a fronteira aberta', 'Bruxelas e vizinhos discutem um mecanismo de cotas de refugiados. Prefeitos pedem apoio; partidos populistas ganham voz.', 'O debate ocupa os noticiários.', EUR, [
    o('Aceitar a cota e investir em integração.', 'Imagem europeia; custos e tensão local.', { now: { treasury: -0.25, reputation: 3 }, groups: { youth: 2, workers: -2, rural: -3 } }),
    o('Bloquear com cercas e controle de fronteira.', 'Satisfaz o eleitorado duro; atrito com a UE.', { now: { reputation: -3, civil: -1 }, groups: { rural: 3, military: 2, youth: -3 }, rel: { west: -2 } }),
    o('Apoiar acordos com países de origem.', 'Meio-termo diplomático.', { now: { treasury: -0.1 }, rel: { all: 1 } })]),
  I('rg_eu_referendum', 'Política', 'Referendo sobre integração europeia', 'Euroentusiastas e eurocéticos reúnem assinaturas: o povo quer decidir se aprofunda, mantém ou reduz a integração.', 'Decisão de longo alcance.', EUR, [
    o('Convocar o referendo.', 'Legitimidade e risco; resultado imprevisível.', { now: { legitimacy: 2, reputation: 1 }, groups: { youth: 2, opposition: 2 } }),
    o('Vetar o referendo por razões técnicas.', 'Evita o risco; revolta e acusações de autoritarismo.', { now: { legitimacy: -3, civil: -1 }, groups: { opposition: -3, youth: -3 } }),
    o('Negociar um novo acordo com Bruxelas antes.', 'Ganha tempo e concessões.', { now: { treasury: -0.05, reputation: 1 } })]),
  I('rg_eu_aging', 'Sociedade', 'Envelhecimento e greves por pensões', 'A população envelhece rápido. O governo quer elevar a idade de aposentadoria; sindicatos paralisam o transporte.', 'Todo europeu conhece essa briga.', EUR, [
    o('Reformar a previdência.', 'Salva as contas; greves e protestos.', { now: { treasury: 0.4, protest: 3 }, groups: { workers: -6, youth: 1, business: 3 } }),
    o('Preservar as regras e aumentar contribuições.', 'Paz social; pressão sobre quem trabalha.', { now: { treasury: 0.15 }, groups: { workers: 2, business: -3 } }),
    o('Estimular imigração e natalidade.', 'Solução de longo prazo, polêmica.', { now: { treasury: -0.2 }, groups: { rural: -2, youth: 1 }, long: [{ k: 'laborSupply', v: 0.3, d: 0 }] })]),
  I('rg_eu_farmers', 'Economia', 'Tratores bloqueiam a capital', 'Agricultores protestam contra regras ambientais, importações baratas e burocracia. Comboios de tratores param avenidas.', 'Apoio popular amplo ao campo.', EUR, [
    o('Ceder: subsídios e exceções ambientais.', 'Acalma o campo; contas e meio ambiente pagam.', { now: { treasury: -0.3, pollution: 1 }, groups: { rural: 6, youth: -2 } }),
    o('Manter as regras e abrir diálogo.', 'Firmeza; protestos continuam.', { now: { legitimacy: -1 }, groups: { rural: -3, youth: 2 } }),
    o('Proteger a produção com tarifas.', 'Agradece ao campo; atrito comercial.', { now: { treasury: 0.1 }, rel: { all: -1 }, groups: { rural: 4, business: -2 } })]),
  I('rg_eu_language', 'Minorias', 'Língua e autonomia de uma minoria histórica', 'Uma região de língua própria pede escola, mídia e tribunais no idioma local, e mais controle dos impostos.', 'Como outras regiões na Europa.', EUR, [
    o('Conceder estatuto de autonomia cultural.', 'Reduz tensão; dá precedente.', { now: { civil: 1.5 }, groups: { regional: 5, military: -1 }, long: [{ k: 'separatism', v: -3, d: 365 }] }),
    o('Reconhecer a língua, sem autonomia fiscal.', 'Meio-termo.', { groups: { regional: 2 }, long: [{ k: 'separatism', v: -1, d: 240 }] }),
    o('Rejeitar: um Estado, uma língua.', 'Satisfaz nacionalistas; ressentimento.', { now: { civil: -1 }, groups: { regional: -5, military: 1 }, long: [{ k: 'separatism', v: 3, d: 365 }] })]),
  I('rg_eu_tourism', 'Turismo', 'Turismo de massa sufoca o centro histórico', 'Moradores se queixam de aluguéis, barulho e cruzeiros que despejam milhares de visitantes por dia.', 'Dilema entre renda e qualidade de vida.', EUR, [
    o('Cobrar taxa turística e limitar cruzeiros.', 'Preserva a cidade; setor reclama.', { now: { treasury: 0.15 }, groups: { business: -3, workers: 2 } }),
    o('Incentivar mais turismo.', 'Receita e empregos; tensão local.', { now: { treasury: 0.2, unemployment: -0.1 }, groups: { business: 3, workers: -1, youth: -1 } }),
    o('Deixar prefeituras decidirem.', 'Solução local.', { groups: { regional: 2 } })]),
  I('rg_eu_populists', 'Política', 'Partidos antissistema crescem nas pesquisas', 'Um partido populista promete “limpar o establishment” e cresce com o voto jovem e o dos descontentes. Os partidos tradicionais debatem um cordão sanitário.', 'Polarização crescente.', EUR, [
    o('Isolar o partido em coalizão de centro.', 'Preserva instituições; alimenta o discurso antielite.', { now: { stability: 1 }, groups: { opposition: 3, youth: -1 } }),
    o('Absorver parte da agenda deles.', 'Tira votos; normaliza as ideias.', { now: { civil: -1 }, groups: { rural: 3, youth: -2 } }),
    o('Reformar o que gera ressentimento (habitação, custo de vida).', 'Resolve a causa; demanda tempo e dinheiro.', { now: { treasury: -0.3, poverty: -0.2 }, groups: { workers: 3, youth: 2 } })]),
  I('rg_eu_nato', 'Defesa', 'A meta de gastar mais com defesa', 'Aliados cobram que o país eleve os gastos militares e entregue tropas à aliança regional. Contribuintes preferem escolas.', 'Pressão externa cada vez maior.', EUR, [
    o('Aumentar o orçamento de defesa.', 'Aliados satisfeitos; menos verba social.', { now: { treasury: -0.5, readiness: 3, equipment: 2 }, groups: { military: 5, workers: -2 }, rel: { west: 4 } }),
    o('Contribuição simbólica e cibersegurança.', 'Baixo custo.', { now: { treasury: -0.1, intel: 2 }, rel: { west: 1 } }),
    o('Recusar: neutralidade ativa.', 'Autonomia; aliados desconfiam.', { rel: { west: -4 }, groups: { military: -2, youth: 2 } })]),
  I('rg_eu_brain', 'Economia', 'Fuga de cérebros para o oeste', 'Engenheiros e médicos emigram para países mais ricos. Hospitais e empresas de tecnologia reclamam da falta de profissionais.', 'Mercado de trabalho europeu aberto.', EUR, [
    o('Programa de retenção: salários e moradia.', 'Segura talentos; custa caro.', { now: { treasury: -0.35 }, long: [{ k: 'emigration', v: -0.4, d: 365 }, { k: 'productivity', v: 0.5, d: 0 }], groups: { youth: 3 } }),
    o('Contrapartida: exigir anos de serviço.', 'Barato; impopular.', { now: { civil: -0.5 }, groups: { youth: -4 } }),
    o('Aceitar como parte da integração.', 'Remessas compensam um pouco.', { long: [{ k: 'tech', v: -0.5, d: 0 }] })]),
  I('rg_eu_memory', 'Cultura', 'Estátuas e memória histórica', 'Monumentos de um passado controverso viram alvo de protestos e contraprotestos. A vizinhança reage a cada decisão.', 'História mal resolvida.', EUR, [
    o('Remover os monumentos e abrir um museu da memória.', 'Reconciliação com algumas minorias; nacionalistas reagem.', { now: { civil: 1 }, groups: { youth: 3, military: -2 }, rel: { neighbors: 1 } }),
    o('Manter com placas explicativas.', 'Meio-termo.', { groups: { youth: 1 } }),
    o('Proteger os monumentos por lei.', 'Satisfaz a base tradicional.', { groups: { rural: 3, youth: -3 }, rel: { neighbors: -2 } })]),
  I('rg_eu_nuclear', 'Energia', 'Usinas nucleares: fechar ou ampliar', 'Os verdes querem desligar as usinas; a indústria teme apagões e alta de preços. Uma central antiga apresenta falhas.', 'Escolha energética de uma geração.', EUR, [
    o('Ampliar a energia nuclear.', 'Estabilidade e menos carbono; risco e custo.', { now: { treasury: -0.5 }, long: [{ k: 's_energy', v: 3, d: 0 }, { k: 'pollution', v: -1, d: 0 }], groups: { business: 3, youth: -2 } }),
    o('Fechar gradualmente as usinas.', 'Apoio ambientalista; dependência de gás.', { now: { treasury: -0.2 }, long: [{ k: 's_energy', v: -2, d: 365 }], groups: { youth: 3, business: -2 } }),
    o('Prorrogar a vida útil e investir em renováveis.', 'Transição pragmática.', { now: { treasury: -0.3 }, long: [{ k: 's_energy', v: 1.5, d: 0 }] })]),
];

// ---------- Cenários mundiais: eventos próprios ----------
const W = (s) => ({ wscn: s });
const wscn = [
  // Mundo Vermelho
  I('ws_red_comintern', 'Mundo Vermelho', 'O Comintern convoca um congresso', 'A Internacional Socialista reúne partidos de todo o mundo. Delegados querem definir a linha: revolução permanente ou coexistência com os poucos Estados capitalistas.', 'No Mundo Vermelho, quase todo país tem um partido-Estado socialista.', W('red_world'), [
    o('Defender a linha de coexistência.', 'Paz e comércio; ala dura reclama.', { now: { reputation: 2 }, rel: { west: 3, east: -1 }, groups: { military: -2 } }),
    o('Apoiar a revolução permanente.', 'Prestígio entre os radicais; tensão com os capitalistas.', { now: { influence: 2 }, rel: { west: -6, east: 4 }, groups: { youth: 2, military: 2 } }),
    o('Manter distância do congresso.', 'Neutralidade e solidão.', { now: { influence: -1 } })], { cd: 300 }),
  I('ws_red_plan', 'Mundo Vermelho', 'O Plano Quinquenal da Internacional', 'Moscou, Pequim e outras capitais propõem metas de produção coordenadas e divisão do trabalho entre os países-irmãos.', 'Planejamento supranacional: ganhos e perda de autonomia.', W('red_world'), [
    o('Aderir ao plano coordenado.', 'Crédito e mercados garantidos entre irmãos.', { now: { treasury: 0.2, industry: 1 }, groups: { workers: 3, business: -3 }, long: [{ k: 'exportAccess', v: 0.02, d: 0 }] }),
    o('Seguir plano próprio.', 'Autonomia; menos benefícios.', { now: { influence: 1 }, groups: { bureaucracy: 2 } }),
    o('Pedir regras de mercado dentro do plano.', 'Hibridismo; irrita ortodoxos.', { now: { growth: 0.2 }, groups: { business: 2, workers: -1 }, rel: { east: -2 } })], { cd: 360 }),
  I('ws_red_defector', 'Mundo Vermelho', 'Dissidente pede asilo', 'Um economista do partido, acusado de “desvio revisionista” em país vizinho, pede asilo e promete revelar números reais da produção.', 'O vizinho exige a devolução.', W('red_world'), [
    o('Conceder asilo.', 'Princípios; fricção com o vizinho.', { now: { reputation: 2 }, rel: { neighbors: -5 }, groups: { youth: 2 } }),
    o('Devolver o dissidente.', 'Solidariedade entre partidos; imagem manchada.', { now: { reputation: -3, civil: -1 }, rel: { neighbors: 4 } }),
    o('Expulsá-lo discretamente a um país neutro.', 'Evita o problema.', { rel: { neighbors: 1 } })], { cd: 300 }),
  I('ws_red_capitalist', 'Mundo Vermelho', 'O enclave capitalista oferece acordos', 'Um dos poucos Estados de mercado, rico e isolado, propõe comércio e investimento. O partido discute se o lucro é inimigo ou ferramenta.', 'Raros e ricos: tentadores para os pragmáticos.', W('red_world'), [
    o('Fechar o acordo comercial.', 'Divisas e tecnologia; críticas ideológicas.', { now: { treasury: 0.3, tech: 1 }, groups: { business: 3, workers: -1 }, rel: { east: -2, west: 3 } }),
    o('Recusar: não comerciamos com o capital.', 'Pureza ideológica; economia perde.', { now: { growth: -0.1 }, rel: { east: 2 }, groups: { military: 1 } }),
    o('Criar zonas econômicas especiais.', 'Ensaio controlado.', { now: { treasury: 0.15 }, long: [{ k: 'growth', v: 0.1, d: 365 }], groups: { business: 2 } })], { cd: 360 }),
  I('ws_red_schism', 'Mundo Vermelho', 'Cisma entre as potências do campo socialista', 'Duas grandes potências socialistas disputam a liderança do movimento. Cada uma exige que você condene a outra.', 'Um mundo de partidos-irmãos também tem rivalidades.', W('red_world'), [
    o('Alinhar-se à potência mais próxima.', 'Proteção e dependência.', { now: { defense: 2 }, rel: { east: 3 }, groups: { military: 2 } }),
    o('Defender a unidade e mediar.', 'Prestígio; ninguém gosta de mediadores.', { now: { reputation: 2, influence: 1 } }),
    o('Declarar-se não alinhado.', 'Liberdade e exposição.', { now: { influence: 1 }, rel: { east: -2 } })], { cd: 400 }),
  // Mundo Imperialista
  I('ws_imp_berlin', 'Mundo Imperialista', 'A Conferência da partilha', 'As grandes potências convocam uma conferência para dividir esferas de influência no mundo. Seu país é convidado como possível parceiro júnior.', 'Num mundo imperial, quem não está à mesa está no menu.', W('imperial_world'), [
    o('Reivindicar uma esfera de influência.', 'Prestígio, rivalidade e risco de choque.', { now: { influence: 3, reputation: -2 }, rel: { neighbors: -4 }, groups: { military: 3 } }),
    o('Aceitar o protetorado de uma potência.', 'Segurança e perda de autonomia.', { now: { defense: 3, influence: -2 }, rel: { all: 2 }, groups: { military: -1, bureaucracy: 1 } }),
    o('Defender a integridade territorial dos fracos.', 'Honra; ninguém ouve.', { now: { reputation: 3 }, rel: { all: -1 } })], { cd: 300 }),
  I('ws_imp_arms', 'Mundo Imperialista', 'Corrida armamentista de encouraçados', 'Os estaleiros imperiais lançam novos encouraçados e os orçamentos navais explodem. Sua marinha é pequena demais.', 'A frota mede o prestígio imperial.', W('imperial_world'), [
    o('Construir uma frota moderna.', 'Respeito e dívida.', { now: { treasury: -0.7, projection: 4, equipment: 2 }, groups: { military: 5, business: 2 } }),
    o('Comprar navios usados de uma potência.', 'Barato; dependência.', { now: { treasury: -0.3, projection: 2 }, rel: { west: 2 } }),
    o('Priorizar o exército e a defesa costeira.', 'Defensivo e econômico.', { now: { treasury: -0.2, defense: 3 }, groups: { military: 2 } })], { cd: 280, cond: { wscn: 'imperial_world', coast: true } }),
  I('ws_imp_colony', 'Mundo Imperialista', 'Revolta colonial', 'Um território sob seu protetorado se levanta contra a metrópole. Jornais exigem esmagar; liberais exigem autonomia.', 'Impérios caem pelas periferias.', W('imperial_world'), [
    o('Esmagar a revolta.', 'Ordem e má imagem.', { now: { control: 3, reputation: -3, civil: -1 }, groups: { military: 3, regional: -4 } }),
    o('Oferecer autonomia sob o império.', 'Esfria a revolta; precedente.', { now: { control: -1 }, groups: { regional: 4, military: -2 }, long: [{ k: 'separatism', v: -2, d: 365 }] }),
    o('Conceder independência negociada.', 'Fim honroso; perda de prestígio.', { now: { reputation: 3, influence: -2 }, groups: { military: -4, youth: 2 } })], { cd: 300 }),
  I('ws_imp_ultimatum', 'Mundo Imperialista', 'Ultimato de uma potência', 'Um império vizinho exige concessões comerciais, portos e passagem de tropas. A recusa é considerada ofensa.', 'A diplomacia das canhoneiras está de volta.', W('imperial_world'), [
    o('Ceder em parte.', 'Evita guerra; humilhação.', { now: { legitimacy: -3, reputation: -1 }, rel: { neighbors: 4 }, groups: { military: -2 } }),
    o('Recusar e mobilizar.', 'Orgulho nacional; risco de guerra.', { now: { legitimacy: 3, readiness: 3 }, rel: { neighbors: -8 }, groups: { military: 4 } }),
    o('Buscar proteção de outro império.', 'Equilíbrio; troca de patrão.', { now: { defense: 2 }, rel: { all: -2 } })], { cd: 360 }),
  I('ws_imp_democrats', 'Mundo Imperialista', 'Reformistas pedem constituição', 'Intelectuais e comerciantes exigem uma constituição e um parlamento. Num mundo onde nenhum Estado é democrático, a ideia é subversiva.', 'Quem ousa pedir liberdade?', W('imperial_world'), [
    o('Reprimir os reformistas.', 'Mantém o trono; fortalece a clandestinidade.', { now: { civil: -2, stability: 1 }, groups: { opposition: -4, youth: -3 }, long: [{ k: 'revoRisk', v: 2, d: 240 }] }),
    o('Conceder uma carta limitada.', 'Válvula de escape.', { now: { civil: 1.5, political: 1 }, groups: { opposition: 3, military: -2 } }),
    o('Cooptar os líderes com títulos.', 'Desarma por ora.', { now: { corruption: 1 }, groups: { business: 2, opposition: 1 } })], { cd: 340 }),
  // Fim da História (liberal)
  I('ws_lib_summit', 'Mundo Liberal', 'Cúpula das Democracias', 'As democracias do mundo convidam todos a assinar a Carta de Liberdades. Quem não assina será “convidado a reformar-se”.', 'No mundo unipolar liberal, a legitimidade vem do voto.', W('liberal_world'), [
    o('Assinar a Carta e abrir o regime.', 'Aceitação e investimentos; perda de controle.', { now: { civil: 3, political: 3, reputation: 4 }, groups: { youth: 4, opposition: 3, military: -2 }, rel: { all: 4 } }),
    o('Assinar com reservas.', 'Meio-termo diplomático.', { now: { civil: 1, reputation: 1 }, rel: { all: 1 } }),
    o('Recusar a Carta.', 'Soberania e isolamento.', { now: { reputation: -5 }, rel: { all: -4, west: -4 }, groups: { military: 2 } })], { cd: 320 }),
  I('ws_lib_sanction', 'Mundo Liberal', 'Sanções por “déficit democrático”', 'Organismos internacionais ameaçam cortar crédito e comércio caso o país não realize eleições livres monitoradas.', 'A pressão vem de todo lado.', { wscn: 'liberal_world', max: { political: 55 } }, [
    o('Permitir observadores e eleições.', 'Alívio e risco de perder o poder.', { now: { political: 3, reputation: 3 }, groups: { opposition: 5, youth: 3 } }),
    o('Reformas cosméticas.', 'Compra tempo; credibilidade em jogo.', { now: { political: 0.5, reputation: 0 }, rel: { all: -1 } }),
    o('Enfrentar as sanções.', 'Orgulho e dificuldades.', { now: { growth: -0.4, reputation: -3 }, groups: { military: 2, business: -3 } })], { cd: 300 }),
  I('ws_lib_ngo', 'Mundo Liberal', 'ONGs globais e financiamento político', 'Fundações estrangeiras financiam organizações da sociedade civil, jornais e partidos de oposição no país.', 'Defesa da democracia ou interferência?', W('liberal_world'), [
    o('Aceitar e transparência.', 'Credibilidade; oposição cresce.', { now: { civil: 1, reputation: 2 }, groups: { opposition: 3, youth: 2 } }),
    o('Lei de agentes estrangeiros.', 'Sufoca financiamentos; imagem manchada.', { now: { civil: -2, reputation: -3 }, groups: { opposition: -3 } }),
    o('Criar fundo estatal concorrente.', 'Disputa narrativa.', { now: { treasury: -0.15 }, groups: { bureaucracy: 2 } })], { cd: 300 }),
  I('ws_lib_trade', 'Mundo Liberal', 'Tratado global de livre comércio', 'Todas as grandes democracias assinam um mercado comum global. Quem entrar corta tarifas e subsídios.', 'Abertura total: oportunidades e dores.', W('liberal_world'), [
    o('Aderir ao tratado.', 'Exportações sobem; indústria local sofre.', { now: { treasury: 0.1 }, long: [{ k: 'exportAccess', v: 0.05, d: 0 }, { k: 'importAccess', v: 0.05, d: 0 }, { k: 'industry', v: -1, d: 0 }], groups: { business: 4, workers: -4 } }),
    o('Aderir com cláusulas de proteção.', 'Equilíbrio.', { long: [{ k: 'exportAccess', v: 0.025, d: 0 }], groups: { business: 1, workers: -1 } }),
    o('Ficar de fora.', 'Protege a indústria; perde mercados.', { long: [{ k: 'exportAccess', v: -0.03, d: 365 }], groups: { workers: 2, business: -3 } })], { cd: 360 }),
  // Mundo Teocrático
  I('ws_theo_synod', 'Mundo Teocrático', 'O Sínodo Universal da fé', 'Os grandes líderes religiosos convocam um concílio para decidir o calendário, as leis morais e a partilha das terras santas.', 'Num mundo teocrático, a fé é diplomacia.', W('theocratic_world'), [
    o('Apoiar a linha ortodoxa.', 'Aceitação entre os devotos; rigidez.', { now: { civil: -1.5, legitimacy: 2 }, groups: { rural: 4, youth: -4 }, rel: { all: 2 } }),
    o('Defender a reforma moderada.', 'Atraente a jovens; cisma com tradicionalistas.', { now: { civil: 1 }, groups: { youth: 3, rural: -3 }, rel: { all: -2 } }),
    o('Manter distância do Sínodo.', 'Isolamento espiritual.', { now: { legitimacy: -2 }, rel: { all: -3 } })], { cd: 300 }),
  I('ws_theo_crusade', 'Mundo Teocrático', 'Conclamação à guerra santa', 'A autoridade religiosa da sua fé declara que o inimigo infiel merece ser combatido. Voluntários se alistam e pedem suas bênçãos.', 'A paz religiosa se desfaz.', W('theocratic_world'), [
    o('Aderir à guerra santa.', 'Fervor e mobilização; risco de guerra aberta.', { now: { readiness: 4, warWeariness: 1, legitimacy: 3 }, groups: { military: 4, rural: 3 }, rel: { all: -3 } }),
    o('Enviar apenas voluntários e dinheiro.', 'Participação limitada.', { now: { treasury: -0.2, legitimacy: 1 }, groups: { military: 1 } }),
    o('Pregar a coexistência.', 'Moralmente respeitado; radicais atacam.', { now: { reputation: 2 }, groups: { rural: -3, military: -2 } })], { cd: 300 }),
  I('ws_theo_heresy', 'Mundo Teocrático', 'Acusação de heresia contra um ministro', 'O clero acusa um ministro de ensinar doutrina desviante. A corte se divide entre sacerdotes e tecnocratas.', 'A teologia pesa no gabinete.', W('theocratic_world'), [
    o('Condenar o ministro.', 'Agrada o clero; perde competência.', { now: { efficiency: -2, legitimacy: 2 }, groups: { rural: 3, bureaucracy: -3 } }),
    o('Proteger o ministro.', 'Choque com a hierarquia.', { now: { legitimacy: -3, efficiency: 1 }, groups: { rural: -3, bureaucracy: 3 } }),
    o('Julgamento público aberto.', 'Teatro político.', { now: { civil: 0.5 } })], { cd: 280 }),
  I('ws_theo_pilgrim', 'Mundo Teocrático', 'Peregrinação massiva', 'Milhões de peregrinos cruzam seu território rumo ao lugar sagrado. Receita e risco sanitário aumentam.', 'Logística e fé.', W('theocratic_world'), [
    o('Organizar e taxar a peregrinação.', 'Receita; exige estrutura.', { now: { treasury: 0.3, health: -0.5 }, groups: { rural: 3 } }),
    o('Oferecer hospitalidade gratuita.', 'Prestígio religioso.', { now: { treasury: -0.2, reputation: 3 } }),
    o('Restringir a passagem por segurança.', 'Evita problemas e desagrada fiéis.', { now: { reputation: -2 }, groups: { rural: -3 } })], { cd: 300 }),
  // Uniões Continentais
  I('ws_cont_summit', 'Mundo de Uniões', 'Cúpula da União Continental', 'A união regional vai votar uma nova rodada de integração: moeda comum, exército único e passaporte único.', 'No mundo de uniões continentais, a soberania é compartilhada.', W('continental_world'), [
    o('Votar a favor.', 'Mercado e segurança; menos soberania.', { now: { treasury: 0.15, reputation: 2 }, long: [{ k: 'exportAccess', v: 0.03, d: 0 }], groups: { business: 3, military: -2 }, rel: { neighbors: 3 } }),
    o('Votar contra e exigir exceções.', 'Soberania; atrito regional.', { now: { legitimacy: 1 }, rel: { neighbors: -4 }, groups: { military: 1 } }),
    o('Abster-se.', 'Neutralidade.', {})], { cd: 280 }),
  I('ws_cont_exit', 'Mundo de Uniões', 'Movimento para deixar a união', 'Nacionalistas pedem um referendo para sair da união continental. Banqueiros e exportadores avisam do desastre.', 'Vale a pena a independência?', W('continental_world'), [
    o('Autorizar o referendo.', 'Legitima; o resultado é incerto.', { now: { legitimacy: 2 }, groups: { opposition: 2 } }),
    o('Rejeitar com campanha pró-união.', 'Preserva a união; polariza.', { now: { reputation: 1 }, groups: { business: 3, rural: -2 } }),
    o('Negociar condições especiais.', 'Compromisso.', { now: { treasury: -0.05 }, rel: { neighbors: 1 } })], { cd: 340 }),
  I('ws_cont_rival', 'Mundo de Uniões', 'Tarifas entre uniões rivais', 'A união vizinha impôs tarifas altas aos produtos do seu bloco, e os exportadores exigem retaliação.', 'Guerras comerciais entre continentes.', W('continental_world'), [
    o('Retaliar com tarifas espelhadas.', 'Pressão e inflação.', { now: { inflation: 0.4 }, rel: { all: -2 }, groups: { workers: 2, business: -2 } }),
    o('Acionar a mediação de uma organização mundial.', 'Lento e civilizado.', { now: { reputation: 1 } }),
    o('Buscar mercados alternativos.', 'Diversificação.', { now: { treasury: -0.1 }, long: [{ k: 'exportAccess', v: 0.02, d: 0 }] })], { cd: 300 }),
  I('ws_cont_citizen', 'Mundo de Uniões', 'Cidadania continental', 'A união propõe uma cidadania comum, com livre circulação plena. Cidades pequenas temem perder jovens; empresas querem mão de obra.', 'Integração às últimas consequências.', W('continental_world'), [
    o('Aprovar a cidadania comum.', 'Mobilidade; esvaziamento regional.', { now: { reputation: 2 }, long: [{ k: 'laborSupply', v: 0.3, d: 0 }, { k: 'emigration', v: 0.3, d: 365 }], groups: { youth: 4, business: 2, regional: -2 } }),
    o('Condicionar a restrições.', 'Meio-termo.', { groups: { youth: 1, regional: 1 } }),
    o('Rejeitar.', 'Protege a identidade e os empregos locais.', { now: { reputation: -2 }, groups: { rural: 2, youth: -3 } })], { cd: 340 }),
  // Guerra Fria Eterna
  I('ws_cw_proxy', 'Guerra Fria', 'Guerra por procuração na vizinhança', 'Um conflito local numa região não alinhada põe os dois blocos a financiar lados opostos. Os dois pedem seu apoio.', 'A rivalidade global chega à sua porta.', W('cold_war_world'), [
    o('Alinhar-se ao bloco mais próximo.', 'Ajuda militar e dependência.', { now: { equipment: 3, defense: 2 }, rel: { east: 4, west: -5 }, groups: { military: 3 } }),
    o('Declarar não alinhamento.', 'Autonomia e solidão.', { now: { reputation: 2, influence: 1 }, rel: { all: -1 } }),
    o('Negociar com os dois blocos.', 'Barganha perigosa.', { now: { treasury: 0.3 }, rel: { all: -2 } })], { cd: 300 }),
  I('ws_cw_spy', 'Guerra Fria', 'Troca de espiões na ponte', 'Um espião capturado pode ser trocado por outro agente. O outro bloco oferece em segredo concessões comerciais.', 'Diplomacia de sombras.', W('cold_war_world'), [
    o('Aceitar a troca.', 'Alívio e imagem de força.', { now: { intel: 1, reputation: 1 }, rel: { all: 1 } }),
    o('Recusar e julgar o espião.', 'Exemplo duro.', { now: { reputation: -1, legitimacy: 2 }, rel: { all: -3 }, groups: { military: 2 } }),
    o('Usar o caso para extrair concessões.', 'Cálculo frio.', { now: { treasury: 0.2 } })], { cd: 300 }),
  I('ws_cw_space', 'Guerra Fria', 'A corrida espacial e o orçamento', 'Satélites, cães, astronautas: um programa espacial vale prestígio e tecnologia, mas custa muito.', 'A Lua vale milhões de votos.', W('cold_war_world'), [
    o('Programa espacial nacional ambicioso.', 'Prestígio e tecnologia.', { now: { treasury: -0.6, reputation: 2 }, long: [{ k: 'tech', v: 2, d: 0 }], groups: { youth: 3, military: 2 } }),
    o('Cooperar com o bloco aliado.', 'Barato.', { now: { treasury: -0.15 }, rel: { all: 1 } }),
    o('Ignorar a corrida.', 'Poupa.', { groups: { youth: -2 } })], { cd: 400 }),
  I('ws_cw_nuke_alarm', 'Guerra Fria', 'Alarme nuclear falso', 'Radares apontam mísseis a caminho. Foi um erro de sensor, mas só dá para saber depois. O que fazer em segundos?', 'Um erro e tudo acaba.', W('cold_war_world'), [
    o('Elevar o alerta e preparar resposta.', 'Dissuasão; risco enorme.', { now: { readiness: 4 }, groups: { military: 2 }, rel: { all: -3 } }),
    o('Contatar a linha direta com o outro bloco.', 'Evita o pior.', { now: { reputation: 2 }, rel: { all: 2 } }),
    o('Esperar confirmação por mais um minuto.', 'Nervos de aço.', { now: { stability: -1 } })], { cd: 500 }),
  // Mundo das Corporações
  I('ws_corp_lobby', 'Mundo Corporativo', 'O lobby das megaempresas', 'Um conglomerado oferece financiar sua campanha e as obras públicas em troca de concessões de portos e mineração.', 'Nada é de graça.', W('corporate_world'), [
    o('Aceitar o financiamento e dar a concessão.', 'Dinheiro e dívida política.', { now: { treasury: 0.4, corruption: 2 }, groups: { business: 4, workers: -3 } }),
    o('Recusar e regular o lobby.', 'Autonomia; menos caixa.', { now: { corruption: -1, legitimacy: 2 }, groups: { business: -3, workers: 2 } }),
    o('Aceitar com contrapartidas sociais.', 'Meio-termo.', { now: { treasury: 0.2 }, groups: { workers: 1 } })], { cd: 300 }),
  I('ws_corp_gig', 'Mundo Corporativo', 'Trabalhadores da gig economy param o país', 'Entregadores e motoristas de aplicativo, sem direitos, bloqueiam as principais avenidas. As plataformas ameaçam deixar o país.', 'Ninguém é empregado de ninguém.', W('corporate_world'), [
    o('Regular com direitos mínimos.', 'Equilibra.', { now: { treasury: 0.05, unemployment: 0.1 }, groups: { workers: 4, business: -3 } }),
    o('Ficar do lado das plataformas.', 'Investimento mantido.', { groups: { workers: -4, business: 3 } }),
    o('Cooperativas estatais de plataforma.', 'Ousado.', { now: { treasury: -0.3 }, groups: { workers: 3, youth: 2, business: -2 } })], { cd: 320 }),
  I('ws_corp_police', 'Mundo Corporativo', 'Segurança privada no lugar da polícia', 'Empresas oferecem segurança privada para bairros e portos por contratos baratos. A polícia pública diz estar sem verba.', 'Ordem é um produto.', W('corporate_world'), [
    o('Terceirizar a segurança.', 'Economia; desigualdade.', { now: { treasury: 0.3, crime: -1, control: -1 }, groups: { business: 3, workers: -2 } }),
    o('Reforçar a polícia pública.', 'Caro, universal.', { now: { treasury: -0.4, control: 2 }, groups: { military: 1 } }),
    o('Modelo misto regulado.', 'Meio-termo.', { now: { treasury: 0.1 } })], { cd: 330 }),
  I('ws_corp_tax', 'Mundo Corporativo', 'Paraíso fiscal ou imposto global?', 'Vários países cortam impostos das empresas para atrair sedes. A pressão para você fazer o mesmo é enorme.', 'A corrida para o fundo.', W('corporate_world'), [
    o('Cortar imposto para empresas.', 'Atrai investimentos; receita cai.', { now: { treasury: -0.2 }, long: [{ k: 'growth', v: 0.2, d: 365 }], groups: { business: 4, workers: -2 } }),
    o('Defender um imposto mínimo global.', 'Imagem; briga.', { now: { reputation: 2 }, rel: { all: -1 }, groups: { business: -2 } }),
    o('Manter e investir em serviços.', 'Escolha própria.', { groups: { workers: 2, business: -1 } })], { cd: 360 }),
  // Mundo em Colapso Climático
  I('ws_clim_refugees', 'Colapso Climático', 'Refugiados do mar e da seca', 'Milhões de pessoas deixam litorais afogados e regiões secas. Seu país é destino em potencial. A fronteira treme.', 'A migração é inevitável.', W('climate_collapse_world'), [
    o('Receber e reassentar com planos de longo prazo.', 'Humanitário e caro.', { now: { treasury: -0.5, reputation: 4 }, long: [{ k: 'laborSupply', v: 0.5, d: 0 }], groups: { workers: -2, youth: 2 } }),
    o('Cota rigorosa de entrada.', 'Controle.', { now: { reputation: -2, control: 1 }, groups: { military: 2, rural: 2 } }),
    o('Fechar a fronteira.', 'Dureza e condenação.', { now: { reputation: -5 }, groups: { military: 3, youth: -4 } })], { cd: 280 }),
  I('ws_clim_water', 'Colapso Climático', 'Guerras da água', 'Um rio compartilhado secou em parte. Os países de jusante ameaçam usar a força para garantir o abastecimento.', 'Quem controla a nascente controla o futuro.', W('climate_collapse_world'), [
    o('Tratado de partilha e investimentos conjuntos.', 'Paz cara.', { now: { treasury: -0.3 }, rel: { neighbors: 5 } }),
    o('Reservar a água para o seu povo.', 'Egoísmo e conflito.', { now: { stability: 1 }, rel: { neighbors: -10 }, groups: { military: 3 } }),
    o('Dessalinização e reuso em massa.', 'Alta tecnologia.', { now: { treasury: -0.6 }, long: [{ k: 's_food', v: 2, d: 0 }] })], { cd: 280 }),
  I('ws_clim_geo', 'Colapso Climático', 'Geoengenharia: refletir o sol?', 'Cientistas propõem lançar aerossóis na estratosfera para esfriar o planeta. Os efeitos regionais são imprevisíveis.', 'Jogar os dados com a atmosfera.', W('climate_collapse_world'), [
    o('Apoiar o programa de geoengenharia.', 'Esfria o clima; riscos.', { now: { treasury: -0.4, reputation: -1, pollution: -1 }, long: [{ k: 'growth', v: 0.1, d: 365 }], rel: { all: -1 } }),
    o('Opor-se e apostar em cortes de carbono.', 'Moral e demorado.', { now: { reputation: 2 }, groups: { youth: 3 } }),
    o('Pesquisar sem implantar.', 'Cautela.', { now: { treasury: -0.15 }, long: [{ k: 'tech', v: 1, d: 0 }] })], { cd: 400 }),
  I('ws_clim_cities', 'Colapso Climático', 'Abandonar a cidade costeira', 'O mar já invade as ruas da cidade portuária. Fica mais caro proteger do que mudar. Os moradores se dividem.', 'Retirada ou muralha?', W('climate_collapse_world'), [
    o('Muralha e bombeamento.', 'Mantém a cidade; muito caro.', { now: { treasury: -0.8 }, groups: { business: 3, workers: 2 } }),
    o('Reassentamento planejado.', 'Dói e funciona.', { now: { treasury: -0.5, legitimacy: -2 }, long: [{ k: 'housing', v: 1.5, d: 0 }], groups: { regional: -2 } }),
    o('Abrir mão em fases.', 'Gradual.', { now: { treasury: -0.3 } })], { cd: 320 }),
];

// ---------- Cenários do jogador específicos (monarquias restauradas e nações frias recém-criadas) ----------
const scn = [
  I('sc_empire_court', 'Monarquia', 'A corte, o protocolo e o orçamento do trono', 'A restauração trouxe palácios, cerimônias e uma lista civil. Jornais pedem cortes; tradicionalistas pedem esplendor.', 'A monarquia vive de símbolos, mas o povo vive de pão.', { flag: 'empire_start' }, [
    o('Corte austera: pouca pompa, muita presença nas províncias.', 'Popular entre o povo; tradicionalistas reclamam.', { now: { treasury: 0.1, legitimacy: 1 }, groups: { workers: 2, rural: -1 } }),
    o('Grandes cerimônias e mecenato.', 'Prestígio e unidade simbólica; custa caro.', { now: { treasury: -0.3, legitimacy: 3, reputation: 1 }, groups: { rural: 3, youth: -2 } }),
    o('Meio-termo: cerimônias anuais.', 'Equilíbrio.', { now: { treasury: -0.1, legitimacy: 1 } })], { cd: 300 }),
  I('sc_empire_republicans', 'Monarquia', 'Republicanos pedem um plebiscito', 'Clubes republicanos juntam assinaturas para um plebiscito sobre a forma de governo. Monarquistas acusam traição.', 'A restauração ainda divide o país.', { flag: 'empire_start' }, [
    o('Convocar o plebiscito.', 'Legitima a coroa se ela vencer; arriscado.', { now: { legitimacy: 2 }, groups: { opposition: 3, youth: 3 } }),
    o('Proibir a campanha republicana.', 'Estabilidade imediata, ressentimento.', { now: { civil: -2, legitimacy: -2 }, groups: { opposition: -4, youth: -3 }, long: [{ k: 'revoRisk', v: 2, d: 240 }] }),
    o('Ampliar os poderes do parlamento.', 'Esfria a pressão; a coroa perde poder.', { now: { political: 2, legitimacy: 1 }, groups: { opposition: 2, military: -2 } })], { cd: 340 }),
  I('sc_empire_moderador', 'Monarquia', 'O poder moderador numa crise de gabinete', 'O gabinete caiu e ninguém reúne maioria. O trono pode dissolver a câmara, nomear um primeiro-ministro de sua escolha ou convocar um governo de unidade.', 'Teste do poder moderador.', { flag: 'empire_start' }, [
    o('Dissolver a câmara e convocar eleições.', 'Devolve a decisão ao povo.', { now: { political: 1, stability: -1 }, groups: { opposition: 2 } }),
    o('Nomear um primeiro-ministro de confiança da coroa.', 'Estabilidade e acusações de absolutismo.', { now: { stability: 2, political: -2, legitimacy: -1 }, groups: { military: 2, opposition: -3 } }),
    o('Governo de unidade nacional.', 'Meio-termo.', { now: { stability: 1 }, groups: { bureaucracy: 2 } })], { cd: 320 }),
  I('sc_cold_first_winter', 'Clima', 'O primeiro inverno do novo país', 'Sem o antigo sistema de suprimento do país-mãe, estoques de combustível e comida estão no limite antes da neve. Cada decisão importa.', 'A nova nação precisa sobreviver ao frio.', { flag: 'cold_start' }, [
    o('Comprar combustível e comida a qualquer preço.', 'Garante o inverno; esvazia o caixa.', { now: { treasury: -0.6, hunger: -1, legitimacy: 3 }, groups: { workers: 3, rural: 3 } }),
    o('Racionar e priorizar hospitais e escolas.', 'Dói, mas sobrevive.', { now: { treasury: -0.2, legitimacy: -1, health: 1 }, groups: { business: -3, workers: 1 } }),
    o('Pedir ajuda ao antigo país-mãe.', 'Ajuda com condições políticas.', { now: { treasury: -0.1 }, rel: { neighbors: 4 }, groups: { military: -2, regional: -3 } })], { cd: 600 }),
  I('sc_cold_fuel_deal', 'Energia', 'Contrato de combustível com o vizinho poderoso', 'O vizinho oferece combustível barato por dez anos — em troca de bases, voto em organismos internacionais e acesso ao seu porto.', 'Energia por soberania.', { flag: 'cold_start' }, [
    o('Aceitar o contrato completo.', 'Aquecimento barato, perda de autonomia.', { now: { treasury: 0.2, legitimacy: -2 }, rel: { neighbors: 8, west: -4 }, groups: { military: -2 } }),
    o('Contrato só comercial, sem bases.', 'Preço maior, mais liberdade.', { now: { treasury: -0.1 }, rel: { neighbors: 2 } }),
    o('Diversificar com fornecedores distantes e renováveis.', 'Caro agora, livre depois.', { now: { treasury: -0.4 }, long: [{ k: 's_energy', v: 2, d: 0 }], groups: { youth: 2 } })], { cd: 500 }),
  I('sc_cold_border_posts', 'Segurança', 'Postos de fronteira no gelo', 'A nova fronteira tem milhares de quilômetros de tundra e floresta. Contrabandistas, patrulhas rivais e refugiados passam por ela.', 'Quem não guarda a fronteira não tem país.', { flag: 'cold_start' }, [
    o('Rede de postos aquecidos e drones.', 'Fronteira controlada; caro.', { now: { treasury: -0.4, control: 3, defense: 2 }, groups: { military: 3 } }),
    o('Patrulhas móveis e acordo com o vizinho.', 'Barato e arriscado.', { now: { treasury: -0.1, control: 1 }, rel: { neighbors: 2 } }),
    o('Deixar as populações locais fiscalizarem.', 'Quase sem custo; fraco.', { now: { control: -1 }, groups: { regional: 3 } })], { cd: 500 }),
  // ---------- Bir Tawil (micronação) ----------
  I('bt_nobody_wants', 'Micronação', 'Nem o Egito nem o Sudão querem você', 'Os dois vizinhos reafirmam, cada um, que Bir Tawil pertence ao OUTRO. Pela lógica deles, o deserto sob seus pés não é de ninguém — ou seja, é de vocês. Um diplomata egípcio pede, polidamente, que você não conte a ninguém que ele veio.', 'Para ficar com a faixa que importa (Halaib), cada país precisa continuar recusando esta.', { flag: 'micronation' }, [
    o('Anunciar que a recusa DELES prova a SUA soberania.', 'Genial no papel; ninguém lê o papel.', { now: { legitimacy: 3, reputation: -1 }, rel: { neighbors: -2 } }),
    o('Oferecer aos dois a faixa em troca de reconhecimento.', 'Os dois fingem não ouvir.', { now: { reputation: 1 }, rel: { neighbors: 1 } }),
    o('Reivindicar também Halaib, só para ver a reação.', 'Absurdo; a diplomacia entra em pânico.', { now: { reputation: -3, influence: 1 }, rel: { neighbors: -8 }, groups: { military: 2 } })], { cd: 400 }),
  I('bt_flag_anthem', 'Micronação', 'Bandeira, hino e um sobrinho inconformado', 'A bandeira foi costurada com lençóis; o hino, gravado em um kazoo. O sobrinho do rei diz que a crina do camelo no escudo está errada e exige um concurso nacional.', 'Símbolos são tudo o que um país sem exército tem.', { flag: 'micronation' }, [
    o('Concurso nacional de símbolos (3 votantes).', 'Democracia em miniatura.', { now: { legitimacy: 2, political: 1 }, groups: { youth: 2 } }),
    o('Decreto real: o kazoo é oficial.', 'Tradição inventada em tempo recorde.', { now: { legitimacy: 1, civil: -0.5 } }),
    o('Encomendar desenho profissional por 50 dólares.', 'O freelancer aceita se não precisar visitar.', { now: { treasury: -0.4, reputation: 1 } })], { cd: 500 }),
  I('bt_tourists', 'Micronação', 'Influenciadores chegam de caravana', 'Trinta turistas, três influenciadores e uma equipe de TV atravessaram o deserto para “conhecer o país que ninguém quer”. Pedem carimbo no passaporte, selfie com o rei e, claro, banheiro.', 'Não há banheiro. Não há muito de nada.', { flag: 'micronation' }, [
    o('Cobrar visto de 20 dólares e vender carimbos.', 'A receita do ano, em uma tarde.', { now: { treasury: 1.5, reputation: 1 }, groups: { business: 2 } }),
    o('Dar o tour oficial com discurso do rei.', 'Prestígio e areia nos olhos.', { now: { reputation: 2, legitimacy: 1 } }),
    o('Expulsar todos por “violação de fronteira”.', 'Soberania total, canal de vídeo perdido.', { now: { reputation: -2, legitimacy: 1 }, groups: { youth: -2 } })], { cd: 280 }),
  I('bt_titles', 'Micronação', 'À venda: títulos de nobreza', 'Alguém sugere vender títulos de conde, duque e barão pela internet. A nobreza não tem terra para dar; só o título, uma certidão em papel timbrado e um lugar na fila para o banquete.', 'A nobreza do deserto: sem palácio, mas com certificado.', { flag: 'micronation' }, [
    o('Vender 500 títulos a 30 dólares cada.', 'Dinheiro fácil; um bom escândalo.', { now: { treasury: 2, corruption: 1, reputation: -1 }, groups: { business: 2 } }),
    o('Vender só 10 títulos, caríssimos.', 'Exclusividade.', { now: { treasury: 0.8, reputation: 1 } }),
    o('Recusar: nobreza é para quem merece.', 'Pureza e miséria.', { now: { legitimacy: 1 }, groups: { military: 1 } })], { cd: 400 }),
  I('bt_un', 'Micronação', 'Pedido de reconhecimento na ONU', 'O governo redige uma carta de 14 páginas pedindo uma cadeira na Assembleia Geral. A resposta oficial é um e-mail automático: “Obrigado pelo seu contato. Tempo médio de resposta: indefinido.”', 'Seis países responderam com “fale com o consulado”. Não existe consulado.', { flag: 'micronation' }, [
    o('Insistir semanalmente com cartas mais longas.', 'Persistência heroica.', { now: { reputation: 0.5, treasury: -0.1 } }),
    o('Procurar um patrocinador: uma micronação amiga.', 'Reconhecimento mútuo entre aflitos.', { now: { reputation: 1, influence: 1 }, rel: { all: 1 } }),
    o('Abrir um serviço consular: a tenda vizinha.', 'Burocracia criativa.', { now: { treasury: -0.2, efficiency: 1 }, groups: { bureaucracy: 3 } })], { cd: 600 }),
  I('bt_sandstorm', 'Micronação', 'Tempestade de areia engole o palácio (uma tenda)', 'Uma tempestade de dois dias derrubou o palácio, o tesouro (uma caixa de biscoitos) e a sala do trono. O rei foi encontrado dormindo dentro do tambor de água.', 'A infraestrutura nacional cabe numa caminhonete.', { flag: 'micronation' }, [
    o('Reconstruir com concreto: o primeiro prédio do país.', 'Marco histórico, dinheiro que não existe.', { now: { treasury: -1, legitimacy: 3 }, long: [{ k: 'infra', v: 3, d: 0 }], groups: { workers: 2 } }),
    o('Mais tendas, desta vez com estacas.', 'Modesto e eficaz.', { now: { treasury: -0.3 }, long: [{ k: 'infra', v: 1, d: 0 }] }),
    o('Declarar luto nacional e mudar de lugar (2 km ao lado).', 'Mudança de capital!', { now: { legitimacy: -1, control: -1 } })], { cd: 400 }),
  I('bt_crypto', 'Micronação', 'Areiacoin: a moeda do deserto', 'Um engenheiro curioso propõe lançar a moeda digital oficial, lastreada em “um grão de areia por token”. Dois investidores já ofereceram comprar o país inteiro por 3 mil dólares.', 'A economia cabe numa planilha.', { flag: 'micronation' }, [
    o('Lançar o token e emitir cédulas simbólicas.', 'Euforia e risco de golpe.', { now: { treasury: 1.2, reputation: -1, inflation: 0.5 }, groups: { youth: 2, business: 2 } }),
    o('Continuar com o dinar de areia, em papel.', 'Charme analógico.', { now: { legitimacy: 1 } }),
    o('Aceitar a oferta e vender a coroa.', 'Fim do reino, começo da rendição.', { now: { treasury: 3, legitimacy: -6, reputation: -3 }, groups: { military: -3 } })], { cd: 500 }),
  I('bt_census', 'Micronação', 'O censo nacional', 'O ministro da Estatística relata 312 habitantes: 187 nômades que passam de vez em quando, 41 cabras com nome, 3 pesquisadores e um homem que afirma ser “o verdadeiro rei” e quer que você o prove.', 'As cabras já pediram direito de voto.', { flag: 'micronation' }, [
    o('Dar cidadania às cabras.', 'Tecnicamente legal; o mundo ri.', { now: { reputation: -1, legitimacy: 1 }, groups: { rural: 3, youth: 3 } }),
    o('Exigir prova de sangue azul ao pretendente.', 'Duelo de genealogias.', { now: { legitimacy: 2 }, groups: { military: 1 } }),
    o('Expulsar o pretendente para o Egito.', 'O Egito não aceita.', { now: { stability: -1, reputation: -1 }, rel: { neighbors: -1 } })], { cd: 500 }),
  I('bt_gold', 'Micronação', 'Boato: há ouro sob a areia', 'Um geólogo bêbado jura ter visto brilho numa rocha. Mineradoras fantasma já prometem investir; o Egito e o Sudão de repente lembram que “talvez” a faixa tenha valor.', 'Bir Tawil pode virar o território mais disputado do mundo.', { flag: 'micronation' }, [
    o('Concessão exclusiva à mineradora que pagar mais.', 'Dinheiro e dívida política.', { now: { treasury: 2, corruption: 2 }, groups: { business: 3 }, long: [{ k: 'revenue', v: 0.05, d: 0 }] }),
    o('Prospecção própria com pás e esperança.', 'Trabalho duro e piada interna.', { now: { treasury: -0.3 }, groups: { workers: 3 } }),
    o('Negar o boato publicamente.', 'Mantém os vizinhos desinteressados.', { now: { reputation: 1 }, rel: { neighbors: 2 } })], { cd: 600 }),
  I('bt_micronations', 'Micronação', 'Cúpula das micronações', 'O principado de uma ilhota inexistente, a república de um cômodo e um império de um terraço convidam você para uma conferência. Ninguém reconhece ninguém, mas todos se reconhecem.', 'A diplomacia do improvável.', { flag: 'micronation' }, [
    o('Comparecer e assinar o Pacto das Soberanias Mínimas.', 'Seis reconhecimentos de papel.', { now: { reputation: 2, influence: 1 }, rel: { all: 1 } }),
    o('Mandar um embaixador (o sobrinho).', 'Menos custo, mais drama.', { now: { treasury: -0.1 }, groups: { youth: 1 } }),
    o('Fundar uma cúpula rival, só sua.', 'Isolamento digno.', { now: { legitimacy: 1 } })], { cd: 500 }),
  I('bt_army', 'Micronação', 'O exército nacional', 'O Marechal (único oficial) pede uma reforma: o exército tem onze homens, um camelo e um megafone. Querem uniformes, um canhão de brinquedo e um desfile no Dia da Soberania.', 'Em um país sem inimigos, a ameaça é o tédio.', { flag: 'micronation' }, [
    o('Uniformes e desfile anual.', 'Orgulho nacional.', { now: { treasury: -0.4, readiness: 2, legitimacy: 2 }, groups: { military: 4 } }),
    o('Dissolver o exército e manter só o camelo.', 'Pacifismo de areia.', { now: { treasury: 0.1, readiness: -1 }, groups: { military: -4 } }),
    o('Transformar o exército em guarda florestal (de deserto).', 'Criativo.', { now: { efficiency: 1 }, groups: { military: 1, rural: 2 } })], { cd: 500 }),
  I('bt_border_guard', 'Micronação', 'Um soldado egípcio pede asilo', 'Um recruta de uma patrulha de fronteira, cansado de turnos no deserto, aparece pedindo asilo político, água e um sanduíche. Seus superiores querem o rapaz de volta.', 'A primeira crise diplomática de verdade.', { flag: 'micronation' }, [
    o('Conceder asilo e cidadania.', 'O primeiro cidadão novo em anos.', { now: { reputation: 1, legitimacy: 1 }, rel: { neighbors: -4 } }),
    o('Devolver com um presente (uma cabra).', 'Gesto de boa vontade.', { now: { reputation: 1 }, rel: { neighbors: 3 } }),
    o('Empregá-lo como ministro da Defesa.', 'Promoção sem concurso.', { now: { efficiency: -0.5 }, groups: { military: 2 } })], { cd: 600 }),
  I('bt_passport', 'Micronação', 'Passaportes do país que não existe', 'Um aventureiro propõe vender passaportes “diplomáticos” do reino. Ninguém aceitará o documento, mas ele fica ótimo em uma estante.', 'Uma indústria de souvenir.', { flag: 'micronation' }, [
    o('Vender passaportes colecionáveis.', 'Entra dinheiro; polícia de fronteiras alerta.', { now: { treasury: 1, reputation: -2 }, groups: { business: 2 } }),
    o('Passaportes só para residentes e honorários.', 'Digno e pobre.', { now: { legitimacy: 1 } }),
    o('Banir os passaportes e emitir apenas carimbos.', 'Minimalismo.', { now: { treasury: 0.1 } })], { cd: 500 }),
  I('bt_space', 'Micronação', 'O programa espacial de balões', 'O ministro da Ciência afirma que, com 12 balões meteorológicos e um forno, o reino chegará à estratosfera antes do Egito. A Nasa não confirmou ter sido consultada.', 'O céu é o único limite que ninguém reivindica.', { flag: 'micronation' }, [
    o('Financiar o lançamento de balões.', 'Prestígio e fotos incríveis.', { now: { treasury: -0.6, reputation: 2 }, long: [{ k: 'tech', v: 1.5, d: 0 }], groups: { youth: 3 } }),
    o('Aproveitar os balões para entregar correspondência.', 'Utilidade absurda.', { now: { treasury: -0.1, efficiency: 0.5 } }),
    o('Cancelar: gastar em água potável.', 'Racionalidade deprimente.', { now: { treasury: -0.2, health: 1 }, groups: { workers: 2 } })], { cd: 600 }),
  I('bt_reality', 'Micronação', 'Uma TV quer filmar o reality show do reino', 'Uma produtora oferece pagar para transmitir a “vida real” de uma micronação, com intrigas, camelos e eleições ao vivo. O rei teme perder a dignidade; o sobrinho, a oportunidade.', 'Todos querem o país que não é de ninguém.', { flag: 'micronation' }, [
    o('Assinar o contrato de exclusividade.', 'Fama e dinheiro, privacidade zero.', { now: { treasury: 2.5, reputation: 2, legitimacy: -2 }, groups: { youth: 3 } }),
    o('Aceitar só um documentário sério.', 'Imagem mais digna.', { now: { treasury: 0.6, reputation: 3 } }),
    o('Recusar e manter o mistério.', 'Aura enigmática.', { now: { legitimacy: 1 } })], { cd: 700 }),
  I('bt_coup', 'Micronação', 'O primo do rei dá um “golpe” (com um megafone)', 'O primo reúne dois nômades, o sobrinho e uma cabra, toma a tenda do tesouro e proclama o fim da monarquia. Exige eleições, um novo hino e a devolução do kazoo.', 'Um golpe tem de começar em algum lugar.', { flag: 'micronation' }, [
    o('Negociar: vice-rei e republica simbólica.', 'Divide o poder; ganha paz.', { now: { stability: 2, political: 1 }, groups: { youth: 2, military: -1 } }),
    o('Prender o primo (na tenda de trás).', 'Ordem estabelecida.', { now: { stability: 1, civil: -1 }, groups: { military: 2 } }),
    o('Abdicar a favor da cabra.', 'Tradição republicana ou piada?', { now: { legitimacy: -3, reputation: 1 }, groups: { rural: 3 } })], { cd: 700 }),
  I('bt_well', 'Micronação', 'O único poço do país seca', 'Sem água, a população some em dois dias. Caminhões-tanque de vizinhos poderiam socorrer, mas pediriam “algo em troca” — como reconhecimento ou a posse do poço.', 'Soberania ou sobrevivência.', { flag: 'micronation' }, [
    o('Aceitar a ajuda e a condição.', 'Salva todos; perde algo do orgulho.', { now: { health: 1, legitimacy: -3 }, rel: { neighbors: 4 } }),
    o('Perfurar um novo poço com a ajuda de turistas.', 'Colaborativo e incerto.', { now: { treasury: -0.4, health: 1 }, groups: { workers: 2, youth: 2 } }),
    o('Recorrer à ONU: “crise humanitária”.', 'O e-mail automático responde.', { now: { reputation: 1 } })], { cd: 600 }),
  I('bt_goat_deal', 'Micronação', 'Oferta absurda: trocar o país por uma cabra', 'Um vizinho propõe, meio de brincadeira, trocar o reino por uma cabra premiada, dois sacos de farinha e uma TV. Os jornais discutem se é piada, golpe ou diplomacia criativa.', 'Todo preço é uma declaração política.', { flag: 'micronation' }, [
    o('Aceitar a cabra e continuar rei como governador.', 'Estatuto de protetorado, com churrasco.', { now: { treasury: 0.3, reputation: -2, legitimacy: -3 }, rel: { neighbors: 3 } }),
    o('Contraproposta: um satélite e um poço.', 'Barganha ousada.', { now: { treasury: 0.5, reputation: 1 } }),
    o('Recusar com um discurso inflamado.', 'Orgulho nacional intacto.', { now: { legitimacy: 3 }, groups: { military: 2, rural: 2 } })], { cd: 800 }),
];

const norm = list => list.map(x => ({ ...x, cond: { ...(x.cond || {}) }, ...(x.id.startsWith('bt_') ? { w: 7 } : {}) }));
// Questões de cenário mundial usam sua própria cond (quando definida em extra) — mescla com wscn.
const fix = list => list.map(x => ({ ...x, cond: { ...(x.cond || {}) } }));
writeFileSync(out('issues_regional.json'), JSON.stringify(norm([...cold, ...latam, ...europe, ...scn]), null, 1));
writeFileSync(out('issues_wscn.json'), JSON.stringify(fix(wscn), null, 1));
// Garante que os arquivos estejam listados em content.json.
const cp = out('content.json'); const c = JSON.parse(readFileSync(cp, 'utf8'));
for (const f of ['issues_regional', 'issues_wscn']) if (!c.issues.includes(f)) c.issues.push(f);
writeFileSync(cp, JSON.stringify(c, null, 1));
console.log('regional:', cold.length + latam.length + europe.length + scn.length, '| cenários mundiais:', wscn.length);
