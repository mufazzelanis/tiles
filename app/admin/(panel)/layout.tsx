import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Shell } from "@/components/admin/Shell";
import { Toaster } from "@/components/admin/Toaster";
import type { SearchItem } from "@/components/admin/CommandPalette";
import { can } from "@/lib/permissions";

const MODULE_OF_GROUP: Record<string, string> = {
  Products: "products", Categories: "categories", News: "news", Slides: "slides", Projects: "projects",
  Catalogues: "catalogues", Sustainability: "sustainability", Stores: "stores", Inquiries: "inquiries",
};

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const db = await getDb();
  const collapsed = (await cookies()).get("admin_sidebar")?.value === "collapsed";

  const newOnes = can(user.permissions, "inquiries") ? db.inquiries.filter((i) => i.status === "new") : [];
  const cat = new Map(db.categories.map((c) => [c.id, c.name]));

  // lightweight index for the Ctrl+K command palette
  const searchIndex = ([
    ...db.products.map((p) => ({ id: p.id, label: p.name, sub: `${p.code} · ${cat.get(p.categoryId) ?? ""} · ${p.size}`, href: `/admin/products/${p.id}`, group: "Products", image: p.images[0] })),
    ...db.categories.map((c) => ({ id: c.id, label: c.name, sub: `/${c.slug}`, href: `/admin/categories/${c.id}`, group: "Categories", image: c.image })),
    ...db.news.map((n) => ({ id: n.id, label: n.title, sub: n.type, href: `/admin/news/${n.id}`, group: "News", image: n.image })),
    ...db.slides.map((s) => ({ id: s.id, label: s.title, sub: s.subtitle, href: `/admin/slides/${s.id}`, group: "Slides", image: s.image })),
    ...db.projects.map((p) => ({ id: p.id, label: p.title, sub: `${p.client} · ${p.location}`, href: `/admin/projects/${p.id}`, group: "Projects", image: p.image })),
    ...db.catalogues.map((c) => ({ id: c.id, label: c.title, sub: String(c.year), href: `/admin/catalogues/${c.id}`, group: "Catalogues", image: c.cover })),
    ...db.sustainability.map((s) => ({ id: s.id, label: s.title, sub: s.heading, href: `/admin/sustainability/${s.id}`, group: "Sustainability", image: s.image })),
    ...db.stores.map((s) => ({ id: s.id, label: s.name, sub: `${s.type} · ${s.division}`, href: `/admin/stores/${s.id}`, group: "Stores" })),
    ...db.inquiries.map((i) => ({ id: i.id, label: i.subject, sub: `${i.name} · ${i.email} · ${i.status}`, href: `/admin/inquiries?open=${i.id}`, group: "Inquiries" })),
  ] as SearchItem[])
    // only index what this user is allowed to open
    .filter((x) => can(user.permissions, MODULE_OF_GROUP[x.group] ?? "", "view"))
    .map((x) => ({ ...x, image: x.image || undefined }));

  return (
    <Shell
      user={user}
      siteName={db.settings.siteName}
      newInquiries={newOnes.length}
      recentInquiries={newOnes.slice(0, 6).map(({ id, name, subject, createdAt }) => ({ id, name, subject, createdAt }))}
      searchIndex={searchIndex}
      initialCollapsed={collapsed}
    >
      {children}
      <Suspense>
        <Toaster />
      </Suspense>
    </Shell>
  );
}
