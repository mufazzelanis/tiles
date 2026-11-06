import { Fragment } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  BookOpenCheck,
  Calculator,
  ChevronRight,
  FolderKanban,
  Lightbulb,
  MapPinned,
  Newspaper,
  Search,
  Sparkles,
  Store,
} from "lucide-react";
import Img from "@/components/Img";
import { getCatalog, getHomePatterns, getHomeRooms, getHomeSections, getHomeThickness, getSite } from "@/lib/queries";
import { pickRowProducts, type HomeSectionKey } from "@/lib/home-sections";
import { PaverArt } from "@/components/CatalogueCover";
import { OrderSteps, PaverPatterns, ThicknessGuide } from "@/components/site/ParkingSections";
import { Reveal } from "@/components/site/Reveal";
import { RecentlyViewed } from "@/components/site/ProductLists";
import { HeroSlider } from "@/components/site/HeroSlider";
import { BrandIntro } from "@/components/site/BrandIntro";
import { Carousel } from "@/components/site/Carousel";
import { ProductCard } from "@/components/site/ProductCard";
import { VideoEmbed } from "@/components/site/VideoEmbed";
import { SustainabilitySlider } from "@/components/site/SustainabilitySlider";
import { SectionTitle } from "@/components/site/PageHero";

/** Shortcuts shown on phones right under the hero, like an app's home screen. */
const QUICK = [
  { href: "/products", label: "All Tiles", Icon: Sparkles, tint: "from-navy to-brand" },
  { href: "/tiles-calculator", label: "Calculator", Icon: Calculator, tint: "from-leaf to-[#a77d2f]" },
  { href: "/catalogue", label: "Catalogue", Icon: BookOpen, tint: "from-charcoal to-ink" },
  { href: "/store-locator?type=Display+Center", label: "Showroom", Icon: Store, tint: "from-brand to-navy" },
];

export default async function Home() {
  const { settings, slides, products, categories, categoryById, sustainability, stores } = await getSite();
  const catalog = await getCatalog();

  const sections = await getHomeSections();
  // products row: newest uploads appear automatically (Admin → Home page → Products row)
  const featured = pickRowProducts(products, sections);

  // "Shop by area" tiles (Admin → Shop by Area), each with a live product count
  const roomCfg = await getHomeRooms();
  const patternCfg = await getHomePatterns();
  const thicknessCfg = await getHomeThickness();
  const rooms = roomCfg.rooms
    .filter((r) => r.enabled)
    .map((r) => ({ ...r, count: products.filter((p) => p.applications.includes(r.application)).length }))
    .filter((r) => !roomCfg.hideEmpty || r.count > 0);
  // phones: the first room (and the last, when it would sit alone) spans the full width
  const wide = (i: number) => i === 0 || (i === rooms.length - 1 && rooms.length % 2 === 0);

  const visible = sections.order.filter((k) => !sections.hidden.includes(k));
  const stats = { products: products.length, categories: categories.length, stores: stores.length, divisions: new Set(stores.map((s) => s.division)).size };
  // the shortcuts card overlaps the banner only when it sits right under it
  const overlapHero = visible[visible.indexOf("quick") - 1] === "hero" && slides.length > 0;

  // every section, rendered in the order set in Admin → Home page
  const blocks: Record<HomeSectionKey, () => React.ReactNode> = {
    hero: () => <HeroSlider slides={slides} settings={settings} />,

    /* phones: search + shortcuts card */
    quick: () => (
      <div className={`relative z-[3] px-4 sm:hidden ${overlapHero ? "-mt-5" : "mt-4"}`}>
        <div className="rounded-2xl bg-white p-3 shadow-[0_12px_35px_-12px_rgba(118,3,8,0.35)] ring-1 ring-navy/5">
          <form action="/products" className="flex items-center gap-2 rounded-xl bg-mist px-3 ring-1 ring-navy/5 focus-within:ring-navy/30">
            <Search className="size-4 shrink-0 text-muted" />
            <input
              name="q"
              type="search"
              placeholder="Search tiles, size, colour…"
              aria-label="Search tiles"
              className="h-11 min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted/80"
            />
            <button type="submit" className="rounded-lg bg-navy px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white uppercase active:scale-95">
              Go
            </button>
          </form>
          <nav aria-label="Shortcuts" className="mt-3 grid grid-cols-4 gap-1">
            {QUICK.map(({ href, label, Icon, tint }) => (
              <Link key={label} href={href} className="flex flex-col items-center gap-1.5 rounded-xl py-1.5 transition active:scale-95 active:bg-mist">
                <span className={`grid size-12 place-items-center rounded-2xl bg-linear-to-br ${tint} text-white shadow-md shadow-navy/20`}>
                  <Icon className="size-5" strokeWidth={1.8} />
                </span>
                <span className="text-[11px] leading-tight font-medium text-ink">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    ),

    welcome: () => <BrandIntro settings={settings} stats={stats} showPromises={false} />,
    promises: () => <BrandIntro settings={settings} stats={stats} showWelcome={false} />,

    featured: () =>
      featured.length > 0 && (
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-8 sm:px-6 sm:pt-16 sm:pb-12">
        {settings.homeIntroTitle && <SectionTitle>{settings.homeIntroTitle}</SectionTitle>}
        {settings.homeIntroText && <p className="mx-auto mt-3 line-clamp-2 max-w-5xl text-center text-[13px] leading-relaxed text-muted sm:mt-5 sm:line-clamp-none">{settings.homeIntroText}</p>}

        <Carousel bleed className="mt-6 sm:mt-10">
          {featured.map((p) => (
            <div key={p.id} className="w-[44%] shrink-0 snap-start sm:w-[calc(33.333%-14px)] lg:w-[calc(20%-16px)]">
              <ProductCard product={p} categoryName={categoryById.get(p.categoryId)?.name} />
            </div>
          ))}
        </Carousel>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:hidden">
          <Link href="/products" className="flex items-center justify-center gap-1.5 rounded-xl bg-navy py-3 text-[11px] tracking-wide text-white uppercase active:scale-95">
            All products <ChevronRight className="size-4" />
          </Link>
          <Link href="/products#filters" className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-300 bg-white py-3 text-[11px] tracking-wide text-ink uppercase active:scale-95">
            <Search className="size-4" /> Filter
          </Link>
        </div>

        <div className="mt-6 hidden items-center justify-end gap-3 sm:flex">
          <span className="leaf-dash" />
          <Link href="/products" className="text-[11px] font-bold text-brand hover:underline">Discover All Products</Link>
        </div>

        <div className="mt-6 hidden justify-center sm:flex">
          <Link
            href="/products#filters"
            className="flex items-center gap-3 border border-neutral-300 px-8 py-3 text-[12px] tracking-wide text-ink uppercase transition hover:border-ink hover:bg-ink hover:text-white"
          >
            <Search className="size-4" /> Advanced Search
          </Link>
        </div>
      </section>
    ),

    /* on phones the first area is a wide feature tile */
    areas: () =>
      rooms.length > 0 && (
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Reveal>
          <h2 className="section-title">{roomCfg.title || "Shop by Area"}</h2>
        </Reveal>
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-10 sm:gap-4 md:grid-cols-3">
          {rooms.map((r, i) => (
            <Reveal key={r.id} delay={i * 70} className={wide(i) ? "col-span-2 sm:col-span-1" : ""}>
              <Link
                href={`/products?application=${encodeURIComponent(r.application)}`}
                className={`group relative block overflow-hidden rounded-2xl bg-neutral-900 transition-transform active:scale-[0.98] sm:aspect-4/3 sm:rounded-none ${wide(i) ? "aspect-[16/9]" : "aspect-square"}`}
              >
                {r.image ? (
                  <Img src={r.image} alt={r.name} fill sizes="(max-width:768px) 50vw, 33vw" className="object-cover opacity-85 transition duration-700 group-hover:scale-110 group-hover:opacity-60" />
                ) : (
                  <PaverArt style={r.pattern} color={r.color} label={r.name} className="absolute inset-0 size-full transition duration-700 group-hover:scale-110" />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3 text-white sm:p-4">
                  <div>
                    <p className={`font-display font-semibold sm:text-xl ${wide(i) ? "text-xl" : "text-[15px]"}`}>{r.name}</p>
                    {roomCfg.showCount && <p className="text-[11px] text-white/75">{r.count} design{r.count === 1 ? "" : "s"}</p>}
                  </div>
                  <span className="grid size-8 place-items-center rounded-full bg-white/15 backdrop-blur transition group-hover:bg-white group-hover:text-ink sm:size-9">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      ),

    thickness: () => <ThicknessGuide cfg={thicknessCfg} />,
    patterns: () => <PaverPatterns cfg={patternCfg} />,

    categories: () => (
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Reveal>
          <SectionTitle>Explore Tiles Collections by Category</SectionTitle>
        </Reveal>
        <Carousel variant="boxed" bleed className="mt-6 sm:mt-14">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className="group w-[44%] shrink-0 snap-start sm:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)]"
            >
              <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-mist sm:rounded-none">
                <Img src={c.image} alt={c.name} fill sizes="(max-width:640px) 50vw, 280px" className="object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <h3 className="mt-2.5 line-clamp-1 text-[14px] text-ink sm:mt-4 sm:text-[15px]">{c.name}</h3>
              <span className="leaf-dash my-1.5 sm:my-2" />
              <span className="text-[10px] font-bold tracking-wide text-brand uppercase group-hover:underline sm:text-[11px]">View details</span>
            </Link>
          ))}
        </Carousel>
        <div className="mt-6 flex justify-center sm:mt-12">
          <Link href="/products" className="w-full rounded-xl bg-navy px-10 py-3.5 text-center text-[12px] tracking-wide text-white uppercase transition hover:bg-navy-deep active:scale-95 sm:w-auto sm:rounded-none sm:py-4">
            Discover All
          </Link>
        </div>
      </section>
    ),

    calculator: () => (
      <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-8">
        <Link href="/tiles-calculator" className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-linear-to-br from-navy to-brand p-5 text-white shadow-lg shadow-navy/25 active:scale-[0.99] sm:gap-6 sm:p-8">
          <PaverArt style="interlock" color="maroon" className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/2 opacity-40 mask-l-from-0% sm:block" />
          <span aria-hidden className="absolute -top-10 -right-10 size-36 rounded-full border-[18px] border-white/10" />
          <span aria-hidden className="absolute -bottom-12 right-16 size-24 rounded-full border-[12px] border-leaf/30" />
          <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur sm:size-16">
            <Calculator className="size-6 sm:size-8" />
          </span>
          <span className="relative min-w-0 flex-1">
            <span className="block font-display text-[17px] leading-tight font-semibold sm:text-2xl">How many tiles do you need?</span>
            <span className="mt-1 block text-[12px] text-white/75 sm:text-sm">Enter the length and width of your area — get the number of pieces and the price in seconds.</span>
          </span>
          <span className="relative hidden items-center gap-2 rounded-xl bg-white px-5 py-3 text-[13px] font-semibold text-navy shadow-lg transition group-hover:gap-3 sm:flex">
            Open calculator <ChevronRight className="size-4" />
          </span>
          <ChevronRight className="relative size-5 shrink-0 sm:hidden" />
        </Link>
      </section>
    ),

    steps: () => <OrderSteps />,
    recent: () => <RecentlyViewed catalog={catalog} title="Continue browsing" />,

    why: () => (
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Reveal>
          <SectionTitle>{settings.whyTitle}</SectionTitle>
        </Reveal>
        <p className="mx-auto mt-3 line-clamp-3 max-w-5xl text-center text-[13px] leading-relaxed text-muted sm:mt-5 sm:line-clamp-none">{settings.whyText}</p>
        <div className="mx-auto mt-6 grid max-w-3xl grid-cols-3 gap-2.5 text-center sm:mt-10 sm:gap-4">
          {[
            { href: "/about", label: "About Us", Icon: Lightbulb },
            { href: "/store-locator?type=Display+Center", label: "Display Center", Icon: MapPinned },
            { href: "/store-locator?type=Dealer", label: "Dealer Profile", Icon: BookOpenCheck },
          ].map(({ href, label, Icon }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col items-center gap-2 rounded-2xl bg-mist px-1 py-4 ring-1 ring-navy/5 transition active:scale-95 sm:gap-3 sm:bg-transparent sm:py-0 sm:ring-0"
            >
              <Icon strokeWidth={1.2} className="size-8 text-navy transition group-hover:-translate-y-1 group-hover:text-brand sm:size-10 sm:text-ink" />
              <span className="text-[12px] leading-tight text-ink sm:text-[15px]">{label}</span>
            </Link>
          ))}
        </div>
        {settings.videoId && (
          <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-2xl sm:mt-14 sm:rounded-none">
            <VideoEmbed id={settings.videoId} title={`${settings.siteName} — Timeless Elegance`} />
          </div>
        )}
      </section>
    ),

    /* compact list cards on phones, big circles on larger screens */
    popular: () => (
      <section className="mt-2 bg-mist py-10 sm:mt-6 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle>Popular</SectionTitle>
          </Reveal>
          <div className="mt-6 grid gap-2.5 sm:mt-12 sm:grid-cols-3 sm:gap-12">
            {[
              { href: "/news?type=Tiles+Care", title: "Tiles Care", Icon: Sparkles, text: "Keep your parking tiles looking new: simple cleaning, re-sanding the joints, removing oil stains and sealing tips that make pavers last for years." },
              { href: "/projects", title: "Projects", Icon: FolderKanban, text: `${settings.siteName} has always been prioritizing versatility and premium quality in each and every project. Get to know some of our nationwide projects.` },
              { href: "/news", title: "News & Events", Icon: Newspaper, text: "We keep all stakeholders informed about current events. Learn more about what is happening around. Stay updated with our events and updates." },
            ].map(({ href, title, Icon, text }) => (
              <Link
                key={title}
                href={href}
                className="group flex items-center gap-4 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-navy/5 transition active:scale-[0.99] sm:block sm:bg-transparent sm:p-0 sm:text-center sm:shadow-none sm:ring-0"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-full border-4 border-neutral-200 bg-white transition group-hover:border-leaf/40 sm:mx-auto sm:size-36 sm:border-[12px]">
                  <Icon strokeWidth={1.2} className="size-6 text-ink transition group-hover:scale-110 sm:size-9" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[13px] font-semibold tracking-wide text-ink uppercase sm:mt-8 sm:font-normal">{title}</h3>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted sm:mx-auto sm:mt-4 sm:line-clamp-none sm:max-w-xs">{text}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted sm:hidden" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    ),

    sustainability: () =>
      sustainability.length > 0 && (
        <section className="bg-mist pt-2 pb-10 sm:pt-4 sm:pb-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal>
              <SectionTitle className="mb-6 sm:mb-10">Sustainability</SectionTitle>
              <SustainabilitySlider items={sustainability} />
            </Reveal>
          </div>
        </section>
      ),
  };

  return (
    <>
      {visible.map((k) => (
        <Fragment key={k}>{blocks[k]()}</Fragment>
      ))}
    </>
  );
}
