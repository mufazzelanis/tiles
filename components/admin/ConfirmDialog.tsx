"use client";

import { useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "./ui";

export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel = "Delete",
  pending,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  text?: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(420px,92vw)] rounded-2xl p-0 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <div className="flex gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600">
            <AlertCircle className="size-5" />
          </span>
          <div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            {text && <p className="mt-1 text-sm text-slate-500">{text}</p>}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} disabled={pending}>{pending ? "Working…" : confirmLabel}</Button>
        </div>
      </div>
    </dialog>
  );
}
