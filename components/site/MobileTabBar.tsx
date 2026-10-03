"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LayoutGrid, MapPin, MessageCircle } from "lucide-react";
import { useFavorites } from "@/lib/client-store";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/products", label: "Products", icon: LayoutGrid },
  { href: "/favorites", label: "Saved", icon: Heart, badge: true },
  { href: "/store-locator", label: "Stores", icon: MapPin },
  { href: "/contact", label: "Contact", icon: MessageCircle },
];

/** App-style bottom navigation, phones and tablets only. */
export function MobileTabBar() {
  const pathname = usePathname();
  const fav = useFavorites();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md lg:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {TABS.map(({ href, label, icon: Icon, exact, badge }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition active:scale-90",
                  active ? "text-brand" : "text-neutral-500",
                )}
              >
                {active && <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-brand" />}
                <span className="relative">
                  <Icon className={cn("size-[22px]", active && badge && "fill-brand")} strokeWidth={active ? 2.2 : 1.8} />
                  {badge && fav.ids.length > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                      {fav.ids.length}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
