import { cache } from "react";
import { getDb, getSetting } from "./db";
import { LAYOUT_KEY, normalizeLayout } from "./site-layout";
import { CATALOGUE_PAGE_KEY, normalizeCataloguePage } from "./catalogue";
import { HOME_ROOMS_KEY, normalizeHomeRooms } from "./home-rooms";
import { toSwatch, type SwatchColor } from "./colors";
import type { Product } from "./types";
import { priceRange, pricedProduct, sizeLabel, thicknessLabel, type PricedProduct } from "./pricing";

const unique = (list: string[]) => [...new Set(list.filter(Boolean))];

/** A published product with its published colours resolved (admin order) and its pricing. */
export type SiteProduct = Product & {
  swatches: (SwatchColor & { photo: string; description: string; extra: number })[];
  priced: PricedProduct;
  /** cheapest / dearest box price over every option combination */
  range: { min: number; max: number; varies: boolean };
  /** every size / thickness / design / finish on offer (for filters and specs) */
  sizes: string[];
  thicknesses: string[];
  /** tile sizes as the admin wrote them, e.g. "12x12" */
  sqfts: string[];
  designs: string[];
  finishes: string[];
};

/** Public-facing reads: only published rows, sorted for display. */
export async function getSite() {
  const db = await getDb();
  const byOrder = <T extends { order: number; active: boolean }>(list: T[]) =>
    list.filter((x) => x.active).sort((a, b) => a.order - b.order);
  const categories = byOrder(db.categories);
  const colors = byOrder(db.colors);
  const colorById = new Map(colors.map((c) => [c.id, c]));
  const products: SiteProduct[] = db.products
    .filter((p) => p.active)
    .map((p) => {
      const priced = pricedProduct(p, colorById);
      return {
        ...p,
        // hidden or deleted colours are dropped; "photo" is the product shot in that colour
        swatches: p.colorVariants.flatMap((v) => {
          const c = colorById.get(v.colorId);
          return c ? [{ ...toSwatch(c), description: c.description, photo: v.image, extra: v.extra ?? 0 }] : [];
        }),
        priced,
        range: priceRange(priced),
        sizes: unique(priced.variations.map((v) => sizeLabel(v, priced.unit))),
        thicknesses: unique(priced.variations.map((v) => thicknessLabel(v.thickness))),
        sqfts: unique(priced.variations.map((v) => v.sqft)),
        designs: unique(priced.variations.map((v) => v.design)),
        finishes: [p.finish].filter(Boolean),
      };
    });
  return {
    settings: db.settings,
    categories,
    categoryById: new Map(categories.map((c) => [c.id, c])),
    colors,
    colorById,
    products,
    slides: byOrder(db.slides),
    sustainability: byOrder(db.sustainability),
    stores: db.stores.filter((s) => s.active),
    news: db.news.filter((n) => n.active).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    projects: db.projects.filter((p) => p.active).sort((a, b) => b.year - a.year),
    catalogues: db.catalogues.filter((c) => c.active).sort((a, b) => a.order - b.order || b.year - a.year),
  };
}

/** Slim product list for client-side lists (favorites, recently viewed). */
export async function getCatalog() {
  const { products, categoryById } = await getSite();
  return products.map((p) => ({
    swatches: p.swatches,
    id: p.id,
    slug: p.slug,
    name: p.name,
    images: p.images.slice(0, 2),
    size: p.size,
    isNew: p.isNew,
    price: p.range.min || p.price,
    priceFrom: p.range.varies,
    finish: p.finish,
    category: categoryById.get(p.categoryId)?.name,
  }));
}

/** Catalogue page texts and sections as configured in the admin panel. */
export const getCataloguePage = cache(async () => normalizeCataloguePage(await getSetting(CATALOGUE_PAGE_KEY)));

/** Home page "Shop by Room" section as configured in the admin panel. */
export const getHomeRooms = cache(async () => normalizeHomeRooms(await getSetting(HOME_ROOMS_KEY)));

/** Header, footer, floating buttons and contact form as configured in the admin panel. */
export const getSiteLayout = cache(async () => normalizeLayout(await getSetting(LAYOUT_KEY)));
