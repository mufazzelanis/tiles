import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";

/** Makes the site installable as an app on phones and desktops. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { settings } = await getDb();
  return {
    name: settings.siteName,
    short_name: "UDH",
    description: settings.seoDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8f2e9",
    theme_color: "#760308",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "All products", url: "/products" },
      { name: "My favorites", url: "/favorites" },
      { name: "Store locator", url: "/store-locator" },
      { name: "Tiles calculator", url: "/tiles-calculator" },
    ],
  };
}
