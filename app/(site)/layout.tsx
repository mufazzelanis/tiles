import { Suspense } from "react";
import { getDb } from "@/lib/db";
import { getPublicPixel } from "@/lib/tracking";
import { getSiteLayout } from "@/lib/queries";
import { MetaPixel } from "@/components/site/MetaPixel";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { MobileTabBar } from "@/components/site/MobileTabBar";
import { SiteToaster } from "@/components/site/SiteToaster";
import { InstallPrompt } from "@/components/site/InstallPrompt";
import { FloatingContact } from "@/components/site/FloatingContact";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [{ settings, categories }, pixel, layout] = await Promise.all([getDb(), getPublicPixel(), getSiteLayout()]);
  const cats = categories
    .filter((c) => c.active)
    .sort((a, b) => a.order - b.order)
    .map(({ name, slug }) => ({ name, slug }));

  return (
    // bottom padding keeps content clear of the mobile tab bar
    <div className="flex min-h-screen flex-col pb-[calc(64px+env(safe-area-inset-bottom))] lg:px-8 lg:pb-0">
      <Header siteName={settings.siteName} categories={cats} phone={settings.phone} config={layout.header} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} config={layout.footer} logo={layout.header.logoSeal} />
      {layout.floating.whatsapp && (
        <FloatingContact phone={layout.floating.whatsappNumber || settings.phone} message={layout.floating.whatsappMessage} label={layout.floating.whatsappLabel} />
      )}
      <MobileTabBar />
      <InstallPrompt siteName={settings.siteName} />
      <SiteToaster />
      <Suspense>
        <MetaPixel pixelId={pixel?.pixelId ?? null} />
      </Suspense>
      {pixel && (
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element -- Meta's no-JS fallback beacon */}
          <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${encodeURIComponent(pixel.pixelId)}&ev=PageView&noscript=1`} />
        </noscript>
      )}
    </div>
  );
}
