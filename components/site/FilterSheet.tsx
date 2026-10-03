"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Desktop: renders the filters inline in the sidebar.
 * Phones: a sticky "Filters" button opens them as a bottom sheet.
 */
export function FilterSheet({ children, activeCount, total }: { children: ReactNode; activeCount: number; total: number }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    document.body.style.overflow = open && mq.matches ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="sticky top-[52px] z-20 -mx-6 mb-2 flex items-center gap-2 border-b border-neutral-200 bg-white/95 px-6 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-ink px-4 py-2 text-[13px] font-medium text-ink active:scale-95"
        >
          <SlidersHorizontal className="size-4" /> Filters
          {activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-brand text-[10px] text-white">{activeCount}</span>}
        </button>
        <span className="ml-auto text-[12px] text-muted">{total} tiles</span>
      </div>

      {/* backdrop (mobile) */}
      <div
        className={cn("fixed inset-0 z-50 bg-black/40 transition-opacity lg:hidden", open ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          // mobile: bottom sheet
          "fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white px-6 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-2xl",
          open ? "animate-sheet" : "hidden",
          // desktop: plain sidebar
          "lg:static lg:block lg:max-h-none lg:overflow-visible lg:rounded-none lg:p-0 lg:shadow-none",
        )}
      >
        <div className="mb-3 flex items-center justify-between lg:hidden">
          <span className="mx-auto h-1.5 w-10 rounded-full bg-neutral-300" />
          <button onClick={() => setOpen(false)} className="absolute top-3 right-4 rounded-full p-2 text-neutral-500" aria-label="Close filters">
            <X className="size-5" />
          </button>
        </div>
        {children}
        <button
          onClick={() => setOpen(false)}
          className="sticky bottom-0 mt-6 w-full rounded-xl bg-navy py-3.5 text-sm font-medium text-white shadow-lg active:scale-[0.98] lg:hidden"
        >
          Show {total} tile{total === 1 ? "" : "s"}
        </button>
      </div>
    </>
  );
}
