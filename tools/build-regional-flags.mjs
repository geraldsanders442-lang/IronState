// Minifica as bandeiras baixadas (tools/raw/regional) e gera data/flags/regional.json + docs/flag-sources.md.
// Uso: node tools/build-regional-flags.mjs   — respeita um orçamento de tamanho (prioridade 1 sempre entra).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { LIST } from './regional-flags.list.mjs';

const RAW = new URL('./raw/regional/', import.meta.url);
const man = JSON.parse(readFileSync(new URL('manifest.json', RAW), 'utf8'));
const BUDGET = +(process.env.BUDGET_KB || 3400) * 1024, MAXFILE = +(process.env.MAXFILE_KB || 70) * 1024;

const NUM = '([\\d.]+(?:e[+-]?\\d+)?)';
const attr = (tag, k) => { const v = tag.match(new RegExp('\\s' + k + '="' + NUM))?.[1]; return v == null ? NaN : Number(v); };

function minify(svg) {
  let s = svg.replace(/<\?xml[\s\S]*?\?>/g, '').replace(/<!DOCTYPE[\s\S]*?>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<metadata[\s\S]*?<\/metadata>/gi, '').replace(/<(sodipodi|inkscape):[^>]*?\/>/g, '').replace(/<(sodipodi|inkscape):[^>]*?>[\s\S]*?<\/\1:[^>]*?>/g, '');
  // Mantém xmlns:xlink (usado por <use xlink:href>); remove só os namespaces de editores.
  s = s.replace(/\s(xmlns:(?:inkscape|sodipodi|dc|cc|rdf)|inkscape:[\w-]+|sodipodi:[\w-]+|xml:space)="[^"]*"/g, '');
  s = s.replace(/<title>[\s\S]*?<\/title>|<desc>[\s\S]*?<\/desc>/gi, '');
  s = s.replace(/(\d+\.\d{3})\d+/g, '$1').replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
  let tag = s.match(/<svg[^>]*>/i)?.[0] || '';
  // Garante viewBox (algumas bandeiras só têm width/height, às vezes em notação científica).
  if (!/viewBox=/i.test(tag)) {
    const w = attr(tag, 'width'), h = attr(tag, 'height');
    if (w && h) s = s.replace(/<svg/i, `<svg viewBox="0 0 ${w} ${h}"`);
  }
  tag = s.match(/<svg[^>]*>/i)[0];
  // Arredonda as coordenadas de caminhos conforme o tamanho do viewBox (as bandeiras aparecem pequenas).
  const vb = tag.match(/viewBox="([^"]+)"/i)?.[1].trim().split(/[\s,]+/).map(Number);
  const vw = vb?.[2] || 600, dec = vw >= 20 ? 2 : 3;
  // Arredonda mantendo o formato compacto do SVG (números colados como "22.7.77"): sem zero à esquerda e com espaço antes de números que começavam com ".".
  const rnd = n => { const neg = n.startsWith('-'), lead = n.replace('-', '').startsWith('.'); let r = String(Math.abs(+n).toFixed(dec)); if (r.includes('.')) r = r.replace(/0+$/, '').replace(/\.$/, ''); r = r.replace(/^0\./, '.'); if (r === '') r = '0'; return (lead ? ' ' : '') + (neg && +r !== 0 ? '-' : '') + r; };
  s = s.replace(/\b(d|points)="([^"]+)"/g, (all, a, v) => a + '="' + v.replace(/-?\d*\.\d+/g, rnd).trim() + '"');
  s = s.replace(/\sopacity="NaN"/g, '').replace(/\s(fill|stroke)-opacity="NaN"/g, '');
  // Remove dimensões fixas.
  s = s.replace(/<svg([^>]*?)\swidth="[^"]*"/i, '<svg$1').replace(/<svg([^>]*?)\sheight="[^"]*"/i, '<svg$1');
  s = s.replace(/(<svg[^>]*?)spreserveAspectRatio="[^"]*"/i, '$1').replace(/<svg/i, '<svg preserveAspectRatio="xMidYMid meet"'); // mostra a bandeira inteira (sem cortar)
  return s;
}
const cands = [];
for (const r of LIST) {
  const m = man[r.key]; if (!m || m.failed) continue;
  const f = new URL(r.key + '.svg', RAW); if (!existsSync(f)) continue;
  const svg = minify(readFileSync(f, 'utf8'));
  if (/<script|<foreignObject|<image[^>]+href="http/i.test(svg)) continue;
  cands.push({ r, m, svg, size: Buffer.byteLength(svg) });
}
// Bandeiras que o pacote flag-icons (MIT) já traz: usadas quando o Commons ainda não foi baixado.
const FI = { gbr_scotland: 'gb-sct', gbr_wales: 'gb-wls', gbr_england: 'gb-eng', gbr_northern_ireland_the_ulster_banner: 'gb-nir', esp_catalonia: 'es-ct', esp_galicia: 'es-ga', esp_the_basque_country_basque_country: 'es-pv' };
for (const r of LIST) {
  const code = FI[r.key]; if (!code || cands.some(c => c.r.key === r.key)) continue;
  const f = new URL('./node_modules/flag-icons/flags/4x3/' + code + '.svg', import.meta.url); if (!existsSync(f)) continue;
  const svg = minify(readFileSync(f, 'utf8'));
  cands.push({ r, m: { title: 'flag-icons ' + code + '.svg', url: 'https://github.com/lipis/flag-icons', license: 'MIT (flag-icons)', artist: 'Panayiotis Lipiridis e colaboradores' }, svg, size: Buffer.byteLength(svg) });
}
// Essenciais: bandeiras de movimentos do jogo, imperiais e as que substituem entidades — sempre entram (até 420 KB).
const essential = r => !!r.mv || /^(xx_|imp_|cyn_|rus_ichkeria)/.test(r.key) || !!r.ent;
cands.sort((a, b) => (essential(b.r) - essential(a.r)) || a.size - b.size);
const flags = {}, meta = {}; let total = 0; const skipped = [];
for (const c of cands) {
  const ess = essential(c.r), cap = ess ? 420 * 1024 : MAXFILE;
  if (c.size > cap) { skipped.push(`${c.r.key} (${Math.round(c.size / 1024)}KB)`); continue; }
  if (!ess && total + c.size > BUDGET) { skipped.push(`${c.r.key} (orçamento)`); continue; }
  flags[c.r.key] = c.svg; total += c.size;
  const { names, t, ctx, pri, ...keep } = c.r;
  meta[c.r.key] = { ...keep, title: c.m.title, url: c.m.url, license: c.m.license, artist: c.m.artist };
}
writeFileSync(new URL('../data/flags/regional.json', import.meta.url), JSON.stringify({ _doc: 'Bandeiras regionais, de movimentos e imperiais do Wikimedia Commons (licenças livres). Veja docs/flag-sources.md.', meta }));
writeFileSync(new URL('../data/flags/regional.svg.json', import.meta.url), JSON.stringify({ _doc: 'Corpo SVG das bandeiras regionais (carregado sob demanda); metadados em regional.json.', flags }));
const md = ['# Bandeiras regionais e imperiais — fontes e licenças', '', 'Importadas do Wikimedia Commons por `tools/fetch-regional-flags.mjs` (somente licenças livres: domínio público, CC0, CC BY, CC BY-SA, GFDL). Minificadas por `tools/build-regional-flags.mjs`.', '', '| Chave | Nome | Arquivo | Licença | Autoria |', '|---|---|---|---|---|'];
for (const k of Object.keys(meta)) { const m = meta[k]; md.push(`| ${k} | ${m.name} | [${m.title.replace(/\|/g, '/')}](${m.url}) | ${String(m.license).replace(/\|/g, '/')} | ${String(m.artist || '—').replace(/\|/g, '/').slice(0, 90)} |`); }
writeFileSync(new URL('../docs/flag-sources.md', import.meta.url), md.join('\n') + '\n');
console.log('bandeiras:', Object.keys(flags).length, '|', Math.round(total / 1024), 'KB | puladas:', skipped.length, skipped.slice(0, 12).join(', '));
