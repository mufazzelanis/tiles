import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { getResource } from "@/lib/resources";
import { PageHeader } from "@/components/admin/ui";
import { ResourceForm } from "@/components/admin/ResourceForm";

export const metadata: Metadata = { title: "New" };

export default async function NewResourcePage({ params }: PageProps<"/admin/[resource]/new">) {
  const def = getResource((await params).resource);
  if (!def) notFound();
  await requirePermission(def.key, "create");
  const db = await getDb();
  return (
    <>
      <PageHeader title={`New ${def.singular.toLowerCase()}`} crumbs={[{ href: `/admin/${def.key}`, label: def.label }]} />
      <ResourceForm resourceKey={def.key} id={null} initial={{}} categories={db.categories.map((c) => ({ value: c.id, label: c.name }))} siteName={db.settings.siteName} />
    </>
  );
}
