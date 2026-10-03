"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, FileText, ImagePlus, Images, Link2, Loader2, Upload, X } from "lucide-react";
import Img from "@/components/Img";
import { cn } from "@/lib/utils";
import { MediaPicker } from "./MediaPicker";
import { toast } from "./Toaster";
import { uploadFiles } from "./upload";

function useUpload(onDone: (urls: string[]) => void) {
  const [busy, setBusy] = useState(false);
  const upload = async (files: FileList | File[] | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      onDone(await uploadFiles(files));
      toast(`Uploaded ${files.length} file${files.length > 1 ? "s" : ""}`);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };
  return { busy, upload };
}

function SourceButtons({
  busy,
  accept,
  multiple,
  onUpload,
  onLibrary,
  onUrl,
}: {
  busy: boolean;
  accept: string;
  multiple?: boolean;
  onUpload: (f: FileList | null) => void;
  onLibrary: () => void;
  onUrl: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const cls = "inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50";
  return (
    <div className="flex flex-wrap gap-2">
      <input ref={input} type="file" accept={accept} multiple={multiple} hidden onChange={(e) => (onUpload(e.target.files), (e.target.value = ""))} />
      <button type="button" className={cls} onClick={() => input.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />} Upload
      </button>
      <button type="button" className={cls} onClick={onLibrary}>
        <Images className="size-3.5" /> Library
      </button>
      <button type="button" className={cls} onClick={onUrl}>
        <Link2 className="size-3.5" /> Paste URL
      </button>
    </div>
  );
}

function askUrl() {
  const v = window.prompt("Paste an image or file URL");
  return v?.trim() || null;
}

/** Single image (or PDF when kind="file"), stored in a hidden input. */
export function ImageField({
  name,
  defaultValue,
  kind = "image",
  invalid,
  onChange,
}: {
  name: string;
  defaultValue: string;
  kind?: "image" | "file";
  invalid?: boolean;
  onChange?: () => void;
}) {
  const [value, setValueRaw] = useState(defaultValue);
  const [picker, setPicker] = useState(false);
  const [drag, setDrag] = useState(false);
  const setValue = (v: string) => (setValueRaw(v), onChange?.());
  const { busy, upload } = useUpload((urls) => setValue(urls[0]));
  const accept = kind === "image" ? "image/*" : "application/pdf";

  return (
    <div
      onDragOver={(e) => (e.preventDefault(), setDrag(true))}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => (e.preventDefault(), setDrag(false), upload(e.dataTransfer.files))}
      className={cn("rounded-xl border-2 border-dashed p-4 transition", drag ? "border-primary-400 bg-primary-50" : invalid ? "border-rose-300" : "border-slate-200")}
    >
      <input type="hidden" name={name} value={value} />
      {value ? (
        <div className="flex items-start gap-4">
          {kind === "image" ? (
            <span className="relative aspect-video w-48 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              <Img src={value} alt="" fill sizes="192px" className="object-cover" />
            </span>
          ) : (
            <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-500">
              <FileText className="size-7" />
            </span>
          )}
          <div className="min-w-0 flex-1 space-y-3">
            <p className="truncate text-xs text-slate-500" title={value}>{value}</p>
            <SourceButtons busy={busy} accept={accept} onUpload={upload} onLibrary={() => setPicker(true)} onUrl={() => { const u = askUrl(); if (u) setValue(u); }} />
            <button type="button" onClick={() => setValue("")} className="text-xs text-rose-600 hover:underline">Remove</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-400">
            {kind === "image" ? <ImagePlus className="size-5" /> : <FileText className="size-5" />}
          </span>
          <p className="text-sm text-slate-500">Drag & drop {kind === "image" ? "an image" : "a PDF"} here, or</p>
          <SourceButtons busy={busy} accept={accept} onUpload={upload} onLibrary={() => setPicker(true)} onUrl={() => { const u = askUrl(); if (u) setValue(u); }} />
        </div>
      )}
      <MediaPicker open={picker} accept={kind === "image" ? "image" : "pdf"} onClose={() => setPicker(false)} onPick={(u) => setValue(u[0])} />
    </div>
  );
}

/** Ordered image gallery; each URL is submitted as a repeated hidden input. */
export function ImagesField({ name, defaultValue, invalid, onChange }: { name: string; defaultValue: string[]; invalid?: boolean; onChange?: () => void }) {
  const [list, setListRaw] = useState<string[]>(defaultValue);
  const [picker, setPicker] = useState(false);
  const [drag, setDrag] = useState(false);
  const setList = (fn: (l: string[]) => string[]) => (setListRaw(fn), onChange?.());
  const { busy, upload } = useUpload((urls) => setList((l) => [...l, ...urls]));
  const move = (i: number, d: number) =>
    setList((l) => {
      const next = [...l];
      const j = i + d;
      if (j < 0 || j >= next.length) return l;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div
      onDragOver={(e) => (e.preventDefault(), setDrag(true))}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => (e.preventDefault(), setDrag(false), upload(e.dataTransfer.files))}
      className={cn("rounded-xl border-2 border-dashed p-4 transition", drag ? "border-primary-400 bg-primary-50" : invalid ? "border-rose-300" : "border-slate-200")}
    >
      {list.map((u, i) => <input key={i} type="hidden" name={name} value={u} />)}
      {list.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {list.map((u, i) => (
            <div key={u + i} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
              <Img src={u} alt="" fill sizes="180px" className="object-cover" />
              {i === 0 && <span className="absolute top-1.5 left-1.5 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white">Cover</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-linear-to-t from-black/60 p-1.5 opacity-0 transition group-hover:opacity-100">
                <span className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} className="rounded bg-white/90 p-1 text-slate-700" aria-label="Move left"><ArrowLeft className="size-3.5" /></button>
                  <button type="button" onClick={() => move(i, 1)} className="rounded bg-white/90 p-1 text-slate-700" aria-label="Move right"><ArrowRight className="size-3.5" /></button>
                </span>
                <button type="button" onClick={() => setList((l) => l.filter((_, x) => x !== i))} className="rounded bg-white/90 p-1 text-rose-600" aria-label="Remove"><X className="size-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col items-center gap-3 text-center">
        {!list.length && <p className="text-sm text-slate-500">Drag & drop images here, or</p>}
        <SourceButtons
          busy={busy}
          accept="image/*"
          multiple
          onUpload={upload}
          onLibrary={() => setPicker(true)}
          onUrl={() => { const u = askUrl(); if (u) setList((l) => [...l, u]); }}
        />
      </div>
      <MediaPicker open={picker} multiple onClose={() => setPicker(false)} onPick={(u) => setList((l) => [...l, ...u])} />
    </div>
  );
}

export function Toggle({ name, defaultChecked, onChange }: { name: string; defaultChecked: boolean; onChange?: () => void }) {
  return (
    <span className="relative inline-flex">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} onChange={onChange} className="peer sr-only" />
      <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-primary-600 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-300" />
      <span className="pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
    </span>
  );
}
