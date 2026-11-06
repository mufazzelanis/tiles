"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Images, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import Img from "@/components/Img";
import { PaverArt } from "@/components/CatalogueCover";
import { saveHomePatterns } from "@/app/admin/actions";
import { COVER_COLORS, COVER_STYLES } from "@/lib/catalogue";
import { defaultHomePatterns, type HomePatterns, type PatternCard } from "@/lib/home-patterns";
import { cn } from "@/lib/utils";
import { Button, Card } from "./ui";
import { MediaPicker } from "./MediaPicker";
import { toast } from "./Toaster";
import { uploadFiles } from "./upload";

const uid = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Home page "Popular paver patterns": heading, text and the cards (name, text, photo or drawn pattern, link). */
export function HomePatternsEditor({ initial, canEdit }: { initial: HomePatterns; canEdit: boolean }) {
  const router = useRouter();
  const [cfg, setCfg] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [saving, start] = useTransition();
  const [pickFor, setPickFor] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadFor = useRef<string | null>(null);
  const dirty = JSON.stringify(cfg) !== saved;
  const shown = cfg.cards.filter((c) => c.enabled);

  const setCard = (id: string, patch: Partial<PatternCard>) => setCfg((c) => ({ ...c, cards: c.cards.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const move = (i: number, d: number) =>
    setCfg((c) => {
      const j = i + d;
      if (j < 0 || j >= c.cards.length) return c;
      const cards = [...c.cards];
      [cards[i], cards[j]] = [cards[j], cards[i]];
      return { ...c, cards };
    });
  const save = () =>
    start(async () => {
      const r = await saveHomePatterns(JSON.stringify(cfg));
      toast(r.message ?? "Saved", r.ok ? "success" : "error");
      if (r.ok) {
        setSaved(JSON.stringify(cfg));
        router.refresh();
      }
    });

  return (
    <fieldset disabled={!canEdit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-6">
        <Card title="Section">
          <div className="space-y-4 p-5">
            <p className="text-xs text-slate-500">
              Switch the whole section on or off and move it in <Link href="/admin/settings/home" className="font-medium text-slate-800 underline">Home page sections</Link>.
            </p>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Title</span>
              <input value={cfg.title} onChange={(e) => setCfg((c) => ({ ...c, title: e.target.value }))} className="input" placeholder="Popular Paver Patterns" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Text under the title</span>
              <textarea rows={2} value={cfg.subtitle} onChange={(e) => setCfg((c) => ({ ...c, subtitle: e.target.value }))} className="input" />
            </label>
          </div>
        </Card>

        <Card title={`Cards · ${shown.length} shown`}>
          <div className="space-y-3 p-5">
            <p className="text-xs text-slate-500">Upload a real photo of the paver, or leave it empty to show a drawn pattern in the colour you pick.</p>
            {cfg.cards.map((p, i) => (
              <div key={p.id} className={cn("flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-nowrap", !p.enabled && "bg-slate-50")}>
                <button
                  type="button"
                  onClick={() => {
                    uploadFor.current = p.id;
                    fileInput.current?.click();
                  }}
                  className="group relative size-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200"
                  title="Upload a photo"
                >
                  {p.image ? (
                    <Img src={p.image} alt="" fill sizes="96px" className={cn("object-cover", !p.enabled && "opacity-50")} />
                  ) : (
                    <PaverArt style={p.pattern} color={p.color} className={cn("absolute inset-0 size-full", !p.enabled && "opacity-50")} />
                  )}
                  <span className="absolute inset-0 grid place-items-center bg-black/40 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                    {busy === p.id ? "Uploading…" : <span className="flex items-center gap-1"><ImagePlus className="size-3.5" /> Upload</span>}
                  </span>
                </button>
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  <input value={p.name} onChange={(e) => setCard(p.id, { name: e.target.value })} className="input py-1.5 font-medium" placeholder="Name, e.g. I-Shape Interlock" aria-label="Name" />
                  <input value={p.link} onChange={(e) => setCard(p.id, { link: e.target.value })} className="input py-1.5 text-xs" placeholder="Link, e.g. /products?q=interlock" aria-label="Link" />
                  <textarea value={p.text} onChange={(e) => setCard(p.id, { text: e.target.value })} rows={2} className="input py-1.5 text-xs sm:col-span-2" placeholder="One short line about where it works best" aria-label="Text" />
                  {p.image ? (
                    <button type="button" onClick={() => setCard(p.id, { image: "" })} className="justify-self-start text-xs text-rose-600 hover:underline sm:col-span-2">
                      Remove photo (use a drawn pattern)
                    </button>
                  ) : (
                    <>
                      <select value={p.pattern} onChange={(e) => setCard(p.id, { pattern: e.target.value })} className="input py-1.5 text-xs" aria-label="Pattern">
                        {COVER_STYLES.map((s) => <option key={s.value} value={s.value}>Drawing: {s.label}</option>)}
                      </select>
                      <select value={p.color} onChange={(e) => setCard(p.id, { color: e.target.value })} className="input py-1.5 text-xs" aria-label="Colour">
                        {COVER_COLORS.map((c) => <option key={c.value} value={c.value}>Colour: {c.label}</option>)}
                      </select>
                    </>
                  )}
                </div>
                <div className="flex shrink-0 items-start">
                  <button type="button" onClick={() => setPickFor(p.id)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100" title="Choose from the media library"><Images className="size-4" /></button>
                  <button type="button" onClick={() => setCard(p.id, { enabled: !p.enabled })} className="rounded p-1.5 text-slate-400 hover:bg-slate-100" title={p.enabled ? "Shown — click to hide" : "Hidden — click to show"}>
                    {p.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4 text-amber-500" />}
                  </button>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label="Move up"><ArrowUp className="size-4" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === cfg.cards.length - 1} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label="Move down"><ArrowDown className="size-4" /></button>
                  <button type="button" onClick={() => setCfg((c) => ({ ...c, cards: c.cards.filter((x) => x.id !== p.id) }))} className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete card">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={cfg.cards.length >= 12}
                onClick={() => setCfg((c) => ({ ...c, cards: [...c.cards, { id: uid(), name: "New pattern", text: "", image: "", pattern: "paver", color: "maroon", link: "/products", enabled: true }] }))}
              >
                <Plus className="size-4" /> Add card
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (window.confirm("Put back the 6 standard pattern cards and texts? Nothing is saved until you click Save.")) setCfg(defaultHomePatterns());
                }}
              >
                <RotateCcw className="size-4" /> Use standard cards
              </Button>
            </div>
          </div>
        </Card>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            const id = uploadFor.current;
            if (!files.length || !id) return;
            setBusy(id);
            try {
              const [url] = await uploadFiles(files);
              if (url) setCard(id, { image: url });
            } catch (err) {
              toast((err as Error).message, "error");
            } finally {
              setBusy(null);
            }
          }}
        />
        <MediaPicker
          open={!!pickFor}
          onClose={() => setPickFor(null)}
          onPick={(u) => {
            if (pickFor && u[0]) setCard(pickFor, { image: u[0] });
            setPickFor(null);
          }}
        />
      </div>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card title="Preview">
          <div className="rounded-b-xl bg-[#f8f2e9] p-4">
            <p className="text-center text-xs font-semibold tracking-wide text-slate-800 uppercase">{cfg.title || "Popular Paver Patterns"}</p>
            {cfg.subtitle && <p className="mt-1 line-clamp-2 text-center text-[10px] text-slate-500">{cfg.subtitle}</p>}
            {shown.length ? (
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {shown.map((p) => (
                  <div key={p.id} className="overflow-hidden rounded-md bg-white shadow-sm">
                    <div className="relative aspect-square">
                      {p.image ? <Img src={p.image} alt="" fill sizes="100px" className="object-cover" /> : <PaverArt style={p.pattern} color={p.color} className="absolute inset-0 size-full" />}
                    </div>
                    <p className="truncate px-1.5 py-1 text-[9px] font-semibold text-slate-800">{p.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-center text-xs text-amber-700">No card is shown, so the section is hidden on the website.</p>
            )}
          </div>
        </Card>
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {dirty ? <span className="flex items-center gap-1.5 text-xs text-amber-600"><span className="size-1.5 animate-pulse rounded-full bg-amber-500" /> Unsaved</span> : <span className="text-xs text-slate-400">All changes saved</span>}
            <span className="flex-1" />
            {dirty && <Button type="button" variant="ghost" onClick={() => setCfg(JSON.parse(saved))}><RotateCcw className="size-4" /> Discard</Button>}
            <Button type="button" onClick={save} disabled={saving || !dirty}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
            </Button>
          </div>
        )}
      </div>
    </fieldset>
  );
}
