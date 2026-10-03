import type { Metadata } from "next";
import { Download } from "lucide-react";
import Img from "@/components/Img";
import { getSite } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { SEED_IMAGES } from "@/lib/seed";

export const metadata: Metadata = { title: "Catalogue" };

export default async function CataloguePage() {
  const { catalogues } = await getSite();
  return (
    <>
      <PageHero title="Catalogue" subtitle="Download our latest product catalogues and lookbooks." image={SEED_IMAGES.livingRoom2} crumbs={[{ href: "/catalogue", label: "Catalogue" }]} />
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-2 lg:grid-cols-3">
        {catalogues.map((c) => (
          <a key={c.id} href={c.fileUrl || "#"} target="_blank" rel="noopener noreferrer" className="group block">
            <div className="relative aspect-3/4 overflow-hidden bg-mist shadow-md transition group-hover:-translate-y-1 group-hover:shadow-2xl">
              <Img src={c.cover} alt={c.title} fill sizes="(max-width:640px) 100vw, 33vw" className="object-cover" />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-[11px] tracking-[0.2em] uppercase opacity-80">{c.year}</p>
                <h2 className="mt-1 font-display text-xl font-semibold">{c.title}</h2>
              </div>
            </div>
            <span className="mt-4 flex items-center gap-2 text-[12px] font-bold tracking-wide text-brand uppercase group-hover:underline">
              <Download className="size-4" /> Download PDF
            </span>
          </a>
        ))}
      </div>
    </>
  );
}
