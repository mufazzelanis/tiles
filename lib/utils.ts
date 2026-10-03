export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function newId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(
    "en-GB",
    opts ?? { day: "2-digit", month: "short", year: "numeric" },
  );
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(iso);
}

export function formatPrice(n: number) {
  if (!n) return "Price on request";
  return `৳ ${n.toLocaleString("en-IN")}`;
}

/**
 * Only our own uploads go through the Next image optimizer. Remote URLs
 * (Unsplash, CDNs, links pasted in the admin) are served as-is, so any host
 * works without touching next.config.ts.
 */
export function isOptimizable(src: string) {
  return src.startsWith("/");
}

export function youtubeId(input: string) {
  const m = input.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return m ? m[1] : input.trim();
}
