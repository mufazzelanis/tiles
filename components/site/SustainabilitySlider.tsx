"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Img from "@/components/Img";
import type { Sustainability } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SustainabilitySlider({ items }: { items: Sustainability[] }) {
  const [i, setI] = useState(0);
  if (!items.length) return null;
  const item = items[i];
  const next = items[(i + 1) % items.length];

  return (
    <div>
      <div className="grid items-end gap-8 md:grid-cols-[1.6fr_1fr]">
        <div key={item.id} className="animate-fade-up relative aspect-16/10 overflow-hidden">
          <Img src={item.image} alt={item.title} fill sizes="(max-width:768px) 100vw, 60vw" className="object-cover" />
          <div className="absolute inset-4 border-2 border-white/70" />
        </div>
        <div>
          <div className="relative mb-6 aspect-square max-w-[260px] overflow-hidden">
            <Img src={next.image} alt="" fill sizes="260px" className="object-cover" />
            <div className="absolute inset-0 bg-black/45" />
            <div className="absolute inset-[15%] grid place-items-center border border-white/90 p-3 text-center">
              <span className="text-[15px] leading-relaxed font-semibold tracking-wide text-white uppercase">{item.heading}</span>
            </div>
          </div>
          <h3 className="text-xl text-ink">{item.title}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{item.body}</p>
          <div className="mt-4 flex items-center justify-end gap-3">
            <span className="leaf-dash" />
            <Link href="/about" className="text-[11px] font-bold tracking-wide text-brand uppercase hover:underline">
              Discover
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-10 flex justify-center">
        <div className="flex border border-neutral-300">
          {[
            { dir: -1, Icon: ArrowLeft, label: "Previous" },
            { dir: 1, Icon: ArrowRight, label: "Next" },
          ].map(({ dir, Icon, label }) => (
            <button
              key={label}
              aria-label={label}
              onClick={() => setI((v) => (v + dir + items.length) % items.length)}
              className={cn("grid h-11 w-20 place-items-center transition hover:bg-white", dir === 1 && "border-l border-neutral-300 bg-white")}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
