"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bell, BookOpen, ChevronLeft, ChevronRight, ExternalLink, FolderKanban, GalleryHorizontal, Images, Inbox, KeyRound,
  LayoutDashboard, Leaf, LogOut, MapPin, Menu, Newspaper, Package, Search,
  Settings, ShieldCheck, Tags, Users, X,
} from "lucide-react";
import { logout } from "@/app/admin/actions";
import { cn, timeAgo } from "@/lib/utils";
import { can } from "@/lib/permissions";
import type { SafeUser } from "@/lib/auth";
import { CommandPalette, type SearchItem } from "./CommandPalette";
import { ChangePasswordForm } from "./AccountForms";

/** Blocks the panel until a user with a temporary password picks their own. */
function ForcePasswordChange({ name }: { name: string }) {
  return (
    <div className="fixed inset-0 z-[95] grid place-items-center overflow-y-auto bg-charcoal/80 p-4 backdrop-blur-sm">
      <div className="animate-pop w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <Image src="/brand/udh-logo.png" alt="" width={56} height={56} className="rounded-full" />
        <h2 className="mt-4 text-xl font-semibold text-slate-900">Welcome, {name.split(" ")[0]} — set your password</h2>
        <p className="mt-1 mb-6 text-sm text-slate-500">You signed in with a temporary password. Choose a personal one to continue.</p>
        <ChangePasswordForm forced />
        <form action={logout} className="mt-3 text-center">
          <button className="text-xs text-slate-500 hover:text-slate-800">Sign out instead</button>
        </form>
      </div>
    </div>
  );
}

export const NAV = [
  { group: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }] },
  {
    group: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: Tags },
      { href: "/admin/catalogues", label: "Catalogues", icon: BookOpen },
    ],
  },
  {
    group: "Website",
    items: [
      { href: "/admin/slides", label: "Hero Slider", icon: GalleryHorizontal },
      { href: "/admin/news", label: "News & Blog", icon: Newspaper },
      { href: "/admin/projects", label: "Projects", icon: FolderKanban },
      { href: "/admin/sustainability", label: "Sustainability", icon: Leaf },
      { href: "/admin/stores", label: "Store Locator", icon: MapPin },
      { href: "/admin/media", label: "Media Library", icon: Images },
    ],
  },
  { group: "Business", items: [{ href: "/admin/inquiries", label: "Inquiries", icon: Inbox, badge: true }] },
  {
    group: "System",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
] as const;

type NavItem = { href: string; label: string; icon: typeof Package; exact?: boolean; badge?: boolean };
/** /admin/<module> is guarded by the "<module>.view" permission */
const moduleOf = (href: string) => href.split("/")[2];
const ALL_ITEMS = NAV.flatMap((g) => g.items as readonly NavItem[]);

export interface RecentInquiry {
  id: string;
  name: string;
  subject: string;
  createdAt: string;
}

function Logo({ collapsed, siteName }: { collapsed: boolean; siteName: string }) {
  return (
    <Link href="/admin" className="flex min-w-0 items-center gap-3">
      <Image src="/brand/udh-logo.png" alt="" width={40} height={40} className="size-10 shrink-0 rounded-full bg-[#f8f2e9] ring-2 ring-white/15" />
      {!collapsed && (
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-white">{siteName}</span>
          <span className="block text-[11px] text-slate-400">Admin console</span>
        </span>
      )}
    </Link>
  );
}

/** Small click-outside dropdown used by the top bar. */
function Dropdown({ button, children, width = "w-72" }: { button: (open: boolean) => ReactNode; children: (close: () => void) => ReactNode; width?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((o) => !o)}>{button(open)}</div>
      {open && (
        <div className={cn("animate-pop absolute top-full right-0 z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl", width)}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function Shell({
  user,
  siteName,
  newInquiries,
  recentInquiries,
  searchIndex,
  initialCollapsed,
  children,
}: {
  user: SafeUser;
  siteName: string;
  newInquiries: number;
  recentInquiries: RecentInquiry[];
  searchIndex: SearchItem[];
  initialCollapsed: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [palette, setPalette] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      document.cookie = `admin_sidebar=${c ? "open" : "collapsed"}; path=/; max-age=31536000; samesite=lax`;
      return !c;
    });
  }, []);

  // global shortcuts: Ctrl/⌘+K palette, Ctrl/⌘+B sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      } else if (k === "b") {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

  // breadcrumbs from the URL
  const segments = pathname.split("/").filter(Boolean).slice(1);
  const section = ALL_ITEMS.find((i) => !i.exact && segments[0] && i.href === `/admin/${segments[0]}`);
  const crumbs = [{ href: "/admin", label: "Dashboard" }];
  if (section) crumbs.push({ href: section.href, label: section.label });
  if (segments[1]) crumbs.push({ href: pathname, label: segments[1] === "new" ? "New" : "Edit" });

  const sidebar = (isCollapsed: boolean) => (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 shrink-0 items-center border-b border-white/5", isCollapsed ? "justify-center px-2" : "px-4")}>
        <Logo collapsed={isCollapsed} siteName={siteName} />
      </div>

      <nav className={cn("flex-1 overflow-y-auto py-4", isCollapsed ? "no-scrollbar space-y-3 px-2" : "scroll-thin space-y-6 px-3")}>
        {NAV.map((g) => {
          const items = (g.items as readonly NavItem[]).filter((i) => i.exact || can(user.permissions, moduleOf(i.href)));
          if (!items.length) return null;
          return (
            <div key={g.group}>
              {isCollapsed ? (
                <div className="mx-auto mb-2 h-px w-6 bg-white/10" />
              ) : (
                <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">{g.group}</p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  const count = item.badge ? newInquiries : 0;
                  return (
                    <li key={item.href} className="group/item relative">
                      <Link
                        href={item.href}
                        className={cn(
                          "relative flex items-center rounded-lg text-sm transition",
                          isCollapsed ? "size-11 justify-center" : "gap-3 px-3 py-2",
                          active ? "bg-white/10 font-medium text-white" : "text-slate-400 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        {active && <span className="absolute top-1/2 -left-3 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gold-400" />}
                        <Icon className={cn("size-[18px] shrink-0", active ? "text-gold-400" : "text-slate-500 group-hover/item:text-slate-300")} />
                        {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                        {count > 0 &&
                          (isCollapsed ? (
                            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-gold-400 ring-2 ring-charcoal" />
                          ) : (
                            <span className="rounded-full bg-gold-400 px-1.5 text-[11px] font-semibold text-slate-900">{count}</span>
                          ))}
                      </Link>
                      {isCollapsed && (
                        <span className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition group-hover/item:opacity-100">
                          {item.label}
                          {count > 0 && <span className="ml-1.5 text-gold-400">{count}</span>}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/5 p-3">
        <div className={cn("group/me relative flex items-center rounded-xl", isCollapsed ? "justify-center" : "gap-3 bg-white/5 p-2 ring-1 ring-white/5")}>
          <Link href="/admin/account" className="relative shrink-0" title="My account">
            <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-primary-500 to-primary-800 text-sm font-semibold text-white">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-emerald-400 ring-2 ring-charcoal" />
          </Link>
          {!isCollapsed && (
            <>
              <Link href="/admin/account" className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white">{user.name}</span>
                <span className="block truncate text-[11px] text-slate-400">{user.role.name}</span>
              </Link>
              <form action={logout}>
                <button className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-rose-300" title="Sign out" aria-label="Sign out">
                  <LogOut className="size-4" />
                </button>
              </form>
            </>
          )}
          {isCollapsed && (
            <span className="pointer-events-none absolute bottom-1 left-full z-50 ml-3 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition group-hover/me:opacity-100">
              {user.name} · <span className="text-slate-400">{user.role.name}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-700">
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden bg-charcoal transition-[width] duration-200 lg:block", collapsed ? "w-[72px]" : "w-64")}>
        {sidebar(collapsed)}
        {/* always-visible edge handle to collapse / expand */}
        <button
          onClick={toggleCollapsed}
          className="absolute top-[52px] -right-3.5 z-50 grid size-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:scale-110 hover:bg-primary-600 hover:text-white"
          title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("size-4 transition-transform duration-200", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* mobile drawer */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", mobileOpen ? "visible" : "invisible")}>
        <div className={cn("absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity", mobileOpen ? "opacity-100" : "opacity-0")} onClick={() => setMobileOpen(false)} />
        <aside className={cn("absolute inset-y-0 left-0 w-72 bg-charcoal shadow-2xl transition-transform", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
          <button onClick={() => setMobileOpen(false)} className="absolute top-4 -right-12 rounded-lg bg-charcoal p-2 text-white" aria-label="Close menu">
            <X className="size-5" />
          </button>
          {sidebar(false)}
        </aside>
      </div>

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>

          <nav className="hidden min-w-0 items-center gap-1 text-sm md:flex" aria-label="Breadcrumb">
            {crumbs.map((c, i) => (
              <span key={c.href + i} className="flex min-w-0 items-center gap-1">
                {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-slate-300" />}
                {i === crumbs.length - 1 ? (
                  <span className="truncate font-medium text-slate-900">{c.label}</span>
                ) : (
                  <Link href={c.href} className="truncate text-slate-500 hover:text-slate-900">{c.label}</Link>
                )}
              </span>
            ))}
          </nav>

          <div className="flex-1" />

          <button
            onClick={() => setPalette(true)}
            className="hidden w-full max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 transition hover:border-primary-300 hover:bg-white hover:shadow-sm sm:flex"
          >
            <Search className="size-4" />
            <span className="flex-1 text-left">Search products, posts, inquiries…</span>
            <kbd className="rounded border border-slate-200 bg-white px-1.5 text-[10px] font-medium text-slate-500">Ctrl K</kbd>
          </button>
          <button onClick={() => setPalette(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:hidden" aria-label="Search">
            <Search className="size-5" />
          </button>

          <Dropdown
            width="w-80"
            button={(open) => (
              <button className={cn("relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100", open && "bg-slate-100")} aria-label="Notifications">
                <Bell className="size-5" />
                {newInquiries > 0 && (
                  <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
                    {newInquiries}
                  </span>
                )}
              </button>
            )}
          >
            {(close) => (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  {newInquiries > 0 && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">{newInquiries} new</span>}
                </div>
                {recentInquiries.length ? (
                  <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                    {recentInquiries.map((i) => (
                      <li key={i.id}>
                        <Link href={`/admin/inquiries?open=${i.id}`} onClick={close} className="flex gap-3 px-4 py-3 transition hover:bg-slate-50">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-50 text-xs font-semibold text-primary-600">{i.name.slice(0, 1)}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-slate-800"><b className="font-medium">{i.name}</b> sent an inquiry</span>
                            <span className="block truncate text-xs text-slate-500">{i.subject}</span>
                            <span className="text-[11px] text-slate-400">{timeAgo(i.createdAt)}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">You&apos;re all caught up 🎉</p>
                )}
                <Link href="/admin/inquiries" onClick={close} className="block border-t border-slate-100 py-2.5 text-center text-sm font-medium text-primary-600 hover:bg-slate-50">
                  Open inbox
                </Link>
              </>
            )}
          </Dropdown>

          <a href="/" target="_blank" className="hidden items-center gap-1.5 rounded-lg p-2 text-sm text-slate-500 hover:bg-slate-100 md:flex" title="View website">
            <ExternalLink className="size-5" />
          </a>

          <Dropdown
            width="w-60"
            button={(open) => (
              <button className={cn("flex items-center gap-2 rounded-full p-0.5 pr-2 transition hover:bg-slate-100", open && "bg-slate-100")} aria-label="Account menu">
                <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-primary-500 to-primary-800 text-sm font-semibold text-white">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden text-left leading-tight lg:block">
                  <span className="block text-sm font-medium text-slate-800">{user.name.split(" ")[0]}</span>
                  <span className="block text-[11px] text-slate-500">{user.role.name}</span>
                </span>
              </button>
            )}
          >
            {(close) => (
              <>
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <div className="p-1.5 text-sm">
                  <Link href="/admin/account" onClick={close} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50">
                    <KeyRound className="size-4 text-slate-400" /> My account & password
                  </Link>
                  {can(user.permissions, "settings") && (
                    <Link href="/admin/settings" onClick={close} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50">
                      <Settings className="size-4 text-slate-400" /> Site settings
                    </Link>
                  )}
                  <a href="/" target="_blank" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50">
                    <ExternalLink className="size-4 text-slate-400" /> View website
                  </a>
                </div>
                <form action={logout} className="border-t border-slate-100 p-1.5">
                  <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                    <LogOut className="size-4" /> Sign out
                  </button>
                </form>
              </>
            )}
          </Dropdown>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {user.mustChangePassword && <ForcePasswordChange name={user.name} />}
      <CommandPalette open={palette} onClose={() => setPalette(false)} items={searchIndex} permissions={user.permissions} />
    </div>
  );
}
