"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { HomeIcon } from "@/components/HomeIcon";
import { HOME_ICONS, type FieldDef, type SectionContent, type SectionContentDef } from "@/lib/home-content";
import { cn } from "@/lib/utils";

/** Icon picker: a row of small icon buttons. */
function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {HOME_ICONS.map((ic) => (
        <button
          key={ic}
          type="button"
          onClick={() => onChange(ic)}
          title={ic}
          className={cn("grid size-7 place-items-center rounded-md ring-1 transition", value === ic ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50")}
        >
          <HomeIcon name={ic} className="size-3.5" />
        </button>
      ))}
    </div>
  );
}

function Field({ f, value, onChange, compact }: { f: FieldDef; value: string; onChange: (v: string) => void; compact?: boolean }) {
  return (
    <label className={cn("block min-w-0", (f.type === "textarea" || f.type === "icon") && "sm:col-span-2")}>
      <span className={cn("mb-1 block font-medium text-slate-600", compact ? "text-[11px]" : "text-xs")}>{f.label}</span>
      {f.type === "icon" ? (
        <IconPicker value={value} onChange={onChange} />
      ) : f.type === "textarea" ? (
        <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} className="input py-1.5 text-sm" />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={f.type === "link" ? "/products or https://…" : f.placeholder}
          className="input py-1.5 text-sm"
        />
      )}
    </label>
  );
}

/** Edits one section's texts, links and list items (shapes come from CONTENT_DEFS). */
export function HomeContentFields({ def, value, onChange }: { def: SectionContentDef; value: SectionContent; onChange: (v: SectionContent) => void }) {
  const items = value.items ?? [];
  const setItems = (next: Record<string, string>[]) => onChange({ ...value, items: next });
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };

  return (
    <div className="space-y-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
      {def.note && <p className="text-xs text-slate-500">{def.note}</p>}
      {def.fields.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {def.fields.map((f) => (
            <Field key={f.key} f={f} value={(value[f.key] as string) ?? ""} onChange={(v) => onChange({ ...value, [f.key]: v })} />
          ))}
        </div>
      )}
      {def.list && (
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-slate-700 uppercase">{def.list.label}</p>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {def.list!.itemLabel} {i + 1}
                  </span>
                  <span className="flex-1" />
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label="Move up"><ArrowUp className="size-3.5" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label="Move down"><ArrowDown className="size-3.5" /></button>
                  <button type="button" onClick={() => setItems(items.filter((_, x) => x !== i))} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove"><Trash2 className="size-3.5" /></button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {def.list!.fields.map((f) => (
                    <Field key={f.key} f={f} compact value={it[f.key] ?? ""} onChange={(v) => setItems(items.map((x, xi) => (xi === i ? { ...x, [f.key]: v } : x)))} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {items.length < def.list.max && (
            <button
              type="button"
              onClick={() => setItems([...items, Object.fromEntries(def.list!.fields.map((f) => [f.key, f.type === "icon" ? "star" : f.type === "link" ? "/" : ""]))])}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 hover:bg-white"
            >
              <Plus className="size-3.5" /> Add {def.list.itemLabel.toLowerCase()}
            </button>
          )}
          {!items.length && <p className="mt-1 text-xs text-amber-600">Nothing added — this part is hidden on the website.</p>}
        </div>
      )}
    </div>
  );
}
