"use client";

import { useState } from "react";
import styles from "./touch.module.css";
import { detent, press } from "./sound";

/*
  The camera's menu. Press MENU on the camera and it turns round; this sits exactly on its screen
  (CameraBody reports where that is). Laid out like a camera menu: tabs along the top, a list, the
  row you're on lit up. Say hi isn't in here on purpose: the shutter and the bottom of the page are
  the only two ways to it.
*/

type Item = { label: string; value?: string; act: () => void };

type Props = {
  rect: { x: number; y: number; w: number; h: number };
  sound: boolean;
  graded: boolean;
  onGo: (where: "top" | "how" | "work" | "make" | "people") => void;
  onPage: (href: string) => void;
  onSound: () => void;
  onGrade: () => void;
  onClose: () => void;
};

export default function Menu({ rect, sound, graded, onGo, onPage, onSound, onGrade, onClose }: Props) {
  const [tab, setTab] = useState(0);
  const [hi, setHi] = useState(0);

  const tabs: { name: string; items: Item[] }[] = [
    {
      name: "go",
      items: [
        { label: "the reel", act: () => onGo("top") },
        { label: "how it works", act: () => onGo("how") },
        { label: "recent work", act: () => onGo("work") },
        { label: "what we make", act: () => onGo("make") },
        { label: "who we work with", act: () => onGo("people") },
      ],
    },
    {
      name: "pages",
      items: [
        { label: "who we work with", value: "page", act: () => onPage("/people") },
        { label: "mobile notary", value: "page", act: () => onPage("/notary") },
        { label: "tech and ai consulting", value: "page", act: () => onPage("/consulting") },
      ],
    },
    {
      name: "setup",
      items: [
        { label: "sound", value: sound ? "on" : "off", act: onSound },
        { label: "grade", value: graded ? "graded" : "log", act: onGrade },
        { label: "close the menu", act: onClose },
      ],
    },
  ];
  const items = tabs[tab].items;

  return (
    <div
      className={styles.menu}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
      role="dialog"
      aria-label="Menu"
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.menuTabs} role="tablist">
        {tabs.map((t, i) => (
          <button
            key={t.name}
            type="button"
            role="tab"
            aria-selected={tab === i}
            className={tab === i ? styles.menuTabOn : undefined}
            onClick={() => { detent(); setTab(i); setHi(0); }}
          >
            {t.name}
          </button>
        ))}
        <span className={styles.menuPage}>{tab + 1}/{tabs.length}</span>
      </div>
      <ul className={styles.menuList}>
        {items.map((it, i) => (
          <li key={it.label}>
            <button
              type="button"
              className={hi === i ? styles.menuRowOn : undefined}
              onPointerEnter={() => setHi(i)}
              onFocus={() => setHi(i)}
              onClick={() => { press(); it.act(); }}
            >
              <span>{it.label}</span>
              <i>{it.value ?? "›"}</i>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
