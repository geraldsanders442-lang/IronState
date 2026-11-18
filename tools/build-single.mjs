// Gera IronState.html: um único arquivo com código, estilos e todos os dados embutidos (abre com dois cliques, sem servidor).
import { readFileSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
const json = p => JSON.parse(read('data/' + p + '.json'));

const content = json('content');
const files = ['content', ...content.issues, ...content.events, 'initiatives', 'policies', 'identity', 'geo/countries.geo', 'geo/provinces.geo', 'geo/edges.geo',
  'world/registry', 'world/relations', 'world/organizations', 'world/claims', 'world/scenarios', 'flags/current', 'flags/historical', 'flags/emblems-commons', 'world/world_scenarios', 'flags/regional'];
const data = Object.fromEntries(files.map(f => [f, json(f)]));

const bundle = await build({ entryPoints: [fileURLToPath(new URL('js/ui/app.js', root))], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020', legalComments: 'none' });
const js = bundle.outputFiles[0].text;
const css = read('css/style.css');
let html = read('index.html');
const safe = s => s.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
html = html.replace('<link rel="stylesheet" href="css/style.css">', `<style>\n${css}\n</style>`);
html = html.replace('<script type="module" src="js/ui/app.js"></script>', () =>
  `<script>window.__IRON_DATA__=${safe(JSON.stringify(data))};</script>\n<script>${safe(js)}</script>`);
writeFileSync(new URL('IronState.html', root), html);
console.log('IronState.html', (Buffer.byteLength(html) / 1024 / 1024).toFixed(2) + ' MB', '| arquivos de dados:', files.length);
