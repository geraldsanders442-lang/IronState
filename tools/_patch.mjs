// Utilitário local: aplica substituições exatas respeitando CRLF. Uso: node tools/_patch.mjs <arquivo> <json com [[de,para],...]>
import fs from 'node:fs';
export function patch(file, pairs) {
  let t = fs.readFileSync(file, 'utf8'); const crlf = t.includes('\r\n');
  for (let [a, b] of pairs) {
    if (crlf) { a = a.split('\n').join('\r\n'); b = b.split('\n').join('\r\n'); }
    if (!t.includes(a)) throw new Error(`não encontrado em ${file}: ${a.slice(0, 80)}`);
    t = t.replace(a, () => b);
  }
  fs.writeFileSync(file, t);
}
