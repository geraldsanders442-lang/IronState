import { readFileSync } from 'node:fs';
import { prepareData } from '../js/sim/game.js';
const root = new URL('../data/', import.meta.url);
const j = f => JSON.parse(readFileSync(new URL(f, root), 'utf8'));
export function loadData() {
  const content = j('content.json');
  return prepareData({
    issues: content.issues.flatMap(f => j(f + '.json')), events: content.events.flatMap(f => j(f + '.json')), initiatives: j('initiatives.json'), policies: j('policies.json'), identity: j('identity.json'),
    geo: { countries: j('geo/countries.geo.json'), provinces: j('geo/provinces.geo.json'), edges: j('geo/edges.geo.json') },
    registry: j('world/registry.json'), relations: j('world/relations.json'), orgs: j('world/organizations.json'), claims: j('world/claims.json'), scenarios: j('world/scenarios.json'), worldScenarios: j('world/world_scenarios.json'), regionalFlags: j('flags/regional.json'),
  });
}
