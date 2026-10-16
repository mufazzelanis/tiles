import { createHash, randomUUID } from "node:crypto";
import { getSetting, setSetting } from "./db";

/**
 * Meta (Facebook) Pixel + Conversions API — server side.
 *
 * Every event is sent from the browser (Pixel) and from the server (CAPI) with the
 * same `event_id`, so Meta de-duplicates them and keeps the better-matched copy.
 * Server events carry hashed customer data, IP, user agent and the _fbp/_fbc cookies.
 */

export const TRACKING_KEY = "tracking";
export const DEFAULT_API_VERSION = "v23.0";

export interface TrackingConfig {
  enabled: boolean;
  pixelId: string;
  /** Conversions API access token (System User token from Events Manager) */
  accessToken: string;
  /** set while testing in Events Manager → Test events; remove when live */
  testEventCode: string;
  capiEnabled: boolean;
  /** also send PageView through CAPI (more server load, slightly better coverage) */
  capiPageViews: boolean;
  apiVersion: string;
  updatedAt: string;
}

const DEFAULTS: TrackingConfig = {
  enabled: false, pixelId: "", accessToken: "", testEventCode: "", capiEnabled: true, capiPageViews: true,
  apiVersion: DEFAULT_API_VERSION, updatedAt: "",
};

/** Events the website is allowed to send (the browser relay rejects anything else). */
export const STANDARD_EVENTS = [
  "PageView", "ViewContent", "Search", "AddToWishlist", "CustomizeProduct", "InitiateCheckout",
  "Lead", "Contact", "FindLocation", "SubmitApplication",
] as const;
export const CUSTOM_EVENTS = ["DownloadCatalogue", "UseCalculator"] as const;
export type MetaEventName = (typeof STANDARD_EVENTS)[number] | (typeof CUSTOM_EVENTS)[number];

const g = globalThis as unknown as {
  __metaCfg?: { at: number; cfg: TrackingConfig };
  __metaLog?: DeliveryLog[];
  __metaStats?: { sent: number; failed: number; since: string };
};

/* ------------------------------------------------------------- config */

export async function getTrackingConfig(): Promise<TrackingConfig> {
  if (g.__metaCfg && Date.now() - g.__metaCfg.at < 30_000) return g.__metaCfg.cfg;
  const stored = (await getSetting<Partial<TrackingConfig>>(TRACKING_KEY)) ?? {};
  const cfg: TrackingConfig = { ...DEFAULTS, ...stored };
  // .env values work as a fallback (handy for deployments)
  cfg.pixelId ||= process.env.META_PIXEL_ID ?? "";
  cfg.accessToken ||= process.env.META_CAPI_TOKEN ?? "";
  if (!stored.updatedAt && cfg.pixelId) cfg.enabled = true;
  g.__metaCfg = { at: Date.now(), cfg };
  return cfg;
}

export async function saveTrackingConfig(cfg: TrackingConfig) {
  await setSetting(TRACKING_KEY, cfg);
  g.__metaCfg = undefined;
}

/** What the browser is allowed to know. */
export async function getPublicPixel() {
  const cfg = await getTrackingConfig();
  return cfg.enabled && cfg.pixelId ? { pixelId: cfg.pixelId } : null;
}

export const maskToken = (t: string) => (t ? `${t.slice(0, 4)}••••••••${t.slice(-4)}` : "");

/* ------------------------------------------------------ customer data */

const sha = (v: string) => createHash("sha256").update(v).digest("hex");
const clean = (v?: string | null) => (v ?? "").trim().toLowerCase();

/** Meta wants E.164 digits without "+": Bangladeshi 01XXXXXXXXX → 8801XXXXXXXXX. */
export function normalizePhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (/^01\d{9}$/.test(d)) d = `88${d}`;
  else if (/^1\d{9}$/.test(d)) d = `880${d}`;
  return d.length >= 8 ? d : "";
}

export interface Customer {
  email?: string;
  phone?: string;
  name?: string;
  city?: string;
}

export interface RequestContext {
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  visitorId?: string;
  url?: string;
}

/** Hashes personal data exactly the way Meta's matching expects. */
export function buildUserData(ctx: RequestContext, customer: Customer = {}) {
  const user: Record<string, unknown> = {};
  const email = clean(customer.email);
  if (/^\S+@\S+\.\S+$/.test(email)) user.em = [sha(email)];
  const phone = normalizePhone(customer.phone ?? "");
  if (phone) user.ph = [sha(phone)];
  const parts = clean(customer.name).split(/\s+/).filter(Boolean);
  if (parts[0]) user.fn = [sha(parts[0])];
  if (parts.length > 1) user.ln = [sha(parts[parts.length - 1])];
  const city = clean(customer.city?.split(",").pop()).replace(/[^a-z]/g, "");
  if (city) user.ct = [sha(city)];
  user.country = [sha("bd")];
  if (ctx.visitorId) user.external_id = [sha(ctx.visitorId)];
  if (ctx.ip) user.client_ip_address = ctx.ip;
  if (ctx.userAgent) user.client_user_agent = ctx.userAgent;
  if (ctx.fbp) user.fbp = ctx.fbp;
  // the Pixel normally sets _fbc; rebuild it from ?fbclid= when the cookie isn't there yet
  const fbclid = ctx.url ? safeUrl(ctx.url)?.searchParams.get("fbclid") : null;
  if (ctx.fbc) user.fbc = ctx.fbc;
  else if (fbclid) user.fbc = `fb.1.${Date.now()}.${fbclid}`;
  return user;
}

const safeUrl = (u: string) => {
  try {
    return new URL(u);
  } catch {
    return null;
  }
};

/** Pulls IP, user agent and Meta cookies from the incoming request. */
export function contextFrom(headers: Headers, cookies: { get(name: string): { value: string } | undefined }, url?: string): RequestContext {
  const ip = (headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || headers.get("x-real-ip") || "";
  return {
    ip: ip && ip !== "::1" && ip !== "127.0.0.1" ? ip.replace(/^::ffff:/, "") : undefined,
    userAgent: headers.get("user-agent") ?? undefined,
    fbp: cookies.get("_fbp")?.value,
    fbc: cookies.get("_fbc")?.value,
    visitorId: cookies.get("udh_vid")?.value,
    url: url ?? headers.get("referer") ?? undefined,
  };
}

/* ------------------------------------------------------------ sending */

export interface ServerEvent {
  name: MetaEventName;
  id?: string;
  url?: string;
  customData?: Record<string, unknown>;
  customer?: Customer;
}

export interface DeliveryLog {
  at: string;
  event: string;
  eventId: string;
  ok: boolean;
  test: boolean;
  received?: number;
  error?: string;
  traceId?: string;
  matchKeys: string[];
}

function record(entry: DeliveryLog) {
  g.__metaLog = [entry, ...(g.__metaLog ?? [])].slice(0, 60);
  g.__metaStats ??= { sent: 0, failed: 0, since: new Date().toISOString() };
  if (entry.ok) g.__metaStats.sent++;
  else g.__metaStats.failed++;
}

export function deliveryLog() {
  return { log: g.__metaLog ?? [], stats: g.__metaStats ?? { sent: 0, failed: 0, since: new Date().toISOString() } };
}

/**
 * Sends one event through the Conversions API. Never throws — failures are logged
 * and shown in Admin → Facebook Pixel & CAPI.
 */
export async function sendServerEvent(ev: ServerEvent, ctx: RequestContext, opts: { force?: boolean; testCode?: string } = {}) {
  const cfg = await getTrackingConfig();
  if (!opts.force && (!cfg.enabled || !cfg.capiEnabled)) return null;
  if (!cfg.pixelId || !cfg.accessToken) return null;
  if (ev.name === "PageView" && !cfg.capiPageViews && !opts.force) return null;

  const userData = buildUserData(ctx, ev.customer);
  const testCode = opts.testCode ?? cfg.testEventCode;
  const event = {
    event_name: ev.name,
    event_time: Math.floor(Date.now() / 1000),
    event_id: ev.id || randomUUID(),
    event_source_url: ev.url || ctx.url,
    action_source: "website",
    user_data: userData,
    ...(ev.customData && Object.keys(ev.customData).length ? { custom_data: ev.customData } : {}),
  };
  const entry: DeliveryLog = {
    at: new Date().toISOString(), event: ev.name, eventId: event.event_id, ok: false, test: !!testCode,
    matchKeys: Object.keys(userData).filter((k) => k !== "country"),
  };

  try {
    const res = await fetch(`https://graph.facebook.com/${cfg.apiVersion || DEFAULT_API_VERSION}/${encodeURIComponent(cfg.pixelId)}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [event], access_token: cfg.accessToken, ...(testCode ? { test_event_code: testCode } : {}) }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as { events_received?: number; fbtrace_id?: string; error?: { message?: string; error_user_msg?: string } };
    entry.ok = res.ok && !json.error;
    entry.received = json.events_received;
    entry.traceId = json.fbtrace_id ?? (json.error as { fbtrace_id?: string } | undefined)?.fbtrace_id;
    if (!entry.ok) entry.error = json.error?.error_user_msg || json.error?.message || `HTTP ${res.status}`;
  } catch (e) {
    entry.error = (e as Error).name === "TimeoutError" ? "Timed out contacting Meta" : (e as Error).message;
  }
  record(entry);
  return entry;
}
