"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Images, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import Img from "@/components/Img";
import { saveHomeRooms } from "@/app/admin/actions";
import { defaultHomeRooms, type HomeRoom, type HomeRooms } from "@/lib/home-rooms";
import { cn } from "@/lib/utils";
import { Button, Card } from "./ui";
import { MediaPicker } from "./MediaPicker";
import { toast } from "./Toaster";
import { uploadFiles } from "./upload";
import { PaverArt } from "@/components/CatalogueCover";
import { COVER_COLORS, COVER_STYLES } from "@/lib/catalogue";

const uid = () => `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Home page "Shop by area": title and the area tiles (name, photo or drawn pattern, linked application area). */
export function HomeRoomsEditor({ initial, counts, applications, canEdit }: {
  initial: HomeRooms;
  /** products per application area */
  counts: Record<string, number>;
  applications: readonly string[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [cfg, setCfg] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [saving, start] = useTransition();
  const [pickFor, setPickFor] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadFor = useRef<string | null>(null);
  const dirty = JSON.stringify(cfg) !== saved;

  const setRoom = (id: string, patch: Partial<HomeRoom>) => setCfg((c) => ({ ...c, rooms: c.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const move = (i: number, d: number) =>
    setCfg((c) => {
      const j = i + d;
      if (j < 0 || j >= c.rooms.length) return c;
      const rooms = [...c.rooms];
      [rooms[i], rooms[j]] = [rooms[j], rooms[i]];
      return { ...c, rooms };
    });
  const save = () =>
    start(async () => {
      const r = await saveHomeRooms(JSON.stringify(cfg));
      toast(r.message ?? "Saved", r.ok ? "success" : "error");
      if (r.ok) {
        setSaved(JSON.stringify(cfg));
        router.refresh();
      }
    });

  // what the website will actually show
  const visible = cfg.rooms.filter((r) => r.enabled && (!cfg.hideEmpty || (counts[r.application] ?? 0) > 0));
  const toggle = (label: string, help: string, value: boolean, onChange: (v: boolean) => void) => (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        <span className="block text-xs text-slate-500">{help}</span>
      </span>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-4 accent-slate-900" />
    </label>
  );

  return (
    <fieldset disabled={!canEdit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-6">
        <Card title="Section">
          <div className="divide-y divide-slate-100 px-5 py-2">
            <p className="py-3 text-xs text-slate-500">
              Switch the whole section on or off and move it up or down in <Link href="/admin/settings/home" className="font-medium text-slate-800 underline">Home page sections</Link>.
            </p>
            <label className="block py-3">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Title</span>
              <input value={cfg.title} onChange={(e) => setCfg((c) => ({ ...c, title: e.target.value }))} className="input" placeholder="Shop by Area" />
            </label>
            {toggle("Hide areas with no designs", "An area only appears once at least one product has its application area.", cfg.hideEmpty, (v) => setCfg((c) => ({ ...c, hideEmpty: v })))}
            {toggle("Show the number of designs", "The “12 designs” line under each area name.", cfg.showCount, (v) => setCfg((c) => ({ ...c, showCount: v })))}
          </div>
        </Card>

        <Card title="Areas">
          <div className="space-y-3 p-5">
            <p className="text-xs text-slate-500">
              Each area opens the products page filtered by its <b>application area</b> (set on every product under “Application areas”). Without a photo, the chosen paver pattern is drawn instead.
            </p>
            {cfg.rooms.map((r, i) => {
              const count = counts[r.application] ?? 0;
              const hidden = !r.enabled || (cfg.hideEmpty && count === 0);
              return (
                <div key={r.id} className={cn("flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-nowrap", hidden && "bg-slate-50")}>
                  <button
                    type="button"
                    onClick={() => {
                      uploadFor.current = r.id;
                      fileInput.current?.click();
                    }}
                    className="group relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200"
                    title="Upload a photo"
                  >
                    {r.image ? (
                      <Img src={r.image} alt="" fill sizes="96px" className={cn("object-cover", hidden && "opacity-50")} />
                    ) : (
                      <>
                        <PaverArt style={r.pattern} color={r.color} className={cn("absolute inset-0 size-full", hidden && "opacity-50")} />
                        <ImagePlus className="absolute top-1 right-1 size-3.5 text-white drop-shadow" />
                      </>
                    )}
                    <span className="absolute inset-0 grid place-items-center bg-black/40 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">{busy === r.id ? "Uploading…" : "Upload"}</span>
                  </button>
                  <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                    <input value={r.name} onChange={(e) => setRoom(r.id, { name: e.target.value })} className="input py-1.5 font-medium" placeholder="Area name" aria-label="Area name" />
                    <select value={r.application} onChange={(e) => setRoom(r.id, { application: e.target.value })} className="input py-1.5" aria-label="Application area">
                      {!applications.includes(r.application) && <option value={r.application}>{r.application || "Choose…"}</option>}
                      {applications.map((a) => (
                        <option key={a} value={a}>{a} ({counts[a] ?? 0})</option>
                      ))}
                    </select>
                    {!r.image ? (
                      <>
                        <select value={r.pattern} onChange={(e) => setRoom(r.id, { pattern: e.target.value })} className="input py-1.5 text-xs" aria-label="Pattern">
                          {COVER_STYLES.map((s) => <option key={s.value} value={s.value}>Pattern: {s.label}</option>)}
                        </select>
                        <select value={r.color} onChange={(e) => setRoom(r.id, { color: e.target.value })} className="input py-1.5 text-xs" aria-label="Colour">
                          {COVER_COLORS.map((c) => <option key={c.value} value={c.value}>Colour: {c.label}</option>)}
                        </select>
                      </>
                    ) : (
                      <button type="button" onClick={() => setRoom(r.id, { image: "" })} className="justify-self-start text-xs text-rose-600 hover:underline sm:col-span-2">
                        Remove photo (use a drawn pattern)
                      </button>
                    )}
                    <p className={cn("text-xs sm:col-span-2", hidden ? "text-amber-600" : "text-slate-500")}>
                      {count} design{count === 1 ? "" : "s"}
                      {!r.enabled ? " · hidden" : cfg.hideEmpty && count === 0 ? " · hidden until a product uses this application area" : " · shown"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <button type="button" onClick={() => setPickFor(r.id)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100" title="Choose from the media library"><Images className="size-4" /></button>
                    <button type="button" onClick={() => setRoom(r.id, { enabled: !r.enabled })} className="rounded p-1.5 text-slate-400 hover:bg-slate-100" title={r.enabled ? "Shown — click to hide" : "Hidden — click to show"}>
                      {r.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4 text-amber-500" />}
                    </button>
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label="Move up"><ArrowUp className="size-4" /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === cfg.rooms.length - 1} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label="Move down"><ArrowDown className="size-4" /></button>
                    <button
                      type="button"
                      onClick={() => setCfg((c) => ({ ...c, rooms: c.rooms.filter((x) => x.id !== r.id) }))}
                      className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Delete area"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={cfg.rooms.length >= 24}
                onClick={() => setCfg((c) => ({ ...c, rooms: [...c.rooms, { id: uid(), name: "New area", application: applications.find((a) => !c.rooms.some((r) => r.application === a)) ?? applications[0], image: "", pattern: "paver", color: "maroon", enabled: true }] }))}
              >
                <Plus className="size-4" /> Add area
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (window.confirm("Replace this list with the standard parking areas (Car Parking, Driveway, Walkway, Rooftop, Garden & Lawn, Commercial)? Nothing is saved until you click Save.")) setCfg((c) => ({ ...c, rooms: defaultHomeRooms().rooms }));
                }}
              >
                <RotateCcw className="size-4" /> Use standard parking areas
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
              if (url) setRoom(id, { image: url });
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
            if (pickFor && u[0]) setRoom(pickFor, { image: u[0] });
            setPickFor(null);
          }}
        />
      </div>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card title="Preview">
          <div className="p-4">
            {!visible.length ? (
              <p className="rounded-lg bg-amber-50 p-4 text-center text-xs text-amber-700">No area has designs yet, so the section is hidden on the website.</p>
            ) : (
              <>
                <p className="mb-3 text-center text-xs font-semibold tracking-wide text-slate-700 uppercase">{cfg.title || "Shop by Area"}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {visible.map((r) => (
                    <div key={r.id} className="relative aspect-4/3 overflow-hidden rounded bg-slate-800">
                      {r.image ? <Img src={r.image} alt="" fill sizes="160px" className="object-cover opacity-80" /> : <PaverArt style={r.pattern} color={r.color} className="absolute inset-0 size-full" />}
                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 p-1.5 text-white">
                        <p className="truncate text-[10px] font-semibold">{r.name}</p>
                        {cfg.showCount && <p className="text-[8px] text-white/75">{counts[r.application] ?? 0} designs</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {busy && <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><Loader2 className="size-3 animate-spin" /> Uploading…</p>}
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
