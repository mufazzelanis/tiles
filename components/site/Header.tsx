"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Calculator, Download, FolderKanban, Heart, Menu, Newspaper, Phone, Search, Store, X } from "lucide-react";
import { useFavorites } from "@/lib/client-store";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

interface Props {
  siteName: string;
  phone: string;
  categories: { name: string; slug: string }[];
}

const LEFT = [
  { href: "/products", label: "Product", icon: Search },
  { href: "/store-locator", label: "Store Locator", icon: Store },
  { href: "/catalogue", label: "Catalogue", icon: Download },
];
const RIGHT = [
  { href: "/tiles-calculator", label: "Tiles Calculator", icon: Calculator, badge: "Try now" },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/news", label: "News", icon: Newspaper },
];

export function Header({ siteName, phone, categories }: Props) {
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const fav = useFavorites();
  const [search, setSearch] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // close overlays on navigation
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawer(false);
    setSearch(false);
  }

  useEffect(() => {
    if (search) inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawer(false);
        setSearch(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [search]);

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
  }, [drawer]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 text-white backdrop-blur-md transition-all duration-300",
          scrolled ? "bg-charcoal/95 shadow-lg shadow-black/25" : "bg-charcoal/90",
        )}
      >
        <div className={cn("flex items-stretch transition-all duration-300", scrolled ? "h-[52px]" : "h-[58px]")}>
          <button
            onClick={() => setDrawer(true)}
            className="grid w-14 place-items-center border-r border-white/15 transition hover:bg-white/10"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <nav className="hidden flex-1 items-center gap-6 px-5 text-[13px] lg:flex">
            {LEFT.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={cn("flex items-center gap-1.5 transition hover:text-leaf", pathname.startsWith(href) && "text-leaf")}>
                <Icon className="size-4" /> {label}
              </Link>
            ))}
          </nav>

          {/* Phones: compact white mark + name */}
          <Link href="/" className="mx-auto flex items-center px-3 lg:hidden" aria-label={`${siteName} home`}>
            <Logo name={siteName} size={30} priority />
          </Link>

          {/* Desktop: the round seal hangs below the bar like a badge, then tucks in on scroll */}
          <Link href="/" className="relative hidden w-[180px] shrink-0 justify-center lg:flex" aria-label={`${siteName} home`}>
            <span
              className={cn(
                "absolute top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-mist p-1 shadow-[0_10px_30px_-6px_rgba(0,0,0,0.55)] ring-2 ring-leaf/70 transition-all duration-300 hover:scale-[1.03]",
                scrolled ? "pointer-events-none -translate-y-4 scale-50 opacity-0" : "opacity-100",
              )}
            >
              <Logo name={siteName} variant="seal" size={124} priority />
            </span>
            <span className={cn("flex items-center transition-all duration-300", scrolled ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0")}>
              <Logo name={siteName} size={30} />
            </span>
          </Link>

          <nav className="hidden flex-1 items-center justify-end gap-6 px-5 text-[13px] lg:flex">
            {RIGHT.map(({ href, label, icon: Icon, badge }) => (
              <Link key={href} href={href} className={cn("relative flex items-center gap-1.5 transition hover:text-leaf", pathname.startsWith(href) && "text-leaf")}>
                <Icon className="size-4" /> {label}
                {badge && (
                  <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 rounded-sm bg-navy-deep px-1.5 py-px text-[9px] whitespace-nowrap text-white">
                    {badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <Link
            href="/favorites"
            className="relative hidden w-14 place-items-center border-l border-white/15 transition hover:bg-white/10 lg:grid"
            aria-label={`Favorites (${fav.ids.length})`}
            title="My favorites"
          >
            <Heart className={cn("size-5", fav.ids.length > 0 && "fill-rose-500 text-rose-500")} />
            {fav.ids.length > 0 && (
              <span className="absolute top-2.5 right-2.5 grid min-w-4 place-items-center rounded-full bg-white px-1 text-[9px] font-bold text-ink">{fav.ids.length}</span>
            )}
          </Link>
          <button
            onClick={() => setSearch(true)}
            className="grid w-14 place-items-center border-l border-white/15 transition hover:bg-white/10 active:bg-white/20"
            aria-label="Search"
          >
            <Search className="size-5" />
          </button>
        </div>
      </header>

      {/* Search overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-start justify-center bg-black/80 px-4 pt-[18vh] backdrop-blur-sm transition",
          search ? "visible opacity-100" : "invisible opacity-0",
        )}
        onClick={() => setSearch(false)}
      >
        <form
          onClick={(e) => e.stopPropagation()}
          onSubmit={(e) => {
            e.preventDefault();
            const q = inputRef.current?.value.trim();
            router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
          }}
          className="w-full max-w-2xl"
        >
          <label className="mb-3 block text-sm tracking-widest text-white/60 uppercase">Search tiles</label>
          <div className="flex items-center border-b-2 border-white/70">
            <input
              ref={inputRef}
              placeholder="Name, code, colour, size…"
              className="w-full bg-transparent py-3 text-2xl text-white placeholder:text-white/40 focus:outline-none"
            />
            <button className="p-2 text-white" aria-label="Submit search">
              <Search className="size-6" />
            </button>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Marble", "60x60 cm", "Bathroom", "Wood", "Glossy", "Outdoor"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => router.push(`/products?q=${encodeURIComponent(t)}`)}
                className="rounded-full border border-white/25 px-3.5 py-1.5 text-[13px] text-white/80 transition hover:border-white hover:text-white active:scale-95"
              >
                {t}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setSearch(false)} className="mt-6 flex items-center gap-2 text-sm text-white/70 hover:text-white">
            <X className="size-4" /> Close (Esc)
          </button>
        </form>
      </div>

      {/* Side drawer */}
      <div
        className={cn("fixed inset-0 z-50 bg-black/50 transition-opacity", drawer ? "visible opacity-100" : "invisible opacity-0")}
        onClick={() => setDrawer(false)}
      />
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full w-[min(360px,88vw)] flex-col bg-navy text-white transition-transform duration-300",
          drawer ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        )}
        aria-hidden={!drawer}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <Logo name={siteName} />
          <button onClick={() => setDrawer(false)} aria-label="Close menu" className="rounded-full p-2 hover:bg-white/10">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-6 py-6 text-sm">
          <p className="mb-2 text-[11px] tracking-[0.2em] text-white/50 uppercase">Collections</p>
          <ul className="mb-6 space-y-1">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/products?category=${c.slug}`} className="block py-1.5 text-white/85 transition hover:translate-x-1 hover:text-leaf">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mb-2 text-[11px] tracking-[0.2em] text-white/50 uppercase">Explore</p>
          <ul className="space-y-1">
            {[
              ["/", "Home"],
              ["/products", "All Products"],
              ["/store-locator", "Store Locator"],
              ["/catalogue", "Catalogue"],
              ["/tiles-calculator", "Tiles Calculator"],
              ["/projects", "Projects"],
              ["/news", "News & Events"],
              ["/news?type=Tiles+Care", "Tiles Care"],
              ["/about", "About Us"],
              ["/contact", "Contact Us"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="block py-1.5 text-white/85 transition hover:translate-x-1 hover:text-leaf">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <a href={`tel:${phone.replace(/s/g, "")}`} className="flex items-center justify-center gap-2 rounded-lg bg-white/10 py-3 text-sm active:scale-95">
            <Phone className="size-4" /> Call us
          </a>
          <a
            href={`https://wa.me/${phone.replace(/D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] py-3 text-sm font-medium active:scale-95"
          >
            WhatsApp
          </a>
        </div>
      </aside>
    </>
  );
}
