// Mundos customizados: código compartilhável (gzip+base64) e validação de importação.
import { loadData } from './sim-data.mjs';
import { presetWorld } from '../js/sim/customworld.js';
globalThis.document ||= { getElementById: () => null, querySelector: () => null, createElement: () => ({}), body: {} };
const { encodeWorld, decodeWorld, sanitizeWorld } = await import('../js/ui/customworld-ui.js');
const data = loadData();
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const def = presetWorld(data, 'eur');
const code = await encodeWorld(def);
ok(code.startsWith('IS1:') && code.length < JSON.stringify(def).length, `código comprimido (${code.length} caracteres contra ${JSON.stringify(def).length} do JSON)`);
const back = await decodeWorld(code);
ok(back.world.nations.length === def.nations.length && back.world.nations[1].provs.length === def.nations[1].provs.length, 'ida e volta preserva nações e províncias');
const bad = structuredClone(back.world); bad.nations[0].provs = ['XXX-1', 'YYY-2']; bad.nations[1].provs.push(bad.nations[2].provs[0]);
const r = sanitizeWorld(data, bad); ok(r.dropped === 1 && r.def.nations.length === def.nations.length - 1, 'importação descarta nação sem províncias válidas');
ok(new Set(r.def.nations.flatMap(n => n.provs)).size === r.def.nations.flatMap(n => n.provs).length, 'cada província pertence a uma só nação');
let err = ''; try { await decodeWorld('lixo'); } catch (e) { err = e.message; } ok(/inválido/.test(err), 'código inválido é rejeitado');
console.log(fails ? 'FALHOU' : 'OK'); process.exit(fails ? 1 : 0);
