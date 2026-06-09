import type { Metadata } from "next";
import { Syne, Manrope, Space_Mono, Archivo } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Leonidas Touch · Turning Vision into Gold",
  description:
    "Product engineering studio. We build the digital products that grow ambitious businesses.",
  keywords: ["product engineering", "digital products", "software studio", "consulting", "automation"],
  authors: [{ name: "Leonidas Touch" }],
  openGraph: {
    title: "Leonidas Touch · Turning Vision into Gold",
    description: "Product engineering studio. We build the digital products that grow ambitious businesses.",
    url: "https://nidastouch.com",
    siteName: "Leonidas Touch",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${manrope.variable} ${spaceMono.variable} ${archivo.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
