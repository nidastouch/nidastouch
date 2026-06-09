import type { Metadata } from "next";
import { CartProvider } from "./lib/cart";
import NidasNav from "./components/NidasNav";
import NidasFooter from "./components/NidasFooter";
import Bag from "./components/Bag";

export const metadata: Metadata = {
  title: "Nidas · Washed Athletic Apparel",
  description: "Washed, raw, and built to train in. Heavyweight hoodies and hand treated tees. A Leonidas Touch label.",
  openGraph: {
    title: "Nidas · Washed Athletic Apparel",
    description: "Washed, raw, and built to train in. A Leonidas Touch label.",
    siteName: "Nidas",
    type: "website",
  },
};

export default function NidasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-nidas">
      <CartProvider>
        <NidasNav />
        {children}
        <NidasFooter />
        <Bag />
      </CartProvider>
    </div>
  );
}
