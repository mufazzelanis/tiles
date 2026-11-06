import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getHomeThickness } from "@/lib/queries";
import { PageHeader } from "@/components/admin/ui";
import { HomeThicknessEditor } from "@/components/admin/HomeThicknessEditor";

export const metadata: Metadata = { title: "Thickness Guide" };

export default async function HomeThicknessSettings() {
  const me = await requirePermission("settings", "view");
  return (
    <>
      <PageHeader
        title="Thickness Guide"
        description="The “Which thickness do I need?” section on the home page — thickness cards, loads, uses and texts."
        crumbs={[{ href: "/admin/settings/home", label: "Home page" }]}
        actions={
          <Link href="/" target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <ExternalLink className="size-4" /> View home page
          </Link>
        }
      />
      <HomeThicknessEditor initial={await getHomeThickness()} canEdit={can(me.permissions, "settings", "edit")} />
    </>
  );
}
