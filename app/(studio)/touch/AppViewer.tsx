"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./touch.module.css";

/*
  The viewer inside the editing app, and its waveform scope.

  It plays the Garner cypress (C0447): real S-Log3 underneath, Leo's posted grade as the finished
  picture. `nodes` (0..8) is how much of his node tree is on. Each node takes away one thing that's
  wrong with the picture, so with all of them on it is exactly his grade. Not how a grading app works
  inside, but it reads right ("just for this sake").

  The scope is real: every few frames the same picture is drawn small, read back, and plotted as a
  waveform, so it moves with the grade.
*/

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() { v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform float u_cst, u_wb, u_con, u_sat, u_split, u_green, u_sky, u_final;
varying vec2 v_uv;
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
void main() {
  vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
  float ca = u_res.x / u_res.y, ha = 16.0 / 9.0;
  vec2 s = vec2(1.0);
  if (ca > ha) s.y = ha / ca; else s.x = ca / ha;
  vec2 c = clamp((uv - 0.5) * s + 0.5, 0.002, 0.998);
  vec3 flatC = texture2D(u_tex, vec2(c.x, c.y * 0.5)).rgb;
  vec3 col = texture2D(u_tex, vec2(c.x, 0.5 + c.y * 0.5)).rgb;
  float l = luma(col);
  col = mix(col, col * vec3(1.06, 0.98, 1.08) + vec3(0.0, 0.015, 0.02), 1.0 - u_wb);
  col = mix(col, mix(vec3(0.42), col, 0.72), 1.0 - u_con);
  col = mix(col, mix(vec3(luma(col)), col, 0.62), 1.0 - u_sat);
  col = mix(col, mix(vec3(luma(col)), col, 0.85), (1.0 - u_split) * (1.0 - abs(l - 0.5) * 2.0));
  float g = clamp((col.g - max(col.r, col.b)) * 5.0, 0.0, 1.0);
  col = mix(col, col + vec3(0.06, 0.08, -0.04) * g, 1.0 - u_green);
  float b = clamp((col.b - col.r) * 3.0, 0.0, 1.0) * smoothstep(0.45, 0.85, l);
  col = mix(col, col + vec3(-0.06, 0.03, 0.02) * b, 1.0 - u_sky);
  vec2 q = uv - 0.5;
  col = mix(col, col * (1.0 + dot(q, q) * 0.7), 1.0 - u_final);
  col = mix(flatC, col, u_cst);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

const SW = 120, SH = 68; // the size the scope reads at

// scope: the waveform panel is on screen (only the color page shows it), so it's worth computing
type Props = { nodes: number; live: boolean; scope?: boolean; scopeRef?: React.RefObject<HTMLCanvasElement | null> };

export default function AppViewer({ nodes, live, scope = true, scopeRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vidRef = useRef<HTMLVideoElement>(null);
  const nodesRef = useRef(nodes);
  const liveRef = useRef(live);
  const scopeOn = useRef(scope);
  const kickRef = useRef<() => void>(() => {});
  const [fallback, setFallback] = useState(false);
  const [lost, setLost] = useState(false); // the browser took the WebGL context away for now
  const [gen, setGen] = useState(0);       // ...and gave it back: rebuild

  useEffect(() => { nodesRef.current = nodes; kickRef.current(); }, [nodes]);
  useEffect(() => { scopeOn.current = scope; kickRef.current(); }, [scope]);
  // leaving for good (the edit is behind you): give back the GPU memory and the video decoder now, not at
  // garbage collection. Not in development, where React mounts twice on the same canvas.
  useEffect(() => {
    const canvas = canvasRef.current, v = vidRef.current;
    return () => {
      v?.pause();
      if (process.env.NODE_ENV !== "production") return;
      v?.removeAttribute("src");
      v?.load();
      canvas?.getContext("webgl")?.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);
  // back from another app or tab while it's on screen: carry on playing
  useEffect(() => {
    const back = () => {
      const v = vidRef.current;
      if (v && document.visibilityState === "visible" && liveRef.current && v.paused) v.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", back);
    window.addEventListener("pageshow", back);
    return () => { document.removeEventListener("visibilitychange", back); window.removeEventListener("pageshow", back); };
  }, []);
  useEffect(() => {
    liveRef.current = live;
    const v = vidRef.current;
    if (v) {
      if (live) { if (v.preload !== "auto") v.preload = "auto"; v.play().catch(() => { /* Low Power Mode: the still stays */ }); }
      else v.pause();
    }
    kickRef.current();
  }, [live]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const v = vidRef.current!;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) { queueMicrotask(() => setFallback(true)); return; }
    if (gl.isContextLost()) return; // wait for webglcontextrestored
    queueMicrotask(() => setLost(false));
    const sh = (t: number, src: string) => { const s = gl.createShader(t)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { queueMicrotask(() => setFallback(true)); return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const ap = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(ap);
    gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const names = ["u_cst", "u_wb", "u_con", "u_sat", "u_split", "u_green", "u_sky", "u_final"];
    const U = names.map((n) => gl.getUniformLocation(prog, n));
    const uRes = gl.getUniformLocation(prog, "u_res");
    const S = names.map(() => ({ x: 0, to: 0 }));

    // a small target for the scope to read back from
    const fbTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, fbTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SW, SH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const px = new Uint8Array(SW * SH * 4);
    let img: ImageData | null = null;
    let lastScope = 0;
    const drawScope = () => {
      const c = scopeRef?.current;
      const sc = c?.getContext("2d");
      if (!c || !sc) return;
      if (c.width !== 240) { c.width = 240; c.height = 120; img = null; }
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.viewport(0, 0, SW, SH);
      gl.uniform2f(uRes, SW, SH);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.readPixels(0, 0, SW, SH, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      const w = c.width, h = c.height;
      if (!img) img = sc.createImageData(w, h);
      img.data.fill(0);
      for (let y = 0; y < SH; y++) {
        for (let x = 0; x < SW; x++) {
          const i = (y * SW + x) * 4;
          const l = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
          const sx = Math.floor((x / SW) * w), sy = Math.floor((1 - l) * (h - 1));
          const j = (sy * w + sx) * 4;
          img.data[j] = Math.min(255, img.data[j] + 30);
          img.data[j + 1] = Math.min(255, img.data[j + 1] + 60);
          img.data[j + 2] = Math.min(255, img.data[j + 2] + 34);
          img.data[j + 3] = 255;
        }
      }
      sc.fillStyle = "#0b0c0d";
      sc.fillRect(0, 0, w, h);
      sc.putImageData(img, 0, 0);
      sc.strokeStyle = "rgba(255,255,255,0.08)";
      for (let k = 1; k < 4; k++) { sc.beginPath(); sc.moveTo(0, (h * k) / 4); sc.lineTo(w, (h * k) / 4); sc.stroke(); }
    };

    const still = new Image();
    let have = false;
    still.onload = () => {
      if (have) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, still);
      have = true;
      kick();
    };
    still.src = "/lab/touch/cypress-desktop-pack.jpg";

    const size = () => {
      // layout size, not getBoundingClientRect: the app opens out of a 5% scale, and that would count
      const d = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * d));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * d));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      kick();
    };
    const ro = new ResizeObserver(size);
    ro.observe(canvas);

    let raf = 0, last = performance.now();
    // a new decoded frame (24 fps), so the 60 or 120 Hz loop doesn't upload the same picture again
    type RVFC = (cb: () => void) => number;
    const rvfc = (v as unknown as { requestVideoFrameCallback?: RVFC }).requestVideoFrameCallback?.bind(v);
    let fresh = true, dead = false;
    if (rvfc) { const tick = () => { if (dead) return; fresh = true; rvfc(tick); }; rvfc(tick); }
    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const n = nodesRef.current;
      let moving = false;
      S.forEach((sp, i) => {
        sp.to = n >= i + 1 ? 1 : 0;
        sp.x += (sp.to - sp.x) * (1 - Math.exp(-9 * dt));
        if (Math.abs(sp.to - sp.x) > 0.002) moving = true; else sp.x = sp.to;
        gl.uniform1f(U[i], sp.x);
      });
      const playing = liveRef.current && !v.paused && v.readyState >= 2;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      if (playing && (fresh || !rvfc)) { fresh = false; gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, v); have = true; }
      if (have) {
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        // the scope reads pixels back, which stalls the GPU: only when it's showing, about 8 times a second
        if (scopeRef && scopeOn.current && (moving || t - lastScope > 120)) { lastScope = t; drawScope(); }
      }
      raf = (moving || playing) && liveRef.current ? requestAnimationFrame(frame) : 0;
    };
    const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    kickRef.current = kick;
    v.addEventListener("playing", kick);
    // iOS drops WebGL contexts when it's short of memory or the tab goes to the background: ask for it
    // back, show the still meanwhile, rebuild when it's restored
    const onLost = (e: Event) => { e.preventDefault(); dead = true; cancelAnimationFrame(raf); raf = 0; setLost(true); };
    const onRestored = () => setGen((g) => g + 1);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    size();

    return () => {
      dead = true;
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      cancelAnimationFrame(raf);
      ro.disconnect();
      v.removeEventListener("playing", kick);
      kickRef.current = () => {};
      gl.deleteTexture(tex);
      gl.deleteTexture(fbTex);
      gl.deleteFramebuffer(fb);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [scopeRef, gen]);

  return (
    <div className={styles.appPicture}>
      {(fallback || lost) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={nodes >= 1 ? "/lab/touch/cypress-desktop-graded.jpg" : "/lab/touch/cypress-desktop-log.jpg"} alt="" />
      )}
      {!fallback && <canvas ref={canvasRef} aria-hidden="true" style={lost ? { opacity: 0 } : undefined} />}
      <video ref={vidRef} src="/lab/touch/cypress-desktop.mp4" muted playsInline loop preload="none" aria-hidden="true" />
    </div>
  );
}
