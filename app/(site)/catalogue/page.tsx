import type { Metadata } from "next";
import { Download, Eye, FileText } from "lucide-react";
import Img from "@/components/Img";
import { CatalogueCover } from "@/components/CatalogueCover";
import { getCataloguePage, getSite } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { SEED_IMAGES } from "@/lib/seed";
import { formatBytes } from "@/lib/catalogue";
import type { Catalogue } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCataloguePage();
  return { title: page.heroTitle || "Catalogue", description: page.heroSubtitle };
}

export default async function CataloguePage() {
  const [{ catalogues }, page] = await Promise.all([getSite(), getCataloguePage()]);
  const sections = page.sections.filter((s) => s.enabled);
  const known = new Set(page.sections.map((s) => s.id));
  // a catalogue without a (still existing) section goes into the first one
  const inSection = (c: Catalogue, id: string) => {
    const own = (c.sections ?? []).filter((s) => known.has(s));
    return own.length ? own.includes(id) : id === sections[0]?.id;
  };
  const groups = sections.map((s) => ({ ...s, items: catalogues.filter((c) => inSection(c, s.id)) })).filter((g) => g.items.length);

  return (
    <>
      <PageHero
        title={page.heroTitle || "Catalogue"}
        subtitle={page.heroSubtitle}
        image={page.heroImage || SEED_IMAGES.livingRoom2}
        crumbs={[{ href: "/catalogue", label: "Catalogue" }]}
      />
      <div className="mx-auto max-w-7xl px-6 py-14 sm:py-16">
        {groups.map((g) => (
          <section key={g.id} className="mb-16 last:mb-0" aria-labelledby={`sec-${g.id}`}>
            <div className="mb-8 flex items-center gap-5">
              <span className="h-px flex-1 bg-neutral-200" />
              <h2 id={`sec-${g.id}`} className="font-display text-xl text-ink sm:text-2xl">{g.title}</h2>
              <span className="h-px flex-1 bg-neutral-200" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((c) => <Card key={`${g.id}-${c.id}`} c={c} />)}
            </div>
          </section>
        ))}
        {!groups.length && (
          <div className="py-20 text-center">
            <FileText className="mx-auto size-10 text-neutral-300" />
            <p className="mt-3 text-lg text-ink">New catalogues are on their way.</p>
            <p className="text-sm text-muted">Please check back soon, or contact us for a copy.</p>
          </div>
        )}
      </div>
    </>
  );
}

function Card({ c }: { c: Catalogue }) {
  const hasFile = !!c.fileUrl && c.fileUrl !== "#";
  const size = formatBytes(c.fileSize);
  return (
    <article className="group border border-neutral-200 bg-white transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="relative aspect-4/3 overflow-hidden bg-mist">
        {c.cover ? (
          <Img src={c.cover} alt={c.title} fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <CatalogueCover title={c.title} subtitle={c.subtitle} year={c.year} style={c.coverStyle} color={c.coverColor} className="absolute inset-0 transition duration-700 group-hover:scale-[1.03]" />
        )}
        {/* actions on hover (always visible on touch screens) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 p-5 text-center text-white opacity-0 transition group-hover:opacity-100 max-lg:hidden">
          {c.description && <p className="line-clamp-3 max-w-xs text-[13px] leading-relaxed text-white/90">{c.description}</p>}
          {hasFile ? (
            <div className="flex gap-2">
              <a href={`/catalogue/${c.id}/download?view=1`} target="_blank" rel="noopener" className="flex items-center gap-1.5 border border-white/80 px-4 py-2 text-[11px] tracking-wider uppercase transition hover:bg-white hover:text-ink">
                <Eye className="size-4" /> View
              </a>
              <a href={`/catalogue/${c.id}/download`} className="flex items-center gap-1.5 bg-white px-4 py-2 text-[11px] tracking-wider text-ink uppercase transition hover:bg-leaf hover:text-white">
                <Download className="size-4" /> Download
              </a>
            </div>
          ) : (
            <span className="border border-white/60 px-4 py-2 text-[11px] tracking-wider uppercase">Coming soon</span>
          )}
        </div>
      </div>
      <div className="flex items-end justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="text-[12.5px] leading-snug tracking-[0.08em] text-ink uppercase">{c.title}</h3>
          <p className="mt-1 text-[11px] text-muted">{hasFile ? size || "PDF" : "Coming soon"}</p>
        </div>
        {hasFile && (
          <a href={`/catalogue/${c.id}/download`} className="grid size-9 shrink-0 place-items-center border border-neutral-300 text-ink transition hover:border-brand hover:bg-brand hover:text-white" aria-label={`Download ${c.title}`}>
            <Download className="size-4" />
          </a>
        )}
      </div>
    </article>
  );
}
