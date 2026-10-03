"use client";

import { ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Product pages have a mobile action bar, so the button sits higher there. */
const PRODUCT_PAGE = /^\/products\/[^/]+/;

export function BackToTop() {
  const [show, setShow] = useState(false);
  const onProduct = PRODUCT_PAGE.test(usePathname());
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      onClick={() => window.scrollTo({ top: 0 })}
      aria-label="Back to top"
      className={cn(
        "fixed left-4 z-30 grid size-11 place-items-center rounded-full bg-brand text-white shadow-lg transition hover:-translate-y-0.5 active:scale-90 lg:bottom-6 lg:left-6",
        onProduct ? "bottom-[calc(140px+env(safe-area-inset-bottom))]" : "bottom-[calc(84px+env(safe-area-inset-bottom))]",
        show ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <ChevronUp className="size-5" />
    </button>
  );
}
