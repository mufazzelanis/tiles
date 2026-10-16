import { Mail, Phone } from "lucide-react";
import type { Settings } from "@/lib/types";
import { fillTokens, type FooterConfig } from "@/lib/site-layout";
import { NavIcon } from "@/components/NavIcon";
import { Logo } from "./Logo";
import { SocialIcons } from "./SocialIcons";
import { BackToTop } from "./BackToTop";
import { MenuLink } from "./MenuLink";

/** Site footer — every column, link and text is set in Admin → Header & Footer. */
export function Footer({ settings, config, logo }: { settings: Settings; config: FooterConfig; logo?: string }) {
  const title = config.title || settings.siteName;
  const subtitle = config.subtitle || settings.tagline;
  const columns = config.columns.filter((c) => c.enabled && c.links.some((l) => l.enabled));
  const blocks = config.infoBlocks
    .filter((b) => b.enabled)
    .map((b) => ({ ...b, text: b.text.replace(/\{office\}/g, settings.corporateOffice).replace(/\{factory\}/g, settings.factory) }))
    .filter((b) => b.title || b.text);
  const bottom = config.bottomLinks.filter((l) => l.enabled);

  return (
    <footer className="relative overflow-hidden bg-navy-deep text-white" style={config.background ? { background: config.background } : undefined}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-25"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,.55) 1px, transparent 1px)",
          backgroundSize: "9px 9px",
          maskImage: "linear-gradient(to top, black, transparent)",
        }}
      />
      <div
        className="relative mx-auto grid max-w-7xl gap-10 px-6 pt-14 pb-10 sm:grid-cols-2 lg:grid-cols-(--cols) lg:px-12"
        // brand column is wider; link columns and info blocks share the rest
        style={{ ["--cols" as string]: `1.6fr ${columns.map(() => "1fr").join(" ")} ${blocks.length ? "1.1fr" : ""}` }}
      >
        <div>
          <div className="flex items-center gap-4">
            {config.showLogo && (
              <span className="shrink-0 rounded-full bg-mist p-1 ring-2 ring-leaf/60">
                <Logo name={settings.siteName} variant="seal" size={88} src={logo} />
              </span>
            )}
            <div>
              <p className="font-display text-lg leading-tight font-semibold">{title}</p>
              {subtitle && <p className="mt-1 text-[11px] tracking-[0.18em] text-leaf uppercase">{subtitle}</p>}
            </div>
          </div>
          {config.about && <p className="mt-5 text-[12.5px] leading-relaxed text-white/65">{config.about}</p>}
          {config.showSocial && Object.values(settings.socials).some(Boolean) && (
            <>
              <p className="mt-6 mb-3 text-[13px] font-semibold tracking-wide uppercase">{config.socialTitle}</p>
              <SocialIcons socials={settings.socials} />
            </>
          )}
          {(config.showPhone || config.showEmail) && (
            <ul className="mt-8 space-y-3 text-[13px]">
              {config.showPhone && settings.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-3.5 text-white/60" />
                  <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-leaf">{settings.phone}</a>
                </li>
              )}
              {config.showEmail && settings.email && (
                <li className="flex items-center gap-2">
                  <Mail className="size-3.5 text-white/60" />
                  <a href={`mailto:${settings.email}`} className="hover:text-leaf">{settings.email}</a>
                </li>
              )}
            </ul>
          )}
        </div>
        {columns.map((col) => (
          <div key={col.id}>
            <h3 className="mb-4 text-[13px] font-semibold tracking-wide uppercase">{col.title}</h3>
            <ul className="space-y-2.5 text-[12.5px] text-white/60">
              {col.links.filter((l) => l.enabled).map((l) => (
                <li key={l.id}>
                  <MenuLink href={l.href} newTab={l.newTab} className="inline-flex items-center gap-1.5 transition hover:text-white">
                    <NavIcon name={l.icon} className="size-3.5" /> {l.label}
                    {l.badge && <span className="rounded-sm bg-leaf px-1 text-[9px] text-white">{l.badge}</span>}
                  </MenuLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {blocks.length > 0 && (
          <div>
            {blocks.map((b, i) => (
              <div key={b.id} className={i > 0 ? "mt-6" : ""}>
                {b.title && <h3 className="mb-3 text-[13px] font-semibold tracking-wide uppercase">{b.title}</h3>}
                <p className="text-[12.5px] leading-relaxed whitespace-pre-line text-white/60">{b.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="relative mx-auto flex max-w-7xl flex-col gap-3 px-6 pt-4 pb-6 text-[13px] text-white/80 sm:flex-row sm:items-center sm:justify-between lg:px-12">
        <p>{fillTokens(config.copyright, settings.siteName)}</p>
        {bottom.length > 0 && (
          <p className="flex flex-wrap items-center gap-3">
            {bottom.map((l, i) => (
              <span key={l.id} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden>—</span>}
                <MenuLink href={l.href} newTab={l.newTab} className="hover:text-white">{l.label}</MenuLink>
              </span>
            ))}
          </p>
        )}
      </div>
      {config.showBackToTop && <BackToTop />}
    </footer>
  );
}
