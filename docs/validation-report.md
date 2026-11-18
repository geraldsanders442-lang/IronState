# Relatório de validação do banco geopolítico

Gerado por `tools/validate-world.mjs` em 2026-11-17.

## Cobertura geográfica
| Item | Total |
|---|---|
| Entidades geográficas (Natural Earth Admin 0, 10m) | 258 |
| Entidades no registro | 258 |
| Províncias / subdivisões selecionáveis (Admin 1) | 4603 |
| Estados soberanos | 194 |
| Reconhecimento limitado / de facto | 6 (PSX, SOL, SAH, KOS, CYN, TWN) |
| Países constituintes | 5 (SXM, GRL, CUW, ABW, FRO) |
| Territórios dependentes | 41 |
| Arrendamentos | 2 (USG, KAB) |
| Áreas disputadas / não habitadas | 9 (BRI, CNM, KAS, SPI, BRT, PGA, BJN, SER, SCR) |
| Território internacional | 1 (ATA) |
| Membros da ONU derivados | 193 |

## Relações e alianças
| Item | Total |
|---|---|
| Relações bilaterais explícitas | 241 |
| Relações assimétricas | 5 |
| Relações com tratados formais listados | 27 |
| Organizações e blocos | 28 |
| Alianças militares formais (organizações de defesa) | 4 |
| Reivindicações territoriais | 32 |
| Províncias ocupadas no início | 4 |
| Cenários | 113 |

Pares sem registro explícito começam em 0 (neutro), com modificadores calculados pelo jogo para fronteira, alinhamento, ideologia e alianças. Nenhuma inimizade foi inventada para completar a tabela.

## Pendências
- **Erros:** 0
- **Avisos:** 7
  - Reivindicação senkaku: sem geometria correspondente no conjunto de dados (mantida como dado diplomático)
  - Reivindicação golan: sem geometria correspondente no conjunto de dados (mantida como dado diplomático)
  - Reivindicação hala_ib: sem geometria correspondente no conjunto de dados (mantida como dado diplomático)
  - Reivindicação durand: sem geometria correspondente no conjunto de dados (mantida como dado diplomático)
  - Reivindicação dokdo: sem geometria correspondente no conjunto de dados (mantida como dado diplomático)
  - Reivindicação kalapani: sem geometria correspondente no conjunto de dados (mantida como dado diplomático)
  - Reivindicação karabakh: sem geometria correspondente no conjunto de dados (mantida como dado diplomático)
- **Relações sem fonte:** 0
- **Entidades sem perfil próprio nem herdado:** 10 — BRI (Brazilian I., disputed_area); CNM (Cyprus U.N. Buffer Zone, disputed_area); KAS (Siachen Glacier, disputed_area); SPI (Southern Patagonian Ice Field, disputed_area); BRT (Bir Tawil, disputed_area); ATA (Antarctica, international); PGA (Spratly Is., disputed_area); BJN (Bajo Nuevo Bank, disputed_area); SER (Serranilla Bank, disputed_area); SCR (Scarborough Reef, disputed_area)
- **Entidades sem código ISO** (usam identificador interno ADM0_A3 do Natural Earth): 13 — ESB (Dhekelia); SOL (Somaliland); USG (USNB Guantanamo Bay); CYN (N. Cyprus); CNM (Cyprus U.N. Buffer Zone); KAS (Siachen Glacier); WSB (Akrotiri); SPI (Southern Patagonian Ice Field); BRT (Bir Tawil); PGA (Spratly Is.); BJN (Bajo Nuevo Bank); SER (Serranilla Bank); SCR (Scarborough Reef)
- **Entidades sem nenhuma relação explícita:** 131 (destas, 74 soberanas). Soberanas: MWI, TZA, SUR, COG, NAM, OMN, UZB, LUX, LAO, TUN, ZMB, SLE, GIN, LBR, CAF, DJI, LIE, SEN, BEN, AGO, BWA, SMR, TCD, SLV, TLS, BRN, MCO, MOZ, SWZ, BDI, AND, HND, TKM, LSO, CMR, GAB, TGO, GHA, GNB, MRT, GNQ, GMB, VAT, FJI, MDG, BHS, ISL, SYC, KIR, MHL, TTO, GRD, VCT, BRB, LCA, DMA, ATG, KNA, JAM, MUS, COM, STP, CPV, MLT, TON, WSM, SLB, TUV, MDV, NRU, FSM, VUT, PLW, BHR

## Confiabilidade
- Perfis de países (governo, regime, liberdade, mercado, alinhamento, recursos) e pontuações bilaterais são **estimativas de jogo** do autor, baseadas em informação amplamente divulgada até 2026; todas marcadas `review: true` e `verified: null`.
- Composição de organizações conforme conhecimento do autor em 2026; itens sensíveis a mudanças recentes estão marcados com `review: true` em `data/world/organizations.json`, com a fonte oficial a consultar.
- O conjunto Correlates of War (alianças 1816–2012) não foi incorporado: é histórico e não serve como diretório atual de alianças.
- Natural Earth (domínio público) atribui a Crimeia e Sevastopol à Rússia no Admin 1; o jogo as registra como ucranianas de jure e ocupadas pela Rússia (`data/world/claims.json`).
