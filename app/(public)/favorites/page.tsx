import type { Metadata } from "next";
import { EmptyState } from "@/components/site/EmptyState";
import { StoryCard } from "@/components/site/StoryCard";
import { getCurrentUser, viewerId } from "@/lib/auth";
import { listFavorites } from "@/lib/content";

export const metadata: Metadata = { title: "المفضلة", robots: { index: false, follow: false } };

export default async function FavoritesPage() {
  const [user, id] = await Promise.all([getCurrentUser(), viewerId()]);
  const stories = id ? listFavorites(id) : [];
  const guest = !user || user.role === "guest";
  return (
    <main className="container page">
      <div className="page-head">
        <div>
          <h1>المفضلة</h1>
          <p>{guest ? "هذه القصص محفوظة على هذا المتصفح. حساب بسيط يبقيها معك على أي جهاز." : "القصص التي حفظتها."}</p>
        </div>
      </div>
      {stories.length === 0 ? (
        <EmptyState title="لم تحفظ أي قصة بعد." body="حين تعجبك قصة، احفظها من صفحتها." href="/explore" label="استكشف القصص" />
      ) : (
        <div className="layout-grid">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
      {guest ? (
        <p style={{ marginTop: 16 }}>
          <a className="btn btn-secondary" href="/account">
            أنشئ حسابًا خفيفًا
          </a>
        </p>
      ) : null}
    </main>
  );
}
