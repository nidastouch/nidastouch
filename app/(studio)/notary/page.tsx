import type { Metadata } from "next";
import ServicePage from "../ServicePage";

export const metadata: Metadata = {
  title: "mobile notary · leonidas touch llc",
};

export default function Notary() {
  return (
    <ServicePage
      title="mobile notary"
      lede="we come to you in san antonio and the towns around it, to your house, your office, or wherever the paperwork is."
      blocks={[
        { head: "what we notarize", body: "acknowledgments, jurats and sworn statements, affidavits, powers of attorney, and most everyday documents." },
        { head: "what to bring", body: "the document, unsigned. a current government photo id for everyone signing. any witnesses the document asks for." },
        { head: "fees", body: "texas sets the fee for each notarization. travel is quoted before we head your way." },
        { head: "one thing we can't do", body: "we're notaries, not lawyers, so we can't give legal advice or tell you which form you need." },
      ]}
      ask={{ subject: "notary appointment", line: "to book, send the document type, the address and a time that works to" }}
    />
  );
}
