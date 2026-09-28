import fs from "fs";
import path from "path";
import { all, one, run, transaction, uploadsDir } from "@/lib/db";
import { isIcon, isLayout, isSectionType, defaultLayout } from "@/lib/constants";
import { paletteId } from "@/lib/palette";
import type { StoryInput } from "@/lib/types";
import { clamp, id, normalizeArabic, nowIso, safeHttpUrl, safeInternalPath, slugify } from "@/lib/utils";

const CONFIG_KEYS = ["kicker", "heading", "lede", "placeholder", "buttonLabel", "buttonHref", "text", "href", "label", "imageId", "categoryId"];

export function logActivity(actorId: string | null, message: string) {
  run("INSERT INTO activity (id, actor_id, message, created_at) VALUES (?, ?, ?, ?)", id(), actorId, message, nowIso());
}

export function uniqueSlug(table: "stories" | "authors" | "categories", base: string, currentId = "") {
  let slug = base || "item";
  let n = 2;
  while (n < 200) {
    const row = one<{ id: string }>(`SELECT id FROM ${table} WHERE slug = ?`, slug);
    if (!row || row.id === currentId) return slug;
    slug = `${base}-${n++}`;
  }
  return `${base}-${id().slice(0, 6)}`;
}

function ensureTag(name: string) {
  const clean = name.trim().slice(0, 40);
  if (!clean) return "";
  const slug = slugify(clean);
  const existing = one<{ id: string }>("SELECT id FROM tags WHERE slug = ?", slug);
  if (existing) {
    run("UPDATE tags SET name = ?, name_norm = ? WHERE id = ?", clean, normalizeArabic(clean), existing.id);
    return existing.id;
  }
  const tagId = id();
  run("INSERT INTO tags (id, name, slug, name_norm) VALUES (?, ?, ?, ?)", tagId, clean, slug, normalizeArabic(clean));
  return tagId;
}

function exists(table: "authors" | "categories" | "stories" | "media", value: string) {
  if (!value) return false;
  return Boolean(one(`SELECT id FROM ${table} WHERE id = ?`, value));
}

export function saveStory(input: StoryInput, actorId: string) {
  const title = input.title.trim();
  if (title.length < 2) return { error: "اكتب عنوان القصة." };
  const storyId = input.id || id();
  const current = input.id ? one<{ id: string }>("SELECT id FROM stories WHERE id = ?", input.id) : null;
  if (input.id && !current) return { error: "القصة غير موجودة." };
  const slug = uniqueSlug("stories", slugify(input.slug || title), storyId);
  const authorId = exists("authors", input.authorId) ? input.authorId : "";
  const categoryIds = [...new Set(input.categoryIds.filter((item) => exists("categories", item)))];
  const primary = exists("categories", input.primaryCategoryId) ? input.primaryCategoryId : categoryIds[0] || "";
  if (primary && !categoryIds.includes(primary)) categoryIds.unshift(primary);
  const coverId = exists("media", input.coverId) ? input.coverId : "";
  const gallery = [...new Set(input.galleryIds.filter((item) => exists("media", item)))].slice(0, 8);
  const related = [...new Set(input.relatedIds.filter((item) => item !== storyId && exists("stories", item)))].slice(0, 8);
  const tags = [...new Set(input.tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 12);
  const stamp = nowIso();
  const publishAt = input.publishAt || (input.published ? stamp : "");

  transaction(() => {
    if (current) {
      run(
        `UPDATE stories SET title = ?, slug = ?, title_norm = ?, short_description = ?, short_norm = ?, full_description = ?,
          author_id = ?, cover_id = ?, primary_category_id = ?, age_range = ?, story_type = ?, genre = ?, genre_norm = ?,
          reading_minutes = ?, featured = ?, editor_pick = ?, published = ?, publish_at = ?, popularity = ?, admin_notes = ?,
          display_order = ?, narrator = ?, series_name = ?, episode_number = ?, external_source = ?, audio_url = ?, video_url = ?,
          is_demo = 0, updated_at = ? WHERE id = ?`,
        title,
        slug,
        normalizeArabic(title),
        input.shortDescription.trim(),
        normalizeArabic(input.shortDescription),
        input.fullDescription.trim(),
        authorId || null,
        coverId || null,
        primary || null,
        input.ageRange.trim(),
        input.storyType.trim(),
        input.genre.trim(),
        normalizeArabic(input.genre),
        input.readingMinutes,
        input.featured ? 1 : 0,
        input.editorPick ? 1 : 0,
        input.published ? 1 : 0,
        publishAt || null,
        clamp(input.popularity, 0, 1000, 0),
        input.adminNotes.trim(),
        clamp(input.displayOrder, 0, 999, 0),
        input.narrator.trim(),
        input.seriesName.trim(),
        input.episodeNumber.trim(),
        input.externalSource.trim(),
        safeHttpUrl(input.audioUrl),
        safeHttpUrl(input.videoUrl),
        stamp,
        storyId,
      );
    } else {
      run(
        `INSERT INTO stories (
          id, title, slug, title_norm, short_description, short_norm, full_description, author_id, cover_id, primary_category_id,
          age_range, story_type, genre, genre_norm, reading_minutes, featured, editor_pick, published, publish_at, popularity,
          view_count, favorite_count, admin_notes, display_order, narrator, series_name, episode_number, external_source,
          audio_url, video_url, is_demo, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        storyId,
        title,
        slug,
        normalizeArabic(title),
        input.shortDescription.trim(),
        normalizeArabic(input.shortDescription),
        input.fullDescription.trim(),
        authorId || null,
        coverId || null,
        primary || null,
        input.ageRange.trim(),
        input.storyType.trim(),
        input.genre.trim(),
        normalizeArabic(input.genre),
        input.readingMinutes,
        input.featured ? 1 : 0,
        input.editorPick ? 1 : 0,
        input.published ? 1 : 0,
        publishAt || null,
        clamp(input.popularity, 0, 1000, 0),
        input.adminNotes.trim(),
        clamp(input.displayOrder, 0, 999, 0),
        input.narrator.trim(),
        input.seriesName.trim(),
        input.episodeNumber.trim(),
        input.externalSource.trim(),
        safeHttpUrl(input.audioUrl),
        safeHttpUrl(input.videoUrl),
        stamp,
        stamp,
      );
    }
    run("DELETE FROM story_categories WHERE story_id = ?", storyId);
    for (const categoryId of categoryIds) {
      run("INSERT INTO story_categories (story_id, category_id) VALUES (?, ?)", storyId, categoryId);
    }
    run("DELETE FROM story_tags WHERE story_id = ?", storyId);
    for (const tag of tags) {
      const tagId = ensureTag(tag);
      if (tagId) run("INSERT OR IGNORE INTO story_tags (story_id, tag_id) VALUES (?, ?)", storyId, tagId);
    }
    run("DELETE FROM tags WHERE id NOT IN (SELECT tag_id FROM story_tags)");
    run("DELETE FROM story_relations WHERE story_id = ?", storyId);
    for (const relatedId of related) {
      run("INSERT INTO story_relations (story_id, related_id) VALUES (?, ?)", storyId, relatedId);
    }
    run("DELETE FROM story_gallery WHERE story_id = ?", storyId);
    gallery.forEach((mediaId, index) => {
      run("INSERT INTO story_gallery (id, story_id, media_id, sort_order) VALUES (?, ?, ?, ?)", id(), storyId, mediaId, index);
    });
  });
  logActivity(actorId, current ? `عُدّلت قصة «${title}».` : `أُضيفت قصة «${title}».`);
  return { id: storyId };
}

export function deleteStory(storyId: string, actorId: string) {
  const story = one<{ title: string }>("SELECT title FROM stories WHERE id = ?", storyId);
  if (!story) return { error: "القصة غير موجودة." };
  run("DELETE FROM stories WHERE id = ?", storyId);
  run("DELETE FROM tags WHERE id NOT IN (SELECT tag_id FROM story_tags)");
  logActivity(actorId, `حُذفت قصة «${story.title}».`);
  return { ok: true };
}

export function saveCategory(input: {
  id?: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  imageId: string;
  sortOrder: number;
  published: boolean;
  showOnHome: boolean;
  showInNav: boolean;
  featured: boolean;
}, actorId: string) {
  const name = input.name.trim();
  if (name.length < 2) return { error: "اكتب اسم التصنيف." };
  const categoryId = input.id || id();
  const current = input.id ? one("SELECT id FROM categories WHERE id = ?", input.id) : null;
  if (input.id && !current) return { error: "التصنيف غير موجود." };
  const slug = uniqueSlug("categories", slugify(input.slug || name), categoryId);
  const stamp = nowIso();
  const imageId = exists("media", input.imageId) ? input.imageId : null;
  const values = [
    name,
    slug,
    normalizeArabic(name),
    input.description.trim(),
    imageId,
    isIcon(input.icon) ? input.icon : "feather",
    paletteId(input.color),
    clamp(input.sortOrder, 0, 999, 0),
    input.published ? 1 : 0,
    input.showOnHome ? 1 : 0,
    input.showInNav ? 1 : 0,
    input.featured ? 1 : 0,
    stamp,
  ];
  if (current) {
    run(
      `UPDATE categories SET name = ?, slug = ?, name_norm = ?, description = ?, image_id = ?, icon = ?, color = ?,
        sort_order = ?, published = ?, show_on_home = ?, show_in_nav = ?, featured = ?, is_demo = 0, updated_at = ? WHERE id = ?`,
      ...values,
      categoryId,
    );
  } else {
    run(
      `INSERT INTO categories (
        id, name, slug, name_norm, description, image_id, icon, color, sort_order, published, show_on_home, show_in_nav, featured, is_demo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      categoryId,
      ...values,
      stamp,
    );
  }
  logActivity(actorId, current ? `عُدّل تصنيف «${name}».` : `أُضيف تصنيف «${name}».`);
  return { id: categoryId };
}

export function deleteCategory(categoryId: string, actorId: string) {
  const category = one<{ name: string }>("SELECT name FROM categories WHERE id = ?", categoryId);
  if (!category) return { error: "التصنيف غير موجود." };
  run("DELETE FROM categories WHERE id = ?", categoryId);
  logActivity(actorId, `حُذف تصنيف «${category.name}».`);
  return { ok: true };
}

export function moveCategory(categoryId: string, direction: "up" | "down") {
  const rows = all<{ id: string; sort_order: number }>("SELECT id, sort_order FROM categories ORDER BY sort_order ASC, name ASC");
  const index = rows.findIndex((row) => row.id === categoryId);
  const swap = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swap < 0 || swap >= rows.length) return;
  const current = rows[index];
  const other = rows[swap];
  run("UPDATE categories SET sort_order = ? WHERE id = ?", other.sort_order, current.id);
  run("UPDATE categories SET sort_order = ? WHERE id = ?", current.sort_order, other.id);
}

export function saveAuthor(input: {
  id?: string;
  name: string;
  slug: string;
  bio: string;
  imageId: string;
  featured: boolean;
}, actorId: string) {
  const name = input.name.trim();
  if (name.length < 2) return { error: "اكتب اسم المؤلف." };
  const authorId = input.id || id();
  const current = input.id ? one("SELECT id FROM authors WHERE id = ?", input.id) : null;
  if (input.id && !current) return { error: "المؤلف غير موجود." };
  const slug = uniqueSlug("authors", slugify(input.slug || name), authorId);
  const stamp = nowIso();
  const imageId = exists("media", input.imageId) ? input.imageId : null;
  if (current) {
    run(
      `UPDATE authors SET name = ?, slug = ?, name_norm = ?, bio = ?, image_id = ?, featured = ?, is_demo = 0, updated_at = ? WHERE id = ?`,
      name,
      slug,
      normalizeArabic(name),
      input.bio.trim(),
      imageId,
      input.featured ? 1 : 0,
      stamp,
      authorId,
    );
  } else {
    run(
      `INSERT INTO authors (id, name, slug, name_norm, bio, image_id, featured, is_demo, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      authorId,
      name,
      slug,
      normalizeArabic(name),
      input.bio.trim(),
      imageId,
      input.featured ? 1 : 0,
      stamp,
      stamp,
    );
  }
  logActivity(actorId, current ? `عُدّل المؤلف «${name}».` : `أُضيف المؤلف «${name}».`);
  return { id: authorId };
}

export function deleteAuthor(authorId: string, actorId: string) {
  const author = one<{ name: string }>("SELECT name FROM authors WHERE id = ?", authorId);
  if (!author) return { error: "المؤلف غير موجود." };
  run("DELETE FROM authors WHERE id = ?", authorId);
  logActivity(actorId, `حُذف المؤلف «${author.name}».`);
  return { ok: true };
}

export function createSection(type: string, actorId: string) {
  if (!isSectionType(type)) return { error: "هذا النوع غير متاح." };
  const order = Number(one<{ c: number }>("SELECT COALESCE(MAX(sort_order), 0) AS c FROM homepage_sections")?.c ?? 0) + 1;
  const sectionId = id();
  const titles: Record<string, string> = {
    hero: "اكتشف قصتك القادمة",
    search: "ابحث عن قصة",
    categories: "استكشف التصنيفات",
    recommended: "مقترحة لك",
    popular: "الأكثر رواجًا",
    recent: "وصل حديثًا",
    picks: "اختيارات يراع",
    featured: "قصص مميزة",
    featured_story: "قصة هذا الأسبوع",
    story_grid: "قصص نحبها",
    story_carousel: "تابع القراءة",
    banner: "لمحة",
    announcement: "ملاحظة",
    authors: "أصوات تروي",
    collection: "مجموعة",
  };
  run(
    `INSERT INTO homepage_sections (id, type, title, subtitle, enabled, sort_order, mode, item_count, layout, config, starts_at, ends_at)
     VALUES (?, ?, ?, '', 1, ?, 'auto', 8, ?, '{}', NULL, NULL)`,
    sectionId,
    type,
    titles[type] ?? "قسم",
    order,
    defaultLayout(type),
  );
  logActivity(actorId, `أُضيف قسم «${titles[type] ?? "قسم"}» إلى الصفحة الرئيسية.`);
  return { id: sectionId };
}

export function updateSection(input: {
  id: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  mode: string;
  itemCount: number;
  layout: string;
  startsAt: string;
  endsAt: string;
  config: Record<string, string>;
  itemIds: string[];
}, actorId: string) {
  const section = one<{ id: string; type: string }>("SELECT id, type FROM homepage_sections WHERE id = ?", input.id);
  if (!section) return { error: "القسم غير موجود." };
  const config: Record<string, string> = {};
  for (const key of CONFIG_KEYS) {
    const value = (input.config[key] ?? "").trim();
    if (!value) continue;
    if (key === "buttonHref") config[key] = safeInternalPath(value, "/explore");
    else if (key === "href") config[key] = value.startsWith("/") ? safeInternalPath(value, "") : safeHttpUrl(value);
    else if (key === "imageId") config[key] = exists("media", value) ? value : "";
    else if (key === "categoryId") config[key] = exists("categories", value) ? value : "";
    else config[key] = value.slice(0, 400);
  }
  const itemType = section.type === "categories" ? "category" : section.type === "authors" ? "author" : "story";
  const table = itemType === "category" ? "categories" : itemType === "author" ? "authors" : "stories";
  const itemIds = input.itemIds.filter((item, index, list) => exists(table, item) && list.indexOf(item) === index).slice(0, 12);
  const mode = input.mode === "manual" ? "manual" : "auto";
  transaction(() => {
    run(
      `UPDATE homepage_sections SET title = ?, subtitle = ?, enabled = ?, mode = ?, item_count = ?, layout = ?, config = ?, starts_at = ?, ends_at = ? WHERE id = ?`,
      input.title.trim() || "قسم",
      input.subtitle.trim(),
      input.enabled ? 1 : 0,
      mode,
      clamp(input.itemCount, 1, 12, 8),
      isLayout(input.layout) ? input.layout : defaultLayout(section.type),
      JSON.stringify(config),
      input.startsAt || null,
      input.endsAt || null,
      input.id,
    );
    run("DELETE FROM section_items WHERE section_id = ?", input.id);
    itemIds.forEach((itemId, index) => {
      run(
        "INSERT INTO section_items (id, section_id, item_type, item_id, sort_order, pinned) VALUES (?, ?, ?, ?, ?, ?)",
        id(),
        input.id,
        itemType,
        itemId,
        index,
        mode === "auto" ? 1 : 0,
      );
    });
  });
  logActivity(actorId, `عُدّل قسم «${input.title.trim() || "قسم"}» في الصفحة الرئيسية.`);
  return { ok: true };
}

export function deleteSection(sectionId: string, actorId: string) {
  const section = one<{ title: string }>("SELECT title FROM homepage_sections WHERE id = ?", sectionId);
  if (!section) return { error: "القسم غير موجود." };
  run("DELETE FROM homepage_sections WHERE id = ?", sectionId);
  logActivity(actorId, `أُزيل قسم «${section.title}» من الصفحة الرئيسية.`);
  return { ok: true };
}

export function moveSection(sectionId: string, direction: "up" | "down") {
  const rows = all<{ id: string; sort_order: number }>("SELECT id, sort_order FROM homepage_sections ORDER BY sort_order ASC");
  const index = rows.findIndex((row) => row.id === sectionId);
  const swap = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swap < 0 || swap >= rows.length) return;
  run("UPDATE homepage_sections SET sort_order = ? WHERE id = ?", rows[swap].sort_order, rows[index].id);
  run("UPDATE homepage_sections SET sort_order = ? WHERE id = ?", rows[index].sort_order, rows[swap].id);
}

export function reorderSections(ids: string[]) {
  ids.forEach((sectionId, index) => {
    run("UPDATE homepage_sections SET sort_order = ? WHERE id = ?", index + 1, sectionId);
  });
}

export function toggleSection(sectionId: string, enabled: boolean) {
  run("UPDATE homepage_sections SET enabled = ? WHERE id = ?", enabled ? 1 : 0, sectionId);
}

export function toggleFavorite(userId: string, storyId: string) {
  const story = one("SELECT id FROM stories WHERE id = ? AND published = 1", storyId);
  if (!story) return false;
  const existing = one("SELECT 1 AS x FROM favorites WHERE user_id = ? AND story_id = ?", userId, storyId);
  transaction(() => {
    if (existing) {
      run("DELETE FROM favorites WHERE user_id = ? AND story_id = ?", userId, storyId);
      run("UPDATE stories SET favorite_count = MAX(favorite_count - 1, 0) WHERE id = ?", storyId);
    } else {
      run("INSERT INTO favorites (user_id, story_id, created_at) VALUES (?, ?, ?)", userId, storyId, nowIso());
      run("UPDATE stories SET favorite_count = favorite_count + 1 WHERE id = ?", storyId);
      run("INSERT INTO events (id, user_id, story_id, kind, created_at) VALUES (?, ?, ?, 'favorite', ?)", id(), userId, storyId, nowIso());
    }
  });
  return !existing;
}

export function recordStoryView(userId: string, storyId: string) {
  const story = one("SELECT id FROM stories WHERE id = ? AND published = 1", storyId);
  if (!story) return;
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const recent = one(
    "SELECT id FROM events WHERE user_id = ? AND story_id = ? AND kind = 'view' AND created_at > ?",
    userId,
    storyId,
    since,
  );
  if (recent) return;
  transaction(() => {
    run("UPDATE stories SET view_count = view_count + 1 WHERE id = ?", storyId);
    run("INSERT INTO events (id, user_id, story_id, kind, created_at) VALUES (?, ?, ?, 'view', ?)", id(), userId, storyId, nowIso());
  });
}

export function mediaInUse(mediaId: string) {
  const checks = [
    one("SELECT id FROM stories WHERE cover_id = ?", mediaId),
    one("SELECT id FROM authors WHERE image_id = ?", mediaId),
    one("SELECT id FROM categories WHERE image_id = ?", mediaId),
    one("SELECT id FROM story_gallery WHERE media_id = ?", mediaId),
    one("SELECT key FROM settings WHERE value = ?", mediaId),
    one("SELECT id FROM homepage_sections WHERE config LIKE ?", `%${mediaId}%`),
  ];
  return checks.some(Boolean);
}

export function removeMedia(mediaId: string, actorId: string) {
  const media = one<{ filename: string }>("SELECT filename FROM media WHERE id = ?", mediaId);
  if (!media) return { error: "الملف غير موجود." };
  if (mediaInUse(mediaId)) return { error: "هذه الصورة مستخدمة. استبدلها أولًا ثم احذفها." };
  run("DELETE FROM media WHERE id = ?", mediaId);
  const file = path.join(uploadsDir(), media.filename);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  logActivity(actorId, "حُذف ملف من مكتبة الوسائط.");
  return { ok: true };
}

export function deleteDemoContent(actorId: string) {
  const files = all<{ filename: string }>("SELECT filename FROM media WHERE is_demo = 1");
  transaction(() => {
    run("DELETE FROM stories WHERE is_demo = 1");
    run("DELETE FROM authors WHERE is_demo = 1");
    run("DELETE FROM categories WHERE is_demo = 1");
    run("DELETE FROM media WHERE is_demo = 1");
    run("DELETE FROM tags WHERE id NOT IN (SELECT tag_id FROM story_tags)");
  });
  for (const file of files) {
    const target = path.join(uploadsDir(), file.filename);
    if (fs.existsSync(target)) fs.unlinkSync(target);
  }
  logActivity(actorId, "حُذف المحتوى التجريبي الذي لم يُعدَّل.");
}
