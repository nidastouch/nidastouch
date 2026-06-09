export interface Product {
  slug: string;
  name: string;
  subtitle: string;
  price: number;            // USD, whole dollars
  sizes: string[];
  colorName: string;
  tone: string;             // hex used for the washed visual
  wash: "acid" | "stone" | "heavy" | "raw";
  description: string;
  details: string[];
  available: boolean;       // false => waitlist only
  badge?: string;
  image?: string;           // /nidas/xxx.png once real photos exist; falls back to generated visual
}

export const PRODUCTS: Product[] = [
  {
    slug: "heavyweight-hoodie",
    name: "Heavyweight Hoodie",
    subtitle: "Stonewashed · Faded Black",
    price: 128,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colorName: "Faded Black",
    tone: "#2A2622",
    wash: "heavy",
    description:
      "Heavyweight loopback cotton, garment washed. Boxy fit. A small tonal lion embroidered at the chest.",
    details: [
      "480gsm loopback cotton",
      "Garment washed",
      "Small embroidered lion",
    ],
    available: true,
    badge: "Core",
    image: "/nidas/heavyweight-hoodie.png",
  },
  {
    slug: "acid-wash-tee",
    name: "Acid Wash Tee",
    subtitle: "Hand Treated · Storm",
    price: 68,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colorName: "Storm",
    tone: "#5A5750",
    wash: "acid",
    description:
      "Hand treated acid wash, so no two are the same. Heavyweight cotton. Lion at the inner tag only.",
    details: [
      "240gsm combed cotton",
      "Hand applied acid wash",
      "No outer branding",
    ],
    available: true,
    image: "/nidas/acid-wash-tee.png",
  },
  {
    slug: "stonewash-tee",
    name: "Stonewash Tee",
    subtitle: "Pigment Dyed · Bone",
    price: 62,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colorName: "Bone",
    tone: "#C9C1B1",
    wash: "stone",
    description:
      "Pigment dyed and stone washed to a faded tone. Weight and drape. Quiet by design.",
    details: [
      "240gsm pigment dyed cotton",
      "Stone washed",
      "Lion at the inner tag only",
    ],
    available: true,
    image: "/nidas/stonewash-tee.png",
  },
  {
    slug: "washed-crewneck",
    name: "Washed Crewneck",
    subtitle: "Loopback · Clay",
    price: 98,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colorName: "Clay",
    tone: "#7A6253",
    wash: "raw",
    description:
      "Midweight loopback crewneck, raw washed. Structured enough to layer.",
    details: [
      "380gsm loopback cotton",
      "Raw washed",
      "Small embroidered lion",
    ],
    available: false,
    badge: "Dropping Soon",
    image: "/nidas/washed-crewneck.png",
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function formatPrice(n: number): string {
  return `$${n.toFixed(0)}`;
}
