"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Copy, FileText, Images, Loader2, Trash2, Upload } from "lucide-react";
import Img from "@/components/Img";
import { deleteMedia } from "@/app/admin/actions";
import type { MediaFile } from "@/lib/media";
import { cn, formatDate } from "@/lib/utils";
import { Button, Card, EmptyState } from "./ui";
import { ConfirmDialog } from "./ConfirmDialog";
import { toast } from "./Toaster";
import { uploadFiles } from "./upload";

const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

export function MediaLibrary({ files, canUpload = true, canDelete = true }: { files: MediaFile[]; canUpload?: boolean; canDelete?: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const upload = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    try {
      await uploadFiles(list);
      toast(`Uploaded ${list.length} file${list.length > 1 ? "s" : ""}`);
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        hidden={!canUpload}
        onDragOver={(e) => (e.preventDefault(), setDrag(true))}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => (e.preventDefault(), setDrag(false), upload(e.dataTransfer.files))}
        className={cn("mb-6 flex flex-col items-center gap-3 rounded-xl border-2 border-dashed bg-white p-8 text-center transition", drag ? "border-primary-400 bg-primary-50" : "border-slate-200")}
      >
        <span className="grid size-11 place-items-center rounded-full bg-primary-50 text-primary-600">
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
        </span>
        <p className="text-sm text-slate-600">Drag & drop images or PDFs here (max 20 MB each)</p>
        <input ref={input} type="file" multiple accept="image/*,application/pdf" hidden onChange={(e) => (upload(e.target.files), (e.target.value = ""))} />
        <Button onClick={() => input.current?.click()} disabled={busy}>Choose files</Button>
      </div>

      <Card>
        {files.length ? (
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 lg:grid-cols-5">
            {files.map((f) => (
              <div key={f.name} className="group overflow-hidden rounded-lg border border-slate-200">
                <div className="relative aspect-square bg-slate-50">
                  {f.kind === "image" ? (
                    <Img src={f.url} alt={f.name} fill sizes="200px" className="object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center text-rose-400"><FileText className="size-10" /></span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/50 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => navigator.clipboard.writeText(location.origin + f.url).then(() => toast("URL copied"))}
                      className="rounded-lg bg-white p-2 text-slate-700 hover:bg-slate-100"
                      title="Copy URL"
                    >
                      <Copy className="size-4" />
                    </button>
                    <button hidden={!canDelete} onClick={() => setConfirm(f.name)} className="rounded-lg bg-white p-2 text-rose-600 hover:bg-rose-50" title="Delete">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="truncate text-xs font-medium text-slate-700" title={f.name}>{f.name}</p>
                  <p className="text-[11px] text-slate-400">{kb(f.size)} · {formatDate(f.modified)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Images className="size-5" />} title="No uploads yet" text="Files you upload from any form also appear here." />
        )}
      </Card>

      <ConfirmDialog
        open={!!confirm}
        title="Delete this file?"
        text="Any product or page still using it will show a blank image."
        pending={pending}
        onClose={() => setConfirm(null)}
        onConfirm={() =>
          start(async () => {
            await deleteMedia(confirm!);
            setConfirm(null);
            toast("File deleted");
          })
        }
      />
    </>
  );
}
