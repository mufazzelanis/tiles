import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { ColorsManager } from "@/components/admin/ColorsManager";

export const metadata: Metadata = { title: "Tile Colours" };

const DAY = 86400000;
/** Request-time cut-off (kept outside the component for the purity lint). */
const daysAgo = (n: number) => Date.now() - n * DAY;

export default async function ColorsPage({ searchParams }: PageProps<"/admin/colors">) {
  const me = await requirePermission("colors", "view");
  const { open } = await searchParams;
  const db = await getDb();
  const since = daysAgo(30);

  const colors = db.colors.map((c) => {
    const requests = db.inquiries.filter((i) => i.colorId === c.id);
    return {
      ...c,
      productIds: db.products.filter((p) => p.colorVariants.some((v) => v.colorId === c.id)).map((p) => p.id),
      requests: requests.length,
      requests30: requests.filter((i) => new Date(i.createdAt).getTime() > since).length,
      lastRequestedAt: requests[0]?.createdAt ?? "",
    };
  });
  const products = db.products.map((p) => ({ id: p.id, name: p.name, code: p.code, image: p.images[0] ?? "", active: p.active }));

  return (
    <ColorsManager
      colors={colors}
      products={products}
      initialOpen={typeof open === "string" ? open : undefined}
      perms={{
        create: can(me.permissions, "colors", "create"),
        edit: can(me.permissions, "colors", "edit"),
        delete: can(me.permissions, "colors", "delete"),
        products: can(me.permissions, "products", "edit"),
      }}
    />
  );
}
