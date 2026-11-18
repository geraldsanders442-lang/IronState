// Gera data/world/world_scenarios.json: cenários em que o MUNDO INTEIRO vive uma história alternativa.
// Uso: node tools/gen-world-scenarios.mjs
import { writeFileSync } from 'node:fs';

const em = (type, color, x = 0.5, y = 0.5, s = 0.3) => ({ type, color, x, y, s });
const red = (extra = [], c = '#c8102e') => ({ layout: 'solid', colors: [c, c, c], emblems: [em('hammersickle', '#ffd700', 0.17, 0.33, 0.24), em('starline', '#ffd700', 0.17, 0.13, 0.12), ...extra] });
const hs = em('hammersickle', '#ffd700', 0.2, 0.27, 0.2);

const SOC = {
  democratic: { profile: { gov: 'party', govName: 'República Socialista Democrática', regime: 'flawed', regimeName: 'Socialismo democrático', align: 'E' }, libMax: 78, libMin: 52, marketMax: 38 },
  onepart: { profile: { gov: 'party', govName: 'Estado de partido único', regime: 'auth', regimeName: 'Estado socialista', align: 'E' }, libMax: 22, marketMax: 20, milMul: 1.2, relMul: 0.3 },
  market: { profile: { gov: 'party', govName: 'República Popular', regime: 'hybrid', regimeName: 'Socialismo de mercado', align: 'E' }, libMax: 38, marketMax: 55 },
};
const CAP = { profile: { align: 'W' }, marketMin: 58 };

const scenarios = [
  {
    id: 'red_world', name: 'Mundo Vermelho', tag: '☭', alt: true,
    desc: 'A revolução venceu em toda parte: União Soviética, Iugoslávia, Grã-Bretanha socialista, Brasil socialista, EUA socialistas… Quase todos os países são governados por partidos socialistas ou comunistas, com ilhas capitalistas isoladas. Você pode ser socialista, reformista ou o último liberal.',
    rules: [
      { match: { ids: ['SAU', 'ARE', 'QAT', 'KWT', 'BHR', 'SGP', 'CHE', 'LIE', 'MCO', 'VAT', 'ISR', 'TWN', 'PAN', 'LUX', 'AND', 'SMR', 'BRN', 'OMN'] }, set: CAP },
      { match: { ids: ['RUS', 'CHN', 'SRB', 'CUB', 'VNM', 'PRK', 'BLR', 'LAO', 'VEN', 'ETH'] }, set: SOC.onepart },
      { match: { ids: ['GBR', 'FRA', 'DEU', 'ESP', 'ITA', 'BRA', 'MEX', 'ARG', 'ZAF', 'PRT', 'GRC', 'CHL', 'AUS', 'CAN', 'SWE', 'NOR', 'DNK', 'FIN', 'NLD', 'BEL', 'IND', 'JPN', 'KOR'] }, set: SOC.democratic },
      { match: { ids: ['USA'] }, set: SOC.democratic },
      { match: { p: 0.12 }, set: CAP },
      { variants: [{ p: 0.3, ...SOC.democratic }, { p: 0.45, ...SOC.onepart }, { p: 0.25, ...SOC.market }] },
    ].map(r => r.variants ? { match: {}, variants: r.variants.map(({ p, ...set }) => ({ p, ...set })) } : r),
    entities: {
      RUS: { name: 'União Soviética', formal: 'União das Repúblicas Socialistas Soviéticas', flag: { hist: 'ussr' } },
      SRB: { name: 'Iugoslávia Socialista', formal: 'República Socialista Federativa da Iugoslávia', flag: { hist: 'sfry' } },
      DEU: { name: 'República Socialista Alemã', formal: 'República Democrática Alemã', flag: { hist: 'ddr' } },
      GBR: { name: 'República Socialista Britânica', formal: 'República Socialista da Grã-Bretanha', flag: red() },
      USA: { name: 'Estados Unidos Socialistas', formal: 'Estados Socialistas da América', flag: { layout: 'cantonstripes', colors: ['#b22234', '#ffffff', '#3c3b6e'], emblems: [hs] } },
      BRA: { name: 'República Socialista do Brasil', formal: 'República Socialista Federativa do Brasil', flag: { layout: 'hborder', colors: ['#c8102e', '#009c3b'], emblems: [em('hammersickle', '#ffd700', 0.17, 0.4, 0.22), em('starline', '#ffd700', 0.17, 0.2, 0.11)] } },
      FRA: { name: 'República Comunal Francesa', formal: 'República Socialista da França', flag: { layout: 'v3', colors: ['#0055a4', '#ffffff', '#ef4135'], emblems: [em('hammersickle', '#ef4135', 0.5, 0.5, 0.26)] } },
      CHN: { name: 'República Popular da China', flag: { iso: 'cn' } },
      CUB: { name: 'Cuba Socialista', flag: { iso: 'cu' } },
    },
    alliances: [
      { name: 'Internacional Socialista', members: ['RUS', 'CHN', 'SRB', 'CUB', 'VNM', 'PRK', 'BLR', 'LAO'], leader: 'RUS' },
      { name: 'Frente Popular da Europa', members: ['GBR', 'FRA', 'DEU', 'ESP', 'ITA', 'PRT', 'GRC'], leader: 'FRA' },
      { name: 'Pacto Vermelho das Américas', members: ['USA', 'BRA', 'MEX', 'ARG', 'CUB', 'CHL', 'VEN'], leader: 'USA' },
    ],
    bloc: { same: 16, diff: -22 },
  },
  {
    id: 'imperial_world', name: 'Mundo Imperialista', tag: '👑', alt: true,
    desc: 'A democracia nunca existiu: o mundo é um tabuleiro de impérios e monarquias absolutas disputando colônias, mares e prestígio. Cada potência é um império; o desafio é sobreviver, expandir-se ou servir a um patrono. Você pode seguir o caminho socialista ou ser o primeiro revolucionário.',
    rules: [
      { match: {}, set: { profile: { gov: 'amon', govName: 'Monarquia imperial', regime: 'auth', regimeName: 'Império autocrático' }, libMax: 28, libMul: 0.6, milMul: 1.45, marketMax: 70 } },
    ],
    entities: {
      GBR: { name: 'Império Britânico', formal: 'Império Britânico', flag: { reg: 'imp_britain_red_ensign', iso: 'gb' } },
      FRA: { name: 'Império Francês', formal: 'Segundo Império Francês', flag: { reg: 'imp_france2', iso: 'fr' } },
      DEU: { name: 'Império Alemão', formal: 'Império Alemão', flag: { reg: 'imp_germany', iso: 'de' } },
      RUS: { name: 'Império Russo', formal: 'Império Russo', flag: { hist: 'rusimp', iso: 'ru' } },
      TUR: { name: 'Império Otomano', formal: 'Império Otomano', flag: { reg: 'imp_ottoman', iso: 'tr' } },
      AUT: { name: 'Áustria-Hungria', formal: 'Império Austro-Húngaro', flag: { reg: 'imp_austria_hungary', iso: 'at' } },
      BRA: { name: 'Império do Brasil', formal: 'Império do Brasil', flag: { reg: 'imp_brazil', iso: 'br' } },
      MEX: { name: 'Império Mexicano', formal: 'Segundo Império Mexicano', flag: { reg: 'imp_mexico_2', iso: 'mx' } },
      CHN: { name: 'Império Qing', formal: 'Grande Império Qing', flag: { reg: 'imp_qing', iso: 'cn' } },
      JPN: { name: 'Império do Japão', formal: 'Grande Império do Japão', flag: { reg: 'imp_japan_navy', iso: 'jp' } },
      KOR: { name: 'Império Coreano', formal: 'Grande Império Coreano', flag: { reg: 'imp_korea', iso: 'kr' } },
      ETH: { name: 'Império Etíope', formal: 'Império da Etiópia', flag: { reg: 'imp_ethiopia', iso: 'et' } },
      IRN: { name: 'Império Persa', formal: 'Império Imperial do Irã', flag: { reg: 'imp_iran', iso: 'ir' } },
      ITA: { name: 'Reino da Itália', formal: 'Reino da Itália', flag: { reg: 'imp_italy_kingdom', iso: 'it' } },
      PRT: { name: 'Império Português', formal: 'Reino de Portugal e Algarves', flag: { reg: 'imp_portugal', iso: 'pt' } },
      ESP: { name: 'Império Espanhol', formal: 'Império Espanhol', flag: { reg: 'imp_spain', iso: 'es' } },
      USA: { name: 'Império Americano', formal: 'Império dos Estados Unidos', flag: { iso: 'us' } },
      VNM: { name: 'Império do Vietnã', formal: 'Império do Vietnã', flag: { reg: 'imp_vietnam', iso: 'vn' } },
      HTI: { name: 'Império do Haiti', formal: 'Império do Haiti', flag: { reg: 'imp_haiti', iso: 'ht' } },
    },
    alliances: [
      { name: 'Entente Imperial', members: ['GBR', 'FRA', 'RUS', 'JPN', 'ITA', 'PRT', 'BRA'], leader: 'GBR' },
      { name: 'Aliança dos Impérios Centrais', members: ['DEU', 'AUT', 'TUR', 'BGR', 'HUN'], leader: 'DEU' },
      { name: 'Concerto do Pacífico', members: ['USA', 'MEX', 'KOR', 'CAN', 'AUS'], leader: 'USA' },
    ],
    bloc: { same: 10, diff: -18 },
  },
  {
    id: 'liberal_world', name: 'Fim da História (Mundo Liberal)', tag: '🗽', alt: true,
    desc: 'O consenso liberal venceu: democracias de mercado em quase toda parte, comércio aberto, guerras raras e um enorme poder moral — e econômico — contra quem não aderiu. Você pode ser a exceção que desafia o consenso ou mais um membro do clube.',
    rules: [
      { match: { ids: ['PRK', 'CUB', 'BLR', 'IRN', 'ERI', 'TKM', 'MMR', 'SYR'] }, set: { profile: {}, libMax: 25 } },
      { match: {}, set: { profile: { regime: 'dem', regimeName: 'Democracia liberal', align: 'W' }, libMin: 76, marketMin: 62, milMul: 0.7 } },
    ],
    entities: {},
    alliances: [
      { name: 'Comunidade das Democracias', members: ['USA', 'CAN', 'GBR', 'FRA', 'DEU', 'ITA', 'ESP', 'JPN', 'KOR', 'AUS', 'IND', 'BRA', 'MEX', 'ZAF', 'POL'], leader: 'USA' },
    ],
    bloc: { same: 14, diff: -16 },
  },
  {
    id: 'theocratic_world', name: 'Mundo Teocrático', tag: '⛪', alt: true,
    desc: 'Em toda parte o poder pertence a clérigos: califados, repúblicas cristãs, mandatos celestes e Estados budistas. A diplomacia é teológica, as guerras são santas e a fé decide alianças. Você pode ser devoto, herege ou secular.',
    rules: [
      { match: { regions: ['middle_east', 'north_africa', 'central_asia'] }, set: { profile: { gov: 'theo', govName: 'Califado', regime: 'auth', regimeName: 'Teocracia islâmica', align: 'E' }, libMax: 18, relMin: 85, milMul: 1.2 } },
      { match: { regions: ['europe', 'eastern_europe', 'balkans', 'north_america', 'south_america', 'central_america', 'caribbean', 'oceania'] }, set: { profile: { gov: 'theo', govName: 'Sacro Estado cristão', regime: 'auth', regimeName: 'Teocracia cristã', align: 'W' }, libMax: 24, relMin: 82 } },
      { match: { regions: ['east_asia', 'southeast_asia', 'south_asia'] }, set: { profile: { gov: 'theo', govName: 'Mandato do Céu / Sangha', regime: 'auth', regimeName: 'Teocracia oriental', align: 'N' }, libMax: 28, relMin: 80 } },
      { match: {}, set: { profile: { gov: 'theo', govName: 'Santuário sincrético', regime: 'auth', regimeName: 'Teocracia sincrética', align: 'N' }, libMax: 25, relMin: 78 } },
    ],
    entities: {},
    alliances: [
      { name: 'Santa Aliança Cristã', members: ['ITA', 'ESP', 'FRA', 'POL', 'BRA', 'MEX', 'USA', 'PRT', 'IRL', 'HUN'], leader: 'ITA' },
      { name: 'Califado Unido', members: ['SAU', 'IRN', 'TUR', 'EGY', 'IRQ', 'PAK', 'IDN', 'DZA', 'MAR'], leader: 'SAU' },
      { name: 'Sangha do Oriente', members: ['CHN', 'JPN', 'THA', 'KOR', 'VNM', 'MMR', 'LKA'], leader: 'CHN' },
    ],
    bloc: { same: 12, diff: -24 },
  },
  {
    id: 'continental_world', name: 'Mundo de Uniões Continentais', tag: '🌐', alt: true,
    desc: 'Cada continente se uniu numa federação: União Europeia ampliada, União Africana, União Sul-Americana, União Asiática… O mundo é um jogo de cinco ou seis superblocos com moeda, mercado e exército comuns. Você escolhe entre entrar numa união, formar a sua ou ficar de fora.',
    rules: [
      { match: {}, set: { profile: { regime: 'flawed', regimeName: 'Democracia federal' }, libMin: 55, marketMin: 40 } },
    ],
    entities: {},
    alliances: [
      { name: 'União Europeia Ampliada', members: ['DEU', 'FRA', 'ITA', 'ESP', 'POL', 'NLD', 'BEL', 'SWE', 'AUT', 'GRC', 'PRT', 'IRL', 'CZE', 'HUN', 'ROU', 'DNK', 'FIN', 'GBR', 'NOR'], leader: 'DEU' },
      { name: 'União Africana Federal', members: ['NGA', 'EGY', 'ZAF', 'ETH', 'KEN', 'GHA', 'DZA', 'MAR', 'TZA', 'AGO'], leader: 'NGA' },
      { name: 'União Sul-Americana', members: ['BRA', 'ARG', 'CHL', 'COL', 'PER', 'URY', 'PRY', 'BOL', 'ECU', 'VEN'], leader: 'BRA' },
      { name: 'Aliança do Pacífico Asiático', members: ['CHN', 'JPN', 'KOR', 'IDN', 'THA', 'VNM', 'MYS', 'PHL', 'SGP', 'AUS'], leader: 'CHN' },
      { name: 'União Norte-Americana', members: ['USA', 'CAN', 'MEX'], leader: 'USA' },
      { name: 'Comunidade Euroasiática', members: ['RUS', 'KAZ', 'BLR', 'UZB', 'ARM', 'AZE', 'GEO', 'KGZ', 'TJK'], leader: 'RUS' },
    ],
    bloc: { same: 22, diff: -8 },
  },
  {
    id: 'cold_war_world', name: 'Guerra Fria Eterna', tag: '☢', alt: true,
    desc: 'O mundo se dividiu em dois blocos rígidos que nunca chegaram a se enfrentar de fato: um bloco ocidental liderado pelos EUA e um bloco oriental liderado pela URSS. Guerras por procuração, corrida espacial, espiões e arsenais nucleares gigantes. Os não alinhados são disputados a peso de ouro.',
    rules: [
      { match: { ids: ['USA', 'GBR', 'FRA', 'DEU', 'ITA', 'JPN', 'KOR', 'CAN', 'AUS', 'ESP', 'NLD', 'BEL', 'NOR', 'DNK', 'TUR', 'GRC', 'POL', 'PRT'] }, set: { profile: { align: 'W', regime: 'dem' }, milMul: 1.35, marketMin: 55 } },
      { match: { ids: ['RUS', 'CHN', 'CUB', 'PRK', 'VNM', 'BLR', 'CZE', 'HUN', 'SVK', 'BGR', 'ROU', 'MNG', 'LAO', 'AGO', 'ETH', 'SYR', 'IRQ', 'LBY', 'SRB', 'ALB'] }, set: { profile: { gov: 'party', align: 'E', regime: 'auth', regimeName: 'Estado socialista' }, libMax: 22, marketMax: 25, milMul: 1.4 } },
      { match: {}, set: { milMul: 1.15 } },
    ],
    entities: { RUS: { name: 'União Soviética', flag: { hist: 'ussr' } }, DEU: { name: 'Alemanha Ocidental', formal: 'República Federal da Alemanha', flag: { iso: 'de' } } },
    alliances: [
      { name: 'Pacto do Atlântico Norte', members: ['USA', 'GBR', 'FRA', 'DEU', 'ITA', 'CAN', 'NOR', 'DNK', 'NLD', 'BEL', 'TUR', 'GRC', 'PRT', 'ESP'], leader: 'USA' },
      { name: 'Pacto de Varsóvia', members: ['RUS', 'POL', 'CZE', 'HUN', 'SVK', 'BGR', 'ROU', 'BLR', 'CUB', 'PRK', 'MNG'], leader: 'RUS' },
    ],
    bloc: { same: 20, diff: -28 },
  },
  {
    id: 'corporate_world', name: 'Mundo das Corporações', tag: '🏢', alt: true,
    desc: 'Estados fracos, megaempresas fortes. Quase todos os países são democracias de fachada financiadas por conglomerados globais; impostos mínimos, privatizações em série e lobby em tudo. Você pode ser o último Estado forte ou mais um balcão.',
    rules: [
      { match: { ids: ['PRK', 'CUB', 'IRN', 'BLR'] }, set: { profile: {}, marketMax: 30, libMax: 25 } },
      { match: {}, set: { profile: { regime: 'flawed', regimeName: 'Democracia corporativa', align: 'W' }, marketMin: 82, libMax: 70, milMul: 0.8 } },
    ],
    entities: {},
    alliances: [
      { name: 'Consórcio Atlântico de Comércio', members: ['USA', 'GBR', 'CAN', 'AUS', 'SGP', 'CHE', 'NLD', 'IRL', 'ARE'], leader: 'USA' },
      { name: 'Aliança Asiática de Mercado', members: ['JPN', 'KOR', 'TWN', 'HKG', 'SGP', 'MYS', 'THA', 'IDN'], leader: 'JPN' },
    ],
    bloc: { same: 10, diff: -10 },
  },
  {
    id: 'climate_collapse_world', name: 'Mundo em Colapso Climático', tag: '🌊', alt: true,
    desc: 'O aquecimento passou do ponto de não retorno: litorais engolidos, secas e furacões constantes, bilhões em movimento. Estados lutam por água, comida e terra fértil; os países frios do norte tornam-se destinos disputados. Sobreviver é a meta.',
    rules: [
      { match: { regions: ['sub_saharan_africa', 'south_asia', 'middle_east', 'north_africa', 'caribbean', 'central_america', 'oceania'] }, set: { profile: { regime: 'hybrid' }, milMul: 1.2, libMax: 55 } },
      { match: { regions: ['europe', 'north_america', 'eastern_europe'] }, set: { milMul: 1.3, marketMin: 40 } },
      { match: {}, set: { milMul: 1.1 } },
    ],
    entities: {},
    alliances: [
      { name: 'Aliança do Norte Habitável', members: ['CAN', 'NOR', 'SWE', 'FIN', 'ISL', 'RUS', 'DNK', 'GBR'], leader: 'CAN' },
      { name: 'Liga das Nações Costeiras Ameaçadas', members: ['BGD', 'MDV', 'TUV', 'KIR', 'FJI', 'PHL', 'VNM', 'NLD', 'IDN'], leader: 'BGD' },
    ],
    bloc: { same: 12, diff: -10 },
  },
];

// ---- Mundo Imperialista: fronteiras redesenhadas (impérios absorvem países; os EUA não existem) ----
const imp = scenarios.find(s => s.id === 'imperial_world');
imp.annex = {
  GBR: ['IND', 'PAK', 'BGD', 'LKA', 'MMR', 'MYS', 'SGP', 'AUS', 'NZL', 'CAN', 'ZAF', 'EGY', 'KEN', 'NGA', 'GHA', 'UGA', 'TZA', 'ZMB', 'ZWE', 'SDN', 'JAM', 'IRL', 'BTN', 'NPL', 'BRN', 'FJI', 'BWA', 'MWI', 'SLE', 'GMB', 'SOM'],
  RUS: ['KAZ', 'UZB', 'TKM', 'KGZ', 'TJK', 'UKR', 'BLR', 'GEO', 'ARM', 'AZE', 'LTU', 'LVA', 'EST', 'FIN', 'POL', 'MDA'],
  FRA: ['DZA', 'MAR', 'TUN', 'SEN', 'MLI', 'NER', 'TCD', 'CIV', 'BFA', 'GIN', 'MRT', 'MDG', 'VNM', 'LAO', 'KHM', 'BEN', 'TGO', 'CAF', 'GAB', 'COG', 'DJI', 'MCO', 'AND'],
  DEU: ['LUX', 'DNK', 'NAM', 'CHE', 'LIE', 'CMR'],
  AUT: ['HUN', 'CZE', 'SVK', 'SVN', 'HRV', 'BIH', 'MNE', 'ROU'],
  TUR: ['IRQ', 'SYR', 'LBN', 'JOR', 'ISR', 'PSX', 'SAU', 'YEM', 'KWT', 'QAT', 'ARE', 'OMN', 'BHR', 'LBY', 'ALB', 'BGR', 'MKD', 'KOS', 'CYP', 'GRC'],
  CHN: ['MNG', 'HKG', 'MAC', 'TWN'],
  KOR: ['PRK'],
  ESP: ['CUB', 'DOM', 'GNQ', 'ECU', 'COL', 'VEN', 'PER', 'BOL', 'CHL', 'ARG', 'PRY', 'PHL'],
  PRT: ['AGO', 'MOZ', 'GNB', 'CPV', 'STP', 'TLS'],
  ITA: ['ERI', 'MLT', 'SMR', 'VAT'],
  BRA: ['URY', 'SUR', 'GUY'],
  MEX: ['GTM', 'BLZ', 'SLV', 'HND', 'NIC', 'CRI', 'PAN', 'HTI'],
  NLD: ['IDN'],
  BEL: ['COD', 'RWA', 'BDI'],
  JPN: ['PNG'],
};
// Os EUA não existem: o território é repartido entre os impérios que o disputariam.
imp.partition = { USA: {
  MEX: ['Texas', 'California', 'Arizona', 'New Mexico', 'Nevada', 'Utah', 'Colorado', 'Oklahoma'],
  RUS: ['Alaska', 'Washington', 'Oregon', 'Idaho'],
  FRA: ['Louisiana', 'Mississippi', 'Arkansas', 'Missouri', 'Alabama', 'Iowa', 'Minnesota', 'Wisconsin', 'Illinois'],
  JPN: ['Hawaii'],
  ESP: ['Florida'],
  DEU: ['Wyoming', 'Montana', 'North Dakota', 'South Dakota', 'Nebraska', 'Kansas'],
  default: 'GBR',
} };
delete imp.entities.USA;
imp.entities.NLD = { name: 'Império Holandês', formal: 'Império Colonial Holandês', flag: { iso: 'nl' } };
imp.entities.BEL = { name: 'Império Belga', formal: 'Império Colonial Belga', flag: { iso: 'be' } };
imp.alliances = [
  { name: 'Entente Imperial', members: ['GBR', 'FRA', 'RUS', 'JPN', 'ITA', 'PRT', 'BRA', 'BEL'], leader: 'GBR' },
  { name: 'Aliança dos Impérios Centrais', members: ['DEU', 'AUT', 'TUR'], leader: 'DEU' },
  { name: 'Concerto do Sul e do Pacífico', members: ['MEX', 'ESP', 'KOR', 'NLD', 'CHN'], leader: 'MEX' },
];
imp.desc = 'A democracia nunca existiu e o mapa é outro: o Império Britânico controla Índia, Canadá, Austrália e a maior parte dos EUA; a Rússia imperial engole a Ásia Central e a Ucrânia; França, Alemanha, Áustria-Hungria, Otomano, Qing, México e Brasil imperiais dividem o resto. Os Estados Unidos não existem. Você pode seguir o caminho socialista ou ser o primeiro revolucionário.';
// ---- Mundo Vermelho e Guerra Fria: Estados "colados" como a URSS (vários países numa só união) ----
const SOVIET = ['UKR', 'BLR', 'MDA', 'GEO', 'ARM', 'AZE', 'KAZ', 'UZB', 'TKM', 'TJK', 'KGZ', 'EST', 'LVA', 'LTU'];
const YUG = ['HRV', 'SVN', 'BIH', 'MNE', 'MKD', 'KOS'];
const redAnnex = {
  RUS: SOVIET, SRB: YUG, CZE: ['SVK'], GBR: ['IRL'], USA: ['CAN'],
  MEX: ['GTM', 'BLZ', 'SLV', 'HND', 'NIC', 'CRI', 'PAN'], BRA: ['PRY', 'URY', 'BOL'], ARG: ['CHL'], COL: ['VEN', 'ECU', 'PER'],
  CHN: ['MNG'], VNM: ['LAO', 'KHM'], IND: ['BGD', 'NPL', 'BTN', 'LKA'], IDN: ['MYS', 'BRN', 'SGP', 'TLS'], JPN: ['KOR'], AUS: ['NZL'],
  DEU: ['AUT', 'CHE'], FRA: ['BEL', 'LUX', 'NLD'], ESP: ['PRT'], SWE: ['NOR', 'DNK', 'FIN', 'ISL'], HUN: ['ROU', 'BGR'],
  SYR: ['LBN', 'JOR', 'IRQ'], EGY: ['SDN', 'SDS', 'LBY'], DZA: ['MAR', 'TUN', 'MRT', 'SAH'], IRN: ['AFG'],
  NGA: ['GHA', 'BEN', 'TGO', 'CIV', 'SEN', 'GIN', 'SLE', 'LBR', 'GMB', 'GNB'], ETH: ['ERI', 'DJI', 'SOM'], TZA: ['KEN', 'UGA', 'RWA', 'BDI', 'MWI'],
  COD: ['COG', 'CAF', 'GAB', 'GNQ', 'CMR', 'TCD'], AGO: ['MOZ'], ZAF: ['NAM', 'BWA', 'SWZ', 'LSO', 'ZWE', 'ZMB'],
};
const UNION = {
  CZE: ['Tchecoslováquia Socialista', 'República Socialista Tchecoslovaca', { layout: 'chevron', colors: ['#ffffff', '#d7141a', '#11457e'], emblems: [] }],
  MEX: ['Federação Socialista Mesoamericana', 'Federação Socialista Mesoamericana'], ARG: ['União Socialista do Cone Sul', 'União Socialista do Cone Sul'],
  COL: ['Grande Colômbia Socialista', 'República Socialista da Grande Colômbia'], VNM: ['Federação Socialista Indochinesa', 'Federação Socialista Indochinesa'],
  IND: ['União Socialista do Subcontinente', 'União das Repúblicas Socialistas do Subcontinente'], IDN: ['Nusantara Socialista', 'República Socialista da Nusantara'],
  JPN: ['União Socialista do Leste Asiático', 'União Socialista do Leste Asiático'], SWE: ['União Socialista Nórdica', 'União das Repúblicas Socialistas Nórdicas'],
  HUN: ['Federação Socialista Danubiana', 'Federação Socialista Danubiana'], SYR: ['União Árabe Socialista', 'União Árabe Socialista'],
  EGY: ['República Árabe Unida', 'República Árabe Unida do Nilo'], NGA: ['União Socialista da África Ocidental', 'União Socialista da África Ocidental'],
  ETH: ['Federação Socialista do Chifre', 'Federação Socialista do Chifre da África'], TZA: ['União Socialista da África Oriental', 'União Socialista da África Oriental'],
  COD: ['República Popular da África Central', 'República Popular da África Central'], AGO: ['República Popular Lusófona', 'República Popular Lusófona da África'],
  ZAF: ['União Socialista da África Austral', 'União Socialista da África Austral'], IRN: ['República Socialista do Irã Unido', 'República Socialista do Irã Unido'],
  DZA: ['União Socialista do Magrebe', 'União Socialista do Magrebe'], AUS: ['União Socialista da Australásia', 'União Socialista da Australásia'], ESP: ['União Socialista Ibérica', 'União Socialista Ibérica'],
};
const rw = scenarios.find(s => s.id === 'red_world');
rw.annex = redAnnex;
for (const [id, [name, formal, flag]] of Object.entries(UNION)) rw.entities[id] = { name, formal, ...(flag ? { flag } : {}) };
rw.alliances = [
  { name: 'Internacional Socialista', members: ['RUS', 'CHN', 'SRB', 'CUB', 'VNM', 'PRK', 'CZE', 'HUN'], leader: 'RUS' },
  { name: 'Frente Popular da Europa', members: ['GBR', 'FRA', 'DEU', 'ESP', 'ITA', 'SWE', 'GRC', 'POL'], leader: 'FRA' },
  { name: 'Pacto Vermelho das Américas', members: ['USA', 'BRA', 'MEX', 'ARG', 'COL', 'CUB'], leader: 'USA' },
  { name: 'Frente Afro-Asiática Socialista', members: ['IND', 'IDN', 'EGY', 'NGA', 'ETH', 'ZAF', 'SYR', 'DZA'], leader: 'IND' },
];
rw.desc += ' Muitos países foram "colados" em uniões socialistas como a URSS: a União Soviética engloba as repúblicas do Báltico, do Cáucaso e da Ásia Central, a Iugoslávia reúne os Bálcãs, e há uniões Nórdica, Ibérica, Mesoamericana, Indochinesa, do Subcontinente e outras.';
const cw = scenarios.find(s => s.id === 'cold_war_world');
cw.annex = { RUS: SOVIET, SRB: YUG, CZE: ['SVK'] };
cw.entities.SRB = { name: 'Iugoslávia', formal: 'República Socialista Federativa da Iugoslávia', flag: { hist: 'sfry' } };
cw.entities.CZE = { name: 'Tchecoslováquia', formal: 'República Socialista Tchecoslovaca', flag: { layout: 'chevron', colors: ['#ffffff', '#d7141a', '#11457e'], emblems: [] } };
cw.desc += ' A União Soviética, a Iugoslávia e a Tchecoslováquia existem como estados unificados.';
// ---- Mundo Vermelho: todos os países socialistas recebem bandeira socialista ----
const redW = scenarios.find(s => s.id === 'red_world');
for (const r of redW.rules) { if (r.set && r.set.profile?.align === 'E') r.set.socFlag = true; for (const v of r.variants || []) v.socFlag = true; }

writeFileSync(new URL('../data/world/world_scenarios.json', import.meta.url), JSON.stringify({ _doc: 'Cenários mundiais: reescrevem os perfis de todos os países. Sandbox de história alternativa; não representam posições políticas.', scenarios }, null, 1));
console.log('cenários mundiais:', scenarios.length);
