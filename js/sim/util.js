export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const sat = (x, ref) => 1 - Math.exp(-Math.max(0, x) / ref);
export const soft = (x, s) => (x >= 0 ? s * (1 - Math.exp(-x / s)) : -s * (1 - Math.exp(x / s)));
// Sorteio reproduzível: o estado do gerador (mulberry32) fica salvo na partida (s.rng),
// então a mesma semente e as mesmas decisões produzem a mesma história (desafio diário, replays, testes).
let RNG = null;
export function bindRng(holder) { RNG = holder || null; }
export function seedFrom(text) { let h = 2166136261; for (const ch of String(text)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function random() {
  if (!RNG) { if (globalThis.__IRON_RNG_LEAKS__) globalThis.__IRON_RNG_LEAKS__.push(new Error().stack.split(String.fromCharCode(10)).slice(2, 6).join(" <- ")); return Math.random(); }
  let x = (RNG.rng = (RNG.rng + 0x6D2B79F5) | 0);
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}
export const rand = (a = 0, b = 1) => a + random() * (b - a);
export const pick = arr => arr[Math.floor(random() * arr.length)];
export const chance = p => random() < p;
export const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export const START = Date.UTC(2030, 0, 1);
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function dateOf(day) {
  const d = new Date(START + day * 86400000);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), wd: d.getUTCDay() };
}
export function fmtDate(day, withWeek = false) {
  const t = dateOf(day);
  return (withWeek ? WEEK[t.wd] + ', ' : '') + `${t.d} ${MONTHS[t.m]} ${t.y}`;
}
export function fmtMonth(day) {
  const t = dateOf(day);
  return `${MONTH_NAMES[t.m]} de ${t.y}`;
}
export const fmtTime = min => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(Math.floor(min % 60)).padStart(2, '0')}`;
