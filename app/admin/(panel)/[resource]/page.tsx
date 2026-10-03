import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { getDb } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getResource, type ResourceKey } from "@/lib/resources";
import { LinkButton, PageHeader } from "@/components/admin/ui";
import { ResourceTable } from "@/components/admin/ResourceTable";

export async function generateMetadata({ params }: PageProps<"/admin/[resource]">): Promise<Metadata> {
  const def = getResource((await params).resource);
  return { title: def?.label ?? "Not found" };
}

export default async function ResourceListPage({ params }: PageProps<"/admin/[resource]">) {
  const { resource } = await params;
  const def = getResource(resource);
  if (!def) notFound();
  const me = await requirePermission(def.key, "view");
  const perms = { create: can(me.permissions, def.key, "create"), edit: can(me.permissions, def.key, "edit"), delete: can(me.permissions, def.key, "delete") };

  const db = await getDb();
  const rows = db[def.key as ResourceKey] as unknown as Record<string, unknown>[];
  const categories = db.categories.map((c) => ({ value: c.id, label: c.name }));

  // send only what the table needs to the client
  const keys = new Set(["id", "slug", "active", "updatedAt", def.titleField, ...def.columns.map((c) => c.key), ...(def.filters ?? []).map((f) => f.key), ...def.searchFields]);
  const slim = rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => keys.has(k))));

  return (
    <>
      <PageHeader
        title={def.label}
        description={def.description}
        actions={
          perms.create && (
            <LinkButton href={`/admin/${def.key}/new`}>
              <Plus className="size-4" /> New {def.singular.toLowerCase()}
            </LinkButton>
          )
        }
      />
      <ResourceTable resourceKey={def.key} rows={slim} categories={categories} perms={perms} />
    </>
  );
}
