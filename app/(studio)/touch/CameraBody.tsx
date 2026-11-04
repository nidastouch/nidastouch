"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { detent, flip, halfPress, press, recStart, shutter as shutterSound } from "./sound";
import styles from "./touch.module.css";

/*
  The menu is a camera. Clunky on purpose (Leo likes it that way): a mirrorless body with a pointed
  hump, a hot shoe, a deep grip, no brand on it but ours. three.js.

  It stays out of the hero. After the first screen it slides up into a small floating bar, and you look
  straight down at its top plate, so it reads flat:
    mode dial (left)   work, make, people. Tap to click to the next stop, or drag it round.
    rec, menu, home    rec opens the piece on screen (its tally light is on when there is one).
                       menu turns the camera round to its screen, where Stage puts a menu.
                       home goes back to the top.
    exposure dial      a fidget. It clicks, it does nothing.
    shutter (right)    say hi, with the power lever round it: log or graded.
  The lens, grip and eyecup only grow in once it starts to move, so the bar is just the rectangle.

  The ending is not scrubbed by scroll, so nobody can leave it half done: when Stage sets `ending`, it
  plays start to finish on a clock (it lifts off the bar and tips up, lens up and away, eyecup toward
  you, then dives into the viewfinder), writes --vf-dark as the screen goes black, and calls onEnded.
  The viewfinder and the say hi screen are DOM, in Stage. When `ending` goes false it resets to the bar.

  The canvas covers the screen but never takes pointer events: a listener on the window checks whether
  a press landed on the camera, and only then keeps it. It renders only while something moves.
  Units are roughly centimetres: the body is 13 wide, 8 tall, 4.6 deep. Top is y = 0, lens out at -z.
*/

type Props = {
  turns: number;               // quarter turns of the dial (stop = turns mod 4)
  onTurn: (turns: number) => void;
  graded: boolean;
  onGraded: (g: boolean) => void;
  onShutter: () => void;
  sound: boolean;
  onSound: (s: boolean) => void;
  armed: boolean;              // a piece is on screen for rec to open
  onRec: () => void;
  onFail: () => void;          // no WebGL: the page shows plain buttons instead
  inactive?: boolean;          // something is open over the page: the camera ignores presses
  ending: boolean;             // play the ending (true) or sit on the bar (false)
  onEnded: () => void;         // the screen is black: hand over to the viewfinder
  menu: boolean;               // turned round, showing its screen
  away?: boolean;              // step out of the way (the editing app is full screen)
  onMenu: () => void;          // the menu button was pressed
  onHome: () => void;          // the home button was pressed
  onMenuRect: (r: { x: number; y: number; w: number; h: number } | null) => void; // where its screen is, in px
};

type Api = {
  setAway: (on: boolean) => void;
  setEnding: (on: boolean) => void;
  setMenu: (on: boolean) => void;
  setDial: (turns: number) => void;
  setLever: (graded: boolean) => void;
  setSound: (on: boolean) => void;
  setArmed: (on: boolean) => void;
  dispose: () => void;
};

const QUARTER = (Math.PI * 2) / 3; // the dial has three stops now: work, make, people
const LEVER = { graded: THREE.MathUtils.degToRad(-35), log: THREE.MathUtils.degToRad(20) };
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Spring = { x: number; v: number; to: number; k: number; d: number };
const spring = (x: number, k: number, d: number): Spring => ({ x, v: 0, to: x, k, d });
const stepSpring = (s: Spring, dt: number) => {
  const a = (s.to - s.x) * s.k - s.v * s.d;
  s.v += a * dt;
  s.x += s.v * dt;
  const moving = Math.abs(s.v) > 1e-4 || Math.abs(s.to - s.x) > 1e-4;
  if (!moving) { s.x = s.to; s.v = 0; }
  return moving;
};

// printed markings: white caps, the way cameras do it
const paintText = (text: string, w: number, h: number, color = "#f1eee8", weight = 700, spacing = 0.08) => {
  const c = document.createElement("canvas");
  c.height = 160;
  c.width = Math.round(160 * (w / h));
  const g = c.getContext("2d")!;
  g.fillStyle = color;
  g.font = `${weight} 108px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${Math.round(108 * spacing)}px`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, c.width / 2, c.height / 2 + 6);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map: t, transparent: true, roughness: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4,
    }),
  );
};
const flat = (m: THREE.Mesh) => { m.rotation.x = -Math.PI / 2; return m; };

// numbers round the top of the exposure dial, fanned toward the front
const evFace = (r: number) => {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.textAlign = "center";
  g.textBaseline = "middle";
  ["-3", "-2", "-1", "0", "+1", "+2", "+3"].forEach((m, i) => {
    const a = Math.PI / 2 + ((3 - i) * Math.PI) / 7;
    g.save();
    g.translate(256 + Math.cos(a) * 182, 256 + Math.sin(a) * 182);
    g.rotate(a - Math.PI / 2);
    g.font = `700 ${i === 3 ? 68 : 54}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    g.fillStyle = i === 3 ? "#f2a23a" : "#f1eee8";
    g.fillText(m, 0, 0);
    g.restore();
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(r, 48),
    new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }),
  );
  m.rotation.x = -Math.PI / 2;
  return m;
};

const stipple = (amount: number, repeat: [number, number]) => {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const img = g.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = 128 + (Math.random() - 0.5) * amount;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  return t;
};

// a cylinder whose side alternates in and out: dial grip, or the rubber on a lens ring
const knurled = (r: number, h: number, ridges: number, depth = 0.95) => {
  const seg = ridges * 2;
  const g = new THREE.CylinderGeometry(r, r, h, seg, 1, false);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    if (Math.hypot(x, z) > r * 0.999) {
      const k = Math.round((Math.atan2(x, z) / (Math.PI * 2)) * seg);
      if (Math.abs(k) % 2 === 1) { p.setX(i, x * depth); p.setZ(i, z * depth); }
    }
  }
  g.computeVertexNormals();
  return g;
};

// the viewfinder hump: a faceted block, narrower on top, its front leaning back
const hump = (wb: number, db: number, wt: number, dt: number, h: number, back: number) => {
  const B = [[-wb / 2, 0, -db / 2], [wb / 2, 0, -db / 2], [wb / 2, 0, db / 2], [-wb / 2, 0, db / 2]];
  const T = [[-wt / 2, h, -dt / 2 + back], [wt / 2, h, -dt / 2 + back], [wt / 2, h, dt / 2 + back], [-wt / 2, h, dt / 2 + back]];
  const tris = [
    [T[0], T[3], T[2]], [T[0], T[2], T[1]],
    [B[3], B[2], T[2]], [B[3], T[2], T[3]],
    [B[1], B[0], T[0]], [B[1], T[0], T[1]],
    [B[2], B[1], T[1]], [B[2], T[1], T[2]],
    [B[0], B[3], T[3]], [B[0], T[3], T[0]],
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(tris.flat(2), 3));
  g.computeVertexNormals();
  return g;
};

function build(canvas: HTMLCanvasElement, cb: { current: Props }): Api | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  } catch {
    return null;
  }
  const fine = window.matchMedia("(pointer: fine)").matches;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap; // r187 folded soft shadows into PCF (shadow.radius softens it)

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.7;

  // a long lens from far away: almost no perspective, so the bar looks flat
  const D = 60;
  const cam = new THREE.PerspectiveCamera(14, 1, 0.3, 200);
  cam.position.set(0, 0, D);
  cam.lookAt(0, 0, 0);

  const key = new THREE.DirectionalLight(0xfff3e2, 2.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 4;
  key.shadow.bias = -0.0005;
  const rim = new THREE.DirectionalLight(0xdde6ff, 0.8);
  scene.add(key, key.target, rim, rim.target);

  // ---- materials
  const bodyBump = stipple(70, [7, 5]);
  const gripBump = stipple(150, [10, 12]);
  const paint = new THREE.MeshPhysicalMaterial({
    color: 0x101012, roughness: 0.66, metalness: 0.12, clearcoat: 0.12, clearcoatRoughness: 0.6, bumpMap: bodyBump, bumpScale: 0.35,
  });
  const satin = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.78, metalness: 0.1, bumpMap: bodyBump, bumpScale: 0.35 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0e0e0f, roughness: 0.95, bumpMap: gripBump, bumpScale: 1.2 });
  const anod = new THREE.MeshStandardMaterial({ color: 0x1f1f21, roughness: 0.34, metalness: 0.82 });
  const anodSoft = new THREE.MeshStandardMaterial({ color: 0x2a2a2d, roughness: 0.5, metalness: 0.55 });
  const dialTop = new THREE.MeshStandardMaterial({ color: 0x323236, roughness: 0.45, metalness: 0.6 });
  const lensBlack = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.45, metalness: 0.35 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.14, metalness: 1 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xb5b8bc, roughness: 0.3, metalness: 1 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.3, metalness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });
  const glassDark = new THREE.MeshPhysicalMaterial({ color: 0x05060a, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03 });
  const red = new THREE.MeshPhysicalMaterial({ color: 0xc8141e, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.1 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x06070b, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02,
    iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [180, 620],
  });
  const tally = new THREE.MeshStandardMaterial({ color: 0x2b0c0a, emissive: 0xff2a14, emissiveIntensity: 0, roughness: 0.25 });
  const led = new THREE.MeshStandardMaterial({ color: 0x0c2412, emissive: 0x38e862, emissiveIntensity: 0, roughness: 0.25 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xf2a23a, roughness: 0.5 });
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });

  const rig = new THREE.Group(); // the whole camera: this is what moves
  scene.add(rig);
  const extras: THREE.Object3D[] = []; // the parts that only grow in once it starts to move

  const add = <T extends THREE.Object3D>(parent: THREE.Object3D, o: T, x = 0, y = 0, z = 0) => {
    o.position.set(x, y, z);
    parent.add(o);
    o.traverse((n) => {
      const m = n as THREE.Mesh;
      if (m.isMesh && m.material !== hitMat && !(m.material as THREE.MeshStandardMaterial).transparent) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    return o;
  };
  const extra = <T extends THREE.Object3D>(o: T) => { extras.push(o); return o; };
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material) => new THREE.Mesh(g, m);
  const hit = (g: THREE.BufferGeometry, ctl: string) => { const h = mesh(g, hitMat); h.userData.ctl = ctl; return h; };
  const forward = (g: THREE.BufferGeometry) => g.rotateX(Math.PI / 2);

  // ---- body
  add(rig, mesh(new RoundedBoxGeometry(13, 8, 4.6, 5, 0.32), paint), 0, -4, 0);
  add(rig, mesh(new RoundedBoxGeometry(13.04, 0.04, 4.64, 2, 0.3), dark), 0, -1.2, 0); // the top cover seam
  add(rig, mesh(hump(4.4, 4.4, 3.0, 2.5, 1.6, 0.45), satin), -1.2, -0.02, 0.5);
  const shoe = add(rig, new THREE.Group(), -1.2, 1.58, 0.95);
  add(shoe, mesh(new THREE.BoxGeometry(1.9, 0.05, 1.8), steel), 0, 0.025, 0);
  add(shoe, mesh(new THREE.BoxGeometry(1.0, 0.02, 0.9), dark), 0, 0.06, 0);
  [-1, 1].forEach((s) => {
    add(shoe, mesh(new THREE.BoxGeometry(0.15, 0.16, 1.8), steel), s * 0.88, 0.1, 0);
    add(shoe, mesh(new THREE.BoxGeometry(0.32, 0.04, 1.8), steel), s * 0.74, 0.19, 0);
  });
  for (let i = 0; i < 10; i++) add(shoe, mesh(new THREE.BoxGeometry(0.06, 0.03, 0.14), gold), -0.45 + i * 0.1, 0.07, -0.78);
  const holeG = new THREE.CylinderGeometry(0.045, 0.045, 0.02, 12);
  [-2.45, 0.05].forEach((x) => { for (let r = 0; r < 4; r++) add(rig, mesh(holeG, dark), x, 1.585, -0.1 + r * 0.2); });
  add(rig, mesh(new THREE.TorusGeometry(0.26, 0.07, 12, 28), steel), -6.56, -0.95, 0.6).rotation.y = Math.PI / 2;
  add(rig, mesh(new THREE.TorusGeometry(0.26, 0.07, 12, 28), steel), 6.62, -0.95, 0.3).rotation.y = Math.PI / 2;
  // the back: the screen (the eyecup grows in later)
  add(rig, mesh(new RoundedBoxGeometry(7.6, 4.6, 0.14, 3, 0.12), anodSoft), -1.6, -4.0, 2.3);
  add(rig, mesh(new THREE.PlaneGeometry(7.0, 4.1), glassDark), -1.6, -4.0, 2.375);

  // ---- the parts that grow in when it moves: grip, eyecup, name, lens
  extra(add(rig, mesh(new RoundedBoxGeometry(3.3, 8.1, 3.8, 6, 0.75), rubber), 4.95, -4.1, -3.5));
  const eyecup = extra(add(rig, new THREE.Group(), -1.2, 0.55, 2.85));
  add(eyecup, mesh(new RoundedBoxGeometry(2.7, 1.5, 0.7, 4, 0.3), rubber));
  add(eyecup, mesh(new RoundedBoxGeometry(1.7, 0.8, 0.1, 3, 0.2), glassDark), 0, 0, 0.36);
  const name = paintText("NIDAS TOUCH", 2.9, 0.34, "#d4cfc4", 500, 0.22);
  name.rotation.set(Math.atan2(2.2 - 0.8, 1.6), Math.PI, 0);
  extra(add(rig, name, -1.2, 0.79, -1.02));
  const lens = extra(add(rig, new THREE.Group(), -1.2, -4.4, -2.3));
  lens.rotation.y = Math.PI; // its +z points out the front
  add(lens, mesh(forward(new THREE.CylinderGeometry(2.5, 2.5, 0.18, 72)), steel), 0, 0, 0.09);
  add(lens, mesh(forward(new THREE.CylinderGeometry(2.3, 2.35, 0.7, 72)), lensBlack), 0, 0, 0.53);
  add(lens, mesh(forward(knurled(2.4, 1.7, 90, 0.975)), rubber), 0, 0, 1.75);
  add(lens, mesh(forward(new THREE.CylinderGeometry(2.28, 2.3, 0.5, 72)), lensBlack), 0, 0, 2.85);
  add(lens, mesh(forward(knurled(2.32, 1.1, 140, 0.982)), rubber), 0, 0, 3.65);
  add(lens, mesh(forward(new THREE.CylinderGeometry(2.38, 2.34, 0.7, 72)), lensBlack), 0, 0, 4.55);
  add(lens, mesh(new THREE.TorusGeometry(2.0, 0.07, 10, 64), steel), 0, 0, 4.9);
  add(lens, mesh(forward(new THREE.CylinderGeometry(1.7, 1.7, 0.1, 48)), dark), 0, 0, 4.78);
  const front = add(lens, mesh(new THREE.SphereGeometry(1.98, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2), glass), 0, 0, 4.86);
  front.rotation.x = Math.PI / 2;
  front.scale.set(1, 0.22, 1);

  // ---- mode dial, on the left
  const dial = add(rig, new THREE.Group(), -4.85, 0, 0);
  add(dial, mesh(new THREE.CylinderGeometry(1.34, 1.38, 0.1, 72), anodSoft), 0, 0.05, 0);
  const dialRot = add(dial, new THREE.Group(), 0, 0.1, 0);
  add(dialRot, mesh(knurled(1.24, 0.8, 60), anod), 0, 0.4, 0);
  add(dialRot, mesh(new THREE.CylinderGeometry(1.1, 1.14, 0.04, 72), dialTop), 0, 0.82, 0);
  add(dialRot, mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.16, 40), chrome), 0, 0.9, 0); // lock
  ["WORK", "MAKE", "PEOPLE"].forEach((s, i) => {
    const pivot = add(dialRot, new THREE.Group());
    pivot.rotation.y = -i * QUARTER;
    const long = s.length > 4; // PEOPLE gets smaller letters so it fits on the dial
    add(pivot, flat(paintText(s, long ? 1.24 : 1.12, long ? 0.32 : 0.44, "#f1eee8", 700, long ? 0.02 : 0.08)), 0, 0.845, 0.72);
  });
  const tri = new THREE.Shape();
  tri.moveTo(-0.17, 0); tri.lineTo(0.17, 0); tri.lineTo(0, 0.26); tri.closePath();
  add(rig, flat(mesh(new THREE.ShapeGeometry(tri), orange)), -4.85, 0.004, 1.86);
  add(dial, hit(new THREE.CylinderGeometry(1.5, 1.5, 1.3, 24), "dial"), 0, 0.55, 0);

  // ---- rec, menu and home, a row, labelled underneath
  const button = (x: number, z: number, top: THREE.Material, ctl: string) => {
    const g = add(rig, new THREE.Group(), x, 0, z);
    add(g, mesh(new THREE.CylinderGeometry(0.58, 0.6, 0.06, 64), anod), 0, 0.03, 0);
    const cap = add(g, new THREE.Group(), 0, 0.06, 0);
    add(cap, mesh(new THREE.CylinderGeometry(0.44, 0.46, 0.18, 64), top), 0, 0.09, 0);
    add(cap, mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.05, 64), top), 0, 0.2, 0);
    add(g, hit(new THREE.CylinderGeometry(0.78, 0.78, 0.7, 24), ctl), 0, 0.3, 0);
    return cap;
  };
  const recBtn = button(1.55, -1.3, red, "rec");
  const sndBtn = button(2.7, -1.3, anodSoft, "menu");
  const homeBtn = button(3.85, -1.3, anodSoft, "home");
  add(rig, flat(paintText("REC", 0.66, 0.3, "#ff5a4a")), 1.55, 0.004, -0.5);
  add(rig, flat(paintText("MENU", 0.84, 0.3)), 2.7, 0.004, -0.5);
  add(rig, flat(paintText("HOME", 0.84, 0.3)), 3.85, 0.004, -0.5);
  add(rig, mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 20), tally), 2.04, 0.025, -0.5);

  // ---- exposure dial: the fidget
  const ev = add(rig, new THREE.Group(), 2.55, 0, 1.15);
  add(ev, mesh(new THREE.CylinderGeometry(0.98, 1.0, 0.06, 64), anodSoft), 0, 0.03, 0);
  const evRot = add(ev, new THREE.Group(), 0, 0.06, 0);
  add(evRot, mesh(knurled(0.9, 0.62, 54), anod), 0, 0.31, 0);
  add(evRot, mesh(new THREE.CylinderGeometry(0.82, 0.84, 0.03, 64), dialTop), 0, 0.63, 0);
  add(evRot, evFace(0.8), 0, 0.648, 0);
  add(ev, hit(new THREE.CylinderGeometry(1.1, 1.1, 1.0, 24), "ev"), 0, 0.45, 0);

  // ---- shutter, on the right, silver so it reads as the button; the power lever round it
  const sh = add(rig, new THREE.Group(), 5.25, 0, -0.55);
  add(sh, mesh(new THREE.CylinderGeometry(0.9, 0.94, 0.3, 72), anod), 0, 0.15, 0);
  add(sh, flat(paintText("SAY HI", 0.74, 0.24, "#f1eee8", 700, 0.08)), 0, 0.302, 0.72);
  const lever = add(sh, new THREE.Group());
  add(lever, mesh(new THREE.CylinderGeometry(1.0, 1.01, 0.12, 72), anodSoft), 0, 0.06, 0);
  add(lever, mesh(new RoundedBoxGeometry(0.5, 0.14, 0.56, 3, 0.06), anodSoft), 0, 0.07, 1.2);
  add(lever, hit(new THREE.BoxGeometry(0.9, 0.7, 0.9), "lever"), 0, 0.2, 1.25);
  const btn = add(sh, new THREE.Group(), 0, 0.3, 0);
  add(btn, mesh(new THREE.CylinderGeometry(0.6, 0.62, 0.15, 64), chrome), 0, 0.075, 0);
  const dome = add(btn, mesh(new THREE.SphereGeometry(0.6, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2), chrome), 0, 0.15, 0);
  dome.scale.y = 0.42;
  add(sh, hit(new THREE.CylinderGeometry(0.8, 0.8, 1.3, 24), "shutter"), 0, 0.5, 0);
  const around = (deg: number, r: number) => {
    const a = THREE.MathUtils.degToRad(deg);
    return [5.25 + r * Math.sin(a), -0.55 + r * Math.cos(a)] as const;
  };
  const [gx, gz] = around(-35, 1.72);
  const [lx, lz] = around(20, 1.62);
  add(rig, flat(paintText("GRADED", 1.2, 0.32)), gx, 0.004, gz);
  add(rig, flat(paintText("LOG", 0.68, 0.32)), lx, 0.004, lz);
  add(rig, hit(new THREE.BoxGeometry(1.1, 0.4, 0.6), "graded"), gx, 0.1, gz);
  add(rig, hit(new THREE.BoxGeometry(0.8, 0.4, 0.6), "log"), lx, 0.1, lz);

  // ---- motion
  const p0 = cb.current;
  let turns = p0.turns;
  let evTurns = 0;
  const S = {
    dial: spring(turns * QUARTER, 130, 11),
    ev: spring(0, 130, 11),
    lever: spring(p0.graded ? LEVER.graded : LEVER.log, 320, 22),
    shutter: spring(0, 900, 46),
    rec: spring(0, 900, 46),
    snd: spring(0, 900, 46),
    tally: spring(p0.armed ? 1 : 0, 60, 14),
    led: spring(p0.sound ? 1 : 0, 60, 14),
    home: spring(0, 900, 46),
    menu: spring(0, 90, 18), // 0 on the bar, 1 turned round showing its screen
    sink: spring(0, 40, 13), // (unused: the bar stays put now)
    rise: spring(1, 26, 10), // 1 = out of sight below the edge (on the hero), 0 = on screen
  };
  // the ending runs on a clock, never on scroll
  const DUR = reduce ? 300 : 2700;
  let endStart = -1;
  let endedSent = false;

  // world units per screen pixel on the z = 0 plane
  let W = 1, H = 1, k = 1;
  let sA = 1, sB = 1;
  const posA = new THREE.Vector3(), posB = new THREE.Vector3(), posC = new THREE.Vector3();
  const qA = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)); // looking straight down at the top
  const qB = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.28, -0.32, 0.05)); // tipped up, lens up and away
  const qC = new THREE.Quaternion();                                                  // square on to the eyepiece
  const eyepiece = new THREE.Vector3(-1.2, 0.55, 3.25);
  const screenLocal = new THREE.Vector3(-1.6, -4.0, 2.38); // the middle of the back screen
  const qM = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 0, 0)); // its back to you, tipped a touch
  const posM = new THREE.Vector3();
  let sM = 1;
  let rectSent = "";
  const q = new THREE.Quaternion();
  const tmp = new THREE.Vector3();
  let lastDark = -1;

  const layout = () => {
    k = (2 * D * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2)) / H;
    const wide = W >= 760;
    // a small floating bar, not a full-width one
    const barPx = wide ? Math.min(440, W * 0.34) : Math.min(W * 0.82, 340);
    sA = (barPx * k) / 13;
    const lift = wide ? 22 : 26; // floats clear of the bottom edge and the phone's home bar
    posA.set(0, -(H / 2) * k + 2.32 * sA + lift * k, 0);
    const bodyPx = wide ? Math.min(520, W * 0.4) : W * 0.74;
    sB = (bodyPx * k) / 13;
    posB.set(-0.9 * sB, 0.04 * H * k + 3.4 * sB, 0); // nudged left: the three-quarter turn swings it right
    // the menu: its screen big enough to read, a little above the middle
    const screenPx = wide ? Math.min(520, W * 0.42) : W * 0.84;
    sM = (screenPx * k) / 7.0;
    posM.set(0, 0.06 * H * k, 0).sub(tmp.copy(screenLocal).multiplyScalar(sM).applyQuaternion(qM));
    // the eyepiece ends up dead centre, right in front of the lens we're looking through
    posC.set(0, 0, D - 2.4).sub(tmp.copy(eyepiece).multiplyScalar(sB).applyQuaternion(qC));
  };

  const t0 = performance.now();
  const apply = (now: number) => {
    dialRot.rotation.y = S.dial.x;
    evRot.rotation.y = S.ev.x;
    lever.rotation.y = S.lever.x;
    btn.position.y = 0.3 + S.shutter.x;
    recBtn.position.y = 0.06 + S.rec.x;
    sndBtn.position.y = 0.06 + S.snd.x;
    homeBtn.position.y = 0.06 + S.home.x;
    tally.emissiveIntensity = S.tally.x * 2.4;
    led.emissiveIntensity = S.led.x * 2.2;

    const p = endStart < 0 ? 0 : clamp01((now - endStart) / DUR);
    const a = ease(clamp01(p / 0.42));          // off the bar and tipped up
    const b = ease(clamp01((p - 0.5) / 0.46));  // into the viewfinder
    const m = ease(clamp01(S.menu.x));
    const grow = Math.max(ease(clamp01(a / 0.5)), m);
    extras.forEach((o) => { o.visible = grow > 0.01; o.scale.setScalar(Math.max(0.001, grow)); });

    const s = THREE.MathUtils.lerp(THREE.MathUtils.lerp(sA, sB, a), sM, m);
    rig.scale.setScalar(s);
    q.slerpQuaternions(qA, qB, a).slerp(qC, b).slerp(qM, m);
    rig.quaternion.copy(q);
    if (a > 0 && a < 1) rig.rotateZ(Math.sin(a * Math.PI) * 0.18); // a clunky wobble on the way up
    rig.position.copy(posA)
      .add(tmp.set(0, -(S.sink.x * 1.6 + S.rise.x * 7) * sA, 0))
      .lerp(posB, a)
      .lerp(posC, b)
      .lerp(posM, m);
    if (a >= 1 && b <= 0 && !reduce) rig.position.y += Math.sin((now - t0) / 260) * 0.08 * sB; // a little bob

    // light and shadow follow the camera wherever it goes
    key.target.position.copy(rig.position);
    key.position.copy(rig.position).add(tmp.set(-12, 10, 8).multiplyScalar(s)); // low from the upper left: the dials throw shadows
    Object.assign(key.shadow.camera, { left: -10 * s, right: 10 * s, top: 10 * s, bottom: -10 * s, near: 0.1, far: 40 * s });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.normalBias = 0.02 * s;
    rim.target.position.copy(rig.position);
    rim.position.copy(rig.position).add(tmp.set(8, 6, -10).multiplyScalar(s));

    // into the viewfinder: the screen goes black (Stage's black layer reads --vf-dark)
    const darkV = clamp01((b - 0.75) / 0.25);
    if (Math.abs(darkV - lastDark) > 0.002) {
      lastDark = darkV;
      root.style.setProperty("--vf-dark", darkV.toFixed(3));
      canvas.style.opacity = String(1 - darkV);
    }
    if (p >= 1 && !endedSent) { endedSent = true; window.setTimeout(() => cb.current.onEnded(), 0); }

    // once it has turned round, tell Stage where its screen is, so the menu sits exactly on it
    if (S.menu.to === 1 && m > 0.985) {
      rig.updateMatrixWorld(true);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const [dx, dy] of [[-3.5, -2.05], [3.5, -2.05], [3.5, 2.05], [-3.5, 2.05]]) {
        const v = tmp.set(screenLocal.x + dx, screenLocal.y + dy, screenLocal.z).applyMatrix4(rig.matrixWorld).project(cam);
        const px = (v.x * 0.5 + 0.5) * W, py = (-v.y * 0.5 + 0.5) * H;
        x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
      }
      const r = { x: Math.round(x0), y: Math.round(y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0) };
      const key = `${r.x},${r.y},${r.w},${r.h}`;
      if (key !== rectSent) { rectSent = key; cb.current.onMenuRect(r); }
    }
  };

  let raf = 0;
  let last = 0;
  const frame = (t: number) => {
    const dt = Math.min(0.033, last ? (t - last) / 1000 : 0.016);
    last = t;
    let moving = false;
    for (const sp of Object.values(S)) moving = stepSpring(sp, dt) || moving;
    apply(t);
    if (lastDark < 1) renderer.render(scene, cam);
    const playing = endStart >= 0 && !endedSent;
    raf = moving || playing ? requestAnimationFrame(frame) : 0;
    if (!raf) last = 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  const fit = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    W = w; H = h;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    layout();
    kick();
  };
  fit();
  const ro = new ResizeObserver(fit);
  ro.observe(canvas);

  // ---- scroll: tuck down while moving, come back when it stops, and run the ending through #hi
  let lastY = window.scrollY;
  let away = false;
  const onScroll = () => {
    const y = window.scrollY;
    const down = y > lastY + 1;
    lastY = y;
    void down; // the bar used to tuck down while scrolling; Leo wants it to stay put
    S.rise.to = y < H * 0.8 || away ? 1 : 0; // not in the hero (or the editing app): it comes up after
    kick();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---- input, from the window, so the canvas never blocks the page
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = (e: PointerEvent | MouseEvent) => {
    if (cb.current.inactive || endStart >= 0) return null;
    const r = canvas.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return null;
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    const h = ray.intersectObject(rig, true).find((i) => i.object.visible)?.object;
    if (!h) return null;
    let o: THREE.Object3D | null = h;
    while (o && !o.userData.ctl) o = o.parent;
    return { ctl: (o?.userData.ctl as string | undefined) ?? "body" };
  };

  type Press = { ctl: string; id: number; x0: number; y0: number; a0: number; dragged: boolean };
  let held: Press | null = null;
  let swallowUntil = 0;

  const turnTo = (n: number) => {
    if (n !== turns) detent();
    turns = n;
    S.dial.to = n * QUARTER;
    kick();
    cb.current.onTurn(n);
  };

  const release = (p: Press, over: boolean) => {
    switch (p.ctl) {
      case "dial":
        if (p.dragged) turnTo(Math.round(S.dial.to / QUARTER));
        else if (over) turnTo(turns + 1);
        break;
      case "ev":
        if (over) { evTurns += 1; S.ev.to = (evTurns * Math.PI) / 7; detent(); }
        break;
      case "shutter":
        if (over) {
          S.shutter.to = -0.16;
          shutterSound();
          window.setTimeout(() => { S.shutter.to = 0; kick(); }, 90);
          cb.current.onShutter();
        } else S.shutter.to = 0;
        break;
      case "rec":
        S.rec.to = 0;
        if (over) { recStart(); cb.current.onRec(); }
        break;
      case "menu":
        S.snd.to = 0;
        if (over) { press(); cb.current.onMenu(); }
        break;
      case "home":
        S.home.to = 0;
        if (over) { press(); cb.current.onHome(); }
        break;
      case "lever":
        if (over) { flip(); cb.current.onGraded(!cb.current.graded); }
        break;
      case "log":
      case "graded":
        if (over && cb.current.graded !== (p.ctl === "graded")) { flip(); cb.current.onGraded(p.ctl === "graded"); }
        break;
    }
    kick();
  };

  const onDown = (e: PointerEvent) => {
    if (e.button > 0) return;
    const p = pick(e);
    if (!p) return;
    e.stopPropagation(); // it landed on the camera: keep it from the page underneath
    swallowUntil = performance.now() + 900;
    if (p.ctl === "body") return;
    held = { ctl: p.ctl, id: e.pointerId, x0: e.clientX, y0: e.clientY, a0: S.dial.to, dragged: false };
    if (p.ctl === "shutter") { S.shutter.to = -0.06; halfPress(); }
    if (p.ctl === "rec") S.rec.to = -0.1;
    if (p.ctl === "menu") S.snd.to = -0.09;
    if (p.ctl === "home") S.home.to = -0.09;
    kick();
  };
  const onMove = (e: PointerEvent) => {
    if (held && e.pointerId === held.id) {
      const dx = e.clientX - held.x0, dy = e.clientY - held.y0;
      if (held.ctl === "dial" && (held.dragged || Math.abs(dx) > 6)) {
        held.dragged = true;
        S.dial.to = held.a0 + dx * 0.012;
        S.dial.x = S.dial.to;
        kick();
      } else if (Math.abs(dy) > 12 && held.ctl !== "dial") {
        const p = held; held = null; release(p, false); // a scroll that started on a button
      }
      return;
    }
    if (fine) {
      const p = pick(e);
      canvas.style.pointerEvents = p ? "auto" : "none";
      canvas.style.cursor = p && p.ctl !== "body" ? (p.ctl === "dial" ? "grab" : "pointer") : "default";
    }
  };
  const onUp = (e: PointerEvent) => {
    if (!held || e.pointerId !== held.id) return;
    const p = held;
    held = null;
    release(p, pick(e)?.ctl === p.ctl);
  };
  const onCancel = () => { if (held) { const p = held; held = null; release(p, false); } };
  const onClick = (e: MouseEvent) => {
    if (performance.now() < swallowUntil && pick(e)) { e.stopPropagation(); e.preventDefault(); }
  };
  window.addEventListener("pointerdown", onDown, true);
  window.addEventListener("pointermove", onMove, true);
  window.addEventListener("pointerup", onUp, true);
  window.addEventListener("pointercancel", onCancel, true);
  window.addEventListener("click", onClick, true);

  kick();

  return {
    setAway: (on) => {
      away = on;
      S.rise.to = window.scrollY < H * 0.8 || away ? 1 : 0;
      kick();
    },
    setMenu: (on) => {
      S.menu.to = on ? 1 : 0;
      if (!on && rectSent) { rectSent = ""; cb.current.onMenuRect(null); }
      kick();
    },
    setEnding: (on) => {
      if (on) {
        if (endStart >= 0) return;
        endStart = performance.now();
        endedSent = false;
        S.sink.to = 0;
      } else {
        endStart = -1;
        endedSent = false;
        lastDark = -1;
        S.rise.x = 1; // come back up from below, onto the bar
        S.rise.to = window.scrollY < H * 0.8 || away ? 1 : 0;
      }
      kick();
    },
    setDial: (n) => {
      if (n === turns) return;
      detent();
      turns = n;
      S.dial.to = n * QUARTER;
      kick();
    },
    setLever: (g) => { S.lever.to = g ? LEVER.graded : LEVER.log; kick(); },
    setSound: (on) => { S.led.to = on ? 1 : 0; kick(); },
    setArmed: (on) => { S.tally.to = on ? 1 : 0; kick(); },
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onCancel, true);
      window.removeEventListener("click", onClick, true);
      root.style.removeProperty("--vf-dark");
      scene.traverse((n) => {
        const m = n as THREE.Mesh;
        if (!m.isMesh) return;
        m.geometry.dispose();
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.map?.dispose();
        mat.dispose();
      });
      [bodyBump, gripBump, env].forEach((t) => t.dispose());
      pmrem.dispose();
      renderer.dispose();
    },
  };
}

export default function CameraBody(props: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const api = useRef<Api | null>(null);
  const cb = useRef(props);

  useEffect(() => { cb.current = props; });

  useEffect(() => {
    const a = build(ref.current!, cb);
    if (!a) { cb.current.onFail(); return; }
    api.current = a;
    return () => { a.dispose(); api.current = null; };
  }, []);

  useEffect(() => { api.current?.setDial(props.turns); }, [props.turns]);
  useEffect(() => { api.current?.setLever(props.graded); }, [props.graded]);
  useEffect(() => { api.current?.setSound(props.sound); }, [props.sound]);
  useEffect(() => { api.current?.setArmed(props.armed); }, [props.armed]);
  useEffect(() => { api.current?.setEnding(props.ending); }, [props.ending]);
  useEffect(() => { api.current?.setMenu(props.menu); }, [props.menu]);
  useEffect(() => { api.current?.setAway(!!props.away); }, [props.away]);

  return <canvas ref={ref} className={styles.camera} aria-hidden="true" />;
}
