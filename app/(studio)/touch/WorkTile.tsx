"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./touch.module.css";
import { detent } from "./sound";

/*
  A piece of work. It plays flat (a log look laid over the finished file with a CSS filter) and stays
  flat until someone taps it. Tap again and it goes back. The camera's rec button opens it full screen.
  It only decodes while it's near the screen.
*/

export type Piece = {
  id: string;
  src: string;
  poster: string;
  w: number;
  h: number;
  title: string;
  meta: string;
  line: string;
  node: number; // which node of the page grade turns on here
  slot: string; // layout position class
  link?: { href: string; label: string };
};

type Props = { p: Piece; bypass?: boolean };

export default function WorkTile({ p, bypass = false }: Props) {
  const ref = useRef<HTMLElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const [graded, setGraded] = useState(false);
  const shown = graded && !bypass;

  useEffect(() => {
    const el = ref.current!;
    const v = vid.current!;
    // near the screen: load and play. far away: pause, so phones only decode one or two at a time.
    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (v.preload !== "auto") v.preload = "auto";
          v.play().catch(() => { /* Low Power Mode: the poster stays */ });
        } else v.pause();
      },
      { rootMargin: "25% 0px 25% 0px" },
    );
    near.observe(el);
    return () => near.disconnect();
  }, []);

  return (
    <figure ref={ref} className={`${styles.tile} ${styles[p.slot]} ${shown ? styles.graded : ""}`} data-piece={p.id}>
      <div className={styles.frame} style={{ aspectRatio: `${p.w} / ${p.h}` }}>
        <button
          type="button"
          className={styles.frameBtn}
          onClick={() => { detent(); setGraded((g) => !g); }}
          aria-pressed={graded}
          aria-label={`${p.title}: ${graded ? "graded, tap for the flat version" : "flat, tap to grade it"}`}
        >
          <video ref={vid} src={p.src} poster={p.poster} muted playsInline loop preload="none" aria-hidden="true" />
        </button>
        <span className={styles.chip} aria-hidden="true">{bypass ? "bypass" : graded ? "graded" : "flat"}</span>
      </div>
      <figcaption>
        <span className={styles.meta}>{p.meta}</span>
        <span className={styles.title}>{p.title}</span>
        <span className={styles.lineText}>{p.line}</span>
      </figcaption>
    </figure>
  );
}
