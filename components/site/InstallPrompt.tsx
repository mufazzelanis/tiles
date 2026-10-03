"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** "Install the app" card for phones (Android prompt, iOS instructions). */
export function InstallPrompt({ siteName }: { siteName: string }) {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = Number(localStorage.getItem("tilora:install-dismissed") ?? 0) > Date.now() - 14 * 86400000;
    } catch {}
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (dismissed || standalone) return;

    // wait a little so the card never interrupts the first impression
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      timer = setTimeout(() => setEvt(e as BIPEvent), 25000);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    // iOS Safari has no install event, so show manual instructions after a short delay
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    const t = isIos ? setTimeout(() => setIos(true), 25000) : undefined;
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      clearTimeout(t);
      clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    setEvt(null);
    setIos(false);
    try {
      localStorage.setItem("tilora:install-dismissed", String(Date.now()));
    } catch {}
  };

  if (!evt && !ios) return null;

  return (
    <div className="animate-fade-up fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-50 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/5 lg:hidden">
      <button onClick={dismiss} className="absolute top-2 right-2 p-1.5 text-neutral-400" aria-label="Dismiss">
        <X className="size-4" />
      </button>
      <div className="flex items-center gap-3 pr-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="size-12 rounded-xl shadow ring-1 ring-black/5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Install {siteName}</p>
          <p className="text-xs text-muted">
            {ios ? (
              <>
                Tap <Share className="inline size-3.5 -translate-y-px" /> then &ldquo;Add to Home Screen&rdquo;.
              </>
            ) : (
              "Browse tiles faster, right from your home screen."
            )}
          </p>
        </div>
      </div>
      {evt && (
        <button
          onClick={async () => {
            await evt.prompt();
            await evt.userChoice;
            dismiss();
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-2.5 text-sm font-medium text-white active:scale-[0.98]"
        >
          <Download className="size-4" /> Install app
        </button>
      )}
    </div>
  );
}
