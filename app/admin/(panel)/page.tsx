import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle, ArrowRight, ArrowUpRight, CircleCheck, Clock, Eye, FileText, GalleryHorizontal, Inbox, MapPin, Newspaper,
  Package, Plus, Tags, Upload, XCircle,
} from "lucide-react";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge, Card } from "@/components/admin/ui";
import { BarList, Delta, ScoreRing, Sparkline, StatusBar, TrendChart } from "@/components/admin/charts";
import { SERIES } from "@/lib/chart-colors";
import { timeAgo } from "@/lib/utils";
import { can, MODULES, type Action } from "@/lib/permissions";

export const metadata: Metadata = { title: "Dashboard" };

const DAY = 86400000;
const STATUS_TONE = { new: "indigo", "in-progress": "amber", closed: "green" } as const;

/** Day buckets ending today (kept outside the component for the purity lint). */
function dailyCounts(dates: string[], days: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = today.getTime() - (days - 1) * DAY;
  const buckets = Array.from({ length: days }, (_, i) => ({ date: new Date(start + i * DAY).toISOString(), value: 0 }));
  for (const d of dates) {
    const idx = Math.floor((new Date(d).getTime() - start) / DAY);
    if (idx >= 0 && idx < days) buckets[idx].value++;
  }
  return buckets;
}
const sinceDays = (iso: string, days: number) => Date.now() - new Date(iso).getTime() < days * DAY;
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};
const today = () => new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const user = await requireUser();
  const { denied } = await searchParams;
  const db = await getDb();
  const seeInq = can(user.permissions, "inquiries");
  const deniedText = (() => {
    if (!denied || typeof denied !== "string") return null;
    const [mod, act] = denied.split(".");
    const label = MODULES.find((m) => m.key === mod)?.label.toLowerCase() ?? mod;
    return `Your role (${user.role.name}) doesn't allow you to ${act ?? "view"} ${label}.`;
  })();

  /* ---- metrics ---- */
  const inqDaily = dailyCounts(db.inquiries.map((i) => i.createdAt), 180);
  const last30 = inqDaily.slice(-30), prev30 = inqDaily.slice(-60, -30);
  const inq30 = last30.reduce((s, d) => s + d.value, 0);
  const inqPrev30 = prev30.reduce((s, d) => s + d.value, 0);
  const newInq = db.inquiries.filter((i) => i.status === "new");
  const oldestNew = newInq.reduce<string | null>((o, i) => (!o || i.createdAt < o ? i.createdAt : o), null);

  const productsAdded30 = db.products.filter((p) => sinceDays(p.createdAt, 30)).length;
  const productsAddedPrev30 = db.products.filter((p) => !sinceDays(p.createdAt, 30) && sinceDays(p.createdAt, 60)).length;
  const productTrend = dailyCounts(db.products.map((p) => p.createdAt), 30).reduce<number[]>(
    (acc, d) => [...acc, (acc.at(-1) ?? db.products.length - productsAdded30) + d.value],
    [],
  );
  const totalViews = db.products.reduce((s, p) => s + (p.views || 0), 0);
  const avgViews = db.products.length ? Math.round(totalViews / db.products.length) : 0;

  const kpis = [
    { label: "Products", value: db.products.length.toLocaleString(), icon: Package, href: "/admin/products", delta: <Delta current={productsAdded30} previous={productsAddedPrev30} suffix={`${productsAdded30} new · vs last month`} />, spark: productTrend },
    { label: "Inquiries · 30 days", value: inq30.toLocaleString(), icon: Inbox, href: "/admin/inquiries", delta: <Delta current={inq30} previous={inqPrev30} suffix="vs previous 30 days" />, spark: last30.map((d) => d.value) },
    { label: "Awaiting reply", value: newInq.length.toLocaleString(), icon: Clock, href: "/admin/inquiries?status=new", delta: <span className="text-xs text-slate-500">{oldestNew ? `Oldest waiting ${timeAgo(oldestNew)}` : "Inbox zero — nice work"}</span>, urgent: newInq.length > 0 },
    { label: "Product views", value: totalViews.toLocaleString(), icon: Eye, href: "/admin/products?sort=views", delta: <span className="text-xs text-slate-500">≈ {avgViews} views per product</span> },
  ];

  const statusSegments = [
    { key: "new", label: "New", value: newInq.length, color: SERIES.maroon, href: "/admin/inquiries?status=new" },
    { key: "in-progress", label: "In progress", value: db.inquiries.filter((i) => i.status === "in-progress").length, color: SERIES.gold, href: "/admin/inquiries?status=in-progress" },
    { key: "closed", label: "Closed", value: db.inquiries.filter((i) => i.status === "closed").length, color: SERIES.green, href: "/admin/inquiries?status=closed" },
  ];
  const closeRate = db.inquiries.length ? Math.round((statusSegments[2].value / db.inquiries.length) * 100) : 0;

  const byCategory = db.categories
    .map((c) => ({ key: c.id, label: c.name, value: db.products.filter((p) => p.categoryId === c.id).length, href: `/admin/products?categoryId=${c.id}` }))
    .sort((a, b) => b.value - a.value);
  const topProducts = [...db.products]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map((p) => ({ key: p.id, label: p.name, value: p.views, href: `/admin/products/${p.id}`, image: p.images[0] ?? "", sub: p.code }));

  /* ---- content health ---- */
  const checks = [
    { ok: db.products.every((p) => p.images.length > 0), label: "Every product has a photo", fix: "/admin/products", n: db.products.filter((p) => !p.images.length).length },
    { ok: db.products.every((p) => p.description.length >= 40), label: "Product descriptions are detailed", fix: "/admin/products", n: db.products.filter((p) => p.description.length < 40).length },
    { ok: db.products.every((p) => p.price > 0), label: "All products show a price", fix: "/admin/products", n: db.products.filter((p) => !p.price).length },
    { ok: db.catalogues.every((c) => c.fileUrl && c.fileUrl !== "#"), label: "Catalogues have PDFs", fix: "/admin/catalogues", n: db.catalogues.filter((c) => !c.fileUrl || c.fileUrl === "#").length },
    { ok: !!db.settings.videoId, label: "Home page video is set", fix: "/admin/settings", n: db.settings.videoId ? 0 : 1 },
    { ok: db.slides.filter((s) => s.active).length >= 2, label: "At least 2 hero slides live", fix: "/admin/slides", n: 0 },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  const quick = (
    [
    { href: "/admin/products/new", label: "Add product", icon: Package },
    { href: "/admin/slides/new", label: "New hero slide", icon: GalleryHorizontal },
    { href: "/admin/news/new", label: "Write a post", icon: Newspaper },
    { href: "/admin/media", label: "Upload media", icon: Upload },
    { href: "/admin/categories/new", label: "New category", icon: Tags },
    { href: "/admin/stores/new", label: "Add a store", icon: MapPin },
    ] as const
  ).filter((q) => can(user.permissions, q.href.split("/")[2], (q.href.endsWith("/new") ? "create" : "view") as Action));
  const kpisVisible = kpis.filter((k) => seeInq || !k.href.startsWith("/admin/inquiries"));

  return (
    <>
      {denied && (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <AlertCircle className="size-4" /> {deniedText ?? "You don't have access to that page."}
        </p>
      )}

      {/* ---------- welcome banner ---------- */}
      <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-800 to-[#2a0507] p-6 text-white shadow-lg shadow-primary-900/20 sm:p-8">
        <Image src="/brand/udh-mark-white.png" alt="" width={360} height={340} aria-hidden className="pointer-events-none absolute -right-10 -bottom-16 w-72 opacity-[0.07] sm:w-96" />
        <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-gold-300 uppercase">{today()}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{greeting()}, {user.name.split(" ")[0]}</h1>
            <p className="mt-2 max-w-xl text-sm text-white/75">
              {!seeInq ? (
                <>Signed in as <b className="text-white">{user.role.name}</b></>
              ) : newInq.length > 0 ? (
                <>You have <b className="text-white">{newInq.length} new {newInq.length === 1 ? "inquiry" : "inquiries"}</b> waiting for a reply</>
              ) : (
                <>All inquiries are answered</>
              )}
              {score < 100 && <> and your content health is <b className="text-white">{score}%</b></>}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {seeInq && newInq.length > 0 && (
              <Link href="/admin/inquiries?status=new" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-primary-800 shadow-sm transition hover:bg-gold-300 active:scale-95">
                <Inbox className="size-4" /> Reply now
              </Link>
            )}
            <Link hidden={!can(user.permissions, "products", "create")} href="/admin/products/new" className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20 active:scale-95">
              <Plus className="size-4" /> Add product
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- KPI tiles ---------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpisVisible.map(({ label, value, icon: Icon, href, delta, spark, urgent }) => (
          <Link key={label} href={href} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <span className={`grid size-8 place-items-center rounded-lg ${urgent ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-600"}`}>
                  <Icon className="size-4" />
                </span>
                {label}
              </span>
              <ArrowUpRight className="size-4 text-slate-300 transition group-hover:text-primary-500" />
            </div>
            <div className="mt-4 flex items-end justify-between gap-2">
              <p className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{value}</p>
              {spark && <Sparkline values={spark} />}
            </div>
            <div className="mt-2">{delta}</div>
            {urgent && <span className="absolute top-4 right-10 size-2 animate-pulse rounded-full bg-primary-500" />}
          </Link>
        ))}
      </div>

      {/* ---------- trend + pipeline ---------- */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Inquiries over time" className={seeInq ? "xl:col-span-2" : "hidden"} action={<Link href="/admin/inquiries" className="text-xs font-medium text-primary-600 hover:underline">Open inbox</Link>}>
          <div className="p-5">
            <TrendChart series={inqDaily} />
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Inquiry pipeline" className={seeInq ? "" : "hidden"} action={<span className="text-xs text-slate-500">{db.inquiries.length} total</span>}>
            <div className="p-5">
              <StatusBar segments={statusSegments} />
              <p className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                Close rate <b className="text-sm text-slate-900">{closeRate}%</b>
              </p>
            </div>
          </Card>
          <Card title="Content health">
            <div className="flex items-center gap-5 p-5">
              <ScoreRing score={score}>
                <p className="text-[10px] tracking-wide text-slate-400 uppercase">ready</p>
              </ScoreRing>
              <ul className="min-w-0 flex-1 space-y-1.5">
                {checks.map((c) => (
                  <li key={c.label}>
                    <Link href={c.fix} className="flex items-start gap-2 text-xs text-slate-600 hover:text-slate-900">
                      {c.ok ? <CircleCheck className="mt-px size-3.5 shrink-0 text-emerald-600" /> : <XCircle className="mt-px size-3.5 shrink-0 text-rose-500" />}
                      <span className={c.ok ? "" : "font-medium text-slate-800"}>
                        {c.label}
                        {!c.ok && c.n > 0 && <span className="text-slate-400"> · {c.n} to fix</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </div>

      {/* ---------- catalogue insight ---------- */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card title="Most viewed products" action={<Link href="/admin/products" className="text-xs font-medium text-primary-600 hover:underline">All products</Link>}>
          <div className="p-3">
            <BarList items={topProducts} unit="views" />
          </div>
        </Card>
        <Card title="Products by category" action={<Link href="/admin/categories" className="text-xs font-medium text-primary-600 hover:underline">Manage</Link>}>
          <div className="p-3">
            <BarList items={byCategory} />
          </div>
        </Card>
        <Card title="Quick actions" className="lg:col-span-2 xl:col-span-1">
          <div className="grid grid-cols-2 gap-2 p-4">
            {quick.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="group flex flex-col items-start gap-3 rounded-xl border border-slate-200 p-3.5 transition hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50/40 active:scale-[0.98]">
                <span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-primary-600 group-hover:text-white">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-medium text-slate-800">{label}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* ---------- latest inquiries + activity ---------- */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Latest inquiries" className={seeInq ? "xl:col-span-2" : "hidden"} action={<Link href="/admin/inquiries" className="text-xs font-medium text-primary-600 hover:underline">View all</Link>}>
          {db.inquiries.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                    <th className="px-5 py-2.5 font-medium">From</th>
                    <th className="px-3 py-2.5 font-medium">Subject</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5 text-right font-medium">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {db.inquiries.slice(0, 6).map((i) => (
                    <tr key={i.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link href={`/admin/inquiries?open=${i.id}`} className="flex items-center gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">{i.name.slice(0, 1)}</span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-800">{i.name}</span>
                            <span className="block truncate text-xs text-slate-500">{i.email}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="max-w-[260px] truncate px-3 py-3 text-slate-600">{i.subject}</td>
                      <td className="px-3 py-3"><Badge tone={STATUS_TONE[i.status]}>{i.status.replace("-", " ")}</Badge></td>
                      <td className="px-5 py-3 text-right text-xs whitespace-nowrap text-slate-400">{timeAgo(i.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-5 text-sm text-slate-500">No inquiries yet.</p>
          )}
        </Card>

        <Card title="Recent activity" action={<FileText className="size-4 text-slate-300" />}>
          {db.activity.length ? (
            <ol className="relative space-y-4 p-5 before:absolute before:top-7 before:bottom-7 before:left-[25px] before:w-px before:bg-slate-200">
              {db.activity.slice(0, 7).map((a) => (
                <li key={a.id} className="relative flex gap-3">
                  <span className="relative z-10 mt-1.5 size-2 shrink-0 rounded-full bg-primary-500 ring-4 ring-white" />
                  <div className="min-w-0 text-sm">
                    <p className="text-slate-700"><b className="font-medium text-slate-900">{a.userName}</b> {a.action} <span className="text-slate-900">{a.target}</span></p>
                    <p className="text-xs text-slate-400">{timeAgo(a.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-400"><Clock className="size-5" /></span>
              <p className="mt-3 text-sm text-slate-500">Changes made in the admin will show up here.</p>
              <Link href="/admin/products/new" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline">
                Make your first change <ArrowRight className="size-3" />
              </Link>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
