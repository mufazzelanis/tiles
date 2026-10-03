"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Phone } from "lucide-react";
import Img from "@/components/Img";
import type { Settings, Slide } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SocialIcons } from "./SocialIcons";

export function HeroSlider({ slides, settings }: { slides: Slide[]; settings: Settings }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const touchX = useRef<number | null>(null);

  const go = useCallback((dir: number) => setIndex((i) => (i + dir + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    const t = setInterval(() => go(1), 6500);
    return () => clearInterval(t);
  }, [paused, count, go]);

  if (!count) return null;

  return (
    <section
      className="relative h-[clamp(380px,72vh,760px)] touch-pan-y overflow-hidden bg-neutral-900 select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      // swipe left / right on touch screens
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        setPaused(false);
        if (start === null) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      }}
      aria-roledescription="carousel"
    >
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={cn("absolute inset-0 transition-opacity duration-1000", i === index ? "opacity-100" : "pointer-events-none opacity-0")}
          aria-hidden={i !== index}
        >
          <div className={cn("absolute inset-0", i === index && "animate-ken-burns")}>
            <Img src={s.image} alt="" fill loading="eager" fetchPriority={i === 0 ? "high" : "auto"} sizes="100vw" className="object-cover" />
          </div>
          <div className="absolute inset-0 bg-linear-to-b from-black/30 via-black/10 to-black/45" />
          {i === index && (
            <div className="relative flex h-full flex-col items-center justify-center px-6 text-center text-white">
              {s.subtitle && <p className="animate-fade-up mb-3 text-xs tracking-[0.3em] uppercase opacity-90">{s.subtitle}</p>}
              <h1 className="animate-fade-up font-display text-3xl font-semibold drop-shadow-lg [animation-delay:120ms] sm:text-5xl">
                {s.title}
              </h1>
              {s.ctaLabel && (
                <Link
                  href={s.ctaLink || "/products"}
                  className="animate-fade-up mt-6 bg-white px-5 py-2.5 text-[13px] tracking-wide text-ink uppercase transition [animation-delay:240ms] hover:bg-leaf hover:text-white"
                >
                  {s.ctaLabel}
                </Link>
              )}
            </div>
          )}
        </div>
      ))}

      {count > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Previous slide" className="absolute top-1/2 left-5 hidden -translate-y-1/2 p-2 text-white/80 transition hover:text-white sm:block">
            <ArrowLeft className="size-5" />
          </button>
          <button onClick={() => go(1)} aria-label="Next slide" className="absolute top-1/2 right-5 hidden -translate-y-1/2 p-2 text-white/80 transition hover:text-white sm:block">
            <ArrowRight className="size-5" />
          </button>
        </>
      )}

      <a
        href={`tel:${settings.phone.replace(/\s/g, "")}`}
        className="absolute top-1/4 right-0 grid size-11 place-items-center border border-white/60 bg-white/10 text-white backdrop-blur transition hover:bg-white hover:text-ink"
        aria-label="Call us"
      >
        <Phone className="size-4" />
      </a>

      <SocialIcons socials={settings.socials} className="absolute bottom-6 left-6 hidden sm:flex" itemClassName="border-white/40 bg-white/15 backdrop-blur" />

      {count > 1 && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn("h-1.5 rounded-full transition-all", i === index ? "w-7 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80")}
            />
          ))}
        </div>
      )}

      <div className="absolute right-6 bottom-6 hidden items-center gap-2 text-sm font-semibold text-white sm:flex">
        <span>{index + 1}</span>
        <span className="h-px w-6 bg-white/80" />
        <span className="opacity-70">{count}</span>
      </div>

      <div className="absolute bottom-0 left-0 h-0.5 bg-leaf transition-all duration-500" style={{ width: `${((index + 1) / count) * 100}%` }} />
    </section>
  );
}
