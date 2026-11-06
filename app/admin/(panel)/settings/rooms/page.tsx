import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getDb } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getHomeRooms } from "@/lib/queries";
import { APPLICATIONS } from "@/lib/resources";
import { PageHeader } from "@/components/admin/ui";
import { HomeRoomsEditor } from "@/components/admin/HomeRoomsEditor";

export const metadata: Metadata = { title: "Shop by Area" };

export default async function HomeRoomsSettings() {
  const me = await requirePermission("settings", "view");
  const [db, rooms] = await Promise.all([getDb(), getHomeRooms()]);
  // live products per application area
  const counts: Record<string, number> = {};
  for (const p of db.products) if (p.active) for (const a of p.applications ?? []) counts[a] = (counts[a] ?? 0) + 1;
  return (
    <>
      <PageHeader
        title="Shop by Area"
        description="The area tiles on the home page (car parking, driveway, walkway…). Each one opens the products made for that application area."
        crumbs={[{ href: "/admin/settings", label: "Settings" }]}
        actions={
          <Link href="/" target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <ExternalLink className="size-4" /> View home page
          </Link>
        }
      />
      <HomeRoomsEditor initial={rooms} counts={counts} applications={APPLICATIONS} canEdit={can(me.permissions, "settings", "edit")} />
    </>
  );
}
