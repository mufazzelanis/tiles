import { after } from "next/server";
import { cookies, headers } from "next/headers";
import { contextFrom, CUSTOM_EVENTS, sendServerEvent, STANDARD_EVENTS, type MetaEventName } from "@/lib/tracking";

/**
 * Browser → server relay for Meta Conversions API. The browser Pixel sends the same
 * event with the same event_id, so Meta counts it once.
 */
const ALLOWED = new Set<string>([...STANDARD_EVENTS, ...CUSTOM_EVENTS]);
// Lead / Contact with customer data are sent by the form actions themselves
const SERVER_ONLY = new Set(["Lead", "SubmitApplication"]);
const CUSTOM_KEYS = new Set([
  "value", "currency", "content_ids", "content_type", "content_name", "content_category", "contents", "num_items",
  "search_string", "status", "color", "method", "predicted_ltv",
]);

/** tiny per-IP rate limit — plenty for real visitors, stops floods */
const hits = new Map<string, { n: number; reset: number }>();
function limited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { n: 1, reset: now + 60_000 });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  return ++h.n > 120;
}

function sanitize(data: unknown) {
  if (!data || typeof data !== "object") return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!CUSTOM_KEYS.has(k)) continue;
    if (typeof v === "string") out[k] = v.slice(0, 200);
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (Array.isArray(v)) out[k] = v.slice(0, 20).map((x) => (typeof x === "object" ? x : String(x).slice(0, 100)));
  }
  return out;
}

export async function POST(request: Request) {
  let body: { event?: string; id?: string; url?: string; data?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const name = String(body.event ?? "");
  if (!ALLOWED.has(name) || SERVER_ONLY.has(name)) return new Response(null, { status: 400 });
  const id = String(body.id ?? "").slice(0, 64);

  // only accept events about pages on this site
  const origin = new URL(request.url).origin;
  const url = typeof body.url === "string" && body.url.startsWith(origin) ? body.url.slice(0, 1000) : undefined;

  const h = await headers();
  const ctx = contextFrom(h, await cookies(), url);
  if (limited(ctx.ip ?? "local")) return new Response(null, { status: 429 });

  // respond immediately; talk to Meta after the response is sent
  after(() => sendServerEvent({ name: name as MetaEventName, id, url, customData: sanitize(body.data) }, ctx));
  return new Response(null, { status: 204 });
}
