// Regiões do mundo (mais finas que as do registro): usadas em condições de questões e eventos (`wr`),
// nos filtros de cenários, nas macro-regiões e nos cenários regionais. Um país pode estar em várias.
export const WORLD_REGIONS = {
  central_asia: { name: 'Ásia Central', ids: 'UZB KAZ TJK KGZ TKM' },
  southeast_asia: { name: 'Sudeste Asiático', ids: 'IDN MYS VNM KHM LAO THA TLS BRN MMR PHL SGP' },
  south_asia: { name: 'Sul da Ásia', ids: 'IND BTN PAK BGD AFG NPL LKA MDV' },
  east_asia: { name: 'Extremo Oriente', ids: 'CHN KOR PRK MNG HKG TWN JPN MAC' },
  middle_east: { name: 'Oriente Médio (Ásia Ocidental)', ids: 'IRN IRQ SYR LBN ISR PSX JOR SAU KWT QAT BHR ARE OMN YEM TUR CYP CYN' },
  gulf: { name: 'Golfo Pérsico', ids: 'IRN IRQ SAU KWT QAT BHR ARE OMN' },
  levant: { name: 'Levante', ids: 'SYR LBN ISR PSX JOR CYP' },
  caucasus: { name: 'Cáucaso', ids: 'GEO AZE ARM' },
  balkans: { name: 'Balcãs', ids: 'MKD ALB KOS SRB HRV SVN MNE BIH BGR ROU GRC' },
  mediterranean: { name: 'Mediterrâneo', ids: 'ESP FRA ITA MLT GRC TUR CYP LBN ISR SYR EGY LBY TUN DZA MAR HRV SVN ALB MNE' },
  nordic: { name: 'Países Nórdicos', ids: 'NOR SWE FIN DNK ISL FRO' },
  baltic: { name: 'Bálticos', ids: 'LTU EST LVA' },
  british_isles: { name: 'Ilhas Britânicas', ids: 'GBR IRL IMN JEY GGY' },
  western_europe: { name: 'Europa Ocidental', ids: 'FRA DEU LUX BEL AUT CHE NLD LIE MCO GBR IRL' },
  central_europe: { name: 'Europa Central', ids: 'POL CZE SVK HUN AUT SVN DEU' },
  eastern_europe: { name: 'Europa Oriental', ids: 'UKR BLR RUS MDA' },
  iberia: { name: 'Península Ibérica', ids: 'ESP PRT AND GIB' },
  north_america: { name: 'América do Norte', ids: 'USA CAN GRL' },
  caribbean: { name: 'Caribe', ids: 'HTI DOM CUB BHS TCA TTO GRD VCT BRB LCA DMA ATG KNA JAM CYM PRI MSR AIA VGB VIR' },
  central_america: { name: 'América Central', ids: 'CRI NIC SLV GTM HND MEX BLZ PAN' },
  andes: { name: 'Região Andina', ids: 'PER BOL ECU COL VEN CHL' },
  southern_cone: { name: 'Cone Sul', ids: 'CHL ARG URY PRY' },
  amazon: { name: 'Amazônia e Guianas', ids: 'BRA SUR GUY VEN COL PER BOL ECU' },
  south_america: { name: 'América do Sul', ids: 'BRA CHL BOL PER ARG SUR GUY URY ECU COL PRY VEN' },
  north_africa: { name: 'Norte da África', ids: 'MAR SAH LBY TUN DZA EGY' },
  sahel: { name: 'Sahel', ids: 'MRT MLI BFA NER TCD SDN ERI' },
  west_africa: { name: 'África Ocidental', ids: 'SLE GIN LBR CIV MLI SEN NGA BEN NER BFA TGO GHA GNB MRT GMB CPV' },
  central_africa: { name: 'África Central', ids: 'COG COD CAF AGO TCD CMR GAB GNQ STP BDI RWA' },
  east_africa: { name: 'África Oriental', ids: 'ETH SDS SOM KEN TZA UGA DJI ERI RWA BDI SOL MWI' },
  horn_africa: { name: 'Chifre da África', ids: 'ETH SOM DJI ERI SOL KEN' },
  southern_africa: { name: 'África Austral', ids: 'ZAF NAM BWA SWZ LSO ZWE ZMB MWI MOZ AGO MDG' },
  indian_ocean: { name: 'Oceano Índico', ids: 'MDG COM MUS SYC MDV' },
  subsaharan: { name: 'África Subsaariana', ids: 'SLE GIN LBR CIV MLI SEN NGA BEN NER BFA TGO GHA GNB MRT GMB CPV COG COD CAF AGO TCD CMR GAB GNQ STP BDI RWA ETH SDS SOM KEN MWI TZA SOL ZMB DJI ERI ZWE MOZ UGA MDG COM NAM ZAF BWA SWZ LSO MUS SYC' },
  oceania: { name: 'Oceania', ids: 'AUS NZL PNG FJI NCL SLB VUT' },
  pacific_islands: { name: 'Ilhas do Pacífico', ids: 'KIR MHL NRU FSM PLW GUM MNP PYF COK TON WLF WSM TUV NIU ASM FJI SLB VUT PNG' },
};
for (const r of Object.values(WORLD_REGIONS)) r.ids = r.ids.split(' ');

let BY = null;
const index = () => { if (BY) return BY; BY = {}; for (const [k, r] of Object.entries(WORLD_REGIONS)) for (const id of r.ids) (BY[id] ||= []).push(k); return BY; };
export const wrOf = id => index()[id] || [];
export const wrNames = keys => keys.map(k => WORLD_REGIONS[k]?.name || k);
// Regiões do mundo de um conjunto de ids de países (ponderadas apenas por presença).
export const wrOfIds = ids => [...new Set(ids.flatMap(wrOf))];
