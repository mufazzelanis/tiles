import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Img from "@/components/Img";
import { getSite } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export async function generateStaticParams() {
  const { news } = await getSite();
  return news.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: PageProps<"/news/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = (await getSite()).news.find((n) => n.slug === slug);
  return post ? { title: post.title, description: post.excerpt, openGraph: { images: [post.image] } } : {};
}

export default async function NewsPost({ params }: PageProps<"/news/[slug]">) {
  const { slug } = await params;
  const { news } = await getSite();
  const post = news.find((n) => n.slug === slug);
  if (!post) notFound();
  const more = news.filter((n) => n.id !== post.id).slice(0, 3);

  return (
    <article>
      <div className="relative h-[46vh] min-h-[320px] bg-neutral-900">
        <Img src={post.image} alt="" fill preload sizes="100vw" className="object-cover opacity-60" />
        <div className="relative mx-auto flex h-full max-w-3xl flex-col justify-end px-6 pb-12 text-white">
          <p className="text-[11px] tracking-[0.25em] uppercase opacity-80">{post.type} · {formatDate(post.publishedAt)}</p>
          <h1 className="animate-fade-up mt-3 font-display text-3xl font-semibold sm:text-4xl">{post.title}</h1>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/news" className="mb-8 inline-flex items-center gap-2 text-[12px] text-brand hover:underline">
          <ArrowLeft className="size-4" /> All news
        </Link>
        {post.excerpt && <p className="mb-6 text-lg leading-relaxed text-ink">{post.excerpt}</p>}
        <div className="space-y-5 text-[15px] leading-relaxed text-neutral-600">
          {post.content.split(/\n\s*\n/).map((para, i) => (
            <p key={i} className="whitespace-pre-line">{para}</p>
          ))}
        </div>
      </div>
      {more.length > 0 && (
        <div className="bg-mist py-14">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-3">
            {more.map((n) => (
              <Link key={n.id} href={`/news/${n.slug}`} className="group">
                <div className="relative aspect-16/10 overflow-hidden">
                  <Img src={n.image} alt={n.title} fill sizes="33vw" className="object-cover transition duration-700 group-hover:scale-105" />
                </div>
                <h3 className="mt-3 text-[15px] font-semibold text-ink group-hover:text-brand">{n.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
