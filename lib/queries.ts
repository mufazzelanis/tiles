import { cache } from "react";
import { getDb, getSetting } from "./db";
import { LAYOUT_KEY, normalizeLayout } from "./site-layout";
import { toSwatch, type SwatchColor } from "./colors";
import type { Product } from "./types";

/** A published product with its published colours resolved, in the admin's order. */
export type SiteProduct = Product & { swatches: (SwatchColor & { photo: string; description: string })[] };

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
    .map((p) => ({
      ...p,
      // hidden or deleted colours are dropped; "photo" is the product shot in that colour
      swatches: p.colorVariants.flatMap((v) => {
        const c = colorById.get(v.colorId);
        return c ? [{ ...toSwatch(c), description: c.description, photo: v.image }] : [];
      }),
    }));
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
    catalogues: db.catalogues.filter((c) => c.active).sort((a, b) => b.year - a.year),
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
    price: p.price,
    finish: p.finish,
    category: categoryById.get(p.categoryId)?.name,
  }));
}

/** Header, footer, floating buttons and contact form as configured in the admin panel. */
export const getSiteLayout = cache(async () => normalizeLayout(await getSetting(LAYOUT_KEY)));
