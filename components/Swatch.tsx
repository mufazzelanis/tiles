import type { CSSProperties } from "react";
import { needsOutline, swatchStyle, type SwatchColor } from "@/lib/colors";
import { cn } from "@/lib/utils";

type Paint = Pick<SwatchColor, "hex" | "hex2" | "pattern" | "image">;

/** A painted colour chip (solid, marble, wood… or a texture photo). Works on the server and the client. */
export function Swatch({ color, className, style, title, round = true }: {
  color: Paint;
  className?: string;
  style?: CSSProperties;
  title?: string;
  round?: boolean;
}) {
  return (
    <span
      title={title}
      className={cn("inline-block shrink-0", round ? "rounded-full" : "rounded-md", needsOutline(color.hex) && "ring-1 ring-black/10 ring-inset", className)}
      style={{ ...swatchStyle(color), ...style }}
      aria-hidden={title ? undefined : true}
    />
  );
}

/** A row of small dots with a "+N" overflow, for cards and tables. */
export function SwatchDots({ colors, max = 5, size = 14, className }: { colors: (Paint & { id: string; name: string })[]; max?: number; size?: number; className?: string }) {
  if (!colors.length) return null;
  const shown = colors.slice(0, max);
  return (
    <span className={cn("inline-flex items-center", className)} aria-label={`Available in ${colors.map((c) => c.name).join(", ")}`}>
      <span className="flex -space-x-1">
        {shown.map((c) => (
          <Swatch key={c.id} color={c} title={c.name} className="ring-2 ring-white" style={{ width: size, height: size }} />
        ))}
      </span>
      {colors.length > max && <span className="ml-1 text-[10px] font-medium text-current opacity-60">+{colors.length - max}</span>}
    </span>
  );
}

/** A miniature tiled floor — 3×3 tiles with grout lines — for previews. */
export function TilePreview({ color, className, grout = "#e9e5df", gap = 3 }: { color: Paint; className?: string; grout?: string; gap?: number }) {
  return (
    <span className={cn("grid grid-cols-3 overflow-hidden", className)} style={{ gap, background: grout, padding: gap }} aria-hidden>
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className="aspect-square"
          style={{
            ...swatchStyle(color),
            // a photo is spread across the 9 tiles; drawn patterns are mirrored so they don't look copy-pasted
            ...(color.image
              ? { backgroundSize: "300% 300%", backgroundPosition: `${(i % 3) * 50}% ${Math.floor(i / 3) * 50}%` }
              : { transform: i % 2 ? "scaleX(-1)" : i % 3 ? "scaleY(-1)" : undefined }),
          }}
        />
      ))}
    </span>
  );
}
