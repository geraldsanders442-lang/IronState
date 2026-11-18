// Acrescenta cenários de história alternativa a data/world/scenarios.json (idempotente: substitui pelo id).
// Cenários são sandbox: não representam fronteiras reconhecidas nem posições políticas.
import { readFileSync, writeFileSync } from 'node:fs';
import { loadData } from '../tests/sim-data.mjs';

const file = new URL('../data/world/scenarios.json', import.meta.url);
const db = JSON.parse(readFileSync(file, 'utf8'));
const data = loadData();
const P = data.geo.prov;
const byName = (a3, names) => { const out = Object.values(P).filter(p => p.a3 === a3 && names.includes(p.n)).map(p => p.id); const miss = names.filter(n => !Object.values(P).some(p => p.a3 === a3 && p.n === n)); if (miss.length) throw new Error(a3 + ': províncias não encontradas ' + miss.join(', ')); return out; };
const byRg = (a3, rgs) => Object.values(P).filter(p => p.a3 === a3 && rgs.includes(p.rg)).map(p => p.id);
const f = (layout, colors, emblems = []) => ({ layout, colors, emblems });
const em = (type, color, x = 0.5, y = 0.5, s = 0.3) => ({ type, color, x, y, s });

const NEW = [
  { id: 'iberian_union', name: 'União Ibérica', desc: 'História alternativa: Espanha, Portugal e Andorra formam uma federação ibérica. Lisboa desconfia de Madri, catalães e bascos querem mais autonomia, e Bruxelas observa.', alt: true,
    territory: { entities: ['ESP', 'PRT', 'AND'] }, capital: 'ESP', nation: { officialName: 'União Federal Ibérica', shortName: 'Ibéria', leader: 'Presidente Álvaro Mendes', currency: 'Escudo ibérico', motto: 'Duas coroas, um destino', regime: 'Federação' },
    flag: f('h3', ['#c60b1e', '#ffc400', '#006600'], [em('shield', '#1d3e8f', 0.3, 0.5, 0.32)]), start: { stability: -6, separatism: 22, unrestIn: ['PRT'] }, rel: { FRA: 0, MAR: -10, GBR: -5 }, orgs: ['UN', 'EU', 'NATO'] },
  { id: 'two_nations', name: 'República das Duas Nações', desc: 'História alternativa: Polônia, Lituânia, Letônia e Bielorrússia renascem como a velha república polaco-lituana. Moscou vê uma ameaça; minorias russófonas resistem.', alt: true,
    territory: { entities: ['POL', 'LTU', 'LVA', 'BLR'] }, capital: 'POL', nation: { officialName: 'República das Duas Nações', shortName: 'Commonwealth', leader: 'Presidente Tadeusz Wiśniewski', currency: 'Złoty federal', motto: 'Si Deus nobiscum, quis contra nos', regime: 'República federal' },
    flag: f('h2', ['#f4f4f4', '#dc143c'], [em('eagle', '#c9a227', 0.25, 0.5, 0.34)]), start: { stability: -10, separatism: 24, unrestIn: ['BLR', 'LVA'] }, rel: { RUS: -45, DEU: 5, UKR: 10, USA: 10 }, orgs: ['UN'] },
  { id: 'nordic_union', name: 'União Nórdica', desc: 'História alternativa: Noruega, Suécia, Finlândia, Dinamarca e Islândia unificam governo, Forças Armadas e moeda. Uma potência rica e pequena demais para ser ignorada.', alt: true,
    territory: { entities: ['NOR', 'SWE', 'FIN', 'DNK', 'ISL'] }, capital: 'SWE', nation: { officialName: 'União Nórdica', shortName: 'Norden', leader: 'Primeira-ministra Ingrid Halvorsen', currency: 'Coroa nórdica', motto: 'Med lag skal land byggas', regime: 'Monarquia parlamentar federal' },
    flag: f('nordic', ['#1d3e8f', '#ffc400', '#d21034']), start: { stability: 5, separatism: 10 }, rel: { RUS: -30, USA: 10, GBR: 10, DEU: 8 }, orgs: ['UN', 'EU', 'NATO'] },
  { id: 'turan', name: 'Federação Turânica', desc: 'História alternativa: Turquia, Azerbaijão e as repúblicas turcomanas da Ásia Central formam uma federação. Rússia, China e Irã reagem; o separatismo curdo e as rivalidades dos clãs pesam.', alt: true,
    territory: { entities: ['TUR', 'AZE', 'TKM', 'UZB', 'KAZ', 'KGZ'] }, capital: 'TUR', nation: { officialName: 'Federação dos Povos Túrquicos', shortName: 'Turan', leader: 'Presidente Mehmet Aydın', currency: 'Lira turânica', motto: 'Bir millet, altı devlet', regime: 'República presidencialista' },
    flag: f('solid', ['#00a3dd', '#00a3dd', '#00a3dd'], [em('crescent', '#ffffff', 0.4, 0.5, 0.36), em('star', '#ffffff', 0.55, 0.5, 0.16)]), start: { stability: -12, separatism: 30, reputation: -5, unrestIn: ['KAZ', 'KGZ'] }, rel: { RUS: -30, CHN: -15, IRN: -25, ARM: -50, GRC: -25, CYP: -30 }, orgs: ['UN', 'NATO'] },
  { id: 'sahel_confederation', name: 'Confederação do Sahel', desc: 'Mali, Burkina Faso e Níger se fundem sob governos militares. Pobreza extrema, insurgências jihadistas no deserto e uma guinada contra a antiga metrópole.', alt: true,
    territory: { entities: ['MLI', 'BFA', 'NER'] }, capital: 'MLI', nation: { officialName: 'Confederação dos Estados do Sahel', shortName: 'Sahel', leader: 'Coronel Assimi Diarra', currency: 'Franco do Sahel', motto: 'Unité, Souveraineté, Travail', regime: 'Junta militar' },
    flag: f('h3', ['#14b53a', '#fcd116', '#ce1126'], [em('star', '#7a3e12', 0.5, 0.5, 0.26)]), start: { stability: -18, separatism: 30, hunger: 8, unrestIn: ['NER', 'BFA'] }, rel: { FRA: -40, RUS: 20, CIV: -10, NGA: -5, DZA: -5 }, orgs: ['UN', 'AES'] },
  { id: 'kurdistan', name: 'Curdistão independente', desc: 'História alternativa: as regiões curdas do Iraque, da Síria, da Turquia e do Irã proclamam um Estado. Os quatro vizinhos consideram isso uma declaração de guerra.', alt: true,
    territory: { provinces: ['IRQ-3046', 'IRQ-3050', 'IRQ-3242', 'SYR-141', 'TUR-3044', 'TUR-3047', 'TUR-3048', 'TUR-3041', 'TUR-2309', 'TUR-3042', 'TUR-3043', 'TUR-2311', 'TUR-2310', 'TUR-2308', 'TUR-3045', 'TUR-2307', 'IRN-3241', 'IRN-3239'] }, capital: 'IRQ',
    nation: { officialName: 'República do Curdistão', shortName: 'Curdistão', leader: 'Presidente Rojan Barzani', currency: 'Dinar curdo', motto: 'Ey Reqîb', regime: 'República' },
    flag: f('h3', ['#ed2024', '#ffffff', '#278e43'], [em('sun', '#febd11', 0.5, 0.5, 0.3)]), start: { stability: -15, separatism: 20, treasury: -0.5 }, rel: { TUR: -60, IRN: -50, IRQ: -45, SYR: -40, USA: 15, ISR: 10 }, orgs: ['UN'] },
  { id: 'maghreb_union', name: 'União do Magrebe', desc: 'Marrocos, Argélia, Tunísia, Líbia e Mauritânia superam rivalidades históricas e formam uma união. A questão do Saara Ocidental e o poder dos militares argelinos dominam a política.', alt: true,
    territory: { entities: ['MAR', 'DZA', 'TUN', 'LBY', 'MRT'] }, capital: 'DZA', nation: { officialName: 'União do Grande Magrebe', shortName: 'Magrebe', leader: 'Presidente Karim Benali', currency: 'Dinar magrebino', motto: 'Unidade, fé, trabalho', regime: 'República federal' },
    flag: f('v2', ['#006233', '#ffffff'], [em('crescent', '#d21034', 0.55, 0.5, 0.34)]), start: { stability: -12, separatism: 26, unrestIn: ['LBY', 'MAR'] }, rel: { ESP: -5, FRA: -15, EGY: 0, SAH: -30 }, orgs: ['UN', 'AU', 'ARAB'] },
  { id: 'gulf_union', name: 'União do Golfo', desc: 'As monarquias do Golfo fundem-se em uma confederação. Petróleo infinito, rivalidade com o Irã e famílias reais disputando o trono comum.', alt: true,
    territory: { entities: ['SAU', 'ARE', 'KWT', 'QAT', 'BHR', 'OMN'] }, capital: 'SAU', nation: { officialName: 'União das Monarquias do Golfo', shortName: 'Khalij', leader: 'Rei Faisal bin Khalid', currency: 'Khaleeji', motto: 'Deus, pátria, rei', regime: 'Monarquia absoluta federal' },
    flag: f('canton', ['#006c35', '#ffffff', '#000000'], [em('sword', '#ffffff', 0.6, 0.3, 0.3)]), start: { stability: -4, separatism: 18, treasury: 2 }, rel: { IRN: -55, USA: 15, ISR: -10, YEM: -30 }, orgs: ['UN', 'GCC', 'ARAB', 'OPEC'] },
  { id: 'korea_unified', name: 'Coreia reunificada', desc: 'O regime do Norte desabou e Seul assume o país inteiro. Vinte e cinco milhões de pessoas famintas, um arsenal nuclear órfão e China e EUA disputando a península.', alt: true,
    territory: { entities: ['KOR', 'PRK'] }, capital: 'KOR', nation: { officialName: 'República da Coreia Unificada', shortName: 'Coreia', leader: 'Presidente Kim Min-jun', currency: 'Won', motto: 'Hongik Ingan', regime: 'República presidencialista' },
    flag: f('solid', ['#ffffff', '#ffffff', '#ffffff'], [em('circle', '#cd2e3a', 0.5, 0.5, 0.36)]), start: { stability: -14, separatism: 20, poverty: 8, hunger: 6, unrestIn: ['PRK'] }, rel: { CHN: -15, USA: 15, JPN: 0, RUS: -10 }, orgs: ['UN'] },
  { id: 'indochina', name: 'Federação Indochinesa', desc: 'Vietnã, Laos e Camboja formam uma federação socialista. Hanói comanda; os cambojanos resistem; a China vigia o Mar do Sul.', alt: true,
    territory: { entities: ['VNM', 'LAO', 'KHM'] }, capital: 'VNM', nation: { officialName: 'República Socialista da Indochina', shortName: 'Indochina', leader: 'Secretário-Geral Nguyen Van Thanh', currency: 'Dong federal', motto: 'Independência, liberdade, felicidade', regime: 'Estado socialista' },
    flag: f('h2', ['#da251d', '#1d3e8f'], [em('star', '#ffcd00', 0.5, 0.5, 0.34)]), start: { stability: -8, separatism: 22, unrestIn: ['KHM'] }, rel: { CHN: -20, THA: -15, USA: 0, RUS: 10 }, orgs: ['UN', 'ASEAN'] },
  { id: 'greater_romania', name: 'Grande Romênia', desc: 'Romênia e Moldávia se unificam. A Transnístria se recusa a aceitar, e Moscou ameaça.', alt: true,
    territory: { entities: ['ROU', 'MDA'] }, capital: 'ROU', nation: { officialName: 'România Mare', shortName: 'Romênia', leader: 'Presidente Andrei Popescu', currency: 'Leu', motto: 'Nihil sine Deo', regime: 'República semipresidencialista' },
    flag: f('v3', ['#002b7f', '#fcd116', '#ce1126'], [em('eagle', '#7a5a12', 0.5, 0.5, 0.26)]), start: { stability: -4, separatism: 16, unrestIn: ['MDA'] }, rel: { RUS: -30, HUN: -8, UKR: 0 }, orgs: ['UN', 'EU', 'NATO'] },
  { id: 'peru_bolivia', name: 'Confederação Peru-Boliviana', desc: 'O velho sonho de Santa Cruz volta: Peru e Bolívia unidos nos Andes. O Chile vê a ressurreição de um inimigo do século XIX.', alt: true,
    territory: { entities: ['PER', 'BOL'] }, capital: 'PER', nation: { officialName: 'Confederação Peru-Boliviana', shortName: 'Confederação Andina', leader: 'Presidente Rafael Quispe', currency: 'Sol andino', motto: 'Firme y feliz por la unión', regime: 'Confederação' },
    flag: f('h3', ['#d91023', '#ffffff', '#007934'], [em('sun', '#f9e300', 0.5, 0.5, 0.28)]), start: { stability: -8, separatism: 18, unrestIn: ['BOL'] }, rel: { CHL: -35, ECU: -5, BRA: 5, ARG: 5 }, orgs: ['UN', 'ANDEAN'] },
  { id: 'catalonia', name: 'Catalunha independente', desc: 'Barcelona proclamou a independência após um referendo. Madri não reconhece, o euro está em dúvida e as empresas ameaçam partir.', alt: true,
    territory: { provinces: ['ESP-5809', 'ESP-5820', 'ESP-5831', 'ESP-5846'] }, capital: 'ESP', nation: { officialName: 'República Catalã', shortName: 'Catalunha', leader: 'President Jordi Puig', currency: 'Euro (provisório)', motto: 'Som i serem', regime: 'República parlamentarista' },
    flag: f('h3', ['#fcdd09', '#da121a', '#fcdd09'], [em('star', '#ffffff', 0.18, 0.5, 0.26)]), start: { stability: -8, separatism: 6, reputation: -4 }, rel: { ESP: -40, FRA: -10, AND: 20 }, orgs: ['UN'] },
  { id: 'scotland', name: 'Escócia independente', desc: 'A Escócia deixou o Reino Unido. Petróleo do Mar do Norte, uma base de submarinos nucleares britânicos em seu litoral e um pedido de volta à União Europeia.', alt: true,
    territory: { provinces: byRg('GBR', ['Highlands and Islands', 'North Eastern', 'Eastern', 'South Western']) }, capital: 'GBR', nation: { officialName: 'Reino da Escócia', shortName: 'Escócia', leader: 'First Minister Fiona MacLeod', currency: 'Libra escocesa', motto: 'Nemo me impune lacessit', regime: 'Monarquia parlamentar' },
    flag: f('saltire', ['#005eb8', '#ffffff', '#ffffff']), start: { stability: -3, separatism: 8, treasury: 0.5 }, rel: { GBR: -20, IRL: 15, NOR: 10, USA: 0 }, orgs: ['UN'] },
  { id: 'quebec', name: 'Quebec independente', desc: 'O terceiro referendo deu certo: o Quebec é soberano. Ottawa negocia a dívida, os povos indígenas do norte reivindicam suas terras e Paris comemora.', alt: true,
    territory: { provinces: ['CAN-683'] }, capital: 'CAN', nation: { officialName: 'République du Québec', shortName: 'Quebec', leader: 'Première ministre Geneviève Tremblay', currency: 'Dollar québécois', motto: 'Je me souviens', regime: 'República parlamentarista' },
    flag: f('cross', ['#003da5', '#ffffff', '#ffffff'], [em('crown', '#ffffff', 0.2, 0.23, 0.18)]), start: { stability: -4, separatism: 14 }, rel: { CAN: -18, FRA: 25, USA: -5, BEL: 10 }, orgs: ['UN'] },
  { id: 'california', name: 'República da Califórnia', desc: 'História alternativa: a Califórnia se separa dos Estados Unidos. A quinta economia do mundo, sem Exército, com Washington furioso e o Vale do Silício em pânico.', alt: true,
    territory: { provinces: ['USA-3521'] }, capital: 'USA', nation: { officialName: 'República da Califórnia', shortName: 'Califórnia', leader: 'Governadora Elena Ramírez', currency: 'Dólar californiano', motto: 'Eureka', regime: 'República presidencialista' },
    flag: f('hcenter', ['#ffffff', '#ffffff', '#bf0a30'], [em('star', '#bf0a30', 0.15, 0.25, 0.18), em('lion', '#5c3a14', 0.5, 0.5, 0.3)]), start: { stability: -6, readiness: -12, equipment: -8, reputation: 2 }, rel: { USA: -28, MEX: 15, CAN: 5, CHN: 8 }, orgs: ['UN'] },
  { id: 'roman_empire', name: 'Império Romano', desc: 'História alternativa: o Império Romano nunca caiu e chega ao século XXI com as fronteiras do auge de Trajano (c. 117 d.C.) — do muro de Adriano ao Eufrates, do Atlântico ao Mar Negro. Dezenas de povos sob a mesma águia, um Senado decorativo, legiões caras e vizinhos que lembram muito bem quem os conquistou.', alt: true,
    territory: {
      entities: ['ITA', 'SMR', 'VAT', 'MLT', 'FRA', 'MCO', 'ESP', 'PRT', 'AND', 'GIB', 'BEL', 'LUX', 'CHE', 'LIE', 'AUT', 'SVN', 'HRV', 'BIH', 'SRB', 'MNE', 'KOS', 'MKD', 'ALB', 'GRC', 'BGR', 'ROU', 'CYP', 'CYN', 'ESB', 'WSB', 'TUR', 'SYR', 'LBN', 'ISR', 'PSX', 'JOR', 'EGY', 'TUN'],
      provinces: [
        ...Object.values(P).filter(p => p.a3 === 'GBR' && !['Highlands and Islands', 'North Eastern', 'Eastern', 'South Western', 'Northern Ireland'].includes(p.rg)).map(p => p.id),
        ...byName('NLD', ['Zeeland', 'Noord-Brabant', 'Limburg', 'Zuid-Holland', 'Utrecht', 'Gelderland']),
        ...byName('DEU', ['Rheinland-Pfalz', 'Saarland', 'Baden-Württemberg']),
        ...byRg('HUN', ['Western Transdanubia', 'Southern Transdanubia', 'Central Transdanubia', 'Central Hungary']),
        ...Object.values(P).filter(p => p.a3 === 'DZA' && p.c[1] <= 292).map(p => p.id),
        ...byName('MAR', ['Tanger - Tétouan', 'Gharb - Chrarda - Béni Hssen', 'Rabat - Salé - Zemmour - Zaer', 'Fès - Boulemane', 'Meknès - Tafilalet', 'Taza - Al Hoceima - Taounate']),
        ...Object.values(P).filter(p => p.a3 === 'LBY' && p.c[1] <= 326).map(p => p.id),
      ] },
    capital: 'ITA', nation: { officialName: 'Imperium Romanum', shortName: 'Roma', leader: 'Imperator Marcus Ulpius Valens', currency: 'Denário', motto: 'Senatus Populusque Romanus', regime: 'Império' },
    flag: f('solid', ['#7a0e0e', '#7a0e0e', '#7a0e0e'], [em('laurel', '#d4a017', 0.5, 0.5, 0.82), em('eagle', '#d4a017', 0.5, 0.48, 0.55)]),
    start: { flags: ['rome'], stability: -14, separatism: 38, reputation: -10, readiness: 10, equipment: 4, unrestIn: ['GBR', 'EGY', 'ISR', 'PSX', 'SYR', 'TUR', 'DZA', 'ESP', 'ROU', 'MAR'] },
    rel: { DEU: -45, NLD: -30, IRN: -55, IRQ: -45, SAU: -25, ARM: -15, GEO: -10, UKR: -15, MDA: -20, POL: -20, CZE: -25, SVK: -20, DNK: -15, SDN: -20, RUS: -15, USA: -20 },
    claimsBy: [
      { holder: 'DEU', entities: ['DEU'], just: 'A Germânia Magna: a conquista que Augusto não completou.' },
      { holder: 'GBR', provinces: Object.values(P).filter(p => p.a3 === 'GBR' && ['Highlands and Islands', 'North Eastern', 'Eastern', 'South Western'].includes(p.rg)).map(p => p.id), just: 'A Caledônia, além do muro de Adriano.' },
      { holder: 'IRQ', entities: ['IRQ'], just: 'A Mesopotâmia conquistada por Trajano em 116.' },
      { holder: 'ARM', entities: ['ARM'], just: 'A província da Armênia de Trajano.' },
    ],
    orgs: ['UN'] },
  { id: 'megali_hellas', name: 'Megali Hellas', desc: 'História alternativa: a "Grande Ideia" venceu. Uma Grécia agressiva e expansionista tomou Constantinopla, a Trácia, a costa da Jônia, o Épiro do Norte, a Macedônia do sul e partes da Bulgária, e quer mais: o Ponto, Esmirna inteira, o resto da Trácia. Os vizinhos humilhados querem vingança; as minorias anexadas, liberdade.', alt: true,
    territory: {
      entities: ['GRC', 'CYP', 'CYN', 'ESB', 'WSB'],
      provinces: [
        ...byName('TUR', ['Edirne', 'Kirklareli', 'Tekirdag', 'Istanbul', 'Çanakkale', 'Balikesir', 'Bursa', 'Yalova', 'Izmir', 'Manisa', 'Aydin', 'Mugla', 'Denizli', 'Usak']),
        ...byName('ALB', ['Gjirokastër', 'Vlorë', 'Korçë', 'Berat']),
        ...byName('BGR', ['Smolyan', 'Kardzhali', 'Haskovo', 'Blagoevgrad', 'Burgas']),
        ...Object.values(P).filter(p => p.a3 === 'MKD' && p.c[1] >= 253).map(p => p.id),
      ] },
    capital: 'TUR', capitalProv: 'TUR-2265', nation: { officialName: 'Megali Hellas — Reino da Grande Grécia', shortName: 'Hélade', leader: 'Primeiro-ministro Konstantinos Mavrogenis', currency: 'Dracma', motto: 'Eleftheria i thanatos', regime: 'Monarquia constitucional' },
    flag: f('cantonstripes', ['#0d5eaf', '#ffffff', '#0d5eaf'], [em('cross', '#ffffff', 0.22, 0.28, 0.5), em('eagle2', '#d4a017', 0.72, 0.62, 0.32, )]),
    start: { flags: ['megali'], stability: -12, separatism: 34, reputation: -15, readiness: 18, equipment: 10, defense: 6, unrestIn: ['TUR', 'ALB', 'BGR', 'MKD'] },
    rel: { TUR: -80, ALB: -55, BGR: -50, MKD: -50, SRB: 10, ARM: 20, ITA: -10, RUS: -5, EGY: -10, FRA: 5, GBR: 5, USA: 0, ROU: -5 },
    claimsBy: [
      { holder: 'TUR', provinces: byName('TUR', ['Trabzon', 'Rize', 'Giresun', 'Ordu', 'Samsun', 'Sinop', 'Kocaeli', 'Sakarya', 'Antalya', 'Afyonkarahisar', 'Kütahya', 'Eskisehir']), just: 'O Ponto e a Anatólia ocidental: as terras gregas da "Grande Ideia".' },
      { holder: 'BGR', provinces: byName('BGR', ['Plovdiv', 'Varna', 'Pazardzhik', 'Stara Zagora']), just: 'A Rumélia Oriental e o litoral do Mar Negro.' },
      { holder: 'ALB', provinces: byName('ALB', ['Fier', 'Elbasan', 'Durrës']), just: 'O Épiro inteiro.' },
      { holder: 'MKD', entities: ['MKD'], just: 'A Macedônia histórica.' },
    ],
    orgs: ['UN'] },
];
for (const sc of NEW) {
  const miss = [...(sc.territory.entities || []).filter(e => !data.reg[e]), ...(sc.territory.provinces || []).filter(p => !P[p])];
  if (miss.length) throw new Error(sc.id + ': ids inexistentes ' + miss.join(','));
  for (const o of sc.orgs) if (!data.wOrgById[o] && o !== 'UN') throw new Error(sc.id + ': organização ' + o);
  for (const r in sc.rel) if (!data.reg[r]) throw new Error(sc.id + ': rel ' + r);
  const i = db.scenarios.findIndex(x => x.id === sc.id);
  if (i >= 0) db.scenarios[i] = sc; else db.scenarios.push(sc);
}
writeFileSync(file, JSON.stringify(db, null, 1));
console.log('cenários:', db.scenarios.length, '| escócia:', NEW.find(x => x.id === 'scotland').territory.provinces.length, 'províncias');
