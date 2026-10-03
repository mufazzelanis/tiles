import type { Metadata } from "next";
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
      <PageHeader title="Settings" description="Brand, contact details, home page copy, social links and SEO." />
      <SettingsForm settings={settings} canEdit={can(me.permissions, "settings", "edit")} />
    </>
  );
}
