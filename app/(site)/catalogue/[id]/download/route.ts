import { getDb, incrementCatalogueDownloads } from "@/lib/db";

/**
 * /catalogue/<id>/download — counts the download, then hands over the PDF.
 * ?view=1 opens it in the browser instead (not counted as a download).
 */
export async function GET(request: Request, ctx: RouteContext<"/catalogue/[id]/download">) {
  const { id } = await ctx.params;
  const url = new URL(request.url);
  const db = await getDb();
  const c = db.catalogues.find((x) => x.id === id && x.active);
  if (!c || !c.fileUrl || c.fileUrl === "#") return Response.redirect(new URL("/catalogue", url), 302);

  const view = url.searchParams.get("view") === "1";
  if (!view) await incrementCatalogueDownloads(c.id);

  const target = new URL(c.fileUrl, url);
  // our own uploads can be saved under a readable name
  if (!view && c.fileUrl.startsWith("/uploads/")) target.searchParams.set("download", `${c.title.replace(/[^\w\- ]+/g, "").trim() || "catalogue"}.pdf`);
  return Response.redirect(target, 302);
}
