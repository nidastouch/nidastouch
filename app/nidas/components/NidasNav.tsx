"use client";

import Link from "next/link";
import { useCart } from "../lib/cart";
import LionMark from "../../components/LionMark";

export default function NidasNav() {
  const { count, setOpen } = useCart();

  return (
    <header
      className="sticky top-0 z-30"
      style={{ background: "rgba(228,222,209,0.82)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line-n)" }}
    >
      <div className="flex items-center justify-between px-[var(--gutter)] h-16 max-w-[88rem] mx-auto">
        {/* Back to the studio site (other domain) */}
        <a
          href="https://leonidastouch.com"
          className="n-label hidden sm:flex items-center gap-2 transition-colors"
          style={{ color: "var(--faded)" }}
        >
          <span aria-hidden="true">←</span> Leonidas Touch
        </a>

        {/* Wordmark center */}
        <Link href="/nidas" className="flex items-center gap-2.5 sm:absolute sm:left-1/2 sm:-translate-x-1/2" aria-label="nidas home">
          <span style={{ filter: "grayscale(1) brightness(0.35)" }}>
            <LionMark size={34} variant="solid" />
          </span>
          <span className="n-display" style={{ fontSize: "1.5rem", color: "var(--ink)", letterSpacing: "0.01em" }}>
            nidas
          </span>
        </Link>

        {/* Bag */}
        <button
          onClick={() => setOpen(true)}
          className="n-label flex items-center gap-2"
          style={{ color: "var(--ink)" }}
          aria-label={`Open bag, ${count} items`}
        >
          Bag
          <span
            className="inline-flex items-center justify-center rounded-full"
            style={{
              minWidth: "1.4rem", height: "1.4rem", padding: "0 0.35rem",
              background: count > 0 ? "var(--ink)" : "transparent",
              color: count > 0 ? "var(--bone)" : "var(--faded)",
              border: count > 0 ? "none" : "1px solid var(--line-n)",
              fontSize: "0.66rem",
            }}
          >
            {count}
          </span>
        </button>
      </div>
    </header>
  );
}
