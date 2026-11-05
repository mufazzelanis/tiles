"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Phone } from "lucide-react";
import Img from "@/components/Img";
import type { Settings, Slide } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SocialIcons } from "./SocialIcons";

const SLIDE_MS = 6500;

/**
 * Home page hero slider.
 * - Desktop: full-bleed photo with a slow zoom, text in the middle.
 * - Phones: the slide's own mobile image if it has one; otherwise the whole desktop banner is shown
 *   (nothing cropped) over a soft blurred copy of itself, with the text moved to the bottom.
 * - Autoplay is driven by the progress bar on the active dot, so pausing (hover, touch, hidden tab)
 *   freezes both together; with "reduce motion" switched on there is no autoplay.
 */
export function HeroSlider({ slides, settings }: { slides: Slide[]; settings: Settings }) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [touching, setTouching] = useState(false);
  const [hidden, setHidden] = useState(false);
  const count = slides.length;
  const touchX = useRef<number | null>(null);
  const paused = hovered || touching || hidden;

  const go = useCallback((dir: number) => setIndex((i) => (i + dir + count) % count), [count]);

  // stop while the tab isn't visible
  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (!count) return null;
  // phones get a taller frame when any slide has its own mobile banner
  const tallOnPhones = slides.some((s) => s.mobileImage);

  return (
    <section
      className={cn(
        "relative touch-pan-y overflow-hidden bg-neutral-900 select-none sm:aspect-auto sm:h-[clamp(380px,72vh,760px)]",
        tallOnPhones ? "aspect-4/5" : "aspect-16/11",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // swipe left / right on touch screens
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setTouching(true);
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        setTouching(false);
        if (start === null) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      }}
      aria-roledescription="carousel"
      aria-label="Highlights"
    >
      {slides.map((s, i) => {
        const active = i === index;
        const hasText = !!(s.title || s.subtitle || s.ctaLabel);
        return (
          <div
            key={s.id}
            className={cn("absolute inset-0 transition-opacity duration-1000", active ? "opacity-100" : "pointer-events-none opacity-0")}
            aria-hidden={!active}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
          >
            {/* desktop / tablet: full-bleed photo */}
            <div className={cn("absolute inset-0 hidden sm:block", active && "animate-ken-burns")}>
              <Img src={s.image} alt={s.title || ""} fill loading="eager" fetchPriority={i === 0 ? "high" : "auto"} sizes="100vw" className="object-cover" />
            </div>

            {/* phones */}
            <div className="absolute inset-0 sm:hidden">
              {s.mobileImage ? (
                <Img src={s.mobileImage} alt={s.title || ""} fill loading={i === 0 ? "eager" : "lazy"} sizes="100vw" className="object-cover" />
              ) : (
                <>
                  {/* the whole banner stays visible; a blurred copy fills the frame around it */}
                  <Img src={s.image} alt="" fill sizes="50vw" className="scale-125 object-cover opacity-70 blur-2xl" />
                  <Img src={s.image} alt={s.title || ""} fill loading={i === 0 ? "eager" : "lazy"} sizes="100vw" className="object-contain drop-shadow-2xl" />
                </>
              )}
            </div>

            {hasText && (
              <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent sm:bg-linear-to-b sm:from-black/30 sm:via-black/10 sm:to-black/45" />
            )}
            {/* image-only slide with a link: the whole slide is clickable */}
            {active && s.ctaLink && !s.ctaLabel && <Link href={s.ctaLink} className="absolute inset-0 z-[1]" aria-label={s.title || "Open"} />}

            {active && hasText && (
              <div className="relative flex h-full flex-col items-center justify-end px-5 pb-12 text-center text-white sm:justify-center sm:px-6 sm:pb-0">
                {s.subtitle && <p className="animate-fade-up mb-2 text-[10px] tracking-[0.3em] uppercase opacity-90 sm:mb-3 sm:text-xs">{s.subtitle}</p>}
                {s.title && (
                  <h1 className="animate-fade-up font-display text-[26px] leading-tight font-semibold drop-shadow-lg [animation-delay:120ms] sm:text-5xl">
                    {s.title}
                  </h1>
                )}
                {s.ctaLabel && (
                  <Link
                    href={s.ctaLink || "/products"}
                    className="animate-fade-up mt-4 bg-white px-5 py-2.5 text-[12px] tracking-wide text-ink uppercase shadow-lg transition [animation-delay:240ms] hover:bg-leaf hover:text-white active:scale-95 sm:mt-6 sm:text-[13px]"
                  >
                    {s.ctaLabel}
                  </Link>
                )}
              </div>
            )}
          </div>
        );
      })}

      {count > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Previous slide" className="absolute top-1/2 left-5 z-[2] hidden -translate-y-1/2 p-2 text-white/80 transition hover:text-white sm:block">
            <ArrowLeft className="size-5" />
          </button>
          <button onClick={() => go(1)} aria-label="Next slide" className="absolute top-1/2 right-5 z-[2] hidden -translate-y-1/2 p-2 text-white/80 transition hover:text-white sm:block">
            <ArrowRight className="size-5" />
          </button>
        </>
      )}

      {/* phones already have WhatsApp / call buttons at the bottom of the screen */}
      <a
        href={`tel:${settings.phone.replace(/\s/g, "")}`}
        className="absolute top-1/4 right-0 z-[2] hidden size-11 place-items-center border border-white/60 bg-white/10 text-white backdrop-blur transition hover:bg-white hover:text-ink sm:grid"
        aria-label="Call us"
      >
        <Phone className="size-4" />
      </a>

      <SocialIcons socials={settings.socials} className="absolute bottom-6 left-6 z-[2] hidden sm:flex" itemClassName="border-white/40 bg-white/15 backdrop-blur" />

      {/* dots — the active one fills up and moves to the next slide when full */}
      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 z-[2] flex -translate-x-1/2 items-center gap-2 sm:bottom-6">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className={cn("relative h-1.5 overflow-hidden rounded-full transition-all", i === index ? "w-9 bg-white/35" : "w-1.5 bg-white/50 hover:bg-white/80")}
            >
              {i === index && (
                <span
                  key={index}
                  className="animate-slide-progress absolute inset-0 rounded-full bg-white"
                  style={{ animationPlayState: paused ? "paused" : "running", ["--slide-ms" as string]: `${SLIDE_MS}ms` }}
                  onAnimationEnd={() => go(1)}
                />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="absolute right-6 bottom-6 z-[2] hidden items-center gap-2 text-sm font-semibold text-white sm:flex">
        <span>{index + 1}</span>
        <span className="h-px w-6 bg-white/80" />
        <span className="opacity-70">{count}</span>
      </div>
    </section>
  );
}
