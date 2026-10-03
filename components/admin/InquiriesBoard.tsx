"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Inbox, Mail, Package, Phone, Search, Trash2, X } from "lucide-react";
import { deleteInquiries, updateInquiry } from "@/app/admin/actions";
import type { Inquiry, InquiryStatus } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { Badge, Button, Card, EmptyState } from "./ui";
import { ConfirmDialog } from "./ConfirmDialog";
import { toast } from "./Toaster";

const STATUSES: { value: InquiryStatus; label: string; tone: "indigo" | "amber" | "green" }[] = [
  { value: "new", label: "New", tone: "indigo" },
  { value: "in-progress", label: "In progress", tone: "amber" },
  { value: "closed", label: "Closed", tone: "green" },
];
const toneOf = (s: InquiryStatus) => STATUSES.find((x) => x.value === s)!.tone;

export function InquiriesBoard({
  inquiries,
  products,
  canEdit = true,
  canDelete = true,
}: {
  inquiries: Inquiry[];
  products: Record<string, { name: string; slug: string }>;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const params = useSearchParams();
  const [tab, setTab] = useState<string>(params.get("status") ?? "all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(params.get("open"));
  const [confirm, setConfirm] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const counts = useMemo(
    () => Object.fromEntries(STATUSES.map((s) => [s.value, inquiries.filter((i) => i.status === s.value).length])),
    [inquiries],
  );
  const list = inquiries.filter(
    (i) =>
      (tab === "all" || i.status === tab) &&
      (!q || `${i.name} ${i.email} ${i.phone} ${i.subject} ${i.message}`.toLowerCase().includes(q.toLowerCase())),
  );
  const open = inquiries.find((i) => i.id === openId) ?? null;

  const setStatus = (id: string, status: InquiryStatus) =>
    start(async () => {
      await updateInquiry(id, { status });
      toast(`Marked as ${status.replace("-", " ")}`);
    });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="flex rounded-lg border border-slate-200 p-0.5 text-sm">
            {[{ value: "all", label: "All" }, ...STATUSES].map((s) => (
              <button
                key={s.value}
                onClick={() => setTab(s.value)}
                className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 transition", tab === s.value ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}
              >
                {s.label}
                <span className={cn("text-xs", tab === s.value ? "text-slate-300" : "text-slate-400")}>
                  {s.value === "all" ? inquiries.length : counts[s.value]}
                </span>
              </button>
            ))}
          </div>
          <label className="relative min-w-[200px] flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, message…" className="input pl-9" />
          </label>
        </div>
        {list.length ? (
          <ul className={cn("divide-y divide-slate-100", pending && "opacity-60")}>
            {list.map((i) => (
              <li key={i.id}>
                <button
                  onClick={() => setOpenId(i.id)}
                  className={cn("flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-slate-50", openId === i.id && "bg-primary-50/60")}
                >
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", i.status === "new" ? "bg-primary-500" : "bg-transparent")} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={cn("truncate text-sm text-slate-900", i.status === "new" && "font-semibold")}>{i.name}</span>
                      <Badge tone={toneOf(i.status)}>{i.status.replace("-", " ")}</Badge>
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-slate-700">{i.subject}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">{i.message}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{timeAgo(i.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<Inbox className="size-5" />} title="No inquiries here" text="New messages from the website will appear in this inbox." />
        )}
      </Card>

      <div className="xl:sticky xl:top-24 xl:self-start">
        {open ? (
          <Card>
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
              <div>
                <h2 className="font-semibold text-slate-900">{open.subject}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{new Date(open.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
              <button onClick={() => setOpenId(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-5 p-5">
              <div className="space-y-1.5 text-sm">
                <p className="font-medium text-slate-900">{open.name}</p>
                <a href={`mailto:${open.email}?subject=${encodeURIComponent("Re: " + open.subject)}`} className="flex items-center gap-2 text-primary-600 hover:underline">
                  <Mail className="size-4" /> {open.email}
                </a>
                {open.phone && (
                  <a href={`tel:${open.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
                    <Phone className="size-4" /> {open.phone}
                  </a>
                )}
                {open.productId && products[open.productId] && (
                  <a href={`/products/${products[open.productId].slug}`} target="_blank" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
                    <Package className="size-4" /> {products[open.productId].name}
                  </a>
                )}
              </div>
              <p className="rounded-lg bg-slate-50 p-4 text-sm leading-relaxed whitespace-pre-line text-slate-700">{open.message}</p>

              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">Status</p>
                <div className="grid grid-cols-3 gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      disabled={pending || !canEdit}
                      onClick={() => setStatus(open.id, s.value)}
                      className={cn("rounded-lg border px-2 py-2 text-xs font-medium transition", open.status === s.value ? "border-primary-600 bg-primary-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <form
                action={(fd) =>
                  start(async () => {
                    await updateInquiry(open.id, { notes: String(fd.get("notes") ?? "") });
                    toast("Note saved");
                  })
                }
              >
                <label className="mb-2 block text-xs font-medium tracking-wide text-slate-500 uppercase" htmlFor="notes">Internal notes</label>
                <textarea key={open.id} id="notes" name="notes" defaultValue={open.notes} rows={3} readOnly={!canEdit} className="input read-only:bg-slate-50" placeholder={canEdit ? "Only visible to your team" : "No notes"} />
                <div className="mt-3 flex justify-between">
                  <Button type="button" variant="ghost" hidden={!canDelete} className="text-rose-600 hover:bg-rose-50" onClick={() => setConfirm(open.id)}>
                    <Trash2 className="size-4" /> Delete
                  </Button>
                  <Button disabled={pending} hidden={!canEdit}>Save note</Button>
                </div>
              </form>
            </div>
          </Card>
        ) : (
          <Card>
            <EmptyState icon={<Mail className="size-5" />} title="Select an inquiry" text="Pick a message on the left to read it, reply and track its status." />
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        title="Delete this inquiry?"
        text="The message and its notes will be removed permanently."
        pending={pending}
        onClose={() => setConfirm(null)}
        onConfirm={() =>
          start(async () => {
            await deleteInquiries([confirm!]);
            setConfirm(null);
            setOpenId(null);
            toast("Inquiry deleted");
          })
        }
      />
    </div>
  );
}
