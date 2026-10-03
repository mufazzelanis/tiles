"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, BookOpen, CornerDownLeft, ExternalLink, FileText, FolderKanban, GalleryHorizontal, Images, Inbox,
  LayoutDashboard, Leaf, MapPin, Newspaper, Package, Plus, Search, Settings, ShieldCheck, Tags, UserCircle, Users,
} from "lucide-react";
import Img from "@/components/Img";
import { can, type Action } from "@/lib/permissions";
import { cn } from "@/lib/utils";

/** A record from the database the palette can jump to (built in the panel layout). */
export interface SearchItem {
  id: string;
  label: string;
  sub: string;
  href: string;
  group: string;
  image?: string;
}

const GROUP_ICON: Record<string, typeof Package> = {
  Products: Package, Categories: Tags, News: Newspaper, Projects: FolderKanban, Slides: GalleryHorizontal,
  Stores: MapPin, Inquiries: Inbox, Catalogues: BookOpen, Sustainability: Leaf,
};

type Entry = { key: string; label: string; sub?: string; group: string; icon: typeof Package; image?: string; run: () => void };

export function CommandPalette({
  open,
  onClose,
  items,
  permissions,
}: {
  open: boolean;
  onClose: () => void;
  items: SearchItem[];
  permissions: string[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setQ("");
      setActive(0);
    }
  }

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const entries = useMemo<Entry[]>(() => {
    const go = (href: string) => () => (router.push(href), onClose());
    // module key = second path segment; pages need "view", "new" actions need "create"
    const allowed = (href: string, action: Action) => {
      const mod = href.split("/")[2];
      return !mod || mod === "account" || can(permissions, mod, action);
    };
    const pages: Entry[] = (
      [
        ["/admin", "Dashboard", LayoutDashboard],
        ["/admin/products", "Products", Package],
        ["/admin/categories", "Categories", Tags],
        ["/admin/catalogues", "Catalogues", BookOpen],
        ["/admin/slides", "Hero Slider", GalleryHorizontal],
        ["/admin/news", "News & Blog", Newspaper],
        ["/admin/projects", "Projects", FolderKanban],
        ["/admin/sustainability", "Sustainability", Leaf],
        ["/admin/stores", "Store Locator", MapPin],
        ["/admin/media", "Media Library", Images],
        ["/admin/inquiries", "Inquiries", Inbox],
        ["/admin/users", "Users", Users],
        ["/admin/roles", "Roles & Permissions", ShieldCheck],
        ["/admin/settings", "Settings", Settings],
        ["/admin/account", "My account", UserCircle],
      ] as const
    )
      .filter(([href]) => allowed(href, "view"))
      .map(([href, label, icon]) => ({ key: `p:${href}`, label, group: "Pages", icon, run: go(href) }));

    const actions: Entry[] = [
      ["/admin/products/new", "Add a new product"],
      ["/admin/slides/new", "Add a hero slide"],
      ["/admin/news/new", "Write a news post"],
      ["/admin/categories/new", "Create a category"],
      ["/admin/stores/new", "Add a store"],
      ["/admin/projects/new", "Add a project"],
      ["/admin/users?invite=1", "Invite a team member"],
    ]
      .filter(([href]) => allowed(href.split("?")[0], "create"))
      .map(([href, label]) => ({ key: `a:${href}`, label, group: "Quick actions", icon: Plus, run: go(href) }));
    actions.push({ key: "a:site", label: "Open the website", group: "Quick actions", icon: ExternalLink, run: () => (window.open("/", "_blank"), onClose()) });

    const records: Entry[] = items.map((r) => ({
      key: `r:${r.group}:${r.id}`,
      label: r.label,
      sub: r.sub,
      group: r.group,
      icon: GROUP_ICON[r.group] ?? FileText,
      image: r.image,
      run: go(r.href),
    }));
    return [...actions, ...pages, ...records];
  }, [items, permissions, router, onClose]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return entries.filter((e) => e.group === "Quick actions" || e.group === "Pages");
    const words = needle.split(/\s+/);
    return entries
      .map((e) => {
        const hay = `${e.label} ${e.sub ?? ""} ${e.group}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return null;
        const score = (e.label.toLowerCase().startsWith(needle) ? 0 : 1) + (e.group === "Pages" ? 0 : 0.5);
        return { e, score };
      })
      .filter((x): x is { e: Entry; score: number } => !!x)
      .sort((a, b) => a.score - b.score)
      .slice(0, 40)
      .map((x) => x.e);
  }, [q, entries]);

  // group for display, keeping a flat index for keyboard navigation
  const grouped = useMemo(() => {
    const map = new Map<string, { e: Entry; i: number }[]>();
    results.forEach((e, i) => map.set(e.group, [...(map.get(e.group) ?? []), { e, i }]));
    return [...map.entries()];
  }, [results]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-slate-900/40 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className="animate-pop w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search className="size-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => (setQ(e.target.value), setActive(0))}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") results[active]?.run();
              else if (e.key === "Escape") onClose();
            }}
            placeholder="Search products, posts, inquiries, pages…"
            className="h-14 w-full bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">ESC</kbd>
        </div>

        <div ref={listRef} className="scroll-thin max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">No results for “{q}”</p>
          ) : (
            grouped.map(([group, list]) => (
              <div key={group} className="mb-1">
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{group}</p>
                {list.map(({ e, i }) => {
                  const Icon = e.icon;
                  return (
                    <button
                      key={e.key}
                      data-index={i}
                      onMouseMove={() => setActive(i)}
                      onClick={e.run}
                      className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition", i === active ? "bg-primary-50 text-primary-900" : "text-slate-700")}
                    >
                      {e.image ? (
                        <span className="relative size-8 shrink-0 overflow-hidden rounded-md bg-slate-100">
                          <Img src={e.image} alt="" fill sizes="32px" className="object-cover" />
                        </span>
                      ) : (
                        <span className={cn("grid size-8 shrink-0 place-items-center rounded-md", i === active ? "bg-primary-100 text-primary-600" : "bg-slate-100 text-slate-500")}>
                          <Icon className="size-4" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{e.label}</span>
                        {e.sub && <span className="block truncate text-xs text-slate-500">{e.sub}</span>}
                      </span>
                      {i === active && <ArrowRight className="size-4 shrink-0 text-primary-400" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><kbd className="rounded border border-slate-200 bg-white px-1">↑</kbd><kbd className="rounded border border-slate-200 bg-white px-1">↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="rounded border border-slate-200 bg-white px-1"><CornerDownLeft className="inline size-3" /></kbd> open</span>
          <span className="ml-auto">{items.length} records indexed</span>
        </div>
      </div>
    </div>
  );
}
