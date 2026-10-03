"use client";

import { useEffect, useRef, useState } from "react";
import { Check, FileText, Loader2, X } from "lucide-react";
import Img from "@/components/Img";
import type { MediaFile } from "@/lib/media";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

/** Modal that lets the user pick previously uploaded files. */
export function MediaPicker({
  open,
  multiple,
  accept = "image",
  onClose,
  onPick,
}: {
  open: boolean;
  multiple?: boolean;
  accept?: "image" | "pdf";
  onClose: () => void;
  onPick: (urls: string[]) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [files, setFiles] = useState<MediaFile[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open) {
      if (!d.open) d.showModal();
      fetch("/api/admin/media")
        .then((r) => r.json())
        .then((all: MediaFile[]) => setFiles(all.filter((f) => f.kind === accept)))
        .catch(() => setFiles([]));
    } else if (d.open) d.close();
  }, [open, accept]);

  const toggle = (url: string) =>
    setPicked((p) => (p.includes(url) ? p.filter((x) => x !== url) : multiple ? [...p, url] : [url]));

  return (
    <dialog
      ref={ref}
      onClose={() => (onClose(), setPicked([]))}
      className="m-auto w-[min(860px,94vw)] rounded-2xl p-0 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="font-semibold text-slate-900">Media library</h3>
        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
          <X className="size-5" />
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-5">
        {!files ? (
          <div className="grid place-items-center py-16 text-slate-400"><Loader2 className="size-6 animate-spin" /></div>
        ) : !files.length ? (
          <p className="py-16 text-center text-sm text-slate-500">No files uploaded yet. Use the upload button on the field instead.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {files.map((f) => (
              <button
                key={f.name}
                type="button"
                onClick={() => toggle(f.url)}
                className={cn("relative aspect-square overflow-hidden rounded-lg ring-2 transition", picked.includes(f.url) ? "ring-primary-500" : "ring-transparent hover:ring-slate-300")}
              >
                {f.kind === "image" ? (
                  <Img src={f.url} alt={f.name} fill sizes="160px" className="object-cover" />
                ) : (
                  <span className="flex size-full flex-col items-center justify-center gap-2 bg-slate-50 p-2 text-xs break-all text-slate-500">
                    <FileText className="size-6" /> {f.name}
                  </span>
                )}
                {picked.includes(f.url) && (
                  <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-primary-600 text-white">
                    <Check className="size-3" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="button" disabled={!picked.length} onClick={() => (onPick(picked), onClose())}>
          Use {picked.length > 1 ? `${picked.length} files` : "file"}
        </Button>
      </div>
    </dialog>
  );
}
