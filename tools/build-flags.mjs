// Copia as bandeiras atuais (flag-icons, MIT) para um único JSON local e gera o manifesto de origem/licença.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const pkgDir = new URL('./node_modules/flag-icons/', import.meta.url);
const reg = JSON.parse(readFileSync(new URL('data/world/registry.json', root), 'utf8')).entities;
const pkg = JSON.parse(readFileSync(new URL('package.json', pkgDir), 'utf8'));
const have = new Set(readdirSync(new URL('flags/4x3/', pkgDir)).map(f => f.replace('.svg', '')));
const want = new Set(Object.values(reg).map(e => e.iso2?.toLowerCase()).filter(Boolean));
want.add('eu'); want.add('un');
const out = {};
for (const code of want) {
  if (!have.has(code)) continue;
  let svg = readFileSync(new URL(`flags/4x3/${code}.svg`, pkgDir), 'utf8');
  svg = svg.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
  out[code] = svg;
}
mkdirSync(new URL('data/flags/', root), { recursive: true });
writeFileSync(new URL('data/flags/current.json', root), JSON.stringify(out));
const manifest = {
  current: { package: 'flag-icons', version: pkg.version, url: 'https://github.com/lipis/flag-icons', license: 'MIT', copyright: 'Copyright (c) 2013 Panayiotis Lipiridis', note: 'SVGs derivados majoritariamente de arquivos do Wikimedia Commons, em sua maioria em domínio público como símbolos nacionais. Empacotados localmente; o jogo não baixa imagens em tempo de execução.', count: Object.keys(out).length, codes: Object.keys(out).sort() },
  historical: { file: 'data/flags/historical.json', source: 'Desenhadas para o projeto a partir de descrições históricas (designs de bandeiras estatais antigas, considerados de domínio público). Bandeiras e iconografia do Terceiro Reich foram excluídas deliberadamente.' },
  wikimedia: { investigated: 'https://commons.wikimedia.org/w/api.php (MediaWiki API, prop=imageinfo&iiprop=url|extmetadata)', decision: 'A API expõe licença por arquivo (extmetadata.LicenseShortName); como o pacote flag-icons já reúne as bandeiras nacionais em SVG sob MIT, ele foi usado para evitar download dinâmico e checagem arquivo a arquivo.' },
};
writeFileSync(new URL('data/flags/manifest.json', root), JSON.stringify(manifest, null, 1));
const size = Buffer.byteLength(JSON.stringify(out));
console.log('flags', Object.keys(out).length, Math.round(size / 1024) + 'KB');
