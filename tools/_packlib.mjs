// Utilitários dos pacotes de questões regionais (tools/gen-pack-*.mjs).
import { writeFileSync, readFileSync } from 'node:fs';
const out = f => new URL('../data/' + f, import.meta.url);
export const o = (text, hint, now = {}, groups = {}, more = {}) => ({ text, hint, now, groups, ...more });
// K(cond, categoria) devolve (id, título, descrição, contexto, opções) => questão.
export const K = (cond, cat) => (id, title, desc, context, options) => ({ id, cat, title, desc, context, cond, w: 1, cd: 420, options });
export function writePack(name, list) {
  const ids = new Set();
  for (const x of list) { if (ids.has(x.id)) throw new Error('id duplicado ' + x.id); ids.add(x.id); }
  writeFileSync(out(`issues_pack_${name}.json`), JSON.stringify(list, null, 1));
  const cp = out('content.json'), c = JSON.parse(readFileSync(cp, 'utf8'));
  if (!c.issues.includes('issues_pack_' + name)) { c.issues.push('issues_pack_' + name); writeFileSync(cp, JSON.stringify(c, null, 1)); }
  console.log(name, list.length);
}
