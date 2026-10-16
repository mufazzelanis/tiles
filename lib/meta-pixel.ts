"use client";

/**
 * Meta Pixel — browser side. `trackEvent` fires the Pixel and relays the same event
 * (same event_id) to /api/meta/event for the Conversions API. Events fired before
 * the Pixel is configured (child effects run before the layout's) are queued.
 */

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue: unknown[]; loaded: boolean; version: string; push: Fbq };
declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export type EventData = Record<string, string | number | string[] | Record<string, unknown>[] | undefined>;
interface Pending {
  name: string;
  data?: EventData;
  id: string;
  relay: boolean;
}

const CUSTOM = new Set(["DownloadCatalogue", "UseCalculator"]);
let pixelId: string | null = null;
let ready = false;
const queue: Pending[] = [];

export const newEventId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Standard Meta snippet, written out so it can run once from a client component. */
function loadPixel(id: string) {
  if (window.fbq) return;
  const n = function (...args: unknown[]) {
    if (n.callMethod) n.callMethod(...args);
    else n.queue.push(args);
  } as Fbq;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  window.fbq = n;
  window._fbq ??= n;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  window.fbq("init", id);
}

/** Anonymous first-party visitor id → hashed external_id for better matching. */
function ensureVisitorId() {
  if (/(?:^|;\s*)udh_vid=/.test(document.cookie)) return;
  document.cookie = `udh_vid=${newEventId()}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}

function send({ name, data, id, relay }: Pending) {
  if (!pixelId) return;
  const clean = data ? Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== "")) : undefined;
  window.fbq?.(CUSTOM.has(name) ? "trackCustom" : "track", name, clean ?? {}, { eventID: id });
  if (!relay) return;
  const body = JSON.stringify({ event: name, id, url: location.href, data: clean });
  // keepalive / beacon so events survive page navigation (calls, WhatsApp, downloads)
  if (!navigator.sendBeacon?.("/api/meta/event", new Blob([body], { type: "application/json" }))) {
    fetch("/api/meta/event", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
  }
}

/** Called once by <MetaPixel>; null pixel = tracking off (queued events are dropped). */
export function configurePixel(id: string | null) {
  if (ready) return;
  ready = true;
  pixelId = id;
  if (id) {
    ensureVisitorId();
    loadPixel(id);
  }
  for (const e of queue.splice(0)) send(e);
}

/**
 * Track an event in the browser and (unless `relay: false`) on the server.
 * Pass `id` when a server action already sends the same event, so Meta de-duplicates.
 */
export function trackEvent(name: string, data?: EventData, opts: { id?: string; relay?: boolean } = {}) {
  if (typeof window === "undefined") return;
  const e: Pending = { name, data, id: opts.id ?? newEventId(), relay: opts.relay ?? true };
  if (!ready) queue.push(e);
  else send(e);
}
