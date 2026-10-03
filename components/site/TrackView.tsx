"use client";

import { useEffect } from "react";
import { pushRecentlyViewed } from "@/lib/client-store";

/** Counts a product view once per browser session. */
export function TrackView({ id }: { id: string }) {
  useEffect(() => {
    pushRecentlyViewed(id);
    const key = `viewed:${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    const url = `/api/track/${id}`;
    if (!navigator.sendBeacon?.(url)) fetch(url, { method: "POST", keepalive: true }).catch(() => {});
  }, [id]);
  return null;
}
