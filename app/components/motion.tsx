"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ── Reveal: fade + rise when scrolled into view ── */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* ── KineticLine: a single line that clips up into view ── */
const lineVariants: Variants = {
  hidden: { y: "115%" },
  visible: (i: number = 0) => ({
    y: "0%",
    transition: { duration: 1, delay: 0.15 + i * 0.12, ease: EASE },
  }),
};

export function KineticLine({
  children,
  index = 0,
  className,
  load = false,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
  load?: boolean;
}) {
  return (
    <span className="clip-mask">
      <motion.span
        className={className}
        style={{ display: "block" }}
        custom={index}
        variants={lineVariants}
        initial="hidden"
        {...(load
          ? { animate: "visible" }
          : { whileInView: "visible", viewport: { once: true, margin: "-60px" } })}
      >
        {children}
      </motion.span>
    </span>
  );
}

export { EASE };
