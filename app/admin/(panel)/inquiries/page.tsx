import type { Metadata } from "next";
import { Download } from "lucide-react";
import { getDb } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/admin/ui";
import { InquiriesBoard } from "@/components/admin/InquiriesBoard";

export const metadata: Metadata = { title: "Inquiries" };

export default async function InquiriesPage() {
  const me = await requirePermission("inquiries", "view");
  const db = await getDb();
  const products = Object.fromEntries(db.products.map((p) => [p.id, { name: p.name, slug: p.slug }]));
  return (
    <>
      <PageHeader
        title="Inquiries"
        description="Quote requests and messages from the website contact and product forms."
        actions={
          // eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page
          <a href="/api/admin/export/inquiries" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <Download className="size-4" /> Export CSV
          </a>
        }
      />
      <InquiriesBoard inquiries={db.inquiries} products={products} canEdit={can(me.permissions, "inquiries", "edit")} canDelete={can(me.permissions, "inquiries", "delete")} />
    </>
  );
}
