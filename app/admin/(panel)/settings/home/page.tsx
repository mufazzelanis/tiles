import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getHomeContent, getHomeSections } from "@/lib/queries";
import { PageHeader } from "@/components/admin/ui";
import { HomeSectionsEditor } from "@/components/admin/HomeSectionsEditor";

export const metadata: Metadata = { title: "Home page" };

export default async function HomeSectionsSettings() {
  const me = await requirePermission("settings", "view");
  return (
    <>
      <PageHeader
        title="Home page"
        description="Switch each home page section on or off, change the order, and edit every text, link and icon (“Edit content”)."
        crumbs={[{ href: "/admin/settings", label: "Settings" }]}
        actions={
          <Link href="/" target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <ExternalLink className="size-4" /> View home page
          </Link>
        }
      />
      <HomeSectionsEditor initial={await getHomeSections()} initialContent={await getHomeContent()} canEdit={can(me.permissions, "settings", "edit")} />
    </>
  );
}
