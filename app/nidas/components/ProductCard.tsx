"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "../lib/catalog";
import { formatPrice } from "../lib/catalog";
import GarmentVisual from "./GarmentVisual";

export default function ProductCard({ product, index }: { product: Product; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/nidas/product/${product.slug}`} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden" style={{ background: "var(--bone-2)", border: "1px solid var(--line-n)" }}>
          <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.03]">
            <GarmentVisual product={product} />
          </div>
          {product.badge && (
            <span
              className="absolute top-3 left-3 n-label"
              style={{ background: "var(--ink)", color: "var(--bone)", padding: "0.3rem 0.6rem", letterSpacing: "0.2em" }}
            >
              {product.badge}
            </span>
          )}
          {!product.available && (
            <span
              className="absolute top-3 right-3 n-label"
              style={{ color: "var(--ink)", background: "var(--bone)", padding: "0.3rem 0.6rem", border: "1px solid var(--line-n)" }}
            >
              Waitlist
            </span>
          )}
        </div>

        <div className="flex items-start justify-between mt-4 gap-3">
          <div>
            <h3 className="n-display" style={{ fontSize: "1.05rem", color: "var(--ink)" }}>{product.name}</h3>
            <span className="n-label block mt-1.5" style={{ color: "var(--faded)" }}>{product.subtitle}</span>
          </div>
          <span className="n-price" style={{ fontSize: "0.95rem", color: "var(--ink)" }}>{formatPrice(product.price)}</span>
        </div>
      </Link>
    </motion.div>
  );
}
