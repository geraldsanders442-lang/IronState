// Cenários do jogador específicos de regiões: frias, latino-americanas e europeias (idempotente: substitui pelo id).
// Uso: node tools/add-regional-scenarios.mjs   — Sandbox de história alternativa; não representa fronteiras reconhecidas.
import { readFileSync, writeFileSync } from 'node:fs';
import { loadData } from '../tests/sim-data.mjs';
import { LIST } from './regional-flags.list.mjs';

const file = new URL('../data/world/scenarios.json', import.meta.url);
const db = JSON.parse(readFileSync(file, 'utf8'));
const data = loadData();
const P = data.geo.prov;
const byName = (a3, names) => names.map(n => { const p = Object.values(P).find(x => x.a3 === a3 && x.n === n); if (!p) throw new Error(`${a3}: província "${n}" não encontrada`); return p.id; });
const byRg = (a3, rgs) => { const l = Object.values(P).filter(p => p.a3 === a3 && rgs.includes(p.rg)).map(p => p.id); if (!l.length) throw new Error(`${a3}: rg ${rgs} vazio`); return l; };
const ent = ids => { for (const i of ids) if (!data.reg[i]) throw new Error('entidade inexistente ' + i); return ids; };
const f = (layout, colors, emblems = []) => ({ layout, colors, emblems });
const em = (type, color, x = 0.5, y = 0.5, s = 0.3) => ({ type, color, x, y, s });
// Bandeira real (se baixada) com a desenhada como reserva.
const rf = (a3, name, alt) => { const row = LIST.find(r => r.a3 === a3 && (r.n?.includes(name) || r.rg?.includes(name))); return row ? { reg: row.key, alt } : alt; };
const rk = (key, alt) => ({ reg: key, alt });

const NEW = [
  // ---------- Regiões frias ----------
  { id: 'karelia_republic', name: 'República da Carélia', desc: 'A Carélia russa proclamou independência: florestas, lagos, uma ferrovia estratégica e uma fronteira longa com a Finlândia. O inverno dura meio ano; Moscou não reconhece e Helsinque observa com simpatia cautelosa.', alt: true, cold: true,
    territory: { provinces: byName('RUS', ['Karelia']) }, capital: 'RUS', nation: { officialName: 'República da Carélia', shortName: 'Carélia', leader: 'Presidente Aino Hakkarainen', currency: 'Marco careliano', motto: 'Metsät ja järvet', regime: 'República parlamentar' },
    flag: rf('RUS', 'Karelia', f('h3', ['#d52b1e', '#0b3d91', '#009a44'])), start: { stability: -10, separatism: 8, infra: -6, treasury: -0.4, flags: ['cold_start'] }, rel: { RUS: -50, FIN: 25, SWE: 10, USA: 5 }, orgs: ['UN'] },
  { id: 'greater_finland', name: 'Finlândia–Carélia Unida', desc: 'Finlândia e Carélia formam um único país nórdico-báltico. Alta tecnologia, lagos, um exército de reservistas e uma fronteira de 1.300 km com a Rússia.', alt: true, cold: true,
    territory: { entities: ent(['FIN']), provinces: byName('RUS', ['Karelia']) }, capital: 'FIN', nation: { officialName: 'República da Finlândia e Carélia', shortName: 'Fino-Carélia', leader: 'Presidente Eero Lindqvist', currency: 'Euro', motto: 'Sisu', regime: 'República parlamentar' },
    flag: f('nordic', ['#ffffff', '#003580', '#003580']), start: { stability: -4, separatism: 6, readiness: 6, flags: ['cold_start'] }, rel: { RUS: -55, SWE: 15, NOR: 10, USA: 10, DEU: 5 }, orgs: ['UN', 'EU', 'NATO'] },
  { id: 'sakha_republic', name: 'República Sakha (Iacútia)', desc: 'A maior região da Rússia vira país: permafrost, diamantes, ouro, gás e as cidades mais frias do planeta. Terra imensa, população pequena e dependência total de importações de combustível e comida.', alt: true, cold: true,
    territory: { provinces: byName('RUS', ['Sakha (Yakutia)']) }, capital: 'RUS', nation: { officialName: 'República Sakha', shortName: 'Sakha', leader: 'Presidente Aisen Nikolaev', currency: 'Rublo sakha', motto: 'Frio, diamante e vontade', regime: 'República presidencialista' },
    flag: rf('RUS', 'Sakha (Yakutia)', f('h3', ['#2e75c6', '#e11a2b', '#ffffff'])), start: { stability: -12, separatism: 6, infra: -18, hunger: 4, treasury: 0.4, flags: ['cold_start'] }, rel: { RUS: -35, CHN: 10, JPN: 5 }, orgs: ['UN'] },
  { id: 'siberian_republic', name: 'República Siberiana', desc: 'A Sibéria rompe com Moscou: petróleo, gás, uma ferrovia transcontinental e vizinhos poderosos — China, Cazaquistão e Mongólia — de olho. Oito fusos horários de neve.', alt: true, cold: true,
    territory: { provinces: byRg('RUS', ['Siberian']) }, capital: 'RUS', nation: { officialName: 'República Siberiana', shortName: 'Sibéria', leader: 'Presidente Dmitri Sokolov', currency: 'Rublo siberiano', motto: 'Terra, gelo e futuro', regime: 'República federal' },
    flag: rk('xx_siberia', f('h2', ['#ffffff', '#078930'], [em('star', '#ffd700', 0.5, 0.5, 0.3)])), start: { stability: -14, separatism: 14, infra: -8, treasury: -0.3, flags: ['cold_start'] }, rel: { RUS: -55, CHN: 5, KAZ: 5, MNG: 10 }, orgs: ['UN'] },
  { id: 'alaska_free', name: 'República do Alasca', desc: 'O Alasca declara independência dos Estados Unidos. Petróleo, pesca, bases militares americanas e povos nativos com reivindicações próprias. Washington vê o território como estratégico demais para deixar sair.', alt: true, cold: true,
    territory: { provinces: byName('USA', ['Alaska']) }, capital: 'USA', nation: { officialName: 'República do Alasca', shortName: 'Alasca', leader: 'Governadora Sarah Nakamura', currency: 'Dólar do Alasca', motto: 'North to the future', regime: 'República presidencialista' },
    flag: rf('USA', 'Alaska', f('v2', ['#0b3d91', '#0b3d91'], [em('star', '#ffd700', 0.3, 0.35, 0.3)])), start: { stability: -6, separatism: 4, treasury: 0.4, flags: ['cold_start'] }, rel: { USA: -30, CAN: 15, RUS: -10, JPN: 5 }, orgs: ['UN'] },
  { id: 'sapmi_lapland', name: 'Lapônia Unida (Sápmi)', desc: 'O Norte nórdico se une: Lapônia finlandesa, Troms e Finnmark, Norrbotten e Murmansk formam um país ártico de renas, minérios, bases militares e povos sami. Quatro vizinhos desconfiam.', alt: true, cold: true,
    territory: { provinces: [...byName('FIN', ['Lapland']), ...byName('NOR', ['Troms', 'Finnmark']), ...byName('SWE', ['Norrbotten']), ...byName('RUS', ['Murmansk'])] }, capital: 'FIN', nation: { officialName: 'República da Lapônia Unida', shortName: 'Sápmi', leader: 'Presidente Ánde Gaup', currency: 'Coroa polar', motto: 'Beaivi ja dálvi', regime: 'República parlamentar' },
    flag: f('nordic', ['#c8102e', '#0b3d91', '#ffd700'], [em('circle', '#c8102e', 0.4, 0.5, 0.2)]), start: { stability: -10, separatism: 14, infra: -12, treasury: -0.2, defense: 6, flags: ['cold_start'] }, rel: { RUS: -45, NOR: -10, SWE: -5, FIN: -10 }, orgs: ['UN'] },
  { id: 'arctic_federation', name: 'Federação Ártica', desc: 'Groenlândia, Islândia e Ilhas Faroé se unem numa federação do Atlântico Norte. Pesca, aviação, terras raras e a chave de uma nova rota marítima; todos os vizinhos têm algo a dizer.', alt: true, cold: true,
    territory: { entities: ent(['GRL', 'ISL', 'FRO']) }, capital: 'ISL', nation: { officialName: 'Federação do Atlântico Norte', shortName: 'Ártica', leader: 'Primeira-ministra Katrín Olsen', currency: 'Coroa ártica', motto: 'Frio, fé e fiordes', regime: 'República parlamentar' },
    flag: f('nordic', ['#005eb8', '#ffffff', '#c8102e']), start: { stability: -4, separatism: 12, infra: -10, treasury: 0.2, flags: ['cold_start'] }, rel: { DNK: 5, USA: 5, NOR: 10, RUS: -15, CAN: 5 }, orgs: ['UN'] },
  // ---------- América Latina e Caribe ----------
  { id: 'empire_brazil', name: 'Império do Brasil restaurado', desc: 'Uma monarquia constitucional foi restaurada: o Império do Brasil volta, com Cisplatina e tudo. Bandeira imperial, Poder Moderador e um parlamento dividido entre republicanos e monarquistas. Buenos Aires desconfia.', alt: true,
    territory: { entities: ent(['BRA', 'URY']) }, capital: 'BRA', nation: { officialName: 'Império do Brasil', shortName: 'Brasil Imperial', leader: 'Imperador Pedro IV', currency: 'Real imperial', motto: 'Independência ou morte', regime: 'Monarquia constitucional' },
    flag: rk('imp_brazil', f('v3', ['#009c3b', '#ffdf00', '#009c3b'], [em('crown', '#ffdf00', 0.5, 0.5, 0.3)])), start: { stability: -10, separatism: 18, legitimacy: -4, unrestIn: ['URY'], flags: ['empire_start'] }, rel: { ARG: -25, PRY: -10, USA: 0, PRT: 10 }, orgs: ['UN', 'MERCOSUR'] },
  { id: 'amazon_republic', name: 'República Amazônica', desc: 'Os estados da Amazônia se separam do Brasil: a maior floresta do mundo, minério, biodiversidade, povos indígenas e garimpos ilegais. Pressão ambiental internacional e fronteiras difíceis de controlar.', alt: true,
    territory: { provinces: byName('BRA', ['Amazonas', 'Pará', 'Acre', 'Rondônia', 'Roraima', 'Amapá', 'Tocantins']) }, capital: 'BRA', nation: { officialName: 'República Federativa da Amazônia', shortName: 'Amazônia', leader: 'Presidente Raoni Silva', currency: 'Real amazônico', motto: 'Floresta viva, povo livre', regime: 'República federal' },
    flag: f('v2', ['#006b3c', '#006b3c'], [em('tree', '#ffd700', 0.5, 0.5, 0.4)]), start: { stability: -12, separatism: 16, infra: -22, treasury: -0.3, hunger: 2 }, rel: { BRA: -50, PER: 5, COL: 5, USA: 5, DEU: 10 }, orgs: ['UN'] },
  { id: 'platine_union', name: 'Províncias Unidas do Prata', desc: 'O sonho do Vice-Reino do Rio da Prata: Argentina, Uruguai, Paraguai e Bolívia numa só república. Pampas, soja, lítio e rivalidades históricas entre Buenos Aires e o interior.', alt: true,
    territory: { entities: ent(['ARG', 'URY', 'PRY', 'BOL']) }, capital: 'ARG', nation: { officialName: 'Províncias Unidas do Rio da Prata', shortName: 'Prata', leader: 'Presidente Martín Echeverría', currency: 'Peso platino', motto: 'En unión y libertad', regime: 'República federal' },
    flag: f('h3', ['#74acdf', '#ffffff', '#74acdf'], [em('sun', '#f6b40e', 0.5, 0.5, 0.26)]), start: { stability: -10, separatism: 22, unrestIn: ['BOL', 'PRY'] }, rel: { BRA: -15, CHL: -10, PER: 0 }, orgs: ['UN', 'MERCOSUR'] },
  { id: 'maya_republic', name: 'República Maia', desc: 'Sul do México, Guatemala e Belize se unem como uma república maia e mestiça: selvas, ruínas, café, petróleo e fortes movimentos indígenas.', alt: true,
    territory: { provinces: byName('MEX', ['Chiapas', 'Yucatán', 'Quintana Roo', 'Campeche', 'Tabasco']), entities: ent(['GTM', 'BLZ']) }, capital: 'GTM', nation: { officialName: 'República Maia Unida', shortName: 'Mayab', leader: 'Presidenta Rigoberta Tun', currency: 'Quetzal maia', motto: 'Ixim ka kuxtal', regime: 'República federal' },
    flag: f('h3', ['#00a651', '#ffffff', '#c8102e'], [em('sun', '#f2c400', 0.5, 0.5, 0.3)]), start: { stability: -12, separatism: 20, infra: -10, poverty: 5, treasury: -0.3 }, rel: { MEX: -40, USA: 0, HND: 10, SLV: 8 }, orgs: ['UN'] },
  { id: 'mexico_empire', name: 'Segundo Império Mexicano', desc: 'Uma monarquia foi restaurada no México. Coroa, hacendados, Igreja e um exército profissional contra liberais e guerrilhas. Washington olha com receio.', alt: true,
    territory: { entities: ent(['MEX']) }, capital: 'MEX', nation: { officialName: 'Império Mexicano', shortName: 'México Imperial', leader: 'Imperador Maximiliano II', currency: 'Peso imperial', motto: 'Equidad en la justicia', regime: 'Monarquia constitucional' },
    flag: rk('imp_mexico_2', f('h3', ['#006847', '#ffffff', '#ce1126'], [em('eagle', '#8b5a2b', 0.5, 0.5, 0.26)])), start: { stability: -8, separatism: 14, legitimacy: -6, flags: ['empire_start'] }, rel: { USA: -25, FRA: 12, ESP: 8, GTM: -5 }, orgs: ['UN'] },
  { id: 'antilles_federation', name: 'Federação das Antilhas', desc: 'Jamaica, Trinidad e Tobago, Barbados, Bahamas e as ilhas menores formam uma federação caribenha: turismo, furacões, remessas e a sombra dos grandes vizinhos.', alt: true,
    territory: { entities: ent(['JAM', 'TTO', 'BRB', 'BHS', 'LCA', 'VCT', 'GRD', 'ATG', 'KNA', 'DMA']) }, capital: 'JAM', nation: { officialName: 'Federação das Antilhas', shortName: 'Antilhas', leader: 'Primeira-ministra Marcia Bennett', currency: 'Dólar das Antilhas', motto: 'Muitas ilhas, um mar', regime: 'Federação parlamentar' },
    flag: f('h3', ['#00a3dd', '#ffd700', '#00a3dd'], [em('sun', '#ffffff', 0.5, 0.5, 0.26)]), start: { stability: -8, separatism: 24, infra: -6, treasury: -0.2 }, rel: { USA: 8, GBR: 10, CUB: 5, VEN: -5 }, orgs: ['UN', 'CARICOM'] },
  // ---------- Europa ----------
  { id: 'flanders_independent', name: 'Flandres independente', desc: 'Flandres deixa a Bélgica: porto de Antuérpia, indústria, língua neerlandesa e uma capital, Bruxelas, disputada. Valônia e Bruxelas ficam do outro lado.', alt: true,
    territory: { provinces: byRg('BEL', ['Flemish']) }, capital: 'BEL', nation: { officialName: 'República da Flandres', shortName: 'Flandres', leader: 'Primeiro-ministro Bart De Smet', currency: 'Euro', motto: 'Eendracht maakt macht', regime: 'República parlamentar' },
    flag: rf('BEL', 'Flemish', f('solid', ['#fcdd09'], [em('lionr', '#111111', 0.5, 0.5, 0.8)])), start: { stability: -2, separatism: 4, treasury: 0.3, reputation: -2 }, rel: { BEL: -35, NLD: 18, FRA: -5, DEU: 5 }, orgs: ['UN'] },
  { id: 'bavaria_independent', name: 'Estado Livre da Baviera', desc: 'A Baviera deixa a Alemanha: indústria automotiva, cervejarias, Alpes e um partido regional forte. Berlim fala em traição; Viena e Zurique observam.', alt: true,
    territory: { provinces: byName('DEU', ['Bayern']) }, capital: 'DEU', nation: { officialName: 'Estado Livre da Baviera', shortName: 'Baviera', leader: 'Ministro-presidente Stefan Huber', currency: 'Euro', motto: 'Mia san mia', regime: 'República parlamentar' },
    flag: rf('DEU', 'Bayern', f('checker', ['#ffffff', '#0098d4'])), start: { stability: -2, separatism: 4, treasury: 0.5 }, rel: { DEU: -30, AUT: 18, CHE: 8, ITA: 3 }, orgs: ['UN'] },
  { id: 'brittany_independent', name: 'Bretanha independente', desc: 'A Bretanha rompe com a França: língua celta, pesca, marinha mercante e um passado de resistência. Paris vê uma ameaça à unidade e à força de dissuasão no litoral.', alt: true,
    territory: { provinces: byRg('FRA', ['Bretagne']) }, capital: 'FRA', nation: { officialName: 'República da Bretanha', shortName: 'Bretanha', leader: 'Presidente Gwenaël Le Goff', currency: 'Euro', motto: 'Kentoc\'h mervel eget bezañ saotret', regime: 'República parlamentar' },
    flag: rf('FRA', 'Bretagne', f('cantonstripes', ['#ffffff', '#111111', '#ffffff'])), start: { stability: -4, separatism: 4, reputation: -2 }, rel: { FRA: -35, IRL: 15, GBR: 8, ESP: 3 }, orgs: ['UN'] },
  { id: 'danube_monarchy', name: 'Monarquia do Danúbio', desc: 'Áustria, Hungria, Tchéquia, Eslováquia, Eslovênia e Croácia voltam a formar uma monarquia dual no Danúbio. Valsas, nacionalismos rivais e vizinhos que lembram do século XX.', alt: true,
    territory: { entities: ent(['AUT', 'HUN', 'CZE', 'SVK', 'SVN', 'HRV']) }, capital: 'AUT', nation: { officialName: 'Monarquia Danubiana', shortName: 'Danúbio', leader: 'Imperador Carlos V', currency: 'Coroa danubiana', motto: 'Viribus unitis', regime: 'Monarquia constitucional' },
    flag: rk('imp_austria_hungary', f('h2', ['#c8102e', '#ffffff'])), start: { stability: -14, separatism: 30, legitimacy: -4, unrestIn: ['HUN', 'CZE', 'HRV'], flags: ['empire_start'] }, rel: { DEU: 0, ITA: -5, SRB: -25, ROU: -10, POL: 0, RUS: -15 }, orgs: ['UN', 'EU'] },
  { id: 'holy_roman_revival', name: 'Sacro Império restaurado', desc: 'Alemanha, Áustria, Suíça, Países Baixos, Bélgica, Luxemburgo e Tchéquia revivem o Sacro Império Romano-Germânico: um mosaico de ducados, cidades livres e uma coroa eletiva.', alt: true,
    territory: { entities: ent(['DEU', 'AUT', 'CHE', 'NLD', 'BEL', 'LUX', 'CZE']) }, capital: 'DEU', nation: { officialName: 'Sacro Império Romano-Germânico', shortName: 'Sacro Império', leader: 'Imperador Henrique VIII', currency: 'Táler imperial', motto: 'Renovatio Imperii', regime: 'Monarquia eletiva federal' },
    flag: rk('imp_hre', f('h2', ['#ffd700', '#111111'], [em('eagle', '#c8102e', 0.5, 0.5, 0.45)])), start: { stability: -12, separatism: 28, unrestIn: ['CHE', 'NLD', 'CZE'], flags: ['empire_start'] }, rel: { FRA: -25, ITA: -5, POL: -8, RUS: -20 }, orgs: ['UN', 'EU'] },
];

// Categorias para o filtro do assistente (frio, latino-americano, europeu).
const CATS = {
  cold: ['karelia_republic', 'greater_finland', 'sakha_republic', 'siberian_republic', 'alaska_free', 'sapmi_lapland', 'arctic_federation', 'nordic_union', 'quebec', 'ussr', 'two_nations'],
  latam: ['empire_brazil', 'amazon_republic', 'platine_union', 'maya_republic', 'mexico_empire', 'antilles_federation', 'gran_colombia', 'central_america', 'peru_bolivia'],
  europe: ['flanders_independent', 'bavaria_independent', 'brittany_independent', 'danube_monarchy', 'holy_roman_revival', 'karelia_republic', 'greater_finland', 'sapmi_lapland', 'arctic_federation', 'iberian_union', 'two_nations', 'nordic_union', 'balkan_federation', 'megali_hellas', 'greater_romania', 'catalonia', 'scotland', 'ussr', 'roman_empire'],
};
for (const s of [...db.scenarios, ...NEW]) s.cats = Object.keys(CATS).filter(c => CATS[c].includes(s.id));
const ids = new Set(NEW.map(s => s.id));
db.scenarios = [...db.scenarios.filter(s => !ids.has(s.id)), ...NEW];
writeFileSync(file, JSON.stringify(db, null, 1));
console.log('cenários regionais:', NEW.length, '| total:', db.scenarios.length);
