import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Img from "@/components/Img";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { FavoriteButton } from "./FavoriteButton";

/** The fields a card needs — also used by client lists (favorites, recently viewed). */
export type CardProduct = Pick<Product, "id" | "slug" | "name" | "images" | "size" | "isNew" | "price" | "finish">;

export function toCardProduct(p: Product): CardProduct {
  return { id: p.id, slug: p.slug, name: p.name, images: p.images.slice(0, 2), size: p.size, isNew: p.isNew, price: p.price, finish: p.finish };
}

export function ProductCard({ product, categoryName }: { product: CardProduct; categoryName?: string }) {
  const [cover, hover] = product.images;
  return (
    <Link href={`/products/${product.slug}`} className="group block active:scale-[0.98] transition-transform">
      <div className="relative aspect-square overflow-hidden bg-mist">
        <Img
          src={cover ?? ""}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 260px"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        {/* second photo crossfades in on hover (desktop) */}
        {hover && (
          <Img
            src={hover}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, 260px"
            className="object-cover opacity-0 transition duration-700 group-hover:opacity-100"
          />
        )}
        {product.isNew && (
          <span className="absolute top-2 left-2 bg-leaf px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase">New</span>
        )}
        <FavoriteButton id={product.id} name={product.name} className="absolute top-2 right-2" />
        <span className="absolute bottom-2 left-2 bg-white/90 px-2 py-0.5 text-[10px] font-medium text-ink">{product.size}</span>
        <span className="absolute right-2 bottom-2 hidden translate-y-2 items-center gap-1 bg-navy px-2.5 py-1 text-[10px] font-medium tracking-wide text-white uppercase opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 lg:flex">
          View <ArrowUpRight className="size-3" />
        </span>
      </div>
      <h3 className="mt-3 truncate text-[14px] font-bold text-ink">{categoryName ?? product.name}</h3>
      {categoryName && <p className="truncate text-[12px] text-muted">{product.name}</p>}
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="leaf-dash" />
        {product.price > 0 && <span className="text-[11px] font-semibold text-ink">{formatPrice(product.price)}</span>}
      </div>
      <span className="mt-1.5 inline-block text-[11px] font-bold text-brand group-hover:underline">learn more</span>
    </Link>
  );
}
