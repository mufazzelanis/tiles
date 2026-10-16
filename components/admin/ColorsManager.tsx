"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import {
  Check, CheckSquare, Copy, Eye, EyeOff, GripVertical, Inbox, Info, Lock, Package, Palette, Pipette, Plus, Save, Search,
  Sparkles, Square, Trash2, TrendingUp, X,
} from "lucide-react";
import Img from "@/components/Img";
import { Swatch, TilePreview } from "@/components/Swatch";
import { deleteColors, reorderColors, saveColor, setColorsActive, type FormState } from "@/app/admin/actions";
import { COLOR_FAMILIES, normalizeHex, onColor, PATTERNS } from "@/lib/colors";
import type { ColorPattern, TileColor } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { Badge, Button, Card, EmptyState, PageHeader } from "./ui";
import { Drawer } from "./kit";
import { ImageField, Toggle } from "./fields";
import { ConfirmDialog } from "./ConfirmDialog";
import { toast } from "./Toaster";

export type ColorRow = TileColor & { productIds: string[]; requests: number; requests30: number; lastRequestedAt: string };
type ProductOption = { id: string; name: string; code: string; image: string; active: boolean };
type Perms = { create: boolean; edit: boolean; delete: boolean; products: boolean };

type Draft = {
  id: string | null;
  name: string;
  code: string;
  family: string;
  hex: string;
  hex2: string;
  pattern: ColorPattern;
  image: string;
  description: string;
  active: boolean;
  productIds: Set<string>;
};

const SORTS = [
  { value: "order", label: "Website order" },
  { value: "popular", label: "Most requested" },
  { value: "products", label: "Most products" },
  { value: "name", label: "Name A–Z" },
  { value: "recent", label: "Recently edited" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

/** Typical ceramic / porcelain tones for one-click picking. */
const PRESETS = [
  "#fbfbfa", "#f4f2ee", "#f5f0e6", "#ede2cc", "#e2d3b5", "#d8c2a0", "#c4a77d", "#b88a5c",
  "#8c6440", "#6e4c35", "#d4d2ce", "#a9a6a1", "#77787b", "#4d4e51", "#2b2b2d", "#1e1e20",
  "#86c3cc", "#3e8c9a", "#a3b196", "#6b7f5e", "#c98a6b", "#9a1219", "#c49a45", "#e8c77f",
];

const toDraft = (c: ColorRow): Draft => ({
  id: c.id, name: c.name, code: c.code, family: c.family, hex: c.hex, hex2: c.hex2, pattern: c.pattern,
  image: c.image, description: c.description, active: c.active, productIds: new Set(c.productIds),
});
const blank = (): Draft => ({
  id: null, name: "", code: "", family: "Beige", hex: "#e2d3b5", hex2: "#a88d66", pattern: "solid", image: "", description: "", active: true, productIds: new Set(),
});
const paintOf = (d: Pick<Draft, "hex" | "hex2" | "pattern" | "image">) => ({
  hex: normalizeHex(d.hex) ?? "#cccccc",
  hex2: normalizeHex(d.hex2) ?? normalizeHex(d.hex) ?? "#cccccc",
  pattern: d.pattern,
  image: d.image,
});

/* the EyeDropper API is Chromium-only — show the button only where it exists */
const noop = () => () => {};
const useEyeDropper = () => useSyncExternalStore(noop, () => "EyeDropper" in window, () => false);

export function ColorsManager({ colors, products, perms, initialOpen }: { colors: ColorRow[]; products: ProductOption[]; perms: Perms; initialOpen?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  // optimistic copy for drag & drop ordering
  const [list, setList] = useState(colors);
  const [prev, setPrev] = useState(colors);
  if (prev !== colors) {
    setPrev(colors);
    setList(colors);
  }

  const [q, setQ] = useState("");
  const [family, setFamily] = useState("all");
  const [status, setStatus] = useState<"all" | "live" | "hidden">("all");
  const [sort, setSort] = useState<Sort>("order");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const draftFor = (open?: string) => {
    if (open === "new") return perms.create ? blank() : null;
    const c = colors.find((x) => x.id === open);
    return c ? toDraft(c) : null;
  };
  const [editing, setEditing] = useState<Draft | null>(() => draftFor(initialOpen));
  // ?open=… can change while the page is mounted (e.g. from the Ctrl+K palette)
  const [openParam, setOpenParam] = useState(initialOpen);
  if (openParam !== initialOpen) {
    setOpenParam(initialOpen);
    if (initialOpen) setEditing(draftFor(initialOpen));
  }

  const families = useMemo(() => COLOR_FAMILIES.map((f) => ({ f, n: list.filter((c) => c.family === f).length })).filter((x) => x.n > 0), [list]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = list.filter(
      (c) =>
        (family === "all" || c.family === family) &&
        (status === "all" || (status === "live" ? c.active : !c.active)) &&
        (!needle || `${c.name} ${c.code} ${c.hex} ${c.family} ${c.pattern}`.toLowerCase().includes(needle)),
    );
    const by: Record<Sort, (a: ColorRow, b: ColorRow) => number> = {
      order: (a, b) => a.order - b.order,
      popular: (a, b) => b.requests - a.requests || a.order - b.order,
      products: (a, b) => b.productIds.length - a.productIds.length || a.order - b.order,
      name: (a, b) => a.name.localeCompare(b.name),
      recent: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
    };
    return out.sort(by[sort]);
  }, [list, q, family, status, sort]);

  const canDrag = perms.edit && sort === "order" && family === "all" && status === "all" && !q;
  const live = list.filter((c) => c.active).length;
  const productsWithColour = products.filter((p) => list.some((c) => c.productIds.includes(p.id))).length;
  const requests30 = list.reduce((s, c) => s + c.requests30, 0);
  const top = [...list].sort((a, b) => b.requests - a.requests)[0];

  const run = (fn: () => Promise<FormState>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      toast(r.message ?? "Done", r.ok ? "success" : "error");
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const drop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const ids = [...list].sort((a, b) => a.order - b.order).map((c) => c.id);
    const from = ids.indexOf(dragId);
    ids.splice(ids.indexOf(targetId), 0, ids.splice(from, 1)[0]);
    setList((l) => l.map((c) => ({ ...c, order: ids.indexOf(c.id) + 1 })));
    setDragId(null);
    run(() => reorderColors(ids));
  };

  const openColor = (c: ColorRow) => setEditing(toDraft(c));
  const duplicate = (d: Draft) =>
    setEditing({ ...d, id: null, name: `${d.name} (copy)`, code: "", productIds: new Set() });

  return (
    <>
      <PageHeader
        title="Tile Colours"
        description="Every colour and shade you sell. Customers choose one of these on the product page and in quote requests."
        crumbs={[{ href: "/admin/products", label: "Products" }]}
        actions={perms.create && <Button onClick={() => setEditing(blank())}><Plus className="size-4" /> New colour</Button>}
      />

      {/* overview */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Palette} label="Colours" value={list.length} note={`${live} on the website · ${list.length - live} hidden`} />
        <Stat icon={Package} label="Products with colours" value={productsWithColour} note={`of ${products.length} products`} warn={productsWithColour < products.length} />
        <Stat icon={Inbox} label="Colour requests · 30 days" value={requests30} note="Quotes that named a colour" />
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {top && top.requests > 0 ? (
            <>
              <Swatch color={top} round={false} className="size-12 rounded-lg shadow-inner" />
              <div className="min-w-0">
                <p className="flex items-center gap-1 text-xs font-medium text-slate-500"><TrendingUp className="size-3.5" /> Most requested</p>
                <p className="truncate font-semibold text-slate-900">{top.name}</p>
                <p className="text-xs text-slate-500">{top.requests} request{top.requests > 1 ? "s" : ""}{top.lastRequestedAt && ` · last ${timeAgo(top.lastRequestedAt)}`}</p>
              </div>
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm text-slate-500"><Sparkles className="size-4 text-gold-500" /> Requests by colour will show up here.</p>
          )}
        </div>
      </div>

      <Card>
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <label className="relative min-w-50 flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, code or #hex…" className="input pl-9" />
          </label>
          <div className="flex rounded-lg border border-slate-200 p-0.5 text-sm">
            {([["all", "All"], ["live", "On website"], ["hidden", "Hidden"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setStatus(v)} className={cn("rounded-md px-3 py-1.5 transition", status === v ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}>
                {l}
              </button>
            ))}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input w-auto" aria-label="Sort colours">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-slate-100 px-4 py-3">
          {[{ f: "all", n: list.length }, ...families].map(({ f, n }) => (
            <button
              key={f}
              onClick={() => setFamily(f)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
                family === f ? "border-primary-600 bg-primary-600 text-white" : "border-slate-200 text-slate-600 hover:border-slate-300",
              )}
            >
              {f !== "all" && (
                <span className="flex -space-x-1">
                  {list.filter((c) => c.family === f).slice(0, 3).map((c) => <Swatch key={c.id} color={c} className="size-3 ring-1 ring-white" />)}
                </span>
              )}
              {f === "all" ? "All families" : f}
              <span className={family === f ? "text-white/70" : "text-slate-400"}>{n}</span>
            </button>
          ))}
        </div>

        {/* bulk actions */}
        {selected.size > 0 && (
          <div className="animate-pop flex flex-wrap items-center gap-2 border-b border-primary-100 bg-primary-50/60 px-4 py-2.5 text-sm">
            <b className="text-primary-800">{selected.size} selected</b>
            <span className="flex-1" />
            {perms.edit && (
              <>
                <Button variant="secondary" disabled={pending} onClick={() => run(() => setColorsActive([...selected], true), () => setSelected(new Set()))}><Eye className="size-4" /> Show</Button>
                <Button variant="secondary" disabled={pending} onClick={() => run(() => setColorsActive([...selected], false), () => setSelected(new Set()))}><EyeOff className="size-4" /> Hide</Button>
              </>
            )}
            {perms.delete && <Button variant="danger" disabled={pending} onClick={() => setConfirm([...selected])}><Trash2 className="size-4" /> Delete</Button>}
            <Button variant="ghost" onClick={() => setSelected(new Set())}><X className="size-4" /> Clear</Button>
          </div>
        )}

        {shown.length ? (
          <>
            {canDrag && list.length > 1 && (
              <p className="flex items-center gap-1.5 px-4 pt-3 text-xs text-slate-400"><GripVertical className="size-3.5" /> Drag cards to change the order colours appear on the website.</p>
            )}
            <ul className={cn("grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5", pending && "opacity-70")}>
              {shown.map((c) => (
                <li
                  key={c.id}
                  draggable={canDrag}
                  onDragStart={() => setDragId(c.id)}
                  onDragOver={(e) => canDrag && e.preventDefault()}
                  onDrop={() => drop(c.id)}
                  onDragEnd={() => setDragId(null)}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                    selected.has(c.id) ? "border-primary-400 ring-2 ring-primary-100" : "border-slate-200",
                    dragId === c.id && "opacity-40",
                    canDrag && "cursor-grab active:cursor-grabbing",
                  )}
                >
                  <button onClick={() => openColor(c)} className="block w-full text-left" aria-label={`Edit ${c.name}`}>
                    <span className="relative block aspect-4/3">
                      <TilePreview color={c} gap={2} className="absolute inset-0" grout="rgba(255,255,255,.55)" />
                      <span className="absolute bottom-2 left-2 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase backdrop-blur-sm" style={{ color: onColor(c.hex), background: onColor(c.hex) === "#ffffff" ? "rgba(0,0,0,.25)" : "rgba(255,255,255,.55)" }}>
                        {c.hex}
                      </span>
                      {!c.active && (
                        <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-slate-900/75 px-2 py-0.5 text-[10px] font-medium text-white"><EyeOff className="size-3" /> Hidden</span>
                      )}
                    </span>
                    <span className="block p-3">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">{c.name}</span>
                        {c.code && <span className="shrink-0 font-mono text-[10px] text-slate-400">{c.code}</span>}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">{c.family} · {PATTERNS.find((p) => p.value === c.pattern)?.label}</span>
                      <span className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1" title="Products in this colour"><Package className="size-3.5" /> {c.productIds.length}</span>
                        <span className={cn("flex items-center gap-1", c.requests30 > 0 && "font-medium text-primary-700")} title="Quote requests (last 30 days in bold)">
                          <Inbox className="size-3.5" /> {c.requests}
                        </span>
                      </span>
                    </span>
                  </button>
                  {(perms.edit || perms.delete) && (
                    <button
                      onClick={() => toggleSelect(c.id)}
                      className={cn(
                        "absolute top-2 right-2 rounded-md bg-white/90 p-1 text-slate-600 shadow transition hover:text-primary-600",
                        selected.has(c.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100 max-lg:opacity-100",
                      )}
                      aria-label={selected.has(c.id) ? `Unselect ${c.name}` : `Select ${c.name}`}
                    >
                      {selected.has(c.id) ? <CheckSquare className="size-4 text-primary-600" /> : <Square className="size-4" />}
                    </button>
                  )}
                </li>
              ))}
              {perms.create && !q && family === "all" && status === "all" && (
                <li>
                  <button
                    onClick={() => setEditing(blank())}
                    className="flex h-full min-h-45 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-sm font-medium text-slate-500 transition hover:border-primary-300 hover:bg-primary-50/40 hover:text-primary-700"
                  >
                    <Plus className="size-6" /> Add a colour
                  </button>
                </li>
              )}
            </ul>
          </>
        ) : (
          <EmptyState
            icon={<Palette className="size-5" />}
            title={list.length ? "No colours match" : "No colours yet"}
            text={list.length ? "Try another search or family." : "Add the colours and shades you sell — customers will pick one when they ask for a quote."}
            action={perms.create && !list.length ? <Button onClick={() => setEditing(blank())}><Plus className="size-4" /> Add your first colour</Button> : undefined}
          />
        )}
      </Card>

      <ColorEditor
        draft={editing}
        setDraft={setEditing}
        products={products}
        perms={perms}
        usage={editing?.id ? list.find((c) => c.id === editing.id) : undefined}
        suggestCode={suggestCode(list)}
        onSaved={() => {
          setEditing(null);
          router.replace("/admin/colors", { scroll: false });
          router.refresh();
        }}
        onClose={() => {
          setEditing(null);
          if (initialOpen) router.replace("/admin/colors", { scroll: false });
        }}
        onDelete={(id) => setConfirm([id])}
        onDuplicate={duplicate}
      />

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.length === 1 ? `Delete “${list.find((c) => c.id === confirm[0])?.name}”?` : `Delete ${confirm?.length} colours?`}
        text={(() => {
          const used = new Set(list.filter((c) => confirm?.includes(c.id)).flatMap((c) => c.productIds)).size;
          return `${used ? `It will be removed from ${used} product${used > 1 ? "s" : ""}. ` : ""}Past inquiries keep the colour name. This can't be undone — hiding it instead keeps it for later.`;
        })()}
        pending={pending}
        onClose={() => setConfirm(null)}
        onConfirm={() =>
          run(() => deleteColors(confirm!), () => {
            setSelected(new Set());
            if (editing?.id && confirm!.includes(editing.id)) setEditing(null);
            setConfirm(null);
          })
        }
      />
    </>
  );
}

/** Next free code in the most used "C-123" style. */
function suggestCode(list: ColorRow[]) {
  const nums = list.map((c) => /^C-(\d+)$/i.exec(c.code)?.[1]).filter(Boolean).map(Number);
  return `C-${nums.length ? Math.max(...nums) + 1 : 101}`;
}

function Stat({ icon: Icon, label, value, note, warn }: { icon: typeof Palette; label: string; value: number; note: string; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className="grid size-7 place-items-center rounded-lg bg-primary-50 text-primary-600"><Icon className="size-4" /></span>
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">{value.toLocaleString()}</p>
      <p className={cn("text-xs", warn ? "text-amber-600" : "text-slate-500")}>{note}</p>
    </div>
  );
}

/* ---------------------------------------------------------------- editor */

function ColorEditor({ draft, setDraft, products, perms, usage, suggestCode, onSaved, onClose, onDelete, onDuplicate }: {
  draft: Draft | null;
  setDraft: (fn: Draft | null | ((d: Draft | null) => Draft | null)) => void;
  products: ProductOption[];
  perms: Perms;
  usage?: ColorRow;
  suggestCode: string;
  onSaved: () => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (d: Draft) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [productQuery, setProductQuery] = useState("");
  const hasEyeDropper = useEyeDropper();
  const editable = draft ? (draft.id ? perms.edit : perms.create) : false;

  // field errors belong to the colour that was submitted, not the next one opened
  const [submittedFor, setSubmittedFor] = useState<string | null>(null);
  const [res, action, saving] = useActionState<FormState, FormData>(async (prev, fd) => {
    setSubmittedFor(String(fd.get("id") ?? "") || "new");
    const r = await saveColor(prev, fd);
    if (r.ok) {
      toast(r.message ?? "Saved");
      onSaved();
    } else if (r.message && !r.errors) toast(r.message, "error");
    return r;
  }, {});

  // Ctrl/⌘+S saves while the editor is open
  useEffect(() => {
    if (!draft || !editable) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft, editable]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const pick = async (k: "hex" | "hex2") => {
    try {
      const ed = new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper();
      const { sRGBHex } = await ed.open();
      set(k, normalizeHex(sRGBHex) ?? sRGBHex);
    } catch {}
  };

  const paint = draft ? paintOf(draft) : null;
  const visibleProducts = products.filter((p) => !productQuery || `${p.name} ${p.code}`.toLowerCase().includes(productQuery.toLowerCase()));
  const err = (k: string) => (submittedFor === (draft?.id ?? "new") ? res.errors?.[k] : undefined);

  return (
    <Drawer
      open={!!draft}
      onClose={onClose}
      title={draft?.id ? draft.name || "Edit colour" : "New colour"}
      subtitle={draft?.id ? `${usage?.productIds.length ?? 0} products · ${usage?.requests ?? 0} quote requests` : "Add a colour customers can choose"}
      footer={
        draft && (
          <div className="flex flex-wrap items-center gap-2">
            {draft.id && perms.delete && (
              <Button type="button" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => onDelete(draft.id!)}>
                <Trash2 className="size-4" /> Delete
              </Button>
            )}
            {draft.id && perms.create && (
              <Button type="button" variant="ghost" onClick={() => onDuplicate(draft)}>
                <Copy className="size-4" /> Duplicate
              </Button>
            )}
            <span className="flex-1" />
            {editable ? (
              <Button form="color-form" disabled={saving}>
                <Save className="size-4" /> {saving ? "Saving…" : draft.id ? "Save colour" : "Add colour"}
              </Button>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><Lock className="size-3.5" /> View only</span>
            )}
          </div>
        )
      }
    >
      {draft && paint && (
        <form id="color-form" ref={formRef} action={action} className="space-y-6">
          {draft.id && <input type="hidden" name="id" value={draft.id} />}
          <input type="hidden" name="hex" value={draft.hex} />
          <input type="hidden" name="hex2" value={draft.pattern === "solid" ? draft.hex : draft.hex2} />
          <input type="hidden" name="pattern" value={draft.pattern} />
          <input type="hidden" name="family" value={draft.family} />
          {perms.products && <input type="hidden" name="__syncProducts" value="1" />}
          {[...draft.productIds].map((id) => <input key={id} type="hidden" name="productIds" value={id} />)}

          {/* live preview */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="relative">
              <TilePreview color={paint} className="aspect-video w-full" gap={3} />
              <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur">Floor preview</span>
            </div>
            <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3">
              <span className="text-[11px] tracking-wide text-slate-500 uppercase">On the website</span>
              <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pr-3 pl-1 text-xs">
                <Swatch color={paint} className="size-6 ring-2 ring-white" />
                <b className="font-medium text-slate-800">{draft.name || "Colour name"}</b>
                {draft.code && <span className="text-slate-400">{draft.code}</span>}
              </span>
            </div>
          </div>

          <fieldset disabled={!editable} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Colour name <span className="text-rose-500">*</span></span>
                <input name="name" value={draft.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!err("name")} placeholder="e.g. Calacatta Gold" className="input" autoFocus={!draft.id} />
                {err("name") && <span className="mt-1 block text-xs text-rose-600">{err("name")}</span>}
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Shade code</span>
                <input name="code" value={draft.code} onChange={(e) => set("code", e.target.value.toUpperCase())} aria-invalid={!!err("code")} placeholder={suggestCode} className="input font-mono uppercase" />
                {err("code") && <span className="mt-1 block text-xs text-rose-600">{err("code")}</span>}
              </label>
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Pattern</span>
              <div className="grid grid-cols-3 gap-2">
                {PATTERNS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set("pattern", p.value)}
                    className={cn(
                      "overflow-hidden rounded-lg border text-left transition",
                      draft.pattern === p.value ? "border-primary-600 ring-2 ring-primary-100" : "border-slate-200 hover:border-slate-300",
                    )}
                    title={p.hint}
                  >
                    <Swatch color={{ ...paint, pattern: p.value, image: "" }} round={false} className="block h-10 w-full rounded-none" />
                    <span className="flex items-center justify-between px-2 py-1 text-xs font-medium text-slate-700">
                      {p.label} {draft.pattern === p.value && <Check className="size-3.5 text-primary-600" />}
                    </span>
                  </button>
                ))}
              </div>
              {draft.image && <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-600"><Info className="size-3.5" /> A texture photo is set, so it is shown instead of the pattern.</p>}
            </div>

            <div className={cn("grid gap-4", draft.pattern !== "solid" && "sm:grid-cols-2")}>
              <HexInput label={draft.pattern === "solid" ? "Colour" : "Base colour"} value={draft.hex} onChange={(v) => set("hex", v)} error={err("hex")} onPick={hasEyeDropper ? () => pick("hex") : undefined} />
              {draft.pattern !== "solid" && (
                <HexInput label={draft.pattern === "gradient" ? "Blend to" : draft.pattern === "wood" ? "Grain colour" : "Vein / accent"} value={draft.hex2} onChange={(v) => set("hex2", v)} onPick={hasEyeDropper ? () => pick("hex2") : undefined} />
              )}
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-slate-500">Quick tones</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => set("hex", h)}
                    className={cn("size-6 rounded-full ring-1 ring-black/10 transition hover:scale-110 ring-inset", normalizeHex(draft.hex) === h && "ring-2 ring-primary-600 ring-offset-2")}
                    style={{ background: h }}
                    aria-label={`Use ${h}`}
                    title={h}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Family</span>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_FAMILIES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => set("family", f)}
                    className={cn("rounded-full border px-3 py-1 text-xs transition", draft.family === f ? "border-primary-600 bg-primary-600 text-white" : "border-slate-200 text-slate-600 hover:border-slate-300")}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">Used to group colours in filters.</p>
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Texture photo <span className="font-normal text-slate-400">(optional)</span></span>
              <ImageField
                key={draft.id ?? "new"}
                name="image"
                defaultValue={draft.image}
                onChange={() =>
                  setTimeout(() => set("image", (formRef.current?.elements.namedItem("image") as HTMLInputElement | null)?.value ?? ""), 0)
                }
              />
              <p className="mt-1 text-xs text-slate-500">A close-up of the real tile surface makes swatches look exact.</p>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Description</span>
              <textarea name="description" rows={2} value={draft.description} onChange={(e) => set("description", e.target.value)} placeholder="Shown to customers when they pick this colour" className="input" />
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 p-3">
              <span>
                <span className="block text-sm font-medium text-slate-800">Show on website</span>
                <span className="block text-xs text-slate-500">Hidden colours stay on products but customers can&apos;t pick them.</span>
              </span>
              <Toggle key={`${draft.id}-active`} name="active" defaultChecked={draft.active} onChange={() => set("active", !draft.active)} />
            </label>
          </fieldset>

          {/* product assignment */}
          <div className="rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Available on products</p>
                <p className="text-xs text-slate-500">{draft.productIds.size} of {products.length} selected</p>
              </div>
              {perms.products && editable && (
                <div className="flex gap-1.5 text-xs">
                  <button type="button" className="rounded-md px-2 py-1 font-medium text-primary-600 hover:bg-primary-50" onClick={() => set("productIds", new Set([...draft.productIds, ...visibleProducts.map((p) => p.id)]))}>Select shown</button>
                  <button type="button" className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100" onClick={() => set("productIds", new Set())}>Clear</button>
                </div>
              )}
            </div>
            {!perms.products && (
              <p className="flex items-center gap-1.5 border-b border-slate-100 bg-amber-50 px-4 py-2 text-xs text-amber-800"><Lock className="size-3.5" /> You need product edit access to change this.</p>
            )}
            <div className="p-3">
              <label className="relative block">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <input value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder="Find a product…" className="input pl-9" />
              </label>
            </div>
            <ul className="scroll-thin max-h-72 overflow-y-auto px-2 pb-2">
              {visibleProducts.map((p) => {
                const on = draft.productIds.has(p.id);
                return (
                  <li key={p.id}>
                    <label className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-50", (!perms.products || !editable) && "cursor-default")}>
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={!perms.products || !editable}
                        onChange={() => {
                          const n = new Set(draft.productIds);
                          if (on) n.delete(p.id);
                          else n.add(p.id);
                          set("productIds", n);
                        }}
                        className="size-4 accent-primary-600"
                      />
                      <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-slate-100">
                        <Img src={p.image} alt="" fill sizes="36px" className="object-cover" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-slate-800">{p.name}</span>
                        <span className="block text-[11px] text-slate-400">{p.code}{!p.active && " · draft"}</span>
                      </span>
                      {on && <Swatch color={paint} className="size-4" />}
                    </label>
                  </li>
                );
              })}
              {!visibleProducts.length && <li className="px-2 py-4 text-center text-xs text-slate-400">No products found</li>}
            </ul>
            <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
              Tip: add a photo per colour on each{" "}
              <Link href="/admin/products" className="font-medium text-primary-600 hover:underline">product page</Link>
              {" "}so the gallery switches when a customer picks it.
            </p>
          </div>

          {draft.id && usage && (
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
              <span>Updated {timeAgo(usage.updatedAt)}</span>
              {usage.lastRequestedAt && <span>Last requested {timeAgo(usage.lastRequestedAt)}</span>}
              {usage.requests > 0 && (
                <Link href={`/admin/inquiries?color=${usage.id}`} className="font-medium text-primary-600 hover:underline">See {usage.requests} inquiries</Link>
              )}
              {draft.active ? <Badge tone="green">On website</Badge> : <Badge>Hidden</Badge>}
            </p>
          )}
        </form>
      )}
    </Drawer>
  );
}

function HexInput({ label, value, onChange, error, onPick }: { label: string; value: string; onChange: (v: string) => void; error?: string; onPick?: () => void }) {
  const valid = normalizeHex(value);
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className={cn("flex items-center gap-2 rounded-lg border bg-white p-1 pr-2 focus-within:border-primary-500", error || !valid ? "border-rose-300" : "border-slate-200")}>
        <label className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md ring-1 ring-black/10 ring-inset" style={{ background: valid ?? "#ffffff" }}>
          <input type="color" value={valid ?? "#ffffff"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label={`${label} picker`} />
        </label>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => valid && onChange(valid)}
          spellCheck={false}
          className="w-full bg-transparent font-mono text-sm text-slate-800 uppercase focus:outline-none"
          aria-label={`${label} hex`}
        />
        {onPick && (
          <button type="button" onClick={onPick} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Pick a colour from your screen">
            <Pipette className="size-4" />
          </button>
        )}
      </div>
      {(error || !valid) && <p className="mt-1 text-xs text-rose-600">{error ?? "Use a hex like #f4f2ee"}</p>}
    </div>
  );
}
