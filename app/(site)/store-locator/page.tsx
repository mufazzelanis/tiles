import type { Metadata } from "next";
import Form from "next/form";
import { MapPin, Navigation, Phone, Store } from "lucide-react";
import { getSite } from "@/lib/queries";
import { DIVISIONS } from "@/lib/resources";
import { PageHero } from "@/components/site/PageHero";
import { SEED_IMAGES } from "@/lib/seed";

export const metadata: Metadata = { title: "Store Locator" };

export default async function StoreLocator({ searchParams }: PageProps<"/store-locator">) {
  const sp = await searchParams;
  const { stores } = await getSite();
  const division = String(sp.division ?? "");
  const type = String(sp.type ?? "");
  const q = String(sp.q ?? "").toLowerCase().trim();

  const filtered = stores.filter(
    (s) =>
      (!division || s.division === division) &&
      (!type || s.type === type) &&
      (!q || `${s.name} ${s.address} ${s.phone}`.toLowerCase().includes(q)),
  );
  const grouped = DIVISIONS.map((d) => ({ division: d, items: filtered.filter((s) => s.division === d) })).filter((g) => g.items.length);

  return (
    <>
      <PageHero title="Store Locator" subtitle="Visit a display center or an authorised dealer near you." image={SEED_IMAGES.interior3} crumbs={[{ href: "/store-locator", label: "Store Locator" }]} />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Form action="/store-locator" scroll={false} className="grid gap-3 border border-neutral-200 bg-mist p-4 sm:grid-cols-[1fr_200px_200px_auto]">
          <input name="q" defaultValue={q} placeholder="Search by name, area or phone" className="border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-ink focus:outline-none" />
          <select name="division" defaultValue={division} className="border border-neutral-300 bg-white px-3 py-2.5 text-sm">
            <option value="">All divisions</option>
            {DIVISIONS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select name="type" defaultValue={type} className="border border-neutral-300 bg-white px-3 py-2.5 text-sm">
            <option value="">All store types</option>
            <option>Display Center</option>
            <option>Dealer</option>
          </select>
          <button className="bg-navy px-6 py-2.5 text-[12px] tracking-wider text-white uppercase hover:bg-navy-deep">Search</button>
        </Form>

        <p className="mt-6 text-[13px] text-muted">{filtered.length} locations found</p>

        {grouped.map((g) => (
          <section key={g.division} className="mt-10">
            <h2 className="mb-4 flex items-center gap-3 font-display text-lg font-semibold text-ink">
              <MapPin className="size-5 text-leaf" /> {g.division}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((s) => (
                <article key={s.id} className="group border border-neutral-200 p-5 transition hover:border-ink hover:shadow-lg">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${s.type === "Display Center" ? "bg-brand/10 text-brand" : "bg-leaf/15 text-[#5d8a22]"}`}>
                    <Store className="size-3" /> {s.type}
                  </span>
                  <h3 className="mt-3 text-[15px] font-semibold text-ink">{s.name}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{s.address}</p>
                  <div className="mt-4 flex items-center gap-4 text-[12px]">
                    {s.phone && (
                      <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="flex items-center gap-1 text-ink hover:text-brand">
                        <Phone className="size-3.5" /> {s.phone}
                      </a>
                    )}
                    {s.mapUrl && (
                      <a href={s.mapUrl} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 font-semibold text-brand hover:underline">
                        <Navigation className="size-3.5" /> Directions
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
