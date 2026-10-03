"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CircleCheck, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Toast = { id: number; message: string; tone: "success" | "error" };

/** Show a toast from anywhere in the admin client code. */
export function toast(message: string, tone: Toast["tone"] = "success") {
  window.dispatchEvent(new CustomEvent("admin-toast", { detail: { message, tone } }));
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onToast = (e: Event) => {
      const { message, tone } = (e as CustomEvent).detail;
      const id = Date.now() + Math.random();
      setItems((t) => [...t, { id, message, tone }]);
      setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 3800);
    };
    window.addEventListener("admin-toast", onToast);
    return () => window.removeEventListener("admin-toast", onToast);
  }, []);

  // ?saved=created|updated is set by server-action redirects
  const saved = params.get("saved");
  useEffect(() => {
    if (!saved) return;
    toast(saved === "created" ? "Created successfully" : "Changes saved");
    const next = new URLSearchParams(params);
    next.delete("saved");
    next.delete("id");
    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [saved, params, pathname, router]);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-80 flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "animate-toast pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3.5 text-sm shadow-lg",
            t.tone === "success" ? "border-emerald-200" : "border-rose-200",
          )}
          role="status"
        >
          {t.tone === "success" ? <CircleCheck className="size-5 shrink-0 text-emerald-500" /> : <AlertCircle className="size-5 shrink-0 text-rose-500" />}
          <p className="flex-1 text-slate-700">{t.message}</p>
          <button onClick={() => setItems((x) => x.filter((i) => i.id !== t.id))} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
