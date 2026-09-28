import { all } from "@/lib/db";
import { listCandidateStories } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import type { DiscoverySettings, StorySignal } from "@/lib/types";

type Signals = {
  categories: Map<string, number>;
  tags: Map<string, number>;
  authors: Map<string, number>;
  genres: Map<string, number>;
  ages: Map<string, number>;
  types: Map<string, number>;
  seen: Set<string>;
  related: Set<string>;
  strength: number;
};

function bump(map: Map<string, number>, key: string, amount: number) {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + amount);
}

function overlap(weights: Map<string, number>, ids: string[]) {
  let total = 0;
  for (const id of ids) total += weights.get(id) ?? 0;
  return Math.log2(1 + total);
}

function recency(publishAt: string, days: number) {
  if (!publishAt) return 0;
  const age = (Date.now() - new Date(publishAt).getTime()) / 86_400_000;
  if (!Number.isFinite(age)) return 0;
  if (age < 0) return 1;
  if (age > days) return 0;
  return 1 - age / days;
}

function popularity(story: StorySignal, settings: DiscoverySettings) {
  const raw =
    story.popularity * settings.manualPopularityWeight +
    story.viewCount * settings.viewWeight +
    story.favoriteCount * settings.favoriteWeight;
  return Math.log10(10 + Math.max(0, raw));
}

export function loadSignals(userId: string): Signals {
  const signals: Signals = {
    categories: new Map(),
    tags: new Map(),
    authors: new Map(),
    genres: new Map(),
    ages: new Map(),
    types: new Map(),
    seen: new Set(),
    related: new Set(),
    strength: 0,
  };
  const events = all<{ story_id: string; kind: string; author_id: string; genre: string; age_range: string; story_type: string }>(
    `SELECT e.story_id, e.kind, COALESCE(s.author_id, '') AS author_id, COALESCE(s.genre, '') AS genre,
      COALESCE(s.age_range, '') AS age_range, COALESCE(s.story_type, '') AS story_type
     FROM events e JOIN stories s ON s.id = e.story_id
     WHERE e.user_id = ? AND e.kind IN ('view', 'favorite')
     ORDER BY e.created_at DESC LIMIT 80`,
    userId,
  );
  if (events.length === 0) return signals;
  const ids = [...new Set(events.map((event) => event.story_id))];
  const marks = ids.map(() => "?").join(",");
  const categories = all<{ story_id: string; category_id: string }>(
    `SELECT story_id, category_id FROM story_categories WHERE story_id IN (${marks})`,
    ...ids,
  );
  const tags = all<{ story_id: string; tag_id: string }>(
    `SELECT story_id, tag_id FROM story_tags WHERE story_id IN (${marks})`,
    ...ids,
  );
  const related = all<{ related_id: string }>(
    `SELECT related_id FROM story_relations WHERE story_id IN (${marks})`,
    ...ids,
  );
  const categoryMap = new Map<string, string[]>();
  for (const row of categories) {
    const list = categoryMap.get(row.story_id) ?? [];
    list.push(row.category_id);
    categoryMap.set(row.story_id, list);
  }
  const tagMap = new Map<string, string[]>();
  for (const row of tags) {
    const list = tagMap.get(row.story_id) ?? [];
    list.push(row.tag_id);
    tagMap.set(row.story_id, list);
  }
  for (const event of events) {
    const weight = event.kind === "favorite" ? 3 : 1;
    signals.strength += weight;
    signals.seen.add(event.story_id);
    bump(signals.authors, event.author_id, weight);
    bump(signals.genres, event.genre, weight);
    bump(signals.ages, event.age_range, weight);
    bump(signals.types, event.story_type, weight);
    for (const categoryId of categoryMap.get(event.story_id) ?? []) bump(signals.categories, categoryId, weight);
    for (const tagId of tagMap.get(event.story_id) ?? []) bump(signals.tags, tagId, weight);
  }
  for (const row of related) signals.related.add(row.related_id);
  return signals;
}

export function scoreStories(stories: StorySignal[], signals: Signals | null, settings: DiscoverySettings) {
  const ranked = stories.map((story) => {
    let score = popularity(story, settings) * (signals && signals.strength > 0 ? 0.65 : 1.4);
    score += recency(story.publishAt, settings.recencyDays) * (signals && signals.strength > 0 ? 0.6 : 2);
    score += story.featured ? (signals && signals.strength > 0 ? 1.1 : 3.2) : 0;
    score += story.editorPick ? (signals && signals.strength > 0 ? 1.1 : 3.2) : 0;
    score += Math.max(0, 12 - story.displayOrder) * 0.08;
    if (signals && signals.strength > 0) {
      score += overlap(signals.categories, story.categoryIds) * settings.categoryWeight;
      score += overlap(signals.tags, story.tagIds) * settings.tagWeight;
      if (story.authorId && signals.authors.has(story.authorId)) score += settings.authorWeight;
      if (story.genre && signals.genres.has(story.genre)) score += settings.genreWeight;
      if (story.ageRange && signals.ages.has(story.ageRange)) score += 1;
      if (story.storyType && signals.types.has(story.storyType)) score += 1;
      if (signals.related.has(story.id)) score += 3;
      if (signals.seen.has(story.id)) score -= 2.4;
    }
    return { story, score };
  });
  ranked.sort((a, b) => b.score - a.score || b.story.publishAt.localeCompare(a.story.publishAt));
  return ranked.map((item) => item.story);
}

export function recommendStories(viewerId: string | null, limit: number, exclude: string[] = []) {
  const settings = getSettings().discovery;
  const signals = viewerId ? loadSignals(viewerId) : null;
  const categoryIds = signals ? [...signals.categories.keys()] : [];
  const ranked = scoreStories(listCandidateStories(categoryIds, exclude), signals && signals.strength > 0 ? signals : null, settings);
  const skip = new Set(exclude);
  return ranked.filter((story) => !skip.has(story.id)).slice(0, limit);
}

export function similarStories(story: StorySignal, limit: number) {
  const settings = getSettings().discovery;
  const signals: Signals = {
    categories: new Map(story.categoryIds.map((item) => [item, 4])),
    tags: new Map(story.tagIds.map((item) => [item, 3])),
    authors: new Map(),
    genres: new Map(story.genre ? [[story.genre, 2]] : []),
    ages: new Map(story.ageRange ? [[story.ageRange, 1]] : []),
    types: new Map(story.storyType ? [[story.storyType, 1]] : []),
    seen: new Set([story.id]),
    related: new Set(),
    strength: 8,
  };
  return scoreStories(listCandidateStories(story.categoryIds), signals, settings)
    .filter((item) => item.id !== story.id)
    .slice(0, limit);
}
