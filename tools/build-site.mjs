// Gera o site dividido para o GitHub Pages: index.html pequeno + assets/app.min.js (JS empacotado e minificado) + css/style.css,
// com os dados em data/*.json buscados sob demanda (o Pages já serve tudo comprimido). Rode: node tools/build-site.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
const bundle = await build({ entryPoints: [fileURLToPath(new URL('js/ui/app.js', root))], bundle: true, format: 'esm', minify: true, write: false, target: 'es2020', legalComments: 'none' });
const js = bundle.outputFiles[0].text;
mkdirSync(new URL('assets/', root), { recursive: true });
writeFileSync(new URL('assets/app.min.js', root), js);
const v = createHash('sha1').update(js).update(read('css/style.css')).digest('hex').slice(0, 8);
let html = read('dev.html');
html = html.replace('href="css/style.css"', `href="css/style.css?v=${v}"`).replace('src="js/ui/app.js"', `src="assets/app.min.js?v=${v}"`);
writeFileSync(new URL('index.html', root), html);
console.log('site dividido: index.html', (Buffer.byteLength(html) / 1024).toFixed(1) + ' KB | assets/app.min.js', (js.length / 1024).toFixed(0) + ' KB | versão', v);
