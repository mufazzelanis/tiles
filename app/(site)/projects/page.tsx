import type { Metadata } from "next";
import { Building2, CalendarDays, MapPin } from "lucide-react";
import Img from "@/components/Img";
import { getSite } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { SEED_IMAGES } from "@/lib/seed";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const { projects } = await getSite();
  return (
    <>
      <PageHero title="Our Projects" subtitle="Homes, hotels and landmarks finished with our tiles across the country." image={SEED_IMAGES.apartment} crumbs={[{ href: "/projects", label: "Projects" }]} />
      <div className="mx-auto max-w-6xl space-y-16 px-6 py-14">
        {projects.map((p, i) => (
          <article key={p.id} className="grid items-center gap-8 md:grid-cols-2">
            <div className={`relative aspect-4/3 overflow-hidden ${i % 2 ? "md:order-2" : ""}`}>
              <Img src={p.image} alt={p.title} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
              <div className="absolute inset-4 border border-white/70" />
            </div>
            <div>
              <p className="text-[11px] tracking-[0.25em] text-brand uppercase">Project {String(i + 1).padStart(2, "0")}</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-ink">{p.title}</h2>
              <span className="leaf-dash my-4" />
              <p className="text-[14px] leading-relaxed text-muted">{p.description}</p>
              <ul className="mt-5 space-y-2 text-[13px] text-ink">
                {p.client && <li className="flex items-center gap-2"><Building2 className="size-4 text-muted" /> {p.client}</li>}
                {p.location && <li className="flex items-center gap-2"><MapPin className="size-4 text-muted" /> {p.location}</li>}
                {p.year > 0 && <li className="flex items-center gap-2"><CalendarDays className="size-4 text-muted" /> {p.year}</li>}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
