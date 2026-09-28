import { all, one } from "@/lib/db";
import { paletteHex } from "@/lib/palette";
import { getSettings } from "@/lib/settings";
import type {
  Author,
  CatalogQuery,
  Category,
  MediaItem,
  StoryAdmin,
  StoryCard,
  StoryDetail,
  StorySignal,
} from "@/lib/types";
import { flag, likeTerm, mediaUrl, nowIso, num, numOrNull, str } from "@/lib/utils";

const CARD_SELECT = `
  s.id, s.title, s.slug,
  s.short_description AS shortDescription,
  s.age_range AS ageRange,
  s.story_type AS storyType,
  s.genre,
  s.reading_minutes AS readingMinutes,
  s.featured, s.editor_pick AS editorPick,
  s.publish_at AS publishAt,
  s.view_count AS viewCount,
  s.favorite_count AS favoriteCount,
  s.popularity, s.display_order AS displayOrder,
  COALESCE(a.name, '') AS authorName,
  COALESCE(a.slug, '') AS authorSlug,
  COALESCE(a.id, '') AS authorId,
  COALESCE(c.name, '') AS categoryName,
  COALESCE(c.slug, '') AS categorySlug,
  COALESCE(c.color, 'lavender') AS categoryColor,
  COALESCE(m.id, '') AS coverId,
  COALESCE(m.alt, '') AS coverAlt
`;

const CARD_FROM = `
  FROM stories s
  LEFT JOIN authors a ON a.id = s.author_id
  LEFT JOIN categories c ON c.id = s.primary_category_id
  LEFT JOIN media m ON m.id = s.cover_id
`;

function mapCard(row: Record<string, unknown>): StoryCard {
  const coverId = str(row, "coverId");
  return {
    id: str(row, "id"),
    title: str(row, "title"),
    slug: str(row, "slug"),
    shortDescription: str(row, "shortDescription"),
    authorName: str(row, "authorName"),
    authorSlug: str(row, "authorSlug"),
    authorId: str(row, "authorId"),
    coverUrl: mediaUrl(coverId),
    coverAlt: str(row, "coverAlt") || str(row, "title"),
    categoryName: str(row, "categoryName"),
    categorySlug: str(row, "categorySlug"),
    categoryColor: paletteHex(str(row, "categoryColor")),
    readingMinutes: numOrNull(row, "readingMinutes"),
    ageRange: str(row, "ageRange"),
    genre: str(row, "genre"),
    storyType: str(row, "storyType"),
    featured: flag(row, "featured"),
    editorPick: flag(row, "editorPick"),
    publishAt: str(row, "publishAt"),
    viewCount: num(row, "viewCount"),
    favoriteCount: num(row, "favoriteCount"),
    popularity: num(row, "popularity"),
    displayOrder: num(row, "displayOrder"),
  };
}

export function publishedClause(alias = "s") {
  return `${alias}.published = 1 AND (${alias}.publish_at IS NULL OR ${alias}.publish_at <= ?)`;
}

export function mapCategory(row: Record<string, unknown>): Category {
  const imageId = str(row, "imageId");
  return {
    id: str(row, "id"),
    name: str(row, "name"),
    slug: str(row, "slug"),
    description: str(row, "description"),
    color: paletteHex(str(row, "color")),
    icon: str(row, "icon") || "feather",
    imageUrl: mediaUrl(imageId),
    imageAlt: str(row, "imageAlt") || str(row, "name"),
    imageId,
    sortOrder: num(row, "sortOrder"),
    published: flag(row, "published"),
    showOnHome: flag(row, "showOnHome"),
    showInNav: flag(row, "showInNav"),
    featured: flag(row, "featured"),
    isDemo: flag(row, "isDemo"),
  };
}

const CATEGORY_SELECT = `
  id, name, slug, description, color, icon,
  COALESCE(image_id, '') AS imageId,
  sort_order AS sortOrder,
  published, show_on_home AS showOnHome, show_in_nav AS showInNav,
  featured, is_demo AS isDemo
`;

export function listCategories(scope: "all" | "public" | "home" | "nav" = "public") {
  const where =
    scope === "all"
      ? "1 = 1"
      : scope === "home"
        ? "published = 1 AND show_on_home = 1"
        : scope === "nav"
          ? "published = 1 AND show_in_nav = 1"
          : "published = 1";
  return all<Record<string, unknown>>(
    `SELECT ${CATEGORY_SELECT} FROM categories WHERE ${where} ORDER BY featured DESC, sort_order ASC, name ASC`,
  ).map(mapCategory);
}

export function getCategoryBySlug(slug: string) {
  const row = one<Record<string, unknown>>(
    `SELECT ${CATEGORY_SELECT},
      (SELECT alt FROM media WHERE media.id = categories.image_id) AS imageAlt
     FROM categories WHERE slug = ? AND published = 1`,
    slug,
  );
  return row ? mapCategory(row) : null;
}

export function getCategoryAdmin(id: string) {
  const row = one<Record<string, unknown>>(`SELECT ${CATEGORY_SELECT} FROM categories WHERE id = ?`, id);
  return row ? mapCategory(row) : null;
}

export function mapAuthor(row: Record<string, unknown>): Author {
  const imageId = str(row, "imageId");
  return {
    id: str(row, "id"),
    name: str(row, "name"),
    slug: str(row, "slug"),
    bio: str(row, "bio"),
    imageUrl: mediaUrl(imageId),
    imageAlt: str(row, "imageAlt") || str(row, "name"),
    imageId,
    featured: flag(row, "featured"),
    isDemo: flag(row, "isDemo"),
    storyCount: num(row, "storyCount"),
  };
}

const AUTHOR_SELECT = `
  a.id, a.name, a.slug, a.bio,
  COALESCE(a.image_id, '') AS imageId,
  a.featured, a.is_demo AS isDemo,
  (SELECT COUNT(*) FROM stories s WHERE s.author_id = a.id AND s.published = 1 AND (s.publish_at IS NULL OR s.publish_at <= ?)) AS storyCount
`;

export function listAuthors(admin = false) {
  const stamp = nowIso();
  if (admin) {
    return all<Record<string, unknown>>(
      `SELECT a.id, a.name, a.slug, a.bio, COALESCE(a.image_id, '') AS imageId, a.featured, a.is_demo AS isDemo,
        (SELECT COUNT(*) FROM stories s WHERE s.author_id = a.id) AS storyCount
       FROM authors a ORDER BY a.featured DESC, a.name ASC`,
    ).map(mapAuthor);
  }
  return all<Record<string, unknown>>(
    `SELECT ${AUTHOR_SELECT} FROM authors a
     WHERE EXISTS (
       SELECT 1 FROM stories s WHERE s.author_id = a.id AND ${publishedClause("s")}
     )
     ORDER BY a.featured DESC, a.name ASC`,
    stamp,
    stamp,
  ).map(mapAuthor);
}

export function getAuthorBySlug(slug: string) {
  const stamp = nowIso();
  const row = one<Record<string, unknown>>(
    `SELECT ${AUTHOR_SELECT} FROM authors a WHERE a.slug = ?`,
    stamp,
    slug,
  );
  return row ? mapAuthor(row) : null;
}

export function getAuthorAdmin(id: string) {
  const row = one<Record<string, unknown>>(
    `SELECT a.id, a.name, a.slug, a.bio, COALESCE(a.image_id, '') AS imageId, a.featured, a.is_demo AS isDemo,
      (SELECT COUNT(*) FROM stories s WHERE s.author_id = a.id) AS storyCount
     FROM authors a WHERE a.id = ?`,
    id,
  );
  return row ? mapAuthor(row) : null;
}

export function listStoriesByAuthor(authorId: string, exceptId = "") {
  const stamp = nowIso();
  return all<Record<string, unknown>>(
    `SELECT ${CARD_SELECT} ${CARD_FROM}
     WHERE ${publishedClause("s")} AND s.author_id = ? AND s.id != ?
     ORDER BY COALESCE(s.publish_at, s.created_at) DESC LIMIT 8`,
    stamp,
    authorId,
    exceptId,
  ).map(mapCard);
}

function attachSignals(cards: StoryCard[]): StorySignal[] {
  if (cards.length === 0) return [];
  const ids = cards.map((card) => card.id);
  const marks = ids.map(() => "?").join(",");
  const categories = all<{ story_id: string; category_id: string }>(
    `SELECT story_id, category_id FROM story_categories WHERE story_id IN (${marks})`,
    ...ids,
  );
  const tags = all<{ story_id: string; tag_id: string }>(
    `SELECT story_id, tag_id FROM story_tags WHERE story_id IN (${marks})`,
    ...ids,
  );
  return cards.map((card) => ({
    ...card,
    categoryIds: categories.filter((item) => item.story_id === card.id).map((item) => item.category_id),
    tagIds: tags.filter((item) => item.story_id === card.id).map((item) => item.tag_id),
  }));
}

export function listCandidateStories(categoryIds: string[] = [], extraIds: string[] = []) {
  const stamp = nowIso();
  const params: Array<string | number> = [stamp];
  let where = publishedClause("s");
  if (categoryIds.length > 0) {
    const marks = categoryIds.map(() => "?").join(",");
    where = `(${where}) AND (
      s.primary_category_id IN (${marks})
      OR s.id IN (SELECT story_id FROM story_categories WHERE category_id IN (${marks}))
      OR s.featured = 1 OR s.editor_pick = 1
    )`;
    params.push(...categoryIds, ...categoryIds);
  }
  const rows = all<Record<string, unknown>>(
    `SELECT ${CARD_SELECT} ${CARD_FROM}
     WHERE ${where}
     ORDER BY (s.popularity + s.view_count + s.favorite_count * 3) DESC, COALESCE(s.publish_at, s.created_at) DESC
     LIMIT 160`,
    ...params,
  ).map(mapCard);
  const missing = extraIds.filter((item) => !rows.some((row) => row.id === item));
  if (missing.length) {
    const marks = missing.map(() => "?").join(",");
    const extra = all<Record<string, unknown>>(
      `SELECT ${CARD_SELECT} ${CARD_FROM} WHERE ${publishedClause("s")} AND s.id IN (${marks})`,
      stamp,
      ...missing,
    ).map(mapCard);
    rows.push(...extra);
  }
  return attachSignals(rows);
}

export function listAutoStories(kind: "popular" | "recent" | "picks" | "featured" | "all", limit: number) {
  const stamp = nowIso();
  const settings = getSettings().discovery;
  let order = "COALESCE(s.publish_at, s.created_at) DESC";
  let extra = "1 = 1";
  const params: Array<string | number> = [stamp];
  if (kind === "popular") {
    order = `(s.popularity * ? + s.view_count * ? + s.favorite_count * ?) DESC, COALESCE(s.publish_at, s.created_at) DESC`;
    params.push(settings.manualPopularityWeight, settings.viewWeight, settings.favoriteWeight);
  } else if (kind === "picks") {
    extra = "s.editor_pick = 1";
    order = "s.display_order ASC, COALESCE(s.publish_at, s.created_at) DESC";
  } else if (kind === "featured") {
    extra = "s.featured = 1";
    order = "s.display_order ASC, COALESCE(s.publish_at, s.created_at) DESC";
  }
  params.push(limit);
  return all<Record<string, unknown>>(
    `SELECT ${CARD_SELECT} ${CARD_FROM} WHERE ${publishedClause("s")} AND ${extra} ORDER BY ${order} LIMIT ?`,
    ...params,
  ).map(mapCard);
}

export function storiesInCategory(categoryId: string, limit: number) {
  const stamp = nowIso();
  return all<Record<string, unknown>>(
    `SELECT ${CARD_SELECT} ${CARD_FROM}
     WHERE ${publishedClause("s")} AND s.id IN (SELECT story_id FROM story_categories WHERE category_id = ?)
     ORDER BY COALESCE(s.publish_at, s.created_at) DESC LIMIT ?`,
    stamp,
    categoryId,
    limit,
  ).map(mapCard);
}

export function storiesByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const stamp = nowIso();
  const marks = ids.map(() => "?").join(",");
  const rows = all<Record<string, unknown>>(
    `SELECT ${CARD_SELECT} ${CARD_FROM} WHERE ${publishedClause("s")} AND s.id IN (${marks})`,
    stamp,
    ...ids,
  ).map(mapCard);
  const order = new Map(ids.map((item, index) => [item, index]));
  return rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export function categoriesByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const marks = ids.map(() => "?").join(",");
  const rows = all<Record<string, unknown>>(
    `SELECT ${CATEGORY_SELECT} FROM categories WHERE published = 1 AND id IN (${marks})`,
    ...ids,
  ).map(mapCategory);
  const order = new Map(ids.map((item, index) => [item, index]));
  return rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export function authorsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const stamp = nowIso();
  const marks = ids.map(() => "?").join(",");
  const rows = all<Record<string, unknown>>(
    `SELECT ${AUTHOR_SELECT} FROM authors a WHERE a.id IN (${marks})`,
    stamp,
    ...ids,
  ).map(mapAuthor);
  const order = new Map(ids.map((item, index) => [item, index]));
  return rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export function getStoryBySlug(slug: string) {
  const stamp = nowIso();
  const row = one<Record<string, unknown>>(
    `SELECT ${CARD_SELECT}, s.full_description AS fullDescription, s.narrator, s.series_name AS seriesName,
      s.episode_number AS episodeNumber, s.external_source AS externalSource, s.audio_url AS audioUrl, s.video_url AS videoUrl
     ${CARD_FROM} WHERE s.slug = ? AND ${publishedClause("s")}`,
    slug,
    stamp,
  );
  if (!row) return null;
  const storyId = str(row, "id");
  const detail: StoryDetail = {
    ...mapCard(row),
    fullDescription: str(row, "fullDescription"),
    narrator: str(row, "narrator"),
    seriesName: str(row, "seriesName"),
    episodeNumber: str(row, "episodeNumber"),
    externalSource: str(row, "externalSource"),
    audioUrl: str(row, "audioUrl"),
    videoUrl: str(row, "videoUrl"),
    tags: all<{ name: string; slug: string }>(
      `SELECT t.name, t.slug FROM tags t JOIN story_tags st ON st.tag_id = t.id WHERE st.story_id = ? ORDER BY t.name`,
      storyId,
    ),
    categories: all<Record<string, unknown>>(
      `SELECT c.id, c.name, c.slug, c.color FROM categories c
       JOIN story_categories sc ON sc.category_id = c.id
       WHERE sc.story_id = ? AND c.published = 1 ORDER BY c.sort_order`,
      storyId,
    ).map((item) => ({
      id: str(item, "id"),
      name: str(item, "name"),
      slug: str(item, "slug"),
      color: paletteHex(str(item, "color")),
    })),
    gallery: all<{ id: string; alt: string }>(
      `SELECT m.id, m.alt FROM story_gallery g JOIN media m ON m.id = g.media_id
       WHERE g.story_id = ? ORDER BY g.sort_order`,
      storyId,
    ).map((item) => ({ id: item.id, url: mediaUrl(item.id), alt: item.alt || str(row, "title") })),
  };
  return detail;
}

export function relatedStories(storyId: string) {
  const stamp = nowIso();
  return all<Record<string, unknown>>(
    `SELECT ${CARD_SELECT} ${CARD_FROM}
     JOIN story_relations r ON r.related_id = s.id
     WHERE r.story_id = ? AND ${publishedClause("s")}
     ORDER BY r.rowid ASC LIMIT 8`,
    storyId,
    stamp,
  ).map(mapCard);
}

export function filterOptions() {
  const stamp = nowIso();
  const genres = all<{ genre: string }>(
    `SELECT DISTINCT genre FROM stories s WHERE ${publishedClause("s")} AND genre != '' ORDER BY genre`,
    stamp,
  ).map((row) => row.genre);
  const ages = all<{ age_range: string }>(
    `SELECT DISTINCT age_range FROM stories s WHERE ${publishedClause("s")} AND age_range != '' ORDER BY age_range`,
    stamp,
  ).map((row) => row.age_range);
  const types = all<{ story_type: string }>(
    `SELECT DISTINCT story_type FROM stories s WHERE ${publishedClause("s")} AND story_type != '' ORDER BY story_type`,
    stamp,
  ).map((row) => row.story_type);
  return {
    categories: listCategories("public"),
    authors: listAuthors(false),
    genres,
    ages,
    types,
  };
}

export function searchCatalog(query: CatalogQuery) {
  const settings = getSettings();
  const pageSize = settings.pageSize;
  const page = Math.max(1, query.page || 1);
  const stamp = nowIso();
  const where = [publishedClause("s")];
  const params: Array<string | number> = [stamp];

  if (query.category) {
    where.push(`s.id IN (
      SELECT sc.story_id FROM story_categories sc JOIN categories c ON c.id = sc.category_id WHERE c.slug = ?
    )`);
    params.push(query.category);
  }
  if (query.author) {
    where.push("a.slug = ?");
    params.push(query.author);
  }
  if (query.genre) {
    where.push("s.genre = ?");
    params.push(query.genre);
  }
  if (query.age) {
    where.push("s.age_range = ?");
    params.push(query.age);
  }
  if (query.type) {
    where.push("s.story_type = ?");
    params.push(query.type);
  }
  if (query.tag) {
    where.push(`s.id IN (SELECT st.story_id FROM story_tags st JOIN tags t ON t.id = st.tag_id WHERE t.slug = ?)`);
    params.push(query.tag);
  }
  if (query.q && query.q.trim()) {
    const term = likeTerm(query.q);
    where.push(`(
      s.title_norm LIKE ? OR s.short_norm LIKE ? OR s.genre_norm LIKE ?
      OR a.name_norm LIKE ?
      OR EXISTS (
        SELECT 1 FROM story_categories sc JOIN categories c ON c.id = sc.category_id
        WHERE sc.story_id = s.id AND c.name_norm LIKE ?
      )
      OR EXISTS (
        SELECT 1 FROM story_tags st JOIN tags t ON t.id = st.tag_id
        WHERE st.story_id = s.id AND t.name_norm LIKE ?
      )
    )`);
    params.push(term, term, term, term, term, term);
  }

  const discovery = settings.discovery;
  let order = "COALESCE(s.publish_at, s.created_at) DESC";
  const orderParams: Array<string | number> = [];
  if (query.sort === "popular") {
    order = `(s.popularity * ? + s.view_count * ? + s.favorite_count * ?) DESC, COALESCE(s.publish_at, s.created_at) DESC`;
    orderParams.push(discovery.manualPopularityWeight, discovery.viewWeight, discovery.favoriteWeight);
  } else if (query.sort === "views") {
    order = "s.view_count DESC, COALESCE(s.publish_at, s.created_at) DESC";
  } else if (query.sort === "picks") {
    order = "s.editor_pick DESC, s.featured DESC, s.display_order ASC, COALESCE(s.publish_at, s.created_at) DESC";
  } else if (query.sort === "featured") {
    order = "s.featured DESC, s.display_order ASC, COALESCE(s.publish_at, s.created_at) DESC";
  }

  const whereSql = where.join(" AND ");
  const totalRow = one<{ c: number }>(
    `SELECT COUNT(*) AS c ${CARD_FROM} WHERE ${whereSql}`,
    ...params,
  );
  const total = Number(totalRow?.c ?? 0);
  const items = all<Record<string, unknown>>(
    `SELECT ${CARD_SELECT} ${CARD_FROM} WHERE ${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`,
    ...params,
    ...orderParams,
    pageSize,
    (page - 1) * pageSize,
  ).map(mapCard);

  return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function suggestStories(q: string) {
  const term = likeTerm(q);
  const stamp = nowIso();
  return all<Record<string, unknown>>(
    `SELECT ${CARD_SELECT} ${CARD_FROM}
     WHERE ${publishedClause("s")} AND (s.title_norm LIKE ? OR a.name_norm LIKE ?)
     ORDER BY s.view_count DESC LIMIT 6`,
    stamp,
    term,
    term,
  ).map(mapCard);
}

export function favoriteIds(userId: string | null) {
  if (!userId) return new Set<string>();
  const rows = all<{ story_id: string }>("SELECT story_id FROM favorites WHERE user_id = ?", userId);
  return new Set(rows.map((row) => row.story_id));
}

export function listFavorites(userId: string) {
  const stamp = nowIso();
  return all<Record<string, unknown>>(
    `SELECT ${CARD_SELECT} ${CARD_FROM}
     JOIN favorites f ON f.story_id = s.id
     WHERE f.user_id = ? AND ${publishedClause("s")}
     ORDER BY f.created_at DESC`,
    userId,
    stamp,
  ).map(mapCard);
}

export function isFavorite(userId: string | null, storyId: string) {
  if (!userId) return false;
  return Boolean(one("SELECT 1 AS x FROM favorites WHERE user_id = ? AND story_id = ?", userId, storyId));
}

export function listAdminStories(q = "", status = "all") {
  const where = ["1 = 1"];
  const params: string[] = [];
  if (status === "published") where.push("s.published = 1");
  if (status === "draft") where.push("s.published = 0");
  if (status === "featured") where.push("s.featured = 1");
  if (q.trim()) {
    where.push("(s.title_norm LIKE ? OR a.name_norm LIKE ?)");
    const term = likeTerm(q);
    params.push(term, term);
  }
  return all<Record<string, unknown>>(
    `SELECT s.id, s.title, s.slug, s.published, s.featured, s.editor_pick AS editorPick,
      s.view_count AS viewCount, s.favorite_count AS favoriteCount, s.is_demo AS isDemo,
      COALESCE(a.name, '') AS authorName, COALESCE(c.name, '') AS categoryName
     FROM stories s
     LEFT JOIN authors a ON a.id = s.author_id
     LEFT JOIN categories c ON c.id = s.primary_category_id
     WHERE ${where.join(" AND ")}
     ORDER BY s.updated_at DESC`,
    ...params,
  ).map((row) => ({
    id: str(row, "id"),
    title: str(row, "title"),
    slug: str(row, "slug"),
    published: flag(row, "published"),
    featured: flag(row, "featured"),
    editorPick: flag(row, "editorPick"),
    viewCount: num(row, "viewCount"),
    favoriteCount: num(row, "favoriteCount"),
    isDemo: flag(row, "isDemo"),
    authorName: str(row, "authorName"),
    categoryName: str(row, "categoryName"),
  }));
}

export function getStoryAdmin(id: string): StoryAdmin | null {
  const row = one<Record<string, unknown>>(
    `SELECT ${CARD_SELECT}, s.full_description AS fullDescription, s.narrator, s.series_name AS seriesName,
      s.episode_number AS episodeNumber, s.external_source AS externalSource, s.audio_url AS audioUrl,
      s.video_url AS videoUrl, s.published, s.admin_notes AS adminNotes,
      COALESCE(s.primary_category_id, '') AS primaryCategoryId, COALESCE(s.cover_id, '') AS coverId,
      s.is_demo AS isDemo
     ${CARD_FROM} WHERE s.id = ?`,
    id,
  );
  if (!row) return null;
  const tags = all<{ name: string }>("SELECT t.name FROM tags t JOIN story_tags st ON st.tag_id = t.id WHERE st.story_id = ? ORDER BY t.name", id);
  return {
    ...mapCard(row),
    fullDescription: str(row, "fullDescription"),
    narrator: str(row, "narrator"),
    seriesName: str(row, "seriesName"),
    episodeNumber: str(row, "episodeNumber"),
    externalSource: str(row, "externalSource"),
    audioUrl: str(row, "audioUrl"),
    videoUrl: str(row, "videoUrl"),
    tags: tags.map((tag) => ({ name: tag.name, slug: tag.name })),
    categories: [],
    gallery: [],
    published: flag(row, "published"),
    adminNotes: str(row, "adminNotes"),
    primaryCategoryId: str(row, "primaryCategoryId"),
    coverId: str(row, "coverId"),
    relatedIds: all<{ related_id: string }>("SELECT related_id FROM story_relations WHERE story_id = ? ORDER BY rowid", id).map((item) => item.related_id),
    categoryIds: all<{ category_id: string }>("SELECT category_id FROM story_categories WHERE story_id = ?", id).map((item) => item.category_id),
    galleryIds: all<{ media_id: string }>("SELECT media_id FROM story_gallery WHERE story_id = ? ORDER BY sort_order", id).map((item) => item.media_id),
    tagText: tags.map((tag) => tag.name).join("، "),
    isDemo: flag(row, "isDemo"),
  };
}

export function listMedia() {
  return all<Record<string, unknown>>(
    `SELECT id, filename, original_name AS originalName, mime, size, width, height, alt, created_at AS createdAt
     FROM media ORDER BY created_at DESC LIMIT 80`,
  ).map((row) => ({
    id: str(row, "id"),
    url: mediaUrl(str(row, "id")),
    alt: str(row, "alt"),
    mime: str(row, "mime"),
    width: num(row, "width"),
    height: num(row, "height"),
    size: num(row, "size"),
    originalName: str(row, "originalName"),
    createdAt: str(row, "createdAt"),
  })) satisfies MediaItem[];
}

export function getMedia(id: string) {
  return one<{
    id: string;
    filename: string;
    mime: string;
    alt: string;
    width: number;
    height: number;
  }>("SELECT id, filename, mime, alt, width, height FROM media WHERE id = ?", id);
}

export function dashboardStats() {
  const count = (sql: string) => Number(one<{ c: number }>(sql)?.c ?? 0);
  const sum = (sql: string) => Number(one<{ c: number }>(sql)?.c ?? 0);
  return {
    stories: count("SELECT COUNT(*) AS c FROM stories"),
    published: count("SELECT COUNT(*) AS c FROM stories WHERE published = 1"),
    drafts: count("SELECT COUNT(*) AS c FROM stories WHERE published = 0"),
    categories: count("SELECT COUNT(*) AS c FROM categories"),
    authors: count("SELECT COUNT(*) AS c FROM authors"),
    views: sum("SELECT COALESCE(SUM(view_count), 0) AS c FROM stories"),
    favorites: sum("SELECT COALESCE(SUM(favorite_count), 0) AS c FROM stories"),
    featured: count("SELECT COUNT(*) AS c FROM stories WHERE featured = 1"),
    demo: count("SELECT COUNT(*) AS c FROM stories WHERE is_demo = 1"),
    activity: all<{ id: string; message: string; created_at: string }>(
      "SELECT id, message, created_at FROM activity ORDER BY created_at DESC LIMIT 8",
    ),
  };
}

export function listPickerStories() {
  return all<{ id: string; title: string; published: number; authorName: string }>(
    `SELECT s.id, s.title, s.published, COALESCE(a.name, '') AS authorName
     FROM stories s LEFT JOIN authors a ON a.id = s.author_id
     ORDER BY s.title ASC`,
  ).map((row) => ({
    id: row.id,
    label: `${row.title}${row.authorName ? ` — ${row.authorName}` : ""}${Number(row.published) === 1 ? "" : " — مسودة"}`,
  }));
}

export function signalBundle(storyId: string) {
  const stamp = nowIso();
  const row = one<Record<string, unknown>>(
    `SELECT ${CARD_SELECT} ${CARD_FROM} WHERE s.id = ? AND ${publishedClause("s")}`,
    storyId,
    stamp,
  );
  if (!row) return null;
  return attachSignals([mapCard(row)])[0];
}
