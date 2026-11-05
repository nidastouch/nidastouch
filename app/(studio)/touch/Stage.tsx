"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import TouchHero from "./TouchHero";
import type { Piece } from "./WorkTile";
import WorkRoom from "./WorkRoom";
import Viewer from "./Viewer";
import SayHi from "./SayHi";
import Menu from "./Menu";
import EditSuite from "./EditSuite";
import { PEOPLE } from "../people";
import { STOPS } from "./stops";
import styles from "./touch.module.css";
import { flip, halfPress, press, setSound, shutter as shutterSound, soundOn } from "./sound";

// the camera is three.js: load it after the page, never on the server. If its script can't be fetched
// (a dropped connection, a deploy mid-visit), the page carries on with the plain buttons instead of erroring.
type CameraProps = Parameters<typeof import("./CameraBody").default>[0];
// with no 3D camera to put the menu on, it sits in the middle of the screen
const fallbackRect = () => {
  const w = Math.min(520, window.innerWidth * 0.86), h = Math.min(w * 0.7, window.innerHeight * 0.6);
  return { x: Math.round((window.innerWidth - w) / 2), y: Math.round((window.innerHeight - h) / 2), w: Math.round(w), h: Math.round(h) };
};
function NoCamera({ onFail }: CameraProps) {
  useEffect(() => { onFail(); }, [onFail]);
  return null;
}
const CameraBody = dynamic(() => import("./CameraBody").catch(() => ({ default: NoCamera })), { ssr: false });

/*
  The whole page starts in log and gets graded as you scroll.

  Under the hood the grade follows Leo's real node tree from the grade swipe small (13 Oct), in his
  order. Each step is tied to a spot on the page: when that spot rises past the middle of the screen
  the page shifts a step, the way his picture did one click at a time. Scroll back up and it undoes.

  The menu is the top of a camera floating at the bottom of the screen (CameraBody): a mode dial, the
  shutter with its power lever (log or graded), a red rec button and a sound button.
  Shift+D flips the lever too, the same shortcut as bypass in Resolve.

  The ending is locked on purpose, so nobody can leave it half done. Pressing the shutter or scrolling
  to the very bottom starts it (only those two), and it runs on its own:
    dive    the camera lifts off the bar and goes in through its viewfinder (the screen goes black)
    vf      a viewfinder, with the say hi screen behind it out of focus: "press to focus"
    focus   it sharpens
    shot    the shutter fires: a moment of black, then a white flash, and you're there
    hi      the say hi screen, full screen, its own place. "back to the page" leaves.
  The page can't scroll while any of that is up.
*/

const W = "/lab/touch/work";
const WORK: Piece[] = [
  {
    id: "ritual", src: `${W}/ritual.mp4`, poster: `${W}/ritual.jpg`, w: 9, h: 16, node: 3, slot: "s1",
    title: "morning ritual",
    meta: "product film · a7s iii, s-log3 · oct 2026",
    line: "beans, water, the espresso machine, and an iced macadamia latte at the end. our first post as the studio.",
    link: { href: "https://instagram.com/leonidastouch", label: "@leonidastouch on instagram" },
  },
  {
    id: "maples", src: `${W}/maples.mp4`, poster: `${W}/maples.jpg`, w: 9, h: 16, node: 4, slot: "s2",
    title: "lost maples review",
    meta: "state park review · oct 2026",
    line: "a texas state park review for @leothesealion. this bit is one of the shallow crossings.",
    link: { href: "https://instagram.com/leothesealion", label: "@leothesealion on instagram" },
  },
  {
    id: "toast", src: `${W}/toast.mp4`, poster: `${W}/toast.jpg`, w: 4, h: 5, node: 5, slot: "s3",
    title: "the pearl",
    meta: "a saturday morning in san antonio · oct 31",
    line: "a piece of toast buried under alfalfa sprouts, at half speed.",
  },
  {
    id: "wiper", src: `${W}/wiper.mp4`, poster: `${W}/wiper.jpg`, w: 2, h: 1, node: 6, slot: "s4",
    title: "the wiper one",
    meta: "short form · nov 2026",
    line: "my daily commute, then my dream commute. rain in traffic, then the roads in oregon.",
  },
];

const MAKE = [
  { what: "brand and product films", how: "coffee, gear, food, anything that holds still long enough to light" },
  { what: "short form", how: "reels and tiktoks, cut so people make it past the first two seconds" },
  { what: "series", how: "our own is collecting texas, over on @leothesealion" },
  { what: "photos", how: "stills from the same shoot, or a day of their own" },
];

type Phase = "page" | "dive" | "vf" | "focus" | "shot" | "hi";

// the sound switch, remembered across visits
const soundSubscribe = (cb: () => void) => {
  window.addEventListener("nt-sound", cb);
  return () => window.removeEventListener("nt-sound", cb);
};

export default function Stage() {
  const root = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(0);
  const [editN, setEditN] = useState(0); // nodes on in the edit suite: the page grades along with it
  const [inside, setInside] = useState(false); // inside the editing app: the camera and header step aside
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [at, setAt] = useState(0);
  const [turns, setTurns] = useState(0);
  const [bypass, setBypass] = useState(false);
  const [overHero, setOverHero] = useState(true);
  const [open, setOpen] = useState<Piece | null>(null);
  const [flash, setFlash] = useState(0);
  const [phase, setPhase] = useState<Phase>("page");
  const phaseRef = useRef<Phase>("page");
  const openRef = useRef(false); // a piece is open full screen
  const cooldown = useRef(0);
  const bottomSeen = useRef(0); // how much of the very bottom is on screen right now
  const [armed, setArmed] = useState<string | null>(null);
  const [noCamera, setNoCamera] = useState(false);
  const sound = useSyncExternalStore(soundSubscribe, soundOn, () => true);
  const cur = useRef(0);       // the stop the dial is on
  const lockUntil = useRef(0); // while the dial is driving the scroll, the scroll doesn't drive the dial
  const lockTo = useRef(-1);   // ...until the page has arrived at the stop it was sent to
  const camReady = useRef(false); // the 3D camera is built (the ending's dive needs it)
  const returnTo = useRef<number | null>(null); // where "back to the page" puts you
  const settleUntil = useRef(0); // the page just changed size (a rotation, the edit folding): let it settle

  useEffect(() => {
    const el = root.current!;
    const nodeSpots = () =>
      Array.from(el.querySelectorAll<HTMLElement>("[data-node]")).sort(
        (a, b) => Number(a.dataset.node) - Number(b.dataset.node),
      );
    const stopSpots = () => STOPS.map((s) => el.querySelector<HTMLElement>(`[data-stop="${s}"]`));
    let nodes = nodeSpots();
    let stops = stopSpots();
    let tiles = Array.from(el.querySelectorAll<HTMLElement>("[data-piece]"));
    let count = 0;
    let raf = 0;

    const measure = () => {
      raf = 0;
      const h = window.innerHeight;

      // the grade: a spot turns its node on past 62% of the screen and off again only below 70%,
      // so a heading that reflows near the line can't make it flicker
      let n = 0;
      for (let i = 0; i < nodes.length; i++) {
        const top = nodes[i].getBoundingClientRect().top;
        const isOn = i < count ? top < h * 0.7 : top < h * 0.62;
        if (isOn) n = i + 1; else break;
      }
      if (n !== count) { count = n; setOn(n); }

      // the dial: the last stop whose top has passed the middle of the screen
      let a = 0;
      stops.forEach((s, i) => { if (i > 0 && s && s.getBoundingClientRect().top < h * 0.5) a = i; });
      if (performance.now() < lockUntil.current && a === lockTo.current) lockUntil.current = 0; // arrived
      if (a !== cur.current && performance.now() > lockUntil.current) {
        const d = ((a - cur.current + 4) % 3) - 1; // shortest way round the three stops
        cur.current = a;
        setAt(a);
        setTurns((t) => t + d);
      }

      // rec is armed when a piece sits in the middle of the screen
      let best: string | null = null;
      let bestD = Infinity;
      for (const t of tiles) {
        const r = t.getBoundingClientRect();
        if (r.bottom < h * 0.15 || r.top > h * 0.75) continue;
        const dist = Math.abs((r.top + r.bottom) / 2 - h * 0.45);
        if (dist < bestD) { bestD = dist; best = t.dataset.piece ?? null; }
      }
      setArmed(best);
      setOverHero(window.scrollY < h * 0.85);
    };
    const ask = () => { if (!raf) raf = requestAnimationFrame(measure); };
    const relist = () => {
      nodes = nodeSpots();
      stops = stopSpots();
      tiles = Array.from(el.querySelectorAll<HTMLElement>("[data-piece]"));
      ask();
    };
    // a finger or a wheel during a jump: the person has taken over, so the dial follows the page again
    const takeOver = () => { lockUntil.current = 0; };
    const settle = () => { settleUntil.current = performance.now() + 700; };
    const onResize = () => { settle(); relist(); };
    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("nt-fold", settle);
    window.addEventListener("touchstart", takeOver, { passive: true });
    window.addEventListener("wheel", takeOver, { passive: true });
    // fonts and videos arriving move things without a scroll: measure again when the page changes size
    const ro = new ResizeObserver(relist);
    ro.observe(el);
    measure();
    return () => {
      window.removeEventListener("scroll", ask);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("nt-fold", settle);
      window.removeEventListener("touchstart", takeOver);
      window.removeEventListener("wheel", takeOver);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  // Shift+D, bypass, like Resolve
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.shiftKey && (e.key === "D" || e.key === "d")) setBypass((b) => !b);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const goTop = useCallback(() => window.scrollTo({ top: 0, behavior: "smooth" }), []);

  const go = useCallback((i: number, instant = false) => {
    const behavior: ScrollBehavior = instant ? "instant" : "smooth";
    const spot = root.current?.querySelector<HTMLElement>(`[data-stop="${STOPS[i]}"]`);
    if (!spot) return;
    // every stop is past the edit: fold it first, so the spot we aim at is where it'll still be on arrival
    window.dispatchEvent(new Event("nt-fold"));
    const y = spot.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.14;
    window.scrollTo({ top: Math.max(0, y), behavior });
  }, []);

  const toggleSound = (next: boolean) => {
    if (!next) press();
    setSound(next);
    window.dispatchEvent(new Event("nt-sound"));
    if (next) press();
  };

  // the piece in the middle of the screen right now (armed is only re-measured on scroll, and picking
  // another piece in the screening room doesn't scroll)
  const pieceNow = () => {
    const h = window.innerHeight;
    let best: string | null = null, bestD = Infinity;
    root.current?.querySelectorAll<HTMLElement>("[data-piece]").forEach((t) => {
      const r = t.getBoundingClientRect();
      if (r.bottom < h * 0.15 || r.top > h * 0.75) return;
      const d = Math.abs((r.top + r.bottom) / 2 - h * 0.45);
      if (d < bestD) { bestD = d; best = t.dataset.piece ?? null; }
    });
    return best;
  };

  const rec = () => {
    if (phaseRef.current !== "page") return;
    setMenuOpen(false);
    const id = pieceNow();
    const p = WORK.find((w) => w.id === id);
    if (p) setOpen(p); else turnDial(turns + ((0 - at + 3) % 3 || 3)); // nothing on screen: go to the work
  };

  // ---- the ending
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { openRef.current = open !== null; }, [open]);

  const startEnding = useCallback(() => {
    if (phaseRef.current !== "page" || openRef.current || performance.now() < cooldown.current) return;
    setMenuOpen(false);
    // started from the shutter mid-page: "back to the page" brings you back here, not to the bottom
    returnTo.current = bottomSeen.current >= 0.6 ? null : window.scrollY;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // the dive is the camera's to play: no camera yet (still loading on a slow phone) means straight to the
    // viewfinder, or the page would sit frozen waiting for an animation nobody is drawing
    phaseRef.current = noCamera || reduce || !camReady.current ? "vf" : "dive";
    setPhase(phaseRef.current);
  }, [noCamera]);

  // and whatever happens to the camera during the dive, the ending moves on (the dive takes 2.7 s)
  useEffect(() => {
    if (phase !== "dive") return;
    const t = window.setTimeout(() => {
      if (phaseRef.current === "dive") { phaseRef.current = "vf"; setPhase("vf"); }
    }, 4500);
    return () => window.clearTimeout(t);
  }, [phase]);

  const focusAndShoot = () => {
    if (phaseRef.current !== "vf") return;
    phaseRef.current = "focus";
    setPhase("focus");
    halfPress();
    window.setTimeout(() => {
      shutterSound();
      phaseRef.current = "shot";
      setPhase("shot");
      window.setTimeout(() => {
        phaseRef.current = "hi";
        setPhase("hi");
        setFlash((f) => f + 1);
      }, 140);
    }, 480);
  };

  const leave = useCallback(() => {
    if (phaseRef.current === "dive" || phaseRef.current === "focus" || phaseRef.current === "shot") return;
    phaseRef.current = "page";
    setPhase("page");
    cooldown.current = performance.now() + 1200;
    // if they scroll straight back down during the cooldown, start it as soon as the cooldown ends
    window.setTimeout(() => { if (bottomSeen.current >= 0.6) startEnding(); }, 1250);
    // back where the shutter was pressed; or, if it started at the bottom, just above it, so the ending
    // doesn't start again by itself
    const end = document.getElementById("hi");
    const back = returnTo.current;
    returnTo.current = null;
    if (back !== null) window.scrollTo({ top: back, behavior: "instant" });
    else if (end) {
      const y = end.getBoundingClientRect().top + window.scrollY - window.innerHeight * 1.02;
      window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
    }
  }, [startEnding]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  // the menu only opens from the plain page: never during the ending, never over the viewer
  const openMenu = () => { if (phaseRef.current === "page" && !open) setMenuOpen(true); };

  // the page can't scroll while the ending or the menu is up (the say hi screen scrolls itself if it has to)
  useEffect(() => {
    if (phase === "page" && !menuOpen) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const block = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (phase === "hi" && t?.closest("[data-scrolls]")) return;
      e.preventDefault();
    };
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t?.closest?.("input, textarea, select, [contenteditable]");
      if (e.key === "Escape") {
        // Escape while typing in the form (closing autofill, a keyboard's word picker) must not throw the
        // message away with the screen
        if (typing || e.isComposing) return;
        if (phase !== "page") leave(); else if (menuOpen) closeMenu();
      }
      else if (phase !== "hi" && !menuOpen && [" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "End", "Home"].includes(e.key)) {
        if (e.key === " " && t?.closest?.("button")) return; // Space presses a button (press to focus)
        e.preventDefault();
      }
    };
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", key);
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", key);
    };
  }, [phase, leave, menuOpen, closeMenu]);

  // a reload starts at the top, not wherever the browser remembers (it could land on the bottom and
  // start the ending before anyone touched anything)
  useEffect(() => {
    const prev = history.scrollRestoration;
    history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, behavior: "instant" });
    return () => { history.scrollRestoration = prev; };
  }, []);

  // scrolling all the way down starts it too. The newest entry counts (on a slow phone several arrive at
  // once, and an older one could hide the crossing). Right after the page changed size (a rotation, the
  // edit folding) it waits a moment and looks again, so a jolt of layout can't start it by itself.
  useEffect(() => {
    const end = document.getElementById("hi");
    if (!end) return;
    let t = 0;
    const io = new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      bottomSeen.current = e.intersectionRatio;
      if (e.intersectionRatio < 0.6) return;
      const wait = settleUntil.current - performance.now();
      window.clearTimeout(t);
      if (wait > 0) t = window.setTimeout(() => { if (bottomSeen.current >= 0.6) startEnding(); }, wait + 50);
      else startEnding();
    }, { threshold: [0, 0.3, 0.6, 0.8, 1] });
    io.observe(end);
    return () => { io.disconnect(); window.clearTimeout(t); };
  }, [startEnding]);

  // back from another page through the back/forward cache: nothing should still be open from before
  useEffect(() => {
    const show = (e: PageTransitionEvent) => { if (e.persisted) setMenuOpen(false); };
    window.addEventListener("pageshow", show);
    return () => window.removeEventListener("pageshow", show);
  }, []);

  // the dial was turned by hand: it leads, and the page follows it
  const turnDial = useCallback((k: number) => {
    const stop = ((k % 3) + 3) % 3;
    setTurns(k);
    setAt(stop);
    cur.current = stop;
    lockTo.current = stop;
    lockUntil.current = performance.now() + 3000; // released early once the page arrives, or a finger takes over
    go(stop);
  }, [go]);

  const close = useCallback(() => setOpen(null), []);

  // the menu's choices: close it first, then move, once the page can scroll again
  const menuGo = (where: "top" | "how" | "work" | "make" | "people") => {
    setMenuOpen(false);
    requestAnimationFrame(() => {
      if (where === "how") {
        const el = document.getElementById("how");
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "smooth" });
        return;
      }
      if (where === "top") goTop(); else go({ work: 0, make: 1, people: 2 }[where]);
    });
  };
  const shown = bypass ? 0 : Math.max(on, editN);
  // something is up over the page: keep the keyboard and screen readers out of what's behind it
  const covered = phase !== "page" || open !== null || menuOpen;

  return (
    <div
      ref={root}
      className={styles.stage}
      data-n={shown}
      data-bypass={bypass ? "" : undefined}
      data-over-hero={overHero ? "" : undefined}
      data-inside={inside ? "" : undefined}
    >
      <header className={styles.bar} inert={covered}>
        <a href="#top" className={styles.wordmark} onClick={(e) => { e.preventDefault(); goTop(); }}>
          nidas touch
        </a>
      </header>

      <div className={styles.heroPin} id="top" inert={covered}>
        <TouchHero>
          {() => (
            <p className={styles.heroNote}>
              <span className={styles.forMouse}>the flat version. run your mouse over it</span>
              <span className={styles.forTouch}>the flat version. tap anywhere on it</span>
            </p>
          )}
        </TouchHero>
      </div>

      <main className={styles.flow} inert={covered}>
        <div className={styles.fog} aria-hidden="true" />
        <div className={styles.body}>
          <section className={styles.intro}>
            <p className={`${styles.note} ${styles.noteIntro}`} aria-hidden="true">
              <span>the grey is on purpose, promise</span>
              <svg viewBox="0 0 120 64" className={styles.arrow}><path d="M108 4 C 96 30, 60 44, 14 54 M14 54 L 26 44 M14 54 L 28 61" /></svg>
            </p>
            <h1 data-node="1">
              nidas touch is a video and photo studio in <span className={styles.keep}>san antonio,</span>
              <br />texas.
            </h1>
            <p data-node="2">
              we light, shoot, edit and grade everything ourselves, and we give a coffee order the same care
              we&apos;d give a commercial. a lot of our ideas start on ordinary days, a drive through the hill
              country or the first cup in the morning, which is where most of the work below came from.
            </p>
          </section>

          <EditSuite onNodes={setEditN} onInside={setInside} />

          <section className={styles.work} aria-label="Recent work" data-stop="work">
            <div className={styles.workHead}>
              <h2 className={styles.kicker}>stuff from the last few weeks</h2>
              <p className={`${styles.note} ${styles.noteWork}`}>tap the picture to grade it, pick another underneath</p>
            </div>
            <WorkRoom work={WORK} bypass={bypass} onOpen={setOpen} paused={open !== null} />
          </section>

          <section className={styles.make} aria-label="What we make" data-stop="make">
            <h2 className={styles.kicker}>what we make</h2>
            <ul>
              {MAKE.map((m) => (
                <li key={m.what}>
                  <span className={styles.makeWhat}>{m.what}</span>
                  <span className={styles.makeHow}>{m.how}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.people} aria-label="Who we work with" data-stop="people">
            <h2 className={styles.kicker}>who we work with</h2>
            <ul>
              {PEOPLE.map((p) => (
                <li key={p.id}>
                  <a href="/people" className={styles.personName}>{p.name}</a>
                  <span className={styles.makeHow}>{p.what}</span>
                </li>
              ))}
            </ul>
            <a href="/people" className={styles.peopleMore}>everyone we work with, and where to find them</a>
          </section>

          <footer className={styles.foot}>
            <span>© 2026 leonidas touch llc</span>
            <span className={styles.other}>
              other services: <a href="/notary">mobile notary</a> · <a href="/consulting">tech and ai consulting</a>
            </span>
          </footer>

          {/* the very bottom: scroll into it and the camera takes you to say hi */}
          <section className={styles.toHi} id="hi" aria-label="Say hi">
            <button type="button" className={styles.toHiBtn} onClick={startEnding}>
              <span className={styles.toHiWord}>say hi</span>
              <span className={styles.note}>keep scrolling, or tap here</span>
            </button>
          </section>
        </div>
      </main>

      {!noCamera && (
        <CameraBody
          turns={turns}
          onTurn={turnDial}
          graded={!bypass}
          onGraded={(g) => setBypass(!g)}
          onShutter={startEnding}
          sound={sound}
          onSound={toggleSound}
          armed={armed !== null}
          onRec={rec}
          onFail={() => {
            setNoCamera(true);
            if (phaseRef.current === "dive") { phaseRef.current = "vf"; setPhase("vf"); }
          }}
          onReady={() => { camReady.current = true; }}
          inactive={open !== null || phase !== "page" || menuOpen}
          menu={menuOpen}
          away={inside}
          onMenu={openMenu}
          onHome={goTop}
          onMenuRect={setMenuRect}
          ending={phase !== "page"}
          onEnded={() => { if (phaseRef.current === "dive") { phaseRef.current = "vf"; setPhase("vf"); } }}
        />
      )}

      {/* the same controls as plain buttons: for keyboards and screen readers, and if WebGL is missing */}
      <nav className={`${styles.keys} ${noCamera ? styles.keysShown : ""}`} aria-label="Camera controls" inert={covered}>
        {STOPS.map((s, i) => (
          <button key={s} type="button" onClick={() => { press(); turnDial(turns + ((i - at + 3) % 3)); }} aria-current={at === i ? "true" : undefined}>
            {s}
          </button>
        ))}
        <button type="button" onClick={() => { flip(); setBypass((b) => !b); }} aria-pressed={!bypass}>graded</button>
        <button type="button" onClick={rec} disabled={!armed}>rec</button>
        <button type="button" onClick={openMenu}>menu</button>
        <button type="button" onClick={() => { press(); goTop(); }}>home</button>
        <button type="button" onClick={() => toggleSound(!sound)} aria-pressed={sound}>sound</button>
        <button type="button" onClick={() => { shutterSound(); startEnding(); }}>say hi</button>
      </nav>

      {/* the dim sits under the camera, the menu sits on top of its screen */}
      {menuOpen && <div className={styles.menuBack} onClick={closeMenu} aria-hidden="true" />}
      {menuOpen && (
        <>
          {(menuRect || noCamera) && (
            <Menu
              rect={menuRect ?? fallbackRect()}
              sound={sound}
              graded={!bypass}
              onGo={menuGo}
              onPage={(href) => { window.location.href = href; }}
              onSound={() => toggleSound(!sound)}
              onGrade={() => { flip(); setBypass((b) => !b); }}
              onClose={closeMenu}
            />
          )}
          <p className={`${styles.note} ${styles.menuHint}`} aria-hidden="true">tap outside the screen to put it back</p>
        </>
      )}

      {phase !== "page" && (
        <div className={styles.end} data-phase={phase}>
          {/* what the viewfinder is looking at: the say hi screen, out of focus until you press */}
          <div className={styles.endScene} data-scrolls="">
            <SayHi live={phase === "hi"} onClose={leave} />
          </div>
          <div className={styles.endVf} aria-hidden="true">
            <div className={styles.vfWindow} />
            <div className={styles.vfTop}><span>AF-S</span><span>4K 24p</span><span className={styles.vfBattery} /></div>
            <div className={styles.vfFocus}><i /><i /><i /><i /></div>
            <p className={styles.vfHint}>press to focus</p>
            <div className={styles.vfInfo}><span>1/50</span><span>F2.8</span><span>ISO 640</span><span>±0.0</span></div>
          </div>
          {phase === "vf" && (
            <button type="button" className={styles.vfTap} onClick={focusAndShoot} aria-label="Press to focus and take the picture" autoFocus />
          )}
        </div>
      )}
      {flash > 0 && <div key={`f${flash}`} className={styles.flash} aria-hidden="true" />}
      {open && <Viewer p={open} onClose={close} />}
    </div>
  );
}
