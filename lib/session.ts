import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless signed session token: base64url(payload).signature
 * Shared by proxy.ts (optimistic check) and the server-side auth guard.
 */
export const SESSION_COOKIE = "tilora_session";
export const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  uid: string;
  /** must equal the user's sessionVersion, so bumping it signs out every device */
  sv: number;
  exp: number;
}

let warned = false;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production" && !warned) {
    warned = true;
    console.warn("[auth] SESSION_SECRET is not set — using an insecure fallback.");
  }
  return "dev-only-insecure-secret-change-me";
}

function sign(data: string) {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function encodeSession(payload: SessionPayload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function decodeSession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = Buffer.from(sign(data));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    return payload.exp > Date.now() / 1000 ? payload : null;
  } catch {
    return null;
  }
}
