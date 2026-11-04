/**
 * Variable products. A product is sold in variations — each one a combination of
 * design, colour, size and thickness — with its own price per piece and photos.
 * Tiles are priced and ordered by the piece (no boxes).
 * The customer picks attributes on the website and sees that variation's price and photo.
 * Client-safe: plain data + pure functions, shared by the admin, the website and the server.
 */

export type SizeUnit = "mm" | "cm";

export interface Variation {
  id: string;
  /** design / pattern name, e.g. "Statuario" ("" = not set) */
  design: string;
  /** colour from the Tile Colours library ("" = not set) */
  colorId: string;
  /** tile size in the product's unit */
  width: number;
  height: number;
  /** thickness in mm (0 = not set) */
  thickness: number;
  /** price per piece in ৳ (0 = price on request) */
  price: number;
  /** tile size as written by the admin, e.g. "12x12" or "11x11" (shown as "Sqft") */
  sqft: string;
  images: string[];
  sku: string;
  active: boolean;
  /** offer price per piece; used instead of `price` when lower (0 = no offer) */
  salePrice: number;
  stock: StockStatus;
  /** shown first on the product page (one per product; else the first row) */
  isDefault: boolean;
}

export type StockStatus = "in" | "low" | "out" | "preorder";
export const STOCK: { value: StockStatus; label: string; tone: "green" | "amber" | "rose" | "blue" }[] = [
  { value: "in", label: "In stock", tone: "green" },
  { value: "low", label: "Low stock", tone: "amber" },
  { value: "out", label: "Out of stock", tone: "rose" },
  { value: "preorder", label: "Pre-order", tone: "blue" },
];

/** What the customer pays per piece: the offer price when it's set and lower. */
export const effectivePrice = (v: Pick<Variation, "price" | "salePrice">) => (v.salePrice > 0 && (v.salePrice < v.price || !v.price) ? v.salePrice : v.price);
export const onSale = (v: Pick<Variation, "price" | "salePrice">) => v.salePrice > 0 && v.price > 0 && v.salePrice < v.price;

export interface ProductOptions {
  unit: SizeUnit;
  variations: Variation[];
}

export type Attribute = "design" | "color" | "size" | "sqft" | "thickness";
export const ATTRIBUTES: Attribute[] = ["design", "color", "size", "sqft", "thickness"];

export const EMPTY_OPTIONS: ProductOptions = { unit: "mm", variations: [] };

const SQFT_PER_SQM = 10.7639;

/* -------------------------------------------------------------- sizes */

export const sizeKey = (v: Pick<Variation, "width" | "height">) => (v.width && v.height ? `${v.width}x${v.height}` : "");
export const sizeLabel = (v: Pick<Variation, "width" | "height">, unit: SizeUnit) => (v.width && v.height ? `${v.width}×${v.height} ${unit}` : "");
export const thicknessLabel = (mm: number) => (mm ? `${mm} mm` : "");

/**
 * Floor area one piece covers, in sqft. The admin's "Sqft" value comes first — "12x12"
 * is read as inches (= 1 sqft), a plain number as sqft — then the size in mm/cm. 0 = unknown.
 */
export function pieceArea(v: Pick<Variation, "width" | "height" | "sqft">, unit: SizeUnit) {
  const text = (v.sqft ?? "").trim();
  const inch = /^(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)/i.exec(text);
  if (inch) return Math.round(((Number(inch[1]) * Number(inch[2])) / 144) * 10000) / 10000;
  const plain = /^(\d+(?:\.\d+)?)\s*(sq\.?\s*ft|sqft)?$/i.exec(text);
  if (plain && Number(plain[1]) > 0) return Number(plain[1]);
  if (v.width && v.height) {
    const m = unit === "mm" ? 1000 : 100;
    return Math.round((v.width / m) * (v.height / m) * SQFT_PER_SQM * 10000) / 10000;
  }
  return 0;
}

/** "60x60 cm" / "600 x 600 mm" → numbers + unit (for older products). */
export function parseSize(text: string): { width: number; height: number; unit: SizeUnit } | null {
  const m = /(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)\s*(mm|cm)?/i.exec(text ?? "");
  if (!m) return null;
  return { width: Number(m[1]), height: Number(m[2]), unit: m[3]?.toLowerCase() === "cm" ? "cm" : m[3] ? "mm" : "cm" };
}

/* ----------------------------------------------------------- normalize */

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const num = (v: unknown, max = 1_000_000) => {
  const n = Math.round(Number(v) * 100) / 100;
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0;
};
const text = (v: unknown, max = 80) => String(v ?? "").trim().slice(0, max);
let seq = 0;
const vid = (v: unknown) => (typeof v === "string" && /^[\w-]{1,40}$/.test(v) ? v : `v${Date.now().toString(36)}${++seq}`);
const images = (v: unknown) => (Array.isArray(v) ? v : []).map((u) => String(u).trim()).filter((u) => /^(\/|https?:\/\/)/.test(u)).slice(0, 12);

/** What older product rows hold (single size / price, and the earlier designs/sizes format). */
export interface LegacyProduct {
  size?: string;
  thickness?: string;
  price?: number;
  piecesPerBox?: number;
  sqftPerBox?: number;
  colorVariants?: { colorId: string; image?: string; extra?: number }[];
}

/**
 * Accepts anything and returns clean options. Rows from older versions — a single size/price,
 * or the earlier "designs × sizes with extras" format — are turned into variations so every
 * existing product keeps showing its price.
 */
export function normalizeOptions(raw: unknown, legacy: LegacyProduct = {}): ProductOptions {
  const r = isObj(raw) ? raw : {};
  const legacySize = parseSize(legacy.size ?? "");
  const unit: SizeUnit = r.unit === "cm" || r.unit === "mm" ? r.unit : (legacySize?.unit ?? "mm");

  if (Array.isArray(r.variations)) {
    const seen = new Set<string>();
    const variations = r.variations
      .filter(isObj)
      .slice(0, 200)
      .map(
        (v): Variation => ({
          id: vid(v.id),
          design: text(v.design),
          colorId: text(v.colorId, 60),
          width: num(v.width, 100_000),
          height: num(v.height, 100_000),
          thickness: num(v.thickness, 1000),
          price: num(v.price, 10_000_000),
          sqft: text(v.sqft, 30),
          images: images(v.images),
          sku: text(v.sku, 60),
          active: v.active !== false,
          salePrice: num(v.salePrice, 10_000_000),
          stock: STOCK.some((s) => s.value === v.stock) ? (v.stock as StockStatus) : "in",
          isDefault: v.isDefault === true,
        }),
      )
      // one row per combination
      .filter((v) => {
        const key = [v.design.toLowerCase(), v.colorId, sizeKey(v), v.sqft.toLowerCase(), v.thickness].join("|");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    return { unit, variations: oneDefault(variations) };
  }

  // ---- earlier format: { designs, finishes, sizes } with price extras on a base price
  const base = Number(legacy.price) || 0;
  const thickness = num(parseFloat(legacy.thickness ?? ""), 1000);
  const oldDesigns = (Array.isArray(r.designs) ? r.designs : []).filter(isObj).map((d) => ({ name: text(d.name), extra: Number(d.extra) || 0, images: images(d.images) })).filter((d) => d.name);
  const oldSizes = (Array.isArray(r.sizes) ? r.sizes : [])
    .filter(isObj)
    .map((s) => ({ parsed: parseSize(text(s.name)), extra: Number(s.extra) || 0, pcs: num(s.piecesPerBox), sqft: num(s.sqftPerBox) }))
    .filter((s) => s.parsed);
  const designs = oldDesigns.length ? oldDesigns : [{ name: "", extra: 0, images: [] as string[] }];
  const sizes = oldSizes.length
    ? oldSizes
    : [{ parsed: legacySize, extra: 0, pcs: 0, sqft: 0 }];
  const colors = (legacy.colorVariants ?? []).length ? legacy.colorVariants! : [{ colorId: "", image: "", extra: 0 }];

  const variations: Variation[] = [];
  for (const d of designs)
    for (const s of sizes)
      for (const c of colors) {
        const price = base + d.extra + s.extra + (c.extra ?? 0);
        variations.push({
          // stable ids: the same old row always converts to the same variation ids
          id: `lv${variations.length + 1}`,
          design: d.name,
          colorId: c.colorId,
          width: s.parsed?.width ?? 0,
          height: s.parsed?.height ?? 0,
          thickness,
          price: base > 0 || price > 0 ? Math.max(0, price) : 0,
          sqft: "",
          images: d.images.length ? d.images : c.image ? [c.image] : [],
          sku: "",
          active: true,
          salePrice: 0,
          stock: "in",
          isDefault: false,
        });
      }
  // a product with no size, price or options at all simply has no variations yet
  const meaningful = variations.filter((v) => v.price || v.width || v.design || v.colorId);
  return { unit, variations: meaningful.slice(0, 200) };
}

/** Only one default variation per product. */
function oneDefault(list: Variation[]) {
  let seen = false;
  for (const v of list) {
    if (v.isDefault && !seen) seen = true;
    else v.isDefault = false;
  }
  return list;
}

/* ------------------------------------------------------------ pricing */

export interface PricedProduct {
  unit: SizeUnit;
  /** published variations only */
  variations: Variation[];
  /** colour names for labels (only published library colours) */
  colorNames: Record<string, string>;
}

export function pricedProduct(p: { options: ProductOptions }, colorById: Map<string, { name: string }>): PricedProduct {
  const colorNames: Record<string, string> = {};
  for (const [id, c] of colorById) colorNames[id] = c.name;
  return {
    unit: p.options.unit,
    // a variation in a colour that was hidden or deleted is not offered
    variations: p.options.variations.filter((v) => v.active && (!v.colorId || colorById.has(v.colorId))),
    colorNames,
  };
}

/** Value of one attribute for a variation, as a comparable key. */
export function attrValue(v: Variation, a: Attribute) {
  if (a === "design") return v.design;
  if (a === "color") return v.colorId;
  if (a === "size") return sizeKey(v);
  if (a === "sqft") return v.sqft.toLowerCase().replace(/\s+/g, "");
  return v.thickness ? String(v.thickness) : "";
}

/** Attributes the customer actually chooses between (more than one value on offer). */
export function choiceAttributes(p: PricedProduct): Attribute[] {
  return ATTRIBUTES.filter((a) => new Set(p.variations.map((v) => attrValue(v, a))).size > 1);
}

/** The variation for an id (defaults to the first published one). */
export const defaultVariation = (p: PricedProduct) => p.variations.find((v) => v.isDefault) ?? p.variations[0];
export const variationFor = (p: PricedProduct, id: string) => p.variations.find((v) => v.id === id) ?? defaultVariation(p);

/**
 * Customer clicked an attribute value: keep as many of the current choices as possible.
 * Prefers a variation matching every other current choice, then the most matches.
 */
export function pickVariation(p: PricedProduct, currentId: string, attr: Attribute, value: string) {
  const cur = variationFor(p, currentId);
  const candidates = p.variations.filter((v) => attrValue(v, attr) === value);
  if (!cur || !candidates.length) return candidates[0]?.id ?? currentId;
  const others = ATTRIBUTES.filter((a) => a !== attr);
  const score = (v: Variation) => others.reduce((n, a) => n + (attrValue(v, a) === attrValue(cur, a) ? 1 : 0), 0);
  return candidates.reduce((best, v) => (score(v) > score(best) ? v : best), candidates[0]).id;
}

export interface Quote {
  variation: Variation | undefined;
  /** price per piece the customer pays (offer price when on sale); 0 = price on request */
  unitPrice: number;
  /** regular price, when an offer is running */
  regularPrice: number;
  stock: StockStatus;
  /** floor area of one piece in sqft (0 = unknown) */
  pieceArea: number;
  /** "Design: Statuario · Colour: Gray · Size: 600×600 mm · Sqft: 24x24 · Thickness: 9 mm" */
  label: string;
  lines: { label: string; value: string }[];
}

export function quoteFor(p: PricedProduct, variationId: string): Quote {
  const v = variationFor(p, variationId);
  if (!v) return { variation: undefined, unitPrice: 0, regularPrice: 0, stock: "in", pieceArea: 0, label: "", lines: [] };
  const lines = [
    { label: "Design", value: v.design },
    { label: "Colour", value: v.colorId ? (p.colorNames[v.colorId] ?? "") : "" },
    { label: "Size", value: sizeLabel(v, p.unit) },
    { label: "Sqft", value: v.sqft },
    { label: "Thickness", value: thicknessLabel(v.thickness) },
  ].filter((l) => l.value);
  return {
    variation: v,
    unitPrice: effectivePrice(v),
    regularPrice: onSale(v) ? v.price : 0,
    stock: v.stock,
    pieceArea: pieceArea(v, p.unit),
    label: [
      ...lines.map((l) => `${l.label}: ${l.value}`),
      v.sku && `SKU: ${v.sku}`,
      // the sales team should know when a request is for something not on the shelf
      v.stock !== "in" && `Stock: ${STOCK.find((s) => s.value === v.stock)!.label}`,
    ].filter(Boolean).join(" · "),
    lines,
  };
}

/** Cheapest and dearest price the customer pays (for cards, sorting and SEO). */
export function priceRange(p: PricedProduct) {
  const prices = p.variations.map(effectivePrice).filter((n) => n > 0);
  const sale = p.variations.some(onSale);
  if (!prices.length) return { min: 0, max: 0, varies: false, sale };
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min, max, varies: min !== max, sale };
}

/** "৳2,500" for prices in labels. */
export const taka = (n: number) => `৳${n.toLocaleString("en-IN")}`;
