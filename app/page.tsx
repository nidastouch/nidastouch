import Sparks from "./components/Sparks";
import Nav from "./components/Nav";
import LionMark from "./components/LionMark";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Work from "./components/Work";
import Studio from "./components/Studio";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="theme-studio grain">
      {/* Persistent faint lion watermark — mobile only, stays as you scroll */}
      <div
        className="md:hidden fixed inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        <LionMark size={520} variant="stroke" className="w-[120vw] h-auto opacity-[0.045]" />
      </div>
      <Sparks />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Work />
        <Studio />
        <Contact />
        <Footer />
      </main>
    </div>
  );
}
