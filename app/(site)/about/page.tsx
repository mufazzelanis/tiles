import type { Metadata } from "next";
import Link from "next/link";
import { Award, Factory, Leaf, ShieldCheck } from "lucide-react";
import Img from "@/components/Img";
import { getSite } from "@/lib/queries";
import { PageHero, SectionTitle } from "@/components/site/PageHero";
import { SEED_IMAGES } from "@/lib/seed";
import { Logo } from "@/components/site/Logo";

export const metadata: Metadata = { title: "About Us" };

export default async function AboutPage() {
  const { settings, products, stores, projects } = await getSite();
  const stats = [
    { value: `${products.length}+`, label: "Tile designs" },
    { value: `${stores.length}+`, label: "Stores & dealers" },
    { value: `${projects.length}+`, label: "Landmark projects" },
    { value: "8", label: "Divisions covered" },
  ];
  return (
    <>
      <PageHero title="About Us" subtitle={settings.tagline} image={SEED_IMAGES.interior2} crumbs={[{ href: "/about", label: "About" }]} />
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2">
        <div className="relative">
          <div className="relative aspect-4/5 overflow-hidden">
            <Img src={SEED_IMAGES.house} alt="" fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
          </div>
          {/* brand seal overlapping the photo */}
          <span className="absolute -right-4 -bottom-8 rounded-full bg-mist p-1.5 shadow-2xl ring-4 ring-white sm:-right-8">
            <Logo name={settings.siteName} variant="seal" size={150} className="size-[120px] sm:size-[150px]" />
          </span>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.25em] text-brand uppercase">Our story</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink">{settings.siteName}</h2>
          <span className="leaf-dash my-5" />
          <div className="space-y-4 text-[15px] leading-relaxed text-neutral-600">
            {settings.aboutText.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="border-l-2 border-leaf pl-4">
                <dt className="text-[11px] tracking-wider text-muted uppercase">{s.label}</dt>
                <dd className="font-display text-3xl font-semibold text-ink">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <section id="why" className="bg-mist py-16">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle>{settings.whyTitle}</SectionTitle>
          <p className="mx-auto mt-5 max-w-4xl text-center text-[13px] leading-relaxed text-muted">{settings.whyText}</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: Factory, t: "Advanced manufacturing", d: "Fully automated lines with digital inkjet printing." },
              { Icon: ShieldCheck, t: "Strict quality", d: "Every batch tested for strength, absorption and shade." },
              { Icon: Leaf, t: "Sustainable", d: "Heat recovery and closed-loop water recycling." },
              { Icon: Award, t: "Trusted nationwide", d: "Chosen by leading developers and architects." },
            ].map(({ Icon, t, d }) => (
              <div key={t} className="bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
                <Icon strokeWidth={1.3} className="size-9 text-brand" />
                <h3 className="mt-4 font-semibold text-ink">{t}</h3>
                <p className="mt-2 text-[13px] text-muted">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/contact" className="bg-navy px-10 py-4 text-[12px] tracking-wide text-white uppercase hover:bg-navy-deep">Get in touch</Link>
          </div>
        </div>
      </section>
    </>
  );
}
