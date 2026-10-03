import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getResource, type ResourceKey } from "@/lib/resources";
import { PageHeader } from "@/components/admin/ui";
import { ResourceForm } from "@/components/admin/ResourceForm";

export const metadata: Metadata = { title: "Edit" };

export default async function EditResourcePage({ params }: PageProps<"/admin/[resource]/[id]">) {
  const { resource, id } = await params;
  const def = getResource(resource);
  if (!def) notFound();
  const me = await requirePermission(def.key, "view");
  const db = await getDb();
  const row = (db[def.key as ResourceKey] as unknown as Record<string, unknown>[]).find((r) => r.id === id);
  if (!row) notFound();

  return (
    <>
      <PageHeader title={String(row[def.titleField] ?? def.singular)} crumbs={[{ href: `/admin/${def.key}`, label: def.label }]} />
      {/* key resets the form state when switching between records */}
      <ResourceForm key={id} resourceKey={def.key} id={id} initial={row} categories={db.categories.map((c) => ({ value: c.id, label: c.name }))} siteName={db.settings.siteName} readOnly={!can(me.permissions, def.key, "edit")} />
    </>
  );
}
