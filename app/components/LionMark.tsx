import { LION_PATHS } from "../lib/lionPaths";

/**
 * The actual Leonidas lion mark — crisp SVG, gold-gradient filled.
 * `variant`:
 *   - "solid": filled gold lion (recognizable, used in nav + footer)
 *   - "stroke": gold line-art (used large in hero for an etched feel)
 */
export default function LionMark({
  size = 40,
  variant = "solid",
  className,
  title = "Leonidas Touch",
  glow = false,
}: {
  size?: number;
  variant?: "solid" | "stroke";
  className?: string;
  title?: string;
  glow?: boolean;
}) {
  const gid = `lion-grad-${variant}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1080 1080"
      className={className}
      role="img"
      aria-label={title}
      style={glow ? { filter: "drop-shadow(0 0 18px rgba(212,175,55,0.35))" } : undefined}
    >
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A87B2E" />
          <stop offset="42%" stopColor="#D4AF37" />
          <stop offset="62%" stopColor="#F4E6A8" />
          <stop offset="100%" stopColor="#BF953F" />
        </linearGradient>
      </defs>
      <g
        fill={variant === "solid" ? `url(#${gid})` : "none"}
        stroke={variant === "stroke" ? `url(#${gid})` : "none"}
        strokeWidth={variant === "stroke" ? 4 : 0}
      >
        {LION_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
