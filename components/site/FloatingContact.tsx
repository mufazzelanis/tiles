"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Product pages have their own mobile action bar with WhatsApp. */
const PRODUCT_PAGE = /^\/products\/[^/]+/;

/** WhatsApp shortcut; sits above the mobile tab bar. */
export function FloatingContact({ phone }: { phone: string }) {
  const onProduct = PRODUCT_PAGE.test(usePathname());
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return (
    <a
      href={`https://wa.me/${digits}?text=${encodeURIComponent("Hi, I am interested in your tiles.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={cn(
        "group fixed right-4 bottom-[calc(84px+env(safe-area-inset-bottom))] z-30 items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-white shadow-lg shadow-black/20 transition hover:scale-105 active:scale-95 lg:right-6 lg:bottom-6 lg:flex",
        onProduct ? "hidden" : "flex",
      )}
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-20" />
      <svg viewBox="0 0 24 24" className="relative size-6" fill="currentColor" aria-hidden>
        <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.2-.8 1-.9 1.1-.3.2-.6.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.5.3-.5a.5.5 0 0 0 0-.5L9.3 7c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-1 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.5 4c.6.3 1.1.4 1.5.5a3.6 3.6 0 0 0 1.7.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3zM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.8 9.8 0 1 1 8.3 4.6zm8.4-18.2A11.8 11.8 0 0 0 1.9 17.9L.2 24l6.3-1.6a11.8 11.8 0 0 0 5.6 1.4A11.8 11.8 0 0 0 20.4 3.6z" />
      </svg>
      <span className="relative hidden pr-1 text-sm font-medium lg:group-hover:inline">Chat with us</span>
    </a>
  );
}
