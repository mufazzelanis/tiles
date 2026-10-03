"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { siteToast, useFavorites } from "@/lib/client-store";
import { cn } from "@/lib/utils";

/** Heart toggle; safe to place inside a <Link> card. */
export function FavoriteButton({ id, name, className, size = "sm" }: { id: string; name: string; className?: string; size?: "sm" | "lg" }) {
  const fav = useFavorites();
  const active = fav.has(id);
  const [burst, setBurst] = useState(0);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = fav.toggle(id);
        if (added) setBurst((b) => b + 1);
        siteToast(added ? `♥ ${name} saved to favorites` : `${name} removed from favorites`);
      }}
      aria-pressed={active}
      aria-label={active ? `Remove ${name} from favorites` : `Save ${name} to favorites`}
      className={cn(
        "grid place-items-center rounded-full bg-white/95 shadow-md backdrop-blur transition hover:scale-110 active:scale-95",
        size === "sm" ? "size-8" : "size-11",
        className,
      )}
    >
      <Heart
        key={burst}
        className={cn(size === "sm" ? "size-4" : "size-5", "transition", active ? "animate-heart fill-rose-500 text-rose-500" : "text-ink")}
      />
    </button>
  );
}
