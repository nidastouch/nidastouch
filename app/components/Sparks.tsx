"use client";

import { useEffect, useRef } from "react";

interface Ember {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  base: number;     // base alpha
  tw: number;       // twinkle phase
  tws: number;      // twinkle speed
  hot: number;      // mouse proximity boost (0..1)
}

const GOLD: [number, number, number][] = [
  [212, 175, 55],
  [244, 230, 168],
  [191, 149, 63],
  [168, 123, 46],
];

/**
 * Page-wide gold ember field. Fixed to the viewport so it persists across
 * the whole scroll. Drifts upward like embers and reacts to the cursor
 * (gentle repel + glow). The kinetic signature of the brand.
 */
export default function Sparks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const embersRef = useRef<Ember[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;

    let W = 0, H = 0, dpr = 1, lastW = -1;

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastW = W;

      const count = W < 768 ? 40 : 120;
      embersRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -(Math.random() * 0.35 + 0.08),
        r: Math.random() * 1.7 + 0.5,
        base: Math.random() * 0.5 + 0.18,
        tw: Math.random() * Math.PI * 2,
        tws: Math.random() * 0.025 + 0.008,
        hot: 0,
      }));
    };

    // On mobile, the address bar showing/hiding changes innerHeight on every
    // scroll, which would otherwise rebuild the whole field and cause jank.
    // Only rebuild when the WIDTH actually changes (real resize / rotation).
    const onResize = () => { if (window.innerWidth !== lastW) build(); };

    build();
    window.addEventListener("resize", onResize);

    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };
    const onLeave = () => { mouseRef.current.active = false; mouseRef.current.x = -9999; mouseRef.current.y = -9999; };
    if (fine) {
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseout", onLeave);
    }

    const RADIUS = 150;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const m = mouseRef.current;

      for (const e of embersRef.current) {
        // Drift
        e.x += e.vx;
        e.y += e.vy;
        e.tw += e.tws;

        // Mouse interaction: repel + heat
        if (m.active) {
          const dx = e.x - m.x;
          const dy = e.y - m.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < RADIUS * RADIUS) {
            const d = Math.sqrt(d2) || 1;
            const force = (1 - d / RADIUS);
            e.x += (dx / d) * force * 2.4;
            e.y += (dy / d) * force * 2.4;
            e.hot += (1 - e.hot) * 0.18 * force;
          }
        }
        e.hot *= 0.94;

        // Wrap
        if (e.y < -10) { e.y = H + 10; e.x = Math.random() * W; }
        if (e.x < -10) e.x = W + 10;
        if (e.x > W + 10) e.x = -10;

        const [r, g, b] = GOLD[0];
        const twinkle = 0.6 + Math.sin(e.tw) * 0.4;
        const alpha = Math.min(1, e.base * twinkle + e.hot * 0.7);
        const radius = e.r * (1 + e.hot * 1.6);

        // Glow
        const glowR = radius * (4 + e.hot * 5);
        const grd = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, glowR);
        grd.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.5})`);
        grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(e.x, e.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${[244,230,168][0]},${[244,230,168][1]},${[244,230,168][2]},${alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    if (reduced) {
      // Render one static frame
      draw();
      cancelAnimationFrame(rafRef.current);
    } else {
      rafRef.current = requestAnimationFrame(draw);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
    />
  );
}
