import { getDb } from "@/lib/db";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { MobileTabBar } from "@/components/site/MobileTabBar";
import { SiteToaster } from "@/components/site/SiteToaster";
import { InstallPrompt } from "@/components/site/InstallPrompt";
import { FloatingContact } from "@/components/site/FloatingContact";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const { settings, categories } = await getDb();
  const cats = categories
    .filter((c) => c.active)
    .sort((a, b) => a.order - b.order)
    .map(({ name, slug }) => ({ name, slug }));

  return (
    // bottom padding keeps content clear of the mobile tab bar
    <div className="flex min-h-screen flex-col pb-[calc(64px+env(safe-area-inset-bottom))] lg:px-8 lg:pb-0">
      <Header siteName={settings.siteName} categories={cats} phone={settings.phone} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <FloatingContact phone={settings.phone} />
      <MobileTabBar />
      <InstallPrompt siteName={settings.siteName} />
      <SiteToaster />
    </div>
  );
}
