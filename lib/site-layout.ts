/**
 * Admin-editable header, footer, floating buttons and contact form.
 * Stored inside the site settings JSON; `normalizeLayout` fills anything missing
 * with defaults so older databases and partial saves always render.
 * Client-safe: plain data + pure functions.
 */

/** settings-table row that stores the layout JSON */
export const LAYOUT_KEY = "layout";

export const ICON_KEYS = [
  "none", "search", "store", "download", "calculator", "folder", "news", "home", "info", "phone", "mail", "map-pin",
  "package", "palette", "heart", "book", "tag", "sparkles", "star", "percent", "truck", "gift", "grid", "layers",
  "bag", "message", "award", "building",
] as const;
export type IconKey = (typeof ICON_KEYS)[number];

export interface NavLink {
  id: string;
  label: string;
  href: string;
  icon: IconKey;
  /** small label under/next to the link, e.g. "Try now" or "New" */
  badge: string;
  newTab: boolean;
  enabled: boolean;
}

export interface HeaderConfig {
  leftLinks: NavLink[];
  rightLinks: NavLink[];
  showFavorites: boolean;
  showSearch: boolean;
  searchTitle: string;
  searchPlaceholder: string;
  searchSuggestions: string[];
  /** strip above the header */
  announcement: { enabled: boolean; text: string; linkLabel: string; href: string; background: string; color: string };
  /** custom logos (empty = built-in brand files) */
  logoSeal: string;
  logoMark: string;
  /** slide-out menu (hamburger / phones) */
  drawer: {
    showCollections: boolean;
    collectionsTitle: string;
    linksTitle: string;
    links: NavLink[];
    showCall: boolean;
    showWhatsApp: boolean;
  };
}

export interface FooterColumn {
  id: string;
  title: string;
  links: NavLink[];
  enabled: boolean;
}

export interface FooterConfig {
  showLogo: boolean;
  /** empty = company name / tagline from Brand settings */
  title: string;
  subtitle: string;
  about: string;
  showSocial: boolean;
  socialTitle: string;
  showPhone: boolean;
  showEmail: boolean;
  columns: FooterColumn[];
  /** address-style blocks on the right; {office} / {factory} pull from Brand settings */
  infoBlocks: { id: string; title: string; text: string; enabled: boolean }[];
  /** {year} and {site} are replaced */
  copyright: string;
  bottomLinks: NavLink[];
  showBackToTop: boolean;
  background: string;
}

export interface FloatingConfig {
  whatsapp: boolean;
  whatsappNumber: string;
  whatsappMessage: string;
  whatsappLabel: string;
}

export type FormFieldType = "text" | "email" | "tel" | "number" | "textarea" | "select" | "radio" | "checkbox" | "date" | "color";

export interface FormField {
  id: string;
  /** built-in fields map to inquiry columns; custom ones are stored as extra answers */
  key: string;
  builtIn: boolean;
  type: FormFieldType;
  label: string;
  placeholder: string;
  help: string;
  required: boolean;
  enabled: boolean;
  width: "full" | "half";
  options: string[];
}

export interface ContactFormConfig {
  title: string;
  intro: string;
  submitLabel: string;
  successMessage: string;
  fields: FormField[];
}

export interface SiteLayout {
  header: HeaderConfig;
  footer: FooterConfig;
  floating: FloatingConfig;
  contactForm: ContactFormConfig;
}

/* ------------------------------------------------------------ defaults */

let seq = 0;
const link = (label: string, href: string, icon: IconKey = "none", badge = ""): NavLink => ({
  id: `l${++seq}`, label, href, icon, badge, newTab: false, enabled: true,
});
const field = (key: string, type: FormFieldType, label: string, extra: Partial<FormField> = {}): FormField => ({
  id: `f-${key}`, key, builtIn: true, type, label, placeholder: "", help: "", required: false, enabled: true, width: "full", options: [], ...extra,
});

/** Built-in contact form fields (they map to inquiry columns and can't be deleted). */
export const BUILT_IN_FIELDS = ["name", "phone", "email", "subject", "colorId", "message"] as const;

export function defaultLayout(): SiteLayout {
  seq = 0;
  return {
    header: {
      leftLinks: [link("Product", "/products", "search"), link("Store Locator", "/store-locator", "store"), link("Catalogue", "/catalogue", "download")],
      rightLinks: [link("Tiles Calculator", "/tiles-calculator", "calculator", "Try now"), link("Projects", "/projects", "folder"), link("News", "/news", "news")],
      showFavorites: true,
      showSearch: true,
      searchTitle: "Search tiles",
      searchPlaceholder: "Name, code, colour, size…",
      searchSuggestions: ["Marble", "60x60 cm", "Bathroom", "Wood", "Glossy", "Outdoor"],
      announcement: { enabled: false, text: "Free delivery inside Dhaka on orders above 100 boxes", linkLabel: "Shop now", href: "/products", background: "#c49a45", color: "#ffffff" },
      logoSeal: "",
      logoMark: "",
      drawer: {
        showCollections: true,
        collectionsTitle: "Collections",
        linksTitle: "Explore",
        links: [
          link("Home", "/"), link("All Products", "/products"), link("Store Locator", "/store-locator"), link("Catalogue", "/catalogue"),
          link("Tiles Calculator", "/tiles-calculator"), link("Projects", "/projects"), link("News & Events", "/news"),
          link("Tiles Care", "/news?type=Tiles+Care"), link("About Us", "/about"), link("Contact Us", "/contact"),
        ],
        showCall: true,
        showWhatsApp: true,
      },
    },
    footer: {
      showLogo: true,
      title: "",
      subtitle: "",
      about: "",
      showSocial: true,
      socialTitle: "Follow us",
      showPhone: true,
      showEmail: true,
      columns: [
        {
          id: "c1", title: "Quick Links", enabled: true,
          links: [
            link("All Products", "/products"), link("Download", "/catalogue"), link("Display Center", "/store-locator?type=Display+Center"),
            link("Dealer Profile", "/store-locator?type=Dealer"), link("Latest Collection", "/products?sort=new"), link("Tiles Calculator", "/tiles-calculator"), link("Blog", "/news"),
          ],
        },
        {
          id: "c2", title: "About Us", enabled: true,
          links: [link("About Us", "/about"), link("Why Choose Us", "/about#why"), link("News And Events", "/news"), link("Tiles Care", "/news?type=Tiles+Care"), link("Our Projects", "/projects")],
        },
        {
          id: "c3", title: "Customer Service", enabled: true,
          links: [link("Contact Us", "/contact"), link("Store Locator", "/store-locator"), link("Tiles Calculator", "/tiles-calculator")],
        },
      ],
      infoBlocks: [
        { id: "b1", title: "Corporate Office", text: "{office}", enabled: true },
        { id: "b2", title: "Factory", text: "{factory}", enabled: true },
      ],
      copyright: "© {year} {site} Limited. All rights reserved.",
      bottomLinks: [link("Privacy Policy", "/about"), link("Terms And Conditions", "/about")],
      showBackToTop: true,
      background: "",
    },
    floating: { whatsapp: true, whatsappNumber: "", whatsappMessage: "Hi, I am interested in your tiles.", whatsappLabel: "Chat with us" },
    contactForm: {
      title: "Send us a message",
      intro: "",
      submitLabel: "Send inquiry",
      successMessage: "Thank you! Our team will contact you within one working day.",
      fields: [
        field("name", "text", "Full name", { required: true, width: "half", placeholder: "" }),
        field("phone", "tel", "Phone", { width: "half" }),
        field("email", "email", "Email", { required: true }),
        field("subject", "text", "Subject"),
        field("colorId", "color", "Interested in a colour?"),
        field("message", "textarea", "Message", { required: true }),
      ],
    },
  };
}

/* ---------------------------------------------------------- normalize */

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, d: string, max = 500) => (typeof v === "string" ? v.slice(0, max) : d);
const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
const color = (v: unknown, d: string) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : d);
let uid = 0;
const id = (v: unknown, prefix: string) => (typeof v === "string" && v ? v.slice(0, 40) : `${prefix}${Date.now().toString(36)}${++uid}`);

/** Only site paths, anchors, mail/phone and http(s) URLs. */
export function safeHref(v: unknown, d = "/") {
  const h = typeof v === "string" ? v.trim() : "";
  return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(h) ? h.slice(0, 500) : d;
}

function links(v: unknown, d: NavLink[], max = 30): NavLink[] {
  if (!Array.isArray(v)) return d;
  return v.filter(isObj).slice(0, max).map((l) => ({
    id: id(l.id, "l"),
    label: str(l.label, "Link", 60),
    href: safeHref(l.href),
    icon: (ICON_KEYS as readonly string[]).includes(String(l.icon)) ? (l.icon as IconKey) : "none",
    badge: str(l.badge, "", 20),
    newTab: bool(l.newTab, false),
    enabled: bool(l.enabled, true),
  }));
}

const FIELD_TYPES: FormFieldType[] = ["text", "email", "tel", "number", "textarea", "select", "radio", "checkbox", "date", "color"];

function fields(v: unknown, d: FormField[]): FormField[] {
  if (!Array.isArray(v)) return d;
  const out: FormField[] = [];
  const seen = new Set<string>();
  for (const f of v.filter(isObj).slice(0, 30)) {
    const builtIn = (BUILT_IN_FIELDS as readonly string[]).includes(String(f.key));
    const key = builtIn ? String(f.key) : `x_${String(f.key ?? "").replace(/^x_/, "").replace(/[^a-z0-9_]/gi, "").slice(0, 30) || Date.now().toString(36)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const def = d.find((x) => x.key === key);
    // built-in fields keep their input type (the server relies on it)
    const type = builtIn && def ? def.type : FIELD_TYPES.includes(f.type as FormFieldType) && f.type !== "color" ? (f.type as FormFieldType) : "text";
    out.push({
      id: id(f.id, "f"),
      key,
      builtIn,
      type,
      label: str(f.label, def?.label ?? "Field", 80),
      placeholder: str(f.placeholder, "", 120),
      help: str(f.help, "", 200),
      // the name is always asked for — every inquiry needs one
      required: key === "name" ? true : bool(f.required, false),
      enabled: key === "name" ? true : bool(f.enabled, true),
      width: f.width === "half" ? "half" : "full",
      options: Array.isArray(f.options) ? f.options.map((o) => String(o).slice(0, 80)).filter(Boolean).slice(0, 30) : [],
    });
  }
  // built-ins can be hidden but never lost
  for (const b of d) if (b.builtIn && !seen.has(b.key)) out.push({ ...b, enabled: false });
  return out;
}

export function normalizeLayout(raw: unknown): SiteLayout {
  const d = defaultLayout();
  const r = isObj(raw) ? raw : {};
  const h = isObj(r.header) ? r.header : {};
  const ann = isObj(h.announcement) ? h.announcement : {};
  const dr = isObj(h.drawer) ? h.drawer : {};
  const f = isObj(r.footer) ? r.footer : {};
  const fl = isObj(r.floating) ? r.floating : {};
  const c = isObj(r.contactForm) ? r.contactForm : {};

  return {
    header: {
      leftLinks: links(h.leftLinks, d.header.leftLinks, 8),
      rightLinks: links(h.rightLinks, d.header.rightLinks, 8),
      showFavorites: bool(h.showFavorites, d.header.showFavorites),
      showSearch: bool(h.showSearch, d.header.showSearch),
      searchTitle: str(h.searchTitle, d.header.searchTitle, 60),
      searchPlaceholder: str(h.searchPlaceholder, d.header.searchPlaceholder, 80),
      searchSuggestions: Array.isArray(h.searchSuggestions) ? h.searchSuggestions.map((s) => String(s).slice(0, 40)).filter(Boolean).slice(0, 12) : d.header.searchSuggestions,
      announcement: {
        enabled: bool(ann.enabled, d.header.announcement.enabled),
        text: str(ann.text, d.header.announcement.text, 200),
        linkLabel: str(ann.linkLabel, d.header.announcement.linkLabel, 40),
        href: ann.href === "" ? "" : safeHref(ann.href, d.header.announcement.href),
        background: color(ann.background, d.header.announcement.background),
        color: color(ann.color, d.header.announcement.color),
      },
      logoSeal: str(h.logoSeal, "", 500),
      logoMark: str(h.logoMark, "", 500),
      drawer: {
        showCollections: bool(dr.showCollections, d.header.drawer.showCollections),
        collectionsTitle: str(dr.collectionsTitle, d.header.drawer.collectionsTitle, 40),
        linksTitle: str(dr.linksTitle, d.header.drawer.linksTitle, 40),
        links: links(dr.links, d.header.drawer.links),
        showCall: bool(dr.showCall, d.header.drawer.showCall),
        showWhatsApp: bool(dr.showWhatsApp, d.header.drawer.showWhatsApp),
      },
    },
    footer: {
      showLogo: bool(f.showLogo, d.footer.showLogo),
      title: str(f.title, "", 80),
      subtitle: str(f.subtitle, "", 80),
      about: str(f.about, "", 600),
      showSocial: bool(f.showSocial, d.footer.showSocial),
      socialTitle: str(f.socialTitle, d.footer.socialTitle, 40),
      showPhone: bool(f.showPhone, d.footer.showPhone),
      showEmail: bool(f.showEmail, d.footer.showEmail),
      columns: Array.isArray(f.columns)
        ? f.columns.filter(isObj).slice(0, 5).map((col) => ({ id: id(col.id, "c"), title: str(col.title, "Links", 40), enabled: bool(col.enabled, true), links: links(col.links, []) }))
        : d.footer.columns,
      infoBlocks: Array.isArray(f.infoBlocks)
        ? f.infoBlocks.filter(isObj).slice(0, 4).map((b) => ({ id: id(b.id, "b"), title: str(b.title, "", 40), text: str(b.text, "", 500), enabled: bool(b.enabled, true) }))
        : d.footer.infoBlocks,
      copyright: str(f.copyright, d.footer.copyright, 200),
      bottomLinks: links(f.bottomLinks, d.footer.bottomLinks, 6),
      showBackToTop: bool(f.showBackToTop, d.footer.showBackToTop),
      background: f.background === "" ? "" : color(f.background, d.footer.background),
    },
    floating: {
      whatsapp: bool(fl.whatsapp, d.floating.whatsapp),
      whatsappNumber: str(fl.whatsappNumber, "", 30),
      whatsappMessage: str(fl.whatsappMessage, d.floating.whatsappMessage, 200),
      whatsappLabel: str(fl.whatsappLabel, d.floating.whatsappLabel, 40),
    },
    contactForm: {
      title: str(c.title, d.contactForm.title, 80),
      intro: str(c.intro, "", 300),
      submitLabel: str(c.submitLabel, d.contactForm.submitLabel, 40),
      successMessage: str(c.successMessage, d.contactForm.successMessage, 300),
      fields: fields(c.fields, d.contactForm.fields),
    },
  };
}

/** "{year}" / "{site}" placeholders used in footer text. */
export const fillTokens = (text: string, site: string) => text.replace(/\{year\}/g, String(new Date().getFullYear())).replace(/\{site\}/g, site);
