"use client";

import { ArrowLeft, ArrowRight, MapPin, Phone } from "lucide-react";
import Img from "@/components/Img";
import type { ResourceDef } from "@/lib/resources";
import { formatPrice } from "@/lib/utils";

type V = Record<string, unknown>;
const s = (v: unknown) => (Array.isArray(v) ? String(v[0] ?? "") : String(v ?? ""));

/** Renders the record roughly the way the public website will show it. */
export function LivePreview({ def, values, categoryName }: { def: ResourceDef; values: V; categoryName?: string }) {
  const title = s(values[def.titleField]) || `Untitled ${def.singular.toLowerCase()}`;
  const image = s(values.image ?? values.images ?? values.cover);

  switch (def.key) {
    case "slides":
      return (
        <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-800">
          <Img src={image} alt="" fill sizes="300px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
            {s(values.subtitle) && <p className="mb-1 line-clamp-1 text-[7px] tracking-[0.25em] uppercase opacity-90">{s(values.subtitle)}</p>}
            <p className="line-clamp-2 font-display text-sm leading-tight font-semibold drop-shadow">{title}</p>
            {s(values.ctaLabel) && <span className="mt-2 bg-white px-2 py-1 text-[7px] tracking-wide text-slate-900 uppercase">{s(values.ctaLabel)}</span>}
          </div>
          <ArrowLeft className="absolute top-1/2 left-2 size-3 -translate-y-1/2 text-white/70" />
          <ArrowRight className="absolute top-1/2 right-2 size-3 -translate-y-1/2 text-white/70" />
        </div>
      );
    case "products":
      return (
        <div className="mx-auto max-w-[200px]">
          <div className="relative aspect-square overflow-hidden bg-slate-100">
            <Img src={image} alt="" fill sizes="200px" className="object-cover" />
            {Boolean(values.isNew) && <span className="absolute top-2 left-2 bg-gold-500 px-1.5 py-0.5 text-[9px] font-semibold text-white uppercase">New</span>}
            {s(values.size) && <span className="absolute right-2 bottom-2 bg-white/90 px-1.5 py-0.5 text-[9px] text-slate-800">{s(values.size)}</span>}
          </div>
          <p className="mt-2 text-[13px] font-bold text-slate-900">{categoryName || "Category"}</p>
          <p className="text-[11px] text-slate-500">{title}</p>
          <span className="my-1.5 block h-0.5 w-6 bg-gradient-to-r from-gold-500 from-50% to-slate-200 to-50%" />
          <p className="text-[11px] font-semibold text-slate-700">{formatPrice(Number(values.price ?? 0))}</p>
        </div>
      );
    case "stores":
      return (
        <div className="rounded-lg border border-slate-200 p-4">
          <span className="rounded-sm bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-sky-700 uppercase">{s(values.type) || "Store"}</span>
          <p className="mt-2 text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 flex items-start gap-1 text-xs text-slate-500"><MapPin className="mt-0.5 size-3 shrink-0" />{s(values.address) || "Address"}{s(values.division) && `, ${s(values.division)}`}</p>
          {s(values.phone) && <p className="mt-1 flex items-center gap-1 text-xs text-slate-700"><Phone className="size-3" />{s(values.phone)}</p>}
        </div>
      );
    case "categories":
      return (
        <div>
          <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
            <Img src={image} alt="" fill sizes="300px" className="object-cover" />
          </div>
          <p className="mt-2 text-sm text-slate-900">{title}</p>
          <span className="my-1.5 block h-0.5 w-6 bg-gradient-to-r from-gold-500 from-50% to-slate-200 to-50%" />
          <p className="text-[10px] font-bold tracking-wide text-blue-700 uppercase">View details</p>
        </div>
      );
    default: {
      const text = s(values.excerpt ?? values.description ?? values.body);
      return (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="relative aspect-video bg-slate-100">
            <Img src={image} alt="" fill sizes="300px" className="object-cover" />
            {s(values.heading) && (
              <div className="absolute inset-0 grid place-items-center bg-black/40 p-4">
                <span className="border border-white/80 px-3 py-2 text-center text-[10px] font-semibold tracking-wide text-white uppercase">{s(values.heading)}</span>
              </div>
            )}
          </div>
          <div className="p-3">
            {s(values.type) && <p className="text-[9px] tracking-[0.2em] text-blue-700 uppercase">{s(values.type)}</p>}
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            {text && <p className="mt-1 line-clamp-3 text-xs text-slate-500">{text}</p>}
          </div>
        </div>
      );
    }
  }
}

/** How the page could appear in Google results. */
export function SearchPreview({ title, path, description, siteName }: { title: string; path: string; description: string; siteName: string }) {
  return (
    <div className="space-y-0.5">
      <p className="truncate text-xs text-slate-500">yourdomain.com{path}</p>
      <p className="line-clamp-1 text-[15px] text-[#1a0dab]">{title || "Page title"} | {siteName}</p>
      <p className="line-clamp-2 text-xs text-slate-600">{description || "Add a description to control what search engines show here."}</p>
    </div>
  );
}
