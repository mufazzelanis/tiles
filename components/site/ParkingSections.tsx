import Link from "next/link";
import { ArrowRight, Bike, Bus, Car, Factory, Footprints, MessageCircle, Truck } from "lucide-react";
import Img from "@/components/Img";
import { PaverArt } from "@/components/CatalogueCover";
import type { HomePatterns } from "@/lib/home-patterns";
import type { HomeThickness } from "@/lib/home-thickness";
import { txt, type SectionContent } from "@/lib/home-content";
import { HomeIcon } from "@/components/HomeIcon";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./PageHero";

/* ------------------------------------------------------------------ thickness guide */

const THICKNESS_ICON = { walk: Footprints, bike: Bike, car: Car, bus: Bus, truck: Truck, factory: Factory } as const;

/** Side view of a paver laid on its sand bed and stone base; the block grows with the thickness. */
function LayerDiagram({ mm }: { mm: number }) {
  const h = Math.min(mm, 140) / 2.2; // block height in the drawing
  const top = 66 - h;
  return (
    <svg viewBox="0 0 160 100" className="h-24 w-full" aria-hidden>
      {/* stone base */}
      <rect x="4" y="74" width="152" height="22" rx="2" fill="#d9cbb6" />
      {[14, 34, 56, 78, 100, 122, 142].map((x, i) => (
        <circle key={x} cx={x} cy={84 + (i % 2) * 5} r="3" fill="#bba88c" />
      ))}
      {/* sand bed */}
      <rect x="4" y="66" width="152" height="8" fill="#eedfb8" />
      {/* three pavers */}
      {[6, 56, 106].map((x) => (
        <g key={x}>
          <rect x={x} y={top} width="48" height={h} rx="2" fill="var(--color-navy)" />
          <rect x={x} y={top} width="48" height="4" rx="2" fill="var(--color-brand)" />
        </g>
      ))}
      {/* height marker */}
      <line x1="158" y1={top} x2="158" y2="66" stroke="var(--color-leaf)" strokeWidth="2" />
    </svg>
  );
}

/** Cards and texts are set in Admin → Thickness Guide. */
export function ThicknessGuide({ cfg }: { cfg: HomeThickness }) {
  const cards = cfg.cards.filter((c) => c.enabled);
  if (!cards.length) return null;
  const cols = cards.length === 1 ? "sm:grid-cols-1 sm:max-w-md sm:mx-auto" : cards.length === 2 ? "sm:grid-cols-2" : cards.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3";
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Reveal>
        <SectionTitle>{cfg.title || "Which Thickness Do I Need?"}</SectionTitle>
      </Reveal>
      {cfg.subtitle && <p className="mx-auto mt-3 max-w-2xl text-center text-[13px] leading-relaxed text-muted sm:mt-5">{cfg.subtitle}</p>}
      <div className={`no-scrollbar -mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pt-3 pb-2 sm:mx-0 sm:mt-8 sm:grid sm:gap-5 sm:overflow-visible sm:px-0 ${cols}`}>
        {cards.map(({ id, mm, title, icon, load, uses, popular }, i) => {
          const Icon = THICKNESS_ICON[icon as keyof typeof THICKNESS_ICON] ?? Footprints;
          return (
            <Reveal key={id} delay={i * 90} className="w-[80%] shrink-0 snap-start sm:w-auto">
              <div className={`relative flex h-full flex-col rounded-2xl border bg-white p-5 transition hover:-translate-y-1 hover:shadow-xl ${popular ? "border-navy shadow-lg shadow-navy/10" : "border-neutral-200"}`}>
                {popular && cfg.badge && <span className="absolute -top-3 left-5 rounded-full bg-navy px-3 py-1 text-[10px] font-semibold tracking-wider text-white uppercase">{cfg.badge}</span>}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-4xl leading-none font-semibold text-navy">
                      {mm}
                      <span className="ml-1 text-base text-muted">mm</span>
                    </p>
                    <p className="mt-2 text-[15px] font-semibold text-ink">{title}</p>
                  </div>
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mist text-navy">
                    <Icon className="size-5" />
                  </span>
                </div>
                <div className="mt-4 rounded-xl bg-mist/70 px-2 pt-2">
                  <LayerDiagram mm={mm} />
                </div>
                {load && <p className="mt-4 text-[12px] font-semibold tracking-wide text-brand uppercase">Takes: {load}</p>}
                {uses.length > 0 && (
                  <ul className="mt-2 space-y-1.5 text-[13px] text-ink">
                    {uses.map((u) => (
                      <li key={u} className="flex items-center gap-2">
                        <span className="size-1.5 shrink-0 rounded-full bg-leaf" /> {u}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>
      {(cfg.note || (cfg.linkLabel && cfg.linkHref)) && (
        <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[12px] text-muted">
          {cfg.note}
          {cfg.linkLabel && cfg.linkHref && (
            <Link href={cfg.linkHref} className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
              <MessageCircle className="size-3.5" /> {cfg.linkLabel}
            </Link>
          )}
        </p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ paver patterns */

/** Cards are set in Admin → Paver Patterns; a card without a photo shows the drawn pattern. */
export function PaverPatterns({ cfg }: { cfg: HomePatterns }) {
  const cards = cfg.cards.filter((c) => c.enabled);
  if (!cards.length) return null;
  // the grid fits the number of cards on large screens
  const lg = cards.length <= 3 ? "lg:grid-cols-3" : cards.length === 4 ? "lg:grid-cols-4" : cards.length === 5 ? "lg:grid-cols-5" : "lg:grid-cols-6";
  return (
    <section className="bg-mist py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionTitle>{cfg.title || "Popular Paver Patterns"}</SectionTitle>
        </Reveal>
        {cfg.subtitle && <p className="mx-auto mt-3 max-w-2xl text-center text-[13px] leading-relaxed text-muted sm:mt-5">{cfg.subtitle}</p>}
        <div className={`no-scrollbar -mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 sm:mx-0 sm:mt-10 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:gap-4 ${lg}`}>
          {cards.map((p, i) => (
            <Reveal key={p.id} delay={i * 60} className="w-[42%] shrink-0 snap-start sm:w-auto">
              <Link href={p.link || "/products"} className="group block h-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-navy/5 transition hover:-translate-y-1 hover:shadow-lg">
                <div className="relative aspect-square overflow-hidden">
                  {p.image ? (
                    <Img src={p.image} alt={p.name} fill sizes="(max-width:640px) 45vw, 200px" className="object-cover transition duration-700 group-hover:scale-110" />
                  ) : (
                    <PaverArt style={p.pattern} color={p.color} label={`${p.name} pattern`} className="absolute inset-0 size-full transition duration-700 group-hover:scale-110" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[13px] font-semibold text-ink">{p.name}</p>
                  {p.text && <p className="mt-1 text-[11.5px] leading-snug text-muted">{p.text}</p>}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ how ordering works */

/** Texts and steps are set in Admin → Home page → How ordering works. */
export function OrderSteps({ cfg }: { cfg: SectionContent }) {
  const steps = cfg.items ?? [];
  if (!steps.length) return null;
  const cols = steps.length === 1 ? "" : steps.length === 2 ? "sm:grid-cols-2" : steps.length === 3 ? "sm:grid-cols-3" : steps.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <section className="relative overflow-hidden bg-navy py-10 text-white sm:py-14">
      <PaverArt style="interlock" color="maroon" className="pointer-events-none absolute inset-0 size-full opacity-25" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          {txt(cfg, "eyebrow") && <p className="text-[10px] font-semibold tracking-[0.3em] text-leaf uppercase sm:text-[11px]">{txt(cfg, "eyebrow")}</p>}
          {txt(cfg, "title") && <h2 className="mt-1.5 font-display text-2xl font-semibold sm:text-3xl">{txt(cfg, "title")}</h2>}
        </Reveal>
        <div role="list" className={`mt-8 grid gap-3 sm:mt-10 sm:gap-4 ${cols}`}>
          {steps.map(({ icon, title, text, link, linkLabel }, i) => (
            <Reveal key={i} delay={i * 90}>
              <div role="listitem" className="relative flex h-full gap-4 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10 backdrop-blur-sm sm:flex-col sm:p-5">
                <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-navy shadow-lg">
                  <HomeIcon name={icon} className="size-5" />
                  <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-leaf text-[11px] font-bold text-white ring-2 ring-navy">{i + 1}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold">{title}</p>
                  {text && <p className="mt-1 text-[12.5px] leading-snug text-white/70">{text}</p>}
                  {linkLabel && link && (
                    <Link href={link} className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-leaf hover:underline">
                      {linkLabel} <ArrowRight className="size-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
