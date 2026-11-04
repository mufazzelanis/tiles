"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Images, Loader2, Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import Img from "@/components/Img";
import { saveCataloguePage } from "@/app/admin/actions";
import type { CataloguePage, CatalogueSection } from "@/lib/catalogue";
import { cn } from "@/lib/utils";
import { Button, Card } from "./ui";
import { MediaPicker } from "./MediaPicker";
import { toast } from "./Toaster";
import { uploadFiles } from "./upload";

const uid = () => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Hero texts + the sections the Catalogue page is grouped into. */
export function CataloguePageEditor({ initial, counts, canEdit }: { initial: CataloguePage; counts: Record<string, number>; canEdit: boolean }) {
  const router = useRouter();
  const [page, setPage] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [saving, start] = useTransition();
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(page) !== saved;

  const setSection = (id: string, patch: Partial<CatalogueSection>) => setPage((p) => ({ ...p, sections: p.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  const move = (i: number, d: number) =>
    setPage((p) => {
      const j = i + d;
      if (j < 0 || j >= p.sections.length) return p;
      const n = [...p.sections];
      [n[i], n[j]] = [n[j], n[i]];
      return { ...p, sections: n };
    });
  const save = () =>
    start(async () => {
      const r = await saveCataloguePage(JSON.stringify(page));
      toast(r.message ?? "Saved", r.ok ? "success" : "error");
      if (r.ok) {
        setSaved(JSON.stringify(page));
        router.refresh();
      }
    });

  return (
    <fieldset disabled={!canEdit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-6">
        <Card title="Sections">
          <div className="space-y-2 p-5">
            <p className="mb-2 text-xs text-slate-500">The Catalogue page is grouped into these sections, in this order. A catalogue can be in several sections; one with none goes into the first.</p>
            {page.sections.map((s, i) => (
              <div key={s.id} className={cn("flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2", !s.enabled && "opacity-60")}>
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-semibold text-slate-500">{i + 1}</span>
                <input value={s.title} onChange={(e) => setSection(s.id, { title: e.target.value })} className="input flex-1 py-1.5 font-medium" aria-label="Section title" />
                <span className="w-24 shrink-0 text-right text-xs text-slate-500">{counts[s.id] ?? 0} catalogue{(counts[s.id] ?? 0) === 1 ? "" : "s"}</span>
                <button type="button" onClick={() => setSection(s.id, { enabled: !s.enabled })} className="rounded p-1.5 text-slate-400 hover:bg-slate-100" title={s.enabled ? "Shown — click to hide" : "Hidden — click to show"}>
                  {s.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4 text-amber-500" />}
                </button>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label="Move up"><ArrowUp className="size-4" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === page.sections.length - 1} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label="Move down"><ArrowDown className="size-4" /></button>
                <button
                  type="button"
                  disabled={page.sections.length <= 1}
                  onClick={() => {
                    if ((counts[s.id] ?? 0) > 0 && !window.confirm(`${counts[s.id]} catalogue(s) are in “${s.title}”. Delete the section anyway? They move to the first section if they have no other.`)) return;
                    setPage((p) => ({ ...p, sections: p.sections.filter((x) => x.id !== s.id) }));
                  }}
                  className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                  aria-label="Delete section"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={() => setPage((p) => ({ ...p, sections: [...p.sections, { id: uid(), title: "New section", enabled: true }] }))} disabled={page.sections.length >= 20}>
              <Plus className="size-4" /> Add section
            </Button>
          </div>
        </Card>

        <Card title="Page banner">
          <div className="space-y-4 p-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Title</span>
              <input value={page.heroTitle} onChange={(e) => setPage((p) => ({ ...p, heroTitle: e.target.value }))} className="input" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Subtitle</span>
              <textarea rows={2} value={page.heroSubtitle} onChange={(e) => setPage((p) => ({ ...p, heroSubtitle: e.target.value }))} className="input" />
            </label>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Banner photo</span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="relative block h-20 w-36 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                  {page.heroImage && <Img src={page.heroImage} alt="" fill sizes="144px" className="object-cover" />}
                  {!page.heroImage && <span className="grid h-full place-items-center text-[11px] text-slate-400">Built-in photo</span>}
                </span>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    e.target.value = "";
                    if (!files.length) return;
                    setBusy(true);
                    try {
                      const [url] = await uploadFiles(files);
                      if (url) setPage((p) => ({ ...p, heroImage: url }));
                    } catch (err) {
                      toast((err as Error).message, "error");
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={() => fileInput.current?.click()} disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Upload
                </Button>
                <Button type="button" variant="secondary" onClick={() => setPicker(true)}><Images className="size-4" /> Library</Button>
                {page.heroImage && <button type="button" onClick={() => setPage((p) => ({ ...p, heroImage: "" }))} className="text-xs text-rose-600 hover:underline">Use built-in photo</button>}
              </div>
            </div>
          </div>
        </Card>
        <MediaPicker open={picker} onClose={() => setPicker(false)} onPick={(u) => u[0] && setPage((p) => ({ ...p, heroImage: u[0] }))} />
      </div>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card title="Preview">
          <div className="p-4">
            <div className="relative grid h-28 place-items-center overflow-hidden rounded-lg bg-slate-800 text-center text-white">
              {page.heroImage && <Img src={page.heroImage} alt="" fill sizes="320px" className="object-cover opacity-70" />}
              <div className="relative px-3">
                <p className="font-display text-lg font-semibold uppercase">{page.heroTitle || "Catalogue"}</p>
                <p className="line-clamp-2 text-[10px] text-white/80">{page.heroSubtitle}</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5">
              {page.sections.filter((s) => s.enabled).map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="h-px flex-1 bg-slate-200" /> {s.title} <span className="h-px flex-1 bg-slate-200" />
                </li>
              ))}
            </ul>
          </div>
        </Card>
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {dirty ? <span className="flex items-center gap-1.5 text-xs text-amber-600"><span className="size-1.5 animate-pulse rounded-full bg-amber-500" /> Unsaved</span> : <span className="text-xs text-slate-400">All changes saved</span>}
            <span className="flex-1" />
            {dirty && <Button type="button" variant="ghost" onClick={() => setPage(JSON.parse(saved))}><RotateCcw className="size-4" /> Discard</Button>}
            <Button type="button" onClick={save} disabled={saving || !dirty}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
            </Button>
          </div>
        )}
      </div>
    </fieldset>
  );
}
