"use client";

import { useState } from "react";
import styles from "./touch.module.css";
import { STOPS } from "./stops";
import { detent, flip, press, recStart, shutter as shutterSound } from "./sound";

/*
  The camera bar for when a browser won't do 3D (WebGL switched off, an old phone, or Chrome blocking it for
  a while after a graphics crash). The same top plate, drawn flat with ordinary page elements, each part
  where it sits on the 3D one, and doing the same thing: the mode dial turns to WORK, MAKE or PEOPLE, REC,
  HOME, the oval MENU, the exposure dial (a fidget), the shutter, and GRADED or LOG.

  Positions come from the 3D model's plate (13 by 4.6 units): x and z turned into percentages.
*/

type Props = {
  turns: number;
  onTurn: (n: number) => void;
  graded: boolean;
  onGraded: (g: boolean) => void;
  onShutter: () => void;
  armed: boolean;
  onRec: () => void;
  onMenu: () => void;
  onHome: () => void;
  hidden: boolean;  // on the hero, or inside the editing app
  inactive: boolean; // something is open over the page
};

export default function CameraFallback(p: Props) {
  const [ev, setEv] = useState(0);
  const stop = ((p.turns % 3) + 3) % 3;
  const off = p.inactive ? -1 : 0;

  return (
    <div className={styles.flatCam} data-hidden={p.hidden ? "" : undefined} aria-label="Camera">
      <div className={styles.flatPlate}>
        <div className={styles.flatHump} aria-hidden="true"><i /></div>

        <button
          type="button"
          className={styles.flatDial}
          tabIndex={off}
          onClick={() => { detent(); p.onTurn(p.turns + 1); }}
          aria-label={`Mode dial, on ${STOPS[stop]}. Turn to ${STOPS[(stop + 1) % 3]}`}
        >
          {/* the stop you're on sits at the bottom, over the orange mark; MAKE upper left, PEOPLE upper right */}
          <span style={{ transform: `rotate(${-p.turns * 120}deg)` }}>
            {["WORK", "MAKE", "PEOPLE"].map((s, i) => (
              <b key={s} style={{ transform: `rotate(${i * 120}deg)` }}><em>{s}</em></b>
            ))}
          </span>
        </button>
        <i className={styles.flatIndex} aria-hidden="true" />

        <button type="button" className={styles.flatMenu} tabIndex={off} onClick={() => { press(); p.onMenu(); }}>MENU</button>

        <button type="button" className={`${styles.flatBtn} ${styles.flatRec}`} tabIndex={off} onClick={() => { recStart(); p.onRec(); }} aria-label="Record: open the piece on screen" />
        <span className={`${styles.flatLabel} ${styles.flatRecLabel}`} aria-hidden="true">REC</span>
        <i className={styles.flatTally} data-on={p.armed ? "" : undefined} aria-hidden="true" />

        <button type="button" className={`${styles.flatBtn} ${styles.flatHome}`} tabIndex={off} onClick={() => { press(); p.onHome(); }} aria-label="Home: back to the top">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 11.5 12 4l8.5 7.5M6 10v9.5h4.2v-5h3.6v5H18V10" /></svg>
        </button>
        <span className={`${styles.flatLabel} ${styles.flatHomeLabel}`} aria-hidden="true">HOME</span>

        <button
          type="button"
          className={styles.flatEv}
          tabIndex={off}
          onClick={() => { detent(); setEv((n) => n + 1); }}
          aria-label="Exposure dial"
        >
          <span style={{ transform: `rotate(${(ev * 180) / 7}deg)` }}>-3 -2 -1 0 +1 +2 +3</span>
        </button>

        <div className={styles.flatShutterRing} aria-hidden="true" />
        <button type="button" className={styles.flatShutter} tabIndex={off} onClick={() => { shutterSound(); p.onShutter(); }} aria-label="Shutter: say hi" />
        <span className={`${styles.flatLabel} ${styles.flatSayHi}`} aria-hidden="true">SAY HI</span>
        <button
          type="button"
          className={`${styles.flatLabel} ${styles.flatGraded}`}
          data-on={p.graded ? "" : undefined}
          tabIndex={off}
          onClick={() => { if (!p.graded) { flip(); p.onGraded(true); } }}
        >
          GRADED
        </button>
        <button
          type="button"
          className={`${styles.flatLabel} ${styles.flatLog}`}
          data-on={!p.graded ? "" : undefined}
          tabIndex={off}
          onClick={() => { if (p.graded) { flip(); p.onGraded(false); } }}
        >
          LOG
        </button>
      </div>
    </div>
  );
}
