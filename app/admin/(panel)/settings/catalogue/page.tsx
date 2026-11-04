import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getDb } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getCataloguePage } from "@/lib/queries";
import { PageHeader } from "@/components/admin/ui";
import { CataloguePageEditor } from "@/components/admin/CataloguePageEditor";

export const metadata: Metadata = { title: "Catalogue page & sections" };

export default async function CataloguePageSettings() {
  const me = await requirePermission("catalogues", "view");
  const [db, page] = await Promise.all([getDb(), getCataloguePage()]);
  const first = page.sections[0]?.id;
  const known = new Set(page.sections.map((s) => s.id));
  const counts: Record<string, number> = {};
  for (const c of db.catalogues) {
    const own = (c.sections ?? []).filter((s) => known.has(s));
    for (const s of own.length ? own : first ? [first] : []) counts[s] = (counts[s] ?? 0) + 1;
  }
  return (
    <>
      <PageHeader
        title="Catalogue page & sections"
        description="The banner and the sections your catalogues are grouped into on the website."
        crumbs={[{ href: "/admin/catalogues", label: "Catalogues" }]}
        actions={
          <Link href="/catalogue" target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <ExternalLink className="size-4" /> View page
          </Link>
        }
      />
      <CataloguePageEditor initial={page} counts={counts} canEdit={can(me.permissions, "catalogues", "edit")} />
    </>
  );
}
