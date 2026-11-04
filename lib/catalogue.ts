/**
 * Catalogue page: sections, page texts and designed covers.
 * Client-safe: plain data + pure functions.
 */

/** settings-table row holding the page texts and the section list */
export const CATALOGUE_PAGE_KEY = "catalogue-page";

export interface CatalogueSection {
  id: string;
  title: string;
  enabled: boolean;
}

export interface CataloguePage {
  heroTitle: string;
  heroSubtitle: string;
  /** empty = built-in photo */
  heroImage: string;
  sections: CatalogueSection[];
}

/** Drawn cover designs — parking-tile patterns in the brand colours. */
export const COVER_STYLES = [
  { value: "paver", label: "Brick paver" },
  { value: "hexagon", label: "Hexagon paver" },
  { value: "grass", label: "Grass paver" },
  { value: "herringbone", label: "Herringbone" },
  { value: "interlock", label: "Interlocking (I-shape)" },
  { value: "grid", label: "Square grid" },
] as const;
export type CoverStyle = (typeof COVER_STYLES)[number]["value"];

export const COVER_COLORS = [
  { value: "maroon", label: "Maroon", bg: "#760308", ink: "#ffffff", accent: "#c49a45" },
  { value: "charcoal", label: "Charcoal", bg: "#1d1213", ink: "#ffffff", accent: "#c49a45" },
  { value: "cream", label: "Cream", bg: "#f8f2e9", ink: "#760308", accent: "#c49a45" },
  { value: "gold", label: "Gold", bg: "#c49a45", ink: "#1d1213", accent: "#760308" },
  { value: "slate", label: "Slate", bg: "#34404d", ink: "#ffffff", accent: "#c49a45" },
  { value: "green", label: "Green", bg: "#2f5d46", ink: "#ffffff", accent: "#e8c77f" },
] as const;
export type CoverColor = (typeof COVER_COLORS)[number]["value"];

export const coverColor = (c: string) => COVER_COLORS.find((x) => x.value === c) ?? COVER_COLORS[0];

export function defaultCataloguePage(): CataloguePage {
  return {
    heroTitle: "Catalogue",
    heroSubtitle: "Browse and download our parking tile catalogues, specification guides and care manuals.",
    heroImage: "",
    sections: [
      { id: "download", title: "Download", enabled: true },
      { id: "architects", title: "Architects' Choice", enabled: true },
      { id: "manual", title: "Installation & Care Manual", enabled: true },
    ],
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, d: string, max = 200) => (typeof v === "string" ? v.slice(0, max) : d);

export function normalizeCataloguePage(raw: unknown): CataloguePage {
  const d = defaultCataloguePage();
  const r = isObj(raw) ? raw : {};
  const seen = new Set<string>();
  const sections = Array.isArray(r.sections)
    ? r.sections
        .filter(isObj)
        .slice(0, 20)
        .map((s) => ({
          id: typeof s.id === "string" && /^[\w-]{1,40}$/.test(s.id) ? s.id : `s${Math.random().toString(36).slice(2, 8)}`,
          title: str(s.title, "Section", 60).trim() || "Section",
          enabled: s.enabled !== false,
        }))
        .filter((s) => !seen.has(s.id) && seen.add(s.id))
    : d.sections;
  return {
    heroTitle: str(r.heroTitle, d.heroTitle, 80),
    heroSubtitle: str(r.heroSubtitle, d.heroSubtitle, 240),
    heroImage: typeof r.heroImage === "string" && /^(\/|https?:\/\/|$)/.test(r.heroImage) ? r.heroImage.slice(0, 500) : "",
    sections,
  };
}

/** 16023552 → "15.28 MB" */
export function formatBytes(n: number) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/** Starter catalogues for a parking-tile distributor (PDFs are uploaded from the admin). */
export const DEFAULT_CATALOGUES: {
  title: string; subtitle: string; year: number; sections: string[]; coverStyle: CoverStyle; coverColor: CoverColor; description: string;
}[] = [
  { title: "UDH Parking Tiles Catalogue 2026", subtitle: "Complete Collection", year: 2026, sections: ["download"], coverStyle: "paver", coverColor: "maroon", description: "Every parking, driveway and outdoor tile we distribute — sizes, colours, thickness and load ratings." },
  { title: "Heavy-Duty Paver Collection 2026", subtitle: "Trucks & Commercial Parking", year: 2026, sections: ["download"], coverStyle: "interlock", coverColor: "charcoal", description: "High-strength pavers for warehouses, fuel stations and commercial car parks." },
  { title: "Grass Paver & Eco Parking 2025", subtitle: "Green Parking Solutions", year: 2025, sections: ["download"], coverStyle: "grass", coverColor: "green", description: "Permeable grass pavers that let rain soak through while carrying vehicles." },
  { title: "Hexagon Paver Range 2025", subtitle: "Walkways & Courtyards", year: 2025, sections: ["download"], coverStyle: "hexagon", coverColor: "slate", description: "Hexagon pavers for walking areas, courtyards and garden paths." },
  { title: "Rooftop & Terrace Tiles 2025", subtitle: "Heat-Reflective Rooftop Tiles", year: 2025, sections: ["download"], coverStyle: "grid", coverColor: "cream", description: "Anti-skid, heat-reflective tiles for rooftops, terraces and balconies." },
  { title: "Driveway & Car Porch Collection 2024", subtitle: "Driveways · Car Porches", year: 2024, sections: ["download"], coverStyle: "herringbone", coverColor: "gold", description: "Herringbone and brick-pattern tiles for driveways and car porches." },
  { title: "Architects' Choice — Parking Solutions 2026", subtitle: "Specifier's Selection", year: 2026, sections: ["architects"], coverStyle: "interlock", coverColor: "cream", description: "Curated parking and outdoor tiles chosen by architects for large projects." },
  { title: "Commercial Parking Specification Guide", subtitle: "Load Ratings & Layouts", year: 2025, sections: ["architects"], coverStyle: "grid", coverColor: "charcoal", description: "Load classes, base preparation and layout drawings for commercial parking." },
  { title: "Parking Tiles Installation & Care Manual", subtitle: "Installation · Cleaning · Maintenance", year: 2025, sections: ["manual"], coverStyle: "paver", coverColor: "gold", description: "Step-by-step installation, joint sanding, cleaning and maintenance for parking tiles." },
];
