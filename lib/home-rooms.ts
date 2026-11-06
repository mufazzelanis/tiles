/**
 * Home page "Shop by Room" section — set in Admin → Shop by Room.
 * Client-safe: plain data + pure functions.
 */

/** settings-table row */
export const HOME_ROOMS_KEY = "home-rooms";

export interface HomeRoom {
  id: string;
  name: string;
  /** product "Application area" the tile links to and counts */
  application: string;
  image: string;
  enabled: boolean;
}

export interface HomeRooms {
  enabled: boolean;
  title: string;
  /** hide rooms that have no products yet (so the site never shows "0 designs") */
  hideEmpty: boolean;
  /** show the "N designs" line under each room */
  showCount: boolean;
  rooms: HomeRoom[];
}

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=80`;

export function defaultHomeRooms(): HomeRooms {
  return {
    enabled: true,
    title: "Shop by Room",
    hideEmpty: true,
    showCount: true,
    rooms: [
      { id: "living", name: "Living Room", application: "Living Room", image: unsplash("1618220179428-22790b461013"), enabled: true },
      { id: "bath", name: "Bathroom", application: "Bathroom", image: unsplash("1620626011761-996317b8d101"), enabled: true },
      { id: "kitchen", name: "Kitchen", application: "Kitchen", image: unsplash("1600566753190-17f0baa2a6c3"), enabled: true },
      { id: "bed", name: "Bedroom", application: "Bedroom", image: unsplash("1505691938895-1758d7feb511"), enabled: true },
      { id: "outdoor", name: "Outdoor", application: "Outdoor", image: unsplash("1600047509807-ba8f99d2cdde"), enabled: true },
      { id: "commercial", name: "Commercial", application: "Commercial", image: unsplash("1600210492486-724fe5c67fb0"), enabled: true },
    ],
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, d: string, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : d);
const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);

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
