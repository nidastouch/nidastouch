"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./touch.module.css";

/*
  The Touch.

  Every clip file holds two copies of the same shot: flat, and finished. Desktop files stack them
  top and bottom, phone files sit them side by side. The shader shows the flat half everywhere and
  the finished half wherever the "touch" is. One decoder per clip, so the halves never drift.

  The coffee is real S-Log3 off the a7S III through the Nidas LUT. The Pearl was shot in
  S-Cinetone, so its flat half is an imitation of log and its finished half is how it was shot.
  The readout says which, so the site never claims log it doesn't have.

  Input decides the interaction, not screen width:
    mouse  -> the grade follows the cursor, grows while it rests, a click blooms it outward
    finger -> a tap blooms the grade from the fingertip, then it recedes (a drag is a scroll)
    nobody -> a slow light circles the subject, so the frame never sits dead
  Scrolling the hero away finishes the grade over the whole frame.

  Clips play in turn. The next one preloads in a second <video> while the current one plays,
  and only one decodes at a time.
*/

type Shape = "landscape" | "portrait";
type ClipMedia = { video: string; still: string; log: string; graded: string; focal: { x: number; y: number } };
type Clip = {
  id: string;
  place: string;
  from: string; // what the flat half is, honestly
  to: string;   // what the finished half is
  srcIn: number; // seconds into the camera file where the cut starts, for the timecode
  speed: number; // camera seconds per playback second (0.5 = half speed)
  fps: number;   // the camera's frame rate, for the timecode's frame field
  landscape: ClipMedia;
  portrait: ClipMedia;
};

const BASE = "/lab/touch";
const media = (name: string, shape: "desktop" | "mobile", focal: { x: number; y: number }): ClipMedia => ({
  video: `${BASE}/${name}-${shape}.mp4`,
  still: `${BASE}/${name}-${shape}-pack.jpg`,
  log: `${BASE}/${name}-${shape}-log.jpg`,
  graded: `${BASE}/${name}-${shape}-graded.jpg`,
  focal,
});

const CLIPS: Clip[] = [
  {
    id: "C0267", place: "home", from: "S-Log3", to: "Rec.709", srcIn: 4.5, speed: 1, fps: 24,
    landscape: media("coffee", "desktop", { x: 0.42, y: 0.46 }),
    portrait: media("coffee", "mobile", { x: 0.5, y: 0.44 }),
  },
  {
    id: "C0647", place: "the pearl", from: "flat", to: "S-Cinetone", srcIn: 1, speed: 0.5, fps: 60,
    landscape: media("pearl", "desktop", { x: 0.5, y: 0.3 }),
    portrait: media("pearl", "mobile", { x: 0.5, y: 0.32 }),
  },
  {
    // Garner, the cypress from the grade swipe. His posted grade, matched off the Resolve still
    // (media-src/touch/fitlut.py); the phone window follows the trunk as the camera moves.
    id: "C0447", place: "garner", from: "S-Log3", to: "graded", srcIn: 0, speed: 1, fps: 24,
    landscape: media("cypress", "desktop", { x: 0.52, y: 0.42 }),
    portrait: media("cypress", "mobile", { x: 0.5, y: 0.4 }),
  },
];

const PACKING: Record<Shape, { pack: number; halfAspect: number }> = {
  landscape: { pack: 0, halfAspect: 16 / 9 }, // stacked: top flat, bottom finished
  portrait: { pack: 1, halfAspect: 9 / 16 },  // side by side: left flat, right finished
};

const MAX_POINTS = 6;
const FADE = 0.45; // seconds of dip at each cut

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() { v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform float u_halfAspect;
uniform float u_pack;
uniform float u_time;
uniform float u_scale;
uniform vec4 u_pts[${MAX_POINTS}];
uniform float u_global;
uniform float u_fade;
varying vec2 v_uv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
  vec2 px = uv * u_res;

  float ca = u_res.x / u_res.y;
  vec2 s = vec2(1.0);
  if (ca > u_halfAspect) s.y = u_halfAspect / ca; else s.x = ca / u_halfAspect;
  vec2 c = clamp((uv - 0.5) * s + 0.5, 0.002, 0.998);

  vec2 uvFlat = u_pack < 0.5 ? vec2(c.x, c.y * 0.5) : vec2(c.x * 0.5, c.y);
  vec2 uvDone = u_pack < 0.5 ? vec2(c.x, 0.5 + c.y * 0.5) : vec2(0.5 + c.x * 0.5, c.y);
  vec3 flatC = texture2D(u_tex, uvFlat).rgb;
  vec3 doneC = texture2D(u_tex, uvDone).rgb;

  float n = fbm(px * 0.0045 / u_scale + vec2(u_time * 0.12, -u_time * 0.08));
  float m = 0.0;
  for (int i = 0; i < ${MAX_POINTS}; i++) {
    vec4 p = u_pts[i];
    if (p.w > 0.001) {
      float d = distance(px, p.xy);
      float r = p.z * (0.82 + 0.36 * n);
      float soft = max(p.z * 0.38, 1.0);
      m = max(m, p.w * (1.0 - smoothstep(r - soft, r, d)));
    }
  }
  if (u_global > 0.001) {
    float dc = distance(uv, vec2(0.5)) * 1.5 + (n - 0.5) * 0.18;
    float reach = u_global * 1.35;
    m = max(m, 1.0 - smoothstep(reach - 0.28, reach, dc));
  }
  m = clamp(m, 0.0, 1.0);

  vec3 col = mix(flatC, doneC, m);
  float rim = smoothstep(0.0, 0.5, m) * (1.0 - smoothstep(0.5, 1.0, m));
  col += vec3(1.0, 0.76, 0.40) * rim * 0.16;
  col += (hash(px + fract(u_time * 7.0) * 113.0) - 0.5) * 0.03;

  gl_FragColor = vec4(col * u_fade, 1.0);
}
`;

type Pt = { x: number; y: number; r: number; rTo: number; s: number; sTo: number; born: number };

const smooth = (cur: number, to: number, rate: number, dt: number) => cur + (to - cur) * (1 - Math.exp(-rate * dt));
const two = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");

export type Readout = { n: number; of: number; id: string; place: string; from: string; to: string; tc: string; graded: number };

export default function TouchHero({ children }: { children?: (r: Readout) => React.ReactNode }) {
  const wrapRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vidA = useRef<HTMLVideoElement>(null);
  const vidB = useRef<HTMLVideoElement>(null);
  const [shape, setShape] = useState<Shape | null>(null);
  const [live, setLive] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [readout, setReadout] = useState<Readout>({
    n: 1, of: CLIPS.length, id: CLIPS[0].id, place: CLIPS[0].place, from: CLIPS[0].from, to: CLIPS[0].to,
    tc: "00:00:04:12", graded: 0,
  });

  useEffect(() => {
    const pick = () => setShape(window.innerHeight > window.innerWidth ? "portrait" : "landscape");
    pick();
    window.addEventListener("resize", pick);
    return () => window.removeEventListener("resize", pick);
  }, []);

  useEffect(() => {
    if (!shape) return;
    const pk = PACKING[shape];
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const vids = [vidA.current!, vidB.current!];

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl || reduce) { setFallback(true); return; }
    setFallback(false);
    setLive(false);

    const fine = window.matchMedia("(pointer: fine)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, fine ? 2 : 1.5);

    // ---- GL
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { setFallback(true); return; }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = U("u_res"), uTime = U("u_time"), uPts = U("u_pts"), uGlobal = U("u_global"), uFade = U("u_fade");
    gl.uniform1f(U("u_halfAspect"), pk.halfAspect);
    gl.uniform1f(U("u_pack"), pk.pack);
    gl.uniform1f(U("u_scale"), dpr);

    let haveFrame = false;
    const upload = (src: TexImageSource) => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
      if (!haveFrame) { haveFrame = true; setLive(true); }
    };

    // ---- clips: a still per clip, two players that take turns
    const stills = CLIPS.map((c) => { const im = new Image(); im.src = c[shape].still; return im; });
    stills[0].onload = () => { if (!haveFrame) upload(stills[0]); };

    let ci = 0;    // the clip on screen
    let slot = 0;  // the player holding it
    let playing = false;
    const dirty = [false, false];
    const lastT = [-1, -1];

    const load = (v: HTMLVideoElement, clip: Clip) => {
      const want = clip[shape].video;
      if (v.getAttribute("src") === want) { v.currentTime = 0; v.pause(); return; }
      v.muted = true; v.playsInline = true; v.loop = false; v.preload = "auto";
      v.setAttribute("src", want);
      v.load();
    };
    load(vids[0], CLIPS[0]);
    if (CLIPS.length > 1) load(vids[1], CLIPS[1]);

    const tryPlay = () => vids[slot].play().then(() => { playing = true; }).catch(() => { /* Low Power Mode: stay on the still */ });
    vids[0].addEventListener("canplay", tryPlay, { once: true });

    type RVFC = (cb: () => void) => number;
    vids.forEach((v, i) => {
      const rvfc = (v as unknown as { requestVideoFrameCallback?: RVFC }).requestVideoFrameCallback?.bind(v);
      if (!rvfc) { dirty[i] = true; return; }
      const tick = () => { dirty[i] = true; rvfc(tick); };
      rvfc(tick);
    });
    const hasRVFC = "requestVideoFrameCallback" in HTMLVideoElement.prototype;

    let switching = false;
    const advance = () => {
      if (switching) return;
      switching = true;
      const old = vids[slot];
      if (CLIPS.length < 2) { old.currentTime = 0; old.play().catch(() => {}); switching = false; return; }
      slot = 1 - slot;
      ci = (ci + 1) % CLIPS.length;
      const v = vids[slot];
      v.currentTime = 0;
      lastT[slot] = -1;
      v.play().then(() => { playing = true; }).catch(() => {});
      if (v.readyState < 2) upload(stills[ci]);
      old.pause();
      load(old, CLIPS[(ci + 1) % CLIPS.length]);
      switching = false;
    };
    vids.forEach((v) => v.addEventListener("ended", () => { if (v === vids[slot]) advance(); }));

    // ---- size
    let W = 1, H = 1;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W; canvas.height = H;
      gl.viewport(0, 0, W, H);
      gl.uniform2f(uRes, W, H);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ---- the touch
    const now = () => performance.now() / 1000;
    const base = () => Math.min(W, H) * (fine ? 0.16 : 0.22);
    const cursor: Pt = { x: W / 2, y: H / 2, r: 0, rTo: 0, s: 0, sTo: 0, born: 0 };
    const drift: Pt = { x: W / 2, y: H / 2, r: 0, rTo: 0, s: 0, sTo: 0, born: 0 };
    let blooms: Pt[] = [];
    let mouse = { x: W / 2, y: H / 2, inside: false, still: 0 };
    let lastInput = -10;

    const toCanvas = (cx: number, cy: number) => {
      const r = canvas.getBoundingClientRect();
      return { x: (cx - r.left) * dpr, y: (cy - r.top) * dpr };
    };
    const bloom = (x: number, y: number) => {
      blooms.push({ x, y, r: 0, rTo: Math.max(W, H) * (fine ? 0.42 : 0.55), s: 1, sTo: 1, born: now() });
      blooms = blooms.slice(-4);
      lastInput = now();
      if (!playing) tryPlay();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const p = toCanvas(e.clientX, e.clientY);
      mouse = { x: p.x, y: p.y, inside: true, still: 0 };
      lastInput = now();
    };
    const onLeave = () => { mouse.inside = false; };
    const onClick = (e: MouseEvent) => { const p = toCanvas(e.clientX, e.clientY); if (fine) bloom(p.x, p.y); };

    let down: { x: number; y: number; t: number } | null = null;
    const onDown = (e: PointerEvent) => { if (e.pointerType !== "mouse") down = { x: e.clientX, y: e.clientY, t: now() }; };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || !down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      if (moved < 12 && now() - down.t < 0.35) { const p = toCanvas(e.clientX, e.clientY); bloom(p.x, p.y); }
      down = null;
    };
    const onCancel = () => { down = null; };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onCancel);
    canvas.addEventListener("click", onClick);

    // The hero is pinned under the page, so "on screen" means "not yet covered": decided by scroll,
    // not by an IntersectionObserver (a pinned element always intersects).
    let onScreen = true;
    const coverAt = () => window.innerHeight * 1.6;
    const onScroll = () => {
      const vis = window.scrollY < coverAt();
      if (vis === onScreen) return;
      onScreen = vis;
      const v = vids[slot];
      if (onScreen) { if (playing) v.play().catch(() => {}); } else v.pause();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const io = { disconnect: () => window.removeEventListener("scroll", onScroll) };

    // ---- loop
    const ptsArr = new Float32Array(MAX_POINTS * 4);
    let raf = 0, last = now(), lastReadout = 0;
    const t0 = now();

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!onScreen) return;
      const t = now(), dt = Math.min(0.05, t - last);
      last = t;

      const prog = Math.min(1, Math.max(0, window.scrollY / (wrap.clientHeight * 0.7)));
      const global = prog * prog * (3 - 2 * prog);

      const clip = CLIPS[ci];
      const focal = clip[shape].focal;

      if (fine && mouse.inside) {
        mouse.still += dt;
        cursor.x = smooth(cursor.x, mouse.x, 9, dt);
        cursor.y = smooth(cursor.y, mouse.y, 9, dt);
        cursor.rTo = base() * (1 + Math.min(1.6, Math.max(0, mouse.still - 0.4) * 0.9));
        cursor.sTo = 1;
      } else cursor.sTo = 0;
      cursor.r = smooth(cursor.r, cursor.rTo, 5, dt);
      cursor.s = smooth(cursor.s, cursor.sTo, 6, dt);

      const idle = t - lastInput > 2.5 && !(fine && mouse.inside);
      const k = (t - t0) * 0.22;
      drift.x = smooth(drift.x, W * (focal.x + 0.12 * Math.sin(k * 1.3)), 2, dt);
      drift.y = smooth(drift.y, H * (focal.y + 0.09 * Math.sin(k * 0.9 + 1.2)), 2, dt);
      drift.rTo = base() * 1.3;
      drift.r = smooth(drift.r, drift.rTo, 3, dt);
      drift.s = smooth(drift.s, idle ? 0.9 : 0, idle ? 0.8 : 4, dt);

      blooms = blooms.filter((b) => {
        const age = t - b.born;
        b.r = smooth(b.r, b.rTo, 2.2, dt);
        const hold = fine ? 2.4 : 1.6;
        b.s = age < hold ? 1 : Math.max(0, 1 - (age - hold) / 2.2);
        return b.s > 0.002;
      });

      const pts = [cursor, drift, ...blooms].slice(0, MAX_POINTS);
      ptsArr.fill(0);
      pts.forEach((p, i) => ptsArr.set([p.x, p.y, p.r, p.s], i * 4));

      // upload on a fresh decoded frame, or whenever the clock moved (rVFC can stall in a hidden tab)
      const v = vids[slot];
      if (playing && v.readyState >= 2 && (!hasRVFC || dirty[slot] || v.currentTime !== lastT[slot])) {
        dirty[slot] = false;
        lastT[slot] = v.currentTime;
        upload(v);
      }

      let fade = 1;
      if (playing && v.duration) {
        const vt = v.currentTime, d = v.duration;
        fade = Math.max(0, Math.min(1, vt / FADE, (d - vt) / FADE));
        if (d - vt < 0.05) advance();
      }

      gl.uniform1f(uTime, t - t0);
      gl.uniform4fv(uPts, ptsArr);
      gl.uniform1f(uGlobal, global);
      gl.uniform1f(uFade, fade);
      if (haveFrame) gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (t - lastReadout > 0.12) {
        lastReadout = t;
        const srcT = clip.srcIn + (playing ? v.currentTime * clip.speed : 0);
        const area = pts.reduce((a, p) => a + Math.PI * p.r * p.r * p.s, 0) / (W * H);
        setReadout({
          n: ci + 1, of: CLIPS.length, id: clip.id, place: clip.place, from: clip.from, to: clip.to,
          tc: `00:00:${two(srcT % 60)}:${two((srcT % 1) * clip.fps)}`,
          graded: Math.round(Math.min(1, Math.max(global, area * 0.8)) * 100),
        });
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      canvas.removeEventListener("click", onClick);
      vids.forEach((v) => { v.pause(); v.removeAttribute("src"); v.load(); });
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [shape]);

  const first = shape ? CLIPS[0][shape] : null;

  return (
    <section ref={wrapRef} className={styles.hero} aria-label="Nidas Touch">
      {first && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.poster} src={fallback ? first.graded : first.log} alt="" aria-hidden="true" />
      )}
      <canvas ref={canvasRef} className={styles.canvas} style={{ opacity: live && !fallback ? 1 : 0 }} />
      <video ref={vidA} className={styles.video} muted playsInline aria-hidden="true" />
      <video ref={vidB} className={styles.video} muted playsInline aria-hidden="true" />
      {children ? children(readout) : null}
    </section>
  );
}
