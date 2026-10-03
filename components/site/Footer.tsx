import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import type { Settings } from "@/lib/types";
import { Logo } from "./Logo";
import { SocialIcons } from "./SocialIcons";
import { BackToTop } from "./BackToTop";

const COLS = [
  {
    title: "Quick Links",
    links: [
      ["/products", "All Products"],
      ["/catalogue", "Download"],
      ["/store-locator?type=Display+Center", "Display Center"],
      ["/store-locator?type=Dealer", "Dealer Profile"],
      ["/products?sort=new", "Latest Collection"],
      ["/tiles-calculator", "Tiles Calculator"],
      ["/news", "Blog"],
    ],
  },
  {
    title: "About Us",
    links: [
      ["/about", "About Us"],
      ["/about#why", "Why Choose Us"],
      ["/news", "News And Events"],
      ["/news?type=Tiles+Care", "Tiles Care"],
      ["/projects", "Our Projects"],
    ],
  },
  {
    title: "Customer Service",
    links: [
      ["/contact", "Contact Us"],
      ["/store-locator", "Store Locator"],
      ["/tiles-calculator", "Tiles Calculator"],
    ],
  },
];

export function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="relative overflow-hidden bg-navy-deep text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-25"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,.55) 1px, transparent 1px)",
          backgroundSize: "9px 9px",
          maskImage: "linear-gradient(to top, black, transparent)",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 pt-14 pb-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.1fr] lg:px-12">
        <div>
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-mist p-1 ring-2 ring-leaf/60">
              <Logo name={settings.siteName} variant="seal" size={88} />
            </span>
            <div>
              <p className="font-display text-lg leading-tight font-semibold">{settings.siteName}</p>
              <p className="mt-1 text-[11px] tracking-[0.18em] text-leaf uppercase">{settings.tagline}</p>
            </div>
          </div>
          <p className="mt-6 mb-3 text-[13px] font-semibold tracking-wide uppercase">Follow us</p>
          <SocialIcons socials={settings.socials} />
          <ul className="mt-8 space-y-3 text-[13px]">
            <li className="flex items-center gap-2">
              <Phone className="size-3.5 text-white/60" />
              <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-leaf">{settings.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-3.5 text-white/60" />
              <a href={`mailto:${settings.email}`} className="hover:text-leaf">{settings.email}</a>
            </li>
          </ul>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <h3 className="mb-4 text-[13px] font-semibold tracking-wide uppercase">{col.title}</h3>
            <ul className="space-y-2.5 text-[12.5px] text-white/60">
              {col.links.map(([href, label]) => (
                <li key={label}>
                  <Link href={href} className="transition hover:text-white">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h3 className="mb-4 text-[13px] font-semibold tracking-wide uppercase">Corporate Office</h3>
          <p className="text-[12.5px] leading-relaxed text-white/60">{settings.corporateOffice}</p>
          <h3 className="mt-6 mb-3 text-[13px] font-semibold tracking-wide uppercase">Factory</h3>
          <p className="text-[12.5px] leading-relaxed text-white/60">{settings.factory}</p>
        </div>
      </div>
      <div className="relative mx-auto flex max-w-7xl flex-col gap-3 px-6 pt-4 pb-6 text-[13px] text-white/80 sm:flex-row sm:items-center sm:justify-between lg:px-12">
        <p>© {new Date().getFullYear()} {settings.siteName} Limited. All rights reserved.</p>
        <p className="flex items-center gap-3">
          <Link href="/about" className="hover:text-white">Privacy Policy</Link>
          <span>—</span>
          <Link href="/about" className="hover:text-white">Terms And Conditions</Link>
        </p>
      </div>
      <BackToTop />
    </footer>
  );
}
