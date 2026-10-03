"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import {
  ArrowDown, ArrowUp, Copy, Download, ExternalLink, Eye, EyeOff, FileText, GripVertical, LayoutGrid, List,
  Pencil, Search, Star, Trash2, X,
} from "lucide-react";
import Img from "@/components/Img";
import { deleteResources, duplicateResource, reorderResource, setPublished, toggleField } from "@/app/admin/actions";
import { getResource, type ColumnDef, type ResourceKey } from "@/lib/resources";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { Badge, Button, Card, EmptyState, LinkButton } from "./ui";
import { ConfirmDialog } from "./ConfirmDialog";
import { toast } from "./Toaster";

type Row = Record<string, unknown> & { id: string };
type View = "table" | "grid";

/* per-browser preferred view, stored in localStorage */
const VIEW_EVENT = "admin-view-change";
const subscribeView = (cb: () => void) => {
  window.addEventListener(VIEW_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(VIEW_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};
function readView(key: string): View {
  try {
    return localStorage.getItem(`admin-view:${key}`) === "grid" ? "grid" : "table";
  } catch {
    return "table";
  }
}
const PER_PAGE_OPTIONS = [10, 20, 50, 100];

export function ResourceTable({
  resourceKey,
  rows,
  categories,
  perms = { create: true, edit: true, delete: true },
}: {
  resourceKey: ResourceKey;
  rows: Record<string, unknown>[];
  categories: { value: string; label: string }[];
  perms?: { create: boolean; edit: boolean; delete: boolean };
}) {
  const def = getResource(resourceKey)!;
  const router = useRouter();
  const params = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  // optimistic copy of the rows (for drag & drop ordering)
  const [list, setList] = useState(rows as Row[]);
  const [prevRows, setPrevRows] = useState(rows);
  if (prevRows !== rows) {
    setPrevRows(rows);
    setList(rows as Row[]);
  }

  const imageCol = def.columns.find((c) => c.type === "image");
  const orderable = def.fields.some((f) => f.name === "order");
  const view = useSyncExternalStore(subscribeView, () => readView(def.key), () => "table" as View);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(params.get("status") === "draft" ? "draft" : params.get("status") ?? "all");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>(
    params.get("sort") ? { key: params.get("sort")!, dir: "desc" } : def.defaultSort,
  );
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const highlight = params.get("id");

  const changeView = (v: View) => {
    try {
      localStorage.setItem(`admin-view:${def.key}`, v);
    } catch {}
    window.dispatchEvent(new Event(VIEW_EVENT));
  };

  // keyboard: "/" focuses search, "n" creates a new item
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable], dialog") || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "n" && perms.create) {
        router.push(`/admin/${def.key}/new`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [def.key, router, perms.create]);

  const catName = useMemo(() => new Map(categories.map((c) => [c.value, c.label])), [categories]);
  const counts = useMemo(
    () => ({ all: list.length, published: list.filter((r) => r.active).length, draft: list.filter((r) => !r.active).length }),
    [list],
  );
  const activeFilters = Object.values(filters).filter(Boolean).length + (q ? 1 : 0) + (status !== "all" ? 1 : 0);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = list.filter(
      (r) =>
        (status === "all" || (status === "published" ? r.active : !r.active)) &&
        Object.entries(filters).every(([k, v]) => !v || r[k] === v) &&
        (!needle || def.searchFields.some((f) => String(r[f] ?? "").toLowerCase().includes(needle))),
    );
    const { key, dir } = sort;
    return [...out].sort((a, b) => {
      const av = a[key], bv = b[key];
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av ?? "").localeCompare(String(bv ?? ""));
      return dir === "asc" ? cmp : -cmp;
    });
  }, [list, q, status, filters, sort, def.searchFields]);

  // drag & drop only makes sense on the full, order-sorted list
  const canSelect = perms.edit || perms.delete;
  const canDrag = perms.edit && orderable && sort.key === "order" && sort.dir === "asc" && activeFilters === 0 && view === "table";

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(page, pages);
  const shown = canDrag ? filtered : filtered.slice((current - 1) * perPage, current * perPage);
  const allShownSelected = shown.length > 0 && shown.every((r) => selected.has(r.id));

  const run = (fn: () => Promise<unknown>, message: string) =>
    start(async () => {
      try {
        await fn();
        toast(message);
        setSelected(new Set());
      } catch {
        toast("Something went wrong", "error");
      }
    });

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const drop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const ids = filtered.map((r) => r.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    setList((l) => l.map((r) => ({ ...r, order: ids.indexOf(r.id) + 1 })));
    run(() => reorderResource(def.key, ids), "Order saved — the website is updated");
  };

  const publicUrl = (r: Row) => (def.publicPath && r.slug !== undefined ? def.publicPath.replace(":slug", String(r.slug ?? "")) : undefined);
  const imageOf = (r: Row) => {
    if (!imageCol) return "";
    const v = r[imageCol.key];
    return String((Array.isArray(v) ? v[0] : v) ?? "");
  };

  const cell = (col: ColumnDef, r: Row) => {
    const v = r[col.key];
    switch (col.type) {
      case "image":
        return (
          <span className="group/img relative block size-12">
            <span className="relative block size-12 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
              <Img src={imageOf(r)} alt="" fill sizes="48px" className="object-cover" />
            </span>
            {imageOf(r) && (
              <span className="pointer-events-none absolute top-1/2 left-14 z-20 hidden h-40 w-56 -translate-y-1/2 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 group-hover/img:block">
                <Img src={imageOf(r)} alt="" fill sizes="224px" className="object-cover" />
              </span>
            )}
          </span>
        );
      case "boolean":
        if (!perms.edit)
          return col.key === "active" ? (
            v ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>
          ) : (
            <Star className={cn("size-[18px]", v ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
          );
        if (col.key === "active")
          return (
            <button onClick={() => run(() => toggleField(def.key, r.id, "active"), v ? "Moved to drafts" : "Published")} title="Click to toggle">
              {v ? (
                <Badge tone="green"><span className="size-1.5 rounded-full bg-emerald-500" /> Published</Badge>
              ) : (
                <Badge><span className="size-1.5 rounded-full bg-slate-400" /> Draft</Badge>
              )}
            </button>
          );
        return (
          <button onClick={() => run(() => toggleField(def.key, r.id, col.key), v ? `Removed from ${col.label.toLowerCase()}` : `Marked as ${col.label.toLowerCase()}`)} aria-label={`Toggle ${col.label}`}>
            <Star className={cn("size-[18px] transition", v ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-300")} />
          </button>
        );
      case "badge":
        return v ? <Badge tone="blue">{String(v)}</Badge> : null;
      case "ref":
        return <span className="text-slate-600">{catName.get(String(v)) ?? "—"}</span>;
      case "date":
        return <span className="whitespace-nowrap text-slate-500">{formatDate(String(v ?? ""))}</span>;
      case "number":
        return <span className="text-slate-600 tabular-nums">{Number(v ?? 0).toLocaleString()}</span>;
      default:
        return col.key === def.titleField ? (
          <span className="block min-w-0">
            <Link href={`/admin/${def.key}/${r.id}`} className="block truncate font-medium text-slate-900 hover:text-primary-600">
              {String(v ?? "")}
            </Link>
            <span className="block text-xs text-slate-400">Updated {timeAgo(String(r.updatedAt ?? ""))}</span>
          </span>
        ) : (
          <span className="block max-w-[260px] truncate text-slate-600">{String(v ?? "")}</span>
        );
    }
  };

  const rowActions = (r: Row) => (
    <div className="flex justify-end gap-0.5">
      <Link href={`/admin/${def.key}/${r.id}`} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" title={perms.edit ? "Edit" : "View"}>
        {perms.edit ? <Pencil className="size-4" /> : <Eye className="size-4" />}
      </Link>
      {publicUrl(r) && (
        <a href={publicUrl(r)} target="_blank" className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" title="View on site">
          <ExternalLink className="size-4" />
        </a>
      )}
      {perms.create && (
        <button onClick={() => run(() => duplicateResource(def.key, r.id), "Duplicated as a draft")} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" title="Duplicate">
          <Copy className="size-4" />
        </button>
      )}
      {perms.delete && (
        <button onClick={() => setConfirm([r.id])} className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" title="Delete">
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* summary chips */}
      <div className="mb-4 grid grid-cols-3 gap-3 sm:max-w-md">
        {(["all", "published", "draft"] as const).map((s) => (
          <button
            key={s}
            onClick={() => (setStatus(s), setPage(1))}
            className={cn(
              "rounded-xl border bg-white px-4 py-3 text-left shadow-sm transition",
              status === s ? "border-primary-300 ring-2 ring-primary-100" : "border-slate-200 hover:border-slate-300",
            )}
          >
            <p className="text-xs text-slate-500 capitalize">{s === "all" ? `All ${def.label.toLowerCase()}` : s}</p>
            <p className={cn("text-xl font-semibold", s === "published" ? "text-emerald-600" : s === "draft" ? "text-slate-500" : "text-slate-900")}>{counts[s]}</p>
          </button>
        ))}
      </div>

      <Card>
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 p-4">
          <label className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => (setQ(e.target.value), setPage(1))}
              placeholder={`Search ${def.label.toLowerCase()}…`}
              className="input pr-16 pl-9"
            />
            {q ? (
              <button onClick={() => setQ("")} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700" aria-label="Clear search">
                <X className="size-3.5" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-slate-200 px-1.5 text-[10px] text-slate-400">/</kbd>
            )}
          </label>
          {def.filters?.map((f) => (
            <select
              key={f.key}
              value={filters[f.key] ?? ""}
              onChange={(e) => (setFilters((x) => ({ ...x, [f.key]: e.target.value })), setPage(1))}
              className={cn("input w-auto", filters[f.key] && "border-primary-300 bg-primary-50/50")}
            >
              <option value="">All {f.label.toLowerCase()}</option>
              {(f.source === "categories" ? categories : (f.options ?? []).map((o) => ({ value: o, label: o }))).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ))}
          {activeFilters > 0 && (
            <button onClick={() => (setQ(""), setFilters({}), setStatus("all"))} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800">
              <X className="size-3.5" /> Reset
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            {imageCol && (
              <div className="flex rounded-lg border border-slate-200 p-0.5">
                {([["table", List], ["grid", LayoutGrid]] as const).map(([v, Icon]) => (
                  <button
                    key={v}
                    onClick={() => changeView(v)}
                    className={cn("rounded-md p-1.5 transition", view === v ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100")}
                    aria-label={`${v} view`}
                    title={`${v === "table" ? "Table" : "Grid"} view`}
                  >
                    <Icon className="size-4" />
                  </button>
                ))}
              </div>
            )}
            <a href={`/api/admin/export/${def.key}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 shadow-sm transition hover:bg-slate-50" title="Download as CSV (opens in Excel)">
              <Download className="size-4" /> <span className="hidden sm:inline">Export</span>
            </a>
          </div>
        </div>

        {orderable && perms.edit && view === "table" && (
          <p className={cn("flex items-center gap-2 border-b px-4 py-2 text-xs", canDrag ? "border-primary-100 bg-primary-50/60 text-primary-700" : "border-slate-100 bg-slate-50 text-slate-500")}>
            <GripVertical className="size-3.5" />
            {canDrag ? "Drag rows by the handle to change the order on the website." : "Clear filters and sort by Order to rearrange by drag & drop."}
          </p>
        )}

        {/* bulk bar */}
        {selected.size > 0 && (
          <div className="animate-pop flex flex-wrap items-center gap-2 border-b border-primary-100 bg-primary-50 px-4 py-2.5 text-sm">
            <span className="font-medium text-primary-900">{selected.size} selected</span>
            <button onClick={() => setSelected(new Set())} className="text-xs text-primary-600 hover:underline">Clear</button>
            <span className="flex-1" />
            {perms.edit && (
              <Button variant="secondary" disabled={pending} onClick={() => run(() => setPublished(def.key, [...selected], true), `Published ${selected.size}`)}>
                <Eye className="size-4" /> Publish
              </Button>
            )}
            {perms.edit && (
              <Button variant="secondary" disabled={pending} onClick={() => run(() => setPublished(def.key, [...selected], false), `Moved ${selected.size} to drafts`)}>
                <EyeOff className="size-4" /> Unpublish
              </Button>
            )}
            {perms.delete && (
              <Button variant="danger" disabled={pending} onClick={() => setConfirm([...selected])}>
                <Trash2 className="size-4" /> Delete
              </Button>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="size-5" />}
            title={list.length ? "No results" : `No ${def.label.toLowerCase()} yet`}
            text={list.length ? "Try a different search or filter." : `Create your first ${def.singular.toLowerCase()} to get started.`}
            action={
              list.length ? (
                <Button variant="secondary" onClick={() => (setQ(""), setFilters({}), setStatus("all"))}>Reset filters</Button>
              ) : perms.create ? (
                <LinkButton href={`/admin/${def.key}/new`}>New {def.singular.toLowerCase()}</LinkButton>
              ) : null
            }
          />
        ) : view === "grid" ? (
          <div className={cn("grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 xl:grid-cols-4", pending && "opacity-60")}>
            {shown.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "group relative overflow-hidden rounded-xl border bg-white transition hover:-translate-y-0.5 hover:shadow-lg",
                  selected.has(r.id) ? "border-primary-400 ring-2 ring-primary-100" : "border-slate-200",
                )}
              >
                <Link href={`/admin/${def.key}/${r.id}`} className="relative block aspect-4/3 bg-slate-100">
                  <Img src={imageOf(r)} alt="" fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute top-2 right-2">
                    {r.active ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>}
                  </span>
                </Link>
                <input
                  type="checkbox"
                  hidden={!canSelect}
                  checked={selected.has(r.id)}
                  onChange={() => toggleSelect(r.id)}
                  className={cn("absolute top-2.5 left-2.5 size-4 rounded accent-primary-600 transition", !selected.has(r.id) && "opacity-0 group-hover:opacity-100")}
                  aria-label="Select"
                />
                <div className="p-3">
                  <Link href={`/admin/${def.key}/${r.id}`} className="block truncate text-sm font-medium text-slate-900 hover:text-primary-600">
                    {String(r[def.titleField] ?? "")}
                  </Link>
                  <p className="truncate text-xs text-slate-500">
                    {def.columns
                      .filter((c) => c.key !== def.titleField && !["image", "boolean"].includes(c.type ?? ""))
                      .slice(0, 2)
                      .map((c) => (c.type === "ref" ? catName.get(String(r[c.key])) : c.type === "date" ? formatDate(String(r[c.key] ?? "")) : String(r[c.key] ?? "")))
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <div className="mt-2 -mr-1.5 border-t border-slate-100 pt-1.5">{rowActions(r)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                  {canDrag && <th className="w-8" />}
                  <th className="w-10 py-3 pl-4">
                    <input
                      type="checkbox"
                      hidden={!canSelect}
                      checked={allShownSelected}
                      onChange={() =>
                        setSelected((s) => {
                          const next = new Set(s);
                          shown.forEach((r) => (allShownSelected ? next.delete(r.id) : next.add(r.id)));
                          return next;
                        })
                      }
                      className="size-4 rounded accent-primary-600"
                      aria-label="Select all"
                    />
                  </th>
                  {def.columns.map((c) => (
                    <th key={c.key} className="px-3 py-3 font-medium">
                      {c.label ? (
                        <button
                          onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key && s.dir === "asc" ? "desc" : "asc" }))}
                          className={cn("inline-flex items-center gap-1 uppercase hover:text-slate-800", sort.key === c.key && "text-slate-800")}
                        >
                          {c.label}
                          {sort.key === c.key && (sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                        </button>
                      ) : null}
                    </th>
                  ))}
                  <th className="py-3 pr-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y divide-slate-100", pending && "opacity-60")}>
                {shown.map((r) => (
                  <tr
                    key={r.id}
                    draggable={canDrag}
                    onDragStart={(e) => (setDragId(r.id), (e.dataTransfer.effectAllowed = "move"))}
                    onDragOver={(e) => canDrag && (e.preventDefault(), setOverId(r.id))}
                    onDragLeave={() => setOverId((o) => (o === r.id ? null : o))}
                    onDrop={(e) => (e.preventDefault(), drop(r.id), setDragId(null), setOverId(null))}
                    onDragEnd={() => (setDragId(null), setOverId(null))}
                    className={cn(
                      "transition hover:bg-slate-50/80",
                      selected.has(r.id) && "bg-primary-50/40",
                      highlight === r.id && "bg-amber-50",
                      dragId === r.id && "opacity-40",
                      overId === r.id && dragId !== r.id && "shadow-[inset_0_2px_0_0_#9a1219]",
                    )}
                  >
                    {canDrag && (
                      <td className="cursor-grab pl-3 text-slate-300 hover:text-slate-500 active:cursor-grabbing">
                        <GripVertical className="size-4" />
                      </td>
                    )}
                    <td className="py-2.5 pl-4">
                      <input type="checkbox" hidden={!canSelect} checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="size-4 rounded accent-primary-600" aria-label="Select row" />
                    </td>
                    {def.columns.map((c) => (
                      <td key={c.key} className="max-w-[320px] px-3 py-2.5">{cell(c, r)}</td>
                    ))}
                    <td className="py-2.5 pr-4">{rowActions(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && !canDrag && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              Showing {(current - 1) * perPage + 1}–{Math.min(current * perPage, filtered.length)} of {filtered.length}
              <select value={perPage} onChange={(e) => (setPerPage(Number(e.target.value)), setPage(1))} className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs">
                {PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </span>
            {pages > 1 && (
              <div className="flex items-center gap-1">
                <Button variant="secondary" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</Button>
                {Array.from({ length: pages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === pages || Math.abs(n - current) <= 1)
                  .map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={cn("size-9 rounded-lg text-sm transition", n === current ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}
                    >
                      {n}
                    </button>
                  ))}
                <Button variant="secondary" disabled={current === pages} onClick={() => setPage(current + 1)}>Next</Button>
              </div>
            )}
          </div>
        )}
        {filtered.length > 0 && canDrag && (
          <p className="border-t border-slate-100 px-4 py-3 text-sm text-slate-500">{filtered.length} items</p>
        )}
      </Card>

      <p className="mt-3 text-xs text-slate-400">
        Tip: press <kbd className="rounded border border-slate-200 bg-white px-1">/</kbd> to search
        {perms.create && <>, <kbd className="rounded border border-slate-200 bg-white px-1">N</kbd> for a new {def.singular.toLowerCase()}</>}.
        {!perms.edit && <span className="ml-2 text-slate-500">You have view-only access here.</span>}
      </p>

      <ConfirmDialog
        open={!!confirm}
        title={`Delete ${confirm?.length === 1 ? `this ${def.singular.toLowerCase()}` : `${confirm?.length} ${def.label.toLowerCase()}`}?`}
        text="This cannot be undone. It will also disappear from the website."
        pending={pending}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          const ids = confirm ?? [];
          start(async () => {
            await deleteResources(def.key, ids);
            setConfirm(null);
            setSelected(new Set());
            toast(`Deleted ${ids.length} item${ids.length > 1 ? "s" : ""}`);
          });
        }}
      />
    </>
  );
}
