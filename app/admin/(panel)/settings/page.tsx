import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, PanelsTopLeft } from "lucide-react";
import { getDb } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await requirePermission("settings", "view");
  const { settings } = await getDb();
  return (
    <>
      <PageHeader
        title="Settings"
        description="Brand, contact details, home page copy, social links and SEO."
        actions={
          <>
          <Link href="/admin/settings/layout" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <PanelsTopLeft className="size-4" /> Header, footer & contact form
          </Link>
          <Link href="/admin/settings/meta" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <Megaphone className="size-4" /> Facebook Pixel & CAPI
          </Link>
          </>
        }
      />
      <SettingsForm settings={settings} canEdit={can(me.permissions, "settings", "edit")} />
    </>
  );
}
