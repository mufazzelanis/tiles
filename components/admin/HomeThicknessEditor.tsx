"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Plus, RotateCcw, Save, Star, Trash2 } from "lucide-react";
import { saveHomeThickness } from "@/app/admin/actions";
import { defaultHomeThickness, THICKNESS_ICONS, type HomeThickness, type ThicknessCard } from "@/lib/home-thickness";
import { cn } from "@/lib/utils";
import { Button, Card } from "./ui";
import { toast } from "./Toaster";

const uid = () => `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Home page "Which thickness do I need?": texts and the thickness cards. */
export function HomeThicknessEditor({ initial, canEdit }: { initial: HomeThickness; canEdit: boolean }) {
  const router = useRouter();
  const [cfg, setCfg] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [saving, start] = useTransition();
  // the "where it's used" boxes are edited as plain text, one line per item
  const [usesText, setUsesText] = useState<Record<string, string>>(() => Object.fromEntries(initial.cards.map((c) => [c.id, c.uses.join("\n")])));
  const dirty = JSON.stringify(cfg) !== saved;
  const shown = cfg.cards.filter((c) => c.enabled);

  const set = <K extends keyof HomeThickness>(k: K, v: HomeThickness[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const setCard = (id: string, patch: Partial<ThicknessCard>) => setCfg((c) => ({ ...c, cards: c.cards.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const move = (i: number, d: number) =>
    setCfg((c) => {
      const j = i + d;
      if (j < 0 || j >= c.cards.length) return c;
      const cards = [...c.cards];
      [cards[i], cards[j]] = [cards[j], cards[i]];
      return { ...c, cards };
    });
  const reset = (next: HomeThickness) => {
    setCfg(next);
    setUsesText(Object.fromEntries(next.cards.map((c) => [c.id, c.uses.join("\n")])));
  };
  const save = () =>
    start(async () => {
      const r = await saveHomeThickness(JSON.stringify(cfg));
      toast(r.message ?? "Saved", r.ok ? "success" : "error");
      if (r.ok) {
        setSaved(JSON.stringify(cfg));
        router.refresh();
      }
    });

  const text = (label: string, value: string, onChange: (v: string) => void, opts: { area?: boolean; placeholder?: string; help?: string } = {}) => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {opts.area ? (
        <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={opts.placeholder} className="input" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={opts.placeholder} className="input" />
      )}
      {opts.help && <span className="mt-1 block text-xs text-slate-500">{opts.help}</span>}
    </label>
  );

  return (
    <fieldset disabled={!canEdit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-6">
        <Card title="Section">
          <div className="space-y-4 p-5">
            <p className="text-xs text-slate-500">
              Switch the whole section on or off and move it in <Link href="/admin/settings/home" className="font-medium text-slate-800 underline">Home page sections</Link>.
            </p>
            {text("Title", cfg.title, (v) => set("title", v), { placeholder: "Which Thickness Do I Need?" })}
            {text("Text under the title", cfg.subtitle, (v) => set("subtitle", v), { area: true })}
            <div className="grid gap-4 sm:grid-cols-2">
              {text("Small note under the cards", cfg.note, (v) => set("note", v), { help: "Leave empty to hide it." })}
              {text("“Most popular” badge text", cfg.badge, (v) => set("badge", v), { help: "Shown on the card marked with ★." })}
              {text("Help link text", cfg.linkLabel, (v) => set("linkLabel", v), { placeholder: "Not sure? Ask our team" })}
              {text("Help link goes to", cfg.linkHref, (v) => set("linkHref", v), { placeholder: "/contact", help: "A page on this site (e.g. /contact) or a full https:// link." })}
            </div>
          </div>
        </Card>

        <Card title={`Thickness cards · ${shown.length} shown`}>
          <div className="space-y-3 p-5">
            {cfg.cards.map((c, i) => (
              <div key={c.id} className={cn("rounded-xl border bg-white p-3", c.popular ? "border-slate-900" : "border-slate-200", !c.enabled && "bg-slate-50 opacity-70")}>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={10}
                      max={300}
                      value={c.mm}
                      onChange={(e) => setCard(c.id, { mm: Math.max(0, Math.round(Number(e.target.value)) || 0) })}
                      className="input w-20 py-1.5 text-center text-lg font-semibold"
                      aria-label="Thickness in mm"
                    />
                    <span className="text-sm text-slate-500">mm</span>
                  </label>
                  <input value={c.title} onChange={(e) => setCard(c.id, { title: e.target.value })} className="input min-w-40 flex-1 py-1.5 font-medium" placeholder="e.g. Car parking & driveways" aria-label="Card title" />
                  <select value={c.icon} onChange={(e) => setCard(c.id, { icon: e.target.value })} className="input w-auto py-1.5 text-xs" aria-label="Icon">
                    {THICKNESS_ICONS.map((ic) => <option key={ic.value} value={ic.value}>Icon: {ic.label}</option>)}
                  </select>
                  <span className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setCfg((x) => ({ ...x, cards: x.cards.map((k) => ({ ...k, popular: k.id === c.id ? !c.popular : false })) }))}
                      className={cn("rounded p-1.5 hover:bg-slate-100", c.popular ? "text-amber-500" : "text-slate-400")}
                      title={c.popular ? "Highlighted as most popular — click to remove" : "Highlight as most popular"}
                    >
                      <Star className={cn("size-4", c.popular && "fill-current")} />
                    </button>
                    <button type="button" onClick={() => setCard(c.id, { enabled: !c.enabled })} className="rounded p-1.5 text-slate-400 hover:bg-slate-100" title={c.enabled ? "Shown — click to hide" : "Hidden — click to show"}>
                      {c.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4 text-amber-500" />}
                    </button>
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label="Move up"><ArrowUp className="size-4" /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === cfg.cards.length - 1} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label="Move down"><ArrowDown className="size-4" /></button>
                    <button type="button" onClick={() => setCfg((x) => ({ ...x, cards: x.cards.filter((k) => k.id !== c.id) }))} className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete card">
                      <Trash2 className="size-4" />
                    </button>
                  </span>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium tracking-wide text-slate-500 uppercase">Takes (heaviest load)</span>
                    <input value={c.load} onChange={(e) => setCard(c.id, { load: e.target.value })} className="input py-1.5 text-sm" placeholder="e.g. Cars, pickups & small vans" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium tracking-wide text-slate-500 uppercase">Where it’s used — one per line</span>
                    <textarea
                      rows={3}
                      value={usesText[c.id] ?? c.uses.join("\n")}
                      onChange={(e) => {
                        const v = e.target.value;
                        setUsesText((u) => ({ ...u, [c.id]: v }));
                        setCard(c.id, { uses: v.split("\n").map((l) => l.trim()).filter(Boolean) });
                      }}
                      className="input py-1.5 text-sm"
                      placeholder={"Car parking & car porch\nDriveways & garages"}
                    />
                  </label>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={cfg.cards.length >= 6}
                onClick={() => {
                  const id = uid();
                  setUsesText((u) => ({ ...u, [id]: "" }));
                  setCfg((x) => ({ ...x, cards: [...x.cards, { id, mm: 120, title: "New thickness", icon: "truck", load: "", uses: [], popular: false, enabled: true }] }));
                }}
              >
                <Plus className="size-4" /> Add card
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (window.confirm("Put back the standard 60 / 80 / 100 mm cards and texts? Nothing is saved until you click Save.")) reset(defaultHomeThickness());
                }}
              >
                <RotateCcw className="size-4" /> Use standard cards
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card title="Preview">
          <div className="p-4">
            <p className="text-center text-xs font-semibold tracking-wide text-slate-800 uppercase">{cfg.title || "Which Thickness Do I Need?"}</p>
            {shown.length ? (
              <div className="mt-3 space-y-2">
                {shown.map((c) => (
                  <div key={c.id} className={cn("relative rounded-lg border p-2.5", c.popular ? "border-slate-900" : "border-slate-200")}>
                    {c.popular && cfg.badge && <span className="absolute -top-2 left-2 rounded-full bg-slate-900 px-1.5 text-[8px] font-semibold text-white uppercase">{cfg.badge}</span>}
                    <p className="text-sm font-semibold text-slate-900">
                      {c.mm} <span className="text-[10px] text-slate-500">mm</span> · <span className="text-xs">{c.title}</span>
                    </p>
                    {c.load && <p className="text-[10px] font-semibold text-rose-800 uppercase">Takes: {c.load}</p>}
                    {c.uses.length > 0 && <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-500">{c.uses.join(" · ")}</p>}
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
            {dirty && <Button type="button" variant="ghost" onClick={() => reset(JSON.parse(saved))}><RotateCcw className="size-4" /> Discard</Button>}
            <Button type="button" onClick={save} disabled={saving || !dirty}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
            </Button>
          </div>
        )}
      </div>
    </fieldset>
  );
}
