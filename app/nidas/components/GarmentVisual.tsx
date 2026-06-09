import type { Product } from "../lib/catalog";

/**
 * Placeholder garment render (flat-lay silhouette) until real product photos.
 * No people, ever. SVG silhouette tinted to the product tone with an
 * acid/stone wash texture overlay and a tonal lion embossed at the chest.
 */

function shapeFor(slug: string): "hoodie" | "crew" | "tee" {
  if (slug.includes("hoodie")) return "hoodie";
  if (slug.includes("crew")) return "crew";
  return "tee";
}

const TEE_PATH =
  "M150 62 C150 62 174 46 200 46 C226 46 250 62 250 62 L304 82 L356 146 L318 192 L292 168 L292 440 L108 440 L108 168 L82 192 L44 146 L96 82 Z";

const CREW_PATH =
  "M150 62 C150 62 174 46 200 46 C226 46 250 62 250 62 L300 78 L344 250 L300 268 L292 232 L292 440 L108 440 L108 232 L100 268 L56 250 L100 78 Z";

const HOODIE_PATH =
  "M142 96 C142 60 174 44 200 44 C226 44 258 60 258 96 L308 80 L360 150 L320 196 L294 172 L294 444 L106 444 L106 172 L80 196 L40 150 L92 80 Z";

export default function GarmentVisual({ product, large = false }: { product: Product; large?: boolean }) {
  // Real photo takes over once provided (flat-lay, no people).
  if (product.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.image}
        alt={`${product.name}, ${product.colorName}`}
        className="w-full h-full object-cover"
      />
    );
  }

  const kind = shapeFor(product.slug);
  const path = kind === "hoodie" ? HOODIE_PATH : kind === "crew" ? CREW_PATH : TEE_PATH;
  const fid = `wash-${product.slug}`;
  const gid = `grad-${product.slug}`;
  const lid = `lion-${product.slug}`;

  // washed lightness based on tone
  return (
    <div
      className="relative w-full h-full flex items-center justify-center"
      style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.35), rgba(154,145,131,0.12))" }}
    >
      <svg viewBox="0 0 400 480" className="w-[78%] h-[78%]" role="img" aria-label={`${product.name}, ${product.colorName}`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor={product.tone} stopOpacity="0.96" />
            <stop offset="55%" stopColor={product.tone} stopOpacity="0.86" />
            <stop offset="100%" stopColor={product.tone} stopOpacity="0.98" />
          </linearGradient>
          <filter id={fid}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency={product.wash === "acid" ? "0.012 0.045" : product.wash === "stone" ? "0.03 0.03" : "0.02 0.02"}
              numOctaves="3"
              result="noise"
            />
            <feColorMatrix in="noise" type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope={product.wash === "acid" ? "0.5" : "0.28"} intercept="0" />
            </feComponentTransfer>
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend in2="SourceGraphic" mode="screen" />
          </filter>
          <clipPath id={`clip-${product.slug}`}>
            <path d={path} />
          </clipPath>
        </defs>

        {/* drop shadow for lift */}
        <path d={path} fill="rgba(33,30,26,0.18)" transform="translate(6 10)" />

        {/* garment body */}
        <path d={path} fill={`url(#${gid})`} />

        {/* wash texture clipped to garment */}
        <g clipPath={`url(#clip-${product.slug})`}>
          <rect x="0" y="0" width="400" height="480" fill="#ffffff" opacity="0.5" filter={`url(#${fid})`} />
          {/* seam lines */}
          <path d={path} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" />
        </g>

        {/* tonal embossed lion at chest */}
        <g clipPath={`url(#clip-${product.slug})`} opacity="0.16">
          <g transform="translate(168 150) scale(0.06)">
            <LionPaths fill="#000" idSuffix={lid} />
          </g>
        </g>

        {/* collar accent */}
        {kind !== "hoodie" && (
          <path d="M168 60 Q200 92 232 60" fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="3" />
        )}
        {kind === "hoodie" && (
          <>
            <path d="M150 70 Q200 140 250 70" fill="rgba(0,0,0,0.14)" />
            <rect x="150" y="300" width="100" height="86" rx="6" fill="rgba(0,0,0,0.10)" />
          </>
        )}
      </svg>

      {/* corner wash label */}
      <span
        className="absolute bottom-4 left-4 n-label"
        style={{ fontSize: large ? "0.62rem" : "0.55rem", color: "var(--ink-soft)" }}
      >
        {product.wash === "acid" ? "ACID WASH" : product.wash === "stone" ? "STONE WASH" : product.wash === "heavy" ? "HEAVYWEIGHT" : "RAW WASH"}
      </span>
    </div>
  );
}

/* Minimal inline lion (subset of the mark) for the chest emboss */
function LionPaths({ fill }: { fill: string; idSuffix: string }) {
  // Reuse the head silhouette path from the brand mark (first path only, scaled)
  return (
    <path
      fill={fill}
      d="M681.34,259.98l1.04-.25c-2.69-22.09-12.53-42.97-27.41-59.33,16.97,5.89,34.05,14.23,48.24,25.32,18.58,14.53,33.81,37.36,35.6,61.43.54,7.3-.68,14.64-.25,21.87,10.34,8.46,21.53,16.03,31.61,24.81,9.56,8.32,15.85,16.31,15.59,29.81-.06,3.18-1.89,9.77-.8,12.35.22.52,1.58,1.61,2.12,2.1,4.01,3.71,9.68,6.69,14.09,10.05,16.67,12.72,62.42,45.97,66.61,65.87.82,3.87-.83,7.42-2.31,10.94-2.05,4.91-6.28,9.28-5.89,14.66.35,4.84,1.87,10.2,2.12,15.28,1.3,25.81-9.25,50.47-22.69,71.78.21,4.32,1.78,8.48,2.47,12.77,6.48,40.24-12.78,66.72-46.43,85.63-5.72,3.21-11.61,6.19-18.05,7.66-.59-.09-2.52-5.02-3.18-6.13-11.13-18.63-34.64-29.06-55.59-31.15,26.41,33.76,30.71,79.52,20.04,120.23,1.41.3.91-.37,1.31-1.04,5.38-8.99,10.22-16.68,13.99-26.63,4.68-12.34,8.21-26.03,7.91-39.3,6.9,5.28,16.77,6.46,25,4.18l7.69-3.38c-3.88,39.1-19.92,76.51-44.32,107.03-20.52,25.67-47.37,47.56-76.98,61.97,12.66-19.17,21.18-40.46,25.15-63.18,2.1-12.01,3.26-25.08,2.8-37.28-.02-.64.4-1.96-.52-1.84-16.66,54.9-54.78,100.83-107.32,124.45-26.28,11.82-61.47,20.71-90.25,19.02-.73-.04-1.15.28-1.77.49-.24-.91.37-1.06.78-1.59,4.95-6.3,11.01-11.43,15.78-18.5,33.65-49.96,18.61-112.51-28.17-147.45l.06-103.46,5.74-.87c5.15,7.88,10.89,15.4,17.14,22.44,22.39,25.22,52.43,46.35,68.92,76.1,15.07,27.19,20.21,59.87,14.68,90.53,1.77-1.82,3.04-4.84,4.14-7.19,22.46-48.28,10.17-92.7-22.09-132.27-12.76-15.65-27.87-29.09-41.39-44.04-2.34-2.58-12.04-13.02-12.39-15.59-.14-1.02.14-.63.67-.9,1.51-.74,3.21-1.09,4.78-2.07,27.66-17.07,38.05-49.48,31.75-80.62-.75-3.68-1.99-9.55-4.5-12.11-.99,20.83-5.81,42.59-19.53,58.78-7.54,8.89-20.52,17.64-31.75,20.98-18.73,5.57-39.11,2.92-58.41,3.55l-.02,150.58c1.8,21.56,4.44,50.06,30.61,54.29-27.09,9.35-56.81-.14-71.94-24.57-6.95-11.22-9.96-23.44-10.88-36.58.95-47.08-1.18-94.31,0-141.38.02-.9.17-1.55.56-2.34-27.38-1.31-65.66-.37-68.82,34.8-6.95-20.41-8.19-43.56,5.55-61.43,11.63-15.13,24.95-20.87,44-21.92l105.23.02c-3.33-10-7.52-19.78-10.4-29.94-8.85-31.34-10.48-63.81-.15-95.03l-14.49,20.57c-14.17,16.36-30.71,30.33-49.49,41.22-27.36,15.87-58.05,21.99-79.73,46.84-2.51,2.87-4.45,6.72-7.37,8.98-2.26-34.29,5.43-68.74,23.24-98.05,15.2-25.01,37.55-44.38,61.22-61.12l20.21-12.74c-85.3,23.4-159.72,79.58-212.26,149.76-.14-11.46-.64-23.07-.29-34.56,2.11-68.9,27.2-126.46,84.55-165.94,34.39-23.68,76.12-36.63,117.45-41.55.12-.75-.93-.77-1.46-.9-1.93-.48-4.76-.88-6.77-1.14-39.65-5.1-76.6.11-112.71,16.88l-19.32,9.94c33.89-45.77,82.15-80.34,138.26-92.97,47.31-10.65,95.68-4.01,140.16,14.16,8.63,3.52,16.96,7.79,25.33,11.84-23.62-27.76-60.14-44.02-95.35-51.51-6.11-1.3-12.14-1.95-18.31-2.79-.79-.11-1.62-.07-1.83-1.06,7.41-1.01,14.67-2.88,22.05-4.06,37.13-5.93,73.96-6.73,110.19,4.44,36.52,11.26,69.31,37.45,87.14,71.33Z"
    />
  );
}
