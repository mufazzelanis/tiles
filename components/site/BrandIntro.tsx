import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, PackageCheck, Truck, Wallet } from "lucide-react";
import type { Settings } from "@/lib/types";
import { Logo } from "./Logo";
import { CountUp } from "./CountUp";
import { Reveal } from "./Reveal";

const PROMISES = [
  { icon: BadgeCheck, title: "100% genuine", text: "Sourced directly from trusted manufacturers" },
  { icon: PackageCheck, title: "Ready stock", text: "Large inventory for fast fulfilment" },
  { icon: Truck, title: "Nationwide delivery", text: "On-time delivery to your site" },
  { icon: Wallet, title: "Best price", text: "Transparent dealer & project pricing" },
];

/** Brand welcome band shown right under the hero. */
export function BrandIntro({ settings, stats, showWelcome = true, showPromises = true }: {
  settings: Settings;
  stats: { products: number; categories: number; stores: number; divisions: number };
  /** logo, intro text and counters */
  showWelcome?: boolean;
  /** the 4-promise strip underneath */
  showPromises?: boolean;
}) {
  if (!showWelcome && !showPromises) return null;
  const [first, ...rest] = settings.siteName.split(" ");
  // a "0" looks empty, so only numbers we can be proud of are shown
  const figures = [
    { label: "Tile designs", value: stats.products, suffix: "+" },
    { label: "Collections", value: stats.categories, suffix: "" },
    { label: "Stores & dealers", value: stats.stores, suffix: "+" },
    { label: "Divisions served", value: stats.divisions, suffix: "" },
  ].filter((s) => s.value > 0);

  return (
    <section className="relative overflow-hidden bg-mist">
      {/* soft decorative rings */}
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 size-[420px] rounded-full border-[40px] border-navy/[0.04]" />
      <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-32 size-[360px] rounded-full border-[30px] border-leaf/10" />

      {showWelcome && (
      <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 pt-10 pb-8 sm:gap-10 sm:px-6 sm:py-14 md:grid-cols-[auto_1fr] md:gap-14 md:py-20">
        <Reveal className="mx-auto">
          <div className="relative grid size-[150px] place-items-center sm:size-[240px]">
            <span aria-hidden className="absolute inset-0 animate-[spin_40s_linear_infinite] rounded-full border-2 border-dashed border-leaf/60" />
            <span aria-hidden className="absolute inset-2.5 rounded-full bg-white shadow-[0_20px_50px_-15px_rgba(118,3,8,0.35)] sm:inset-3" />
            <Logo name={settings.siteName} variant="seal" size={190} className="relative size-[126px] sm:size-[200px]" />
          </div>
        </Reveal>

        <Reveal delay={120} className="text-center md:text-left">
          <p className="text-[10px] font-semibold tracking-[0.3em] text-leaf uppercase sm:text-[11px]">Welcome to</p>
          <h2 className="mt-1.5 font-display text-[26px] leading-tight font-semibold text-navy sm:mt-2 sm:text-4xl">
            {first} <span className="text-ink">{rest.join(" ")}</span>
          </h2>
          <p className="mt-1.5 font-serif text-base text-brand italic sm:mt-2 sm:text-lg">“{settings.tagline}”</p>
          <p className="mx-auto mt-3 line-clamp-4 max-w-2xl text-[13px] leading-relaxed text-muted sm:mt-4 sm:line-clamp-none sm:text-[14px] md:mx-0 md:max-w-none">
            {settings.aboutText.split(/\n\s*\n/)[0]}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:flex sm:flex-wrap sm:justify-center sm:gap-3 md:justify-start">
            <Link
              href="/products"
              className="group flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-[11px] tracking-wider text-white uppercase shadow-lg shadow-navy/20 transition hover:bg-navy-deep active:scale-95 sm:rounded-none sm:px-6 sm:text-[12px]"
            >
              <span className="sm:hidden">Products</span><span className="hidden sm:inline">Explore products</span> <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </Link>
            <Link
              href="/store-locator"
              className="flex items-center justify-center gap-2 rounded-xl border border-navy bg-white/70 px-4 py-3 text-[11px] tracking-wider text-navy uppercase transition hover:bg-navy hover:text-white active:scale-95 sm:rounded-none sm:bg-transparent sm:px-6 sm:text-[12px]"
            >
              <MapPin className="size-4" /> Find a store
            </Link>
          </div>

          {figures.length > 0 && (
            <dl
              className="mt-6 grid grid-cols-(--n) divide-x divide-navy/10 rounded-2xl bg-white shadow-sm ring-1 ring-navy/5 sm:mt-10 sm:grid-cols-4 sm:gap-4 sm:divide-x-0 sm:rounded-none sm:bg-transparent sm:shadow-none sm:ring-0"
              style={{ ["--n" as string]: `repeat(${figures.length}, minmax(0, 1fr))` }}
            >
              {figures.map((s) => (
                <div key={s.label} className="flex flex-col-reverse px-1.5 py-3 text-center sm:rounded-xl sm:bg-white sm:px-4 sm:shadow-sm sm:ring-1 sm:ring-navy/5 md:text-left">
                  <dt className="mt-0.5 text-[9px] leading-tight tracking-wide text-muted uppercase sm:text-[11px]">{s.label}</dt>
                  <dd className="font-display text-xl font-semibold text-navy sm:text-3xl">
                    <CountUp value={s.value} suffix={s.suffix} />
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Reveal>
      </div>
      )}

      {/* promises: a swipeable strip on phones, a row on larger screens */}
      {showPromises && (
      <div className={`relative bg-white/60 ${showWelcome ? "border-t border-navy/10" : ""}`}>
        <ul className="no-scrollbar mx-auto flex max-w-6xl snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-px-4 px-4 py-3 sm:grid sm:grid-cols-2 sm:gap-px sm:overflow-visible sm:px-6 sm:py-0 lg:grid-cols-4">
          {PROMISES.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="w-[68%] shrink-0 snap-start sm:w-auto">
              <Reveal delay={i * 80} className="flex h-full items-center gap-3 rounded-xl bg-white px-3 py-3 ring-1 ring-navy/5 sm:rounded-none sm:bg-transparent sm:px-0 sm:py-5 sm:ring-0">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy/5 text-navy sm:size-11">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block text-[13px] font-semibold text-ink">{title}</span>
                  <span className="block text-[11px] leading-snug text-muted">{text}</span>
                </span>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
      )}
    </section>
  );
}
