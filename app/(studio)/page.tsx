import type { Metadata } from "next";
import { display, hand, mono, serif } from "./fonts";
import Stage from "./touch/Stage";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.leonidastouch.com"),
  title: "nidas touch · video and photo studio in san antonio",
  description:
    "a video and photo studio in san antonio, texas. we light, shoot, edit and grade everything ourselves.",
  openGraph: {
    title: "nidas touch",
    description: "a video and photo studio in san antonio, texas. we light, shoot, edit and grade everything ourselves.",
    url: "https://www.leonidastouch.com",
    siteName: "nidas touch",
    type: "website",
    images: [{ url: "/lab/touch/cypress-desktop-graded.jpg" }],
  },
};

export default function Home() {
  return (
    <div className={`${display.variable} ${mono.variable} ${hand.variable} ${serif.variable}`}>
      <Stage />
    </div>
  );
}
