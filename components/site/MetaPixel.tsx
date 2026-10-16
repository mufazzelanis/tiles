"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { configurePixel, trackEvent } from "@/lib/meta-pixel";

// React dev mode runs effects twice — don't count the same page view twice
let lastView = { key: "", at: 0 };

/**
 * Loads the Meta Pixel and tracks page views on every client-side navigation,
 * plus site-wide intent signals: phone / WhatsApp / email clicks and catalogue downloads.
 */
export function MetaPixel({ pixelId }: { pixelId: string | null }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => configurePixel(pixelId), [pixelId]);

  useEffect(() => {
    const key = `${pathname}?${search}`;
    if (lastView.key === key && Date.now() - lastView.at < 1500) return;
    lastView = { key, at: Date.now() };
    trackEvent("PageView");
    if (pathname === "/store-locator") trackEvent("FindLocation");
  }, [pathname, search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      const href = a?.getAttribute("href") ?? "";
      if (!href) return;
      if (href.startsWith("tel:")) trackEvent("Contact", { method: "phone" });
      else if (/wa\.me|whatsapp\.com/.test(href)) trackEvent("Contact", { method: "whatsapp" });
      else if (href.startsWith("mailto:")) trackEvent("Contact", { method: "email" });
      else if (/\.pdf($|\?)/i.test(href)) trackEvent("DownloadCatalogue", { content_name: a?.textContent?.trim().slice(0, 80) || href });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
