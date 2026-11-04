import type { MetadataRoute } from "next";
import { getSite } from "@/lib/queries";

const BASE = process.env.SITE_URL || "http://localhost:3000";

// Always render from the database on the server it runs on. Builds happen on another machine
// (with its own database), so nothing that reads data may be baked in at build time.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, news } = await getSite();
  const pages = ["", "/products", "/store-locator", "/catalogue", "/news", "/projects", "/about", "/contact", "/tiles-calculator"];
  return [
    ...pages.map((p) => ({ url: `${BASE}${p}`, changeFrequency: "weekly" as const, priority: p ? 0.7 : 1 })),
    ...products.map((p) => ({ url: `${BASE}/products/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
    ...news.map((n) => ({ url: `${BASE}/news/${n.slug}`, lastModified: n.updatedAt, priority: 0.5 })),
  ];
}
