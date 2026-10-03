import { incrementProductViews } from "@/lib/db";

/** Fire-and-forget product view counter (called from the product page). */
export async function POST(_: Request, ctx: RouteContext<"/api/track/[id]">) {
  const { id } = await ctx.params;
  await incrementProductViews(id);
  return new Response(null, { status: 204 });
}
