import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getCurrentUser } from "@/lib/auth";
import { listCategories } from "@/lib/content";
import { getSettings } from "@/lib/settings";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, user] = await Promise.all([
    Promise.resolve(getSettings()),
    Promise.resolve(listCategories("nav")),
    getCurrentUser(),
  ]);
  return (
    <>
      <a className="skip" href="#content">
        تخطٍ إلى المحتوى
      </a>
      <Header
        siteName={settings.siteName}
        logoUrl={settings.logoUrl}
        categories={categories}
        accountLabel={user && user.role === "reader" ? user.name : "حسابي"}
      />
      <div id="content">{children}</div>
      <Footer settings={settings} categories={categories} />
    </>
  );
}
