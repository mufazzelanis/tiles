import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { can } from "@/lib/permissions";

const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** CSV export of all inquiries (opens fine in Excel). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!can(user.permissions, "inquiries", "view")) return new Response("Forbidden", { status: 403 });
  const db = await getDb();
  const products = new Map(db.products.map((p) => [p.id, p.name]));
  const header = ["Date", "Name", "Email", "Phone", "Subject", "Product", "Colour", "Colour code", "Boxes", "Area (sqft)", "Delivery area", "Status", "Message", "Notes", "Other answers"];
  const colorCode = new Map(db.colors.map((c) => [c.id, c.code]));
  const lines = db.inquiries.map((i) =>
    [i.createdAt, i.name, i.email, i.phone, i.subject, products.get(i.productId) ?? "", i.colorName, colorCode.get(i.colorId) ?? "", i.boxes || "", i.area || "", i.location, i.status, i.message, i.notes, (i.extra ?? []).map((x) => `${x.label}: ${x.value}`).join(" | ")]
      .map(esc)
      .join(","),
  );
  const csv = "﻿" + [header.map(esc).join(","), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
