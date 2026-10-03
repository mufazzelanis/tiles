import { getDb } from "./db";

/** Public-facing reads: only published rows, sorted for display. */
export async function getSite() {
  const db = await getDb();
  const byOrder = <T extends { order: number; active: boolean }>(list: T[]) =>
    list.filter((x) => x.active).sort((a, b) => a.order - b.order);
  const categories = byOrder(db.categories);
  return {
    settings: db.settings,
    categories,
    categoryById: new Map(categories.map((c) => [c.id, c])),
    products: db.products.filter((p) => p.active),
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
