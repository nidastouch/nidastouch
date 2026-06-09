"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../lib/cart";
import { formatPrice } from "../lib/catalog";

export default function Bag() {
  const { items, open, setOpen, total, setQty, remove, count } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Checkout is not configured yet.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(33,30,26,0.4)" }}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[26rem] flex flex-col"
            style={{ background: "var(--bone)", borderLeft: "1px solid var(--line-n)" }}
            aria-label="Shopping bag"
          >
            <div className="flex items-center justify-between px-6 h-16" style={{ borderBottom: "1px solid var(--line-n)" }}>
              <span className="n-label" style={{ color: "var(--ink)" }}>Bag · {count}</span>
              <button onClick={() => setOpen(false)} className="n-label" style={{ color: "var(--faded)" }} aria-label="Close bag">Close ✕</button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="n-display" style={{ fontSize: "1.5rem", color: "var(--ink)" }}>Your bag is empty</p>
                <button onClick={() => setOpen(false)} className="n-btn-ghost mt-2">Keep Looking</button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-auto px-6 py-5 flex flex-col gap-5">
                  {items.map((it) => (
                    <div key={it.slug + it.size} className="flex gap-4">
                      <div className="w-16 h-20 shrink-0" style={{ background: it.tone, opacity: 0.85 }} />
                      <div className="flex-1">
                        <div className="flex justify-between gap-3">
                          <span className="n-display" style={{ fontSize: "0.95rem", color: "var(--ink)" }}>{it.name}</span>
                          <span className="n-price" style={{ fontSize: "0.85rem", color: "var(--ink)" }}>{formatPrice(it.price * it.qty)}</span>
                        </div>
                        <span className="n-label block mt-1" style={{ color: "var(--faded)" }}>Size {it.size}</span>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center border" style={{ borderColor: "var(--line-n)" }}>
                            <button onClick={() => setQty(it.slug, it.size, it.qty - 1)} className="px-2.5 py-1" style={{ color: "var(--ink)" }} aria-label="Decrease">−</button>
                            <span className="px-2 n-price" style={{ fontSize: "0.8rem" }}>{it.qty}</span>
                            <button onClick={() => setQty(it.slug, it.size, it.qty + 1)} className="px-2.5 py-1" style={{ color: "var(--ink)" }} aria-label="Increase">+</button>
                          </div>
                          <button onClick={() => remove(it.slug, it.size)} className="n-label" style={{ color: "var(--faded)" }}>Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-6 py-5" style={{ borderTop: "1px solid var(--line-n)" }}>
                  <div className="flex justify-between mb-1">
                    <span className="n-label" style={{ color: "var(--faded)" }}>Subtotal</span>
                    <span className="n-price" style={{ fontSize: "1rem", color: "var(--ink)" }}>{formatPrice(total)}</span>
                  </div>
                  <p className="n-label mb-4" style={{ color: "var(--faded)", letterSpacing: "0.1em" }}>
                    Shipping and tax calculated at checkout
                  </p>
                  {error && (
                    <p className="mb-3" style={{ fontSize: "0.8rem", color: "#9a3a2a" }}>{error}</p>
                  )}
                  <button onClick={checkout} disabled={loading} className="n-btn w-full">
                    {loading ? "Redirecting…" : "Checkout"}
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
