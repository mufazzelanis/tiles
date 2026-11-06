"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, Loader2, Pencil, RotateCcw, Save, Smartphone } from "lucide-react";
import { saveHomeContent, saveHomeSections } from "@/app/admin/actions";
import { CONTENT_DEFS, type HomeContent } from "@/lib/home-content";
import { HomeContentFields } from "./HomeContentFields";
import { defaultHomeSections, HOME_SECTIONS, PRODUCT_ROW_MODES, type HomeSectionKey, type HomeSections, type ProductRowMode } from "@/lib/home-sections";
import { cn } from "@/lib/utils";
import { Button, Card } from "./ui";
import { toast } from "./Toaster";

/** Where each section's own content is edited. */
const EDIT_LINKS: Partial<Record<HomeSectionKey, { href: string; label: string }[]>> = {
  hero: [{ href: "/admin/slides", label: "Edit slides" }],
  welcome: [{ href: "/admin/settings?tab=brand", label: "Company name & intro" }],
  featured: [{ href: "/admin/products", label: "Manage products" }],
  areas: [{ href: "/admin/settings/rooms", label: "Edit areas" }],
  thickness: [{ href: "/admin/settings/thickness", label: "Edit cards & texts" }],
  patterns: [{ href: "/admin/settings/patterns", label: "Edit cards" }],
  categories: [{ href: "/admin/categories", label: "Edit categories" }],
  why: [{ href: "/admin/settings?tab=home", label: "Video" }],
  sustainability: [{ href: "/admin/sustainability", label: "Edit slides" }],
};

const META = new Map(HOME_SECTIONS.map((s) => [s.key, s]));

/** Switch every home page section on or off, change their order and edit their texts. */
export function HomeSectionsEditor({ initial, initialContent, canEdit }: { initial: HomeSections; initialContent: HomeContent; canEdit: boolean }) {
  const router = useRouter();
  const [cfg, setCfg] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [content, setContent] = useState(initialContent);
  const [savedContent, setSavedContent] = useState(JSON.stringify(initialContent));
  // the section whose "Edit content" panel is open
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [saving, start] = useTransition();
  const layoutDirty = JSON.stringify(cfg) !== saved;
  const contentDirty = JSON.stringify(content) !== savedContent;
  const dirty = layoutDirty || contentDirty;
  const shown = cfg.order.filter((k) => !cfg.hidden.includes(k)).length;

  const toggle = (k: HomeSectionKey) => setCfg((c) => ({ ...c, hidden: c.hidden.includes(k) ? c.hidden.filter((x) => x !== k) : [...c.hidden, k] }));
  const move = (i: number, d: number) =>
    setCfg((c) => {
      const j = i + d;
      if (j < 0 || j >= c.order.length) return c;
      const order = [...c.order];
      [order[i], order[j]] = [order[j], order[i]];
      return { ...c, order };
    });
  const save = () =>
    start(async () => {
      let ok = true;
      let message = "Saved — the home page is updated.";
      if (layoutDirty) {
        const r = await saveHomeSections(JSON.stringify(cfg));
        ok = !!r.ok;
        message = r.message ?? message;
        if (r.ok) setSaved(JSON.stringify(cfg));
      }
      if (ok && contentDirty) {
        const r = await saveHomeContent(JSON.stringify(content));
        ok = !!r.ok;
        message = r.message ?? message;
        if (r.ok) setSavedContent(JSON.stringify(content));
      }
      toast(message, ok ? "success" : "error");
      if (ok) router.refresh();
    });

  return (
    <fieldset disabled={!canEdit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card title={`Sections · ${shown} of ${cfg.order.length} shown`}>
        <ul className="divide-y divide-slate-100">
          {cfg.order.map((k, i) => {
            const m = META.get(k)!;
            const on = !cfg.hidden.includes(k);
            const edit = EDIT_LINKS[k];
            return (
              <li key={k} className={cn("flex flex-wrap items-center gap-3 px-4 py-3 transition sm:px-5", !on && "bg-slate-50", openKey === k && "bg-slate-50/60")}>
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-semibold text-slate-500">{i + 1}</span>
                <div className={cn("min-w-0 flex-1", !on && "opacity-55")}>
                  <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium text-slate-900">
                    {m.label}
                    {k === "quick" && <span className="inline-flex items-center gap-0.5 rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700"><Smartphone className="size-3" /> phones</span>}
                  </p>
                  <p className="text-xs text-slate-500">{m.help}</p>
                  {k === "featured" && on && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <select
                        value={cfg.productsMode}
                        onChange={(e) => setCfg((c) => ({ ...c, productsMode: e.target.value as ProductRowMode }))}
                        className="input w-auto py-1 text-xs"
                        aria-label="Which products"
                      >
                        {PRODUCT_ROW_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600">
                        Show
                        <input
                          type="number"
                          min={4}
                          max={30}
                          value={cfg.productsCount}
                          onChange={(e) => setCfg((c) => ({ ...c, productsCount: Math.min(30, Math.max(4, Math.round(Number(e.target.value)) || 4)) }))}
                          className="input w-16 py-1 text-xs"
                        />
                        products
                      </label>
                    </div>
                  )}
                  {(edit || CONTENT_DEFS[k]) && (
                    <span className="mt-0.5 flex flex-wrap gap-x-3">
                      {CONTENT_DEFS[k] && (
                        <button
                          type="button"
                          onClick={() => setOpenKey(openKey === k ? null : k)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:underline"
                          aria-expanded={openKey === k}
                        >
                          <Pencil className="size-3" /> Edit content
                          <ChevronDown className={cn("size-3 transition", openKey === k && "rotate-180")} />
                        </button>
                      )}
                      {edit?.map((l) => (
                        <Link key={l.href} href={l.href} className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline">
                          {l.label} <ExternalLink className="size-3" />
                        </Link>
                      ))}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move ${m.label} up`}>
                    <ArrowUp className="size-4" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === cfg.order.length - 1} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move ${m.label} down`}>
                    <ArrowDown className="size-4" />
                  </button>
                  {/* on / off switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={`Show ${m.label}`}
                    onClick={() => toggle(k)}
                    className={cn("relative ml-1 h-6 w-11 rounded-full transition", on ? "bg-emerald-500" : "bg-slate-300")}
                  >
                    <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition", on && "translate-x-5")} />
                  </button>
                </div>
                {openKey === k && CONTENT_DEFS[k] && (
                  <div className="basis-full pl-10">
                    <HomeContentFields def={CONTENT_DEFS[k]} value={content[k] ?? {}} onChange={(v) => setContent((c) => ({ ...c, [k]: v }))} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card title="Page outline">
          <ol className="space-y-1 p-4">
            {cfg.order.filter((k) => !cfg.hidden.includes(k)).map((k) => (
              <li key={k} className="rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 ring-1 ring-slate-200/70">{META.get(k)!.label}</li>
            ))}
            {!shown && <li className="text-xs text-amber-600">Every section is switched off — the home page would be empty.</li>}
          </ol>
        </Card>
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {dirty ? <span className="flex items-center gap-1.5 text-xs text-amber-600"><span className="size-1.5 animate-pulse rounded-full bg-amber-500" /> Unsaved</span> : <span className="text-xs text-slate-400">All changes saved</span>}
            <span className="flex-1" />
            {dirty && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCfg(JSON.parse(saved));
                  setContent(JSON.parse(savedContent));
                }}
              >
                <RotateCcw className="size-4" /> Discard
              </Button>
            )}
            <Button type="button" onClick={save} disabled={saving || !dirty}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
            </Button>
          </div>
        )}
        <button type="button" onClick={() => setCfg(defaultHomeSections())} className="w-full text-center text-xs text-slate-500 hover:text-slate-800 hover:underline">
          Reset to the default order (all on)
        </button>
      </div>
    </fieldset>
  );
}
