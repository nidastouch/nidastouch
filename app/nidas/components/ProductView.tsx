"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "../lib/catalog";
import { formatPrice } from "../lib/catalog";
import { useCart } from "../lib/cart";
import GarmentVisual from "./GarmentVisual";
import Waitlist from "./Waitlist";

export default function ProductView({ product }: { product: Product }) {
  const { add } = useCart();
  const [size, setSize] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  const addToBag = () => {
    if (!size) { setErr(true); return; }
    add({ slug: product.slug, name: product.name, size, price: product.price, tone: product.tone });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
      {/* Visual */}
      <div className="aspect-[4/5] lg:sticky lg:top-24" style={{ background: "var(--bone-2)", border: "1px solid var(--line-n)" }}>
        <GarmentVisual product={product} large />
      </div>

      {/* Detail */}
      <div className="pt-2">
        <span className="n-label">{product.subtitle}</span>
        <h1 className="n-display mt-4" style={{ fontSize: "clamp(2.4rem, 6vw, 3.6rem)", color: "var(--ink)" }}>
          {product.name}
        </h1>
        <p className="n-price mt-4" style={{ fontSize: "1.25rem", color: "var(--ink)" }}>{formatPrice(product.price)}</p>

        <p className="mt-7 max-w-[46ch]" style={{ color: "var(--ink-soft)", fontSize: "1rem", lineHeight: 1.7 }}>
          {product.description}
        </p>

        {product.available ? (
          <>
            {/* Size selector */}
            <div className="mt-9">
              <div className="flex items-center justify-between mb-3">
                <span className="n-label" style={{ color: "var(--ink)" }}>Select Size</span>
                <a href="/nidas/size-guide" className="n-label" style={{ color: "var(--faded)", textDecoration: "underline", textUnderlineOffset: "3px" }}>Size Guide</a>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSize(s); setErr(false); }}
                    className="n-price flex items-center justify-center transition-all"
                    style={{
                      minWidth: "3.2rem", height: "3.2rem", fontSize: "0.85rem",
                      border: `1px solid ${size === s ? "var(--ink)" : "var(--line-n)"}`,
                      background: size === s ? "var(--ink)" : "transparent",
                      color: size === s ? "var(--bone)" : "var(--ink)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <AnimatePresence>
                {err && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="n-label mt-3" style={{ color: "#9a3a2a" }}>
                    Please select a size
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <button onClick={addToBag} className="n-btn w-full mt-8">Add to Bag</button>
          </>
        ) : (
          <div className="mt-9">
            <p className="n-label mb-4" style={{ color: "var(--ink)" }}>This piece is dropping soon</p>
            <Waitlist product={product.name} />
          </div>
        )}

        {/* Details */}
        <ul className="mt-10 flex flex-col gap-2.5" style={{ borderTop: "1px solid var(--line-n)", paddingTop: "1.5rem" }}>
          {product.details.map((d) => (
            <li key={d} className="flex gap-3" style={{ color: "var(--ink-soft)", fontSize: "0.92rem" }}>
              <span style={{ color: "var(--whisper)" }} aria-hidden="true">✦</span>
              {d}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
