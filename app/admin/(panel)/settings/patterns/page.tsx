import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getHomePatterns } from "@/lib/queries";
import { PageHeader } from "@/components/admin/ui";
import { HomePatternsEditor } from "@/components/admin/HomePatternsEditor";

export const metadata: Metadata = { title: "Paver Patterns" };

export default async function HomePatternsSettings() {
  const me = await requirePermission("settings", "view");
  return (
    <>
      <PageHeader
        title="Paver Patterns"
        description="The “Popular paver patterns” cards on the home page — names, short texts, photos and links."
        crumbs={[{ href: "/admin/settings/home", label: "Home page" }]}
        actions={
          <Link href="/" target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <ExternalLink className="size-4" /> View home page
          </Link>
        }
      />
      <HomePatternsEditor initial={await getHomePatterns()} canEdit={can(me.permissions, "settings", "edit")} />
    </>
  );
}
