import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSiteLayout } from "@/lib/queries";
import { PageHeader } from "@/components/admin/ui";
import { LayoutEditor } from "@/components/admin/LayoutEditor";

export const metadata: Metadata = { title: "Header & Footer" };

export default async function LayoutPage({ searchParams }: PageProps<"/admin/settings/layout">) {
  const me = await requirePermission("settings", "view");
  const { tab } = await searchParams;
  const [db, layout] = await Promise.all([getDb(), getSiteLayout()]);

  // suggestions for link fields: every public page plus categories and posts
  const pages = [
    ["/", "Home"], ["/products", "All products"], ["/products?sort=new", "Latest collection"], ["/store-locator", "Store locator"],
    ["/store-locator?type=Display+Center", "Display centers"], ["/store-locator?type=Dealer", "Dealers"], ["/catalogue", "Catalogue"],
    ["/tiles-calculator", "Tiles calculator"], ["/projects", "Projects"], ["/news", "News & blog"], ["/news?type=Tiles+Care", "Tiles care"],
    ["/about", "About us"], ["/about#why", "Why choose us"], ["/contact", "Contact us"], ["/favorites", "Favourites"],
    ...db.categories.map((c) => [`/products?category=${c.slug}`, `Category: ${c.name}`]),
    ...db.colors.filter((c) => c.active).map((c) => [`/products?color=${c.slug}`, `Colour: ${c.name}`]),
    ...db.news.filter((n) => n.active).slice(0, 10).map((n) => [`/news/${n.slug}`, `Post: ${n.title}`]),
  ].map(([href, label]) => ({ href, label }));

  return (
    <>
      <PageHeader
        title="Header & Footer"
        description="Menus, logo, announcement bar, footer columns, WhatsApp button and the contact form — all in one place."
        crumbs={[{ href: "/admin/settings", label: "Settings" }]}
      />
      <LayoutEditor
        initial={layout}
        pages={pages}
        site={{ name: db.settings.siteName, tagline: db.settings.tagline, phone: db.settings.phone, email: db.settings.email, office: db.settings.corporateOffice, factory: db.settings.factory }}
        canEdit={can(me.permissions, "settings", "edit")}
        initialTab={typeof tab === "string" ? tab : undefined}
      />
    </>
  );
}
