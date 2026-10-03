"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Scroll-snap carousel with arrow controls; children are the slides. */
export function Carousel({
  children,
  variant = "arrows",
  className,
}: {
  children: ReactNode;
  variant?: "arrows" | "boxed";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scroll = (dir: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const Prev = variant === "arrows" ? ArrowLeft : ChevronLeft;
  const Next = variant === "arrows" ? ArrowRight : ChevronRight;
  const btn =
    variant === "arrows"
      ? "text-ink/70 hover:text-ink disabled:opacity-25 p-2"
      : "border border-neutral-300 bg-white shadow-sm hover:bg-neutral-50 disabled:opacity-40 p-1.5";

  return (
    <div className={cn("relative flex items-center gap-2 sm:gap-6", className)}>
      <button onClick={() => scroll(-1)} disabled={edges.start} aria-label="Previous" className={cn("hidden shrink-0 transition sm:block", btn)}>
        <Prev className="size-5" />
      </button>
      <div ref={ref} className="no-scrollbar flex min-w-0 flex-1 snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth">
        {children}
      </div>
      <button onClick={() => scroll(1)} disabled={edges.end} aria-label="Next" className={cn("hidden shrink-0 transition sm:block", btn)}>
        <Next className="size-5" />
      </button>
    </div>
  );
}
