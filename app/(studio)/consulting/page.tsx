import type { Metadata } from "next";
import ServicePage from "../ServicePage";

export const metadata: Metadata = {
  title: "tech and ai consulting · leonidas touch llc",
};

export default function Consulting() {
  return (
    <ServicePage
      title="tech and ai consulting"
      lede="websites, small automations and ai tools for small businesses, from the same people who run the studio. we built this site."
      blocks={[
        { head: "websites", body: "a site you can update yourself, that loads fast on a phone." },
        { head: "automations", body: "the repetitive parts of running a business, like invoices, follow ups and booking, set up to run on their own." },
        { head: "ai tools", body: "assistants and workflows set up around how your business already works, with someone to call when they need a tweak." },
      ]}
      ask={{ subject: "consulting", line: "tell us what's eating your week at" }}
    />
  );
}
