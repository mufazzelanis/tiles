"use client";

import { useActionState, useEffect, useState } from "react";
import { Building2, Globe, Home, Loader2, Save, Share2 } from "lucide-react";
import { saveSettings, type FormState } from "@/app/admin/actions";
import type { Settings } from "@/lib/types";
import { cn, youtubeId } from "@/lib/utils";
import { Card } from "./ui";
import { toast } from "./Toaster";

const TABS = [
  { id: "brand", label: "Brand & contact", icon: Building2 },
  { id: "home", label: "Home page", icon: Home },
  { id: "social", label: "Social links", icon: Share2 },
  { id: "seo", label: "SEO", icon: Globe },
] as const;

export function SettingsForm({ settings, canEdit = true }: { settings: Settings; canEdit?: boolean }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("brand");
  const [state, action, pending] = useActionState<FormState, FormData>(saveSettings, {});
  const [video, setVideo] = useState(settings.videoId);

  useEffect(() => {
    if (state.ok) toast(state.message ?? "Saved");
  }, [state]);

  const input = (name: string, label: string, value: string, opts: { area?: boolean; help?: string; rows?: number } = {}) => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {opts.area ? (
        <textarea name={name} defaultValue={value} rows={opts.rows ?? 4} className="input" />
      ) : (
        <input name={name} defaultValue={value} className="input" />
      )}
      {opts.help && <span className="mt-1 block text-xs text-slate-500">{opts.help}</span>}
    </label>
  );

  // All tabs stay mounted (just hidden) so every field is submitted together.
  const panel = (id: string, children: React.ReactNode) => (
    <div hidden={tab !== id} className="space-y-5 p-6">{children}</div>
  );

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="flex gap-1 overflow-x-auto lg:flex-col">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm whitespace-nowrap transition", tab === id ? "bg-white font-medium text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white/60")}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </nav>
      <div>
        <Card>
          {panel(
            "brand",
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                {input("siteName", "Company name", settings.siteName, { help: "First word becomes the logo wordmark" })}
                {input("tagline", "Tagline", settings.tagline)}
                {input("phone", "Phone", settings.phone)}
                {input("email", "Email", settings.email)}
              </div>
              {input("corporateOffice", "Corporate office address", settings.corporateOffice, { area: true, rows: 2 })}
              {input("factory", "Factory address", settings.factory, { area: true, rows: 2 })}
              {input("aboutText", "About us text", settings.aboutText, { area: true, rows: 6, help: "Separate paragraphs with a blank line" })}
            </>,
          )}
          {panel(
            "home",
            <>
              {input("homeIntroTitle", "Intro heading", settings.homeIntroTitle)}
              {input("homeIntroText", "Intro text", settings.homeIntroText, { area: true })}
              {input("whyTitle", "“Why choose us” heading", settings.whyTitle)}
              {input("whyText", "“Why choose us” text", settings.whyText, { area: true })}
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Feature video (YouTube link or ID)</span>
                <input name="videoId" value={video} onChange={(e) => setVideo(youtubeId(e.target.value))} className="input" />
                <span className="mt-1 block text-xs text-slate-500">Leave empty to hide the video section.</span>
              </label>
              {video && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`https://i.ytimg.com/vi/${video}/mqdefault.jpg`} alt="Video thumbnail" className="w-64 rounded-lg ring-1 ring-slate-200" />
              )}
            </>,
          )}
          {panel(
            "social",
            <div className="grid gap-5 sm:grid-cols-2">
              {(Object.keys(settings.socials) as (keyof Settings["socials"])[]).map((k) => (
                <div key={k}>{input(`socials.${k}`, k[0].toUpperCase() + k.slice(1), settings.socials[k], { help: "Leave empty to hide" })}</div>
              ))}
            </div>,
          )}
          {panel(
            "seo",
            <>
              {input("seoDescription", "Meta description", settings.seoDescription, { area: true, rows: 3, help: "Shown by Google under your site name (≈155 characters)" })}
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-500">Search preview</p>
                <p className="mt-1 text-lg text-[#1a0dab]">{settings.siteName} — Premium Tiles</p>
                <p className="text-sm text-slate-600">{settings.seoDescription}</p>
              </div>
            </>,
          )}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
            {state.message && !state.ok && <p className="text-sm text-rose-600">{state.message}</p>}
            {!canEdit && <p className="mr-auto text-xs text-slate-500">You have read-only access to settings.</p>}
            <button disabled={pending || !canEdit} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-500 disabled:opacity-60">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save settings
            </button>
          </div>
        </Card>
      </div>
    </form>
  );
}
