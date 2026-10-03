import { getCurrentUser } from "@/lib/auth";
import { listMedia } from "@/lib/media";
import { can } from "@/lib/permissions";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(user.permissions, "media", "view") && !user.permissions.some((p) => p.endsWith(".create") || p.endsWith(".edit"))) return Response.json({ error: "Forbidden" }, { status: 403 });
  return Response.json(await listMedia());
}
