import Link from "next/link";
import { ArrowUpRight, BookOpenCheck, Lightbulb, MapPinned, Newspaper, FolderKanban, Search, Sparkles } from "lucide-react";
import Img from "@/components/Img";
import { getCatalog, getSite } from "@/lib/queries";
import { Reveal } from "@/components/site/Reveal";
import { RecentlyViewed } from "@/components/site/ProductLists";
import { SEED_IMAGES } from "@/lib/seed";
import { HeroSlider } from "@/components/site/HeroSlider";
import { BrandIntro } from "@/components/site/BrandIntro";
import { Carousel } from "@/components/site/Carousel";
import { ProductCard } from "@/components/site/ProductCard";
import { VideoEmbed } from "@/components/site/VideoEmbed";
import { SustainabilitySlider } from "@/components/site/SustainabilitySlider";
import { SectionTitle } from "@/components/site/PageHero";

export default async function Home() {
  const { settings, slides, products, categories, categoryById, sustainability, stores } = await getSite();
  const featured = products.filter((p) => p.featured).slice(0, 12);
  const catalog = await getCatalog();

  // "Shop by room" tiles, each with a live product count
  const rooms = [
    { name: "Living Room", image: SEED_IMAGES.livingRoom2 },
    { name: "Bathroom", image: SEED_IMAGES.bathroom3 },
    { name: "Kitchen", image: SEED_IMAGES.kitchen },
    { name: "Bedroom", image: SEED_IMAGES.bedroom },
    { name: "Outdoor", image: SEED_IMAGES.house },
    { name: "Commercial", image: SEED_IMAGES.interior3 },
  ].map((r) => ({ ...r, count: products.filter((p) => p.applications.includes(r.name)).length }));

  return (
    <>
      <HeroSlider slides={slides} settings={settings} />
      <BrandIntro
        settings={settings}
        stats={{ products: products.length, categories: categories.length, stores: stores.length, divisions: new Set(stores.map((s) => s.division)).size }}
      />

      {/* Discover */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12">
        <SectionTitle>{settings.homeIntroTitle}</SectionTitle>
        <p className="mx-auto mt-5 line-clamp-3 max-w-5xl text-center text-[13px] leading-relaxed text-muted sm:line-clamp-none">{settings.homeIntroText}</p>

        <Carousel className="mt-10">
          {featured.map((p) => (
            <div key={p.id} className="w-[calc(50%-10px)] shrink-0 snap-start sm:w-[calc(33.333%-14px)] lg:w-[calc(20%-16px)]">
              <ProductCard product={p} categoryName={categoryById.get(p.categoryId)?.name} />
            </div>
          ))}
        </Carousel>

        <div className="mt-6 flex items-center justify-end gap-3">
          <span className="leaf-dash" />
          <Link href="/products" className="text-[11px] font-bold text-brand hover:underline">Discover All Products</Link>
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            href="/products#filters"
            className="flex items-center gap-3 border border-neutral-300 px-8 py-3 text-[12px] tracking-wide text-ink uppercase transition hover:border-ink hover:bg-ink hover:text-white"
          >
            <Search className="size-4" /> Advanced Search
          </Link>
        </div>
      </section>

      {/* Shop by room */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <Reveal>
          <h2 className="section-title">Shop by Room</h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {rooms.map((r, i) => (
            <Reveal key={r.name} delay={i * 70}>
              <Link
                href={`/products?application=${encodeURIComponent(r.name)}`}
                className="group relative block aspect-4/3 overflow-hidden bg-neutral-900 active:scale-[0.98] transition-transform"
              >
                <Img src={r.image} alt={r.name} fill sizes="(max-width:768px) 50vw, 33vw" className="object-cover opacity-80 transition duration-700 group-hover:scale-110 group-hover:opacity-60" />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-white">
                  <div>
                    <p className="font-display text-base font-semibold sm:text-xl">{r.name}</p>
                    <p className="text-[11px] text-white/75">{r.count} designs</p>
                  </div>
                  <span className="grid size-9 place-items-center rounded-full bg-white/15 backdrop-blur transition group-hover:bg-white group-hover:text-ink">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <Reveal>
          <SectionTitle>Explore Tiles Collections by Category</SectionTitle>
        </Reveal>
        <Carousel variant="boxed" className="mt-14">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className="group w-[calc(50%-10px)] shrink-0 snap-start sm:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)]"
            >
              <div className="relative aspect-4/3 overflow-hidden bg-mist">
                <Img src={c.image} alt={c.name} fill sizes="(max-width:640px) 50vw, 280px" className="object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <h3 className="mt-4 text-[15px] text-ink">{c.name}</h3>
              <span className="leaf-dash my-2" />
              <span className="text-[11px] font-bold tracking-wide text-brand uppercase group-hover:underline">View details</span>
            </Link>
          ))}
        </Carousel>
        <div className="mt-12 flex justify-center">
          <Link href="/products" className="bg-navy px-10 py-4 text-[12px] tracking-wide text-white uppercase transition hover:bg-navy-deep">
            Discover All
          </Link>
        </div>
      </section>

      <RecentlyViewed catalog={catalog} title="Continue browsing" />

      {/* Why choose */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <Reveal>
          <SectionTitle>{settings.whyTitle}</SectionTitle>
        </Reveal>
        <p className="mx-auto mt-5 line-clamp-3 max-w-5xl text-center text-[13px] leading-relaxed text-muted sm:line-clamp-none">{settings.whyText}</p>
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-4 text-center">
          {[
            { href: "/about", label: "About Us", Icon: Lightbulb },
            { href: "/store-locator?type=Display+Center", label: "Display Center", Icon: MapPinned },
            { href: "/store-locator?type=Dealer", label: "Dealer Profile", Icon: BookOpenCheck },
          ].map(({ href, label, Icon }) => (
            <Link key={label} href={href} className="group flex flex-col items-center gap-3">
              <Icon strokeWidth={1.2} className="size-10 text-ink transition group-hover:-translate-y-1 group-hover:text-brand" />
              <span className="text-[15px] text-ink">{label}</span>
            </Link>
          ))}
        </div>
        {settings.videoId && (
          <div className="mx-auto mt-14 max-w-4xl">
            <VideoEmbed id={settings.videoId} title={`${settings.siteName} — Timeless Elegance`} />
          </div>
        )}
      </section>

      {/* Popular */}
      <section className="mt-6 bg-mist py-16">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <SectionTitle>Popular</SectionTitle>
          </Reveal>
          <div className="mt-12 grid gap-12 sm:grid-cols-3">
            {[
              { href: "/news?type=Tiles+Care", title: "Tiles Care", Icon: Sparkles, text: "Learn to maintain tiles with a delicate touch, a few smart cleaning procedures and tips & tricks on how to make your tiles last longer and keep your walls and floors looking as good as new." },
              { href: "/projects", title: "Projects", Icon: FolderKanban, text: `${settings.siteName} has always been prioritizing versatility and premium quality in each and every project. Get to know some of our nationwide projects.` },
              { href: "/news", title: "News & Events", Icon: Newspaper, text: "We keep all stakeholders informed about current events. Learn more about what is happening around. Stay updated with our events and updates." },
            ].map(({ href, title, Icon, text }) => (
              <Link key={title} href={href} className="group text-center">
                <span className="mx-auto grid size-36 place-items-center rounded-full border-[12px] border-neutral-200 bg-white transition group-hover:border-leaf/40">
                  <Icon strokeWidth={1.2} className="size-9 text-ink transition group-hover:scale-110" />
                </span>
                <h3 className="mt-8 text-[13px] tracking-wide text-ink uppercase">{title}</h3>
                <p className="mx-auto mt-4 max-w-xs text-[12px] leading-relaxed text-muted">{text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Sustainability */}
      {sustainability.length > 0 && (
        <section className="bg-mist pt-4 pb-16">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <SectionTitle className="mb-10">Sustainability</SectionTitle>
              <SustainabilitySlider items={sustainability} />
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
