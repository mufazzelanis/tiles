"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Images, Layers, Loader2, Plus, Ruler, Sparkles, Trash2, Upload, X } from "lucide-react";
import Img from "@/components/Img";
import { FINISHES, SIZES } from "@/lib/resources";
import { formatExtra, normalizeOptions, type DesignOption, type PriceOption, type ProductOptions, type SizeOption } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { MediaPicker } from "./MediaPicker";
import { toast } from "./Toaster";
import { uploadFiles } from "./upload";

const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const move = <T,>(l: T[], i: number, d: number) => {
  const j = i + d;
  if (j < 0 || j >= l.length) return l;
  const n = [...l];
  [n[i], n[j]] = [n[j], n[i]];
  return n;
};

/**
 * Priced product options: designs (with photos), finishes and sizes (with box coverage).
 * Submitted as one JSON hidden input; the server re-validates it.
 */
export function OptionsField({ name, defaultValue, legacy, basePrice, onChange }: {
  name: string;
  defaultValue: ProductOptions;
  /** older products only have a single size / finish — offered as the first option */
  legacy: { size: string; finish: string };
  basePrice: number;
  onChange?: () => void;
}) {
  const [opts, setRaw] = useState<ProductOptions>(() => {
    const o = normalizeOptions(defaultValue);
    if (!o.sizes.length && legacy.size) o.sizes = [{ id: uid("s"), name: legacy.size, extra: 0, piecesPerBox: 0, sqftPerBox: 0 }];
    if (!o.finishes.length && legacy.finish) o.finishes = [{ id: uid("f"), name: legacy.finish, extra: 0 }];
    return o;
  });
  const set = (fn: (o: ProductOptions) => ProductOptions) => (setRaw(fn), onChange?.());

  const range = (() => {
    if (basePrice <= 0) return null;
    const groups = [opts.designs, opts.finishes, opts.sizes].filter((g) => g.length);
    const lo = groups.reduce((s, g) => s + Math.min(...g.map((o) => o.extra)), 0);
    const hi = groups.reduce((s, g) => s + Math.max(...g.map((o) => o.extra)), 0);
    return { lo: Math.max(0, basePrice + lo), hi: Math.max(0, basePrice + hi) };
  })();

  return (
    <div className="space-y-4">
      <input type="hidden" name={name} value={JSON.stringify(opts)} />

      <Group
        icon={Sparkles}
        title="Designs"
        hint="Patterns of this tile, e.g. Statuario, Calacatta. Add photos so the gallery switches when a design is picked."
        empty="No designs — the product is sold in one design."
        addLabel="Add design"
        onAdd={() => set((o) => ({ ...o, designs: [...o.designs, { id: uid("d"), name: "", extra: 0, images: [] }] }))}
      >
        {opts.designs.map((d, i) => (
          <Row
            key={d.id}
            index={i}
            count={opts.designs.length}
            option={d}
            basePrice={basePrice}
            placeholder="Design name"
            onChange={(patch) => set((o) => ({ ...o, designs: o.designs.map((x) => (x.id === d.id ? { ...x, ...patch } : x)) }))}
            onMove={(dir) => set((o) => ({ ...o, designs: move(o.designs, i, dir) }))}
            onDelete={() => set((o) => ({ ...o, designs: o.designs.filter((x) => x.id !== d.id) }))}
          >
            <DesignPhotos design={d} onChange={(images) => set((o) => ({ ...o, designs: o.designs.map((x) => (x.id === d.id ? { ...x, images } : x)) }))} />
          </Row>
        ))}
      </Group>

      <Group
        icon={Layers}
        title="Finishes"
        hint="Surface finish, e.g. Glossy, Matt, Polished."
        empty="No finish options."
        addLabel="Add finish"
        onAdd={() => set((o) => ({ ...o, finishes: [...o.finishes, { id: uid("f"), name: "", extra: 0 }] }))}
      >
        {opts.finishes.map((f, i) => (
          <Row
            key={f.id}
            index={i}
            count={opts.finishes.length}
            option={f}
            basePrice={basePrice}
            placeholder="Finish"
            suggestions={FINISHES}
            listId="opt-finishes"
            onChange={(patch) => set((o) => ({ ...o, finishes: o.finishes.map((x) => (x.id === f.id ? { ...x, ...patch } : x)) }))}
            onMove={(dir) => set((o) => ({ ...o, finishes: move(o.finishes, i, dir) }))}
            onDelete={() => set((o) => ({ ...o, finishes: o.finishes.filter((x) => x.id !== f.id) }))}
          />
        ))}
      </Group>

      <Group
        icon={Ruler}
        title="Sizes"
        hint="Each size can have its own price extra and box coverage (leave pcs / sqft at 0 to use the product's defaults)."
        empty="No sizes yet — add at least one so customers see the tile size."
        addLabel="Add size"
        onAdd={() => set((o) => ({ ...o, sizes: [...o.sizes, { id: uid("s"), name: "", extra: 0, piecesPerBox: 0, sqftPerBox: 0 }] }))}
      >
        {opts.sizes.map((s, i) => (
          <Row
            key={s.id}
            index={i}
            count={opts.sizes.length}
            option={s}
            basePrice={basePrice}
            placeholder="e.g. 60x60 cm"
            suggestions={SIZES}
            listId="opt-sizes"
            onChange={(patch) => set((o) => ({ ...o, sizes: o.sizes.map((x) => (x.id === s.id ? { ...x, ...patch } : x)) }))}
            onMove={(dir) => set((o) => ({ ...o, sizes: move(o.sizes, i, dir) }))}
            onDelete={() => set((o) => ({ ...o, sizes: o.sizes.filter((x) => x.id !== s.id) }))}
          >
            <div className="flex flex-wrap gap-2">
              <NumberBox label="Pcs / box" value={(s as SizeOption).piecesPerBox} onChange={(v) => set((o) => ({ ...o, sizes: o.sizes.map((x) => (x.id === s.id ? { ...x, piecesPerBox: v } : x)) }))} />
              <NumberBox label="Sqft / box" step={0.1} value={(s as SizeOption).sqftPerBox} onChange={(v) => set((o) => ({ ...o, sizes: o.sizes.map((x) => (x.id === s.id ? { ...x, sqftPerBox: v } : x)) }))} />
            </div>
          </Row>
        ))}
      </Group>

      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        {range
          ? range.lo === range.hi
            ? <>Every combination costs <b className="text-slate-900">৳{range.lo.toLocaleString("en-IN")}</b> per box (plus any colour extra).</>
            : <>Box price ranges from <b className="text-slate-900">৳{range.lo.toLocaleString("en-IN")}</b> to <b className="text-slate-900">৳{range.hi.toLocaleString("en-IN")}</b> depending on the choice (plus any colour extra).</>
          : "Base price is 0, so the website shows “Price on request” for every option."}
      </p>
    </div>
  );
}

function Group({ icon: Icon, title, hint, empty, addLabel, onAdd, children }: {
  icon: typeof Ruler;
  title: string;
  hint: string;
  empty: string;
  addLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  const has = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className="rounded-xl border border-slate-200">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Icon className="size-4 text-slate-400" /> {title}</p>
          <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
        </div>
        <button type="button" onClick={onAdd} className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50">
          <Plus className="size-3.5" /> {addLabel}
        </button>
      </div>
      <div className="space-y-2 p-3">{has ? children : <p className="px-1 py-1 text-xs text-slate-400">{empty}</p>}</div>
    </div>
  );
}

function Row({ index, count, option, basePrice, placeholder, suggestions, listId, onChange, onMove, onDelete, children }: {
  index: number;
  count: number;
  option: PriceOption;
  basePrice: number;
  placeholder: string;
  suggestions?: string[];
  listId?: string;
  onChange: (patch: Partial<PriceOption>) => void;
  onMove: (dir: number) => void;
  onDelete: () => void;
  children?: React.ReactNode;
}) {
  const btn = "rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30";
  return (
    <div className={cn("rounded-lg border bg-white p-2.5", index === 0 ? "border-primary-200" : "border-slate-200")}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={option.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={placeholder}
          list={listId}
          aria-label="Name"
          aria-invalid={!option.name.trim()}
          className="input min-w-36 flex-1 py-1.5"
        />
        {suggestions && listId && (
          <datalist id={listId}>{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
        )}
        <label className="flex items-center rounded-lg border border-slate-200 focus-within:border-primary-500" title="Added to the base price (use a minus for a discount)">
          <span className="pl-2.5 text-xs text-slate-400">±৳</span>
          <input
            type="number"
            step="any"
            value={option.extra || ""}
            placeholder="0"
            onChange={(e) => onChange({ extra: Number(e.target.value) || 0 })}
            aria-label="Price extra"
            className="w-24 bg-transparent px-1.5 py-1.5 text-sm focus:outline-none"
          />
        </label>
        <span className="w-24 text-right text-xs text-slate-500 tabular-nums">
          {basePrice > 0 ? <>= ৳{Math.max(0, basePrice + option.extra).toLocaleString("en-IN")}</> : formatExtra(option.extra) || "—"}
        </span>
        {index === 0 && <span className="rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-700">Default</span>}
        <span className="flex">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className={btn} aria-label="Move up"><ArrowUp className="size-4" /></button>
          <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} className={btn} aria-label="Move down"><ArrowDown className="size-4" /></button>
          <button type="button" onClick={onDelete} className={cn(btn, "hover:bg-rose-50 hover:text-rose-600")} aria-label="Delete"><Trash2 className="size-4" /></button>
        </span>
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

function NumberBox({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="flex items-center rounded-lg border border-slate-200 text-xs focus-within:border-primary-500">
      <span className="border-r border-slate-200 px-2 py-1.5 text-slate-500">{label}</span>
      <input type="number" min={0} step={step} value={value || ""} placeholder="default" onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} className="w-20 bg-transparent px-2 py-1.5 text-sm focus:outline-none" />
    </label>
  );
}

function DesignPhotos({ design, onChange }: { design: DesignOption; onChange: (images: string[]) => void }) {
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {design.images.map((src, i) => (
        <span key={src + i} className="group relative size-12 overflow-hidden rounded-md ring-1 ring-slate-200">
          <Img src={src} alt="" fill sizes="48px" className="object-cover" />
          <button type="button" onClick={() => onChange(design.images.filter((_, x) => x !== i))} className="absolute inset-0 grid place-items-center bg-black/50 text-white opacity-0 transition group-hover:opacity-100" aria-label="Remove photo">
            <X className="size-4" />
          </button>
        </span>
      ))}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={async (e) => {
          const files = e.target.files;
          e.target.value = "";
          if (!files?.length) return;
          setBusy(true);
          try {
            onChange([...design.images, ...(await uploadFiles(files))].slice(0, 12));
          } catch (err) {
            toast((err as Error).message, "error");
          } finally {
            setBusy(false);
          }
        }}
      />
      <span className="flex overflow-hidden rounded-md border border-slate-200 text-[11px] font-medium text-slate-600">
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="inline-flex items-center gap-1 px-2 py-1.5 hover:bg-slate-50">
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />} Photos
        </button>
        <button type="button" onClick={() => setPicker(true)} className="border-l border-slate-200 px-2 hover:bg-slate-50" aria-label="Choose from media library">
          <Images className="size-3.5" />
        </button>
      </span>
      {!design.images.length && <span className="text-[11px] text-slate-400">Optional — the main gallery is used if empty</span>}
      <MediaPicker open={picker} multiple onClose={() => setPicker(false)} onPick={(u) => onChange([...design.images, ...u].slice(0, 12))} />
    </div>
  );
}
