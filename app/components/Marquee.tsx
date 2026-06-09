"use client";

import { motion } from "framer-motion";

const ITEMS = ["Build", "Scale", "Secure", "Automate", "Launch", "Grow"];

function Row() {
  return (
    <motion.div
      className="flex shrink-0 items-center gap-10 pr-10"
      initial={{ x: "0%" }}
      animate={{ x: "-50%" }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
    >
      {[...ITEMS, ...ITEMS].map((item, i) => (
        <span key={i} className="flex items-center gap-10 shrink-0">
          <span
            className="font-display font-semibold whitespace-nowrap"
            style={{ fontSize: "clamp(1.6rem, 4vw, 3rem)", color: "var(--text-dim)" }}
          >
            {item}
          </span>
          <span style={{ color: "var(--gold)", fontSize: "1.1rem" }} aria-hidden="true">✦</span>
        </span>
      ))}
    </motion.div>
  );
}

export default function Marquee() {
  return (
    <section aria-hidden="true" className="relative overflow-hidden py-10">
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(90deg, var(--bg), transparent)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(-90deg, var(--bg), transparent)" }} />
      <div className="flex w-max">
        <Row />
        <Row />
      </div>
    </section>
  );
}
