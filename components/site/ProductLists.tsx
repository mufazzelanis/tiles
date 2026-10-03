"use client";

import Link from "next/link";
import { Heart, History, Trash2 } from "lucide-react";
import { useFavorites, useRecentlyViewed } from "@/lib/client-store";
import { ProductCard, type CardProduct } from "./ProductCard";

export type CatalogItem = CardProduct & { category?: string };

function pick(catalog: CatalogItem[], ids: string[]) {
  const byId = new Map(catalog.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter((p): p is CatalogItem => !!p);
}

/** Horizontal strip of products this visitor opened recently. */
export function RecentlyViewed({ catalog, excludeId, title = "Recently viewed" }: { catalog: CatalogItem[]; excludeId?: string; title?: string }) {
  const ids = useRecentlyViewed();
  const items = pick(catalog, ids.filter((id) => id !== excludeId)).slice(0, 8);
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <History className="size-5 text-brand" /> {title}
        </h2>
        <Link href="/products" className="text-[12px] font-semibold text-brand hover:underline">Browse all</Link>
      </div>
      <div className="no-scrollbar -mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-2">
        {items.map((p) => (
          <div key={p.id} className="w-[42vw] max-w-[200px] shrink-0 snap-start">
            <ProductCard product={p} categoryName={p.category} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** The /favorites page body. */
export function FavoritesView({ catalog }: { catalog: CatalogItem[] }) {
  const fav = useFavorites();
  const items = pick(catalog, fav.ids);

  if (!items.length) {
    return (
      <div className="flex flex-col items-center px-6 py-24 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-rose-50">
          <Heart className="size-9 text-rose-400" />
        </span>
        <h2 className="mt-6 font-display text-xl font-semibold text-ink">No favorites yet</h2>
        <p className="mt-2 max-w-sm text-sm text-muted">Tap the heart on any tile to save it here. Your list stays on this device, so you can compare designs later or show them at the store.</p>
        <Link href="/products" className="mt-8 bg-navy px-8 py-3 text-[12px] tracking-wider text-white uppercase transition hover:bg-navy-deep active:scale-95">
          Explore tiles
        </Link>
      </div>
    );
  }

  const shareText = items.map((p) => `• ${p.name} (${p.size})`).join("\n");

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted"><b className="text-ink">{items.length}</b> saved tile{items.length > 1 ? "s" : ""}</p>
        <div className="flex gap-2">
          <Link
            href={`/contact?subject=${encodeURIComponent("Quote for my saved tiles")}&message=${encodeURIComponent(`Please send me a quote for:\n${shareText}`)}`}
            className="bg-navy px-5 py-2.5 text-[12px] tracking-wider text-white uppercase transition hover:bg-navy-deep active:scale-95"
          >
            Get a quote for all
          </Link>
          <button onClick={fav.clear} className="flex items-center gap-1.5 border border-neutral-300 px-4 py-2.5 text-[12px] text-ink transition hover:border-ink active:scale-95">
            <Trash2 className="size-3.5" /> Clear
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} categoryName={p.category} />
        ))}
      </div>
    </div>
  );
}
