/**
 * Home page "Which thickness do I need?" guide — set in Admin → Thickness Guide.
 * Client-safe: plain data + pure functions.
 */

export const HOME_THICKNESS_KEY = "home-thickness";

/** icons the admin can pick for a card */
export const THICKNESS_ICONS = [
  { value: "walk", label: "People / walking" },
  { value: "bike", label: "Bicycle / motorbike" },
  { value: "car", label: "Car" },
  { value: "bus", label: "Bus" },
  { value: "truck", label: "Truck" },
  { value: "factory", label: "Factory" },
] as const;

export interface ThicknessCard {
  id: string;
  /** block thickness in mm (also sets the height of the drawing) */
  mm: number;
  title: string;
  icon: string;
  /** the heaviest load, e.g. "Cars, pickups & small vans" */
  load: string;
  /** where it is used — one per line */
  uses: string[];
  /** highlighted with a "Most popular" badge */
  popular: boolean;
  enabled: boolean;
}

export interface HomeThickness {
  title: string;
  subtitle: string;
  /** small line under the cards */
  note: string;
  linkLabel: string;
  linkHref: string;
  /** badge text on the highlighted card */
  badge: string;
  cards: ThicknessCard[];
}

export function defaultHomeThickness(): HomeThickness {
  return {
    title: "Which Thickness Do I Need?",
    subtitle: "Parking tiles are chosen by what will drive or walk on them. Pick the thickness for the heaviest load your area takes.",
    note: "Layers: paver block on a 30–50 mm sand bed over a compacted stone base.",
    linkLabel: "Not sure? Ask our team",
    linkHref: "/contact",
    badge: "Most popular",
    cards: [
      { id: "t60", mm: 60, title: "Walkways & light use", icon: "walk", load: "People, bicycles & motorbikes", uses: ["Footpaths & walkways", "Gardens & lawns", "Rooftops & pool sides"], popular: false, enabled: true },
      { id: "t80", mm: 80, title: "Car parking & driveways", icon: "car", load: "Cars, pickups & small vans", uses: ["Car parking & car porch", "Driveways & garages", "Housing societies"], popular: true, enabled: true },
      { id: "t100", mm: 100, title: "Heavy duty", icon: "truck", load: "Trucks, buses & loaders", uses: ["Factory & warehouse yards", "Loading bays & depots", "Petrol pumps & bus stands"], popular: false, enabled: true },
    ],
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, d: string, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : d);
const safeLink = (v: unknown) => {
  const s = str(v, "", 500);
  return /^\/(?!\/)/.test(s) || /^https?:\/\//i.test(s) ? s : "";
};

export function normalizeHomeThickness(raw: unknown): HomeThickness {
  const d = defaultHomeThickness();
  if (!isObj(raw)) return d;
  const icons = THICKNESS_ICONS.map((i) => i.value as string);
  const cards = Array.isArray(raw.cards)
    ? raw.cards
        .filter(isObj)
        .map((c, i) => ({
          id: str(c.id, `t${i}`, 40) || `t${i}`,
          mm: Math.min(300, Math.max(10, Math.round(Number(c.mm)) || 60)),
          title: str(c.title, ""),
          icon: icons.includes(String(c.icon)) ? String(c.icon) : "walk",
          load: str(c.load, ""),
          uses: (Array.isArray(c.uses) ? c.uses : []).map((u) => str(u, "", 120)).filter(Boolean).slice(0, 8),
          popular: c.popular === true,
          enabled: typeof c.enabled === "boolean" ? c.enabled : true,
        }))
        .filter((c) => c.title)
        .slice(0, 6)
    : d.cards;
  return {
    title: str(raw.title, d.title, 120),
    subtitle: str(raw.subtitle, d.subtitle, 400),
    note: str(raw.note, d.note, 300),
    linkLabel: str(raw.linkLabel, d.linkLabel, 80),
    linkHref: safeLink(raw.linkHref),
    badge: str(raw.badge, d.badge, 40),
    cards,
  };
}
