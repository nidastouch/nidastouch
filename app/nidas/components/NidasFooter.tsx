import Link from "next/link";
import LionMark from "../../components/LionMark";

export default function NidasFooter() {
  return (
    <footer className="px-[var(--gutter)] pt-20 pb-10" style={{ borderTop: "1px solid var(--line-n)" }}>
      <div className="max-w-[88rem] mx-auto">
        <div className="grid md:grid-cols-[1.5fr_1fr_1fr] gap-10 mb-16">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span style={{ filter: "grayscale(1) brightness(0.35)" }}><LionMark size={30} variant="solid" /></span>
              <span className="n-display" style={{ fontSize: "1.5rem", color: "var(--ink)" }}>nidas</span>
            </div>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.92rem", maxWidth: "30ch", lineHeight: 1.6 }}>
              A Leonidas Touch label.
            </p>
          </div>

          <nav aria-label="Shop">
            <h3 className="n-label mb-4">Shop</h3>
            <ul className="flex flex-col gap-3">
              <li><Link href="/nidas" style={{ color: "var(--ink-soft)", fontSize: "0.95rem" }}>All Pieces</Link></li>
              <li><Link href="/nidas/size-guide" style={{ color: "var(--ink-soft)", fontSize: "0.95rem" }}>Size Guide</Link></li>
              <li><Link href="/nidas/shipping-returns" style={{ color: "var(--ink-soft)", fontSize: "0.95rem" }}>Shipping & Returns</Link></li>
            </ul>
          </nav>

          <nav aria-label="More">
            <h3 className="n-label mb-4">More</h3>
            <ul className="flex flex-col gap-3">
              <li><a href="https://leonidastouch.com" style={{ color: "var(--ink-soft)", fontSize: "0.95rem" }}>Leonidas Touch</a></li>
              <li><a href="https://www.instagram.com/leonidastouch/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--ink-soft)", fontSize: "0.95rem" }}>Instagram</a></li>
              <li><a href="mailto:hello@nidastouch.com" style={{ color: "var(--ink-soft)", fontSize: "0.95rem" }}>Contact</a></li>
            </ul>
          </nav>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-8" style={{ borderTop: "1px solid var(--line-n)" }}>
          <span className="n-label" style={{ color: "var(--faded)" }}>© {new Date().getFullYear()} nidas</span>
          <a href="https://www.instagram.com/leonidastouch/" target="_blank" rel="noopener noreferrer" className="n-label" style={{ color: "var(--faded)" }}>Instagram</a>
        </div>
      </div>
    </footer>
  );
}
