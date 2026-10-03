import type { Metadata, Viewport } from "next";
import { Montserrat, Poppins } from "next/font/google";
import { getDb } from "@/lib/db";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#1d1213",
  viewportFit: "cover", // lets the mobile tab bar respect the iPhone home indicator
};

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getDb();
  return {
    title: { default: `${settings.siteName} — Premium Tiles`, template: `%s | ${settings.siteName}` },
    description: settings.seoDescription,
    applicationName: settings.siteName,
    appleWebApp: { capable: true, title: "UDH", statusBarStyle: "black-translucent" },
    formatDetection: { telephone: false },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${montserrat.variable} ${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>{children}</body>
    </html>
  );
}
