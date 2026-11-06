/**
 * Texts, links and small lists of every home page section — edited in Admin → Home page
 * ("Edit content" on each section). Client-safe: plain data + pure functions.
 *
 * The products-row and why-choose headings/texts live in Settings (they existed before);
 * the home page editor edits them too and the save writes them back there.
 */

export const HOME_CONTENT_KEY = "home-content";

/** Icons an admin can pick (rendered by components/HomeIcon). */
export const HOME_ICONS = [
  "sparkles", "calculator", "book", "store", "badge", "package", "truck", "wallet", "lightbulb", "map", "dealer",
  "folder", "news", "grid", "send", "phone", "shield", "star", "heart", "home", "car", "search", "chat", "clock",
] as const;
export type HomeIcon = (typeof HOME_ICONS)[number];

export type FieldType = "text" | "textarea" | "link" | "icon";
export interface FieldDef {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
}
export interface ListDef {
  label: string;
  itemLabel: string;
  max: number;
  fields: FieldDef[];
}
export interface SectionContentDef {
  fields: FieldDef[];
  list?: ListDef;
  /** shown above the fields */
  note?: string;
}

type Item = Record<string, string>;
export type SectionContent = { items?: Item[]; [key: string]: string | Item[] | undefined };

/** A text value of a section ("" when missing). */
export const txt = (c: SectionContent | undefined, key: string) => (typeof c?.[key] === "string" ? (c[key] as string) : "");
export type HomeContent = Record<string, SectionContent>;

/** Which fields each section has. Sections not listed have their own editor page. */
export const CONTENT_DEFS: Record<string, SectionContentDef> = {
  quick: {
    fields: [
      { key: "placeholder", label: "Search box placeholder" },
      { key: "button", label: "Search button text" },
    ],
    list: { label: "Shortcuts", itemLabel: "Shortcut", max: 4, fields: [{ key: "label", label: "Label" }, { key: "link", label: "Link", type: "link" }, { key: "icon", label: "Icon", type: "icon" }] },
  },
  welcome: {
    note: "The company name, tagline and intro paragraph come from Settings → Brand & contact.",
    fields: [
      { key: "eyebrow", label: "Small line above the name" },
      { key: "primaryLabel", label: "Main button text" },
      { key: "primaryLink", label: "Main button link", type: "link" },
      { key: "secondaryLabel", label: "Second button text" },
      { key: "secondaryLink", label: "Second button link", type: "link" },
      { key: "statProducts", label: "Counter label — designs" },
      { key: "statCategories", label: "Counter label — collections" },
      { key: "statStores", label: "Counter label — stores" },
      { key: "statDivisions", label: "Counter label — divisions" },
    ],
  },
  promises: {
    fields: [],
    list: { label: "Promises", itemLabel: "Promise", max: 6, fields: [{ key: "title", label: "Title" }, { key: "text", label: "Short text" }, { key: "icon", label: "Icon", type: "icon" }] },
  },
  featured: {
    fields: [
      { key: "title", label: "Heading" },
      { key: "text", label: "Text under the heading", type: "textarea" },
      { key: "allLabel", label: "“All products” link text" },
      { key: "searchLabel", label: "Search button text" },
    ],
  },
  categories: {
    fields: [
      { key: "title", label: "Heading" },
      { key: "cardLabel", label: "Text under each category" },
      { key: "button", label: "Button text" },
    ],
  },
  calculator: {
    fields: [
      { key: "title", label: "Heading" },
      { key: "text", label: "Text", type: "textarea" },
      { key: "button", label: "Button text" },
      { key: "link", label: "Link", type: "link" },
    ],
  },
  steps: {
    fields: [
      { key: "eyebrow", label: "Small line above the heading" },
      { key: "title", label: "Heading" },
    ],
    list: {
      label: "Steps",
      itemLabel: "Step",
      max: 6,
      fields: [{ key: "title", label: "Title" }, { key: "text", label: "Text" }, { key: "linkLabel", label: "Link text" }, { key: "link", label: "Link", type: "link" }, { key: "icon", label: "Icon", type: "icon" }],
    },
  },
  recent: { fields: [{ key: "title", label: "Heading" }] },
  why: {
    fields: [
      { key: "title", label: "Heading" },
      { key: "text", label: "Text", type: "textarea" },
    ],
    note: "The video is set in Settings → Home page.",
    list: { label: "Links", itemLabel: "Link", max: 4, fields: [{ key: "label", label: "Label" }, { key: "link", label: "Link", type: "link" }, { key: "icon", label: "Icon", type: "icon" }] },
  },
  popular: {
    fields: [{ key: "title", label: "Heading" }],
    list: { label: "Items", itemLabel: "Item", max: 4, fields: [{ key: "title", label: "Title" }, { key: "text", label: "Text", type: "textarea" }, { key: "link", label: "Link", type: "link" }, { key: "icon", label: "Icon", type: "icon" }] },
  },
  sustainability: { fields: [{ key: "title", label: "Heading" }] },
};

export function defaultHomeContent(): HomeContent {
  return {
    quick: {
      placeholder: "Search tiles, size, colour…",
      button: "Go",
      items: [
        { label: "All Tiles", link: "/products", icon: "sparkles" },
        { label: "Calculator", link: "/tiles-calculator", icon: "calculator" },
        { label: "Catalogue", link: "/catalogue", icon: "book" },
        { label: "Showroom", link: "/store-locator?type=Display+Center", icon: "store" },
      ],
    },
    welcome: {
      eyebrow: "Welcome to",
      primaryLabel: "Explore products",
      primaryLink: "/products",
      secondaryLabel: "Find a store",
      secondaryLink: "/store-locator",
      statProducts: "Tile designs",
      statCategories: "Collections",
      statStores: "Stores & dealers",
      statDivisions: "Divisions served",
    },
    promises: {
      items: [
        { title: "100% genuine", text: "Sourced directly from trusted manufacturers", icon: "badge" },
        { title: "Ready stock", text: "Large inventory for fast fulfilment", icon: "package" },
        { title: "Nationwide delivery", text: "On-time delivery to your site", icon: "truck" },
        { title: "Best price", text: "Transparent dealer & project pricing", icon: "wallet" },
      ],
    },
    featured: { title: "", text: "", allLabel: "Discover All Products", searchLabel: "Advanced Search" },
    categories: { title: "Explore Tiles Collections by Category", cardLabel: "View details", button: "Discover All" },
    calculator: {
      title: "How many tiles do you need?",
      text: "Enter the length and width of your area — get the number of pieces and the price in seconds.",
      button: "Open calculator",
      link: "/tiles-calculator",
    },
    steps: {
      eyebrow: "Simple & quick",
      title: "How Ordering Works",
      items: [
        { title: "Choose a design", text: "Pick the pattern, colour and thickness.", linkLabel: "Browse designs", link: "/products", icon: "grid" },
        { title: "Measure your area", text: "Enter length × width — we work out the pieces.", linkLabel: "Open calculator", link: "/tiles-calculator", icon: "calculator" },
        { title: "Send an order request", text: "No payment now. It takes under a minute.", linkLabel: "Start ordering", link: "/products", icon: "send" },
        { title: "We confirm & deliver", text: "We call with the final price, then deliver to your site.", linkLabel: "Find a store", link: "/store-locator", icon: "package" },
      ],
    },
    recent: { title: "Continue browsing" },
    why: {
      title: "",
      text: "",
      items: [
        { label: "About Us", link: "/about", icon: "lightbulb" },
        { label: "Display Center", link: "/store-locator?type=Display+Center", icon: "map" },
        { label: "Dealer Profile", link: "/store-locator?type=Dealer", icon: "dealer" },
      ],
    },
    popular: {
      title: "Popular",
      items: [
        { title: "Tiles Care", text: "Keep your parking tiles looking new: simple cleaning, re-sanding the joints, removing oil stains and sealing tips that make pavers last for years.", link: "/news?type=Tiles+Care", icon: "sparkles" },
        { title: "Projects", text: "We put versatility and premium quality into every project. Get to know some of our projects across the country.", link: "/projects", icon: "folder" },
        { title: "News & Events", text: "Stay updated with what is happening around us — our latest news, events and updates.", link: "/news", icon: "news" },
      ],
    },
    sustainability: { title: "Sustainability" },
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Only site-relative links, full http(s) URLs, tel: and mailto: are kept. */
export function safeLink(v: unknown) {
  const s = typeof v === "string" ? v.trim().slice(0, 500) : "";
  return /^\/(?!\/)/.test(s) || /^https?:\/\//i.test(s) || /^(tel|mailto):/i.test(s) ? s : "";
}

function cleanValue(f: FieldDef, v: unknown, fallback: string) {
  if (typeof v !== "string") return fallback;
  if (f.type === "link") return safeLink(v);
  if (f.type === "icon") return (HOME_ICONS as readonly string[]).includes(v) ? v : fallback || "star";
  return v.trim().slice(0, f.type === "textarea" ? 600 : 160);
}

/** Merges saved content over the defaults, keeping only known fields. */
export function normalizeHomeContent(raw: unknown): HomeContent {
  const d = defaultHomeContent();
  const src = isObj(raw) ? raw : {};
  const out: HomeContent = {};
  for (const [key, def] of Object.entries(CONTENT_DEFS)) {
    const saved = isObj(src[key]) ? (src[key] as Record<string, unknown>) : {};
    const base = d[key] ?? {};
    const section: SectionContent = {};
    for (const f of def.fields) section[f.key] = cleanValue(f, saved[f.key], (base[f.key] as string) ?? "");
    if (def.list) {
      const list = def.list;
      const items = Array.isArray(saved.items) ? saved.items : base.items ?? [];
      section.items = items
        .filter(isObj)
        .map((it) => Object.fromEntries(list.fields.map((f) => [f.key, cleanValue(f, it[f.key], f.type === "icon" ? "star" : "")])))
        .filter((it) => Object.entries(it).some(([k, v]) => k !== "icon" && v))
        .slice(0, list.max);
    }
    out[key] = section;
  }
  return out;
}
