"use client";

import { useEffect, useRef, useState } from "react";
import AppViewer from "./AppViewer";
import styles from "./touch.module.css";

/*
  How it works: you get pulled into the editing app.

  The whole thing runs off scroll position (0..1 through the section), so it can't get stuck halfway and
  it plays backwards when you scroll back up:

    0.00  a laptop sits in the page and scrolls up into view like the rest of it; you zoom in until its
          desktop is the whole screen
    0.10  the cursor clicks the app in the dock (it bounces) and the app opens out of the icon
    0.15  media   clips import into the media pool (real metadata for C0447)
    0.28  edit    the cursor clicks the edit tab; clips land on the timeline, the playhead runs
    0.45  color   the cursor clicks each of Leo's nodes in turn; the viewer, wheels, curves and a live
                  waveform all move with it
    0.76  deliver the render queue: a vertical reel, a 4:5 post, a 4K master, stills, a review link
    0.90  the cursor clicks the red button, the app shrinks back into the dock, you're on the desktop,
          and it zooms back out to the laptop, which carries on up the page with everything else

  There's a skip button while you're inside. Once you're past it, it folds down to one screen (a laptop
  and "watch it again"), so scrolling back up doesn't put you through it again. Come at it from above and
  it opens back up and plays.

  Handwritten notes point at the panels as they come up. It tells Stage when you're inside (so the
  camera bar and the header get out of the way) and how many nodes are on (the page grades with it).
*/

type Page = "media" | "edit" | "color" | "deliver";
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const AT = { open: 0.115, media: 0.15, edit: 0.28, color: 0.45, deliver: 0.76, close: 0.9 };
const pageAt = (p: number): Page => (p < AT.edit ? "media" : p < AT.color ? "edit" : p < AT.deliver ? "color" : "deliver");

const NODES = ["color space transform", "white balance", "contrast", "saturation", "split tone", "greens", "sky"];
const SHORT = ["cst", "wb", "contrast", "sat", "split", "greens", "sky"];
const NODE_LINES = [
  "the log gets converted, and the picture finally has some contrast.",
  "white balance, so the light looks the way it felt standing there.",
  "contrast, for real blacks under the trees.",
  "saturation, a little at a time.",
  "split tone: teal in the shadows, warm in the highlights.",
  "greens, so the leaves stop looking neon.",
  "sky, blue instead of cyan.",
];
// when the cursor clicks each node
const NODE_AT = NODES.map((_, i) => AT.color + 0.02 + (i + 0.5) * ((AT.deliver - AT.color - 0.04) / NODES.length));

const POOL = [
  { name: "C0447.MP4", img: "/lab/touch/cypress-desktop-log.jpg", dur: "00:00:06:12" },
  { name: "C0267.MP4", img: "/lab/touch/coffee-desktop-log.jpg", dur: "00:00:11:00" },
  { name: "C0647.MP4", img: "/lab/touch/pearl-desktop-log.jpg", dur: "00:00:12:00" },
  { name: "C0612.MP4", img: "/lab/touch/work/toast.jpg", dur: "00:00:18:12" },
  { name: "VID_299.MP4", img: "/lab/touch/work/maples.jpg", dur: "00:00:05:08" },
  { name: "ritual_v3.mov", img: "/lab/touch/work/ritual.jpg", dur: "00:00:08:10" },
  { name: "wiper_v9.mov", img: "/lab/touch/work/wiper.jpg", dur: "00:00:12:19" },
  { name: "room tone.wav", img: "", dur: "00:01:04:00" },
];
const V1 = [
  { w: 17, img: "/lab/touch/cypress-desktop-log.jpg", name: "C0447" },
  { w: 13, img: "/lab/touch/coffee-desktop-log.jpg", name: "C0267" },
  { w: 15, img: "/lab/touch/pearl-desktop-log.jpg", name: "C0647" },
  { w: 12, img: "/lab/touch/work/toast.jpg", name: "C0612" },
  { w: 14, img: "/lab/touch/work/ritual.jpg", name: "ritual" },
  { w: 13, img: "/lab/touch/work/wiper.jpg", name: "wiper" },
];
const MARKERS = [9, 24, 41, 57, 72, 88];
const JOBS = [
  { name: "garner_reel", spec: "1080×1920 · h.264 · 9:16", where: "instagram, tiktok" },
  { name: "garner_post", spec: "1080×1350 · h.264 · 4:5", where: "instagram feed" },
  { name: "garner_master", spec: "3840×2160 · h.265 · 16:9", where: "youtube, the website" },
  { name: "garner_stills", spec: "12 frames · tiff + jpeg", where: "press, thumbnails" },
  { name: "garner_review", spec: "1920×1080 · review link", where: "for you, before it goes out" },
];
const ADD_AT = 0.79, RENDER_AT = 0.825;

type Note = { page: Page; from: number; to: number; panel: string; text: string };
const NOTES: Note[] = [
  { page: "media", from: 0, to: 0.52, panel: "pool", text: "every clip from the shoot lands here first, still flat." },
  { page: "media", from: 0.52, to: 1, panel: "viewer", text: "s-log3 straight off the a7s iii. grey on purpose, so nothing gets thrown away." },
  { page: "edit", from: 0, to: 0.34, panel: "timeline", text: "the timeline: picture on top, sound underneath." },
  { page: "edit", from: 0.34, to: 0.68, panel: "timeline", text: "we cut for the first two seconds, because that's when people decide to stay." },
  { page: "edit", from: 0.68, to: 1, panel: "inspector", text: "markers on the beats, so the cuts land with the music." },
  { page: "color", from: 0, to: 0.32, panel: "nodes", text: "the grade is a chain of nodes, one fix each, in the same order every time." },
  { page: "color", from: 0.32, to: 0.64, panel: "wheels", text: "lift, gamma and gain move the shadows, the mids and the highlights." },
  { page: "color", from: 0.64, to: 1, panel: "scopes", text: "the waveform shows the exposure, so the blacks and whites land where they should." },
  { page: "deliver", from: 0, to: 0.48, panel: "queue", text: "one grade, every size: a vertical reel, a 4:5 post, a 4k master and stills." },
  { page: "deliver", from: 0.48, to: 1, panel: "queue", text: "and a review link for you before anything goes out." },
];
const pageSpan: Record<Page, [number, number]> = {
  media: [AT.media, AT.edit], edit: [AT.edit, AT.color], color: [AT.color, AT.deliver], deliver: [AT.deliver, AT.close],
};
const noteAt = (p: number) => {
  const pg = pageAt(p);
  const [a, b] = pageSpan[pg];
  const q = seg(p, a, b);
  return NOTES.find((n) => n.page === pg && q >= n.from && q < n.to) ?? null;
};

// where the cursor goes, and when it clicks
type Key = { p: number; t: string; click?: boolean };
const CURSOR: Key[] = [
  { p: 0.06, t: "off" },
  { p: 0.1, t: "dock-app" }, { p: AT.open, t: "dock-app", click: true },
  { p: 0.17, t: "pool-2" }, { p: 0.2, t: "pool-0" }, { p: 0.23, t: "play", click: true },
  { p: 0.27, t: "tab-edit" }, { p: AT.edit, t: "tab-edit", click: true },
  { p: 0.32, t: "tl-1" }, { p: 0.37, t: "tl-3" }, { p: 0.42, t: "mark-3" },
  { p: 0.44, t: "tab-color" }, { p: AT.color, t: "tab-color", click: true },
  ...NODE_AT.flatMap((at, i) => [{ p: at - 0.014, t: `node-${i}` }, { p: at, t: `node-${i}`, click: true }]),
  { p: 0.75, t: "tab-deliver" }, { p: AT.deliver, t: "tab-deliver", click: true },
  { p: ADD_AT - 0.012, t: "add" }, { p: ADD_AT, t: "add", click: true },
  { p: RENDER_AT - 0.012, t: "render" }, { p: RENDER_AT, t: "render", click: true },
  { p: 0.885, t: "close" }, { p: AT.close, t: "close", click: true },
  { p: 0.93, t: "dock-app" },
  { p: 0.96, t: "off" },
];
const CLICKS = CURSOR.filter((k) => k.click).map((k) => k.p);

const MENUS = ["file", "edit", "trim", "timeline", "clip", "mark", "view", "playback", "color", "workspace", "help"];
const TOOLS = ["media pool", "effects", "edit index", "sound library", "mixer", "metadata", "inspector"];
const TABS: { key: string; page?: Page }[] = [
  { key: "media", page: "media" }, { key: "cut" }, { key: "edit", page: "edit" }, { key: "color", page: "color" }, { key: "sound" }, { key: "deliver", page: "deliver" },
];

type State = { page: Page; pool: number; tl: number; n: number; jobs: number; note: string; noteText: string };

export default function EditSuite({ onNodes, onInside }: { onNodes: (n: number) => void; onInside: (inside: boolean) => void }) {
  const track = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const curRef = useRef<HTMLDivElement>(null);
  const tcRef = useRef<HTMLSpanElement>(null);
  const scopeRef = useRef<HTMLCanvasElement>(null);
  const cb = useRef({ onNodes, onInside });
  useEffect(() => { cb.current = { onNodes, onInside }; });
  const [st, setSt] = useState<State>({ page: "media", pool: 0, tl: 0, n: 0, jobs: 0, note: "", noteText: "" });
  const [live, setLive] = useState(false);
  const askRef = useRef<() => void>(() => {});
  // the panels just changed: measure again once they're laid out, so the cursor finds them
  useEffect(() => { askRef.current(); }, [st]);

  useEffect(() => {
    const el = track.current!, pn = pin.current!, app = appRef.current!, cur = curRef.current!;
    const scr = screenRef.current!, base = baseRef.current!, head = headRef.current!, skip = skipRef.current!;
    let raf = 0;
    let last = "";
    let sentN = -1, sentIn: boolean | null = null, sentLive: boolean | null = null;
    const pos = (t: string) => {
      const pr = pn.getBoundingClientRect();
      if (t === "off") return { x: pr.width * 1.04, y: pr.height * 1.08 };
      const e = pn.querySelector<HTMLElement>(`[data-cur="${t}"]`);
      if (!e) return null;
      const r = e.getBoundingClientRect();
      if (!r.width) return null;
      return { x: r.left + r.width / 2 - pr.left, y: r.top + r.height / 2 - pr.top };
    };
    let lastXY = { x: 0, y: 0 };

    // the laptop's screen: a 16:10 rectangle in the middle of the page, or the whole screen
    const place = (W: number, H: number, zoom: number, phone: boolean) => {
      // small enough on a computer that the camera bar under it doesn't cover the dock
      const lw = phone ? W * 0.9 : Math.min(W * 0.5, 860, (H * 0.55) / 0.625), lh = lw * 0.625;
      const lx = (W - lw) / 2, ly = H * 0.47 - lh / 2;
      const x = lerp(lx, 0, zoom), y = lerp(ly, 0, zoom), w = lerp(lw, W, zoom), h = lerp(lh, H, zoom);
      scr.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      scr.style.width = `${w.toFixed(1)}px`;
      scr.style.height = `${h.toFixed(1)}px`;
      scr.style.borderWidth = `${lerp(phone ? 7 : 11, 0, zoom).toFixed(1)}px`;
      scr.style.borderRadius = `${lerp(14, 0, zoom).toFixed(1)}px`;
      scr.style.setProperty("--s", lerp(0.6, 1, zoom).toFixed(3));
      base.style.transform = `translate3d(${(x - w * 0.07).toFixed(1)}px, ${(y + h).toFixed(1)}px, 0)`;
      base.style.width = `${(w * 1.14).toFixed(1)}px`;
      base.style.opacity = clamp01(1 - zoom * 1.6).toFixed(3);
      head.style.opacity = clamp01(1 - zoom * 2.2).toFixed(3);
      return { w, h };
    };

    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const H = window.innerHeight, W = window.innerWidth;
      const phone = W < 760;

      // folded down: the laptop sits there with "watch it again". It opens up again once you're above it.
      if (el.hasAttribute("data-collapsed")) {
        if (r.top >= H) el.removeAttribute("data-collapsed");
        place(W, H, 0, phone);
        app.style.opacity = "0";
        cur.style.opacity = "0";
        skip.style.opacity = "0";
        skip.style.pointerEvents = "none";
        if (sentIn !== false) { sentIn = false; cb.current.onInside(false); }
        if (sentLive !== false) { sentLive = false; setLive(false); }
        const pageN = r.top > H * 0.5 ? 0 : 8;
        if (pageN !== sentN) { sentN = pageN; cb.current.onNodes(pageN); }
        return;
      }
      // just went past the end, scrolling down: fold it so the way back up is one screen
      // The browser's own scroll anchoring would correct for the lost height too (and then we'd correct it
      // twice and land thousands of pixels up), so switch it off for this one change and correct by what
      // actually moved: whatever comes after the track stays exactly where it was on screen.
      if (r.bottom <= 0) {
        const root = document.documentElement;
        root.style.overflowAnchor = "none";
        const b0 = r.bottom;
        el.setAttribute("data-collapsed", "");
        const moved = el.getBoundingClientRect().bottom - b0;
        if (moved) window.scrollBy({ top: moved, behavior: "instant" });
        requestAnimationFrame(() => { root.style.overflowAnchor = ""; });
        ask();
        return;
      }

      const p = clamp01(-r.top / Math.max(1, r.height - H));
      // no rise or sink: the laptop is part of the page, it scrolls in, pins, and scrolls on out
      const zoom = ease(seg(p, 0.015, 0.075)) * (1 - ease(seg(p, 0.94, 0.99)));
      const { w: sw, h: sh } = place(W, H, zoom, phone);

      // the app opens out of its dock icon, and goes back into it
      const open = ease(seg(p, AT.open, AT.media)) * (1 - ease(seg(p, AT.close, AT.close + 0.03)));
      const icon = scr.querySelector<HTMLElement>('[data-cur="dock-app"]');
      const sr = scr.getBoundingClientRect(), ir = icon?.getBoundingClientRect();
      const ix = ir ? ir.left + ir.width / 2 - sr.left : sw / 2, iy = ir ? ir.top + ir.height / 2 - sr.top : sh;
      const k = 1 - open;
      app.style.transform = `translate3d(${((ix - sw / 2) * k).toFixed(1)}px, ${((iy - sh / 2) * k).toFixed(1)}px, 0) scale(${lerp(0.05, 1, open).toFixed(4)})`;
      app.style.opacity = open > 0.004 ? "1" : "0";
      app.style.borderRadius = `${lerp(12, 0, open).toFixed(1)}px`;
      icon?.toggleAttribute("data-bounce", Math.abs(p - AT.open) < 0.008);
      icon?.toggleAttribute("data-running", open > 0.02);

      const inside = p > 0.05 && p < 0.95;
      skip.style.opacity = inside ? "1" : "0";
      skip.style.pointerEvents = inside ? "auto" : "none";
      pn.style.setProperty("--ph", (seg(p, AT.edit, AT.close) * 100).toFixed(2));
      JOBS.forEach((_, i) => pn.style.setProperty(`--j${i}`, (seg(p, RENDER_AT + 0.006 + i * 0.014, RENDER_AT + 0.03 + i * 0.014) * 100).toFixed(1)));

      // the cursor
      let i = CURSOR.findIndex((k) => k.p > p);
      if (i < 0) i = CURSOR.length;
      const a = CURSOR[Math.max(0, i - 1)], b = CURSOR[Math.min(CURSOR.length - 1, i)];
      const pa = pos(a.t) ?? lastXY, pb = pos(b.t) ?? pa;
      const f = a === b ? 0 : ease(seg(p, a.p, b.p));
      const x = lerp(pa.x, pb.x, f), y = lerp(pa.y, pb.y, f);
      lastXY = { x, y };
      const clicking = CLICKS.some((c) => Math.abs(p - c) < 0.006);
      cur.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      cur.style.opacity = p > 0.06 && p < 0.96 ? "1" : "0";
      cur.toggleAttribute("data-click", clicking);

      // the timecode on the viewer
      if (tcRef.current) {
        const s = 6 + seg(p, AT.media, AT.close) * 52;
        tcRef.current.textContent = `01:00:${String(Math.floor(s)).padStart(2, "0")}:${String(Math.floor((s % 1) * 24)).padStart(2, "0")}`;
      }

      // what's on: a few discrete things, so React only re-renders when one of them changes
      const page = pageAt(p);
      const pool = Math.ceil(seg(p, 0.1, 0.19) * POOL.length);
      const tl = Math.ceil(seg(p, AT.edit + 0.02, AT.color - 0.04) * V1.length);
      const n = p < AT.color ? 0 : p >= AT.deliver ? 8 : NODE_AT.filter((t) => p >= t).length;
      const jobs = p >= ADD_AT ? JOBS.length : 0;
      const nt = noteAt(p);
      const key = `${page}|${pool}|${tl}|${n}|${jobs}|${nt?.panel}|${nt?.text}`;
      if (key !== last) {
        last = key;
        setSt({ page, pool, tl, n, jobs, note: nt?.panel ?? "", noteText: nt?.text ?? "" });
      }
      const pageN = r.top > 0 ? 0 : p >= AT.deliver ? 8 : n;
      if (pageN !== sentN) { sentN = pageN; cb.current.onNodes(pageN); }
      if (inside !== sentIn) { sentIn = inside; cb.current.onInside(inside); }
      const lv = r.bottom > 0 && r.top < H && p > AT.open - 0.01 && p < AT.close + 0.03;
      if (lv !== sentLive) { sentLive = lv; setLive(lv); }
    };
    function ask() { if (!raf) raf = requestAnimationFrame(measure); }
    askRef.current = ask;
    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", ask);
    ask();
    return () => {
      window.removeEventListener("scroll", ask);
      window.removeEventListener("resize", ask);
      cancelAnimationFrame(raf);
      cb.current.onInside(false);
    };
  }, []);

  // skip: straight to just past the end, where it folds down by itself
  const skipIt = () => {
    const el = track.current;
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + el.offsetHeight + 2, behavior: "instant" });
  };
  // watch it again: open it back up and put you at its start
  const replay = () => {
    const el = track.current;
    if (!el) return;
    el.removeAttribute("data-collapsed");
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
    askRef.current();
  };

  const { page, n } = st;
  const viewerNodes = page === "color" ? n : page === "deliver" ? 8 : 0;
  const note = (panel: string) =>
    st.note === panel ? <p className={`${styles.note} ${styles.appNote}`} key={st.noteText}>{st.noteText}</p> : null;
  const wheel = (name: string, dx: number, dy: number, vals: string) => (
    <div className={styles.wheel} key={name}>
      <svg viewBox="-50 -50 100 100" aria-hidden="true">
        <defs>
          <radialGradient id={`w-${name}`}>
            <stop offset="0" stopColor="#4a4a4f" />
            <stop offset="1" stopColor="#1d1d20" />
          </radialGradient>
        </defs>
        <circle r="44" fill={`url(#w-${name})`} stroke="#3a3a3f" />
        <circle r="44" fill="none" stroke="url(#hue)" strokeWidth="3" opacity="0.7" />
        <line x1="-44" y1="0" x2="44" y2="0" stroke="#333" />
        <line x1="0" y1="-44" x2="0" y2="44" stroke="#333" />
        <circle className={styles.wheelDot} cx={dx} cy={dy} r="4.5" />
      </svg>
      <b>{name}</b>
      <i>{vals}</i>
    </div>
  );

  return (
    <section ref={track} id="how" className={styles.appTrack} aria-label="How it works">
      <div ref={pin} className={styles.appPin}>
        <h2 ref={headRef} className={`${styles.kicker} ${styles.appHead}`}>how it works</h2>
        <div ref={baseRef} className={styles.lapBase} aria-hidden="true" />
        <div ref={screenRef} className={styles.lapScreen}>
          {/* the desktop: a wallpaper, a menu bar, a few folders and a dock */}
          <div className={styles.desk} aria-hidden="true">
            <div className={styles.deskBar}>
              <b>files</b><span>file</span><span>edit</span><span>view</span><span>go</span><span>window</span><span>help</span>
              <i>wed 4 nov · 9:41</i>
            </div>
            <div className={styles.deskIcons}>
              {["garner", "the pearl", "deliveries"].map((f) => <span key={f}><i />{f}</span>)}
            </div>
            <div className={styles.dock}>
              <span className={styles.dkFiles} /><span className={styles.dkPhotos} /><span className={styles.dkMail} />
              <span className={styles.dkWeb} />
              <span data-cur="dock-app" className={styles.dkApp}><i /><i /><i /></span>
              <span className={styles.dkTrash} />
            </div>
          </div>

        <div ref={appRef} className={styles.app} data-page={page}>
          <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
            <defs>
              <linearGradient id="hue" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#e84b3c" /><stop offset="0.33" stopColor="#e8c23c" />
                <stop offset="0.66" stopColor="#3ce87d" /><stop offset="1" stopColor="#3c7de8" />
              </linearGradient>
            </defs>
          </svg>

          <div className={styles.appMenubar}>
            <span className={styles.appLights}>
              <i data-cur="close" className={styles.lightRed} />
              <i className={styles.lightYellow} />
              <i data-cur="max" className={styles.lightGreen} />
            </span>
            <b>nidas touch</b>
            {MENUS.map((m) => <span key={m} className={styles.appMenu}>{m}</span>)}
            <span className={styles.appProject}>garner · 3840×2160 · 23.976</span>
          </div>
          <div className={styles.appToolbar} aria-hidden="true">
            {TOOLS.map((t, i) => <span key={t} className={i === (page === "color" ? 6 : page === "edit" ? 2 : 0) ? styles.toolOn : undefined}>{t}</span>)}
          </div>

          <div className={styles.appMain}>
            <section className={`${styles.panel} ${styles.pPool}`}>
              <header>media pool <i>master · garner</i></header>
              <div className={styles.poolGrid}>
                {POOL.map((c, i) => (
                  <figure key={c.name} data-cur={`pool-${i}`} className={i < st.pool ? styles.poolIn : undefined}>
                    {c.img ? <span style={{ backgroundImage: `url(${c.img})` }} /> : <span className={styles.poolAudio} />}
                    <figcaption>{c.name}<i>{c.dur}</i></figcaption>
                  </figure>
                ))}
              </div>
              {note("pool")}
            </section>

            <section className={`${styles.panel} ${styles.pMeta}`}>
              <header>metadata <i>C0447.MP4</i></header>
              <dl className={styles.rows}>
                <div><dt>camera</dt><dd>a7s iii</dd></div>
                <div><dt>gamma</dt><dd>s-log3 · s-gamut3.cine</dd></div>
                <div><dt>codec</dt><dd>xavc hs · h.265 · 10 bit 4:2:0</dd></div>
                <div><dt>frame</dt><dd>3840×2160 · 23.976</dd></div>
                <div><dt>bit rate</dt><dd>97 mb/s</dd></div>
                <div><dt>iso</dt><dd>640</dd></div>
                <div><dt>place</dt><dd>garner state park</dd></div>
              </dl>
            </section>

            <section className={`${styles.panel} ${styles.pViewer}`}>
              <header>
                {page === "media" ? "source · C0447" : page === "edit" ? "timeline · garner" : page === "color" ? `node ${String(Math.max(1, n)).padStart(2, "0")} · ${NODES[Math.max(0, n - 1)]}` : "deliver · garner_reel"}
                <i><span ref={tcRef}>01:00:06:00</span></i>
              </header>
              <AppViewer nodes={viewerNodes} live={live} scopeRef={scopeRef} />
              <div className={styles.transport} aria-hidden="true">
                <i>⏮</i><i>◀︎◀︎</i><i data-cur="play">▶</i><i>▶︎▶︎</i><i>⏭</i>
                <span className={styles.lutTag}>{viewerNodes === 0 ? "s-log3 · no lut" : viewerNodes >= 8 ? "graded" : `grading · ${viewerNodes}/7`}</span>
              </div>
              {note("viewer")}
            </section>

            <section className={`${styles.panel} ${styles.pInspector}`}>
              <header>inspector <i>video</i></header>
              <dl className={styles.rows}>
                <div><dt>zoom</dt><dd>1.000 · 1.000</dd></div>
                <div><dt>position</dt><dd>0.000 · 0.000</dd></div>
                <div><dt>rotation</dt><dd>0.000</dd></div>
                <div><dt>crop</dt><dd>0 · 0 · 0 · 0</dd></div>
                <div><dt>composite</dt><dd>normal · 100%</dd></div>
                <div><dt>speed</dt><dd>58% · optical flow</dd></div>
                <div><dt>stabilize</dt><dd>off</dd></div>
              </dl>
              {note("inspector")}
            </section>

            <section className={`${styles.panel} ${styles.pTimeline}`}>
              <header>timeline 1 · garner <i>01:00:00:00</i></header>
              <div className={styles.tl}>
                <div className={styles.tlRuler}>
                  {Array.from({ length: 11 }, (_, i) => <span key={i} style={{ left: `${i * 10}%` }}>{`00:${String(i * 6).padStart(2, "0")}`}</span>)}
                  {MARKERS.map((m, i) => <b key={m} data-cur={`mark-${i}`} style={{ left: `${m}%` }} />)}
                </div>
                <div className={styles.tlTrack} data-name="V2">
                  <div className={`${styles.tlClip} ${styles.tlTitle} ${st.tl >= 1 ? styles.tlIn : ""}`} style={{ left: "1%", width: "15%" }}>nidas touch</div>
                  <div className={`${styles.tlClip} ${styles.tlTitle} ${st.tl >= 6 ? styles.tlIn : ""}`} style={{ left: "84%", width: "12%" }}>say hi</div>
                </div>
                <div className={styles.tlTrack} data-name="V1">
                  {V1.map((c, i) => {
                    const left = V1.slice(0, i).reduce((s, x) => s + x.w, 0) + 1;
                    return (
                      <div key={c.name} data-cur={`tl-${i}`} className={`${styles.tlClip} ${styles.tlVideo} ${i < st.tl ? styles.tlIn : ""}`} style={{ left: `${left}%`, width: `${c.w - 0.4}%`, backgroundImage: `url(${c.img})` }}>
                        <span>{c.name}</span>
                      </div>
                    );
                  })}
                </div>
                <div className={styles.tlTrack} data-name="A1">
                  <div className={`${styles.tlClip} ${styles.tlAudio} ${st.tl >= 2 ? styles.tlIn : ""}`} style={{ left: "1%", width: "84%" }}><span>music</span></div>
                </div>
                <div className={styles.tlTrack} data-name="A2">
                  {[[1, 20], [24, 30], [58, 26]].map(([l, w], i) => (
                    <div key={l} className={`${styles.tlClip} ${styles.tlRoom} ${st.tl >= 3 + i ? styles.tlIn : ""}`} style={{ left: `${l}%`, width: `${w}%` }}><span>room tone</span></div>
                  ))}
                </div>
                <div className={styles.tlPlayhead} />
              </div>
              {note("timeline")}
            </section>

            <section className={`${styles.panel} ${styles.pNodes}`}>
              <header>nodes <i>{n > 0 ? `${n} of 7` : "none"}</i></header>
              <ol className={styles.nodeGraph}>
                <li className={styles.nodeIO}>in</li>
                {SHORT.map((s, i) => (
                  <li key={s} data-cur={`node-${i}`} className={i < n ? styles.nodeLive : undefined}>
                    <span style={{ backgroundImage: "url(/lab/touch/cypress-desktop-graded.jpg)" }} />
                    <b>{String(i + 1).padStart(2, "0")}</b>
                    <i>{s}</i>
                  </li>
                ))}
                <li className={styles.nodeIO}>out</li>
              </ol>
              {page === "color" && n > 0 && <p className={styles.nodeLine}><b>{NODES[n - 1]}</b> {NODE_LINES[n - 1]}</p>}
              {note("nodes")}
            </section>

            <section className={`${styles.panel} ${styles.pWheels}`}>
              <header>primaries · color wheels <i>curves</i></header>
              <div className={styles.wheels}>
                {wheel("lift", n >= 5 ? -9 : 0, n >= 5 ? 6 : 0, n >= 5 ? "-0.02 0.00 0.03" : "0.00 0.00 0.00")}
                {wheel("gamma", n >= 2 ? 6 : 0, n >= 2 ? -4 : 0, n >= 2 ? "0.01 0.00 -0.01" : "0.00 0.00 0.00")}
                {wheel("gain", n >= 5 ? 8 : n >= 3 ? 3 : 0, n >= 5 ? -7 : 0, n >= 3 ? "1.04 1.01 0.97" : "1.00 1.00 1.00")}
                {wheel("offset", 0, 0, "25.00 25.00 25.00")}
                <svg className={styles.curves} viewBox="0 0 100 100" aria-hidden="true">
                  <path d="M0 25 H100 M0 50 H100 M0 75 H100 M25 0 V100 M50 0 V100 M75 0 V100" stroke="#2c2c30" />
                  <path className={styles.curve} d={n >= 3 ? "M0 100 C 30 96, 32 70, 50 50 S 70 6, 100 0" : "M0 100 L100 0"} />
                </svg>
              </div>
              {note("wheels")}
            </section>

            <section className={`${styles.panel} ${styles.pScopes}`}>
              <header>scope <i>waveform</i></header>
              <canvas ref={scopeRef} className={styles.scope} aria-hidden="true" />
              {note("scopes")}
            </section>

            <section className={`${styles.panel} ${styles.pSettings}`}>
              <header>render settings <i>custom export</i></header>
              <dl className={styles.rows}>
                <div><dt>file name</dt><dd>garner_reel</dd></div>
                <div><dt>location</dt><dd>/deliveries/garner</dd></div>
                <div><dt>format</dt><dd>mp4</dd></div>
                <div><dt>codec</dt><dd>h.264 · high</dd></div>
                <div><dt>resolution</dt><dd>1080×1920</dd></div>
                <div><dt>frame rate</dt><dd>23.976</dd></div>
                <div><dt>quality</dt><dd>restrict to 40 mb/s</dd></div>
                <div><dt>audio</dt><dd>aac · 320 kb/s</dd></div>
              </dl>
            </section>

            <section className={`${styles.panel} ${styles.pQueue}`}>
              <header>render queue <i>{st.jobs ? `${JOBS.length} jobs` : "empty"}</i></header>
              <div className={styles.queueBtns}>
                <span data-cur="add" className={styles.qBtn}>add to render queue</span>
                <span data-cur="render" className={`${styles.qBtn} ${styles.qGo}`}>render all</span>
              </div>
              <ul className={styles.jobs}>
                {JOBS.map((j, i) => (
                  <li key={j.name} className={i < st.jobs ? styles.jobIn : undefined} style={{ ["--j" as string]: `var(--j${i})` }}>
                    <b>{j.name}</b>
                    <span>{j.spec}</span>
                    <i>{j.where}</i>
                    <u />
                  </li>
                ))}
              </ul>
              {note("queue")}
            </section>
          </div>

          <p className={styles.appCaption} aria-live="polite">{st.noteText}</p>

          <nav className={styles.appTabs} aria-hidden="true">
            {TABS.map((t) => (
              <span key={t.key} data-cur={`tab-${t.key}`} className={t.page === page ? styles.tabOn : undefined}>
                <i />{t.key}
              </span>
            ))}
          </nav>
        </div>
        </div>

        <button ref={skipRef} type="button" className={styles.skip} onClick={skipIt}>skip this part</button>
        <div className={styles.replay}>
          <button type="button" onClick={replay}>watch how it works again</button>
        </div>

        <div ref={curRef} className={styles.appCursor} aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M3 2 L3 19 L8 14.5 L11.2 21.5 L14 20.3 L10.9 13.4 L17.5 13.4 Z" /></svg>
          <i />
        </div>
      </div>
    </section>
  );
}
