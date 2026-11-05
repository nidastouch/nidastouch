"use client";

import { useEffect, useRef, useState } from "react";
import type { Piece } from "./WorkTile";
import styles from "./touch.module.css";
import { detent, recStop } from "./sound";

/* One piece, full screen, the way the REC button promised. Opens graded; tap for the flat version. */

export default function Viewer({ p, onClose }: { p: Piece; onClose: () => void }) {
  const [graded, setGraded] = useState(true);
  const stopRef = useRef<HTMLButtonElement>(null);
  const vidRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    stopRef.current?.focus();
    // autoPlay alone does nothing in Low Power Mode; this runs inside the tap that opened the viewer
    vidRef.current?.play().catch(() => {});
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { recStop(); onClose(); } };
    // overflow: hidden alone doesn't stop a finger on a phone from scrolling the page underneath
    const block = (e: Event) => e.preventDefault();
    window.addEventListener("keydown", key);
    window.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("wheel", block, { passive: false });
    return () => {
      root.style.overflow = prev;
      window.removeEventListener("keydown", key);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("wheel", block);
    };
  }, [onClose]);

  return (
    <div
      className={styles.viewer}
      role="dialog"
      aria-modal="true"
      aria-label={p.title}
      onClick={(e) => { if (e.target === e.currentTarget) { recStop(); onClose(); } }}
    >
      <div className={styles.viewerTop}>
        <span className={styles.recDot}>rec</span>
        <button ref={stopRef} type="button" className={styles.stop} onClick={() => { recStop(); onClose(); }}>
          <span aria-hidden="true" /> stop
        </button>
      </div>
      {/* tap the black round it to close; tap the picture itself to flip flat and graded */}
      <div className={styles.viewerFrame} onClick={() => { recStop(); onClose(); }}>
        <button
          type="button"
          className={`${styles.viewerPic} ${graded ? styles.graded : ""}`}
          onClick={(e) => { e.stopPropagation(); detent(); setGraded((g) => !g); vidRef.current?.play().catch(() => {}); }}
          aria-label={graded ? "Graded. Tap for the flat version." : "Flat. Tap to grade it."}
        >
          <video ref={vidRef} src={p.src} poster={p.poster} autoPlay muted playsInline loop style={{ aspectRatio: `${p.w} / ${p.h}` }} />
          <span className={styles.chip} aria-hidden="true">{graded ? "graded" : "flat"}</span>
        </button>
      </div>
      <div className={styles.viewerCap}>
        <span className={styles.meta}>{p.meta}</span>
        <span className={styles.title}>{p.title}</span>
        <span className={styles.lineText}>{p.line}</span>
        {p.link && (
          <a href={p.link.href} target="_blank" rel="noreferrer" className={styles.viewerLink}>{p.link.label}</a>
        )}
      </div>
    </div>
  );
}
