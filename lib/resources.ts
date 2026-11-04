/**
 * Declarative config for every content type the admin panel manages.
 * The generic list / form / server actions are driven entirely by this file,
 * so adding a new content type is just adding a new entry here.
 * (Client-safe: plain data only.)
 */

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multiselect"
  | "image"
  | "images"
  | "file"
  | "boolean"
  | "date"
  | "slug"
  /** colour variants picked from the Tile Colours library */
  | "colors"
  /** priced designs, finishes and sizes (see lib/pricing.ts) */
  | "options";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  /** Static options for select / multiselect */
  options?: string[];
  /** Options loaded from another collection: value = id, label = name/title */
  source?: "categories" | "catalogueSections";
  /** For slug fields: the field it is generated from */
  from?: string;
  /** Layout: span both columns */
  full?: boolean;
  /** Group heading shown in the form sidebar vs main column */
  side?: boolean;
  min?: number;
}

export type ColumnType = "image" | "text" | "badge" | "boolean" | "date" | "ref" | "number" | "swatches";

export interface ColumnDef {
  key: string;
  label: string;
  type?: ColumnType;
}

export interface ResourceDef {
  key: ResourceKey;
  label: string;
  singular: string;
  description: string;
  titleField: string;
  searchFields: string[];
  columns: ColumnDef[];
  fields: FieldDef[];
  defaultSort: { key: string; dir: "asc" | "desc" };
  /** public path to revalidate / preview, `:slug` replaced */
  publicPath?: string;
  filters?: { key: string; label: string; options?: string[]; source?: "categories" }[];
}

export const FINISHES = ["Polished", "Glossy", "Satin", "Matt", "Rustic", "Lappato"];
export const APPLICATIONS = [
  "Floor", "Wall", "Kitchen", "Bathroom", "Living Room", "Bedroom", "Dining Room", "Balcony", "Staircase",
  "Rooftop", "Parking Area", "Walking Area", "Driveway", "Car Porch", "Garden & Lawn", "Swimming Pool", "Outdoor", "Commercial",
];
export const SIZES = ["20x120 cm", "30x60 cm", "40x40 cm", "60x60 cm", "60x120 cm", "80x80 cm", "80x160 cm", "120x240 cm"];
export const DIVISIONS = ["Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi", "Barishal", "Rangpur", "Mymensingh"];

const activeField: FieldDef = { name: "active", label: "Published", type: "boolean", side: true, help: "Visible on the website" };

export const RESOURCES = {
  products: {
    key: "products",
    label: "Products",
    singular: "Product",
    description: "Every tile in the catalogue, with specs, gallery and visibility.",
    titleField: "name",
    searchFields: ["name", "code", "color", "size"],
    defaultSort: { key: "updatedAt", dir: "desc" },
    publicPath: "/products/:slug",
    columns: [
      { key: "images", label: "", type: "image" },
      { key: "name", label: "Name" },
      { key: "code", label: "Code" },
      { key: "categoryId", label: "Category", type: "ref" },
      { key: "size", label: "Size", type: "badge" },
      { key: "colorVariants", label: "Colours", type: "swatches" },
      { key: "views", label: "Views", type: "number" },
      { key: "featured", label: "Featured", type: "boolean" },
      { key: "active", label: "Status", type: "boolean" },
    ],
    filters: [
      { key: "categoryId", label: "Category", source: "categories" },
      { key: "finish", label: "Finish", options: FINISHES },
      { key: "size", label: "Size", options: SIZES },
    ],
    fields: [
      { name: "name", label: "Product name", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "slug", from: "name" },
      { name: "code", label: "Product code / SKU", type: "text", required: true, placeholder: "NCP-6060-01" },
      { name: "categoryId", label: "Category", type: "select", source: "categories", required: true },
      { name: "finish", label: "Finish", type: "select", options: FINISHES },
      { name: "applications", label: "Application areas", type: "multiselect", options: APPLICATIONS, full: true },
      { name: "options", label: "Variations", type: "options", full: true, help: "Each row is one design + colour + size + thickness with its own price and photos. The first row is shown first on the website." },
      { name: "description", label: "Description", type: "textarea", full: true },
      { name: "images", label: "Gallery", type: "images", full: true, help: "First image is the cover" },
      activeField,
      { name: "featured", label: "Featured on home", type: "boolean", side: true },
      { name: "isNew", label: "New arrival badge", type: "boolean", side: true },
    ],
  },
  categories: {
    key: "categories",
    label: "Categories",
    singular: "Category",
    description: "Collections shown in the category carousel and product filters.",
    titleField: "name",
    searchFields: ["name", "slug"],
    defaultSort: { key: "order", dir: "asc" },
    publicPath: "/products?category=:slug",
    columns: [
      { key: "image", label: "", type: "image" },
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
      { key: "order", label: "Order", type: "number" },
      { key: "active", label: "Status", type: "boolean" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "slug", from: "name" },
      { name: "description", label: "Description", type: "textarea", full: true },
      { name: "image", label: "Cover image", type: "image", full: true },
      { name: "order", label: "Sort order", type: "number", side: true },
      activeField,
    ],
  },
  slides: {
    key: "slides",
    label: "Hero Slider",
    singular: "Slide",
    description: "Full-width banners at the top of the home page.",
    titleField: "title",
    searchFields: ["title", "subtitle"],
    defaultSort: { key: "order", dir: "asc" },
    columns: [
      { key: "image", label: "", type: "image" },
      { key: "title", label: "Title" },
      { key: "ctaLink", label: "Link" },
      { key: "order", label: "Order", type: "number" },
      { key: "active", label: "Status", type: "boolean" },
    ],
    fields: [
      { name: "title", label: "Headline", type: "text", help: "Optional — leave empty for an image-only slide" },
      { name: "subtitle", label: "Sub headline", type: "text" },
      { name: "ctaLabel", label: "Button label", type: "text", placeholder: "Find out more" },
      { name: "ctaLink", label: "Button link", type: "text", placeholder: "/products" },
      { name: "image", label: "Background image", type: "image", required: true, full: true, help: "Landscape, at least 1920×900" },
      { name: "order", label: "Sort order", type: "number", side: true },
      activeField,
    ],
  },
  stores: {
    key: "stores",
    label: "Store Locator",
    singular: "Store",
    description: "Display centers and dealers listed on the store locator.",
    titleField: "name",
    searchFields: ["name", "address", "division", "phone"],
    defaultSort: { key: "division", dir: "asc" },
    columns: [
      { key: "name", label: "Name" },
      { key: "type", label: "Type", type: "badge" },
      { key: "division", label: "Division" },
      { key: "phone", label: "Phone" },
      { key: "active", label: "Status", type: "boolean" },
    ],
    filters: [
      { key: "type", label: "Type", options: ["Display Center", "Dealer"] },
      { key: "division", label: "Division", options: DIVISIONS },
    ],
    fields: [
      { name: "name", label: "Store name", type: "text", required: true },
      { name: "type", label: "Type", type: "select", options: ["Display Center", "Dealer"], required: true },
      { name: "division", label: "Division", type: "select", options: DIVISIONS, required: true },
      { name: "phone", label: "Phone", type: "text" },
      { name: "address", label: "Address", type: "textarea", full: true, required: true },
      { name: "mapUrl", label: "Google Maps link", type: "text", full: true },
      activeField,
    ],
  },
  news: {
    key: "news",
    label: "News & Blog",
    singular: "Post",
    description: "News, events and tiles-care articles.",
    titleField: "title",
    searchFields: ["title", "excerpt"],
    defaultSort: { key: "publishedAt", dir: "desc" },
    publicPath: "/news/:slug",
    columns: [
      { key: "image", label: "", type: "image" },
      { key: "title", label: "Title" },
      { key: "type", label: "Type", type: "badge" },
      { key: "publishedAt", label: "Published", type: "date" },
      { key: "active", label: "Status", type: "boolean" },
    ],
    filters: [{ key: "type", label: "Type", options: ["News", "Event", "Tiles Care"] }],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, full: true },
      { name: "slug", label: "URL slug", type: "slug", from: "title" },
      { name: "type", label: "Type", type: "select", options: ["News", "Event", "Tiles Care"], required: true },
      { name: "excerpt", label: "Excerpt", type: "textarea", full: true },
      { name: "content", label: "Content", type: "textarea", full: true, help: "Separate paragraphs with a blank line" },
      { name: "image", label: "Cover image", type: "image", full: true },
      { name: "publishedAt", label: "Publish date", type: "date", side: true },
      activeField,
    ],
  },
  projects: {
    key: "projects",
    label: "Projects",
    singular: "Project",
    description: "Reference projects that used your tiles.",
    titleField: "title",
    searchFields: ["title", "client", "location"],
    defaultSort: { key: "year", dir: "desc" },
    columns: [
      { key: "image", label: "", type: "image" },
      { key: "title", label: "Title" },
      { key: "client", label: "Client" },
      { key: "location", label: "Location" },
      { key: "year", label: "Year", type: "number" },
      { key: "active", label: "Status", type: "boolean" },
    ],
    fields: [
      { name: "title", label: "Project name", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "slug", from: "title" },
      { name: "client", label: "Client", type: "text" },
      { name: "location", label: "Location", type: "text" },
      { name: "year", label: "Year", type: "number" },
      { name: "description", label: "Description", type: "textarea", full: true },
      { name: "image", label: "Image", type: "image", full: true },
      activeField,
    ],
  },
  catalogues: {
    key: "catalogues",
    label: "Catalogues",
    singular: "Catalogue",
    description: "Downloadable PDF catalogues, grouped into sections on the Catalogue page.",
    titleField: "title",
    searchFields: ["title", "subtitle", "description"],
    defaultSort: { key: "order", dir: "asc" },
    publicPath: "/catalogue",
    columns: [
      { key: "cover", label: "", type: "image" },
      { key: "title", label: "Title" },
      { key: "year", label: "Year", type: "number" },
      { key: "downloads", label: "Downloads", type: "number" },
      { key: "order", label: "Order", type: "number" },
      { key: "active", label: "Status", type: "boolean" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, full: true, placeholder: "UDH Parking Tiles Catalogue 2026" },
      { name: "subtitle", label: "Subtitle", type: "text", placeholder: "Complete Collection", help: "Small line on the designed cover" },
      { name: "year", label: "Year", type: "number" },
      { name: "sections", label: "Show in sections", type: "multiselect", source: "catalogueSections", full: true, help: "Sections are managed under “Page & sections”. None ticked = the first section." },
      { name: "description", label: "Description", type: "textarea", full: true, help: "Optional — shown on hover and to search engines" },
      { name: "coverStyle", label: "Designed cover pattern", type: "select", options: ["paver", "hexagon", "grass", "herringbone", "interlock", "grid"], help: "Used when no cover image is uploaded" },
      { name: "coverColor", label: "Designed cover colour", type: "select", options: ["maroon", "charcoal", "cream", "gold", "slate", "green"] },
      { name: "fileUrl", label: "PDF file", type: "file", full: true, help: "Upload a PDF or paste a link — the file size is worked out automatically" },
      { name: "cover", label: "Cover image (optional)", type: "image", full: true, help: "Leave empty to use the designed cover" },
      { name: "order", label: "Sort order", type: "number", side: true },
      activeField,
    ],
  },
  sustainability: {
    key: "sustainability",
    label: "Sustainability",
    singular: "Story",
    description: "Slides in the home page sustainability section.",
    titleField: "title",
    searchFields: ["title", "heading"],
    defaultSort: { key: "order", dir: "asc" },
    columns: [
      { key: "image", label: "", type: "image" },
      { key: "title", label: "Title" },
      { key: "heading", label: "Overlay heading" },
      { key: "order", label: "Order", type: "number" },
      { key: "active", label: "Status", type: "boolean" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "heading", label: "Image overlay heading", type: "text" },
      { name: "body", label: "Body", type: "textarea", full: true },
      { name: "image", label: "Image", type: "image", full: true },
      { name: "order", label: "Sort order", type: "number", side: true },
      activeField,
    ],
  },
} satisfies Record<string, Omit<ResourceDef, "key"> & { key: string }>;

export type ResourceKey = keyof typeof RESOURCES;

export function getResource(key: string): ResourceDef | null {
  return key in RESOURCES ? (RESOURCES[key as ResourceKey] as ResourceDef) : null;
}
