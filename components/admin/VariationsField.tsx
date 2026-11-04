"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowDown, ArrowUp, Check, ChevronDown, ChevronsDownUp, ChevronsUpDown, Copy, Eye, EyeOff, Images, LayoutList,
  Layers, Loader2, Percent, Plus, Search, Star, Table2, Trash2, Upload, Wand2, X,
} from "lucide-react";
import Img from "@/components/Img";
import { Swatch } from "@/components/Swatch";
import {
  effectivePrice, normalizeOptions, onSale, pieceArea, sizeLabel, STOCK, taka,
  type ProductOptions, type SizeUnit, type StockStatus, type Variation,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { ColorOption } from "./ColorVariantsField";
import { Badge } from "./ui";
import { MediaPicker } from "./MediaPicker";
import { toast } from "./Toaster";
import { uploadFiles } from "./upload";

const uid = () => `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const blank = (from: Partial<Variation> = {}): Variation => ({
  id: uid(), design: "", colorId: "", width: 0, height: 0, sqft: "", thickness: 0, price: 0, images: [], sku: "",
  active: true, salePrice: 0, stock: "in", isDefault: false, ...from,
});
const move = <T,>(l: T[], i: number, d: number) => {
  const j = i + d;
  if (j < 0 || j >= l.length) return l;
  const n = [...l];
  [n[i], n[j]] = [n[j], n[i]];
  return n;
};
const SIZE_PRESETS: Record<SizeUnit, [number, number][]> = {
  mm: [[300, 300], [300, 600], [400, 400], [600, 600], [600, 1200], [800, 800], [800, 1600], [200, 1200]],
  cm: [[30, 30], [30, 60], [40, 40], [60, 60], [60, 120], [80, 80], [80, 160], [20, 120]],
};
const THICKNESS_PRESETS = [8, 9, 10, 12, 20];
/** common tile sizes in inches, as written in the "Sqft" field */
const SQFT_PRESETS = ["12x12", "11x11", "16x16", "12x24", "24x24", "24x48"];
const toneClass = { green: "bg-emerald-500", amber: "bg-amber-500", rose: "bg-rose-500", blue: "bg-sky-500" } as const;
const stockOf = (s: StockStatus) => STOCK.find((x) => x.value === s)!;

/** Problems worth flagging before saving. */
function warnings(v: Variation, all: Variation[]) {
  const w: string[] = [];
  if (!v.price && !v.salePrice) w.push("No price — shows “Price on request”");
  if ((!v.width || !v.height) && !v.sqft) w.push("Add a size or a Sqft (e.g. 12x12) so customers know the tile size");
  if (v.salePrice && v.price && v.salePrice >= v.price) w.push("Offer price isn't lower than the price");
  const key = (x: Variation) => [x.design.toLowerCase(), x.colorId, x.width, x.height, x.sqft.toLowerCase(), x.thickness].join("|");
  if (all.filter((x) => key(x) === key(v)).length > 1) w.push("Same design, colour, size and thickness as another row");
  return w;
}

/**
 * Variable-product editor: every row is one variation (design + colour + size + thickness)
 * with its own price, offer, stock, box contents and photos. Submitted as one JSON hidden input.
 */
export function VariationsField({ name, defaultValue, colors, onChange }: {
  name: string;
  defaultValue: ProductOptions;
  colors: ColorOption[];
  onChange?: () => void;
}) {
  const [opts, setRaw] = useState<ProductOptions>(() => normalizeOptions(defaultValue));
  const [view, setView] = useState<"cards" | "table">("cards");
  const [open, setOpen] = useState<Set<string>>(() => new Set(opts.variations.length <= 2 ? opts.variations.map((v) => v.id) : []));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [generator, setGenerator] = useState(false);

  const set = (fn: (o: ProductOptions) => ProductOptions) => (setRaw(fn), onChange?.());
  const setRow = (id: string, patch: Partial<Variation>) =>
    set((o) => ({
      ...o,
      // only one default
      variations: o.variations.map((v) => (v.id === id ? { ...v, ...patch } : patch.isDefault ? { ...v, isDefault: false } : v)),
    }));
  const colorById = useMemo(() => new Map(colors.map((c) => [c.id, c])), [colors]);
  const designs = [...new Set(opts.variations.map((v) => v.design).filter(Boolean))];
  const prices = opts.variations.filter((v) => v.active).map(effectivePrice).filter((n) => n > 0);
  const issues = opts.variations.filter((v) => warnings(v, opts.variations).length).length;

  const shown = opts.variations.filter((v) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return [v.design, colorById.get(v.colorId)?.name, sizeLabel(v, opts.unit), v.sqft, v.sku, v.thickness ? `${v.thickness}mm` : ""].join(" ").toLowerCase().includes(needle);
  });
  const allSelected = shown.length > 0 && shown.every((v) => selected.has(v.id));
  const toggle = (setFn: typeof setOpen, id: string) =>
    setFn((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const bulk = (fn: (v: Variation) => Variation) => set((o) => ({ ...o, variations: o.variations.map((v) => (selected.has(v.id) ? fn(v) : v)) }));
  const add = (rows: Variation[]) => {
    set((o) => ({ ...o, variations: [...o.variations, ...rows] }));
    setOpen((s) => new Set([...s, ...rows.map((r) => r.id)]));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/40">
      <input type="hidden" name={name} value={JSON.stringify(opts)} />
      <datalist id="variation-designs">{designs.map((d) => <option key={d} value={d} />)}</datalist>

      {/* header */}
      <div className="flex flex-wrap items-center gap-3 rounded-t-xl border-b border-slate-200 bg-white px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Layers className="size-4 text-slate-400" /> Variations</p>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
            <span>{opts.variations.length} variation{opts.variations.length === 1 ? "" : "s"}</span>
            {prices.length > 0 && <span>· {Math.min(...prices) === Math.max(...prices) ? taka(prices[0]) : `${taka(Math.min(...prices))} – ${taka(Math.max(...prices))}`} per piece</span>}
            {issues > 0 && <span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="size-3" /> {issues} need attention</span>}
          </p>
        </div>
        <Segmented
          label="Size unit"
          value={opts.unit}
          options={[{ value: "mm", label: "mm" }, { value: "cm", label: "cm" }]}
          onChange={(u) => set((o) => ({ ...o, unit: u as SizeUnit }))}
        />
        <Segmented
          label="View"
          value={view}
          options={[{ value: "cards", label: "Cards", icon: LayoutList }, { value: "table", label: "Table", icon: Table2 }]}
          onChange={(v) => setView(v as "cards" | "table")}
        />
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(shown.map((v) => v.id)))}
            className="size-4 accent-primary-600"
            aria-label="Select all"
          />
          All
        </label>
        <label className="relative min-w-44 flex-1">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search design, colour, size, SKU…" className="input py-1.5 pl-8 text-sm" />
        </label>
        {view === "cards" && (
          <button
            type="button"
            onClick={() => setOpen(open.size >= shown.length ? new Set() : new Set(shown.map((v) => v.id)))}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            {open.size >= shown.length && shown.length ? <><ChevronsDownUp className="size-3.5" /> Collapse all</> : <><ChevronsUpDown className="size-3.5" /> Expand all</>}
          </button>
        )}
      </div>

      {selected.size > 0 && <BulkBar count={selected.size} onApply={bulk} onDelete={() => (set((o) => ({ ...o, variations: o.variations.filter((v) => !selected.has(v.id)) })), setSelected(new Set()))} onClear={() => setSelected(new Set())} />}

      {generator && (
        <Generator
          unit={opts.unit}
          colors={colors}
          designs={designs}
          onClose={() => setGenerator(false)}
          onCreate={(rows) => {
            const key = (v: Variation) => [v.design.toLowerCase(), v.colorId, v.width, v.height, v.sqft.toLowerCase(), v.thickness].join("|");
            const have = new Set(opts.variations.map(key));
            const fresh = rows.filter((r) => !have.has(key(r)));
            add(fresh);
            toast(fresh.length ? `${fresh.length} variation${fresh.length > 1 ? "s" : ""} added` : "Those combinations already exist", fresh.length ? "success" : "error");
            setGenerator(false);
          }}
        />
      )}

      {/* rows */}
      <div className="space-y-2.5 p-3">
        {view === "table" ? (
          <TableView variations={shown} unit={opts.unit} colors={colors} colorById={colorById} selected={selected} onSelect={(id) => toggle(setSelected, id)} onChange={setRow} />
        ) : (
          shown.map((v) => {
            const i = opts.variations.indexOf(v);
            return (
              <Row
                key={v.id}
                v={v}
                index={i}
                count={opts.variations.length}
                unit={opts.unit}
                colors={colors}
                color={colorById.get(v.colorId)}
                problems={warnings(v, opts.variations)}
                open={open.has(v.id)}
                selected={selected.has(v.id)}
                onToggleOpen={() => toggle(setOpen, v.id)}
                onSelect={() => toggle(setSelected, v.id)}
                onChange={(patch) => setRow(v.id, patch)}
                onMove={(d) => set((o) => ({ ...o, variations: move(o.variations, i, d) }))}
                onDuplicate={() => {
                  const copy = { ...v, id: uid(), sku: "", isDefault: false };
                  set((o) => ({ ...o, variations: [...o.variations.slice(0, i + 1), copy, ...o.variations.slice(i + 1)] }));
                  setOpen((s) => new Set([...s, copy.id]));
                }}
                onDelete={() => set((o) => ({ ...o, variations: o.variations.filter((x) => x.id !== v.id) }))}
              />
            );
          })
        )}
        {!opts.variations.length && (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white px-4 py-8 text-center">
            <Layers className="mx-auto size-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">No variations yet</p>
            <p className="text-xs text-slate-500">Add one, or generate every design × colour × size combination at once.</p>
          </div>
        )}
        {opts.variations.length > 0 && !shown.length && <p className="py-4 text-center text-sm text-slate-400">No variations match “{q}”</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              const last = opts.variations.at(-1);
              add([blank(last ? { ...last, id: uid(), images: [], sku: "", isDefault: false, colorId: "" } : {})]);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Plus className="size-4" /> Add variation
          </button>
          <button type="button" onClick={() => setGenerator((g) => !g)} className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3.5 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100">
            <Wand2 className="size-4" /> Generate combinations
          </button>
          {!colors.length && <Link href="/admin/colors?open=new" className="self-center text-xs font-medium text-primary-600 hover:underline">Add colours to the library</Link>}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- pieces */

function Segmented({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string; icon?: typeof Layers }[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-500">{label}</span>
      <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
        {options.map((o) => (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} className={cn("flex items-center gap-1 rounded-md px-3 py-1 font-medium transition", value === o.value ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}>
            {o.icon && <o.icon className="size-3.5" />} {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const fieldLabel = "mb-1.5 block text-xs font-medium text-slate-600";

/** Number input with a fixed prefix / suffix (৳, mm, pcs…). */
function Affix({ value, onChange, prefix, suffix, placeholder, step = "any", strong, ariaLabel }: {
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  step?: string;
  strong?: boolean;
  ariaLabel?: string;
}) {
  return (
    <span className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-primary-500 focus-within:ring-3 focus-within:ring-primary-500/10">
      {prefix && <span className="pl-3 text-sm text-slate-400">{prefix}</span>}
      <input
        type="number"
        min={0}
        step={step}
        value={value || ""}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className={cn("w-full min-w-0 bg-transparent px-2.5 py-2 text-sm focus:outline-none", strong && "font-semibold text-slate-900")}
      />
      {suffix && <span className="pr-3 text-xs text-slate-400">{suffix}</span>}
    </span>
  );
}

/** Colour dropdown with swatches, names and search (native selects cut long names). */
function ColorSelect({ value, colors, onChange }: { value: string; colors: ColorOption[]; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const current = colors.find((c) => c.id === value);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  const list = colors.filter((c) => !q || `${c.name} ${c.code} ${c.family}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-sm hover:border-slate-300">
        {current ? <Swatch color={current} className="size-6 shrink-0" /> : <span className="size-6 shrink-0 rounded-full border border-dashed border-slate-300" />}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-slate-800">{current?.name ?? "No colour"}</span>
          {current?.code && <span className="block text-[10px] leading-tight text-slate-400">{current.code}</span>}
        </span>
        <ChevronDown className="size-4 shrink-0 text-slate-400" />
      </button>
      {open && (
        <div className="animate-pop absolute top-full left-0 z-40 mt-1 w-full min-w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2">
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search colours…" className="input py-1.5 text-sm" />
          </div>
          <ul className="scroll-thin max-h-60 overflow-y-auto p-1">
            <li>
              <button type="button" onClick={() => (onChange(""), setOpen(false))} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-slate-500 hover:bg-slate-50">
                <span className="size-6 rounded-full border border-dashed border-slate-300" /> No colour
              </button>
            </li>
            {list.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => (onChange(c.id), setOpen(false), setQ(""))} className={cn("flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50", c.id === value && "bg-primary-50")}>
                  <Swatch color={c} className="size-6 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-slate-800">{c.name}</span>
                    <span className="block text-[10px] text-slate-400">{[c.code, c.family, !c.active && "hidden on website"].filter(Boolean).join(" · ")}</span>
                  </span>
                  {c.id === value && <Check className="size-4 text-primary-600" />}
                </button>
              </li>
            ))}
            {!list.length && <li className="px-2 py-3 text-center text-xs text-slate-400">No colours found</li>}
          </ul>
          <Link href="/admin/colors?open=new" target="_blank" className="block border-t border-slate-100 px-3 py-2 text-xs font-medium text-primary-600 hover:bg-slate-50">+ New colour</Link>
        </div>
      )}
    </div>
  );
}

function StockDot({ stock }: { stock: StockStatus }) {
  const s = stockOf(stock);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      <span className={cn("size-2 rounded-full", toneClass[s.tone])} /> {s.label}
    </span>
  );
}

function Row({ v, index, count, unit, colors, color, problems, open, selected, onToggleOpen, onSelect, onChange, onMove, onDuplicate, onDelete }: {
  v: Variation;
  index: number;
  count: number;
  unit: SizeUnit;
  colors: ColorOption[];
  color?: ColorOption;
  problems: string[];
  open: boolean;
  selected: boolean;
  onToggleOpen: () => void;
  onSelect: () => void;
  onChange: (patch: Partial<Variation>) => void;
  onMove: (d: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const area = pieceArea(v, unit);
  const pay = effectivePrice(v);
  const btn = "rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30";
  const title = [v.design, color?.name, sizeLabel(v, unit), v.sqft && `${v.sqft} sqft`, v.thickness ? `${v.thickness} mm` : ""].filter(Boolean).join(" · ") || "New variation";

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-white shadow-sm transition", selected ? "border-primary-300 ring-2 ring-primary-100" : v.isDefault ? "border-amber-200" : "border-slate-200", !v.active && "opacity-60")}>
      {/* summary line */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <input type="checkbox" checked={selected} onChange={onSelect} className="size-4 shrink-0 accent-primary-600" aria-label={`Select ${title}`} />
        <button type="button" onClick={onToggleOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
            {v.images[0] ? <Img src={v.images[0]} alt="" fill sizes="44px" className="object-cover" /> : color ? <Swatch color={color} round={false} className="size-full rounded-none" /> : <Images className="size-4 text-slate-300" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-slate-900">{title}</span>
              {v.isDefault && <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />}
              {problems.length > 0 && <span title={problems.join("\n")}><AlertTriangle className="size-3.5 shrink-0 text-amber-500" /></span>}
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
              <StockDot stock={v.stock} />
              {area > 0 && pay > 0 && <span>৳{(pay / area).toFixed(2)}/sqft</span>}
              {v.sku && <span className="font-mono">{v.sku}</span>}
              {!v.active && <span className="text-amber-600">Hidden</span>}
            </span>
          </span>
          <span className="shrink-0 text-right">
            {pay > 0 ? (
              <>
                <span className="block text-sm font-semibold text-slate-900">{taka(pay)}<span className="text-[11px] font-normal text-slate-400"> /pc</span></span>
                {onSale(v) && <span className="block text-[11px] text-slate-400 line-through">{taka(v.price)}</span>}
              </>
            ) : (
              <span className="text-xs text-slate-400">On request</span>
            )}
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-slate-400 transition", open && "rotate-180")} />
        </button>
        <span className="hidden shrink-0 sm:flex">
          <button type="button" onClick={() => onChange({ isDefault: !v.isDefault })} className={btn} title={v.isDefault ? "Shown first on the website" : "Show this variation first"}>
            <Star className={cn("size-4", v.isDefault && "fill-amber-400 text-amber-400")} />
          </button>
          <button type="button" onClick={() => onChange({ active: !v.active })} className={btn} title={v.active ? "Visible — click to hide" : "Hidden — click to show"}>
            {v.active ? <Eye className="size-4" /> : <EyeOff className="size-4 text-amber-500" />}
          </button>
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className={btn} aria-label="Move up"><ArrowUp className="size-4" /></button>
          <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} className={btn} aria-label="Move down"><ArrowDown className="size-4" /></button>
          <button type="button" onClick={onDuplicate} className={btn} title="Duplicate"><Copy className="size-4" /></button>
          <button type="button" onClick={onDelete} className={cn(btn, "hover:bg-rose-50 hover:text-rose-600")} aria-label="Delete"><Trash2 className="size-4" /></button>
        </span>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          {problems.length > 0 && (
            <ul className="mb-4 space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {problems.map((p) => <li key={p} className="flex items-center gap-1.5"><AlertTriangle className="size-3.5 shrink-0" /> {p}</li>)}
            </ul>
          )}

          <div className="grid gap-4 md:grid-cols-12">
            {/* identity */}
            <label className="md:col-span-5">
              <span className={fieldLabel}>Design / pattern</span>
              <input value={v.design} onChange={(e) => onChange({ design: e.target.value })} list="variation-designs" placeholder="e.g. Statuario, Royal Oak" className="input" />
            </label>
            <div className="md:col-span-4">
              <span className={fieldLabel}>Colour</span>
              <ColorSelect value={v.colorId} colors={colors} onChange={(colorId) => onChange({ colorId })} />
            </div>
            <label className="md:col-span-3">
              <span className={fieldLabel}>SKU</span>
              <input value={v.sku} onChange={(e) => onChange({ sku: e.target.value })} placeholder="Optional" className="input font-mono" />
            </label>

            {/* size */}
            <div className="md:col-span-6">
              <span className={fieldLabel}>Size (width × height)</span>
              <div className="flex items-center gap-2">
                <Affix value={v.width} onChange={(width) => onChange({ width })} suffix={unit} placeholder={unit === "mm" ? "600" : "60"} ariaLabel="Width" />
                <X className="size-4 shrink-0 text-slate-400" />
                <Affix value={v.height} onChange={(height) => onChange({ height })} suffix={unit} placeholder={unit === "mm" ? "600" : "60"} ariaLabel="Height" />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SIZE_PRESETS[unit].map(([w, h]) => (
                  <button
                    key={`${w}x${h}`}
                    type="button"
                    onClick={() => onChange({ width: w, height: h })}
                    className={cn("rounded-full border px-2.5 py-0.5 text-[11px] transition", v.width === w && v.height === h ? "border-primary-600 bg-primary-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}
                  >
                    {w}×{h}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-3">
              <span className={fieldLabel}>Thickness</span>
              <Affix value={v.thickness} onChange={(thickness) => onChange({ thickness })} suffix="mm" placeholder="9" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {THICKNESS_PRESETS.map((t) => (
                  <button key={t} type="button" onClick={() => onChange({ thickness: t })} className={cn("rounded-full border px-2 py-0.5 text-[11px]", v.thickness === t ? "border-primary-600 bg-primary-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <label className="md:col-span-3">
              <span className={fieldLabel}>Stock</span>
              <select value={v.stock} onChange={(e) => onChange({ stock: e.target.value as StockStatus })} className="input">
                {STOCK.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>

            {/* sqft & price */}
            <div className="md:col-span-6">
              <span className={fieldLabel}>Sqft <span className="font-normal text-slate-400">— tile size as you write it, e.g. 12x12</span></span>
              <span className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-primary-500 focus-within:ring-3 focus-within:ring-primary-500/10">
                <input value={v.sqft} onChange={(e) => onChange({ sqft: e.target.value })} placeholder="12x12" className="w-full min-w-0 bg-transparent px-3 py-2 text-sm focus:outline-none" />
                <span className="pr-3 text-xs text-slate-400">sqft</span>
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SQFT_PRESETS.map((s) => (
                  <button key={s} type="button" onClick={() => onChange({ sqft: s })} className={cn("rounded-full border px-2.5 py-0.5 text-[11px]", v.sqft.replace(/\s/g, "").toLowerCase() === s ? "border-primary-600 bg-primary-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-3">
              <span className={fieldLabel}>Price per piece</span>
              <Affix value={v.price} onChange={(price) => onChange({ price })} prefix="৳" placeholder="On request" strong />
            </div>
            <div className="md:col-span-3">
              <span className={fieldLabel}>Offer per piece <span className="font-normal text-slate-400">(optional)</span></span>
              <Affix value={v.salePrice} onChange={(salePrice) => onChange({ salePrice })} prefix="৳" placeholder="—" />
            </div>
          </div>

          {/* live maths */}
          <div className="mt-4 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 text-center text-xs sm:grid-cols-4">
            <Stat label="Customer pays" value={pay ? `${taka(pay)} / piece` : "On request"} strong />
            <Stat label="100 pieces" value={pay ? taka(pay * 100) : "—"} />
            <Stat label="Per sqft" value={pay && area ? `৳${(pay / area).toFixed(2)}` : "—"} />
            <Stat label="Offer" value={onSale(v) ? `Save ${Math.round((1 - v.salePrice / v.price) * 100)}%` : "No offer"} />
          </div>

          {/* photos */}
          <div className="mt-4">
            <span className={fieldLabel}>Photos <span className="font-normal text-slate-400">— shown when a customer picks this variation</span></span>
            <Photos images={v.images} onChange={(images) => onChange({ images })} />
          </div>

          {/* actions on phones */}
          <div className="mt-4 flex flex-wrap gap-1 border-t border-slate-200 pt-3 sm:hidden">
            <button type="button" onClick={() => onChange({ isDefault: !v.isDefault })} className={btn}><Star className={cn("size-4", v.isDefault && "fill-amber-400 text-amber-400")} /></button>
            <button type="button" onClick={() => onChange({ active: !v.active })} className={btn}>{v.active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</button>
            <button type="button" onClick={() => onMove(-1)} className={btn}><ArrowUp className="size-4" /></button>
            <button type="button" onClick={() => onMove(1)} className={btn}><ArrowDown className="size-4" /></button>
            <button type="button" onClick={onDuplicate} className={btn}><Copy className="size-4" /></button>
            <button type="button" onClick={onDelete} className={cn(btn, "text-rose-500")}><Trash2 className="size-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-[10px] tracking-wide text-slate-400 uppercase">{label}</p>
      <p className={cn("mt-0.5 text-slate-700", strong && "font-semibold text-slate-900")}>{value}</p>
    </div>
  );
}

function Photos({ images, onChange }: { images: string[]; onChange: (images: string[]) => void }) {
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const upload = async (list: File[]) => {
    if (!list.length) return;
    setBusy(true);
    try {
      onChange([...images, ...(await uploadFiles(list))].slice(0, 12));
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      onDragOver={(e) => (e.preventDefault(), setDrag(true))}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => (e.preventDefault(), setDrag(false), upload(Array.from(e.dataTransfer.files)))}
      className={cn("flex flex-wrap items-center gap-2.5 rounded-lg border-2 border-dashed p-2.5 transition", drag ? "border-primary-400 bg-primary-50" : "border-slate-200 bg-white")}
    >
      {images.map((src, i) => (
        <span key={src + i} className="group relative size-20 overflow-hidden rounded-lg ring-1 ring-slate-200">
          <Img src={src} alt="" fill sizes="80px" className="object-cover" />
          {i === 0 && <span className="absolute top-1 left-1 rounded bg-slate-900/80 px-1 text-[9px] font-medium text-white">Main</span>}
          <span className="absolute inset-x-0 bottom-0 flex justify-between bg-linear-to-t from-black/60 p-1 opacity-0 transition group-hover:opacity-100">
            <button type="button" onClick={() => onChange(move(images, i, -1))} className="rounded bg-white/90 p-0.5 text-slate-700" aria-label="Move left"><ArrowUp className="size-3 -rotate-90" /></button>
            <button type="button" onClick={() => onChange(images.filter((_, x) => x !== i))} className="rounded bg-white/90 p-0.5 text-rose-600" aria-label="Remove photo"><X className="size-3" /></button>
          </span>
        </span>
      ))}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          // copy first: clearing the input below also empties its live FileList
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          upload(files);
        }}
      />
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className="grid size-20 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 hover:bg-slate-100">
        <span className="flex flex-col items-center gap-1">
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
          {busy ? "Uploading" : "Upload"}
        </span>
      </button>
      <button type="button" onClick={() => setPicker(true)} className="grid size-20 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 hover:bg-slate-100">
        <span className="flex flex-col items-center gap-1"><Images className="size-5" /> Library</span>
      </button>
      {!images.length && <span className="text-xs text-slate-400">or drag photos here</span>}
      <MediaPicker open={picker} multiple onClose={() => setPicker(false)} onPick={(u) => onChange([...images, ...u].slice(0, 12))} />
    </div>
  );
}

/* --------------------------------------------------------------- bulk */

function BulkBar({ count, onApply, onDelete, onClear }: { count: number; onApply: (fn: (v: Variation) => Variation) => void; onDelete: () => void; onClear: () => void }) {
  const [price, setPrice] = useState("");
  const [percent, setPercent] = useState("");
  const [sqft, setSqft] = useState("");
  const apply = (fn: (v: Variation) => Variation, msg: string) => (onApply(fn), toast(msg));
  const mini = "w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:border-primary-500 focus:outline-none";
  const act = "rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-40";
  return (
    <div className="animate-pop flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-primary-100 bg-primary-50/70 px-4 py-2.5 text-xs">
      <b className="text-primary-800">{count} selected</b>
      <span className="flex items-center gap-1">
        <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" placeholder="৳ / piece" className={mini} />
        <button type="button" disabled={!price} onClick={() => apply((v) => ({ ...v, price: Number(price) || 0 }), "Price set")} className={act}>Set price</button>
      </span>
      <span className="flex items-center gap-1">
        <input value={percent} onChange={(e) => setPercent(e.target.value)} type="number" placeholder="± %" className={cn(mini, "w-16")} />
        <button
          type="button"
          disabled={!percent}
          onClick={() => apply((v) => ({ ...v, price: Math.max(0, Math.round(v.price * (1 + Number(percent) / 100))) }), `Prices changed by ${percent}%`)}
          className={act}
        >
          <Percent className="inline size-3" /> Adjust
        </button>
      </span>
      <span className="flex items-center gap-1">
        <input value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="Sqft 12x12" className={cn(mini, "w-24")} />
        <button type="button" disabled={!sqft.trim()} onClick={() => apply((v) => ({ ...v, sqft: sqft.trim() }), "Sqft set")} className={act}>Set</button>
      </span>
      <select
        defaultValue=""
        onChange={(e) => {
          const s = e.target.value as StockStatus;
          if (s) apply((v) => ({ ...v, stock: s }), `Marked ${stockOf(s).label.toLowerCase()}`);
          e.target.value = "";
        }}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
        aria-label="Set stock"
      >
        <option value="">Set stock…</option>
        {STOCK.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <button type="button" onClick={() => apply((v) => ({ ...v, salePrice: 0 }), "Offers removed")} className="text-slate-600 hover:underline">Remove offers</button>
      <button type="button" onClick={() => apply((v) => ({ ...v, active: true }), "Shown")} className="text-slate-600 hover:underline">Show</button>
      <button type="button" onClick={() => apply((v) => ({ ...v, active: false }), "Hidden")} className="text-slate-600 hover:underline">Hide</button>
      <span className="flex-1" />
      <button type="button" onClick={onDelete} className="flex items-center gap-1 font-medium text-rose-600 hover:underline"><Trash2 className="size-3.5" /> Delete</button>
      <button type="button" onClick={onClear} className="rounded p-1 text-slate-500 hover:bg-white" aria-label="Clear selection"><X className="size-3.5" /></button>
    </div>
  );
}

/* --------------------------------------------------------------- table */

function TableView({ variations, unit, colors, colorById, selected, onSelect, onChange }: {
  variations: Variation[];
  unit: SizeUnit;
  colors: ColorOption[];
  colorById: Map<string, ColorOption>;
  selected: Set<string>;
  onSelect: (id: string) => void;
  onChange: (id: string, patch: Partial<Variation>) => void;
}) {
  const cellInput = "w-full min-w-0 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm hover:border-slate-200 focus:border-primary-500 focus:bg-white focus:outline-none";
  const num = (v: Variation, key: "width" | "height" | "thickness" | "price" | "salePrice", cls = "") => (
    <input type="number" min={0} step="any" value={v[key] || ""} onChange={(e) => onChange(v.id, { [key]: Math.max(0, Number(e.target.value) || 0) })} className={cn(cellInput, "text-right tabular-nums", cls)} />
  );
  if (!variations.length) return null;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[1040px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] tracking-wide text-slate-500 uppercase">
            <th className="w-8 px-3 py-2" />
            <th className="w-14 px-1 py-2" />
            <th className="min-w-44 px-2 py-2 font-medium">Design</th>
            <th className="min-w-44 px-2 py-2 font-medium">Colour</th>
            <th className="w-48 px-2 py-2 font-medium">Size ({unit})</th>
            <th className="w-20 px-2 py-2 text-right font-medium">Thick mm</th>
            <th className="w-24 px-2 py-2 font-medium">Sqft</th>
            <th className="w-28 px-2 py-2 text-right font-medium">৳ / piece</th>
            <th className="w-28 px-2 py-2 text-right font-medium">Offer ৳</th>
            <th className="w-32 px-2 py-2 font-medium">Stock</th>
            <th className="w-12 px-2 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {variations.map((v) => (
            <tr key={v.id} className={cn("hover:bg-slate-50/60", selected.has(v.id) && "bg-primary-50/50", !v.active && "opacity-60")}>
              <td className="px-3"><input type="checkbox" checked={selected.has(v.id)} onChange={() => onSelect(v.id)} className="size-4 accent-primary-600" /></td>
              <td className="px-1 py-1.5">
                <span className="relative block size-10 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200">
                  {v.images[0] ? <Img src={v.images[0]} alt="" fill sizes="40px" className="object-cover" /> : colorById.get(v.colorId) && <Swatch color={colorById.get(v.colorId)!} round={false} className="size-full rounded-none" />}
                </span>
              </td>
              <td className="px-1"><input value={v.design} onChange={(e) => onChange(v.id, { design: e.target.value })} list="variation-designs" placeholder="Design" className={cellInput} /></td>
              <td className="px-1"><ColorSelect value={v.colorId} colors={colors} onChange={(colorId) => onChange(v.id, { colorId })} /></td>
              <td className="px-1"><span className="flex items-center gap-1">{num(v, "width")}<span className="text-slate-400">×</span>{num(v, "height")}</span></td>
              <td className="px-1">{num(v, "thickness")}</td>
              <td className="px-1"><input value={v.sqft} onChange={(e) => onChange(v.id, { sqft: e.target.value })} placeholder="12x12" className={cellInput} /></td>
              <td className="px-1">{num(v, "price", "font-semibold")}</td>
              <td className="px-1">{num(v, "salePrice")}</td>
              <td className="px-1">
                <select value={v.stock} onChange={(e) => onChange(v.id, { stock: e.target.value as StockStatus })} className={cellInput}>
                  {STOCK.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </td>
              <td className="px-2 text-center">
                <button type="button" onClick={() => onChange(v.id, { active: !v.active })} className="rounded p-1 text-slate-400 hover:bg-slate-100" title={v.active ? "Hide" : "Show"}>
                  {v.active ? <Eye className="size-4" /> : <EyeOff className="size-4 text-amber-500" />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400">Switch to Cards to add photos and SKU. <Badge className="ml-1">Tip</Badge> Select rows to bulk-edit prices.</p>
    </div>
  );
}

/* ----------------------------------------------------------- generator */

/** Creates every design × colour × size combination in one go. */
function Generator({ unit, colors, designs: known, onCreate, onClose }: {
  unit: SizeUnit;
  colors: ColorOption[];
  designs: string[];
  onCreate: (rows: Variation[]) => void;
  onClose: () => void;
}) {
  const [designs, setDesigns] = useState(known.join(", "));
  const [colorIds, setColorIds] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [thickness, setThickness] = useState(0);
  const [price, setPrice] = useState(0);
  const [sqft, setSqft] = useState("");

  const list = (s: string) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
  const parsedSizes = sizes.map((s) => s.split("x").map(Number)).filter(([w, h]) => w && h);
  const d = list(designs).length ? list(designs) : [""];
  const c = colorIds.length ? colorIds : [""];
  const s = parsedSizes.length ? parsedSizes : [[0, 0]];
  const total = d.length * c.length * s.length;
  const chip = (on: boolean) => cn("rounded-full border px-2.5 py-1 text-xs transition", on ? "border-primary-600 bg-primary-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300");

  return (
    <div className="space-y-4 border-b border-primary-100 bg-primary-50/40 p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Wand2 className="size-4 text-primary-600" /> Generate combinations</p>
        <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-white" aria-label="Close"><X className="size-4" /></button>
      </div>
      <label className="block">
        <span className={fieldLabel}>1 · Designs (comma separated)</span>
        <input value={designs} onChange={(e) => setDesigns(e.target.value)} placeholder="Statuario, Calacatta" className="input" />
      </label>
      <div>
        <span className={fieldLabel}>2 · Colours</span>
        <div className="flex flex-wrap gap-1.5">
          {colors.map((col) => {
            const on = colorIds.includes(col.id);
            return (
              <button key={col.id} type="button" onClick={() => setColorIds((ids) => (on ? ids.filter((x) => x !== col.id) : [...ids, col.id]))} className={cn("flex items-center gap-1.5 rounded-full border bg-white py-0.5 pr-2.5 pl-0.5 text-xs", on ? "border-primary-600 text-primary-700 ring-1 ring-primary-600" : "border-slate-200 text-slate-600")}>
                <Swatch color={col} className="size-5" /> {col.name}
              </button>
            );
          })}
          {!colors.length && <span className="text-xs text-slate-400">No colours in the library</span>}
        </div>
      </div>
      <div>
        <span className={fieldLabel}>3 · Sizes ({unit})</span>
        <div className="flex flex-wrap gap-1.5">
          {SIZE_PRESETS[unit].map(([w, h]) => {
            const key = `${w}x${h}`;
            const on = sizes.includes(key);
            return <button key={key} type="button" onClick={() => setSizes((l) => (on ? l.filter((x) => x !== key) : [...l, key]))} className={chip(on)}>{w}×{h}</button>;
          })}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div><span className={fieldLabel}>Thickness</span><Affix value={thickness} onChange={setThickness} suffix="mm" placeholder="9" /></div>
        <label><span className={fieldLabel}>Sqft</span><input value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="12x12" className="input" /></label>
        <div><span className={fieldLabel}>Price per piece</span><Affix value={price} onChange={setPrice} prefix="৳" placeholder="Set later" /></div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {d.length} design{d.length > 1 ? "s" : ""} × {c.length} colour{c.length > 1 ? "s" : ""} × {s.length} size{s.length > 1 ? "s" : ""} = <b className="text-slate-800">{total}</b> variations · existing ones are skipped
        </p>
        <button
          type="button"
          onClick={() => onCreate(d.flatMap((design) => c.flatMap((colorId) => s.map(([width, height]) => blank({ design, colorId, width, height, thickness, price, sqft: sqft.trim() })))))}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-500"
        >
          <Wand2 className="size-4" /> Create {total}
        </button>
      </div>
    </div>
  );
}
