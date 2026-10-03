import type { Metadata } from "next";
import Link from "next/link";
import Img from "@/components/Img";
import { getSite } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { SEED_IMAGES } from "@/lib/seed";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "News & Events" };

const TYPES = ["News", "Event", "Tiles Care"];

export default async function NewsPage({ searchParams }: PageProps<"/news">) {
  const type = String((await searchParams).type ?? "");
  const { news } = await getSite();
  const posts = type ? news.filter((n) => n.type === type) : news;
  const [lead, ...rest] = posts;

  return (
    <>
      <PageHero
        title={type === "Tiles Care" ? "Tiles Care" : "News & Events"}
        subtitle="Stories, events and expert advice to keep your tiles looking new."
        image={SEED_IMAGES.lounge}
        crumbs={[{ href: "/news", label: "News" }]}
      />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {["", ...TYPES].map((t) => (
            <Link
              key={t || "all"}
              href={t ? `/news?type=${encodeURIComponent(t)}` : "/news"}
              className={cn("border px-4 py-1.5 text-[12px] tracking-wide uppercase transition", type === t ? "border-navy bg-navy text-white" : "border-neutral-300 text-ink hover:border-ink")}
            >
              {t || "All"}
            </Link>
          ))}
        </div>

        {lead && (
          <Link href={`/news/${lead.slug}`} className="group grid overflow-hidden border border-neutral-200 md:grid-cols-2">
            <div className="relative aspect-16/10 overflow-hidden">
              <Img src={lead.image} alt={lead.title} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" />
            </div>
            <div className="flex flex-col justify-center p-8">
              <p className="text-[11px] tracking-[0.2em] text-brand uppercase">{lead.type} · {formatDate(lead.publishedAt)}</p>
              <h2 className="mt-3 font-display text-2xl font-semibold text-ink">{lead.title}</h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">{lead.excerpt}</p>
              <span className="mt-5 text-[12px] font-bold text-brand uppercase group-hover:underline">Read more</span>
            </div>
          </Link>
        )}

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((n) => (
            <Link key={n.id} href={`/news/${n.slug}`} className="group">
              <div className="relative aspect-16/10 overflow-hidden bg-mist">
                <Img src={n.image} alt={n.title} fill sizes="(max-width:640px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <p className="mt-4 text-[11px] tracking-[0.2em] text-brand uppercase">{n.type} · {formatDate(n.publishedAt)}</p>
              <h3 className="mt-2 text-[16px] font-semibold text-ink group-hover:text-brand">{n.title}</h3>
              <p className="mt-2 line-clamp-2 text-[13px] text-muted">{n.excerpt}</p>
            </Link>
          ))}
        </div>
        {!posts.length && <p className="py-20 text-center text-muted">Nothing published here yet.</p>}
      </div>
    </>
  );
}
