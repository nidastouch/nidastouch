"use client";

/*
  Camera sounds, synthesized in the browser, so there is nothing to license. Stand-ins until Leo
  records the real ones off his a7S III (shutter, focus beep, record beep, a dial click).

  Browsers only allow sound after a tap or click, and every sound here is fired from one.
  The on/off choice is remembered in localStorage.
*/

const KEY = "nt-sound";
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

export const soundOn = () => typeof window !== "undefined" && localStorage.getItem(KEY) !== "off";
export const setSound = (on: boolean) => localStorage.setItem(KEY, on ? "on" : "off");

const ac = () => {
  if (!soundOn()) return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
};

// a short burst of filtered noise: the "tick" in every mechanical sound
const tick = (c: AudioContext, at: number, freq: number, q: number, len: number, gain: number) => {
  const src = c.createBufferSource();
  src.buffer = noise;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + 0.0012);
  g.gain.exponentialRampToValueAtTime(0.0008, at + len);
  src.connect(bp).connect(g).connect(c.destination);
  src.start(at, Math.random() * 0.3, len + 0.02);
};

// a low body knock under the tick, so it feels like a part moving, not a beep
const knock = (c: AudioContext, at: number, from: number, to: number, len: number, gain: number) => {
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(from, at);
  o.frequency.exponentialRampToValueAtTime(to, at + len);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0008, at + len);
  o.connect(g).connect(c.destination);
  o.start(at);
  o.stop(at + len + 0.02);
};

const tone = (c: AudioContext, at: number, freq: number, len: number, gain: number) => {
  const o = c.createOscillator();
  o.type = "square";
  o.frequency.value = freq;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 3200;
  const g = c.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + 0.004);
  g.gain.setValueAtTime(gain, at + len - 0.01);
  g.gain.linearRampToValueAtTime(0, at + len);
  o.connect(lp).connect(g).connect(c.destination);
  o.start(at);
  o.stop(at + len + 0.02);
};

// a tiny haptic tick on Android, only inside a real press (a dial turning by itself on scroll stays silent to the hand)
const buzz = (ms: number | number[]) => {
  try {
    const ua = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation;
    if (ua && !ua.isActive) return;
    navigator.vibrate?.(ms);
  } catch { /* not on iOS */ }
};

/** a dial clicking into its next detent */
export const detent = () => {
  buzz(6);
  const c = ac(); if (!c) return;
  const t = c.currentTime + 0.005;
  tick(c, t, 4200, 3, 0.012, 0.5);
  knock(c, t, 520, 180, 0.018, 0.12);
};

/** a keycap or rubber button going down */
export const press = () => {
  buzz(8);
  const c = ac(); if (!c) return;
  const t = c.currentTime + 0.005;
  tick(c, t, 2600, 1.6, 0.02, 0.45);
  knock(c, t, 170, 70, 0.04, 0.35);
};

/** a toggle switch flipping over */
export const flip = () => {
  buzz([5, 30, 5]);
  const c = ac(); if (!c) return;
  const t = c.currentTime + 0.005;
  tick(c, t, 3400, 2.4, 0.014, 0.45);
  tick(c, t + 0.035, 2200, 2, 0.02, 0.35);
  knock(c, t + 0.035, 240, 90, 0.03, 0.2);
};

// a few damped, out-of-tune partials: the ring of a small metal part
const ring = (c: AudioContext, at: number, freqs: number[], len: number, gain: number) => {
  freqs.forEach((f, i) => {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(f, at);
    const g = c.createGain();
    g.gain.setValueAtTime(gain / (i + 1), at);
    g.gain.exponentialRampToValueAtTime(0.0004, at + len * (1 - i * 0.18));
    o.connect(g).connect(c.destination);
    o.start(at);
    o.stop(at + len + 0.02);
  });
};

// the shutter re-cocking itself: a short buzzy whirr
const whirr = (c: AudioContext, at: number, len: number, gain: number) => {
  const src = c.createBufferSource();
  src.buffer = noise;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 950;
  bp.Q.value = 2.2;
  const g = c.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + 0.01);
  g.gain.linearRampToValueAtTime(0, at + len);
  const lfo = c.createOscillator();
  lfo.type = "square";
  lfo.frequency.value = 170;
  const depth = c.createGain();
  depth.gain.value = gain * 0.8;
  lfo.connect(depth).connect(g.gain);
  src.connect(bp).connect(g).connect(c.destination);
  src.start(at, Math.random() * 0.2, len + 0.02);
  lfo.start(at);
  lfo.stop(at + len + 0.02);
};

/** half press: just the button taking up its first bit of travel */
export const halfPress = () => {
  const c = ac(); if (!c) return;
  const t = c.currentTime + 0.005;
  tick(c, t, 5200, 2, 0.005, 0.18);
};

/** full press: a mechanical focal plane shutter. first curtain, second curtain, then it cocks again */
export const shutter = () => {
  buzz([12, 50, 12]);
  const c = ac(); if (!c) return;
  const t = c.currentTime + 0.005;
  tick(c, t, 3800, 0.9, 0.007, 0.9);
  ring(c, t, [1180, 2470, 3930], 0.04, 0.07);
  knock(c, t, 125, 55, 0.035, 0.5);
  tick(c, t + 0.064, 3200, 0.9, 0.006, 0.75);
  ring(c, t + 0.064, [1320, 2710, 4210], 0.032, 0.06);
  knock(c, t + 0.064, 110, 50, 0.03, 0.42);
  whirr(c, t + 0.115, 0.075, 0.05);
};

/** record start (one beep) and stop (two) */
export const recStart = () => { buzz(10); const c = ac(); if (!c) return; tone(c, c.currentTime + 0.01, 1960, 0.11, 0.06); };
export const recStop = () => {
  buzz([8, 60, 8]);
  const c = ac(); if (!c) return;
  const t = c.currentTime + 0.01;
  tone(c, t, 1960, 0.07, 0.06);
  tone(c, t + 0.11, 1960, 0.07, 0.06);
};
