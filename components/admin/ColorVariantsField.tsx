"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, EyeOff, Images, Loader2, Palette, Plus, Search, Upload, X } from "lucide-react";
import Img from "@/components/Img";
import { Swatch } from "@/components/Swatch";
import type { SwatchColor } from "@/lib/colors";
import type { ColorVariant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MediaPicker } from "./MediaPicker";
import { toast } from "./Toaster";
import { uploadFiles } from "./upload";

export type ColorOption = SwatchColor & { family: string; active: boolean };

/**
 * Picks which library colours a product comes in, in display order, with an
 * optional photo per colour. Submitted as one JSON hidden input.
 */
export function ColorVariantsField({ name, defaultValue, colors, onChange }: {
  name: string;
  defaultValue: ColorVariant[];
  colors: ColorOption[];
  onChange?: () => void;
}) {
  const byId = new Map(colors.map((c) => [c.id, c]));
  const [list, setListRaw] = useState<ColorVariant[]>(() => (defaultValue ?? []).filter((v) => byId.has(v.colorId)));
  const [q, setQ] = useState("");
  const [photoFor, setPhotoFor] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<string | null>(null);
  const setList = (fn: (l: ColorVariant[]) => ColorVariant[]) => (setListRaw(fn), onChange?.());

  const chosen = new Set(list.map((v) => v.colorId));
  const toggle = (id: string) => setList((l) => (chosen.has(id) ? l.filter((v) => v.colorId !== id) : [...l, { colorId: id, image: "" }]));
  const move = (i: number, d: number) =>
    setList((l) => {
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      const n = [...l];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  const setImage = (id: string, image: string) => setList((l) => l.map((v) => (v.colorId === id ? { ...v, image } : v)));
  const library = colors.filter((c) => !q || `${c.name} ${c.code} ${c.family}`.toLowerCase().includes(q.toLowerCase()));

  if (!colors.length) {
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 p-4 text-sm text-slate-500">
        <Palette className="size-5 text-slate-400" />
        <span className="flex-1">No colours in your library yet.</span>
        <Link href="/admin/colors?open=new" className="font-medium text-primary-600 hover:underline">Add colours</Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200">
      <input type="hidden" name={name} value={JSON.stringify(list)} />
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const target = uploadTarget.current;
          const files = e.target.files;
          e.target.value = "";
          if (!target || !files?.length) return;
          setUploading(target);
          try {
            const [url] = await uploadFiles(files);
            if (url) setImage(target, url);
          } catch (err) {
            toast((err as Error).message, "error");
          } finally {
            setUploading(null);
          }
        }}
      />

      {/* selected, in order */}
      {list.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {list.map((v, i) => {
            const c = byId.get(v.colorId)!;
            return (
              <li key={v.colorId} className="flex items-center gap-3 px-3 py-2.5">
                <Swatch color={c} className="size-9 shadow-inner" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-800">
                    {c.name}
                    {i === 0 && <span className="rounded bg-slate-900 px-1.5 text-[10px] font-medium text-white">Default</span>}
                    {!c.active && <span className="flex items-center gap-0.5 text-[11px] font-normal text-amber-600"><EyeOff className="size-3" /> hidden</span>}
                  </span>
                  <span className="block text-[11px] text-slate-400">{[c.code, c.family].filter(Boolean).join(" · ")}</span>
                </span>
                {v.image ? (
                  <span className="group relative size-10 shrink-0 overflow-hidden rounded-md ring-1 ring-slate-200">
                    <Img src={v.image} alt="" fill sizes="40px" className="object-cover" />
                    <button type="button" onClick={() => setImage(v.colorId, "")} className="absolute inset-0 grid place-items-center bg-black/50 text-white opacity-0 transition group-hover:opacity-100" aria-label="Remove photo">
                      <X className="size-4" />
                    </button>
                  </span>
                ) : (
                  <span className="flex shrink-0 overflow-hidden rounded-md border border-slate-200 text-[11px] font-medium text-slate-600" title="Photo of the product in this colour">
                    <button type="button" disabled={!!uploading} onClick={() => ((uploadTarget.current = v.colorId), fileInput.current?.click())} className="inline-flex items-center gap-1 px-2 py-1 hover:bg-slate-50">
                      {uploading === v.colorId ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />} Photo
                    </button>
                    <button type="button" onClick={() => setPhotoFor(v.colorId)} className="border-l border-slate-200 px-1.5 hover:bg-slate-50" aria-label="Choose from media library">
                      <Images className="size-3.5" />
                    </button>
                  </span>
                )}
                <span className="flex shrink-0">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" aria-label="Move up"><ArrowUp className="size-3.5" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" aria-label="Move down"><ArrowDown className="size-3.5" /></button>
                  <button type="button" onClick={() => toggle(v.colorId)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove ${c.name}`}><X className="size-3.5" /></button>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-4 py-3 text-sm text-slate-500">No colours selected — the product page won&apos;t show a colour choice.</p>
      )}

      {/* library */}
      <div className="border-t border-slate-100 bg-slate-50/60 p-3">
        <div className="mb-2.5 flex items-center gap-2">
          <label className="relative flex-1">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter colours…" className="input py-1.5 pl-8 text-xs" />
          </label>
          <Link href="/admin/colors" target="_blank" className="shrink-0 text-xs font-medium text-primary-600 hover:underline">Manage library</Link>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {library.map((c) => {
            const on = chosen.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border bg-white py-0.5 pr-2.5 pl-0.5 text-xs transition",
                  on ? "border-primary-600 text-primary-700 ring-1 ring-primary-600" : "border-slate-200 text-slate-600 hover:border-slate-300",
                  !c.active && "opacity-60",
                )}
                title={c.active ? c.name : `${c.name} (hidden on website)`}
              >
                <Swatch color={c} className="size-5" />
                {c.name}
                {on ? <Check className="size-3" /> : <Plus className="size-3 text-slate-400" />}
              </button>
            );
          })}
          {!library.length && <span className="text-xs text-slate-400">No colours match</span>}
        </div>
      </div>

      <MediaPicker open={!!photoFor} onClose={() => setPhotoFor(null)} onPick={(urls) => photoFor && urls[0] && setImage(photoFor, urls[0])} />
    </div>
  );
}
