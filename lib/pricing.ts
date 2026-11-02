/**
 * Product options and pricing: base price + extras.
 *
 * A product has a base price per box. Each design (pattern), finish, size and colour
 * the customer can pick may add (or subtract) an amount. Sizes can also override how
 * much a box covers. The first option in each group is the default selection.
 * Client-safe: plain data + pure functions, shared by the admin, the website and the server.
 */

export interface PriceOption {
  id: string;
  name: string;
  /** added to the base price, in ৳ per box (may be negative) */
  extra: number;
}

export interface DesignOption extends PriceOption {
  /** photos of the product in this design — the gallery switches to them */
  images: string[];
}

export interface SizeOption extends PriceOption {
  /** 0 = use the product's own pieces / sqft per box */
  piecesPerBox: number;
  sqftPerBox: number;
}

export interface ProductOptions {
  designs: DesignOption[];
  finishes: PriceOption[];
  sizes: SizeOption[];
}

export type OptionGroup = "design" | "finish" | "size" | "color";

/** What the customer picked: option id per group ("" = group not offered). */
export type Selection = Record<OptionGroup, string>;

export const EMPTY_OPTIONS: ProductOptions = { designs: [], finishes: [], sizes: [] };

/* ----------------------------------------------------------- normalize */

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const money = (v: unknown) => {
  const n = Math.round(Number(v) * 100) / 100;
  return Number.isFinite(n) ? Math.max(-10_000_000, Math.min(10_000_000, n)) : 0;
};
const positive = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
};
let seq = 0;
const optionId = (v: unknown, prefix: string) => (typeof v === "string" && /^[\w-]{1,40}$/.test(v) ? v : `${prefix}${Date.now().toString(36)}${++seq}`);

function base(o: Record<string, unknown>, prefix: string): PriceOption {
  return { id: optionId(o.id, prefix), name: String(o.name ?? "").trim().slice(0, 80), extra: money(o.extra) };
}

/** Accepts anything (old rows store `[]`) and returns clean options; unnamed rows are dropped, names are unique per group. */
export function normalizeOptions(raw: unknown): ProductOptions {
  const r = isObj(raw) ? raw : {};
  const list = <T extends PriceOption>(v: unknown, map: (o: Record<string, unknown>) => T) => {
    const seen = new Set<string>();
    return (Array.isArray(v) ? v : [])
      .filter(isObj)
      .slice(0, 40)
      .map(map)
      .filter((o) => o.name && !seen.has(o.name.toLowerCase()) && seen.add(o.name.toLowerCase()));
  };
  return {
    designs: list(r.designs, (o) => ({
      ...base(o, "d"),
      images: (Array.isArray(o.images) ? o.images : []).map((u) => String(u).trim()).filter((u) => /^(\/|https?:\/\/)/.test(u)).slice(0, 12),
    })),
    finishes: list(r.finishes, (o) => base(o, "f")),
    sizes: list(r.sizes, (o) => ({ ...base(o, "s"), piecesPerBox: positive(o.piecesPerBox), sqftPerBox: positive(o.sqftPerBox) })),
  };
}

/* ------------------------------------------------------------- pricing */

export interface PricedProduct {
  price: number;
  piecesPerBox: number;
  sqftPerBox: number;
  options: ProductOptions;
  /** colours with their extra, in display order */
  colors: { id: string; name: string; extra: number }[];
}

const first = <T extends { id: string }>(list: T[], id: string) => list.find((o) => o.id === id) ?? list[0];

/** Fills in defaults (first option of each group) and drops ids that no longer exist. */
export function resolveSelection(p: PricedProduct, picked: Partial<Selection> = {}): Selection {
  return {
    design: first(p.options.designs, picked.design ?? "")?.id ?? "",
    finish: first(p.options.finishes, picked.finish ?? "")?.id ?? "",
    size: first(p.options.sizes, picked.size ?? "")?.id ?? "",
    color: first(p.colors, picked.color ?? "")?.id ?? "",
  };
}

export interface Quote {
  /** price per box for this selection; 0 = price on request */
  unitPrice: number;
  piecesPerBox: number;
  sqftPerBox: number;
  /** "Design: Calacatta · Finish: Matt · Size: 60x120 cm · Colour: Gold" */
  label: string;
  lines: { group: OptionGroup; label: string; name: string; extra: number }[];
}

const GROUP_LABEL: Record<OptionGroup, string> = { design: "Design", finish: "Finish", size: "Size", color: "Colour" };

/** Price and box coverage for one selection. A base price of 0 means "price on request". */
export function quoteFor(p: PricedProduct, picked: Partial<Selection> = {}): Quote {
  const s = resolveSelection(p, picked);
  const design = p.options.designs.find((o) => o.id === s.design);
  const finish = p.options.finishes.find((o) => o.id === s.finish);
  const size = p.options.sizes.find((o) => o.id === s.size);
  const color = p.colors.find((o) => o.id === s.color);
  const lines = (
    [
      ["design", design],
      ["finish", finish],
      ["size", size],
      ["color", color],
    ] as const
  )
    .filter(([, o]) => o)
    .map(([group, o]) => ({ group, label: GROUP_LABEL[group], name: o!.name, extra: o!.extra }));
  const unitPrice = p.price > 0 ? Math.max(0, p.price + lines.reduce((sum, l) => sum + l.extra, 0)) : 0;
  return {
    unitPrice,
    piecesPerBox: size?.piecesPerBox || p.piecesPerBox,
    sqftPerBox: size?.sqftPerBox || p.sqftPerBox,
    label: lines.map((l) => `${l.label}: ${l.name}`).join(" · "),
    lines,
  };
}

/** Cheapest and dearest box price across all combinations (for cards, sorting and SEO). */
export function priceRange(p: PricedProduct) {
  if (p.price <= 0) return { min: 0, max: 0, varies: false };
  const groups = [p.options.designs, p.options.finishes, p.options.sizes, p.colors].filter((g) => g.length);
  const lo = groups.reduce((s, g) => s + Math.min(...g.map((o) => o.extra)), 0);
  const hi = groups.reduce((s, g) => s + Math.max(...g.map((o) => o.extra)), 0);
  return { min: Math.max(0, p.price + lo), max: Math.max(0, p.price + hi), varies: lo !== hi };
}

/** Signed extra for labels: "+৳300", "−৳150", "" for 0. */
export function formatExtra(n: number) {
  if (!n) return "";
  return `${n > 0 ? "+" : "−"}৳${Math.abs(n).toLocaleString("en-IN")}`;
}

/** Builds the pricing view of a product; only colours present in `colorById` (i.e. published) count. */
export function pricedProduct(
  p: { price: number; piecesPerBox: number; sqftPerBox: number; options: ProductOptions; colorVariants: { colorId: string; extra?: number }[] },
  colorById: Map<string, { name: string }>,
): PricedProduct {
  return {
    price: p.price,
    piecesPerBox: p.piecesPerBox,
    sqftPerBox: p.sqftPerBox,
    options: p.options,
    colors: p.colorVariants.flatMap((v) => {
      const c = colorById.get(v.colorId);
      return c ? [{ id: v.colorId, name: c.name, extra: v.extra ?? 0 }] : [];
    }),
  };
}
