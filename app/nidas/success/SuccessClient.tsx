"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "../lib/cart";

export default function SuccessClient() {
  const { clear } = useCart();
  useEffect(() => { clear(); }, [clear]);

  return (
    <section className="px-[var(--gutter)] min-h-[70vh] flex items-center">
      <div className="max-w-[44rem] mx-auto text-center">
        <span className="n-label">Order Confirmed</span>
        <h1 className="n-display mt-6" style={{ fontSize: "clamp(2.4rem,7vw,4.5rem)", color: "var(--ink)" }}>
          Thank you.
        </h1>
        <p className="mt-6 max-w-[42ch] mx-auto" style={{ color: "var(--ink-soft)", fontSize: "1.05rem", lineHeight: 1.6 }}>
          Your order is in. A confirmation is on its way to your inbox, and your pieces
          will ship shortly. Welcome to Nidas.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link href="/nidas" className="n-btn">Keep Shopping</Link>
          <Link href="/" className="n-btn-ghost">Leonidas Touch</Link>
        </div>
      </div>
    </section>
  );
}
