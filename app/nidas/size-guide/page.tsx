import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Size Guide · nidas",
};

const ROWS = [
  { size: "S", chest: "20", length: "27" },
  { size: "M", chest: "21.5", length: "28" },
  { size: "L", chest: "23", length: "29" },
  { size: "XL", chest: "24.5", length: "30" },
  { size: "XXL", chest: "26", length: "31" },
];

export default function SizeGuide() {
  return (
    <section className="px-[var(--gutter)] pt-10 pb-28">
      <div className="max-w-[44rem] mx-auto">
        <Link href="/nidas" className="n-label inline-flex items-center gap-2 mb-10" style={{ color: "var(--faded)" }}>
          <span aria-hidden="true">←</span> All Pieces
        </Link>

        <h1 className="n-display" style={{ fontSize: "clamp(2.4rem,7vw,4rem)", color: "var(--ink)" }}>size guide</h1>
        <p className="mt-5 max-w-[40ch]" style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
          Measurements in inches, garment laid flat. Our fits run relaxed. Between sizes, size down for a cleaner cut.
        </p>

        <div className="mt-10" style={{ borderTop: "1px solid var(--line-n)" }}>
          <div className="grid grid-cols-3 py-4" style={{ borderBottom: "1px solid var(--line-n)" }}>
            <span className="n-label" style={{ color: "var(--ink)" }}>Size</span>
            <span className="n-label" style={{ color: "var(--ink)" }}>Chest</span>
            <span className="n-label" style={{ color: "var(--ink)" }}>Length</span>
          </div>
          {ROWS.map((r) => (
            <div key={r.size} className="grid grid-cols-3 py-4" style={{ borderBottom: "1px solid var(--line-n)" }}>
              <span className="n-price" style={{ color: "var(--ink)" }}>{r.size}</span>
              <span className="n-price" style={{ color: "var(--ink-soft)" }}>{r.chest}&quot;</span>
              <span className="n-price" style={{ color: "var(--ink-soft)" }}>{r.length}&quot;</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
