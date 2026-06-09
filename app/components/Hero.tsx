"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import LionMark from "./LionMark";
import { KineticLine, EASE } from "./motion";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const lionY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const lionScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const go = (href: string) => document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="top" ref={ref} className="relative min-h-[100svh] flex items-center overflow-hidden">
      {/* Crisp lion, etched, parallaxing */}
      <motion.div
        style={{ y: lionY, scale: lionScale, opacity: fade }}
        className="absolute right-[-6%] top-1/2 -translate-y-1/2 pointer-events-none hidden sm:block"
        aria-hidden="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -4 }}
          animate={{ opacity: 0.85, scale: 1, rotate: 0 }}
          transition={{ duration: 1.6, delay: 0.3, ease: EASE }}
        >
          <LionMark size={620} variant="stroke" glow className="w-[clamp(22rem,46vw,46rem)] h-auto" />
        </motion.div>
      </motion.div>

      {/* Mobile lion behind text */}
      <motion.div
        style={{ opacity: fade }}
        className="absolute right-[-22%] top-[12%] pointer-events-none sm:hidden"
        aria-hidden="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 0.45, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.3, ease: EASE }}
        >
          <LionMark size={360} variant="stroke" />
        </motion.div>
      </motion.div>

      <motion.div style={{ y: contentY }} className="relative wrap pad-x pt-28 pb-24 w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="flex items-center gap-3 mb-7"
        >
          <span className="block w-8 h-px" style={{ background: "var(--gold)" }} />
          <span className="eyebrow">Product Engineering Studio</span>
        </motion.div>

        <h1 className="display max-w-[16ch]" aria-label="Turning vision into gold">
          <KineticLine load index={0}><span style={{ color: "var(--text)" }}>Turning</span></KineticLine>
          <KineticLine load index={1}><span className="text-gold">vision</span></KineticLine>
          <KineticLine load index={2}><span style={{ color: "var(--text)" }}>into gold.</span></KineticLine>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.9, ease: EASE }}
          className="lead mt-8 max-w-[40ch]"
        >
          We build the digital products that grow ambitious businesses.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.9, ease: EASE }}
          className="mt-11 flex flex-wrap items-center gap-5"
        >
          <button onClick={() => go("#work")} className="btn-gold">View Work</button>
          <button onClick={() => go("#contact")} className="btn-ghost">
            Start a Project <span aria-hidden="true">→</span>
          </button>
        </motion.div>
      </motion.div>

      {/* Scroll tick, centered, no label */}
      <motion.div style={{ opacity: fade }} className="absolute bottom-8 inset-x-0 flex justify-center">
        <motion.span
          animate={{ y: [0, 9, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="block w-px h-10"
          style={{ background: "linear-gradient(var(--gold), transparent)" }}
          aria-hidden="true"
        />
      </motion.div>
    </section>
  );
}
