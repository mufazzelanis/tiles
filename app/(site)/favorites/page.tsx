import type { Metadata } from "next";
import { getCatalog } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { FavoritesView } from "@/components/site/ProductLists";
import { SEED_IMAGES } from "@/lib/seed";

export const metadata: Metadata = { title: "My favorites", robots: { index: false } };

export default async function FavoritesPage() {
  const catalog = await getCatalog();
  return (
    <>
      <PageHero title="My favorites" subtitle="Tiles you saved on this device." image={SEED_IMAGES.lounge} crumbs={[{ href: "/favorites", label: "Favorites" }]} />
      <FavoritesView catalog={catalog} />
    </>
  );
}
