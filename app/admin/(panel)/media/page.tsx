import type { Metadata } from "next";
import { listMedia } from "@/lib/media";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/admin/ui";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

export const metadata: Metadata = { title: "Media Library" };

export default async function MediaPage() {
  const me = await requirePermission("media", "view");
  const files = await listMedia();
  return (
    <>
      <PageHeader title="Media Library" description="Images and PDFs uploaded for products, banners and catalogues." />
      <MediaLibrary files={files} canUpload={can(me.permissions, "media", "create")} canDelete={can(me.permissions, "media", "delete")} />
    </>
  );
}
