"use client";

import { useEffect, useState } from "react";

/** Bottom toast for the public site (sits above the mobile tab bar). */
export function SiteToaster() {
  const [items, setItems] = useState<{ id: number; text: string }[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const id = Date.now() + Math.random();
      setItems((t) => [...t.slice(-2), { id, text: (e as CustomEvent<string>).detail }]);
      setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 2600);
    };
    window.addEventListener("site-toast", on);
    return () => window.removeEventListener("site-toast", on);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-8">
      {items.map((t) => (
        <p key={t.id} role="status" className="animate-toast rounded-full bg-ink/95 px-5 py-2.5 text-[13px] text-white shadow-xl backdrop-blur">
          {t.text}
        </p>
      ))}
    </div>
  );
}
