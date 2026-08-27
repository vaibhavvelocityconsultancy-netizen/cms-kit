import "@/src/lib/fetch-patch"; // must be first import — patches fetch before anything else runs
import type { Metadata } from "next";
import { ThemeProvider } from "@/src/components/theme-provider";
import { Toaster as AppToaster } from "@/src/ui/toaster";
import "../../styles/globals.css";
import QueryProvider from "../provider/QueryProvider";
import { fetchers } from "@/src/lib/fetchers";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const result = await fetchers.publicSettings();
    const settings = result?.data;
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : undefined) ||
      "https://ipdav.com/newweb";
    const faviconUrl = settings?.favicon
      ? `${settings.favicon}?v=${settings.updatedAt}`
      : undefined;
    return {
      title: settings?.siteTagline
        ? `${settings.siteName} – ${settings.siteTagline}`
        : settings?.siteName || "My Website",
      description: settings?.siteTagline || "Modern CMS Website",
      icons: faviconUrl ? { icon: faviconUrl, apple: faviconUrl } : undefined,
    };
  } catch {
    return {
      title: "My Website",
      description: "Modern CMS Website",
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <QueryProvider>
          {children}
          <AppToaster />
        </QueryProvider>
      </body>
    </html>
  );
}
