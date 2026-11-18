// Valida o banco geopolítico contra o conjunto geográfico e gera docs/validation-report.md.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const j = p => JSON.parse(readFileSync(new URL('../data/' + p, import.meta.url), 'utf8'));
const geoC = j('geo/countries.geo.json').countries, geoP = j('geo/provinces.geo.json').provinces;
const reg = j('world/registry.json').entities, prof = j('world/profiles.json');
const rels = j('world/relations.json').rel, orgs = j('world/organizations.json').orgs, claims = j('world/claims.json'), scen = j('world/scenarios.json').scenarios;
const errors = [], warnings = [];
const E = m => errors.push(m), Wn = m => warnings.push(m);

// Cobertura geográfica
const geoIds = Object.keys(geoC), regIds = Object.keys(reg);
for (const id of geoIds) if (!reg[id]) E(`Entidade geográfica sem registro: ${id}`);
for (const id of regIds) if (!geoC[id]) E(`Registro sem geometria: ${id}`);
const provTotal = Object.values(geoP).reduce((a, l) => a + l.length, 0);
for (const a3 in geoP) if (!reg[a3]) E(`Províncias de país inexistente: ${a3}`);
for (const id of regIds) if (!(geoP[id] || []).length) E(`Entidade sem províncias: ${id}`);
const cats = {};
for (const e of Object.values(reg)) (cats[e.cat] ||= []).push(e.id);
for (const e of Object.values(reg)) {
  if (!/^[A-Z0-9]{3}$/.test(e.id)) E(`Identificador inválido: ${e.id}`);
  if (e.parent && !reg[e.parent]) E(`${e.id}: soberano inexistente ${e.parent}`);
  if (['dependency', 'constituent', 'lease'].includes(e.cat) && !e.parent) Wn(`${e.id}: território sem soberano definido`);
}
const noIso = Object.values(reg).filter(e => !e.iso2).map(e => `${e.id} (${e.nameEn})`);
const profileMissing = Object.values(reg).filter(e => e.profileSource === 'default').map(e => `${e.id} (${e.nameEn}, ${e.cat})`);
const sovNoCurated = Object.values(reg).filter(e => ['sovereign', 'partially_recognized'].includes(e.cat) && e.profileSource !== 'curated').map(e => e.id);
for (const id of sovNoCurated) E(`Estado sem perfil curado: ${id}`);
for (const k in prof) if (!k.startsWith('_')) { const a = prof[k]; if (!reg[k]) E(`Perfil para ID inexistente: ${k}`); if (!Array.isArray(a) || a.length !== 9) E(`Perfil malformado: ${k}`); else if (a[2] < 0 || a[2] > 100 || a[3] < 0 || a[3] > 100) E(`Perfil fora da escala: ${k}`); }

// Relações bilaterais
const TYPES = j('world/relations.json').types;
const seen = new Set(); const relCount = {};
let noSrc = 0;
for (const r of rels) {
  const key = [r.a, r.b].sort().join('|');
  if (seen.has(key)) E(`Relação duplicada: ${key}`); seen.add(key);
  if (!reg[r.a] || !reg[r.b]) E(`Relação com ID inexistente: ${r.a}-${r.b}`);
  if (r.a === r.b) E(`Relação consigo mesmo: ${r.a}`);
  for (const k of ['s', 'ba']) if (r[k] != null && (r[k] < -100 || r[k] > 100)) E(`Pontuação inválida ${r.a}-${r.b}`);
  for (const k of ['tr', 'ec', 'mi', 'tt', 'hg', 'sc']) if (r[k] != null && (r[k] < 0 || r[k] > 100)) E(`Atributo ${k} fora de 0-100: ${r.a}-${r.b}`);
  if (!TYPES.includes(r.t)) E(`Tipo de relação inválido ${r.t}: ${r.a}-${r.b}`);
  if (!r.src?.length) { noSrc++; Wn(`Relação sem fonte: ${r.a}-${r.b}`); }
  if (!r.n) Wn(`Relação sem explicação: ${r.a}-${r.b}`);
  if (!['high', 'medium', 'low'].includes(r.c)) E(`Confiança inválida: ${r.a}-${r.b}`);
  if (r.ba != null && r.sym !== false) Wn(`Relação assimétrica sem sym:false: ${r.a}-${r.b}`);
  relCount[r.a] = (relCount[r.a] || 0) + 1; relCount[r.b] = (relCount[r.b] || 0) + 1;
}
// Organizações e alianças formais
const UN = Object.values(reg).filter(e => e.cat === 'sovereign' && e.id !== 'VAT').length;
let defenseOrgs = 0;
const memberOf = {};
for (const o of orgs) {
  const m = o.rule ? null : o.members || [];
  if (o.type === 'defense' || o.kind) defenseOrgs++;
  for (const id of [...(m || []), ...(o.suspended || []), ...(o.partners || []), ...(o.observers || []), ...(o.candidates || [])]) if (!reg[id]) E(`${o.id}: membro inexistente ${id}`);
  for (const id of o.suspended || []) if (m && !m.includes(id) && o.id !== 'MERCOSUR' && o.id !== 'CSTO') Wn(`${o.id}: suspenso ${id} não listado entre membros`);
  if (m && new Set(m).size !== m.length) E(`${o.id}: membros duplicados`);
  if (!o.src?.length) Wn(`${o.id}: organização sem fonte`);
  for (const id of m || []) (memberOf[id] ||= []).push(o.id);
}
const bilateralTreaties = rels.filter(r => (r.tre || []).length).length;
for (const r of rels) if (r.t === 'defense_ally' && !(r.tre || []).length && !(memberOf[r.a] || []).some(o => (memberOf[r.b] || []).includes(o) && orgs.find(x => x.id === o)?.kind)) Wn(`Aliança de defesa ${r.a}-${r.b} sem tratado nem organização de defesa em comum`);
if (orgs.find(o => o.id === 'NATO').members.length !== 32) E('OTAN deveria ter 32 membros');
if (orgs.find(o => o.id === 'EU').members.length !== 27) E('UE deveria ter 27 membros');
if (UN !== 193) E(`Contagem de membros da ONU derivada = ${UN}, esperado 193`);
// Reivindicações e cenários
const provIds = new Set(Object.values(geoP).flat().map(p => p.id));
for (const c of claims.claims) {
  if (!reg[c.claimant] || !reg[c.holder]) E(`Reivindicação ${c.id}: ID inexistente`);
  for (const p of c.target.provinces || []) if (!provIds.has(p)) E(`Reivindicação ${c.id}: província inexistente ${p}`);
  for (const e of c.target.entities || []) if (!reg[e]) E(`Reivindicação ${c.id}: entidade inexistente ${e}`);
  if (!(c.target.provinces || []).length && !(c.target.entities || []).length) Wn(`Reivindicação ${c.id}: sem geometria correspondente no conjunto de dados (mantida como dado diplomático)`);
}
for (const pid in claims.occupied) if (!pid.startsWith('_') && !provIds.has(pid)) E(`Ocupação: província inexistente ${pid}`);
for (const s of scen) {
  for (const e of s.territory?.entities || []) if (!reg[e]) E(`Cenário ${s.id}: entidade inexistente ${e}`);
  for (const p of s.territory?.provinces || []) if (!provIds.has(p)) E(`Cenário ${s.id}: província inexistente ${p}`);
  for (const k in s.rel || {}) if (!['west', 'east', 'all', 'neighbors'].includes(k) && !reg[k]) E(`Cenário ${s.id}: relação com ID inexistente ${k}`);
  for (const o of s.orgs || []) if (!orgs.find(x => x.id === o)) E(`Cenário ${s.id}: organização inexistente ${o}`);
}
const noRel = Object.values(reg).filter(e => !relCount[e.id]);
const noRelSov = noRel.filter(e => e.cat === 'sovereign');

const md = `# Relatório de validação do banco geopolítico

Gerado por \`tools/validate-world.mjs\` em ${new Date().toISOString().slice(0, 10)}.

## Cobertura geográfica
| Item | Total |
|---|---|
| Entidades geográficas (Natural Earth Admin 0, 10m) | ${geoIds.length} |
| Entidades no registro | ${regIds.length} |
| Províncias / subdivisões selecionáveis (Admin 1) | ${provTotal} |
| Estados soberanos | ${(cats.sovereign || []).length} |
| Reconhecimento limitado / de facto | ${(cats.partially_recognized || []).length} (${(cats.partially_recognized || []).join(', ')}) |
| Países constituintes | ${(cats.constituent || []).length} (${(cats.constituent || []).join(', ')}) |
| Territórios dependentes | ${(cats.dependency || []).length} |
| Arrendamentos | ${(cats.lease || []).length} (${(cats.lease || []).join(', ')}) |
| Áreas disputadas / não habitadas | ${(cats.disputed_area || []).length} (${(cats.disputed_area || []).join(', ')}) |
| Território internacional | ${(cats.international || []).length} (${(cats.international || []).join(', ')}) |
| Membros da ONU derivados | ${UN} |

## Relações e alianças
| Item | Total |
|---|---|
| Relações bilaterais explícitas | ${rels.length} |
| Relações assimétricas | ${rels.filter(r => r.ba != null).length} |
| Relações com tratados formais listados | ${bilateralTreaties} |
| Organizações e blocos | ${orgs.length} |
| Alianças militares formais (organizações de defesa) | ${defenseOrgs} |
| Reivindicações territoriais | ${claims.claims.length} |
| Províncias ocupadas no início | ${Object.keys(claims.occupied).filter(k => !k.startsWith('_')).length} |
| Cenários | ${scen.length} |

Pares sem registro explícito começam em 0 (neutro), com modificadores calculados pelo jogo para fronteira, alinhamento, ideologia e alianças. Nenhuma inimizade foi inventada para completar a tabela.

## Pendências
- **Erros:** ${errors.length}${errors.length ? '\n' + errors.map(e => `  - ${e}`).join('\n') : ''}
- **Avisos:** ${warnings.length}${warnings.length ? '\n' + warnings.map(e => `  - ${e}`).join('\n') : ''}
- **Relações sem fonte:** ${noSrc}
- **Entidades sem perfil próprio nem herdado:** ${profileMissing.length}${profileMissing.length ? ' — ' + profileMissing.join('; ') : ''}
- **Entidades sem código ISO** (usam identificador interno ADM0_A3 do Natural Earth): ${noIso.length} — ${noIso.join('; ')}
- **Entidades sem nenhuma relação explícita:** ${noRel.length} (destas, ${noRelSov.length} soberanas). Soberanas: ${noRelSov.map(e => e.id).join(', ')}

## Confiabilidade
- Perfis de países (governo, regime, liberdade, mercado, alinhamento, recursos) e pontuações bilaterais são **estimativas de jogo** do autor, baseadas em informação amplamente divulgada até 2026; todas marcadas \`review: true\` e \`verified: null\`.
- Composição de organizações conforme conhecimento do autor em 2026; itens sensíveis a mudanças recentes estão marcados com \`review: true\` em \`data/world/organizations.json\`, com a fonte oficial a consultar.
- O conjunto Correlates of War (alianças 1816–2012) não foi incorporado: é histórico e não serve como diretório atual de alianças.
- Natural Earth (domínio público) atribui a Crimeia e Sevastopol à Rússia no Admin 1; o jogo as registra como ucranianas de jure e ocupadas pela Rússia (\`data/world/claims.json\`).
`;
mkdirSync(new URL('../docs/', import.meta.url), { recursive: true });
writeFileSync(new URL('../docs/validation-report.md', import.meta.url), md);
console.log({ entities: geoIds.length, registry: regIds.length, provinces: provTotal, sovereign: (cats.sovereign || []).length, relations: rels.length, orgs: orgs.length, claims: claims.claims.length, errors: errors.length, warnings: warnings.length, noRelation: noRel.length });
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
