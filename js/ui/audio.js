// Som sintetizado no navegador (Web Audio): efeitos e uma trilha ambiente que muda com o regime e a situação.
// Nada é baixado; tudo é gerado na hora. Controlado em Opções › Som.
let ctx = null, master = null, musicNode = null, cfg = { sfx: true, music: false, vol: 0.5 };
export function setAudio(o) { cfg = { ...cfg, ...o }; if (master) master.gain.value = cfg.vol; if (!cfg.music) stopMusic(); }
function ac() {
  if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); master = ctx.createGain(); master.gain.value = cfg.vol; master.connect(ctx.destination); }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function tone(freq, dur, { type = 'sine', vol = 0.2, at = 0, slide = 0 } = {}) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + at;
  o.type = type; o.frequency.setValueAtTime(freq, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
}
function noise(dur, vol = 0.3, lp = 800) {
  const c = ac(); if (!c) return;
  const b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  f.type = 'lowpass'; f.frequency.value = lp; g.gain.value = vol; s.buffer = b; s.connect(f); f.connect(g); g.connect(master); s.start();
}
export function sfx(kind) {
  if (!cfg.sfx) return;
  try {
    if (kind === 'click') tone(660, 0.06, { type: 'triangle', vol: 0.08 });
    if (kind === 'paper') { noise(0.25, 0.12, 3000); tone(220, 0.25, { type: 'triangle', vol: 0.06, at: 0.05 }); }
    if (kind === 'turn') { tone(196, 0.18, { type: 'square', vol: 0.05 }); tone(294, 0.25, { type: 'square', vol: 0.05, at: 0.12 }); }
    if (kind === 'good') { tone(523, 0.12, { vol: 0.12 }); tone(659, 0.12, { vol: 0.12, at: 0.1 }); tone(784, 0.25, { vol: 0.12, at: 0.2 }); }
    if (kind === 'bad') { tone(311, 0.25, { type: 'sawtooth', vol: 0.06 }); tone(233, 0.4, { type: 'sawtooth', vol: 0.06, at: 0.2 }); }
    if (kind === 'alarm') for (let i = 0; i < 3; i++) tone(880, 0.18, { type: 'square', vol: 0.05, at: i * 0.3, slide: -300 });
    if (kind === 'boom') { noise(2.5, 0.6, 400); tone(60, 2, { type: 'sine', vol: 0.4, slide: -30 }); }
  } catch {}
}
// Trilha ambiente: acordes lentos; modo menor em crise, maior em paz.
const SCALES = { calm: [0, 4, 7, 11], tense: [0, 3, 7, 10], war: [0, 1, 5, 7] };
export function startMusic(mood = 'calm', root = 110) {
  if (!cfg.music) return;
  const c = ac(); if (!c) return;
  stopMusic();
  const g = c.createGain(); g.gain.value = 0.05; g.connect(master);
  const oscs = SCALES[mood].map((st, i) => { const o = c.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = root * 2 ** (st / 12) * (i > 1 ? 2 : 1); o.detune.value = (i - 1.5) * 4; o.connect(g); o.start(); return o; });
  const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 0.03; lfo.connect(lg); lg.connect(g.gain); lfo.start();
  musicNode = { g, oscs: [...oscs, lfo], mood };
}
export function stopMusic() { if (!musicNode) return; try { for (const o of musicNode.oscs) o.stop(); musicNode.g.disconnect(); } catch {} musicNode = null; }
export const musicMood = () => musicNode?.mood;
