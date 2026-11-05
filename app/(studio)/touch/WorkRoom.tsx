"use client";

import { useEffect, useRef, useState } from "react";
import type { Piece } from "./WorkTile";
import styles from "./touch.module.css";
import { detent, press } from "./sound";

/*
  Recent work as a screening room, on one screen instead of a long scroll: one piece big, sitting on a
  blurred copy of itself, and the rest as picks to swap in. The grade mechanic stays: the featured piece
  plays flat until you tap it, and tapping again takes it back. "watch it bigger" opens it full screen
  (so does the camera's REC, which reads data-piece on the feature).
*/

type Props = { work: Piece[]; bypass: boolean; onOpen: (p: Piece) => void; paused?: boolean };

export default function WorkRoom({ work, bypass, onOpen, paused = false }: Props) {
  const [at, setAt] = useState(0);
  const [graded, setGraded] = useState<Record<string, boolean>>({});
  const vid = useRef<HTMLVideoElement>(null);
  const room = useRef<HTMLDivElement>(null);
  const near = useRef(false);
  const p = work[at];
  const on = !!graded[p.id] && !bypass;

  // only decode while the room is near the screen
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      near.current = e.isIntersecting;
      const v = vid.current;
      if (!v) return;
      if (e.isIntersecting) v.play().catch(() => { /* Low Power Mode: the poster stays */ }); else v.pause();
    }, { rootMargin: "20% 0px 20% 0px" });
    io.observe(room.current!);
    return () => io.disconnect();
  }, []);
  // a new piece, or the viewer closing over it: play it if we're in view; stop it under the viewer
  useEffect(() => {
    const v = vid.current;
    if (!v) return;
    if (paused) v.pause();
    else if (near.current) v.play().catch(() => {});
  }, [at, paused]);
  // back from another app or tab: carry on
  useEffect(() => {
    const back = () => {
      const v = vid.current;
      if (v && document.visibilityState === "visible" && near.current && !paused && v.paused) v.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", back);
    window.addEventListener("pageshow", back);
    return () => { document.removeEventListener("visibilitychange", back); window.removeEventListener("pageshow", back); };
  }, [paused]);

  return (
    <div ref={room} className={styles.room}>
      <div className={styles.feature} data-piece={p.id}>
        <div key={`bg-${p.id}`} className={styles.featureBg} style={{ backgroundImage: `url(${p.poster})` }} aria-hidden="true" />
        <button
          type="button"
          className={`${styles.featurePic} ${on ? styles.graded : ""}`}
          onClick={() => {
            detent();
            setGraded((g) => ({ ...g, [p.id]: !g[p.id] }));
            vid.current?.play().catch(() => {}); // Low Power Mode only plays from a tap: this is one
          }}
          aria-pressed={on}
          aria-label={`${p.title}: ${on ? "graded, tap for the flat version" : "flat, tap to grade it"}`}
        >
          <video ref={vid} src={p.src} poster={p.poster} muted playsInline loop preload="metadata" style={{ aspectRatio: `${p.w} / ${p.h}` }} aria-hidden="true" />
          <span className={styles.chip} aria-hidden="true">{bypass ? "bypass" : on ? "graded" : "flat"}</span>
        </button>
      </div>

      <div className={styles.featureCap} key={`cap-${p.id}`}>
        <span className={styles.meta}>{p.meta}</span>
        <h3 className={styles.title}>{p.title}</h3>
        <p className={styles.lineText}>{p.line}</p>
        <p className={styles.featureActs}>
          <button type="button" onClick={() => { press(); onOpen(p); }}>watch it bigger</button>
          {p.link && <a href={p.link.href} target="_blank" rel="noreferrer">{p.link.label}</a>}
        </p>
      </div>

      <ul className={styles.picks} aria-label="Pick a piece">
        {work.map((w, i) => (
          <li key={w.id}>
            <button
              type="button"
              className={i === at ? styles.pickOn : undefined}
              onClick={() => { if (i !== at) { detent(); setAt(i); } }}
              aria-current={i === at ? "true" : undefined}
            >
              <span style={{ backgroundImage: `url(${w.poster})` }} aria-hidden="true" />
              <b>{w.title}</b>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
