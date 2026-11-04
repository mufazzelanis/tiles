import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, MessageCircle, MessageSquareText, Phone, ShoppingBag } from "lucide-react";
import { getCatalog, getSite } from "@/lib/queries";
import { Gallery } from "@/components/site/Gallery";
import { QuoteButton, QuoteDialog, WhatsAppButton } from "@/components/site/QuoteDialog";
import { LivePrice, ProductCalculator, VariationPicker } from "@/components/site/ProductOptions";
import { SuitableFor } from "@/components/site/SuitableFor";
import { defaultVariation } from "@/lib/pricing";
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

  const description = product.description ? (
    <section className="mt-8 border-t border-neutral-200 pt-6">
      <h2 className="mb-3 text-[11px] tracking-[0.2em] text-brand uppercase">Description</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-neutral-600">
        {product.description.split(/\n\s*\n/).map((para, i) => <p key={i}>{para}</p>)}
      </div>
    </section>
  ) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.code,
    image: product.images,
    description: product.description,
    brand: { "@type": "Brand", name: settings.siteName },
    ...(product.range.min
      ? {
          offers: product.range.varies
            ? { "@type": "AggregateOffer", lowPrice: product.range.min, highPrice: product.range.max, priceCurrency: "BDT", availability: "https://schema.org/InStock" }
            : { "@type": "Offer", price: product.range.min, priceCurrency: "BDT", availability: "https://schema.org/InStock" },
        }
      : {}),
  };

  return (
    <>
      <TrackView id={product.id} />
      <TrackEvent
        name="ViewContent"
        trackKey={product.id}
        data={{ content_ids: [product.id], content_type: "product", content_name: product.name, content_category: category?.name, value: product.range.min || undefined, currency: product.range.min ? "BDT" : undefined }}
      />
      <QuoteDialog
        product={{ id: product.id, name: product.name, code: product.code, size: product.size, finish: product.finish, price: product.price, image: product.images[0] ?? "" }}
        colors={product.swatches}
        priced={product.priced}
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
          <div>
            <Gallery images={product.images} alt={product.name} productId={product.id} colorPhotos={product.swatches.map((c) => ({ colorId: c.id, photo: c.photo, name: c.name }))}
              variationPhotos={product.priced.variations.map((v) => ({ variationId: v.id, images: v.images }))}
              defaultVariationId={defaultVariation(product.priced)?.id}
            />
            {/* desktop: under the photos */}
            {description && <div className="hidden lg:block">{description}</div>}
          </div>

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
            <LivePrice productId={product.id} priced={product.priced} />
            <SuitableFor areas={product.applications} className="mt-5" />

            <div className="mt-7">
              <VariationPicker productId={product.id} priced={product.priced} swatches={product.swatches} />
            </div>

            <div className="mt-8" id="calculator">
              <ProductCalculator productId={product.id} priced={product.priced} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <QuoteButton className="flex items-center gap-2 bg-navy px-6 py-3 text-[12px] tracking-wider text-white uppercase transition hover:bg-navy-deep">
                <ShoppingBag className="size-4" /> Request a quote
              </QuoteButton>
              <a href={`tel:${tel}`} className="flex items-center gap-2 border border-neutral-300 bg-white px-5 py-3 text-[12px] tracking-wider text-ink uppercase transition hover:border-ink">
                <Phone className="size-4" /> Call us
              </a>
              <WhatsAppButton phone={settings.phone} product={product} priced={product.priced} className="flex items-center gap-2 bg-[#25D366] px-5 py-3 text-[12px] tracking-wider text-white uppercase transition hover:brightness-95">
                <MessageCircle className="size-4" /> WhatsApp
              </WhatsAppButton>
              <Link href="/store-locator" className="flex items-center gap-2 border border-ink px-6 py-3 text-[12px] tracking-wider text-ink uppercase transition hover:bg-ink hover:text-white">
                <MapPin className="size-4" /> Find a store
              </Link>
            </div>

            {/* phones: after price, options and buttons */}
            {description && <div className="lg:hidden">{description}</div>}
          </div>
        </div>

        {/* app-style action bar on phones (sits above the tab bar) */}
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 grid grid-cols-3 gap-2 border-t border-neutral-200 bg-white/95 p-2.5 backdrop-blur lg:hidden">
          <a href={`tel:${tel}`} className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300 py-2.5 text-[13px] font-medium text-ink active:scale-95">
            <Phone className="size-4" /> Call
          </a>
          <WhatsAppButton phone={settings.phone} product={product} priced={product.priced} className="flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] py-2.5 text-[13px] font-medium text-white active:scale-95">
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
