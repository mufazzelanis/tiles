import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getResource, type ResourceKey } from "@/lib/resources";
import { can } from "@/lib/permissions";

const esc = (v: unknown) => `"${(Array.isArray(v) ? v.join(" | ") : String(v ?? "")).replace(/"/g, '""')}"`;

/** CSV export for any admin content type (opens in Excel). */
export async function GET(_: Request, ctx: RouteContext<"/api/admin/export/[resource]">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const def = getResource((await ctx.params).resource);
  if (!def) return new Response("Not found", { status: 404 });
  if (!can(user.permissions, def.key, "view")) return new Response("Forbidden", { status: 403 });

  const db = await getDb();
  const cats = new Map(db.categories.map((c) => [c.id, c.name]));
  const rows = db[def.key as ResourceKey] as unknown as Record<string, unknown>[];
  const fields = def.fields.filter((f) => f.type !== "images" || def.key === "products");
  const header = ["ID", ...fields.map((f) => f.label), "Created", "Updated"];
  const lines = rows.map((r) =>
    [r.id, ...fields.map((f) => (f.source === "categories" ? cats.get(String(r[f.name])) : f.type === "boolean" ? (r[f.name] ? "Yes" : "No") : r[f.name])), r.createdAt, r.updatedAt]
      .map(esc)
      .join(","),
  );
  const csv = "﻿" + [header.map(esc).join(","), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${def.key}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
