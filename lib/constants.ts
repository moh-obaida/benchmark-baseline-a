export const SECTION_TYPES = [
  { id: "hero", label: "ترحيب" },
  { id: "search", label: "بحث" },
  { id: "categories", label: "تصنيفات" },
  { id: "recommended", label: "مقترحة لك" },
  { id: "popular", label: "الأكثر رواجًا" },
  { id: "recent", label: "وصل حديثًا" },
  { id: "picks", label: "اختيارات يراع" },
  { id: "featured", label: "قصص مميزة" },
  { id: "featured_story", label: "قصة بارزة" },
  { id: "story_grid", label: "شبكة قصص" },
  { id: "story_carousel", label: "شريط قصص" },
  { id: "banner", label: "لافتة" },
  { id: "announcement", label: "تنبيه" },
  { id: "authors", label: "مؤلفون" },
  { id: "collection", label: "مجموعة" },
] as const;

export const LAYOUTS = [
  { id: "grid", label: "شبكة" },
  { id: "carousel", label: "شريط أفقي" },
  { id: "editorial", label: "افتتاحية" },
  { id: "compact", label: "قائمة هادئة" },
] as const;

export const CATEGORY_ICONS = [
  { id: "feather", label: "ريشة" },
  { id: "moon", label: "قمر" },
  { id: "book", label: "كتاب" },
  { id: "compass", label: "بوصلة" },
  { id: "home", label: "بيت" },
  { id: "star", label: "نجمة" },
  { id: "lamp", label: "مصباح" },
  { id: "spark", label: "وميض" },
  { id: "path", label: "درب" },
  { id: "tree", label: "شجرة" },
] as const;

export const STORY_LAYOUT_TYPES = new Set([
  "recommended",
  "popular",
  "recent",
  "picks",
  "featured",
  "story_grid",
  "story_carousel",
  "collection",
]);

export const CATEGORY_LAYOUT_TYPES = new Set(["categories"]);
export const AUTHOR_LAYOUT_TYPES = new Set(["authors"]);

export function sectionTypeLabel(type: string) {
  return SECTION_TYPES.find((item) => item.id === type)?.label ?? "قسم";
}

export function isSectionType(type: string) {
  return SECTION_TYPES.some((item) => item.id === type);
}

export function isLayout(layout: string) {
  return LAYOUTS.some((item) => item.id === layout);
}

export function isIcon(icon: string) {
  return CATEGORY_ICONS.some((item) => item.id === icon);
}

export function defaultLayout(type: string) {
  if (type === "story_carousel") return "carousel";
  if (type === "recent" || type === "popular") return "carousel";
  if (type === "featured_story" || type === "hero") return "editorial";
  if (type === "categories" || type === "authors") return "grid";
  return "grid";
}

export function defaultTitle(type: string) {
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
  return titles[type] ?? "قسم";
}
