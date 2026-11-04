import { promises as fs } from "node:fs";
import path from "node:path";
import { DATA_DIR } from "@/lib/db";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".pdf": "application/pdf",
};

/** Serves files uploaded through the admin media library (stored in /data/uploads). */
export async function GET(request: Request, ctx: RouteContext<"/uploads/[file]">) {
  const { file } = await ctx.params;
  const name = path.basename(file);
  const type = TYPES[path.extname(name).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });
  // ?download=Nice-Name.pdf → save as a file instead of opening in the browser
  const wanted = new URL(request.url).searchParams.get("download");
  const saveAs = wanted ? wanted.replace(/[^\w.\- ]+/g, "").slice(0, 120) || name : "";
  try {
    const buf = await fs.readFile(path.join(DATA_DIR, "uploads", name));
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(saveAs ? { "Content-Disposition": `attachment; filename="${saveAs}"` } : {}),
        ...(type === "image/svg+xml" ? { "Content-Security-Policy": "script-src 'none'" } : {}),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
