import type { StoryCard as Story } from "@/lib/types";
import { Icon } from "@/components/icons";

export function StoryCard({ story }: { story: Story }) {
  return (
    <article className="story-card">
      <a className="story-link" href={`/stories/${story.slug}`}>
        <div className="cover" style={{ background: story.categoryColor || "#EEDCEE" }}>
          {story.coverUrl ? (
            <img src={story.coverUrl} alt="" width={800} height={1100} loading="lazy" decoding="async" />
          ) : (
            <Icon name="feather" />
          )}
        </div>
        <div className="story-copy">
          {story.categoryName ? <p className="eyebrow">{story.categoryName}</p> : null}
          <h3>{story.title}</h3>
          {story.authorName ? <p className="byline">{story.authorName}</p> : null}
          {story.shortDescription ? <p className="excerpt">{story.shortDescription}</p> : null}
        </div>
      </a>
    </article>
  );
}
