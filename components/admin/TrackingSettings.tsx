"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import {
  Activity, AlertTriangle, BadgeCheck, CheckCircle2, ChevronDown, Eye, EyeOff, ExternalLink, FlaskConical, Globe, KeyRound,
  Loader2, RefreshCw, Save, Send, Server, ShieldCheck, XCircle,
} from "lucide-react";
import { saveTracking, sendTrackingTest, type FormState } from "@/app/admin/actions";
import type { DeliveryLog, TrackingConfig } from "@/lib/tracking";
import { cn, timeAgo } from "@/lib/utils";
import { Badge, Button, Card } from "./ui";
import { Toggle } from "./fields";
import { toast } from "./Toaster";

type Config = TrackingConfig & { tokenMask: string; hasToken: boolean };

/** What the website sends, and from where. */
const EVENTS: { name: string; when: string; browser: boolean; server: boolean; match?: boolean }[] = [
  { name: "PageView", when: "Every page visit", browser: true, server: true },
  { name: "ViewContent", when: "A product page is opened (id, name, category, price)", browser: true, server: true },
  { name: "Search", when: "Someone searches the product list", browser: true, server: true },
  { name: "CustomizeProduct", when: "A tile colour is picked", browser: true, server: true },
  { name: "AddToWishlist", when: "A product is saved to favourites", browser: true, server: true },
  { name: "InitiateCheckout", when: "The “Request a quote” popup opens", browser: true, server: true },
  { name: "Lead", when: "A quote request is sent (boxes × price, colour)", browser: true, server: true, match: true },
  { name: "Contact", when: "Contact form sent, or phone / WhatsApp / email tapped", browser: true, server: true, match: true },
  { name: "FindLocation", when: "Store locator is opened", browser: true, server: true },
  { name: "DownloadCatalogue", when: "A PDF catalogue is downloaded (custom event)", browser: true, server: true },
];

export function TrackingSettings({ config, log, stats, canEdit }: {
  config: Config;
  log: DeliveryLog[];
  stats: { sent: number; failed: number; since: string };
  canEdit: boolean;
}) {
  const router = useRouter();
  const [state, action, saving] = useActionState<FormState, FormData>(saveTracking, {});
  const [testing, startTest] = useTransition();
  const [refreshing, startRefresh] = useTransition();
  const [showToken, setShowToken] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [enabled, setEnabled] = useState(config.enabled);

  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? "Saved");
      router.refresh();
    } else if (state.message && !state.errors) toast(state.message, "error");
  }, [state, router]);

  const live = config.enabled && !!config.pixelId;
  const capiLive = live && config.capiEnabled && config.hasToken;
  const lastError = log.find((l) => !l.ok);
  const err = state.errors ?? {};

  const runTest = () =>
    startTest(async () => {
      const r = await sendTrackingTest();
      toast(r.message ?? "Done", r.ok ? "success" : "error");
      router.refresh();
    });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-6">
        {/* status */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatusTile icon={Globe} label="Browser Pixel" ok={live} text={live ? `Pixel ${config.pixelId}` : config.pixelId ? "Turned off" : "Not set up"} />
          <StatusTile icon={Server} label="Conversions API" ok={capiLive} text={capiLive ? "Server events on" : !config.hasToken ? "No access token" : "Turned off"} />
          <StatusTile
            icon={FlaskConical}
            label="Mode"
            ok={!config.testEventCode}
            warn={!!config.testEventCode}
            text={config.testEventCode ? `Test mode · ${config.testEventCode}` : "Live"}
          />
        </div>
        {config.testEventCode && (
          <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            Test event code is set, so server events only show under <b className="font-semibold">Test events</b> and don&apos;t count for ads. Clear it when you&apos;re done testing.
          </p>
        )}

        <form action={action}>
          <Card>
            <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Connection</h2>
                <p className="text-xs text-slate-500">From Meta Events Manager → Data sources → your Pixel → Settings.</p>
              </div>
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                {enabled ? "On" : "Off"}
                <Toggle name="enabled" defaultChecked={config.enabled} onChange={() => setEnabled((v) => !v)} />
              </label>
            </header>
            <fieldset disabled={!canEdit} className="space-y-5 p-6">
              <Field label="Pixel ID (Dataset ID)" error={err.pixelId} help="Numbers only, e.g. 1234567890123456">
                <input name="pixelId" defaultValue={config.pixelId} inputMode="numeric" placeholder="1234567890123456" aria-invalid={!!err.pixelId} className="input font-mono" />
              </Field>

              <Field
                label="Conversions API access token"
                error={err.accessToken}
                help={config.hasToken ? "Saved and hidden. Paste a new token to replace it, or leave empty to keep it." : "Events Manager → Settings → Conversions API → Generate access token."}
              >
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    name="accessToken"
                    type={showToken ? "text" : "password"}
                    autoComplete="off"
                    placeholder={config.hasToken ? config.tokenMask : "EAAG…"}
                    aria-invalid={!!err.accessToken}
                    className="input pr-10 pl-9 font-mono"
                  />
                  <button type="button" onClick={() => setShowToken((s) => !s)} className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-700" aria-label={showToken ? "Hide" : "Show"}>
                    {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {config.hasToken && (
                  <label className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <input type="checkbox" name="clearToken" className="accent-primary-600" /> Remove the saved token
                  </label>
                )}
              </Field>

              <Field label="Test event code" help="Optional. Copy it from Events Manager → Test events to watch server events arrive live. Clear it to go live.">
                <input name="testEventCode" defaultValue={config.testEventCode} placeholder="TEST12345" className="input font-mono uppercase" />
              </Field>

              <div className="space-y-3 rounded-lg border border-slate-200 p-4">
                <label className="flex cursor-pointer items-center justify-between gap-4">
                  <span>
                    <span className="block text-sm font-medium text-slate-800">Send events from the server (Conversions API)</span>
                    <span className="block text-xs text-slate-500">Recovers events lost to ad blockers and iOS privacy; adds hashed phone / email for better matching.</span>
                  </span>
                  <Toggle name="capiEnabled" defaultChecked={config.capiEnabled} />
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-4 border-t border-slate-100 pt-3">
                  <span>
                    <span className="block text-sm font-medium text-slate-800">Include page views on the server</span>
                    <span className="block text-xs text-slate-500">Turn off to send only meaningful events (product views, leads…) from the server.</span>
                  </span>
                  <Toggle name="capiPageViews" defaultChecked={config.capiPageViews} />
                </label>
              </div>

              <div>
                <button type="button" onClick={() => setAdvanced((a) => !a)} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800">
                  <ChevronDown className={cn("size-3.5 transition", advanced && "rotate-180")} /> Advanced
                </button>
                <div hidden={!advanced} className="mt-3">
                  <Field label="Graph API version" error={err.apiVersion} help="Only change if Meta asks you to.">
                    <input name="apiVersion" defaultValue={config.apiVersion} className="input w-40 font-mono" />
                  </Field>
                </div>
              </div>
            </fieldset>
            <footer className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              {config.updatedAt && <span className="text-xs text-slate-400">Saved {timeAgo(config.updatedAt)}</span>}
              <span className="flex-1" />
              {canEdit && (
                <>
                  <Button type="button" variant="secondary" disabled={testing || !config.hasToken || !config.pixelId} onClick={runTest} title={!config.hasToken ? "Save a Pixel ID and token first" : undefined}>
                    {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send test event
                  </Button>
                  <Button disabled={saving}>
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
                  </Button>
                </>
              )}
              {!canEdit && <span className="text-xs text-slate-500">Read-only — you can&apos;t change settings.</span>}
            </footer>
          </Card>
        </form>

        {/* what gets tracked */}
        <Card title="What is tracked" action={<span className="text-xs text-slate-500">De-duplicated with a shared event ID</span>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-500 uppercase">
                  <th className="px-5 py-2.5 font-medium">Event</th>
                  <th className="px-3 py-2.5 font-medium">When</th>
                  <th className="px-3 py-2.5 text-center font-medium">Browser</th>
                  <th className="px-3 py-2.5 text-center font-medium">Server</th>
                </tr>
              </thead>
              <tbody>
                {EVENTS.map((e) => (
                  <tr key={e.name} className="border-b border-slate-50">
                    <td className="px-5 py-2.5 font-mono text-[13px] text-slate-900">
                      {e.name}
                      {e.match && <Badge tone="green" className="ml-2 font-sans">+ phone / email match</Badge>}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{e.when}</td>
                    <td className="px-3 py-2.5 text-center"><CheckCircle2 className="mx-auto size-4 text-emerald-500" /></td>
                    <td className="px-3 py-2.5 text-center">
                      {e.name === "PageView" && !config.capiPageViews ? <span className="text-xs text-slate-400">off</span> : <CheckCircle2 className="mx-auto size-4 text-emerald-500" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* delivery log */}
      <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
        <Card
          title="Server deliveries"
          action={
            <button onClick={() => startRefresh(() => router.refresh())} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Refresh">
              <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            </button>
          }
        >
          <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 text-center">
            <div className="p-3">
              <p className="text-xl font-semibold text-emerald-600 tabular-nums">{stats.sent}</p>
              <p className="text-[11px] text-slate-500">accepted by Meta</p>
            </div>
            <div className="p-3">
              <p className={cn("text-xl font-semibold tabular-nums", stats.failed ? "text-rose-600" : "text-slate-400")}>{stats.failed}</p>
              <p className="text-[11px] text-slate-500">failed</p>
            </div>
          </div>
          {lastError && (
            <p className="flex items-start gap-2 border-b border-rose-100 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
              <XCircle className="mt-0.5 size-3.5 shrink-0" /> <span><b>Last error:</b> {lastError.error}</span>
            </p>
          )}
          {log.length ? (
            <ul className="scroll-thin max-h-[480px] divide-y divide-slate-50 overflow-y-auto">
              {log.map((l) => (
                <li key={`${l.eventId}-${l.at}`} className="flex items-start gap-3 px-4 py-2.5">
                  {l.ok ? <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-rose-500" />}
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-slate-900">{l.event}</span>
                      {l.test && <Badge tone="amber">test</Badge>}
                    </p>
                    <p className="truncate text-[11px] text-slate-500" title={l.error ?? l.matchKeys.join(", ")}>
                      {l.ok ? `match: ${l.matchKeys.join(", ") || "none"}` : l.error}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(l.at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <Activity className="size-6 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No server events since the app started.</p>
              <p className="text-xs text-slate-400">They appear here as visitors browse.</p>
            </div>
          )}
          <p className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-400">Shows the last 60 deliveries since the server last restarted.</p>
        </Card>

        <Card title="Setup checklist">
          <ol className="space-y-3 p-5 text-sm">
            {[
              { done: !!config.pixelId, text: "Add your Pixel ID" },
              { done: config.hasToken, text: "Generate & paste a Conversions API token" },
              { done: config.enabled, text: "Turn tracking on and save" },
              { done: log.some((l) => l.ok), text: "Send a test event — it should say “accepted”" },
              { done: !config.testEventCode && log.some((l) => l.ok && !l.test), text: "Clear the test code to go live" },
            ].map((s, i) => (
              <li key={s.text} className="flex items-center gap-3">
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold", s.done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500")}>
                  {s.done ? <CheckCircle2 className="size-4" /> : i + 1}
                </span>
                <span className={s.done ? "text-slate-500 line-through" : "text-slate-800"}>{s.text}</span>
              </li>
            ))}
          </ol>
          <div className="space-y-1.5 border-t border-slate-100 px-5 py-4 text-xs">
            <a href="https://business.facebook.com/events_manager2" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-medium text-primary-600 hover:underline">
              <ExternalLink className="size-3.5" /> Open Meta Events Manager
            </a>
            <p className="flex items-start gap-1.5 text-slate-500">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" /> Phone, email and names are SHA-256 hashed on the server before they are sent. The token is never shown to visitors.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatusTile({ icon: Icon, label, ok, warn, text }: { icon: typeof Globe; label: string; ok: boolean; warn?: boolean; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", warn ? "bg-amber-50 text-amber-600" : ok ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400")}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className={cn("truncate text-sm font-semibold", warn ? "text-amber-700" : ok ? "text-emerald-700" : "text-slate-700")}>{text}</p>
      </div>
    </div>
  );
}

function Field({ label, error, help, children }: { label: string; error?: string; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : help && <p className="mt-1 text-xs text-slate-500">{help}</p>}
    </div>
  );
}
