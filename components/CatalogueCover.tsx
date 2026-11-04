import { coverColor, type CoverStyle } from "@/lib/catalogue";
import { cn } from "@/lib/utils";

/** One tile of each parking-paver pattern (drawn in the accent colour). */
function Pattern({ id, style, stroke }: { id: string; style: CoverStyle; stroke: string }) {
  const common = { fill: "none", stroke, strokeWidth: 1.6 } as const;
  switch (style) {
    case "hexagon":
      return (
        <pattern id={id} width="34.64" height="60" patternUnits="userSpaceOnUse">
          <path d="M17.32 0 34.64 10v20L17.32 40 0 30V10Z M17.32 40v20" {...common} />
        </pattern>
      );
    case "grass":
      return (
        <pattern id={id} width="36" height="36" patternUnits="userSpaceOnUse">
          <rect x="2" y="2" width="32" height="32" rx="2" {...common} />
          <circle cx="12" cy="12" r="4.5" fill={stroke} opacity=".55" />
          <circle cx="24" cy="24" r="4.5" fill={stroke} opacity=".55" />
          <circle cx="24" cy="12" r="2.5" {...common} />
          <circle cx="12" cy="24" r="2.5" {...common} />
        </pattern>
      );
    case "herringbone":
      return (
        <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect x="1" y="1" width="38" height="18" {...common} />
          <rect x="1" y="21" width="18" height="18" {...common} />
          <rect x="21" y="21" width="18" height="18" {...common} />
        </pattern>
      );
    case "interlock":
      return (
        <pattern id={id} width="48" height="28" patternUnits="userSpaceOnUse">
          <path d="M2 2h20v6h-4v12h4v6H2v-6h4V8H2Z" {...common} />
          <path d="M26 2h20v6h-4v12h4v6H26v-6h4V8h-4Z" {...common} />
        </pattern>
      );
    case "grid":
      return (
        <pattern id={id} width="30" height="30" patternUnits="userSpaceOnUse">
          <rect x="1.5" y="1.5" width="27" height="27" {...common} />
          <path d="M8 8h14v14H8Z" {...common} opacity=".5" />
        </pattern>
      );
    default: // brick paver, running bond
      return (
        <pattern id={id} width="48" height="24" patternUnits="userSpaceOnUse">
          <rect x="1" y="1" width="46" height="10" {...common} />
          <rect x="-23" y="13" width="46" height="10" {...common} />
          <rect x="25" y="13" width="46" height="10" {...common} />
        </pattern>
      );
  }
}

/**
 * Designed catalogue cover in the Urban Distribution Hub style: brand colour, logo,
 * a parking-tile pattern panel, title, subtitle and year. Used whenever no cover photo is uploaded.
 */
export function CatalogueCover({ title, subtitle, year, style = "paver", color = "maroon", logo = "/brand/udh-logo.png", className }: {
  title: string;
  subtitle?: string;
  year?: number;
  style?: string;
  color?: string;
  logo?: string;
  className?: string;
}) {
  const c = coverColor(color);
  const id = `p-${style}-${color}-${title.length}`;
  const valid = ["paver", "hexagon", "grass", "herringbone", "interlock", "grid"].includes(style) ? (style as CoverStyle) : "paver";
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ background: c.bg, color: c.ink }} aria-label={title} role="img">
      {/* pattern panel on the right, fading into the cover colour */}
      <svg className="absolute inset-y-0 right-0 h-full w-[62%]" aria-hidden>
        <defs>
          <Pattern id={id} style={valid} stroke={c.accent} />
          <linearGradient id={`${id}-fade`} x1="0" x2="1">
            <stop offset="0" stopColor={c.bg} stopOpacity="1" />
            <stop offset=".45" stopColor={c.bg} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} opacity=".55" />
        <rect width="100%" height="100%" fill={`url(#${id}-fade)`} />
      </svg>
      {/* accent bars */}
      <span className="absolute top-0 left-0 h-1.5 w-1/3" style={{ background: c.accent }} />
      <span className="absolute bottom-0 left-0 h-full w-1.5" style={{ background: c.accent, opacity: 0.7 }} />

      <div className="relative flex h-full flex-col justify-between p-[7%]">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- small brand mark, also used in SVG-like covers */}
          <img src={logo} alt="" className="size-[18%] min-h-8 min-w-8 rounded-full bg-[#f8f2e9] p-0.5 shadow" />
          <span className="text-[clamp(7px,1.4vw,10px)] leading-tight font-semibold tracking-[0.18em] uppercase opacity-90">
            Urban Distribution
            <br />
            Hub
          </span>
        </div>
        <div className="max-w-[78%]">
          {subtitle && <p className="mb-1 text-[clamp(8px,1.5vw,11px)] font-medium tracking-[0.16em] uppercase" style={{ color: c.accent }}>{subtitle}</p>}
          <p className="font-display text-[clamp(14px,3vw,24px)] leading-[1.1] font-semibold">{title}</p>
          {year ? (
            <span className="mt-2 inline-block px-2 py-0.5 text-[clamp(8px,1.4vw,11px)] font-semibold tracking-widest" style={{ background: c.accent, color: c.bg }}>
              {year}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
