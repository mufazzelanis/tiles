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
export function BrandIntro({ settings, stats }: { settings: Settings; stats: { products: number; categories: number; stores: number; divisions: number } }) {
  const [first, ...rest] = settings.siteName.split(" ");
  return (
    <section className="relative overflow-hidden bg-mist">
      {/* soft decorative rings */}
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 size-[420px] rounded-full border-[40px] border-navy/[0.04]" />
      <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-32 size-[360px] rounded-full border-[30px] border-leaf/10" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 md:grid-cols-[auto_1fr] md:gap-14 md:py-20">
        <Reveal className="mx-auto">
          <div className="relative grid size-[200px] place-items-center sm:size-[240px]">
            <span aria-hidden className="absolute inset-0 animate-[spin_40s_linear_infinite] rounded-full border-2 border-dashed border-leaf/60" />
            <span aria-hidden className="absolute inset-3 rounded-full bg-white shadow-[0_20px_50px_-15px_rgba(118,3,8,0.35)]" />
            <Logo name={settings.siteName} variant="seal" size={190} className="relative size-[170px] sm:size-[200px]" />
          </div>
        </Reveal>

        <Reveal delay={120} className="text-center md:text-left">
          <p className="text-[11px] font-semibold tracking-[0.3em] text-leaf uppercase">Welcome to</p>
          <h2 className="mt-2 font-display text-3xl leading-tight font-semibold text-navy sm:text-4xl">
            {first} <span className="text-ink">{rest.join(" ")}</span>
          </h2>
          <p className="mt-2 font-serif text-lg text-brand italic">“{settings.tagline}”</p>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted md:max-w-none">{settings.aboutText.split(/\n\s*\n/)[0]}</p>

          <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link href="/products" className="group flex items-center gap-2 bg-navy px-6 py-3 text-[12px] tracking-wider text-white uppercase shadow-lg shadow-navy/20 transition hover:bg-navy-deep active:scale-95">
              Explore products <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </Link>
            <Link href="/store-locator" className="flex items-center gap-2 border border-navy px-6 py-3 text-[12px] tracking-wider text-navy uppercase transition hover:bg-navy hover:text-white active:scale-95">
              <MapPin className="size-4" /> Find a store
            </Link>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Tile designs", value: stats.products, suffix: "+" },
              { label: "Collections", value: stats.categories, suffix: "" },
              { label: "Stores & dealers", value: stats.stores, suffix: "+" },
              { label: "Divisions served", value: stats.divisions, suffix: "" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white px-4 py-3 text-center shadow-sm ring-1 ring-navy/5 md:text-left">
                <dd className="font-display text-2xl font-semibold text-navy sm:text-3xl">
                  <CountUp value={s.value} suffix={s.suffix} />
                </dd>
                <dt className="mt-0.5 text-[11px] tracking-wide text-muted uppercase">{s.label}</dt>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      <div className="relative border-t border-navy/10 bg-white/60">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-6 lg:grid-cols-4">
          {PROMISES.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <Reveal delay={i * 80} className="flex items-center gap-3 py-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-navy/5 text-navy">
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
    </section>
  );
}
