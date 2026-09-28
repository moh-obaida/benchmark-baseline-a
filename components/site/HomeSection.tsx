import { Icon } from "@/components/icons";
import { SearchBox } from "@/components/site/SearchBox";
import { StoryCard } from "@/components/site/StoryCard";
import type { ResolvedSection } from "@/lib/types";
import { safeHttpUrl, safeInternalPath } from "@/lib/utils";

function StoryList({ section }: { section: ResolvedSection }) {
  const layout = ["grid", "carousel", "editorial", "compact"].includes(section.layout) ? section.layout : "grid";
  return (
    <div className={`layout-${layout}`}>
      {section.stories.map((story) => (
        <StoryCard key={story.id} story={story} />
      ))}
    </div>
  );
}

export function HomeSection({ section }: { section: ResolvedSection }) {
  if (section.type === "announcement") {
    const href = section.config.href?.startsWith("/")
      ? safeInternalPath(section.config.href, "")
      : safeHttpUrl(section.config.href || "");
    return (
      <div className="announce">
        {href ? <a href={href}>{section.config.text}</a> : <span>{section.config.text}</span>}
      </div>
    );
  }

  if (section.type === "hero") {
    return (
      <section className="hero">
        <div className="hero-copy">
          {section.config.kicker ? (
            <p className="kicker">
              <Icon name="feather" size={18} />
              {section.config.kicker}
            </p>
          ) : null}
          <h1>{section.title}</h1>
          {section.subtitle ? <p className="lede">{section.subtitle}</p> : null}
          <SearchBox placeholder={section.config.placeholder || "ابحث عن قصة أو مؤلف أو تصنيف"} />
          {section.config.buttonLabel ? (
            <p style={{ marginTop: 12 }}>
              <a className="text-link" href={safeInternalPath(section.config.buttonHref || "/explore")}>
                {section.config.buttonLabel}
              </a>
            </p>
          ) : null}
        </div>
        {section.stories.length > 0 ? (
          <div className="hero-stage">
            {section.stories.slice(0, 3).map((story) => (
              <a className="hero-cover" key={story.id} href={`/stories/${story.slug}`}>
                {story.coverUrl ? <img src={story.coverUrl} alt="" /> : <div className="cover" />}
                <span>{story.title}</span>
              </a>
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  if (section.type === "search") {
    return (
      <section className="section">
        <div className="section-head">
          <div>
            <h2>{section.title}</h2>
            {section.subtitle ? <p>{section.subtitle}</p> : null}
          </div>
        </div>
        <SearchBox placeholder={section.config.placeholder || "ابحث عن قصة"} />
      </section>
    );
  }

  if (section.type === "banner") {
    const href = section.config.href?.startsWith("/")
      ? safeInternalPath(section.config.href, "")
      : safeHttpUrl(section.config.href || "");
    const image = section.config.imageId ? `/media/${section.config.imageId}` : "";
    const inner = (
      <>
        {image ? <img src={image} alt="" style={{ width: "100%", borderRadius: 12, maxHeight: 280, objectFit: "cover" }} /> : null}
        <h2>{section.config.heading || section.title}</h2>
        {section.config.text ? <p>{section.config.text}</p> : null}
        {section.config.label ? <span className="text-link">{section.config.label}</span> : null}
      </>
    );
    return href ? (
      <a className="banner" href={href}>
        {inner}
      </a>
    ) : (
      <section className="banner">{inner}</section>
    );
  }

  if (section.type === "featured_story" && section.stories[0]) {
    const story = section.stories[0];
    return (
      <section className="section">
        <div className="section-head">
          <div>
            <h2>{section.title}</h2>
            {section.subtitle ? <p>{section.subtitle}</p> : null}
          </div>
        </div>
        <a className="feature-panel" href={`/stories/${story.slug}`}>
          <div className="cover" style={{ background: story.categoryColor }}>
            {story.coverUrl ? <img src={story.coverUrl} alt="" /> : null}
          </div>
          <div>
            {story.categoryName ? <p className="eyebrow">{story.categoryName}</p> : null}
            <h3 style={{ fontSize: "1.8rem" }}>{story.title}</h3>
            {story.authorName ? <p className="byline">{story.authorName}</p> : null}
            <p>{story.shortDescription}</p>
          </div>
        </a>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h2>{section.title}</h2>
          {section.subtitle ? <p>{section.subtitle}</p> : null}
        </div>
        {section.type !== "authors" ? <a href={section.moreHref}>عرض الكل</a> : null}
      </div>
      {section.type === "categories" ? (
        <div className="cat-grid">
          {section.categories.map((category) => (
            <a key={category.id} className="cat-tile" href={`/categories/${category.slug}`} style={{ background: category.color }}>
              <span className="icon-badge">
                <Icon name={category.icon} />
              </span>
              <h3>{category.name}</h3>
              {category.description ? <p className="excerpt">{category.description}</p> : null}
            </a>
          ))}
        </div>
      ) : null}
      {section.type === "authors" ? (
        <div className="author-grid">
          {section.authors.map((author) => (
            <a key={author.id} className="author-card" href={`/authors/${author.slug}`}>
              <div className="avatar">
                {author.imageUrl ? <img src={author.imageUrl} alt="" /> : null}
              </div>
              <div>
                <h3>{author.name}</h3>
                {author.bio ? <p className="excerpt">{author.bio}</p> : null}
              </div>
            </a>
          ))}
        </div>
      ) : null}
      {section.stories.length > 0 && section.type !== "categories" && section.type !== "authors" ? <StoryList section={section} /> : null}
    </section>
  );
}
