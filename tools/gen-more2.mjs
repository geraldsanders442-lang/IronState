// Gera data/issues_more2.json a partir de tools/more2/*.mjs (questões sobre gabinete, saúde, impostos, minorias, economia, tecnologia, ambiente, política e mundo)
// e registra o arquivo em data/content.json. Uso: node tools/gen-more2.mjs
import { writeFileSync, readFileSync } from 'node:fs';
import { Q } from './more2/a.mjs';
import './more2/b.mjs';
import './more2/c.mjs';
const out = Q.map(x => {
  const o = { id: x.id, cat: x.cat, title: x.title, desc: x.desc };
  if (x.context) o.context = x.context;
  if (x.cond && Object.keys(x.cond).length) o.cond = x.cond;
  o.cd = x.cd ?? 500; if (x.w) o.w = x.w;
  o.options = x.options.map(([text, hint, now, groups, long]) => {
    const op = { text, hint };
    if (now && Object.keys(now).length) op.now = now;
    if (groups && Object.keys(groups).length) op.groups = groups;
    if (long?.length) op.long = long;
    return op;
  });
  return o;
});
writeFileSync(new URL('../data/issues_more2.json', import.meta.url), JSON.stringify(out, null, 1));
const cf = new URL('../data/content.json', import.meta.url), c = JSON.parse(readFileSync(cf, 'utf8'));
if (!c.issues.includes('issues_more2')) { c.issues.push('issues_more2'); writeFileSync(cf, JSON.stringify(c, null, 1)); }
console.log(out.length, 'questões geradas');
