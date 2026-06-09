import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping & Returns · nidas",
};

const BLOCKS = [
  {
    head: "Shipping",
    body: "Orders ship within 2 to 4 business days. You will receive tracking by email once your order is on its way. Shipping is calculated at checkout.",
  },
  {
    head: "Returns",
    body: "Unworn pieces can be returned within 14 days of delivery for a refund or exchange. Hand treated and final sale pieces are noted on the product page.",
  },
  {
    head: "Care",
    body: "Wash cold, inside out. Hang dry to keep the wash and the fit. The garment softens with wear.",
  },
];

export default function ShippingReturns() {
  return (
    <section className="px-[var(--gutter)] pt-10 pb-28">
      <div className="max-w-[44rem] mx-auto">
        <Link href="/nidas" className="n-label inline-flex items-center gap-2 mb-10" style={{ color: "var(--faded)" }}>
          <span aria-hidden="true">←</span> All Pieces
        </Link>

        <h1 className="n-display" style={{ fontSize: "clamp(2.2rem,6vw,3.6rem)", color: "var(--ink)" }}>shipping &amp; returns</h1>

        <div className="mt-10 flex flex-col">
          {BLOCKS.map((b) => (
            <div key={b.head} className="py-7" style={{ borderTop: "1px solid var(--line-n)" }}>
              <h2 className="n-label mb-3" style={{ color: "var(--ink)" }}>{b.head}</h2>
              <p style={{ color: "var(--ink-soft)", lineHeight: 1.7, maxWidth: "52ch" }}>{b.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-8" style={{ color: "var(--faded)", fontSize: "0.9rem" }}>
          Questions? <a href="mailto:hello@nidastouch.com" style={{ color: "var(--ink)", textDecoration: "underline" }}>hello@nidastouch.com</a>
        </p>
      </div>
    </section>
  );
}
