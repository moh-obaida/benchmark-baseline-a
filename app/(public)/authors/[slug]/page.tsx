import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Paragraphs } from "@/components/site/Paragraphs";
import { StoryCard } from "@/components/site/StoryCard";
import { EmptyState } from "@/components/site/EmptyState";
import { getAuthorBySlug, listStoriesByAuthor } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  return { title: author?.name || "مؤلف", description: author?.bio };
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) notFound();
  const stories = listStoriesByAuthor(author.id);
  return (
    <main className="container page">
      <nav className="crumbs" aria-label="مسار التنقل">
        <ol>
          <li><a href="/">الرئيسية</a></li>
          <li aria-current="page">{author.name}</li>
        </ol>
      </nav>
      <header className="author-card" style={{ marginBottom: 22 }}>
        <div className="avatar">{author.imageUrl ? <img src={author.imageUrl} alt="" /> : null}</div>
        <div>
          <h1>{author.name}</h1>
          <Paragraphs text={author.bio} />
        </div>
      </header>
      {stories.length === 0 ? (
        <EmptyState title="لا توجد قصص منشورة لهذا المؤلف الآن." />
      ) : (
        <div className="layout-grid">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </main>
  );
}
