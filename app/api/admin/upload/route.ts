import { promises as fs } from "node:fs";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth";
import { DATA_DIR } from "@/lib/db";
import { can } from "@/lib/permissions";

const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/avif": ".avif",
  "application/pdf": ".pdf",
};
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  // uploading is allowed for the media library and for anyone who can create/edit content (image fields)
  const allowed = user.permissions.includes("*") || can(user.permissions, "media", "create") || user.permissions.some((p) => (p.endsWith(".create") || p.endsWith(".edit")) && !p.startsWith("users.") && !p.startsWith("roles."));
  if (!allowed) return Response.json({ error: "You don't have permission to upload files" }, { status: 403 });

  const form = await request.formData();
  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (!files.length) return Response.json({ error: "No file" }, { status: 400 });

  const dir = path.join(DATA_DIR, "uploads");
  await fs.mkdir(dir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    const ext = ALLOWED[file.type];
    if (!ext) return Response.json({ error: `${file.name}: unsupported file type` }, { status: 415 });
    if (file.size > MAX_BYTES) return Response.json({ error: `${file.name}: larger than 20 MB` }, { status: 413 });
    const base = path.parse(file.name).name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "file";
    const name = `${Date.now().toString(36)}-${base}${ext}`;
    await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    urls.push(`/uploads/${name}`);
  }
  return Response.json({ urls });
}
