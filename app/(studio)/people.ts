/*
  The people we make things with. Shown as a short strip on the home page and in full on /lab/people.

  Everyone here said yes to being listed. Their own links only. No numbers anywhere (episode counts, views):
  they go stale, and the links say the rest.
*/

export type Person = {
  id: string;
  name: string;
  handle: string;
  what: string;   // who they are, one line
  together: string; // what we do with them
  links: { label: string; href: string }[];
  media?: { src: string; poster: string; w: number; h: number };
};

export const PEOPLE: Person[] = [
  {
    id: "ajar",
    name: "ajar vision",
    handle: "@ajar_vision",
    what: "a painter and collector in san antonio.",
    together: "we film him and his work.",
    links: [
      { label: "ajarvision.com", href: "https://www.ajarvision.com" },
      { label: "instagram @ajar_vision", href: "https://instagram.com/ajar_vision" },
    ],
  },
  {
    id: "leo",
    name: "leo the sea lion",
    handle: "@leothesealion",
    what: "collecting texas, and texas state park reviews.",
    together: "we shoot, cut and grade every one.",
    links: [
      { label: "instagram @leothesealion", href: "https://instagram.com/leothesealion" },
      { label: "leothesealion.com", href: "https://leothesealion.com" },
    ],
  },
];
