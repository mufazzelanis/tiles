import type { Metadata } from "next";
import { Factory, Mail, MapPin, Phone } from "lucide-react";
import { getSite } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { InquiryForm } from "@/components/site/InquiryForm";
import { SEED_IMAGES } from "@/lib/seed";

export const metadata: Metadata = { title: "Contact Us" };

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const sp = await searchParams;
  const { settings } = await getSite();
  const items = [
    { Icon: Phone, label: "Call us", value: settings.phone, href: `tel:${settings.phone.replace(/\s/g, "")}` },
    { Icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` },
    { Icon: MapPin, label: "Corporate office", value: settings.corporateOffice },
    { Icon: Factory, label: "Factory", value: settings.factory },
  ];
  return (
    <>
      <PageHero title="Contact Us" subtitle="Questions about a tile, a project quote or dealership? We are here to help." image={SEED_IMAGES.kitchen2} crumbs={[{ href: "/contact", label: "Contact" }]} />
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">Let&apos;s talk</h2>
          <span className="leaf-dash my-4" />
          <ul className="space-y-6">
            {items.map(({ Icon, label, value, href }) => (
              <li key={label} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mist text-brand">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-[11px] tracking-wider text-muted uppercase">{label}</p>
                  {href ? <a href={href} className="text-[15px] text-ink hover:text-brand">{value}</a> : <p className="text-[15px] text-ink">{value}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-neutral-200 p-6 sm:p-8">
          <h2 className="mb-6 font-display text-xl font-semibold text-ink">Send us a message</h2>
          <InquiryForm defaultSubject={typeof sp.subject === "string" ? sp.subject : ""} defaultMessage={typeof sp.message === "string" ? sp.message : ""} />
        </div>
      </div>
    </>
  );
}
