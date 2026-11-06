/**
 * Home page "Popular paver patterns" section — set in Admin → Paver Patterns.
 * Client-safe: plain data + pure functions.
 */

export const HOME_PATTERNS_KEY = "home-patterns";

export interface PatternCard {
  id: string;
  name: string;
  text: string;
  /** photo; empty = the drawn pattern below */
  image: string;
  pattern: string;
  color: string;
  /** where the card opens (empty = all products) */
  link: string;
  enabled: boolean;
}

export interface HomePatterns {
  title: string;
  subtitle: string;
  cards: PatternCard[];
}

export function defaultHomePatterns(): HomePatterns {
  const card = (id: string, name: string, text: string, pattern: string, color: string): PatternCard => ({ id, name, text, image: "", pattern, color, link: "/products", enabled: true });
  return {
    title: "Popular Paver Patterns",
    subtitle: "The shape of the block decides both the look and how strongly the floor holds together.",
    cards: [
      card("interlock", "I-Shape Interlock", "Locks tightly together — the strongest choice for car parking.", "interlock", "maroon"),
      card("brick", "Brick Paver", "Classic brick look for driveways, lanes and footpaths.", "paver", "charcoal"),
      card("herringbone", "Herringbone", "Best grip where cars turn and brake.", "herringbone", "slate"),
      card("hexagon", "Hexagon", "Modern look for plazas, walkways and courtyards.", "hexagon", "gold"),
      card("grass", "Grass Paver", "Green parking — grass grows through, rain soaks in.", "grass", "green"),
      card("square", "Square Slab", "Clean, simple look for rooftops and terraces.", "grid", "cream"),
    ],
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, d: string, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : d);
const PATTERNS = ["paver", "hexagon", "grass", "herringbone", "interlock", "grid"];
const COLORS = ["maroon", "charcoal", "cream", "gold", "slate", "green"];

/** Only site-relative links or full http(s) URLs are kept. */
const safeLink = (v: unknown) => {
  const s = str(v, "", 500);
  return /^\/(?!\/)/.test(s) || /^https?:\/\//i.test(s) ? s : "";
};

export function normalizeHomePatterns(raw: unknown): HomePatterns {
  const d = defaultHomePatterns();
  if (!isObj(raw)) return d;
  const cards = Array.isArray(raw.cards)
    ? raw.cards
        .filter(isObj)
        .map((c, i) => ({
          id: str(c.id, `p${i}`, 40) || `p${i}`,
          name: str(c.name, ""),
          text: str(c.text, "", 300),
          image: str(c.image, "", 2000),
          pattern: PATTERNS.includes(String(c.pattern)) ? String(c.pattern) : PATTERNS[i % PATTERNS.length],
          color: COLORS.includes(String(c.color)) ? String(c.color) : COLORS[i % COLORS.length],
          link: safeLink(c.link),
          enabled: typeof c.enabled === "boolean" ? c.enabled : true,
        }))
        .filter((c) => c.name)
        .slice(0, 12)
    : d.cards;
  return { title: str(raw.title, d.title, 120), subtitle: str(raw.subtitle, d.subtitle, 400), cards };
}
