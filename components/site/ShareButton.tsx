"use client";

import { Share2 } from "lucide-react";
import { siteToast } from "@/lib/client-store";
import { cn } from "@/lib/utils";

/** Native share sheet on phones, copy-link fallback on desktop. */
export function ShareButton({ title, className }: { title: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        const url = window.location.href;
        if (navigator.share) {
          try {
            await navigator.share({ title, url });
          } catch {}
          return;
        }
        try {
          await navigator.clipboard.writeText(url);
          siteToast("Link copied to clipboard");
        } catch {
          siteToast("Copy the link from the address bar");
        }
      }}
      className={cn("grid size-11 place-items-center rounded-full border border-neutral-300 bg-white text-ink transition hover:border-ink active:scale-95", className)}
      aria-label="Share"
    >
      <Share2 className="size-[18px]" />
    </button>
  );
}
