import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Box, Droplets, Layers, MapPin, MessageSquareText, Phone, Ruler, ShoppingBag } from "lucide-react";
import { getCatalog, getSite } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";
import { Gallery } from "@/components/site/Gallery";
import { ColorPicker } from "@/components/site/ColorPicker";
import { QuoteButton, QuoteDialog, WhatsAppButton } from "@/components/site/QuoteDialog";
import { TileCalculator } from "@/components/site/TileCalculator";
import { ProductCard } from "@/components/site/ProductCard";
import { TrackView } from "@/components/site/TrackView";
import { TrackEvent } from "@/components/site/TrackEvent";
import { SectionTitle } from "@/components/site/PageHero";
import { FavoriteButton } from "@/components/site/FavoriteButton";
import { ShareButton } from "@/components/site/ShareButton";
import { RecentlyViewed } from "@/components/site/ProductLists";

export async function generateStaticParams() {
  const { products } = await getSite();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getSite();
  const p = products.find((x) => x.slug === slug);
  if (!p) return {};
  return {
    title: p.name,
    description: p.description,
    openGraph: { images: p.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const { products, categoryById, settings } = await getSite();
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();
  const catalog = await getCatalog();
  const tel = settings.phone.replace(/\s/g, "");
  const category = categoryById.get(product.categoryId);
  const related = products
    .filter((p) => p.id !== product.id && (p.categoryId === product.categoryId || p.applications.some((a) => product.applications.includes(a))))
    .slice(0, 4);

  const specs = [
    { Icon: Ruler, label: "Size", value: product.size },
    { Icon: Droplets, label: "Finish", value: product.finish },
    { Icon: Layers, label: "Thickness", value: product.thickness },
    { Icon: Box, label: "Per box", value: `${product.piecesPerBox} pcs · ${product.sqftPerBox} sqft` },
  ].filter((s) => s.value);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.code,
    image: product.images,
    description: product.description,
    brand: { "@type": "Brand", name: settings.siteName },
    ...(product.price ? { offers: { "@type": "Offer", price: product.price, priceCurrency: "BDT", availability: "https://schema.org/InStock" } } : {}),
  };

  return (
    <>
      <TrackView id={product.id} />
      <TrackEvent
        name="ViewContent"
        trackKey={product.id}
        data={{ content_ids: [product.id], content_type: "product", content_name: product.name, content_category: category?.name, value: product.price || undefined, currency: product.price ? "BDT" : undefined }}
      />
      <QuoteDialog
        product={{ id: product.id, name: product.name, code: product.code, size: product.size, finish: product.finish, price: product.price, sqftPerBox: product.sqftPerBox, piecesPerBox: product.piecesPerBox, image: product.images[0] ?? "" }}
        colors={product.swatches}
        phone={settings.phone}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <nav className="mb-8 text-[12px] text-muted">
          <Link href="/" className="hover:text-ink">Home</Link> /{" "}
          <Link href="/products" className="hover:text-ink">Products</Link> /{" "}
          {category && (
            <>
              <Link href={`/products?category=${category.slug}`} className="hover:text-ink">{category.name}</Link> /{" "}
            </>
          )}
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2">
          <Gallery images={product.images} alt={product.name} productId={product.id} colorPhotos={product.swatches.map((c) => ({ colorId: c.id, photo: c.photo, name: c.name }))} />

          <div>
            <p className="text-[12px] tracking-[0.2em] text-brand uppercase">{category?.name}</p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{product.name}</h1>
              <div className="flex shrink-0 gap-2">
                <FavoriteButton id={product.id} name={product.name} size="lg" className="border border-neutral-300 shadow-none" />
                <ShareButton title={product.name} />
              </div>
            </div>
            <p className="mt-1 text-sm text-muted">Code: {product.code}</p>
            <span className="leaf-dash my-5" />
            <p className="text-[15px] leading-relaxed text-neutral-600">{product.description}</p>
            <p className="mt-5 text-2xl font-semibold text-ink">
              {formatPrice(product.price)}
              {product.price > 0 && <span className="text-sm font-normal text-muted"> / box</span>}
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-neutral-200 bg-neutral-200 sm:grid-cols-3">
              {specs.map(({ Icon, label, value }) => (
                <div key={label} className="bg-white p-4">
                  <dt className="flex items-center gap-1.5 text-[10px] tracking-wider text-muted uppercase">
                    <Icon className="size-3.5" /> {label}
                  </dt>
                  <dd className="mt-1 text-[13px] font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            {product.swatches.length > 0 && (
              <div className="mt-7">
                <ColorPicker productId={product.id} colors={product.swatches} />
              </div>
            )}

            {product.applications.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-[11px] tracking-wider text-muted uppercase">Recommended for</p>
                <div className="flex flex-wrap gap-2">
                  {product.applications.map((a) => (
                    <Link key={a} href={`/products?application=${encodeURIComponent(a)}`} className="border border-neutral-300 px-3 py-1 text-[12px] text-ink transition hover:border-ink">
                      {a}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <QuoteButton className="flex items-center gap-2 bg-navy px-6 py-3 text-[12px] tracking-wider text-white uppercase transition hover:bg-navy-deep">
                <ShoppingBag className="size-4" /> Request a quote
              </QuoteButton>
              <Link href="/store-locator" className="flex items-center gap-2 border border-ink px-6 py-3 text-[12px] tracking-wider text-ink uppercase transition hover:bg-ink hover:text-white">
                <MapPin className="size-4" /> Find a store
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-2" id="inquiry">
          <div>
            <h2 className="mb-5 font-display text-xl font-semibold text-ink">How many boxes do I need?</h2>
            <TileCalculator sqftPerBox={product.sqftPerBox} piecesPerBox={product.piecesPerBox} price={product.price} orderable />
          </div>
          <div className="flex flex-col border border-neutral-200 bg-mist/60 p-6 sm:p-8">
            <p className="text-[11px] tracking-[0.2em] text-brand uppercase">Ready to order?</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">Get a quote in under a minute</h2>
            <ol className="mt-6 space-y-4">
              {[
                ["Choose your colour", product.swatches.length ? `${product.swatches.length} colour${product.swatches.length > 1 ? "s" : ""} available` : "We'll confirm the shade with you"],
                ["Tell us how much", "Boxes, or let us work it out from your room size"],
                ["Leave your number", "Our sales team calls to confirm price and delivery"],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-navy text-[12px] font-semibold text-white">{i + 1}</span>
                  <span>
                    <b className="block text-[14px] font-semibold text-ink">{t}</b>
                    <span className="text-[13px] text-muted">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <QuoteButton className="mt-8 flex w-full items-center justify-center gap-2 bg-navy px-6 py-3.5 text-[12px] tracking-wider text-white uppercase transition hover:bg-navy-deep">
              <ShoppingBag className="size-4" /> Request a quote
            </QuoteButton>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href={`tel:${tel}`} className="flex items-center justify-center gap-1.5 border border-neutral-300 bg-white py-2.5 text-[12px] text-ink transition hover:border-ink">
                <Phone className="size-4" /> Call us
              </a>
              <WhatsAppButton phone={settings.phone} product={product} colors={product.swatches} className="flex items-center justify-center gap-1.5 bg-[#25D366] py-2.5 text-[12px] text-white">
                WhatsApp
              </WhatsAppButton>
            </div>
          </div>
        </div>

        {/* app-style action bar on phones (sits above the tab bar) */}
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 grid grid-cols-3 gap-2 border-t border-neutral-200 bg-white/95 p-2.5 backdrop-blur lg:hidden">
          <a href={`tel:${tel}`} className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300 py-2.5 text-[13px] font-medium text-ink active:scale-95">
            <Phone className="size-4" /> Call
          </a>
          <WhatsAppButton phone={settings.phone} product={product} colors={product.swatches} className="flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] py-2.5 text-[13px] font-medium text-white active:scale-95">
            WhatsApp
          </WhatsAppButton>
          <QuoteButton className="flex items-center justify-center gap-1.5 rounded-lg bg-navy py-2.5 text-[13px] font-medium text-white active:scale-95">
            <MessageSquareText className="size-4" /> Quote
          </QuoteButton>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <SectionTitle>You may also like</SectionTitle>
            <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} categoryName={categoryById.get(p.categoryId)?.name} />
              ))}
            </div>
          </section>
        )}
      </div>
      <RecentlyViewed catalog={catalog} excludeId={product.id} />
      {/* spacer so the mobile action bar never covers the footer */}
      <div className="h-16 lg:hidden" />
    </>
  );
}
