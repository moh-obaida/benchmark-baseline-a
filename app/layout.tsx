import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import { getSettings } from "@/lib/settings";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: { default: settings.seoTitle, template: `%s — ${settings.siteName}` },
    description: settings.seoDescription,
    applicationName: settings.siteName,
    openGraph: {
      title: settings.seoTitle,
      description: settings.seoDescription,
      locale: "ar",
      type: "website",
      images: settings.socialImageUrl ? [settings.socialImageUrl] : undefined,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = getSettings();
  return (
    <html lang="ar" dir="rtl" className={tajawal.className} data-density={settings.density}>
      <body>{children}</body>
    </html>
  );
}
