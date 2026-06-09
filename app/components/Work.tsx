"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Reveal, EASE } from "./motion";

interface Project {
  index: string;
  title: string;
  blurb: string;
  role: string;
  year: string;
  href?: string;
  tint: string;
  status: "Live" | "In Progress";
}

const PROJECTS: Project[] = [
  {
    index: "01",
    title: "Berry Bank",
    blurb:
      "Latin America's first green digital bank. Impact tracking, local rewards, and seamless payments in a refined cross platform app.",
    role: "Fintech",
    year: "2024",
    href: "https://berrybank.app",
    tint: "46,80,22",
    status: "Live",
  },
  {
    index: "02",
    title: "Trust Ledger",
    blurb:
      "On demand mobile notary, booked and tracked in real time. Title companies follow every closing from dispatch to signature.",
    role: "Legal Tech",
    year: "2025",
    tint: "168,123,46",
    status: "In Progress",
  },
  {
    index: "03",
    title: "Athloex",
    blurb:
      "A triathlon media brand built on a content engine. Automated production and publishing that grows the audience on autopilot.",
    role: "Media & Automation",
    year: "2025",
    tint: "107,24,37",
    status: "In Progress",
  },
];

function TiltCard({ p, featured }: { p: Project; featured?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useSpring(useTransform(py, [-0.5, 0.5], [5, -5]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(px, [-0.5, 0.5], [-6, 6]), { stiffness: 150, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const reset = () => { px.set(0); py.set(0); setHover(false); };

  const Inner = (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1200 }}
      className="group relative h-full rounded-2xl p-7 md:p-9 overflow-hidden"
    >
      <div
        className="absolute inset-0 rounded-2xl transition-colors duration-500"
        style={{
          background: hover ? `linear-gradient(150deg, rgba(${p.tint},0.20), rgba(20,8,11,0.6))` : "rgba(255,255,255,0.022)",
          border: `1px solid ${hover ? "rgba(212,175,55,0.34)" : "var(--line)"}`,
        }}
      />
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(40% 50% at 70% 0%, rgba(${p.tint},0.35), transparent 70%)` }}
      />

      <div className="relative flex flex-col h-full">
        <div className="flex items-center justify-between mb-7">
          <span className="font-mono" style={{ fontSize: "0.7rem", letterSpacing: "0.2em", color: "var(--gold)" }}>
            {p.index}
          </span>
          <span
            className="font-mono inline-flex items-center gap-2"
            style={{ fontSize: "0.6rem", letterSpacing: "0.16em", color: p.status === "Live" ? "var(--gold-light)" : "var(--text-faint)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.status === "Live" ? "#7CCF6A" : "var(--text-faint)" }} />
            {p.status.toUpperCase()}
          </span>
        </div>

        <h3 className="h3 mb-4" style={{ color: "var(--text)", fontSize: featured ? "clamp(2rem,4vw,3rem)" : undefined }}>
          {p.title}
        </h3>

        <p style={{ color: "var(--text-dim)", fontSize: "var(--fs-small)", lineHeight: 1.65, maxWidth: "44ch" }} className="mb-8">
          {p.blurb}
        </p>

        <div className="mt-auto flex items-center justify-between pt-5" style={{ borderTop: "1px solid var(--line-soft)" }}>
          <span className="font-mono" style={{ fontSize: "0.66rem", letterSpacing: "0.12em", color: "var(--text-faint)" }}>
            {p.role} · {p.year}
          </span>
          {p.href && (
            <span
              className="font-mono inline-flex items-center gap-1.5 transition-colors duration-300"
              style={{ fontSize: "0.66rem", letterSpacing: "0.14em", color: hover ? "var(--gold-light)" : "var(--gold)" }}
            >
              VISIT <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );

  return p.href ? (
    <a href={p.href} target="_blank" rel="noopener noreferrer" className="block h-full">{Inner}</a>
  ) : Inner;
}

export default function Work() {
  return (
    <section id="work" className="section relative">
      <div className="wrap">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-20">
          <div>
            <Reveal><span className="eyebrow">Selected Work</span></Reveal>
            <Reveal delay={0.08}>
              <h2 className="h2 mt-5" style={{ color: "var(--text)" }}>
                Proof, not<br /><span className="text-gold">promises.</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.16}>
            <p className="lead max-w-[34ch]">
              Products we engineer end to end for businesses ready to grow.
            </p>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.9, ease: EASE }}
            className="md:col-span-2"
          >
            <TiltCard p={PROJECTS[0]} featured />
          </motion.div>

          {PROJECTS.slice(1).map((p, i) => (
            <motion.div
              key={p.index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.9, delay: i * 0.1, ease: EASE }}
            >
              <TiltCard p={p} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
