import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FavoriteButton } from "@/components/site/FavoriteButton";
import { Paragraphs } from "@/components/site/Paragraphs";
import { StoryCard } from "@/components/site/StoryCard";
import { ViewTracker } from "@/components/site/ViewTracker";
import { viewerId } from "@/lib/auth";
import { getStoryBySlug, isFavorite, listStoriesByAuthor, relatedStories, signalBundle } from "@/lib/content";
import { similarStories } from "@/lib/recommend";
import { formatDate, readingLabel, safeHttpUrl } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = getStoryBySlug(slug);
  if (!story) return { title: "قصة" };
  return {
    title: story.title,
    description: story.shortDescription,
    openGraph: { images: story.coverUrl ? [story.coverUrl] : undefined },
  };
}

function ExternalMedia({ url, kind }: { url: string; kind: "audio" | "video" }) {
  const safe = safeHttpUrl(url);
  if (!safe) return null;
  const path = new URL(safe).pathname.toLowerCase();
  if (kind === "audio" && /\.(mp3|m4a|ogg|wav)$/.test(path)) return <audio controls preload="none" src={safe} />;
  if (kind === "video" && /\.(mp4|webm)$/.test(path)) return <video controls preload="none" src={safe} style={{ width: "100%", borderRadius: 12 }} />;
  return (
    <a href={safe} rel="noopener noreferrer" target="_blank">
      {kind === "audio" ? "الاستماع" : "المشاهدة"}
    </a>
  );
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = getStoryBySlug(slug);
  if (!story) notFound();
  const userId = await viewerId();
  const saved = isFavorite(userId, story.id);
  const related = relatedStories(story.id);
  const signal = signalBundle(story.id);
  const similar = signal ? similarStories(signal, 4).filter((item) => !related.some((relatedStory) => relatedStory.id === item.id)) : [];
  const more = story.authorId ? listStoriesByAuthor(story.authorId, story.id) : [];
  const facts = [
    story.categoryName ? ["التصنيف", story.categoryName, story.categorySlug ? `/categories/${story.categorySlug}` : ""] : null,
    story.ageRange ? ["العمر", story.ageRange, ""] : null,
    story.readingMinutes ? ["القراءة", readingLabel(story.readingMinutes), ""] : null,
    story.storyType ? ["النوع", story.storyType, ""] : null,
    story.genre ? ["الصنف", story.genre, ""] : null,
    story.publishAt ? ["النشر", formatDate(story.publishAt), ""] : null,
    story.narrator ? ["الراوي", story.narrator, ""] : null,
  ].filter((item): item is [string, string, string] => Boolean(item));

  return (
    <main className="container page">
      <ViewTracker storyId={story.id} />
      <nav className="crumbs" aria-label="مسار التنقل">
        <ol>
          <li><a href="/">الرئيسية</a></li>
          <li><a href="/explore">استكشف</a></li>
          <li aria-current="page">{story.title}</li>
        </ol>
      </nav>
      <article className="story-layout">
        {story.coverUrl ? <img className="story-cover" src={story.coverUrl} alt={`غلاف ${story.title}`} /> : <div className="story-cover" />}
        <div>
          {story.categoryName ? (
            <p className="eyebrow">
              <a href={`/categories/${story.categorySlug}`}>{story.categoryName}</a>
            </p>
          ) : null}
          <h1>{story.title}</h1>
          {story.authorName ? (
            <p className="byline">
              <a href={`/authors/${story.authorSlug}`}>{story.authorName}</a>
            </p>
          ) : null}
          {story.seriesName ? (
            <p className="help">
              من سلسلة «{story.seriesName}»
              {story.episodeNumber ? ` — الجزء ${story.episodeNumber}` : ""}
            </p>
          ) : null}
          {story.shortDescription ? <p className="lede">{story.shortDescription}</p> : null}
          <div className="actions">
            <FavoriteButton storyId={story.id} initial={saved} />
            <a className="btn btn-secondary" href="/favorites">
              المفضلة
            </a>
          </div>
          {facts.length > 0 ? (
            <dl className="facts">
              {facts.map(([label, value, href]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{href ? <a href={href}>{value}</a> : value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {story.tags.length > 0 ? (
            <p className="tags">
              {story.tags.map((tag, index) => (
                <span key={tag.slug}>
                  {index > 0 ? "، " : ""}
                  <a href={`/explore?tag=${tag.slug}`}>{tag.name}</a>
                </span>
              ))}
            </p>
          ) : null}
          <Paragraphs text={story.fullDescription} />
          {story.externalSource ? <p className="help">المصدر: {story.externalSource}</p> : null}
          <ExternalMedia url={story.audioUrl} kind="audio" />
          <ExternalMedia url={story.videoUrl} kind="video" />
          {story.gallery.length > 0 ? (
            <div className="gallery">
              {story.gallery.map((image) => (
                <img key={image.id} src={image.url} alt={image.alt} loading="lazy" />
              ))}
            </div>
          ) : null}
        </div>
      </article>
      {related.length > 0 ? (
        <section className="section">
          <h2>قصص قريبة</h2>
          <div className="layout-grid">{related.map((item) => <StoryCard key={item.id} story={item} />)}</div>
        </section>
      ) : null}
      {more.length > 0 ? (
        <section className="section">
          <h2>من {story.authorName}</h2>
          <div className="layout-grid">{more.map((item) => <StoryCard key={item.id} story={item} />)}</div>
        </section>
      ) : null}
      {similar.length > 0 ? (
        <section className="section">
          <h2>قد تعجبك أيضًا</h2>
          <div className="layout-grid">{similar.map((item) => <StoryCard key={item.id} story={item} />)}</div>
        </section>
      ) : null}
    </main>
  );
}
