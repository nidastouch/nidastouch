import { PRODUCTS } from "./lib/catalog";
import ProductCard from "./components/ProductCard";
import Waitlist from "./components/Waitlist";

export default function NidasHome() {
  return (
    <>
      {/* Hero */}
      <section className="px-[var(--gutter)] pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="max-w-[88rem] mx-auto">
          <span className="n-label">First Drop</span>
          <h1
            className="n-display mt-6"
            style={{ fontSize: "clamp(3.2rem, 13vw, 11rem)", color: "var(--ink)", lineHeight: 0.86 }}
          >
            forged for<br />the work.
          </h1>
          <p className="mt-7 max-w-[36ch]" style={{ color: "var(--ink-soft)", fontSize: "1.05rem", lineHeight: 1.6 }}>
            Washed essentials. Small runs.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section id="shop" className="px-[var(--gutter)] pb-24">
        <div className="max-w-[88rem] mx-auto">
          <div className="flex items-end justify-between mb-8">
            <h2 className="n-display" style={{ fontSize: "1.4rem", color: "var(--ink)" }}>the collection</h2>
            <span className="n-label" style={{ color: "var(--faded)" }}>{PRODUCTS.length} Pieces</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
            {PRODUCTS.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist band */}
      <section className="px-[var(--gutter)] py-20" style={{ background: "var(--ink)" }}>
        <div className="max-w-[88rem] mx-auto">
          <h2 className="n-display" style={{ fontSize: "clamp(2rem,5vw,3.2rem)", color: "var(--bone)" }}>
            join the drop.
          </h2>
          <p className="mt-4 mb-8 max-w-[34ch]" style={{ color: "var(--concrete)", fontSize: "1rem", lineHeight: 1.6 }}>
            First access to every release.
          </p>
          <div className="nidas-invert">
            <Waitlist />
          </div>
        </div>
      </section>
    </>
  );
}
