// Converte os SVGs baixados do Wikimedia Commons (tools/raw/commons) em emblemas do editor de bandeiras:
// limpa metadados e scripts, isola ids, encaixa numa caixa 100×100 e grava data/flags/emblems-commons.json
// com título, autor, licença e link de cada arquivo (créditos exigidos por CC BY / CC BY-SA).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const RAW = new URL('./raw/commons/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', RAW), 'utf8'));
const MAX = 300000;
const out = {}, report = [];
// Revisados no navegador e descartados (recorte quebrado ou não é o símbolo pedido).
const SKIP = new Set(['a_italy', 'a_france', 'a_finland', 'a_sweden', 'a_norway', 'a_kenya', 'a_hungary', 'r_wolf_ichkeria', 'a_southafrica', 'f_fasces', 'n_garuda', 'c_hs_circle', 'c_torch_juche', 'n_judah']);

const num = s => parseFloat(s);
function viewBox(svgTag) {
  const vb = svgTag.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  if (vb) { const [x, y, w, h] = vb[1].trim().split(/[\s,]+/).map(num); return { x, y, w, h }; }
  const w = num(svgTag.match(/\swidth\s*=\s*["']([\d.]+)/i)?.[1] || 100), h = num(svgTag.match(/\sheight\s*=\s*["']([\d.]+)/i)?.[1] || 100);
  return { x: 0, y: 0, w, h };
}

function clean(inner, key) {
  let s = inner;
  s = s.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?[\s\S]*?\?>/g, '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  for (const tag of ['script', 'foreignObject', 'metadata', 'title', 'desc', 'sodipodi:namedview', 'inkscape:[a-z]+', 'rdf:RDF', 'image', 'a'])
    s = s.replace(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}>`, 'gi'), '').replace(new RegExp(`<${tag}\\b[^>]*/>`, 'gi'), '');
  s = s.replace(/<\/?(sodipodi|inkscape|rdf|cc|dc)[^>]*>/gi, '');
  s = s.replace(/\s(?:sodipodi|inkscape|xml|rdf|cc|dc):[\w-]+\s*=\s*("[^"]*"|'[^']*')/gi, '');
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '');
  s = s.replace(/(xlink:)?href\s*=\s*["'](?!#)[^"']*["']/gi, '');
  // ids únicos por emblema
  s = s.replace(/\sid\s*=\s*["']([^"']+)["']/g, (m, id) => ` id="${key}_${id}"`);
  s = s.replace(/url\(\s*['"]?#([^)'"]+)['"]?\s*\)/g, (m, id) => `url(#${key}_${id})`);
  s = s.replace(/((?:xlink:)?href)\s*=\s*["']#([^"']+)["']/g, (m, a, id) => `${a}="#${key}_${id}"`);
  // classes CSS também isoladas
  s = s.replace(/class\s*=\s*["']([^"']+)["']/g, (m, c) => `class="${c.split(/\s+/).map(x => key + '_' + x).join(' ')}"`);
  s = s.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (m, css) => `<style>${css.replace(/\.([A-Za-z_][\w-]*)/g, (mm, c) => /^\d/.test(c) ? mm : `.${key}_${c}`).replace(/#([A-Za-z_][\w-]*)\s*\{/g, (mm, id) => `#${key}_${id}{`)}</style>`);
  // números mais curtos
  s = s.replace(/(-?\d+\.\d{2})\d+/g, '$1');
  if (s.length > 40000) s = s.replace(/(-?\d+\.\d)\d/g, '$1');
  s = s.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><');
  return s.trim();
}

function colors(s) {
  const set = new Set();
  for (const m of s.matchAll(/(?:fill|stroke|stop-color)\s*[:=]\s*["']?\s*(#[0-9a-f]{3,8}|rgb\([^)]*\)|[a-z]+)/gi)) {
    const c = m[1].toLowerCase();
    if (!['none', 'transparent', 'inherit', 'currentcolor', 'url'].includes(c)) set.add(c);
  }
  return set;
}

for (const it of manifest) {
  if (SKIP.has(it.key)) { report.push(`${it.key}: descartado na revisão visual`); continue; }
  if (/\b(Flag|Bandera|Drapeau|Flaga|Bandeira)\b/i.test(it.title || '')) { report.push(`${it.key}: é uma bandeira inteira (${it.title}) — ignorado`); continue; }
  const file = new URL(it.key + '.svg', RAW);
  if (!existsSync(file)) continue;
  const raw = readFileSync(file, 'utf8');
  const open = raw.match(/<svg\b[^>]*>/i);
  if (!open) { report.push(`${it.key}: sem <svg>`); continue; }
  const vb = viewBox(open[0]);
  const inner = raw.slice(open.index + open[0].length, raw.lastIndexOf('</svg>'));
  const body = clean(inner, it.key);
  if (!body) { report.push(`${it.key}: vazio após limpeza`); continue; }
  const sc = 96 / Math.max(vb.w, vb.h), tx = 50 - vb.w * sc / 2 - vb.x * sc, ty = 50 - vb.h * sc / 2 - vb.y * sc;
  // fill herdado: atributo fill do <svg> raiz, se houver
  const rootFill = open[0].match(/\sfill\s*=\s*["']([^"']+)["']/i)?.[1];
  const svg = `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${sc.toFixed(5)})"${rootFill ? ` fill="${rootFill}"` : ''}>${body}</g>`;
  if (svg.length > (it.key === 'a_belarus' ? 1200000 : it.cat === 'arms' ? 420000 : MAX)) { report.push(`${it.key}: ${svg.length} bytes após limpeza (máx. ${MAX}) — descartado`); continue; }
  const cols = colors(svg);
  const multi = cols.size > 1;
  out[it.key] = { cat: it.cat, name: it.name, svg, multi, src: { title: it.title, url: it.url, license: it.license, artist: it.artist } };
  report.push(`${it.key}: ${svg.length} bytes, ${cols.size} cor(es)${multi ? ' (multicolor)' : ''}`);
}
writeFileSync(new URL('../data/flags/emblems-commons.json', import.meta.url), JSON.stringify({ _doc: 'Emblemas importados do Wikimedia Commons. Cada item traz arquivo, autor e licença (src). Gerado por tools/build-emblems.mjs.', emblems: out }));
const md = ['# Emblemas importados do Wikimedia Commons', '',
  'Gerado por `tools/build-emblems.mjs`. Cada símbolo mantém a licença do arquivo original; os de CC BY / CC BY-SA exigem crédito ao autor, listado abaixo. Alterações feitas: limpeza de metadados, reescala para 100×100 e opção de pintar em uma só cor.', '',
  '| Emblema | Arquivo | Autor | Licença |', '|---|---|---|---|',
  ...Object.entries(out).map(([k, e]) => `| ${e.name} (\`${k}\`) | [${e.src.title}](${e.src.url}) | ${(e.src.artist || '—').replace(/\|/g, '/')} | ${e.src.license} |`)];
writeFileSync(new URL('../docs/emblem-sources.md', import.meta.url), md.join('\n') + '\n');
console.log(report.join('\n'));
console.log(Object.keys(out).length, 'emblemas gravados');
