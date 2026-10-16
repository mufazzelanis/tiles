import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { deliveryLog, getTrackingConfig, maskToken } from "@/lib/tracking";
import { PageHeader } from "@/components/admin/ui";
import { TrackingSettings } from "@/components/admin/TrackingSettings";

export const metadata: Metadata = { title: "Facebook Pixel & CAPI" };

export default async function MarketingPage() {
  const me = await requirePermission("settings", "view");
  const cfg = await getTrackingConfig();
  const { log, stats } = deliveryLog();
  return (
    <>
      <PageHeader
        title="Facebook Pixel & Conversions API"
        description="Track visits, product views and quote requests for Facebook / Instagram ads — from the browser and from the server."
        crumbs={[{ href: "/admin/settings", label: "Settings" }]}
      />
      <TrackingSettings
        // the token itself never leaves the server
        config={{ ...cfg, accessToken: "", tokenMask: maskToken(cfg.accessToken), hasToken: !!cfg.accessToken }}
        log={log}
        stats={stats}
        canEdit={can(me.permissions, "settings", "edit")}
      />
    </>
  );
}
