import { Anybody, Martian_Mono, Shantell_Sans, Young_Serif } from "next/font/google";

/*
  Anybody: the voice. Its weight is graded with the page (thin in log, heavy by "final").
  Martian Mono: small print and labels.
  Shantell Sans: a stand-in for Leo's own handwriting, to be replaced by a scan of his notes.
  Young Serif: section headings only, so they never read like the titles of the work.
*/
export const display = Anybody({ subsets: ["latin"], axes: ["wdth"], variable: "--nt-display", display: "swap" });
export const mono = Martian_Mono({ subsets: ["latin"], axes: ["wdth"], variable: "--nt-mono", display: "swap" });
export const hand = Shantell_Sans({ subsets: ["latin"], axes: ["BNCE", "INFM"], variable: "--nt-hand", display: "swap" });
export const serif = Young_Serif({ subsets: ["latin"], weight: "400", variable: "--nt-serif", display: "swap" });
