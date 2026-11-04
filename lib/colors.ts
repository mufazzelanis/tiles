import type { CSSProperties } from "react";
import type { ColorPattern, TileColor } from "./types";

/**
 * Tile colour helpers shared by the website and the admin panel.
 * Client-safe: plain data + pure functions.
 */

/** What a swatch needs to be drawn. */
export type SwatchColor = Pick<TileColor, "id" | "name" | "slug" | "code" | "hex" | "hex2" | "pattern" | "image">;

export const COLOR_FAMILIES = ["White", "Black", "Grey", "Red", "Yellow", "Green", "Beige", "Brown", "Blue", "Gold", "Multi"];

export const PATTERNS: { value: ColorPattern; label: string; hint: string }[] = [
  { value: "solid", label: "Solid", hint: "One flat colour" },
  { value: "marble", label: "Marble", hint: "Veins in the accent colour" },
  { value: "gradient", label: "Gradient", hint: "Soft blend of both colours" },
  { value: "speckle", label: "Speckle", hint: "Fine dots, granite / stone" },
  { value: "terrazzo", label: "Terrazzo", hint: "Chips in the accent colour" },
  { value: "wood", label: "Wood", hint: "Grain lines in the accent colour" },
];

export const isHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v);

/** Accepts "abc", "#abc", "aabbcc" or "#aabbcc"; returns "#aabbcc" or null. */
export function normalizeHex(input: string) {
  let v = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(v)) v = v.split("").map((c) => c + c).join("");
  return /^[0-9a-f]{6}$/i.test(v) ? `#${v.toLowerCase()}` : null;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt((normalizeHex(hex) ?? "#cccccc").slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance, 0 (black) … 1 (white). */
export function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Readable text colour to place on top of a swatch. */
export const onColor = (hex: string) => (luminance(hex) > 0.42 ? "#231a1b" : "#ffffff");

/** Very light swatches need an outline so they don't vanish on white. */
export const needsOutline = (hex: string) => luminance(hex) > 0.82;

const alpha = (hex: string, a: number) => {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};

/** CSS that paints a colour swatch — a texture photo, or a drawn pattern. */
export function swatchStyle(c: Pick<TileColor, "hex" | "hex2" | "pattern" | "image">): CSSProperties {
  const base = normalizeHex(c.hex) ?? "#cccccc";
  const accent = normalizeHex(c.hex2) ?? base;
  if (c.image) return { backgroundColor: base, backgroundImage: `url("${c.image.replace(/"/g, "%22")}")`, backgroundSize: "cover", backgroundPosition: "center" };
  switch (c.pattern) {
    case "marble":
      return {
        backgroundColor: base,
        backgroundImage: [
          `linear-gradient(118deg, transparent 38%, ${alpha(accent, 0.85)} 40%, transparent 42.5%)`,
          `linear-gradient(28deg, transparent 58%, ${alpha(accent, 0.55)} 59.5%, transparent 61.5%)`,
          `linear-gradient(150deg, transparent 70%, ${alpha(accent, 0.4)} 71%, transparent 72.5%)`,
          `radial-gradient(120% 90% at 20% 15%, ${alpha("#ffffff", 0.35)}, transparent 60%)`,
        ].join(","),
      };
    case "gradient":
      return { backgroundColor: base, backgroundImage: `linear-gradient(135deg, ${base} 10%, ${accent} 90%)` };
    case "speckle":
      return {
        backgroundColor: base,
        backgroundImage: [
          `radial-gradient(${alpha(accent, 0.9)} 0.9px, transparent 1.4px)`,
          `radial-gradient(${alpha(accent, 0.6)} 0.7px, transparent 1.2px)`,
        ].join(","),
        backgroundSize: "7px 7px, 11px 11px",
        backgroundPosition: "0 0, 4px 6px",
      };
    case "terrazzo":
      return {
        backgroundColor: base,
        backgroundImage: [
          `radial-gradient(ellipse 3px 2px at 20% 30%, ${accent} 98%, transparent)`,
          `radial-gradient(ellipse 2px 3px at 70% 20%, ${alpha(accent, 0.8)} 98%, transparent)`,
          `radial-gradient(ellipse 4px 2.5px at 45% 75%, ${accent} 98%, transparent)`,
          `radial-gradient(ellipse 2px 2px at 85% 65%, ${alpha(accent, 0.7)} 98%, transparent)`,
          `radial-gradient(ellipse 2.5px 2px at 10% 85%, ${alpha(accent, 0.9)} 98%, transparent)`,
        ].join(","),
        backgroundSize: "28px 28px",
      };
    case "wood":
      return {
        backgroundColor: base,
        backgroundImage: [
          `repeating-linear-gradient(92deg, transparent 0 5px, ${alpha(accent, 0.45)} 6px, transparent 7.5px, transparent 13px, ${alpha(accent, 0.25)} 14px, transparent 15px)`,
          `linear-gradient(90deg, ${alpha("#000000", 0.06)}, transparent 40%, ${alpha("#ffffff", 0.08)})`,
        ].join(","),
      };
    default:
      return { backgroundColor: base };
  }
}

export function toSwatch(c: TileColor): SwatchColor {
  return { id: c.id, name: c.name, slug: c.slug, code: c.code, hex: c.hex, hex2: c.hex2, pattern: c.pattern, image: c.image };
}

/** Admin pickers: every colour in display order, with family and visibility. */
export function colorOptions(colors: TileColor[]) {
  return [...colors].sort((a, b) => a.order - b.order).map((c) => ({ ...toSwatch(c), family: c.family, active: c.active }));
}

/** Starter palette — created on first run, and for existing sites when colours are first introduced. */
export const DEFAULT_COLORS: Omit<TileColor, "id" | "order" | "active" | "createdAt" | "updatedAt">[] = [
  { name: "Red", slug: "red", code: "C-101", family: "Red", hex: "#c62828", hex2: "#c62828", pattern: "solid", image: "", description: "" },
  { name: "Black", slug: "black", code: "C-102", family: "Black", hex: "#1e1e20", hex2: "#1e1e20", pattern: "solid", image: "", description: "" },
  { name: "White", slug: "white", code: "C-103", family: "White", hex: "#f7f7f5", hex2: "#f7f7f5", pattern: "solid", image: "", description: "" },
  { name: "Gray", slug: "gray", code: "C-104", family: "Grey", hex: "#9e9e9e", hex2: "#9e9e9e", pattern: "solid", image: "", description: "" },
  { name: "Yellow", slug: "yellow", code: "C-105", family: "Yellow", hex: "#f2c230", hex2: "#f2c230", pattern: "solid", image: "", description: "" },
  { name: "Green", slug: "green", code: "C-106", family: "Green", hex: "#3f8f4f", hex2: "#3f8f4f", pattern: "solid", image: "", description: "" },
];

/** Which starter colours each seeded product comes in. */
export const DEFAULT_PRODUCT_COLORS: Record<string, string[]> = {
  "Statuario Bianco": ["white", "gray"],
  "Calacatta Gold": ["white", "yellow"],
  "Onyx Pearl": ["white"],
  "Armani Grey": ["gray", "black", "white"],
  "Travertino Sand": ["yellow", "white"],
  "Nero Marquina": ["black"],
  "Arctic White": ["white", "green"],
  "Aqua Mosaic": ["green", "white"],
  "Woodland Relief": ["red", "black"],
  "Stone Ripple": ["gray", "black"],
  "Graphite Pro": ["gray", "black"],
  "Oak Plank": ["red", "yellow"],
};

/** Fallback when an older product only has a colour family name. */
export const FAMILY_DEFAULT: Record<string, string> = {
  White: "white", Beige: "white", Grey: "gray", Black: "black", Brown: "red", Blue: "gray", Green: "green", Red: "red", Yellow: "yellow",
};
