import { Fragment } from "react";
import Link from "next/link";
import { ArrowUpRight, Calculator, ChevronRight, Search } from "lucide-react";
import { HomeIcon } from "@/components/HomeIcon";
import { txt } from "@/lib/home-content";
import Img from "@/components/Img";
import { getCatalog, getHomeContent, getHomePatterns, getHomeRooms, getHomeSections, getHomeThickness, getSite } from "@/lib/queries";
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

/** Colours of the phone shortcut icons, in order. */
const QUICK_TINTS = ["from-navy to-brand", "from-leaf to-[#a77d2f]", "from-charcoal to-ink", "from-brand to-navy"];
/** grid columns by number of items (full class names so Tailwind keeps them) */
const COLS = ["", "sm:grid-cols-1", "sm:grid-cols-2", "sm:grid-cols-3", "sm:grid-cols-4"];
const QUICK_COLS = ["", "grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4"];

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
  // texts, links and icons of every section (Admin → Home page → Edit content)
  const c = await getHomeContent();
  const quickItems = c.quick?.items ?? [];
  const whyItems = c.why?.items ?? [];
  const popularItems = c.popular?.items ?? [];
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
              placeholder={txt(c.quick, "placeholder") || "Search…"}
              aria-label="Search tiles"
              className="h-11 min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted/80"
            />
            <button type="submit" className="rounded-lg bg-navy px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white uppercase active:scale-95">
              {txt(c.quick, "button") || "Go"}
            </button>
          </form>
          {quickItems.length > 0 && (
            <nav aria-label="Shortcuts" className={`mt-3 grid gap-1 ${QUICK_COLS[quickItems.length] ?? "grid-cols-4"}`}>
              {quickItems.map((q, i) => (
                <Link key={i} href={q.link || "/products"} className="flex flex-col items-center gap-1.5 rounded-xl py-1.5 transition active:scale-95 active:bg-mist">
                  <span className={`grid size-12 place-items-center rounded-2xl bg-linear-to-br ${QUICK_TINTS[i % QUICK_TINTS.length]} text-white shadow-md shadow-navy/20`}>
                    <HomeIcon name={q.icon} className="size-5" strokeWidth={1.8} />
                  </span>
                  <span className="text-[11px] leading-tight font-medium text-ink">{q.label}</span>
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    ),

    welcome: () => <BrandIntro settings={settings} stats={stats} welcome={c.welcome ?? {}} promises={[]} showPromises={false} />,
    promises: () => <BrandIntro settings={settings} stats={stats} welcome={c.welcome ?? {}} promises={c.promises?.items ?? []} showWelcome={false} />,

    featured: () =>
      featured.length > 0 && (
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-8 sm:px-6 sm:pt-16 sm:pb-12">
        {txt(c.featured, "title") && <SectionTitle>{txt(c.featured, "title")}</SectionTitle>}
        {txt(c.featured, "text") && <p className="mx-auto mt-3 line-clamp-2 max-w-5xl text-center text-[13px] leading-relaxed text-muted sm:mt-5 sm:line-clamp-none">{txt(c.featured, "text")}</p>}

        <Carousel bleed className="mt-6 sm:mt-10">
          {featured.map((p) => (
            <div key={p.id} className="w-[44%] shrink-0 snap-start sm:w-[calc(33.333%-14px)] lg:w-[calc(20%-16px)]">
              <ProductCard product={p} categoryName={categoryById.get(p.categoryId)?.name} />
            </div>
          ))}
        </Carousel>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:hidden">
          <Link href="/products" className="flex items-center justify-center gap-1.5 rounded-xl bg-navy py-3 text-[11px] tracking-wide text-white uppercase active:scale-95">
            {txt(c.featured, "allLabel") || "All products"} <ChevronRight className="size-4" />
          </Link>
          <Link href="/products#filters" className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-300 bg-white py-3 text-[11px] tracking-wide text-ink uppercase active:scale-95">
            <Search className="size-4" /> Filter
          </Link>
        </div>

        <div className="mt-6 hidden items-center justify-end gap-3 sm:flex">
          <span className="leaf-dash" />
          <Link href="/products" className="text-[11px] font-bold text-brand hover:underline">{txt(c.featured, "allLabel") || "All products"}</Link>
        </div>

        <div className="mt-6 hidden justify-center sm:flex">
          <Link
            href="/products#filters"
            className="flex items-center gap-3 border border-neutral-300 px-8 py-3 text-[12px] tracking-wide text-ink uppercase transition hover:border-ink hover:bg-ink hover:text-white"
          >
            <Search className="size-4" /> {txt(c.featured, "searchLabel") || "Search"}
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
          {txt(c.categories, "title") && <SectionTitle>{txt(c.categories, "title")}</SectionTitle>}
        </Reveal>
        <Carousel variant="boxed" bleed className="mt-6 sm:mt-14">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group w-[44%] shrink-0 snap-start sm:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)]"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-mist sm:rounded-none">
                <Img src={cat.image} alt={cat.name} fill sizes="(max-width:640px) 50vw, 280px" className="object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <h3 className="mt-2.5 line-clamp-1 text-[14px] text-ink sm:mt-4 sm:text-[15px]">{cat.name}</h3>
              <span className="leaf-dash my-1.5 sm:my-2" />
              {txt(c.categories, "cardLabel") && <span className="text-[10px] font-bold tracking-wide text-brand uppercase group-hover:underline sm:text-[11px]">{txt(c.categories, "cardLabel")}</span>}
            </Link>
          ))}
        </Carousel>
        {txt(c.categories, "button") && (
          <div className="mt-6 flex justify-center sm:mt-12">
            <Link href="/products" className="w-full rounded-xl bg-navy px-10 py-3.5 text-center text-[12px] tracking-wide text-white uppercase transition hover:bg-navy-deep active:scale-95 sm:w-auto sm:rounded-none sm:py-4">
              {txt(c.categories, "button")}
            </Link>
          </div>
        )}
      </section>
    ),

    calculator: () => (
      <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-8">
        <Link href={txt(c.calculator, "link") || "/tiles-calculator"} className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-linear-to-br from-navy to-brand p-5 text-white shadow-lg shadow-navy/25 active:scale-[0.99] sm:gap-6 sm:p-8">
          <PaverArt style="interlock" color="maroon" className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/2 opacity-40 mask-l-from-0% sm:block" />
          <span aria-hidden className="absolute -top-10 -right-10 size-36 rounded-full border-[18px] border-white/10" />
          <span aria-hidden className="absolute -bottom-12 right-16 size-24 rounded-full border-[12px] border-leaf/30" />
          <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur sm:size-16">
            <Calculator className="size-6 sm:size-8" />
          </span>
          <span className="relative min-w-0 flex-1">
            <span className="block font-display text-[17px] leading-tight font-semibold sm:text-2xl">{txt(c.calculator, "title")}</span>
            {txt(c.calculator, "text") && <span className="mt-1 block text-[12px] text-white/75 sm:text-sm">{txt(c.calculator, "text")}</span>}
          </span>
          {txt(c.calculator, "button") && (
            <span className="relative hidden items-center gap-2 rounded-xl bg-white px-5 py-3 text-[13px] font-semibold text-navy shadow-lg transition group-hover:gap-3 sm:flex">
              {txt(c.calculator, "button")} <ChevronRight className="size-4" />
            </span>
          )}
          <ChevronRight className="relative size-5 shrink-0 sm:hidden" />
        </Link>
      </section>
    ),

    steps: () => <OrderSteps cfg={c.steps ?? {}} />,
    recent: () => <RecentlyViewed catalog={catalog} title={txt(c.recent, "title") || "Continue browsing"} />,

    why: () => (
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {txt(c.why, "title") && (
          <Reveal>
            <SectionTitle>{txt(c.why, "title")}</SectionTitle>
          </Reveal>
        )}
        {txt(c.why, "text") && <p className="mx-auto mt-3 line-clamp-3 max-w-5xl text-center text-[13px] leading-relaxed text-muted sm:mt-5 sm:line-clamp-none">{txt(c.why, "text")}</p>}
        {whyItems.length > 0 && (
          <div className={`mx-auto mt-6 grid max-w-3xl gap-2.5 text-center sm:mt-10 sm:gap-4 ${QUICK_COLS[whyItems.length] ?? "grid-cols-3"}`}>
            {whyItems.map((w, i) => (
              <Link
                key={i}
                href={w.link || "/about"}
                className="group flex flex-col items-center gap-2 rounded-2xl bg-mist px-1 py-4 ring-1 ring-navy/5 transition active:scale-95 sm:gap-3 sm:bg-transparent sm:py-0 sm:ring-0"
              >
                <HomeIcon name={w.icon} strokeWidth={1.2} className="size-8 text-navy transition group-hover:-translate-y-1 group-hover:text-brand sm:size-10 sm:text-ink" />
                <span className="text-[12px] leading-tight text-ink sm:text-[15px]">{w.label}</span>
              </Link>
            ))}
          </div>
        )}
        {settings.videoId && (
          <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-2xl sm:mt-14 sm:rounded-none">
            <VideoEmbed id={settings.videoId} title={`${settings.siteName} — Timeless Elegance`} />
          </div>
        )}
      </section>
    ),

    /* compact list cards on phones, big circles on larger screens */
    popular: () =>
      popularItems.length > 0 && (
      <section className="mt-2 bg-mist py-10 sm:mt-6 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {txt(c.popular, "title") && (
            <Reveal>
              <SectionTitle>{txt(c.popular, "title")}</SectionTitle>
            </Reveal>
          )}
          <div className={`mt-6 grid gap-2.5 sm:mt-12 sm:gap-12 ${COLS[popularItems.length] ?? "sm:grid-cols-3"}`}>
            {popularItems.map(({ link, title, icon, text }, i) => (
              <Link
                key={i}
                href={link || "/news"}
                className="group flex items-center gap-4 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-navy/5 transition active:scale-[0.99] sm:block sm:bg-transparent sm:p-0 sm:text-center sm:shadow-none sm:ring-0"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-full border-4 border-neutral-200 bg-white transition group-hover:border-leaf/40 sm:mx-auto sm:size-36 sm:border-[12px]">
                  <HomeIcon name={icon} strokeWidth={1.2} className="size-6 text-ink transition group-hover:scale-110 sm:size-9" />
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
              {txt(c.sustainability, "title") && <SectionTitle className="mb-6 sm:mb-10">{txt(c.sustainability, "title")}</SectionTitle>}
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
