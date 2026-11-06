/**
 * Which home page sections are shown, and in what order — set in Admin → Home page.
 * Client-safe: plain data + pure functions.
 */

export const HOME_SECTIONS_KEY = "home-sections";

export const HOME_SECTIONS = [
  { key: "hero", label: "Hero slider", help: "The big banner at the top (slides are set in Hero Slider)." },
  { key: "quick", label: "Search & shortcuts", help: "Search box and 4 shortcut icons under the banner — phones only." },
  { key: "welcome", label: "Welcome & numbers", help: "Logo, company intro and the designs / stores counters." },
  { key: "promises", label: "Promise strip", help: "100% genuine · Ready stock · Nationwide delivery · Best price." },
  { key: "featured", label: "Products row", help: "Your products as a swipeable row — newest uploads appear here automatically." },
  { key: "areas", label: "Shop by area", help: "Car parking, driveway, walkway… each opens matching products." },
  { key: "thickness", label: "Which thickness do I need?", help: "60 / 80 / 100 mm guide for walkways, cars and heavy vehicles." },
  { key: "patterns", label: "Paver patterns", help: "Drawings of brick, hexagon, grass, herringbone, I-shape and square pavers." },
  { key: "categories", label: "Categories", help: "Your product categories as a swipeable row." },
  { key: "calculator", label: "Calculator banner", help: "“How many tiles do you need?” banner linking to the calculator." },
  { key: "steps", label: "How ordering works", help: "4 simple steps from choosing a design to delivery." },
  { key: "recent", label: "Continue browsing", help: "Products the visitor looked at recently (only shown to them)." },
  { key: "why", label: "Why choose us", help: "Why-choose text, About / Display Center / Dealer links and the video." },
  { key: "popular", label: "Popular", help: "Tiles Care, Projects and News & Events links." },
  { key: "sustainability", label: "Sustainability", help: "The sustainability slider." },
] as const;

export type HomeSectionKey = (typeof HOME_SECTIONS)[number]["key"];
const KEYS = HOME_SECTIONS.map((s) => s.key) as HomeSectionKey[];

/** which products the home products row shows */
export const PRODUCT_ROW_MODES = [
  { value: "mixed", label: "Featured first, then newest uploads" },
  { value: "latest", label: "Newest uploads only" },
  { value: "featured", label: "Featured products only" },
] as const;
export type ProductRowMode = (typeof PRODUCT_ROW_MODES)[number]["value"];

export interface HomeSections {
  /** every section, in display order */
  order: HomeSectionKey[];
  hidden: HomeSectionKey[];
  productsMode: ProductRowMode;
  /** how many products the row shows */
  productsCount: number;
}

export const defaultHomeSections = (): HomeSections => ({ order: [...KEYS], hidden: [], productsMode: "mixed", productsCount: 12 });

/** Keeps known keys only; sections added in later versions slot in at their default position. */
export function normalizeHomeSections(raw: unknown): HomeSections {
  const r = (raw && typeof raw === "object" ? raw : {}) as { order?: unknown; hidden?: unknown; productsMode?: unknown; productsCount?: unknown };
  const known = (v: unknown): v is HomeSectionKey => typeof v === "string" && (KEYS as string[]).includes(v);
  const order = Array.isArray(r.order) ? [...new Set(r.order.filter(known))] : [];
  KEYS.forEach((k, i) => {
    if (order.includes(k)) return;
    // put a missing section right after the section that comes before it by default
    const prev = KEYS.slice(0, i).reverse().find((p) => order.includes(p));
    order.splice(prev ? order.indexOf(prev) + 1 : 0, 0, k);
  });
  const hidden = Array.isArray(r.hidden) ? [...new Set(r.hidden.filter(known))] : [];
  const productsMode = PRODUCT_ROW_MODES.some((m) => m.value === r.productsMode) ? (r.productsMode as ProductRowMode) : "mixed";
  const productsCount = Math.min(30, Math.max(4, Math.round(Number(r.productsCount) || 12)));
  return { order, hidden, productsMode, productsCount };
}

/** The products for the home row: newest first (the list comes newest first), featured on top in "mixed". */
export function pickRowProducts<T extends { featured: boolean }>(newestFirst: T[], cfg: Pick<HomeSections, "productsMode" | "productsCount">): T[] {
  const list =
    cfg.productsMode === "featured" ? newestFirst.filter((p) => p.featured)
    : cfg.productsMode === "latest" ? newestFirst
    : [...newestFirst.filter((p) => p.featured), ...newestFirst.filter((p) => !p.featured)];
  return list.slice(0, cfg.productsCount);
}
