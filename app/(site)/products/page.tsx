import type { Metadata } from "next";
import Link from "next/link";
import { getSite } from "@/lib/queries";
import { APPLICATIONS, COLORS, FINISHES, SIZES } from "@/lib/resources";
import { PageHero } from "@/components/site/PageHero";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductFilters, SortSelect } from "@/components/site/ProductFilters";
import { FilterSheet } from "@/components/site/FilterSheet";
import { SEED_IMAGES } from "@/lib/seed";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "Products" };

const PER_PAGE = 12;
const list = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]).filter(Boolean);

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const sp = await searchParams;
  const { products, categories, categoryById } = await getSite();

  const q = String(sp.q ?? "").trim().toLowerCase();
  const sort = String(sp.sort ?? "featured");
  const page = Math.max(1, Number(sp.page) || 1);
  const selected: Record<string, string[]> = {
    category: list(sp.category),
    size: list(sp.size),
    finish: list(sp.finish),
    color: list(sp.color),
    application: list(sp.application),
  };

  const matches = (p: Product, skip?: string) =>
    (!q || [p.name, p.code, p.color, p.size, p.finish, p.description].join(" ").toLowerCase().includes(q)) &&
    (skip === "category" || !selected.category.length || selected.category.includes(categoryById.get(p.categoryId)?.slug ?? "")) &&
    (skip === "size" || !selected.size.length || selected.size.includes(p.size)) &&
    (skip === "finish" || !selected.finish.length || selected.finish.includes(p.finish)) &&
    (skip === "color" || !selected.color.length || selected.color.includes(p.color)) &&
    (skip === "application" || !selected.application.length || selected.application.some((a) => p.applications.includes(a)));

  const filtered = products.filter((p) => matches(p));
  const sorters: Record<string, (a: Product, b: Product) => number> = {
    featured: (a, b) => Number(b.featured) - Number(a.featured) || b.updatedAt.localeCompare(a.updatedAt),
    new: (a, b) => b.createdAt.localeCompare(a.createdAt),
    popular: (a, b) => b.views - a.views,
    name: (a, b) => a.name.localeCompare(b.name),
    "price-asc": (a, b) => (a.price || Infinity) - (b.price || Infinity),
    "price-desc": (a, b) => b.price - a.price,
  };
  filtered.sort(sorters[sort] ?? sorters.featured);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const shown = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // facet counts reflect the other active filters (faceted search)
  const facet = (name: string, values: { value: string; label: string }[], test: (p: Product, v: string) => boolean) => ({
    name,
    label: name === "application" ? "Application" : name[0].toUpperCase() + name.slice(1),
    options: values
      .map((o) => ({ ...o, count: products.filter((p) => matches(p, name) && test(p, o.value)).length }))
      .filter((o) => o.count > 0 || selected[name].includes(o.value)),
  });
  const groups = [
    facet("category", categories.map((c) => ({ value: c.slug, label: c.name })), (p, v) => categoryById.get(p.categoryId)?.slug === v),
    facet("application", APPLICATIONS.map((v) => ({ value: v, label: v })), (p, v) => p.applications.includes(v)),
    facet("size", SIZES.map((v) => ({ value: v, label: v })), (p, v) => p.size === v),
    facet("finish", FINISHES.map((v) => ({ value: v, label: v })), (p, v) => p.finish === v),
    facet("color", COLORS.map((v) => ({ value: v, label: v })), (p, v) => p.color === v),
  ];

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) for (const x of list(v)) qs.append(k, x);
  const pageHref = (n: number) => {
    const p = new URLSearchParams(qs);
    p.set("page", String(n));
    return `/products?${p}`;
  };

  const activeCat = selected.category.length === 1 ? categories.find((c) => c.slug === selected.category[0]) : undefined;

  return (
    <>
      <PageHero
        title={activeCat?.name ?? "Our Products"}
        subtitle={activeCat?.description ?? "Floor, wall, kitchen, bathroom and outdoor tiles — find the perfect finish for every space."}
        image={activeCat?.image ?? SEED_IMAGES.interior}
        crumbs={[{ href: "/products", label: "Products" }]}
      />
      <div className="mx-auto grid max-w-7xl gap-6 px-6 pb-12 lg:grid-cols-[260px_1fr] lg:gap-10 lg:pt-12">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <FilterSheet activeCount={Object.values(selected).flat().length + (q ? 1 : 0)} total={filtered.length}>
              <ProductFilters groups={groups} selected={selected} q={String(sp.q ?? "")} sort={sort} />
          </FilterSheet>
        </aside>
        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
            <p className="text-[13px] text-muted">
              Showing <b className="text-ink">{shown.length}</b> of <b className="text-ink">{filtered.length}</b> tiles
            </p>
            <SortSelect value={sort} params={qs.toString()} />
          </div>

          {shown.length ? (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
              {shown.map((p) => (
                <ProductCard key={p.id} product={p} categoryName={categoryById.get(p.categoryId)?.name} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <p className="text-lg text-ink">No tiles match these filters.</p>
              <Link href="/products" className="mt-3 inline-block text-sm text-brand hover:underline">Clear all filters</Link>
            </div>
          )}

          {pages > 1 && (
            <nav className="mt-14 flex justify-center gap-1" aria-label="Pagination">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={pageHref(n)}
                  className={cn("grid size-10 place-items-center border text-sm transition", n === page ? "border-navy bg-navy text-white" : "border-neutral-300 hover:border-ink")}
                >
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </section>
      </div>
    </>
  );
}
