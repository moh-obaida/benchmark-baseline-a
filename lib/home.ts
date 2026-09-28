import { all } from "@/lib/db";
import {
  authorsByIds,
  categoriesByIds,
  listAutoStories,
  listAuthors,
  listCategories,
  storiesByIds,
  storiesInCategory,
} from "@/lib/content";
import { recommendStories } from "@/lib/recommend";
import type { HomeSection, ResolvedSection, StoryCard } from "@/lib/types";
import { flag, num, parseConfig, str, withinSchedule } from "@/lib/utils";

const STORY_TYPES = new Set([
  "recommended",
  "popular",
  "recent",
  "picks",
  "featured",
  "featured_story",
  "story_grid",
  "story_carousel",
  "collection",
  "hero",
]);

export function listHomeSections() {
  const sections = all<Record<string, unknown>>(
    `SELECT id, type, title, subtitle, enabled, sort_order AS sortOrder, mode, item_count AS itemCount,
      layout, config, COALESCE(starts_at, '') AS startsAt, COALESCE(ends_at, '') AS endsAt
     FROM homepage_sections ORDER BY sort_order ASC, title ASC`,
  );
  const items = all<Record<string, unknown>>(
    `SELECT id, section_id AS sectionId, item_type AS itemType, item_id AS itemId, sort_order AS sortOrder, pinned
     FROM section_items ORDER BY sort_order ASC`,
  );
  return sections.map((row) => {
    const sectionId = str(row, "id");
    const section: HomeSection = {
      id: sectionId,
      type: str(row, "type"),
      title: str(row, "title"),
      subtitle: str(row, "subtitle"),
      enabled: flag(row, "enabled"),
      sortOrder: num(row, "sortOrder"),
      mode: str(row, "mode") === "manual" ? "manual" : "auto",
      itemCount: num(row, "itemCount") || 8,
      layout: str(row, "layout") || "grid",
      config: parseConfig(str(row, "config")),
      startsAt: str(row, "startsAt"),
      endsAt: str(row, "endsAt"),
      items: items
        .filter((item) => str(item, "sectionId") === sectionId)
        .map((item) => ({
          id: str(item, "id"),
          itemType: str(item, "itemType"),
          itemId: str(item, "itemId"),
          sortOrder: num(item, "sortOrder"),
          pinned: flag(item, "pinned"),
        })),
    };
    return section;
  });
}

function selectedIds(section: HomeSection, type: string) {
  return section.items
    .filter((item) => item.itemType === type)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => item.itemId);
}

function autoStories(section: HomeSection, viewerId: string | null, limit: number) {
  if (section.type === "recommended") return recommendStories(viewerId, limit);
  if (section.type === "popular") return listAutoStories("popular", limit);
  if (section.type === "picks") return listAutoStories("picks", limit);
  if (section.type === "featured" || section.type === "featured_story") return listAutoStories("featured", limit);
  if (section.type === "hero") {
    const featured = listAutoStories("featured", limit);
    return featured.length > 0 ? featured : listAutoStories("recent", limit);
  }
  if (section.type === "collection" && section.config.categoryId) {
    return storiesInCategory(section.config.categoryId, limit);
  }
  return listAutoStories("recent", limit);
}

function resolveStories(section: HomeSection, viewerId: string | null) {
  const chosen = storiesByIds(selectedIds(section, "story")).slice(0, section.itemCount);
  if (section.mode === "manual") return chosen;
  const rest = autoStories(section, viewerId, section.itemCount + chosen.length).filter(
    (story) => !chosen.some((item) => item.id === story.id),
  );
  return [...chosen, ...rest].slice(0, section.itemCount);
}

function moreHref(section: HomeSection) {
  if (section.type === "popular") return "/explore?sort=popular";
  if (section.type === "recent" || section.type === "story_grid" || section.type === "story_carousel") return "/explore?sort=new";
  if (section.type === "picks") return "/explore?sort=picks";
  if (section.type === "featured" || section.type === "featured_story") return "/explore?sort=featured";
  if (section.type === "categories") return "/categories";
  if (section.type === "collection" && section.config.categoryId) return "/explore";
  return "/explore";
}

function visible(section: ResolvedSection) {
  if (section.type === "hero" || section.type === "search") return true;
  if (section.type === "announcement") return Boolean(section.config.text);
  if (section.type === "banner") return Boolean(section.config.title || section.config.imageId);
  if (section.type === "categories") return section.categories.length > 0;
  if (section.type === "authors") return section.authors.length > 0;
  if (STORY_TYPES.has(section.type)) return section.stories.length > 0;
  return false;
}

export function resolveHomepage(viewerId: string | null) {
  const used = new Set<string>();
  const resolved: ResolvedSection[] = [];
  for (const section of listHomeSections()) {
    if (!section.enabled || !withinSchedule(section.startsAt, section.endsAt)) continue;
    const block: ResolvedSection = {
      id: section.id,
      type: section.type,
      title: section.config.heading || section.title,
      subtitle: section.config.lede || section.subtitle,
      layout: section.layout,
      config: section.config,
      stories: [],
      categories: [],
      authors: [],
      moreHref: moreHref(section),
    };
    if (section.type === "collection" && section.config.categoryId) {
      const category = categoriesByIds([section.config.categoryId])[0];
      if (category) block.moreHref = `/categories/${category.slug}`;
    }
    if (section.type === "categories") {
      block.categories =
        section.mode === "manual"
          ? categoriesByIds(selectedIds(section, "category")).slice(0, section.itemCount)
          : listCategories("home").slice(0, section.itemCount);
    } else if (section.type === "authors") {
      block.authors =
        section.mode === "manual"
          ? authorsByIds(selectedIds(section, "author")).slice(0, section.itemCount)
          : listAuthors(false).filter((author) => author.featured).slice(0, section.itemCount);
      if (section.mode === "auto" && block.authors.length === 0) {
        block.authors = listAuthors(false).slice(0, section.itemCount);
      }
    } else if (STORY_TYPES.has(section.type)) {
      let stories = resolveStories(section, viewerId);
      if (section.mode === "auto" && section.type !== "hero") {
        const fresh = stories.filter((story) => !used.has(story.id));
        if (fresh.length >= Math.min(3, section.itemCount)) stories = fresh.slice(0, section.itemCount);
      }
      block.stories = stories;
    }
    if (!visible(block)) continue;
    if (section.type !== "hero") block.stories.forEach((story: StoryCard) => used.add(story.id));
    resolved.push(block);
  }
  return resolved;
}
