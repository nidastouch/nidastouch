"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import LionMark from "./LionMark";

const LINKS = [
  { label: "Work", href: "#work", index: "01" },
  { label: "Studio", href: "#studio", index: "02" },
  { label: "Contact", href: "#contact", index: "03" },
];

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 40));

  // Lock body scroll + close on Escape when menu open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    if (open) window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
        className="fixed top-0 inset-x-0 z-40"
      >
        {/* Backdrop appears on scroll */}
        <div
          className="absolute inset-0 transition-all duration-500"
          style={{
            background: scrolled ? "rgba(10,5,6,0.72)" : "transparent",
            backdropFilter: scrolled ? "blur(14px)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(14px)" : "none",
            borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent",
          }}
        />

        <div className="relative wrap flex items-center justify-between h-[4.5rem] pad-x">
          {/* Brand */}
          <button
            onClick={() => go("#top")}
            className="flex items-center gap-3 group"
            aria-label="Leonidas Touch home"
          >
            <span className="transition-transform duration-500 group-hover:rotate-[8deg]">
              <LionMark size={34} variant="solid" glow />
            </span>
            <span className="hidden sm:flex flex-col items-start leading-none">
              <span
                className="font-display font-bold tracking-tight"
                style={{ fontSize: "0.95rem", color: "var(--text)" }}
              >
                Leonidas Touch
              </span>
              <span className="font-mono" style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "var(--text-faint)", marginTop: "2px" }}>
                EST. 2024
              </span>
            </span>
          </button>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-9" aria-label="Primary">
            {LINKS.map((l) => (
              <button
                key={l.label}
                onClick={() => go(l.href)}
                className="group relative flex items-baseline gap-1.5 py-2"
              >
                <span className="font-mono" style={{ fontSize: "0.6rem", color: "var(--gold-deep)" }}>{l.index}</span>
                <span
                  className="font-display font-medium transition-colors duration-300"
                  style={{ fontSize: "0.95rem", color: "var(--text-dim)" }}
                >
                  {l.label}
                </span>
                <span
                  className="absolute left-0 -bottom-0.5 h-px w-0 group-hover:w-full transition-all duration-400"
                  style={{ background: "var(--gold)", transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
                />
              </button>
            ))}
            {/* Quiet sister-brand link → the apparel domain */}
            <a
              href="https://nidastouch.com"
              className="group relative flex items-baseline gap-1.5 py-2"
              aria-label="Nidas apparel"
            >
              <span className="font-mono" style={{ fontSize: "0.6rem", color: "var(--gold-deep)" }}>✦</span>
              <span className="font-display font-medium transition-colors duration-300" style={{ fontSize: "0.95rem", color: "var(--text-dim)" }}>
                Nidas
              </span>
              <span
                className="absolute left-0 -bottom-0.5 h-px w-0 group-hover:w-full transition-all duration-400"
                style={{ background: "var(--gold)", transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
              />
            </a>
            <button onClick={() => go("#contact")} className="btn-gold">
              Hire Me
            </button>
          </nav>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden relative z-50 flex flex-col items-end gap-[5px] w-11 h-11 justify-center"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <motion.span
              animate={{ rotate: open ? 45 : 0, y: open ? 7 : 0, width: open ? 26 : 26 }}
              className="block h-[2px] rounded-full"
              style={{ background: "var(--gold)", width: 26 }}
            />
            <motion.span
              animate={{ opacity: open ? 0 : 1, width: 18 }}
              className="block h-[2px] rounded-full"
              style={{ background: "var(--gold)" }}
            />
            <motion.span
              animate={{ rotate: open ? -45 : 0, y: open ? -7 : 0, width: 26 }}
              className="block h-[2px] rounded-full"
              style={{ background: "var(--gold)" }}
            />
          </button>
        </div>
      </motion.header>

      {/* ── Mobile full-screen kinetic menu ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-40 md:hidden flex flex-col"
            style={{ background: "var(--bg)" }}
            onClick={(e) => { if (!(e.target as HTMLElement).closest("a,button")) setOpen(false); }}
          >
            {/* Giant faint lion watermark */}
            <div className="absolute -right-16 -bottom-10 opacity-[0.05] pointer-events-none">
              <LionMark size={420} variant="stroke" />
            </div>

            <div className="flex-1 flex flex-col justify-center pad-x gap-2">
              {LINKS.map((l, i) => (
                <motion.button
                  key={l.label}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.12 + i * 0.08, duration: 0.6, ease: EASE }}
                  onClick={() => go(l.href)}
                  className="flex items-baseline gap-4 py-3 text-left"
                >
                  <span className="font-mono" style={{ fontSize: "0.8rem", color: "var(--gold-deep)" }}>{l.index}</span>
                  <span className="display" style={{ fontSize: "clamp(2.75rem, 16vw, 4.5rem)", color: "var(--text)" }}>
                    {l.label}
                  </span>
                </motion.button>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.12 + LINKS.length * 0.08, duration: 0.6, ease: EASE }}
              >
                <a href="https://nidastouch.com" onClick={() => setOpen(false)} className="flex items-baseline gap-4 py-3">
                  <span className="font-mono" style={{ fontSize: "0.8rem", color: "var(--gold-deep)" }}>✦</span>
                  <span className="display" style={{ fontSize: "clamp(2.75rem, 16vw, 4.5rem)", color: "var(--gold-200)" }}>
                    Nidas
                  </span>
                </a>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="pad-x pb-12 space-y-6"
            >
              <div className="hairline" />
              <button onClick={() => go("#contact")} className="btn-gold w-full">
                Start a Project
              </button>
              <a
                href="mailto:hello@nidastouch.com"
                className="block font-mono"
                style={{ fontSize: "0.8rem", color: "var(--text-dim)", letterSpacing: "0.08em" }}
              >
                hello@nidastouch.com
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
