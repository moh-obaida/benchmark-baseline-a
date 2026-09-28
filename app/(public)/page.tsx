import { HomeSection } from "@/components/site/HomeSection";
import { EmptyState } from "@/components/site/EmptyState";
import { viewerId } from "@/lib/auth";
import { resolveHomepage } from "@/lib/home";

export default async function HomePage() {
  const sections = resolveHomepage(await viewerId());
  return (
    <main className="container page">
      {sections.length === 0 ? (
        <EmptyState title="لا توجد أقسام ظاهرة الآن." body="يمكنك تصفح القصص من صفحة الاستكشاف." href="/explore" label="استكشف" />
      ) : (
        sections.map((section) => <HomeSection key={section.id} section={section} />)
      )}
    </main>
  );
}
