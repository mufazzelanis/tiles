"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ExternalLink, Eye, Images, Loader2, Lock, Save, SlidersHorizontal } from "lucide-react";
import { saveResource, type FormState } from "@/app/admin/actions";
import { getResource, type FieldDef, type ResourceKey } from "@/lib/resources";
import { cn, formatDate, slugify } from "@/lib/utils";
import { Card } from "./ui";
import { ImageField, ImagesField, Toggle } from "./fields";
import { LivePreview, SearchPreview } from "./LivePreview";

type Values = Record<string, unknown>;

export function ResourceForm({
  resourceKey,
  id,
  initial,
  categories,
  siteName,
  readOnly = false,
}: {
  resourceKey: ResourceKey;
  id: string | null;
  initial: Values;
  categories: { value: string; label: string }[];
  siteName: string;
  readOnly?: boolean;
}) {
  const def = getResource(resourceKey)!;
  const [state, action, pending] = useActionState<FormState, FormData>(saveResource, {});
  const [dirty, setDirty] = useState(false);
  const slugField = def.fields.find((f) => f.type === "slug");
  const [slug, setSlug] = useState(String(initial.slug ?? ""));
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const formRef = useRef<HTMLFormElement>(null);
  const [live, setLive] = useState<Values>(initial);

  /** Re-read the whole form after React has committed (hidden inputs from image pickers update on render). */
  const touch = () => {
    setDirty(true);
    setTimeout(() => {
      const form = formRef.current;
      if (!form) return;
      const fd = new FormData(form);
      const next: Values = {};
      for (const fld of def.fields) {
        next[fld.name] = fld.type === "images" || fld.type === "multiselect" ? fd.getAll(fld.name) : fld.type === "boolean" ? fd.get(fld.name) === "on" : fd.get(fld.name);
      }
      setLive(next);
    }, 0);
  };

  // Ctrl/⌘+S saves
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!readOnly) formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [readOnly]);

  // warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty || pending) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty, pending]);

  const err = (f: FieldDef) => state.errors?.[f.name];
  const optionsFor = (f: FieldDef) => (f.source === "categories" ? categories : (f.options ?? []).map((o) => ({ value: o, label: o })));

  const control = (f: FieldDef) => {
    const v = initial[f.name];
    const common = { name: f.name, "aria-invalid": !!err(f), onChange: touch, className: "input" };
    switch (f.type) {
      case "textarea":
        return <textarea {...common} defaultValue={String(v ?? "")} rows={f.name === "content" ? 10 : 4} placeholder={f.placeholder} />;
      case "number":
        return <input {...common} type="number" step="any" min={f.min} defaultValue={Number(v ?? 0)} />;
      case "date":
        return <input {...common} type="date" defaultValue={String(v || new Date().toISOString()).slice(0, 10)} />;
      case "select":
        return (
          <select {...common} defaultValue={String(v ?? "")}>
            <option value="">Select…</option>
            {optionsFor(f).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      case "multiselect": {
        const selected = (v as string[]) ?? [];
        return (
          <div className="flex flex-wrap gap-2">
            {optionsFor(f).map((o) => (
              <label key={o.value} className="cursor-pointer">
                <input type="checkbox" name={f.name} value={o.value} defaultChecked={selected.includes(o.value)} onChange={touch} className="peer sr-only" />
                <span className="inline-block rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition peer-checked:border-primary-600 peer-checked:bg-primary-600 peer-checked:text-white hover:border-slate-300">
                  {o.label}
                </span>
              </label>
            ))}
          </div>
        );
      }
      case "image":
        return <ImageField name={f.name} defaultValue={String(v ?? "")} invalid={!!err(f)} onChange={touch} />;
      case "file":
        return <ImageField name={f.name} kind="file" defaultValue={String(v ?? "")} invalid={!!err(f)} onChange={touch} />;
      case "images":
        return <ImagesField name={f.name} defaultValue={(v as string[]) ?? []} invalid={!!err(f)} onChange={touch} />;
      case "slug":
        return (
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 focus-within:border-primary-500">
            <span className="pl-3 text-sm text-slate-400">/</span>
            <input
              name={f.name}
              value={slug}
              onChange={(e) => (setSlug(slugify(e.target.value)), setSlugTouched(true), touch())}
              placeholder="auto-generated"
              className="w-full bg-transparent px-1.5 py-2 text-sm text-slate-700 focus:outline-none"
            />
          </div>
        );
      default:
        return (
          <input
            {...common}
            defaultValue={String(v ?? "")}
            placeholder={f.placeholder}
            onChange={(e) => {
              touch();
              if (slugField?.from === f.name && !slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        );
    }
  };

  const fieldBlock = (f: FieldDef) =>
    f.type === "boolean" ? (
      <label key={f.name} className="flex cursor-pointer items-center justify-between gap-4 py-1">
        <span>
          <span className="block text-sm font-medium text-slate-800">{f.label}</span>
          {f.help && <span className="block text-xs text-slate-500">{f.help}</span>}
        </span>
        <Toggle name={f.name} defaultChecked={id ? Boolean(initial[f.name]) : f.name === "active"} onChange={touch} />
      </label>
    ) : (
      <div key={f.name} className={cn(f.full && "sm:col-span-2")}>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          {f.label} {f.required && <span className="text-rose-500">*</span>}
        </label>
        {control(f)}
        {err(f) ? <p className="mt-1 text-xs text-rose-600">{err(f)}</p> : f.help && <p className="mt-1 text-xs text-slate-500">{f.help}</p>}
      </div>
    );

  const isMedia = (f: FieldDef) => ["image", "images", "file"].includes(f.type);
  const main = def.fields.filter((f) => !f.side && f.type !== "boolean" && !isMedia(f));
  const media = def.fields.filter((f) => isMedia(f));
  const hasPreview = def.fields.some((f) => f.type === "image" || f.type === "images") || def.key === "stores";
  const catName = categories.find((c) => c.value === String(live.categoryId ?? ""))?.label;
  const seoPath = def.publicPath ? def.publicPath.replace(":slug", slug || "…") : null;
  const side = def.fields.filter((f) => f.side || f.type === "boolean");
  const publicUrl = id && def.publicPath ? def.publicPath.replace(":slug", slug) : null;

  return (
    <form ref={formRef} action={action} onSubmit={() => setDirty(false)} onChange={touch}>
      <input type="hidden" name="__resource" value={resourceKey} />
      <input type="hidden" name="__id" value={id ?? ""} />
      {state.message && !state.ok && (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{state.message}</p>
      )}
      {readOnly && (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <Lock className="size-4" /> You have view-only access to {def.label.toLowerCase()}. Ask an administrator if you need to make changes.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <fieldset disabled={readOnly} className="min-w-0 space-y-6 disabled:opacity-90">
          <Card>
            <header className="flex items-center gap-2 border-b border-slate-100 px-6 py-3.5">
              <SlidersHorizontal className="size-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Details</h2>
            </header>
            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">{main.map(fieldBlock)}</div>
          </Card>
          {media.length > 0 && (
            <Card>
              <header className="flex items-center gap-2 border-b border-slate-100 px-6 py-3.5">
                <Images className="size-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900">Media</h2>
              </header>
              <div className="grid gap-5 p-5 sm:p-6">{media.map((f) => fieldBlock({ ...f, full: true }))}</div>
            </Card>
          )}
        </fieldset>
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card title="Publish">
            <div className="space-y-3 p-5">
              <fieldset disabled={readOnly} className="space-y-3">{side.map(fieldBlock)}</fieldset>
              <button
                hidden={readOnly}
                disabled={pending}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-500 disabled:opacity-60"
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {id ? "Save changes" : `Create ${def.singular.toLowerCase()}`}
              </button>
              <Link href={`/admin/${def.key}`} className="block text-center text-sm text-slate-500 hover:text-slate-800">Cancel</Link>
              {dirty ? (
                <p className="flex items-center justify-center gap-1.5 text-xs text-amber-600"><span className="size-1.5 animate-pulse rounded-full bg-amber-500" /> Unsaved changes</p>
              ) : (
                <p className="text-center text-[11px] text-slate-400">Tip: <kbd className="rounded border border-slate-200 px-1">Ctrl S</kbd> saves</p>
              )}
            </div>
          </Card>
          {hasPreview && (
            <Card>
              <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Eye className="size-4 text-slate-400" /> Live preview</h2>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">updates as you type</span>
              </header>
              <div className="p-4"><LivePreview def={def} values={live} categoryName={catName} /></div>
            </Card>
          )}
          {seoPath && (
            <Card title="Search engine preview">
              <div className="p-5">
                <SearchPreview
                  siteName={siteName}
                  path={seoPath}
                  title={String(live[def.titleField] ?? "")}
                  description={String(live.excerpt ?? live.description ?? "").slice(0, 160)}
                />
              </div>
            </Card>
          )}
          {id && (
            <Card>
              <dl className="space-y-2 p-5 text-xs">
                <div className="flex justify-between"><dt className="text-slate-500">Created</dt><dd className="text-slate-800">{formatDate(String(initial.createdAt ?? ""))}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Last updated</dt><dd className="text-slate-800">{formatDate(String(initial.updatedAt ?? ""))}</dd></div>
                {"views" in initial && <div className="flex justify-between"><dt className="text-slate-500">Views</dt><dd className="text-slate-800">{String(initial.views)}</dd></div>}
                {publicUrl && (
                  <a href={publicUrl} target="_blank" className="mt-2 flex items-center gap-1.5 font-medium text-primary-600 hover:underline">
                    <ExternalLink className="size-3.5" /> View on website
                  </a>
                )}
              </dl>
            </Card>
          )}
        </div>
      </div>
    </form>
  );
}
