/**
 * Home page "Shop by area" section — set in Admin → Shop by Area.
 * (Stored under the old "home-rooms" key so earlier saves keep working.)
 * Client-safe: plain data + pure functions.
 */

/** settings-table row */
export const HOME_ROOMS_KEY = "home-rooms";

export interface HomeRoom {
  id: string;
  name: string;
  /** product "Application area" the tile links to and counts */
  application: string;
  /** photo; empty = drawn paver pattern */
  image: string;
  /** paver pattern + colour drawn when there is no photo */
  pattern: string;
  color: string;
  enabled: boolean;
}

export interface HomeRooms {
  /** kept for older saves; the section is switched on/off in Admin → Home page */
  enabled: boolean;
  title: string;
  /** hide areas that have no products yet (so the site never shows "0 designs") */
  hideEmpty: boolean;
  /** show the "N designs" line under each area */
  showCount: boolean;
  rooms: HomeRoom[];
}

export function defaultHomeRooms(): HomeRooms {
  const area = (id: string, name: string, application: string, pattern: string, color: string): HomeRoom => ({ id, name, application, image: "", pattern, color, enabled: true });
  return {
    enabled: true,
    title: "Shop by Area",
    hideEmpty: true,
    showCount: true,
    rooms: [
      area("parking", "Car Parking", "Parking Area", "interlock", "maroon"),
      area("driveway", "Driveway", "Driveway", "paver", "charcoal"),
      area("walkway", "Walkway", "Walking Area", "herringbone", "cream"),
      area("rooftop", "Rooftop", "Rooftop", "grid", "slate"),
      area("garden", "Garden & Lawn", "Garden & Lawn", "grass", "green"),
      area("commercial", "Commercial", "Commercial", "hexagon", "gold"),
    ],
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, d: string, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : d);
const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
const PATTERNS = ["paver", "hexagon", "grass", "herringbone", "interlock", "grid"];
const COLORS = ["maroon", "charcoal", "cream", "gold", "slate", "green"];

/** Fills gaps and drops anything malformed (also used to validate what the admin saves). */
export function normalizeHomeRooms(raw: unknown): HomeRooms {
  const d = defaultHomeRooms();
  if (!isObj(raw)) return d;
  const rooms = Array.isArray(raw.rooms)
    ? raw.rooms
        .filter(isObj)
        .map((r, i) => ({
          id: str(r.id, `r${i}`, 40) || `r${i}`,
          name: str(r.name, ""),
          application: str(r.application, ""),
          image: str(r.image, "", 2000),
          pattern: PATTERNS.includes(String(r.pattern)) ? String(r.pattern) : PATTERNS[i % PATTERNS.length],
          color: COLORS.includes(String(r.color)) ? String(r.color) : COLORS[i % COLORS.length],
          enabled: bool(r.enabled, true),
        }))
        .filter((r) => r.name)
        .slice(0, 24)
    : d.rooms;
  return {
    enabled: bool(raw.enabled, d.enabled),
    title: str(raw.title, d.title, 120),
    hideEmpty: bool(raw.hideEmpty, d.hideEmpty),
    showCount: bool(raw.showCount, d.showCount),
    rooms,
  };
}
