"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowDown, ArrowUp, Calendar, CheckSquare, ChevronDown, CircleDot, Columns3, ExternalLink, Eye, EyeOff, FormInput, Hash,
  Heart, Images, Loader2, Lock, Mail, Megaphone, Menu, MessageCircle, PanelBottom, PanelTop, Phone, Plus, RotateCcw, Save,
  Search, SquareMenu, Trash2, Type, Upload, X,
} from "lucide-react";
import Img from "@/components/Img";
import { NavIcon } from "@/components/NavIcon";
import { saveSiteLayout } from "@/app/admin/actions";
import {
  defaultLayout, fillTokens, ICON_KEYS, type FooterColumn, type FormField, type FormFieldType, type IconKey, type NavLink, type SiteLayout,
} from "@/lib/site-layout";
import { cn, timeAgo } from "@/lib/utils";
import { Badge, Button, Card } from "./ui";
import { MediaPicker } from "./MediaPicker";
import { toast } from "./Toaster";
import { uploadFiles } from "./upload";

type Site = { name: string; tagline: string; phone: string; email: string; office: string; factory: string };
type Page = { href: string; label: string };

const TABS = [
  { id: "header", label: "Header", icon: PanelTop },
  { id: "menu", label: "Mobile menu", icon: SquareMenu },
  { id: "footer", label: "Footer", icon: PanelBottom },
  { id: "form", label: "Contact form", icon: FormInput },
  { id: "whatsapp", label: "WhatsApp button", icon: MessageCircle },
] as const;
type Tab = (typeof TABS)[number]["id"];

const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const newLink = (): NavLink => ({ id: uid("l"), label: "New link", href: "/", icon: "none", badge: "", newTab: false, enabled: true });

export function LayoutEditor({ initial, pages, site, canEdit, initialTab }: { initial: SiteLayout; pages: Page[]; site: Site; canEdit: boolean; initialTab?: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.id === initialTab) ? (initialTab as Tab) : "header");
  const [layout, setLayout] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, start] = useTransition();
  const dirty = JSON.stringify(layout) !== saved;
  const formRef = useRef<HTMLDivElement>(null);

  const save = () =>
    start(async () => {
      const r = await saveSiteLayout(JSON.stringify(layout));
      toast(r.message ?? "Saved", r.ok ? "success" : "error");
      if (r.ok) {
        setSaved(JSON.stringify(layout));
        setSavedAt(new Date().toISOString());
        router.refresh();
      }
    });

  // Ctrl/⌘+S saves; warn before leaving with unsaved changes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (canEdit && dirty) save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => dirty && e.preventDefault();
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  });

  const up = <K extends keyof SiteLayout>(k: K, patch: Partial<SiteLayout[K]>) => setLayout((l) => ({ ...l, [k]: { ...l[k], ...patch } }));
  const resetTab = () => {
    const d = defaultLayout();
    if (tab === "header") up("header", { ...d.header, drawer: layout.header.drawer });
    if (tab === "menu") up("header", { drawer: d.header.drawer });
    if (tab === "footer") setLayout((l) => ({ ...l, footer: d.footer }));
    if (tab === "form") setLayout((l) => ({ ...l, contactForm: d.contactForm }));
    if (tab === "whatsapp") setLayout((l) => ({ ...l, floating: d.floating }));
    toast("Defaults restored — press Save to apply");
  };

  const h = layout.header;
  const f = layout.footer;

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="flex gap-1 overflow-x-auto lg:sticky lg:top-24 lg:flex-col lg:self-start">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => (setTab(id), router.replace(`/admin/settings/layout?tab=${id}`, { scroll: false }))}
            className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm whitespace-nowrap transition", tab === id ? "bg-white font-medium text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white/60")}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
        <a href={tab === "form" ? "/contact" : "/"} target="_blank" className="mt-2 hidden items-center gap-1.5 px-3 text-xs font-medium text-primary-600 hover:underline lg:flex">
          <ExternalLink className="size-3.5" /> View on website
        </a>
      </nav>

      <div ref={formRef} className="min-w-0 space-y-6">
        {!canEdit && (
          <p className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            <Lock className="size-4" /> You have view-only access to settings.
          </p>
        )}

        <fieldset disabled={!canEdit} className="min-w-0 space-y-6">
          {/* ------------------------------------------------------------ header */}
          {tab === "header" && (
            <>
              <Preview label="Header preview">
                <HeaderPreview layout={layout} site={site} />
              </Preview>

              <Section icon={Megaphone} title="Announcement bar" hint="A thin strip above the header for offers or notices." toggle={{ on: h.announcement.enabled, set: (v) => up("header", { announcement: { ...h.announcement, enabled: v } }) }}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Text label="Message" value={h.announcement.text} onChange={(v) => up("header", { announcement: { ...h.announcement, text: v } })} full />
                  <Text label="Link text" value={h.announcement.linkLabel} onChange={(v) => up("header", { announcement: { ...h.announcement, linkLabel: v } })} placeholder="Shop now" />
                  <Href label="Link" value={h.announcement.href} pages={pages} onChange={(v) => up("header", { announcement: { ...h.announcement, href: v } })} />
                  <ColorInput label="Background" value={h.announcement.background} onChange={(v) => up("header", { announcement: { ...h.announcement, background: v } })} />
                  <ColorInput label="Text colour" value={h.announcement.color} onChange={(v) => up("header", { announcement: { ...h.announcement, color: v } })} />
                </div>
              </Section>

              <Section icon={Menu} title="Menu — left of the logo" hint="Shown on desktop. Up to 8 links.">
                <LinksEditor links={h.leftLinks} onChange={(v) => up("header", { leftLinks: v })} pages={pages} max={8} icons badges />
              </Section>
              <Section icon={Menu} title="Menu — right of the logo" hint="Shown on desktop. Badges appear under the link (e.g. “Try now”).">
                <LinksEditor links={h.rightLinks} onChange={(v) => up("header", { rightLinks: v })} pages={pages} max={8} icons badges />
              </Section>

              <Section icon={Images} title="Logo" hint="Leave empty to use the built-in Urban Distribution Hub logo.">
                <div className="grid gap-5 sm:grid-cols-2">
                  <LogoPicker label="Round seal (header & footer)" value={h.logoSeal} onChange={(v) => up("header", { logoSeal: v })} round />
                  <LogoPicker label="White mark (phones & scrolled header)" value={h.logoMark} onChange={(v) => up("header", { logoMark: v })} dark />
                </div>
              </Section>

              <Section icon={Search} title="Search & icons">
                <div className="space-y-3">
                  <Switch label="Show the favourites (heart) button" checked={h.showFavorites} onChange={(v) => up("header", { showFavorites: v })} />
                  <Switch label="Show the search button" checked={h.showSearch} onChange={(v) => up("header", { showSearch: v })} />
                </div>
                {h.showSearch && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Text label="Search title" value={h.searchTitle} onChange={(v) => up("header", { searchTitle: v })} />
                    <Text label="Search placeholder" value={h.searchPlaceholder} onChange={(v) => up("header", { searchPlaceholder: v })} />
                    <Tags label="Suggested searches" value={h.searchSuggestions} onChange={(v) => up("header", { searchSuggestions: v })} full />
                  </div>
                )}
              </Section>
            </>
          )}

          {/* ------------------------------------------------------- mobile menu */}
          {tab === "menu" && (
            <>
              <Section icon={SquareMenu} title="Slide-out menu" hint="Opens from the ☰ button (all screens) — the main menu on phones.">
                <div className="space-y-3">
                  <Switch label="Show product categories at the top" checked={h.drawer.showCollections} onChange={(v) => up("header", { drawer: { ...h.drawer, showCollections: v } })} />
                  {h.drawer.showCollections && (
                    <Text label="Categories heading" value={h.drawer.collectionsTitle} onChange={(v) => up("header", { drawer: { ...h.drawer, collectionsTitle: v } })} />
                  )}
                  <Text label="Links heading" value={h.drawer.linksTitle} onChange={(v) => up("header", { drawer: { ...h.drawer, linksTitle: v } })} />
                </div>
              </Section>
              <Section icon={Menu} title="Menu links">
                <LinksEditor links={h.drawer.links} onChange={(v) => up("header", { drawer: { ...h.drawer, links: v } })} pages={pages} max={30} icons badges />
              </Section>
              <Section icon={Phone} title="Buttons at the bottom" hint={`Use the phone number from Brand settings (${site.phone || "not set"}).`}>
                <div className="space-y-3">
                  <Switch label="“Call us” button" checked={h.drawer.showCall} onChange={(v) => up("header", { drawer: { ...h.drawer, showCall: v } })} />
                  <Switch label="WhatsApp button" checked={h.drawer.showWhatsApp} onChange={(v) => up("header", { drawer: { ...h.drawer, showWhatsApp: v } })} />
                </div>
              </Section>
            </>
          )}

          {/* ------------------------------------------------------------ footer */}
          {tab === "footer" && (
            <>
              <Preview label="Footer preview">
                <FooterPreview layout={layout} site={site} />
              </Preview>

              <Section icon={PanelBottom} title="Brand column">
                <div className="space-y-3">
                  <Switch label="Show the round logo" checked={f.showLogo} onChange={(v) => up("footer", { showLogo: v })} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Text label="Title" value={f.title} placeholder={site.name} onChange={(v) => up("footer", { title: v })} help="Empty = company name" />
                    <Text label="Subtitle" value={f.subtitle} placeholder={site.tagline} onChange={(v) => up("footer", { subtitle: v })} help="Empty = tagline" />
                    <Text label="Short text (optional)" value={f.about} onChange={(v) => up("footer", { about: v })} area full />
                  </div>
                  <Switch label="Show social icons" checked={f.showSocial} onChange={(v) => up("footer", { showSocial: v })} hint="Links come from Settings → Social links" />
                  {f.showSocial && <Text label="Social heading" value={f.socialTitle} onChange={(v) => up("footer", { socialTitle: v })} />}
                  <Switch label="Show phone number" checked={f.showPhone} onChange={(v) => up("footer", { showPhone: v })} />
                  <Switch label="Show email" checked={f.showEmail} onChange={(v) => up("footer", { showEmail: v })} />
                </div>
              </Section>

              <Section icon={Columns3} title="Link columns" hint="Up to 5 columns. Drag-free ordering with the arrows.">
                <ColumnsEditor columns={f.columns} onChange={(v) => up("footer", { columns: v })} pages={pages} />
              </Section>

              <Section icon={Type} title="Address / info blocks" hint="Use {office} and {factory} to insert the addresses from Brand settings.">
                <div className="space-y-3">
                  {f.infoBlocks.map((b, i) => (
                    <div key={b.id} className={cn("rounded-lg border border-slate-200 p-3", !b.enabled && "opacity-60")}>
                      <div className="flex items-center gap-2">
                        <input value={b.title} onChange={(e) => up("footer", { infoBlocks: f.infoBlocks.map((x) => (x.id === b.id ? { ...x, title: e.target.value } : x)) })} placeholder="Heading" className="input flex-1 font-medium" />
                        <RowActions
                          enabled={b.enabled}
                          onToggle={() => up("footer", { infoBlocks: f.infoBlocks.map((x) => (x.id === b.id ? { ...x, enabled: !x.enabled } : x)) })}
                          onUp={i > 0 ? () => up("footer", { infoBlocks: move(f.infoBlocks, i, -1) }) : undefined}
                          onDown={i < f.infoBlocks.length - 1 ? () => up("footer", { infoBlocks: move(f.infoBlocks, i, 1) }) : undefined}
                          onDelete={() => up("footer", { infoBlocks: f.infoBlocks.filter((x) => x.id !== b.id) })}
                        />
                      </div>
                      <textarea value={b.text} rows={2} onChange={(e) => up("footer", { infoBlocks: f.infoBlocks.map((x) => (x.id === b.id ? { ...x, text: e.target.value } : x)) })} className="input mt-2" />
                    </div>
                  ))}
                  {f.infoBlocks.length < 4 && (
                    <Button type="button" variant="secondary" onClick={() => up("footer", { infoBlocks: [...f.infoBlocks, { id: uid("b"), title: "Showroom", text: "", enabled: true }] })}>
                      <Plus className="size-4" /> Add block
                    </Button>
                  )}
                </div>
              </Section>

              <Section icon={Type} title="Bottom bar">
                <Text label="Copyright text" value={f.copyright} onChange={(v) => up("footer", { copyright: v })} help={`{year} and {site} are filled in → “${fillTokens(f.copyright, site.name)}”`} />
                <p className="mt-5 mb-2 text-sm font-medium text-slate-700">Bottom links</p>
                <LinksEditor links={f.bottomLinks} onChange={(v) => up("footer", { bottomLinks: v })} pages={pages} max={6} />
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <ColorInput label="Background colour" value={f.background || "#4d0205"} onChange={(v) => up("footer", { background: v })} onReset={f.background ? () => up("footer", { background: "" }) : undefined} />
                </div>
                <div className="mt-4">
                  <Switch label="“Back to top” button" checked={f.showBackToTop} onChange={(v) => up("footer", { showBackToTop: v })} />
                </div>
              </Section>
            </>
          )}

          {/* ------------------------------------------------------ contact form */}
          {tab === "form" && <FormEditor layout={layout} setLayout={setLayout} />}

          {/* ------------------------------------------------------ whatsapp */}
          {tab === "whatsapp" && (
            <Section icon={MessageCircle} title="Floating WhatsApp button" hint="The green chat button in the corner of every page." toggle={{ on: layout.floating.whatsapp, set: (v) => up("floating", { whatsapp: v }) }}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="WhatsApp number" value={layout.floating.whatsappNumber} placeholder={site.phone} onChange={(v) => up("floating", { whatsappNumber: v })} help="Empty = phone from Brand settings. Include the country code (880…)." />
                <Text label="Hover label" value={layout.floating.whatsappLabel} onChange={(v) => up("floating", { whatsappLabel: v })} />
                <Text label="Pre-filled message" value={layout.floating.whatsappMessage} onChange={(v) => up("floating", { whatsappMessage: v })} area full />
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-lg bg-slate-50 p-4">
                <span className="grid size-12 place-items-center rounded-full bg-[#25D366] text-white shadow-lg"><MessageCircle className="size-6" /></span>
                <span className="text-sm text-slate-600">
                  Opens <span className="font-mono text-xs">wa.me/{(layout.floating.whatsappNumber || site.phone).replace(/\D/g, "") || "…"}</span>
                  {layout.floating.whatsappMessage && <> with “{layout.floating.whatsappMessage}”</>}
                </span>
              </div>
            </Section>
          )}
        </fieldset>

        {/* sticky save bar */}
        {canEdit && (
          <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
            <Button type="button" variant="ghost" onClick={resetTab}>
              <RotateCcw className="size-4" /> Reset this tab
            </Button>
            <span className="flex-1" />
            {dirty ? (
              <span className="flex items-center gap-1.5 text-xs text-amber-600"><span className="size-1.5 animate-pulse rounded-full bg-amber-500" /> Unsaved changes</span>
            ) : (
              <span className="text-xs text-slate-400">{savedAt ? `Saved ${timeAgo(savedAt)}` : "All changes saved"} · <kbd className="rounded border border-slate-200 px-1">Ctrl S</kbd></span>
            )}
            {dirty && (
              <Button type="button" variant="secondary" onClick={() => setLayout(JSON.parse(saved))}>
                Discard
              </Button>
            )}
            <Button type="button" onClick={save} disabled={saving || !dirty}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save changes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const move = <T,>(list: T[], i: number, d: number) => {
  const n = [...list];
  const j = i + d;
  if (j < 0 || j >= n.length) return list;
  [n[i], n[j]] = [n[j], n[i]];
  return n;
};

/* --------------------------------------------------------------- previews */

function Preview({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card>
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Eye className="size-4 text-slate-400" /> {label}</h2>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">updates as you edit</span>
      </header>
      <div className="overflow-x-auto p-4">{children}</div>
    </Card>
  );
}

function HeaderPreview({ layout, site }: { layout: SiteLayout; site: Site }) {
  const h = layout.header;
  const item = (l: NavLink) => (
    <span key={l.id} className="relative flex items-center gap-1 whitespace-nowrap">
      <NavIcon name={l.icon} className="size-3" /> {l.label}
      {l.badge && <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-sm bg-[#4d0205] px-1 text-[7px]">{l.badge}</span>}
    </span>
  );
  return (
    <div className="min-w-[640px] overflow-hidden rounded-lg">
      {h.announcement.enabled && h.announcement.text && (
        <div className="px-3 py-1 text-center text-[10px] font-medium" style={{ background: h.announcement.background, color: h.announcement.color }}>
          {h.announcement.text} {h.announcement.linkLabel && <u>{h.announcement.linkLabel} →</u>}
        </div>
      )}
      <div className="flex h-11 items-stretch bg-[#1d1213] text-[10px] text-white">
        <span className="grid w-9 place-items-center border-r border-white/15"><Menu className="size-3.5" /></span>
        <div className="flex flex-1 items-center gap-3 px-3">{h.leftLinks.filter((l) => l.enabled).map(item)}</div>
        <span className="relative w-24 shrink-0">
          <span className="absolute top-1 left-1/2 grid size-14 -translate-x-1/2 place-items-center overflow-hidden rounded-full bg-[#f8f2e9] ring-2 ring-[#c49a45]/70">
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny preview */}
            <img src={h.logoSeal || "/brand/udh-logo.png"} alt="" className="size-full object-cover" />
          </span>
        </span>
        <div className="flex flex-1 items-center justify-end gap-3 px-3">{h.rightLinks.filter((l) => l.enabled).map(item)}</div>
        {h.showFavorites && <span className="grid w-9 place-items-center border-l border-white/15"><Heart className="size-3.5" /></span>}
        {h.showSearch && <span className="grid w-9 place-items-center border-l border-white/15"><Search className="size-3.5" /></span>}
      </div>
      <div className="h-8 bg-slate-100" title={site.name} />
    </div>
  );
}

function FooterPreview({ layout, site }: { layout: SiteLayout; site: Site }) {
  const f = layout.footer;
  const cols = f.columns.filter((c) => c.enabled);
  const blocks = f.infoBlocks.filter((b) => b.enabled);
  return (
    <div className="min-w-[640px] rounded-lg p-5 text-white" style={{ background: f.background || "#4d0205" }}>
      <div className="grid gap-4" style={{ gridTemplateColumns: `1.5fr ${cols.map(() => "1fr").join(" ")} ${blocks.length ? "1.1fr" : ""}` }}>
        <div>
          <div className="flex items-center gap-2">
            {f.showLogo && (
              // eslint-disable-next-line @next/next/no-img-element -- tiny preview
              <img src={layout.header.logoSeal || "/brand/udh-logo.png"} alt="" className="size-9 rounded-full bg-[#f8f2e9]" />
            )}
            <div>
              <p className="text-[11px] leading-tight font-semibold">{f.title || site.name}</p>
              <p className="text-[8px] tracking-widest text-[#c49a45] uppercase">{f.subtitle || site.tagline}</p>
            </div>
          </div>
          {f.about && <p className="mt-2 line-clamp-3 text-[9px] text-white/60">{f.about}</p>}
          {f.showSocial && <p className="mt-3 text-[9px] font-semibold uppercase">{f.socialTitle}</p>}
          {f.showPhone && <p className="mt-2 flex items-center gap-1 text-[9px]"><Phone className="size-2.5" /> {site.phone}</p>}
          {f.showEmail && <p className="mt-1 flex items-center gap-1 text-[9px]"><Mail className="size-2.5" /> {site.email}</p>}
        </div>
        {cols.map((c) => (
          <div key={c.id}>
            <p className="mb-1.5 text-[9px] font-semibold uppercase">{c.title}</p>
            {c.links.filter((l) => l.enabled).map((l) => <p key={l.id} className="text-[9px] leading-5 text-white/60">{l.label}</p>)}
          </div>
        ))}
        {blocks.length > 0 && (
          <div>
            {blocks.map((b) => (
              <div key={b.id} className="mb-2">
                <p className="mb-1 text-[9px] font-semibold uppercase">{b.title}</p>
                <p className="line-clamp-3 text-[9px] text-white/60">{b.text.replace("{office}", site.office).replace("{factory}", site.factory)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-between border-t border-white/10 pt-2 text-[9px] text-white/80">
        <span>{fillTokens(f.copyright, site.name)}</span>
        <span>{f.bottomLinks.filter((l) => l.enabled).map((l) => l.label).join("  —  ")}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ building blocks */

function Section({ icon: Icon, title, hint, toggle, children }: {
  icon: typeof Menu;
  title: string;
  hint?: string;
  toggle?: { on: boolean; set: (v: boolean) => void };
  children: React.ReactNode;
}) {
  return (
    <Card>
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-3.5 sm:px-6">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Icon className="size-4 text-slate-400" /> {title}</h2>
          {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
        </div>
        {toggle && <SwitchButton checked={toggle.on} onChange={toggle.set} label={title} />}
      </header>
      <div className={cn("p-5 sm:p-6", toggle && !toggle.on && "pointer-events-none opacity-50")}>{children}</div>
    </Card>
  );
}

function SwitchButton({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50", checked ? "bg-primary-600" : "bg-slate-200")}
    >
      <span className={cn("absolute size-5 rounded-full bg-white shadow transition", checked ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

function Switch({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>
        <span className="block text-sm text-slate-800">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
      <SwitchButton checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

function Text({ label, value, onChange, placeholder, help, area, full }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  help?: string;
  area?: boolean;
  full?: boolean;
}) {
  return (
    <label className={cn("block", full && "sm:col-span-2")}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {area ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className="input" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input" />
      )}
      {help && <span className="mt-1 block text-xs text-slate-500">{help}</span>}
    </label>
  );
}

function Href({ label, value, onChange, pages, compact }: { label?: string; value: string; onChange: (v: string) => void; pages: Page[]; compact?: boolean }) {
  const valid = !value || /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value);
  const known = pages.find((p) => p.href === value);
  return (
    <label className="block min-w-0">
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>}
      <input value={value} onChange={(e) => onChange(e.target.value.trim())} list="layout-pages" placeholder="/page or https://…" aria-invalid={!valid} className={cn("input font-mono", compact && "py-1.5 text-xs")} />
      {!valid ? (
        <span className="mt-1 block text-xs text-rose-600">Start with /, https://, mailto: or tel:</span>
      ) : (
        known && !compact && <span className="mt-1 block text-xs text-slate-500">{known.label}</span>
      )}
      <datalist id="layout-pages">
        {pages.map((p) => <option key={p.href} value={p.href}>{p.label}</option>)}
      </datalist>
    </label>
  );
}

function ColorInput({ label, value, onChange, onReset }: { label: string; value: string; onChange: (v: string) => void; onReset?: () => void }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-1 pr-2">
        <label className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md ring-1 ring-black/10 ring-inset" style={{ background: value }}>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label={label} />
        </label>
        <span className="flex-1 font-mono text-sm text-slate-700 uppercase">{value}</span>
        {onReset && <button type="button" onClick={onReset} className="text-xs text-slate-500 hover:text-slate-800">Default</button>}
      </div>
    </div>
  );
}

function Tags({ label, value, onChange, full }: { label: string; value: string[]; onChange: (v: string[]) => void; full?: boolean }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };
  return (
    <div className={cn(full && "sm:col-span-2")}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 p-1.5">
        {value.map((t) => (
          <span key={t} className="flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pr-1 pl-2.5 text-xs text-slate-700">
            {t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="rounded-full p-0.5 hover:bg-slate-200" aria-label={`Remove ${t}`}><X className="size-3" /></button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === ",") && (e.preventDefault(), add())}
          onBlur={add}
          placeholder="Type and press Enter"
          className="min-w-32 flex-1 bg-transparent px-1.5 py-1 text-sm focus:outline-none"
        />
      </div>
    </div>
  );
}

function RowActions({ enabled, onToggle, onUp, onDown, onDelete }: { enabled?: boolean; onToggle?: () => void; onUp?: () => void; onDown?: () => void; onDelete?: () => void }) {
  const btn = "rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30";
  return (
    <span className="flex shrink-0 items-center">
      {onToggle && (
        <button type="button" onClick={onToggle} className={btn} title={enabled ? "Visible — click to hide" : "Hidden — click to show"} aria-label={enabled ? "Hide" : "Show"}>
          {enabled ? <Eye className="size-4" /> : <EyeOff className="size-4 text-amber-500" />}
        </button>
      )}
      <button type="button" onClick={onUp} disabled={!onUp} className={btn} aria-label="Move up"><ArrowUp className="size-4" /></button>
      <button type="button" onClick={onDown} disabled={!onDown} className={btn} aria-label="Move down"><ArrowDown className="size-4" /></button>
      {onDelete && (
        <button type="button" onClick={onDelete} className={cn(btn, "hover:bg-rose-50 hover:text-rose-600")} aria-label="Delete"><Trash2 className="size-4" /></button>
      )}
    </span>
  );
}

function IconSelect({ value, onChange }: { value: IconKey; onChange: (v: IconKey) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex h-[34px] items-center gap-1 rounded-lg border border-slate-200 px-2 text-slate-600 hover:bg-slate-50" title="Icon">
        {value === "none" ? <span className="text-[11px] text-slate-400">Icon</span> : <NavIcon name={value} className="size-4" />}
        <ChevronDown className="size-3 text-slate-400" />
      </button>
      {open && (
        <div className="animate-pop absolute top-full left-0 z-30 mt-1 grid w-60 grid-cols-7 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          {ICON_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => (onChange(k), setOpen(false))}
              className={cn("grid size-7 place-items-center rounded-md text-slate-600 hover:bg-slate-100", value === k && "bg-primary-600 text-white hover:bg-primary-600")}
              title={k}
            >
              {k === "none" ? <X className="size-3.5" /> : <NavIcon name={k} className="size-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LinksEditor({ links, onChange, pages, max, icons, badges }: { links: NavLink[]; onChange: (v: NavLink[]) => void; pages: Page[]; max: number; icons?: boolean; badges?: boolean }) {
  const set = (id: string, patch: Partial<NavLink>) => onChange(links.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  return (
    <div className="space-y-2">
      {links.map((l, i) => (
        <div key={l.id} className={cn("rounded-lg border border-slate-200 bg-white p-2", !l.enabled && "bg-slate-50 opacity-60")}>
          <div className="flex flex-wrap items-center gap-2">
            {icons && <IconSelect value={l.icon} onChange={(v) => set(l.id, { icon: v })} />}
            <input value={l.label} onChange={(e) => set(l.id, { label: e.target.value })} placeholder="Label" aria-label="Label" className="input w-auto min-w-28 flex-1 py-1.5" />
            <div className="min-w-40 flex-[1.4]">
              <Href value={l.href} onChange={(v) => set(l.id, { href: v })} pages={pages} compact />
            </div>
            {badges && <input value={l.badge} onChange={(e) => set(l.id, { badge: e.target.value })} placeholder="Badge" aria-label="Badge" className="input w-24 py-1.5 text-xs" />}
            <label className="flex items-center gap-1 text-[11px] whitespace-nowrap text-slate-500" title="Open in a new tab">
              <input type="checkbox" checked={l.newTab} onChange={(e) => set(l.id, { newTab: e.target.checked })} className="accent-primary-600" /> New tab
            </label>
            <RowActions
              enabled={l.enabled}
              onToggle={() => set(l.id, { enabled: !l.enabled })}
              onUp={i > 0 ? () => onChange(move(links, i, -1)) : undefined}
              onDown={i < links.length - 1 ? () => onChange(move(links, i, 1)) : undefined}
              onDelete={() => onChange(links.filter((x) => x.id !== l.id))}
            />
          </div>
        </div>
      ))}
      {!links.length && <p className="rounded-lg border-2 border-dashed border-slate-200 px-4 py-3 text-center text-sm text-slate-400">No links yet</p>}
      {links.length < max && (
        <Button type="button" variant="secondary" onClick={() => onChange([...links, newLink()])}>
          <Plus className="size-4" /> Add link
        </Button>
      )}
    </div>
  );
}

function ColumnsEditor({ columns, onChange, pages }: { columns: FooterColumn[]; onChange: (v: FooterColumn[]) => void; pages: Page[] }) {
  const set = (id: string, patch: Partial<FooterColumn>) => onChange(columns.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  return (
    <div className="space-y-4">
      {columns.map((c, i) => (
        <div key={c.id} className={cn("rounded-xl border border-slate-200 bg-slate-50/50", !c.enabled && "opacity-60")}>
          <div className="flex items-center gap-2 border-b border-slate-200 p-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-white text-xs font-semibold text-slate-500 ring-1 ring-slate-200">{i + 1}</span>
            <input value={c.title} onChange={(e) => set(c.id, { title: e.target.value })} placeholder="Column heading" className="input flex-1 py-1.5 font-medium" />
            <RowActions
              enabled={c.enabled}
              onToggle={() => set(c.id, { enabled: !c.enabled })}
              onUp={i > 0 ? () => onChange(move(columns, i, -1)) : undefined}
              onDown={i < columns.length - 1 ? () => onChange(move(columns, i, 1)) : undefined}
              onDelete={() => onChange(columns.filter((x) => x.id !== c.id))}
            />
          </div>
          <div className="p-3">
            <LinksEditor links={c.links} onChange={(v) => set(c.id, { links: v })} pages={pages} max={30} />
          </div>
        </div>
      ))}
      {columns.length < 5 && (
        <Button type="button" variant="secondary" onClick={() => onChange([...columns, { id: uid("c"), title: "New column", enabled: true, links: [newLink()] }])}>
          <Plus className="size-4" /> Add column
        </Button>
      )}
    </div>
  );
}

function LogoPicker({ label, value, onChange, round, dark }: { label: string; value: string; onChange: (v: string) => void; round?: boolean; dark?: boolean }) {
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const fallback = round ? "/brand/udh-logo.png" : "/brand/udh-mark-white.png";
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-4 rounded-lg border border-slate-200 p-3">
        <span className={cn("relative grid size-16 shrink-0 place-items-center overflow-hidden", round ? "rounded-full bg-[#f8f2e9] ring-2 ring-[#c49a45]/60" : "rounded-lg", dark && "bg-[#1d1213]")}>
          <Img src={value || fallback} alt="" fill sizes="64px" className={round ? "object-cover" : "object-contain p-2"} />
        </span>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <input
              ref={input}
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const files = e.target.files;
                e.target.value = "";
                if (!files?.length) return;
                setBusy(true);
                try {
                  onChange((await uploadFiles(files))[0] ?? value);
                } catch (err) {
                  toast((err as Error).message, "error");
                } finally {
                  setBusy(false);
                }
              }}
            />
            <Button type="button" variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={() => input.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />} Upload
            </Button>
            <Button type="button" variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={() => setPicker(true)}>
              <Images className="size-3.5" /> Library
            </Button>
          </div>
          {value ? (
            <button type="button" onClick={() => onChange("")} className="text-xs text-rose-600 hover:underline">Use the built-in logo</button>
          ) : (
            <p className="text-xs text-slate-400">Using the built-in logo</p>
          )}
        </div>
      </div>
      <MediaPicker open={picker} onClose={() => setPicker(false)} onPick={(u) => u[0] && onChange(u[0])} />
    </div>
  );
}

/* ---------------------------------------------------------- contact form */

const FIELD_TYPES: { type: FormFieldType; label: string; icon: typeof Type }[] = [
  { type: "text", label: "Short text", icon: Type },
  { type: "textarea", label: "Long text", icon: FormInput },
  { type: "email", label: "Email", icon: Mail },
  { type: "tel", label: "Phone", icon: Phone },
  { type: "number", label: "Number", icon: Hash },
  { type: "date", label: "Date", icon: Calendar },
  { type: "select", label: "Dropdown", icon: ChevronDown },
  { type: "radio", label: "Choose one", icon: CircleDot },
  { type: "checkbox", label: "Choose many", icon: CheckSquare },
];
const typeInfo = (t: FormFieldType) => FIELD_TYPES.find((x) => x.type === t) ?? { type: t, label: "Colour swatches", icon: CircleDot };

function FormEditor({ layout, setLayout }: { layout: SiteLayout; setLayout: React.Dispatch<React.SetStateAction<SiteLayout>> }) {
  const form = layout.contactForm;
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const setForm = (patch: Partial<typeof form>) => setLayout((l) => ({ ...l, contactForm: { ...l.contactForm, ...patch } }));
  const setField = (id: string, patch: Partial<FormField>) => setForm({ fields: form.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
  const add = (type: FormFieldType) => {
    const label = typeInfo(type).label;
    const f: FormField = {
      id: uid("f"), key: uid("x_"), builtIn: false, type, label, placeholder: "", help: "", required: false, enabled: true, width: "full",
      options: ["select", "radio", "checkbox"].includes(type) ? ["Option 1", "Option 2"] : [],
    };
    setForm({ fields: [...form.fields, f] });
    setOpenId(f.id);
    setAdding(false);
  };

  return (
    <>
      <Section icon={FormInput} title="Form texts" hint="The form on the Contact Us page.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Heading" value={form.title} onChange={(v) => setForm({ title: v })} />
          <Text label="Button text" value={form.submitLabel} onChange={(v) => setForm({ submitLabel: v })} />
          <Text label="Intro (optional)" value={form.intro} onChange={(v) => setForm({ intro: v })} area full />
          <Text label="Thank-you message" value={form.successMessage} onChange={(v) => setForm({ successMessage: v })} area full />
        </div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Section icon={Columns3} title="Fields" hint="Click a field to edit it. Built-in fields can be hidden but not deleted.">
          <ul className="space-y-2">
            {form.fields.map((f, i) => {
              const T = typeInfo(f.type);
              const open = openId === f.id;
              return (
                <li key={f.id} className={cn("rounded-lg border bg-white", open ? "border-primary-300 ring-2 ring-primary-100" : "border-slate-200", !f.enabled && "opacity-60")}>
                  <div className="flex items-center gap-2 p-2 pl-3">
                    <button type="button" onClick={() => setOpenId(open ? null : f.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500"><T.icon className="size-4" /></span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-900">{f.label || "Untitled"}{f.required && <span className="text-rose-500"> *</span>}</span>
                        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          {T.label} · {f.width === "half" ? "half width" : "full width"}
                          {f.builtIn && <Badge className="px-1.5 py-0 text-[10px]">built-in</Badge>}
                        </span>
                      </span>
                    </button>
                    <RowActions
                      enabled={f.enabled}
                      onToggle={f.key === "name" ? undefined : () => setField(f.id, { enabled: !f.enabled })}
                      onUp={i > 0 ? () => setForm({ fields: move(form.fields, i, -1) }) : undefined}
                      onDown={i < form.fields.length - 1 ? () => setForm({ fields: move(form.fields, i, 1) }) : undefined}
                      onDelete={f.builtIn ? undefined : () => setForm({ fields: form.fields.filter((x) => x.id !== f.id) })}
                    />
                  </div>
                  {open && (
                    <div className="grid gap-4 border-t border-slate-100 p-4 sm:grid-cols-2">
                      <Text label="Label" value={f.label} onChange={(v) => setField(f.id, { label: v })} />
                      {!f.builtIn ? (
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-slate-700">Type</span>
                          <select value={f.type} onChange={(e) => setField(f.id, { type: e.target.value as FormFieldType })} className="input">
                            {FIELD_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
                          </select>
                        </label>
                      ) : (
                        <div className="text-xs text-slate-500 sm:pt-7">Type: <b className="text-slate-700">{T.label}</b> — fixed for built-in fields</div>
                      )}
                      {f.type !== "color" && f.type !== "radio" && f.type !== "checkbox" && (
                        <Text label="Placeholder" value={f.placeholder} onChange={(v) => setField(f.id, { placeholder: v })} />
                      )}
                      <Text label="Help text" value={f.help} onChange={(v) => setField(f.id, { help: v })} />
                      {["select", "radio", "checkbox"].includes(f.type) && (
                        <label className="block sm:col-span-2">
                          <span className="mb-1.5 block text-sm font-medium text-slate-700">Options <span className="font-normal text-slate-400">— one per line</span></span>
                          <textarea
                            rows={4}
                            value={f.options.join("\n")}
                            onChange={(e) => setField(f.id, { options: e.target.value.split("\n").map((o) => o.trimStart()).slice(0, 30) })}
                            onBlur={() => setField(f.id, { options: f.options.map((o) => o.trim()).filter(Boolean) })}
                            className="input"
                          />
                        </label>
                      )}
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:col-span-2">
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input type="checkbox" checked={f.required} disabled={f.key === "name"} onChange={(e) => setField(f.id, { required: e.target.checked })} className="size-4 accent-primary-600" /> Required
                        </label>
                        <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs">
                          {(["half", "full"] as const).map((w) => (
                            <button key={w} type="button" onClick={() => setField(f.id, { width: w })} className={cn("rounded-md px-2.5 py-1", f.width === w ? "bg-slate-900 text-white" : "text-slate-600")}>
                              {w === "half" ? "Half width" : "Full width"}
                            </button>
                          ))}
                        </div>
                        {f.key === "name" && <span className="text-xs text-slate-400">The name is always required.</span>}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="relative mt-3">
            <Button type="button" variant="secondary" onClick={() => setAdding((a) => !a)} disabled={form.fields.length >= 30}>
              <Plus className="size-4" /> Add field
            </Button>
            {adding && (
              <div className="animate-pop absolute top-full left-0 z-30 mt-1 grid w-72 grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                {FIELD_TYPES.map((t) => (
                  <button key={t.type} type="button" onClick={() => add(t.type)} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                    <t.icon className="size-4 text-slate-400" /> {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="mt-4 text-xs text-slate-500">Answers to extra fields appear on each inquiry and in the CSV export.</p>
        </Section>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <Preview label="Form preview">
            <FormPreview form={form} />
          </Preview>
        </div>
      </div>
    </>
  );
}

function FormPreview({ form }: { form: SiteLayout["contactForm"] }) {
  const box = "h-8 w-full border border-neutral-300 bg-white";
  return (
    <div className="min-w-[260px] space-y-3 border border-neutral-200 bg-white p-4">
      <p className="font-display text-base font-semibold text-slate-900">{form.title}</p>
      {form.intro && <p className="text-[11px] text-slate-500">{form.intro}</p>}
      <div className="grid grid-cols-2 gap-3">
        {form.fields.filter((f) => f.enabled).map((f) => (
          <div key={f.id} className={f.width === "full" ? "col-span-2" : ""}>
            <p className="mb-1 text-[11px] font-medium text-slate-800">{f.label}{f.required && " *"}</p>
            {f.type === "textarea" ? (
              <div className={cn(box, "h-16")} />
            ) : f.type === "color" ? (
              <div className="flex gap-1">{["#f4f2ee", "#d8c2a0", "#a9a6a1", "#1e1e20", "#b88a5c"].map((c) => <span key={c} className="size-5 rounded-full ring-1 ring-black/10" style={{ background: c }} />)}</div>
            ) : f.type === "radio" || f.type === "checkbox" ? (
              <div className="flex flex-wrap gap-1">{f.options.map((o) => <span key={o} className="border border-neutral-300 px-2 py-0.5 text-[10px]">{o}</span>)}</div>
            ) : (
              <div className={cn(box, "px-2 text-[10px] leading-8 text-slate-400")}>{f.type === "select" ? `${f.placeholder || "Choose…"} ▾` : f.placeholder}</div>
            )}
            {f.help && <p className="mt-0.5 text-[10px] text-slate-400">{f.help}</p>}
          </div>
        ))}
      </div>
      <div className="bg-[#760308] py-2 text-center text-[10px] tracking-wider text-white uppercase">{form.submitLabel}</div>
    </div>
  );
}
