"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Reveal, EASE } from "./motion";

const CAPABILITIES = [
  { no: "01", title: "Interfaces", desc: "Refined front ends that turn visitors into customers." },
  { no: "02", title: "Architecture", desc: "Systems built to scale and stay secure under pressure." },
  { no: "03", title: "Automation", desc: "Workflows that quietly run the business and remove busywork." },
  { no: "04", title: "Digital Trust", desc: "Verification that makes every record provable." },
];

const STATS = [
  { value: "10+", label: "Years in business" },
  { value: "40+", label: "Products shipped" },
  { value: "100%", label: "Client focused" },
];

function Row({ c, i }: { c: typeof CAPABILITIES[0]; i: number }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay: i * 0.06, ease: EASE }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="grid grid-cols-[2.5rem_1fr] gap-x-5 items-baseline py-7 md:py-8"
      style={{ borderTop: "1px solid var(--line)" }}
    >
      <span className="font-mono" style={{ fontSize: "0.78rem", color: "var(--gold)" }}>{c.no}</span>
      <div>
        <h3
          className="font-display font-bold transition-colors duration-300"
          style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", letterSpacing: "-0.02em", color: hover ? "var(--gold-light)" : "var(--text)" }}
        >
          {c.title}
        </h3>
        <p className="mt-3 max-w-[50ch]" style={{ color: "var(--text-dim)", fontSize: "var(--fs-small)", lineHeight: 1.6 }}>
          {c.desc}
        </p>
      </div>
    </motion.div>
  );
}

export default function Studio() {
  return (
    <section id="studio" className="section relative">
      <div className="wrap">
        <div className="grid md:grid-cols-[1fr_1fr] gap-10 md:gap-16 mb-16 md:mb-24">
          <div>
            <Reveal><span className="eyebrow">The Studio</span></Reveal>
            <Reveal delay={0.08}>
              <h2 className="h2 mt-5" style={{ color: "var(--text)" }}>
                Engineering that<br /><span className="text-gold">grows business.</span>
              </h2>
            </Reveal>
          </div>
          <div className="flex flex-col justify-end">
            <Reveal delay={0.16}>
              <p className="lead">
                Nidas is a product engineering studio. For over a decade we have helped
                businesses launch, scale, and secure the products their growth depends on.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="grid grid-cols-3 gap-4 mt-10">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <div className="font-display font-bold text-gold" style={{ fontSize: "clamp(1.8rem,5vw,2.8rem)", lineHeight: 1 }}>
                      {s.value}
                    </div>
                    <div className="font-mono mt-2" style={{ fontSize: "0.62rem", letterSpacing: "0.1em", color: "var(--text-faint)", textTransform: "uppercase" }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        <div style={{ borderBottom: "1px solid var(--line)" }}>
          {CAPABILITIES.map((c, i) => <Row key={c.no} c={c} i={i} />)}
        </div>
      </div>
    </section>
  );
}
