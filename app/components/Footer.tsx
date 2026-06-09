"use client";

import LionMark from "./LionMark";

const COLS = [
  {
    head: "Navigate",
    links: [
      { label: "Work", href: "#work" },
      { label: "Studio", href: "#studio" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    head: "Capabilities",
    links: [
      { label: "Interfaces", href: "#studio" },
      { label: "Architecture", href: "#studio" },
      { label: "Automation", href: "#studio" },
      { label: "Digital Trust", href: "#studio" },
    ],
  },
  {
    head: "Elsewhere",
    links: [
      { label: "Instagram", href: "https://www.instagram.com/leonidastouch/" },
      { label: "Nidas", href: "https://nidastouch.com" },
    ],
  },
];

export default function Footer() {
  const go = (href: string) => {
    if (href.startsWith("#")) document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="relative pt-20 pb-10 pad-x" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="wrap">
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-12 md:gap-8 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <LionMark size={40} variant="solid" glow />
              <span className="font-display font-bold" style={{ fontSize: "1.15rem", color: "var(--text)" }}>
                Leonidas Touch
              </span>
            </div>
            <p className="max-w-[32ch]" style={{ color: "var(--text-dim)", fontSize: "var(--fs-small)", lineHeight: 1.6 }}>
              Product engineering studio. Turning vision into gold.
            </p>
            <a
              href="https://nidastouch.com"
              className="inline-flex items-center gap-2 mt-5 transition-colors duration-300"
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-faint)" }}
            >
              <span style={{ color: "var(--gold)" }}>✦</span> Nidas / Apparel
              <span aria-hidden="true">→</span>
            </a>
          </div>

          {COLS.map((col) => (
            <nav key={col.head} aria-label={col.head}>
              <h3 className="eyebrow mb-5" style={{ color: "var(--text-faint)" }}>{col.head}</h3>
              <ul className="flex flex-col gap-3.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      onClick={(e) => { if (l.href.startsWith("#")) { e.preventDefault(); go(l.href); } }}
                      className="transition-colors duration-300"
                      style={{ color: "var(--text-dim)", fontSize: "0.95rem" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold-light)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-dim)")}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Big wordmark */}
        <div className="relative mb-8 flex justify-center">
          <span
            className="font-display font-bold block select-none text-center"
            style={{
              fontSize: "clamp(5rem, 26vw, 22rem)",
              lineHeight: 0.8,
              letterSpacing: "-0.04em",
              color: "transparent",
              WebkitTextStroke: "1px rgba(212,175,55,0.18)",
            }}
            aria-hidden="true"
          >
            Nidas.
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8" style={{ borderTop: "1px solid var(--line)" }}>
          <p className="font-mono" style={{ fontSize: "0.66rem", letterSpacing: "0.1em", color: "var(--text-faint)" }}>
            © {new Date().getFullYear()} LEONIDAS TOUCH. ALL RIGHTS RESERVED.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="font-mono inline-flex items-center gap-2 transition-colors duration-300"
            style={{ fontSize: "0.66rem", letterSpacing: "0.12em", color: "var(--text-faint)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
          >
            BACK TO TOP <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
